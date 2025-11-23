import LabelObject from '../LabelObject';

export default class TextObject extends LabelObject {
    constructor(props = {}) {
        super('text', props);
        this.text = props.text || 'New Text';
        this.font = props.font || '0'; // ZPL font 0
        this.fontSize = props.fontSize || 30;
        this.orientation = props.orientation || 'N'; // N, R, I, B
    }

    toZPL() {
        // ^FOx,y^Afont,orientation,height,width^FDdata^FS
        return `^FX Text Object ID: ${this.id}
^FO${this.x},${this.y}^A${this.font}${this.orientation},${this.fontSize},${this.fontSize}^FD${this.text}^FS`;
    }

    getProps() {
        return {
            text: this.text,
            font: this.font,
            fontSize: this.fontSize,
            orientation: this.orientation
        };
    }

    resize(handle, delta, settings, initialProps) {
        const { dx, dy } = delta;
        const { snapToGrid, gridSize, confineToLabel, bleed, labelDim } = settings;
        
        let newProps = {};
        let scaleFactor = 1;

        // Fixed padding values from TextComponent (px-1 = 4px, py-0.5 = 2px)
        const PAD_W = 8; // 4px left + 4px right
        const PAD_H = 4; // 2px top + 2px bottom

        // Calculate content dimensions (without padding)
        const contentWidth = Math.max(1, initialProps.domWidth - PAD_W);
        const contentHeight = Math.max(1, initialProps.domHeight - PAD_H);

        // Calculate scale factor based on handle movement
        if (handle === 'br') {
            scaleFactor = (initialProps.domHeight + dy) / initialProps.domHeight;
        } else if (handle === 'tl') {
            scaleFactor = (initialProps.domHeight - dy) / initialProps.domHeight;
        }

        // Calculate proposed font size
        let newFontSize = Math.max(5, initialProps.fontSize * scaleFactor);
        newFontSize = Math.round(newFontSize);

        // Check confinement
        if (confineToLabel) {
            // Helper to calculate dimensions at a given font size
            const getDims = (fs) => {
                const ratio = fs / initialProps.fontSize;
                return {
                    w: (contentWidth * ratio) + PAD_W,
                    h: (contentHeight * ratio) + PAD_H
                };
            };

            let { w: newWidth, h: newHeight } = getDims(newFontSize);

            if (handle === 'br') {
                const maxX = labelDim.width + bleed;
                const maxY = labelDim.height + bleed;
                
                // Check Width
                if (initialProps.x + newWidth > maxX) {
                    const maxW = maxX - initialProps.x;
                    // maxW = (contentW * ratio) + PAD_W
                    // ratio = (maxW - PAD_W) / contentW
                    const maxRatio = Math.max(0, maxW - PAD_W) / contentWidth;
                    newFontSize = Math.floor(initialProps.fontSize * maxRatio);
                    // Recalculate dimensions
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                }
                
                // Check Height
                if (initialProps.y + newHeight > maxY) {
                    const maxH = maxY - initialProps.y;
                    const maxRatio = Math.max(0, maxH - PAD_H) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(initialProps.fontSize * maxRatio));
                }

            } else if (handle === 'tl') {
                const minX = -bleed;
                const minY = -bleed;
                
                const brX = initialProps.x + initialProps.domWidth;
                const brY = initialProps.y + initialProps.domHeight;
                
                let newX = brX - newWidth;
                let newY = brY - newHeight;

                // Check Left
                if (newX < minX) {
                    const maxW = brX - minX;
                    const maxRatio = Math.max(0, maxW - PAD_W) / contentWidth;
                    newFontSize = Math.floor(initialProps.fontSize * maxRatio);
                    // Recalculate
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }

                // Check Top
                if (newY < minY) {
                    const maxH = brY - minY;
                    const maxRatio = Math.max(0, maxH - PAD_H) / contentHeight;
                    newFontSize = Math.min(newFontSize, Math.floor(initialProps.fontSize * maxRatio));
                    // Recalculate
                    ({ w: newWidth, h: newHeight } = getDims(newFontSize));
                    newX = brX - newWidth;
                    newY = brY - newHeight;
                }
                
                newProps.x = newX;
                newProps.y = newY;
            }
        } else {
            // Unconfined TL logic
            if (handle === 'tl') {
                const ratio = newFontSize / initialProps.fontSize;
                const newWidth = (contentWidth * ratio) + PAD_W;
                const newHeight = (contentHeight * ratio) + PAD_H;
                
                const brX = initialProps.x + initialProps.domWidth;
                const brY = initialProps.y + initialProps.domHeight;
                
                newProps.x = brX - newWidth;
                newProps.y = brY - newHeight;
            }
        }
        
        // Ensure minimum font size
        newProps.fontSize = Math.max(5, newFontSize);
        
        // Grid snapping for TL position
        if (handle === 'tl' && snapToGrid && newProps.x !== undefined) {
             newProps.x = Math.round(newProps.x / gridSize) * gridSize;
             newProps.y = Math.round(newProps.y / gridSize) * gridSize;
        }

        return newProps;
    }
}
