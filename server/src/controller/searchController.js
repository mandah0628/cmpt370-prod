// server/src/controller/searching/searchController.js
const { searchTools, advancedSearch, getToolCategories, getPopularTags } = require('../services/searchData');

exports.searchTools = async (req, res) => {
  try {
    console.log('Search parameters:', req.query);
    console.log('Search URL:', req.originalUrl);
    
    const result = await searchTools(req.query);
    console.log('Search result:', {
      success: result.success,
      listingsCount: result.listings?.length || 0,
      error: result.error
    });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in searchTools controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while searching for tools',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.advancedSearch = async (req, res) => {
  try {
    console.log('Advanced search parameters:', req.query); // Log incoming parameters
    const result = await advancedSearch(req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in advancedSearch controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while performing advanced search',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getToolCategories = async (req, res) => {
  try {
    const categories = await getToolCategories();
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getToolCategories controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching tool categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getPopularTags = async (req, res) => {
  try {
    const tags = await getPopularTags();
    return res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error in getPopularTags controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching popular tags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};