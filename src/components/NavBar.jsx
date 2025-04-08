"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import MessageButton from './MessageButton';

export default function NavBar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropDownRef = useRef(null);

  // context
  const { authLoading, authState, logout } = useAuth();

  // function to handle when the user clicks the 'my account' button
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  // function to hide the dropdown when a user clicks outside the dropdown list
  const handleClickOutside = (e) => {
    if (dropDownRef.current && !dropDownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  // runs on page load
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [authState, authLoading]);

  return (
    <header className="flex justify-between items-center px-10 py-2 shadow-md bg-white">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image 
            src="/img/favicon.png" 
            alt="Logo" 
            width={60} 
            height={60} 
            className="rounded-full object-cover"
            priority
          />
          <h1 className="text-2xl font-bold ml-2">TOOLOOP</h1>
        </Link>
      </div>
      <nav className="flex items-center space-x-6">
        <Link href="/search" className="text-gray-600 hover:text-black">
          Search
        </Link>
        <MessageButton />
        {authState && (
          <>
            <Link href="/create-listing" className="text-gray-600 hover:text-black">
              Post
            </Link>
            <Link href="/my-reservations" className="text-gray-600 hover:text-black">
              Reservations
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-black">
              Contact
            </Link>
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="bg-orange-500 text-white px-4 py-2 rounded"
              >
                My Account
              </button>
              
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden z-10"
                  ref={dropDownRef}
                >
                  <Link href="/account-settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    Account Settings
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    Log Out
                  </button>
                  <Link href="/my-listings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                    My Listings
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
        {!authState && !authLoading && (
          <Link href="/login" className="bg-orange-500 text-white px-4 py-2 rounded">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}