import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    window.location.href = `${serverUrl}/api/auth/google`;
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ backgroundColor: "#06060a", padding: "24px" }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "-20%",
            width: "70%",
            height: "70%",
            background:
              "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 60%)",
            animation: "ambient-drift 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-20%",
            width: "60%",
            height: "60%",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 60%)",
            animation: "ambient-drift 25s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              backgroundColor: "white",
              opacity: Math.random() * 0.4 + 0.1,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* ==================== CARD ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative"
        style={{ maxWidth: "400px", zIndex: 10 }}
      >
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center transition-colors"
          style={{
            gap: "8px",
            color: "rgba(255,255,255,0.35)",
            fontSize: "13px",
            marginBottom: "28px",
            display: "inline-flex",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.35)")
          }
        >
          <svg
            style={{ width: "16px", height: "16px" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to home
        </Link>

        {/* Glass card */}
        <div
          style={{
            borderRadius: "20px",
            padding: "40px 36px",
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.025)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top glow line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "20%",
              right: "20%",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)",
            }}
          />

          {/* ---- HEADER ---- */}
          <div className="text-center" style={{ marginBottom: "36px" }}>
            {/* Logo */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <Logo style={{ height: "48px", width: "auto" }} />
            </div>

            <h1
              className="font-bold"
              style={{
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.9)",
                marginBottom: "8px",
              }}
            >
              Welcome back
            </h1>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>
              Sign in to your VOXA workspace
            </p>
          </div>

          {/* ---- ERROR ---- */}
          {error && (
            <div
              style={{
                marginBottom: "24px",
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "13px",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                style={{ width: "16px", height: "16px", flexShrink: 0 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* ---- GOOGLE BTN ---- */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center transition-all duration-200"
            style={{
              padding: "13px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.85)",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.04)",
              cursor: "pointer",
              gap: "12px",
              marginBottom: "28px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
            }}
          >
            <svg style={{ width: "18px", height: "18px" }} viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* ---- DIVIDER ---- */}
          <div className="relative" style={{ marginBottom: "28px" }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
            <div className="relative flex justify-center">
              <span
                style={{
                  padding: "0 16px",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.25)",
                  backgroundColor: "rgba(6,6,10,0.9)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                or
              </span>
            </div>
          </div>

          {/* ---- FORM ---- */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* Email */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: formData.email || focused === "email" ? "8px" : "50%",
                    transform:
                      formData.email || focused === "email"
                        ? "none"
                        : "translateY(-50%)",
                    fontSize:
                      formData.email || focused === "email" ? "10px" : "14px",
                    color:
                      focused === "email"
                        ? "rgba(167,139,250,0.8)"
                        : "rgba(255,255,255,0.3)",
                    transition: "all 0.2s ease",
                    pointerEvents: "none",
                    letterSpacing:
                      formData.email || focused === "email"
                        ? "0.05em"
                        : "normal",
                    textTransform:
                      formData.email || focused === "email"
                        ? "uppercase"
                        : "none",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused("")}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding:
                      formData.email || focused === "email"
                        ? "24px 14px 10px"
                        : "16px 14px",
                    fontSize: "14px",
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${focused === "email" ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ position: "relative" }}>
                <label
                  style={{
                    position: "absolute",
                    left: "14px",
                    top:
                      formData.password || focused === "password"
                        ? "8px"
                        : "50%",
                    transform:
                      formData.password || focused === "password"
                        ? "none"
                        : "translateY(-50%)",
                    fontSize:
                      formData.password || focused === "password"
                        ? "10px"
                        : "14px",
                    color:
                      focused === "password"
                        ? "rgba(167,139,250,0.8)"
                        : "rgba(255,255,255,0.3)",
                    transition: "all 0.2s ease",
                    pointerEvents: "none",
                    letterSpacing:
                      formData.password || focused === "password"
                        ? "0.05em"
                        : "normal",
                    textTransform:
                      formData.password || focused === "password"
                        ? "uppercase"
                        : "none",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused("")}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding:
                      formData.password || focused === "password"
                        ? "24px 14px 10px"
                        : "16px 14px",
                    fontSize: "14px",
                    color: "white",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${focused === "password" ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: "12px",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Forgot password - right aligned */}
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <Link
                to="/forgot-password"
                className="transition-colors"
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "rgba(167,139,250,0.8)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255,255,255,0.3)")
                }
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full transition-all duration-300"
              style={{
                padding: "14px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                borderRadius: "12px",
                border: "none",
                cursor: loading ? "wait" : "pointer",
                background: loading
                  ? "rgba(124,58,237,0.3)"
                  : "linear-gradient(135deg, #7c3aed, #6366f1)",
                boxShadow: loading
                  ? "none"
                  : "0 8px 24px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.boxShadow =
                    "0 12px 32px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)";
              }}
            >
              {loading ? (
                <span
                  className="flex items-center justify-center"
                  style={{ gap: "8px" }}
                >
                  <svg
                    style={{
                      width: "18px",
                      height: "18px",
                      animation: "spin 1s linear infinite",
                    }}
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* ---- FOOTER ---- */}
          <div className="text-center" style={{ marginTop: "28px" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="transition-colors"
                style={{ color: "#a78bfa", fontWeight: 500 }}
                onMouseEnter={(e) => (e.target.style.color = "#c4b5fd")}
                onMouseLeave={(e) => (e.target.style.color = "#a78bfa")}
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* ==================== ANIMATIONS ==================== */}
      <style>{`
                @keyframes twinkle {
                    0%,100% { opacity:0.1; }
                    50% { opacity:0.6; }
                }
                @keyframes ambient-drift {
                    0%,100% { transform: translate(0,0) scale(1); }
                    50% { transform: translate(30px,-30px) scale(1.1); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
}

export default Login;
