const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/v1/refine-response
router.post("/", async (req, res) => {
  const { rawMessage } = req.body;
  if (!rawMessage) {
    return res.status(400).json({ error: "rawMessage is required" });
  }

  // Create a prompt for refining the raw response.
  const refinePrompt = `You are a friendly chatbot who help people for both restaurant menu-based online ordering and clinic doctor schedule-based appointment booking. You got something like the following message as response after formatting and sending the user's query to the database. You need to Refine the following message into a friendly, conversational sentence. Think about how well you can respond for whatever message you got. Do not include any markdown formatting, just plain text.
  
  Raw message: "${rawMessage}"
  `;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent",
      {
        contents: [{ role: "user", parts: [{ text: refinePrompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
        params: { key: process.env.GEMINI_API_KEY },
      }
    );

    let generatedText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    // Remove any unwanted markdown formatting
    if (generatedText) {
      generatedText = generatedText.replace(/```/g, "").trim();
    }

    res.json({ refinedMessage: generatedText });
  } catch (error) {
    console.error(
      "Refine Response Error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to refine response",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;
