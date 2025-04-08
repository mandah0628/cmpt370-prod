"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from "axios";
import DatePicker from 'react-datepicker';
import Image from 'next/image';
import 'react-datepicker/dist/react-datepicker.css';

export default function ListingPage() {
  const params = useParams();
  const { id: listingId } = params;
  const { authState } = useAuth();
  const router = useRouter();

  // Listing + Reviews + Owner
  const [listing, setListing] = useState(null);
  const [listingReviews, setListingReviews] = useState([]); // we store the listing's reviews here
  const [owner, setOwner] = useState(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reservation date range
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [submitting, setSubmitting] = useState(false);

  // For user-review form (reviews the OWNER)
  const [showUserReviewForm, setShowUserReviewForm] = useState(false);
  const [userReviewRating, setUserReviewRating] = useState(0);
  const [userReviewDescription, setUserReviewDescription] = useState("");

  // For listing-review form (reviews the LISTING)
  const [showListingReviewForm, setShowListingReviewForm] = useState(false);
  const [listingReviewRating, setListingReviewRating] = useState(0);
  const [listingReviewDescription, setListingReviewDescription] = useState("");

  // For image gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // ──────────────────────────────────────────────────────────────────────────────
  // Fetch the listing (with its embedded reviews) from the server
  // ──────────────────────────────────────────────────────────────────────────────
  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/get-listing/${listingId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(response.data.listing.reviews);
      if (response.data.success) {
        const fetchedListing = response.data.listing;
        
        setListing(fetchedListing);
        // IMPORTANT: reviews are at fetchedListing.reviews
        setListingReviews(fetchedListing.reviews || []);

        // Build an owner object
        if (fetchedListing.userId) {
          const ownerData = {
            id: fetchedListing.userId,
            name: fetchedListing.user?.name || 'Tool Owner',
            email: fetchedListing.user?.email,
            rating: fetchedListing.user?.rating || 0,
            location: fetchedListing.location || 'Saskatoon, SK',
            bio: fetchedListing.user?.bio || null,
            profilePhoto: fetchedListing.user?.profilePhoto || null
          };
          setOwner(ownerData);
        }
      } else {
        setError(response.data.message || 'Failed to fetch listing');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error('Error fetching listing:', err);
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // useEffect: fetch the listing on mount or if listingId/authState changes
  // ──────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId, authState]);

  // ──────────────────────────────────────────────────────────────────────────────
  // Submissions
  // ──────────────────────────────────────────────────────────────────────────────
  // Listing Review
  const submitListingReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (!authState) {
        setError("You must be logged in to review a listing.");
        return;
      }
      await axios.post(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing-review/create-review`,
        {
          listingId,  // Because we have listingId from params
          reviewData: {
            rating: listingReviewRating,
            comment: listingReviewDescription,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Re-fetch the entire listing to show the new review
      await fetchListing();

      // Reset form
      setShowListingReviewForm(false);
      setListingReviewRating(0);
      setListingReviewDescription("");
      alert("Listing review submitted!");
    } catch (err) {
      console.error("Error submitting listing review:", err);
      setError(err.response?.data?.message || "Could not submit listing review");
    }
  };

  // User (Owner) Review
  const submitUserReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      if (!authState) {
        setError("You must be logged in to leave a user review.");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user-review/create-review/${owner.id}`,
        {
          reviewData: {
            rating: userReviewRating,
            description: userReviewDescription,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowUserReviewForm(false);
      setUserReviewRating(0);
      setUserReviewDescription("");
      alert("User review submitted!");
      fetchListing();
    } catch (err) {
      console.error("Error submitting user review:", err);
      setError(err.response?.data?.message || "Could not submit user review");
    }
  };

  // Reservation
  const handleReservation = async () => {
    if (submitting) return;
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      setError("End date must be after start date");
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!authState && !token) {
      setError("Please log in to make a reservation");
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const nightsCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const totalPrice = nightsCount * listing.rate;
      const formattedStartDate = start.toISOString().split('T')[0];
      const formattedEndDate = end.toISOString().split('T')[0];

      // Store reservation data in localStorage
      const reservationData = {
        listingId: listing.id,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        nightsCount,
        totalPrice,
        listingTitle: listing.title,
        listingImage:
          listing.listingImages && listing.listingImages.length > 0
            ? listing.listingImages[0].url
            : null,
      };
      localStorage.setItem('reservationData', JSON.stringify(reservationData));

      // Slight delay then submit hidden form
      setTimeout(() => {
        try {
          const form = document.getElementById('reservation-form');
          const dataInput = document.getElementById('reservation-data');
          dataInput.value = JSON.stringify(reservationData);
          form.submit();
        } catch (err) {
          console.error("Form submission error:", err);
          setError("Error submitting reservation");
          setSubmitting(false);
        }
      }, 100);
    } catch (error) {
      console.error("Error in reservation process:", error);
      setError("There was a problem processing your reservation");
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────────
  // Rendering & Helpers
  // ──────────────────────────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
            <path
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
              9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
              fillOpacity="0.5"
            />
          </svg>
        );
      } else {
        // Empty star
        stars.push(
          <svg key={i} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      }
    }
    return stars;
  };

  const openFullscreen = (imageUrl) => {
    setFullscreenImage(imageUrl);
    document.body.style.overflow = 'hidden';
  };
  const closeFullscreen = () => {
    setFullscreenImage(null);
    document.body.style.overflow = '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md">
          <p className="text-yellow-700">Listing not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hidden form for reservation submission */}
      <form
        id="reservation-form"
        method="GET"
        action="/create-reservation"
        style={{ display: 'none' }}
      >
        <input id="reservation-data" type="hidden" name="data" value="" />
      </form>

      {/* Hero section */}
      <div className="bg-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{listing.title}</h1>
          </div>

          <div className="flex items-center text-gray-600 mb-6">
            <svg
              className="w-5 h-5 mr-1 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 
                8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{listing.location || 'Saskatoon, SK'}</span>

            <span className="mx-2">•</span>

            <div className="flex items-center">
              <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                {listing.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div className="relative w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center">
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              onClick={closeFullscreen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="relative w-full h-full">
              <Image
                src={fullscreenImage}
                alt="Full size image"
                className="object-contain"
                fill
                sizes="100vw"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images and description */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="mb-10">
              <div
                className="relative rounded-xl overflow-hidden mb-2 cursor-pointer"
                style={{ width: '100%', paddingBottom: '56.25%' }}
                onClick={() =>
                  listing.listingImages &&
                  listing.listingImages.length > 0 &&
                  openFullscreen(
                    listing.listingImages[activeImageIndex]?.url ||
                      listing.listingImages[0].url
                  )
                }
              >
                {listing.listingImages && listing.listingImages.length > 0 ? (
                  <Image
                    src={
                      listing.listingImages[activeImageIndex]?.url ||
                      listing.listingImages[0].url
                    }
                    alt={listing.title}
                    fill
                    className="object-contain bg-gray-100"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {listing.listingImages && listing.listingImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {listing.listingImages.map((image, index) => (
                    <div
                      key={index}
                      className={`relative flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        activeImageIndex === index
                          ? 'border-orange-500 scale-105'
                          : 'border-transparent'
                      }`}
                      onClick={() => setActiveImageIndex(index)}
                      style={{ width: '80px', height: '80px' }}
                    >
                      <Image
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-contain p-1 bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description, Features, and Reviews */}
            <div className="mb-10">
              <div className="border-b pb-6 mb-6">
                {/* Owner info (mobile) */}
                {owner && (
                  <div className="mb-6 lg:hidden">
                    <h2 className="text-xl font-semibold mb-4">
                      Offered by {owner.name}
                    </h2>
                    <div className="flex items-center">
                      <div className="relative h-14 w-14 rounded-full overflow-hidden">
                        {owner.profilePhoto ? (
                          <Image
                            src={owner.profilePhoto.url}
                            alt={owner.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xl">
                              {owner.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">{owner.name}</h3>
                        <div className="flex items-center mt-1">
                          {renderStars(owner.rating)}
                          <span className="ml-1 text-sm text-gray-600">
                            {owner.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-semibold mb-4">About this tool</h2>
                <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
              </div>

              {/* Features */}
              <div className="border-b pb-6 mb-6">
                <h2 className="text-2xl font-semibold mb-4">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Available for rent</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{listing.category}</span>
                  </div>
                  {listing.tags &&
                    listing.tags.map((tag, index) => (
                      <div key={index} className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>{tag.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Listing Reviews */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Reviews</h2>
                  {listingReviews.length > 0 && (
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-lg font-semibold">
                        {listingReviews.length} review
                        {listingReviews.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Loading spinner if you had a separate "reviewsLoading" – but we removed that logic now */}
                {listingReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {listingReviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">{renderStars(review.rating)}</div>
                          <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="text-gray-800">{review.comment}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600">No reviews yet for this listing.</p>
                  </div>
                )}

                {/* "Rate Listing" button + form */}
                <div className="mt-4">
                  {!showListingReviewForm ? (
                    <button
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      onClick={() => setShowListingReviewForm(true)}
                    >
                      Rate Listing
                    </button>
                  ) : (
                    <form onSubmit={submitListingReview} className="mt-4 p-4 border rounded">
                      <div className="mb-2">
                        <label htmlFor="listingRating" className="block font-medium">
                          Rating
                        </label>
                        <select
                          id="listingRating"
                          value={listingReviewRating}
                          onChange={(e) => setListingReviewRating(e.target.value)}
                          className="border rounded p-1 w-full mt-1"
                          required
                        >
                          <option value={0}>Select a rating...</option>
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>
                              {val} star{val > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-2">
                        <label htmlFor="listingDescription" className="block font-medium">
                          Comment
                        </label>
                        <textarea
                          id="listingDescription"
                          value={listingReviewDescription}
                          onChange={(e) => setListingReviewDescription(e.target.value)}
                          className="border rounded p-1 w-full mt-1"
                          rows={3}
                          placeholder="Share your thoughts..."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowListingReviewForm(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Reservation and Owner info */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Reservation box */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                  <span className="text-2xl text-orange-600 font-bold">${listing.rate}</span> / day
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Select dates</label>
                  <DatePicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => setDateRange(update)}
                    isClearable
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholderText="Select start and end dates"
                  />
                </div>

                {startDate && endDate ? (
                  <div>
                    <div className="mb-5 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <p className="text-gray-700">
                          ${listing.rate} x{' '}
                          {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days
                        </p>
                        <p className="text-gray-700">
                          $
                          {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) *
                            listing.rate}
                        </p>
                      </div>
                      <div className="flex justify-between font-semibold pt-3 border-t">
                        <p>Total</p>
                        <p>
                          $
                          {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) *
                            listing.rate}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleReservation}
                      disabled={submitting}
                      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        "Reserve Now"
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full bg-orange-300 text-white py-3 px-4 rounded-lg cursor-not-allowed font-medium"
                  >
                    Select Dates to Reserve
                  </button>
                )}
              </div>

              {/* Owner info on desktop */}
              {owner && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">About the Owner</h2>
                  <div className="flex items-center mb-4">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                      {owner.profilePhoto ? (
                        <Image
                          src={owner.profilePhoto.url}
                          alt={owner.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xl">
                            {owner.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-lg">{owner.name}</h3>
                      <div className="flex items-center mt-1">
                        {renderStars(owner.rating)}
                        <span className="ml-1 text-sm text-gray-600">
                          {owner.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {owner.bio && (
                    <div className="mt-3">
                      <p className="text-gray-700 text-sm">{owner.bio}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => {
                        if (owner && owner.email) {
                          localStorage.setItem('messageRecipient', owner.email);
                          window.location.href = '/my-messages';
                        } else {
                          window.location.href = '/my-messages';
                        }
                      }}
                      className="w-full bg-white text-orange-600 font-medium py-2 px-4 border border-orange-600 rounded-lg text-center hover:bg-orange-50 transition-colors"
                    >
                      Message Owner
                    </button>
                  </div>

                  {/* Leave User Review Button */}
                  <div className="mt-4">
                    {!showUserReviewForm ? (
                      <button
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        onClick={() => setShowUserReviewForm(true)}
                      >
                        Leave User Review
                      </button>
                    ) : (
                      <form onSubmit={submitUserReview} className="mt-4 p-4 border rounded">
                        <div className="mb-2">
                          <label htmlFor="userRating" className="block font-medium">
                            Rating
                          </label>
                          <select
                            id="userRating"
                            value={userReviewRating}
                            onChange={(e) => setUserReviewRating(e.target.value)}
                            className="border rounded p-1 w-full mt-1"
                            required
                          >
                            <option value={0}>Select a rating...</option>
                            {[1, 2, 3, 4, 5].map((val) => (
                              <option key={val} value={val}>
                                {val} star{val > 1 ? 's' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label htmlFor="userDescription" className="block font-medium">
                            Comment
                          </label>
                          <textarea
                            id="userDescription"
                            value={userReviewDescription}
                            onChange={(e) => setUserReviewDescription(e.target.value)}
                            className="border rounded p-1 w-full mt-1"
                            rows={3}
                            placeholder="Share your thoughts about the owner..."
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowUserReviewForm(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
