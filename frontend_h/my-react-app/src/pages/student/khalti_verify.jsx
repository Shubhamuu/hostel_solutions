import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import apiprivate from "../../services/api";
export default function KhaltiSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState("Verifying payment...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        // Get query params from URL
        const queryParams = new URLSearchParams(location.search);
        const payload = Object.fromEntries(queryParams.entries());
        console.log("Payment verification payload:", payload);
        // Send POST request to backend
     const res = await apiprivate.post(
  "/khalti/verify",
  payload,
  {
    headers: {
      "Content-Type": "application/json",
    },
  }
);

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Payment verification failed");
        }

        setStatus("Payment verified successfully!");
        setLoading(false);

        // Redirect to fee page after 2 seconds
        setTimeout(() => navigate("/fee"), 2000);
      } catch (err) {
        console.error("Payment verification error:", err);
        setError(err.message || "Payment verification failed");
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  const handleBack = () => {
    navigate("/fee");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
        {loading && !error && (
          <div className="space-y-6 py-8">
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
            <p className="text-gray-700 font-medium">{status}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6 py-8">
            <div className="flex justify-center">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            <p className="text-green-600 font-semibold">{status}</p>
            <p className="text-gray-600">Redirecting to your fees page...</p>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="text-red-600" size={48} />
              </div>
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
            <button
              onClick={handleBack}
              className="mt-4 w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 font-medium transition-colors"
            >
              Back to Fees
            </button>
          </div>
        )}
      </div>
    </div>
  );
}