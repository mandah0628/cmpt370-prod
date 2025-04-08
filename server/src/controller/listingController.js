const { sequelize } = require('../model');
const jwt = require('jsonwebtoken');
const { 
    // create operations
    addListingDb, addTagsDb, addListingImagesDb, 
    // get operations
    getListingByIdDb, getMyListingsDb, 
    // listing field update operation
    updateListingDataDb, 
    //delete operations
    deleteListingByIdDb,deleteTags, deleteImagesDb,
    // cloudinary operations
    deleteImage,uploadImage, 
} = require('../data/listingData');



// create a new listing
const createListing = async (req, res) => {

    // will be used on the whole function scope
    // meaning both try and catch blocks
    let transaction;
    let newImageUrlArr = [];

    try {
        // FIRST EXTRACT ALL THE DATA

        // extract fields
        const { title, category, description, rate} = req.body;

        // extract tags and parse
        const { tags } = req.body;
        const tagsArr =  tags ? JSON.parse(tags) : [];

        
        // 1) upload images to cloudinary if there are photos to upload
        if(req.files && req.files.length > 0){
            const newImageArr = req.files;
            newImageUrlArr = await Promise.all(newImageArr.map( image => uploadImage(image.buffer) ));   
        }


        // BEGIN TRANSACTION
        transaction = await sequelize.transaction();
        
        
        // 1) add new listing in the db
        const newListing = await addListingDb({
            userId: req.user.id,
            title, category, description, rate
        });

        // 2) add listing images to db
        if (newImageUrlArr.length > 0) {
            await addListingImagesDb(newListing.id, newImageUrlArr);
        }
 
        // 3) add tags to db
        if (tagsArr.length > 0) {
            await addTagsDb(newListing.id, tagsArr);
        }

        // IF ALL UPLOADS AND ADDITIONS ARE SUCCESSFUL
        res.status(201).json({
            message: "Listing created successfully",
            listingId: newListing.id
        });

    } catch (error) {
        console.error("Error creating listing", error);

        // if one of the db operations is unsuccessful
        // rollback every db operation prior to it
        if(transaction) {
            await transaction.rollback();
        }

        // delete the newly uploaded images from cloudinary to optimize space
        if (newImageUrlArr.length > 0) {
            await Promise.all(newImageUrlArr.map( url => deleteImage(url) ));
        }

        res.status(500).json({ error: "Server side error" });
    }
};
    

// edits existing listing
const editListing = async (req, res) => {

    // will be used on the whole function scope
    // meaning both try and catch blocks
    let transaction;
    let newImageUrlArr = [];
    
    
    try {

        // EXTRACT ALL THE DATA AND PARSE THE ONES NEEDED TO PARSE
        const { listingId } = req.body;
        
        // updated fields
        const  { title, description, rate, category } = req.body;

        // old tags
        const { tagsToRemove } = req.body;
        const oldTags = tagsToRemove ? JSON.parse(tagsToRemove) : [];

        // new tags
        const { newTags } = req.body; 
        const newTagsArr = newTags ? JSON.parse(newTags) : [];
       
        // old images
        const { imagesToRemove } = req.body;
        const oldImagesArr = imagesToRemove ? JSON.parse(imagesToRemove) : [];
        const oldImagesUrlArr = oldImagesArr.map( image => image.url);

        // new images
        // 1) upload new images to cloudinary
        if(req.files && req.files.length > 0) {
            const newImages = req.files;
            newImageUrlArr = await Promise.all(newImages.map( image => uploadImage(image.buffer) ));
        }

        // create a transaction
        transaction = await sequelize.transaction();

        // 2) update the listing fields in db
        await updateListingDataDb(listingId, { title,description,rate,category }, transaction);

        // 3) add the new listing images to the db
        if (newImageUrlArr.length > 0) {
            await addListingImagesDb(listingId, newImageUrlArr, transaction);
        }

        // 4) add the new tags to the db
        if(newTagsArr.length > 0) {
            await addTagsDb(listingId, newTagsArr, transaction);
        }

        // IF ALL NEW UPLOADS AND UPDATES ARE SUCCESSFUL

        // 5) delete old tags from db
        if (oldTags.length > 0) {
            await deleteTags(oldTags, transaction);
        }
        
        // 6) delete old images from db
        if (oldImagesArr.length > 0) {
            await deleteImagesDb(oldImagesArr, transaction);
        }
                   
        // commit transaction
        await transaction.commit()
                    
        // if database operations are successful
        // 7) delete the old images from cloudinary
        if (oldImagesUrlArr.length > 0) {
            await Promise.all(oldImagesUrlArr.map( url => deleteImage(url) ));
        }


        // after all updates and deleteions are successful
        // 8) fetch the listing data with all the new data and send it back
        res.status(200).json({ listingId });

    } catch (error) {
        console.error("Error updating listing:", error.message);

        // if one of the db operations is unsuccessful
        // rollback every db operation prior to it
        if(transaction) {
            await transaction.rollback();
        }

        // delete the newly uploaded images from cloudinary to optimize space
        if (newImageUrlArr.length > 0) {
            await Promise.all(newImageUrlArr.map( url => deleteImage(url) ));
        }

        res.status(500).json( {message: "Error updating listing. Sever side error"} );
    }
};


// delete existing listing
const deleteListing = async (req, res) => {
    let transaction;
    try {
        // extract the listingId parameter
        const { listingId } = req.params;
        // fetch the listing
        const { listingImages } = await getListingByIdDb(listingId);

        // FIRST, PERFORM ALL THE DB OPERATIONS
    
        // start transaction
        transaction = await sequelize.transaction();

        // 1) delete listing
        await deleteListingByIdDb(listingId, transaction);

        // commit transaction
        await transaction.commit();

        // if all db operations are done
        // delete images from cloudinary, if there are any

        if(listingImages.length > 0) {
            await Promise.all(listingImages.map( image => deleteImage(image.url) ));
        }


        res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error) {
        console.error("Error deleting listing:", error);

        // if one of the db operations is unsuccessful
        // rollback every db operation prior to it
        if(transaction) {
            await transaction.rollback();
        }

        res.status(500).json({ message: "Server side error", error: error.message });
    }
};



// get listing data by its id
const getListingById = async (req, res) => {
    try {
        const listingId = req.params.id;
        
        if (!listingId) {
            return res.status(400).json({ message: "Missing listing ID" });
        }

        const listing = await getListingByIdDb(listingId);

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        // get the user id of who's viewing the listing
        // this will be used to conditionally render the
        // booking component
        const header = req.header("Authorization");
        let userId = null;
        
        if (header) {
            const token = header.split(" ")[1].trim();
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
            }
        }

        res.status(200).json({
            success: true,
            listing,
            userId
        });

    } catch (error) {
        console.error("Error fetching listing:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};



const getMyListings = async (req, res) => {
    try {
        
        const userId = req.user.id;
        
        const listings = await getMyListingsDb(userId);

        if(!listings || listings.length === 0){
            return res.status(200).json( {message: "User has no listings"} )
        }

        res.status(200).json({ listings });
            
    } catch (error) {
        console.error("Error fetching user's listings:", error);
        res.status(500).json({ message: "Server side error", error: error.message });
    }
};


module.exports = { 
    createListing,
    deleteListing,
    editListing,
    getMyListings,
    getListingById
};