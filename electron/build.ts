import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'resources');
fs.mkdirSync(outDir, { recursive: true });

const srcLogo = path.join(process.cwd(), 'src', 'assets', 'aelyn-logo.png');
const dstLogo = path.join(outDir, 'aelyn-logo.png');
fs.copyFileSync(srcLogo, dstLogo);

console.log('Prepared electron resources:', dstLogo);

