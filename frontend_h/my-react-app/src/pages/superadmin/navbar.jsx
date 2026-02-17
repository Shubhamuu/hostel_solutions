import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { FiHome, FiUsers, FiLogOut, FiUser, FiDollarSign } from 'react-icons/fi';

const SuperAdminSimpleNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/superadmin/dashboard" className="flex items-center">
              <span className="text-xl font-bold">SuperAdmin</span>
              <span className="ml-2 px-2 py-1 bg-red-600 text-xs rounded-full">Panel</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/superadmin/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                ${isActive('/superadmin/dashboard')
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              to="/superadmin/alluser"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                ${isActive('/superadmin/alluser')
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-2">
                <FiUsers />
                <span>All Users</span>
              </div>
            </Link>

            <Link
              to="/superadmin/allhostel"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                ${isActive('/superadmin/allhostel')
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>All Hostels</span>
              </div>
            </Link>

            <Link
              to="/superadmin/allfees"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150
                ${isActive('/superadmin/allfees')
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-2">
                <FiDollarSign />
                <span>All Fees</span>
              </div>
            </Link>
          </div>

          {/* User menu and Logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4" />
                </div>
                <span className="text-sm">{user.name || 'Super Admin'}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors duration-150"
              >
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/superadmin/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/superadmin/dashboard')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              to="/superadmin/alluser"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/superadmin/alluser')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FiUsers />
                <span>All Users</span>
              </div>
            </Link>

            <Link
              to="/superadmin/allhostel"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/superadmin/allhostel')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FiHome />
                <span>All Hostels</span>
              </div>
            </Link>

            <Link
              to="/superadmin/allfees"
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/superadmin/allfees')
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center space-x-2">
                <FiDollarSign />
                <span>All Fees</span>
              </div>
            </Link>

            <div className="border-t border-gray-700 pt-4 pb-3">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.name || 'Super Admin'}</div>
                  <div className="text-sm font-medium text-gray-400">{user.email || 'admin@example.com'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-3 w-full flex items-center px-3 py-2 text-base font-medium text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-md"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default SuperAdminSimpleNavbar;