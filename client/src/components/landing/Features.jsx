import React from 'react';
import { motion } from 'framer-motion';
import { Palette, MessageSquare, Mic, Code2 } from 'lucide-react';

const scrollVariant = {
    hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const features = [
    { icon: Palette, title: 'Infinite Whiteboard', desc: 'A limitless canvas synced at 60fps. Draw, drop sticky notes, and construct architecture diagrams.', color: '#c084fc' },
    { icon: Code2, title: 'Multiplayer Code', desc: 'Monaco editor integration with real-time remote cursors, syntax highlighting, and live compilation.', color: '#34d399' },
    { icon: Mic, title: 'Spatial Audio', desc: 'Jump into voice channels with WebRTC. Talk naturally while you work without friction.', color: '#60a5fa' },
    { icon: MessageSquare, title: 'Contextual Chat', desc: 'Drop comments directly on components or stay in the global room loop. Always saved to history.', color: '#f472b6' },
];

export default function Features() {
    return (
        <section id="features" style={{ position: 'relative', zIndex: 10, width: '100%', paddingBlock: '120px' }}>
            <div style={{ width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)' }}>
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-100px" }}
                    variants={scrollVariant}
                    style={{ textAlign: 'center', marginBottom: '80px' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a78bfa' }}>
                        The Toolkit
                    </span>
                    <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: 'white', marginTop: '16px', letterSpacing: '-0.02em' }}>
                        Everything you need.<br /> Nothing you don't.
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px' }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial="hidden" whileInView="visible" viewport={{ once: false, margin: "-50px" }}
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' } }
                            }}
                            whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                            style={{
                                padding: '32px 24px', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backgroundColor: 'rgba(255,255,255,0.01)',
                                transition: 'all 0.3s', cursor: 'default'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: `linear-gradient(135deg, ${f.color}22, ${f.color}05)`,
                                border: `1px solid ${f.color}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '24px', color: f.color
                            }}>
                                <f.icon size={22} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{f.title}</h3>
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
