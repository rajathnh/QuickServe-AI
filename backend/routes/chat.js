const express = require("express");
const Chat = require("../models/Chat");
const { authenticateUser } = require("../middleware/authMiddleware");

const router = express.Router();

// Store user and bot messages
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { message, botMessage } = req.body;
    const userId = req.user.id;

    if (!message || !botMessage) {
      return res.status(400).json({ error: "User message and bot response are required" });
    }

    console.log(`🔹 Storing messages for user ${userId}`);

    // Find or create chat history for the user
    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, messages: [] });
    }

    // Save user and bot messages
    chat.messages.push({ sender: "User", message });
    chat.messages.push({ sender: "Bot", message: botMessage });

    await chat.save();
    console.log("✅ Chat history updated successfully!");

    res.json({ message: "Chat stored successfully." });

  } catch (error) {
    console.error("❌ Error storing chat:", error);
    res.status(500).json({ error: "Failed to store chat" });
  }
});

// Fetch user chat history
router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔹 Fetching chat history for user: ${userId}`);

    const chat = await Chat.findOne({ user: userId });

    if (!chat) {
      console.log("🔹 No chat history found.");
      return res.json({ messages: [] });
    }

    console.log("✅ Chat history retrieved successfully!");
    res.json({ messages: chat.messages });
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
});

module.exports = router;
