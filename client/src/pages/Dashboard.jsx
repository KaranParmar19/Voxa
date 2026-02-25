import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  createRoom,
  joinRoom,
  getMyRooms,
  deleteRoomApi,
  deleteAllRoomsApi,
} from "../services/api";
import { useToast } from "../components/Toast";
import {
  Plus,
  LogIn,
  LogOut,
  Users,
  ArrowRight,
  Clock,
  X,
  ChevronDown,
  MousePointer2,
  Activity,
  Zap,
  Sparkles,
  Layout,
  MessageSquare,
  Globe,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "../components/Logo";

/* ──────────────────────────────────────────────
   DESIGN TOKENS - Premium Spatial & Neon System
   ────────────────────────────────────────────── */
const t = {
  bg: "#040406",
  surface: "rgba(255,255,255,0.02)",
  surfaceHover: "rgba(255,255,255,0.04)",
  surfaceActive: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  text1: "rgba(255,255,255,0.95)",
  text2: "rgba(255,255,255,0.65)",
  text3: "rgba(255,255,255,0.4)",
  text4: "rgba(255,255,255,0.2)",
  accent: "#8b5cf6", // Violet
  accentDim: "rgba(139,92,246,0.15)",
  accentBright: "#a78bfa",
  accentIndigo: "#6366f1",
  gradientViolet: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
  gradientIndigo: "linear-gradient(135deg, #6366f1, #818cf8)",
};

const Container = ({ children, style = {}, className = "" }) => (
  <div
    className={className}
    style={{
      width: "100%",
      maxWidth: "1100px",
      marginInline: "auto",
      paddingInline: "clamp(24px, 5vw, 48px)",
      boxSizing: "border-box",
      ...style,
    }}
  >
    {children}
  </div>
);

const AnimatedWhiteboardPreview = ({ isNavigating, user }) => {
  const firstName = user?.name?.split(" ")[0] || "Guest";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Slow Gradient Drifts */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "-20%",
          left: "20%",
          width: "70vw",
          height: "70vh",
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "60vw",
          height: "60vh",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />

      {/* Grid Canvas Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center 30%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center 30%, black 20%, transparent 80%)",
        }}
      />

      {/* Simulated Cursors & Drawings (Speed up when navigating) */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
        <motion.path
          d="M 120 250 Q 200 150 250 300 T 500 200"
          fill="transparent"
          stroke="rgba(117, 55, 225, 0.6)"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: isNavigating ? 1.5 : 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.circle
          cx="80%"
          cy="35%"
          r="80"
          fill="transparent"
          stroke="rgba(99,102,241, 0.4)"
          strokeWidth="2"
          strokeDasharray="12 12"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 270 }}
          transition={{ duration: isNavigating ? 3 : 8, repeat: Infinity, ease: "linear", delay: 3 }}
        />
        <motion.rect
          x="40"
          y="500"
          width="140"
          height="90"
          rx="12"
          fill="rgba(16, 185, 129, 0.05)"
          stroke="rgba(16, 185, 129, 0.4)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: isNavigating ? 1.5 : 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 2 }}
        />

        {/* New Arrow Path (Drawn by User) */}
        <motion.path
          d="M 600 500 Q 700 350 850 450 L 820 440 M 850 450 L 830 470"
          fill="transparent"
          stroke="rgba(244, 63, 94, 0.6)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: isNavigating ? 1.5 : 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1 }}
        />
      </svg>

      {/* ══════ Simulated Collaborative Cursors ══════ */}

      {/* Cursor 1: Alex (drawing the violet wave) */}
      <motion.div
        animate={{
          x: [100, 120, 200, 250, 400, 500, 520],
          y: [270, 250, 180, 300, 200, 200, 220],
          opacity: [0, 1, 1, 1, 1, 1, 0]
        }}
        transition={{ duration: isNavigating ? 1.5 : 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}
      >
        <MousePointer2 size={20} color="#a78bfa" fill="#8b5cf6" style={{ transform: "rotate(-10deg)" }} />
        <div style={{ background: '#8b5cf6', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, position: "absolute", top: "20px", left: "10px", boxShadow: "0 4px 12px rgba(139,92,246,0.3)" }}>{firstName}</div>
      </motion.div>

      {/* Cursor 2: User (drawing the rose arrow) */}
      <motion.div
        animate={{
          x: [580, 600, 750, 850, 820, 850, 830, 850],
          y: [520, 500, 380, 450, 440, 450, 470, 450],
          opacity: [0, 1, 1, 1, 1, 1, 1, 0]
        }}
        transition={{ duration: isNavigating ? 1.5 : 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 1.5 }}
        style={{ position: "absolute", top: 0, left: 0, zIndex: 10, pointerEvents: "none" }}
      >
        <MousePointer2 size={20} color="#fb7185" fill="#f43f5e" style={{ transform: "rotate(-10deg)" }} />
        <div style={{ background: '#f43f5e', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, position: "absolute", top: "20px", left: "10px", boxShadow: "0 4px 12px rgba(244,63,94,0.3)" }}>{firstName}</div>
      </motion.div>

      {/* Cursor 3: Jordan (drawing the green rect) */}

    </div>
  );
};

/* ──────────────────────────────────────────────
   COMPONENT: Interactive Action Card
   ────────────────────────────────────────────── */
const InteractiveCard = ({ children, onClick, disabled, glowColor, className, isActive, isSuccess, loadingText }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current || isActive) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Determine container styles dynamically based on state
  const isActionActive = isActive || isSuccess;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={!isActionActive && !disabled ? onClick : undefined}
      className={className}
      initial={false}
      animate={{
        scale: isActionActive ? 0.98 : isHovered ? 1.015 : 1,
        y: isActionActive ? 2 : isHovered ? -4 : 0,
        borderColor: isSuccess ? "#10b981" : isActive ? glowColor : isHovered ? glowColor + '50' : t.border,
        boxShadow: isSuccess
          ? "0 0 60px rgba(16, 185, 129, 0.4)"
          : isActive
            ? `0 0 40px ${glowColor}40`
            : isHovered
              ? `0 24px 48px -12px ${glowColor}30, inset 0 1px 1px rgba(255,255,255,0.1)`
              : "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.02)",
        zIndex: isActionActive ? 50 : 1
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "relative",
        width: "100%",
        textAlign: "left",
        borderRadius: "24px",
        padding: "32px",
        backgroundColor: t.surface,
        border: `1px solid ${t.border}`,
        cursor: isActionActive || disabled ? "default" : "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: "260px",
        overflow: "hidden"
      }}
    >
      <AnimatePresence>
        {(isHovered || isActionActive) && !isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              top: isActionActive ? "50%" : mousePosition.y,
              left: isActionActive ? "50%" : mousePosition.x,
              width: isActionActive ? "200%" : "300px",
              height: isActionActive ? "200%" : "300px",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, ${glowColor}${isActionActive ? '30' : '25'} 0%, transparent ${isActionActive ? '70%' : '60%'})`,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 0,
              filter: "blur(24px)",
              transition: "width 0.6s, height 0.6s, top 0.6s, left 0.6s"
            }}
          />
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "200%",
              height: "200%",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)`,
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 0,
              filter: "blur(40px)",
            }}
          />
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
        <AnimatePresence mode="wait">
          {!isActionActive ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "24px",
                padding: "20px"
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "24px",
                  background: isSuccess ? "rgba(16, 185, 129, 0.1)" : `${glowColor}15`,
                  border: `1px solid ${isSuccess ? "rgba(16, 185, 129, 0.3)" : glowColor + '30'}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 16px 32px ${isSuccess ? "rgba(16, 185, 129, 0.2)" : glowColor + '20'}`,
                }}
              >
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div key="success" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <CheckCircle2 size={40} color="#10b981" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div key="loading" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      <Loader2 size={40} color={glowColor} strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontSize: "20px", fontWeight: 800, color: t.text1 }}>
                  {isSuccess ? "Success" : loadingText}
                </span>
                {!isSuccess && (
                  <span style={{ fontSize: "14px", color: t.text3, fontWeight: 500 }}>
                    Preparing your environment securely
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/* ──────────────────────────────────────────────
   COMPONENT: Dashboard Main
   ────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [isJoiningParam, setIsJoiningParam] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentRooms, setRecentRooms] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Interaction States
  const [isCreating, setIsCreating] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);
  const [activeProcessSuccess, setActiveProcessSuccess] = useState(false);

  // Animation Variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const mountVariant = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };
  const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const isNavigating = isCreating || isJoiningSession;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getMyRooms().then(setRecentRooms).catch(() => { });
  }, []);

  const greeting = (() => {
    const h = currentTime.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const timeString = currentTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const dateString = currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const firstName = user?.name?.split(" ")[0] || "there";

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError("");

      const room = await createRoom();

      setActiveProcessSuccess(true);
      setTimeout(() => {
        navigate(`/room/${room.roomId}`);
      }, 700); // Wait for success morph / zoom

    } catch (err) {
      setIsCreating(false);
      toast.error("Failed to create room");
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    try {
      setIsJoiningSession(true);
      setError("");

      const room = await joinRoom(roomCode);

      setActiveProcessSuccess(true);
      setTimeout(() => {
        navigate(`/room/${room.roomId}`);
      }, 700);

    } catch (err) {
      const msg = err.response?.data?.message || "Failed to join room";
      setError(msg);
      toast.error(msg);
      setIsJoiningSession(false);
    }
  };

  const handleDeleteRoom = async (e, roomId) => {
    e.stopPropagation();
    try {
      await deleteRoomApi(roomId);
      setRecentRooms((prev) => prev.filter((r) => r.roomId !== roomId));
      toast.success("Room removed");
    } catch {
      toast.error("Failed to remove room");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllRoomsApi();
      setRecentRooms([]);
      toast.success("All rooms cleared");
    } catch {
      toast.error("Failed to clear rooms");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: t.bg,
        color: t.text1,
        overflowX: "hidden",
      }}
    >
      <AnimatedWhiteboardPreview isNavigating={isNavigating} user={user} />

      {/* Main page content wrapper for transition zoom */}
      <motion.div
        animate={{
          scale: isNavigating ? 0.94 : 1,
          opacity: isNavigating ? 0 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", minHeight: "100vh" }}
      >
        {/* ═══════════════ NAVBAR ═══════════════ */}
        <motion.header
          animate={{
            opacity: isNavigating ? 0.3 : 1,
            y: isNavigating ? -20 : 0
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            width: "100%",
            backgroundColor: "rgba(4, 4, 6, 0.6)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderBottom: `1px solid ${t.border}`,
            pointerEvents: isNavigating ? "none" : "auto"
          }}
        >
          <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Logo style={{ height: "32px", width: "auto" }} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <motion.button
                  whileHover={{ backgroundColor: t.surfaceHover, borderColor: t.borderHover }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 14px 6px 6px", borderRadius: "99px", border: `1px solid ${showDropdown ? t.borderHover : t.border}`, backgroundColor: showDropdown ? t.surfaceHover : t.surface, cursor: "pointer", outline: "none", transition: "all 0.2s" }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=8b5cf6&color=fff&size=36`}
                      alt={user?.name}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", border: `2px solid ${t.bg}` }}
                    />
                    <div style={{ position: "absolute", bottom: "0px", right: "0px", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981", border: `2px solid ${t.bg}` }} />
                  </div>
                  <span className="hidden sm:block" style={{ fontSize: "14px", fontWeight: 600, color: t.text2 }}>{user?.name}</span>
                  <ChevronDown size={14} color={t.text3} style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)" }} />
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, width: "220px", backgroundColor: "rgba(10,10,14,0.95)", backdropFilter: "blur(20px)", border: `1px solid ${t.borderHover}`, borderRadius: "16px", boxShadow: "0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", padding: "8px", transformOrigin: "top right", zIndex: 50 }}
                    >
                      <div style={{ padding: "12px", marginBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: t.text1, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
                        <div style={{ fontSize: "12px", color: t.text3, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
                      </div>
                      <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: "none", background: "transparent", color: "#f87171", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.1)"; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                        <LogOut size={16} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Container>
        </motion.header>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main style={{ position: "relative", zIndex: 10, width: "100%" }}>
          <Container>
            {/* Dim the entire content slightly during navigation, excluding the active card via z-index stack handling implicitly done by the card expanding */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              style={{ paddingBottom: "120px" }}
            >

              {/* ── Welcome Header ── */}
              <motion.div
                variants={mountVariant}
                animate={{
                  opacity: isNavigating ? 0.3 : 1,
                  scale: isNavigating ? 0.98 : 1,
                  filter: isNavigating ? "blur(4px)" : "blur(0px)"
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ paddingTop: "80px", paddingBottom: "60px", pointerEvents: isNavigating ? "none" : "auto" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <Clock size={14} color={t.accentBright} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: t.accentBright, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    {dateString} · {timeString}
                  </span>
                </div>
                <h1 style={{ fontSize: "clamp(48px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
                  <span style={{ color: t.text1 }}>{greeting}, </span><br />
                  <span style={{ background: t.gradientViolet, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", paddingRight: "10px" }}>{firstName}</span>
                </h1>
                <p style={{ fontSize: "clamp(18px, 2vw, 20px)", color: t.text2, marginTop: "24px", maxWidth: "600px", lineHeight: 1.5, fontWeight: 400 }}>
                  Enter your living workspace. Create a canvas, bring your team, and build ideas at the speed of thought.
                </p>
              </motion.div>

              {/* ── Error Banner ── */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: "auto", scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.95 }} style={{ overflow: "hidden" }}>
                    <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "16px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "14px", fontWeight: 500, color: "#fca5a5", display: "flex", alignItems: "center", gap: "10px" }}>
                      <Zap size={18} /> {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Primary Action Cards ── */}
              <motion.div
                variants={mountVariant}
                className="grid grid-cols-1 md:grid-cols-2"
                style={{ gap: "32px", position: "relative" }}
              >

                {/* CREATE ROOM CARD */}
                <motion.div
                  animate={{
                    opacity: isJoiningSession ? 0.3 : 1,
                    scale: isJoiningSession ? 0.95 : 1,
                    filter: isJoiningSession ? "blur(4px)" : "blur(0px)"
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{ height: "100%" }}
                >
                  <InteractiveCard
                    glowColor="#8b5cf6"
                    onClick={handleCreateRoom}
                    disabled={isNavigating}
                    isActive={isCreating}
                    isSuccess={isCreating && activeProcessSuccess}
                    loadingText="Creating Workspace..."
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(139,92,246,0.2)" }}>
                        <Plus size={28} color={t.accentBright} strokeWidth={2.5} />
                      </div>
                      <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                        <ArrowRight size={20} color={t.text4} />
                      </motion.div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.text1, marginBottom: "8px", letterSpacing: "-0.02em" }}>New Workspace</h3>
                      <p style={{ fontSize: "16px", color: t.text3, lineHeight: 1.5, fontWeight: 500 }}>
                        Spin up a new collaborative environment with a whiteboard, code editor, and voice channel.
                      </p>
                    </div>
                    <div style={{ marginTop: "auto", paddingTop: "24px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: t.accentBright, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Sparkles size={14} /> Instant Setup
                      </span>
                    </div>
                  </InteractiveCard>
                </motion.div>

                {/* JOIN ROOM CARD */}
                <motion.div
                  animate={{
                    opacity: isCreating ? 0.3 : 1,
                    scale: isCreating ? 0.95 : 1,
                    filter: isCreating ? "blur(4px)" : "blur(0px)"
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  style={{ height: "100%" }}
                >
                  <InteractiveCard
                    glowColor="#6366f1"
                    onClick={!isJoiningParam ? () => setIsJoiningParam(true) : undefined}
                    disabled={isNavigating}
                    isActive={isJoiningSession}
                    isSuccess={isJoiningSession && activeProcessSuccess}
                    loadingText="Joining Session..."
                  >
                    <AnimatePresence mode="wait">
                      {!isJoiningParam ? (
                        <motion.div key="join-prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(99,102,241,0.2)" }}>
                              <Globe size={28} color="#818cf8" strokeWidth={2.5} />
                            </div>
                            <motion.div whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                              <ArrowRight size={20} color={t.text4} />
                            </motion.div>
                          </div>
                          <div>
                            <h3 style={{ fontSize: "24px", fontWeight: 800, color: t.text1, marginBottom: "8px", letterSpacing: "-0.02em" }}>Join Session</h3>
                            <p style={{ fontSize: "16px", color: t.text3, lineHeight: 1.5, fontWeight: 500 }}>
                              Have a room code? Jump right into an active team session instantly.
                            </p>
                          </div>
                          <div style={{ marginTop: "auto", paddingTop: "24px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              <Zap size={14} /> Fast Connectivity
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="join-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 30 }} onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", cursor: "default" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: 800, color: t.text1 }}>Enter Code</h3>
                            <button onClick={() => { setIsJoiningParam(false); setRoomCode(""); setError(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: t.text2, cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "white"; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = t.text2; }}>
                              <X size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                          <form onSubmit={handleJoinRoom} style={{ display: "flex", flexDirection: "column", flex: 1, gap: "16px" }}>
                            <input
                              type="text"
                              value={roomCode}
                              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                              placeholder="XXXXXX"
                              autoFocus
                              maxLength={6}
                              style={{ width: "100%", boxSizing: "border-box", padding: "24px", fontSize: "2rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.5em", textAlign: "center", color: "white", backgroundColor: "rgba(0,0,0,0.4)", border: `2px solid rgba(99,102,241,0.5)`, borderRadius: "16px", outline: "none", textTransform: "uppercase", boxShadow: "inset 0 4px 12px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2)", transition: "border 0.2s, box-shadow 0.2s" }}
                              onFocus={(e) => { e.target.style.borderColor = "#818cf8"; e.target.style.boxShadow = "inset 0 4px 12px rgba(0,0,0,0.5), 0 0 30px rgba(99,102,241,0.4)"; }}
                              onBlur={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.boxShadow = "inset 0 4px 12px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2)"; }}
                            />
                            <motion.button
                              type="submit"
                              disabled={roomCode.length !== 6}
                              whileHover={{ scale: roomCode.length === 6 ? 1.02 : 1 }}
                              whileTap={{ scale: roomCode.length === 6 ? 0.98 : 1 }}
                              style={{ width: "100%", padding: "18px", fontSize: "16px", fontWeight: 800, color: "white", borderRadius: "16px", border: "none", marginTop: "auto", background: roomCode.length === 6 ? t.gradientIndigo : "rgba(99,102,241,0.2)", cursor: roomCode.length === 6 ? "pointer" : "not-allowed", boxShadow: roomCode.length === 6 ? "0 8px 32px rgba(99,102,241,0.4)" : "none", opacity: roomCode.length === 6 ? 1 : 0.5, transition: "background 0.3s, opacity 0.3s", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              Join Session
                            </motion.button>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </InteractiveCard>
                </motion.div>
              </motion.div>

              {/* ── Recent Rooms Section ── */}
              <motion.div
                variants={mountVariant}
                animate={{
                  opacity: isNavigating ? 0.3 : 1,
                  scale: isNavigating ? 0.98 : 1,
                  filter: isNavigating ? "blur(4px)" : "blur(0px)"
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ marginTop: "80px", pointerEvents: isNavigating ? "none" : "auto" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                  <Activity size={18} color={t.text3} />
                  <span style={{ fontSize: "14px", fontWeight: 800, color: t.text1, textTransform: "uppercase", letterSpacing: "0.15em" }}>Recent Activity</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: t.border, opacity: 0.5 }} />
                  {recentRooms.length > 0 && (
                    <button onClick={handleDeleteAll} style={{ fontSize: "12px", fontWeight: 700, color: t.text3, background: "rgba(255,255,255,0.03)", border: `1px solid ${t.border}`, cursor: "pointer", padding: "8px 16px", borderRadius: "8px", transition: "all 0.2s" }} onMouseOver={(e) => { e.target.style.background = "rgba(239,68,68,0.1)"; e.target.style.color = "#fca5a5"; e.target.style.borderColor = "rgba(239,68,68,0.3)"; }} onMouseOut={(e) => { e.target.style.background = "rgba(255,255,255,0.03)"; e.target.style.color = t.text3; e.target.style.borderColor = t.border; }}>
                      Clear History
                    </button>
                  )}
                </div>

                {recentRooms.length > 0 ? (
                  <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "24px" }}>
                    <AnimatePresence>
                      {recentRooms.map((room) => {
                        const ago = (() => {
                          const mins = Math.floor((Date.now() - new Date(room.updatedAt)) / 60000);
                          if (mins < 1) return "Just now";
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `${hrs}h ago`;
                          return `${Math.floor(hrs / 24)}d ago`;
                        })();

                        const hue = [...room.roomId].reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
                        const cardColor = `hsl(${hue}, 70%, 65%)`;

                        return (
                          <motion.div
                            key={room.roomId}
                            variants={cardVariant}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            whileHover="hover"
                            onClick={() => navigate(`/room/${room.roomId}`)}
                            style={{ padding: "24px", borderRadius: "20px", cursor: "pointer", border: `1px solid rgba(255,255,255,0.06)`, backgroundColor: "rgba(255,255,255,0.02)", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
                          >
                            <motion.div variants={{ hover: { opacity: 1 } }} initial={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ position: "absolute", inset: 0, border: `1px solid ${cardColor}50`, borderRadius: "20px", pointerEvents: "none", zIndex: 10 }} />
                            <motion.div variants={{ hover: { opacity: 1, scale: 1.1 } }} initial={{ opacity: 0, scale: 1 }} transition={{ duration: 0.4 }} style={{ position: "absolute", top: "-50px", right: "-50px", width: "150px", height: "150px", borderRadius: "50%", background: `radial-gradient(circle, ${cardColor}20 0%, transparent 60%)`, pointerEvents: "none", zIndex: 0 }} />

                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", zIndex: 1 }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <span style={{ fontSize: "18px", fontWeight: 700, color: t.text1, paddingRight: "24px", letterSpacing: "-0.01em" }}>{room.name}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: cardColor }} />
                                  <span style={{ fontSize: "12px", fontFamily: "monospace", color: t.text3, letterSpacing: "0.05em", fontWeight: 600 }}>{room.roomId}</span>
                                </div>
                              </div>
                              <motion.button variants={{ hover: { opacity: 1, scale: 1 } }} initial={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.2 }} onClick={(e) => handleDeleteRoom(e, room.roomId)} title="Remove" style={{ position: "absolute", top: "20px", right: "20px", width: "32px", height: "32px", borderRadius: "10px", border: "none", background: "rgba(239,68,68,0.1)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
                                <X size={16} strokeWidth={3} />
                              </motion.button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${t.border}`, zIndex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                {room.participants?.slice(0, 3).map((p, idx) => {
                                  // Fallback to U if name isn't present, to ensure valid string
                                  const encodedName = encodeURIComponent(p.name || p.email?.split('@')[0] || "U");
                                  return (
                                    <div key={p._id || idx} style={{ position: "relative", marginLeft: idx === 0 ? 0 : "-10px", zIndex: 10 - idx }}>
                                      <motion.img whileHover={{ y: -4, scale: 1.1, zIndex: 20 }} src={p.avatar || `https://ui-avatars.com/api/?name=${encodedName}&background=${cardColor.replace('#', '')}&color=fff&size=28`} alt={p.name || "User"} style={{ width: "28px", height: "28px", borderRadius: "50%", border: `2px solid ${t.bg}`, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
                                      <div style={{ position: "absolute", bottom: -2, right: -2, width: "10px", height: "10px", borderRadius: "50%", border: `2px solid ${t.bg}`, background: "#10b981" }} />
                                    </div>
                                  );
                                })}
                                {room.participants?.length > 3 && (
                                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: t.surfaceHover, border: `2px solid ${t.bg}`, marginLeft: "-10px", position: "relative", zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: t.text2 }}>+{room.participants.length - 3}</div>
                                )}
                                {(!room.participants || room.participants.length === 0) && (
                                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: t.text4, fontWeight: 600 }}>
                                    <Users size={14} /> 0 Active
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: t.text4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{ago}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div variants={cardVariant} style={{ padding: "80px 40px", textAlign: "center", borderRadius: "24px", border: `2px dashed ${t.border}`, backgroundColor: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: t.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.borderHover}`, boxShadow: "0 16px 40px rgba(0,0,0,0.2)" }}>
                      <Layout size={32} color={t.text3} strokeWidth={1.5} />
                    </div>
                    <div style={{ maxWidth: "320px" }}>
                      <h3 style={{ fontSize: "20px", fontWeight: 800, color: t.text1, marginBottom: "12px" }}>No workspaces yet</h3>
                      <p style={{ fontSize: "16px", color: t.text3, lineHeight: 1.6, fontWeight: 500 }}>Create a new room or join an existing session to start collaborating.</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

            </motion.div>
          </Container>
        </main>
      </motion.div>
    </div>
  );
}
