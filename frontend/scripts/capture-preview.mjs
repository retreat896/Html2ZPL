import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';

const previewUrl = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/editor/new';
const outputPath = resolve(process.env.PREVIEW_OUTPUT || 'public/HomePagePreview.png');
const showcaseZpl = [
    '^XA',
    '^FX Text Object ID: Brand Z:0 W:620 H:48',
    '^FO48,48^A0N,48,42^FDNORTHSTAR OUTFITTERS^FS',
    '^FX Text Object ID: Service Z:1 W:600 H:78',
    '^FO48,142^A0N,76,68^FDEXPRESS DELIVERY^FS',
    '^FX Text Object ID: TrackingCaption Z:2 W:340 H:28',
    '^FO48,252^A0N,26,24^FDTRACKING NUMBER^FS',
    '^FX Text Object ID: TrackingNumber Z:3 W:500 H:42',
    '^FO48,294^A0N,40,36^FD1Z 84X 92W 03 2847 5931^FS',
    '^FX Barcode Object ID: TrackingBarcode Z:4 W:640 H:170',
    '^FO48,365^BCN,170,Y,N,N^FD1Z84X92W0328475931^FS',
    '^FX Text Object ID: AddressCaption Z:5 W:320 H:28',
    '^FO48,770^A0N,26,24^FDDELIVER TO^FS',
    '^FX Text Object ID: Recipient Z:6 W:420 H:42',
    '^FO48,820^A0N,38,34^FDMORGAN TAYLOR^FS',
    '^FX Text Object ID: Address Z:7 W:490 H:38',
    '^FO48,870^A0N,30,28^FD42 MAPLE AVE, PORTLAND^FS',
    '^FX Barcode Object ID: RouteCode Z:8 W:160 H:160',
    '^FO500,780^BQN,2,6^FDQA,ROUTE-PDX-17^FS',
    '^XZ',
].join('\n');

await mkdir(dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        deviceScaleFactor: 1,
        colorScheme: 'light',
    });

    await page.addInitScript(() => {
        localStorage.setItem('html2zpl_settings', JSON.stringify({ showHtmlObjects: false, showGrid: false }));
    });
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('input[type="file"]').first().setInputFiles({
        name: 'northstar-shipping.zpl',
        mimeType: 'text/plain',
        buffer: Buffer.from(showcaseZpl),
    });
    await page.getByText('Imported Label', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('[data-object-id]').length >= 9, { timeout: 30000 });
    await page.locator('[data-object-id]').first().click();
    await page.waitForFunction(() => {
        const preview = document.querySelector('img[alt="ZPL Preview"]');
        return preview && preview.complete && preview.naturalWidth > 0;
    }, { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: outputPath });
    console.log(`Preview PNG written to ${outputPath}`);
} finally {
    await browser.close();
}