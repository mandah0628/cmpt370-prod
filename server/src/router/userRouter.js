const express = require('express');
const router = express.Router();
const multer = require('multer');


// multer middlware to parse
// multipart form data
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } 
});

// middleware imports
const checkUserFields = require('../middleware/checkUserFields');
const validateCredentials = require('../middleware/validateCredentials');
const validateToken = require('../middleware/validateToken');
const generateToken = require('../middleware/generateToken');

//controller imports
const { createUser, getUser, updateUser, lookupUser } = require('../controller/userController');


// update profile route
router.put("/update-user", validateToken, upload.single('profile_image'), updateUser);

// delete user route
router.delete("/delete-user");

// get user profile route
router.get("/get-user", getUser);

// get account settings route
router.get("/account-settings", validateToken, getUser)

// route to lookup user by email
router.get("/lookup", validateToken, lookupUser);

// register route
router.post("/register", checkUserFields, createUser);

// login route
router.post("/login", validateCredentials, generateToken);


module.exports = router;