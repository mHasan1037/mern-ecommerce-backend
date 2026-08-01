import { ChatOllama } from "@langchain/ollama";

export const classifierOllamaModel = new ChatOllama({
  model: "qwen3:14b",
  temperature: 0,
  format: "json"
});

export const CompareOllamaModel = new ChatOllama({
  model: "qwen3:14b",
  temperature: 0.3,
});