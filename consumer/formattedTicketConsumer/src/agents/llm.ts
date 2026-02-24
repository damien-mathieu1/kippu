import { ChatOllama } from "@langchain/ollama";

export function createLLM() {
  return new ChatOllama({
    model: "llama3.2:1b",
    temperature: 0,
    baseUrl: "http://localhost:11434",
    format: "json",
  });
}
