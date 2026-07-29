import "dotenv/config";
import { classifyIntent } from "../chatbot/classifier.js";

const messages = [
  "show me blue shirts under 2000",
  "where is my order",
  "what's your return policy",
  "hey how are you"
];

for (const msg of messages) {
  const result = await classifyIntent(msg);
  console.log(msg, "->", result);
}