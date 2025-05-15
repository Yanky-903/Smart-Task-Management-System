import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: 'http://localhost:9090/api', // Replace with your backend URL
});

// Intercept requests to add the JWT token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
