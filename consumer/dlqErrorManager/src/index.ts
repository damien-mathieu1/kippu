import { Kafka } from "kafkajs";
import {
  initDatabase,
  insertDLQError,
  closeDatabase,
  DLQError,
} from "./db";

const kafka = new Kafka({
  clientId: "dlq-error-manager",
  brokers: [process.env.KAFKA_BROKERS || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "dlq-error-manager-group" });

// Liste de toutes les DLQ à surveiller
const DLQ_TOPICS = [
  "mail-msg-dlq",
  "whatsapp-msg-dlq",
  "formatted-ticket-dlq",
];

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
    // Générer un ID unique pour cette erreur
    const errorId = `${dlqMessage.topic}-${dlqMessage.partition}-${dlqMessage.offset}`;

    // Parser le message original (peut être JSON ou texte brut)
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
    console.log(`✓ Erreur DLQ enregistrée [ID: ${id}] depuis ${dlqTopic}`);
  } catch (error) {
    console.error(
      `✗ Erreur lors du traitement du message DLQ depuis ${dlqTopic}:`,
      error,
    );
  }
}

async function run() {
  try {
    // Initialiser la base de données
    await initDatabase();

    // Connecter le consumer
    await consumer.connect();
    console.log(`✓ DLQ Error Manager connecté`);

    // S'abonner à toutes les DLQ
    for (const topic of DLQ_TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: true });
      console.log(`✓ Abonné à ${topic}`);
    }

    // Traiter les messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = message.value?.toString();

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
            console.error(
              `✗ Erreur lors du parsing du message DLQ depuis ${topic}:`,
              error,
            );
          }
        }
      },
    });

    // Gestion de l'arrêt propre
    const shutdown = async () => {
      console.log("\n⏸ Arrêt du DLQ Error Manager...");
      await consumer.disconnect();
      await closeDatabase();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("✗ Erreur fatale:", error);
    await closeDatabase();
    process.exit(1);
  }
}

run();
