// components/HostelDetails.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiprivate } from "../../services/api";
import AdminNavbar from "../../components/common/adminNavbar";

const HostelDetail = () => {
  const [hostel, setHostel] = useState(null);
  const [originalHostel, setOriginalHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch hostel details with abort controller
  const fetchHostel = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const res = await apiprivate.get("/hostels/getHostel", {
        signal: abortControllerRef.current.signal,
      });
      
      // Extract data from the response structure
      const hostelData = res.data?.data || res.data;
      
      setHostel(hostelData);
      setOriginalHostel(hostelData);
      setHasUnsavedChanges(false);
    } catch (err) {
      if (err.name !== "CanceledError") {
        toast.error("Failed to fetch hostel details");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostel();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchHostel]);

  // Check for unsaved changes
  useEffect(() => {
    if (!originalHostel || !hostel) return;

    const hasChanges =
      originalHostel.name !== hostel.name ||
      originalHostel.address !== hostel.address ||
      originalHostel.isActive !== hostel.isActive;

    setHasUnsavedChanges(hasChanges);
  }, [hostel, originalHostel]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHostel((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Validate and set image file
  const handleImageFile = (file) => {
    // Validate file type
    if (!file.type.match("image.*")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setNewImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    handleImageFile(file);
  };

  // Clear image selection
  const clearImageSelection = () => {
    setNewImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload new image with optimistic update
  const handleImageUpload = async () => {
    if (!newImage) {
      toast.error("Please select an image to upload");
      return;
    }

    const formData = new FormData();
    formData.append("images", newImage);

    // Create temporary image object for optimistic update
    const tempImage = {
      _id: `temp-${Date.now()}`,
      url: imagePreview,
      uploadedAt: new Date().toISOString(),
      isTemporary: true,
    };

    try {
      setUploadingImage(true);

      // Optimistic update
      setHostel((prev) => ({
        ...prev,
        images: [...(prev.images || []), tempImage],
      }));

      const response = await apiprivate.post("/hostels/addImage", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Get the newly uploaded image (last one in the images array)
      const uploadedImages = response.data?.images || [];
      const uploadedImage = uploadedImages[uploadedImages.length - 1];
      
      if (uploadedImage) {
        // Replace temporary image with actual response
        setHostel((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img._id === tempImage._id ? uploadedImage : img
          ),
        }));
      } else {
        // If we can't find the uploaded image, just update with all images from response
        setHostel((prev) => ({
          ...prev,
          images: uploadedImages,
        }));
      }

      toast.success(response.data?.message || "Image uploaded successfully!");
      clearImageSelection();
    } catch (err) {
      // Revert optimistic update on error
      setHostel((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img._id !== tempImage._id),
      }));

      toast.error(err.response?.data?.message || "Failed to upload image");
      console.error(err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Delete image with optimistic update
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    // Store the image for rollback
    const imageToDelete = hostel.images.find((img) => img._id === imageId);

    try {
      setDeletingImageId(imageId);

      // Optimistic update
      setHostel((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img._id !== imageId),
      }));

      await apiprivate.delete(`/hostels/delete-image/${imageId}`);

      toast.success("Image deleted successfully!");
    } catch (err) {
      // Revert optimistic update on error
      if (imageToDelete) {
        setHostel((prev) => ({
          ...prev,
          images: [...prev.images, imageToDelete],
        }));
      }

      toast.error(err.response?.data?.message || "Failed to delete image");
      console.error(err);
    } finally {
      setDeletingImageId(null);
    }
  };

  // Update hostel details
  const handleUpdate = async () => {
    if (!hostel.name?.trim() || !hostel.address?.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    const previousHostel = { ...originalHostel };

    try {
      setUpdating(true);

      const updateData = {
        name: hostel.name.trim(),
        address: hostel.address.trim(),
        isActive: hostel.isActive,
      };

      await apiprivate.put("/hostels/update", updateData);

      // Update original hostel state
      setOriginalHostel(hostel);
      setHasUnsavedChanges(false);

      toast.success("Hostel details updated successfully!");
    } catch (err) {
      // Revert to previous state on error
      setHostel(previousHostel);

      toast.error(err.response?.data?.message || "Failed to update hostel");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (window.confirm("Are you sure you want to discard all changes?")) {
      setHostel(originalHostel);
      setHasUnsavedChanges(false);
      toast.info("Changes discarded");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-[#0B0D10] via-[#0F1115] to-[#0B0D10]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-amber-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-8 bg-amber-500 rounded-full opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-amber-400 font-medium">Loading hostel details...</p>
      </div>
    );
  }

  // No hostel found state
  if (!hostel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#0F1115] to-[#0B0D10]">
        <AdminNavbar />
        <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] text-center px-4">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-amber-500/20 max-w-md">
            <div className="text-6xl mb-4">🏨</div>
            <h2 className="text-2xl font-bold text-amber-400 mb-2">No Hostel Found</h2>
            <p className="text-gray-400 mb-6">
              No hostel details are available at the moment.
            </p>
            <button
              onClick={fetchHostel}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#0F1115] to-[#0B0D10] text-white">
      <AdminNavbar />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="bg-gray-800 text-white"
      />

      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 mb-2">
                Edit your hostel Details
              </h1>
              <p className="text-gray-400">Manage your hostel information and gallery</p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-400 font-medium">Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className="mb-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-400">Gallery</h2>
              <p className="text-sm text-gray-400">Manage hostel images</p>
            </div>
          </div>

          {/* Current Images */}
          {hostel.images && hostel.images.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-300 flex items-center gap-2">
                <span>Current Images</span>
                <span className="text-sm font-normal text-gray-500">
                  ({hostel.images.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostel.images.map((img) => (
                  <div
                    key={img._id}
                    className="relative group overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={img.url}
                        alt="Hostel"
                        className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                          img.isTemporary ? "opacity-50" : ""
                        }`}
                      />
                      {img.isTemporary && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-t from-gray-900 to-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          <span className="block">
                            {new Date(img.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteImage(img._id)}
                          disabled={deletingImageId === img._id || img.isTemporary}
                          className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/50"
                          title="Delete image"
                        >
                          {deletingImageId === img._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-8 text-center py-12 bg-gray-800/30 rounded-xl border-2 border-dashed border-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400">No images uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Upload your first image below</p>
            </div>
          )}

          {/* Upload New Image */}
          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Upload New Image</h3>

            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                dragActive
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-gray-700 bg-gray-800/30 hover:border-amber-500/50 hover:bg-gray-800/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {imagePreview ? (
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="relative w-full md:w-48 h-48 rounded-xl overflow-hidden border-2 border-amber-500 shadow-lg shadow-amber-500/20">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={clearImageSelection}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-white mb-2">Selected File</h4>
                      <p className="text-sm text-gray-400 mb-1">
                        <span className="text-amber-400">{newImage.name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {(newImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleImageUpload}
                        disabled={uploadingImage}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Upload Image</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={clearImageSelection}
                        disabled={uploadingImage}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-lg font-medium text-gray-300 mb-2">
                    Drag and drop your image here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/30"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-500 mt-4">
                    Supported formats: JPG, PNG, WebP • Max size: 5MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-amber-400">Hostel Information</h2>
              <p className="text-sm text-gray-400">Update hostel details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Hostel Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Hostel Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={hostel.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200"
                placeholder="Enter hostel name"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={hostel.address}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 resize-none"
                placeholder="Enter full hostel address"
              />
            </div>

            {/* Active Status */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-xl p-5 border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={hostel.isActive}
                      onChange={handleChange}
                      className="sr-only peer"
                      id="isActiveCheckbox"
                    />
                    <label
                      htmlFor="isActiveCheckbox"
                      className="flex items-center cursor-pointer"
                    >
                      <div className="relative w-14 h-7 bg-gray-700 peer-focus:ring-2 peer-focus:ring-amber-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-yellow-500"></div>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="isActiveCheckbox" className="text-white font-semibold cursor-pointer block">
                      Hostel is Active
                    </label>
                    <p className="text-xs text-gray-400">
                      {hostel.isActive ? "Accepting new bookings" : "Not accepting bookings"}
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  hostel.isActive
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {hostel.isActive ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last updated: {new Date(hostel.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleDiscardChanges}
                      disabled={updating}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Discard
                    </button>
                  )}
                  <button
                    onClick={handleUpdate}
                    disabled={updating || !hasUnsavedChanges}
                    className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelDetail;