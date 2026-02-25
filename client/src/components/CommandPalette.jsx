import React, { useState, useEffect, useRef } from 'react';
import { Search, Pen, Square, Circle, Type, Pointer, Eraser, ZoomIn, ZoomOut, Maximize, Trash2, Download, PanelsTopLeft, LogOut } from 'lucide-react';

// Design tokens matching the main application
const t = {
    bg: '#09090b', surface: '#18181b', surfaceHover: '#27272a',
    border: '#27272a', borderHover: '#3f3f46', accentBorder: 'rgba(124,58,237,0.3)',
    text1: '#f4f4f5', text2: '#e4e4e7', text3: '#a1a1aa', text4: '#71717a',
    accent: '#8b5cf6', accentDim: 'rgba(139, 92, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
    r8: '8px', r12: '12px', r16: '16px', rFull: '9999px',
    s8: '8px', s12: '12px', s16: '16px', s24: '24px'
};

const COMMANDS = [
    { id: 'tool-select', label: 'Select Tool', icon: <Pointer size={16} />, category: 'Tools', shortcut: 'V' },
    { id: 'tool-pen', label: 'Pen Tool', icon: <Pen size={16} />, category: 'Tools', shortcut: 'P' },
    { id: 'tool-eraser', label: 'Eraser', icon: <Eraser size={16} />, category: 'Tools', shortcut: 'E' },
    { id: 'tool-rect', label: 'Rectangle', icon: <Square size={16} />, category: 'Tools', shortcut: 'R' },
    { id: 'tool-circle', label: 'Circle', icon: <Circle size={16} />, category: 'Tools', shortcut: 'C' },
    { id: 'tool-text', label: 'Text', icon: <Type size={16} />, category: 'Tools', shortcut: 'T' },

    { id: 'view-zoom-in', label: 'Zoom In', icon: <ZoomIn size={16} />, category: 'View' },
    { id: 'view-zoom-out', label: 'Zoom Out', icon: <ZoomOut size={16} />, category: 'View' },
    { id: 'view-zoom-fit', label: 'Zoom to Fit', icon: <Maximize size={16} />, category: 'View', shortcut: 'Shift+1' },

    { id: 'action-clear', label: 'Clear Canvas', icon: <Trash2 size={16} color="#ef4444" />, category: 'Actions' },
    { id: 'action-export', label: 'Export as PNG', icon: <Download size={16} />, category: 'Actions' },
    { id: 'action-sidebar', label: 'Toggle Sidebar', icon: <PanelsTopLeft size={16} />, category: 'Actions' },
    { id: 'action-leave', label: 'Leave Room', icon: <LogOut size={16} color="#ef4444" />, category: 'Room' },
];

export default function CommandPalette({ isOpen, onClose, onExecute }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Filter commands natively
    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase())
    );

    // Group commands by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    // Flatten back for easy index tracking during keyboard nav
    const flatFilteredCommands = Object.values(groupedCommands).flat();

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        // Scroll selected item into view securely
        if (listRef.current && isOpen) {
            const selectedItem = listRef.current.querySelector('[data-selected="true"]');
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % flatFilteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + flatFilteredCommands.length) % flatFilteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatFilteredCommands[selectedIndex]) {
                    onExecute(flatFilteredCommands[selectedIndex].id);
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, flatFilteredCommands, onClose, onExecute]);


    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '15vh', zIndex: 9999, animation: 'fadeIn 0.15s ease-out'
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

            <div style={{
                width: '100%', maxWidth: '600px', backgroundColor: t.surface,
                borderRadius: t.r12, border: `1px solid ${t.borderHover}`,
                boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Search Input */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
                    <Search size={20} color={t.text3} style={{ flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search for commands..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', color: t.text1,
                            fontSize: '16px', outline: 'none', marginLeft: '12px'
                        }}
                    />
                    <div style={{ fontSize: '11px', color: t.text4, display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <kbd style={{ padding: '2px 6px', backgroundColor: t.bg, borderRadius: '4px', border: `1px solid ${t.border}` }}>ESC</kbd> to close
                    </div>
                </div>

                {/* Command List */}
                <div ref={listRef} style={{ maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
                    {flatFilteredCommands.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: t.text4, fontSize: '14px' }}>
                            No commands found for "{query}"
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category} style={{ marginBottom: '8px' }}>
                                <div style={{
                                    padding: '8px 12px', fontSize: '11px', fontWeight: 600,
                                    color: t.text4, textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {category}
                                </div>
                                {cmds.map(cmd => {
                                    const index = flatFilteredCommands.findIndex(c => c.id === cmd.id);
                                    const isSelected = index === selectedIndex;

                                    return (
                                        <div
                                            key={cmd.id}
                                            data-selected={isSelected}
                                            onClick={() => { onExecute(cmd.id); onClose(); }}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                                                backgroundColor: isSelected ? t.accentDim : 'transparent',
                                                borderLeft: `2px solid ${isSelected ? t.accent : 'transparent'}`,
                                                color: isSelected ? t.text1 : t.text2,
                                                transition: 'all 0.1s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ color: isSelected ? t.accent : t.text3 }}>{cmd.icon}</div>
                                                <span style={{ fontSize: '14px', fontWeight: isSelected ? 500 : 400 }}>{cmd.label}</span>
                                            </div>
                                            {cmd.shortcut && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {cmd.shortcut.split('+').map((key, i) => (
                                                        <kbd key={i} style={{
                                                            fontSize: '11px', padding: '2px 6px', color: t.text4,
                                                            backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : t.bg,
                                                            borderRadius: '4px', border: `1px solid ${isSelected ? 'rgba(255,255,255,0.1)' : t.border}`
                                                        }}>{key}</kbd>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideDown { 
                    from { opacity: 0; transform: translateY(-16px) scale(0.98); } 
                    to { opacity: 1; transform: translateY(0) scale(1); } 
                }
                /* Custom scrollbar for palette */
                div::-webkit-scrollbar { width: 6px; }
                div::-webkit-scrollbar-track { background: transparent; }
                div::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
                div::-webkit-scrollbar-thumb:hover { background: #52525b; }
            `}</style>
        </div>
    );
}
