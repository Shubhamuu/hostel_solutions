// components/RoomDetails.js
import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiprivate } from "../../services/api";
import AdminNavbar from "../../components/common/adminNavbar";
import { Plus, X, Loader2, Edit, Trash2, Users, Home, DollarSign, BedDouble } from "lucide-react";

const RoomDetails = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    type: "Standard",
    price: "",
    maxCapacity: "",
    description: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const [selectedRoomForStudent, setSelectedRoomForStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    feeAmount: "",
  });

  const [editRoom, setEditRoom] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("roomNumber");
  const [sortOrder, setSortOrder] = useState("asc");

  // ================= FETCH ROOMS =================
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await apiprivate.get("/rooms/getallrooms");
      setRooms(res.data);
    } catch {
      toast.error("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ================= STATISTICS =================
  const calculateStats = () => {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.currentOccupancy < r.maxCapacity).length;
    const occupiedRooms = rooms.filter(r => r.currentOccupancy === r.maxCapacity).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.maxCapacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
    const occupancyRate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0;
    const averagePrice = rooms.length > 0 ? (rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length).toFixed(0) : 0;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalCapacity,
      totalOccupied,
      occupancyRate,
      averagePrice
    };
  };

  const stats = calculateStats();

  // ================= FILTER AND SORT =================
  const filteredAndSortedRooms = rooms
    .filter((room) => {
      // Tab filter
      if (activeTab === "available") return room.currentOccupancy < room.maxCapacity;
      if (activeTab === "occupied") return room.currentOccupancy === room.maxCapacity;
      
      // Search filter
      const matchesSearch = searchTerm === "" ||
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Type filter
      const matchesType = typeFilter === "all" || room.type === typeFilter;

      // Price range filter
      const matchesPrice = 
        (priceRange.min === "" || room.price >= Number(priceRange.min)) &&
        (priceRange.max === "" || room.price <= Number(priceRange.max));

      return matchesSearch && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "roomNumber":
          aValue = a.roomNumber;
          bValue = b.roomNumber;
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "capacity":
          aValue = a.maxCapacity;
          bValue = b.maxCapacity;
          break;
        case "occupancy":
          aValue = a.currentOccupancy / a.maxCapacity;
          bValue = b.currentOccupancy / b.maxCapacity;
          break;
        default:
          aValue = a.roomNumber;
          bValue = b.roomNumber;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // ================= ADD ROOM =================
  const handleAddRoom = async () => {
    const { roomNumber, price, maxCapacity, description, type } = newRoom;
    if (!roomNumber || !price || !maxCapacity || !description)
      return toast.error("Fill all fields");

    if (!imageFiles.length) return toast.error("Upload at least one image");

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("roomNumber", roomNumber);
      fd.append("type", type);
      fd.append("price", price);
      fd.append("capacity", maxCapacity);
      fd.append("description", description);
      imageFiles.forEach((img) => fd.append("images", img));

      await apiprivate.post("/rooms/create", fd);
      toast.success("Room added successfully");
      setShowAddModal(false);
      setNewRoom({ roomNumber: "", type: "Standard", price: "", maxCapacity: "", description: "" });
      setImageFiles([]);
      fetchRooms();
    } catch {
      toast.error("Failed to add room");
    } finally {
      setUploading(false);
    }
  };

  // ================= ADD STUDENT =================
  const openAddStudentModal = (room) => {
    setSelectedRoomForStudent(room);
    setStudentForm({ name: "", email: "", password: "", feeAmount: room.price });
    setShowAddStudentModal(true);
  };

  const handleAddStudent = async () => {
    const { name, email, password, feeAmount } = studentForm;
    if (!name || !email || !password || !feeAmount)
      return toast.error("All fields required");

    try {
      await apiprivate.post("/users/createUserAdmin", {
        ...studentForm,
        roomId: selectedRoomForStudent._id,
      });
      toast.success("Student added successfully");
      setShowAddStudentModal(false);
      fetchRooms();
    } catch {
      toast.error("Failed to add student");
    }
  };

  // ================= EDIT ROOM =================
  const openEditModal = (room) => {
    setEditRoom({
      _id: room._id,
      roomNumber: room.roomNumber,
      description: room.description,
      price: room.price,
      capacity: room.maxCapacity,
      type: room.type,
      isActive: room.isActive ?? true,
    });
    setEditImages([]);
    setShowEditModal(true);
  };

  const handleUpdateRoom = async () => {
    try {
      setUpdating(true);
      const fd = new FormData();
      fd.append("description", editRoom.description);
      fd.append("price", editRoom.price);
      fd.append("capacity", editRoom.capacity);
      fd.append("type", editRoom.type);
      fd.append("isActive", editRoom.isActive);

      editImages.forEach((img) => fd.append("images", img));

      await apiprivate.put(`/rooms/updateroom/${editRoom._id}`, fd);
      toast.success("Room updated successfully");
      setShowEditModal(false);
      fetchRooms();
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  // ================= DELETE ROOM =================
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      await apiprivate.delete(`/rooms/deleteroom/${roomId}`);
      toast.success("Room deleted successfully");
      fetchRooms();
    } catch {
      toast.error("Failed to delete room");
    }
  };

  // ================= EXPORT DATA =================
  const handleExportRooms = () => {
    const csvContent = [
      ["Room Number", "Type", "Price", "Max Capacity", "Current Occupancy", "Available Beds", "Description", "Status"],
      ...filteredAndSortedRooms.map(room => [
        room.roomNumber,
        room.type,
        room.price,
        room.maxCapacity,
        room.currentOccupancy,
        room.maxCapacity - room.currentOccupancy,
        room.description || "",
        room.currentOccupancy < room.maxCapacity ? "Available" : "Occupied"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooms_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ================= FORMAT CURRENCY =================
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  // ================= GET STATUS COLOR =================
  const getStatusColor = (room) => {
    const occupancyRate = (room.currentOccupancy / room.maxCapacity) * 100;
    if (occupancyRate === 0) return "bg-green-900/50 text-green-300 border border-green-700";
    if (occupancyRate === 100) return "bg-red-900/50 text-red-300 border border-red-700";
    return "bg-yellow-900/50 text-yellow-300 border border-yellow-700";
  };

  const getStatusText = (room) => {
    const occupancyRate = (room.currentOccupancy / room.maxCapacity) * 100;
    if (occupancyRate === 0) return "Available";
    if (occupancyRate === 100) return "Occupied";
    return `${room.currentOccupancy}/${room.maxCapacity} Occupied`;
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Room Management</h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportRooms}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Room
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Rooms</p>
                <p className="text-3xl font-bold text-white mt-2">{stats.totalRooms}</p>
              </div>
              <Home className="w-12 h-12 text-blue-500/30" />
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-gray-400">Capacity: {stats.totalCapacity}</span>
              <span className="text-gray-400">Avg: {formatCurrency(stats.averagePrice)}</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Rooms</p>
                <p className="text-3xl font-bold text-green-400 mt-2">{stats.availableRooms}</p>
              </div>
              <BedDouble className="w-12 h-12 text-green-500/30" />
            </div>
            <div className="mt-4 text-sm">
              <span className="text-gray-400">{stats.totalOccupied} beds occupied</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Occupied Rooms</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">{stats.occupiedRooms}</p>
              </div>
              <Users className="w-12 h-12 text-yellow-500/30" />
            </div>
            <div className="mt-4 text-sm">
              <span className="text-gray-400">{stats.occupancyRate}% occupancy rate</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Price</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">{formatCurrency(stats.averagePrice)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-500/30" />
            </div>
            <div className="mt-4 text-sm">
              <span className="text-gray-400">Per room/month</span>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-700 pb-4">
            {[
              { id: "all", label: "All Rooms", count: rooms.length },
              { id: "available", label: "Available", count: rooms.filter(r => r.currentOccupancy < r.maxCapacity).length },
              { id: "occupied", label: "Occupied", count: rooms.filter(r => r.currentOccupancy === r.maxCapacity).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-colors relative ${
                  activeTab === tab.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? "bg-blue-500" : "bg-gray-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Rooms
              </label>
              <input
                type="text"
                placeholder="Search by room number, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Standard">Standard</option>
                <option value="Deluxe">Deluxe</option>
                <option value="AC">AC</option>
                <option value="Suite">Suite</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-1/2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-1/2 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="roomNumber">Room Number</option>
                  <option value="price">Price</option>
                  <option value="capacity">Capacity</option>
                  <option value="occupancy">Occupancy</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg hover:bg-gray-600"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-12 h-12 text-blue-500" />
          </div>
        ) : filteredAndSortedRooms.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-gray-600 text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No rooms found</h3>
            <p className="text-gray-400">
              {searchTerm || typeFilter !== "all" || priceRange.min || priceRange.max
                ? "Try changing your filters or search terms"
                : "No rooms available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRooms.map((room) => (
              <div key={room._id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* Room Image */}
                <div className="relative h-48 bg-gray-700">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={room.images[0].url}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                      🏠
                    </div>
                  )}
                  
                  {/* Image count badge */}
                  {room.images?.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {room.images.length} photos
                    </span>
                  )}

                  {/* Status Badge */}
                  <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room)}`}>
                    {getStatusText(room)}
                  </span>
                </div>

                {/* Room Details */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">Room {room.roomNumber}</h3>
                      <p className="text-sm text-gray-400">{room.type}</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{formatCurrency(room.price)}</p>
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{room.description}</p>

                  {/* Occupancy Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Occupancy</span>
                      <span>{room.currentOccupancy}/{room.maxCapacity}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(room.currentOccupancy / room.maxCapacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openAddStudentModal(room)}
                      disabled={room.currentOccupancy >= room.maxCapacity}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Users className="w-4 h-4" />
                      Add Student
                    </button>
                    
                    <button
                      onClick={() => openEditModal(room)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    
                   
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD ROOM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Room</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3-101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Type *
                  </label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="AC">AC</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Amount"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Capacity *
                    </label>
                    <input
                      type="number"
                      value={newRoom.maxCapacity}
                      onChange={(e) => setNewRoom({ ...newRoom, maxCapacity: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Capacity"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the room features..."
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Images *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImageFiles([...e.target.files])}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {imageFiles.length} file(s) selected
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddRoom}
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? "Adding..." : "Add Room"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROOM MODAL */}
      {showEditModal && editRoom && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Room {editRoom.roomNumber}</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editRoom.description}
                    onChange={(e) => setEditRoom({ ...editRoom, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      value={editRoom.price}
                      onChange={(e) => setEditRoom({ ...editRoom, price: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Capacity
                    </label>
                    <input
                      type="number"
                      value={editRoom.capacity}
                      onChange={(e) => setEditRoom({ ...editRoom, capacity: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Type
                  </label>
                  <select
                    value={editRoom.type}
                    onChange={(e) => setEditRoom({ ...editRoom, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="AC">AC</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editRoom.isActive}
                    onChange={(e) => setEditRoom({ ...editRoom, isActive: e.target.checked })}
                    className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-300">
                    Room is active (available for booking)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add New Images (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setEditImages([...e.target.files])}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateRoom}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? "Updating..." : "Update Room"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && selectedRoomForStudent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Add Student to Room {selectedRoomForStudent.roomNumber}
                </h2>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="text-gray-400 hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg mb-4 border border-gray-600">
                <h3 className="font-medium text-blue-300 mb-2">Room Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-blue-300">Room Number:</div>
                  <div className="text-white">{selectedRoomForStudent.roomNumber}</div>
                  
                  <div className="text-blue-300">Type:</div>
                  <div className="text-white">{selectedRoomForStudent.type}</div>
                  
                  <div className="text-blue-300">Price:</div>
                  <div className="text-white">{formatCurrency(selectedRoomForStudent.price)}</div>
                  
                  <div className="text-blue-300">Available Beds:</div>
                  <div className="text-green-400">
                    {selectedRoomForStudent.maxCapacity - selectedRoomForStudent.currentOccupancy}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter student name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fee Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={studentForm.feeAmount}
                    onChange={(e) => setStudentForm({ ...studentForm, feeAmount: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter fee amount"
                    min="0"
                    required
                  />
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddStudentModal(false)}
                      className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStudent}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetails;