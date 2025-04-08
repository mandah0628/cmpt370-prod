// client/src/services/searchService.js
import { makeRequest } from './apiClient';

/**
 * Search for tools based on search parameters
 * @param {Object} searchParams - Search parameters
 * @returns {Promise} - Promise resolving to search results
 */
export const searchTools = async (searchParams) => {
  try {
    const { 
      keyword,
      postedDate,
      location,
      distance = 25,
      dateRange,
      minRating = 0,
      page = 1,
      limit = 20
    } = searchParams;

    // Build query parameters
    const params = new URLSearchParams();
    
    if (keyword) params.append('keyword', keyword);
    if (postedDate) params.append('postedDate', postedDate);
    if (location) params.append('location', location);
    if (distance) params.append('distance', distance);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    // Determine if advanced search should be used
    const isAdvancedSearch = (dateRange?.start && dateRange?.end) || minRating > 0;
    let endpoint = '/tools';
    
    if (isAdvancedSearch) {
      endpoint = '/tools/advanced';
      if (dateRange?.start) params.append('startDate', dateRange.start);
      if (dateRange?.end) params.append('endDate', dateRange.end);
      if (minRating > 0) params.append('minRating', minRating);
    }
    
    // Make API request using Axios via makeRequest
    const response = await makeRequest({
      method: 'GET',
      url: `${endpoint}?${params.toString()}`
    });
    
    return response;
  } catch (error) {
    console.error('Search service error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch search results'
    };
  }
};

/**
 * Get tool details by ID
 * @param {string} toolId - ID of the tool to retrieve
 * @returns {Promise} - Promise resolving to tool details
 */
export const getToolById = async (toolId) => {
  try {
    const response = await makeRequest({
      method: 'GET',
      url: `/tools/${toolId}`
    });
    return response;
  } catch (error) {
    console.error('Get tool error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch tool details'
    };
  }
};

/**
 * Check tool availability for a specific date range
 * @param {string} toolId - ID of the tool to check
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise} - Promise resolving to availability status
 */
export const checkToolAvailability = async (toolId, startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    const response = await makeRequest({
      method: 'GET',
      url: `/tools/${toolId}/availability?${params.toString()}`
    });
    return response;
  } catch (error) {
    console.error('Check availability error:', error);
    return {
      success: false,
      message: error.message || 'Failed to check tool availability'
    };
  }
};