import "dotenv/config";
import { Kafka } from "kafkajs";
import { FormattedTicket, FeedbackType } from "@kippu/shared";

const kafka = new Kafka({
  clientId: "mail-consumer",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "mail-consumer-group" });
const producer = kafka.producer();

const TOPICS = {
  INPUT: "mail-msg",
  OUTPUT: "formatted-ticket",
  DLQ: "mail-msg-dlq",
};

interface MailMessage {
  id: string;
  type: "email";
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  feedbackType: FeedbackType;
}

interface DeadLetterMessage {
  originalMessage: string;
  error: string;
  timestamp: string;
  topic: string;
  partition: number;
  offset: string;
}

function validateMailMessage(raw: any): string[] {
  const errors: string[] = [];

  if (!raw.id || raw.id === undefined) errors.push("missing field: id");
  if (!raw.from || raw.from === undefined) errors.push("missing field: from");
  if (!raw.subject || raw.subject === undefined)
    errors.push("missing field: subject");
  if (!raw.body || raw.body === undefined) errors.push("missing field: body");
  if (!raw.feedbackType || raw.feedbackType === undefined)
    errors.push("missing field: feedbackType");
  if (!raw.timestamp || raw.timestamp === undefined)
    errors.push("missing field: timestamp");

  return errors;
}

function formatMailToTicket(mailMsg: MailMessage): FormattedTicket {
  return {
    id: mailMsg.id,
    channel: "email",
    contact: mailMsg.from,
    subject: mailMsg.subject,
    content: mailMsg.body,
    feedbackType: mailMsg.feedbackType,
    timestamp: mailMsg.timestamp,
  };
}

async function sendToDeadLetterQueue(
  originalMessage: string,
  error: string,
  topic: string,
  partition: number,
  offset: string,
): Promise<void> {
  const dlqMessage: DeadLetterMessage = {
    originalMessage,
    error: error,
    timestamp: new Date().toISOString(),
    topic,
    partition,
    offset,
  };

  await producer.send({
    topic: TOPICS.DLQ,
    messages: [
      {
        key: `${topic}-${partition}-${offset}`,
        value: JSON.stringify(dlqMessage),
      },
    ],
  });

  console.error(
    `[DLQ] ⚠️ Message sent to DLQ | Topic: ${TOPICS.DLQ} | Error: ${error}`,
  );
}

async function run() {
  await consumer.connect();
  await producer.connect();
  console.log("✓ Mail consumer connected to Kafka");

  await consumer.subscribe({ topic: TOPICS.INPUT, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      const offset = message.offset;

      if (value) {
        try {
          const raw = JSON.parse(value);
          console.log(
            `[INFO] Processing email | ID: ${raw.id} | From: ${raw.from} | Subject: ${raw.subject?.substring(0, 30)}...`,
          );

          const validationErrors = validateMailMessage(raw);
          if (validationErrors.length > 0) {
            console.error(
              `[ERROR] Validation failed: ${validationErrors.join(", ")}`,
            );
            await sendToDeadLetterQueue(
              value,
              validationErrors.join(", "),
              topic,
              partition,
              offset,
            );
            return;
          }

          const mailMsg: MailMessage = raw;
          const formattedTicket = formatMailToTicket(mailMsg);

          await producer.send({
            topic: TOPICS.OUTPUT,
            messages: [
              {
                key: formattedTicket.id,
                value: JSON.stringify(formattedTicket),
              },
            ],
          });
        } catch (error) {
          console.error(`[ERROR] Failed to process email message:`, error);
          await sendToDeadLetterQueue(
            value,
            String(error),
            topic,
            partition,
            offset,
          );
        }
      } else {
        console.error(
          `[ERROR] Empty or null message received | Topic: ${topic} | Partition: ${partition} | Offset: ${offset}`,
        );
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
  console.error("Fatal error:", err);
  process.exit(1);
});
