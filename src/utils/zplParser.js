import { getEditorCoordinates } from './zplMath';
import { TextObject } from '../registry/items/Text';
import { BarcodeObject } from '../registry/items/Barcode';
// import GraphicObject from '../classes/items/GraphicObject'; // Not implemented yet

export const parseZPL = (zplString, labelSettings) => {
    const objects = [];

    // Helper to extract value from a command string
    // e.g. ^FO10,20 -> [10, 20]
    const getCommandParams = (str, cmd) => {
        const regex = new RegExp(`\\${cmd}([^\\^]*)`);
        const match = str.match(regex);
        return match ? match[1].split(',') : null;
    };

    // Split ZPL into segments based on the Object ID comment
    // This is safer than a global regex that tries to match everything at once
    const segments = zplString.split('^FX ');

    segments.forEach(segment => {
        // Check if this segment is an object definition
        // "Text Object ID: ... Z: ... W: ... H: ..."
        // "Barcode Object ID: ... Z: ... W: ... H: ..."

        if (segment.startsWith('Text Object ID:')) {
            const idMatch = segment.match(/ID:\s*([a-zA-Z0-9-]+)/);
            const zMatch = segment.match(/Z:\s*(\d+)/);
            const wMatch = segment.match(/W:\s*(\d+)/);
            const hMatch = segment.match(/H:\s*(\d+)/);

            if (idMatch) {
                const id = idMatch[1];
                const z = zMatch ? parseInt(zMatch[1], 10) : 0;
                const width = wMatch ? parseInt(wMatch[1], 10) : 0;
                const height = hMatch ? parseInt(hMatch[1], 10) : 0;

                // Find ^FO (Position)
                const foParams = getCommandParams(segment, '^FO');
                // Find ^A (Font)
                const aParams = getCommandParams(segment, '^A');
                // Find ^FD (Data)
                const fdMatch = segment.match(/\^FD(.*?)\^FS/);

                if (foParams && aParams && fdMatch) {
                    const x = parseInt(foParams[0], 10);
                    const y = parseInt(foParams[1], 10);

                    // ^Afont,orient,h,w
                    const fontSpec = aParams[0]; // "0N"
                    const fontSize = parseInt(aParams[1], 10);

                    const font = fontSpec.charAt(0);
                    const orientation = fontSpec.charAt(1);

                    const zplObj = {
                        id,
                        type: 'text',
                        x,
                        y,
                        width,
                        height,
                        font,
                        orientation,
                        fontSize,
                        text: fdMatch[1]
                    };

                    const editorObj = getEditorCoordinates(zplObj, labelSettings);
                    editorObj.text = zplObj.text;
                    editorObj.font = zplObj.font;
                    editorObj.orientation = zplObj.orientation;
                    editorObj.id = id;

                    objects.push({ obj: editorObj, z: parseInt(z, 10) });
                }
            }
        } else if (segment.startsWith('Barcode Object ID:')) {
            const idMatch = segment.match(/ID:\s*([a-zA-Z0-9-]+)/);
            const zMatch = segment.match(/Z:\s*(\d+)/);
            const wMatch = segment.match(/W:\s*(\d+)/);
            const hMatch = segment.match(/H:\s*(\d+)/);

            if (idMatch) {
                const id = idMatch[1];
                const z = zMatch ? parseInt(zMatch[1], 10) : 0;
                const width = wMatch ? parseInt(wMatch[1], 10) : 0;
                const height = hMatch ? parseInt(hMatch[1], 10) : 0;

                const foParams = getCommandParams(segment, '^FO');
                const fdMatch = segment.match(/\^FD(.*?)\^FS/);

                if (foParams && fdMatch) {
                    const x = parseInt(foParams[0], 10);
                    const y = parseInt(foParams[1], 10);
                    const data = fdMatch[1];

                    // Check for ^BC (Code128) or ^BQ (QR)
                    if (segment.includes('^BC')) {
                        const bcParams = getCommandParams(segment, '^BC');
                        // ^BCo,h,f,g,e,m
                        const bcHeight = bcParams ? parseInt(bcParams[1], 10) : 100;

                        const zplObj = {
                            id,
                            type: 'barcode',
                            x,
                            y,
                            width,
                            height: bcHeight, // Use explicit height from command if available, or fallback
                            barcodeType: 'code128',
                            data
                        };

                        // If we have explicit W/H from comment, use those as they represent the bounding box
                        if (width > 0) zplObj.width = width;
                        if (height > 0) zplObj.height = height;

                        const editorObj = getEditorCoordinates(zplObj, labelSettings);
                        editorObj.data = data;
                        editorObj.barcodeType = 'code128';
                        editorObj.id = id;

                        objects.push({ obj: editorObj, z: parseInt(z, 10) });

                    } else if (segment.includes('^BQ')) {
                        // ^BQN,2,w
                        const bqParams = getCommandParams(segment, '^BQ');
                        const modWidth = bqParams ? parseInt(bqParams[2], 10) : 2;

                        let cleanData = data;
                        if (cleanData.startsWith('QA,')) {
                            cleanData = cleanData.substring(3);
                        }

                        const zplObj = {
                            id,
                            type: 'barcode',
                            x,
                            y,
                            width: modWidth, // This is module width, not total width
                            height: 0,
                            barcodeType: 'qrcode',
                            data: cleanData
                        };

                        // Use comment dimensions for bounding box
                        if (width > 0) zplObj.width = width;
                        if (height > 0) zplObj.height = height;

                        const editorObj = getEditorCoordinates(zplObj, labelSettings);
                        editorObj.data = cleanData;
                        editorObj.barcodeType = 'qrcode';
                        editorObj.id = id;

                        objects.push({ obj: editorObj, z: parseInt(z, 10) });
                    }
                }
            }
        }
    });

    // Sort by Z-index
    objects.sort((a, b) => a.z - b.z);

    // Instantiate classes
    return objects.map(item => {
        if (item.obj.type === 'text') {
            const instance = new TextObject(item.obj);
            Object.assign(instance, item.obj);
            return instance;
        } else if (item.obj.type === 'barcode') {
            const instance = new BarcodeObject(item.obj);
            Object.assign(instance, item.obj);
            return instance;
        }
        return null;
    }).filter(Boolean);
};
