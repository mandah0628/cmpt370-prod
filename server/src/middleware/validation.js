// middleware/validation.js

/**
 * Middleware to validate search parameters
 */
exports.validateSearchParams = (req, res, next) => {
    const { 
      keyword,
      postedDate,
      location,
      distance,
      startDate,
      endDate,
      minRating
    } = req.query;
    
    // Validate posted date if provided
    if (postedDate && !['all', 'today', 'week', 'month'].includes(postedDate)) {
      return res.status(400).json({
        error: 'Invalid postedDate parameter. Must be one of: all, today, week, month'
      });
    }
    
    // Validate location format if provided
    if (location) {
      const locationPattern = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
      if (!locationPattern.test(location)) {
        return res.status(400).json({
          error: 'Invalid location format. Must be in format: latitude,longitude'
        });
      }
    }
    
    // Validate distance if provided
    if (distance) {
      const distanceValue = parseFloat(distance);
      if (isNaN(distanceValue) || distanceValue <= 0 || distanceValue > 500) {
        return res.status(400).json({
          error: 'Invalid distance parameter. Must be a positive number not exceeding 500'
        });
      }
    }
    
    // Validate date range if provided
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({
        error: 'Both startDate and endDate must be provided together'
      });
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format. Dates must be in ISO format (YYYY-MM-DD)'
        });
      }
      
      if (start >= end) {
        return res.status(400).json({
          error: 'startDate must be before endDate'
        });
      }
      
      const now = new Date();
      if (start < now) {
        return res.status(400).json({
          error: 'startDate cannot be in the past'
        });
      }
    }
    
    // Validate minimum rating if provided
    if (minRating) {
      const ratingValue = parseFloat(minRating);
      if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
        return res.status(400).json({
          error: 'Invalid minRating parameter. Must be a number between 0 and 5'
        });
      }
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  };
  
  /**
   * Middleware to validate tool creation/update parameters
   */
  exports.validateToolData = (req, res, next) => {
    const { 
      title,
      description,
      category,
      location,
      price,
      condition,
      availableDates
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !location || !price || !condition) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, category, location, price, and condition are required'
      });
    }
    
    // Validate location format
    if (!location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        error: 'Location must include valid coordinates [longitude, latitude]'
      });
    }
    
    // Validate price
    if (isNaN(price.amount) || price.amount <= 0) {
      return res.status(400).json({
        error: 'Price amount must be a positive number'
      });
    }
    
    if (!['hour', 'day', 'week'].includes(price.unit)) {
      return res.status(400).json({
        error: 'Price unit must be one of: hour, day, week'
      });
    }
    
    // Validate condition
    if (!['new', 'like-new', 'good', 'fair', 'worn'].includes(condition)) {
      return res.status(400).json({
        error: 'Condition must be one of: new, like-new, good, fair, worn'
      });
    }
    
    // Validate available dates if provided
    if (availableDates && Array.isArray(availableDates)) {
      for (const period of availableDates) {
        if (!period.start || !period.end) {
          return res.status(400).json({
            error: 'Each availability period must have start and end dates'
          });
        }
        
        const start = new Date(period.start);
        const end = new Date(period.end);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format in availability periods'
          });
        }
        
        if (start >= end) {
          return res.status(400).json({
            error: 'Start date must be before end date in availability periods'
          });
        }
      }
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  };
  
  /**
   * Middleware to validate reservation data
   */
  exports.validateReservationData = (req, res, next) => {
    const { startDate, endDate } = req.body;
    
    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Start date and end date are required'
      });
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format. Dates must be in ISO format (YYYY-MM-DD)'
      });
    }
    
    // Validate date range
    if (start >= end) {
      return res.status(400).json({
        error: 'Start date must be before end date'
      });
    }
    
    // Validate dates are not in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day
    if (start < now) {
      return res.status(400).json({
        error: 'Start date cannot be in the past'
      });
    }
    
    // If all validations pass, proceed to the next middleware
    next();
  };