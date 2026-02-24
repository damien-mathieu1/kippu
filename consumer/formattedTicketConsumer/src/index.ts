import { Kafka } from "kafkajs";
import {
  type FormattedTicket,
  type LabelizedTicket,
} from "@kippu/shared";
import { classifyPriority } from "./agents/prioritizationAgent";
import { classifyCategory } from "./agents/categorizationAgent";

const kafka = new Kafka({
  clientId: "formatted-ticket-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "formatted-ticket-consumer-group" });
const producer = kafka.producer();

const TOPIC_IN = "formatted-ticket";
const TOPIC_OUT = "labelized-ticket";
const TOPIC_DLQ = "labelized-ticket-dlq";

async function labelize(ticket: FormattedTicket): Promise<LabelizedTicket> {
  const [label, category] = await Promise.all([
    classifyPriority(ticket),
    classifyCategory(ticket),
  ]);
  return { ...ticket, label, category };
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
        console.log(`[OK] ticket ${ticket.id} → ${TOPIC_OUT} (label: ${labelized.label}, category: ${labelized.category})`);
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
