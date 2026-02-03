import { useEffect, useState } from "react";
import { Link } from "react-router";
import { apiprivate } from "../../services/api";
import { 
  Home, 
  Users, 
  CreditCard, 
  Hash, 
  User, 
  Mail, 
  Building, 
  DoorOpen,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
  X,
  Info,
  Bed,
  Users as UsersIcon,
  DollarSign,
  Shield,
  CheckCircle
} from "lucide-react";

export default function MyRoom() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
const [leaving, setLeaving] = useState(false);
const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await apiprivate.get("/users/myroom");
        setRoom(data.room);
      } catch (err) {
        console.error("Failed to fetch room:", err);
        setError(err?.response?.data?.message || "Failed to fetch room details");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, []);
const handleLeaveRoom = async () => {
  try {
    setLeaving(true);
    await apiprivate.post(`/rooms/leave/${room._id}`);
    window.location.reload(); // simplest + safest
  } catch (err) {
    console.error("Leave room failed:", err);
    alert(err?.response?.data?.message || "Failed to leave room");
  } finally {
    setLeaving(false);
    setShowLeaveConfirm(false);
  }
};

  const clearError = () => {
    setError("");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <div className="absolute inset-0 animate-ping bg-indigo-500/20 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-400 text-lg font-medium">Loading your room details...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-900/30 border border-rose-800 text-rose-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 md:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700/50 flex items-center justify-center">
              <Building size={32} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              No Room Allocated
            </h3>
            <p className="text-gray-400 mb-8">
              You haven't been allocated a room yet. Browse our available rooms and make a booking to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Browse Available Rooms
              </Link>
              <Link
                to="/mybooking"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Check My Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const config = {
      AVAILABLE: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
      FULL: { color: "bg-rose-500/20 text-rose-400", icon: AlertTriangle },
      OCCUPIED: { color: "bg-amber-500/20 text-amber-400", icon: UsersIcon },
      default: { color: "bg-gray-500/20 text-gray-400", icon: Info }
    };

    const { color, icon: Icon } = config[status] || config.default;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color}`}>
        <Icon size={14} />
        <span className="text-sm font-medium capitalize">{status.toLowerCase()}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            My Room
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-gray-400">
              Welcome to your accommodation space
            </p>
            <StatusBadge status={room.status} />
          </div>
        </div>

        {/* Image Gallery */}
        {room.images && room.images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon size={20} />
              Room Gallery
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {room.images.map((img, index) => (
                <button
                  key={img._id}
                  onClick={() => setSelectedImage(img.url)}
                  className="relative group overflow-hidden rounded-xl border-2 border-gray-700 hover:border-indigo-500 transition-all duration-300"
                >
                  <img
                    src={img.url}
                    alt={`Room ${room.roomNumber} - Image ${index + 1}`}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Room Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Info Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {room.name}
                  </h2>
                  <p className="text-gray-400">
                    Your comfortable living space
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">₹{room.price}</div>
                  <p className="text-gray-400 text-sm">per month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem
                  icon={<Hash size={18} />}
                  label="Room Number"
                  value={room.roomNumber}
                  className="bg-gray-900/30"
                />
                <DetailItem
                  icon={<DoorOpen size={18} />}
                  label="Room Type"
                  value={room.type}
                  className="bg-gray-900/30"
                />
                <DetailItem
                  icon={<UsersIcon size={18} />}
                  label="Max Capacity"
                  value={room.maxCapacity}
                  className="bg-gray-900/30"
                />
                <DetailItem
                  icon={<Bed size={18} />}
                  label="Current Occupancy"
                  value={`${room.currentOccupancy}/${room.maxCapacity}`}
                  className="bg-gray-900/30"
                />
              </div>

              {room.description && (
                <div className="mt-6 p-4 rounded-lg bg-gray-900/30 border border-gray-700">
                  <p className="text-gray-300">{room.description}</p>
                </div>
              )}
            </div>

            {/* Roommates Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Users size={20} />
                Roommates
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({room.roommates.length} of {room.maxCapacity})
                </span>
              </h2>
              
              {room.roommates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {room.roommates.map((rm) => (
                    <div
                      key={rm.email}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        rm.isCurrentUser 
                          ? "border-indigo-500 bg-gradient-to-r from-indigo-900/20 to-purple-900/20" 
                          : "border-gray-700 bg-gray-900/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          rm.isCurrentUser ? "bg-indigo-500/20" : "bg-gray-700"
                        }`}>
                          <User size={20} className={
                            rm.isCurrentUser ? "text-indigo-400" : "text-gray-400"
                          } />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-white">{rm.name}</p>
                            {rm.isCurrentUser && (
                              <span className="px-2 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-400 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm flex items-center gap-2">
                            <Mail size={12} />
                            {rm.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-500 mb-3" size={32} />
                  <p className="text-gray-400">No other roommates currently</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Room Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Occupancy</span>
                  <span className="text-white font-semibold">
                   {room.currentOccupancy}/{room.maxCapacity}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(room.currentOccupancy / room.maxCapacity) * 100}%` }}
                  />
                </div>
                
               
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-left flex items-center gap-3">
                  <CreditCard size={18} />
                  <Link to="/fee">
                  <span>Make Payment</span>
                  </Link>
                </button>
                <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-left flex items-center gap-3">
                  <AlertTriangle size={18} />
                  <span>Report Issue</span>
                </button>
                <Link
                  to="/rules"
                  className="block w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-left flex items-center gap-3"
                >
                  <Shield size={18} />
                  <span>View House Rules</span>
                </Link>
                <Link
                  to="/support"
                  className="block w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-left flex items-center gap-3"
                >
                  <Users size={18} />
                  <span>Contact Support</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
<button
  onClick={() => setShowLeaveConfirm(true)}
  className="w-full p-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors text-left flex items-center gap-3 border border-rose-700"
>
  <AlertTriangle size={18} />
  <span>Leave Room</span>
</button>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={selectedImage}
            alt="Selected room view"
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        </div>
      )}
      {showLeaveConfirm && (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6">
      <h3 className="text-xl font-bold text-white mb-3">
        Leave Room?
      </h3>
      <p className="text-gray-400 mb-6">
        Are you sure you want to leave this room?  
        This action cannot be undone.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setShowLeaveConfirm(false)}
          className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={handleLeaveRoom}
          disabled={leaving}
          className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center gap-2"
        >
          {leaving && <Loader2 size={18} className="animate-spin" />}
          Leave Room
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

// Reusable Components
const DetailItem = ({ icon, label, value, className = "" }) => (
  <div className={`p-4 rounded-xl ${className}`}>
    <div className="flex items-center gap-3 mb-1">
      <div className="text-indigo-400">
        {icon}
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
    <p className="text-white font-medium text-lg">{value}</p>
  </div>
);

const QuickInfoItem = ({ icon, label, value, color = "text-white" }) => (
  <div className="flex items-center gap-3">
    <div className="text-gray-400">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-sm font-medium ${color}`}>{value}</p>
    </div>
  </div>
);