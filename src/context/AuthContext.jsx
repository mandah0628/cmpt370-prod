"use client"

import { createContext, useState, useContext, useEffect } from 'react';
import axios from '../lib/api';

// Create context
const AuthContext = createContext();

// Provider component
export default function AuthProvider ({ children }) {
  const [authState, setAuthState] = useState(false);
  const [authLoading, setLoading] = useState(true);
  
  // checks if user is logged in on initial load
  useEffect(() => {
    isTokenValid();
  }, []);

  // validates token authenticity on page load
  const isTokenValid = async () => {
    setLoading(true);

    // gets token
    const token = localStorage.getItem("token");

    // if token already doesn't exist
    if (!token) {
      setAuthState(false);
      setLoading(false);
      return;
    }

    // if there is a token
    try {
      // sends request to validate token
      const response = await axios.get(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/auth/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // if token is valid
      if (response.status === 200) {
        setAuthState(true);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthState(false);
      } else {
        console.log("Validation request failed:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  // Login function
  const login = async (email, password) => {
    try {
      // backend server expects an object
      const userDetails = {email, password};
      // sends request to validate credentials
      const response = await axios.post(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/login`, userDetails);


      // if login is successful, the server sends a token
      if(response.data.token) {
        // stores token
        localStorage.setItem("token", response.data.token);

        // sets global auth state to true
        setAuthState(true);
        return response.data.token;
      }

      // somehow if token was not received
      throw new Error("Unexpected response. No token received");

    // if server did not send a token
    } catch (error) {
      // Check if Axios error has a response
      if (error.response) {
        // If there's a response, check for specific error codes
        if (error.response.status === 401) {
          throw new Error("Wrong username or password.");
        } else {
          throw new Error(error.response?.data?.message || "Login failed. Please try again.");
        }
      } else if (error.request) {
        // If the error is a network issue or no response was received
        console.error("No response received:", error.request);
        throw new Error("Login failed due to a network issue. Please check your connection.");
      } else {
        // If an unknown error occurred during request setup
        console.error("Error during setup:", error.message);
        throw new Error("Login failed. Please try again.");
      }
    }
  };

  // Register function
  const register = async (userDetails) => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/user/register`, userDetails);


      // if user is created successfully
      if (response.status === 201) {
        const token = response.data?.token;

        if (token) {
          localStorage.setItem("token", token)
          setAuthState(true);
          return token;
        }
      }
  
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    setAuthState(false);
  };

  // values and functions that are accessible globally
  return (
    <AuthContext.Provider value={{
      authState,
      authLoading,
      isTokenValid,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// creates hook to use the global functions and values
export const useAuth = () => {
  const context = useContext(AuthContext);
  // preventing to use the context outside of its scope
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};