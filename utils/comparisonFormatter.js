import { CompareGroqModel } from "./aiModels.js";
import { PRODUCT_COMPARISON_SYSTEM_PROMPT } from "./aiPrompts.js";

export const generateComparisonText = async (products) => {
  const response = await CompareGroqModel.invoke([
    { role: "system", content: PRODUCT_COMPARISON_SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(products) },
  ]);
  return response.content;
};