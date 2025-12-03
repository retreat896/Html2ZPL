const { zplToBase64Async } = require('zpl-renderer-js');

async function test() {
    // 4x6 inch at 203 DPI = 812x1218 dots
    const zpl = `
^XA
^PW812
^LL1218
^FO50,50^GB100,100,5^FS
^XZ
    `;

    try {
        console.log("Generating ZPL preview...");
        const base64 = await zplToBase64Async(zpl);
        console.log("Result length:", base64.length);
        console.log("First 50 chars:", base64.substring(0, 50));
        // We can't easily check image dimensions in node without another lib, 
        // but if it runs without error, that's a start.
        // The user says it "looks like 4x10".
        
        // Let's try to pass options if supported?
        // The library might accept options as second argument.
        const options = { dpmm: 8 }; // Try passing dpmm
        const base64WithOpts = await zplToBase64Async(zpl, options);
        console.log("Result with options length:", base64WithOpts.length);

    } catch (err) {
        console.error("Error:", err);
    }
}

test();
