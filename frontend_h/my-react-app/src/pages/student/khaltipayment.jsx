import { useEffect, useState } from "react";
import { apiprivate } from "../../services/api";
import { useParams, useNavigate, useLocation } from "react-router";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

export default function KhaltiPayment() {
  const { feeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feeDetails, setFeeDetails] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  useEffect(() => {
    const fetchFeeDetails = async () => {
      if (!feeId) {
        setError("No fee ID provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch fee details using axios
        const res = await apiprivate.get(`/fees/viewFeeBystudent`);
        // Note: The original API was fetch(`http://localhost:5000/api/fees/viewFeeBystudent`)
        // Assuming viewFeeBystudent returns all fees or filters by context. 
        // Wait, the original code didn't use feeId in the URL? 
        // Original: `http://localhost:5000/api/fees/viewFeeBystudent`
        // It seems it returns a list or a specific fee?
        // Let's look at the response handling: `setFeeDetails(feeData)`.
        // If it returns a list, this might be wrong.
        // But assuming the endpoint logic is "get fee for THIS student", it returns an object? 
        // Let's trust the original endpoint string.

        // Actually, viewing previous file content:
        // const feeRes = await fetch(`http://localhost:5000/api/fees/viewFeeBystudent`, ...);
        // const feeData = await feeRes.json();
        // setFeeDetails(feeData);
        // const balance = feeData.amountDue ...
        // So it returns a SINGLE object.

        const feeData = res.data;
        setFeeDetails(feeData);

        const balance = feeData.amountDue - (feeData.amountPaid || 0);
        if (balance <= 0) {
          setError("This fee has already been paid");
          setLoading(false);
          return;
        }

        if (balance < 10) {
          setError(`Minimum payment amount is Rs. 10. Your balance is Rs. ${balance}`);
          setLoading(false);
          return;
        }

        // Initiate Khalti payment
        await initiateKhaltiPayment(null, feeData); // Token handled by interceptor

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Failed to process payment");
        setLoading(false);
      }
    };

    fetchFeeDetails();
  }, [feeId, navigate, location.pathname]);

  const initiateKhaltiPayment = async (_, feeData) => {
    try {
      const res = await apiprivate.post("/khalti/fee/initiate", { feeId });

      const data = res.data;
      if (!data.payment_url) throw new Error("No payment URL received from server");

      setPaymentInitiated(true);

      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1500);

    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.response?.data?.message || err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleCancel = () => navigate("/fee");
  const handleRetry = () => window.location.reload();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <button onClick={handleCancel} className="flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <ArrowLeft size={20} /> Back to Fees
          </button>
          <h1 className="text-2xl font-bold">Secure Payment</h1>
          <p className="text-blue-100 mt-1">Processing via Khalti</p>
        </div>

        <div className="p-6">
          {loading && !paymentInitiated && (
            <div className="space-y-6 text-center py-8">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
              <h3 className="text-lg font-semibold text-gray-800">Preparing your payment</h3>
              <p className="text-gray-600">Please wait while we connect to Khalti...</p>
              {feeDetails && (
                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  <p className="text-sm text-gray-600">Fee Details:</p>
                  <p className="font-medium text-gray-800">
                    Amount Due: Rs. {feeDetails.amountDue - (feeDetails.amountPaid || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Fee ID: {feeId}</p>
                </div>
              )}
            </div>
          )}

          {paymentInitiated && (
            <div className="space-y-6 text-center py-8">
              <CheckCircle className="text-green-500 mx-auto" size={64} />
              <h3 className="text-xl font-bold text-gray-800">Payment Ready!</h3>
              <p className="text-gray-600">You will be redirected to Khalti payment page...</p>
            </div>
          )}

          {error && (
            <div className="space-y-6 py-6 text-center">
              <XCircle className="text-red-600 mx-auto" size={48} />
              <h3 className="text-xl font-bold text-gray-800">Payment Failed</h3>
              <p className="text-gray-600 mt-2">{error}</p>
              <div className="mt-4 flex flex-col gap-3">
                <button onClick={handleRetry} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Try Again</button>
                <button onClick={handleCancel} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 flex items-start gap-3">
            <CheckCircle className="text-green-600" size={20} />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">Secure Payment</p>
              <p className="text-xs text-gray-500 mt-1">
                Your payment is processed securely via Khalti. We do not store your card details.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
          Having issues?{" "}
          <a href="mailto:support@hostel.com" className="text-blue-600 hover:underline">Contact support</a>
        </div>
      </div>
    </div>
  );
}
