import { useState, useRef, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle, Loader2, Mail, Lock, User, Shield, ArrowLeft, Building2, MapPin, Upload, X, FileText, Eye, EyeOff, Info, Clipboard, ClipboardCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { apiprivate } from '../../services/api';

// Move RegularInputField OUTSIDE the component to prevent re-creation on every render
const RegularInputField = ({ icon: Icon, error, id, ...props }) => (
  <div>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
      )}
      <input
        id={id}
        className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {error}
      </p>
    )}
  </div>
);

// OTP Input component
const OtpInputField = ({ index, value, onChange, onKeyDown, innerRef }) => (
  <input
    ref={innerRef}
    value={value}
    onChange={(e) => onChange(index, e.target.value)}
    onKeyDown={(e) => onKeyDown(index, e)}
    onFocus={(e) => e.target.select()}
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength="1"
    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
  />
);

export default function Register() {
  const [step, setStep] = useState('register'); // register | verify
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [adminData, setAdminData] = useState({
    hostelName: '',
    hostelLocation: '',
    documents: [],
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const otpRefs = useRef([]);
  const fileInputRef = useRef(null);
  const otpContainerRef = useRef(null);

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  /* ---------------- PASSWORD STRENGTH CALCULATOR ---------------- */
  const passwordStrength = useMemo(() => {
    if (!formData.password) return 0;
    let strength = 0;
    if (formData.password.length >= 6) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/\d/.test(formData.password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) strength += 25;
    return strength;
  }, [formData.password]);

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return { text: 'Strong', color: 'text-green-600 dark:text-green-400' };
    if (passwordStrength >= 50) return { text: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (passwordStrength >= 25) return { text: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Weak', color: 'text-red-600 dark:text-red-400' };
  };

  /* ---------------- OTP TIMER ---------------- */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  /* ---------------- AUTO DISMISS MESSAGE ---------------- */
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, message.type === 'success' ? 3000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  /* ---------------- VALIDATION ---------------- */
  const validateForm = () => {
    const e = {};

    if (!formData.name.trim()) e.name = 'Name is required';
    else if (formData.name.trim().length < 3) e.name = 'Name must be at least 3 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) e.email = 'Invalid email address';

    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 6) e.password = 'Minimum 6 characters';
    else if (passwordStrength < 50) e.password = 'Password too weak';

    if (role === 'ADMIN') {
      if (!adminData.hostelName.trim()) e.hostelName = 'Hostel name is required';
      if (!adminData.hostelLocation.trim()) e.hostelLocation = 'Location is required';
      if (adminData.documents.length === 0) e.documents = 'Upload verification documents';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- HANDLERS ---------------- */
  const handleRegister = async () => {
    setMessage({ type: '', text: '' });
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('email', formData.email.trim().toLowerCase());
      payload.append('password', formData.password);
      payload.append('role', role);

      if (role === 'ADMIN') {
        payload.append('hostelName', adminData.hostelName.trim());
        payload.append('hostelLocation', adminData.hostelLocation.trim());
        adminData.documents.forEach(file => payload.append('verificationDocuments', file));
      }

      const res = await apiprivate.post('/auth/register', payload);
      if (res.status === 200 || res.status === 201) {
        setStep('verify');
        setResendTimer(60);
        setMessage({ type: 'success', text: `Code sent to ${formData.email}` });
        setTimeout(() => otpRefs.current[0]?.focus(), 200);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('').trim();
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter 6-digit code' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiprivate.post('/auth/verify-otp', {
        email: formData.email,
        verificationCode: code
      });

      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: res.data.message || 'Verification successful. Redirecting to login...',
        });
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Invalid code' });
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- OTP INPUT LOGIC WITH PASTE SUPPORT ---------------- */
  const handleOtpChange = (index, value) => {
    // Only allow digits/hexadecimals for OTP inputs
    if (!/^[0-9a-fA-F]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) otpRefs.current[index + 1]?.focus();

    if (index === 5 && value && newOtp.every(d => d !== '')) {
      handleVerifyOtp();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    const digits = pastedData.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);

    if (digits.length === 6) {
      const newOtp = digits.split('');
      setOtp(newOtp);
      // Focus on the last input
      setTimeout(() => {
        otpRefs.current[5]?.focus();
        // Auto-verify if all digits are filled
        if (newOtp.every(d => d !== '')) {
          handleVerifyOtp();
        }
      }, 10);
    }
  };

  const handleCopyOTP = () => {
    const code = otp.join('');
    if (code.length === 6) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ---------------- REGULAR INPUT HANDLERS (FIXED) ---------------- */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Only update errors state if this field actually had an error
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleAdminInputChange = (field, value) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
    
    // Only update errors state if this field actually had an error
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (adminData.documents.length + files.length > 10) {
      setErrors(prev => ({ ...prev, documents: 'Max 10 files allowed' }));
      return;
    }
    setAdminData(prev => ({ ...prev, documents: [...prev.documents, ...files] }));
    setErrors(prev => ({ ...prev, documents: '' }));
  };

  const removeFile = (index) => {
    setAdminData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors">
      {/* Theme Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {darkMode ? '🌞' : '🌙'}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 dark:bg-indigo-500 rounded-2xl mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {step === 'register' ? 'Create Account' : 'Verify Identity'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {step === 'register' ? 'Join our platform today' : 'Enter the verification code sent to your email'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          {step === 'register' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
              className="space-y-6"
            >
              {/* Role Selector */}
              <div>
                
                <div className="grid grid-cols-2 gap-3">
                  {['STUDENT', 'HOSTEL OWNER'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        setErrors({});
                      }}
                      className={`py-3 rounded-lg text-sm font-medium transition-all ${
                        role === r
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields - Using RegularInputField */}
              <RegularInputField
                icon={User}
                id="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />

              <RegularInputField
                icon={Mail}
                id="email"
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
              />

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    type="button"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Password strength: <span className={getPasswordStrengthText().color}>{getPasswordStrengthText().text}</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength >= 75
                            ? 'bg-green-500'
                            : passwordStrength >= 50
                            ? 'bg-blue-500'
                            : passwordStrength >= 25
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Admin Specific Fields */}
              {role === 'ADMIN' && (
                <>
                  <RegularInputField
                    icon={Building2}
                    id="hostelName"
                    type="text"
                    placeholder="Hostel Name"
                    value={adminData.hostelName}
                    onChange={(e) => handleAdminInputChange('hostelName', e.target.value)}
                    error={errors.hostelName}
                  />

                  <RegularInputField
                    icon={MapPin}
                    id="hostelLocation"
                    type="text"
                    placeholder="Hostel Location"
                    value={adminData.hostelLocation}
                    onChange={(e) => handleAdminInputChange('hostelLocation', e.target.value)}
                    error={errors.hostelLocation}
                  />

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-700/50"
                    >
                      <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Click to upload verification documents
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Max 10 files (PDF, DOC, JPG, PNG)
                      </p>
                    </button>

                    {/* Uploaded Files List */}
                    {adminData.documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {adminData.documents.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              type="button"
                            >
                              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.documents && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.documents}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Get Started'
                )}
              </button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          ) : (
            /* OTP Verification Step */
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                  <Mail className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-gray-900 dark:text-white">{formData.email}</span>
                </p>
              </div>

              {/* OTP Input Container with Paste Support */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter verification code
                </label>
                <div
                  ref={otpContainerRef}
                  onPaste={handleOtpPaste}
                  className="flex gap-2 justify-center"
                >
                  {otp.map((digit, i) => (
                    <OtpInputField
                      key={i}
                      index={i}
                      value={digit}
                      onChange={handleOtpChange}
                      onKeyDown={handleOtpKeyDown}
                      innerRef={(el) => (otpRefs.current[i] = el)}
                    />
                  ))}
                </div>

                {/* Paste Button */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.readText().then(text => {
                        const digits = text.replace(/\D/g, '').slice(0, 6);
                        if (digits.length === 6) {
                          const newOtp = digits.split('');
                          setOtp(newOtp);
                          setTimeout(() => otpRefs.current[5]?.focus(), 10);
                        }
                      });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                    type="button"
                  >
                    <Clipboard className="h-4 w-4" />
                    Paste OTP
                  </button>

                  {otp.every(d => d !== '') && (
                    <button
                      onClick={handleCopyOTP}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                      type="button"
                    >
                      {copied ? (
                        <>
                          <ClipboardCheck className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Clipboard className="h-4 w-4" />
                          Copy OTP
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <Info className="h-3 w-3" />
                  Pro tip: You can paste the entire 6-digit code directly
                </p>
              </div>

              {/* Timer and Resend */}
              <div className="space-y-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.some(d => d === '')}
                  className="w-full bg-green-600 dark:bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center text-sm">
                  {resendTimer > 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      Resend code in <span className="font-medium text-gray-900 dark:text-white">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={() => {
                        setResendTimer(60);
                        setMessage({ type: 'success', text: 'New code sent!' });
                      }}
                      disabled={resendLoading}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium disabled:opacity-50"
                    >
                      {resendLoading ? 'Sending...' : 'Resend code'}
                    </button>
                  )}
                </div>
              </div>

              {/* Back to Register */}
              <button
                onClick={() => setStep('register')}
                className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to registration
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}