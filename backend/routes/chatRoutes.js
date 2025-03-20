const express = require("express");
const axios = require("axios");
const router = express.Router();
const Doctor = require('../models/Doctor'); // Import Doctor model
const { authenticateUser } = require('../middleware/authMiddleware'); // Ensure authentication

// Utility function: call detect intent endpoint
async function detectIntent(prompt) {
  console.log("Detecting intent for prompt:", prompt);
  const response = await axios.post(
    "http://localhost:5000/api/v1/detect-intent",
    { prompt }
  );
  console.log("Intent detection response:", response.data);
  return response.data;
}

// Utility function: refine response via refine-response endpoint
async function refineResponse(rawMessage) {
  console.log("Refining raw message:", rawMessage);
  const response = await axios.post(
    "http://localhost:5000/api/v1/refine-response",
    { rawMessage }
  );
  console.log("Refined message response:", response.data);
  return response.data.refinedMessage;
}

// Helper function: Map Gemini output to full booking payload
async function mapBookingPayload(intentData, req) {
    console.log("Mapping booking payload from intent data:", intentData);
  
    // Get authenticated user info from req.user
    const patient = req.user.id;
    const patientName = req.user.name;  // Ensure that req.user.name exists
    if (!patientName) {
      throw new Error("Patient name is missing in the authenticated token");
    }
    console.log("Patient info from req.user:", { patient, patientName });
  
    // Set a valid default clinic ID (replace with a real ObjectId)
    const clinic = "60d21b4667d0d8992e610c85"; // Example valid ObjectId
    console.log("Using clinic ID:", clinic);
  
    // Lookup doctor by name using the provided intent data
    const doctorData = await Doctor.findOne({ name: intentData.doctor_name });
    console.log("Doctor lookup result:", doctorData);
    if (!doctorData) {
      throw new Error("Doctor not found");
    }
    const doctor = doctorData._id;
    const doctorName = doctorData.name;
    console.log("Mapped doctor details:", { doctor, doctorName });
  
    // Combine date and time into a valid appointment time.
    const appointmentTime = new Date(`${intentData.date} ${intentData.time}`).toISOString();
    console.log("Computed appointment time:", appointmentTime);
  
    // Set a default charge or use doctor's consultation fee if available
    const charges = doctorData.consultationFee || 150;
    console.log("Using charges:", charges);
  
    const payload = {
      clinic,
      patient,
      patientName,
      doctor,
      doctorName,
      appointmentTime,
      charges,
    };
    console.log("Final booking payload:", payload);
    return payload;
  }
  

// Protect chat route so that req.user is available
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received chat message:", message);
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Step 1: Detect the intent of the message
    const intentData = await detectIntent(message);
    console.log("Detected intent data:", intentData);

    let rawResult = "";
    // Step 2: Route based on the intent
    switch (intentData.intent) {
      case "book_appointment":
        try {
          // Map the Gemini output to the complete payload required by the booking endpoint
          const bookingPayload = await mapBookingPayload(intentData, req);
          // Call the clinic booking endpoint with the enriched payload
          const bookRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/appointment",
            bookingPayload
          );
          console.log("Clinic booking response:", bookRes.data);
          rawResult = bookRes.data.message + ". Appointment ID: " + bookRes.data.appointment_id;
        } catch (error) {
          console.error("Error during booking mapping or request:", error);
          rawResult = "Failed to book appointment: " + error.message;
        }
        break;
      case "check_availability":
        {
          const availRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/availability",
            intentData
          );
          console.log("Availability response:", availRes.data);
          rawResult = "Available slots: " + availRes.data.availableSlots.join(", ");
        }
        break;
      case "cancel_appointment":
        {
          const cancelRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/cancel",
            intentData
          );
          console.log("Cancel appointment response:", cancelRes.data);
          rawResult = cancelRes.data.message;
        }
        break;
      case "place_order":
        {
          const orderRes = await axios.post(
            "http://localhost:5000/api/v1/restaurant/order",
            intentData
          );
          console.log("Place order response:", orderRes.data);
          rawResult = orderRes.data.message + ". Order ID: " + orderRes.data.order_id;
        }
        break;
      case "check_menu":
        {
          const menuRes = await axios.get(
            "http://localhost:5000/api/v1/restaurant/menu"
          );
          console.log("Check menu response:", menuRes.data);
          rawResult = "Menu items: " + menuRes.data.map((item) => item.name).join(", ");
        }
        break;
      case "cancel_order":
        {
          const cancelOrderRes = await axios.post(
            "http://localhost:5000/api/v1/restaurant/cancel",
            intentData
          );
          console.log("Cancel order response:", cancelOrderRes.data);
          rawResult = cancelOrderRes.data.message;
        }
        break;
      default:
        rawResult = "I'm not sure what you meant. Could you please clarify?";
        break;
    }

    console.log("Raw result before refinement:", rawResult);
    // Step 3: Refine the raw result to a conversational reply
    const refinedMessage = await refineResponse(rawResult);
    console.log("Final refined message:", refinedMessage);

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
