import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'whatsapp-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'whatsapp-consumer-group' });

async function run() {
  await consumer.connect();
  console.log('WhatsApp consumer connected to Kafka');

  await consumer.subscribe({ topic: 'whatsapp-msg', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      console.log(`[${new Date().toISOString()}] [${topic}] partition=${partition} offset=${message.offset}`);
      if (value) {
        console.log(JSON.parse(value));
      }
    },
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down WhatsApp consumer...');
    await consumer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
