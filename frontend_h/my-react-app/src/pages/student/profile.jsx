import React, { useState, useEffect } from "react";
import { apiprivate } from "../../services/api";

import StudentNavBar from "../../components/common/studentNavbar";

const ProfileSection = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await apiprivate.get("/users/me");
        setUser(response.data.user);
        setNewName(response.data.user.name);
      } catch (err) {
        toast.error("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleNameUpdate = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      await apiprivate.put("/users/update", { name: newName });
      setUser({ ...user, name: newName });
      setIsEditingName(false);
      toast.success("Name updated successfully!", {
        icon: '👤',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await apiprivate.post("/auth/change-password", { newPassword, oldPassword});
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!", {
        icon: '🔒',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password"||"Old password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading && !user) {
    return (
      <>
        <StudentNavBar />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0A0C10] to-gray-900 pt-20">
          <div className="flex justify-center items-center h-[80vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-400 mt-4 text-center animate-pulse">Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <StudentNavBar />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0A0C10] to-gray-900 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Profile Header */}
          <div className="mb-8 animate-fadeIn">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-3xl text-white">👤</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-900"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                <p className="text-gray-400 flex items-center mt-1">
                  <span className="mr-1">📧</span>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            
            {/* Profile Sections */}
            <div className="p-6 space-y-6">
              
              {/* Name Section */}
              <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-300 flex items-center">
                    <span className="mr-2 text-blue-400">👤</span>
                    FULL NAME
                  </label>
                  {!isEditingName && (
                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-700 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                
                {isEditingName ? (
                  <div className="flex gap-2 animate-slideDown">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white 
                               focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                               transition-all duration-300"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleNameUpdate}
                      disabled={loading}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 
                               hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 
                               transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <span>✓</span>
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setNewName(user.name);
                      }}
                      className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium 
                               transition-all duration-300 flex items-center gap-2"
                    >
                      <span>✕</span>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center group">
                    <div>
                      <p className="text-xl font-semibold text-white">{user.name}</p>
                      <p className="text-sm text-gray-400 mt-1">Account created: {new Date().toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-2.5 bg-gray-700 hover:bg-blue-500 rounded-xl transition-all duration-300 
                               transform hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/30"
                    >
                      <span className="text-gray-300 group-hover:text-white">✎</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Email Section */}
              <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                <label className="text-sm font-medium text-gray-300 flex items-center mb-3">
                  <span className="mr-2 text-purple-400">📧</span>
                  EMAIL ADDRESS
                </label>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-400 text-xl">📧</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.email}</p>
                      <p className="text-xs text-green-400">Verified ✓</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-700 px-3 py-1.5 rounded-full">
                    Primary
                  </span>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-gray-800/80 rounded-xl p-5 border border-gray-700 hover:border-green-500/50 transition-all duration-300">
                <label className="text-sm font-medium text-gray-300 flex items-center mb-3">
                  <span className="mr-2 text-green-400">🔒</span>
                  SECURITY
                </label>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-green-400 text-xl">🔑</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Password</p>
                      <p className="text-xs text-gray-400">Last changed: Never</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 
                             hover:to-green-700 text-white rounded-xl font-medium transition-all duration-300 
                             transform hover:scale-105 shadow-lg shadow-green-500/30 flex items-center gap-2"
                  >
                    <span>🔒</span>
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
          <div className="bg-gray-800 rounded-2xl w-full max-w-md p-6 relative transform animate-slideUp border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2 text-blue-400">🔒</span>
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-gray-400 text-xl">✕</span>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.old ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white 
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                             transition-all duration-300 pr-12"
                    placeholder="Enter current password"
                  />
                  <button
                    onClick={() => togglePasswordVisibility('old')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.old ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white 
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                             transition-all duration-300 pr-12"
                    placeholder="Enter new password"
                  />
                  <button
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border-2 border-gray-600 rounded-xl text-white 
                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 
                             transition-all duration-300 pr-12"
                    placeholder="Confirm new password"
                  />
                  <button
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl 
                         font-medium transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 
                         hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 
                         transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProfileSection;