const express = require("express");
const axios = require("axios");
const router = express.Router();

// POST /api/detect-intent
router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Updated prompt with new intents.
  const intentPrompt = `
  Analyze the following user message and return the intent and relevant details in JSON format.
  The possible intents are:
  - book_appointment: Return doctor name, date, and time.
  - check_doctors_available: Return date.
  - check_availability: Return doctor name and date.
  - cancel_appointment: Return doctor name and appointment date.
  - place_order: Return a list of food items.
  - check_menu: No extra details needed.
  - get_dish_details: Return the dish name.
  - cancel_order: Return order ID or relevant details.
  - fetch_order_history: No extra details needed
  - fetch_restaurant_details: Return restaurant name.
  - get_doctor_timings: Return the doctor name with the Dr. prefix.
  - fetch_appointment_history: No extra details needed.
  - check_appointment_cost: Return Doctor name with the Dr. prefix.
  - check_general_checkup_fee: No extra details required.  
  - recommend_food_by_taste: Return taste preference (spicy,salty,etc), with the first letter in capital.
  - filter_dishes: Return dietary preference (vegetarian, gluten-free, vegan, etc.).
  - order_estimated_time: No extra details needed.
  - unknown: If the user's intent is unclear or doesn't match any listed intent.

  Ensure the output is a JSON object with "intent" as a key.
  Message: "${prompt}"
  `;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent",
      {
        contents: [{ role: "user", parts: [{ text: intentPrompt }] }],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          key: process.env.GEMINI_API_KEY,
        },
      }
    );

    // Extract the generated text.
    let generatedText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // Clean up markdown formatting (e.g., remove triple backticks).
    if (generatedText) {
      generatedText = generatedText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    // Attempt to parse the cleaned JSON output.
    const intentData = JSON.parse(generatedText);
    res.json(intentData);
  } catch (error) {
    console.error(
      "Intent Detection Error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to detect intent",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;