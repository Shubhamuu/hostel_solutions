import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { apiprivate } from "../../services/api";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar, 
  Users, 
  Tag, 
  MapPin, 
  Home, 
  Wifi, 
  Bath, 
  Bed, 
  Square, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Shield,
  BookOpen,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

const RoomDetailsById = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hostel, setHostel] = useState(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const { data } = await apiprivate.get(`/rooms/getroom/${roomId}`);
        setRoom(data);
        
        // If hostel data is included, use it
        if (data.hostel) {
          setHostel(data.hostel);
        } else if (data.hostelId) {
          // Optional: Fetch hostel details if not included
          try {
            const hostelRes = await apiprivate.get(`/hostels/${data.hostelId}`);
            setHostel(hostelRes.data);
          } catch (err) {
            console.log("Could not fetch hostel details");
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch room details");
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  const nextImage = () => {
    if (room?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === room.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (room?.images?.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? room.images.length - 1 : prev - 1
      );
    }
  };

  const handleBookNow = () => {
    navigate(`/book-room/${roomId}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading room details...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] flex items-center justify-center">
        <div className="text-center bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-red-500/30 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Room</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );

  if (!room) return null;

  const availability = room.maxCapacity - room.currentOccupancy;
  const isAvailable = availability > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Rooms
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                  <Home size={20} className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {room.roomNumber}
                </h1>
              </div>
              {hostel && (
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin size={16} className="text-amber-400" />
                  <span>{hostel.name} • {hostel.location || "Location not specified"}</span>
                </div>
              )}
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
              isAvailable 
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}>
              {isAvailable ? (
                <>
                  <CheckCircle size={16} />
                  {availability} seat{availability !== 1 ? 's' : ''} available
                </>
              ) : (
                <>
                  <AlertCircle size={16} />
                  Fully Booked
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Images Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/30">
              {room.images?.length > 0 ? (
                <>
                  <img
                    src={room.images[currentImageIndex]?.url}
                    alt={`Room ${room.roomNumber} - Image ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  {room.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-sm">
                    {currentImageIndex + 1} / {room.images.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="text-center text-gray-400">
                    <Home size={48} className="mx-auto mb-2" />
                    <p>No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {room.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {room.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? "border-amber-500 scale-105" 
                        : "border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Booking */}
          <div className="space-y-6">
            {/* Room Type & Price */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-gray-400">Room Type</span>
                  <h3 className="text-xl font-semibold text-white mt-1">{room.type}</h3>
                </div>
                <div className="text-right">
                  <span className="text-gray-400">Price per seat</span>
                  <div className="flex items-center gap-1">
                    <Tag size={20} className="text-amber-400" />
                    <span className="text-2xl font-bold text-white">₹ {room.price}</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
                  <Users size={20} className="text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Max Capacity</p>
                    <p className="font-semibold text-white">{room.maxCapacity} seats</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
                  <Users size={20} className="text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Current Occupancy</p>
                    <p className="font-semibold text-white">{room.currentOccupancy} seats</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star size={20} className="text-amber-400" />
                Room Features
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                  <Wifi size={18} className="text-green-400" />
                  <span className="text-gray-300">High-speed Wi-Fi</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                  <Bed size={18} className="text-purple-400" />
                  <span className="text-gray-300">Comfortable Beds</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                  <Bath size={18} className="text-blue-400" />
                  <span className="text-gray-300">Attached Bathroom</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                  <Shield size={18} className="text-amber-400" />
                  <span className="text-gray-300">24/7 Security</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {room.description || "No description available for this room. Please contact the hostel administration for more details."}
              </p>
            </div>

            {/* Booking Section */}
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Ready to Book?</h3>
                  <p className="text-gray-300 text-sm">
                    Secure your seat now with instant booking confirmation.
                  </p>
                </div>
                
                <button
                  onClick={handleBookNow}
                  disabled={!isAvailable}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                    isAvailable
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-amber-500/25"
                      : "bg-gray-800 cursor-not-allowed text-gray-400"
                  }`}
                >
                  <BookOpen size={20} />
                  {isAvailable ? "Book Now" : "Not Available"}
                  {isAvailable && <ArrowLeft className="rotate-180" size={20} />}
                </button>
              </div>
              
              {isAvailable && (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-300">
                  <Clock size={14} />
                  <span>Bookings are confirmed instantly</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <span className="text-gray-400">Room Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    room.isActive 
                      ? "bg-green-500/20 text-green-300" 
                      : "bg-red-500/20 text-red-300"
                  }`}>
                    {room.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                  <span className="text-gray-400">Created Date</span>
                  <span className="text-white">
                    {new Date(room.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {hostel && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hostel Contact</span>
                    <span className="text-white">
                      {hostel.contactNumber || "Not provided"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsById;