"use client";

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// register component
export default function Register() {
  const router = useRouter();

  // useState hooks
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [userDetails, setUserDetails] = useState({ name: '', email: '', password: '' , confirmPassword: ""});
  
  // register function from context
  const {register, authLoading, authState} = useAuth();

  // input field change
  const handleChange = (e) => {
    setUserDetails( {...userDetails, [e.target.name] : e.target.value} );
    setErrors( {...errors, [e.target.name] : ""} );
    setServerError("");
  };

  // validate forms
  const validateForms = () => {
    // creates an empty object
    // resets everytime the function is run
    let newErrors = {};

    // regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // name validatiob
    if(!userDetails.name.trim()){
      newErrors.name = "Name is required";
    }

    // email validtaion
    if(!userDetails.email.trim()){
      newErrors.email = "Email is required";
    // email format validation
    } else if (!emailRegex.test(userDetails.email.trim())) {
      newErrors.email = "Invalid email format";
    }

    // password valiadtion
    if(!userDetails.password.trim()){
      newErrors.password = "Password is required";
    } else if (userDetails.password.length < 8) {
      newErrors.password = "Password must be more than 8 characters"
    }
 
    // confirm password validation
    if (!userDetails.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    // password matching validation
    } else if (userDetails.confirmPassword !== userDetails.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // update errors state to render if there is any
    setErrors(newErrors);

    // checks the if the number of keys are zero,
    // if it is, that means there are no keys,
    // which means that there are no form validation errors
    return Object.keys(newErrors).length === 0;
  }

  // submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // validate the forms
    if (!validateForms()) {
      return;
    }

    setServerError("");
    setUploading(true);

    // fetch response
    try {
      await register(userDetails);
      router.push("/");
    } catch (error) {
      setServerError(error.response?.data?.message || "Registration failed. Please Try again");
    } finally{
      setUploading(false);
    }
  }


  useEffect(() => {
    if (authState && !authLoading) {
      router.push("/");
    }
  }, [authLoading, authState, router]);
  

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
          {/* header container */}
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Register
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Create a new account.
            </p>
          </div>

          {/* form container */}
          <form 
            onSubmit={handleSubmit}
            className="mt-8 space-y-6">
            <div className="space-y-4">

              {/* name container */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  required
                  id="name"
                  name="name"
                  type="text"
                  value={userDetails.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* email containter */}
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
                {errors.email && <p className='text-red-500 text-xs mt-1'>{errors.email}</p>}
              </div>

              {/* password container */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
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
                {errors.password && <p className='text-red-500 text-xs mt-1'>{errors.password}</p>}
              </div>

              {/* confirm password container */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  required
                  id="confirmPassword"
                  name="confirmPassword"
                  type='password'
                  value={userDetails.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.confirmPassword && <p className='text-red-500 text-xs mt-1'>{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* displays server response error, if there is any */}
            {serverError && <p className="text-red-500 text-xs mt-2 text-center">{serverError}</p>}

            {/* submit button container */}
            <div>
              <button
                disabled={uploading}
                type='submit'
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                {uploading ? "Signing up..." : "Sign Up"}
              </button>
              <p className="text-center text-sm mt-4">
                Already have an account? <Link href="/login" className="text-orange-500 hover:text-orange-600">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
