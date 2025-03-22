require("dotenv").config();
require("express-async-errors");

const express = require("express");
const axios = require("axios"); // Import axios
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// 🔹 Dynamically set allowed origins for CORS
const allowedOrigins = process.env.NODE_ENV === "production" 
    ? ["https://quickserve-ai-1.onrender.com"] 
    : ["http://localhost:3000", "http://localhost:5000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.static("frontend"));
app.use(cookieParser(process.env.JWT_SECRET));

// 🔹 Import database connection
const connectDB = require("./backend/db/connect");

// 🔹 Import routes
const authRouter = require("./backend/routes/authRoutes");
const restaurantRouter = require("./backend/routes/restaurantRoutes");
const clinicRouter = require("./backend/routes/clinicRoutes");
const userRouter = require("./backend/routes/userRoutes");
const mistralRouter = require("./backend/routes/mistralRoutes");
const intentRoutes = require("./backend/routes/intentRoutes");
const refineResponseRoutes = require("./backend/routes/refineResponseRoutes");
const chatRoutes = require("./backend/routes/chatRoutes");
const chatRouter = require("./backend/routes/chat");

// 🔹 Define API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/clinic", clinicRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/mistral", mistralRouter);
app.use("/api/v1/detect-intent", intentRoutes);
app.use("/api/v1/refine-response", refineResponseRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/chat/history", chatRouter);

// 🔹 Add a health check route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Server is running!" });
});

// 🔹 Start the server
const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(port, () => {
            console.log(`✅ Server running on port ${port}...`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error("❌ Server startup error:", error);
    }
};

start();
