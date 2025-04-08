const bcrypt = require('bcrypt');
const User = require('../model/user/User');

const validateCredentials = async (req,res,next) => {
    const {email, password} = req.body;

    try {
        // sequelize tries to find a user with the matching email,
        // and returns the user object
        const user = await User.findOne( {where: {email}} );

        // invalid credentials
        if(!user){
            return res.status(401).json({message: "Invalid name or password"});
        }

        // server side password validation
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // invalid credentials
        if(!isPasswordValid){
            return res.status(401).json({message: "Invalid name or password"});
        }

        req.user = user;

        next();

    // other server errors
    } catch (error) {
        res.status(500).json( {message: "Server error", error: error.message} );
    }
}


module.exports = validateCredentials;
