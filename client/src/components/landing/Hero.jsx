import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import LiveBoardDemo from './LiveBoardDemo';

const fadeUpVariant = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
};

export default function Hero({ onGetStarted, onSeeHow }) {
    return (
        <section style={{
            position: 'relative', zIndex: 10, width: '100%',
            paddingTop: 'clamp(80px, 12vh, 160px)', paddingBottom: '96px'
        }}>
            <div style={{
                width: '100%', maxWidth: '1200px', marginInline: 'auto',
                paddingInline: 'clamp(16px, 4vw, 32px)',
                display: 'grid', gridTemplateColumns: '1fr', gap: '64px', alignItems: 'center'
            }} className="lg:grid-cols-2">

                {/* Left: Copy */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                    {/* Badge */}
                    <motion.div variants={fadeUpVariant} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '6px 16px', marginBottom: '24px', borderRadius: '999px',
                        border: '1px solid rgba(139,92,246,0.3)', backgroundColor: 'rgba(139,92,246,0.1)',
                        boxShadow: '0 0 20px rgba(124,58,237,0.15)'
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
                        <span style={{ fontSize: '12px', color: '#c4b5fd', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            VOXA • Real-time Sync
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 variants={fadeUpVariant} style={{
                        fontSize: 'clamp(44px, 6vw, 72px)', fontWeight: 800,
                        lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: '24px',
                        color: 'rgba(255,255,255,0.95)'
                    }}>
                        Where teams <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 50%, #e879f9 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundSize: '200% 200%', animation: 'gradient-shift 8s ease infinite'
                        }}>think together.</span>
                    </motion.h1>

                    {/* Subhead */}
                    <motion.p variants={fadeUpVariant} style={{
                        fontSize: 'clamp(18px, 2vw, 20px)', lineHeight: 1.6,
                        color: 'rgba(255,255,255,0.6)', marginBottom: '40px', maxWidth: '480px'
                    }}>
                        Whiteboard, code editor, and live chat. One room, one flow. Built for engineers and designers who ship relentlessly.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div variants={fadeUpVariant} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 12px 32px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onGetStarted}
                            style={{
                                padding: '14px 28px', fontSize: '15px', fontWeight: 600, color: 'white',
                                borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 8px 24px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}
                        >
                            Get Started Free <ArrowRight size={18} />
                        </motion.button>
                        <motion.button
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' }}
                            onClick={onSeeHow}
                            style={{
                                padding: '14px 28px', fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.8)',
                                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
                                backgroundColor: 'transparent', transition: 'all 0.2s'
                            }}
                        >
                            See How It Works
                        </motion.button>
                    </motion.div>

                    {/* Trust Chips */}
                    <motion.div variants={fadeUpVariant} style={{ display: 'flex', gap: '32px' }}>
                        {[
                            { v: '50ms', l: 'Global Latency' },
                            { v: '99.9%', l: 'Uptime SLA' },
                            { v: 'WebRTC', l: 'P2P Voice' }
                        ].map((s, i) => (
                            <div key={i}>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{s.v}</div>
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.l}</div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Right: Live Demo Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    style={{ position: 'relative', perspective: '1000px' }}
                    className="hidden lg:block"
                >
                    {/* Floating back-glow */}
                    <div style={{
                        position: 'absolute', top: '10%', left: '10%', right: '10%', bottom: '10%',
                        background: 'radial-gradient(ellipse, #7c3aed 0%, transparent 70%)',
                        filter: 'blur(60px)', opacity: 0.4, pointerEvents: 'none'
                    }} />

                    {/* Tilt container (Subtle preset isometric tilt) */}
                    <motion.div
                        initial={{ rotateY: -10, rotateX: 5 }}
                        animate={{ rotateY: 0, rotateX: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <LiveBoardDemo />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
