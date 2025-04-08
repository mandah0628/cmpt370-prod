/**
 * Middleware to validate message content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateMessageContent = (req, res, next) => {
    try {
        const { text } = req.body;
        
        // Check if text exists
        if (!text) {
            return res.status(400).json({ message: "Message text is required" });
        }
        
        // Check if text is a string
        if (typeof text !== 'string') {
            return res.status(400).json({ message: "Message text must be a string" });
        }
        
        // Check text length
        if (text.trim().length === 0) {
            return res.status(400).json({ message: "Message cannot be empty" });
        }
        
        if (text.length > 1000) {
            return res.status(400).json({ message: "Message is too long (maximum 1000 characters)" });
        }
        
        // If all validations pass, proceed to the next middleware/controller
        next();
    } catch (error) {
        console.error("Error validating message content:", error);
        res.status(500).json({ message: "Server error during message validation" });
    }
};

module.exports = validateMessageContent; 