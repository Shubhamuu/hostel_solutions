import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import {
  Calendar,
  Clock,
  Users,
  Home,
  AlertCircle,
  Loader2,
  CheckCircle,
  DollarSign,
  Shield,
  X,
  Check,
  Image as ImageIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, addMonths, differenceInDays } from "date-fns";
import { apiprivate } from "../../services/api";
import NavBar from "../../components/common/navbar";

const BookRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [formData, setFormData] = useState({
    moveInDate: "",
    duration: 3,
    agreeToTerms: false,
    agreeToFee: false,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  const getAccessToken = () =>
    localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  /* ========== AUTH CHECK ========== */
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login", {
        state: { from: location.pathname, message: "Please login to book a room", roomId },
      });
      return;
    }
    setAuthChecking(false);
  }, [navigate, location.pathname, roomId]);

  /* ========== FETCH ROOM DETAILS ========== */
  useEffect(() => {
    if (authChecking) return;

    // Set default move-in date 3 days from today
    const defaultDate = addDays(new Date(), 3);
    setFormData((prev) => ({ ...prev, moveInDate: format(defaultDate, "yyyy-MM-dd") }));

    const fetchRoomDetails = async () => {
      try {
        const res = await apiprivate.get(`/rooms/getroom/${roomId}`);
        setRoomDetails(res.data);
      } catch (err) {
        setApiError("Failed to fetch room details");
      } finally {
        setLoading(false);
      }
    };
    fetchRoomDetails();
  }, [authChecking, roomId]);

  /* ========== CALCULATIONS ========== */
  const calculateEndDate = () => addMonths(new Date(formData.moveInDate), parseInt(formData.duration));
  const calculateTotalAmount = () => (roomDetails ? roomDetails.price  : 0);
  const getDaysUntilMoveIn = () => differenceInDays(new Date(formData.moveInDate), new Date());
  const getMonthlyRate = () => (roomDetails ? roomDetails.price : 0);
  const getMinDate = () => format(addDays(new Date(), 2), "yyyy-MM-dd");
  const getMaxDate = () => format(addDays(new Date(), 60), "yyyy-MM-dd");

  /* ========== FORM VALIDATION ========== */
  const validateForm = () => {
    const newErrors = {};
    const selectedDate = new Date(formData.moveInDate);
    const minDate = addDays(new Date(), 2);

    if (!formData.moveInDate) newErrors.moveInDate = "Move-in date is required";
    else if (selectedDate < minDate) newErrors.moveInDate = "Move-in date must be at least 2 days from today";
    else if (getDaysUntilMoveIn() > 60) newErrors.moveInDate = "Move-in date cannot be more than 60 days in advance";

    if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms";
    if (!formData.agreeToFee) newErrors.agreeToFee = "You must acknowledge the fee payment requirement";

    if (roomDetails && roomDetails.currentOccupancy >= roomDetails.maxCapacity)
      newErrors.room = "This room is fully occupied";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
  };

  /* ========== IMAGE CONTROLS ========== */
  const nextImage = () => {
    if (roomDetails?.images?.length > 0) {
      setImageIndex((prev) => (prev + 1) % roomDetails.images.length);
    }
  };

  const prevImage = () => {
    if (roomDetails?.images?.length > 0) {
      setImageIndex((prev) => (prev - 1 + roomDetails.images.length) % roomDetails.images.length);
    }
  };

  /* ========== HANDLE BOOKING ========== */
  const handleSubmit = async (e) => {
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

      const res = await apiprivate.post("/rooms/bookRoom", bookingData);
      setBookingDetails(res.data);
      setSuccess(true);

      setTimeout(() => navigate("/student/dashboard", { state: { success: true, bookingDetails: res.data } }), 5000);
    } catch (err) {
      setApiError(err.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authChecking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );

  /* ========== SUCCESS SCREEN ========== */
  if (success && bookingDetails) {
    const { room, fee, booking, totalAmount } = bookingDetails;
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full bg-white dark:bg-[#1C1F2A] rounded-3xl shadow-2xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Booking Confirmed!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Your room has been successfully booked.</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-6 border border-blue-100 dark:border-blue-800">
            <div className="space-y-2 text-left">
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Room Number:</span>
                <span className="font-semibold">{room.roomNumber}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Move-in Date:</span>
                <span className="font-semibold">{format(new Date(booking.moveInDate), "MMM dd, yyyy")}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Duration:</span>
                <span className="font-semibold">{booking.duration} months</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">End Date:</span>
                <span className="font-semibold">{format(new Date(booking.endDate), "MMM dd, yyyy")}</span>
              </p>
              <p className="flex justify-between text-lg font-bold mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                <span className="text-gray-900 dark:text-white">Total Amount For Booking:</span>
                <span className="text-blue-600 dark:text-blue-400">Rs. {totalAmount?.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(`/room-details/${roomId}`)}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-all duration-200"
            >
              View Room Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========== MAIN BOOKING FORM ========== */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0D10] text-gray-900 dark:text-white">
      <NavBar />
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>   
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        {/* ROOM DETAILS */}
        <div className="lg:col-span-2 space-y-8">
          {/* IMAGE WITH CONTROLS */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-900">
            {roomDetails?.images?.length > 0 ? (
              <>
                <img
                  src={roomDetails.images[imageIndex].url}
                  alt={`Room ${roomDetails.roomNumber}`}
                  className="w-full h-96 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setShowFullImage(true)}
                />
                
                {/* Image Navigation */}
                {roomDetails.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Image Indicator */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {roomDetails.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            idx === imageIndex 
                              ? "bg-blue-500 w-8" 
                              : "bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p>No Image Available</p>
              </div>
            )}
          </div>

          {/* IMAGE THUMBNAILS */}
          {roomDetails?.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {roomDetails.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIndex(idx)}
                  className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    idx === imageIndex 
                      ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20" 
                      : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`thumb-${idx}`}
                    className="w-20 h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* ROOM INFO */}
          <div className="bg-white dark:bg-[#1C1F2A] rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">{roomDetails?.roomNumber}</h2>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    {roomDetails?.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {roomDetails?.currentOccupancy}/{roomDetails?.maxCapacity} Occupied
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Rs. {roomDetails?.price?.toLocaleString()}/month
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-full font-semibold">
                {roomDetails?.currentOccupancy < roomDetails?.maxCapacity ? "Available" : "Fully Booked"}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {roomDetails?.description}
            </p>
          </div>
        </div>

        {/* BOOKING CARD */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1C1F2A] rounded-2xl p-8 shadow-lg sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Book This Room</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Move-in Date */}
              <div className="space-y-2">
                <label className="block font-medium">Move-in Date</label>
                <input
                  type="date"
                  name="moveInDate"
                  value={formData.moveInDate}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                />
                {errors.moveInDate && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.moveInDate}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Move in {getDaysUntilMoveIn()} days from now
                </p>
              </div>

              {/* Duration */}
  {/* Duration */}
<div className="space-y-3">
  <label className="block font-medium">Stay Duration (Months)</label>
  
 

  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Or enter custom duration (1-60 months)
    </label>
    <div className="flex items-center gap-3">
      <input
        type="number"
        name="duration"
        min="1"
        max="60"
        value={formData.duration}
        onChange={handleInputChange}
        className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        placeholder="Enter number of months"
      />
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
        <span className="text-sm font-medium">months</span>
      </div>
    </div>
    
    <div className="flex items-center justify-between mt-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        <Clock className="w-3 h-3 inline mr-1" />
        Your stay ends on {format(calculateEndDate(), "MMM dd, yyyy")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFormData(prev => ({ 
            ...prev, 
            duration: Math.max(1, prev.duration - 1) 
          }))}
          className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          disabled={formData.duration <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ 
            ...prev, 
            duration: Math.min(60, prev.duration + 1) 
          }))}
          className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          disabled={formData.duration >= 60}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</div>



              {/* Terms */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <label className="text-sm">
                    I agree to the hostel rules and policies
                    {errors.agreeToTerms && (
                      <span className="text-red-500 text-sm block mt-1">{errors.agreeToTerms}</span>
                    )}
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="relative mt-1">
                    <input
                      type="checkbox"
                      name="agreeToFee"
                      checked={formData.agreeToFee}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <label className="text-sm">
                    I acknowledge the payment must be made before move-in
                    {errors.agreeToFee && (
                      <span className="text-red-500 text-sm block mt-1">{errors.agreeToFee}</span>
                    )}
                  </label>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Rs. {calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Your stay ends on {format(calculateEndDate(), "MMM dd, yyyy")}
                </p>
              </div>

              {/* API Error */}
              {apiError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl">
                  <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {apiError}
                  </p>
                </div>
              )}

              {/* Room Occupancy Warning */}
              {roomDetails?.currentOccupancy >= roomDetails?.maxCapacity && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl">
                  <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    This room is fully occupied
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || (roomDetails?.currentOccupancy >= roomDetails?.maxCapacity)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Book Now
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-3.5 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && roomDetails?.images && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl w-full max-h-[90vh]">
            <button
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setShowFullImage(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={roomDetails.images[imageIndex].url}
              alt="Full view"
              className="w-full h-full max-h-[90vh] object-contain rounded-lg"
            />
            {roomDetails.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookRoom;