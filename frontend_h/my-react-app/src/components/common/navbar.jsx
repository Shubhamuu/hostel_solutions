import {
  Menu, X, Home, Phone, Utensils, LogIn,
  UserPlus, LogOut, Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

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
    window.location.href = "/";
  };

  const navItems = [
    { text: "Home", to: "/", icon: Home },
    { text: "Rooms", to: "/rooms", icon: Home },
    { text: "Menu", to: "#menu", icon: Utensils },
    { text: "Amenities", to: "#amenities", icon: Shield },
    { text: "Contact", to: "#contact", icon: Phone },
  ];

  const authItems = user
    ? [
        { text: "Dashboard", to: `/${user.role?.toLowerCase()}/dashboard`, icon: Home },
        { text: "Logout", onClick: handleLogout, icon: LogOut },
      ]
    : [
        { text: "Login", to: "/login", icon: LogIn },
        { text: "Register", to: "/register", icon: UserPlus },
      ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B0D10]/90 backdrop-blur-xl border-b border-gray-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-extrabold text-black">
            H
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">
              hostel solutions
            </p>
            {!scrolled && (
              <span className="text-xs text-gray-400">
                select from the best
              </span>
            )}
          </div>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-amber-500 text-black"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.text}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-gray-700 mx-2"></div>

          {authItems.map((item) =>
            item.to ? (
              <Link
                key={item.text}
                to={item.to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-gray-200 transition"
              >
                <item.icon className="w-4 h-4" />
                {item.text}
              </Link>
            ) : (
              <button
                key={item.text}
                onClick={item.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition"
              >
                <item.icon className="w-4 h-4" />
                {item.text}
              </button>
            )
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        } bg-[#0B0D10] border-t border-gray-800`}
      >
        <div className="px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  active
                    ? "bg-amber-500 text-black"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.text}
              </Link>
            );
          })}

          <div className="h-px bg-gray-800 my-2"></div>

          {authItems.map((item) =>
            item.to ? (
              <Link
                key={item.text}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-white text-black"
              >
                <item.icon className="w-5 h-5" />
                {item.text}
              </Link>
            ) : (
              <button
                key={item.text}
                onClick={() => {
                  item.onClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-red-500 text-white"
              >
                <item.icon className="w-5 h-5" />
                {item.text}
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;