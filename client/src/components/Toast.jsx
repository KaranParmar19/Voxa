import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
    };

    const colors = {
        success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.2)', color: '#4ade80', icon: '✓' },
        error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.2)', color: '#f87171', icon: '✕' },
        info: { bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.2)', color: '#a78bfa', icon: 'ℹ' },
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast container — top-right, stacked */}
            <div style={{
                position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
                display: 'flex', flexDirection: 'column', gap: '8px',
                pointerEvents: 'none',
            }}>
                {toasts.map(t => {
                    const c = colors[t.type] || colors.info;
                    return (
                        <div key={t.id} style={{
                            padding: '10px 16px', borderRadius: '10px',
                            backgroundColor: c.bg, border: `1px solid ${c.border}`,
                            backdropFilter: 'blur(12px)', color: c.color,
                            fontSize: '13px', fontWeight: 500,
                            display: 'flex', alignItems: 'center', gap: '8px',
                            animation: 'toast-in 0.3s cubic-bezier(0.16,1,0.3,1)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            pointerEvents: 'auto',
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: 700 }}>{c.icon}</span>
                            {t.message}
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
