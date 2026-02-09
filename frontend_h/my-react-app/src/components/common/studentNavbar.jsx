import { NavLink, useNavigate } from "react-router";
import {
  Home,
  Bed,
  ClipboardList,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function StudentNavBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition
     ${
       isActive
         ? "bg-blue-600 text-white"
         : "text-gray-300 hover:bg-gray-800 hover:text-white"
     }`;

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-500">
              Hostel System
            </span>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/student/dashboard" className={linkClass}>
              <Home size={18} />
              Dashboard
            </NavLink>

            <NavLink to="/myroom" className={linkClass}>
              <Bed size={18} />
              My Room
            </NavLink>

            <NavLink to="/mybooking" className={linkClass}>
              <ClipboardList size={18} />
              Booking
            </NavLink>

            <NavLink to="/fee" className={linkClass}>
              <CreditCard size={18} />
              Payments
            </NavLink>

            <NavLink to="/student/profile" className={linkClass}>
              <User size={18} />
              Profile
            </NavLink>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-md
              text-red-400 hover:bg-gray-800 transition"
            >
              <LogOut size={18} />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-300"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <nav className="px-4 py-3 space-y-2">
            <NavLink to="/student/dashboard" className={linkClass} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/student/my-room" className={linkClass} onClick={() => setOpen(false)}>
              My Room
            </NavLink>
            <NavLink to="/student/bookings" className={linkClass} onClick={() => setOpen(false)}>
              Booking
            </NavLink>
            <NavLink to="/student/payments" className={linkClass} onClick={() => setOpen(false)}>
              Payments
            </NavLink>
            <NavLink to="/student/profile" className={linkClass} onClick={() => setOpen(false)}>
              Profile
            </NavLink>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md
              text-red-400 hover:bg-gray-800 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
