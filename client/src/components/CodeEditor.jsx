import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import socket from '../services/socket';
import { Play, Square, Terminal, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, VOXA!" << endl;
    return 0;
}
`;

const WANDBOX_URL = 'https://wandbox.org/api/compile.json';

const CodeEditor = ({ roomId, userName, initialData }) => {
    const [code, setCode] = useState(initialData?.codeData || DEFAULT_CODE);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [stdinInput, setStdinInput] = useState('');
    const [showOutput, setShowOutput] = useState(true);
    const [typingUser, setTypingUser] = useState(null);
    const isRemoteUpdate = useRef(false);
    const emitTimer = useRef(0);
    const cursorEmitTimer = useRef(0);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const typingTimeout = useRef(null);
    const remoteCursors = useRef({}); // { userName: { line, col } }
    const decorationsRef = useRef([]);

    // Store editor reference
    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Emit cursor position on change
        editor.onDidChangeCursorPosition((e) => {
            const now = Date.now();
            if (now - cursorEmitTimer.current < 80) return;
            cursorEmitTimer.current = now;
            socket.emit('cursor-change', {
                roomId,
                userName,
                line: e.position.lineNumber,
                col: e.position.column,
            });
        });
    };

    // Sync code changes to other users (throttled)
    const emitCode = useCallback((newCode) => {
        const now = Date.now();
        if (now - emitTimer.current < 100) return;
        emitTimer.current = now;
        socket.emit('code-change', { roomId, code: newCode, userName });
    }, [roomId, userName]);

    // Handle local code change
    const handleCodeChange = (value) => {
        setCode(value || '');
        if (!isRemoteUpdate.current) {
            emitCode(value || '');
        }
    };

    // Receive remote code changes
    useEffect(() => {
        if (!socket) return;
        const handler = (data) => {
            isRemoteUpdate.current = true;
            setCode(data.code);
            if (editorRef.current) {
                const model = editorRef.current.getModel();
                if (model && model.getValue() !== data.code) {
                    editorRef.current.setValue(data.code);
                }
            }
            isRemoteUpdate.current = false;
            // Show who is typing
            if (data.userName) {
                setTypingUser(data.userName);
                clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => setTypingUser(null), 2000);
            }
        };
        // Receive remote output (synced run)
        const outputHandler = (data) => {
            setOutput(data.output);
            setIsRunning(data.running);
            setShowOutput(true);
        };
        socket.on('code-change', handler);
        socket.on('code-output', outputHandler);

        // Receive remote cursor positions
        const cursorHandler = (data) => {
            if (data.userName === userName) return;
            remoteCursors.current[data.userName] = { line: data.line, col: data.col };
            renderRemoteCursors();
        };
        socket.on('cursor-change', cursorHandler);

        return () => {
            socket.off('code-change', handler);
            socket.off('code-output', outputHandler);
            socket.off('cursor-change', cursorHandler);
        };
    }, []);

    // Cursor colors palette
    const CURSOR_COLORS = ['#f97316', '#06b6d4', '#ec4899', '#84cc16', '#eab308', '#8b5cf6'];
    const getUserColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
    };

    // Render remote cursor decorations in Monaco
    const renderRemoteCursors = () => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        const newDecorations = [];
        Object.entries(remoteCursors.current).forEach(([name, pos]) => {
            const color = getUserColor(name);
            const className = `remote-cursor-${name.replace(/\s/g, '-')}`;

            // Inject dynamic CSS for this user if not already present
            if (!document.getElementById(`cursor-style-${className}`)) {
                const style = document.createElement('style');
                style.id = `cursor-style-${className}`;
                style.textContent = `
                    .${className} {
                        background: ${color}30;
                        border-left: 2px solid ${color};
                    }
                `;
                document.head.appendChild(style);
            }

            newDecorations.push({
                range: new monaco.Range(pos.line, pos.col, pos.line, pos.col + 1),
                options: {
                    className: className,
                    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                },
            });
        });

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    };

    // Run code via Wandbox API
    const handleRun = async () => {
        setIsRunning(true);
        setShowOutput(true);
        const runningMsg = '⏳ Compiling & running...\n';
        setOutput(runningMsg);
        socket.emit('code-output', { roomId, output: runningMsg, running: true });

        try {
            const res = await fetch(WANDBOX_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: code,
                    compiler: 'gcc-head',
                    options: '',
                    stdin: stdinInput,
                }),
            });

            const data = await res.json();
            let finalOutput;

            if (data.compiler_error) {
                finalOutput = `❌ Compilation Error:\n${data.compiler_error}`;
            } else if (data.program_output !== undefined) {
                let result = data.program_output || '';
                if (data.program_error) result += `\n⚠️ Stderr:\n${data.program_error}`;
                if (data.status !== '0' && data.signal) result += `\n⏰ Signal: ${data.signal}`;
                finalOutput = result || '(No output)';
            } else {
                finalOutput = '❌ Unexpected response';
            }

            setOutput(finalOutput);
            socket.emit('code-output', { roomId, output: finalOutput, running: false });
        } catch (err) {
            const errMsg = `❌ Network error: ${err.message}`;
            setOutput(errMsg);
            socket.emit('code-output', { roomId, output: errMsg, running: false });
        } finally {
            setIsRunning(false);
        }
    };

    // Stop button
    const handleStop = () => {
        setOutput(prev => prev + '\n🛑 Stopped');
        setIsRunning(false);
    };

    // Refresh — reset code to default template
    const handleRefresh = () => {
        setCode(DEFAULT_CODE);
        setOutput('');
        if (editorRef.current) editorRef.current.setValue(DEFAULT_CODE);
        socket.emit('code-change', { roomId, code: DEFAULT_CODE });
    };

    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            backgroundColor: '#0c0c11', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}>
            {/* Top bar — language label + run button */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                zIndex: 10,
            }}>
                {/* Language badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.2)',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                        C++
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 500, letterSpacing: '0.02em' }}>GCC 10.2.0</span>

                    {/* Typing indicator */}
                    {typingUser && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                            backgroundColor: 'rgba(124,58,237,0.1)', color: '#c084fc',
                            border: '1px solid rgba(124,58,237,0.2)',
                            boxShadow: '0 0 12px rgba(124,58,237,0.1)',
                            animation: 'fade-in 0.2s ease', fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                backgroundColor: '#c084fc', animation: 'pulse 1s infinite',
                            }} />
                            {typingUser} is typing...
                        </div>
                    )}

                    {/* Refresh button */}
                    <button
                        onClick={handleRefresh}
                        title="Reset to template"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                            background: 'transparent', color: 'rgba(255,255,255,0.3)',
                            cursor: 'pointer', transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <RotateCcw style={{ width: '14px', height: '14px' }} />
                    </button>
                </div>

                {/* Run / Stop */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Stdin input */}
                    <input
                        value={stdinInput}
                        onChange={e => setStdinInput(e.target.value)}
                        placeholder="stdin (optional)"
                        style={{
                            width: '160px', padding: '6px 12px', fontSize: '12px',
                            backgroundColor: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                            outline: 'none', fontFamily: 'monospace', transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(56,189,248,0.4)'; e.target.style.boxShadow = '0 0 0 2px rgba(56,189,248,0.1)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />

                    {isRunning ? (
                        <button
                            onClick={handleStop}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.2)',
                                background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, -apple-system, sans-serif',
                                display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                        >
                            <Square style={{ width: '12px', height: '12px' }} fill="currentColor" />
                            Stop
                        </button>
                    ) : (
                        <button
                            onClick={handleRun}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 16px', borderRadius: '8px', border: 'none',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, -apple-system, sans-serif',
                                boxShadow: '0 2px 12px rgba(16,185,129,0.3)', textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                display: 'flex', alignItems: 'center', transition: 'all 0.15s cubic-bezier(0.16,1,0.3,1)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(16,185,129,0.3)'; }}
                        >
                            <Play style={{ width: '12px', height: '12px' }} fill="currentColor" />
                            Run
                        </button>
                    )}
                </div>
            </div>

            {/* Monaco Editor */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <Editor
                    height="100%"
                    language="cpp"
                    theme="vs-dark"
                    value={code}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
                    options={{
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        lineNumbers: 'on',
                        lineNumbersMinChars: 3,
                        roundedSelection: true,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        formatOnPaste: true,
                    }}
                />
            </div>

            {/* Output Panel */}
            <div style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: '#050508', // pure dark for console
                boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
                zIndex: 10,
            }}>
                {/* Output header */}
                <div
                    onClick={() => setShowOutput(!showOutput)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 16px', cursor: 'pointer', userSelect: 'none',
                        transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Terminal style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.4)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Console Output</span>
                        {isRunning && (
                            <div style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                backgroundColor: '#10b981', animation: 'pulse 1s infinite', marginLeft: '4px'
                            }} />
                        )}
                    </div>
                    {showOutput ? (
                        <ChevronDown style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                    ) : (
                        <ChevronUp style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.3)' }} />
                    )}
                </div>

                {/* Output content */}
                {showOutput && (
                    <pre style={{
                        margin: 0, padding: '12px 16px 16px', fontSize: '13px', fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        color: output.includes('❌') ? '#f87171' : output.includes('⚠️') ? '#fbbf24' : '#6ee7b7',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        maxHeight: '200px', overflow: 'auto',
                        lineHeight: 1.6,
                    }}>
                        {output || 'System ready. Click "Run" to compile and execute your C++ code. //'}
                    </pre>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; boxShadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { opacity: 0.6; boxShadow: 0 0 0 4px rgba(16, 185, 129, 0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                /* Monaco Editor Scrollbar overrides for premium feel */
                .monaco-editor .invisible {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
};

export default CodeEditor;
