import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // If sending FormData, delete Content-Type to let browser set boundary automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  // If testing subdomains locally via query or custom header:
  const activeSubdomain = localStorage.getItem('activeSubdomain');
  if (activeSubdomain) {
    config.headers['x-tenant-subdomain'] = activeSubdomain;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';

    if (error.response?.status === 503 || error.response?.data?.isMaintenance) {
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/superadmin') &&
        !window.location.pathname.startsWith('/login') &&
        window.location.pathname !== '/maintenance'
      ) {
        window.location.href = '/maintenance';
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
