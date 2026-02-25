import React from 'react';

export default function Logo({ className = "", style = {} }) {
    return (
        <svg width="180" height="48" viewBox="0 0 180 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ display: 'block', ...style }}>
            <defs>
                <linearGradient id="voxaGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>

                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Icon background */}
            <rect x="0" y="4" width="40" height="40" rx="12" fill="#0B0B0F" />

            {/* Abstract V shape (collaboration flow symbol) */}
            <path d="M10 14 L20 32 L30 14"
                stroke="url(#voxaGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)" />

            {/* Connection node */}
            <circle cx="20" cy="32" r="3" fill="url(#voxaGradient)" filter="url(#glow)" />

            {/* Wordmark */}
            <text x="54" y="31"
                fontFamily="Inter, system-ui, sans-serif"
                fontSize="22"
                fontWeight="600"
                fill="#E5E7EB"
                letterSpacing="1">
                VOXA
            </text>
        </svg>
    );
}
