"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";

export default function MyReservation() {
  const router = useRouter();

  const [reservations, setReservations] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { authState, authLoading } = useAuth();

  // For reservation delete
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    reservationId: null,
    reservationDetails: null
  });

  // For showing the inline "ReviewForm"
  const [reviewFormOpen, setReviewFormOpen] = useState(null);
  const [editReviewData, setEditReviewData] = useState(null); // store existing review if editing

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      setFetching(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/reservation/my-reservations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // If the backend returns reservations
      if (response.data.reservations) {
        // Optionally, fetch existing reviews for each listing (or do that in one go if you prefer)
        setReservations(response.data.reservations);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setFetching(false);
    }
  };

  // Delete Reservation
  const confirmDelete = (id, details) => {
    setDeleteConfirmation({ 
      isOpen: true, 
      reservationId: id,
      reservationDetails: details
    });
  };
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      reservationId: null,
      reservationDetails: null
    });
  };
  const deleteReservation = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/reservation/delete/${deleteConfirmation.reservationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        fetchReservations();
        cancelDelete();
      }
    } catch (error) {
      console.error("Error deleting reservation:", error);
    } finally {
      setDeleting(false);
    }
  };

  // Lifecycle
  useEffect(() => {
    if (!authState && !authLoading) {
      router.push("/login");
    }
  }, [authLoading, authState]);
  
  useEffect(() => {
    fetchReservations();
  }, []);

  // Reservation status helper
  const getReservationStatus = (startDate, endDate, status) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (status === "cancelled") return "Cancelled";
    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Active";
    if (now > end) return "Completed";
    return status || "Pending";
  };
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case "active": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Reservations</h1>

      {fetching || authLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : reservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((res) => {
            const status = getReservationStatus(res.startDate, res.endDate, res.status);
            const statusColorClass = getStatusColor(status);
            const startDate = new Date(res.startDate);
            const endDate = new Date(res.endDate);
            const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

            // If you want to store "existingReview" in res, do so. 
            // Or fetch it from your backend. For simplicity, not shown here.

            return (
              <div key={res.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Listing Image */}
                <div className="relative h-48 bg-gray-200">
                  {res.listingDetails && res.listingDetails.listingImages && res.listingDetails.listingImages.length > 0 ? (
                    <Image 
                      src={res.listingDetails.listingImages[0].url}
                      alt={res.listingDetails?.title || "Listing image"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold ${statusColorClass}`}>
                    {status}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-1">
                    {res.listingDetails?.title || `Reservation #${res.id.substring(0, 8)}`}
                  </h2>
                  <div className="flex items-center mb-3">
                    <div className="flex-1">
                      <p className="text-gray-700">
                        <span className="font-semibold">Rental Period:</span>
                      </p>
                      <p className="text-gray-700">
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} 
                        <span className="text-gray-500 text-sm ml-1">({durationDays} days)</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-sm">Total</p>
                      <p className="text-green-600 font-bold text-lg">${res.totalPrice}</p>
                    </div>
                  </div>
                  
                  {/* Cancel if not completed */}
                  <div className="flex justify-between items-center">
                    <Link 
                      href={`/listing/${res.listingId}`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View Listing
                    </Link>
                    {status !== "Cancelled" && status !== "Completed" && (
                      <button
                        onClick={() => confirmDelete(res.id, {
                          title: res.listingDetails?.title,
                          startDate: startDate.toLocaleDateString(),
                          endDate: endDate.toLocaleDateString(),
                          totalPrice: res.totalPrice
                        })}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* If Completed => allow user to create/edit a review */}
                  {status === "Completed" && (
                    <div className="mt-4">
                      {/* If user has a review, user can "Edit"; else "Write" */}
                      {/* For simplicity, let's always show "Write/Edit" button */}
                      {reviewFormOpen === res.listingId ? (
                        <ReviewForm
                          listingId={res.listingId}
                          existingReview={editReviewData} // or null
                          onClose={() => {
                            setReviewFormOpen(null);
                            setEditReviewData(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setReviewFormOpen(res.listingId);
                            // If we have existing review data, set it
                            // setEditReviewData(existingReviewOrNull);
                          }}
                          className="px-3 py-1 bg-orange-100 text-orange-600 rounded-md hover:bg-orange-200 text-sm"
                        >
                          {editReviewData ? "Edit Review" : "Write a Review"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-2">No Reservations Found</h2>
          <p className="text-gray-600 mb-6">You haven't made any reservations yet.</p>
          <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block">
            Explore Listings
          </Link>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-3">Cancel Reservation</h3>
            {deleteConfirmation.reservationDetails && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="font-semibold">{deleteConfirmation.reservationDetails.title || "Reservation"}</p>
                <p className="text-sm text-gray-600">
                  {deleteConfirmation.reservationDetails.startDate} - {deleteConfirmation.reservationDetails.endDate}
                </p>
                <p className="text-green-600 font-semibold mt-1">
                  ${deleteConfirmation.reservationDetails.totalPrice}
                </p>
              </div>
            )}
            <p className="mb-6">
              Are you sure you want to cancel this reservation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                disabled={deleting}
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Go Back
              </button>
              <button
                onClick={deleteReservation}
                disabled={deleting}
                className={`px-4 py-2 rounded-md text-white flex items-center justify-center gap-2
                  ${deleting ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}
                `}
              >
                {deleting ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Inline Review Form ==========

function ReviewForm({ listingId, existingReview, onClose }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [description, setDescription] = useState(existingReview?.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem("token");

      // If we have existingReview, we do PUT; else we do POST
      if (existingReview) {
        // Edit
        await axios.put(
          `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/review/listing-review/${existingReview.id}`,
          { rating, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create
        await axios.post(
          `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/review/listing/${listingId}`,
          { rating, description },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      onClose();
    } catch (err) {
      console.error("Review submit error:", err);
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/review/listing-review/${existingReview.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onClose();
    } catch (err) {
      console.error("Error deleting review:", err);
      setError(err.response?.data?.message || "Failed to delete review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border p-4 rounded bg-orange-50 mt-2">
      {error && (
        <div className="text-red-600 mb-2">{error}</div>
      )}

      <label className="block mb-2 font-medium">
        Rating (0-5):
        <input
          type="number"
          step="0.5"
          min="0"
          max="5"
          className="border p-1 ml-2 rounded w-20"
          value={rating}
          onChange={e => setRating(e.target.value)}
        />
      </label>
      
      <label className="block mb-2 font-medium">
        Comment (max 250 chars):
        <textarea
          maxLength={250}
          className="border rounded w-full p-1 mt-1"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </label>

      <div className="flex justify-end items-center space-x-2 mt-2">
        {/* If editing, also show "Delete" */}
        {existingReview && (
          <button
            onClick={handleDeleteReview}
            disabled={submitting}
            className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete
          </button>
        )}
        <button
          onClick={onClose}
          disabled={submitting}
          className="px-3 py-1 border rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`px-3 py-1 text-white rounded-md text-sm ${submitting ? 'bg-orange-300' : 'bg-orange-500 hover:bg-orange-600'}`}
        >
          {submitting ? "Submitting..." : existingReview ? "Save" : "Submit"}
        </button>
      </div>
    </div>
  );
}
