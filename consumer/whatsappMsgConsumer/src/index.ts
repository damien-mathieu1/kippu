import { Kafka } from 'kafkajs';
import type { FormattedTicket } from '@kippu/shared';

const kafka = new Kafka({
  clientId: 'whatsapp-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'whatsapp-consumer-group' });
const producer = kafka.producer();

const FORMATTED_TICKET_TOPIC = 'formatted-ticket';
const DLQ_TOPIC = 'whatsapp-msg-dlq';

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: 'whatsapp-msg', fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) {
        await producer.send({
          topic: DLQ_TOPIC,
          messages: [{ value: 'empty message', headers: { error: 'empty or null value' } }],
        });
        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
        return;
      }

      try {
        const raw = JSON.parse(value);

        if (raw.type !== 'whatsapp') {
          await producer.send({
            topic: DLQ_TOPIC,
            messages: [{ value: value, headers: { error: 'invalid type: ' + raw.type } }],
          });
          await consumer.commitOffsets([
            { topic, partition, offset: (Number(message.offset) + 1).toString() },
          ]);
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

        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
      } catch (err) {
        await producer.send({
          topic: DLQ_TOPIC,
          messages: [{ value: value, headers: { error: String(err) } }],
        });

        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
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
