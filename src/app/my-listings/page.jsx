"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import axios from "axios";
import Link from "next/link";

export default function MyListing() {
  const router = useRouter();
  // deleting state
  const [deleting, setDeleting] = useState(false);
  // fetching state
  const [fetching, setFetching] = useState(true);
  // State to store listings fetched from the backend
  const [listings, setListings] = useState([]);
  // auth and authLoading state
  const { authState, authLoading } = useAuth();

  // State for delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    listingId: null,
    listingTitle: "",
  });


  // Opens the delete confirmation modal
  const confirmDelete = (id, title) => {
    setDeleteConfirmation({ isOpen: true, listingId: id, listingTitle: title });
  };

  // Closes the delete confirmation modal
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, listingId: null, listingTitle: "" });
  };



  // Fetch the listings from your backend
  const fetchMyListings = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/my-listings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("API Response:", response.data);

      // Since the backend returns: { listings: [ ... ] }
      setListings(Array.isArray(response.data.listings) ? response.data.listings : []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setFetching(false)
    }
  };


  // Sends a delete request for a listing
  const deleteListing = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/delete-listing/${deleteConfirmation.listingId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.status === 200) {
        fetchMyListings(); // Re-fetch the entire list
        cancelDelete();
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    } finally {
      setDeleting(false);
    }
  };


  useEffect(() => {
    if (!authState && !authLoading) {
      router.push("/login");
    }
  }, [authLoading,authState]);
  

  useEffect(() => {
    fetchMyListings();
  }, []);


  if (fetching || authLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <button
          onClick={() => router.push("/create-listing")}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Create New Listing
        </button>
      </div>

      {/* Check if we have listings */}
      {Array.isArray(listings) && listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Images Section (display *all* images) */}
              <div className="flex overflow-x-auto h-48 bg-gray-100">
                {listing.listingImages && listing.listingImages.length > 0 ? (
                  listing.listingImages.map((imgObj) => (
                    <img
                      key={imgObj.id}
                      src={imgObj.url}
                      alt={`${listing.title} image`}
                      className="w-auto h-full object-cover mr-2"
                    />
                  ))
                ) : (
                  <img
                    src="/placeholder.jpg"
                    alt="Placeholder"
                    className="w-auto h-full object-cover"
                  />
                )}
              </div>

              {/* Listing Details */}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
                <p className="text-gray-600">Category: {listing.category}</p>
                <p className="text-gray-600">Description: {listing.description}</p>
                <p className="text-green-600 font-semibold">${listing.rate}/day</p>

                <p className="text-gray-500 text-sm mt-2">
                  <span className="font-semibold">ID:</span> {listing.id}
                  <br />
                  <span className="font-semibold">User ID:</span> {listing.userId}
                  <br />
                  <span className="font-semibold">Created:</span>{" "}
                  {new Date(listing.createdAt).toLocaleString()}
                  <br />
                  <span className="font-semibold">Updated:</span>{" "}
                  {new Date(listing.updatedAt).toLocaleString()}
                </p>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {listing.tags.map((tagObj) => (
                      <span
                        key={tagObj.id}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                      >
                        {tagObj.tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                  >
                    View
                  </Link>
                  <div className="flex space-x-2">
                    {/* edit button */}
                    <button
                      onClick={() => router.push(`/edit-listing/${listing.id}`)}
                      className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                    >
                      Edit
                    </button>

                    {/* delete button */}
                    <button
                      onClick={() => confirmDelete(listing.id, listing.title)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // If there are no listings
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">You haven't created any listings yet.</p>
          <Link
            href="/listings/create"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Create Your First Listing
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="mb-6">
              Are you sure you want to delete &quot;{deleteConfirmation.listingTitle}&quot;? This
              action cannot be undone.
            </p>

            {/* button container */}
            <div className="flex justify-end space-x-3">

              {/* cancel button */}
              <button
                disabled={deleting}
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

            {/* delete button */}
            <button
                onClick={deleteListing}
                className={`px-4 py-2 rounded-md text-white flex items-center justify-center gap-2
                  ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}
                `}
                disabled={deleting} // Disable while deleting
              >
                {deleting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
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
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>             
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
