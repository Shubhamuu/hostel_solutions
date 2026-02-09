import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogOut, User, Shield, Menu, X, Home, Settings, Bell, ChevronDown } from "lucide-react";
import { apiprivate } from "../../services/api";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch admin profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiprivate.get("/users/profile");
        setAdmin(res.data.user);
        if(res.data.user.approvalStatus === "REJECTED" || res.data.user.approvalStatus === "PENDING") {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        // Simulate notification count (replace with actual API)
        setNotificationCount(Math.floor(Math.random() * 5));
      } catch (err) {
        console.error("Failed to load profile");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileDropdownOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileDropdownOpen]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await apiprivate.post("/auth/logout");
      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed");
    }
  };

  // Navigation items
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: Home },
    { label: "Hostel", path: "/admin/hostelDetail" },
    { label: "Rooms", path: "/admin/rooms" },
    { label: "Bookings", path: "/admin/bookingDetails" },
    { label: "Students", path: "/admin/students" },
  ];

  if (loading) return (
    <div className="w-full bg-[#0B0D10] border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="w-32 h-6 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="w-32 h-10 bg-gray-800 rounded-xl animate-pulse"></div>
      </div>
    </div>
  );

  return (
    <>
      <nav className="w-full bg-[#0B0D10]/95 backdrop-blur-lg border-b border-gray-800 px-4 sm:px-6 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                <Shield className="text-white" size={22} />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Panel
                </span>
                <p className="text-xs text-gray-400">Hostel Management</p>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200 group"
                >
                  {Icon && <Icon size={16} className="opacity-70 group-hover:opacity-100" />}
                  <span>{item.label}</span>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-amber-500 group-hover:w-8 transition-all duration-300"></div>
                </Link>
              );
            })}
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-gray-800/50 transition-colors group">
              <Bell size={20} className="text-gray-400 group-hover:text-white" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-xs font-bold rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <Link 
              to="/admin/settings"
              className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors group"
            >
              <Settings size={20} className="text-gray-400 group-hover:text-white" />
            </Link>

            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl bg-gray-900/50 hover:bg-gray-800/50 border border-gray-800 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                  <User size={18} className="text-amber-400" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[120px]">
                    {admin?.name || admin?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-xl backdrop-blur-lg overflow-hidden z-50 animate-fadeIn">
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                        <User size={20} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white truncate">
                          {admin?.name || "Administrator"}
                        </p>
                        <p className="text-sm text-gray-400 truncate">{admin?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                            {admin?.user?.approvalStatus || "ACTIVE"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/admin/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/admin/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-gray-800">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-3 w-full px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200 group"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 px-4 py-3 animate-slideDown">
          <div className="flex flex-col gap-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800/50 transition-colors text-gray-300 hover:text-white"
                >
                  {Icon && <Icon size={18} />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Add custom animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AdminNavbar;