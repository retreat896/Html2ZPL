/**
 * Snaps a value to the nearest grid line.
 * @param {number} value - The value to snap.
 * @param {number} gridSize - The grid size in pixels.
 * @returns {number} - The snapped value.
 */
export const snap = (value, gridSize) => {
    return Math.round(value / gridSize) * gridSize;
};

/**
 * Confines a rectangle to the label boundaries.
 * @param {object} rect - { x, y, width, height }
 * @param {object} labelDim - { width, height }
 * @param {number} bleed - Bleed in pixels.
 * @returns {object} - The confined { x, y } (width/height are usually inputs to this check).
 */
export const confine = (rect, labelDim, bleed) => {
    const minX = -bleed;
    const minY = -bleed;
    const maxX = labelDim.width + bleed - rect.width;
    const maxY = labelDim.height + bleed - rect.height;

    return {
        x: Math.max(minX, Math.min(rect.x, maxX)),
        y: Math.max(minY, Math.min(rect.y, maxY))
    };
};

/**
 * Calculates new dimensions for a generic box-like object during resizing.
 * @param {object} params - { handle, delta, settings, initialProps }
 * @returns {object} - New properties { x, y, width, height }
 */
export const calculateNewDimensions = ({ handle, delta, settings, initialProps }) => {
    const { dx, dy } = delta;
    const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;
    const minSize = 10;
    
    let newProps = {};

    if (handle === 'br') {
        // Bottom-Right: Changes width/height, x/y fixed
        let newWidth = Math.max(minSize, initialProps.width + dx);
        let newHeight = Math.max(minSize, initialProps.height + dy);

        if (snapToGrid) {
            newWidth = snap(newWidth, gridSize);
            newHeight = snap(newHeight, gridSize);
        }

        if (confineToLabel) {
            const maxWidth = labelDim.width + bleed - initialProps.x;
            const maxHeight = labelDim.height + bleed - initialProps.y;
            newWidth = Math.min(newWidth, Math.max(minSize, maxWidth));
            newHeight = Math.min(newHeight, Math.max(minSize, maxHeight));
        }

        newProps.width = newWidth;
        newProps.height = newHeight;

    } else if (handle === 'tl') {
        // Top-Left: Changes x/y AND width/height. Anchor is Bottom-Right.
        const brX = initialProps.x + initialProps.width;
        const brY = initialProps.y + initialProps.height;

        // Proposed new Top-Left
        let newX = initialProps.x + dx;
        let newY = initialProps.y + dy;

        if (snapToGrid) {
            newX = snap(newX, gridSize);
            newY = snap(newY, gridSize);
        }

        // Confinement checks for Top-Left
        if (confineToLabel) {
            newX = Math.max(-bleed, newX);
            newY = Math.max(-bleed, newY);
        }

        // Ensure we don't cross the bottom-right anchor (minus min size)
        newX = Math.min(newX, brX - minSize);
        newY = Math.min(newY, brY - minSize);

        // Calculate dimensions based on final x/y and fixed brX/brY
        newProps.x = newX;
        newProps.y = newY;
        newProps.width = brX - newX;
        newProps.height = brY - newY;
    }

    return newProps;
};
