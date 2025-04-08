const { User, ProfilePhoto } = require('../model/index');
const cloudinary = require('../config/cloudinary');


/**
 * Adds new entry for the user
 * Key names in the listingData object have to match the key names in the table
 * @param {Object} userDetails Object containing the user details
 * @param {Object} transaction The transaction instance
 * 
 * @returns newUser, the newly created user object if operation was successful.
 * If not, throws an error to the controller
 */
const addUserDb = async (userDetails , transaction) =>{
    try {
        const newUser = await User.create(userDetails, { transaction } );
        return newUser.toJSON();
    } catch (error) {
        console.error("Error creating user in database", error);
        throw new Error (`Could not create user in database: ${error.message}`);
    }
}

/**
 * Adds a new entry for the profile photo
 * @param {number} userId The user id
 * @param {Object} transaction The transaction instance
 * Adds a profile photo row when user is first created, to easily
 * reference the photo url and update it later, even if its null
 */
const addProfilePhotoDb = async (userId, transaction) => {
    try {
        await ProfilePhoto.create( { userId }, { transaction });
    } catch (error) {
        console.error("Error adding profile photo row in db", error);
        throw new Error(`Couldnt not created profile photo in db: ${error.message}`);
    }
}


/**
 * Gets the User object by its id
 * @param {number} userID The user id
 * @returns the User object
 */
const getUserDb = async (userID) => {
    try {
        const user = await User.findByPk(userID, {include: [ {model : ProfilePhoto, as: "profilePhoto" }]})

        return user?.toJSON();
    } catch (error) {
        console.error("Error fetching user from db",error);
        throw new Error (`Could not fetch user from db: ${error.message}`);
    }
    
}


/**
 * Updates a user's fields
 * @param {number} userID The user id
 * @param {Object} newData An object with the updated fields. 
 * @param {Object} transaction The transaction object
 * Key names must match with the db attributes
 * 
 * @returns The updated user object
 */
const updateUserDb = async (userID, newData, transaction) => {
    try {
        const result = await User.update(newData, {
            where: {id: userID},
            transaction
        });

    // If no rows were updated, throw a user-friendly error
    if (result[0] === 0) {
        throw new Error("No changes were made to the user.");
      }
    } catch (error) {
      console.error("Error updating user:", error);
  
      // Handle duplicate email error
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error("Email is already in use. Please choose a different one.");
      }
  
      // Handle other database errors
      throw new Error("Error updating user in database, check form: " + error.message);
    }
}


/**
 * Updates the url column for the profile photo
 * @param {number} userId The user id
 * @param {string} photoUrl The cloudinary url
 * @param {Object} transaction The transaction instance
 */
const updateProfilePhotoUrl = async (userId, photoUrl, transaction) => {
    try {
        console.log(`Updating profile photo for user ${userId} with URL: ${photoUrl || 'null'}`);
        
        // Skip update if photoUrl is undefined and we're not explicitly trying to set it to null
        if (photoUrl === undefined) {
            console.log("Photo URL is undefined, skipping profile photo update");
            return;
        }
        
        const result = await ProfilePhoto.update(
            { url: photoUrl },
            {
                where: { userId },
                transaction
            }
        );
        
        console.log(`Profile photo update result: ${JSON.stringify(result)}`);
        
        // Check if the update was successful
        if (result[0] === 0) {
            console.log("No profile photo record was updated. Checking if record exists...");
            
            // Check if profile photo record exists
            const photoRecord = await ProfilePhoto.findOne({ 
                where: { userId },
                transaction
            });
            
            // If no record exists, create one
            if (!photoRecord) {
                console.log("No profile photo record found. Creating new record.");
                await ProfilePhoto.create({ 
                    userId, 
                    url: photoUrl 
                }, { transaction });
            }
        }
    } catch (error) {
        console.error("Error updating the profile photo in db", error);
        throw new Error(`Failed to update profile photo: ${error.message}`);
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
            { folder: "profile-photos" }, (error, result) => {
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
    // add db operations
    addUserDb, addProfilePhotoDb, 
    // get db operations
    getUserDb, 
    // update db operations
    updateUserDb, updateProfilePhotoUrl, 
    // cloudinary operations
    uploadImage, deleteImage 
};
