import { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { motion } from 'framer-motion';
import { Pencil, Eraser, Trash2, Moon, Sun, Hand, Minus, Plus, MousePointer2, Square, Circle, Triangle, Type, Copy, Clipboard, ArrowUp, ArrowDown, ArrowUpRight } from 'lucide-react';
import socket from '../services/socket';
import { initSnapping } from '../utils/snapping';
import { useAuth } from '../context/AuthContext';
import LiveCursors from './LiveCursors';
import ContextualToolbar from './ContextualToolbar';

/* ──────────────────────────────────────────────
   DESIGN TOKENS
   ────────────────────────────────────────────── */
const PALETTE = [
    '#ffffff', '#a3a3a3', '#525252',
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#d946ef', '#ec4899',
];

const BRUSH_SIZES = [
    { value: 2, label: 'S' },
    { value: 4, label: 'M' },
    { value: 8, label: 'L' },
    { value: 14, label: 'XL' },
];

/* ──────────────────────────────────────────────
   WHITEBOARD COMPONENT
   ────────────────────────────────────────────── */
export default function Whiteboard({ roomId, followingId, initialData, isDarkMode, onToggleTheme }) {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const activeCanvasRef = useRef(null);
    const activeCtxRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const isDrawingRef = useRef(false);

    // Add ref to track followingId without dependency loops in socket effects
    const followingIdRef = useRef(followingId);
    useEffect(() => { followingIdRef.current = followingId; }, [followingId]);

    // Viewport state
    const viewportRef = useRef({ zoom: 1, offsetX: 0, offsetY: 0 });
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const isRemoteVpRef = useRef(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // Toolbar state
    const [color, setColor] = useState('#ffffff');
    const [width, setWidth] = useState(3);
    const [tool, setTool] = useState('pencil');
    const darkMode = isDarkMode;
    const [showPalette, setShowPalette] = useState(false);

    // Refs for event handlers to access latest state without re-binding
    const toolRef = useRef(tool);
    const colorRef = useRef(color);
    const widthRef = useRef(width);

    useEffect(() => { toolRef.current = tool; }, [tool]);
    useEffect(() => { colorRef.current = color; }, [color]);
    useEffect(() => { widthRef.current = width; }, [width]);

    // Command Palette Listener
    useEffect(() => {
        const handleCommand = (e) => {
            const { commandId } = e.detail;
            if (!canvas) return;

            // Tools
            if (commandId.startsWith('tool-')) {
                const newTool = commandId.replace('tool-', '');
                if (newTool === 'eraser') {
                    canvas.isDrawingMode = true;
                    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
                    canvas.freeDrawingBrush.width = 20;
                } else if (newTool === 'pen') {
                    canvas.isDrawingMode = false;
                } else {
                    canvas.isDrawingMode = false;
                }
                setTool(newTool === 'pen' ? 'pencil' : newTool);
            }

            // View Actions
            if (commandId === 'view-zoom-in') handleZoom(0.1);
            if (commandId === 'view-zoom-out') handleZoom(-0.1);
            if (commandId === 'view-zoom-fit') {
                const objects = canvas.getObjects();
                if (objects.length > 0) {
                    const group = new fabric.Group(objects);
                    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
                    canvas.zoomToBoundingBox(group.getBoundingRect(), { padding: 50 });
                } else {
                    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
                }
                canvas.requestRenderAll();
                viewportRef.current = { zoom: canvas.getZoom(), offsetX: canvas.viewportTransform[4], offsetY: canvas.viewportTransform[5] };
            }

            // Canvas Actions
            if (commandId === 'action-clear') {
                canvas.clear();
                canvas.backgroundColor = '#18181b';
                socket.emit('draw-data', { roomId, data: { action: 'clear' } });
            }
            if (commandId === 'action-export') {
                const dataURL = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 2 });
                const link = document.createElement('a');
                link.download = `voxa-board-${roomId}.png`;
                link.href = dataURL;
                link.click();
            }
        };

        window.addEventListener('voxa-command', handleCommand);
        return () => window.removeEventListener('voxa-command', handleCommand);
    }, [canvas, roomId]);

    // Remote drawing
    const remotePathsRef = useRef({});

    // Live Cursors
    const [cursors, setCursors] = useState({});

    // Context Menu
    const [contextMenu, setContextMenu] = useState(null);
    const clipboardRef = useRef(null);

    const [hasInteracted, setHasInteracted] = useState(initialData?.whiteboardObjects?.length > 0);
    const [isLost, setIsLost] = useState(false);


    /* ═══════════════════════════════════════════
       CANVAS INITIALIZATION
       ═══════════════════════════════════════════ */
    useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) return;
        const newCanvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
            width: wrapperRef.current.clientWidth || 800,
            height: wrapperRef.current.clientHeight || 600,
            backgroundColor: '', // transparent
        });

        // Ensure stroke width doesn't scale when objects are resized
        fabric.Object.prototype.strokeUniform = true;

        // Listen for interactions to hide empty state
        newCanvas.on('mouse:down', () => setHasInteracted(true));

        const brush = new fabric.PencilBrush(newCanvas);
        brush.color = '#ffffff';
        brush.width = 3;
        newCanvas.freeDrawingBrush = brush;
        setCanvas(newCanvas);

        // Initialize snapping behavior
        initSnapping(newCanvas);

        if (initialData?.whiteboardObjects?.length > 0) {
            fabric.util.enlivenObjects(initialData.whiteboardObjects).then(objects => {
                objects.forEach(obj => newCanvas.add(obj));
                newCanvas.requestRenderAll();
            }).catch(console.error);
        }

        return () => { newCanvas.dispose(); setCanvas(null); };
    }, [roomId]);

    /* ═══════════════════════════════════════════
       ACTIVE CANVAS INITIALIZATION & DRAWING
       ═══════════════════════════════════════════ */
    useEffect(() => {
        if (!activeCanvasRef.current || !wrapperRef.current) return;
        const resizeActiveCanvas = () => {
            if (!activeCanvasRef.current || !wrapperRef.current) return;
            const dpr = window.devicePixelRatio || 1;
            activeCanvasRef.current.width = wrapperRef.current.clientWidth * dpr;
            activeCanvasRef.current.height = wrapperRef.current.clientHeight * dpr;
            activeCanvasRef.current.style.width = `${wrapperRef.current.clientWidth}px`;
            activeCanvasRef.current.style.height = `${wrapperRef.current.clientHeight}px`;
            const ctx = activeCanvasRef.current.getContext('2d', { desynchronized: true });
            activeCtxRef.current = ctx;
        };
        resizeActiveCanvas();
        const ro = new ResizeObserver(resizeActiveCanvas);
        ro.observe(wrapperRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const activeLayer = activeCanvasRef.current;
        if (!activeLayer || !canvas) return;

        let points = [];
        let isDrawing = false;
        let rAFId = null;
        let needsRender = false;
        let lastEmitTime = 0;

        const renderStroke = () => {
            if (!needsRender) {
                rAFId = window.requestAnimationFrame(renderStroke);
                return;
            }
            needsRender = false;
            const ctx = activeCtxRef.current;
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, activeLayer.width, activeLayer.height);
            if (points.length === 0) {
                rAFId = window.requestAnimationFrame(renderStroke);
                return;
            }

            const vp = viewportRef.current;
            ctx.save();
            ctx.scale(dpr, dpr);
            ctx.translate(vp.offsetX, vp.offsetY);
            ctx.scale(vp.zoom, vp.zoom);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = colorRef.current;
            ctx.lineWidth = widthRef.current;

            ctx.beginPath();
            if (points.length < 3) {
                ctx.moveTo(points[0].x, points[0].y);
                ctx.lineTo(points[0].x, points[0].y + 0.001);
            } else {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length - 1; i++) {
                    const xc = (points[i].x + points[i + 1].x) / 2;
                    const yc = (points[i].y + points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                }
                ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            }
            ctx.stroke();
            ctx.restore();

            rAFId = window.requestAnimationFrame(renderStroke);
        };

        const getCanvasPoint = (e) => {
            const rect = activeLayer.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const vp = viewportRef.current;
            return {
                x: (screenX - vp.offsetX) / vp.zoom,
                y: (screenY - vp.offsetY) / vp.zoom
            };
        };

        const onPointerDown = (e) => {
            if (toolRef.current !== 'pencil' || e.button !== 0) return;
            isDrawing = true;
            setHasInteracted(true);
            points = [getCanvasPoint(e)];
            needsRender = true;
            activeLayer.setPointerCapture(e.pointerId);

            socket.emit('interaction-start', {
                roomId,
                data: { x: points[0].x, y: points[0].y, color: colorRef.current, width: widthRef.current }
            });
        };

        const onPointerMove = (e) => {
            if (!isDrawing) return;
            const pt = getCanvasPoint(e);
            const lastPt = points[points.length - 1];

            // Distance-based thinning
            if (Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) > 2 / viewportRef.current.zoom) {
                points.push(pt);
                needsRender = true;

                const now = Date.now();
                if (now - lastEmitTime > 25) {
                    lastEmitTime = now;
                    socket.emit('interaction-update', { roomId, data: { x: pt.x, y: pt.y } });
                }
            }
        };

        const onPointerUp = (e) => {
            if (!isDrawing) return;
            isDrawing = false;
            activeLayer.releasePointerCapture(e.pointerId);

            const ctx = activeCtxRef.current;
            if (ctx) ctx.clearRect(0, 0, activeLayer.width, activeLayer.height);
            needsRender = false;

            if (points.length > 0) {
                let pathString = '';
                if (points.length < 3) {
                    pathString = `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y + 0.001}`;
                } else {
                    pathString = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 1; i < points.length - 1; i++) {
                        const xc = (points[i].x + points[i + 1].x) / 2;
                        const yc = (points[i].y + points[i + 1].y) / 2;
                        pathString += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
                    }
                    pathString += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
                }

                const path = new fabric.Path(pathString, {
                    fill: '',
                    stroke: colorRef.current,
                    strokeWidth: widthRef.current,
                    strokeLineCap: 'round',
                    strokeLineJoin: 'round',
                    id: Date.now().toString(36) + Math.random().toString(36).substring(2),
                    selectable: true,
                    evented: true
                });

                canvas.add(path);
                canvas.requestRenderAll();
                socket.emit('draw-data', { roomId, data: path.toObject(['id']) });

                // Trigger canvas mouse:up so the checkLost effect registers the new object bounds
                canvas.fire('mouse:up');
            }
            points = [];
            socket.emit('interaction-end', { roomId });
        };

        activeLayer.addEventListener('pointerdown', onPointerDown);
        activeLayer.addEventListener('pointermove', onPointerMove);
        activeLayer.addEventListener('pointerup', onPointerUp);
        activeLayer.addEventListener('pointercancel', onPointerUp);
        rAFId = window.requestAnimationFrame(renderStroke);

        return () => {
            activeLayer.removeEventListener('pointerdown', onPointerDown);
            activeLayer.removeEventListener('pointermove', onPointerMove);
            activeLayer.removeEventListener('pointerup', onPointerUp);
            activeLayer.removeEventListener('pointercancel', onPointerUp);
            if (rAFId) window.cancelAnimationFrame(rAFId);
        };
    }, [canvas, roomId]);

    // Viewport Lost Check Effect
    useEffect(() => {
        if (!canvas) return;
        const checkLost = () => {
            const objects = canvas.getObjects();
            if (objects.length === 0) {
                setIsLost(false);
                return;
            }
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            objects.forEach(obj => {
                const br = obj.getBoundingRect(true, true);
                if (br.left < minX) minX = br.left;
                if (br.top < minY) minY = br.top;
                if (br.left + br.width > maxX) maxX = br.left + br.width;
                if (br.top + br.height > maxY) maxY = br.top + br.height;
            });

            const vpt = canvas.viewportTransform;
            const zoom = canvas.getZoom();
            const cvsW = canvas.getWidth();
            const cvsH = canvas.getHeight();

            const viewMinX = -vpt[4] / zoom;
            const viewMinY = -vpt[5] / zoom;
            const viewMaxX = viewMinX + cvsW / zoom;
            const viewMaxY = viewMinY + cvsH / zoom;

            // Margin threshold for considering the user "lost" (half screen away)
            const marginX = cvsW / zoom * 0.5;
            const marginY = cvsH / zoom * 0.5;
            const isOutside = viewMaxX < minX - marginX ||
                viewMinX > maxX + marginX ||
                viewMaxY < minY - marginY ||
                viewMinY > maxY + marginY;

            setIsLost(isOutside);
        };

        canvas.on('mouse:up', checkLost);
        canvas.on('mouse:wheel', checkLost);
        return () => {
            canvas.off('mouse:up', checkLost);
            canvas.off('mouse:wheel', checkLost);
        };
    }, [canvas]);

    const handleReturnToContent = () => {
        if (!canvas) return;
        const objects = canvas.getObjects();
        let targetZoom = 1;
        let targetOffsetX = 0;
        let targetOffsetY = 0;

        if (objects.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            objects.forEach(obj => {
                const br = obj.getBoundingRect(true, true);
                if (br.left < minX) minX = br.left;
                if (br.top < minY) minY = br.top;
                if (br.left + br.width > maxX) maxX = br.left + br.width;
                if (br.top + br.height > maxY) maxY = br.top + br.height;
            });
            const contentCenterX = minX + (maxX - minX) / 2;
            const contentCenterY = minY + (maxY - minY) / 2;
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            targetOffsetX = (canvasWidth / 2) - (contentCenterX * targetZoom);
            targetOffsetY = (canvasHeight / 2) - (contentCenterY * targetZoom);
        }

        const startZoom = viewportRef.current.zoom;
        const startOffsetX = viewportRef.current.offsetX;
        const startOffsetY = viewportRef.current.offsetY;
        const duration = 600;
        const startTime = performance.now();
        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const animateVp = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeOutQuart(progress);

            const nv = {
                zoom: startZoom + (targetZoom - startZoom) * ease,
                offsetX: startOffsetX + (targetOffsetX - startOffsetX) * ease,
                offsetY: startOffsetY + (targetOffsetY - startOffsetY) * ease
            };

            viewportRef.current = nv;
            applyVp(canvas, nv);
            emitVp(nv);

            if (progress < 1) {
                requestAnimationFrame(animateVp);
            } else {
                setIsLost(false);
            }
        };
        requestAnimationFrame(animateVp);
    };

    /* ═══════════════════════════════════════════
       SOCKET DRAWING EVENTS
       ═══════════════════════════════════════════ */
    useEffect(() => {
        if (!canvas || !socket) return;

        const handleMouseDown = (opt) => {
            if (!opt.e) return;
            const pointer = canvas.getScenePoint(opt.e);

            const currentTool = toolRef.current;
            const currentColor = colorRef.current;
            const currentWidth = widthRef.current;

            // Placing shapes or text
            if (['square', 'circle', 'triangle', 'arrow', 'text'].includes(currentTool)) {
                let shape;
                const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
                if (currentTool === 'square') {
                    shape = new fabric.Rect({ left: pointer.x - 50, top: pointer.y - 50, fill: 'transparent', stroke: currentColor, strokeWidth: currentWidth, width: 100, height: 100, id });
                } else if (currentTool === 'circle') {
                    shape = new fabric.Circle({ left: pointer.x - 50, top: pointer.y - 50, fill: 'transparent', stroke: currentColor, strokeWidth: currentWidth, radius: 50, id });
                } else if (currentTool === 'triangle') {
                    shape = new fabric.Triangle({ left: pointer.x - 50, top: pointer.y - 50, fill: 'transparent', stroke: currentColor, strokeWidth: currentWidth, width: 100, height: 100, id });
                } else if (currentTool === 'arrow') {
                    const line = new fabric.Line([0, 25, 100, 25], { stroke: currentColor, strokeWidth: currentWidth, originX: 'center', originY: 'center' });
                    const head = new fabric.Triangle({ width: 20 * (currentWidth / 3), height: 20 * (currentWidth / 3), fill: currentColor, left: 100, top: 25, originX: 'center', originY: 'center', angle: 90 });
                    shape = new fabric.Group([line, head], { left: pointer.x - 50, top: pointer.y - 25, id });
                } else if (currentTool === 'text') {
                    shape = new fabric.IText('Text', { left: pointer.x, top: pointer.y, fill: currentColor, fontFamily: 'sans-serif', fontSize: Math.max(24, currentWidth * 8), id });
                }

                if (shape) {
                    canvas.add(shape);
                    canvas.setActiveObject(shape);
                    socket.emit('draw-data', { roomId, data: shape.toObject(['id']) });
                    setTool('select');
                }
                return;
            }

            if (!canvas.isDrawingMode) return;
            isDrawingRef.current = true;
            const brush = canvas.freeDrawingBrush;
            if (!brush) return;

            socket.emit('interaction-start', {
                roomId,
                data: { x: pointer.x, y: pointer.y, color: brush.color || 'black', width: brush.width || 3 }
            });
        };

        let lastTime = 0;
        const handleMouseMove = (opt) => {
            if (!isDrawingRef.current) return;
            if (opt.e.buttons !== 1) {
                isDrawingRef.current = false;
                socket.emit('interaction-end', { roomId });
                return;
            }
            const now = Date.now();
            if (now - lastTime < 25) return;
            lastTime = now;
            const pointer = canvas.getScenePoint(opt.e);
            socket.emit('interaction-update', { roomId, data: { x: pointer.x, y: pointer.y } });
        };

        const handleMouseUp = () => {
            if (!isDrawingRef.current) return;
            isDrawingRef.current = false;
            socket.emit('interaction-end', { roomId });
        };

        const handlePathCreated = (e) => {
            const obj = e.path;
            if (!obj.id) obj.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
            socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);
        canvas.on('path:created', handlePathCreated);

        const handleObjectModified = (e) => {
            const obj = e.target;
            if (obj && obj.id) {
                socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
            }
        };
        canvas.on('object:modified', handleObjectModified);

        // ── Text sync: emit while user is typing (throttled) ──
        let textEmitTimer = null;
        const handleTextChanged = (e) => {
            const obj = e.target;
            if (!obj || !obj.id) return;
            // Throttle to max 1 emit per 150ms to avoid flooding
            clearTimeout(textEmitTimer);
            textEmitTimer = setTimeout(() => {
                socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
            }, 150);
        };
        canvas.on('text:changed', handleTextChanged);

        // ── Text sync: always emit the final state when editing finishes ──
        const handleEditingExited = (e) => {
            const obj = e.target;
            if (obj && obj.id) {
                clearTimeout(textEmitTimer); // cancel any pending throttled emit
                socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
            }
        };
        canvas.on('editing:exited', handleEditingExited);

        // Force IText editing inside groups on double click
        const handleDblClick = (opt) => {
            let target = opt.target;
            // Fabric 7 supports subTargets for groups with subTargetCheck = true
            if (opt.subTargets && opt.subTargets.length > 0) {
                // Find first i-text in subtargets (often the deepest element)
                target = opt.subTargets.find(t => t.type === 'i-text' || t.type === 'text') || opt.subTargets[0];
            }
            if (target && target.type === 'i-text') {
                canvas.setActiveObject(target);
                target.enterEditing();
                target.selectAll();
                canvas.requestRenderAll();
            }
        };
        canvas.on('mouse:dblclick', handleDblClick);

        // --- Multiplayer Selection Sync ---
        const handleSelectionEmit = () => {
            const activeObjects = canvas.getActiveObjects();
            const objectIds = activeObjects.map(o => o.id).filter(Boolean);

            let hash = 0; const idStr = user?._id || '';
            for (let i = 0; i < idStr.length; i++) hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            const userColor = PALETTE[Math.abs(hash) % PALETTE.length] || '#7c3aed';

            socket.emit('selection-change', { roomId, objectIds, color: userColor, name: user?.name || 'Anonymous' });
        };
        canvas.on('selection:created', handleSelectionEmit);
        canvas.on('selection:updated', handleSelectionEmit);
        canvas.on('selection:cleared', handleSelectionEmit);

        // Remote drawing handlers
        const handleRemoteStart = ({ x, y, color, width, socketId }) => {
            setHasInteracted(true);
            if (remotePathsRef.current[socketId]) {
                remotePathsRef.current[socketId].lines.forEach(l => canvas.remove(l));
            }
            remotePathsRef.current[socketId] = { lines: [], lastX: x, lastY: y, color, width };
        };

        const handleRemoteUpdate = ({ x, y, socketId }) => {
            const remote = remotePathsRef.current[socketId];
            if (!remote) return;
            const line = new fabric.Line([remote.lastX, remote.lastY, x, y], {
                stroke: remote.color, strokeWidth: remote.width,
                selectable: false, evented: false,
                originX: 'center', originY: 'center',
                strokeLineCap: 'round', strokeLineJoin: 'round', opacity: 0.8,
            });
            canvas.add(line);
            remote.lines.push(line);
            remote.lastX = x; remote.lastY = y;
            canvas.requestRenderAll();
        };

        const handleRemoteEnd = ({ socketId }) => {
            if (socketId && remotePathsRef.current[socketId]) {
                remotePathsRef.current[socketId].lines.forEach(l => canvas.remove(l));
                canvas.requestRenderAll();
                delete remotePathsRef.current[socketId];
            }
        };

        socket.on('interaction-start', handleRemoteStart);
        socket.on('interaction-update', handleRemoteUpdate);
        socket.on('interaction-end', handleRemoteEnd);

        const handleReceiveDraw = async (data) => {
            setHasInteracted(true);
            try {
                if (data.id) {
                    const existingObj = canvas.getObjects().find(o => o.id === data.id);
                    if (existingObj) {
                        existingObj.set(data);
                        existingObj.setCoords();
                        canvas.requestRenderAll();
                        return;
                    }
                }
                const objects = await fabric.util.enlivenObjects([data]);
                objects.forEach(obj => canvas.add(obj));
                canvas.requestRenderAll();
            } catch (err) { console.error('Error syncing drawing:', err); }
        };
        socket.on('draw-data', handleReceiveDraw);

        const handleDeleteObject = (objectId) => {
            const existingObj = canvas.getObjects().find(o => o.id === objectId);
            if (existingObj) {
                canvas.remove(existingObj);
                canvas.requestRenderAll();
            }
        };
        socket.on('delete-object', handleDeleteObject);

        // --- Live Cursors ---
        const handleCursorMove = ({ socketId, x, y, name, color, userId }) => {
            setCursors(prev => ({
                ...prev,
                [socketId]: { x, y, name, color }
            }));

            // Follow Mode: Pan viewport to center on this user's cursor
            if (followingIdRef.current && (userId === followingIdRef.current || socketId === followingIdRef.current)) {
                if (canvas) {
                    const canvasWidth = canvas.getWidth();
                    const canvasHeight = canvas.getHeight();
                    const vp = canvas.viewportTransform;
                    const zoom = vp[0];
                    vp[4] = (canvasWidth / 2) - (x * zoom);
                    vp[5] = (canvasHeight / 2) - (y * zoom);
                    canvas.setViewportTransform(vp);
                    canvas.requestRenderAll();
                }
            }
        };
        const handleUserLeft = ({ socketId }) => {
            setCursors(prev => {
                const newCursors = { ...prev };
                delete newCursors[socketId];
                return newCursors;
            });
            // Clear their selections
            const prevSel = remoteSelectionsRef.current[socketId]?.objectIds || [];
            if (prevSel.length) {
                canvas.getObjects().forEach(o => {
                    if (prevSel.includes(o.id)) o.set('shadow', null);
                });
                canvas.requestRenderAll();
            }
            delete remoteSelectionsRef.current[socketId];
        };

        socket.on('cursor-move', handleCursorMove);
        socket.on('user-disconnected', handleUserLeft); // Assuming server sends this or something similar, or we just clean up if no update for 5s. 
        socket.on('user-left', handleUserLeft); // Fallback if server uses user-left for room leave

        const handleRemoteSelection = ({ socketId, objectIds, color, name }) => {
            const prevSel = remoteSelectionsRef.current[socketId]?.objectIds || [];

            // Clear previous shadows
            canvas.getObjects().forEach(o => {
                if (prevSel.includes(o.id)) o.set('shadow', null);
            });

            // Set new shadows
            canvas.getObjects().forEach(o => {
                if (objectIds.includes(o.id)) {
                    o.set('shadow', new fabric.Shadow({
                        color: color,
                        blur: 15,
                        offsetX: 0,
                        offsetY: 0
                    }));
                }
            });

            remoteSelectionsRef.current[socketId] = { objectIds, color, name };
            canvas.requestRenderAll();
        };
        socket.on('selection-change', handleRemoteSelection);

        const staleInterval = setInterval(() => {
            // we could clean up cursors here if needed, but skipping for now to keep it simple.
        }, 10000);

        const handleCanvasMouseMove = (opt) => {
            if (!opt.e) return;
            const pointer = canvas.getScenePoint(opt.e);

            // Generate a simple hash from user ID to pick a consistent color
            let hash = 0;
            const idStr = user?._id || '';
            for (let i = 0; i < idStr.length; i++) {
                hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
            }
            const userColor = PALETTE[Math.abs(hash) % PALETTE.length] || '#7c3aed';

            socket.emit('cursor-move', {
                roomId,
                x: pointer.x,
                y: pointer.y,
                name: user?.name || 'Anonymous',
                color: userColor,
                userId: user?._id
            });
        };
        canvas.on('mouse:move', handleCanvasMouseMove);

        const handleGlobalEnd = () => {
            if (isDrawingRef.current) {
                isDrawingRef.current = false;
                socket.emit('interaction-end', { roomId });
            }
        };
        window.addEventListener('mouseup', handleGlobalEnd);
        window.addEventListener('blur', handleGlobalEnd);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
            canvas.off('mouse:move', handleCanvasMouseMove);
            canvas.off('path:created', handlePathCreated);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('mouse:dblclick', handleDblClick);
            canvas.off('selection:created', handleSelectionEmit);
            canvas.off('selection:updated', handleSelectionEmit);
            canvas.off('selection:cleared', handleSelectionEmit);
            canvas.off('text:changed', handleTextChanged);
            canvas.off('editing:exited', handleEditingExited);
            clearTimeout(textEmitTimer);
            socket.off('interaction-start', handleRemoteStart);
            socket.off('interaction-update', handleRemoteUpdate);
            socket.off('interaction-end', handleRemoteEnd);
            socket.off('draw-data', handleReceiveDraw);
            socket.off('delete-object', handleDeleteObject);
            socket.off('cursor-move', handleCursorMove);
            socket.off('user-disconnected', handleUserLeft);
            socket.off('user-left', handleUserLeft);
            socket.off('selection-change', handleRemoteSelection);
            clearInterval(staleInterval);
            window.removeEventListener('mouseup', handleGlobalEnd);
            window.removeEventListener('blur', handleGlobalEnd);
            Object.values(remotePathsRef.current).forEach(r => r.lines.forEach(l => canvas.remove(l)));
        };
    }, [canvas, roomId, user]);

    /* ═══ Resize Observer + Fullscreen resize ═══ */
    useEffect(() => {
        if (!canvas || !wrapperRef.current) return;
        const container = wrapperRef.current;

        const resizeCanvas = () => {
            if (!container) return;
            canvas.setDimensions({ width: container.clientWidth, height: container.clientHeight });
            canvas.calcOffset();
            canvas.renderAll();
        };

        const ro = new ResizeObserver(resizeCanvas);
        ro.observe(container);

        // Force resize on fullscreen change (browser needs a tick to layout)
        const onFullscreen = () => {
            setTimeout(resizeCanvas, 50);
            setTimeout(resizeCanvas, 200);
        };
        document.addEventListener('fullscreenchange', onFullscreen);

        return () => {
            ro.disconnect();
            document.removeEventListener('fullscreenchange', onFullscreen);
        };
    }, [canvas]);

    const applyVp = (c, vp) => {
        if (!c) return;
        c.setViewportTransform([vp.zoom, 0, 0, vp.zoom, vp.offsetX, vp.offsetY]);
        c.calcOffset();
        c.requestRenderAll();
        setZoomLevel(Math.round(vp.zoom * 100));

        // Directly update DOM grid for smooth 60fps panning
        if (wrapperRef.current) {
            const gridSize = 32 * vp.zoom;
            wrapperRef.current.style.backgroundSize = `
                ${gridSize}px ${gridSize}px,
                ${gridSize}px ${gridSize}px,
                ${gridSize * 5}px ${gridSize * 5}px,
                ${gridSize * 5}px ${gridSize * 5}px
            `;
            wrapperRef.current.style.backgroundPosition = `
                ${vp.offsetX}px ${vp.offsetY}px,
                ${vp.offsetX}px ${vp.offsetY}px,
                ${vp.offsetX}px ${vp.offsetY}px,
                ${vp.offsetX}px ${vp.offsetY}px
            `;
        }
    };

    const vpEmitTimer = useRef(0);
    const emitVp = (vp) => {
        const now = Date.now();
        if (now - vpEmitTimer.current < 30) return;
        vpEmitTimer.current = now;
        socket.emit('viewport-change', { roomId, viewport: vp });
    };

    useEffect(() => {
        if (!canvas || !wrapperRef.current) return;
        const el = wrapperRef.current;
        const onWheel = (e) => {
            // E.g. zooming with Ctrl+Scroll like Figma
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const vp = viewportRef.current;
                const factor = e.deltaY < 0 ? 1.05 : 1 / 1.05;
                const newZoom = Math.min(8, Math.max(0.1, vp.zoom * factor));
                const rect = el.getBoundingClientRect();
                const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
                const wx = (cx - vp.offsetX) / vp.zoom, wy = (cy - vp.offsetY) / vp.zoom;
                const nv = { zoom: newZoom, offsetX: cx - wx * newZoom, offsetY: cy - wy * newZoom };
                viewportRef.current = nv;
                applyVp(canvas, nv);
                emitVp(nv);
            } else {
                // Regular scroll -> Pan
                e.preventDefault();
                const vp = viewportRef.current;
                const nv = { zoom: vp.zoom, offsetX: vp.offsetX - e.deltaX, offsetY: vp.offsetY - e.deltaY };
                viewportRef.current = nv;
                applyVp(canvas, nv);
                emitVp(nv);
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [canvas, roomId]);

    /* ═══ Command Palette Listener ═══ */
    useEffect(() => {
        if (!canvas) return;
        const handleCommand = (e) => {
            const { commandId } = e.detail;
            const vp = viewportRef.current;
            let newZoom = vp.zoom;

            switch (commandId) {
                // Zoom handling
                case 'view-zoom-in':
                    newZoom = Math.min(8, vp.zoom * 1.25);
                    break;
                case 'view-zoom-out':
                    newZoom = Math.max(0.1, vp.zoom / 1.25);
                    break;
                case 'view-zoom-fit':
                    newZoom = 1;
                    viewportRef.current = { zoom: 1, offsetX: 0, offsetY: 0 };
                    applyVp(canvas, viewportRef.current);
                    emitVp(viewportRef.current);
                    return; // Early return since we completely reset the viewport

                // Tool mapping
                case 'tool-select': setTool('select'); break;
                case 'tool-pen': setTool('pencil'); break;
                case 'tool-eraser': setTool('eraser'); break;
                case 'tool-rect': setTool('square'); break;
                case 'tool-circle': setTool('circle'); break;
                case 'tool-text': setTool('text'); break;

                // Actions
                case 'action-clear':
                    if (window.confirm('Clear the entire canvas?')) handleDelete(true);
                    break;
                case 'action-export':
                    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
                    const link = document.createElement('a');
                    link.download = `whiteboard-${roomId}.png`;
                    link.href = dataURL;
                    link.click();
                    break;
                default: break;
            }

            // Apply zoom logic for zoom-in/out while trying to zoom to center
            if (['view-zoom-in', 'view-zoom-out'].includes(commandId) && wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                const cx = rect.width / 2;
                const cy = rect.height / 2;

                const wx = (cx - vp.offsetX) / vp.zoom;
                const wy = (cy - vp.offsetY) / vp.zoom;

                const nv = { zoom: newZoom, offsetX: cx - wx * newZoom, offsetY: cy - wy * newZoom };
                viewportRef.current = nv;
                applyVp(canvas, nv);
                emitVp(nv);
            }
        };

        window.addEventListener('voxa-command', handleCommand);
        return () => window.removeEventListener('voxa-command', handleCommand);
    }, [canvas, roomId]);

    /* ═══ Tool switching effects ═══ */
    useEffect(() => {
        if (!canvas) return;

        if (tool === 'hand') {
            canvas.isDrawingMode = false;
            canvas.defaultCursor = 'grab';
            canvas.selection = false;
        } else if (['select'].includes(tool)) {
            canvas.isDrawingMode = false;
            canvas.defaultCursor = 'default';
            canvas.selection = true;
        } else if (['square', 'circle', 'triangle', 'arrow', 'text'].includes(tool)) {
            canvas.isDrawingMode = false;
            canvas.defaultCursor = 'crosshair';
            canvas.selection = false;
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        } else if (tool === 'pencil') {
            canvas.isDrawingMode = false;
            canvas.defaultCursor = 'crosshair';
            canvas.selection = false;
        } else {
            canvas.isDrawingMode = true;
            canvas.defaultCursor = 'crosshair';
            canvas.selection = false;
        }

        const onDown = (opt) => {
            if (tool === 'hand' || opt.e.altKey || opt.e.button === 1) {
                isPanningRef.current = true;
                canvas.isDrawingMode = false;
                panStartRef.current = { x: opt.e.clientX, y: opt.e.clientY };
                canvas.defaultCursor = 'grabbing';
            }
        };
        const onMove = (opt) => {
            if (!isPanningRef.current) return;
            const vp = viewportRef.current;
            const dx = opt.e.clientX - panStartRef.current.x, dy = opt.e.clientY - panStartRef.current.y;
            panStartRef.current = { x: opt.e.clientX, y: opt.e.clientY };
            const nv = { zoom: vp.zoom, offsetX: vp.offsetX + dx, offsetY: vp.offsetY + dy };
            viewportRef.current = nv;
            applyVp(canvas, nv);
            emitVp(nv);
        };
        const onUp = () => {
            if (isPanningRef.current) {
                isPanningRef.current = false;
                if (tool === 'hand') canvas.defaultCursor = 'grab';
                else { canvas.isDrawingMode = true; canvas.defaultCursor = 'crosshair'; }
            }
        };
        canvas.on('mouse:down', onDown);
        canvas.on('mouse:move', onMove);
        canvas.on('mouse:up', onUp);
        return () => { canvas.off('mouse:down', onDown); canvas.off('mouse:move', onMove); canvas.off('mouse:up', onUp); };
    }, [canvas, tool]);

    /* ═══ Remote viewport sync ═══ */
    useEffect(() => {
        if (!socket || !canvas) return;
        const handler = (vp) => { isRemoteVpRef.current = true; viewportRef.current = vp; applyVp(canvas, vp); isRemoteVpRef.current = false; };
        socket.on('viewport-change', handler);
        return () => socket.off('viewport-change', handler);
    }, [socket, canvas]);

    /* ═══ Dark mode bg ═══ */
    // Background color is handled by the wrapper div CSS so the transparent canvas shows the grid.

    /* ═══ Brush settings ═══ */
    useEffect(() => {
        if (!canvas) return;

        const newBrush = new fabric.PencilBrush(canvas);
        newBrush.width = parseInt(width, 10) || 3;

        if (tool === 'eraser') {
            newBrush.color = darkMode ? '#121216' : '#f4f5f7';
        } else {
            if (darkMode && color === '#000000') newBrush.color = '#ffffff';
            else if (!darkMode && color === '#ffffff') newBrush.color = '#000000';
            else newBrush.color = color;
        }

        canvas.freeDrawingBrush = newBrush;

    }, [color, width, tool, canvas, darkMode]);



    /* ═══ Update Active Objects on Selection ═══ */
    const handleColorChange = (newColor) => {
        setColor(newColor);
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'text') {
                    obj.set('fill', newColor);
                } else if (obj.type === 'path') {
                    obj.set('stroke', newColor);
                } else {
                    obj.set('stroke', newColor);
                }
                if (obj.id) {
                    socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
                }
            });
            canvas.requestRenderAll();
        } else {
            setTool('pencil');
        }
    };

    const handleWidthChange = (newWidth) => {
        setWidth(newWidth);
        if (!canvas) return;

        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'text') {
                    obj.set('fontSize', Math.max(24, newWidth * 8));
                } else if (obj.type === 'path') {
                    obj.set('strokeWidth', newWidth);
                } else {
                    obj.set('strokeWidth', newWidth);
                }
                if (obj.id) {
                    socket.emit('draw-data', { roomId, data: obj.toObject(['id']) });
                }
            });
            canvas.requestRenderAll();
        }
    };

    /* ═══ Clear canvas ═══ */
    const handleClear = () => {
        if (!canvas) return;
        canvas.clear();
        remotePathsRef.current = {};
        canvas.renderAll();
        socket.emit('clear-canvas', { roomId });
    };

    useEffect(() => {
        if (!socket) return;
        const onClear = () => {
            if (canvas) { canvas.clear(); remotePathsRef.current = {}; canvas.renderAll(); }
        };
        socket.on('clear-canvas', onClear);
        return () => socket.off('clear-canvas', onClear);
    }, [socket, canvas, darkMode]);

    /* ═══ Remote theme sync ═══ */
    // Handled by Room.jsx now

    const handleToggleTheme = () => {
        if (onToggleTheme) onToggleTheme();
    };

    /* ═══ Keyboard shortcuts ═══ */
    useEffect(() => {
        const onKey = (e) => {
            // Ignore if typing in an input, textarea, or Monaco editor
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.closest('.monaco-editor') ||
                e.target.closest('.view-lines') ||
                e.target.closest('.monaco-mouse-cursor-text')
            ) return;

            switch (e.key.toLowerCase()) {
                case 'v': setTool('select'); break;
                case 'p': case 'b': setTool('pencil'); break;
                case 'e': setTool('eraser'); break;
                case 'r': setTool('square'); break;
                case 'o': setTool('circle'); break;
                case 't': setTool('text'); break;
                case 'h': case ' ': if (e.key === ' ') e.preventDefault(); setTool('hand'); break;
                case 'delete': case 'backspace':
                    if (e.ctrlKey || e.metaKey) handleClear();
                    else {
                        const activeObjects = canvas?.getActiveObjects();
                        if (activeObjects && activeObjects.length) {
                            activeObjects.forEach(obj => {
                                canvas.remove(obj);
                                if (obj.id) socket.emit('delete-object', { roomId, objectId: obj.id });
                            });
                            canvas.discardActiveObject();
                        }
                    }
                    break;
                case 'c':
                    if (e.ctrlKey || e.metaKey) handleCopy();
                    break;
                case 'v':
                    if (e.ctrlKey || e.metaKey) handlePaste();
                    else setTool('select');
                    break;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canvas, darkMode]);

    /* ═══ Close palette on outside click ═══ */
    useEffect(() => {
        if (!showPalette) return;
        const onClick = () => setShowPalette(false);
        setTimeout(() => window.addEventListener('click', onClick), 0);
        return () => window.removeEventListener('click', onClick);
    }, [showPalette]);

    /* ═══ Context Menu ═══ */
    useEffect(() => {
        if (!wrapperRef.current || !canvas) return;
        const handleCtx = (e) => {
            e.preventDefault();
            const target = canvas.findTarget(e, false);
            if (target) {
                const activeObjects = canvas.getActiveObjects();
                if (!activeObjects.includes(target)) {
                    canvas.setActiveObject(target);
                }
                setContextMenu({ x: e.clientX, y: e.clientY, target });
            } else {
                canvas.discardActiveObject();
                setContextMenu({ x: e.clientX, y: e.clientY, target: null });
            }
            canvas.requestRenderAll();
        };
        const el = wrapperRef.current;
        el.addEventListener('contextmenu', handleCtx);
        return () => el.removeEventListener('contextmenu', handleCtx);
    }, [canvas]);

    useEffect(() => {
        if (!contextMenu) return;
        const onClick = () => setContextMenu(null);
        window.addEventListener('click', onClick);
        return () => window.removeEventListener('click', onClick);
    }, [contextMenu]);

    const handleCopy = async () => {
        let objectsToCopy = [];
        const activeObjects = canvas?.getActiveObjects() || [];

        if (contextMenu?.target && !activeObjects.includes(contextMenu.target)) {
            objectsToCopy = [contextMenu.target];
        } else {
            objectsToCopy = activeObjects;
        }

        if (!objectsToCopy.length) return;
        clipboardRef.current = await Promise.all(objectsToCopy.map(obj => obj.clone()));
        setContextMenu(null);
    };

    const handlePaste = async () => {
        if (!clipboardRef.current || !clipboardRef.current.length || !canvas) return;
        canvas.discardActiveObject();

        const clones = await Promise.all(clipboardRef.current.map(obj => obj.clone()));
        const offset = 20;

        for (const cloned of clones) {
            cloned.set({
                left: cloned.left + offset,
                top: cloned.top + offset,
                evented: true,
                id: Date.now().toString(36) + Math.random().toString(36).substring(2)
            });
            canvas.add(cloned);
            socket.emit('draw-data', { roomId, data: cloned.toObject(['id']) });
        }

        clipboardRef.current.forEach(obj => {
            obj.top += offset;
            obj.left += offset;
        });

        if (clones.length > 1) {
            const sel = new fabric.ActiveSelection(clones, { canvas });
            canvas.setActiveObject(sel);
        } else if (clones.length === 1) {
            canvas.setActiveObject(clones[0]);
        }

        canvas.requestRenderAll();
        setContextMenu(null);
    };

    const handleDuplicate = async () => {
        await handleCopy();
        await handlePaste();
    };

    const handleBringForward = () => {
        const target = contextMenu?.target || canvas?.getActiveObject();
        if (!target) return;
        canvas.bringObjectForward(target);
        if (target.id) socket.emit('draw-data', { roomId, data: target.toObject(['id']) });
        setContextMenu(null);
    };

    const handleSendBackward = () => {
        const target = contextMenu?.target || canvas?.getActiveObject();
        if (!target) return;
        canvas.sendObjectBackwards(target);
        if (target.id) socket.emit('draw-data', { roomId, data: target.toObject(['id']) });
        setContextMenu(null);
    };

    const handleDelete = () => {
        const activeObjects = canvas?.getActiveObjects() || [];
        let objectsToDelete = [];

        if (contextMenu?.target && !activeObjects.includes(contextMenu.target)) {
            objectsToDelete = [contextMenu.target];
        } else {
            objectsToDelete = activeObjects;
        }

        if (objectsToDelete.length) {
            objectsToDelete.forEach(obj => {
                canvas.remove(obj);
                if (obj.id) socket.emit('delete-object', { roomId, objectId: obj.id });
            });
            canvas.discardActiveObject();
        }
        setContextMenu(null);
    };



    /* ═══════════════════════════════════════════
       DERIVED STYLES
       ═══════════════════════════════════════════ */
    const dm = darkMode;
    const tbBg = dm ? 'rgba(10,10,16,0.92)' : 'rgba(255,255,255,0.95)';
    const tbBorder = dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const tbShadow = dm
        ? '0 4px 24px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 4px 24px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)';
    const inact = dm ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    const sep = dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const ToolBtn = ({ active, activeBg, activeColor, activeShadow, onClick, title, children, className = '' }) => (
        <button onClick={onClick} title={title} aria-label={title} className={`wb-tool-btn ${className}`} style={{
            width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
            background: active ? (activeBg || 'linear-gradient(135deg, #7c3aed, #6366f1)') : 'transparent',
            color: active ? (activeColor || 'white') : inact,
            boxShadow: active ? (activeShadow || '0 2px 8px rgba(124,58,237,0.3)') : 'none',
        }}>
            {children}
        </button>
    );

    const Separator = ({ vertical = false }) => (
        <div style={{
            width: vertical ? '24px' : '1px',
            height: vertical ? '1px' : '24px',
            backgroundColor: sep, flexShrink: 0, margin: vertical ? '4px 0' : '0 4px'
        }} />
    );

    /* ═══════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════ */
    const vp = viewportRef.current;

    // Calculate grid pattern based on zoom/pan
    // Base grid size - scales with zoom
    const gridSize = 32 * vp.zoom;
    const gridOffsetX = vp.offsetX;
    const gridOffsetY = vp.offsetY;

    // Grid line colors (subtle and theme-aware)
    const gridColor = dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const thickGridColor = dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    return (
        <div ref={wrapperRef} style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            backgroundColor: dm ? '#121216' : '#f4f5f7',
            backgroundImage: `
                linear-gradient(to right, ${gridColor} 1px, transparent 1px),
                linear-gradient(to bottom, ${gridColor} 1px, transparent 1px),
                linear-gradient(to right, ${thickGridColor} 1px, transparent 1px),
                linear-gradient(to bottom, ${thickGridColor} 1px, transparent 1px)
            `,
            backgroundSize: `
                ${gridSize}px ${gridSize}px,
                ${gridSize}px ${gridSize}px,
                ${gridSize * 5}px ${gridSize * 5}px,
                ${gridSize * 5}px ${gridSize * 5}px
            `,
            backgroundPosition: `
                ${gridOffsetX}px ${gridOffsetY}px,
                ${gridOffsetX}px ${gridOffsetY}px,
                ${gridOffsetX}px ${gridOffsetY}px,
                ${gridOffsetX}px ${gridOffsetY}px
            `,
            transition: 'background-color 0.3s ease',
        }}>
            <LiveCursors roomId={roomId} viewport={vp} />
            <ContextualToolbar
                canvas={canvas}
                isDarkMode={dm}
                onDelete={handleDelete}
                onCopy={handleDuplicate}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onColorChange={handleColorChange}
            />

            {/* Isolate canvas so Fabric.js DOM mutations don't clash with React sibling reconciliation */}
            <div className="canvas-wrapper-isolate" style={{ position: 'absolute', inset: 0 }}>
                <canvas ref={canvasRef} />
            </div>

            {/* Active drawing overlay */}
            <canvas
                ref={activeCanvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 30,
                    pointerEvents: tool === 'pencil' ? 'auto' : 'none',
                    touchAction: 'none'
                }}
            />



            {/* ══════ FLOATING TOOLBAR (LEFT VERTICAL) ══════ */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05, delayChildren: 0.5 }
                    }
                }}
                style={{
                    position: 'absolute', top: 'calc(50% + 32px)', left: '16px', transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '8px 6px', borderRadius: '16px', zIndex: 40,
                    backgroundColor: tbBg, border: `1px solid ${tbBorder}`,
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: tbShadow,
                }}
            >

                {/* ── Tools ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -80, y: -20, rotate: -6 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} title="Select (V)">
                        <MousePointer2 size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -100, y: 15, rotate: 4 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'pencil'} onClick={() => setTool('pencil')} title="Pencil (P)">
                        <Pencil size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -60, y: -30, rotate: -3 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'eraser'}
                        activeBg="linear-gradient(135deg, #dc2626, #e11d48)" activeShadow="0 2px 8px rgba(220,38,38,0.3)"
                        onClick={() => setTool('eraser')} title="Eraser (E)">
                        <Eraser size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -90, y: 25, rotate: 6 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'hand'}
                        activeBg="linear-gradient(135deg, #0284c7, #06b6d4)" activeShadow="0 2px 8px rgba(2,132,199,0.3)"
                        onClick={() => setTool('hand')} title="Pan (H)">
                        <Hand size={18} />
                    </ToolBtn>
                </motion.div>

                <Separator vertical={true} />

                {/* ── Shapes & Text ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -110, y: -10, rotate: -4 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'square'} onClick={() => setTool('square')} title="Rectangle (R)">
                        <Square size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -70, y: 35, rotate: 5 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'circle'} onClick={() => setTool('circle')} title="Circle (O)">
                        <Circle size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -120, y: -25, rotate: -2 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'triangle'} onClick={() => setTool('triangle')} title="Triangle">
                        <Triangle size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -85, y: 10, rotate: 3 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'arrow'} onClick={() => setTool('arrow')} title="Arrow">
                        <ArrowUpRight size={18} />
                    </ToolBtn>
                </motion.div>
                <motion.div variants={{ hidden: { opacity: 0, x: -95, y: -15, rotate: -5 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} title="Text (T)">
                        <Type size={18} />
                    </ToolBtn>
                </motion.div>

                <Separator vertical={true} />

                {/* ── Brush size buttons ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -75, y: 20, rotate: 2 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    {BRUSH_SIZES.map(s => (
                        <button key={s.value} onClick={() => handleWidthChange(s.value)}
                            title={`Brush ${s.label}`}
                            style={{
                                width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                                backgroundColor: width === s.value ? (dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                                color: width === s.value ? (dm ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)') : inact,
                            }}
                        >
                            <div style={{
                                width: `${Math.max(3, s.value)}px`, height: `${Math.max(3, s.value)}px`,
                                borderRadius: '50%', backgroundColor: 'currentColor',
                                transition: 'all 0.15s',
                            }} />
                        </button>
                    ))}
                </motion.div>

                <Separator vertical={true} />

                {/* ── Color swatch button ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -105, y: -5, rotate: -4 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }} style={{ position: 'relative' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowPalette(!showPalette); }}
                        title="Colors"
                        style={{
                            width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: showPalette ? (dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            backgroundColor: color,
                            border: `2px solid ${dm ? 'rgba(0,0,0,0.5)' : 'white'}`,
                            boxShadow: `0 0 0 1px ${dm ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                            transition: 'all 0.15s',
                        }} />
                    </button>

                    {/* ── Color Palette popover ── */}
                    {showPalette && (
                        <div onClick={(e) => e.stopPropagation()} style={{
                            position: 'absolute', top: '0', left: '46px',
                            padding: '16px', borderRadius: '16px',
                            backgroundColor: tbBg, border: `1px solid ${tbBorder}`,
                            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: tbShadow, zIndex: 50,
                            minWidth: '200px',
                            animation: 'palette-slide 0.2s cubic-bezier(0.16,1,0.3,1)',
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: inact, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Colors</div>
                            {/* Preset colors */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                                {PALETTE.map(c => (
                                    <button key={c} onClick={() => { handleColorChange(c); setShowPalette(false); }}
                                        style={{
                                            width: '28px', height: '28px', borderRadius: '8px', border: 'none',
                                            backgroundColor: c, cursor: 'pointer',
                                            outline: color === c ? `2px solid ${c}` : 'none',
                                            outlineOffset: '2px',
                                            boxShadow: color === c ? `0 0 8px ${c}60` : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                                            transition: 'all 0.15s',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Custom color input */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: '10px',
                                backgroundColor: dm ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                                border: `1px solid ${sep}`,
                            }}>
                                <div style={{ position: 'relative', width: '20px', height: '20px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}>
                                    <div style={{ width: '100%', height: '100%', backgroundColor: color }} />
                                    <input type="color" value={color}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                    />
                                </div>
                                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: dm ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', textTransform: 'uppercase' }}>{color}</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                <Separator vertical={true} />

                {/* ── Clear ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -85, y: 30, rotate: 4 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn onClick={handleClear} title="Clear Canvas" className="wb-clear-btn">
                        <Trash2 size={16} />
                    </ToolBtn>
                </motion.div>

                {/* ── Theme ── */}
                <motion.div variants={{ hidden: { opacity: 0, x: -115, y: -25, rotate: -6 }, visible: { opacity: 1, x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } } }}>
                    <ToolBtn onClick={handleToggleTheme} title="Toggle Theme" className="wb-theme-btn">
                        {dm ? <Sun size={16} color="#facc15" /> : <Moon size={16} />}
                    </ToolBtn>
                </motion.div>
            </motion.div>

            {/* ══════ EMPTY STATE OVERLAY (Z-INDEX 5) ══════ */}
            {
                !hasInteracted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            pointerEvents: 'none', zIndex: 5, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '24px',
                        }}
                    >
                        <div style={{
                            padding: '16px 24px', borderRadius: '16px', backgroundColor: tbBg, border: `1px solid ${tbBorder}`,
                            boxShadow: tbShadow, backdropFilter: 'blur(20px)', textAlign: 'center',
                        }}>
                            <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, color: dm ? 'white' : 'black' }}>Canvas is Empty</h2>
                            <p style={{ margin: 0, fontSize: '14px', color: inact }}>Click and drag anywhere to start drawing.</p>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            {[
                                { key: 'P', label: 'Draw' },
                                { key: 'H', label: 'Pan' },
                                { key: 'Ctrl+Scroll', label: 'Zoom' },
                            ].map(shortcut => (
                                <div key={shortcut.label} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                    padding: '10px', borderRadius: '12px', backgroundColor: dm ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                    border: `1px solid ${dm ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, minWidth: '80px',
                                }}>
                                    <kbd style={{
                                        fontSize: '11px', fontWeight: 600, fontFamily: 'monospace',
                                        color: dm ? 'white' : 'black', padding: '4px 8px', borderRadius: '6px',
                                        backgroundColor: dm ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                    }}>{shortcut.key}</kbd>
                                    <span style={{ fontSize: '11px', color: inact }}>{shortcut.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
            }

            {/* ══════ RETURN TO CONTENT OVERLAY (BOTTOM CENTER) ══════ */}
            {
                isLost && (
                    <div style={{
                        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 40, pointerEvents: 'none', animation: 'fade-up 0.4s cubic-bezier(0.16,1,0.3,1)'
                    }}>
                        <button onClick={handleReturnToContent} className="wb-return-btn" style={{ pointerEvents: 'auto' }}>
                            Return to content
                        </button>
                    </div>
                )
            }

            {/* ══════ ZOOM OVERLAY (BOTTOM RIGHT) ══════ */}
            <div style={{
                position: 'absolute', bottom: '16px', right: '16px', zIndex: 40,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px',
                pointerEvents: 'none'
            }}>
                {/* Zoom Controls */}
                <div style={{
                    pointerEvents: 'auto',
                    display: 'flex', alignItems: 'center',
                    borderRadius: '10px', overflow: 'hidden',
                    backgroundColor: tbBg, border: `1px solid ${tbBorder}`,
                    backdropFilter: 'blur(16px)', userSelect: 'none',
                    boxShadow: tbShadow,
                }}>
                    <button onClick={() => {
                        const vp = viewportRef.current;
                        const newZoom = Math.max(0.1, vp.zoom / 1.2);
                        const nv = { zoom: newZoom, offsetX: vp.offsetX, offsetY: vp.offsetY };
                        viewportRef.current = nv; applyVp(canvas, nv); emitVp(nv);
                    }} className="wb-zoom-btn" style={{
                        width: '32px', height: '32px', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', color: inact,
                    }}>
                        <Minus size={14} />
                    </button>
                    <div style={{
                        minWidth: '48px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 600, fontFamily: 'monospace', cursor: 'pointer',
                        color: dm ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                        borderLeft: `1px solid ${sep}`, borderRight: `1px solid ${sep}`,
                    }} title="Fit to screen" onClick={() => {
                        const nv = { zoom: 1, offsetX: 0, offsetY: 0 };
                        viewportRef.current = nv; applyVp(canvas, nv); emitVp(nv);
                    }}>
                        {zoomLevel}%
                    </div>
                    <button onClick={() => {
                        const vp = viewportRef.current;
                        const newZoom = Math.min(8, vp.zoom * 1.2);
                        const nv = { zoom: newZoom, offsetX: vp.offsetX, offsetY: vp.offsetY };
                        viewportRef.current = nv; applyVp(canvas, nv); emitVp(nv);
                    }} className="wb-zoom-btn" style={{
                        width: '32px', height: '32px', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', color: inact,
                    }}>
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* ══════ CONTEXT MENU ══════ */}
            {
                contextMenu && (
                    <div style={{
                        position: 'fixed',
                        left: Math.min(contextMenu.x, window.innerWidth - 160),
                        top: Math.min(contextMenu.y, window.innerHeight - 200),
                        zIndex: 100,
                        backgroundColor: tbBg,
                        border: `1px solid ${tbBorder}`,
                        borderRadius: '12px',
                        padding: '6px',
                        minWidth: '160px',
                        boxShadow: tbShadow,
                        backdropFilter: 'blur(24px)',
                        animation: 'palette-slide 0.1s ease-out'
                    }}>
                        {[
                            { label: 'Copy', icon: Copy, onClick: handleCopy, shortcut: 'Ctrl+C', show: !!contextMenu.target },
                            { label: 'Paste', icon: Clipboard, onClick: handlePaste, shortcut: 'Ctrl+V', show: clipboardRef.current?.length > 0 },
                            { divider: true, show: !!contextMenu.target && clipboardRef.current?.length > 0 },
                            { label: 'Bring Forward', icon: ArrowUp, onClick: handleBringForward, shortcut: ']', show: !!contextMenu.target },
                            { label: 'Send Backward', icon: ArrowDown, onClick: handleSendBackward, shortcut: '[', show: !!contextMenu.target },
                            { divider: true, show: !!contextMenu.target },
                            { label: 'Delete', icon: Trash2, onClick: handleDelete, shortcut: 'Del', color: '#ef4444', show: !!contextMenu.target },
                        ].filter(item => item.show !== false).map((item, idx) => item.divider ? (
                            <div key={idx} style={{ height: '1px', backgroundColor: sep, margin: '4px 0' }} />
                        ) : (
                            <button key={idx} onClick={item.onClick} style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                borderRadius: '6px',
                                color: item.color || t.text1,
                                fontSize: '12px',
                                transition: 'background 0.1s',
                            }} className={`wb-ctx-item ${item.color ? 'danger' : ''}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <item.icon size={14} />
                                    {item.label}
                                </div>
                                {item.shortcut && <span style={{ fontSize: '10px', color: inact }}>{item.shortcut}</span>}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* ══════ CSS ══════ */}
            <style>{`
                @keyframes tb-slide {
                    from { opacity:0; transform:translateY(-50%) translateX(-16px); }
                    to { opacity:1; transform:translateY(-50%) translateX(0); }
                }
                @keyframes fade-up {
                    from { opacity:0; transform:translateX(-50%) translateY(16px); }
                    to { opacity:1; transform:translateX(-50%) translateY(0); }
                }
                @keyframes palette-slide {
                    from { opacity:0; transform:translateX(-8px) scale(0.95); }
                    to { opacity:1; transform:translateX(0) scale(1); }
                }
                button:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
                .wb-tool-btn:hover { transform:scale(1.06) !important; }
                .wb-clear-btn:hover { color:#f87171 !important; background:rgba(239,68,68,0.1) !important; }
                .wb-theme-btn:hover { background:${dm ? 'rgba(250,204,21,0.1)' : 'rgba(0,0,0,0.04)'} !important; }
                .wb-zoom-btn:hover { background:${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} !important; }
                .wb-ctx-item:hover { background:${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} !important; }
                .wb-ctx-item.danger:hover { background:rgba(239,68,68,0.15) !important; }
                .wb-return-btn {
                    pointer-events: auto; background: transparent; border: none; cursor: pointer;
                    font-size: 14px; font-weight: 500; padding: 8px 16px; transition: color 0.2s;
                    color: ${dm ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
                }
                .wb-return-btn:hover { color: ${dm ? '#ffffff' : '#000000'}; }
                canvas { cursor: ${tool === 'hand' ? 'grab' : 'crosshair'}; }
            `}</style>
        </div >
    );
}
