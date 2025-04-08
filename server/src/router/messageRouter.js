const express = require('express');
const router = express.Router();

// Middleware imports
const validateToken = require('../middleware/validateToken');
const validateMessageContent = require('../middleware/validateMessageContent');

// Controller imports
const {
    createConversation,
    sendMessage,
    getUserConversations,
    getConversationMessages,
    getConversationById,
    getUnreadMessageCount,
    markMessageAsRead,
    deleteMessage,
    deleteConversation
} = require('../controller/messageController');

// Create a new conversation
router.post('/conversations', validateToken, createConversation);

// Get all conversations for a user
router.get('/conversations/user/:userId', validateToken, getUserConversations);

// Get a specific conversation
router.get('/conversations/:conversationId', validateToken, getConversationById);

// Get all messages for a conversation
router.get('/conversations/:conversationId/messages', validateToken, getConversationMessages);

// Send a new message
router.post('/messages', validateToken, validateMessageContent, sendMessage);

// Get unread message count for the current user
router.get('/unread-count', validateToken, getUnreadMessageCount);
router.get('/unread-count/:userId', validateToken, getUnreadMessageCount);

// Mark a message as read
router.patch('/messages/:messageId/read', validateToken, markMessageAsRead);

// Delete a message
router.delete('/messages/:messageId', validateToken, deleteMessage);

// Delete a conversation
router.delete('/conversations/:conversationId', validateToken, deleteConversation);

module.exports = router;