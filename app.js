require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const http = require("http");
const socketio = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const axios = require("axios"); // Import axios
const port = process.env.PORT || 5000;
const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend')));

const connectDB = require("./backend/db/connect");
const Conversation = require("./backend/models/Conversation"); // Import Conversation Model


app.use(cookieParser(process.env.JWT_SECRET));
app.use(cors());
app.use(express.json());

// Import routes
const authRouter = require("./backend/routes/authRoutes");
const restaurantRouter = require("./backend/routes/restaurantRoutes");
const clinicRouter = require("./backend/routes/clinicRoutes");
const userRouter = require("./backend/routes/userRoutes");
const mistralRouter = require("./backend/routes/mistralRoutes");

// Mount routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/clinic", clinicRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/mistral", mistralRouter);

// ----- Setup HTTP Server & Socket.IO -----
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

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

    try {
      // Send the user's message to the /api/v1/mistral/ask endpoint
      const mistralResponse = await axios.post(
        "http://localhost:5000/api/v1/mistral/ask", // Adjust the URL if needed
        { prompt: text }
      );

      const botResponse = mistralResponse.data.choices[0].message.content; // Extract the AI's reply

      // Save AI's response
      conversation.messages.push({ sender: "bot", text: botResponse });
      await conversation.save();

      // Emit the bot's response
      io.to(userId).emit("newMessage", { sender: "bot", text: botResponse });
    } catch (error) {
      console.error("Error communicating with Mistral API:", error);
      // Handle errors appropriately (e.g., send an error message to the user)
      io.to(userId).emit("newMessage", {
        sender: "bot",
        text: "Sorry, I encountered an error processing your request.",
      });
    }
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
