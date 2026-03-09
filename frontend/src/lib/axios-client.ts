import axios from "axios";
import { API_BASE_URL } from "@/utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "알 수 없는 오류가 발생했습니다";

    console.error("[API Error]", error.config?.url, message);
    return Promise.reject(new Error(message));
  },
);

export default api;
