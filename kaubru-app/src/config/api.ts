// For production deployment, use your production domain.
// For local development, use your machine's local IP.
// export const API_BASE_URL = 'https://kaubru-app.onrender.com';
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.3:8000'   // ← replace with your actual local IP from `ipconfig`
  : 'https://kaubru-app.onrender.com';
