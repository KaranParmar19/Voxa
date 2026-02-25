import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

const socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: false, // Wait for manual connection
    transports: ['websocket'],
});

export default socket;
