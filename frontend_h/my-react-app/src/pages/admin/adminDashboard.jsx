import React from "react";
import { Link, useNavigate } from "react-router";
import AdminNavbar from "../../components/common/adminNavbar";
const AdminDashboard = () => {
  const navigate = useNavigate();

  // 🔹 GET USER FROM STORAGE / CONTEXT
  const user = JSON.parse(localStorage.getItem("user"));

  const approvalStatus = user?.approvalStatus; // APPROVED | PENDING | REJECTED

  const isApproved = approvalStatus === "APPROVED";

  const stats = [
    { title: "Total Students", value: "1,254", icon: "👨‍🎓", color: "bg-blue-500" },
    { title: "Total Revenue", value: "$45,230", icon: "💰", color: "bg-green-500" },
    { title: "Occupied Rooms", value: "89/120", icon: "🏠", color: "bg-purple-500" },
    { title: "Pending Fees", value: "42", icon: "⏳", color: "bg-orange-500" },
  ];

  const quickActions = [
    { to: "/admin/fee", icon: "💰", label: "Manage Fees" },
    { to: "/admin/menu", icon: "🍽️", label: "Update Menu" },
    { to: "/admin/rooms", icon: "🏠", label: "Room Management" },
    { to: "/admin/students", icon: "👨‍🎓", label: "View Students" },
   // { to: "/admin/hostel-images", icon: "🖼️", label: "Add Hostel Images" },
    { to: "/admin/bookingDetails", icon: "🏠", label: "Booking Details" },
    {to:"/admin/hostelDetail", icon: "🏠",label:"hostel Details" }
  ];

  return (
    
      
<div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] px-4 py-8 sm:px-6 lg:px-8 text-white">
  <header className="sticky top-0 z-50 w-full">
    <AdminNavbar />
  </header>
  
  <div className="max-w-7xl mx-auto">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>
      <p className="text-gray-400 mt-2">Manage your hostel administration</p>
    </div>

    {/* 🔹 APPROVAL STATUS CARD */}
    <div className="mb-8">
      <div
        className={`rounded-2xl p-6 backdrop-blur-sm border ${
          approvalStatus === "APPROVED"
            ? "bg-gradient-to-r from-green-900/20 to-emerald-900/10 border-green-500/30 shadow-lg shadow-green-500/10"
            : approvalStatus === "PENDING"
            ? "bg-gradient-to-r from-amber-900/20 to-yellow-900/10 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
            : "bg-gradient-to-r from-red-900/20 to-rose-900/10 border-red-500/30 shadow-lg shadow-red-500/10"
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                approvalStatus === "APPROVED" ? "bg-green-500/20" :
                approvalStatus === "PENDING" ? "bg-yellow-500/20" :
                "bg-red-500/20"
              }`}>
                <span className={`text-lg ${
                  approvalStatus === "APPROVED" ? "text-green-400" :
                  approvalStatus === "PENDING" ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {approvalStatus === "APPROVED" ? "✓" :
                   approvalStatus === "PENDING" ? "⏳" : "✗"}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">
                Approval Status
              </h2>
            </div>
            
            <p className="text-gray-300 mb-1">
              Current Status:
            </p>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                approvalStatus === "APPROVED"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : approvalStatus === "PENDING"
                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {approvalStatus}
              </span>
            </div>
          </div>
        </div>

        {approvalStatus === "REJECTED" && (
          <div className="mt-6 pt-6 border-t border-red-500/20">
            <p className="text-gray-300 mb-4">
              Your admin request was rejected. Please re-apply for approval to
              access hostel management features.
            </p>
            <button
              onClick={() => navigate("/admin/reapply")}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:from-red-700 hover:to-rose-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-red-500/25"
            >
              Re-apply for Approval
            </button>
          </div>
        )}

        {approvalStatus === "PENDING" && (
          <div className="mt-6 pt-6 border-t border-yellow-500/20">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full"></div>
              <p className="text-sm">
                Your request is under review. You will be notified once approved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 🔹 BLOCK EVERYTHING IF NOT APPROVED */}
    {!isApproved ? null : (
      <>
        {/* Stats Grid */}
      {/*   <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Quick Actions */}
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <span className="text-sm text-gray-400">{quickActions.length} actions available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className="group relative bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-xl border border-gray-800 p-6 text-center hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                  <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                    {action.label}
                  </div>
                  <div className="mt-2 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                    Click to access
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
</div>
  );
};

export default AdminDashboard;
