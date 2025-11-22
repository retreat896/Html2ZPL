import React from 'react';

export default function GraphicProperties({ object, onChange }) {
  return (
    <>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Shape</label>
        <select
          value={object.shape || 'box'}
          onChange={(e) => onChange('shape', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
            <option value="box">Box</option>
            <option value="circle">Circle</option>
            <option value="line">Line</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Width</label>
            <input 
            type="number" 
            value={object.width}
            onChange={(e) => onChange('width', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
        </div>
        <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Height</label>
            <input 
            type="number" 
            value={object.height}
            onChange={(e) => onChange('height', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
        </div>
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Thickness</label>
        <input 
          type="number" 
          value={object.thickness}
          onChange={(e) => onChange('thickness', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </>
  );
}
