import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import Cinematic Components
import AmbientBackground from '../components/landing/AmbientBackground';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import WhyVoxa from '../components/landing/WhyVoxa';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import Logo from '../components/Logo';

// Global styles for the landing page
const navLinkStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.2s' };
const navBtnStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.55)', padding: '7px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'all 0.2s', cursor: 'pointer' };

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Auto-redirect if already logged in
    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    return (
        <div style={{
            position: 'relative', width: '100%', minHeight: '100vh',
            backgroundColor: '#06060a', overflowX: 'hidden', color: 'rgba(255,255,255,0.93)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Minimal Ambient 3D/Gradient Background */}
            <AmbientBackground />

            {/* ═══════════════ NAVBAR ═══════════════ */}
            <header style={{ position: 'relative', zIndex: 30, width: '100%', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                    width: '100%', maxWidth: '1200px', marginInline: 'auto', paddingInline: 'clamp(16px, 4vw, 32px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px'
                }}>
                    {/* Logo */}
                    <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
                        <Logo style={{ height: '36px', width: 'auto' }} />
                    </div>

                    {/* Nav links + CTA */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        <a href="#features" className="hidden md:block" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>Features</a>
                        <a href="#why-voxa" className="hidden md:block" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>Why VOXA</a>
                        <button
                            onClick={() => navigate('/login')}
                            style={navBtnStyle}
                            onMouseEnter={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.target.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.backgroundColor = 'rgba(255,255,255,0.02)'; e.target.style.color = 'rgba(255,255,255,0.55)'; }}
                        >
                            Sign In
                        </button>
                    </nav>
                </div>
            </header>

            {/* ═══════════════ PAGE CONTENT ═══════════════ */}
            <Hero
                onGetStarted={() => navigate('/signup')}
                onSeeHow={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            />

            <Features />
            <HowItWorks />
            <WhyVoxa />

            <CTA onGetStarted={() => navigate('/signup')} />

            <Footer />

            <style>{`
                body { background-color: #06060a; margin: 0; }
                html { scroll-behavior: smooth; }
            `}</style>
        </div>
    );
}

