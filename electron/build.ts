import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'resources');
fs.mkdirSync(outDir, { recursive: true });

// NOTE: electron-builder requires the macOS icon PNG to be at least 512x512.
// We commit a pre-sized 1024x1024 icon at resources/aelyn-logo.png.
const srcLogo = path.join(process.cwd(), 'resources', 'aelyn-logo.png');
const dstLogo = path.join(outDir, 'aelyn-logo.png');
fs.copyFileSync(srcLogo, dstLogo);

console.log('Prepared electron resources:', dstLogo);

