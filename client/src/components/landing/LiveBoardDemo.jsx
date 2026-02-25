import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Sequence timing configuration (Total ~14s)
const LOOP_DURATION = 14;

export default function LiveBoardDemo() {
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);
        const listener = (e) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }, []);

    // If reduced motion is preferred, we can just show a static beautiful frame
    // For now, we'll let framer-motion handle basic reduced-motion if configured, 
    // but building the full animation here.

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '600px', // Scaling container
            aspectRatio: '16 / 10',
            backgroundColor: '#0c0c11', // Deep dark
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            overflow: 'hidden',
        }}>
            {/* Window Controls & Header */}
            <div style={{
                height: '40px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(255,255,255,0.01)'
            }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                    Q3 Architecture — VOXA
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {/* Avatars */}
                    {['#7c3aed', '#ec4899', '#10b981'].map((c, i) => (
                        <div key={i} style={{
                            width: 20, height: 20, borderRadius: '50%', backgroundColor: c,
                            border: '2px solid #0c0c11', marginLeft: i > 0 ? '-8px' : 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '9px', color: '#fff', fontWeight: 'bold'
                        }}>
                            {['K', 'A', 'M'][i]}
                        </div>
                    ))}
                </div>
            </div>

            {/* Canvas Area with Grid */}
            <div style={{
                position: 'absolute', inset: '40px 0 0 0',
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }}>
                {!isReducedMotion && <DemoAnimationSequence />}
            </div>
        </div>
    );
}

function DemoAnimationSequence() {
    // ── Timeline definition using times: [0, 0.1, ... 1] ──
    // Cursor 1 (The active user - drawing)
    const c1X = [300, 150, 150, 200, 250, 250, 100, 150, 300];
    const c1Y = [250, 150, 150, 80, 120, 120, 200, 220, 250];
    const c1Op = [0, 1, 1, 1, 1, 1, 1, 0, 0];

    // Cursor 2 (Collaborator - comes in late)
    const c2X = [400, 400, 350, 300, 300, 400];
    const c2Y = [250, 250, 180, 150, 150, 250];
    const c2Op = [0, 0, 1, 1, 0, 0];
    const c2Times = [0, 0.5, 0.6, 0.7, 0.9, 1]; // Late entry

    return (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* 1. Rectangle (Drawn by Cursor 1) */}
            <motion.rect
                x="80" y="60" width="120" height="80" rx="8"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                strokeDasharray="450"
                initial={{ strokeDashoffset: 450, opacity: 0 }}
                animate={{
                    strokeDashoffset: [450, 450, 0, 0, 0],
                    opacity: [0, 1, 1, 1, 0], // Fades out at end of loop
                }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.15, 0.3, 0.9, 1] }}
            />
            {/* Text inside rectangle */}
            <motion.text
                x="140" y="105"
                textAnchor="middle"
                fill="#fff"
                fontSize="14"
                fontWeight="500"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.3, 0.35, 0.9, 1] }}
            >
                API Gateway
            </motion.text>

            {/* 2. Path (Drawn by Cursor 1) */}
            <motion.path
                d="M 200 100 Q 250 100 250 150"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="150"
                initial={{ strokeDashoffset: 150, opacity: 0 }}
                animate={{
                    strokeDashoffset: [150, 150, 0, 0, 0],
                    opacity: [0, 1, 1, 1, 0]
                }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.35, 0.45, 0.9, 1] }}
            />

            {/* 3. Database Cylinder (Drawn by Collaborator) */}
            <motion.path
                d="M 250 150 C 250 140, 310 140, 310 150 C 310 160, 250 160, 250 150 L 250 200 C 250 210, 310 210, 310 200 L 310 150"
                fill="rgba(16, 185, 129, 0.1)"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="300"
                initial={{ strokeDashoffset: 300, opacity: 0 }}
                animate={{
                    strokeDashoffset: [300, 300, 0, 0, 0],
                    opacity: [0, 0, 1, 1, 0]
                }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.6, 0.75, 0.9, 1] }}
            />
            <motion.text
                x="280" y="185"
                textAnchor="middle"
                fill="#10b981"
                fontSize="12"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.7, 0.75, 0.9, 1] }}
            >
                Redis
            </motion.text>


            {/* Cursor 1 (Purple - You) */}
            <motion.g
                animate={{ x: c1X, y: c1Y, opacity: c1Op }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: "easeInOut", times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.9, 1] }}
            >
                <path d="M0,0 L14.5,5.5 L8.5,8 L5,14 Z" fill="#a78bfa" stroke="#fff" strokeWidth="1.5" />
            </motion.g>

            {/* Cursor 2 (Green - Collaborator) */}
            <motion.g
                animate={{ x: c2X, y: c2Y, opacity: c2Op }}
                transition={{ duration: LOOP_DURATION, repeat: Infinity, ease: "easeInOut", times: c2Times }}
            >
                <path d="M0,0 L14.5,5.5 L8.5,8 L5,14 Z" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                {/* Chat Toast attached to cursor */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }}
                    transition={{ duration: LOOP_DURATION, repeat: Infinity, times: [0, 0.75, 0.78, 0.88, 0.9] }}
                >
                    <rect x="15" y="15" width="130" height="28" rx="6" fill="#10b981" />
                    <text x="25" y="34" fill="#fff" fontSize="11" fontWeight="bold">Added Redis cache! 🚀</text>
                </motion.g>
            </motion.g>

        </svg>
    );
}

