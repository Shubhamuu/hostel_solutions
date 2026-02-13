import {
  Menu, X, Home, Phone, Building,
  LogIn, UserPlus, LogOut, User, Search,
  Sun, Moon
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState("dark");

  const location = useLocation();
  const navigate = useNavigate();

  /* ---------------- THEME ---------------- */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const activeTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(activeTheme);
    document.documentElement.classList.toggle("dark", activeTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  /* ---------------- USER ---------------- */
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setMobileMenuOpen(false);
  };

  const navItems = [
    { text: "Home", to: "/", icon: Home },
    { text: "View All Hostels", to: "/hostels", icon: Building },
   // { text: "Contact", to: "/contact", icon: Phone },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300
        ${scrolled
          ? "bg-white/95 dark:bg-[#0B0D10]/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-lg"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-extrabold text-black shadow-lg">
            H
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            Hostel Management
          </p>
        </Link>

        {/* SEARCH DESKTOP */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hostels, locations..."
              className="w-full pl-10 pr-4 py-2 rounded-lg
                bg-gray-100 dark:bg-white/5
                text-gray-900 dark:text-white
                border border-gray-300 dark:border-gray-700
                focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </form>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-2">

          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  ${active
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.text}
              </Link>
            );
          })}

          {/* THEME TOGGLE */}
        

          {/* USER MENU */}
          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              >
                <User className="w-4 h-4" />
                {user.name?.split(" ")[0]}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden
                  bg-white dark:bg-[#0B0D10] border border-gray-200 dark:border-gray-800 shadow-2xl">
                  
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                  </div>

                  <Link
                    to={`/${user.role?.toLowerCase()}/dashboard`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm
                      text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm
                      text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold shadow-lg">
                Register
              </Link>
            </>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
