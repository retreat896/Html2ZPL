import { getEditorCoordinates } from './zplMath';
import { TextObject } from '../registry/items/Text';
import { BarcodeObject } from '../registry/items/Barcode';
import { LineObject } from '../registry/items/Line';
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
                // [command, type, index of height param, index of interpretation-line param]
                const symbology = [
                    ['^BC', 'code128', 1, 2],
                    ['^B3', 'code39', 2, 3],
                    ['^BQ', 'qrcode'],
                    ['^BX', 'datamatrix'],
                ].find(([cmd]) => segment.includes(cmd));

                if (foParams && fdMatch && symbology) {
                    const [cmd, barcodeType, heightIndex, textIndex] = symbology;
                    const params = getCommandParams(segment, cmd) || [];
                    const byParams = getCommandParams(segment, '^BY');
                    let moduleWidth = parseInt(byParams?.[0], 10) || 2;
                    let data = fdMatch[1];

                    if (barcodeType === 'qrcode') {
                        moduleWidth = parseInt(params[2], 10) || 2;
                        data = data.replace(/^[A-Z]{2},/, '');
                    } else if (barcodeType === 'datamatrix') {
                        moduleWidth = parseInt(params[1], 10) || 2;
                    }

                    const zplObj = {
                        id,
                        type: 'barcode',
                        x: parseInt(foParams[0], 10),
                        y: parseInt(foParams[1], 10),
                        width,
                        height,
                        barHeight: heightIndex !== undefined ? parseInt(params[heightIndex], 10) || 60 : undefined,
                    };

                    const editorObj = getEditorCoordinates(zplObj, labelSettings);
                    Object.assign(editorObj, {
                        id,
                        data,
                        barcodeType,
                        moduleWidth,
                        showText: textIndex === undefined || params[textIndex] !== 'N',
                    });

                    objects.push({ obj: editorObj, z });
                }
            }
        } else if (segment.startsWith('Line Object ID:')) {
            const idMatch = segment.match(/ID:\s*([a-zA-Z0-9-]+)/);
            const zMatch = segment.match(/Z:\s*(\d+)/);
            const foParams = getCommandParams(segment, '^FO');
            const gbParams = getCommandParams(segment, '^GB');
            const gdParams = getCommandParams(segment, '^GD');

            if (idMatch && foParams && (gbParams || gdParams)) {
                const params = gdParams || gbParams;
                const boxWidth = parseInt(params[0], 10) || 1;
                const boxHeight = parseInt(params[1], 10) || 1;
                const thickness = parseInt(params[2], 10) || Math.min(boxWidth, boxHeight);
                const horizontal = boxWidth >= boxHeight;

                const editorObj = getEditorCoordinates({
                    id: idMatch[1],
                    type: 'line',
                    x: parseInt(foParams[0], 10),
                    y: parseInt(foParams[1], 10),
                    lineWidth: gdParams || horizontal ? boxWidth : 0,
                    lineHeight: gdParams || !horizontal ? boxHeight : 0,
                    thickness,
                }, labelSettings);
                editorObj.slope = gdParams?.[4] === 'R' ? 'up' : 'down';
                editorObj.color = params[3] || 'B';

                objects.push({ obj: editorObj, z: zMatch ? parseInt(zMatch[1], 10) : 0 });
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
        } else if (item.obj.type === 'line') {
            const instance = new LineObject(item.obj);
            Object.assign(instance, item.obj);
            return instance;
        }
        return null;
    }).filter(Boolean);
};
