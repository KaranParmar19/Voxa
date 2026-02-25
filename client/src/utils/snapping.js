import * as fabric from 'fabric';

/**
 * Initializes snapping guidelines and smart alignment mapping for a Fabric.js canvas.
 */
export const initSnapping = (canvas) => {
    const ctx = canvas.getContext();
    const snapZone = 10;
    const alignZone = 8;

    // Store lines to render dynamically
    let verticalLines = [];
    let horizontalLines = [];

    const clearGuides = () => {
        verticalLines.forEach(l => canvas.remove(l));
        horizontalLines.forEach(l => canvas.remove(l));
        verticalLines = [];
        horizontalLines = [];
    };

    const drawGuide = (coords, isVertical) => {
        const line = new fabric.Line(coords, {
            stroke: '#ec4899', // Pinkish smart alignment color
            strokeWidth: 1,
            selectable: false,
            evented: false,
            strokeDashArray: [5, 5],
            opacity: 0.8,
        });
        canvas.add(line);
        if (isVertical) verticalLines.push(line);
        else horizontalLines.push(line);
    };

    canvas.on('object:moving', (e) => {
        const activeObj = e.target;
        if (!activeObj) return;

        clearGuides();

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        const activeObjWidth = activeObj.getScaledWidth();
        const activeObjHeight = activeObj.getScaledHeight();

        // Object bounds
        let objLeft = activeObj.left;
        let objTop = activeObj.top;
        let objRight = objLeft + activeObjWidth;
        let objBottom = objTop + activeObjHeight;
        let objCenterX = objLeft + activeObjWidth / 2;
        let objCenterY = objTop + activeObjHeight / 2;

        let snappedX = false;
        let snappedY = false;

        // 1. Array of all other objects
        const objects = canvas.getObjects().filter(o => o !== activeObj && !verticalLines.includes(o) && !horizontalLines.includes(o) && o.evented !== false);

        // Smart Alignment with other objects
        for (let i = 0; i < objects.length; i++) {
            const target = objects[i];
            const tWidth = target.getScaledWidth();
            const tHeight = target.getScaledHeight();
            const tLeft = target.left;
            const tTop = target.top;
            const tRight = tLeft + tWidth;
            const tBottom = tTop + tHeight;
            const tCenterX = tLeft + tWidth / 2;
            const tCenterY = tTop + tHeight / 2;

            // X-AXIS ALIGNMENT
            if (!snappedX) {
                // Center-to-Center
                if (Math.abs(objCenterX - tCenterX) < alignZone) {
                    activeObj.set({ left: tCenterX - activeObjWidth / 2 });
                    drawGuide([tCenterX, 0, tCenterX, canvasHeight], true);
                    snappedX = true;
                }
                // Left-to-Left
                else if (Math.abs(objLeft - tLeft) < alignZone) {
                    activeObj.set({ left: tLeft });
                    drawGuide([tLeft, 0, tLeft, canvasHeight], true);
                    snappedX = true;
                }
                // Right-to-Right
                else if (Math.abs(objRight - tRight) < alignZone) {
                    activeObj.set({ left: tRight - activeObjWidth });
                    drawGuide([tRight, 0, tRight, canvasHeight], true);
                    snappedX = true;
                }
                // Left-to-Right
                else if (Math.abs(objLeft - tRight) < alignZone) {
                    activeObj.set({ left: tRight });
                    drawGuide([tRight, 0, tRight, canvasHeight], true);
                    snappedX = true;
                }
                // Right-to-Left
                else if (Math.abs(objRight - tLeft) < alignZone) {
                    activeObj.set({ left: tLeft - activeObjWidth });
                    drawGuide([tLeft, 0, tLeft, canvasHeight], true);
                    snappedX = true;
                }
            }

            // Y-AXIS ALIGNMENT
            if (!snappedY) {
                // Center-to-Center
                if (Math.abs(objCenterY - tCenterY) < alignZone) {
                    activeObj.set({ top: tCenterY - activeObjHeight / 2 });
                    drawGuide([0, tCenterY, canvasWidth, tCenterY], false);
                    snappedY = true;
                }
                // Top-to-Top
                else if (Math.abs(objTop - tTop) < alignZone) {
                    activeObj.set({ top: tTop });
                    drawGuide([0, tTop, canvasWidth, tTop], false);
                    snappedY = true;
                }
                // Bottom-to-Bottom
                else if (Math.abs(objBottom - tBottom) < alignZone) {
                    activeObj.set({ top: tBottom - activeObjHeight });
                    drawGuide([0, tBottom, canvasWidth, tBottom], false);
                    snappedY = true;
                }
                // Top-to-Bottom
                else if (Math.abs(objTop - tBottom) < alignZone) {
                    activeObj.set({ top: tBottom });
                    drawGuide([0, tBottom, canvasWidth, tBottom], false);
                    snappedY = true;
                }
                // Bottom-to-Top
                else if (Math.abs(objBottom - tTop) < alignZone) {
                    activeObj.set({ top: tTop - activeObjHeight });
                    drawGuide([0, tTop, canvasWidth, tTop], false);
                    snappedY = true;
                }
            }

            if (snappedX && snappedY) break;
        }

        // 2. Global Canvas Center Snapping (fallback if not snapping to object)
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;

        if (!snappedX && Math.abs(objCenterX - canvasCenterX) < snapZone) {
            activeObj.set({ left: canvasCenterX - (activeObjWidth / 2) });
            drawGuide([canvasCenterX, 0, canvasCenterX, canvasHeight], true);
            snappedX = true;
        }

        if (!snappedY && Math.abs(objCenterY - canvasCenterY) < snapZone) {
            activeObj.set({ top: canvasCenterY - (activeObjHeight / 2) });
            drawGuide([0, canvasCenterY, canvasWidth, canvasCenterY], false);
            snappedY = true;
        }

        activeObj.setCoords();
    });

    canvas.on('mouse:up', () => {
        clearGuides();
    });
};
