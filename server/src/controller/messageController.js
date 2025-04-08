const {
    createConversationDb,
    createMessageDb,
    getUserConversationsDb,
    getConversationMessagesDb,
    getConversationByIdDb,
    getUnreadMessageCountDb,
    markMessageAsReadDb,
    deleteMessageDb,
    deleteConversationDb
} = require('../data/messageData');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Create a new conversation
 */
const createConversation = async (req, res) => {
    try {
        let { listingId, buyerId, sellerId } = req.body;
        
        if (!buyerId || !sellerId) {
            return res.status(400).json({ 
                message: "Missing required fields: buyerId and sellerId are required"
            });
        }
        
        // If no listingId is provided, create a direct message by using a placeholder ID
        // This is a workaround for databases that don't support NULL for listingId
        if (!listingId) {
            // This is a hardcoded UUID that will be treated as a special "direct message" ID
            // This approach avoids database schema changes
            listingId = "00000000-0000-0000-0000-000000000000";
            console.log("Creating direct message with placeholder listingId");
        }
        
        // Validate UUID format for user IDs
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if ((!isValidUUID.test(buyerId) || !isValidUUID.test(sellerId) || 
            (listingId && !isValidUUID.test(listingId)))) {
            return res.status(400).json({ message: "Invalid UUID format for buyerId, sellerId, or listingId" });
        }
        
        // Check if the users exist
        const { User, Listing } = require('../model/index');
        
        const buyer = await User.findByPk(buyerId);
        if (!buyer) {
            return res.status(404).json({ message: "Buyer not found with the provided ID" });
        }
        
        const seller = await User.findByPk(sellerId);
        if (!seller) {
            return res.status(404).json({ message: "Seller not found with the provided ID" });
        }
        
        // Check if conversation already exists between these users
        // For direct messages, check conversations with our placeholder listingId
        const { Conversation } = require('../model/index');
        let existingConversation;
        
        if (listingId === "00000000-0000-0000-0000-000000000000") {
            // For direct messaging, check if the users have any direct message conversation already
            // We'll check both possibilities (user A is buyer, user B is seller OR user A is seller, user B is buyer)
            existingConversation = await Conversation.findOne({
                where: {
                    [Op.or]: [
                        {
                            buyerId,
                            sellerId,
                            listingId
                        },
                        {
                            buyerId: sellerId,
                            sellerId: buyerId,
                            listingId
                        }
                    ]
                }
            });
        } else {
            // If there's a regular listingId, check for a conversation about that specific listing
            existingConversation = await Conversation.findOne({
                where: {
                    listingId,
                    buyerId,
                    sellerId
                }
            });
        }
        
        if (existingConversation) {
            return res.status(200).json({
                message: "Conversation already exists",
                conversation: existingConversation.toJSON()
            });
        }

        // Create a new conversation
        const conversationData = {
            listingId,
            buyerId,
            sellerId
        };

        const newConversation = await createConversationDb(conversationData);
        
        res.status(201).json({
            message: "Conversation created successfully",
            conversation: newConversation
        });
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ message: "Failed to create conversation", error: error.message });
    }
};

/**
 * Send a new message
 */
const sendMessage = async (req, res) => {
    try {
        const { conversationId, senderId, text } = req.body;
        
        console.log(`Attempting to send message: conversationId=${conversationId}, senderId=${senderId}`);
        
        if (!conversationId || !senderId || !text) {
            return res.status(400).json({ 
                message: "Missing required fields: conversationId, senderId, and text are required"
            });
        }

        // Validate UUID format for conversationId and senderId
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!isValidUUID.test(conversationId)) {
            return res.status(400).json({ message: "Invalid conversationId format" });
        }
        if (!isValidUUID.test(senderId)) {
            return res.status(400).json({ message: "Invalid senderId format" });
        }

        // Simple check if conversation exists - just query by ID
        const { Conversation } = require('../model/index');
        const conversation = await Conversation.findByPk(conversationId);
        
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        
        // Basic validation that sender is part of the conversation
        if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
            return res.status(403).json({ message: "User is not part of this conversation" });
        }

        // Create the message in the database
        const messageData = {
            conversationId,
            senderId,
            text
        };

        // Add message to database
        const newMessage = await createMessageDb(messageData);
        
        // Update conversation lastMessagedAt
        await Conversation.update(
            { lastMessagedAt: new Date() },
            { where: { id: conversationId } }
        );
        
        // Return success response
        res.status(201).json({
            status: "success",
            message: "Message sent successfully",
            data: newMessage
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message", error: error.message });
    }
};

/**
 * Get all conversations for a user
 */
const getUserConversations = async (req, res) => {
    try {
        // Try to get userId from params, or fall back to token user
        const userId = req.params.userId || req.user?.id;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        
        console.log(`Fetching conversations for user: ${userId}`);

        try {
            // Wrap the database call in its own try/catch to handle database errors gracefully
            const conversations = await getUserConversationsDb(userId);
            
            return res.status(200).json({
                message: "Conversations retrieved successfully",
                conversations
            });
        } catch (dbError) {
            console.error("Database error retrieving conversations:", dbError);
            return res.status(500).json({ 
                message: "Error accessing conversation data",
                error: "Database error"
            });
        }
    } catch (error) {
        console.error("Error in getUserConversations controller:", error);
        // Return a more generic error message to the client for security
        return res.status(500).json({ 
            message: "Failed to retrieve conversations",
            error: "Internal server error"
        });
    }
};

/**
 * Get all messages for a conversation
 */
const getConversationMessages = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        const since = req.query.since; // Get 'since' timestamp query parameter
        const limit = req.query.limit ? parseInt(req.query.limit) : 100; // Optional limit parameter
        
        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }

        // Get messages with optional timestamp filter
        const messages = await getConversationMessagesDb(conversationId, since, limit);
        
        res.status(200).json({
            message: "Messages retrieved successfully",
            messages
        });
    } catch (error) {
        console.error("Error retrieving messages:", error);
        res.status(500).json({ message: "Failed to retrieve messages", error: error.message });
    }
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (req, res) => {
    try {
        const conversationId = req.params.conversationId;
        
        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }

        const conversation = await getConversationByIdDb(conversationId);
        
        res.status(200).json({
            message: "Conversation retrieved successfully",
            conversation
        });
    } catch (error) {
        console.error("Error retrieving conversation:", error);
        res.status(500).json({ message: "Failed to retrieve conversation", error: error.message });
    }
};

/**
 * Get unread message count for a user
 */
const getUnreadMessageCount = async (req, res) => {
    try {
        // Get userId either from the token or from params
        const userId = req.user?.id || req.params.userId || req.query.userId;
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const unreadCount = await getUnreadMessageCountDb(userId);
        
        res.status(200).json({
            unreadCount
        });
    } catch (error) {
        console.error("Error getting unread message count:", error);
        res.status(500).json({ message: "Failed to get unread message count", error: error.message });
    }
};

/**
 * Mark a message as read
 */
const markMessageAsRead = async (req, res) => {
    try {
        const { messageId } = req.params;
        // Get userId either from the token or from params/body
        const userId = req.user?.id || req.body.userId || req.query.userId;
        
        if (!messageId) {
            return res.status(400).json({ message: "Message ID is required" });
        }
        
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const result = await markMessageAsReadDb(messageId, userId);
        
        res.status(200).json({
            message: "Message marked as read",
            success: result
        });
    } catch (error) {
        console.error("Error marking message as read:", error);
        res.status(500).json({ message: "Failed to mark message as read", error: error.message });
    }
};

/**
 * Delete a message
 */
const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        // Get userId from token or params/query
        const userId = req.user?.id || req.query.userId;
        
        if (!messageId) {
            return res.status(400).json({ message: "Message ID is required" });
        }
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        
        console.log(`Attempting to delete message: ${messageId} by user: ${userId}`);
        
        // Validate UUID format
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!isValidUUID.test(messageId)) {
            return res.status(400).json({ message: "Invalid message ID format" });
        }
        
        try {
            const result = await deleteMessageDb(messageId, userId);
            
            if (result) {
                return res.status(200).json({
                    message: "Message deleted successfully"
                });
            } else {
                return res.status(404).json({
                    message: "Message not found or could not be deleted"
                });
            }
        } catch (dbError) {
            console.error("Database error deleting message:", dbError);
            
            if (dbError.message === 'You can only delete your own messages') {
                return res.status(403).json({ 
                    message: dbError.message
                });
            }
            
            if (dbError.message === 'Message not found') {
                return res.status(404).json({ 
                    message: dbError.message
                });
            }
            
            return res.status(500).json({ 
                message: "Error deleting message",
                error: "Database error"
            });
        }
    } catch (error) {
        console.error("Error in deleteMessage controller:", error);
        return res.status(500).json({ 
            message: "Failed to delete message",
            error: "Internal server error"
        });
    }
};

/**
 * Delete a conversation and all its messages
 */
const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        // Get userId from token or params/query
        const userId = req.user?.id || req.query.userId;
        
        if (!conversationId) {
            return res.status(400).json({ message: "Conversation ID is required" });
        }
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }
        
        console.log(`Attempting to delete conversation: ${conversationId} by user: ${userId}`);
        
        // Validate UUID format
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!isValidUUID.test(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation ID format" });
        }
        
        try {
            const result = await deleteConversationDb(conversationId, userId);
            
            if (result) {
                return res.status(200).json({
                    message: "Conversation deleted successfully"
                });
            } else {
                return res.status(404).json({
                    message: "Conversation not found or could not be deleted"
                });
            }
        } catch (dbError) {
            console.error("Database error deleting conversation:", dbError);
            
            if (dbError.message === 'You do not have permission to delete this conversation') {
                return res.status(403).json({ 
                    message: dbError.message
                });
            }
            
            if (dbError.message === 'Conversation not found') {
                return res.status(404).json({ 
                    message: dbError.message
                });
            }
            
            return res.status(500).json({ 
                message: "Error deleting conversation",
                error: "Database error"
            });
        }
    } catch (error) {
        console.error("Error in deleteConversation controller:", error);
        return res.status(500).json({ 
            message: "Failed to delete conversation",
            error: "Internal server error"
        });
    }
};

module.exports = {
    createConversation,
    sendMessage,
    getUserConversations,
    getConversationMessages,
    getConversationById,
    getUnreadMessageCount,
    markMessageAsRead,
    deleteMessage,
    deleteConversation
}; 