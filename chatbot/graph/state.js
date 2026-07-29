import { Annotation } from "@langchain/langgraph";

export const ChatState = Annotation.Root({
  message: Annotation(), // raw user input
  isAuthenticated: Annotation(), // from Express middleware, never from LLM
  userId: Annotation(), // from Express middleware
  intent: Annotation(), // set by classifier node
  entities: Annotation(), // args extracted for the tool, e.g. { search: "shirt" }
  response: Annotation(), // final { message, link, redirect }
});
