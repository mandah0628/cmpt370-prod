
const express = require('express');
const router = express.Router();

// import middleware
const validateTokenOnLoad = require('../middleware/validateTokenOnLoad');

// validate token on load route
router.get("/validate-token", validateTokenOnLoad);

module.exports = router;