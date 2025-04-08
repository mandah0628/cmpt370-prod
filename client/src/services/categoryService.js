// src/services/categoryService.js
import { makeRequest } from '@/services/apiClient';

/**
 * Get all tool categories
 * @returns {Promise} - Promise resolving to categories list
 */
export const getToolCategories = async () => {
  try {
    const response = await makeRequest({
      method: 'GET',
      url: '/api/categories'
    });
    
    return response;
  } catch (error) {
    console.error('Get categories error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch categories',
      data: []
    };
  }
};

/**
 * Get popular tool tags
 * @returns {Promise} - Promise resolving to popular tags
 */
export const getPopularTags = async () => {
  try {
    const response = await makeRequest({
      method: 'GET',
      url: '/api/tags/popular'
    });
    
    return response;
  } catch (error) {
    console.error('Get popular tags error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch popular tags',
      data: []
    };
  }
};