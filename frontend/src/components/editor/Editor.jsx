import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useProject } from '../../context/ProjectContext';
import ObjectRegistry from '../../classes/ObjectRegistry';

import { DISPLAY_DPI } from '../../constants/editor';
import { zplToBase64Async } from 'zpl-renderer-js';
import { getLabelDimensionsInDots } from '../../utils/zplMath';

export default function Editor() {
    const { activeLabel, activeLabelId, addObject, deleteObject, selectedObjectId, setSelectedObjectId, updateObject, reorderObject, editorSettings, setEditorSettings, generateZPL } = useProject();
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

    // Preview State
    const [previewImage, setPreviewImage] = useState(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [prevLabelId, setPrevLabelId] = useState(activeLabelId);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, objectId: null });

    // Trigger loading state immediately when label changes (prevents flash)
    if (activeLabelId !== prevLabelId) {
        setPrevLabelId(activeLabelId);
        setIsPreviewLoading(true);
    }

    // Settings Menu State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const canvasContainerRef = useRef(null);
    const fileInputRef = useRef(null);

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

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            const img = new Image();
            img.onload = () => {
                addObject('image', {
                    src: dataUrl,
                    width: img.width,
                    height: img.height,
                });
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

    const handleResizeMouseDown = (e, handle, obj) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeHandle(handle);
        setResizeStartPos({ x: e.clientX, y: e.clientY });

        const element = e.currentTarget.parentElement;
        const rect = element.getBoundingClientRect();

        setInitialObjProps({
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
        if (isPanning) {
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
        if (isPanning || isDraggingObj || isResizing) {
            const onMove = (e) => handlersRef.current.move(e);
            const onUp = (e) => handlersRef.current.up(e);

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            return () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
            };
        }
    }, [isPanning, isDraggingObj, isResizing]);

    useEffect(() => {
        if (!activeLabel || !activeLabelId || isDraggingObj || isResizing) return;

        const updatePreview = async () => {
            try {
                if (activeLabel.objects.length === 0) {
                    setPreviewImage(null);
                    setIsPreviewLoading(false);
                    return;
                }

                const zpl = generateZPL(activeLabelId);
                if (zpl && zpl.trim().length > 0) {
                    const { width, height, unit, dpmm } = activeLabel.settings;
                    const widthMm = unit === 'inch' ? width * 25.4 : width;
                    const heightMm = unit === 'inch' ? height * 25.4 : height;

                    const png = await zplToBase64Async(zpl, widthMm, heightMm, dpmm);
                    if (png) {
                        setPreviewImage(png.startsWith('data:') ? png : `data:image/png;base64,${png}`);
                        setIsPreviewLoading(false);
                    }
                }
            } catch (err) {
                console.error('Failed to update preview:', err);
                setIsPreviewLoading(false);
            }
        };

        const timeoutId = setTimeout(updatePreview, 500);
        return () => clearTimeout(timeoutId);
    }, [activeLabelId, activeLabel, isDraggingObj, isResizing, generateZPL]);

    return (
        <main className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 z-10">
                <div className="flex items-center gap-2">
                    {/* Tool Icons */}
                    <button className="p-2 rounded-lg text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-700" title="Select Tool">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.8 3.8l16.4 16.4M20.2 3.8L3.8 20.2"></path>
                        </svg>
                    </button>
                    <button onClick={() => addObject('text')} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Text Tool">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7"></polyline>
                            <line x1="9" y1="20" x2="15" y2="20"></line>
                            <line x1="12" y1="4" x2="12" y2="20"></line>
                        </svg>
                    </button>
                    <button onClick={() => addObject('graphic')} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Shape Tool">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        </svg>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Image Tool">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                <div className="flex items-center gap-2 relative">
                    {/* Settings Button */}
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={clsx('p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700', isSettingsOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-500 dark:text-gray-400')} title="Editor Settings">
                        <i className="fa-solid fa-gear"></i>
                    </button>

                    {isSettingsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 space-y-3">
                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.confineToLabel} onChange={(e) => setEditorSettings({ ...editorSettings, confineToLabel: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
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
                                <input type="checkbox" checked={editorSettings.showGrid} onChange={(e) => setEditorSettings({ ...editorSettings, showGrid: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Show Grid</span>
                            </label>

                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.snapToGrid} onChange={(e) => setEditorSettings({ ...editorSettings, snapToGrid: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Snap to Grid</span>
                            </label>

                            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                                <input type="checkbox" checked={editorSettings.showHtmlObjects} onChange={(e) => setEditorSettings({ ...editorSettings, showHtmlObjects: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200">Show HTML Objects</span>
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
                className="flex-1 overflow-hidden bg-gray-200 dark:bg-gray-900 relative cursor-grab active:cursor-grabbing"
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
                        className="bg-white shadow-2xl relative transition-all duration-300 ease-in-out"
                        style={{
                            width: labelDim.width,
                            height: labelDim.height,
                        }}>
                        {/* ZPL Preview Layer (Behind Grid) */}
                        {previewImage && (
                            <img
                                src={previewImage}
                                alt="ZPL Preview"
                                className={`absolute inset-0 w-full h-full object-fill pointer-events-none select-none z-0 transition-opacity duration-300 ease-in-out ${isPreviewLoading ? 'opacity-0' : editorSettings.showHtmlObjects ? 'opacity-50' : 'opacity-100'}`}
                                draggable={false}
                            />
                        )}

                        {/* Grid Overlay */}
                        {editorSettings.showGrid && (
                            <div
                                className="absolute inset-0 pointer-events-none z-0"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='${editorSettings.gridSize}' height='${editorSettings.gridSize}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M ${editorSettings.gridSize} 0 L 0 0 0 ${editorSettings.gridSize}' fill='none' stroke='rgba(0,0,0,0.1)' stroke-width='1'/%3E%3C/svg%3E")`,
                                    backgroundSize: `${editorSettings.gridSize}px ${editorSettings.gridSize}px`,
                                }}
                            />
                        )}

                        {activeLabel?.objects.map((obj) => (
                            <div
                                key={obj.id}
                                data-object-id={obj.id}
                                className={`absolute cursor-move hover:ring-1 hover:ring-blue-600 ${selectedObjectId === obj.id ? 'ring-1 ring-blue-600' : ''} z-10 transition-opacity duration-300 ease-in-out ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
                                style={{
                                    left: obj.x,
                                    top: obj.y,
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
                                onContextMenu={(e) => handleContextMenu(e, obj.id)}>
                                <div
                                    data-internal-wrapper="true"
                                    className={`transition-opacity duration-300 ease-in-out ${!editorSettings.showHtmlObjects ? 'opacity-0' : 'opacity-100'}`}
                                    style={{
                                        width: 'max-content',
                                        height: 'max-content',
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
                                        return Component ? <Component object={obj} /> : <span className="text-xs text-gray-500 select-none inline-block px-1 py-0.5">Unknown: {obj.type}</span>;
                                    })()}
                                </div>

                                {/* Resize Handles */}
                                {selectedObjectId === obj.id && (
                                    <>
                                        {/* Top-Left Handle */}
                                        <div className="absolute w-3 h-3 bg-white border border-blue-600 rounded-full cursor-nwse-resize z-50" style={{ top: -5, left: -5 }} onMouseDown={(e) => handleResizeMouseDown(e, 'tl', obj)} />
                                        {/* Bottom-Right Handle */}
                                        <div className="absolute w-3 h-3 bg-white border border-blue-600 rounded-full cursor-nwse-resize z-50" style={{ bottom: -5, right: -5 }} onMouseDown={(e) => handleResizeMouseDown(e, 'br', obj)} />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions Overlay */}
                <div className="absolute bottom-4 left-4 text-xs text-gray-500 pointer-events-none">Alt + Drag to Pan | Click & Drag Objects to Move</div>
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
