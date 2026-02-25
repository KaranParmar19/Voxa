import express from 'express';
import { createRoom, joinRoom, getRoom, getMyRooms, deleteRoom, deleteAllRooms } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.delete('/all', protect, deleteAllRooms);
router.delete('/:roomId', protect, deleteRoom);
router.get('/:roomId', protect, getRoom);

export default router;
