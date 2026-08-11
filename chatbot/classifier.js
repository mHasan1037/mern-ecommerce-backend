import { classifierGroqModel } from "../utils/aiModels.js";
import { CLASSIFIER_SYSTEM_PROMPT } from "../utils/aiPrompts.js";

export const classifyIntent = async (message) => {
  const response = await classifierGroqModel.invoke([
    { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
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