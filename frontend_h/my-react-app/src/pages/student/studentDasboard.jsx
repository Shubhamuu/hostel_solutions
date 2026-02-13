import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import StudentNavBar from "../../components/common/studentNavbar";
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
  Clock,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  BookOpen,
  Utensils,
  MessageSquare,
  Shield,
  Wallet,
  Bookmark,
  TrendingUp,
  FileText,
  HelpCircle,
  Wifi,
  Users,
  Sparkles
} from "lucide-react";
import { apiprivate } from "../../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
        if (res.data && res.data.user){ 
          setUser(res.data.user);
          // Simulate notifications for demo
          setNotifications([
            { id: 1, title: "Fee Payment Due", message: "Your hostel fee is due in 3 days", time: "2 hours ago", read: false, type: "urgent" },
            { id: 2, title: "Room Inspection", message: "Monthly room inspection scheduled for tomorrow", time: "1 day ago", read: true, type: "info" },
            { id: 3, title: "Welcome to Hostel", message: "Get familiar with hostel rules and facilities", time: "2 days ago", read: true, type: "welcome" },
          ]);
        }
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

  // Calculate time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  

  const dashboardCards = [
    {
      title: "Fees & Payments",
      description: "Check fee status, make payments, and view payment history",
      icon: <CreditCard className="w-6 h-6" />,
      link: "/fee",
      color: "green",
      gradient: "from-green-500 to-emerald-600",
      stats: "2 pending"
    },
    {
      title: "My Room",
      description: "View room details, roommates, and hostel facilities",
      icon: <Home className="w-6 h-6" />,
      link: "/myroom",
      color: "blue",
      gradient: "from-blue-500 to-cyan-600",
      stats: "Room 204"
    },
    {
      title: "Booking",
      description: "Check booking status, cancel, and view booking history",
      icon: <Bookmark className="w-6 h-6" />,
      link: "/mybooking",
      color: "indigo",
      gradient: "from-indigo-500 to-purple-600",
      stats: "Active"
    },
   
    
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">User Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">We couldn't retrieve your information. Please try logging in again.</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
    <StudentNavBar/>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Student Portal</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {dashboardCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <div className={`p-2 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/30`}>
                {card.icon}
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{card.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.stats}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Top Navigation */}
       

        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl text-white p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-24 translate-y-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <GraduationCap size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <h2 className="text-2xl md:text-3xl font-bold">
                      Welcome back, {user.name.split(' ')[0]}!
                    </h2>
                  </div>
                  <p className="text-indigo-100 mb-4">{user.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      {user.role || "STUDENT"}
                    </span>
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1.5">
                      <Clock size={14} />
                      {user.enrollmentDate ? formatDate(user.enrollmentDate) : "Enrolled Recently"}
                    </span>
                    {user.studentId && (
                      <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                        ID: {user.studentId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group relative"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 h-full border border-gray-100 dark:border-gray-700 group-hover:border-transparent overflow-hidden">
                {/* Gradient background effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 group-hover:scale-110 transition-transform duration-300`}>
                      {card.icon}
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors transform group-hover:translate-x-1" size={20} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium text-${card.color}-600 dark:text-${card.color}-400`}>
                      {card.stats}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">View</span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity & Notifications */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          

          {/* Quick Links */}
          
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8 border-t border-gray-200 dark:border-gray-800">
          <p className="mb-2">© 2024 Student Portal. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms of Service
            </a>
            <a href="/help" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Help Center
            </a>
            <a href="mailto:shubhamuprety2073@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Contact Support
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            v2.1.0 • Last updated: Today
          </p>
        </div>
      </div>
    </div>
  );
}