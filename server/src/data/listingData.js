const { Listing, ListingImage, Tag, Reservation, User, ProfilePhoto, ListingReview } = require("../model/index");
const cloudinary = require('../config/cloudinary');

/**
 * 
 * @param {Object} listingData Object containing the listing data. 
 * Key names in the listingData object have to match the key names in the table
 * @param {Object} tranasction The transaction object
 * @returns The newly created Listing object
 */
const addListingDb = async (listingData, transaction=null) => {
    try {
        const listing = await Listing.create( 
            listingData,
            {
                transaction
            }
        );
        return listing ? listing.toJSON() : null;

    } catch (error) {
        // catch sequelize errors
        console.error("Error creating listing in the database", error);
        // throw a new error to the controller
        throw new Error("Could create listing in the database");
    }
}



/**
 * 
 * @param {number} listingId The listing id
 * @param {string[]} tags An array containing the listing tags
 * @param {Object} transaction The transaction object
 * @returns {Promise} A promise that resolves into an array of Tag objects
 */
const addTagsDb = async (listingId, tags, transaction=null) => {
    try {
        return await Promise.all(tags.map(tagName => 
            Tag.create( 
                {listingId, tag : tagName.toLowerCase() },
                {transaction} 
            ))) ;

    } catch (error) {
        // catch sequelize errors
        console.error("Error adding tags:", error);
        // throw a new error to the controller
        throw new Error("Could not add tags to listing");
    }    
}



/**
 * 
 * @param {number} listingId The listing id
 * @param {string[]} imageUrls An array of strigs containing the cloudimary urls for the listing images
 * @param {Object} transaction The transaction object
 */
const addListingImagesDb = async (listingId, imageUrls, transaction=null) => {
    try {
        await Promise.all( imageUrls.map( (url, index) => 
            ListingImage.create( 
                { listingId, url, mainPhoto : index === 0},
                { transaction } )));
    } catch (error) {
        // catch sequelize errors
        console.error("Error adding listing images to database", error);
        // throw a new error to the controller
        throw new Error("Could not add listing images in database");
    }
}



/**
 * 
 * @param {number} listingId 
 * @returns Listing object
 */
const getListingByIdDb = async (listingId) => {
    try {
        const listing = await Listing.findByPk(listingId, {
            include: [ 
                {model: Tag, as: "tags"}, 
                {model: ListingImage, as: "listingImages"},
                {model: Reservation, as: "reservations"},
                {
                    model: User, 
                    as: "user",
                    attributes: ['id', 'name', 'email', 'rating', 'bio', 'location'],
                    include: [
                        {
                            model: ProfilePhoto,
                            as: "profilePhoto",
                            attributes: ['url']
                        }
                    ]
                },
                {model: ListingReview, as:"reviews"}
            ]
        });
        
        if (!listing) {
            throw new Error("Listing not found");
        }
        
        return listing.toJSON();
    } catch (error) {
        console.error("Error fetching listing from database:", error);
        throw new Error(`Could not fetch listing: ${error.message}`);
    }
}


/**
 * 
 * @param {number} userId 
 * @returns An array of listing objects
 * OR null if no listings were found
 */
const getMyListingsDb = async (userId) => {
    try {
        const listings = await Listing.findAll({
            where: {userId : userId},
            include: [
                { model: ListingImage, as: "listingImages" },
                { model : Tag, as: "tags"},
                {model: Reservation, as: "reservations"}
            ],
            order: [['createdAt', 'DESC']],
            distinct: true
        });
        console.log("Listings for user:", listings);

        return listings ? listings.map(listing => listing.toJSON()) : null;
    } catch (error) {
        // catch sequelize error
        console.error("Error retrieving listings", error);
        // throw a new error to the controller
        throw new Error("Could not retrieve the listings from the database");
    }
}






/**
 * Updates the listing info
 * @param {number} listingId Id of the listing to be updated
 * @param {Object} listingData Object with the updated fields and matching keys
 * @param {Object} transaction The transaction object
 */
const updateListingDataDb= async (listingId, listingData, transaction=null ) => {
    try {
        await Listing.update(
            listingData, 
            { 
                where: { id: listingId }, 
                transaction
            }
        );
    } catch (error) {
        console.error("Error updating listing:", error);
        throw new Error("Error updating listing data in db");
    }
}


/**
 * Deletes a listing from db by its id
 * @param {number} listingId The listing id
 * @param {Object} transaction The transaction object
 * If a listing is deleted, all its associations, listingImages
 * and tags will also be removed automatically
 */
const deleteListingByIdDb = async (listingId, transaction=null) => {
    try {
        await Listing.destroy(
             { 
                where: {id : listingId},
                transaction
            } 
        );
    } catch (error) {
        console.error("Error deleting listing from db", error);
        throw new Error("Error deleting listing data from db");
    }
}


/**
 * 
 * @param {Tag[]} tagArr Array with the Tab objects to be deleted from the db
 * @param {Object} transaction The transaction object
 */
const deleteTags = async (tagArr, transaction=null) => {
    try {
        await Promise.all(tagArr.map((tag) => 
            Tag.destroy( 
                {
                    where: {id: tag.id},
                    transaction
                }
            )));
    } catch (error) {
        console.error("Error removing tags from db", error);
        throw new Error("Error removing tags from db");
    }
}


/**
 * 
 * @param {ListingImage[]} imageArr Array with the ListingImage objects to be deleted from the db
 * @param {Object} transaction The tranasction object
 */
const deleteImagesDb= async (imgArr, transaction=null) => {
    try {
        await Promise.all(imgArr.map((image) => 
            ListingImage.destroy(
                { 
                    where: {id: image.id},
                    transaction
                }
            )));
    } catch (error) {
        console.error("Error removing images from db", error);
        throw new Error("Error removing images from db");
    }
}



/**
 * Uploads a single image to cloudinary.
 * If working with an array of images, use 'map()' with 'Promise.all()'
 * @param {buffer} buffer the raw binary data of the image
 * @returns The cloudinary url of the uploaded image(single image)
 */
const uploadImage = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "listings" }, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};



/**
 * Deletes a single image from Cloudinary.
 * If working with an array of images, use 'map()' with 'Promise.all()'
 * @param {string} imageUrl - cloudinary url
 * @returns {Promise} Resolves when the image is deleted
 */
const deleteImage = (imageUrl) => {
    return new Promise((resolve, reject) => {
      const afterUpload = imageUrl.split("/upload/")[1];
      let publicId = afterUpload.split(".")[0];
      publicId = publicId.replace(/^v\d+\//, "");
  
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  };
  


module.exports = { 
    // create operations
    addListingDb, addTagsDb, addListingImagesDb, 
    // get operations
    getListingByIdDb, getMyListingsDb, 
    // listing field update operation
    updateListingDataDb, 
    // delete listing image and tag rows from the db
    deleteListingByIdDb,deleteTags, deleteImagesDb,
    // cloudinary operations
    deleteImage, uploadImage,
};