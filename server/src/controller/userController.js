const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sequelize } = require('../model')
const { 
    // add db operations
    addUserDb, addProfilePhotoDb, 
    // get db operations
    getUserDb, 
    // update db operations
    updateUserDb, updateProfilePhotoUrl, 
    // cloudinary operations
    uploadImage, deleteImage 
} = require('../data/userData');


// creates a user and profile photo entries in the db
const createUser = async (req, res) => {
    let transaction;
    try {
        // EXTRACT ALL THE DATA 
        const { name, email, password } = req.body;

        // 1) creates a hashed password
        const hashedPassword = await bcrypt.hash(password, 10);

        // start transaction
        transaction = await sequelize.transaction();

        // 2) creates the user in database
        const user = await addUserDb(
            {
                name,
                email,
                password: hashedPassword
            }
        );

        const userId = user.id;

        // 3) creates profile photo row(uses default value for the url)
        await addProfilePhotoDb(userId);

        // commit transaction
        await transaction.commit();

        // IF ALL DB OPERATIONS ARE SUCCESSFUL

        // 4)generate token
        const token = jwt.sign(
            { id : user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } 
        );

        // send token back to authenticat user right away
        res.status(201).json({ 
            message : "Account successfully created",
            token
        });

    } catch (error) {
        console.error("Error regstering:", error);
        res.status(500).json({ error : "Server side error"});
    }
};


  

// updates user info and profile photo 
const updateUser = async (req, res) => {    
    let transaction;
    let newUrl;
    try {
        // EXTRACT ALL DATA
        console.log("Update user request received:", { 
            userId: req.user?.id,
            hasFile: !!req.file,
            fileSize: req.file ? req.file.size : 'N/A',
            bodyFields: Object.keys(req.body)
        });

        // extract userId
        const userId = req.user.id;

        // new uploaded photo
        const newPhoto = req.file;

        // updated fields
        const updatedFields = { ...req.body };
        
        // 1) get the user's profile photo url, if there is any
        // set to 'null' if user does not have a profile photo
        const userData = await getUserDb(userId);
        const oldUrl = userData?.profilePhoto?.url ?? null;
        console.log("Current profile photo URL:", oldUrl);

        // 2) if there is an uploaded file
        // upload to cloudinary to get the url
        if (newPhoto) {
            console.log(`Uploading new photo: ${newPhoto.originalname}, size: ${newPhoto.size} bytes`);
            try {
                newUrl = await uploadImage(newPhoto.buffer);
                console.log("Uploaded to Cloudinary, new URL:", newUrl);
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }
        } else {
            console.log("No new photo provided");
        }
      
        // start transaction
        transaction = await sequelize.transaction();
        
        // 3) update user fields
        console.log("Updating user fields:", updatedFields);
        await updateUserDb(userId, updatedFields, transaction);

        // 4) update profile photo url only if there's a new photo
        if (newPhoto) {
            console.log("Updating profile photo URL in database");
            await updateProfilePhotoUrl(userId, newUrl, transaction);
        }

        // 5) commit transaction
        console.log("Committing transaction");
        await transaction.commit();

        // IF ALL DB OPERATIONS ARE SUCCESSFUL

        // delete old photo from cloudinary
        // if user had one already and a new one was uploaded
        if (oldUrl && newPhoto) {
            console.log("Deleting old photo from Cloudinary:", oldUrl);
            await deleteImage(oldUrl);
        }

        // fetch all the updated user data
        console.log("Fetching updated user data");
        const user = await getUserDb(userId);
        
        console.log("User update successful");
        res.status(200).json({ message: "User successfully updated", user });
    } catch (error) {
        console.error("Error updating user details:", error);

        // if one of the db operations is unsuccessful
        // rollback every db operation prior to it
        if (transaction) {
            console.log("Rolling back transaction due to error");
            await transaction.rollback();
        }

        // delete the newly uploaded image from cloudinary to optimize space
        if (newUrl) {
            console.log("Deleting uploaded image due to error:", newUrl);
            await deleteImage(newUrl);
        }

        res.status(500).json({ message: error.message });
    }
};



// gets user info
const getUser = async (req,res) => {
    try {
        const userId = req.user.id;

        const user = await getUserDb(userId);

        if(!user){
            res.status(404).json( {message : "User not found"} );
        }

        res.status(200).json( {message : "User found", user} );
    } catch (error) {
        console.error("Error fetching listing", error);
        res.status(500).json({message: "Server side error. Error fetching user", error: error.message} );
    }
}

/**
 * Look up a user by email
 * @param {Object} req - Express request object with email in query params
 * @param {Object} res - Express response object
 * @returns {Object} - User data or error message
 */
const lookupUser = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log(`Looking up user with email: ${email}`);

    const { User } = require('../model/index');
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'name', 'email']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'User found',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error looking up user:', error);
    return res.status(500).json({ 
      message: 'Failed to look up user', 
      error: error.message 
    });
  }
};


module.exports = {
    createUser, getUser, updateUser, lookupUser
}