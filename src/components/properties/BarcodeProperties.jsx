import React from 'react';

export default function BarcodeProperties({ object, onChange }) {
  return (
    <>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Data</label>
        <input 
          type="text" 
          value={object.data}
          onChange={(e) => onChange('data', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
        <select
          value={object.barcodeType || 'code128'}
          onChange={(e) => onChange('barcodeType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
            <option value="code128">Code 128</option>
            <option value="qrcode">QR Code</option>
            {/* Add more types as needed */}
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
    </>
  );
}
