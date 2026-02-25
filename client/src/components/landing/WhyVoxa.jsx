import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Globe } from 'lucide-react';

const reasons = [
    { icon: Lock, title: 'Deep Focus', desc: 'No clutter. No notifications pinging you constantly. Just pure collaboration in a minimalist, distraction-free environment.', color: '#fca5a5' },
    { icon: Zap, title: 'WebSockets + WebRTC', desc: 'Every stroke, cursor movement, and voice packet is transmitted over low-latency P2P and Socket.IO connections. It feels instant.', color: '#fde047' },
    { icon: Globe, title: 'Zero Setup', desc: 'No native clients required. Send a room URL, and anyone can securely join the collaborative session from their browser.', color: '#67e8f9' },
];

export default function WhyVoxa() {
    return (
        <section id="why-voxa" style={{ position: 'relative', zIndex: 10, width: '100%', paddingBlock: '120px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '80px', alignItems: 'start' }}>

                    {/* Left: Sticky Text */}
                    <div style={{ position: 'sticky', top: '160px' }}>
                        <motion.span
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false, margin: "-100px" }}
                            style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#fca5a5' }}
                        >
                            The VOXA Philosophy
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, margin: "-100px" }} transition={{ delay: 0.1 }}
                            style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: 'white', marginTop: '16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}
                        >
                            Not another tool.<br />
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>A better way to build.</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, margin: "-100px" }} transition={{ delay: 0.2 }}
                            style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', marginTop: '24px', lineHeight: 1.7, maxWidth: '440px' }}
                        >
                            We built VOXA because modern remote collaboration shouldn't mean jumping between five different desktop apps just to explain a simple architectural change.
                        </motion.p>
                    </div>

                    {/* Right: Scrolling Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {reasons.map((r, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                viewport={{ once: false, margin: "-100px" }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.15 }}
                                whileHover={{ x: -8, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                                style={{
                                    display: 'flex', gap: '24px', padding: '40px 32px',
                                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                                    backgroundColor: 'rgba(255,255,255,0.01)',
                                    backgroundImage: `linear-gradient(135deg, ${r.color}05, transparent)`,
                                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
                                }}
                            >
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: `linear-gradient(135deg, ${r.color}22, ${r.color}05)`, border: `1px solid ${r.color}30`
                                }}>
                                    <r.icon size={20} color={r.color} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>{r.title}</h4>
                                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{r.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
