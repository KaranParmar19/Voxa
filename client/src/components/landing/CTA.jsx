import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTA({ onGetStarted }) {
    return (
        <section style={{ position: 'relative', zIndex: 10, width: '100%', paddingBlock: '160px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 60%)', filter: 'blur(80px)' }} />
            </div>

            <div style={{ width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                        position: 'relative', textAlign: 'center', maxWidth: '640px', marginInline: 'auto',
                        padding: '64px 32px', borderRadius: '24px',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                >
                    <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        Ready to join the session?
                    </h2>
                    <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: 'rgba(255,255,255,0.6)', marginTop: '24px', marginBottom: '40px', lineHeight: 1.6 }}>
                        VOXA is completely free for students and indie teams. No credit card required. Jump in and start building.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 16px 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onGetStarted}
                        style={{
                            padding: '16px 36px', fontSize: '16px', fontWeight: 600, color: 'white',
                            borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                            border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 8px 24px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                        }}
                    >
                        Create your workspace <ArrowRight size={18} />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
