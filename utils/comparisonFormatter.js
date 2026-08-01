import { CompareOllamaModel } from "./aiModels.js";
import { PRODUCT_COMPARISON_SYSTEM_PROMPT } from "./aiPrompts.js";

export const generateComparisonText = async (products) => {
  const response = await CompareOllamaModel.invoke([
    { role: "system", content: PRODUCT_COMPARISON_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(products) },
  ]);
  return response.content;
};