"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

export default function MessageButton() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { authState } = useAuth();
  
  useEffect(() => {
    // Only fetch unread messages if user is authenticated
    if (authState) {
      fetchUnreadMessages();
    }
  }, [authState]);
  
  const fetchUnreadMessages = async () => {
    try {
      setIsLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      // Get user ID from token
      const userId = getUserIdFromToken(token);
      if (!userId) return;
      
      // Request with userId as a parameter to prevent server 500 errors
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/message/unread-count/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(error => {
        // Handle the case where endpoint doesn't exist yet
        console.warn('Unread messages endpoint not available:', error);
        return { data: { unreadCount: 0 } };
      });
      
      if (response.data && response.data.unreadCount !== undefined) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to decode token and get user ID
  const getUserIdFromToken = (token) => {
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload).id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };
  
  if (!authState) return null;
  
  return (
    <Link href="/my-messages" className="relative flex items-center group">
      <span className="text-gray-600 hover:text-black">
        Messages
        {isLoading && (
          <svg className="animate-spin h-4 w-4 ml-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
} 