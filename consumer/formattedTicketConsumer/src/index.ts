import "dotenv/config";
import { Kafka } from "kafkajs";
import {
  TicketLabel,
  type FormattedTicket,
  type LabelizedTicket,
} from "@kippu/shared";
import { classifyPriority } from "./agents/prioritizationAgent";
import { classifyCategory } from "./agents/categorizationAgent";

const kafka = new Kafka({
  clientId: "formatted-ticket-consumer",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

const consumer = kafka.consumer({ groupId: "formatted-ticket-consumer-group" });
const producer = kafka.producer();

const TOPIC_IN = "formatted-ticket";
const TOPIC_OUT = "labelized-ticket";
const TOPIC_DLQ = "labelized-ticket-dlq";

const VALID_LABELS: Record<string, TicketLabel> = {
  critical: TicketLabel.P0,
  high: TicketLabel.P1,
  medium: TicketLabel.P2,
  low: TicketLabel.P3,
};

function validateFormattedTicket(ticket: any): string[] {
  const errors: string[] = [];

  if (!ticket.id || ticket.id === undefined) errors.push("missing field: id");
  if (!ticket.channel || ticket.channel === undefined)
    errors.push("missing field: channel");
  if (!ticket.contact || ticket.contact === undefined)
    errors.push("missing field: contact");
  if (!ticket.content || ticket.content === undefined)
    errors.push("missing field: content");
  if (!ticket.feedbackType || ticket.feedbackType === undefined)
    errors.push("missing field: feedbackType");
  if (!ticket.timestamp || ticket.timestamp === undefined)
    errors.push("missing field: timestamp");

  return errors;
}

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
  console.log("✓ Formatted ticket consumer connected to Kafka");

  await consumer.subscribe({ topic: TOPIC_IN, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString();
      const offset = message.offset;

      if (!raw) {
        console.error(
          `[ERROR] Empty or null message received | Topic: ${topic} | Partition: ${partition} | Offset: ${offset}`,
        );
        return;
      }

      const ticket: FormattedTicket = JSON.parse(raw);
      console.log(
        `[INFO] Processing ticket | ID: ${ticket.id} | Channel: ${ticket.channel} | FeedbackType: ${ticket.feedbackType}`,
      );

      const validationErrors = validateFormattedTicket(ticket);
      if (validationErrors.length > 0) {
        console.error(
          `[ERROR] Validation failed: ${validationErrors.join(", ")}`,
        );
        console.error(
          `[DLQ] ⚠️ Sending ticket to DLQ | ID: ${ticket.id} | Topic: ${TOPIC_DLQ}`,
        );
        await producer.send({
          topic: TOPIC_DLQ,
          messages: [
            {
              key: ticket.id,
              value: JSON.stringify({
                ticket,
                error: validationErrors.join(", "),
              }),
            },
          ],
        });
        console.log(
          `[DLQ] ✓ Ticket sent to DLQ | ID: ${ticket.id} | Topic: ${TOPIC_DLQ}`,
        );
        return;
      }

      try {
        const labelized = await labelize(ticket);
        await producer.send({
          topic: TOPIC_OUT,
          messages: [{ key: ticket.id, value: JSON.stringify(labelized) }],
        });
        console.log(
          `[OK] ticket ${ticket.id} → ${TOPIC_OUT} (label: ${labelized.label}, category: ${labelized.category})`,
        );
      } catch (err) {
        console.error(`[ERROR] Failed to label ticket:`, err);
        console.error(
          `[DLQ] ⚠️ Sending ticket to DLQ | ID: ${ticket.id} | Topic: ${TOPIC_DLQ}`,
        );
        await producer.send({
          topic: TOPIC_DLQ,
          messages: [
            {
              key: ticket.id,
              value: JSON.stringify({ ticket, error: String(err) }),
            },
          ],
        });
        console.log(
          `[DLQ] ✓ Ticket sent to DLQ | ID: ${ticket.id} | Topic: ${TOPIC_DLQ}`,
        );
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
