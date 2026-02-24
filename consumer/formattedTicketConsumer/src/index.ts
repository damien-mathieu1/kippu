import { Kafka } from "kafkajs";
import { Ollama } from "ollama";
import {
  TicketLabel,
  type FormattedTicket,
  type LabelizedTicket,
} from "@kippu/shared";

const kafka = new Kafka({
  clientId: "formatted-ticket-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "formatted-ticket-consumer-group" });
const producer = kafka.producer();

const ollama = new Ollama({ host: "http://localhost:11434" });

const TOPIC_IN = "formatted-ticket";
const TOPIC_OUT = "labelized-ticket";
const TOPIC_DLQ = "labelized-ticket-dlq";

const VALID_LABELS: Record<string, TicketLabel> = {
  urgent: TicketLabel.URGENT,
  high: TicketLabel.HIGH,
  medium: TicketLabel.MEDIUM,
  low: TicketLabel.LOW,
};

async function labelize(ticket: FormattedTicket): Promise<LabelizedTicket> {
  const prompt = `You are a ticket priority classifier. Based on the ticket below, respond with exactly one word: urgent, high, medium, or low.

Channel: ${ticket.channel}
Type: ${ticket.feedbackType}
Subject: ${ticket.subject ?? "N/A"}
Content: ${ticket.content}

Priority:`;

  const response = await ollama.generate({
    model: "llama3.2:1b",
    prompt,
    stream: false,
  });

  const raw = response.response.trim().toLowerCase();
  const label = VALID_LABELS[raw] ?? TicketLabel.MEDIUM;

  return { ...ticket, label };
}

async function run() {
  await consumer.connect();
  await producer.connect();
  console.log("formatted-ticket-consumer connected to Kafka");

  await consumer.subscribe({ topic: TOPIC_IN, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      const ticket: FormattedTicket = JSON.parse(raw);

      try {
        const labelized = await labelize(ticket);
        await producer.send({
          topic: TOPIC_OUT,
          messages: [{ key: ticket.id, value: JSON.stringify(labelized) }],
        });
        console.log(`[OK] ticket ${ticket.id} → ${TOPIC_OUT} (label: ${labelized.label})`);
      } catch (err) {
        await producer.send({
          topic: TOPIC_DLQ,
          messages: [
            {
              key: ticket.id,
              value: JSON.stringify({ ticket, error: String(err) }),
            },
          ],
        });
        console.error(`[DLQ] ticket ${ticket.id} → ${TOPIC_DLQ}:`, err);
      }
    },
  });

  process.on("SIGINT", async () => {
    console.log("\nShutting down formatted-ticket-consumer...");
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
