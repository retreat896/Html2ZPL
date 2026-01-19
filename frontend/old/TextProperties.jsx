import React from 'react';

export default function TextProperties({ object, onChange }) {
  return (
    <>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Text</label>
        <input 
          type="text" 
          value={object.text}
          onChange={(e) => onChange('text', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Font Size</label>
        <input 
          type="number" 
          value={object.fontSize}
          onChange={(e) => onChange('fontSize', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Orientation</label>
        <select
          value={object.orientation || 'N'}
          onChange={(e) => onChange('orientation', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
            <option value="N">Normal</option>
            <option value="R">Rotated 90</option>
            <option value="I">Inverted 180</option>
            <option value="B">Bottom Up 270</option>
        </select>
      </div>
    </>
  );
}
