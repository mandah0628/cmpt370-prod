const express = require('express');
const router = express.Router();



// middleware imports
const validateToken = require('../middleware/validateToken');

// conctroller imports
const { createListingReview, getAllListingReviews } = require('../controller/listingReviewController');

// routes
router.post("/create-review", validateToken, createListingReview);
router.get("/get=reviews", getAllListingReviews);


module.exports = router;