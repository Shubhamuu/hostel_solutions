import React from "react";
import { Link, useNavigate } from "react-router";

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
    { to: "/admin/users", icon: "👨‍🎓", label: "View Students" },
    { to: "/admin/hostel-images", icon: "🖼️", label: "Add Hostel Images" },
    { to: "/admin/bookingDetails", icon: "🏠", label: "Booking Details" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">
        Admin Dashboard
      </h1>

      {/* 🔹 APPROVAL STATUS CARD */}
      <div
        className={`rounded-xl p-6 border-l-8 ${
          approvalStatus === "APPROVED"
            ? "bg-green-50 border-green-500"
            : approvalStatus === "PENDING"
            ? "bg-yellow-50 border-yellow-500"
            : "bg-red-50 border-red-500"
        }`}
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Approval Status
        </h2>

        <p className="text-gray-700">
          Status:{" "}
          <span className="font-bold">
            {approvalStatus}
          </span>
        </p>

        {approvalStatus === "REJECTED" && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              Your admin request was rejected. Please re-apply for approval to
              access hostel management features.
            </p>

            <button
              onClick={() => navigate("/admin/reapply")}
              className="px-6 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
            >
              Re-apply for Approval
            </button>
          </div>
        )}

        {approvalStatus === "PENDING" && (
          <p className="mt-3 text-sm text-gray-600">
            Your request is under review. You will be notified once approved.
          </p>
        )}
      </div>

      {/* 🔹 BLOCK EVERYTHING IF NOT APPROVED */}
      {!isApproved ? null : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.to}
                  className="p-4 rounded-lg bg-gray-50 border hover:border-blue-500 transition text-center hover:shadow-md"
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="font-medium text-gray-700">
                    {action.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
