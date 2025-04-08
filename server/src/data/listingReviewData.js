const { ListingReview } = require('../model/index');

/**
 * Creates a listing review
 * @param {Object} reviewData The listing review data with matching field names.
 * @param {Object} transaction The transaction instance.
 */
const createListingReviewDb = async (reviewData, transaction) => {
    try {
        console.log("Data:", reviewData.listingId)
        await ListingReview.create( 
            reviewData,
            {
                transaction
            }
        );
    } catch (error) {
        console.error("Error creating listing review in db", error);
        throw new Error(error.message);
    }
}


/**
 * Gets all reviews associated with the listing
 * @param {number} listingId The listing id.
 * @param {Object} transaction The transcation instance.
 * @returns A promise that resolves into an array of reviews. Empty array if no record is found.
 */
const getAllListingReviewsDb = async (listingId,  transaction) => {
    try {
        const reviews = await ListingReview.findAll(
            {
                where: {listingId},
                transaction,
                order: [["createdAt", "DESC"]],
                raw: true
            }
        );

        return reviews;

    } catch (error) {
        console.error("Error fetching reviews associated with the listing");
        throw new Error(error.message);
        
    }
}

module.exports = { getAllListingReviewsDb, createListingReviewDb };