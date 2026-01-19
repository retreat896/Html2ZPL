export const generateZPL = (projectData) => {
    let zpl = '';

    if (!projectData || !projectData.labels) {
        return '';
    }

    projectData.labels.forEach(label => {
        zpl += '^XA\n';
        zpl += `^FX Label: ${label.name}\n`;
        
        // Label settings (optional, e.g., ^LL for length, ^PW for width)
        // zpl += `^PW${label.settings.width * label.settings.dpmm}\n`;
        // zpl += `^LL${label.settings.height * label.settings.dpmm}\n`;

        if (label.objects) {
            label.objects.forEach(obj => {
                // We assume obj is an instance of LabelObject or has a toZPL method
                // If it's a plain object (from JSON), we might need to hydrate it first
                // But for now, let's assume the state holds instances or we handle it here.
                
                // If obj is a plain object, we can't call toZPL directly unless we re-instantiate.
                // Ideally, the state should hold instances.
                if (typeof obj.toZPL === 'function') {
                    zpl += obj.toZPL() + '\n';
                } else {
                    console.warn('Object does not have toZPL method:', obj);
                }
            });
        }

        zpl += '^XZ\n\n';
    });

    return zpl;
};
