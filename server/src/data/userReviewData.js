const { UserReview } = require('../model/index');


/**
 * Creates a new review record in userReviews table.
 * @param {Object} reviewData The user review data with all matching keynames.
 * @param {Object} transaction The transaction instance.
 */
const createUserReviewDb = async (reviewData, transaction) => {
    try {
        await UserReview.create(
            reviewData,
            {
                transaction
            }
        );
    } catch (error) {
        console.error("Error adding review in db", error);
        throw new Error("Sequelize error, error adding review");
    }
}



/**
 * Gets all the reviews written for a user by its id.
 * @param {number} userId The user id.
 * @param {Object} transaction The transaction instance.
 * @returns A promise that resolves into an array of review objects if records are found.
 * 
 * An empty array if no record is found.
 */
const getAllUserReviewsDb = async (userId, transaction) => {
    try {
        const reviews = await UserReview.findAll(
            {
                where: {revieweeId : userId},
                transaction,
                order: [["createdAt", "DESC"]],
                raw: true
            }
        );

        return reviews;

    } catch (error) {
        console.error("Error fetching reviews associated with the user");
        throw new Error(error.message);
        
    }
}

module.exports = {
    createUserReviewDb,
    getAllUserReviewsDb,
};