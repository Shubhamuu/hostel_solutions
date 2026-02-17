import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiprivate } from '../../services/api';
import SuperAdminSimpleNavbar from "./navbar";

const AllUsersCard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiprivate.get('/users/allUser');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'SUPERADMIN': return 'bg-red-500';
      case 'ADMIN': return 'bg-purple-500';
      case 'STUDENT': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(user => user.role === filter);

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
        <SuperAdminSimpleNavbar />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <select 
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Users</option>
          <option value="ADMIN">Admins</option>
          <option value="STUDENT">Students</option>
          <option value="SUPERADMIN">Super Admins</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div key={user._id} className="border rounded-lg shadow-lg p-4 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <span className={`${getRoleColor(user.role)} text-white px-2 py-1 rounded text-sm`}>
                {user.role}
              </span>
            </div>
            
            <p className="text-gray-600 mb-2">{user.email}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-semibold ${
                  user.approvalStatus === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {user.approvalStatus}
                </span>
              </div>
              
          
              
              {user.hostelname && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Hostel:</span>
                  <span>{user.hostelname}</span>
                </div>
              )}
              
              {user.roomId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Room:</span>
                  <span>{user.roomId}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t text-xs text-gray-400">
              ID: {user._id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllUsersCard;