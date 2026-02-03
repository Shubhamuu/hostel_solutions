import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api";

/* -------------------- PUBLIC AXIOS INSTANCE -------------------- */
/* Used for login, refresh token, public routes */
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // ✅ CRITICAL: Sends cookies with every request
});

export default api;

/* -------------------- PRIVATE AXIOS INSTANCE -------------------- */
/* Used for protected routes */
export const apiprivate = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // ✅ CRITICAL: Sends cookies with every request
});

/* -------------------- REFRESH LOGIC -------------------- */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const handleLogout = () => {
  // Clear storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  
  // Clear axios headers
  delete apiprivate.defaults.headers.common.Authorization;
  
  // Emit custom event for app-wide handling
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  // Fallback to hard redirect if event not handled
  setTimeout(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
      window.location.href = "/login";
    }
  }, 100);
};

/* -------------------- REQUEST INTERCEPTOR -------------------- */

apiprivate.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* -------------------- RESPONSE INTERCEPTOR -------------------- */

apiprivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const isAuthError = 
      error.response?.status === 401 || 
      error.response?.status === 403;
    
    const isAuthEndpoint = 
      originalRequest.url?.includes("/login") || 
      originalRequest.url?.includes("/auth/access-token") ||
      originalRequest.url?.includes("/auth/refresh");

    // Only attempt refresh for auth errors on non-auth endpoints
    if (isAuthError && !originalRequest._retry && !isAuthEndpoint) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiprivate(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        /* 
          ✅ REFRESH TOKEN AUTOMATICALLY SENT VIA COOKIE 
          Backend reads: req.cookies.refreshToken
        */
        const response = await api.get("/auth/access-token");
        const { accessToken } = response.data;

        if (!accessToken) {
          throw new Error("No access token received from refresh");
        }

        /* ✅ UPDATE HEADERS FIRST */
        apiprivate.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        /* ✅ SAVE NEW ACCESS TOKEN */
        localStorage.setItem("accessToken", accessToken);

        /* ✅ PROCESS QUEUED REQUESTS */
        processQueue(null, accessToken);

        /* ✅ RETRY ORIGINAL REQUEST */
        return apiprivate(originalRequest);

      } catch (err) {
        console.error("Token refresh failed:", err.response?.data?.message || err.message);
        
        /* ❌ PROCESS QUEUE WITH ERROR */
        processQueue(err, null);

        /* ❌ LOGOUT USER (clears everything including refresh token cookie) */
        handleLogout();

        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);