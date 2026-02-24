import axios from "axios";

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordField[];
  timestamp?: string;
}

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordAlert(
  sourceTopic: string,
  errorMessage: string,
  rawMessage: Record<string, any>,
  errorId: string,
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("⚠️ DISCORD_WEBHOOK_URL not configured, notification skipped");
    return;
  }

  try {
    const messagePreview = JSON.stringify(rawMessage).substring(0, 500);

    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: "🚨 Message Processing Error",
          description:
            "A message could not be processed and was sent to the DLQ",
          color: 0xff0000,
          fields: [
            {
              name: "Error ID",
              value: errorId,
              inline: false,
            },
            {
              name: "Source Topic",
              value: sourceTopic,
              inline: true,
            },
            {
              name: "Error Message",
              value: errorMessage.substring(0, 1024),
              inline: false,
            },
            {
              name: "Raw Message Preview",
              value: `\`\`\`json\n${messagePreview}\n\`\`\``,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await axios.post(DISCORD_WEBHOOK_URL, payload);
    console.log(`✓ Discord alert sent for error ${errorId}`);
  } catch (error) {
    console.error("✗ Failed to send Discord alert:", error);
  }
}
