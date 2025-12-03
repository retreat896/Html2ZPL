import { DISPLAY_DPI } from '../constants/editor';

/**
 * Converts a value from display pixels to printer dots.
 * @param {number} value - The value in display pixels.
 * @param {number} dpmm - Dots per millimeter of the printer.
 * @param {string} unit - The unit of the label dimensions ('inch' or 'mm').
 * @returns {number} - The value in printer dots.
 */
export const convertPixelsToDots = (value, dpmm, unit) => {
    if (typeof value !== 'number') return value;

    // Display uses 100 DPI (DISPLAY_DPI)
    // Printer uses actual dpmm (e.g., 8 dpmm = 203.2 dpi)
    
    const displayPixelsPerUnit = unit === 'inch' ? DISPLAY_DPI : (DISPLAY_DPI / 25.4);
    const printerDotsPerUnit = unit === 'inch' ? (25.4 * dpmm) : dpmm;
    const conversionRatio = printerDotsPerUnit / displayPixelsPerUnit;

    return Math.round(value * conversionRatio);
};

/**
 * Calculates the label dimensions in printer dots.
 * @param {number} width - Label width in label units.
 * @param {number} height - Label height in label units.
 * @param {number} dpmm - Dots per millimeter.
 * @param {string} unit - Label unit ('inch' or 'mm').
 * @returns {object} - { width, height } in dots.
 */
export const getLabelDimensionsInDots = (width, height, dpmm, unit) => {
    const printerDotsPerUnit = unit === 'inch' ? (25.4 * dpmm) : dpmm;

    return {
        width: Math.round(width * printerDotsPerUnit),
        height: Math.round(height * printerDotsPerUnit)
    };
};

/**
 * Converts an object's properties from display pixels to printer dots.
 * @param {object} object - The label object.
 * @param {object} labelSettings - The label settings (dpmm, unit).
 * @returns {object} - A new object with converted properties.
 */
export const getZplCoordinates = (object, labelSettings) => {
    const { dpmm, unit } = labelSettings;
    const convertedObj = { ...object };

    // Properties to convert
    // Rounding is an index (0-8), not a dimension, so we exclude it.
    const propsToConvert = ['x', 'y', 'width', 'height', 'thickness', 'fontSize'];

    propsToConvert.forEach(prop => {
        if (typeof convertedObj[prop] === 'number') {
            convertedObj[prop] = convertPixelsToDots(convertedObj[prop], dpmm, unit);
        }
    });

    return convertedObj;
};
