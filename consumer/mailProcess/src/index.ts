import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'mail-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'mail-consumer-group' });

async function run() {
  await consumer.connect();
  console.log('Mail consumer connected to Kafka');

  await consumer.subscribe({ topic: 'mail-msg', fromBeginning: true });

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
    console.log('\nShutting down Mail consumer...');
    await consumer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
