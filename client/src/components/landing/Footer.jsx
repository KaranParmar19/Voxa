import React from 'react';
import Logo from '../Logo';

export default function Footer() {
    return (
        <footer style={{ position: 'relative', zIndex: 10, width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '80px', flexWrap: 'wrap', gap: '16px', width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Logo style={{ height: '28px', width: 'auto', filter: 'brightness(0.6)' }} />
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy</a>
                    <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms</a>
                    <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Twitter</a>
                </div>
            </div>
        </footer>
    );
}
