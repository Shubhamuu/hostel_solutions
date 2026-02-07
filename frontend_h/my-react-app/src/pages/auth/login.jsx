import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Home,
  Shield
} from "lucide-react";
import { apiprivate } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiprivate.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      console.log("Login response:", res);

      const data = res.data;

      // Store tokens
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      const { role, roomId } = data.user;
      console.log("User role:", role);

      let targetPath = "/";

      // Check if there's a redirect location in state
      if (location.state?.from) {
        targetPath = location.state.from;
        // Preserve other state params if needed (like roomId for booking)
        if (location.state?.roomId) {
          // If we are redirecting to booking, we might need to pass the state again 
          // BUT navigate(path, { state }) works differently. 
          // The "from" was the path. The state needs to be passed to the *next* route.
          // However, for simplicity, if we go to /book-room/:id, the component there might fetch details or need state.
          // Let's check how rooms.jsx constructs the redirect.
          // It sends: { from: `/book-room/${id}`, roomId, roomNumber }
          // So if we just navigate to `from`, we might lose roomId/roomNumber if the target page expects them in location.state.
          // The target page is BookRoom.

          navigate(targetPath, { state: { roomId: location.state.roomId, roomNumber: location.state.roomNumber } });
          return;
        }
      } else {
        switch (role) {
          case "ADMIN":
            targetPath = "/admin/dashboard";
            break;
          case "SUPERADMIN":
            targetPath = "/superadmin/dashboard";
            break;
          case "STUDENT":
            targetPath = roomId ? "/student/dashboard" : "/";
            break;
          default:
            targetPath = "/";
        }
      }

      navigate(targetPath);

    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err.response) {
        // Server responded with a status code outside the 2xx range
        const status = err.response.status;
        const msg = err.response.data?.message;

        switch (status) {
          case 400:
            errorMessage = msg || "Invalid email or password.";
            break;
          case 401:
            errorMessage = "Unauthorized access. Please check your credentials.";
            break;
          case 403:
            errorMessage = "Access denied. Your account may trigger a security alert.";
            break;
          case 404:
            errorMessage = "User not found. Please sign up.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = msg || `Error (${status}): Unable to login.`;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else {
        // Something happened in setting up the request
        errorMessage = err.message || "Unable to initiate login.";
      }

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
  <div className="w-full max-w-md">

    {/* Logo and Title */}
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
        <Home className="text-black" size={36} />
      </div>
      <h1 className="text-3xl font-bold text-amber-400">
        Hostel Management
      </h1>
      <p className="text-gray-400">
        Welcome back! Please login to continue
      </p>
    </div>

    {/* Login Card */}
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-slate-700">

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-xl">
          <div className="flex items-center text-red-400">
            <Shield size={18} className="mr-2" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              placeholder="student@hostel.edu"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-400">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-amber-400 hover:text-amber-300 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-gray-500
                         focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-amber-400"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500
                     hover:from-amber-600 hover:to-orange-600
                     text-black font-semibold py-3.5 rounded-xl shadow-lg
                     hover:shadow-amber-500/30 transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-3 h-5 w-5" />
              Signing in...
            </span>
          ) : (
            "Login to Hostel Portal"
          )}
        </button>
      </form>

      {/* Sign Up */}
      <p className="text-center text-gray-400 mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-amber-400 hover:text-amber-300">
          Sign up here
        </Link>
      </p>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-700 text-center">
        <p className="text-gray-400 text-sm">
          Need help?{" "}
          <Link to="/support" className="font-medium text-amber-400 hover:text-amber-300">
            Contact Hostel Support
          </Link>
        </p>
        <p className="text-gray-500 text-xs mt-2">
          © {new Date().getFullYear()} Hostel Management System
        </p>
      </div>
    </div>
  </div>

  {/* Decorative Blobs */}
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl"></div>
  </div>
</div>

  );
}