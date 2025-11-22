import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // This sends the HttpOnly cookie to the backend automatically
});

export default api;