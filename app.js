require("dotenv").config();
require("express-async-errors");

const express = require("express");
const axios = require("axios"); // Import axios
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const port = process.env.PORT || 5000;

const connectDB = require("./backend/db/connect");
app.use(cookieParser(process.env.JWT_SECRET));

const authRouter = require("./backend/routes/authRoutes");
const restaurantRouter = require("./backend/routes/restaurantRoutes");
const clinicRouter = require("./backend/routes/clinicRoutes");
const userRouter = require("./backend/routes/userRoutes");
const mistralRouter = require("./backend/routes/mistralRoutes");
const intentRoutes = require("./backend/routes/intentRoutes");
const refineResponseRoutes = require("./backend/routes/refineResponseRoutes");
const chatRoutes = require("./backend/routes/chatRoutes");

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/restaurant", restaurantRouter);
app.use("/api/v1/clinic", clinicRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/mistral", mistralRouter);
app.use("/api/v1/detect-intent", intentRoutes);
app.use("/api/v1/refine-response", refineResponseRoutes);
app.use("/api/v1/chat", chatRoutes);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}...`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
  }
};

start();