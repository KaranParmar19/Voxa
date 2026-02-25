import axios from 'axios';

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
export const API_URL = `${SERVER_URL}/api`;

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('voxaToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth endpoints
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Room services
export const createRoom = async (name) => {
    const response = await api.post('/rooms/create', { name });
    return response.data;
};

export const joinRoom = async (roomId) => {
    const response = await api.post('/rooms/join', { roomId });
    return response.data;
};

export const getRoom = async (roomId) => {
    const response = await api.get(`/rooms/${roomId}`);
    return response.data;
};

export const getMyRooms = async () => {
    const response = await api.get('/rooms/my-rooms');
    return response.data;
};

export const deleteRoomApi = async (roomId) => {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
};

export const deleteAllRoomsApi = async () => {
    const response = await api.delete('/rooms/all');
    return response.data;
};

// AI services
export const generateDiagram = async (prompt, currentMermaid) => {
    const response = await api.post('/ai/generate', { prompt, currentMermaid });
    return response.data;
};

export default api;
