import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import {
  Calendar,
  Home,
  AlertCircle,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  Info,
  DollarSign,
  Users,
  Star,
  Image as ImageIcon,
  Shield,
  Check,
  X
} from "lucide-react";
import { format, addDays, addMonths, differenceInDays } from "date-fns";
import { apiprivate } from "../../services/api";

const BookRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
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
  const [imageIndex, setImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);

  // Get token
  const getAccessToken = () => localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

  // Authentication check
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login", { 
        state: { 
          from: location.pathname, 
          message: "Please login to book a room", 
          roomId 
        } 
      });
      return;
    }
    setAuthChecking(false);
  }, [navigate, location.pathname, roomId]);

  // Set default move-in date (3 days from now) and fetch room details
  useEffect(() => {
    if (authChecking) return;

    const defaultDate = addDays(new Date(), 3);
    setFormData(prev => ({ 
      ...prev, 
      moveInDate: format(defaultDate, "yyyy-MM-dd") 
    }));

    fetchRoomDetails();
  }, [authChecking]);

  // Fetch room details
  const fetchRoomDetails = async () => {
    try {
      const response = await apiprivate.get(`/rooms/getroom/${roomId}`);
      setRoomDetails(response.data);
    } catch (err) {
      console.error("Room fetch error:", err);
      setApiError("Failed to fetch room details. Please try again.");
    }
  };

  // Calculate end date
  const calculateEndDate = () => {
    if (!formData.moveInDate) return null;
    return addMonths(new Date(formData.moveInDate), parseInt(formData.duration));
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    if (!roomDetails) return 0;
    return roomDetails.price * parseInt(formData.duration);
  };

  // Calculate days until move-in
  const getDaysUntilMoveIn = () => {
    if (!formData.moveInDate) return 0;
    const today = new Date();
    const moveIn = new Date(formData.moveInDate);
    return differenceInDays(moveIn, today);
  };

  // Calculate monthly rate
  const getMonthlyRate = () => {
    if (!roomDetails) return 0;
    return roomDetails.price;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    const selectedDate = new Date(formData.moveInDate);
    const minDate = addDays(new Date(), 2);
    const daysUntilMoveIn = getDaysUntilMoveIn();

    if (!formData.moveInDate) {
      newErrors.moveInDate = "Move-in date is required";
    } else if (selectedDate < minDate) {
      newErrors.moveInDate = "Move-in date must be at least 2 days from today";
    } else if (daysUntilMoveIn > 60) {
      newErrors.moveInDate = "Move-in date cannot be more than 60 days in advance";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    if (!formData.agreeToFee) {
      newErrors.agreeToFee = "You must acknowledge the fee payment requirement";
    }

    // Check room availability
    if (roomDetails && roomDetails.currentOccupancy >= roomDetails.maxCapacity) {
      newErrors.room = "This room is fully occupied";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    if (apiError) setApiError("");
  };

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

      const response = await apiprivate.post("/rooms/bookRoom", bookingData);

      setSuccess(true);
      setBookingDetails(response.data);

      // Redirect to dashboard after 5s
      setTimeout(() => {
        navigate("/student/dashboard", { 
          state: { 
            success: true, 
            message: "Room booked successfully!", 
            bookingDetails: response.data 
          } 
        });
      }, 5000);
    } catch (err) {
      console.error("Booking error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Booking failed. Please try again.";
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => format(addDays(new Date(), 2), "yyyy-MM-dd");
  const getMaxDate = () => format(addDays(new Date(), 60), "yyyy-MM-dd");

  // Render loading state
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Render success state
  if (success && bookingDetails) {
    const endDate = calculateEndDate();
    const { room, fee, booking, totalAmount } = bookingDetails;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-8">Your room has been successfully booked</p>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 space-y-4 border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 flex items-center gap-2">
                <Home size={16} />
                Room Number:
              </span>
              <span className="font-bold text-lg text-gray-900">{room.roomNumber}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700 flex items-center gap-2">
                <Calendar size={16} />
                Stay Duration:
              </span>
              <span className="font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {booking.duration} months
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700 flex items-center gap-2">
                <Clock size={16} />
                Move-in Date:
              </span>
              <span className="font-semibold">
                {format(new Date(booking.moveInDate), "MMM dd, yyyy")}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700 flex items-center gap-2">
                <Calendar size={16} />
                End Date:
              </span>
              <span className="font-semibold">
                {format(new Date(booking.endDate), "MMM dd, yyyy")}
              </span>
            </div>
            
            <div className="border-t border-blue-200 pt-4 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 flex items-center gap-2">
                  <DollarSign size={16} />
                  Total Amount:
                </span>
                <span className="font-bold text-xl text-blue-600">
                  Rs. {totalAmount?.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-medium text-yellow-800 mb-1">Payment Required</p>
                <p className="text-yellow-700 text-sm">
                  A fee entry of <span className="font-bold">Rs. {fee?.amountDue?.toLocaleString() || "0"}</span> has been created. 
                  Please complete the payment before your move-in date to secure your booking.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => navigate(`/room/${roomId}`)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              View Room Details
            </button>
          </div>

          <p className="text-gray-400 text-sm mt-6">
            Redirecting to dashboard in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  // Main booking form
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-gray-600 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Available Rooms</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Room Details Card */}
          <div className="lg:col-span-2 space-y-8">
            {/* Room Images */}
            {roomDetails?.images && roomDetails.images.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-4">
                  <img
                    src={roomDetails.images[imageIndex].url}
                    alt={`Room ${roomDetails.roomNumber} - Image ${imageIndex + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setShowFullImage(true)}
                  />
                  
                  {roomDetails.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex((prev) => (prev === 0 ? roomDetails.images.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => setImageIndex((prev) => (prev === roomDetails.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {roomDetails.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === imageIndex ? 'bg-white w-6' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{imageIndex + 1}/{roomDetails.images.length}</span>
                  </div>
                </div>

                {/* Thumbnail images */}
                {roomDetails.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {roomDetails.images.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageIndex(idx)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${idx === imageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                      >
                        <img
                          src={img.url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Room Information */}
            {roomDetails && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Room {roomDetails.roomNumber}</h1>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${roomDetails.type === 'Deluxe' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {roomDetails.type} Room
                      </span>
                      <span className="text-gray-600 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {roomDetails.currentOccupancy}/{roomDetails.maxCapacity} occupied
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">
                      Rs. {roomDetails.price.toLocaleString()}
                    </div>
                    <p className="text-gray-500 text-sm">per month</p>
                  </div>
                </div>

                {/* Room Description */}
                {roomDetails.description && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{roomDetails.description}</p>
                  </div>
                )}

                {/* Room Features Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Room Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{roomDetails.maxCapacity} persons</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Current Occupancy:</span>
                        <span className={`font-medium ${roomDetails.currentOccupancy < roomDetails.maxCapacity ? 'text-green-600' : 'text-red-600'}`}>
                          {roomDetails.currentOccupancy} / {roomDetails.maxCapacity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Room Status:</span>
                        <span className={`font-medium flex items-center gap-2 ${roomDetails.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {roomDetails.isActive ? (
                            <>
                              <Check className="w-4 h-4" />
                              Available
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Unavailable
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Hostel Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Hostel ID:</span>
                        <span className="font-medium text-sm">{roomDetails.hostelId?.substring(0, 12)}...</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{format(new Date(roomDetails.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{format(new Date(roomDetails.updatedAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability Alert */}
                {roomDetails.currentOccupancy >= roomDetails.maxCapacity && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Room Fully Occupied</p>
                        <p className="text-red-700 text-sm">
                          This room has reached maximum capacity. Please choose another room.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Booking Form Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Book This Room</h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Move-in Date */}
                <div>
                  <label className="block mb-3 font-semibold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Move-in Date
                  </label>
                  <input
                    type="date"
                    name="moveInDate"
                    value={formData.moveInDate}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={`w-full p-4 border rounded-xl transition-all ${errors.moveInDate ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                  />
                  {errors.moveInDate && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.moveInDate}
                    </p>
                  )}
                  {formData.moveInDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Move in {getDaysUntilMoveIn()} days from now
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="block mb-3 font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Stay Duration
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} month{m > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Summary */}
                {roomDetails && (
                  <div className="bg-blue-50 rounded-xl p-5 space-y-4">
                    <h3 className="font-semibold text-gray-800">Price Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Monthly Rate:</span>
                        <span className="font-medium">Rs. {getMonthlyRate().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">{formData.duration} months</span>
                      </div>
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-800">Total Amount:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            Rs. {calculateTotalAmount().toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {calculateEndDate() && (
                      <div className="text-sm text-gray-500 text-center pt-2 border-t border-blue-200">
                        Your stay ends on {format(calculateEndDate(), "MMMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                )}

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-5 h-5"
                    />
                    <label htmlFor="agreeToTerms" className="text-gray-700 text-sm">
                      I agree to the hostel terms and conditions, including rules, cancellation policy, and code of conduct.
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="text-red-600 text-sm">{errors.agreeToTerms}</p>
                  )}

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="agreeToFee"
                      name="agreeToFee"
                      checked={formData.agreeToFee}
                      onChange={handleInputChange}
                      className="mt-1 w-5 h-5"
                    />
                    <label htmlFor="agreeToFee" className="text-gray-700 text-sm">
                      I acknowledge that I must pay the full amount before the move-in date to secure my booking.
                    </label>
                  </div>
                  {errors.agreeToFee && (
                    <p className="text-red-600 text-sm">{errors.agreeToFee}</p>
                  )}
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-red-800">Booking Error</p>
                        <p className="text-red-700 text-sm">{apiError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (roomDetails?.currentOccupancy >= roomDetails?.maxCapacity)}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 ${
                    loading || (roomDetails?.currentOccupancy >= roomDetails?.maxCapacity)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Booking...
                    </span>
                  ) : roomDetails?.currentOccupancy >= roomDetails?.maxCapacity ? (
                    "Room Full"
                  ) : (
                    `Book Now - Rs. ${calculateTotalAmount().toLocaleString()}`
                  )}
                </button>

                {/* Security Note */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Your booking information is secure and encrypted
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && roomDetails?.images && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowFullImage(false)}>
          <button className="absolute top-6 right-6 text-white/80 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img
            src={roomDetails.images[imageIndex].url}
            alt="Full view"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default BookRoom;