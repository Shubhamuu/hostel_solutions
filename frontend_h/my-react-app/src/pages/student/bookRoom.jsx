import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { Calendar, Home, AlertCircle, ArrowLeft, Loader2, CheckCircle, Clock, Info, DollarSign } from "lucide-react";
import axios from "axios";
import { format, addDays, addMonths } from "date-fns";
import { apiprivate } from "../../services/api";

const BookRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { roomNumber, roomPrice } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [roomDetails, setRoomDetails] = useState(null);
  const [formData, setFormData] = useState({
    moveInDate: "",
    duration: "3",
    agreeToTerms: false,
    agreeToFee: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Get token
  const getAccessToken = () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Authentication check
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login", { state: { from: location.pathname, message: "Please login to book a room", roomId, roomNumber } });
      return;
    }
    setAuthChecking(false);
  }, [navigate, location.pathname, roomId, roomNumber]);

  // Set default move-in date (3 days from now)
  useEffect(() => {
    if (!authChecking) {
      const defaultDate = addDays(new Date(), 3);
      setFormData(prev => ({ ...prev, moveInDate: format(defaultDate, "yyyy-MM-dd") }));
    }
  }, [authChecking]);

  // Fetch room details
  useEffect(() => {
    if (authChecking) return;

    const fetchRoom = async () => {
      try {
        const token = getAccessToken();
        const response = await axios.get(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
        setRoomDetails(response.data);
      } catch (err) {
        console.error("Room fetch error:", err);
        setApiError("Failed to fetch room details");
      }
    };

    fetchRoom();
  }, [roomId, authChecking]);

  // Calculate end date
  const calculateEndDate = () => {
    if (!formData.moveInDate) return null;
    return addMonths(new Date(formData.moveInDate), parseInt(formData.duration));
  };

  // Calculate total amount
  const calculateTotalAmount = () => (roomDetails?.price || 0) * parseInt(formData.duration);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const selectedDate = new Date(formData.moveInDate);
    const minDate = addDays(new Date(), 2);

    if (!formData.moveInDate) newErrors.moveInDate = "Move-in date is required";
    else if (selectedDate < minDate) newErrors.moveInDate = "Move-in date must be at least 2 days from today";

    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    if (!formData.agreeToFee) newErrors.agreeToFee = "You must acknowledge the fee payment";
    console.log("Validation errors:", newErrors);
    console.log("Form data during validation:", formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setApiError("");

    try {
      const token = getAccessToken();
      if (!token) throw new Error("Session expired");

      const bookingData = {
        roomId,
        duration: parseInt(formData.duration),
        moveInDate: formData.moveInDate,
      };

      const response = await apiprivate.post("/rooms/bookRoom", bookingData);

      setSuccess(true);
      setBookingDetails(response.data);
      setFormData({ moveInDate: "", duration: "3", agreeToTerms: false, agreeToFee: false });

      // Redirect to dashboard after 3s
      setTimeout(() => {
        navigate("/student/dashboard", { state: { success: true, message: "Room booked successfully", bookingDetails: response.data } });
      }, 3000);
    } catch (err) {
      console.error("Booking error:", err);
      setApiError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => format(addDays(new Date(), 2), "yyyy-MM-dd");

  // ---------- RENDER ----------
  if (authChecking) return <div className="min-h-screen flex items-center justify-center">Checking authentication...</div>;

  if (success && bookingDetails) {
    const endDate = calculateEndDate();
    const { room, fee, booking, totalAmount } = bookingDetails;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Room Booked Successfully!</h1>

          <div className="bg-blue-50 p-4 rounded-xl mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Room Number:</span>
              <span className="font-semibold">{room.roomNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Stay Duration:</span>
              <span className="font-semibold">{booking.duration} months</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Move-in Date:</span>
              <span className="font-semibold">{format(new Date(booking.moveInDate), "MMM dd, yyyy")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">End Date:</span>
              <span className="font-semibold">{format(new Date(booking.endDate), "MMM dd, yyyy")}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Amount:</span>
                <span className="font-bold text-lg text-blue-600">Rs. {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-8">
            A fee entry of Rs. {fee.amountDue.toLocaleString()} has been created. Please pay before your move-in date.
          </p>
        </div>
      </div>
    );
  }

  // Booking form render (mostly same as your current form)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-gray-600 hover:text-blue-600">
          <ArrowLeft className="w-5 h-5" /> Back to Rooms
        </button>

        {roomDetails && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8">
            <h1 className="text-2xl font-bold mb-4">Book Room {roomDetails.roomNumber}</h1>

            {/* Move-in Date */}
            <div>
              <label className="block mb-2 font-semibold">Move-in Date</label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleInputChange}
                min={getMinDate()}
                className="w-full p-3 border rounded-xl"
              />
              {errors.moveInDate && <p className="text-red-600 mt-1">{errors.moveInDate}</p>}
            </div>

            {/* Duration */}
            <div>
              <label className="block mb-2 font-semibold">Stay Duration (months)</label>
              <select name="duration" value={formData.duration} onChange={handleInputChange} className="w-full p-3 border rounded-xl">
                {[1, 2, 3, 6, 12].map(m => (
                  <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>

            {/* Terms */}
            <div className="flex items-center gap-2">
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange} />
              <label>I agree to the terms and conditions</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="agreeToFee" checked={formData.agreeToFee} onChange={handleInputChange} />
              <label>I acknowledge the fee payment requirement</label>
            </div>

            {apiError && <p className="text-red-600">{apiError}</p>}

            <button type="submit" disabled={loading} className="w-full p-4 bg-blue-600 text-white rounded-xl">
              {loading ? "Processing..." : `Confirm ${formData.duration}-Month Booking`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookRoom;
