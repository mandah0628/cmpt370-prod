// server/src/router/reviewRouter.js
const express = require("express");
const router = express.Router();


// controller import
const  { createUserReview, getAllUserReviews } = require('../controller/userReviewController');


// middleware import
const validateToken  = require('../middleware/validateToken');


// routes
router.post("/create-review/:revieweeId", validateToken, createUserReview);
router.get("/get-reviews", getAllUserReviews);


module.exports = router;
