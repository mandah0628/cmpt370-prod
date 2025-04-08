require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database.js');

const userRouter = require('./src/router/userRouter.js');
const listingRouter = require('./src/router/listingRouter.js');
const authRouter = require('./src/router/authRouter.js');
const searchRouter = require('./src/router/searchRouter.js');
const userReviewRouter = require('./src/router/userReviewRouter.js')
const listingReviewRouter = require('./src/router/listingReviewRouter.js');
const reservationRouter = require('./src/router/reservationRouter.js');
const messageRouter = require('./src/router/messageRouter.js');


const app = express();
app.use(cors({
  origin: "http://localhost:3030",
  credentials: true
}));
// parses json request bodies into JS objects
app.use(express.json({ limit: '10mb' }));

// parses URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

// cors allows the express server to accept requests from the



// similar routes are grouped under one main route
app.use("/auth", authRouter); 
app.use("/user", userRouter); 
app.use("/listing", listingRouter); 
app.use("/search", searchRouter);
app.use("/reservation", reservationRouter);
app.use("/message", messageRouter);
app.use("/user-review", userReviewRouter);
app.use("/listing-review", listingReviewRouter)


// undefined route handler
// if a user sends a request to a route that doesn't exist
app.use((req, res, next) => {
  res.status(404).json({ message: "Endpoint not found" }); 
});

// middleware for when an error gets passed to
// next(err)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Something went wrong", error: err.message });
});

// define the express server port
const PORT = process.env.EXPRESS_PORT || 5050;

// starts the express server and establishes connection
// with the database
const startServer = async () => {
  try {
    // ensures a valid connection
    await sequelize.authenticate(); 
    console.log("✅ Database connection established.");

    // ensures tables exist and match
    // sequelizde models
    await sequelize.sync({ alter: true }); 
    console.log("✅ Database synced successfully.");

    // starts express server and listens to requests on specified port
    app.listen(PORT, () => console.log(`🚀 Express server running on port ${PORT}`));
  } catch (error) {
    // if database connection is not valid
    console.error("❌ Database connection failed:", error);
    // terminates the node process, with exit code 1
    // non-zero exit code means an error occured
    process.exit(1);
  }
};

startServer();
