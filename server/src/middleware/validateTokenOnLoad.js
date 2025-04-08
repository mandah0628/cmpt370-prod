// handler for verifying jwt
// when user first loads the application
// refer to AuthContext in client/src/app/context
const jwt = require('jsonwebtoken');

const validateTokenOnLoad = (req, res) => {
    // extract the authorization header
    const header = req.header("Authorization");
    // if there is no token
    if(!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({message: "Access restricted, no token"});
    }
    // get the token
    const token = header.split(" ")[1].trim();
    try {
        // verify the token authenticity
        jwt.verify(token, process.env.JWT_SECRET);
        // if token is valid
        res.status(200).json( { message : "Token is valid on load"} );
    } catch (error) {
        // if token is not valid
        return res.status(401).json({message:"Invalid token"});
    }
}

module.exports = validateTokenOnLoad;