import { useState } from "react";
import { apiprivate } from '../../services/api';
const AddHostelImages = () => {
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);

    // Generate preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      setMessage("Please select at least one image.");
      return;
    }

    const formData = new FormData();
    images.forEach((image) => formData.append("images", image));

    try {
      setLoading(true);
      setMessage("");
      const response = await apiprivate.post("/hostels/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(response.data.message);
      setImages([]);
      setPreviewUrls([]);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to upload images");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Hostel Images</h1>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
        className="mb-4"
      />

      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {previewUrls.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Preview ${index}`}
              className="w-full h-32 object-cover rounded shadow"
            />
          ))}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Images"}
      </button>

      {message && <p className="mt-4 text-center text-red-600">{message}</p>}
    </div>
  );
};

export default AddHostelImages;
