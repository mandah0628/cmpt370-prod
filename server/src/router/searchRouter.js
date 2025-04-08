// server/src/router/searchRouter.js
const express = require('express');
const router = express.Router();
const { searchTools } = require('../services/searchData');

router.get('/tools', async (req, res) => {
  try {
    // Pass all query params to searchTools
    const result = await searchTools(req.query);

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    // Return the listings
    res.json({
      success: true,
      listings: result.listings,
    });
  } catch (error) {
    console.error('Error in GET /search/tools:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;