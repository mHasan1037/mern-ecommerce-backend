import { ChatOllama } from "@langchain/ollama";
import { ChatGroq } from "@langchain/groq";

export const classifierGroqModel = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY,
  modelKwargs: {
    response_format: { type: "json_object" },
  },
});

export const CompareGroqModel = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.3,
  apiKey: process.env.GROQ_API_KEY,
});

export const classifierOllamaModel = new ChatOllama({
  model: "qwen3:14b",
  temperature: 0,
  format: "json"
});

export const CompareOllamaModel = new ChatOllama({
  model: "qwen3:14b",
  temperature: 0.3,
});