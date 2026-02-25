import { useEffect, useState, useRef } from 'react';
import socket from '../services/socket';
import { MousePointer2 } from 'lucide-react';

/* ──────────────────────────────────────────────
   LIVE CURSORS COMPONENT
   ──────────────────────────────────────────────
   Renders remote users' cursors accurately mapped
   to the Fabric.js canvas coordinate system.
*/

export default function LiveCursors({ roomId, viewport }) {
    const [cursors, setCursors] = useState({});
    const timeoutsRef = useRef({});

    useEffect(() => {
        if (!socket) return;

        const handleCursorMove = (data) => {
            const { socketId, x, y, user, color } = data;

            setCursors((prev) => ({
                ...prev,
                [socketId]: { x, y, user, color, lastUpdate: Date.now() },
            }));

            // Auto-remove cursor after 3 seconds of inactivity
            if (timeoutsRef.current[socketId]) {
                clearTimeout(timeoutsRef.current[socketId]);
            }
            timeoutsRef.current[socketId] = setTimeout(() => {
                setCursors((prev) => {
                    const newCursors = { ...prev };
                    delete newCursors[socketId];
                    return newCursors;
                });
            }, 3000);
        };

        const handleUserLeft = (data) => {
            if (data.socketId) {
                setCursors(prev => {
                    const next = { ...prev };
                    delete next[data.socketId];
                    return next;
                });
            }
        };

        socket.on('cursor-move', handleCursorMove);
        socket.on('user-left', handleUserLeft);

        return () => {
            socket.off('cursor-move', handleCursorMove);
            socket.off('user-left', handleUserLeft);
            Object.values(timeoutsRef.current).forEach(clearTimeout);
        };
    }, []);

    return (
        <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden'
        }}>
            {Object.entries(cursors).map(([socketId, cursor]) => {
                if (cursor.x == null || cursor.y == null) return null;

                // Calculate position relative to viewport pan/zoom
                const screenX = (cursor.x * viewport.zoom) + viewport.offsetX;
                const screenY = (cursor.y * viewport.zoom) + viewport.offsetY;

                // Determine if cursor is off-screen
                const padding = 24;
                const w = window.innerWidth;
                const h = window.innerHeight;

                const isOffScreen = screenX < padding || screenX > w - padding || screenY < padding || screenY > h - padding;

                if (isOffScreen) {
                    // Clamp to edge
                    const clampedX = Math.max(padding, Math.min(w - padding, screenX));
                    const clampedY = Math.max(padding, Math.min(h - padding, screenY));

                    const nameInitial = cursor.user?.name ? cursor.user.name.charAt(0).toUpperCase() : '?';

                    return (
                        <div
                            key={socketId}
                            style={{
                                position: 'absolute',
                                left: 0, top: 0,
                                transform: `translate(${clampedX}px, ${clampedY}px)`,
                                transition: 'transform 0.08s linear',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px', height: '32px',
                                borderRadius: '50%',
                                backgroundColor: cursor.color || '#a78bfa',
                                color: '#fff',
                                fontSize: '14px', fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                border: '2px solid rgba(255,255,255,0.8)',
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                zIndex: 5
                            }}
                            title={`Jump to ${cursor.user?.name}`}
                        >
                            {nameInitial}
                        </div>
                    );
                }

                return (
                    <div
                        key={socketId}
                        style={{
                            position: 'absolute',
                            left: 0, top: 0,
                            transform: `translate(${screenX}px, ${screenY}px)`,
                            transition: 'transform 0.08s linear', // highly smooth interpolation
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                        }}
                    >
                        {/* Cursor Icon */}
                        <MousePointer2
                            size={18}
                            fill={cursor.color || '#a78bfa'}
                            color="#ffffff"
                            strokeWidth={1.5}
                            style={{
                                transform: 'rotate(-15deg)',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            }}
                        />
                        {/* Name Badge */}
                        <div style={{
                            marginTop: '2px', marginLeft: '12px',
                            backgroundColor: cursor.color || '#a78bfa',
                            color: '#fff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            borderTopLeftRadius: '2px',
                            fontSize: '11px',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            whiteSpace: 'nowrap',
                            opacity: 0.9,
                        }}>
                            {cursor.user?.name || 'Anonymous'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
