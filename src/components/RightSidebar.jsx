import React, { useState } from 'react';
import clsx from 'clsx';
import { useProject } from '../context/ProjectContext';
import { LABEL_SIZES } from '../constants/labelSizes';
import ObjectRegistry from '../classes/ObjectRegistry';
import PropertiesRenderer from './properties/PropertiesRenderer';

export default function RightSidebar() {
  const { activeLabel, updateLabelSettings, selectedObjectId, updateObject } = useProject();
  const selectedObject = activeLabel?.objects.find(obj => obj.id === selectedObjectId);

  // Track sidebar open/closed state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Track which panels are open
  const [openPanels, setOpenPanels] = useState({
    labelSettings: true,
    objectProperties: true
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const togglePanel = (panelName) => {
    // If sidebar is closed, open it AND the clicked panel
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setOpenPanels(prev => ({ ...prev, [panelName]: true }));
    } else {
      // Normal toggle behavior when sidebar is open
      setOpenPanels(prev => ({ ...prev, [panelName]: !prev[panelName] }));
    }
  };

  const handleSizeChange = (e) => {
    const sizeName = e.target.value;
    const size = LABEL_SIZES.find(s => s.name === sizeName);
    if (size && activeLabel) {
      updateLabelSettings(activeLabel.id, {
        width: size.width,
        height: size.height,
        unit: size.unit
      });
    }
  };

  const handleDimensionChange = (key, value) => {
    if (activeLabel) {
      updateLabelSettings(activeLabel.id, { [key]: parseFloat(value) });
    }
  };

  const handleObjectPropChange = (key, value) => {
    if (selectedObjectId) {
        updateObject(selectedObjectId, { [key]: value });
    }
  };

  return (
    <aside 
      id="right-sidebar" 
      className={clsx(
        "h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-80" : "w-12"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {isSidebarOpen && (
          <>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
              <i className="fa-solid fa-wrench text-gray-600 dark:text-gray-400"></i>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Properties</h3>
            </div>
          </>
        )}
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto"
            title="Properties"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
      </div>

      {/* Collapsible Panels */}
      <div className="flex-1 overflow-y-auto">
        
        {isSidebarOpen ? (
          <>
            {/* Label Settings Panel - Full View */}
            <CollapsiblePanel
              title="Label Settings"
              icon="fa-ruler-combined"
              isOpen={openPanels.labelSettings}
              onToggle={() => togglePanel('labelSettings')}
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Preset Size</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    onChange={handleSizeChange}
                    defaultValue=""
                  >
                    <option value="" disabled>Select a size</option>
                    {LABEL_SIZES.map((size, idx) => (
                      <option key={idx} value={size.name}>{size.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Width ({activeLabel?.settings.unit})</label>
                    <input 
                      type="number" 
                      value={activeLabel?.settings.width || 0}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Height ({activeLabel?.settings.unit})</label>
                    <input 
                      type="number" 
                      value={activeLabel?.settings.height || 0}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Printer Density</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={activeLabel?.settings.dpmm || 8}
                    onChange={(e) => handleDimensionChange('dpmm', e.target.value)}
                  >
                    <option value="6">6 dpmm (152 dpi)</option>
                    <option value="8">8 dpmm (203 dpi)</option>
                    <option value="12">12 dpmm (300 dpi)</option>
                    <option value="24">24 dpmm (600 dpi)</option>
                  </select>
                </div>
              </div>
            </CollapsiblePanel>

            {/* Object Properties Panel - Full View */}
            <CollapsiblePanel
              title="Object Properties"
              icon="fa-cube"
              isOpen={openPanels.objectProperties}
              onToggle={() => togglePanel('objectProperties')}
            >
              {!selectedObject ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">Select an object to edit properties.</p>
              ) : (
                (() => {
                    const def = ObjectRegistry.get(selectedObject.type);
                    // Use dynamic properties schema if available
                    if (def && def.class && def.class.properties) {
                        return (
                            <PropertiesRenderer 
                                object={selectedObject} 
                                onChange={handleObjectPropChange}
                                schema={def.class.properties}
                            />
                        );
                    }
                    
                    // Fallback to old Properties component if schema is missing (shouldn't happen with new items)
                    const PropertiesComponent = def?.Properties;
                    return PropertiesComponent ? (
                        <PropertiesComponent 
                            object={selectedObject} 
                            onChange={handleObjectPropChange}
                            labelSettings={activeLabel?.settings}
                        />
                    ) : (
                        <div className="text-sm text-gray-500">No properties for this type.</div>
                    );
                })()
              )}
            </CollapsiblePanel>
          </>
        ) : (
          <>
            {/* Icon-only view when collapsed */}
            <button
              onClick={() => togglePanel('labelSettings')}
              className="w-full p-3 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              title="Label Settings"
            >
              <i className="fa-solid fa-ruler-combined text-gray-600 dark:text-gray-400"></i>
            </button>
            
            <button
              onClick={() => togglePanel('objectProperties')}
              className="w-full p-3 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              title="Object Properties"
            >
              <i className="fa-solid fa-cube text-gray-600 dark:text-gray-400"></i>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function CollapsiblePanel({ title, icon, isOpen, onToggle, children }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      {/* Panel Header */}
      <div 
        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={onToggle}
      >
        <i className={clsx("fa-solid text-gray-600 dark:text-gray-400", icon)}></i>
        <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{title}</span>
        <i className={clsx("fa-solid text-xs text-gray-500 transition-transform", isOpen ? "fa-chevron-down" : "fa-chevron-right")}></i>
      </div>
      
      {/* Panel Content */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
