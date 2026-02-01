import { useState } from "react";
import { Mail, Lock, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import apiPrivate from "../../services/api";
import { Navigate } from "react-router";
const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* 🔹 STEP 1: SEND RESET CODE */
  const sendCode = async () => {
    if (!form.email) return setError("Email is required");

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await apiPrivate.post("/auth/forgot-password", {
        email: form.email,
      });

      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  /* 🔹 STEP 2: RESET PASSWORD */
  const resetPassword = async () => {
    if (!form.code || !form.newPassword)
      return setError("All fields are required");

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await apiPrivate.post("/auth/reset-password", {
        email: form.email,
        code: form.code,
        newPassword: form.newPassword,
      });

      setMessage(res.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0D10] text-white px-4">
      <div className="w-full max-w-md bg-[#1C1F2A] border border-gray-800 rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-2 text-center">
          Forgot Password
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {step === 1 && "Enter your email to receive a reset code"}
          {step === 2 && "Enter the code sent to your email"}
          {step === 3 && "Your password has been reset"}
        </p>

        {/* 🔹 STATUS */}
        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-500/10 p-3 rounded-xl">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 text-sm text-green-400 bg-green-500/10 p-3 rounded-xl">
            {message}
          </p>
        )}

        {/* 🔹 STEP 1 */}
        {step === 1 && (
          <>
            <Input
              icon={Mail}
              placeholder="Email address"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <Button loading={loading} onClick={sendCode}>
              Send Reset Code
            </Button>
          </>
        )}

        {/* 🔹 STEP 2 */}
        {step === 2 && (
          <>
            <Input
              icon={Key}
              placeholder="Reset code"
              name="code"
              value={form.code}
              onChange={handleChange}
            />

            <div className="relative mb-6">
              <Input
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button loading={loading} onClick={resetPassword}>
              Reset Password
            </Button>
          </>
        )}

        {/* 🔹 STEP 3 */}
        {step === 3 && (
          <Navigate to="/login" replace />
        )}
      </div>
    </div>
  );
};

/* 🔹 Reusable Input */
const Input = ({ icon: Icon, ...props }) => (
  <div className="relative mb-6">
    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      {...props}
      className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-gray-700 focus:outline-none focus:border-amber-400"
    />
  </div>
);

/* 🔹 Reusable Button */
const Button = ({ children, loading, ...props }) => (
  <button
    {...props}
    disabled={loading}
    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:scale-105 transition flex items-center justify-center gap-2"
  >
    {loading && <Loader2 className="w-5 h-5 animate-spin" />}
    {children}
  </button>
);

export default ForgotPassword;
