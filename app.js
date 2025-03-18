require("dotenv").config();
require("express-async-errors")

const express = require("express")
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const port = process.env.PORT || 5000;

const connectDB = require("./backend/db/connect")
app.use(cookieParser(process.env.JWT_SECRET));

const authRouter = require('./backend/routes/authRoutes')
const restaurantRouter = require('./backend/routes/restaurantRoutes')
const clinicRouter = require('./backend/routes/clinicRoutes')
const userRouter = require('./backend/routes/userRoutes')


app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/restaurant',restaurantRouter)
app.use('/api/v1/clinic', clinicRouter)
app.use('/api/v1/user', userRouter)

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