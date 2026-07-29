import { StateGraph, END } from "@langchain/langgraph";
import { classifyIntentNode, formatResponseNode, runToolNode } from "./nodes.js";
import { ChatState } from "./state.js";

const graph = new StateGraph(ChatState)
   .addNode("clissifyIntent", classifyIntentNode)
   .addNode("runTool", runToolNode)
   .addNode("formatResponse", formatResponseNode)
   .addEdge("__start__", "clissifyIntent")
   .addEdge("clissifyIntent", "runTool")
   .addEdge("runTool", "formatResponse")
   .addEdge("formatResponse", END)

export const chatGraph = graph.compile();