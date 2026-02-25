import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Room name is required'],
            trim: true,
            default: 'Study Room',
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        whiteboardObjects: {
            type: Array,
            default: [],
        },
        chatMessages: {
            type: Array,
            default: [],
        },
        codeData: {
            type: String,
            default: '// Start coding here...',
        },
    },
    {
        timestamps: true,
    }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;
