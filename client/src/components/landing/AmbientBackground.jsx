import React from 'react';
import { motion } from 'framer-motion';

export default function AmbientBackground() {
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {/* Soft animated gradient orbs as a lightweight alternative to full R3F particles until needed */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-10%',
                    width: '60vw',
                    height: '60vw',
                    background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 60%)',
                    borderRadius: '50%'
                }}
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -40, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
                style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
                    width: '70vw',
                    height: '70vw',
                    background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 65%)',
                    borderRadius: '50%'
                }}
            />
        </div>
    );
}
