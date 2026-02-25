import { useEffect, useState } from 'react';
import { Trash2, BringToFront, SendToBack, Copy, Type, Palette } from 'lucide-react';

/* ──────────────────────────────────────────────
   CONTEXTUAL TOOLBAR COMPONENT
   ──────────────────────────────────────────────
   Automatically positions itself above the active
   Fabric.js selection, offering quick inline actions.
*/

export default function ContextualToolbar({ canvas, isDarkMode, onDelete, onCopy, onBringForward, onSendBackward, onColorChange }) {
    const [position, setPosition] = useState(null);
    const [activeObject, setActiveObject] = useState(null);

    useEffect(() => {
        if (!canvas) return;

        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (!active) {
                setPosition(null);
                setActiveObject(null);
                return;
            }

            // Calculate position relative to the wrapper
            // Fabric objects bounding rect is in relative canvas coords
            // We need to account for zoom and pan
            const br = active.getBoundingRect(true, true);
            const zoom = canvas.getZoom();
            const vpt = canvas.viewportTransform;

            const screenTop = (br.top * zoom) + vpt[5];
            const screenLeft = (br.left * zoom) + vpt[4];
            const screenWidth = br.width * zoom;

            setPosition({
                top: screenTop - 64, // 64px above the object
                left: screenLeft + (screenWidth / 2)
            });
            setActiveObject(active);
        };

        const handleClear = () => {
            setPosition(null);
            setActiveObject(null);
        };

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleClear);
        canvas.on('object:moving', handleSelection);
        canvas.on('object:scaling', handleSelection);
        canvas.on('object:rotating', handleSelection);
        // Also update on canvas pan/zoom to keep toolbar glued
        canvas.on('mouse:move', () => { if (canvas.isDragging) handleSelection() });
        canvas.on('mouse:wheel', handleSelection);

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleClear);
            canvas.off('object:moving', handleSelection);
            canvas.off('object:scaling', handleSelection);
            canvas.off('object:rotating', handleSelection);
            canvas.off('mouse:wheel', handleSelection);
        };
    }, [canvas]);

    if (!position || !activeObject) return null;

    const dm = isDarkMode;
    const bg = dm ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.95)';
    const border = dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const shadow = dm ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)';
    const text = dm ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)';
    const hoverBg = dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

    const isText = activeObject.type === 'i-text' || activeObject.type === 'text';
    const isPath = activeObject.type === 'path';

    const IconBtn = ({ icon: Icon, onClick, title, danger }) => (
        <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
            title={title}
            className="ctx-tb-btn"
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: danger ? '#ef4444' : text,
                cursor: 'pointer', transition: 'background 0.1s ease',
            }}
        >
            <Icon size={16} />
            <style>{`.ctx-tb-btn:hover { background-color: ${danger ? 'rgba(239,68,68,0.15)' : hoverBg} !important; }`}</style>
        </button>
    );

    const Sep = () => <div style={{ width: '1px', height: '16px', backgroundColor: border, margin: '0 4px' }} />;

    return (
        <div style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px',
            borderRadius: '12px',
            backgroundColor: bg,
            border: `1px solid ${border}`,
            boxShadow: shadow,
            backdropFilter: 'blur(16px)',
            pointerEvents: 'auto',
            animation: 'ctx-pop 0.15s cubic-bezier(0.16,1,0.3,1) forwards',
            transition: 'top 0s, left 0s', // instantaneous tracking
        }}>
            <IconBtn icon={Copy} onClick={onCopy} title="Duplicate (Ctrl+C)" />

            <Sep />

            <IconBtn icon={BringToFront} onClick={onBringForward} title="Bring Forward (])" />
            <IconBtn icon={SendToBack} onClick={onSendBackward} title="Send Backward ([)" />

            <Sep />

            {/* Quick color dots */}
            <div style={{ display: 'flex', gap: '4px', padding: '0 4px' }}>
                {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', dm ? '#ffffff' : '#000000'].map(c => (
                    <div
                        key={c}
                        onClick={(e) => { e.stopPropagation(); onColorChange(c); }}
                        style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            backgroundColor: c, cursor: 'pointer',
                            border: `2px solid ${bg}`, boxShadow: `0 0 0 1px ${border}`
                        }}
                    />
                ))}
            </div>

            <Sep />

            <IconBtn icon={Trash2} onClick={onDelete} title="Delete (Del)" danger />

            <style>{`
                @keyframes ctx-pop {
                    from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
