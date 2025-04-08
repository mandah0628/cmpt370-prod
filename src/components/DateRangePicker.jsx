// client/app/search/components/DateRangePicker.jsx
"use client";

import { useState, useEffect } from 'react';

export default function DateRangePicker({ startDate, endDate, onChange }) {
  // Local state to handle the input values
  const [start, setStart] = useState(startDate || '');
  const [end, setEnd] = useState(endDate || '');
  
  // Update local state when props change
  useEffect(() => {
    setStart(startDate || '');
    setEnd(endDate || '');
  }, [startDate, endDate]);
  
  // Handle start date change
  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setStart(newStart);
    
    // Validate end date is after start date
    if (end && new Date(newStart) > new Date(end)) {
      setEnd('');
      onChange({ start: newStart, end: null });
    } else {
      onChange({ start: newStart, end });
    }
  };
  
  // Handle end date change
  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setEnd(newEnd);
    onChange({ start, end: newEnd });
  };
  
  // Calculate minimum end date based on start date
  const getMinEndDate = () => {
    if (!start) return '';
    
    // Get the day after the start date
    const nextDay = new Date(start);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return nextDay.toISOString().split('T')[0];
  };
  
  // Calculate minimum start date (today)
  const getMinStartDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
        <input
          type="date"
          value={start}
          min={getMinStartDate()}
          onChange={handleStartChange}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">End Date</label>
        <input
          type="date"
          value={end}
          min={getMinEndDate()}
          onChange={handleEndChange}
          disabled={!start}
          className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${!start ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
        {!start && (
          <p className="text-xs text-amber-600 mt-1">
            Please select a start date first
          </p>
        )}
      </div>
    </div>
  );
}