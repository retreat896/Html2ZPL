import React from 'react';
import clsx from 'clsx';
import { useProject } from '../context/ProjectContext';
import { LABEL_SIZES } from '../constants/labelSizes';
import ObjectProperties from './properties/ObjectProperties';

export default function RightSidebar({ isOpen, toggleRightSidebar }) {
  const { activeLabel, updateLabelSettings, selectedObjectId, updateObject } = useProject();

  const selectedObject = activeLabel?.objects.find(obj => obj.id === selectedObjectId);

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
        "relative h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 z-30 flex flex-col shrink-0 transition-all duration-300 ease-in-out",
        isOpen ? "w-72 translate-x-0" : "w-20 translate-x-0"
      )}
    >
      {/* Header */}
      <div id="right-sidebar-header" className="transition-all h-16 flex items-center gap-x-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={toggleRightSidebar}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex"
        >
          <i className={clsx("fa-solid", isOpen ? "fa-chevron-right" : "fa-chevron-left")}></i>
        </button>
        <h3 className={clsx("transition-all text-lg font-semibold text-gray-800 dark:text-white whitespace-nowrap", !isOpen && "opacity-0")}>
          Properties
        </h3>
      </div>

      {/* Content */}
      <div id="right-sidebar-content" className={clsx("flex-1 overflow-y-auto p-4 space-y-6 transition-all", !isOpen && "opacity-0 invisible")}>
        
        {/* Label Settings Section */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-700 pb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Label Settings</h4>
            
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
        </div>

        {/* Object Properties */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Object Properties</h4>
          
          {!selectedObject ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">Select an object to edit properties.</p>
          ) : (
            <ObjectProperties object={selectedObject} onChange={handleObjectPropChange} />
          )}
        </div>
      </div>
    </aside>
  );
}
