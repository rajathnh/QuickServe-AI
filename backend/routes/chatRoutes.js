// backend/routes/chatRoutes.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

// Utility function: call detect intent endpoint
async function detectIntent(prompt) {
  const response = await axios.post(
    "http://localhost:5000/api/v1/detect-intent",
    { prompt }
  );
  return response.data;
}

// Utility function: refine response via refine-response endpoint
async function refineResponse(rawMessage) {
  const response = await axios.post(
    "http://localhost:5000/api/v1/refine-response",
    { rawMessage }
  );
  return response.data.refinedMessage;
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Step 1: Detect the intent of the message
    const intentData = await detectIntent(message);

    let rawResult = "";
    // Step 2: Route based on the intent
    switch (intentData.intent) {
      case "book_appointment":
        // Call the clinic booking endpoint
        // You may need to include additional details, for now assume intentData has all needed info.
        const bookRes = await axios.post(
          "http://localhost:5000/api/v1/clinic/book",
          intentData
        );
        rawResult =
          bookRes.data.message +
          ". Appointment ID: " +
          bookRes.data.appointment_id;
        break;
      case "check_availability":
        const availRes = await axios.post(
          "http://localhost:5000/api/v1/clinic/availability",
          intentData
        );
        rawResult =
          "Available slots: " + availRes.data.availableSlots.join(", ");
        break;
      case "cancel_appointment":
        const cancelRes = await axios.post(
          "http://localhost:5000/api/v1/clinic/cancel",
          intentData
        );
        rawResult = cancelRes.data.message;
        break;
      case "place_order":
        const orderRes = await axios.post(
          "http://localhost:5000/api/v1/restaurant/order",
          intentData
        );
        rawResult =
          orderRes.data.message + ". Order ID: " + orderRes.data.order_id;
        break;
      case "check_menu":
        const menuRes = await axios.get(
          "http://localhost:5000/api/v1/restaurant/menu"
        );
        rawResult =
          "Menu items: " + menuRes.data.map((item) => item.name).join(", ");
        break;
      case "cancel_order":
        const cancelOrderRes = await axios.post(
          "http://localhost:5000/api/v1/restaurant/cancel",
          intentData
        );
        rawResult = cancelOrderRes.data.message;
        break;
      default:
        rawResult = "I'm not sure what you meant. Could you please clarify?";
        break;
    }

    // Step 3: Refine the raw result to a conversational reply
    const refinedMessage = await refineResponse(rawResult);

    // Return the final refined message to the user
    res.json({ message: refinedMessage });
  } catch (error) {
    console.error("Chat Endpoint Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to process chat", details: error.message });
  }
});

module.exports = router;
