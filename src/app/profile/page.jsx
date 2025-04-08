"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const router = useRouter();
  const { authState, authLoading, logout } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);


  async function fetchUserInfo() {
    try {
      setLoading(true);

      const res = await axios.get( `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/get-user`);

      if (res.data.userData) {
        setUserDetails(res.data.userData);
      }

    } catch (error) {
      console.log("Error fetching profile data", error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center">
        <img
          className="h-24 w-24 mx-auto rounded-full object-cover border"
          src={userDetails.profilePicture || "/avatar.png"}
          alt="Profile Picture"
        />
        <h1 className="text-2xl font-bold text-gray-900 mt-4">{userDetails.name}</h1>
        <p className="text-gray-600">{userDetails.email}</p>
        <p className="text-gray-600">{userDetails.phone || "No phone number provided"}</p>
        <button
          onClick={logout}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
