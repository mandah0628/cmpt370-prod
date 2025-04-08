"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import axios from "axios";
import Image from "next/image";
import categories from "@/utils/categories"; 


export default function EditListingPage() {
  // get dynamic route parameter
  const {id: listingId} = useParams()
  // router
  const router = useRouter()
  // authentication states
  const {authState, authLoading} = useAuth();
 
  
  // listing form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    rate: "",
    tags: [],
    listingImages: [] 
  });
  // original listing data to compare later
  // when submitting changes
  const [originalData, setOriginalData] = useState({});


  // tag input state
  const [tagInput, setTagInput] = useState("");


  // new images to add
  const [newImages, setNewImages] = useState([]);
  // original images to remove
  const [imagesToRemove, setImagesToRemove] = useState([]);
  

  // form submitting state
  const [submitting, setSubmitting] = useState(null)
  // listing fetching state
  const [fetching, setFetching] = useState(true);


  // submit handler
  const handleSubmit = async (e) => {
    // gets token
    const token = localStorage.getItem("token");

    // prevents reload
    e.preventDefault();
    // update submitting state
    setSubmitting(true);

    // get the tag changes
    const newTags = formData.tags.filter((tag) => typeof tag ==="string");
    const tagsToRemove = originalData.tags.filter( originalTag => !formData.tags.some(updatedTag => updatedTag.id === originalTag.id) );

    // start adding data to send to the formData
    // to send as multi-part form data
    const formToSend = new FormData();
    formToSend.append("title", formData.title);
    formToSend.append("category", formData.category);
    formToSend.append("description", formData.description);
    formToSend.append("rate", formData.rate);

    formToSend.append("tagsToRemove", JSON.stringify(tagsToRemove));
    formToSend.append("newTags", JSON.stringify(newTags))
    
    formToSend.append("imagesToRemove", JSON.stringify(imagesToRemove));
    newImages.forEach((image) => {
      formToSend.append("newImages",image)
    });

    formToSend.append("listingId", listingId);

    console.log(newTags);
    try {
      const res = await axios.put(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/edit-listing`, 
        formToSend, { headers: {Authorization : `Bearer ${token}`} }
      )

      const listingId = res.data?.listingId;
      // if request is successful, navigate to the listing page
      // to show the updated info
      router.push(`/listing/${listingId}`)
    } catch (error) {
      console.error("Error updating listing:", error.response?.data?.message || error.message);
      // if reqeust is unsuccessful
      // take the user to the previous page
      router.back();
    }
  }


  const fetchListingInfo = async () => {
    try {
      // fetching
      setFetching(true);
      // sending get request with the listingId
      const res = await axios.get(`${process.env.NEXT_PUBLIC_EXPRESS_BASE_URL}/listing/get-listing`,
        { params: {listingId} }
      )

      // save the original 
      setOriginalData(res.data?.listing);

      //render the fetched data
      setFormData(res.data?.listing);

    } catch (error) {
      console.error("Error fetching listing info");
    } finally {
      setFetching(false)
    }
  }

  // handle form changes
  const handleChange = (e) => {
    setFormData( {...formData, [e.target.name] : e.target.value } )
  }

  // handle tag input change
  const handleTagChange = (e) => {
    setTagInput(e.target.value);
  }

  // add tag to the form data
  const addTag = () => {
      // updaye form data
      setFormData( (prev) => {
        // get rid of whitespace first
        const tag = tagInput.trim();
        // checks if tag is not an empty string and
        // array in form data doesnt have the same tag
        if(tag !== "" && !prev.tags.includes(tag)){
          return {...prev, tags: [...prev.tags, tag]};
        }

        return prev;
      });
    setTagInput("");
  }

  // add tag by pressing enter key
  const enterKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  }

  // remove tag
  const removeTag = (tagToRemove) => {
    setFormData( { ...formData, tags : formData.tags.filter((tag) => typeof tagToRemove === "string" ? tag !== tagToRemove: tag.id !== tagToRemove.id)} )
  }

  //
  const addImages = (e) => {
    // creates an array with the chose files
    const newImages = Array.from(e.target.files);
    // changes the form data state to show preview
    setFormData( (prev) => ( {...prev, listingImages: [...prev.listingImages, ...newImages]} ) );
    // update the new image array
    setNewImages((prev) => [...prev, ...newImages]);
  }

  const removeImage = (imageToRemove) => {
    if (!(imageToRemove instanceof File)) {
      // if the removed image is not an instance of File object(original image)
      // update the array by adding the image
      setImagesToRemove((prev) => [...prev, imageToRemove]);
    } else {
      // if the removed image is a new image uploaded by the user
      // update the array by removing the image
      setNewImages( (prev) => prev.filter((image) => imageToRemove.name !== image.name ));
    }
    setFormData((prev) => ({ ...prev, listingImages: prev.listingImages.filter((image) => image !== imageToRemove) }))  
  }

  // runs when the component first mounts
  // will start fetching info if
  // authenticated and finished checking authentication
  useEffect(() => {
    if(authState && !authLoading) {
      fetchListingInfo();
    }
  }, [authState,authLoading])

  // runs when the component first mounts
  // will navigate user to the login page if
  // not authenticated and finished checking authentication
  useEffect(() => {
    if (!authState && !authLoading) {
      router.push("/login");
    }
  }, [authState, authLoading, router])


  if (authLoading || fetching) {
    return (
      <div className="flex justify-center items-center mt-10">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  
  return (
    <div className="flex flex-col flex-grow items-center justify-center px-6 py-10 bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Listing</h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium">Title:</label>
            <input
              onChange={handleChange}
              required
              value={formData.title}
              name="title"
              className="border border-gray-300 rounded-md px-4 py-2 mt-1"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium">Description:</label>
            <textarea
              onChange={handleChange}
              required
              value={formData.description}
              name="description"
              className="border border-gray-300 rounded-md px-4 py-2 mt-1"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium">Select Category:</label>
            <select
              onChange={handleChange}
              required
              value={formData.category}
              name="category"
              className="border border-gray-300 rounded-md px-4 py-2 mt-1"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Rate */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium">Rate:</label>
            <input
              onChange={handleChange}
              required
              value={formData.rate}
              name="rate"
              type="text"
              className="border border-gray-300 rounded-md px-4 py-2 mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-gray-700 font-medium">Tags:</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-orange-300 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {tag.tag ? tag.tag : tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-white hover:text-black"
                    type='button'
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {/* Tag input section */}
            <input
              value={tagInput}
              onChange={handleTagChange}
              onKeyDown={enterKeyPress}
              type="text"
              placeholder="Add a tag..."
              className="border border-gray-300 rounded-md px-4 py-2 mt-2 w-full"
            />
          </div>


          {/* Image Upload */}
          <div>
            <input 
              type="file" multiple accept="image/*" 
              onChange={addImages} className="mt-2"
            />

            <div className="flex flex-wrap gap-4 mt-2">
              {formData.listingImages.map((image, index) => (
                <div key={index} className='relative'>
                  {/* Image previews */}
                  <Image 
                    src={image.url ? image.url : URL.createObjectURL(image)}
                    width={150} height={150} className="rounded-md" alt="Upload preview" 
                  />
              
                {/* button to remove images */}
                  <button
                    onClick={() => removeImage(image)}
                    type="button"
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>


          {/* Submit */}
          <button
            type="submit"
            className="bg-orange-500 text-white px-6 py-3 rounded-md w-full"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
