import Room from '../models/Room.js';

// Helper to generate a 6-character random room ID
const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
export const createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        let roomId = generateRoomId();

        // Ensure unique roomId
        let roomExists = await Room.findOne({ roomId });
        while (roomExists) {
            roomId = generateRoomId();
            roomExists = await Room.findOne({ roomId });
        }

        const room = await Room.create({
            roomId,
            name: name || `${req.user.name}'s Room`,
            host: req.user._id,
            participants: [req.user._id], // Host is automatically a participant
        });

        res.status(201).json(room);
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Server error creating room' });
    }
};

// @desc    Join an existing room
// @route   POST /api/rooms/join
// @access  Private
export const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        if (!roomId) {
            return res.status(400).json({ message: 'Room ID is required' });
        }

        const room = await Room.findOne({ roomId: roomId.toUpperCase() });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (!room.isActive) {
            return res.status(400).json({ message: 'This room is no longer active' });
        }

        // Check if user is already in the room
        const isParticipant = room.participants.includes(req.user._id);

        if (!isParticipant) {
            room.participants.push(req.user._id);
            await room.save();
        }

        res.json(room);
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({ message: 'Server error joining room' });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Private
export const getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId })
            .populate('host', 'name email avatar')
            .populate('participants', 'name email avatar');

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Server error fetching room' });
    }
};

// @desc    Get rooms the user has participated in
// @route   GET /api/rooms/my-rooms
// @access  Private
export const getMyRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ participants: req.user._id })
            .populate('host', 'name')
            .populate('participants', 'name email avatar')
            .sort({ updatedAt: -1 })
            .limit(10)
            .select('roomId name host participants updatedAt isActive');

        res.json(rooms);
    } catch (error) {
        console.error('Get my rooms error:', error);
        res.status(500).json({ message: 'Server error fetching rooms' });
    }
};

// @desc    Remove user from a room (delete from recent)
// @route   DELETE /api/rooms/:roomId
// @access  Private
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Remove user from participants
        room.participants = room.participants.filter(
            p => p.toString() !== req.user._id.toString()
        );

        if (room.participants.length === 0) {
            await Room.deleteOne({ _id: room._id });
        } else {
            await room.save();
        }

        res.json({ message: 'Room removed' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Remove user from all rooms (clear history)
// @route   DELETE /api/rooms
// @access  Private
export const deleteAllRooms = async (req, res) => {
    try {
        // Remove user from all participant lists
        await Room.updateMany(
            { participants: req.user._id },
            { $pull: { participants: req.user._id } }
        );
        // Clean up rooms with no participants left
        await Room.deleteMany({ participants: { $size: 0 } });

        res.json({ message: 'All rooms cleared' });
    } catch (error) {
        console.error('Delete all rooms error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
