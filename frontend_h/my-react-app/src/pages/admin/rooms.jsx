import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiprivate } from "../../services/api";
import AdminNavbar from "../../components/common/adminNavbar";
import { Plus, X, Loader2 } from "lucide-react";
const RoomDetails = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    type: "Standard",
    price: "",
    maxCapacity: "",
    description: "",
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedRoomForStudent, setSelectedRoomForStudent] = useState(null);

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    password: "",
    feeAmount: "",
  });

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await apiprivate.get("/rooms/getallrooms");
      setRooms(response.data);
    } catch (error) {
      toast.error("Failed to fetch rooms");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (activeTab === "available") return room.currentOccupancy < room.maxCapacity;
    if (activeTab === "occupied") return room.currentOccupancy === room.maxCapacity;
    return true;
  });

  // Room stats
  const stats = (() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.currentOccupancy === r.maxCapacity).length;
    const availableRooms = rooms.filter((r) => r.currentOccupancy < r.maxCapacity).length;
    const totalCapacity = rooms.reduce((sum, r) => sum + r.maxCapacity, 0);
    const totalOccupancy = rooms.reduce((sum, r) => sum + r.currentOccupancy, 0);
    const avgOccupancyRate = totalCapacity ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0;
    return { totalRooms, occupiedRooms, availableRooms, totalCapacity, totalOccupancy, avgOccupancyRate };
  })();

  // Image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.some((f) => f.size > 1024 * 1024)) {
      toast.error("Each image must be less than 1MB");
      return;
    }

    if (files.length + imagePreviews.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const previews = files.map((file) => ({ url: URL.createObjectURL(file), name: file.name }));
    setImagePreviews([...imagePreviews, ...previews]);
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index) => {
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    newFiles.splice(index, 1);
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom((prev) => ({
      ...prev,
      [name]: ["price", "maxCapacity"].includes(name) ? Number(value) : value,
    }));
  };

  // Add room
  const handleAddRoom = async () => {
    const { roomNumber, price, maxCapacity, description, type } = newRoom;
    if (!roomNumber || !price || !maxCapacity || !description) return toast.error("Fill all fields");
    if (!imageFiles.length) return toast.error("Upload at least one image");

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("roomNumber", roomNumber);
      formData.append("type", type);
      formData.append("price", price);
      formData.append("capacity", maxCapacity);
      formData.append("description", description);
      imageFiles.forEach((file) => formData.append("images", file));

      const res = await apiprivate.post("/rooms/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 201) {
        toast.success("Room added successfully");
        setShowAddModal(false);
        resetForm();
        fetchRooms();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add room");
    } finally {
      setUploading(false);
    }
  };

  const openAddStudentModal = (room) => {
    setSelectedRoomForStudent(room);
    setStudentForm({ name: "", email: "", password: "", feeAmount: room.price });
    setShowAddStudentModal(true);
  };

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async () => {
    const { name, email, password, feeAmount } = studentForm;
    if (!name || !email || !password || !feeAmount) return toast.error("All fields required");

    try {
      await apiprivate.post("/users/createUserAdmin", {
        name,
        email,
        password,
        feeAmount,
        roomId: selectedRoomForStudent._id,
      });
      toast.success("Student added successfully");
      setShowAddStudentModal(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student");
    }
  };

  const resetForm = () => {
    setNewRoom({ roomNumber: "", type: "Standard", price: "", maxCapacity: "", description: "", images: [] });
    setImagePreviews([]);
    setImageFiles([]);
    setSelectedRoom(null);
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amt);

  const getRoomTypeColor = (type) => {
    const t = type.toLowerCase();
    if (t.includes("deluxe")) return "bg-amber-200 text-amber-800";
    if (t.includes("ac")) return "bg-yellow-200 text-yellow-800";
    if (t.includes("standard")) return "bg-blue-100 text-blue-800";
    if (t.includes("suite")) return "bg-pink-100 text-pink-800";
    return "bg-gray-100 text-gray-800";
  };

  const getOccupancyColor = (current, max) => {
    if (current === 0) return "bg-green-200 text-green-800";
    if (current < max) return "bg-yellow-200 text-yellow-800";
    if (current === max) return "bg-red-200 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <AdminNavbar />
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Room Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Room
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow p-4 flex space-x-4">
        {["all", "available", "occupied"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab ? "bg-amber-200 text-amber-800" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-12 h-12 text-amber-500" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No rooms found</h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Add Your First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              {/* Room Image */}
              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                {room.images[0] ? <img src={room.images[0].url} className="w-full h-full object-cover" /> : "🏠"}
                <span
                  className={`absolute top-3 left-3 px-3 py-1 text-xs rounded-full ${getRoomTypeColor(
                    room.type
                  )}`}
                >
                  {room.type}
                </span>
                <span
                  className={`absolute top-3 right-3 px-3 py-1 text-xs rounded-full ${getOccupancyColor(
                    room.currentOccupancy,
                    room.maxCapacity
                  )}`}
                >
                  {room.currentOccupancy}/{room.maxCapacity}
                </span>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg">Room {room.roomNumber}</h3>
                <p className="text-gray-600 mb-2">{room.description}</p>
                <p className="font-semibold text-amber-600">{formatCurrency(room.price)} / month</p>

                <button
                  onClick={() => openAddStudentModal(room)}
                  disabled={room.currentOccupancy >= room.maxCapacity}
                  className="mt-3 px-3 py-1.5 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50"
                >
                  Add Student
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && selectedRoomForStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Student to Room {selectedRoomForStudent.roomNumber}</h2>
              <button onClick={() => setShowAddStudentModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">
                <X />
              </button>
            </div>
            <div className="space-y-4">
              {["name", "email", "password", "feeAmount"].map((field) => (
                <input
                  key={field}
                  type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                  name={field}
                  placeholder={field === "feeAmount" ? "Fee Amount" : field.charAt(0).toUpperCase() + field.slice(1)}
                  value={studentForm[field]}
                  onChange={handleStudentChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddStudentModal(false)} className="px-4 py-2 border rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetails;
