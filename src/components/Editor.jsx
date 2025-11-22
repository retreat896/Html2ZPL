import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { useProject } from '../context/ProjectContext';
import { DPI_SCREEN } from '../constants/labelSizes';

export default function Editor() {
  const { activeLabel, addObject, selectedObjectId, setSelectedObjectId, updateObject, editorSettings, setEditorSettings } = useProject();
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

  // Settings Menu State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const canvasContainerRef = useRef(null);

  // Handle Zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

  // Calculate Label Dimensions in Pixels
  const getLabelDimensions = () => {
    if (!activeLabel) return { width: 0, height: 0 };
    const { width, height, unit } = activeLabel.settings;
    const pixelsPerUnit = unit === 'inch' ? DPI_SCREEN : (DPI_SCREEN / 25.4);
    return {
      width: width * pixelsPerUnit,
      height: height * pixelsPerUnit
    };
  };

  const labelDim = getLabelDimensions();

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
    
    // Get actual DOM dimensions
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Store dimensions (accounting for zoom)
    setObjDimensions({ 
      width: rect.width / zoomLevel, 
      height: rect.height / zoomLevel 
    });
    
    setSelectedObjectId(objId);
    setIsDraggingObj(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setObjStartPos({ x: currentX, y: currentY });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDraggingObj && selectedObjectId) {
      const dx = (e.clientX - dragStartPos.x) / zoomLevel;
      const dy = (e.clientY - dragStartPos.y) / zoomLevel;
      
      let newX = objStartPos.x + dx;
      let newY = objStartPos.y + dy;

      if (editorSettings.confineToLabel) {
        // Use the actual DOM dimensions captured at drag start
        const objWidth = objDimensions.width;
        const objHeight = objDimensions.height;

        // Apply bleed: positive bleed allows objects to extend beyond boundaries
        // Negative bleed creates an inset (more restrictive boundary)
        const bleed = editorSettings.bleed || 0;

        // Clamp position so the object stays within the label + bleed
        newX = Math.max(-bleed, Math.min(newX, labelDim.width + bleed - objWidth));
        newY = Math.max(-bleed, Math.min(newY, labelDim.height + bleed - objHeight));
      }
      
      updateObject(selectedObjectId, {
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingObj(false);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-2">
          {/* Tool Icons */}
          <button className="p-2 rounded-lg text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-700" title="Select Tool">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.8 3.8l16.4 16.4M20.2 3.8L3.8 20.2"></path></svg>
          </button>
          <button 
            onClick={() => addObject('text')}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" 
            title="Text Tool"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
          </button>
          <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Shape Tool">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* Settings Button */}
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={clsx("p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700", isSettingsOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 dark:text-gray-400")}
            title="Editor Settings"
          >
            <i className="fa-solid fa-gear"></i>
          </button>
          
          {isSettingsOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 space-y-3">
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={editorSettings.confineToLabel}
                        onChange={(e) => setEditorSettings({ ...editorSettings, confineToLabel: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">Confine to Label</span>
                </label>
                
                {editorSettings.confineToLabel && (
                    <div className="px-2 space-y-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            Bleed (px)
                        </label>
                        <input 
                            type="number" 
                            value={editorSettings.bleed || 0}
                            onChange={(e) => setEditorSettings({ ...editorSettings, bleed: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0"
                            step="1"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Positive: allow overhang. Negative: create inset.
                        </p>
                    </div>
                )}
            </div>
          )}

          {/* Zoom Controls */}
          <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={handleZoomOut} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white" title="Zoom Out">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        ref={canvasContainerRef}
      >
        <div 
            className="absolute origin-center transition-transform duration-75 ease-out"
            style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                left: '50%',
                top: '50%',
                marginLeft: -labelDim.width / 2,
                marginTop: -labelDim.height / 2,
            }}
        >
            {/* The Physical Label */}
            <div 
                className="bg-white shadow-2xl relative"
                style={{
                    width: labelDim.width,
                    height: labelDim.height,
                }}
            >
                 {activeLabel?.objects.map(obj => (
                    <div 
                        key={obj.id}
                        className={`absolute border cursor-move hover:border-blue-600 ${selectedObjectId === obj.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-transparent'}`}
                        style={{ 
                            left: obj.x, 
                            top: obj.y
                        }}
                        onMouseDown={(e) => handleObjectMouseDown(e, obj.id, obj.x, obj.y)}
                    >
                        {obj.type === 'text' && <span className="text-black whitespace-nowrap select-none inline-block px-1 py-0.5" style={{ fontSize: obj.fontSize }}>{obj.text}</span>}
                        {obj.type !== 'text' && <span className="text-xs text-gray-500 select-none inline-block px-1 py-0.5">{obj.type}</span>}
                    </div>
                 ))}
            </div>
        </div>
        
        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 pointer-events-none">
            Alt + Drag to Pan | Click & Drag Objects to Move
        </div>
      </div>
    </main>
  );
}
