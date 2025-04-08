const { createUserReviewDb, getAllUserReviewsDb } = require('../data/userReviewData');
const { updateUserDb } = require('../data/userData');
const { sequelize } = require('../model/index');



// creates a review record
const createUserReview= async (req,res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA

        // if of the user who wrote the review
        const { id : reviewerId} = req.user;
        // id of the user who got the review
        const { revieweeId } = req.params;
        
        const { reviewData } = req.body;

        // add the additional data
        const data = {...reviewData, reviewerId, revieweeId};
        

        // start transaction
        transaction = await sequelize.transaction();

        // 1) create the new review record
        await createUserReviewDb(data, transaction);

        // 2) fetch all the reviews
        const newReviews = await getAllUserReviewsDb(revieweeId, transaction);
    
        // 3) calculate the new average rating
        const ratings = newReviews.map(review => review.rating);
        const ratingSum = ratings.reduce((acc, rating) => acc + rating, 0);
        const newUserRating = ratings.length > 0 ? ratingSum / ratings.length : 0;

        // 4) update the user rating using its id
        await updateUserDb(revieweeId, {rating : newUserRating}, transaction);

        // commit transaction
        await transaction.commit();

        res.status(200).send("ok");

    } catch (error) {
        console.error("Error creating review", error);

        // if one of db operations fail
        // rollback everything
        if(transaction) {
            await transaction.rollback()
        }

        res.status(500).json( {message: "Server side error", error: error.message} )
    }
}



// get all the reviews associated with the user by its id
const getAllUserReviews = async (req,res) => {
    let transaction;
    try {
        //EXTRACT ALL THE DATA
        const { revieweeId } = req.params;

        // start the transaction
        transaction = await sequelize.transaction();

        // 1) get all the reviews
        const reviews = await getAllUserReviewsDb(revieweeId , transaction);

        // commit transaction
        await transaction.commit();

        res.status(200).json({ reviews });
    } catch (error) {
        console.error("Error getting reviews", error);

        // if one of db operations fail
        // rollback everything
        if(transaction) {
            await transaction.rollback()
        }

        res.status(500).json( {message: "Server side error", error: error.message} )
    }
}

module.exports = { 
    // create operations
    createUserReview,
    // get operations
    getAllUserReviews,
}