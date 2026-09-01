import axios from 'axios';

// Vite handles the proxy in dev mode to avoid CORS, so we can use relative paths or '/api'
const api = axios.create({
  // Pega a URL da variável de ambiente VITE_API_URL. 
  // Se não existir, usa string vazia (mantendo o comportamento relativo atual para dev)
  baseURL: import.meta.env.VITE_API_URL || "http://31.97.40.96:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401/403 e ainda não tentamos refazer (evita loop infinito)
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject})
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const savedCredentials = localStorage.getItem('credentials');
      
      if (savedCredentials) {
        try {
          const credentials = JSON.parse(savedCredentials);
          
          // Refaz o login chamando a rota de auth do backend
          const res = await axios.post(`${api.defaults.baseURL || ''}/auth/login`, credentials);
          const newToken = res.data.token;
          
          // Salva o novo token
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Processa as requisições que ficaram na fila esperando o token
          processQueue(null, newToken);
          
          // Refaz a requisição original com o novo token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('token');
          localStorage.removeItem('credentials'); // Credenciais inválidas, limpa tudo
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // Se não tem credenciais salvas, desloga o usuário normalmente
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
