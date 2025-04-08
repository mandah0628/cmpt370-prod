const { getAllListingReviewsDb, createListingReviewDb } = require('../data/listingReviewData');
const { updateListingDataDb } = require('../data/listingData');
const { sequelize } = require('../model/index')


// creates a listing review record
const createListingReview= async (req,res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA

        // if of the user who wrote the review
        const { id : reviewerId} = req.user;
        const { listingId } = req.body;
        const { reviewData } = req.body;

        console.log("1!!!!!!!!!!",listingId);

        // add the additional data
        const data = {...reviewData, reviewerId, listingId };
        console.log(data);

        // start transaction
        transaction = await sequelize.transaction();
        console.log("2!!!!!!!!!!",listingId);
        // 1) create the new review record
        await createListingReviewDb(data, transaction);

        // 2) fetch all the reviews
        const newReviews = await getAllListingReviewsDb(listingId, transaction);
    
        // 3) calculate the new average rating
        const ratings = newReviews.map(review => review.rating);
        const ratingSum = ratings.reduce((acc, rating) => acc + rating, 0);
        const newListingRating = ratings.length > 0 ? (ratingSum / ratings.length) : 0;

        // 4) update the user rating using its id
        await updateListingDataDb(listingId, {rating : newListingRating}, transaction);

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



// get all the reviews associated with the listing by its id
const getAllListingReviews = async (req,res) => {
    let transaction;
    try {
        //EXTRACT ALL THE DATA
        const { listingId } = req.params;

        // start the transaction
        transaction = await sequelize.transaction();

        // 1) get all the reviews
        const reviews = await getAllListingReviewsDb(listingId, transaction);

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

module.exports = { getAllListingReviews, createListingReview };