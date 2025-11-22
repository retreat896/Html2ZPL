import React from 'react';
import CommonProperties from './CommonProperties';
import TextProperties from './TextProperties';
import BarcodeProperties from './BarcodeProperties';
import GraphicProperties from './GraphicProperties';

export default function ObjectProperties({ object, onChange }) {
  if (!object) return null;

  const renderSpecificProperties = () => {
    switch (object.type) {
      case 'text':
        return <TextProperties object={object} onChange={onChange} />;
      case 'barcode':
        return <BarcodeProperties object={object} onChange={onChange} />;
      case 'graphic':
        return <GraphicProperties object={object} onChange={onChange} />;
      default:
        return <div className="text-sm text-gray-500">No specific properties for this type.</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
        <div className="text-sm text-gray-900 dark:text-white capitalize">{object.type}</div>
      </div>

      <CommonProperties object={object} onChange={onChange} />
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        {renderSpecificProperties()}
      </div>
    </div>
  );
}
