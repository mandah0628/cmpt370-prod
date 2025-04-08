// client/app/search/components/SearchBar.jsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ initialKeyword = '' }) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialKeyword);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle "Enter" key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search for tools (e.g., drill, ladder, saw)..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full py-3 px-4 pr-12 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
        />
        <button
          onClick={handleSubmit}
          className="absolute right-2 p-2 text-gray-600 hover:text-green-600"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}