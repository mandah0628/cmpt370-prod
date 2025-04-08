// server/src/services/searchData.js
const { Listing, Reservation, User } = require('../model/index');
const { Op, fn, col, where, literal } = require('sequelize');

/**
 * searchTools
 * Filters listings based on:
 * - keyword: searches within title and description (normalized by removing spaces and lowercasing)
 * - postedDate: filters listings created on or after the provided date
 * - location: filters listings whose owner’s location matches (via a join with User)
 * - usage date range: excludes listings with reservations overlapping the desired usage window
 */
async function searchTools(query) {
  try {
    const { keyword, postedDate, location, desiredStartDate, desiredEndDate } = query;
    const whereConditions = {};

    // Keyword filtering on title and description with normalization:
    if (keyword) {
      // Normalize the keyword: remove all spaces and convert to lowercase
      const normalizedKeyword = keyword.replace(/\s/g, '').toLowerCase();

      // Create conditions that normalize the database fields as well
      whereConditions[Op.or] = [
        where(fn('REPLACE', fn('LOWER', col('title')), ' ', ''), {
          [Op.iLike]: `%${normalizedKeyword}%`
        }),
        where(fn('REPLACE', fn('LOWER', col('description')), ' ', ''), {
          [Op.iLike]: `%${normalizedKeyword}%`
        })
      ];
    }

    // Posted date filtering (listings created on/after the date)
    if (postedDate) {
      whereConditions.createdAt = { [Op.gte]: new Date(postedDate) };
    }

    // Build include array to join with User for location filtering, if provided.
    const include = [];
    if (location) {
      include.push({
        model: User,
        as: 'user',
        where: {
          location: { [Op.iLike]: `%${location}%` }
        }
      });
    } else {
      // If no location filter, still include the user for other purposes.
      include.push({
        model: User,
        as: 'user'
      });
    }

    // Include ListingImage always to show images.
    include.push({
      model: require('../model/listing/ListingImage'),
      as: 'listingImages'
    });

    // Usage date range filter: exclude listings with conflicting reservations.
    if (desiredStartDate && desiredEndDate) {
      // Exclude listings with any reservation where startDate < desiredEndDate and endDate > desiredStartDate
      whereConditions.id = {
        [Op.notIn]: literal(`(
          SELECT "listingId" FROM "reservations"
          WHERE "startDate" < '${desiredEndDate}' 
          AND "endDate" > '${desiredStartDate}'
        )`)
      };
    }

    const listings = await Listing.findAll({
      where: whereConditions,
      include,
      order: [['createdAt', 'DESC']]
    });

    return { success: true, listings };
  } catch (error) {
    console.error('Error in searchTools:', error);
    return { success: false, error: error.message };
  }
}

async function getToolCategories() {
  // Return hard-coded categories for now
  return ["Power Tools", "Hand Tools", "Outdoor Equipment", "Cleaning Equipment", "Construction Equipment"];
}

async function getPopularTags() {
  // Return hard-coded popular tags for now
  return ["drill", "ladder", "washer", "screwdriver", "hammer"];
}

module.exports = {
  searchTools,
  getToolCategories,
  getPopularTags,
};