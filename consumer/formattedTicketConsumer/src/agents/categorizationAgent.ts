import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { TicketCategory, type FormattedTicket } from "@kippu/shared";
import { createLLM } from "./llm";

const CategorySchema = z.object({
  category: z.enum([
    "bug",
    "feature_request",
    "improvement",
    "question",
    "other",
  ]),
  reasoning: z.string(),
});

const SYSTEM_PROMPT = `You are a ticket category classifier. Classify the ticket into exactly one category.

Categories:
- bug: something is broken or not working as expected
- feature_request: a request for new functionality
- improvement: a suggestion to enhance existing functionality
- question: a general question or inquiry
- other: anything that does not fit the above categories

You MUST respond with a JSON object with exactly this format:
{{"category": "bug"|"feature_request"|"improvement"|"question"|"other", "reasoning": "..."}}
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

export async function classifyCategory(
  ticket: FormattedTicket,
  llm?: BaseChatModel,
): Promise<TicketCategory> {
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

    const CATEGORY_ALIASES: Record<string, string> = {
      feature: "feature_request",
      feature_req: "feature_request",
      enhance: "improvement",
      enhancement: "improvement",
      ask: "question",
      support: "question",
    };

    if (json.category && CATEGORY_ALIASES[json.category]) {
      json.category = CATEGORY_ALIASES[json.category];
    }

    const parsed = CategorySchema.safeParse(json);

    if (!parsed.success) {
      console.error("[categorization] invalid LLM response:", json, parsed.error);
      return TicketCategory.OTHER;
    }

    const validCategories: Record<string, TicketCategory> = {
      bug: TicketCategory.BUG,
      feature_request: TicketCategory.FEATURE_REQUEST,
      improvement: TicketCategory.IMPROVEMENT,
      question: TicketCategory.QUESTION,
      other: TicketCategory.OTHER,
    };

    return validCategories[parsed.data.category] ?? TicketCategory.OTHER;
  } catch (err) {
    console.error("[categorization] error:", err);
    return TicketCategory.OTHER;
  }
}
