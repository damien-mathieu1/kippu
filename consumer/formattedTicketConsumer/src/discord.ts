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

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL_TICKET;

export async function sendTicketCreatedAlert(
  ticket: any,
  label: string,
): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("⚠️ DISCORD_WEBHOOK_URL_TICKET not configured, notification skipped");
    return;
  }

  try {
    const payload: DiscordWebhookPayload = {
      embeds: [
        {
          title: "🎫 New Ticket Created",
          description: "A new ticket has been successfully labeled",
          color: 0x00ff00,
          fields: [
            {
              name: "Ticket ID",
              value: ticket.id,
              inline: false,
            },
            {
              name: "Channel",
              value: ticket.channel,
              inline: true,
            },
            {
              name: "Contact",
              value: ticket.contact,
              inline: true,
            },
            {
              name: "Feedback Type",
              value: ticket.feedbackType,
              inline: true,
            },
            {
              name: "Priority Label",
              value: label,
              inline: true,
            },
            {
              name: "Content Preview",
              value: ticket.content?.substring(0, 200) || "N/A",
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await axios.post(DISCORD_WEBHOOK_URL, payload);
    console.log(`✓ Discord ticket alert sent for ${ticket.id}`);
  } catch (error) {
    console.error("✗ Failed to send Discord ticket alert:", error);
  }
}
