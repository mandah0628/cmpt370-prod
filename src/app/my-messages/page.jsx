"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';

export default function MyMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState(null);
  const [unreadCount, setUnreadCount] = useState({});
  const pollIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastPolledAtRef = useRef(Date.now());
  
  const { authState, authLoading } = useAuth();
  
  // Fetch conversations when component mounts
  useEffect(() => {
    if (!authLoading && authState) {
      fetchUserConversations();
      // Remove fetchAvailableUsers since we'll use direct ID input
    }
  }, [authLoading, authState]);
  
  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      // Clear all messages first to prevent showing old messages
      setMessages([]);
      setLastMessageTimestamp(null);
      fetchMessages(selectedConversation.id);
      
      // Set up polling for new messages
      setupMessagePolling(selectedConversation.id);
      
      // Clean up polling when conversation changes
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [selectedConversation]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);
  
  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);
  
  // Add smooth transitions for messages
  useEffect(() => {
    // Add CSS for smooth transitions
    const style = document.createElement('style');
    style.textContent = `
      .messages-container {
        transition: background-color 0.3s ease-out;
      }
      
      .message-item {
        opacity: 1;
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;
      }
      
      .message-item.new-message {
        animation: highlight-fade 1.5s ease-out;
      }
      
      @keyframes highlight-fade {
        0% { background-color: transparent; }
        100% { background-color: transparent; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Improved scrollToBottom with smoother behavior
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto', 
        block: 'end' 
      });
    }
  };
  
  const fetchUserConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Decode the token to get the user ID
      if (!token) {
        console.error('No token found');
        setIsLoading(false);
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Get user ID from the JWT token with error handling
      let userId;
      try {
        userId = jwtDecode(token).id;
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        setIsLoading(false);
        setError('Invalid authentication token. Please log in again.');
        return;
      }
      
      if (!userId) {
        console.error('No user ID found in token');
        setIsLoading(false);
        setError('User identification failed. Please try logging in again.');
        return;
      }
      
      console.log(`Fetching conversations for user: ${userId}`);
      console.log(`Using token: ${token.substring(0, 15)}...`); // Only log part of the token for security
      
      // Add error handling and timeout to the axios request
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations/user/${userId}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      ).catch(error => {
        console.error('Axios error details:', error.response?.data || error.message);
        throw error;
      });
      
      console.log('Conversations response:', response.data);
      
      if (response.data && response.data.conversations) {
        setConversations(response.data.conversations);
        
        // If there are conversations, select the first one
        if (response.data.conversations.length > 0) {
          setSelectedConversation(response.data.conversations[0]);
        }
      }
      setError(''); // Clear any existing error
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // More user-friendly error message with specific details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error (${error.response.status}): ${error.response.data.message || 'Could not load conversations'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('Could not load your conversations. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMessages = async (conversationId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Only fetch messages for the currently selected conversation
      if (selectedConversation?.id !== conversationId) {
        setIsLoading(false);
        return;
      }
      
      console.log(`Fetching messages for conversation: ${conversationId}`);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.messages) {
        // Ensure no duplicate messages with the same ID
        const uniqueMessages = [];
        const messageIds = new Set();
        const existingIds = new Set(messages.map(m => m.id));
        
        response.data.messages.forEach(message => {
          if (!messageIds.has(message.id)) {
            messageIds.add(message.id);
            
            // Mark messages as new if they weren't in our previous set
            if (!existingIds.has(message.id) && !message.id.startsWith('temp-')) {
              message.isNew = true;
            }
            
            uniqueMessages.push(message);
          } else {
            console.warn(`Duplicate message ID found: ${message.id}`);
          }
        });
        
        // Sort messages by creation date
        uniqueMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Only update state if this is still the selected conversation
        if (selectedConversation?.id === conversationId) {
          setMessages(uniqueMessages);
          
          // Set the timestamp of the most recent message for future polling
          if (uniqueMessages.length > 0) {
            const sortedMessages = [...uniqueMessages].sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            );
            setLastMessageTimestamp(sortedMessages[0].createdAt);
          }
          
          // Trigger scroll to bottom with a slight delay
          setTimeout(() => scrollToBottom(false), 100);
          
          // Clear new message flags after 2 seconds
          setTimeout(() => {
            setMessages(prev => prev.map(m => ({...m, isNew: false})));
          }, 2000);
        }
      }
      setError(''); // Clear any existing error
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Could not load messages. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const lookupUser = async (email) => {
    try {
      if (!email) return null;
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required to look up users.');
        return null;
      }
      
      console.log(`Looking up user with email: ${email}`);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/lookup?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.user) {
        console.log('User found:', response.data.user);
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Error looking up user:', error);
      setError(error.response?.data?.message || 'Failed to look up user');
      return null;
    }
  };
  
  const fetchConversationDetails = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return null;
      }
      
      console.log(`Fetching complete details for conversation: ${conversationId}`);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.conversation) {
        return response.data.conversation;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      return null;
    }
  };
  
  const startNewConversation = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!recipientEmail) {
        setError('Please enter a recipient email');
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }
      
      // Get the current user ID from the token with error handling
      let userId;
      try {
        userId = jwtDecode(token).id;
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        setIsLoading(false);
        setError('Invalid authentication token. Please log in again.');
        return;
      }
      
      if (!userId) {
        setError('Could not retrieve user ID from token');
        setIsLoading(false);
        return;
      }
      
      // Look up recipient by email
      const recipient = await lookupUser(recipientEmail);
      if (!recipient) {
        setError(`User with email ${recipientEmail} not found`);
        setIsLoading(false);
        return;
      }
      
      // Prevent starting conversation with yourself
      if (recipient.id === userId) {
        setError('You cannot start a conversation with yourself');
        setIsLoading(false);
        return;
      }
      
      // Create a direct message conversation
      console.log(`Creating conversation between ${userId} and ${recipient.id}`);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations`,
        {
          // Use a placeholder UUID for direct messages
          listingId: "00000000-0000-0000-0000-000000000000",
          buyerId: userId,
          sellerId: recipient.id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const newConversation = response.data.conversation;
      console.log('New conversation created:', newConversation);
      
      // Get the current user's ID to determine if they're the buyer or seller
      const currentUserId = jwtDecode(token).id;
      const isCurrentUserBuyer = currentUserId === userId;
      
      // Instead of adding otherUser property, properly structure the object
      // to match what comes from the server with buyer and seller objects
      if (isCurrentUserBuyer) {
        // Current user is buyer, add seller info
        newConversation.seller = {
          id: recipient.id,
          name: recipient.name,
          email: recipient.email
        };
        // Also ensure buyer info exists
        newConversation.buyer = {
          id: currentUserId,
          name: 'You' // This will be replaced when fetched from server
        };
      } else {
        // Current user is seller, add buyer info
        newConversation.buyer = {
          id: recipient.id,
          name: recipient.name,
          email: recipient.email
        };
        // Also ensure seller info exists
        newConversation.seller = {
          id: currentUserId,
          name: 'You' // This will be replaced when fetched from server
        };
      }
      
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setRecipientEmail('');
      
      // Fetch complete conversation details after creation
      // to ensure we have accurate user information
      const completeConversation = await fetchConversationDetails(newConversation.id);
      if (completeConversation) {
        // Update conversations list with complete data
        setConversations(prev => 
          prev.map(conv => 
            conv.id === completeConversation.id ? completeConversation : conv
          )
        );
        
        // Update selected conversation if it's the one we just created
        if (selectedConversation && selectedConversation.id === completeConversation.id) {
          setSelectedConversation(completeConversation);
        }
      }
      
      // Focus on message input
      setTimeout(() => {
        const messageInput = document.getElementById('message-input');
        if (messageInput) messageInput.focus();
      }, 100);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    // Don't send empty messages
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }
    
    // Validate that we have a valid selectedConversation with an ID
    if (!selectedConversation.id) {
      setError('Invalid conversation selected');
      return;
    }
    
    // Get the auth token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required to send messages');
      return;
    }
    
    // Get current user ID from token with error handling
    let userId;
    try {
      userId = jwtDecode(token).id;
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
      setError('Invalid authentication token. Please log in again.');
      return;
    }
    
    if (!userId) {
      setError('Could not retrieve user ID from token');
      return;
    }
    
    // Create message data
    const messageData = {
      conversationId: selectedConversation.id,
      senderId: userId,
      text: newMessage
    };
    
    // Clear input field right away for better UX
    const tempMessageText = newMessage;
    setNewMessage('');
    
    // Create a temporary message for optimistic UI update
    const tempMessageId = 'temp-' + Date.now();
    const tempMessage = {
      id: tempMessageId,
      text: tempMessageText,
      createdAt: new Date().toISOString(),
      senderId: userId,
      isOptimistic: true,
      sender: {
        id: userId,
        name: 'You'
      }
    };
    
    // Add temp message to UI immediately
    setMessages(prev => {
      const updated = [...prev, tempMessage];
      return updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    // Scroll to bottom to show new message
    setTimeout(() => scrollToBottom(false), 50);
    
    try {
      // Send message to server
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/messages`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.message) {
        // Replace the temporary message with the real one
        const realMessage = response.data.data || response.data.message;
        
        // Check if we already have this message (could happen with real-time updates)
        const messageExists = messages.some(
          msg => msg.id === realMessage.id && msg.id !== tempMessageId
        );
        
        if (messageExists) {
          // Just remove the temp message without adding a duplicate
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg.id !== tempMessageId)
          );
        } else {
          // Replace the temporary message with the real one
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === tempMessageId ? { ...realMessage, sender: { id: userId, name: 'You' } } : msg
            )
          );
        }
        
        // Update the conversation list to show the new message is at the top
        setConversations(prevConversations => {
          // Move the current conversation to the top of the list
          const updatedConversations = prevConversations.filter(
            conv => conv.id !== selectedConversation.id
          );
          return [
            { ...selectedConversation, lastMessage: tempMessageText }, 
            ...updatedConversations
          ];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove the optimistic message
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== tempMessageId)
      );
      
      // Restore the message text to allow retry
      setNewMessage(tempMessageText);
      
      // Show error message
      setError(
        error.response?.data?.message || 
        'Failed to send message. Please try again.'
      );
    }
  };

  const deleteMessage = async (messageId) => {
    if (!messageId) return;
    
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required to delete messages');
        return;
      }
      
      setIsLoading(true);
      
      // Call the API to delete the message
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Remove the message from the UI
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        setSuccess('Message deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      let errorMessage = 'Failed to delete message';
      
      if (error.response?.status === 403) {
        errorMessage = 'You can only delete your own messages';
      } else if (error.response?.status === 404) {
        errorMessage = 'Message not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteConversation = async (conversationId) => {
    if (!conversationId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required to delete conversations');
        return;
      }
      
      setIsLoading(true);
      
      // Call the API to delete the conversation
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Remove the conversation from the UI
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== conversationId)
        );
        
        // If the deleted conversation was selected, clear the selection
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
        
        setSuccess('Conversation deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      let errorMessage = 'Failed to delete conversation';
      
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this conversation';
      } else if (error.response?.status === 404) {
        errorMessage = 'Conversation not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };
  
  // Confirmation dialog component
  const DeleteConfirmDialog = ({ conversationId, onCancel }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-5 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-lg font-bold mb-3">Delete Conversation</h3>
          <p className="mb-5">Are you sure you want to delete this entire conversation? This action cannot be undone and all messages will be permanently removed.</p>
          <div className="flex justify-end space-x-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => deleteConversation(conversationId)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Display notification component
  const Notification = ({ message, type }) => {
    if (!message) return null;
    
    const bgColor = type === 'error' ? 'bg-red-100' : 'bg-green-100';
    const textColor = type === 'error' ? 'text-red-700' : 'text-green-700';
    
    return (
      <div className={`${bgColor} ${textColor} p-3 rounded mb-4 flex justify-between items-center`}>
        <span>{message}</span>
        <button 
          onClick={() => type === 'error' ? setError('') : setSuccess('')}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    );
  };
  
  // Append new messages with deduplication
  const appendMessages = (prevMessages, newMessages) => {
    // Create a Set of existing message IDs for faster lookup
    const existingIds = new Set(prevMessages.map(m => m.id));
    
    // Create a Map to track duplicates
    const messageMap = new Map();
    
    // First, add all existing messages to the map
    prevMessages.forEach(msg => {
      messageMap.set(msg.id, msg);
    });
    
    // Add new messages, avoiding duplicates
    let hasNewMessages = false;
    newMessages.forEach(msg => {
      // Skip if this is a temporary message or already exists
      if (msg.id.startsWith('temp-') || messageMap.has(msg.id)) {
        if (messageMap.has(msg.id) && !msg.id.startsWith('temp-')) {
          console.debug(`Skipping duplicate message: ${msg.id}`);
        }
        return;
      }
      
      // Mark as new and add to map
      msg.isNew = true;
      messageMap.set(msg.id, msg);
      hasNewMessages = true;
    });
    
    // Convert map back to array and sort by creation date
    const result = Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    return { messages: result, hasNewMessages };
  };

  // Poll for new messages
  const pollForNewMessages = async (conversationId) => {
    // Don't poll too frequently - ensure at least 1 second between polls
    const now = Date.now();
    if (now - lastPolledAtRef.current < 1000) {
      return;
    }
    lastPolledAtRef.current = now;

    // Skip polling if this is not the currently selected conversation
    if (selectedConversation?.id !== conversationId) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found for polling');
        return;
      }
      
      // Check if token is expired
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp && decoded.exp < currentTime) {
          console.warn('Authentication token has expired, please log in again');
          // Don't show error to user every poll cycle, but could redirect to login
          return;
        }
      } catch (tokenError) {
        console.error('Error checking token validity:', tokenError);
        return;
      }
      
      // Only fetch messages newer than the newest one we have
      let timestamp = lastMessageTimestamp;
      if (!timestamp && messages.length > 0) {
        // Find the newest message
        const newestMessage = [...messages].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        timestamp = newestMessage.createdAt;
      }
      
      // If we don't have any messages yet, don't include timestamp
      const timestampParam = timestamp ? `&since=${encodeURIComponent(timestamp)}` : '';
      
      // Add a random cache-busting parameter to prevent caching issues
      const cacheBuster = `&_=${Date.now()}`;
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/conversations/${conversationId}/messages?limit=100${timestampParam}${cacheBuster}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout for polling requests
        }
      );
      
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        // Get current user ID to determine which messages are mine
        const currentUserId = jwtDecode(token).id;
        
        // Use our new function for deduplication
        const { messages: updatedMessages, hasNewMessages } = appendMessages(
          messages,
          response.data.messages
        );
        
        if (hasNewMessages) {
          console.log(`Received new messages for conversation ${conversationId}`);
          
          // Only update if there are new messages
          if (selectedConversation?.id === conversationId) {
            // Set the updated messages
            setMessages(updatedMessages);
            
            // Find the newest message for timestamp update
            const newestMessage = updatedMessages.reduce(
              (newest, msg) => new Date(msg.createdAt) > new Date(newest.createdAt) ? msg : newest,
              updatedMessages[0]
            );
            
            setLastMessageTimestamp(newestMessage.createdAt);
            
            // Trigger scroll to bottom with a slight delay
            setTimeout(() => scrollToBottom(false), 100);
            
            // Clear new message flags after 2 seconds
            setTimeout(() => {
              setMessages(prev => prev.map(m => ({...m, isNew: false})));
            }, 2000);
          }
          
          // Update conversation list and handle user notifications
          // Find messages from other users
          const otherUserMessages = response.data.messages.filter(
            m => m.senderId !== currentUserId
          );
          
          if (otherUserMessages.length > 0) {
            updateConversationList(conversationId, otherUserMessages, currentUserId);
          }
        }
      }
    } catch (error) {
      console.error('Error polling for new messages:', error);
      // Don't set error state to avoid UI disruption during polling
    }
  };
  
  // Update conversation list with new messages
  const updateConversationList = (conversationId, newMessages, currentUserId) => {
    // Update conversation list to show the new message is at the top
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id === conversationId) {
          // Find the newest message
          const newestMessage = newMessages.reduce(
            (newest, msg) => new Date(msg.createdAt) > new Date(newest.createdAt) ? msg : newest,
            newMessages[0]
          );
          
          // Update unread count if this isn't the selected conversation
          // or the user isn't actively looking at the page
          if ((selectedConversation?.id !== conversationId) || document.hidden) {
            setUnreadCount(prev => ({
              ...prev,
              [conversationId]: (prev[conversationId] || 0) + newMessages.length
            }));
          }
          
          return {
            ...conv,
            lastMessage: newestMessage.text,
            lastMessagedAt: newestMessage.createdAt,
            lastMessageSender: {
              id: newestMessage.senderId,
              name: newestMessage.sender?.name || 'User'
            }
          };
        }
        return conv;
      });
    });
    
    // Play a sound if the message is from someone else
    if (document.visibilityState !== 'visible') {
      try {
        const notification = new Audio('/message-sound.mp3');
        notification.play().catch(e => console.log('Error playing sound:', e));
      } catch (e) {
        console.log('Error with notification sound:', e);
      }
    }
  };
  
  // Setup polling for new messages
  const setupMessagePolling = (conversationId) => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Initial poll for messages
    pollForNewMessages(conversationId);
    
    // Poll for new messages every 2 seconds (reduced from 3s for faster refresh)
    pollIntervalRef.current = setInterval(() => {
      pollForNewMessages(conversationId);
    }, 2000);
  };
  
  // Handle input changes
  const handleMessageInputChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Clean up polling on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);
  
  // Clear unread count when selecting a conversation
  useEffect(() => {
    if (selectedConversation) {
      setUnreadCount(prev => ({
        ...prev,
        [selectedConversation.id]: 0
      }));
    }
  }, [selectedConversation]);
  
  // Check for pre-filled recipient from localStorage
  useEffect(() => {
    const storedRecipient = localStorage.getItem('messageRecipient');
    if (storedRecipient) {
      // Open the new conversation dialog and fill with the stored recipient
      setShowNewConversation(true);
      setRecipientEmail(storedRecipient);
      // Clear from localStorage to prevent reopening on page refresh
      localStorage.removeItem('messageRecipient');
    }
  }, []);
  
  if (authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!authState) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Please login to view your messages</h1>
        <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded">
          Go to Login
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Messages</h1>
      
      {error && <Notification message={error} type="error" />}
      {success && <Notification message={success} type="success" />}
      {showDeleteConfirm && <DeleteConfirmDialog 
        conversationId={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
      />}
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Conversations List */}
        <div className="w-full md:w-1/3 bg-white p-4 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button 
              onClick={() => setShowNewConversation(true)}
              className="text-sm bg-green-500 text-white px-2 py-1 rounded"
            >
              New Chat
            </button>
          </div>
          
          {/* Form to start a new conversation */}
          {showNewConversation && (
            <div className="bg-white p-4 shadow rounded my-4">
              <h2 className="text-lg font-bold mb-2">Start a New Conversation</h2>
              <form onSubmit={(e) => { e.preventDefault(); startNewConversation(); }}>
                <div className="mb-3">
                  <label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient's Email:
                  </label>
                  <input
                    id="recipient-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the email address of the person you want to message.
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewConversation(false)}
                    className="mr-2 px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!recipientEmail || isLoading}
                    className={`px-4 py-2 text-white rounded ${
                      isLoading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'
                    } transition-colors disabled:opacity-50`}
                  >
                    {isLoading ? 'Starting...' : 'Start Conversation'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {isLoading && conversations.length === 0 ? (
            <div className="py-8 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start a new conversation using the button above</p>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[500px] overflow-y-auto">
              {conversations.map(conversation => {
                // Determine who the other user is (buyer or seller)
                let currentUserId = null;
                let isCurrentUserBuyer = false;
                let otherUser = { name: 'Unknown user' };
                
                try {
                  const token = localStorage.getItem('token');
                  if (token) {
                    currentUserId = jwtDecode(token).id;
                    isCurrentUserBuyer = conversation.buyerId === currentUserId;
                    
                    // Safely determine the other user with better fallbacks
                    if (isCurrentUserBuyer) {
                      if (conversation.seller?.name) {
                        otherUser = conversation.seller;
                      } else if (conversation.sellerId) {
                        otherUser = { 
                          id: conversation.sellerId,
                          name: 'Seller'
                        };
                      }
                    } else {
                      if (conversation.buyer?.name) {
                        otherUser = conversation.buyer;
                      } else if (conversation.buyerId) {
                        otherUser = { 
                          id: conversation.buyerId,
                          name: 'Buyer'
                        };
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error processing conversation user info:', error);
                }
                
                // Check if this is a direct message (using our placeholder UUID)
                const isDirectMessage = conversation.listingId === "00000000-0000-0000-0000-000000000000";
                
                // Format the date nicely
                const lastMessageDate = new Date(conversation.lastMessagedAt);
                const formattedDate = lastMessageDate.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                });
                
                return (
                  <li 
                    key={conversation.id}
                    className={`p-3 rounded cursor-pointer ${selectedConversation?.id === conversation.id ? 'bg-orange-100' : 'hover:bg-gray-100'} relative group`}
                  >
                    <div 
                      onClick={() => setSelectedConversation(conversation)}
                      className="w-full"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">
                          {isDirectMessage ? (
                            <div className="flex items-center">
                              <span className="mr-2">📩</span>
                              <span>{otherUser?.name || (isCurrentUserBuyer ? 'Seller' : 'Buyer')}</span>
                              {/* Unread message indicator */}
                              {unreadCount[conversation.id] > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                                  {unreadCount[conversation.id]}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="truncate">
                              {conversation.listing?.title || 'Untitled Conversation'}
                              {/* Unread message indicator */}
                              {unreadCount[conversation.id] > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                                  {unreadCount[conversation.id]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{formattedDate}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-1 flex justify-between">
                        <span className="truncate max-w-[180px]">
                          {isDirectMessage ? (
                            <span className="text-gray-500">
                              {otherUser?.email ? `(${otherUser.email})` : 
                                otherUser?.id ? `(User ID: ${otherUser.id.substring(0, 8)}...)` : ''}
                            </span>
                          ) : (
                            <span>
                              with {otherUser?.name || (isCurrentUserBuyer ? 'Seller' : 'Buyer')}
                              <span className="text-xs ml-1">({isCurrentUserBuyer ? 'Seller' : 'Buyer'})</span>
                            </span>
                          )}
                        </span>
                        
                        {conversation.lastMessage && (
                          <span className="text-xs italic truncate max-w-[100px]">
                            {conversation.lastMessageSender && conversation.lastMessageSender.id === currentUserId ? 'You: ' : ''}
                            {conversation.lastMessageSender && conversation.lastMessageSender.id !== currentUserId ? 
                              `${conversation.lastMessageSender.name}: ` : ''}
                            {conversation.lastMessage}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete conversation button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(conversation.id);
                      }}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 p-1.5 rounded-full transition-all"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Messages */}
        <div className="w-full md:w-2/3 bg-white p-4 rounded shadow flex flex-col h-[600px]">
          {selectedConversation ? (
            <>
              <div className="border-b pb-2 mb-4">
                <h2 className="text-lg font-semibold">
                  {selectedConversation.listingId === "00000000-0000-0000-0000-000000000000" 
                    ? 'Direct Message' 
                    : (selectedConversation.listing?.title || 'Untitled Conversation')}
                </h2>
                <div className="text-sm text-gray-500">
                  {(() => {
                    let currentUserId = null;
                    let isCurrentUserBuyer = false;
                    let otherUser = { name: 'Unknown user' };
                    let isDirectMessage = false;
                    
                    try {
                      const token = localStorage.getItem('token');
                      if (token) {
                        currentUserId = jwtDecode(token).id;
                        isCurrentUserBuyer = selectedConversation.buyerId === currentUserId;
                        
                        // Safely determine the other user with better fallbacks
                        if (isCurrentUserBuyer) {
                          if (selectedConversation.seller?.name) {
                            otherUser = selectedConversation.seller;
                          } else if (selectedConversation.sellerId) {
                            otherUser = { 
                              id: selectedConversation.sellerId,
                              name: 'Seller'
                            };
                          }
                        } else {
                          if (selectedConversation.buyer?.name) {
                            otherUser = selectedConversation.buyer;
                          } else if (selectedConversation.buyerId) {
                            otherUser = { 
                              id: selectedConversation.buyerId,
                              name: 'Buyer'
                            };
                          }
                        }
                        
                        isDirectMessage = selectedConversation.listingId === "00000000-0000-0000-0000-000000000000";
                      }
                    } catch (error) {
                      console.error('Error processing conversation details:', error);
                    }
                    
                    return (
                      <>
                        with <span className="font-medium">{otherUser?.name || 'Unknown user'}</span>
                        {isDirectMessage && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 ml-2 rounded">Direct Message</span>
                        )}
                        {!isDirectMessage && (
                          <span className="text-xs ml-1">({isCurrentUserBuyer ? 'seller' : 'buyer'})</span>
                        )}
                        {otherUser?.email && (
                          <span className="block text-xs mt-1">{otherUser.email}</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div className="flex-grow overflow-y-auto mb-4 space-y-3 p-2 messages-container">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <svg className="animate-spin h-8 w-8 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No messages yet. Start the conversation!</p>
                ) : (
                  <>
                    {messages.map(message => {
                      // Use jwtDecode directly with error handling
                      let currentUserId = null;
                      let isMine = false;
                      let senderName = message.sender?.name || "Unknown";
                      
                      try {
                        const token = localStorage.getItem('token');
                        if (token) {
                          currentUserId = jwtDecode(token).id;
                          isMine = message.senderId === currentUserId;
                        }
                      } catch (error) {
                        console.error('Error determining message ownership:', error);
                        // Default to showing as not mine if we can't determine
                      }
                      
                      // Format time nicely
                      const messageTime = new Date(message.createdAt);
                      const formattedTime = messageTime.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} group my-2 message-item ${message.isNew ? 'new-message' : ''}`}
                        >
                          <div 
                            className={`relative max-w-[70%] p-3 rounded-lg ${
                              isMine ? 'bg-orange-500 text-white' : 'bg-gray-100'
                            }`}
                          >
                            {!isMine && (
                              <div className="font-semibold text-xs text-gray-600 mb-1">
                                {senderName}
                              </div>
                            )}
                            <p className="break-words">{message.text}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className={`text-xs ${isMine ? 'text-orange-200' : 'text-gray-500'}`}>
                                {formattedTime}
                              </span>
                              
                              {isMine && (
                                <button 
                                  onClick={() => deleteMessage(message.id)}
                                  className={`text-xs ${isMine ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} px-2 py-1 rounded ml-2 flex items-center transition-colors`}
                                  title="Delete message"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  id="message-input"
                  type="text"
                  value={newMessage}
                  onChange={handleMessageInputChange}
                  placeholder="Type a message..."
                  className="flex-grow p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-orange-600 transition-colors"
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {conversations.length > 0 ? (
                <p>Select a conversation to view messages</p>
              ) : (
                <div className="text-center">
                  <p className="mb-4">No conversations yet</p>
                  <button
                    onClick={() => setShowNewConversation(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded"
                  >
                    Start a New Conversation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
