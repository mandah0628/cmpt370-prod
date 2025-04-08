const express = require('express');
const router = express.Router();
const multer = require('multer');

// middleware import
const validateToken = require('../middleware/validateToken');
const checkListingFields = require('../middleware/checkListingFields');

// multer - multipart form data middleware
const storage = multer.memoryStorage();
const upload = multer({ storage });

// controller import
const { createListing, deleteListing, editListing, getMyListings, getListingById } = require('../controller/listingController');

// Get listing by ID
router.get('/get-listing/:id', getListingById);

// Create listing route
router.post('/create-listing', validateToken, upload.array("image"), checkListingFields, createListing);

// Edit listing route
router.put('/edit-listing', validateToken, upload.array("image"), editListing);

// Delete listing route
router.delete('/delete-listing/:listingId', validateToken, deleteListing);

// Get my listings route
router.get('/my-listings', validateToken, getMyListings);

module.exports = router;