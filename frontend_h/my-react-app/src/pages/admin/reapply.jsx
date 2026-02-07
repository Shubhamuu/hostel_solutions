import { useState } from "react";
import { UploadCloud, FileText, Loader2 } from "lucide-react";
import { apiprivate } from "../../services/api";
import { useNavigate } from "react-router";
const AdminReapplyVerification = () => {
   const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
const [hostelName, setHostelName] = useState("");
const [hostelAddress, setHostelAddress] = useState("");
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      setError("Please upload at least one verification document.");
      return;
    }
 if (!hostelName.trim()) {
    setError("Hostel name is required");
    return false;
  }

  if (hostelName.length < 3) {
    setError("Hostel name must be at least 3 characters");
    return false;
  }

  if (!hostelAddress.trim()) {
    setError("Hostel address is required");
    return false;
  } 
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("verificationDocuments", file);
      });
 formData.append("hostelName", hostelName.trim());
    formData.append("hostelAddress", hostelAddress.trim());
      const res = await apiprivate.post(
        "/users/reapply-verification", formData);



      setMessage(res.data?.message || "Re-application submitted successfully");
      setFiles([]);
      localStorage.setItem("user", JSON.stringify(res.data?.updatedUser || {}));
      setTimeout(() => navigate('/admin/dashboard'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to submit verification documents"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-[#0B0D10] flex items-center justify-center px-4 text-white">
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg bg-[#1C1F2A] border border-gray-800 rounded-3xl p-8"
    >
      <h1 className="text-2xl font-bold mb-2 text-center">
        Re-apply for Admin Approval
      </h1>

      <p className="text-sm text-gray-400 text-center mb-8">
        Upload valid documents to verify your hostel administration rights.
      </p>

      {/* Status */}
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-sm text-green-400 bg-green-500/10 p-3 rounded-xl">
          {message}
        </div>
      )}

      {/* Hostel Name */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">
          Hostel Name
        </label>
        <input
          type="text"
          value={hostelName}
          onChange={(e) => setHostelName(e.target.value)}
          placeholder="Enter hostel name"
          required
          className="w-full bg-[#0B0D10] border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Hostel Address */}
      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-1">
          Hostel Address
        </label>
        <textarea
          value={hostelAddress}
          onChange={(e) => setHostelAddress(e.target.value)}
          placeholder="Enter full hostel address"
          rows={3}
          required
          className="w-full bg-[#0B0D10] border border-gray-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Verification Document Upload */}
      <label className="block mb-6">
        <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 transition">
          <UploadCloud className="mx-auto mb-3 text-amber-400" size={32} />
          <p className="text-sm text-gray-300">
            Click to upload verification documents
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (JPG, PNG, WEBP — multiple images allowed)
          </p>
        </div>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp"
          required
        />
      </label>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mb-6 space-y-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              {file.name}
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-105 transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        Submit for Review
      </button>
    </form>
  </div>
);

};

export default AdminReapplyVerification;
