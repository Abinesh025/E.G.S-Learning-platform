import axios from "axios";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api", // change if your backend URL is different
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // for cookies / auth
});

// Request Interceptor (optional - add token)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // if you store JWT

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (optional - handle errors globally)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Example: handle unauthorized
    if (error.response?.status === 401) {
      console.log("Unauthorized! Redirect to login.");
      // window.location.href = "/login"; (optional)
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;