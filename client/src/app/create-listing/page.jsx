"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Image from "next/image";
import categories from "@/utils/categories";

export default function ListingForm() {
  // State for form data
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    rate: "",
    tags: [],
    images: [],
  });

  // State for UI
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  const router = useRouter();
  const { authLoading, authState } = useAuth();

  // Text input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tag input change
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Validation for each step
  const validateStep = (step) => {
    setError("");
    
    if (step === 1) {
      if (!formData.title.trim()) {
        setError("Please enter a title for your listing");
        return false;
      }
      if (!formData.category) {
        setError("Please select a category");
        return false;
      }
    } else if (step === 2) {
      if (!formData.description.trim()) {
        setError("Please enter a description");
        return false;
      }
      if (!formData.rate.trim() || isNaN(formData.rate) || parseFloat(formData.rate) <= 0) {
        setError("Please enter a valid rate (must be a positive number)");
        return false;
      }
    } else if (step === 3) {
      if (formData.images.length === 0) {
        setError("Please upload at least one image");
        return false;
      }
    }
    
    return true;
  };

  // Navigation between steps
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }
    
    const token = localStorage.getItem("token");
    setUploading(true);
    setError("");

    const formToSend = new FormData();
    formToSend.append("title", formData.title);
    formToSend.append("category", formData.category);
    formToSend.append("description", formData.description);
    formToSend.append("rate", formData.rate);
    formToSend.append("tags", JSON.stringify(formData.tags));

    formData.images.forEach((image) => {
      formToSend.append("image", image);
    });

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/create-listing`,
        formToSend,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const listingId = response.data.listingId;

      if (response.status === 201) {
        setSuccess("Listing created successfully!");
        // Short delay before redirecting
        setTimeout(() => {
          router.push(`/listing/${listingId}`);
        }, 1500);
      }
    } catch (error) {
      if (error.response) {
        const errorStatus = error.response.status;
        const errorMessage = error.response.data?.message;
        if (errorStatus === 400) {
          setError(errorMessage || "Invalid form data. Please check your inputs.");
        } else if (errorStatus === 401) {
          setError("You need to be logged in to create a listing.");
          setTimeout(() => router.push("/login"), 2000);
        } else {
          setError(errorMessage || "An unexpected error occurred. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // File handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const filesArray = Array.from(files);
    const newImages = [...formData.images, ...filesArray];
    
    // Create preview URLs
    const newPreviews = filesArray.map(file => URL.createObjectURL(file));
    
    setFormData({ ...formData, images: newImages });
    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...previewImages];
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData({ ...formData, images: newImages });
    setPreviewImages(newPreviews);
  };

  // Tag handling
  const addTag = () => {
    if (tagInput.trim() !== "" && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
    }
    setTagInput("");
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up all preview URLs
      previewImages.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  // Auth check
  useEffect(() => {
    if (!authLoading && !authState) {
      router.push("/login");
    }
  }, [authLoading, authState]);

  // Define content for each step
  const steps = {
    1: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h3>
        
        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-gray-700 font-medium block">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter a descriptive title for your tool"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-gray-700 font-medium block">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Why this matters</h4>
          <p className="text-blue-700 text-sm">
            A clear title and accurate category help potential renters find your tool quickly. 
            Be specific about what you're offering to attract the right customers.
          </p>
        </div>
      </div>
    ),
    
    2: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Listing Details</h3>
        
        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-gray-700 font-medium block">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            placeholder="Describe your tool, including condition, features, and any usage instructions"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Rate */}
        <div className="space-y-2">
          <label htmlFor="rate" className="text-gray-700 font-medium block">
            Daily Rate ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              id="rate"
              name="rate"
              type="text"
              value={formData.rate}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-sm text-gray-500">Enter your daily rental rate in dollars</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-gray-700 font-medium block">
            Tags <span className="text-gray-500 text-sm font-normal">(optional)</span>
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleEnterKey}
              placeholder="Enter a tag and press Enter"
              className="flex-grow px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-orange-500 text-white px-4 py-3 rounded-r-lg hover:bg-orange-600 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-orange-200">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-orange-500 hover:text-orange-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500">Add tags to help users find your listing (e.g., power tool, garden, workshop)</p>
        </div>
      </div>
    ),
    
    3: (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Photos</h3>
        
        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-gray-700 font-medium block">
            Photos <span className="text-red-500">*</span>
          </label>
          
          <div 
            className={`border-2 border-dashed p-6 rounded-lg text-center ${
              dragActive ? "border-orange-500 bg-orange-50" : "border-gray-300"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center gap-2">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p className="text-gray-700">Drag & drop your images here or <span className="text-orange-500 font-medium">browse</span></p>
                <p className="text-sm text-gray-500">Upload high quality images to showcase your tool</p>
              </div>
            </label>
          </div>

          {previewImages.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-700 font-medium mb-2">Preview:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previewImages.map((previewUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 w-full rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-white text-red-500 rounded-full w-6 h-6 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <h4 className="font-medium text-orange-800 mb-2">Photo tips</h4>
          <ul className="text-orange-700 text-sm list-disc pl-5 space-y-1">
            <li>Include multiple angles of your tool</li>
            <li>Show the tool in good lighting</li>
            <li>Highlight any special features or accessories included</li>
            <li>Make sure images are clear and in focus</li>
          </ul>
        </div>
        
        {/* Review Summary */}
        <div className="p-6 bg-gray-50 rounded-lg mt-6">
          <h4 className="font-medium text-gray-800 mb-4">Listing Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Title</p>
              <p className="font-medium">{formData.title}</p>
            </div>
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-medium">{formData.category}</p>
            </div>
            <div>
              <p className="text-gray-600">Rate</p>
              <p className="font-medium">${formData.rate}/day</p>
            </div>
            <div>
              <p className="text-gray-600">Photos</p>
              <p className="font-medium">{formData.images.length} uploaded</p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  // Show step buttons based on current step
  const renderStepButtons = () => {
    if (currentStep === 1) {
      return (
        <button
          type="button"
          onClick={nextStep}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
        >
          Continue
        </button>
      );
    } else if (currentStep === 2) {
      return (
        <div className="flex justify-between w-full">
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
          >
            Continue
          </button>
        </div>
      );
    } else {
      return (
        <div className="flex justify-between w-full">
          <button
            type="button"
            onClick={prevStep}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md flex items-center"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Listing...
              </>
            ) : (
              "Create Listing"
            )}
          </button>
        </div>
      );
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center text-gray-800">Create a Listing</h1>
        <p className="text-center text-gray-600 mb-10">Rent out your tools and earn money</p>
        
        {/* Progress bar */}
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
                  {step === 1 ? 'Basics' : step === 2 ? 'Details' : 'Photos'}
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
        
        {/* Main content */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {/* Success message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <p>{success}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Current step content */}
            {steps[currentStep]}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-end">
              {renderStepButtons()}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
