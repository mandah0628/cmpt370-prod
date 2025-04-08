// jwt validation middleware
const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
  try {
    // extract the authorization header
    const header = req.header("Authorization");

    // if there is no token
    if(!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({message: "Access restricted, no token"});
    }

    // get the token
    const token = header.split(" ")[1].trim();

    if (!token) {
      return res.status(401).json({message: "Invalid token format"});
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({message: "Server configuration error"});
    }
    
    try {
      // verify the token authenticity
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if the decoded token has the expected structure
      if (!decoded || !decoded.id) {
        return res.status(401).json({message: "Invalid token payload"});
      }

      // attaches the token payload(user info) to the request object
      req.user = decoded;
      
      // Log successful authentication for debugging
      console.log(`User authenticated: ${decoded.id}`);
      
      // next middleware
      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({message: "Token expired"});
      }
      
      return res.status(401).json({message: "Invalid token"});
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({message: "Authentication error"});
  }
}

module.exports = validateToken;