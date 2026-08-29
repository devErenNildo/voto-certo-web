import axios from 'axios';

// Vite handles the proxy in dev mode to avoid CORS, so we can use relative paths or '/api'
const api = axios.create({
  // Pega a URL da variável de ambiente VITE_API_URL. 
  // Se não existir, usa string vazia (mantendo o comportamento relativo atual para dev)
  baseURL: import.meta.env.VITE_API_URL || '', 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Optional: handle unauthorized access globally, like clearing token and redirecting
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
