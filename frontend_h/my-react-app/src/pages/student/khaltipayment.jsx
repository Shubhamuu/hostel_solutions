import { useEffect, useState } from "react";
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
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      if (!feeId) {
        setError("No fee ID provided");
        setLoading(false);
        return;
      }

      try {
        // Fetch fee details
        const feeRes = await fetch(`http://localhost:5000/api/fees/viewFeeBystudent`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (feeRes.status === 401 || feeRes.status === 403) {
          localStorage.clear();
          navigate("/login", { state: { from: location.pathname } });
          return;
        }

        if (!feeRes.ok) {
          const errData = await feeRes.json();
          throw new Error(errData.message || "Failed to fetch fee details");
        }

        const feeData = await feeRes.json();
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
        await initiateKhaltiPayment(token, feeData);

      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to process payment");
        setLoading(false);
      }
    };

    fetchFeeDetails();
  }, [feeId, navigate, location.pathname]);

  const initiateKhaltiPayment = async (token, feeData) => {
    try {
      const res = await fetch("http://localhost:5000/api/khalti/fee/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feeId }),
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment initiation failed");

      if (!data.payment_url) throw new Error("No payment URL received from server");

      setPaymentInitiated(true);

      // Store pidx if needed for local reference, though mostly handled by callback
      // localStorage.setItem('current_payment_pidx', data.pidx);

      // Redirect after showing success message
      setTimeout(() => {
        window.location.href = data.payment_url;
      }, 1500);

    } catch (err) {
      console.error("Payment initiation error:", err);
      setError(err.message || "Failed to initiate payment");
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
