import axios from 'axios';
import { startLoading, stopLoading } from '../services/loadingService';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
});

api.interceptors.request.use(
    (config) => {
        startLoading();

        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        stopLoading();
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => {
        stopLoading();
        return response;
    },
    (error) => {
        stopLoading();

        if (error.response?.status === 401) {
            localStorage.clear();

            if (location.pathname !== '/login') {
                location.href = '/login';
            }
        }

        return Promise.reject(error);
    },
);
