import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

let isRefreshing = false;
let waitQueue = [];

const processQueue = (error, token = null) => {
    waitQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    );
    waitQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    waitQueue.push({ resolve, reject });
                }).then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return api(original);
                });
            }
            original._retry = true;
            isRefreshing = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const { data } = await axios.post('http://localhost:8080/api/auth/refresh', { refreshToken });
                localStorage.setItem('accessToken',  data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                processQueue(null, data.accessToken);
                original.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(original);
            } catch (e) {
                processQueue(e, null);
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(e);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export async function sendOtpRequest(phoneNumber) {
    const { data } = await api.post('/api/auth/send-otp', { phoneNumber });
    return data;
}

export async function verifyOtpRequest(phoneNumber, code) {
    const { data } = await api.post('/api/auth/verify-otp', { phoneNumber, otpCode: code });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
}

export default api;