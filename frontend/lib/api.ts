import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error?.response?.data?.detail || error.message;
    console.error("[API Error]", msg);
    return Promise.reject(error);
  }
);

export default api;
