import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { IconBarcode, IconLine, IconPointer } from '@tabler/icons-react';
import { useProject } from '../../context/ProjectContext';
import ObjectRegistry from '../../classes/ObjectRegistry';

import { DISPLAY_DPI } from '../../constants/editor';
import { zplToBase64Async } from 'zpl-renderer-js';
import { getLabelDimensionsInDots, getZplCoordinates } from '../../utils/zplMath';

// Smaller drags (in label px) count as a click and use default sizes.
const MIN_CREATE_DRAG = 4;

export default function Editor() {
    const { activeLabel, activeLabelId, addObject, deleteObject, selectedObjectId, setSelectedObjectId, updateObject, reorderObject, editorSettings, setEditorSettings, templateValues } = useProject();
    const [activeTool, setActiveTool] = useState('pointer');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    // Panning State
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Object Dragging State
    const [isDraggingObj, setIsDraggingObj] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [objStartPos, setObjStartPos] = useState({ x: 0, y: 0 });
    const [objDimensions, setObjDimensions] = useState({ width: 0, height: 0 });

    // Object Resizing State
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null); // 'tl' or 'br'
    const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
    const [initialObjProps, setInitialObjProps] = useState(null);

    // Drag-to-create state, in label pixels: { start, end }
    const [creationDrag, setCreationDrag] = useState(null);

    // Each object gets an independent printer-rendered layer.
    const [objectPreviews, setObjectPreviews] = useState({});
    const objectPreviewsRef = useRef({});
    const previewGenerationRef = useRef(0);
    // Kept outside previews so the correction still applies while previews are hidden during drags.
    const [textCalibrations, setTextCalibrations] = useState({});
    const [objectSnapshots, setObjectSnapshots] = useState({});

    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, objectId: null });

    // Settings Menu State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const canvasContainerRef = useRef(null);
    const labelCanvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const pendingImagePositionRef = useRef(null);

    const handleContextMenu = (e, objId) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            objectId: objId,
        });
    };

    const handleCloseContextMenu = () => {
        if (contextMenu.visible) {
            setContextMenu({ ...contextMenu, visible: false });
        }
    };

    // Close context menu on global click
    useEffect(() => {
        window.addEventListener('click', handleCloseContextMenu);
        return () => window.removeEventListener('click', handleCloseContextMenu);
    }, [contextMenu.visible]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Ignore if an input/textarea is focused
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                    return;
                }

                if (selectedObjectId) {
                    deleteObject(selectedObjectId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedObjectId, deleteObject]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const position = pendingImagePositionRef.current || { x: 50, y: 50 };
        pendingImagePositionRef.current = null;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                // A dragged area fits the image inside it; otherwise cap it at half the label on its limiting side.
                const fit = position.width && position.height
                    ? Math.min(position.width / img.width, position.height / img.height)
                    : Math.min(1, (labelDim.width * 0.5) / img.width, (labelDim.height * 0.5) / img.height);
                const width = Math.max(1, Math.round(img.width * fit));
                const height = Math.max(1, Math.round(img.height * fit));
                let { x, y } = position;
                if (editorSettings.confineToLabel) {
                    x = Math.max(0, Math.min(x, labelDim.width - width));
                    y = Math.max(0, Math.min(y, labelDim.height - height));
                }
                addObject('image', { src: dataUrl, width, height, x, y });
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const getLabelDimensions = () => {
        if (!activeLabel) return { width: 0, height: 0 };
        const { width, height, unit, dpmm } = activeLabel.settings;

        const { width: zplWidth, height: zplHeight } = getLabelDimensionsInDots(width, height, dpmm, unit);

        const printerDotsPerUnit = unit === 'inch' ? 25.4 * dpmm : dpmm;
        const scale = DISPLAY_DPI / printerDotsPerUnit;

        return {
            width: Math.round(zplWidth * scale),
            height: Math.round(zplHeight * scale),
        };
    };

    const labelDim = getLabelDimensions();

    const handleLabelClick = () => {
        if (activeTool === 'pointer') {
            setSelectedObjectId(null);
        }
    };

    const getLabelPoint = (e) => {
        const labelRect = labelCanvasRef.current.getBoundingClientRect();
        let x = (e.clientX - labelRect.left) / zoomLevel;
        let y = (e.clientY - labelRect.top) / zoomLevel;

        if (editorSettings.snapToGrid) {
            x = snapToGrid(x, editorSettings.gridSize);
            y = snapToGrid(y, editorSettings.gridSize);
        }

        if (editorSettings.confineToLabel) {
            const bleed = editorSettings.bleed || 0;
            x = Math.max(-bleed, Math.min(x, labelDim.width + bleed));
            y = Math.max(-bleed, Math.min(y, labelDim.height + bleed));
        }

        return { x: Math.round(x), y: Math.round(y) };
    };

    const handleLabelMouseDown = (e) => {
        if (activeTool === 'pointer' || e.button !== 0 || e.altKey || !zoomLevel) return;
        e.preventDefault();
        const point = getLabelPoint(e);
        setCreationDrag({ start: point, end: point });
    };

    const finishCreationDrag = () => {
        const { start, end } = creationDrag;
        setCreationDrag(null);

        const rect = {
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
            width: Math.abs(end.x - start.x),
            height: Math.abs(end.y - start.y),
        };
        const dragged = Math.max(rect.width, rect.height) >= MIN_CREATE_DRAG;
        const definition = ObjectRegistry.get(activeTool);
        let props = { x: start.x, y: start.y };

        if (dragged) {
            props = definition?.class?.fromDrag?.({ start, end, rect, labelSettings: activeLabel.settings }) ?? { ...rect, width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
        }

        if (activeTool === 'image') {
            pendingImagePositionRef.current = props;
            fileInputRef.current?.click();
            return;
        }

        addObject(activeTool, props);
    };

    // Reset view when label size changes (fit to screen at 100%)
    useEffect(() => {
        if (canvasContainerRef.current && labelDim.width > 0 && labelDim.height > 0) {
            const containerRect = canvasContainerRef.current.getBoundingClientRect();
            const padding = 40;

            const availableWidth = containerRect.width - padding * 2;
            const availableHeight = containerRect.height - padding * 2;

            const scaleX = availableWidth / labelDim.width;
            const scaleY = availableHeight / labelDim.height;

            const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom in past 100%

            setZoomLevel(fitZoom);
            setPanOffset({ x: 0, y: 0 });
        }
    }, [labelDim.width, labelDim.height]);

    // Handle Zoom
    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.1, 0.1));

    const handleWheel = (e) => {
        const delta = -Math.sign(e.deltaY) * 0.1;
        const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 3);

        if (newZoom !== zoomLevel && canvasContainerRef.current) {
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const containerCenterX = rect.width / 2;
            const containerCenterY = rect.height / 2;

            const mouseX = e.clientX - rect.left - containerCenterX;
            const mouseY = e.clientY - rect.top - containerCenterY;

            const scaleRatio = newZoom / zoomLevel;

            setPanOffset((prev) => ({
                x: prev.x * scaleRatio + mouseX * (1 - scaleRatio),
                y: prev.y * scaleRatio + mouseY * (1 - scaleRatio),
            }));

            setZoomLevel(newZoom);
        }
    };

    // --- Grid Helper ---
    const snapToGrid = (value, gridSize) => {
        return Math.round(value / gridSize) * gridSize;
    };

    // --- Mouse Event Handlers ---

    const handleMouseDown = (e) => {
        if (e.button === 1 || (e.button === 0 && e.nativeEvent.altKey)) {
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    };

    const handleObjectMouseDown = (e, objId, currentX, currentY) => {
        // Let creation tools draw over existing objects.
        if (activeTool !== 'pointer') return;
        e.stopPropagation();

        const innerWrapper = e.currentTarget.querySelector('[data-internal-wrapper="true"]');
        const rect = innerWrapper ? innerWrapper.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();

        const width = innerWrapper ? innerWrapper.offsetWidth : rect.width / zoomLevel;
        const height = innerWrapper ? innerWrapper.offsetHeight : rect.height / zoomLevel;

        setObjDimensions({ width, height });

        if (Math.abs((objDimensions.width || 0) - width) > 1 || Math.abs((objDimensions.height || 0) - height) > 1) {
            updateObject(objId, { width, height });
        }

        setSelectedObjectId(objId);
        setIsDraggingObj(true);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setObjStartPos({ x: currentX, y: currentY });
    };

    const handleObjectDoubleClick = (e, objId) => {
        e.stopPropagation();
        setActiveTool('pointer');
        setSelectedObjectId(objId);
    };

    const handleResizeMouseDown = (e, handle, obj) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStartPos({ x: e.clientX, y: e.clientY });

        const element = e.currentTarget.parentElement;
        const rect = element.getBoundingClientRect();

        setInitialObjProps({
            ...(obj.getProps?.() || {}),
            x: obj.x,
            y: obj.y,
            width: obj.width || 0,
            height: obj.height || 0,
            fontSize: obj.fontSize || 0,
            domWidth: rect.width / zoomLevel,
            domHeight: rect.height / zoomLevel,
        });
    };

    // Ref to hold current objects for the ResizeObserver to access without triggering re-renders
    const activeLabelRef = useRef(activeLabel);
    useEffect(() => {
        activeLabelRef.current = activeLabel;
    }, [activeLabel]);

    // ResizeObserver to keep object dimensions up to date in state
    useEffect(() => {
        if (!canvasContainerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const element = entry.target;
                const objectContainer = element.closest('[data-object-id]');
                const objectId = objectContainer?.getAttribute('data-object-id');

                if (objectId && activeLabelRef.current) {
                    // Skip if currently resizing this object to prevent fighting
                    if (isResizing && objectId === selectedObjectId) return;

                    const { width: logicalWidth, height: logicalHeight } = entry.contentRect;
                    const width = Math.round(logicalWidth);
                    const height = Math.round(logicalHeight);

                    // Debug Log
                    if (width === 0) {
                        const fallBackWidth = element.offsetWidth; // Try obtaining offsetWidth as fallback
                        if (fallBackWidth > 0) {
                            // Use fallback will be handled below
                        } else {
                            // If completely 0, check if we might have inner content size
                            const inner = element.querySelector('[data-internal-wrapper="true"]');
                            if (inner && inner.offsetWidth > 0) {
                                // Use inner width if available
                            } else {
                                console.warn(`[ResizeObserver] Zero width detected for ${objectId}:`, entry.contentRect, 'OffsetWidth:', element.offsetWidth, 'ScrollWidth:', element.scrollWidth, 'InnerOffset:', inner?.offsetWidth);
                            }
                        }
                    }

                    const inner = element.querySelector('[data-internal-wrapper="true"]');
                    let finalWidth = width > 0 ? width : element.offsetWidth > 0 ? element.offsetWidth : inner?.offsetWidth || 0;
                    let finalHeight = height > 0 ? height : element.offsetHeight > 0 ? element.offsetHeight : inner?.offsetHeight || 0;

                    const currentObj = activeLabelRef.current.objects.find((o) => o.id === objectId);

                    if (currentObj) {
                        // Safety check: specific to the user's report.
                        // If we are about to set width/height to 0, but it currently has a valid dimension, ignore the update.
                        // This prevents a render glitch (hidden/loading) from wiping out the saved dimensions.
                        if (finalWidth === 0 && (currentObj.width || 0) > 0) {
                            console.warn(`[ResizeObserver] Preventing overwrite of valid width ${currentObj.width} with 0 for ${objectId}`);
                            return;
                        }

                        // Update selected object dimensions state for dragging/resizing logic
                        if (objectId === selectedObjectId) {
                            setObjDimensions({ width: finalWidth, height: finalHeight });
                        }

                        const diffW = Math.abs((currentObj.width || 0) - finalWidth);
                        const diffH = Math.abs((currentObj.height || 0) - finalHeight);

                        if (diffW >= 1 || diffH >= 1) {
                            updateObject(objectId, { width: finalWidth, height: finalHeight });
                        }
                    }
                }
            });
        });

        const wrappers = canvasContainerRef.current.querySelectorAll('[data-internal-wrapper="true"]');
        wrappers.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [activeLabel?.objects.length, activeLabel?.objects.map((o) => o.id).join(','), selectedObjectId, isResizing]);

    const handleMouseMove = (e) => {
        if (creationDrag) {
            const end = getLabelPoint(e);
            if (end.x !== creationDrag.end.x || end.y !== creationDrag.end.y) {
                setCreationDrag((prev) => prev && { ...prev, end });
            }
        } else if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (isDraggingObj && selectedObjectId) {
            const dx = (e.clientX - dragStartPos.x) / zoomLevel;
            const dy = (e.clientY - dragStartPos.y) / zoomLevel;

            let newX = objStartPos.x + dx;
            let newY = objStartPos.y + dy;

            if (editorSettings.snapToGrid) {
                newX = snapToGrid(newX, editorSettings.gridSize);
                newY = snapToGrid(newY, editorSettings.gridSize);
            }

            if (editorSettings.confineToLabel) {
                const currentObj = activeLabel.objects.find((o) => o.id === selectedObjectId);
                const isVertical = currentObj && ['R', 'B'].includes(currentObj.orientation);

                const objWidth = isVertical ? objDimensions.height : objDimensions.width;
                const objHeight = isVertical ? objDimensions.width : objDimensions.height;
                const bleed = editorSettings.bleed || 0;

                newX = Math.max(-bleed, Math.min(newX, labelDim.width + bleed - objWidth));
                newY = Math.max(-bleed, Math.min(newY, labelDim.height + bleed - objHeight));
            }

            updateObject(selectedObjectId, {
                x: newX,
                y: newY,
            });
        } else if (isResizing && selectedObjectId && initialObjProps) {
            const dx = (e.clientX - resizeStartPos.x) / zoomLevel;
            const dy = (e.clientY - resizeStartPos.y) / zoomLevel;

            const objState = activeLabel.objects.find((o) => o.id === selectedObjectId);
            if (!objState) return;

            const def = ObjectRegistry.get(objState.type);
            if (def && def.class) {
                const instance = new def.class(objState);

                const settings = {
                    snapToGrid: editorSettings.snapToGrid,
                    gridSize: editorSettings.gridSize,
                    confineToLabel: editorSettings.confineToLabel,
                    bleed: editorSettings.bleed || 0,
                    labelDim,
                };

                const delta = { dx, dy };

                try {
                    const newProps = instance.resize(resizeHandle, delta, settings, initialObjProps);
                    updateObject(selectedObjectId, newProps);
                } catch (err) {
                    console.warn('Resize not implemented for this object type', err);
                }
            }
        }
    };

    const handleMouseUp = () => {
        if (creationDrag) finishCreationDrag();
        setIsPanning(false);
        setIsDraggingObj(false);
        setIsResizing(false);
        setResizeHandle(null);
        setInitialObjProps(null);
    };

    const handlersRef = useRef({ move: handleMouseMove, up: handleMouseUp });
    useEffect(() => {
        handlersRef.current = { move: handleMouseMove, up: handleMouseUp };
    });

    useEffect(() => {
        if (isPanning || isDraggingObj || isResizing || creationDrag) {
            const onMove = (e) => handlersRef.current.move(e);
            const onUp = (e) => handlersRef.current.up(e);

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            return () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
        }
    }, [isPanning, isDraggingObj, isResizing, Boolean(creationDrag)]);

    useEffect(() => {
        const generation = ++previewGenerationRef.current;

        if (!activeLabel || !activeLabelId || isDraggingObj || isResizing) return undefined;

        const { width, height, unit, dpmm } = activeLabel.settings;
        const { width: printWidth, height: labelLength } = getLabelDimensionsInDots(width, height, dpmm, unit);
        const widthMm = unit === 'inch' ? width * 25.4 : width;
        const heightMm = unit === 'inch' ? height * 25.4 : height;
        const nextPreviews = {};
        const renderTargets = [];

        activeLabel.objects.forEach((obj, index) => {
            const definition = ObjectRegistry.get(obj.type);
            if (!definition?.class || (obj.type === 'image' && !obj.zplData)) return;

            try {
                const convertedObject = getZplCoordinates(obj, activeLabel.settings);
                const instance = new definition.class(convertedObject);
                Object.assign(instance, convertedObject);
                const objectZpl = instance.toZPL(index, templateValues);
                const zpl = `^XA\n^PW${printWidth}\n^LL${labelLength}\n^PON\n${objectZpl}\n^XZ`;
                const signature = `${widthMm}:${heightMm}:${dpmm}:${zpl}`;
                const cachedPreview = objectPreviewsRef.current[obj.id];

                if (cachedPreview?.signature === signature && cachedPreview.src) {
                    nextPreviews[obj.id] = cachedPreview;
                } else {
                    nextPreviews[obj.id] = { signature, src: null };
                    renderTargets.push({ id: obj.id, signature, zpl });
                }
            } catch (error) {
                console.warn(`Failed to prepare ZPL preview for object ${obj.id}:`, error);
            }
        });

        objectPreviewsRef.current = nextPreviews;
        setObjectPreviews(nextPreviews);

        const renderObject = async ({ id, signature, zpl }) => {
            try {
                const png = await zplToBase64Async(zpl, widthMm, heightMm, dpmm);
                if (previewGenerationRef.current !== generation || !png) return;

                const currentPreview = objectPreviewsRef.current[id];
                if (currentPreview?.signature !== signature) return;

                const updatedPreviews = {
                    ...objectPreviewsRef.current,
                    [id]: { signature, src: png.startsWith('data:') ? png : `data:image/png;base64,${png}`, ready: false },
                };
                objectPreviewsRef.current = updatedPreviews;
                setObjectPreviews(updatedPreviews);
            } catch (error) {
                if (previewGenerationRef.current === generation) {
                    console.warn(`Failed to render ZPL preview for object ${id}:`, error);
                }
            }
        };

        const renderQueue = [...renderTargets];
        const workerCount = Math.min(2, renderQueue.length);
        const workers = Array.from({ length: workerCount }, async () => {
            while (renderQueue.length > 0 && previewGenerationRef.current === generation) {
                const target = renderQueue.shift();
                await renderObject(target);
            }
        });

        void Promise.all(workers);

        return () => {
            if (previewGenerationRef.current === generation) {
                previewGenerationRef.current += 1;
            }
        };
    }, [activeLabelId, activeLabel, isDraggingObj, isResizing, templateValues]);

    const calibrateTextWidth = (objectId, image) => {
        const obj = activeLabelRef.current?.objects.find((o) => o.id === objectId);
        if (!obj || obj.type !== 'text' || !image?.naturalWidth || !labelDim.width) return;

        const span = labelCanvasRef.current?.querySelector(`[data-object-id="${objectId}"] [data-internal-wrapper] span`);
        const text = span?.textContent || '';
        if (!span || text.length < 2) return;

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < canvas.height; y += 1) {
            for (let x = 0; x < canvas.width; x += 1) {
                const i = (y * canvas.width + x) * 4;
                if (data[i + 3] > 100 && (data[i] + data[i + 1] + data[i + 2]) / 3 < 180) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < 0) return;

        const isVertical = ['R', 'B'].includes(obj.orientation);
        const zplLength = isVertical ? ((maxY - minY + 1) * labelDim.height) / canvas.height : ((maxX - minX + 1) * labelDim.width) / canvas.width;

        const style = getComputedStyle(span);
        const fontSize = parseFloat(style.fontSize);
        const measure = document.createElement('canvas').getContext('2d');
        measure.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
        const metrics = measure.measureText(text);
        const htmlLength = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
        if (!fontSize || !htmlLength) return;

        const letterSpacingEm = (zplLength - htmlLength) / (text.length - 1) / fontSize;
        setTextCalibrations((prev) => (Math.abs((prev[objectId]?.letterSpacingEm ?? Infinity) - letterSpacingEm) < 0.001 ? prev : { ...prev, [objectId]: { letterSpacingEm } }));
    };

    // Crops a barcode's ZPL render so the HTML stand-in matches it exactly while dragging.
    const captureBarcodeSnapshot = (objectId, image) => {
        const obj = activeLabelRef.current?.objects.find((o) => o.id === objectId);
        if (!obj || obj.type !== 'barcode' || !image?.naturalWidth || !labelDim.width) return;

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

        const scale = canvas.width / labelDim.width;
        const originX = Math.max(0, Math.floor(obj.x * scale));
        const originY = Math.max(0, Math.floor(obj.y * scale));
        let maxX = -1;
        let maxY = -1;
        for (let y = originY; y < canvas.height; y += 1) {
            for (let x = originX; x < canvas.width; x += 1) {
                const i = (y * canvas.width + x) * 4;
                if (data[i + 3] > 100 && (data[i] + data[i + 1] + data[i + 2]) / 3 < 180) {
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }
        if (maxX < originX || maxY < originY) return;

        const crop = document.createElement('canvas');
        crop.width = maxX - originX + 1;
        crop.height = maxY - originY + 1;
        crop.getContext('2d').drawImage(canvas, originX, originY, crop.width, crop.height, 0, 0, crop.width, crop.height);

        setObjectSnapshots((prev) => ({
            ...prev,
            [objectId]: { src: crop.toDataURL(), width: crop.width / scale, height: crop.height / scale, moduleWidth: obj.moduleWidth, barHeight: obj.barHeight },
        }));
    };

    const handleObjectPreviewLoad = (objectId, signature, image) => {
        const currentPreview = objectPreviewsRef.current[objectId];
        if (!currentPreview || currentPreview.signature !== signature || currentPreview.ready) return;

        calibrateTextWidth(objectId, image);
        captureBarcodeSnapshot(objectId, image);

        const updatedPreviews = {
            ...objectPreviewsRef.current,
            [objectId]: { ...currentPreview, ready: true },
        };
        objectPreviewsRef.current = updatedPreviews;
        setObjectPreviews(updatedPreviews);
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="editor-tool-card" role="toolbar" aria-label="Label design tools">
                        <span className="editor-tool-label">Tools</span>
                        <button aria-label="Select tool" aria-pressed={activeTool === 'pointer'} onClick={() => setActiveTool('pointer')} className={clsx('editor-tool-button', activeTool === 'pointer' && 'editor-tool-button-active')} title="Select Tool">
                            <IconPointer size={19} stroke={1.8} />
                        </button>
                        <button aria-label="Text tool" aria-pressed={activeTool === 'text'} onClick={() => setActiveTool('text')} className={clsx('editor-tool-button', activeTool === 'text' && 'editor-tool-button-active')} title="Text Tool">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="4 7 4 4 20 4 20 7"></polyline>
                                <line x1="9" y1="20" x2="15" y2="20"></line>
                                <line x1="12" y1="4" x2="12" y2="20"></line>
                            </svg>
                        </button>
                        <button aria-label="Shape tool" aria-pressed={activeTool === 'graphic'} onClick={() => setActiveTool('graphic')} className={clsx('editor-tool-button', activeTool === 'graphic' && 'editor-tool-button-active')} title="Shape Tool">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                        </button>
                        <button aria-label="Line tool" aria-pressed={activeTool === 'line'} onClick={() => setActiveTool('line')} className={clsx('editor-tool-button', activeTool === 'line' && 'editor-tool-button-active')} title="Line Tool">
                            <IconLine size={19} stroke={1.8} />
                        </button>
                        <button aria-label="Barcode tool" aria-pressed={activeTool === 'barcode'} onClick={() => setActiveTool('barcode')} className={clsx('editor-tool-button', activeTool === 'barcode' && 'editor-tool-button-active')} title="Barcode Tool">
                            <IconBarcode size={19} stroke={1.8} />
                        </button>
                        <button aria-label="Image tool" aria-pressed={activeTool === 'image'} onClick={() => setActiveTool('image')} className={clsx('editor-tool-button', activeTool === 'image' && 'editor-tool-button-active')} title="Image Tool">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                </div>
                <div className="flex items-center gap-2 relative">
                    {/* Settings Button */}
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={clsx('p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700', isSettingsOpen ? 'text-brand-600 bg-brand-50' : 'text-gray-500 dark:text-gray-400')} title="Editor Settings">
                        <i className="fa-solid fa-gear"></i>
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 space-y-3">
                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.confineToLabel} onChange={(e) => setEditorSettings({ ...editorSettings, confineToLabel: e.target.checked })} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Confine to Label</span>
                            </label>

                            {editorSettings.confineToLabel && (
                                <div className="px-2 space-y-1">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Bleed (px)</label>
                                    <input
                                        type="number"
                                        value={editorSettings.bleed || 0}
                                        onChange={(e) => setEditorSettings({ ...editorSettings, bleed: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                        step="1"
                                    />
                                </div>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.showGrid} onChange={(e) => setEditorSettings({ ...editorSettings, showGrid: e.target.checked })} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Show Grid</span>
                            </label>

                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.snapToGrid} onChange={(e) => setEditorSettings({ ...editorSettings, snapToGrid: e.target.checked })} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Snap to Grid</span>
                            </label>

                            <div className="px-2 space-y-1">
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Grid Size (px)</label>
                                <input
                                    type="number"
                                    value={editorSettings.gridSize || 10}
                                    onChange={(e) => setEditorSettings({ ...editorSettings, gridSize: Math.max(1, parseInt(e.target.value) || 10) })}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    min="1"
                                    step="1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Zoom Controls */}
                    <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={handleZoomOut} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button onClick={handleZoomIn} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {/* The Canvas Wrapper (for scrolling/panning) */}
            <div
                className={clsx('flex-1 overflow-hidden bg-gray-200 dark:bg-gray-900 relative', activeTool === 'pointer' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair')}
                onMouseDown={handleMouseDown}
                // onMouseMove handled globally during drag
                onWheel={handleWheel}
                ref={canvasContainerRef}>
                <div
                    className="absolute origin-center transition-transform duration-75 ease-out select-none"
                    style={{
                        transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                        left: '50%',
                        top: '50%',
                        marginLeft: -labelDim.width / 2,
                        marginTop: -labelDim.height / 2,
                    }}>
                    {/* The Physical Label */}
                    <div
                        id="label-canvas"
                        ref={labelCanvasRef}
                        onMouseDown={handleLabelMouseDown}
                        onClick={handleLabelClick}
                        className="bg-white shadow-2xl relative transition-all duration-300 ease-in-out"
                        style={{
                            width: labelDim.width,
                            height: labelDim.height,
                        }}>
                        {/* Grid Overlay */}
                        {editorSettings.showGrid && (
                            <div
                                className="absolute inset-0 pointer-events-none z-0"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, rgb(var(--theme-neutral-5) / 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--theme-neutral-5) / 0.18) 1px, transparent 1px)',
                                    backgroundSize: `${editorSettings.gridSize}px ${editorSettings.gridSize}px`,
                                }}
                            />
                        )}

                        {activeLabel?.objects.map((obj, index) => {
                            const objectPreview = !isDraggingObj && !isResizing ? objectPreviews[obj.id] : null;

                            return (
                                <React.Fragment key={obj.id}>
                                    {objectPreview?.src && (
                                        <img
                                            src={objectPreview.src}
                                            alt=""
                                            aria-hidden="true"
                                            className={`object-zpl-preview absolute inset-0 h-full w-full pointer-events-none select-none transition-opacity duration-150 ${objectPreview.ready ? 'opacity-100' : 'opacity-0'}`}
                                            data-preview-for={obj.id}
                                            onLoad={(e) => handleObjectPreviewLoad(obj.id, objectPreview.signature, e.currentTarget)}
                                            ref={(node) => {
                                                if (node?.complete && node.naturalWidth > 0 && !objectPreview.ready) {
                                                    handleObjectPreviewLoad(obj.id, objectPreview.signature, node);
                                                }
                                            }}
                                            style={{ zIndex: 10 + index * 2 }}
                                            draggable={false}
                                        />
                                    )}
                                    <div
                                data-object-id={obj.id}
                                className={`absolute cursor-move hover:ring-1 hover:ring-brand-600 ${selectedObjectId === obj.id ? 'ring-1 ring-brand-600' : ''} transition-opacity duration-200 ease-in-out`}
                                style={{
                                    left: obj.x,
                                    top: obj.y,
                                    zIndex: 11 + index * 2,
                                    width: (() => {
                                        if (isResizing && selectedObjectId === obj.id && obj.type === 'text') return 'auto';
                                        const isVertical = ['R', 'B'].includes(obj.orientation);
                                        return isVertical ? obj.height || 'auto' : obj.width || 'auto';
                                    })(),
                                    height: (() => {
                                        if (isResizing && selectedObjectId === obj.id && obj.type === 'text') return 'auto';
                                        const isVertical = ['R', 'B'].includes(obj.orientation);
                                        return isVertical ? obj.width || 'auto' : obj.height || 'auto';
                                    })(),
                                }}
                                onMouseDown={(e) => handleObjectMouseDown(e, obj.id, obj.x, obj.y)}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => handleObjectDoubleClick(e, obj.id)}
                                onContextMenu={(e) => handleContextMenu(e, obj.id)}>
                                <div
                                    data-internal-wrapper="true"
                                    className={`transition-opacity duration-150 ease-in-out ${objectPreview?.ready ? 'opacity-0' : 'opacity-100'}`}
                                    style={{
                                        width: 'max-content',
                                        height: 'max-content',
                                        '--zpl-letter-spacing': `${textCalibrations[obj.id]?.letterSpacingEm ?? 0}em`,
                                        transform: (() => {
                                            const w = obj.width || 0;
                                            const h = obj.height || 0;
                                            switch (obj.orientation) {
                                                case 'R':
                                                    return `translate(${h}px, 0px) rotate(90deg)`;
                                                case 'I':
                                                    return `translate(${w}px, ${h}px) rotate(180deg)`;
                                                case 'B':
                                                    return `translate(0px, ${w}px) rotate(270deg)`;
                                                default:
                                                    return `rotate(0deg)`;
                                            }
                                        })(),
                                        transformOrigin: 'top left',
                                    }}>
                                    {(() => {
                                        const def = ObjectRegistry.get(obj.type);
                                        const Component = def?.Component;
                                        return Component ? <Component object={obj} snapshot={objectSnapshots[obj.id]} /> : <span className="text-xs text-gray-500 select-none inline-block px-1 py-0.5">Unknown: {obj.type}</span>;
                                    })()}
                                </div>

                                {/* Resize Handles */}
                                {selectedObjectId === obj.id && obj.type === 'line' && (() => {
                                    const { start, end } = ObjectRegistry.get('line').class.getEndpoints(obj);
                                    return ['start', 'end'].map((key) => {
                                        const point = key === 'start' ? start : end;
                                        return (
                                            <div
                                                key={key}
                                                className="absolute w-3 h-3 bg-white border border-brand-600 rounded-full cursor-crosshair z-50"
                                                style={{ left: point.x - obj.x - 6, top: point.y - obj.y - 6 }}
                                                onMouseDown={(e) => handleResizeMouseDown(e, key, obj)}
                                            />
                                        );
                                    });
                                })()}
                                {selectedObjectId === obj.id && obj.type !== 'line' && (
                                    <>
                                        {/* Top-Left Handle */}
                                        <div className="absolute w-3 h-3 bg-white border border-brand-600 rounded-full cursor-nwse-resize z-50" style={{ top: -5, left: -5 }} onMouseDown={(e) => handleResizeMouseDown(e, 'tl', obj)} />
                                        {/* Bottom-Right Handle */}
                                        <div className="absolute w-3 h-3 bg-white border border-brand-600 rounded-full cursor-nwse-resize z-50" style={{ bottom: -5, right: -5 }} onMouseDown={(e) => handleResizeMouseDown(e, 'br', obj)} />
                                    </>
                                )}
                            </div>
                                </React.Fragment>
                            );
                        })}

                        {creationDrag && (() => {
                            const { start, end } = creationDrag;
                            if (activeTool === 'line') {
                                const line = ObjectRegistry.get('line').class.fromDrag({ start, end });
                                const up = line.slope === 'up';
                                return (
                                    <svg className="absolute pointer-events-none overflow-visible" style={{ left: line.x, top: line.y, zIndex: 9999 }} width={Math.max(1, line.lineWidth)} height={Math.max(1, line.lineHeight)}>
                                        <line x1="0" y1={up ? line.lineHeight : 0} x2={line.lineWidth} y2={up ? 0 : line.lineHeight} stroke="rgb(var(--theme-brand-6))" strokeWidth={2 / zoomLevel} strokeDasharray={`${6 / zoomLevel} ${4 / zoomLevel}`} />
                                    </svg>
                                );
                            }
                            return (
                                <div
                                    className="absolute pointer-events-none border-dashed bg-brand-500/10"
                                    style={{
                                        left: Math.min(start.x, end.x),
                                        top: Math.min(start.y, end.y),
                                        width: Math.abs(end.x - start.x),
                                        height: Math.abs(end.y - start.y),
                                        borderWidth: 1 / zoomLevel,
                                        borderColor: 'rgb(var(--theme-brand-6))',
                                        zIndex: 9999,
                                    }}
                                />
                            );
                        })()}
                    </div>
                </div>

                {/* Instructions Overlay */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500 pointer-events-none">Alt + Drag to Pan | Click & Drag Objects to Move | Drag with a tool to size new objects</div>
            </div>
            {/* Context Menu */}
            {contextMenu.visible && (
                <div className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-1 z-[100]" style={{ left: contextMenu.x, top: contextMenu.y }}>
                    <button onClick={() => reorderObject(contextMenu.objectId, 'front')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Send to Front
                    </button>
                    <button onClick={() => reorderObject(contextMenu.objectId, 'forward')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Send Forward
                    </button>
                    <button onClick={() => reorderObject(contextMenu.objectId, 'backward')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Send Backward
                    </button>
                    <button onClick={() => reorderObject(contextMenu.objectId, 'back')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Send to Back
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                        onClick={() => {
                            deleteObject(contextMenu.objectId);
                            handleCloseContextMenu();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        Delete
                    </button>
                </div>
            )}
        </main>
    );
}
