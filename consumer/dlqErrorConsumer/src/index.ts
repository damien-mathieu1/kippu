import "dotenv/config";
import { Kafka } from "kafkajs";
import { initDatabase, insertDLQError, closeDatabase, DLQError } from "./db";
import { sendDiscordAlert } from "./discord";

const kafka = new Kafka({
  clientId: "dlq-error-manager",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "dlq-error-manager-group" });

const DLQ_TOPICS = ["mail-msg-dlq", "whatsapp-msg-dlq", "labelized-ticket-dlq"];

interface DeadLetterMessage {
  originalMessage: string;
  error: string;
  timestamp: string;
  topic: string;
  partition: number;
  offset: string;
}

async function processDLQMessage(
  dlqMessage: DeadLetterMessage,
  dlqTopic: string,
  partition: number,
  offset: string,
): Promise<void> {
  try {
    const errorId = `${dlqMessage.topic}-${dlqMessage.partition}-${dlqMessage.offset}`;

    let rawMessage: Record<string, any>;
    try {
      rawMessage = JSON.parse(dlqMessage.originalMessage);
    } catch {
      rawMessage = { raw: dlqMessage.originalMessage };
    }

    const dlqError: Omit<DLQError, "id" | "createdAt" | "updatedAt"> = {
      errorId,
      sourceTopic: dlqMessage.topic,
      partition: dlqMessage.partition,
      offset: dlqMessage.offset,
      rawMessage,
      errorMessage: dlqMessage.error,
      status: "pending",
      retryCount: 0,
      errorTimestamp: new Date(dlqMessage.timestamp),
      metadata: {
        dlqTopic,
        dlqPartition: partition,
        dlqOffset: offset,
        processedAt: new Date().toISOString(),
      },
    };

    const id = await insertDLQError(dlqError);
    console.log(`✓ DLQ error saved [ID: ${id}] from ${dlqTopic}`);

    await sendDiscordAlert(
      dlqMessage.topic,
      dlqMessage.error,
      rawMessage,
      errorId,
    );
  } catch (error) {
    console.error(`✗ Error processing DLQ message from ${dlqTopic}:`, error);
  }
}

async function run() {
  console.log("VARIABLE DISCORD : ", process.env.DISCORD_WEBHOOK_URL);
  try {
    await initDatabase();
    await consumer.connect();
    console.log("✓ DLQ Error Manager connected");

    for (const topic of DLQ_TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: true });
      console.log(`✓ Subscribed to ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();

        console.log(`[INFO] Received DLQ message from ${topic} | Partition: ${partition} | Offset: ${message.offset}`);
        
        if (value) {
          try {
            const dlqMessage: DeadLetterMessage = JSON.parse(value);
            await processDLQMessage(
              dlqMessage,
              topic,
              partition,
              message.offset,
            );
          } catch (error) {
            console.error(`✗ Error parsing DLQ message from ${topic}:`, error);
          }
        }
      },
    });

    const shutdown = async () => {
      console.log("\n⏸ Shutting down DLQ Error Manager...");
      await consumer.disconnect();
      await closeDatabase();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("✗ Fatal error:", error);
    await closeDatabase();
    process.exit(1);
  }
}

run();
