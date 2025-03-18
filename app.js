require("dotenv").config();
require("express-async-errors");

const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const port = process.env.PORT || 5000;

const connectDB = require("./backend/db/connect");
const Conversation = require("./backend/models/Conversation"); // Import Conversation Model
const axios = require("axios");

app = express();
app.use(cookieParser(process.env.JWT_SECRET));
app.use(cors());
app.use(express.json());

// Import routes
const authRouter = require("./backend/routes/authRoutes");
const restaurantRouter = require("./backend/routes/restaurantRoutes");
const clinicRouter = require("./backend/routes/clinicRoutes");
const userRouter = require("./backend/routes/userRoutes");

// Mount routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/clinic", clinicRouter);
app.use("/api/v1/user", userRouter);

// ----- Setup HTTP Server & Socket.IO -----
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Function to call AI API (Hugging Face, etc.)
async function callAI(message) {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct",
      {
        inputs: message,
        parameters: { max_length: 100 },
      },
      {
        headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
      }
    );

    return response.data[0].generated_text || "I couldn't process that request.";
  } catch (error) {
    console.error("AI API Error:", error.message);
    return "Sorry, I couldn't process your request.";
  }
}

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("New client connected via Socket.IO");

  // Join user to a unique room using userId
  socket.on("join", async (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);

    // Fetch existing chat history and send to user
    const conversation = await Conversation.findOne({ user: userId });
    if (conversation) {
      socket.emit("chatHistory", conversation.messages);
    }
  });

  // Handle sending a message
  socket.on("sendMessage", async (data) => {
    const { userId, text } = data;
    console.log(`Message from ${userId}: ${text}`);

    // Find or create a conversation
    let conversation = await Conversation.findOne({ user: userId });
    if (!conversation) {
      conversation = new Conversation({ user: userId, messages: [] });
    }

    // Save the user's message
    conversation.messages.push({ sender: "user", text });
    await conversation.save();

    // Fetch AI response
    const botResponse = await callAI(text);

    // Save AI's response
    conversation.messages.push({ sender: "bot", text: botResponse });
    await conversation.save();

    // Emit the bot's response
    io.to(userId).emit("newMessage", { sender: "bot", text: botResponse });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start server after connecting to MongoDB
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

start();
