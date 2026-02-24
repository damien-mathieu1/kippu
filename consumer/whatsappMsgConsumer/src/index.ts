import { Kafka } from 'kafkajs';
import 'dotenv/config';
import type { FormattedTicket } from '@kippu/shared';

const kafka = new Kafka({
  clientId: 'whatsapp-consumer',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'whatsapp-consumer-group' });
const producer = kafka.producer();

const FORMATTED_TICKET_TOPIC = 'formatted-ticket';
const DLQ_TOPIC = 'whatsapp-msg-dlq';

interface DeadLetterMessage {
  originalMessage: string;
  error: string;
  timestamp: string;
  topic: string;
  partition: number;
  offset: string;
}

function validateWhatsAppMessage(raw: any): string[] {
  const errors: string[] = [];
  
  if (!raw.id || raw.id === undefined) errors.push('missing field: id');
  if (!raw.from || raw.from === undefined) errors.push('missing field: from');
  if (!raw.body || raw.body === undefined) errors.push('missing field: body');
  if (!raw.feedbackType || raw.feedbackType === undefined) errors.push('missing field: feedbackType');
  if (!raw.timestamp || raw.timestamp === undefined) errors.push('missing field: timestamp');
  
  return errors;
}

async function sendToDlq(value: string, error: string, topic: string, partition: number, offset: string) {
  const dlqMessage: DeadLetterMessage = {
    originalMessage: value,
    error: error,
    timestamp: new Date().toISOString(),
    topic,
    partition,
    offset,
  };
  
  console.error(`[DLQ] ⚠️ Message sent to DLQ | Topic: ${topic} | Partition: ${partition} | Offset: ${offset} | Error: ${error}`);
  await producer.send({
    topic: DLQ_TOPIC,
    messages: [{ value: JSON.stringify(dlqMessage) }],
  });
  await consumer.commitOffsets([
    { topic, partition, offset: (Number(offset) + 1).toString() },
  ]);
  console.log(`[DLQ] ✓ Message committed to DLQ topic: ${DLQ_TOPIC}`);
}

async function run() {
  await consumer.connect();
  await producer.connect();
  console.log('✓ WhatsApp consumer connected to Kafka');

  await consumer.subscribe({ topic: 'whatsapp-msg', fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      const offset = message.offset;

      if (!value) {
        console.error(`[ERROR] Empty or null message received | Topic: ${topic} | Partition: ${partition} | Offset: ${offset}`);
        await sendToDlq('empty message', 'empty or null value', topic, partition, offset);
        return;
      }

      try {
        const raw = JSON.parse(value);
        console.log(`[INFO] Processing WhatsApp message | ID: ${raw.id} | From: ${raw.from}`);

        if (raw.type !== 'whatsapp') {
          console.error(`[ERROR] Invalid message type: ${raw.type} | Expected: whatsapp`);
          await sendToDlq(value, 'invalid type: ' + raw.type, topic, partition, offset);
          return;
        }

        const validationErrors = validateWhatsAppMessage(raw);
        if (validationErrors.length > 0) {
          console.error(`[ERROR] Validation failed: ${validationErrors.join(', ')}`);
          await sendToDlq(value, validationErrors.join(', '), topic, partition, offset);
          return;
        }

        const ticket: FormattedTicket = {
          id: raw.id,
          channel: 'whatsapp',
          contact: raw.from,
          content: raw.body,
          feedbackType: raw.feedbackType,
          timestamp: raw.timestamp,
        };

        await producer.send({
          topic: FORMATTED_TICKET_TOPIC,
          messages: [{ value: JSON.stringify(ticket) }],
        });

        console.log(`[OK] ✓ Ticket created | ID: ${ticket.id} | Channel: ${ticket.channel}`);

        await consumer.commitOffsets([
          { topic, partition, offset: (Number(offset) + 1).toString() },
        ]);
      } catch (err) {
        console.error(`[ERROR] Failed to process message:`, err);
        await sendToDlq(value, String(err), topic, partition, offset);
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
