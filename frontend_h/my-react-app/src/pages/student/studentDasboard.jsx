import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  User, 
  CreditCard, 
  Calendar, 
  LogOut, 
  Home, 
  Bell, 
  Settings,
  ChevronRight,
  GraduationCap,
  Clock
} from "lucide-react";
import { apiprivate } from "../../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Logout function
  const logout = async () => {
    try {
      await apiprivate.post("/auth/logout", {}, { withCredentials: true });
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Fetch user data from API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiprivate.get("/users/me");
        if (res.data && res.data.user){ setUser(res.data.user);}
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // Format enrollment date
  const formatDate = (dateString) => {
    if (!dateString) return "Not Available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  if (!user) return <p className="text-center mt-20">User not found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Student Portal
            </h1>
            <p className="text-gray-600 mt-1">Get your Hostel Details in one place</p>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notifications */}
            <button className="p-2 rounded-full bg-white shadow hover:shadow-md transition-shadow">
              <Bell className="text-gray-600" size={20} />
            </button>
            {/* Settings */}
            <button className="p-2 rounded-full bg-white shadow hover:shadow-md transition-shadow">
              <Settings className="text-gray-600" size={20} />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <User size={18} />
                {user?.name || "Student"}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{user?.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {user?.name || "Student"}! 👋
                </h2>
                <p className="text-indigo-100 mt-1">{user?.email}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{user?.role || "STUDENT"}</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm flex items-center gap-1">
                    <Clock size={14} />
                    {user?.enrollmentDate ? formatDate(user.enrollmentDate) : "Enrolled Recently"}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    ID: {user?.studentId || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fees Card */}
          <Link to="/fee" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full border border-gray-100 group-hover:border-green-200 group-hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CreditCard className="text-green-600" size={24} />
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-green-600 transition-colors" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fees & Payments</h3>
              <p className="text-gray-600 text-sm mb-4">Check fee status, make payments, and view your payment history</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <span>Pay Now</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          {/* My Room Card */}
          <Link to="/myroom" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full border border-gray-100 group-hover:border-blue-200 group-hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Home className="text-blue-600" size={24} />
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">My Room</h3>
              <p className="text-gray-600 text-sm mb-4">View room details, roommates, and hostel facility information</p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <span>View Room</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>

          {/* Booking Card */}
          <Link to="/mybooking" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full border border-gray-100 group-hover:border-green-200 group-hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CreditCard className="text-green-600" size={24} />
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-green-600 transition-colors" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking</h3>
              <p className="text-gray-600 text-sm mb-4">Check booking status, cancel booking, and view your booking history</p>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <span>My Booking</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>

          {/* Menu Card */}
          <Link to="/menu" className="group">
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 h-full border border-gray-100 group-hover:border-yellow-200 group-hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Calendar className="text-yellow-600" size={24} />
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-yellow-600 transition-colors" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu</h3>
              <p className="text-gray-600 text-sm mb-4">Check menu for today and plan your meals accordingly</p>
              <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                <span>View Menu</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© 2024 Student Portal. All rights reserved.</p>
          <p className="mt-1">
            Need help?{" "}
            <a href="mailto:shubhamuprety2073@gmail.com" className="text-indigo-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
