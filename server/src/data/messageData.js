const { Message, Conversation, User, Listing } = require('../model/index');
const sequelize = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Ensures the placeholder listing for direct messages exists
 * @returns {Promise<Object>} - The placeholder listing
 */
const ensurePlaceholderListingExists = async () => {
    try {
        const { Listing, User } = require('../model/index');
        const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000000";
        
        // Check if the placeholder listing already exists
        let placeholderListing = await Listing.findByPk(PLACEHOLDER_ID);
        
        // If it exists, return it
        if (placeholderListing) {
            return placeholderListing;
        }
        
        // Get the first user from the database to use as owner
        // In a real application, you'd have a system user for this
        const firstUser = await User.findOne({
            order: [['createdAt', 'ASC']]
        });
        
        if (!firstUser) {
            throw new Error("No users found in the database to assign as listing owner");
        }
        
        console.log("Creating placeholder listing for direct messages");
        placeholderListing = await Listing.create({
            id: PLACEHOLDER_ID,
            title: "Direct Message",
            description: "Placeholder for direct messages",
            category: "other",
            rate: 0,
            userId: firstUser.id,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log("Placeholder listing created successfully");
        
        return placeholderListing;
    } catch (error) {
        console.error("Error ensuring placeholder listing exists:", error);
        throw new Error(`Failed to ensure placeholder listing: ${error.message}`);
    }
};

/**
 * Creates a new conversation
 * @param {Object} conversationData - Data to create the conversation
 * @returns {Object} - The created conversation
 */
const createConversationDb = async (conversationData) => {
    try {
        console.log(`Creating conversation with data: ${JSON.stringify(conversationData, null, 2)}`);
        
        // Check if this is a direct message (using our placeholder UUID)
        if (conversationData.listingId === "00000000-0000-0000-0000-000000000000") {
            // Ensure our placeholder listing exists
            await ensurePlaceholderListingExists();
        }
        
        // Validate that buyer exists
        const { User, Conversation } = require('../model/index');
        const buyer = await User.findByPk(conversationData.buyerId);
        console.log(`Buyer found: ${buyer ? 'yes' : 'no'}`);
        if (!buyer) {
            throw new Error(`Buyer with ID ${conversationData.buyerId} not found`);
        }
        
        // Validate that seller exists
        const seller = await User.findByPk(conversationData.sellerId);
        console.log(`Seller found: ${seller ? 'yes' : 'no'}`);
        if (!seller) {
            throw new Error(`Seller with ID ${conversationData.sellerId} not found`);
        }
        
        // Create the conversation
        const newConversation = await Conversation.create({
            id: require('uuid').v4(),
            ...conversationData,
            lastMessagedAt: new Date()
        });
        
        return newConversation.toJSON();
    } catch (error) {
        console.error("Error creating conversation in database:", error.message);
        console.error("Full error:", error);
        throw new Error(`Could not create conversation in database: ${error.message}`);
    }
};

/**
 * Create a new message
 * @param {Object} messageData - Data for the new message
 * @returns {Promise<Object>} - The created message
 */
const createMessageDb = async (messageData) => {
    try {
        if (!messageData || typeof messageData !== 'object') {
            throw new Error('Invalid message data provided');
        }
        
        const { conversationId, senderId, text } = messageData;
        
        console.log(`Creating message: conversationId=${conversationId}, senderId=${senderId}`);
        
        // Create the message
        const newMessage = await Message.create({
            id: uuidv4(),
            conversationId,
            senderId,
            text,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`New message created with ID: ${newMessage.id}`);
        
        return newMessage;
    } catch (error) {
        console.error('Error creating message:', error);
        throw new Error(`Failed to create message: ${error.message}`);
    }
};

/**
 * Gets all conversations for a user (both as buyer and seller)
 * @param {string} userId - The user ID
 * @returns {Array} - Array of conversations
 */
const getUserConversationsDb = async (userId) => {
    try {
        // Log to help with debugging
        console.log(`DB: Finding conversations for userId: ${userId}`);
        
        // Check for invalid userId to prevent database errors
        if (!userId || typeof userId !== 'string') {
            console.error(`Invalid userId provided: ${userId}`);
            return []; // Return empty array instead of throwing error
        }
        
        // Properly import Op from sequelize
        const { Op } = require('sequelize');
        
        // First just get the conversation IDs to avoid complex query issues
        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [
                    { buyerId: userId },
                    { sellerId: userId }
                ]
            },
            order: [['lastMessagedAt', 'DESC']],
            attributes: ['id', 'buyerId', 'sellerId', 'listingId', 'lastMessagedAt', 'createdAt', 'updatedAt']
        });
        
        console.log(`Found ${conversations.length} conversation IDs for user ${userId}`);
        
        // If no conversations, return empty array
        if (conversations.length === 0) {
            return [];
        }
        
        // Now fetch details for each conversation individually to avoid join issues
        const conversationDetails = await Promise.all(
            conversations.map(async (conversation) => {
                try {
                    const conversationWithDetails = await Conversation.findByPk(conversation.id, {
                        include: [
                            {
                                model: User,
                                as: 'buyer',
                                attributes: ['id', 'name', 'email']
                            },
                            {
                                model: User,
                                as: 'seller',
                                attributes: ['id', 'name', 'email']
                            },
                            {
                                model: Listing,
                                attributes: ['id', 'title'],
                                required: false
                            }
                        ]
                    });
                    
                    // Get the most recent message separately
                    const recentMessages = await Message.findAll({
                        where: { conversationId: conversation.id },
                        limit: 1,
                        order: [['createdAt', 'DESC']],
                        include: [
                            {
                                model: User,
                                as: 'sender',
                                attributes: ['id', 'name']
                            }
                        ]
                    });
                    
                    const conversationJson = conversationWithDetails.toJSON();
                    
                    // Add last message details if available
                    if (recentMessages && recentMessages.length > 0) {
                        conversationJson.lastMessage = recentMessages[0].text;
                        conversationJson.lastMessageSender = recentMessages[0].sender;
                    }
                    
                    return conversationJson;
                } catch (error) {
                    console.error(`Error fetching details for conversation ${conversation.id}:`, error);
                    // Return basic conversation without details to avoid breaking the entire query
                    return conversation.toJSON();
                }
            })
        );
        
        return conversationDetails;
    } catch (error) {
        console.error(`Error fetching user conversations for userId ${userId}:`, error.message);
        console.error(`Full error:`, error);
        return []; // Return empty array instead of throwing error to prevent 500
    }
};

/**
 * Gets messages for a specific conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} since - Optional timestamp to get only newer messages
 * @param {number} limit - Optional limit of messages to return
 * @returns {Array} - Array of messages
 */
const getConversationMessagesDb = async (conversationId, since, limit = 100) => {
    try {
        const queryOptions = {
            where: { conversationId },
            order: [['createdAt', 'ASC']],
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name']
                }
            ],
            limit: limit
        };
        
        // If since is provided, add it to the where clause
        if (since) {
            try {
                // Ensure proper date format and handle potential timezone issues
                const sinceDate = new Date(since);
                
                // Validate that it's a valid date
                if (!isNaN(sinceDate.getTime())) {
                    // Subtract a small buffer (1 second) to prevent missing messages due to timestamp precision issues
                    sinceDate.setSeconds(sinceDate.getSeconds() - 1);
                    
                    queryOptions.where.createdAt = {
                        [Op.gt]: sinceDate
                    };
                    console.log(`Fetching messages newer than: ${sinceDate.toISOString()}`);
                } else {
                    console.warn(`Invalid date provided for 'since' parameter: ${since}`);
                }
            } catch (error) {
                console.error(`Error parsing 'since' date: ${since}`, error);
                // Continue without the since filter if there's an error
            }
        }
        
        const messages = await Message.findAll(queryOptions);
        
        return messages.map(message => message.toJSON());
    } catch (error) {
        console.error("Error fetching conversation messages:", error.message);
        throw new Error(`Could not fetch conversation messages: ${error.message}`);
    }
};

/**
 * Gets a specific conversation by ID
 * @param {string} conversationId - The conversation ID
 * @returns {Object} - The conversation
 */
const getConversationByIdDb = async (conversationId) => {
    try {
        const conversation = await Conversation.findByPk(conversationId, {
            include: [
                {
                    model: User,
                    as: 'buyer',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: User,
                    as: 'seller',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Listing,
                    attributes: ['id', 'title', 'price'],
                    required: false // Make the join optional so direct messages (null listingId) still appear
                }
            ]
        });
        
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        
        return conversation.toJSON();
    } catch (error) {
        console.error("Error fetching conversation:", error.message);
        throw new Error(`Could not fetch conversation: ${error.message}`);
    }
};

/**
 * Gets the count of unread messages for a user
 * @param {string} userId - The user ID
 * @returns {number} - Count of unread messages
 */
const getUnreadMessageCountDb = async (userId) => {
    try {
        // Ensure proper import of the Op object
        const { Op } = sequelize;
        
        // Find all conversations where user is buyer or seller
        const conversations = await Conversation.findAll({
            where: {
                [Op.or]: [
                    { buyerId: userId },
                    { sellerId: userId }
                ]
            },
            attributes: ['id']
        });
        
        const conversationIds = conversations.map(conv => conv.id);
        
        // If no conversations found, return 0
        if (conversationIds.length === 0) {
            return 0;
        }
        
        // Since isRead field doesn't exist yet, just count messages not sent by this user
        // Modify this once you add the isRead column to the database
        const count = await Message.count({
            where: {
                conversationId: {
                    [Op.in]: conversationIds
                },
                senderId: {
                    [Op.ne]: userId // Not sent by this user
                }
                // Removed isRead: false since the column doesn't exist yet
            }
        });
        
        return count;
    } catch (error) {
        console.error("Error getting unread message count:", error.message);
        throw new Error(`Could not get unread message count: ${error.message}`);
    }
};

/**
 * Mark a message as read
 * @param {string} messageId - The message ID
 * @param {string} userId - The user ID marking the message as read
 * @returns {boolean} - Success indicator
 */
const markMessageAsReadDb = async (messageId, userId) => {
    try {
        const message = await Message.findByPk(messageId, {
            include: [{
                model: Conversation,
                as: 'conversation'
            }]
        });
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        // Only mark as read if user is part of the conversation and not the sender
        const conversation = message.conversation;
        if (!conversation) {
            throw new Error('Conversation not found for this message');
        }
        
        const isUserInConversation = 
            conversation.buyerId === userId || 
            conversation.sellerId === userId;
        
        if (!isUserInConversation) {
            throw new Error('User is not part of this conversation');
        }
        
        // Don't update if user is the sender
        if (message.senderId === userId) {
            return false; // Nothing to update
        }
        
        // Update the message
        // Note: since isRead field doesn't exist yet, we'll just acknowledge it
        // but not actually update anything in the database
        // await message.update({ isRead: true });
        console.log(`Would mark message ${messageId} as read (feature not implemented yet)`);
        
        return true;
    } catch (error) {
        console.error("Error marking message as read:", error.message);
        throw new Error(`Could not mark message as read: ${error.message}`);
    }
};

/**
 * Delete a message from the database
 * @param {string} messageId - The ID of the message to delete
 * @param {string} userId - The ID of the user requesting deletion (for authorization)
 * @returns {boolean} - Success indicator
 */
const deleteMessageDb = async (messageId, userId) => {
    try {
        if (!messageId || !userId) {
            throw new Error('Message ID and User ID are required');
        }
        
        // First, get the message to check if the user is allowed to delete it
        const message = await Message.findByPk(messageId, {
            include: [{
                model: Conversation,
                as: 'conversation'
            }]
        });
        
        if (!message) {
            throw new Error('Message not found');
        }
        
        // Verify the user is the sender of the message
        if (message.senderId !== userId) {
            throw new Error('You can only delete your own messages');
        }
        
        // Delete the message
        const deletedCount = await Message.destroy({
            where: { id: messageId }
        });
        
        console.log(`Deleted message ${messageId}, count: ${deletedCount}`);
        
        return deletedCount > 0;
    } catch (error) {
        console.error(`Error deleting message ${messageId}:`, error);
        throw new Error(`Failed to delete message: ${error.message}`);
    }
};

/**
 * Delete a conversation and all its messages
 * @param {string} conversationId - UUID of the conversation to delete
 * @param {string} userId - UUID of the user deleting the conversation
 * @returns {boolean} - Success indicator
 */
const deleteConversationDb = async (conversationId, userId) => {
    try {
        if (!conversationId || !userId) {
            throw new Error('Conversation ID and User ID are required');
        }
        
        // First, verify the conversation exists and the user is a participant
        const conversation = await Conversation.findByPk(conversationId);
        
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        
        // Verify the user is part of the conversation
        if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
            throw new Error('You do not have permission to delete this conversation');
        }
        
        // Delete all messages in the conversation first
        await Message.destroy({
            where: { conversationId: conversationId }
        });
        
        // Then delete the conversation
        const deletedCount = await Conversation.destroy({
            where: { id: conversationId }
        });
        
        console.log(`Deleted conversation ${conversationId}, count: ${deletedCount}`);
        
        return deletedCount > 0;
    } catch (error) {
        console.error(`Error deleting conversation ${conversationId}:`, error);
        throw new Error(`Failed to delete conversation: ${error.message}`);
    }
};

module.exports = {
    createConversationDb,
    createMessageDb,
    getUserConversationsDb,
    getConversationMessagesDb,
    getConversationByIdDb,
    getUnreadMessageCountDb,
    markMessageAsReadDb,
    deleteMessageDb,
    deleteConversationDb
};