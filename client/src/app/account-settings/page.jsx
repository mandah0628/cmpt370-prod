"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // Import the Auth Context
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const router = useRouter();
  // auth and authLoading state
  const { authState, authLoading } = useAuth();
  
  const [user, setUserData] = useState(null);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    location: '',
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('account'); // 'account' or 'edit'
  const dropDownRef = useRef(null);

  // Fetch user data when authenticated
  async function fetchUserData() {
    setLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/account-settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      
      // First, try to extract user from the expected structure
      let user;
      
      if (response.data && response.data.user) {
        // Case 1: {message: "User found", user: {...}}
        user = response.data.user;
      } else if (response.data && typeof response.data === 'object' && Object.keys(response.data).length > 0) {
        // Case 2: The data might be directly in the response
        user = response.data;
      } else {
        // Case 3: No usable data found
        console.error("No user found in the response");
        setFeedback({ type: 'error', message: 'No user data received from server.' });
        setLoading(false);
        return;
      }
          
      if (!user || Object.keys(user).length === 0) {
        console.error("user is empty or null");
        setFeedback({ type: 'error', message: 'Received empty user data from server.' });
        setLoading(false);
        return;
      }
      
      // Set the user data in state
      setUserData(user);
      
      // Set form data from response
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        location: user.location || '',
      });
      
      // From the model definition, the profile photo association is named "profilePhoto" (camelCase)
      if (user.profilePhoto?.url) {
        // Cloudinary URLs are absolute, so we don't need to append the server URL
        const photoUrl = user.profilePhoto.url;
        console.log("Profile photo URL (Cloudinary):", photoUrl);
        // First verify the URL is accessible
        fetch(photoUrl)
          .then(response => {
            if (response.ok) {
              setImagePreview(photoUrl);
            } else {
              console.error("Profile photo URL returned status:", response.status);
              setImagePreview("/img/default-avatar.jpg");
            }
          })
          .catch(error => {
            console.error("Error checking profile photo URL:", error);
            setImagePreview("/img/default-avatar.jpg");
          });
      } else {
        console.log("No profile photo found");
        setImagePreview("/img/default-avatar.jpg");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setFeedback({ type: 'error', message: 'Failed to fetch your profile data: ' + (error.message || 'Unknown error') });
    } finally {
      setLoading(false);
    }
  }

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFeedback({ 
          type: 'error', 
          message: 'Image is too large. Maximum size is 5MB.' 
        });
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setFeedback({ 
          type: 'error', 
          message: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' 
        });
        return;
      }
      
      console.log("Selected file:", file.name, `(${file.size} bytes, ${file.type})`);
      setNewProfileImage(file);
      
      // Preview the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Name is required' });
      return false;
    }
    
    if (!formData.email.trim()) {
      setFeedback({ type: 'error', message: 'Email is required' });
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address' });
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    setLoading(true);
    setFeedback({ type: '', message: '' });
    const token = localStorage.getItem("token");

    try {
      console.log("Preparing form data for submission");
      // Prepare form data
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("phoneNumber", formData.phoneNumber || '');
      form.append("bio", formData.bio || '');
      form.append("location", formData.location || '');
      
      if (newProfileImage) {
        form.append("profile_image", newProfileImage);
      }

      console.log("Submitting form data to server...");
      // Send update request
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/update-user`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      
      if (response.status === 200) {
        console.log("Profile updated successfully");
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        
        // Get updated user data
        const updatedData = response.data.user;
        
        setUserData(updatedData);
        
        // Update form data with new values
        setFormData({
          name: updatedData.name || '',
          email: updatedData.email || '',
          phoneNumber: updatedData.phoneNumber || '',
          bio: updatedData.bio || '',
          location: updatedData.location || '',
        });
        
        // Update image preview if there's a profile photo
        if (updatedData.profilePhoto?.url) {
          // Cloudinary URLs are absolute, so we don't need to append the server URL
          const photoUrl = updatedData.profilePhoto.url;
          console.log("Updated profile photo URL (Cloudinary):", photoUrl);
          
          // First verify the URL is accessible
          fetch(photoUrl)
            .then(response => {
              if (response.ok) {
                setImagePreview(photoUrl);
              } else {
                console.error("Profile photo URL returned status:", response.status);
                setImagePreview("/img/default-avatar.jpg");
              }
            })
            .catch(error => {
              console.error("Error checking profile photo URL:", error);
              setImagePreview("/img/default-avatar.jpg");
            });
        } else {
          setImagePreview("/img/default-avatar.jpg");
        }
        
        // Reset new profile image state
        setNewProfileImage(null);
        // Switch to account view after successful update
        setActiveTab('account');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Extract detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update profile. Please try again.';
      
      setFeedback({ 
        type: 'error', 
        message: errorMessage
      });
      
      if (error.response?.status === 413) {
        setFeedback({ 
          type: 'error', 
          message: 'The image file is too large. Please select a smaller image.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle account dropdown
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Hide dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (dropDownRef.current && !dropDownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  const handleEditClick = () => {
    setActiveTab('edit');
    // Reset any previous feedback messages when switching to edit mode
    setFeedback({ type: '', message: '' });
  };

  // Fetch user data when auth state changes
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    
    // If authenticated, fetch user data
    if (authState && !authLoading) {
      fetchUserData();
    } else if (!authState && !authLoading) {
      router.push("/login")
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [authState,authLoading]);


  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the account information tab
  const renderAccountInfo = () => {    
    // If user is null or empty, show a message
    if (!user || Object.keys(user).length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-center text-gray-600">No user data available. Please try refreshing the page.</p>
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchUserData()}
              className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-4 py-2 rounded-md font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile image section */}
          <div className="w-full md:w-1/3 flex flex-col items-center mb-4 md:mb-0">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 mb-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Error loading profile image:", e);
                    e.target.onerror = null; // Prevent infinite error loop
                    e.target.src = "/img/default-avatar.jpg"; // Updated path to use the img directory
                    setFeedback({
                      type: 'warning',
                      message: 'Could not load profile image. Using default image instead.'
                    });
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                  <span>No Image</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name || 'No Name'}</h2>
            <p className="text-gray-500">{user?.rating ? `★ ${user.rating.toFixed(1)}/5.0` : 'No ratings yet'}</p>
          </div>
          
          {/* User information section */}
          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-500 font-medium">Email</h3>
                <p className="text-gray-800 font-semibold">{user?.email || 'No email available'}</p>
              </div>
              
              {user?.phoneNumber && (
                <div>
                  <h3 className="text-gray-500 font-medium">Phone</h3>
                  <p className="text-gray-800 font-semibold">{user.phoneNumber}</p>
                </div>
              )}
              
              {user?.location && (
                <div>
                  <h3 className="text-gray-500 font-medium">Location</h3>
                  <p className="text-gray-800 font-semibold">{user.location}</p>
                </div>
              )}
            </div>
            
            {user?.bio && (
              <div className="mt-6">
                <h3 className="text-gray-500 font-medium">About</h3>
                <p className="text-gray-800 mt-1">{user.bio}</p>
              </div>
            )}
            
            <div className="mt-8">
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the edit form tab
  const renderEditForm = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleFormSubmit} encType="multipart/form-data" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile image section */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Error loading profile image:", e);
                      e.target.onerror = null; // Prevent infinite error loop
                      e.target.src = "/img/default-avatar.jpg"; // Updated path to use the img directory
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <label className="w-full">
                <span className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md cursor-pointer block text-center hover:bg-gray-200 transition-colors">
                  Change Photo
                </span>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </label>
            </div>
            
            {/* Form fields */}
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="name">
                  Name*
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="email">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="City, Province/State"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-orange-500 text-white rounded-md font-medium ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600 transition-colors'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin h-5 w-5 mr-3 border-t-2 border-b-2 border-white rounded-full"></span>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Account Settings</h1>
          
          {/* Feedback message */}
          {feedback.message && (
            <div className={`mb-6 p-4 rounded-md ${
              feedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {feedback.message}
            </div>
          )}
          
          {(authLoading || (loading && !user)) ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : !authState ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-lg text-gray-700 mb-4">You need to be logged in to access your account settings.</p>
              <Link href="/login">
                <span className="bg-orange-500 hover:bg-orange-600 transition-colors text-white px-6 py-3 rounded-md font-medium">
                  Go to Login
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Side navigation */}
              <div className="w-full md:w-1/4">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h2 className="font-bold text-gray-800">Settings</h2>
                  </div>
                  <ul>
                    <li>
                      <button
                        onClick={() => setActiveTab('account')}
                        className={`w-full text-left px-4 py-3 ${
                          activeTab === 'account'
                            ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Account Information
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('edit')}
                        className={`w-full text-left px-4 py-3 ${
                          activeTab === 'edit'
                            ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Edit Profile
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Main content area */}
              <div className="w-full md:w-3/4">
                {activeTab === 'account' ? renderAccountInfo() : renderEditForm()}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
