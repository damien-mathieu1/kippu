import { Kafka } from "kafkajs";
import { FormattedTicket, FeedbackType } from "@kippu/shared";

const kafka = new Kafka({
  clientId: "mail-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "mail-consumer-group" });
const producer = kafka.producer();

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

async function run() {
  await consumer.connect();
  await producer.connect();
  console.log("Mail consumer connected to Kafka");

  await consumer.subscribe({ topic: "mail-msg", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      console.log(
        `[${new Date().toISOString()}] [${topic}] partition=${partition} offset=${message.offset}`,
      );

      if (value) {
        try {
          const mailMsg: MailMessage = JSON.parse(value);
          console.log("Received mail message:", mailMsg);

          // Formatter le message en ticket
          const formattedTicket = formatMailToTicket(mailMsg);
          console.log("Formatted ticket:", formattedTicket);

          // Pousser dans la queue formatted-ticket
          await producer.send({
            topic: "formatted-ticket",
            messages: [
              {
                key: formattedTicket.id,
                value: JSON.stringify(formattedTicket),
              },
            ],
          });

          console.log(
            `✓ Ticket ${formattedTicket.id} pushed to formatted-ticket queue`,
          );
        } catch (error) {
          console.error("Error processing mail message:", error);
        }
      }
    },
  });

  process.on("SIGINT", async () => {
    console.log("\nShutting down Mail consumer...");
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
