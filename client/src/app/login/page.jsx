"use client";

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";

export default function Login(){
  const router = useRouter();

  // useState hooks
  const [userDetails, setUserDetails] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [uploading, setUploading] = useState(false);


  // login function from context
  const { login, authState, authLoading } = useAuth();

  // client side form validation
  const validateForms = () => {
    let newErrors = {};

    if (!userDetails.email) {
      newErrors.email = "Email is required";
    }

    if (!userDetails.password) {
      newErrors.password = "Password is required";
    }

    // update client side errors
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // user input change handler
  const handleChange = (e) => {
    setUserDetails( {...userDetails, [e.target.name] : e.target.value} );

    // clears the server and client side error
    setErrors(  {...errors, [e.target.name] : "" } );
    setServerError("");
  };


  // login handler
  const handleLogin = async (e) => {
    e.preventDefault();

    // client side form validation
    if (!validateForms()) {
      return;
    }
  
    // resets the server error
    setServerError("");
    setUploading(true);
  
    try {
      await login(userDetails.email, userDetails.password);
    } catch (error) {
      setServerError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };
  

  useEffect(() => {
    if (authState && !authLoading) {
      router.push("/");
    }
  }, [authLoading,authState,router])
  

  if (authLoading) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="flex flex-col flex-grow">

      {/* Main Content */}
      <main className="flex-grow bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md space-y-6">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Login
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Manage your account details.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>

            {/* container for email and password */}
            <div className="space-y-4">

              {/* container for email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  required
                  id="email"
                  name="email"
                  type="email"
                  value={userDetails.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {/* if client side validation return an error */}
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* container for password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  required
                  id="password"
                  name="password"
                  type="password"
                  value={userDetails.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {/* if client side validation return an error */}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* displays server response error, if there is any */}
            {serverError && <p className="text-red-500 text-xs mt-2 text-center">{serverError}</p>}

            {/* submission button container */}
            <div>
            <button
              disabled={uploading}
              type="submit"
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin text-white"
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
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Logging in...
                </div>
              ) : (
                "Confirm"
              )}
            </button>
              <p className="text-center text-sm mt-4">
                Don't have an account? <Link href="/register" className="text-orange-500 hover:text-orange-600">Register</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
