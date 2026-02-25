import "dotenv/config";
import { Kafka } from "kafkajs";
import { saveTicket, updateTicketKpi, findSimilarTicket, incrementTicketOccurrences, type LabelizedTicket, TicketLabel } from "@kippu/shared";

const kafka = new Kafka({
    clientId: "labelized-ticket-consumer",
    brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "labelized-ticket-consumer-group" });
const producer = kafka.producer();

const TOPIC_IN = "labelized-ticket";
const TOPIC_DLQ = "labelized-ticket-dlq";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL_TICKET;
console.log("Discord webhook URL:", DISCORD_WEBHOOK_URL);

const LABEL_COLORS: Record<TicketLabel, number> = {
    [TicketLabel.P0]: 0xff0000,
    [TicketLabel.P1]: 0xff8c00,
    [TicketLabel.P2]: 0xffd700,
    [TicketLabel.P3]: 0x00c853,
};

async function sendToDlq(
    value: string,
    error: string,
    topic: string,
    partition: number,
    offset: string,
) {
    await producer.send({
        topic: TOPIC_DLQ,
        messages: [{ value, headers: { error } }],
    });
    await consumer.commitOffsets([
        { topic, partition, offset: (Number(offset) + 1).toString() },
    ]);
}

async function sendToDiscord(ticket: LabelizedTicket) {
    const fields = [
        { name: "ID", value: ticket.id, inline: true },
        { name: "Channel", value: ticket.channel, inline: true },
        { name: "Label", value: ticket.label, inline: true },
        { name: "Contact", value: ticket.contact, inline: true },
        { name: "Feedback", value: ticket.feedbackType, inline: true },
        { name: "Date", value: ticket.timestamp, inline: true },
    ];

    if (ticket.subject) {
        fields.push({ name: "Sujet", value: ticket.subject, inline: false });
    }

    fields.push({
        name: "Contenu",
        value: ticket.content.substring(0, 1024),
        inline: false,
    });

    const res = await fetch(DISCORD_WEBHOOK_URL as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            embeds: [
                {
                    title: `[${ticket.label.toUpperCase()}] ${ticket.feedbackType}`,
                    color: LABEL_COLORS[ticket.label] ?? 0x808080,
                    fields,
                    timestamp: ticket.timestamp,
                },
            ],
        }),
    });

    if (!res.ok) {
        throw new Error(`Discord ${res.status} ${res.statusText}`);
    }
}

async function run() {
    if (!DISCORD_WEBHOOK_URL) {
        throw new Error("DISCORD_WEBHOOK_URL is not set");
    }

    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: TOPIC_IN, fromBeginning: true });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const value = message.value?.toString();

            if (!value) {
                await sendToDlq(
                    "empty message",
                    "empty or null value",
                    topic,
                    partition,
                    message.offset,
                );
                return;
            }

            try {
                const ticket: LabelizedTicket = JSON.parse(value);

                if (!ticket.label || !ticket.channel || !ticket.id) {
                    await sendToDlq(
                        value,
                        "invalid ticket structure",
                        topic,
                        partition,
                        message.offset,
                    );
                    return;
                }

                const similarTicket = await findSimilarTicket(ticket.content, 0.75);
                if (similarTicket) {
                    console.log(`[Grouping] Ticket ${ticket.id} is similar to ${similarTicket.id}`);
                    await incrementTicketOccurrences(similarTicket.id);
                } else {
                    await sendToDiscord(ticket);
                    await saveTicket(ticket);
                }

                await updateTicketKpi(ticket.feedbackType);

                await consumer.commitOffsets([
                    { topic, partition, offset: (Number(message.offset) + 1).toString() },
                ]);
            } catch (err) {
                await sendToDlq(value, String(err), topic, partition, message.offset);
            }
        },
    });

    process.on("SIGINT", async () => {
        await consumer.disconnect();
        await producer.disconnect();
        process.exit(0);
    });
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
