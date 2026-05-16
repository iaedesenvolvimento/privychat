import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const configuredApiUrl = import.meta.env.VITE_API_URL;
const sameOriginApiUrl = `${window.location.origin}/api`;
const shouldUseSameOrigin = import.meta.env.PROD && window.location.hostname.endsWith('.onrender.com');

export const api = axios.create({
  baseURL: shouldUseSameOrigin ? sameOriginApiUrl : configuredApiUrl || (import.meta.env.PROD ? sameOriginApiUrl : 'http://localhost:5000/api'),
  withCredentials: true,
  timeout: 8000
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.startsWith('/auth/login') || original?.url?.startsWith('/auth/register') || original?.url?.startsWith('/auth/google-login') || original?.url?.startsWith('/auth/refresh');
    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        useAuthStore.getState().setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logoutLocal();
      }
    }
    return Promise.reject(error);
  }
);
