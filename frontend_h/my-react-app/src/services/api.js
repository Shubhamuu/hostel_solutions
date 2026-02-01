import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api";

/* -------------------- PUBLIC AXIOS INSTANCE -------------------- */
/* Used for login, refresh token, public routes */
const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // ✅ SEND COOKIES
});

export default api;

/* -------------------- PRIVATE AXIOS INSTANCE -------------------- */
/* Used for protected routes */
export const apiprivate = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true, // ✅ SEND COOKIES
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
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/auth/access-token")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiprivate(originalRequest);
          })
          .catch(Promise.reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        /* ✅ REFRESH TOKEN SENT VIA COOKIE AUTOMATICALLY */
        const response = await api.get("/auth/access-token");

        const { accessToken } = response.data;

        /* ✅ SAVE NEW ACCESS TOKEN */
        localStorage.setItem("accessToken", accessToken);

        /* ✅ UPDATE HEADERS */
        apiprivate.defaults.headers.common.Authorization =
          `Bearer ${accessToken}`;
        originalRequest.headers.Authorization =
          `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return apiprivate(originalRequest);

      }
       catch (err) {
        processQueue(err, null);

        /* ❌ REFRESH FAILED → LOGOUT */
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        window.location.href = "/";
        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);