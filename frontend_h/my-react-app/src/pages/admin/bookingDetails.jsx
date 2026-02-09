import { useEffect, useState, useMemo } from "react";
import { apiprivate } from "../../services/api";
import { Loader2, Search, Filter, Calendar, User, Mail, Home, DollarSign, CheckCircle, Clock, XCircle, ChevronDown } from "lucide-react";
import AdminNavbar from "../../components/common/adminNavbar";
export default function HostelBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedBooking, setExpandedBooking] = useState(null);
const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await apiprivate.get("/rooms/getAllBooking");
        setBookings(res.data.bookings || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(err.response?.data?.message || "Failed to fetch bookings");
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.roomId?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || b.moveInDate) - new Date(a.createdAt || a.moveInDate);
        case "oldest":
          return new Date(a.createdAt || a.moveInDate) - new Date(b.createdAt || b.moveInDate);
        case "price-high":
          return (b.roomId?.price || 0) - (a.roomId?.price || 0);
        case "price-low":
          return (a.roomId?.price || 0) - (b.roomId?.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookings, searchTerm, statusFilter, sortBy]);
const handleConfirmBooking = async (booking) => {
  try {
    setConfirmingId(booking._id);

    await apiprivate.post("/rooms/confirmbookingadmin", {
      roomId: booking.roomId?._id,
      userId: booking.studentId?._id,
      bookingId: booking._id,
      feeAmount: booking.roomId?.price,
    });

    // Optimistically update UI
    setBookings((prev) =>
      prev.map((b) =>
        b._id === booking._id
          ? { ...b, status: "CONFIRMED" }
          : b
      )
    );
  } catch (err) {
    alert(
      err.response?.data?.message ||
      "Failed to confirm booking"
    );
  } finally {
    setConfirmingId(null);
  }
};

  const statusStats = useMemo(() => {
    const stats = {
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
      TOTAL: bookings.length
    };
    
    bookings.forEach(booking => {
      if (stats[booking.status] !== undefined) {
        stats[booking.status]++;
      }
    });
    
    return stats;
  }, [bookings]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex justify-center items-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center">
          <Home className="text-gray-400 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Bookings Found</h3>
          <p className="text-gray-400">There are no bookings for your hostel yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4 md:p-6">
      <AdminNavbar />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Hostel Bookings
          </h1>
          <p className="text-gray-400 mt-2">Manage and view all student bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold">{statusStats.TOTAL}</p>
              </div>
              <Home className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Confirmed</p>
                <p className="text-2xl font-bold text-green-400">{statusStats.CONFIRMED}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{statusStats.PENDING}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Cancelled</p>
                <p className="text-2xl font-bold text-red-400">{statusStats.CANCELLED}</p>
              </div>
              <XCircle className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by student name, email, or room number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-10 pr-8 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                >
                  <option value="ALL">All Status</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-10 pr-8 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300"
            >
              {/* Main Booking Card */}
              <div 
                className="p-4 md:p-6 cursor-pointer"
                onClick={() => setExpandedBooking(expandedBooking === booking._id ? null : booking._id)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex items-start gap-4">
                    <div className="bg-gray-900 p-3 rounded-lg">
                      <User className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {booking.studentId?.name || "N/A"}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-400 mt-1">
                        <Mail size={16} />
                        <span className="text-sm">{booking.studentId?.email || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Info */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Room</p>
                      <p className="font-semibold">{booking.roomId?.roomNumber || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Type</p>
                      <p className="font-semibold">{booking.roomId?.type || "N/A"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Price</p>
                      <div className="flex items-center gap-1 font-semibold">
                        <DollarSign size={16} className="text-green-400" />
                        <span>Rs. {booking.roomId?.price || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Date */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Move-in</p>
                      <p className="font-semibold">
                        {new Date(booking.moveInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">End Date</p>
                      <p className="font-semibold">
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="text-sm font-medium">{booking.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBooking === booking._id && (
                <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-300">Booking Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Booking ID</p>
                          <p className="font-mono text-gray-300">{booking._id?.substring(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Duration</p>
                          <p className="text-gray-300">
                            {Math.ceil((new Date(booking.endDate) - new Date(booking.moveInDate)) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Amount</p>
                          <p className="text-green-400 font-semibold">
                            Rs. {booking.roomId?.price || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Room Floor</p>
                          <p className="text-gray-300">
                            {booking.roomId?.floor || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-300">Student Contact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-gray-300">{booking.studentId?.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          <span className="text-gray-300">
                            Student ID: {booking.studentId?._id?.substring(0, 8) || "N/A"}
                          </span>
                          {booking.status === "PENDING" && (
  <div className="mt-4 flex justify-end">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleConfirmBooking(booking);
      }}
      disabled={confirmingId === booking._id}
      className="flex items-center gap-2 px-4 py-2 rounded-lg
        bg-green-600 hover:bg-green-700
        disabled:bg-gray-600 disabled:cursor-not-allowed
        transition-all text-white font-medium"
    >
      {confirmingId === booking._id ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          Confirming...
        </>
      ) : (
        <>
          <CheckCircle size={18} />
          Confirm Booking
        </>
      )}
    </button>
  </div>
)}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Matching Bookings</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      </div>
    </div>
  );
}