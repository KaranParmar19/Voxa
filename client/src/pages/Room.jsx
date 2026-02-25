import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getRoom } from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import Whiteboard from '../components/Whiteboard';
import CodeEditor from '../components/CodeEditor';
import Chat from '../components/Chat';
import CommandPalette from '../components/CommandPalette';
import useVoiceChat from '../hooks/useVoiceChat';
import { Mic, MicOff, Copy, Check, LogOut, Users, Crown, Sparkles, PenLine, Code2, Maximize2, Minimize2, PanelRightClose, PanelRightOpen, Share2, Eye, EyeOff } from 'lucide-react';

/* ──────────────────────────────────────────────
   DESIGN TOKENS
   ────────────────────────────────────────────── */
const getTokens = (isDark) => ({
    bg: isDark ? '#06060a' : '#f8f9fa',
    surface: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
    surfaceHover: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    borderHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
    text1: isDark ? 'rgba(255,255,255,0.93)' : 'rgba(0,0,0,0.9)',
    text2: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)',
    text3: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
    text4: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
    accent: '#a78bfa',
    accentDim: 'rgba(139,92,246,0.15)',
    accentBorder: 'rgba(139,92,246,0.2)',
    gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
    r8: '8px', r10: '10px', r12: '12px',
    panelShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
});

/* ──────────────────────────────────────────────
   MAIN ROOM COMPONENT
   ────────────────────────────────────────────── */
const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('whiteboard');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [followingId, setFollowingId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const t = getTokens(isDarkMode);

    const mainPanelRef = useRef(null);
    const notifiedUsersRef = useRef(new Set());

    const { peers, isMuted, toggleMute } = useVoiceChat(roomId, user, socket);

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem(`room-sidebar-width-${roomId}`);
        return saved ? parseInt(saved, 10) : 320;
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        const saved = localStorage.getItem(`room-sidebar-open-${roomId}`);
        return saved !== 'false';
    });
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const toggleFullscreen = () => {
        if (!mainPanelRef.current) return;
        if (!document.fullscreenElement) {
            mainPanelRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
        }
    };

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        localStorage.setItem(`room-sidebar-width-${roomId}`, sidebarWidth);
        localStorage.setItem(`room-sidebar-open-${roomId}`, isSidebarOpen);
    }, [sidebarWidth, isSidebarOpen, roomId]);

    // Command Palette Keyboard Shortcut
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandPaletteOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const handleExecuteCommand = (commandId) => {
        // We broadcast an event on the window object so that child components
        // like Whiteboard can listen for specific command intents natively.
        window.dispatchEvent(new CustomEvent('voxa-command', { detail: { commandId } }));

        // Handle generic/global commands here
        switch (commandId) {
            case 'action-sidebar':
                setIsSidebarOpen(prev => !prev);
                break;
            case 'action-leave':
                navigate('/dashboard');
                break;
            default:
                break;
        }
    };

    /* ── Room data & socket logic ── */
    useEffect(() => {
        const fetchRoom = async () => {
            try { const data = await getRoom(roomId); setRoom(data); }
            catch (err) { setError(err.response?.data?.message || 'Failed to fetch room'); }
            finally { setLoading(false); }
        };
        if (roomId) fetchRoom();
    }, [roomId]);

    useEffect(() => {
        if (!user || !room) return;
        const onUserJoined = (newUser) => {
            if (!notifiedUsersRef.current.has(newUser._id)) {
                notifiedUsersRef.current.add(newUser._id);
                addToast(`👋 ${newUser.name} joined the room`);
            }
            setRoom(prev => {
                if (!prev) return prev;
                if (prev.participants.some(p => p._id === newUser._id)) return prev;
                return { ...prev, participants: [...prev.participants, newUser] };
            });
        };
        const onUserLeft = (data) => {
            setRoom(prev => {
                if (!prev) return prev;
                const p = prev.participants.find(part => part._id === data._id || (data.socketId && part.socketId === data.socketId));
                if (p) {
                    if (notifiedUsersRef.current.has(p._id)) {
                        notifiedUsersRef.current.delete(p._id);
                        addToast(`🏃 ${p.name} left the room`);
                    }
                } else if (data.name && notifiedUsersRef.current.has(data._id)) {
                    notifiedUsersRef.current.delete(data._id);
                    addToast(`🏃 ${data.name} left the room`);
                }
                return { ...prev, participants: prev.participants.filter(part => part._id !== data._id && part.socketId !== data.socketId) };
            });
        };
        const handleConnect = () => {
            setConnectionStatus('connected');
            socket.emit('join-room', { roomId, user });
        };
        const handleDisconnect = () => setConnectionStatus('offline');

        socket.connect();
        if (socket.connected) handleConnect();

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('user-joined', onUserJoined);
        socket.on('user-left', onUserLeft);
        socket.io?.on('reconnect_attempt', () => setConnectionStatus('reconnecting'));

        return () => {
            socket.emit('leave-room', { roomId, user });
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('user-joined', onUserJoined);
            socket.off('user-left', onUserLeft);
            socket.disconnect();
        };
    }, [roomId, user, room?._id]);

    useEffect(() => {
        const handler = (data) => setActiveView(data.view);
        socket.on('view-change', handler);
        return () => socket.off('view-change', handler);
    }, []);

    useEffect(() => {
        const onThemeToggle = (darkMode) => setIsDarkMode(darkMode);
        socket.on('toggle-theme', onThemeToggle);
        return () => socket.off('toggle-theme', onThemeToggle);
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        socket.emit('toggle-theme', { roomId, darkMode: newMode });
    };

    const switchView = (view) => {
        setActiveView(view);
        socket.emit('view-change', { roomId, view });
    };

    /* ═══ LOADING ═══ */
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.3)', animation: 'pulse 2s ease-in-out infinite' }}>
                        <Sparkles size={20} color="white" />
                    </div>
                    <p style={{ fontSize: '13px', color: t.text3, animation: 'pulse 2s ease-in-out infinite' }}>Loading room...</p>
                </div>
            </div>
        );
    }

    /* ═══ ERROR ═══ */
    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
                <div style={{ maxWidth: '380px', textAlign: 'center', padding: '40px', borderRadius: '16px', border: `1px solid ${t.border}`, backgroundColor: t.surface }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>😕</div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>Oops!</h2>
                    <p style={{ fontSize: '14px', color: t.text3, marginBottom: '24px' }}>{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '12px 24px', borderRadius: t.r10, border: 'none', background: t.gradient, color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    /* ═══ MAIN ROOM ═══ */
    return (
        <div
            ref={mainPanelRef}
            style={{ position: 'fixed', inset: 0, overflow: 'hidden', color: t.text1, display: 'flex', backgroundColor: t.bg }}
        >

            {/* ═══════════════ CANVAS LAYER (Z-INDEX 0) ═══════════════ */}
            <div
                style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    right: isSidebarOpen && !isFullscreen && !isMobile ? `${sidebarWidth}px` : 0,
                    transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                <div style={{ display: activeView === 'whiteboard' ? 'block' : 'none', width: '100%', height: '100%' }}>
                    <Whiteboard roomId={roomId} followingId={followingId} initialData={room} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
                </div>
                <div style={{ display: activeView === 'code' ? 'block' : 'none', width: '100%', height: '100%', padding: '60px 16px 16px 16px', boxSizing: 'border-box' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: t.r12, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                        <CodeEditor roomId={roomId} userName={user?.name} initialData={room} />
                    </div>
                </div>
            </div>

            {/* ═══════════════ TOP NAVIGATION APP SHELL (Z-INDEX 10) ═══════════════ */}
            <header
                style={{
                    position: 'absolute', top: 0, left: 0, right: isSidebarOpen && !isFullscreen && !isMobile ? `${sidebarWidth}px` : 0,
                    height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 16px', pointerEvents: 'none', zIndex: 10,
                    transition: 'right 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
            >
                {/* Left: Project Info & Views - Slid in from Left */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 12px', backgroundColor: t.surface, backdropFilter: 'blur(12px)', borderRadius: t.r10, border: `1px solid ${t.borderHover}`, boxShadow: t.panelShadow }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Sparkles size={14} color="white" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ fontSize: '13px', fontWeight: 600, color: t.text1, lineHeight: 1.2 }}>{room?.name}</h1>
                                <div title={`Status: ${connectionStatus}`} style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    backgroundColor: connectionStatus === 'connected' ? '#4ade80' : connectionStatus === 'reconnecting' ? '#facc15' : '#f87171',
                                    boxShadow: `0 0 8px ${connectionStatus === 'connected' ? 'rgba(74,222,128,0.4)' : connectionStatus === 'reconnecting' ? 'rgba(250,204,21,0.4)' : 'rgba(248,113,113,0.4)'}`
                                }} />
                            </div>
                            <div style={{ fontSize: '11px', color: t.text3 }}>Room: {room?.roomId}</div>
                        </div>
                    </div>

                    {/* View Switcher inline */}
                    <div style={{ display: 'flex', gap: '2px', backgroundColor: t.surface, backdropFilter: 'blur(12px)', padding: '4px', borderRadius: t.r10, border: `1px solid ${t.borderHover}`, boxShadow: t.panelShadow }}>
                        {[
                            { id: 'whiteboard', label: 'Whiteboard', icon: PenLine, activeColor: t.accent, activeBg: t.accentDim },
                            { id: 'code', label: 'Code', icon: Code2, activeColor: '#4ade80', activeBg: 'rgba(34,197,94,0.12)' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => switchView(tab.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                fontSize: '12px', fontWeight: 500, transition: 'all 0.15s',
                                backgroundColor: activeView === tab.id ? tab.activeBg : 'transparent',
                                color: activeView === tab.id ? tab.activeColor : t.text3,
                            }}>
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Collaboration & Actions - Slid in from Right */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto' }}
                >

                    {/* Participants Stack */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4px', backgroundColor: t.surface, backdropFilter: 'blur(12px)', borderRadius: '24px', border: `1px solid ${t.borderHover}`, boxShadow: t.panelShadow }}>
                        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
                            {room?.participants?.slice(0, 4).map((p, idx) => (
                                <img
                                    key={p._id}
                                    src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=7c3aed&color=fff&size=28`}
                                    alt={p.name}
                                    title={p.name}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: `2px solid ${t.bg}`, marginLeft: idx === 0 ? 0 : '-8px',
                                        position: 'relative', zIndex: 10 - idx,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                />
                            ))}
                            {room?.participants?.length > 4 && (
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    backgroundColor: t.surfaceHover, border: `2px solid ${t.bg}`,
                                    marginLeft: '-8px', position: 'relative', zIndex: 5,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 600, color: t.text2
                                }}>
                                    +{room.participants.length - 4}
                                </div>
                            )}
                        </div>
                        <div style={{ width: '1px', height: '16px', backgroundColor: t.border, margin: '0 8px' }} />
                        <button onClick={() => {
                            const link = `${window.location.origin}/room/${roomId}`;
                            navigator.clipboard.writeText(link);
                            addToast('Invite link copied!');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            backgroundColor: t.accent, color: 'white', fontWeight: 600, fontSize: '12px',
                            boxShadow: `0 4px 12px ${t.accentDim}`, transition: 'background-color 0.15s',
                        }} className="invite-btn">
                            <Copy size={13} />
                            Invite
                        </button>
                    </div>

                    {/* Window Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: t.surface, backdropFilter: 'blur(12px)', padding: '4px', borderRadius: t.r10, border: `1px solid ${t.borderHover}`, boxShadow: t.panelShadow }}>
                        {/* Mic */}
                        <button onClick={toggleMute} className={`icon-btn ${isMuted ? 'mic-muted' : 'mic-live'}`} title={isMuted ? "Unmute" : "Mute"}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: t.r8, cursor: 'pointer', border: 'none', transition: 'all 0.15s' }}>
                            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>

                        <div style={{ width: '1px', height: '16px', backgroundColor: t.border, margin: '0 2px' }} />

                        {/* Fullscreen toggle */}
                        <button onClick={toggleFullscreen} className="icon-btn" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                            style={{ width: '32px', height: '32px', borderRadius: t.r8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', color: t.text3, transition: 'all 0.15s' }}>
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>

                        <div style={{ width: '1px', height: '16px', backgroundColor: t.border, margin: '0 2px' }} />

                        {/* Toggle Sidebar */}
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="icon-btn" title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                            style={{ width: '32px', height: '32px', borderRadius: t.r8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSidebarOpen ? t.surfaceHover : 'transparent', color: isSidebarOpen ? t.text1 : t.text3, transition: 'all 0.15s' }}>
                            {isSidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
                        </button>

                        {followingId && (
                            <>
                                <div style={{ width: '1px', height: '16px', backgroundColor: t.border, margin: '0 2px' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: t.r10, backgroundColor: 'rgba(56,189,248,0.1)', border: `1px solid rgba(56,189,248,0.2)` }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8', animation: 'pulse 2s infinite' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8' }}>
                                        Following {room?.participants?.find(p => p._id === followingId)?.name}
                                    </span>
                                    <button onClick={() => setFollowingId(null)} title="Stop Following" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2c2c2', padding: 0, marginLeft: '4px', display: 'flex', alignItems: 'center' }}>
                                        <EyeOff size={12} />
                                    </button>
                                </div>
                            </>
                        )}

                        <div style={{ width: '1px', height: '16px', backgroundColor: t.border, margin: '0 2px' }} />

                        {/* Leave */}
                        <button onClick={() => navigate('/dashboard')} className="leave-btn" title="Leave Room"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: t.r8, cursor: 'pointer', border: 'none', color: t.text3, backgroundColor: 'transparent', transition: 'all 0.15s' }}>
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </header>


            {/* ═══════════════ RESIZABLE SIDEBAR (Z-INDEX 20/40) ═══════════════ */}
            {(!isFullscreen) && (
                <>
                    {/* Mobile backdrop overlay */}
                    {isMobile && isSidebarOpen && (
                        <div
                            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 35, backdropFilter: 'blur(2px)' }}
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}
                    <div
                        style={{
                            position: isMobile ? 'fixed' : 'absolute', top: 0, right: 0, bottom: 0,
                            width: isSidebarOpen ? (isMobile ? '85%' : `${sidebarWidth}px`) : '0px',
                            maxWidth: isMobile ? '400px' : 'none',
                            borderLeft: isSidebarOpen ? `1px solid ${t.border}` : 'none',
                            backgroundColor: t.bg, zIndex: isMobile ? 40 : 20,
                            display: 'flex', flexDirection: 'column',
                            transition: isSidebarOpen ? (isMobile ? 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' : 'none') : 'width 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s cubic-bezier(0.16,1,0.3,1)',
                            transform: (isMobile && !isSidebarOpen) ? 'translateX(100%)' : 'translateX(0)',
                            overflow: 'hidden',
                        }}
                    >
                        {isSidebarOpen && (
                            <>
                                {/* Resize handle (only on desktop) */}
                                {!isMobile && (
                                    <div
                                        style={{ position: 'absolute', top: 0, bottom: 0, left: '-4px', width: '8px', cursor: 'col-resize', zIndex: 30 }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const startX = e.clientX;
                                            const startWidth = sidebarWidth;
                                            const onMouseMove = (moveEvent) => {
                                                const deltaX = startX - moveEvent.clientX;
                                                setSidebarWidth(Math.max(260, Math.min(500, startWidth + deltaX)));
                                            };
                                            const onMouseUp = () => {
                                                document.removeEventListener('mousemove', onMouseMove);
                                                document.removeEventListener('mouseup', onMouseUp);
                                            };
                                            document.addEventListener('mousemove', onMouseMove);
                                            document.addEventListener('mouseup', onMouseUp);
                                        }}
                                        onDoubleClick={() => setSidebarWidth(320)}
                                    />
                                )}

                                {/* ── CHAT PANEL ── */}
                                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <Chat roomId={roomId} user={user} initialData={room} isDarkMode={isDarkMode} t={t} />
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════════ TOAST NOTIFICATIONS (Z-INDEX 50) ═══════════════ */}
            <div style={{
                position: 'fixed', bottom: '24px', left: '24px', zIndex: 50,
                display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        padding: '10px 16px', borderRadius: t.r10, backgroundColor: t.surface,
                        border: `1px solid ${t.borderHover}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(24px)', color: t.text1, fontSize: '13px', fontWeight: 500,
                        animation: 'toast-slide 0.3s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'auto',
                    }}>
                        {toast.message}
                    </div>
                ))}
            </div>

            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onExecute={handleExecuteCommand}
            />

            {/* Audio Streams */}
            {
                peers.map((peerObj) => (
                    <Audio key={peerObj.peerID} peer={peerObj.peer} />
                ))
            }

            {/* ═══ CSS ═══ */}
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
                @keyframes toast-slide { from { opacity: 0; transform: translateY(16px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                button:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
                .mic-muted { color: #f87171 !important; }
                .mic-muted:hover { background-color: rgba(239,68,68,0.12) !important; }
                .mic-live { color: #4ade80 !important; }
                .mic-live:hover { background-color: rgba(34,197,94,0.12) !important; }
                .icon-btn:hover { background-color: ${t.surfaceHover} !important; color: ${t.text1} !important; }
                .leave-btn:hover { color: #f87171 !important; background-color: rgba(239,68,68,0.12) !important; }
                .btn-primary:hover { box-shadow: 0 8px 24px rgba(124,58,237,0.35) !important; transform: translateY(-1px); }
            `}</style>
        </div>
    );
};

const Audio = ({ peer }) => {
    const audioRef = useRef();
    useEffect(() => {
        peer.on("stream", stream => {
            if (audioRef.current) audioRef.current.srcObject = stream;
        });
    }, [peer]);
    return <audio ref={audioRef} autoPlay playsInline controls={false} />;
};

export default Room;
