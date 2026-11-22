import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (email, password, username) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      username,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  loginWithGoogle: async (idToken) => {
    const response = await api.post("/auth/google", { idToken });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    const data = response.data;
    // if server sends a refreshed token, update storage so subsequent requests use it
    if (data && data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  },

  updateProfile: async (profileData) => {
    const formData = new FormData();

    // Всегда отправляем username, даже если он пустой (для обновления)
    if (profileData.username !== undefined) {
      formData.append("username", profileData.username || "");
    }

    // Всегда отправляем bio, даже если он пустой
    if (profileData.bio !== undefined) {
      formData.append("bio", profileData.bio || "");
    }

    // Отправляем avatarUrl только если нет файла
    if (profileData.avatarUrl && !profileData.avatarFile) {
      formData.append("avatarUrl", profileData.avatarUrl);
    }

    // Отправляем файл если он есть
    if (profileData.avatarFile) {
      formData.append("avatar", profileData.avatarFile);
    }

    // Создаем отдельный экземпляр axios для multipart/form-data
    const token = localStorage.getItem("token");
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get("/auth/settings");
    return response.data;
  },

  updateRecommendations: async (settings) => {
    const response = await api.put("/auth/settings/recommendations", settings);
    return response.data;
  },

  updatePrivacy: async (settings) => {
    const response = await api.put("/auth/settings/privacy", settings);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post("/auth/change-password", { currentPassword, newPassword });
    return response.data;
  },

  changeTwoFactor: async (enabled) => {
    const response = await api.post("/auth/two-factor", { enabled });
    return response.data;
  },

  updateNotifications: async (settings) => {
    const response = await api.put("/auth/settings/notifications", settings);
    return response.data;
  },
};

export default api;
