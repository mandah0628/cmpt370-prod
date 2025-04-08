"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function ContactPage() {
  const { authState } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: 'general',
    subject: '',
    message: '',
    urgency: 'normal'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill name and email if user is logged in
  useEffect(() => {
    if (authState && authState.user) {
      setFormData(prev => ({
        ...prev,
        name: authState.user.name || '',
        email: authState.user.email || ''
      }));
    }
  }, [authState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step) => {
    setError(null);
    
    if (step === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your name');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email');
        return false;
      }
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else if (step === 2) {
      if (!formData.subject.trim()) {
        setError('Please enter a subject');
        return false;
      }
    } else if (step === 3) {
      if (!formData.message.trim()) {
        setError('Please enter a message');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Simulate sending the contact form data
      // In a real app, you would send this to your backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send message. Please try again later.');
      console.error('Error sending contact form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      reason: 'general',
      subject: '',
      message: '',
      urgency: 'normal'
    });
    setCurrentStep(1);
    setSubmitted(false);
  };

  // Define the content for each step
  const stepContent = {
    1: (
      <div className="space-y-6">
        <div className="mb-6">
          <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="Your Full Name"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="your.email@example.com"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">Phone (optional)</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="(123) 456-7890"
          />
        </div>
      </div>
    ),
    2: (
      <div className="space-y-6">
        <div className="mb-6">
          <label htmlFor="reason" className="block text-gray-700 font-medium mb-2">Reason for Contact</label>
          <select
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
          >
            <option value="general">General Inquiry</option>
            <option value="support">Technical Support</option>
            <option value="feedback">Feedback</option>
            <option value="business">Business Partnership</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="subject" className="block text-gray-700 font-medium mb-2">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="What is this regarding?"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="urgency" className="block text-gray-700 font-medium mb-2">Urgency</label>
          <div className="flex gap-4">
            {['low', 'normal', 'high'].map((level) => (
              <div key={level} className="flex items-center">
                <input
                  type="radio"
                  id={`urgency-${level}`}
                  name="urgency"
                  value={level}
                  checked={formData.urgency === level}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor={`urgency-${level}`} className="capitalize">
                  {level}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    3: (
      <div className="space-y-6">
        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 font-medium mb-2">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows="8"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="Please provide details about your inquiry..."
          ></textarea>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Review Your Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{formData.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Subject</p>
              <p className="font-medium">{formData.subject}</p>
            </div>
            <div>
              <p className="text-gray-600">Reason</p>
              <p className="font-medium capitalize">{formData.reason.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  // Define button text based on current step
  const buttonText = {
    1: 'Continue',
    2: 'Next Step',
    3: 'Submit Message'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-3 text-center text-gray-800">Contact Us</h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          We're here to help! Fill out the form below and our team will get back to you as soon as possible.
        </p>
        
        {submitted ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your message has been sent successfully. Our team will review your inquiry and get back to you as soon as possible.
            </p>
            <button 
              onClick={resetForm}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-7 gap-8">
            {/* Left Column - Image and Contact Info */}
            <div className="md:col-span-3 hidden md:block">
              <div className="bg-white p-6 rounded-2xl shadow-xl h-full relative overflow-hidden">
                <div className="relative h-60 mb-8 rounded-xl overflow-hidden">
                  {/* Fallback div in case the image fails to load */}
                  <div className="absolute inset-0 bg-orange-100 flex items-center justify-center">
                    <div className="p-8 text-center">
                      <h3 className="text-2xl font-bold text-orange-800 mb-2">TOOLOOP</h3>
                      <p className="text-orange-700">Your Tool Rental Solution</p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Our Contact Details</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Email</h4>
                      <p className="text-gray-600">support@tooloop.com</p>
                      <p className="text-gray-500 text-sm mt-1">Response time: 24-48 hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Phone</h4>
                      <p className="text-gray-600">(123) 456-7890</p>
                      <p className="text-gray-500 text-sm mt-1">Mon-Fri, 9am-5pm CST</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full mr-4">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Address</h4>
                      <p className="text-gray-600">123 Main Street</p>
                      <p className="text-gray-600">Saskatoon, SK, Canada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column - Contact Form */}
            <div className="md:col-span-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step} 
                        className={`flex flex-col items-center ${currentStep >= step ? 'text-orange-600' : 'text-gray-400'}`}
                      >
                        <div 
                          className={`w-10 h-10 flex items-center justify-center rounded-full mb-2 transition-colors ${
                            currentStep > step 
                              ? 'bg-orange-600 text-white' 
                              : currentStep === step 
                                ? 'bg-white text-orange-600 border-2 border-orange-600' 
                                : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {currentStep > step ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          ) : (
                            step
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {step === 1 ? 'Your Info' : step === 2 ? 'Details' : 'Message'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${(currentStep - 1) * 50}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
                  {/* Step Content */}
                  <div className="min-h-[340px]">
                    {stepContent[currentStep]}
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                    ) : (
                      <div></div> // Empty div to maintain spacing
                    )}
                    
                    <button
                      type="button"
                      onClick={currentStep === 3 ? handleSubmit : nextStep}
                      disabled={submitting}
                      className={`px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md ${
                        submitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitting ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </div>
                      ) : buttonText[currentStep]}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}