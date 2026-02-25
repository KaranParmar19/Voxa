import Room from '../models/Room.js';

export default (io) => {
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.id}`);

        // Join Room
        socket.on('join-room', ({ roomId, user }) => {
            socket.join(roomId);
            console.log(`👤 ${user.name} joined room ${roomId}`);

            // Notify others in room
            socket.to(roomId).emit('user-joined', { ...user, socketId: socket.id });
        });

        // Leave Room - Manual
        socket.on('leave-room', ({ roomId, user }) => {
            socket.leave(roomId);
            console.log(`👋 ${user.name} left room ${roomId}`);
            socket.to(roomId).emit('user-left', { ...user, socketId: socket.id });
        });

        // Handle Disconnect (Tab Close)
        socket.on('disconnecting', () => {
            const rooms = [...socket.rooms];
            rooms.forEach(roomId => {
                socket.to(roomId).emit('user-left', { socketId: socket.id });
            });
        });

        // Handle Drawing
        socket.on('draw-data', async ({ roomId, data }) => {
            // console.log(`🎨 Draw Data from ${socket.id} in ${roomId}`);
            // Broadcast drawing to everyone else in the room
            socket.to(roomId).emit('draw-data', data);

            try {
                if (data.action === 'clear') {
                    await Room.updateOne({ roomId }, { $set: { whiteboardObjects: [] } });
                    return;
                }
                const room = await Room.findOne({ roomId });
                if (room) {
                    const objIndex = room.whiteboardObjects.findIndex(obj => obj.id === data.id);
                    if (objIndex > -1) {
                        // Update existing object
                        await Room.updateOne(
                            { roomId },
                            { $set: { [`whiteboardObjects.${objIndex}`]: data } }
                        );
                    } else {
                        // Add new object
                        await Room.updateOne(
                            { roomId },
                            { $push: { whiteboardObjects: data } }
                        );
                    }
                }
            } catch (error) {
                console.error('Error saving drawing data:', error);
            }
        });

        // Handle Object Deletion
        socket.on('delete-object', async ({ roomId, objectId }) => {
            socket.to(roomId).emit('delete-object', objectId);
            try {
                await Room.updateOne(
                    { roomId },
                    { $pull: { whiteboardObjects: { id: objectId } } }
                );
            } catch (error) {
                console.error('Error deleting object:', error);
            }
        });

        // Handle Clear Canvas
        socket.on('clear-canvas', async ({ roomId }) => {
            console.log(`🧹 Clear Canvas in ${roomId}`);
            socket.to(roomId).emit('clear-canvas');
            try {
                await Room.updateOne({ roomId }, { $set: { whiteboardObjects: [] } });
            } catch (error) {
                console.error('Error clearing canvas:', error);
            }
        });

        // Handle Theme Toggle
        socket.on('toggle-theme', ({ roomId, darkMode }) => {
            // console.log(`🌓 Theme Toggle in ${roomId}: ${darkMode}`);
            socket.to(roomId).emit('toggle-theme', darkMode);
        });

        // Handle Chat Message
        socket.on('chat-message', async ({ roomId, message }) => {
            socket.to(roomId).emit('chat-message', message);
            try {
                await Room.updateOne({ roomId }, { $push: { chatMessages: message } });
            } catch (error) {
                console.error('Error saving chat message:', error);
            }
        });

        // Sync whiteboard zoom/pan across users
        socket.on('viewport-change', ({ roomId, viewport }) => {
            socket.to(roomId).emit('viewport-change', viewport);
        });

        // Sync code editor content across users
        socket.on('code-change', async ({ roomId, code, userName }) => {
            socket.to(roomId).emit('code-change', { code, userName });
            try {
                await Room.updateOne({ roomId }, { $set: { codeData: code } });
            } catch (error) {
                console.error('Error saving code:', error);
            }
        });

        // Sync cursor positions across users
        socket.on('cursor-change', ({ roomId, userName, line, col }) => {
            socket.to(roomId).emit('cursor-change', { userName, line, col });
        });

        // Sync code execution output across users
        socket.on('code-output', ({ roomId, output, running }) => {
            socket.to(roomId).emit('code-output', { output, running });
        });

        // Sync active view (whiteboard/code) across users
        socket.on('view-change', ({ roomId, view }) => {
            socket.to(roomId).emit('view-change', { view });
        });

        // --- WebRTC Signaling ---

        // A peer wants to signal another peer (handshake)
        socket.on("sending-signal", payload => {
            // payload: { userToSignal, callerId, signal }
            io.to(payload.userToSignal).emit('user-joined-signal', {
                signal: payload.signal,
                callerId: payload.callerId,
                user: payload.user // pass caller info
            });
        });

        // A peer answers the signal
        socket.on("returning-signal", payload => {
            // payload: { signal, callerId }
            io.to(payload.callerId).emit('receiving-returned-signal', {
                signal: payload.signal,
                id: socket.id
            });
        });

        // Live Drawing / Cursor Events
        socket.on('interaction-start', ({ roomId, data }) => {
            // data: { x, y, color, width, userId }
            // console.log(`🖊️ Start from ${socket.id}`);
            socket.to(roomId).emit('interaction-start', { ...data, socketId: socket.id });
        });

        socket.on('interaction-update', ({ roomId, data }) => {
            // data: { x, y }
            // console.log(`🖊️ Update from ${socket.id}`);
            socket.to(roomId).emit('interaction-update', { ...data, socketId: socket.id });
        });

        socket.on('interaction-end', ({ roomId }) => {
            // console.log(`🖊️ End from ${socket.id}`);
            socket.to(roomId).emit('interaction-end', { socketId: socket.id });
        });

        // Sync object selections for multiplayer highlighting
        socket.on('selection-change', ({ roomId, objectIds, color, name }) => {
            socket.to(roomId).emit('selection-change', { socketId: socket.id, objectIds, color, name });
        });

        // Sync live cursors (high-frequency)
        socket.on('cursor-move', ({ roomId, data }) => {
            // data: { x, y, user, color }
            socket.to(roomId).volatile.emit('cursor-move', { ...data, socketId: socket.id });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.id}`);
        });
    });
};
