
import { Kafka } from 'kafkajs';
import { TicketLabel, type LabelizedTicket } from '@kippu/shared';

const kafka = new Kafka({
    clientId: 'labelized-ticket-consumer',
    brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'labelized-ticket-consumer-group' });
const producer = kafka.producer();

const TOPIC_IN = 'labelized-ticket';
const TOPIC_DLQ = 'labelized-ticket-dlq';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1475792340940751046/wKIdK8dWZolBH5TzWz2GDHvJQjfAi6_JIBWnV4UfSRQDQNExNT8pP9262xDda-aNLMe3';

const LABEL_COLORS: Record<TicketLabel, number> = {
    [TicketLabel.URGENT]: 0xff0000,
    [TicketLabel.HIGH]: 0xff8c00,
    [TicketLabel.MEDIUM]: 0xffd700,
    [TicketLabel.LOW]: 0x00c853,
};

async function sendToDlq(value: string, error: string, topic: string, partition: number, offset: string) {
    await producer.send({
        topic: TOPIC_DLQ,
        messages: [{ value, headers: { error } }],
    });
    await consumer.commitOffsets([
        { topic, partition, offset: (Number(offset) + 1).toString() },
    ]);
}

async function sendToDiscord(ticket: LabelizedTicket) {
    const color = LABEL_COLORS[ticket.label] ?? 0x808080;

    const embed = {
        title: `Ticket ${ticket.label.toUpperCase()} — ${ticket.feedbackType}`,
        color,
        fields: [
            { name: 'ID', value: ticket.id, inline: true },
            { name: 'Channel', value: ticket.channel, inline: true },
            { name: 'Label', value: ticket.label, inline: true },
            { name: 'Contact', value: ticket.contact, inline: true },
            { name: 'Feedback', value: ticket.feedbackType, inline: true },
            { name: 'Date', value: ticket.timestamp, inline: true },
            { name: 'Contenu', value: ticket.content.substring(0, 1024) },
        ],
        timestamp: ticket.timestamp,
    };

    if (ticket.subject) {
        embed.fields.splice(6, 0, { name: 'Sujet', value: ticket.subject });
    }

    const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
        throw new Error(`Discord webhook failed: ${res.status} ${res.statusText}`);
    }
}

async function run() {
    if (!DISCORD_WEBHOOK_URL) {
        throw new Error('DISCORD_WEBHOOK_URL env variable is required');
    }

    await consumer.connect();
    await producer.connect();

    await consumer.subscribe({ topic: TOPIC_IN, fromBeginning: true });

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            const value = message.value?.toString();

            if (!value) {
                await sendToDlq('empty message', 'empty or null value', topic, partition, message.offset);
                return;
            }

            try {
                const ticket: LabelizedTicket = JSON.parse(value);

                if (!ticket.label || !ticket.channel || !ticket.id) {
                    await sendToDlq(value, 'invalid ticket structure', topic, partition, message.offset);
                    return;
                }

                await sendToDiscord(ticket);

                await consumer.commitOffsets([
                    { topic, partition, offset: (Number(message.offset) + 1).toString() },
                ]);
            } catch (err) {
                await sendToDlq(value, String(err), topic, partition, message.offset);
            }
        },
    });

    process.on('SIGINT', async () => {
        await consumer.disconnect();
        await producer.disconnect();
        process.exit(0);
    });
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
