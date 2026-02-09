import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiprivate } from '../../services/api';
import AdminNavbar from "../../components/common/adminNavbar";
import {
  Search,
  Filter,
  Download,
  User,
  Mail,
  Shield,
  Home,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  MoreVertical,
  ChevronDown,
  Building,
  Key,
  Mail as MailIcon,
  Calendar,
  AlertCircle,
  RefreshCw,
  UserCheck,
  UserX,
  Loader2,
  Plus
} from 'lucide-react';

const UserDetails = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [showAssignRoomModal, setShowAssignRoomModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [assigningRoom, setAssigningRoom] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [editingUser, setEditingUser] = useState({
    name: '',
    email: '',
    role: 'STUDENT'
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiprivate.get('/users/');
      // Handle both array and object responses
      const usersData = Array.isArray(response.data) ? response.data : [response.data];
      setUsers(usersData);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available rooms for assignment
  const fetchAvailableRooms = async () => {
    try {
      const response = await apiprivate.get('/rooms/getallrooms');
      // Filter rooms that have available capacity
      const availableRooms = response.data.filter(room => 
        room.currentOccupancy < room.maxCapacity
      );
      setRooms(availableRooms);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-400 bg-purple-500/20';
      case 'SUPER_ADMIN': return 'text-rose-400 bg-rose-500/20';
      case 'STUDENT': return 'text-indigo-400 bg-indigo-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <Shield size={12} />;
      case 'SUPER_ADMIN': return <Key size={12} />;
      case 'STUDENT': return <User size={12} />;
      default: return <User size={12} />;
    }
  };

  // Get verification status color
  const getVerificationColor = (isVerified) => {
    return isVerified ? 'text-emerald-400 bg-emerald-500/20' : 'text-amber-400 bg-amber-500/20';
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Verification filter
    const matchesVerification = 
      verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.isVerified) ||
      (verificationFilter === 'unverified' && !user.isVerified);
    
    // Room filter
    const matchesRoom = 
      roomFilter === 'all' || 
      (roomFilter === 'withRoom' && user.roomId) ||
      (roomFilter === 'withoutRoom' && !user.roomId);
    
    return matchesSearch && matchesRole && matchesVerification && matchesRoom;
  });

  // Calculate statistics
  const calculateStats = () => {
    const totalUsers = users.length;
    const admins = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
    const students = users.filter(u => u.role === 'STUDENT').length;
    const verified = users.filter(u => u.isVerified).length;
    const withRooms = users.filter(u => u.roomId).length;
    
    return {
      totalUsers,
      admins,
      students,
      verified,
      withRooms,
      unverified: totalUsers - verified,
      withoutRooms: totalUsers - withRooms
    };
  };

  const stats = calculateStats();

  // Open assign room modal
  const openAssignRoomModal = (user) => {
    setSelectedUser(user);
    fetchAvailableRooms();
    setSelectedRoomId(user.roomId || '');
    setShowAssignRoomModal(true);
  };

  // Open edit user modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditingUser({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setShowEditModal(true);
  };

  // Open user details modal
  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Handle assign room
  const handleAssignRoom = async () => {
    if (!selectedRoomId) {
      toast.error('Please select a room');
      return;
    }

    try {
      setAssigningRoom(true);
      await apiprivate.put(`/users/${selectedUser._id}/assign-room`, {
        roomId: selectedRoomId
      });
      
      toast.success('Room assigned successfully');
      setShowAssignRoomModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign room');
    } finally {
      setAssigningRoom(false);
    }
  };

  // Handle remove room assignment
  const handleRemoveRoom = async (userId) => {
    if (!window.confirm('Are you sure you want to remove room assignment?')) return;

    try {
      await apiprivate.put(`/users/${userId}/assign-room`, {
        roomId: null
      });
      
      toast.success('Room assignment removed');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove room assignment');
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    if (!editingUser.name || !editingUser.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await apiprivate.put(`/users/${selectedUser._id}`, editingUser);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;

    try {
      await apiprivate.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle resend verification
  const handleResendVerification = async (userId, email) => {
    try {
      await apiprivate.post(`/users/${userId}/resend-verification`);
      toast.success(`Verification email sent to ${email}`);
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  };

  // Handle toggle verification
  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      await apiprivate.patch(`/users/${userId}/toggle-verification`, {
        isVerified: !currentStatus
      });
      toast.success('Verification status updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  // Handle export users
  const handleExportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Verified', 'Room Assigned', 'Hostel', 'Created At', 'Verified At'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.role,
        user.isVerified ? 'Yes' : 'No',
        user.roomId ? 'Yes' : 'No',
        user.hostelId ? 'Yes' : 'No',
        formatDate(user.createdAt),
        formatDate(user.verifiedAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Users exported successfully');
  };

  const StatCard = ({ icon, label, value, color, secondary }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('400', '500/20')}`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {secondary && <p className="text-xs text-gray-500 mt-1">{secondary}</p>}
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ children, color }) => (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6">
       <AdminNavbar />
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme="dark"
        toastClassName="bg-gray-800 text-white"
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                User Management
              </h1>
              <p className="text-gray-400">
                Manage all students
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportUsers}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users size={24} className="text-blue-400" />}
            label="Total Students"
            value={stats.totalUsers}
            color="text-blue-400"
            secondary={`${stats.students} Students, ${stats.admins} Admins`}
          />
          
          <StatCard
            icon={<UserCheck size={24} className="text-emerald-400" />}
            label="Verified Users"
            value={stats.verified}
            color="text-emerald-400"
            secondary={`${stats.unverified} pending verification`}
          />
          
          <StatCard
            icon={<Home size={24} className="text-purple-400" />}
            label="student"
            value={stats.withRooms}
            color="text-purple-400"
            secondary={`${stats.withoutRooms} without rooms`}
          />
          
          <StatCard
            icon={<Calendar size={24} className="text-amber-400" />}
            label="Active Today"
            value={users.filter(u => {
              const today = new Date();
              const userDate = new Date(u.updatedAt || u.createdAt);
              return userDate.toDateString() === today.toDateString();
            }).length}
            color="text-amber-400"
            secondary="Updated today"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500"
                />

               
              </div>
            </div>
            
          
            
           
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Filter by Room
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white appearance-none"
                >
                  <option value="all" className="bg-gray-800">All Users</option>
                  <option value="withRoom" className="bg-gray-800">With Room</option>
                  <option value="withoutRoom" className="bg-gray-800">Without Room</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
              </div>
            </div>
           
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'Try changing your search terms' : 'No users match the selected filters'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role & Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Room Assignment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-white">
                                {user.name}
                              </div>
                              <button
                                onClick={() => openDetailsModal(user)}
                                className="text-gray-400 hover:text-white"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <MailIcon size={12} />
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              ID: {user._id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <StatusBadge color={getRoleColor(user.role)}>
                            {getRoleIcon(user.role)}
                            <span>{user.role}</span>
                          </StatusBadge>
                          <div className="text-xs text-gray-400">
                            Bookings: {user.bookingHistory?.length || 0}
                          </div>
                        </div>
                      </td>

                      {/* Room Assignment */}
                      <td className="px-6 py-4">
                        {user.roomId ? (
                          <div className="space-y-2">
                            <StatusBadge color="text-emerald-400 bg-emerald-500/20">
                              <Home size={12} />
                              <span>Room Assigned</span>
                            </StatusBadge>
                            <div className="text-xs text-gray-400">
                              Room ID: {user.roomId.substring(0, 8)}...
                            </div>
                           
                            <button
                              onClick={() => handleRemoveRoom(user._id)}
                              className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                            >
                              Remove Assignment
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <StatusBadge color="text-gray-400 bg-gray-500/20">
                              <AlertCircle size={12} />
                              <span>No Room</span>
                            </StatusBadge>
                            {user.role === 'STUDENT' && (
                              <button
                                onClick={() => openAssignRoomModal(user)}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors block"
                              >
                                Assign Room
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Verification */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <StatusBadge color={getVerificationColor(user.isVerified)}>
                            {user.isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                            <span>{user.isVerified ? 'Verified' : 'Unverified'}</span>
                          </StatusBadge>
                          <div className="text-xs text-gray-400">
                            {user.isVerified ? (
                              <span>Verified: {formatDate(user.verifiedAt)}</span>
                            ) : (
                              <button
                                onClick={() => handleResendVerification(user._id, user.email)}
                                className="text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                Resend Verification
                              </button>
                            )}
                          </div>
                          
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Updated: {formatDate(user.updatedAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                        
                          
                          {user.role === 'STUDENT' && !user.roomId && (
                            <button
                              onClick={() => openAssignRoomModal(user)}
                              className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Assign room"
                            >
                              <Home size={16} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">User Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl">
                    <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedUser.name}</h3>
                      <p className="text-gray-400 flex items-center gap-2">
                        <MailIcon size={14} />
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="User ID" value={selectedUser._id} />
                   
                    <DetailItem label="Status" value={selectedUser.isVerified ? 'Verified' : 'Unverified'} />
                    <DetailItem label="Room Assigned" value={selectedUser.roomId ? 'Yes' : 'No'} />
                    <DetailItem label="Hostel" value={selectedUser.hostelId ? 'Yes' : 'No'} />
                    <DetailItem label="Bookings" value={selectedUser.bookingHistory?.length || 0} />
                  </div>

                  {/* Dates */}
                  <div className="space-y-4">
                    <DetailItem label="Created At" value={formatDate(selectedUser.createdAt)} fullWidth />
                    <DetailItem label="Updated At" value={formatDate(selectedUser.updatedAt)} fullWidth />
                    {selectedUser.isVerified && (
                      <DetailItem label="Verified At" value={formatDate(selectedUser.verifiedAt)} fullWidth />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Room Modal */}
        {showAssignRoomModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Assign Room to {selectedUser.name}
                  </h2>
                  <button
                    onClick={() => setShowAssignRoomModal(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Select Room
                    </label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white"
                    >
                      <option value="">-- Select a Room --</option>
                      {rooms.map(room => (
                        <option key={room._id} value={room._id} className="bg-gray-800">
                          Room {room.roomNumber} ({room.type}) - {room.currentOccupancy}/{room.maxCapacity} occupied
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-4">
                      Assigning a room will make this student an occupant of the selected room.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowAssignRoomModal(false)}
                        className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        disabled={assigningRoom}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAssignRoom}
                        disabled={assigningRoom || !selectedRoomId}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningRoom ? 'Assigning...' : 'Assign Room'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
       
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-sm text-white font-medium">{value}</p>
  </div>
);

export default UserDetails;