// src/services/apiClient.js

// Get the base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_BASE_URL || 'http://localhost:5050';

/**
 * Make an HTTP request to the API
 * @param {Object} options - Request options
 * @returns {Promise} - Promise resolving to the response data
 */
export const makeRequest = async (options) => {
  const { method = 'GET', url, data, headers = {} } = options;
  
  try {
    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    // Prepare request options
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    // Add authorization header if token exists
    if (token) {
      requestOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add body for non-GET requests
    if (method !== 'GET' && data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    // Make the fetch request
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    const result = await response.json();
    
    // Check for errors
    if (!response.ok) {
      throw new Error(result.message || 'An error occurred');
    }
    
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};