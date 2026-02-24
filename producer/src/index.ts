import { Kafka, Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";

const kafka = new Kafka({
  clientId: "producer",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();
const TOPICS = {
  WHATSAPP: "whatsapp-msg",
  MAIL: "mail-msg",
};

const ERROR_RATE = parseFloat(process.env.ERROR_RATE || "0.1");

const phoneNumbers = [
  "+33612345678",
  "+33723456789",
  "+33634567890",
  "+33745678901",
  "+33656789012",
  "+33767890123",
  "+33678901234",
  "+33789012345",
];

const emails = [
  "jean.dupont@email.com",
  "marie.martin@gmail.com",
  "paul.durand@outlook.com",
  "sophie.bernard@yahoo.com",
  "luc.wilson@company.fr",
  "emma.mercier@domain.com",
];

const appVersions = ["v2.1.0", "v2.0.5", "v2.0.4", "v1.9.8", "v1.9.7"];
const devices = [
  "iPhone 14",
  "iPhone 13",
  "Samsung S23",
  "Pixel 7",
  "iPhone 12",
  "Samsung S22",
];
const osVersions = ["iOS 17.2", "iOS 16.5", "Android 14", "Android 13"];

const bugReportsFR = [
  "L'app crash quand je clique sur le bouton paramètres",
  "Je n'arrive pas à me connecter, ça tourne en boucle",
  "L'écran reste blanc après le splash screen",
  "Les notifications ne s'affichent pas",
  "Le paiement ne fonctionne pas",
  "Je perds ma session toutes les 5 minutes",
  "L'app freeze quand je scroll dans la liste",
  "Impossible d'upload une photo de profil",
  "Le chat ne charge pas les anciens messages",
  "Crash à l'ouverture des paramètres",
];

const bugReportsEN = [
  "App crashes when I click settings",
  "Can't log in, it keeps loading",
  "Payment doesn't work",
  "Notifications don't show up",
  "Screen stays white after splash screen",
  "I lose my session every 5 minutes",
  "App freezes when scrolling the list",
  "Can't upload a profile picture",
  "Chat doesn't load old messages",
  "Crash when opening settings",
];

const positiveFeedbackFR = [
  "Super app, très intuitive !",
  "Merci pour cette mise à jour, tout fonctionne",
  "J'adore le nouveau design",
  "L'app est devenue beaucoup plus rapide",
  "Parfait, exactement ce que je cherchais",
  "Bravo pour le travail, continuez comme ça",
  "Le support client est réactif et efficace",
  "Nouvelle version au top !",
  "Fonctionne parfaitement sur mon téléphone",
  "Merci pour les nouvelles fonctionnalités",
];

const positiveFeedbackEN = [
  "Great app, very intuitive!",
  "Love the new design",
  "App is much faster now",
  "Perfect, exactly what I needed",
  "Keep up the great work!",
  "Customer support is fast and helpful",
  "New version is awesome!",
  "Works perfectly on my phone",
  "Thanks for the new features",
  "Really smooth experience overall",
];

const featureRequestsFR = [
  "Est-ce possible d'ajouter un mode sombre ?",
  "Vous pourriez ajouter un widget pour l'accueil",
  "Un système de backup serait utile",
  "Pouvez-vous ajouter le français svp ?",
  "J'aurais besoin d'une API pour synchroniser",
  "Intégration avec Slack serait Sympa",
  "Un mode hors ligne serait le bienvenue",
  "Pouvez-vous ajouter des thèmes personnalisés ?",
];

const featureRequestsEN = [
  "Can you add dark mode?",
  "A home screen widget would be nice",
  "A backup system would be useful",
  "An offline mode would be great",
  "Could you add custom themes?",
  "Integration with Slack would be nice",
  "I'd need an API to sync data",
  "Could you add push notification settings?",
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

function generateFeedbackType(): "bug" | "positive" | "feature" {
  const rand = Math.random();
  if (rand < 0.5) return "bug";
  if (rand < 0.8) return "positive";
  return "feature";
}

function shouldGenerateInvalid(): boolean {
  return Math.random() < ERROR_RATE;
}

function generateInvalidWhatsAppMessage() {
  const fieldToRemove = Math.floor(Math.random() * 5);
  const base = generateWhatsAppMessage();

  switch (fieldToRemove) {
    case 0:
      return { ...base, id: undefined };
    case 1:
      return { ...base, type: undefined };
    case 2:
      return { ...base, from: undefined };
    case 3:
      return { ...base, body: undefined };
    case 4:
      return { ...base, feedbackType: undefined };
    default:
      return { ...base, timestamp: undefined };
  }
}

function generateInvalidMailMessage() {
  const fieldToRemove = Math.floor(Math.random() * 6);
  const base = generateMailMessage();

  switch (fieldToRemove) {
    case 0:
      return { ...base, id: undefined };
    case 1:
      return { ...base, type: undefined };
    case 2:
      return { ...base, from: undefined };
    case 3:
      return { ...base, subject: undefined };
    case 4:
      return { ...base, body: undefined };
    case 5:
      return { ...base, feedbackType: undefined };
    default:
      return { ...base, timestamp: undefined };
  }
}

function generateWhatsAppMessage() {
  const feedbackType = generateFeedbackType();
  const isEN = Math.random() < 0.5;
  let body: string;

  switch (feedbackType) {
    case "bug":
      body = isEN
        ? `${randomElement(bugReportsEN)}\n\nApp: ${randomElement(appVersions)}\nDevice: ${randomElement(devices)}`
        : `${randomElement(bugReportsFR)}\n\nApp: ${randomElement(appVersions)}\nDevice: ${randomElement(devices)}`;
      break;
    case "positive":
      body = isEN
        ? `${randomElement(positiveFeedbackEN)}`
        : `${randomElement(positiveFeedbackFR)}`;
      break;
    case "feature":
      body = isEN
        ? `${randomElement(featureRequestsEN)}`
        : `${randomElement(featureRequestsFR)}`;
      break;
  }

  return {
    id: uuidv4(),
    type: "whatsapp",
    from: randomElement(phoneNumbers),
    to: "support",
    body,
    timestamp: randomDate().toISOString(),
    feedbackType,
  };
}

function generateMailMessage() {
  const feedbackType = generateFeedbackType();
  const isEN = Math.random() < 0.5;
  let subject: string;
  let body: string;
  const sender = randomElement(emails).split("@")[0];

  switch (feedbackType) {
    case "bug":
      if (isEN) {
        const bug = randomElement(bugReportsEN);
        subject = `${bug.substring(0, 40)}`;
        body = `Hello,\n\nI have a bug on the app:\n\n${bug}\n\nVersion: ${randomElement(appVersions)}\nDevice: ${randomElement(devices)}\nOS: ${randomElement(osVersions)}\n\nCan you help me?\n\nBest regards,\n${sender}`;
      } else {
        const bug = randomElement(bugReportsFR);
        subject = `[BUG] ${bug.substring(0, 40)}`;
        body = `Bonjour,\n\nJ'ai un bug sur l'application:\n\n${bug}\n\nVersion: ${randomElement(appVersions)}\nAppareil: ${randomElement(devices)}\nOS: ${randomElement(osVersions)}\n\nPouvez-vous m'aider ?\n\nCordialement,\n${sender}`;
      }
      break;
    case "positive":
      if (isEN) {
        const feedback = randomElement(positiveFeedbackEN);
        subject = `${feedback.substring(0, 40)}`;
        body = `Hello,\n\nI wanted to say that ${feedback.toLowerCase()}\n\nThanks for your work!\n\nBest regards,\n${sender}`;
      } else {
        const feedback = randomElement(positiveFeedbackFR);
        subject = `${feedback.substring(0, 40)}`;
        body = `Bonjour,\n\nJe tenais à vous dire que ${feedback.toLowerCase()}\n\nMerci pour votre travail !\n\nCordialement,\n${sender}`;
      }
      break;
    case "feature":
      if (isEN) {
        const feat = randomElement(featureRequestsEN);
        subject = `${feat.substring(0, 40)}`;
        body = `Hello,\n\nI have a suggestion:\n\n${feat}\n\nThis would be very useful for me.\n\nThanks,\n${sender}`;
      } else {
        const feat = randomElement(featureRequestsFR);
        subject = `${feat.substring(0, 40)}`;
        body = `Bonjour,\n\nJ'aurais une suggestion:\n\n${feat}\n\nCela serait très utile pour moi.\n\nMerci,\n${sender}`;
      }
      break;
  }

  return {
    id: uuidv4(),
    type: "email",
    from: randomElement(emails),
    to: "support@myapp.com",
    subject,
    body,
    timestamp: randomDate().toISOString(),
    feedbackType,
  };
}

async function produceOne() {
  const isWhatsApp = Math.random() > 0.5;
  const isInvalid = shouldGenerateInvalid();

  let message;
  if (isInvalid) {
    message = isWhatsApp
      ? generateInvalidWhatsAppMessage()
      : generateInvalidMailMessage();
    console.log(
      `[${new Date().toISOString()}] ⚠️ Producing INVALID ${isWhatsApp ? "WhatsApp" : "Mail"} message to topic ${isWhatsApp ? TOPICS.WHATSAPP : TOPICS.MAIL}`,
    );
  } else {
    message = isWhatsApp ? generateWhatsAppMessage() : generateMailMessage();
    console.log(
      `[${new Date().toISOString()}] Producing ${isWhatsApp ? "WhatsApp" : "Mail"} message to topic ${isWhatsApp ? TOPICS.WHATSAPP : TOPICS.MAIL}`,
    );
  }

  const topic = isWhatsApp ? TOPICS.WHATSAPP : TOPICS.MAIL;

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });
}

async function run() {
  await producer.connect();
  console.log("Producer connected to Kafka");

  const interval = setInterval(() => {
    produceOne().catch((err) => console.error("Error producing message:", err));
  }, 5000);

  // Send one immediately
  await produceOne();

  process.on("SIGINT", async () => {
    console.log("\nShutting down producer...");
    clearInterval(interval);
    await producer.disconnect();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
