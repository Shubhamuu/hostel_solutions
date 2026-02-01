import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiprivate } from "../../services/api"; // axios instance with token

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feeDetails, setFeeDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const pidx = query.get("pidx");
        const status = query.get("status");

        if (!pidx) {
          throw new Error("Missing payment identifier (pidx)");
        }

        // Optional: Check status from URL before making API call
        if (status === "User canceled") {
          throw new Error("Payment was canceled by user");
        }

        // Call backend to verify payment
        const { data } = await apiprivate.post("/khalti/verify", { pidx });

        setFeeDetails(data.fee); // backend returns fee details
        setLoading(false);

        // Auto-redirect after 3 seconds
        setTimeout(() => navigate("/fee"), 3000);
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.message || err.message || "Payment verification failed");
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
        {loading && !error && (
          <div className="space-y-6 py-8">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
            <p className="text-gray-700 font-medium">Verifying payment...</p>
          </div>
        )}

        {!loading && feeDetails && !error && (
          <div className="space-y-6 py-8">
            <CheckCircle className="text-green-500 mx-auto" size={64} />
            <h2 className="text-xl font-bold text-gray-800">Payment Successful!</h2>
            <div className="bg-green-50 p-4 rounded-lg text-left">
              <p className="text-gray-600 text-sm">Fee ID: {feeDetails._id}</p>
              <p className="text-gray-800 font-medium">
                Amount Paid: Rs. {feeDetails.amountPaid}
              </p>
              <p className="text-gray-600 text-sm">Status: {feeDetails.status}</p>
            </div>
            <p className="text-gray-500 text-sm mt-2">Redirecting to your fees page...</p>
            <button
              onClick={() => navigate("/fee")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Fees
            </button>
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
              onClick={() => navigate("/fee")}
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
