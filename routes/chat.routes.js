// routes/chat.routes.js
import { Router } from "express";
import { chatGraph } from "../chatbot/graph/index.js";
import optionalAuth from "../middlewares/optionalAuth.js";

const router = Router();

router.post("/chat", optionalAuth, async (req, res) => {
  try {
    const { message, intent, entities } = req.body;

    if (!intent && (!message || typeof message !== "string")) {
      return res.status(400).json({ message: "Message is required" });
    }

    const result = await chatGraph.invoke({
      message: message ?? null,
      intent: intent ?? undefined,
      entities: entities ?? undefined,
      isAuthenticated: req.isAuthenticated,
      userId: req.user?._id ?? null
    });

    return res.status(200).json(result.response);
  } catch (err) {
    console.error("Chat route error:", err.message);
    return res.status(500).json({ message: "Something went wrong, please try again." });
  }
});

export default router;