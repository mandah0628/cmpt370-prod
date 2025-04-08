// generates a token
const jwt = require('jsonwebtoken');

const generateToken = async (req,res) => {
    try {
        const user = req.user ;
        
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" } 
        );

        console.log("Token generated successfully");
        // sends back response with the token and the status code 200(default code)
        res.json({token});
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ message: "Error generating token", error: error.message });
    }
}

module.exports = generateToken;