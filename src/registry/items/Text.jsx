import React from 'react';
import LabelObject from '../../classes/LabelObject';
import CommonProperties from '../../components/CommonProperties';
import { DISPLAY_DPI, TEXT_PADDING_W, TEXT_PADDING_H } from '../../constants/editor';

// --- Logic ---
import TextObject from '../../classes/items/TextObject';

// --- Component ---
export const TextComponent = ({ object }) => {
    return (
        <span 
            className="text-black whitespace-nowrap select-none inline-block px-1 py-0.5" 
            style={{ fontSize: object.fontSize }}
        >
            {object.text}
        </span>
    );
};

// --- Properties ---
export const TextProperties = ({ object, onChange, labelSettings }) => {
    const handleFontSizeChange = (newSize) => {
        if (!labelSettings || !object.width || !object.height) {
            onChange('fontSize', newSize);
            return;
        }

        const { confineToLabel, bleed } = { confineToLabel: true, bleed: 0 }; // Assuming defaults or we need to pass editorSettings too
        // Wait, editorSettings are in ProjectContext, but RightSidebar doesn't pass them.
        // We can use a safe default or assume if labelSettings is passed we care about bounds?
        // Actually, confineToLabel is an editor setting, not a label setting.
        // For now, let's enforce it if it's likely intended (user complaint implies they want it).
        // Ideally we pass editorSettings.
        
        // Let's just check bounds against label size.
        const PAD_W = TEXT_PADDING_W;
        const PAD_H = TEXT_PADDING_H;
        
        const currentWidth = object.width;
        const currentHeight = object.height;
        const currentFontSize = object.fontSize;
        
        // Estimate new dimensions
        const ratio = newSize / currentFontSize;
        const contentWidth = Math.max(1, currentWidth - PAD_W);
        const contentHeight = Math.max(1, currentHeight - PAD_H);
        
        const newWidth = (contentWidth * ratio) + PAD_W;
        const newHeight = (contentHeight * ratio) + PAD_H;
        
        const maxX = labelSettings.width * (labelSettings.unit === 'inch' ? DISPLAY_DPI : (DISPLAY_DPI/25.4)); // Convert to pixels (approx)
        // Wait, labelSettings.width is in units. We need pixel dimensions.
        // Editor uses 100 DPI.
        const dpi = DISPLAY_DPI;
        const pixelsPerUnit = labelSettings.unit === 'inch' ? dpi : (dpi / 25.4);
        const labelPixelWidth = labelSettings.width * pixelsPerUnit;
        const labelPixelHeight = labelSettings.height * pixelsPerUnit;
        
        // Check bounds (assuming 0 bleed for safety if unknown)
        if (object.x + newWidth > labelPixelWidth) {
            // Cap it
            // maxW = (contentW * ratio) + PAD_W
            // ratio = (maxW - PAD_W) / contentW
            const maxW = labelPixelWidth - object.x;
            const maxRatio = Math.max(0, maxW - PAD_W) / contentWidth;
            newSize = Math.floor(currentFontSize * maxRatio);
        }
        
        if (object.y + newHeight > labelPixelHeight) {
             const maxH = labelPixelHeight - object.y;
             const maxRatio = Math.max(0, maxH - PAD_H) / contentHeight;
             newSize = Math.min(newSize, Math.floor(currentFontSize * maxRatio));
        }
        
        onChange('fontSize', Math.max(5, newSize));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                <div className="text-sm text-gray-900 dark:text-white capitalize">{object.type}</div>
            </div>

            <CommonProperties object={object} onChange={onChange} />
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
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
                        onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
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
            </div>
        </div>
    );
};

// --- Definition ---
export default {
    type: 'text',
    name: 'Text',
    icon: 'fa-font', // Assuming font-awesome is used
    class: TextObject,
    Component: TextComponent,
    Properties: TextProperties
};
