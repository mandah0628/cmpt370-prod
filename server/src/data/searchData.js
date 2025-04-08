// server/src/model/searchQueries.js
const { Op, literal } = require('sequelize');
const { Listing, ListingImage, Tag } = require('../model');

const searchTools = async (params) => {
  const { keyword, category } = params;
  console.log('Search params:', { keyword, category });
  
  try {
    const whereClause = {};

    if (keyword) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { description: { [Op.iLike]: `%${keyword}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const result = await Listing.findAll({
      where: whereClause,
      include: [
        { model: ListingImage, as: 'listingImages' },
        { model: Tag, as: 'tags' }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('Query result count:', result.length);

    return {
      success: true,
      listings: result.map(listing => listing.toJSON())
    };
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const advancedSearch = async (params) => {
  const {
    keyword,
    postedDate,
    location,
    distance = 25,
    startDate, // For availability filter (if needed)
    endDate,   // For availability filter (if needed)
    minRating = 0,
    page = 1,
    limit = 20
  } = params;
  
  const offset = (page - 1) * limit;
  
  // Build the base where clause
  const whereClause = { active: true };

  if (keyword && keyword.trim() !== '') {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${keyword.trim()}%` } },
      { description: { [Op.iLike]: `%${keyword.trim()}%` } }
    ];
  }
  
  if (postedDate && postedDate !== 'all') {
    let dateThreshold;
    const now = new Date();
    if (postedDate === 'today') {
      dateThreshold = new Date(now.setHours(0, 0, 0, 0));
    } else if (postedDate === 'week') {
      dateThreshold = new Date();
      dateThreshold.setDate(now.getDate() - 7);
    } else if (postedDate === 'month') {
      dateThreshold = new Date();
      dateThreshold.setDate(now.getDate() - 30);
    }
    if (dateThreshold) {
      whereClause.createdAt = { [Op.gte]: dateThreshold };
    }
  }
  
  if (minRating > 0) {
    whereClause.rating = { [Op.gte]: minRating };
  }
  
  // Availability filter: ensure the listing's availability covers the requested usage window
  if (startDate && endDate) {
    whereClause.availability_start = { [Op.lte]: new Date(startDate) };
    whereClause.availability_end = { [Op.gte]: new Date(endDate) };
  }
  
  let order = [['createdAt', 'DESC']];
  let attributes = { include: [] };

  if (location) {
    const [lat, lng] = location.split(',').map(coord => parseFloat(coord));
    const distanceMeters = distance * 1000;
    
    const distanceExpression = literal(`ST_Distance("location", ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))/1000`);
    attributes.include.push([distanceExpression, 'distance']);
    
    whereClause[Op.and] = literal(`ST_DWithin("location", ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), ${distanceMeters})`);
    
    order = literal('distance ASC');
  }
  
  const result = await Listing.findAndCountAll({
    where: whereClause,
    offset,
    limit,
    order,
    attributes
  });
  
  return {
    tools: result.rows,
    pagination: {
      total: result.count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(result.count / limit)
    }
  };
};

const getToolCategories = async () => {
  // If you have a model for tool_categories, you could use it here.
  // Otherwise, using a raw query via sequelize:
  const [results] = await Listing.sequelize.query('SELECT id, name FROM tool_categories ORDER BY name ASC');
  return results;
};

const getPopularTags = async () => {
  // Using raw query via sequelize for popular tags:
  const [results] = await Listing.sequelize.query(`
    SELECT tg.name, COUNT(ttm.tool_id) as tool_count
    FROM tool_tags tg
    JOIN tool_tag_mapping ttm ON tg.id = ttm.tag_id
    GROUP BY tg.name
    ORDER BY tool_count DESC, tg.name ASC
    LIMIT 20
  `);
  return results;
};

module.exports = {
  searchTools,
  advancedSearch,
  getToolCategories,
  getPopularTags
};