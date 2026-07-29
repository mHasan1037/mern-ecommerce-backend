import { ChatOllama } from "@langchain/ollama";

const model = new ChatOllama({
  model: "qwen3:14b",
  temperature: 0,
  format: "json"
});

const SYSTEM_PROMPT = `You are an intent classifier for an e-commerce chat assistant.

Classify the user's message into exactly one of these intents:
- "product_query": asking about products, searching catalog, prices, categories, stock
- "order_status": asking about their own orders, order history, tracking, delivery status
- "policy_query": asking about return policy, shipping policy, refunds, terms, FAQs
- "general_chat": greetings, small talk, or anything not covered above

Also extract relevant entities as a flat object. Examples:
- product_query -> { "search": "blue shirt", "category": "clothing", "maxPrice": 2000 }
- order_status -> {} (no entities needed, user is always asking about their own orders)
- policy_query -> { "topic": "returns" }
- general_chat -> {}

Respond with ONLY valid JSON in this exact shape, nothing else:
{ "intent": "product_query", "entities": { "search": "blue shirt" } }

Omit entity keys that don't apply. Never invent values not implied by the message.`;

export const classifyIntent = async (message) => {
  const response = await model.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message }
  ]);

  try {
    const parsed = JSON.parse(response.content);
    return {
      intent: parsed.intent ?? "general_chat",
      entities: parsed.entities ?? {}
    };
  } catch (err) {
    // Model returned malformed JSON — fail safe into general_chat
    // rather than crashing the graph.
    return { intent: "general_chat", entities: {} };
  }
};