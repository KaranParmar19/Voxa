import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import socket from '../services/socket';

const Chat = ({ roomId, user, initialData, isDarkMode, t }) => {
    const [messages, setMessages] = useState(initialData?.chatMessages || []);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        if (!socket) return;
        const handleMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };
        socket.on('chat-message', handleMessage);
        return () => { socket.off('chat-message', handleMessage); };
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const messageData = {
            _id: Date.now().toString(),
            text: newMessage.trim(),
            user: user?.name || 'Anonymous',
            senderId: user?._id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: false,
        };
        setMessages((prev) => [...prev, messageData]);
        socket.emit('chat-message', { roomId, message: messageData });
        setNewMessage('');
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            backgroundColor: t.surface, border: `1px solid ${t.border}`,
            borderRadius: '12px', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: `1px solid ${t.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare style={{ width: '14px', height: '14px', color: '#a78bfa' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: t.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Chat
                    </span>
                </div>
                <span style={{ fontSize: '10px', color: t.text4, fontWeight: 500, backgroundColor: t.surfaceHover, padding: '2px 6px', borderRadius: '10px' }}>
                    {messages.length}
                </span>
            </div>

            {/* Messages */}
            <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            backgroundColor: t.surface, border: `1px solid ${t.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isDarkMode ? 'inset 0 2px 10px rgba(0,0,0,0.2)' : 'inset 0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <MessageSquare style={{ width: '20px', height: '20px', color: t.text3 }} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: t.text3, fontWeight: 500 }}>No messages yet</p>
                            <p style={{ margin: 0, fontSize: '11px', color: t.text4 }}>Say hello to the room!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === user?._id;
                        return (
                            <div key={msg._id} style={{ display: 'flex', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 600, color: 'white',
                                    background: isMe ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                                    border: isMe ? 'none' : `1px solid ${t.border}`,
                                    marginTop: '2px', boxShadow: isMe ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                                }}>
                                    {msg.user.charAt(0).toUpperCase()}
                                </div>

                                {/* Message Content Container */}
                                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '75%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                    {/* Name + time */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px', padding: '0 4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: t.text2 }}>{msg.user}</span>
                                        <span style={{ fontSize: '9px', fontWeight: 500, color: t.text4 }}>{msg.timestamp}</span>
                                    </div>
                                    {/* Bubble */}
                                    <div style={{
                                        padding: '10px 14px', fontSize: '13px', lineHeight: 1.5,
                                        borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                        background: isMe ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.25))' : t.surfaceHover,
                                        border: isMe ? '1px solid rgba(124,58,237,0.3)' : `1px solid ${t.borderHover}`,
                                        color: isMe ? (isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.95)') : t.text1,
                                        wordBreak: 'break-word',
                                        boxShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.03)'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                            flex: 1, padding: '10px 14px', fontSize: '13px',
                            color: t.text1, backgroundColor: t.surface,
                            border: `1px solid ${t.border}`, borderRadius: '10px',
                            outline: 'none', transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
                        onBlur={e => e.target.style.borderColor = t.border}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                            width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: newMessage.trim() ? 'pointer' : 'default',
                            background: newMessage.trim() ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.04)',
                            color: newMessage.trim() ? 'white' : 'rgba(255,255,255,0.15)',
                            boxShadow: newMessage.trim() ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                        }}
                    >
                        <Send style={{ width: '14px', height: '14px' }} strokeWidth={2.5} />
                    </button>
                </div>
            </form>

            <style>{`
                input::placeholder { color: rgba(255,255,255,0.15); }
                .chat-scroll::-webkit-scrollbar { width: 6px; }
                .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default Chat;
