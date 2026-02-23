import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

const kafka = new Kafka({
  clientId: 'producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();
const TOPICS = {
  WHATSAPP: 'whatsapp-msg',
  MAIL: 'mail-msg',
};

const phoneNumbers = [
  '+33612345678', '+33723456789', '+33634567890', '+33745678901',
  '+33656789012', '+33767890123', '+33678901234', '+33789012345',
];

const emails = [
  'jean.dupont@email.com', 'marie.martin@gmail.com', 'paul.durand@outlook.com',
  'sophie.bernard@yahoo.com', 'luc.wilson@company.fr', 'emma.mercier@domain.com',
];

const appVersions = ['v2.1.0', 'v2.0.5', 'v2.0.4', 'v1.9.8', 'v1.9.7'];
const devices = ['iPhone 14', 'iPhone 13', 'Samsung S23', 'Pixel 7', 'iPhone 12', 'Samsung S22'];
const osVersions = ['iOS 17.2', 'iOS 16.5', 'Android 14', 'Android 13'];

const bugReports = [
  'L\'app crash quand je clique sur le bouton paramètres',
  'Je n\'arrive pas à me connecter, ça tourne en boucle',
  'L\'écran reste blanc après le splash screen',
  'Les notifications ne s\'affichent pas',
  'Le paiement ne fonctionne pas',
  'Je perds ma session toutes les 5 minutes',
  'L\'app freeze quand je scroll dans la liste',
  'Impossible d\'upload une photo de profil',
  'Le chat ne charge pas les anciens messages',
  'Crash à l\'ouverture des paramètres',
];

const positiveFeedback = [
  'Super app, très intuitive !',
  'Merci pour cette mise à jour, tout fonctionne',
  'J\'adore le nouveau design',
  'L\'app est devenue beaucoup plus rapide',
  'Parfait, exactement ce que je cherchais',
  'Bravo pour le travail, continuez comme ça',
  'Le support client est réactif et efficace',
  'Nouvelle version au top !',
  'Fonctionne parfaitement sur mon téléphone',
  'Merci pour les nouvelles fonctionnalités',
];

const featureRequests = [
  'Est-ce possible d\'ajouter un mode sombre ?',
  'Vous pourriez ajouter un widget pour l\'accueil',
  'Un système de backup serait utile',
  'Pouvez-vous ajouter le français svp ?',
  'J\'aurais besoin d\'une API pour synchroniser',
  'Intégration avec Slack serait Sympa',
  'Un mode hors ligne serait le bienvenue',
  'Pouvez-vous ajouter des thèmes personnalisés ?',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(): Date {
  const now = new Date();
  const hourOffset = Math.floor(Math.random() * 24 * 7);
  const minuteOffset = Math.floor(Math.random() * 60);
  now.setHours(now.getHours() - hourOffset);
  now.setMinutes(now.getMinutes() - minuteOffset);
  return now;
}

function generateFeedbackType(): 'bug' | 'positive' | 'feature' {
  const rand = Math.random();
  if (rand < 0.5) return 'bug';
  if (rand < 0.8) return 'positive';
  return 'feature';
}

function generateWhatsAppMessage() {
  const feedbackType = generateFeedbackType();
  let body: string;

  switch (feedbackType) {
    case 'bug':
      body = `Bug: ${randomElement(bugReports)}\n\nApp: ${randomElement(appVersions)}\nDevice: ${randomElement(devices)}`;
      break;
    case 'positive':
      body = `Feedback positif: ${randomElement(positiveFeedback)}`;
      break;
    case 'feature':
      body = `Suggestion: ${randomElement(featureRequests)}`;
      break;
  }

  return {
    id: uuidv4(),
    type: 'whatsapp',
    from: randomElement(phoneNumbers),
    to: 'support',
    body,
    timestamp: randomDate().toISOString(),
    feedbackType,
  };
}

function generateMailMessage() {
  const feedbackType = generateFeedbackType();
  let subject: string;
  let body: string;

  switch (feedbackType) {
    case 'bug':
      subject = `[BUG] ${randomElement(bugReports).substring(0, 40)}`;
      body = `Bonjour,\n\nJ'ai un bug sur l'application:\n\n${randomElement(bugReports)}\n\nVersion: ${randomElement(appVersions)}\nAppareil: ${randomElement(devices)}\nOS: ${randomElement(osVersions)}\n\nPouvez-vous m'aider ?\n\nCordialement,\n${randomElement(emails).split('@')[0]}`;
      break;
    case 'positive':
      subject = `[FEEDBACK] ${randomElement(positiveFeedback).substring(0, 40)}`;
      body = `Bonjour,\n\nJe tenais à vous dire que ${randomElement(positiveFeedback).toLowerCase()}\n\nMerci pour votre travail !\n\nCordialement,\n${randomElement(emails).split('@')[0]}`;
      break;
    case 'feature':
      subject = `[SUGGESTION] ${randomElement(featureRequests).substring(0, 40)}`;
      body = `Bonjour,\n\nJ'aurais une suggestion:\n\n${randomElement(featureRequests)}\n\nCela serait très utile pour moi.\n\nMerci,\n${randomElement(emails).split('@')[0]}`;
      break;
  }

  return {
    id: uuidv4(),
    type: 'email',
    from: randomElement(emails),
    to: 'support@myapp.com',
    subject,
    body,
    timestamp: randomDate().toISOString(),
    feedbackType,
  };
}

async function produceOne() {
  const isWhatsApp = Math.random() > 0.5;
  const message = isWhatsApp ? generateWhatsAppMessage() : generateMailMessage();
  const topic = isWhatsApp ? TOPICS.WHATSAPP : TOPICS.MAIL;

  console.log(`[${new Date().toISOString()}] Producing ${isWhatsApp ? 'WhatsApp' : 'Mail'} message to topic ${topic}`);

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
}

async function run() {
  await producer.connect();
  console.log('Producer connected to Kafka');

  const interval = setInterval(() => {
    produceOne().catch((err) => console.error('Error producing message:', err));
  }, 3000);

  // Send one immediately
  await produceOne();

  process.on('SIGINT', async () => {
    console.log('\nShutting down producer...');
    clearInterval(interval);
    await producer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
