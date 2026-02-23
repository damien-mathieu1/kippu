import { Kafka } from "kafkajs";
import { FormattedTicket, FeedbackType } from "@kippu/shared";

const kafka = new Kafka({
  clientId: "mail-consumer",
  brokers: ["localhost:9092"],
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

// Formatter le message en ticket
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

// Envoyer vers la dead letter queue en cas d'erreur
async function sendToDeadLetterQueue(
  originalMessage: string,
  error: Error,
  topic: string,
  partition: number,
  offset: string,
): Promise<void> {
  const dlqMessage: DeadLetterMessage = {
    originalMessage,
    error: error.message,
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

  console.error(`✗ Message envoyé vers DLQ: ${error.message}`);
}

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: TOPICS.INPUT, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();

      if (value) {
        try {
          const mailMsg: MailMessage = JSON.parse(value);
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

          console.log(`✓ Ticket ${formattedTicket.id} formaté et envoyé`);
        } catch (error) {
          await sendToDeadLetterQueue(
            value,
            error as Error,
            topic,
            partition,
            message.offset,
          );
        }
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
