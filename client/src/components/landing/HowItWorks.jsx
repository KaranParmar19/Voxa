import React from 'react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
    return (
        <section id="how-it-works" style={{ position: 'relative', zIndex: 10, width: '100%', paddingBlock: '120px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '80px', alignItems: 'center' }}>

                    {/* Left: Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#10b981' }}>
                            Zero Friction
                        </span>
                        <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: 'white', marginTop: '16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                            Create a room.<br />
                            Share the link.<br />
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Start building.</span>
                        </h2>
                        <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', marginTop: '24px', lineHeight: 1.7, maxWidth: '440px' }}>
                            Forget downloading native apps or waiting for invite emails to process. VOXA runs right in the browser, instantly syncing state across the globe via WebSockets.
                        </p>
                    </motion.div>

                    {/* Right: Abstract Graphic */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        viewport={{ once: false, margin: "-100px" }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'radial-gradient(circle at center, rgba(16,185,129,0.1) 0%, transparent 70%)' }}
                    >
                        {/* Fake Nodes Connection UI */}
                        <svg width="100%" height="100%" viewBox="0 0 400 400">
                            <motion.path d="M 120 120 Q 200 80, 280 120" stroke="rgba(16,185,129,0.4)" strokeWidth="2" fill="none" strokeDasharray="5 5"
                                animate={{ strokeDashoffset: [0, 40] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                            <motion.path d="M 120 280 Q 200 320, 280 280" stroke="rgba(16,185,129,0.4)" strokeWidth="2" fill="none" strokeDasharray="5 5"
                                animate={{ strokeDashoffset: [40, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
                            <motion.path d="M 200 200 L 120 120 M 200 200 L 280 120 M 200 200 L 120 280 M 200 200 L 280 280" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" />

                            {/* Center Node */}
                            <circle cx="200" cy="200" r="24" fill="#06060a" stroke="#10b981" strokeWidth="2" />
                            <circle cx="200" cy="200" r="12" fill="#10b981" />

                            {/* Outer Nodes */}
                            <motion.circle cx="120" cy="120" r="16" fill="#06060a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" whileHover={{ scale: 1.2, stroke: '#10b981' }} />
                            <motion.circle cx="280" cy="120" r="16" fill="#06060a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" whileHover={{ scale: 1.2, stroke: '#10b981' }} />
                            <motion.circle cx="120" cy="280" r="16" fill="#06060a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" whileHover={{ scale: 1.2, stroke: '#10b981' }} />
                            <motion.circle cx="280" cy="280" r="16" fill="#06060a" stroke="rgba(255,255,255,0.2)" strokeWidth="2" whileHover={{ scale: 1.2, stroke: '#10b981' }} />
                        </svg>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
