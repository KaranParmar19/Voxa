import 'dotenv/config'; // Load env vars first!
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import './config/passport.js';

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session & Passport
app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Voxa server is running! 🎓' });
});

import socketHandler from './socket/socketHandler.js';

// ... (imports)

// Socket.IO connection handling
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 Voxa server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
});
