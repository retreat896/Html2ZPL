import React from 'react';

export default function CommonProperties({ object, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">X</label>
        <input 
          type="number" 
          value={Math.round(object.x)}
          onChange={(e) => onChange('x', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Y</label>
        <input 
          type="number" 
          value={Math.round(object.y)}
          onChange={(e) => onChange('y', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}
