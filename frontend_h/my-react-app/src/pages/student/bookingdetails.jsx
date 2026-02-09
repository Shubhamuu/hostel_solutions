import { useEffect, useState } from "react";
import { apiprivate } from "../../services/api";
import StudentNavBar from "../../components/common/studentNavbar";
import { 
  Loader2, 
  XCircle, 
  Calendar, 
  Hash, 
  Tag, 
  Wallet, 
  Clock, 
  CheckCircle, 
  X,
  Home,
  AlertTriangle,
  CreditCard,
  History,
  ChevronRight,
  Building
} from "lucide-react";
import { Link } from "react-router";

export default function MyBooking() {
  const [bookings, setBookings] = useState([]);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch user bookings on mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await apiprivate.get("/rooms/mybookings");
        const bookingsData = res.data.bookings || res.data.booking || [];
        
        // Sort bookings: latest first by createdAt
        const sortedBookings = [...bookingsData].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setBookings(sortedBookings);
        
        // Set active booking (first non-cancelled booking or latest cancelled)
        const active = sortedBookings.find(b => 
          b.status === "PENDING" || b.status === "CONFIRMED"
        ) || sortedBookings[0];
        
        setActiveBooking(active);
      } catch (err) {
        setMessage({
          type: "error",
          text: err?.response?.data?.message || "Failed to fetch booking details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    // Custom confirmation modal
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?\n\n" +
      "This action cannot be undone and may be subject to cancellation fees."
    );
    
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      const res = await apiprivate.post("/rooms/cancelbooking", {
        bookingId: bookingId,
      });
      
      setMessage({ 
        type: "success", 
        text: res.data.message || "Booking cancelled successfully" 
      });
      
      // Update bookings list
      const updatedBookings = bookings.map(booking => 
        booking._id === bookingId ? { ...booking, status: "CANCELLED" } : booking
      );
      
      setBookings(updatedBookings);
      
      // Update active booking if it's the one being cancelled
      if (activeBooking?._id === bookingId) {
        setActiveBooking({ ...activeBooking, status: "CANCELLED" });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to cancel booking",
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: "", text: "" });
  };

  const StatusBadge = ({ status }) => {
    const config = {
      CONFIRMED: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
      CANCELLED: { color: "bg-rose-500/20 text-rose-400", icon: XCircle },
      EXPIRED: { color: "bg-amber-500/20 text-amber-400", icon: AlertTriangle },
      PENDING: { color: "bg-amber-500/20 text-amber-400", icon: Clock },
      default: { color: "bg-gray-500/20 text-gray-400", icon: Tag }
    };

    const { color, icon: Icon } = config[status] || config.default;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color}`}>
        <Icon size={14} />
        <span className="text-sm font-medium capitalize">{status.toLowerCase()}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <div className="absolute inset-0 animate-ping bg-indigo-500/20 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-400 text-lg font-medium">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6">
       < StudentNavBar/>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                My Bookings
              </h1>
              <p className="text-gray-400">
                Manage your room reservations and view booking history
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <span className="text-sm text-gray-400">Total Bookings:</span>
                <span className="ml-2 text-white font-semibold">{bookings.length}</span>
              </div>
              <Link
                to="/"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Home size={16} />
                Book New Room
              </Link>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-emerald-900/30 border-emerald-800 text-emerald-300"
                : "bg-rose-900/30 border-rose-800 text-rose-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {message.type === "success" ? (
                  <CheckCircle size={20} className="flex-shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="flex-shrink-0" />
                )}
                <p className="font-medium">{message.text}</p>
              </div>
              <button
                onClick={clearMessage}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          /* No Booking State */
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                <Home size={32} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Bookings Found
              </h3>
              <p className="text-gray-400 mb-8">
                You don't have any room bookings at the moment. 
                Browse our available rooms to find your perfect stay.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  Browse Available Rooms
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Booking History List */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <History size={20} />
                  Booking History
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                </p>
                <div className="space-y-3">
                  {bookings.map((booking, index) => (
                    <button
                      key={booking._id}
                      onClick={() => setActiveBooking(booking)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                        activeBooking?._id === booking._id
                          ? 'bg-indigo-900/30 border border-indigo-500'
                          : 'bg-gray-900/30 hover:bg-gray-800/50 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${
                              booking.status === 'CONFIRMED' ? 'bg-emerald-500' :
                              booking.status === 'CANCELLED' ? 'bg-rose-500' :
                              booking.status === 'EXPIRED' ? 'bg-amber-500' :
                              'bg-amber-500'
                            }`} />
                            <span className="text-sm font-medium text-white">
                              Room {booking.roomNumber}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <ChevronRight size={16} className={`${
                          activeBooking?._id === booking._id ? 'text-indigo-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="mt-2">
                        <StatusBadge status={booking.status} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Active Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {activeBooking && (
                <>
                  {/* Booking Card */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-6 border-b border-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-1">
                            {activeBooking.roomId.type} Room
                          </h2>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={activeBooking.status} />
                            <span className="text-gray-400 text-sm">
                              Booking ID: {activeBooking._id.slice(-8)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">₹{activeBooking.totalAmount}</div>
                          <p className="text-gray-400 text-sm">Total Amount</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Room Details */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Hash size={18} />
                            Room Details
                          </h3>
                          <div className="space-y-3">
                            <DetailItem 
                              icon={<Hash size={16} />}
                              label="Room Number"
                              value={activeBooking.roomNumber}
                            />
                            <DetailItem 
                              icon={<Tag size={16} />}
                              label="Room Type"
                              value={activeBooking.roomId.type}
                            />
                            <DetailItem 
                              icon={<Wallet size={16} />}
                              label="Price per Month"
                              value={`₹${activeBooking.roomId.price}`}
                            />
                            {activeBooking.hostelId && (
                              <DetailItem 
                                icon={<Building size={16} />}
                                label="Hostel"
                                value={activeBooking.hostelId.name}
                              />
                            )}
                          </div>
                        </div>

                        {/* Booking Timeline */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Calendar size={18} />
                            Booking Period
                          </h3>
                          <div className="space-y-3">
                            <DetailItem 
                              icon={<Clock size={16} />}
                              label="Duration"
                              value={`${activeBooking.duration} month(s)`}
                            />
                            <DetailItem 
                              icon={<Calendar size={16} />}
                              label="Move-in Date"
                              value={new Date(activeBooking.moveInDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            />
                            <DetailItem 
                              icon={<Calendar size={16} />}
                              label="End Date"
                              value={new Date(activeBooking.endDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            />
                            <DetailItem 
                              icon={<Calendar size={16} />}
                              label="Booked On"
                              value={new Date(activeBooking.createdAt).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-8">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>Booking Progress</span>
                          <span>
                            {activeBooking.status === 'CONFIRMED' ? '100%' : 
                             activeBooking.status === 'CANCELLED' ? 'Cancelled' : 
                             activeBooking.status === 'EXPIRED' ? 'Expired' :
                             '50% - Make payment to confirm booking'}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              activeBooking.status === 'CONFIRMED' ? 'w-full bg-emerald-500' :
                              activeBooking.status === 'CANCELLED' ? 'w-0 bg-rose-500' :
                              activeBooking.status === 'EXPIRED' ? 'w-0 bg-amber-500' :
                              'w-1/2 bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-6 border-t border-gray-700 space-y-4">
                      {/* Status-specific actions */}
                      {activeBooking.status === "PENDING" ? (
                        <div className="space-y-4">
                          <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                            <AlertTriangle size={16} />
                            Your booking is pending confirmation. Complete payment to confirm.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Pay Now Button - Only for PENDING status */}
                            <Link
                              to="/fee"
                              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                              <CreditCard size={18} />
                              Pay Now to Confirm
                            </Link>

                            {/* Cancel Button - Only for PENDING status */}
                            <button
                              onClick={() => handleCancelBooking(activeBooking._id)}
                              disabled={cancelLoading}
                              className="w-full py-3 px-4 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {cancelLoading ? (
                                <>
                                  <Loader2 className="animate-spin" size={18} />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle size={18} />
                                  Cancel Booking
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : activeBooking.status === "CONFIRMED" ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <CheckCircle size={18} />
                            <span className="font-medium">Booking Confirmed</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Make Payment Button - For future payments */}
                            <Link
                              to="/fee"
                              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                              <CreditCard size={18} />
                              Make Payment
                            </Link>

                            {/* Cancel Booking - Disabled if already cancelled */}
                            <button
                              onClick={() => handleCancelBooking(activeBooking._id)}
                              disabled={cancelLoading}
                              className="w-full py-3 px-4 bg-gradient-to-r from-rose-700 to-rose-800 hover:from-rose-600 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {cancelLoading ? (
                                <>
                                  <Loader2 className="animate-spin" size={18} />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <XCircle size={18} />
                                  Cancel Booking
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : activeBooking.status === "CANCELLED" ? (
                        <div className="space-y-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-rose-400">
                            <XCircle size={18} />
                            <span className="font-medium">Booking Cancelled</span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            This booking was cancelled on {new Date(activeBooking.updatedAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Link
                              to="/"
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Browse New Rooms
                            </Link>
                            <Link
                              to="/fee"
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              View Payment History
                            </Link>
                          </div>
                        </div>
                      ) : activeBooking.status === "EXPIRED" ? (
                        <div className="space-y-4 text-center">
                          <div className="flex items-center justify-center gap-2 text-amber-400">
                            <AlertTriangle size={18} />
                            <span className="font-medium">Booking Expired</span>
                          </div>
                          <p className="text-gray-400 text-sm">
                            This booking expired on {new Date(activeBooking.endDate).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <Link
                              to="/"
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-colors text-sm"
                            >
                              Book Again
                            </Link>
                            <Link
                              to="/fee"
                              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                            >
                              Payment History
                            </Link>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Help/Support Section */}
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Need Help?
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      If you have any questions about your booking or need to make changes, 
                      please contact our support team.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm">
                        Contact Support
                      </button>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm">
                        View Booking Policy
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable DetailItem Component
const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/30">
    <div className="text-indigo-400">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  </div>
);