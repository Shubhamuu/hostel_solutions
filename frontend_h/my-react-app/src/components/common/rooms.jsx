import { useState, useEffect } from "react";
import {
  Bed,
  Users,
  ArrowLeft,
  Home,
  DollarSign,
  Maximize2,
  Calendar,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { apiprivate } from "../../services/api";

const Rooms = () => {
  const navigate = useNavigate();
  const { hostelId } = useParams(); // 🔑 Get hostel ID from URL

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await apiprivate.get(`/rooms/${hostelId}`);
        setRooms(response.data || []); // assuming the API returns array directly
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [hostelId]);

  // Filter rooms by type
  const filteredRooms =
    filter === "ALL"
      ? rooms
      : rooms.filter((room) => room.type?.toUpperCase() === filter);

  return (
    <section className="min-h-screen bg-[#0B0D10] text-white">
      {/* 🔹 Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0B0D10]/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex flex-wrap gap-2">
            {["ALL", "STANDARD", "SINGLE", "DOUBLE", "DELUXE", "AC"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition
                    ${filter === type
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                      : "bg-[#1C1F2A] text-gray-400 hover:text-white"
                    }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 🔹 Header */}
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex p-4 bg-[#1C1F2A] rounded-2xl mb-6">
          <Home className="w-8 h-8 text-amber-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Choose Your Room
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Premium rooms designed for comfort, focus, and peaceful living
        </p>
      </div>

      {/* 🔹 Content */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-14 w-14 border-4 border-gray-700 rounded-full animate-spin border-t-amber-400"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <p className="text-center text-gray-500">
            No rooms available in this category.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const isAvailable = room.currentOccupancy < room.maxCapacity;

              const image =
                room.images?.[0]?.url ||
                "https://via.placeholder.com/400x300?text=No+Image";

              return (
                <div
                  key={room._id}
                  className="bg-[#1C1F2A] rounded-3xl overflow-hidden border border-gray-800 hover:border-amber-500/40 transition"
                >
                  {/* Image */}
                  <div
                    onClick={() => navigate(`/room-details/${room._id}`)}
                    className="relative h-56 cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-4 right-4 px-4 py-1 rounded-full text-xs font-bold
                        ${isAvailable
                          ? "bg-amber-500 text-black"
                          : "bg-red-600 text-white"
                        }`}
                    >
                      {isAvailable ? "Available" : "Full"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">
                      Room {room.roomNumber}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                      {room.type} • {room.floor || "Ground Floor"}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Feature
                        icon={Users}
                        label="Occupancy"
                        value={`${room.currentOccupancy}/${room.maxCapacity}`}
                      />
                      <Feature
                        icon={Maximize2}
                        label="Size"
                        value={room.size || "Standard"}
                      />
                      <Feature
                        icon={Bed}
                        label="Beds"
                        value={room.beds || room.maxCapacity}
                      />
                      <Feature
                        icon={DollarSign}
                        label="Monthly"
                        value={`Rs. ${room.price?.toLocaleString()}`}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/room-details/${room._id}`)}
                        className="flex-1 py-3 rounded-xl bg-black/40 border border-gray-700 hover:border-gray-500 transition"
                      >
                        View Details
                      </button>

                      <button
                        disabled={!isAvailable}
                        onClick={() => {
                          const userString = localStorage.getItem("user");
                          if (!userString) {
                            navigate("/login", {
                              state: {
                                from: `/book-room/${room._id}`,
                                roomId: room._id,
                                roomNumber: room.roomNumber,
                              },
                            });
                            return;
                          }
                          navigate(`/book-room/${room._id}`, {
                            state: {
                              roomId: room._id,
                              roomNumber: room.roomNumber,
                            },
                          });
                        }}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2
                          ${isAvailable
                            ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-105 transition"
                            : "bg-gray-700 text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// Feature Component
const Feature = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-black/40 rounded-lg">
      <Icon className="w-4 h-4 text-amber-400" />
    </div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);

export default Rooms;
