// src/api/authApi.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// ── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10_000,
});

// ── Request interceptor: добавляем JWT токен ────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: обновляем токен при 401 ──────────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch {
                // Refresh провалился — выходим
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth API методы ─────────────────────────────────────────────────────────
export const authApi = {
    /**
     * Отправить OTP на номер телефона
     * @param {string} phoneNumber — в формате +79001234567
     */
    sendOtp: (phoneNumber) =>
        api.post('/api/auth/send-otp', { phoneNumber }),

    /**
     * Верифицировать OTP
     * @param {string} phoneNumber
     * @param {string} otpCode
     */
    verifyOtp: (phoneNumber, otpCode) =>
        api.post('/api/auth/verify-otp', { phoneNumber, otpCode }),

    /**
     * Обновить токены
     * @param {string} refreshToken
     */
    refreshToken: (refreshToken) =>
        api.post('/api/auth/refresh', { refreshToken }),
};

export default api;