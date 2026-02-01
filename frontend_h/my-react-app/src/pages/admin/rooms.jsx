// components/RoomDetails.js
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiprivate } from '../../services/api';

const RoomDetails = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: 'Standard',
    price: '',
    maxCapacity: '',
    description: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'available', 'occupied'

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await apiprivate.get('/rooms/getallrooms');
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filter rooms based on active tab
  const filteredRooms = rooms.filter(room => {
    if (activeTab === 'available') {
      return room.currentOccupancy < room.maxCapacity;
    } else if (activeTab === 'occupied') {
      return room.currentOccupancy === room.maxCapacity;
    }
    return true; // 'all' tab
  });

  // Calculate statistics
  const calculateStats = () => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(room => room.currentOccupancy === room.maxCapacity).length;
    const availableRooms = rooms.filter(room => room.currentOccupancy < room.maxCapacity).length;
    const totalCapacity = rooms.reduce((sum, room) => sum + room.maxCapacity, 0);
    const totalOccupancy = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);
    const totalBooking = rooms.reduce((sum, room) => sum + (room.booking || 0), 0);
    const avgOccupancyRate = totalRooms > 0 ? (totalOccupancy / totalCapacity * 100).toFixed(1) : 0;
    
    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      totalCapacity,
      totalOccupancy,
      totalBooking,
      avgOccupancyRate
    };
  };

  const stats = calculateStats();

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file size (max 1MB)
    const oversizedFiles = files.filter(file => file.size > 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Image size should be less than 1MB');
      return;
    }
    
    // Validate max 5 images
    if (files.length + imagePreviews.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Create previews
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setImagePreviews([...imagePreviews, ...previews]);
    setImageFiles([...imageFiles, ...files]);
  };

  // Remove image
  const removeImage = (index) => {
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    newFiles.splice(index, 1);
    
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRoom(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'maxCapacity' ? Number(value) : value
    }));
  };

  // Add new room
  const handleAddRoom = async () => {
    if (
      !newRoom.roomNumber ||
      !newRoom.price ||
      !newRoom.maxCapacity ||
      !newRoom.description
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    if (imageFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('roomNumber', newRoom.roomNumber);
      formData.append('type', newRoom.type);
      formData.append('price', newRoom.price);
      formData.append('capacity', newRoom.maxCapacity);
      formData.append('description', newRoom.description);

      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiprivate.post(
        '/rooms/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 201) {
        toast.success('Room added successfully');
        resetForm();
        setShowAddModal(false);
        fetchRooms();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add room');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Edit room
  const handleEditRoom = async () => {
    if (!selectedRoom) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('roomNumber', newRoom.roomNumber);
      formData.append('type', newRoom.type);
      formData.append('price', newRoom.price);
      formData.append('capacity', newRoom.maxCapacity);
      formData.append('description', newRoom.description);

      // Only append new images if there are any
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiprivate.put(
        `rooms/updateroom/${selectedRoom._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 200) {
        toast.success('Room updated successfully');
        resetForm();
        setShowEditModal(false);
        setSelectedRoom(null);
        fetchRooms();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update room');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Open edit modal with room data
  const openEditModal = (room) => {
    setSelectedRoom(room);
    setNewRoom({
      roomNumber: room.roomNumber,
      type: room.type,
      price: room.price,
      maxCapacity: room.maxCapacity,
      description: room.description,
      images: room.images
    });
    setImagePreviews([]);
    setImageFiles([]);
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setNewRoom({
      roomNumber: '',
      type: 'Standard',
      price: '',
      maxCapacity: '',
      description: '',
      images: []
    });
    setImagePreviews([]);
    setImageFiles([]);
    setSelectedRoom(null);
  };

  // Room type colors
  const getRoomTypeColor = (type) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('deluxe')) return 'bg-purple-100 text-purple-800';
    if (typeLower.includes('ac')) return 'bg-green-100 text-green-800';
    if (typeLower.includes('standard')) return 'bg-blue-100 text-blue-800';
    if (typeLower.includes('suite')) return 'bg-pink-100 text-pink-800';
    if (typeLower.includes('premium')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Occupancy status colors
  const getOccupancyColor = (current, max) => {
    if (current === 0) return 'bg-green-100 text-green-800';
    if (current < max) return 'bg-yellow-100 text-yellow-800';
    if (current === max) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await apiprivate.delete(`/rooms/delete/${roomId}`);
      toast.success('Room deleted successfully!');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
      console.error('Error deleting room:', error);
    }
  };

  // Toggle room status
  const handleToggleStatus = async (roomId, currentStatus) => {
    try {
      await apiprivate.patch(`/rooms/toggle-status/${roomId}`, {
        isActive: !currentStatus
      });
      toast.success('Room status updated successfully!');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to update room status');
      console.error('Error updating room status:', error);
    }
  };

  // Render occupancy progress bar
  const renderOccupancyBar = (current, max) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    let color = 'bg-green-500';
    
    if (percentage >= 75) color = 'bg-red-500';
    else if (percentage >= 50) color = 'bg-yellow-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Room Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Room</span>
        </button>
      </div>

      {/* Room Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-blue-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Total Rooms</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalRooms}</p>
            <p className="text-xs text-gray-400 mt-1">Capacity: {stats.totalCapacity}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-green-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Available Rooms</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.availableRooms}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.avgOccupancyRate}% occupancy rate</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-red-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Occupied Rooms</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.occupiedRooms}</p>
            <p className="text-xs text-gray-400 mt-1">{stats.totalOccupancy} persons</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-l-4 border-purple-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Active Bookings</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalBooking}</p>
            <p className="text-xs text-gray-400 mt-1">Current bookings</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'all' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'available' ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Available ({stats.availableRooms})
          </button>
          <button
            onClick={() => setActiveTab('occupied')}
            className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'occupied' ? 'bg-red-100 text-red-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Occupied ({stats.occupiedRooms})
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No rooms found</h3>
          <p className="text-gray-500">
            {activeTab === 'all' 
              ? 'No rooms have been added yet.' 
              : activeTab === 'available' 
                ? 'All rooms are currently occupied.'
                : 'No rooms are currently occupied.'}
          </p>
          {activeTab === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Room
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group border border-gray-200"
            >
              {/* Image Carousel */}
              <div className="relative h-48 overflow-hidden">
                {room.images.length > 0 ? (
                  <div className="relative h-full">
                    {room.images.map((image, index) => (
                      <div
                        key={image._id}
                        className={`absolute inset-0 transition-opacity duration-500 ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
                      >
                        <img
                          src={image.url}
                          alt={`Room ${room.roomNumber} - Image ${index + 1}`}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {room.images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            // Add carousel navigation logic here
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-5xl">🏠</span>
                  </div>
                )}
                
                {/* Status badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(room.type)}`}>
                    {room.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOccupancyColor(room.currentOccupancy, room.maxCapacity)}`}>
                    {room.currentOccupancy === room.maxCapacity ? 'Full' : 
                     room.currentOccupancy === 0 ? 'Empty' : 'Partial'}
                  </span>
                </div>
                
                {/* Price badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg">
                  <span className="font-bold text-lg">{formatCurrency(room.price)}</span>
                  <span className="text-xs block">per month</span>
                </div>
                
                {/* Room status toggle */}
                <div className="absolute bottom-3 right-3">
                  <button
                    onClick={() => handleToggleStatus(room._id, room.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${room.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                  >
                    {room.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {/* Room Details */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Room {room.roomNumber}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {room.currentOccupancy}/{room.maxCapacity} occupied
                      </span>
                      {room.booking > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {room.booking} booking{room.booking !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Occupancy</span>
                    <span>{room.currentOccupancy}/{room.maxCapacity}</span>
                  </div>
                  {renderOccupancyBar(room.currentOccupancy, room.maxCapacity)}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                  {room.description}
                </p>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Added: {formatDate(room.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(room)}
                      className="px-3 py-1.5 text-blue-600 hover:text-blue-900 text-sm font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit room"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      className="px-3 py-1.5 text-red-600 hover:text-red-900 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete room"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal (Keep your existing modal code, just update the form validation) */}
        {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add New Room</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number *
                    </label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={newRoom.roomNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 101"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type *
                    </label>
                    <select
                      name="type"
                      value={newRoom.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="AC">AC</option>
                      <option value="Suite">Suite</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Month (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={newRoom.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity *
                    </label>
                    <input
                      type="number"
                      name="maxCapacity"
                      value={newRoom.maxCapacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={newRoom.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the room features, amenities, etc."
                    required
                  ></textarea>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Images (Max 5, 1MB each) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-1">Click to upload images</p>
                        <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 1MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {imagePreviews.length} image(s) selected
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRoom}
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Room'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Edit Room {selectedRoom.roomNumber}
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Display current occupancy info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-blue-800">Current Occupancy</h3>
                    <p className="text-sm text-blue-600">
                      {selectedRoom.currentOccupancy} out of {selectedRoom.maxCapacity} persons
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-medium text-blue-800">Active Bookings</h3>
                    <p className="text-sm text-blue-600">{selectedRoom.booking || 0} bookings</p>
                  </div>
                </div>
              </div>

              {/* Form (same as Add Room but with existing values) */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Number *
                    </label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={newRoom.roomNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 101"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type *
                    </label>
                    <select
                      name="type"
                      value={newRoom.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="AC">AC</option>
                      <option value="Suite">Suite</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Month (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={newRoom.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 10000"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Capacity *
                    </label>
                    <input
                      type="number"
                      name="maxCapacity"
                      value={newRoom.maxCapacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={newRoom.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the room features, amenities, etc."
                    required
                  ></textarea>
                </div>

                {/* Existing Images */}
                {selectedRoom.images.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Images ({selectedRoom.images.length})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {selectedRoom.images.map((image, index) => (
                        <div key={image._id} className="relative">
                          <img
                            src={image.url}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Images (Max 5, 1MB each)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label htmlFor="edit-image-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 mb-1">Click to upload new images</p>
                        <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 1MB</p>
                      </div>
                    </label>
                  </div>

                  {/* New Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {imagePreviews.length} new image(s) selected
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditRoom}
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Room'
                    )}
                  </button>
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