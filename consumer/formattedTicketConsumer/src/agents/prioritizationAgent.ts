import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { TicketLabel, type FormattedTicket } from "@kippu/shared";
import { createLLM } from "./llm";

const PrioritySchema = z.object({
  label: z.enum(["P0", "P1", "P2", "P3"]),
  reasoning: z.string(),
});

const SYSTEM_PROMPT = `You are a ticket priority classifier. Classify the ticket into exactly one priority level.

Criteria:
- P0 (critical): system down, data loss, security breach
- P1 (high): major feature broken, significant impact, no workaround
- P2 (medium): feature partially broken, workaround exists
- P3 (low): minor issue, cosmetic, general question

You MUST respond with a JSON object with exactly this format:
{{"label": "P0"|"P1"|"P2"|"P3", "reasoning": "..."}}
Do not include any other text, only the JSON object.`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  [
    "human",
    `Channel: {channel}
Type: {feedbackType}
Subject: {subject}
Content: {content}`,
  ],
]);

export async function classifyPriority(
  ticket: FormattedTicket,
  llm?: BaseChatModel,
): Promise<TicketLabel> {
  const model = llm ?? createLLM();
  const chain = prompt.pipe(model);

  try {
    const response = await chain.invoke({
      channel: ticket.channel,
      feedbackType: ticket.feedbackType,
      subject: ticket.subject ?? "N/A",
      content: ticket.content,
    });

    const json = JSON.parse(response.content as string);

    const PRIORITY_ALIASES: Record<string, string> = {
      critical: "P0",
      high: "P1",
      medium: "P2",
      low: "P3",
    };

    if (json.label && PRIORITY_ALIASES[json.label]) {
      json.label = PRIORITY_ALIASES[json.label];
    }

    const parsed = PrioritySchema.safeParse(json);

    if (!parsed.success) {
      console.error("[prioritization] invalid LLM response:", json, parsed.error);
      return TicketLabel.P2;
    }

    const validLabels: Record<string, TicketLabel> = {
      P0: TicketLabel.P0,
      P1: TicketLabel.P1,
      P2: TicketLabel.P2,
      P3: TicketLabel.P3,
    };

    return validLabels[parsed.data.label] ?? TicketLabel.P2;
  } catch (err) {
    console.error("[prioritization] error:", err);
    return TicketLabel.P2;
  }
}
