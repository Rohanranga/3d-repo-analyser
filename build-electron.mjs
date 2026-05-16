import fs from 'fs';
import path from 'path';

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });

  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);

    if (fs.lstatSync(fromPath).isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else {
      copyFolderSync(fromPath, toPath);
    }
  });
}

console.log('Copying static assets to standalone directory...');

const standaloneDir = path.join(process.cwd(), '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('Error: .next/standalone does not exist. Did `next build` run first?');
  process.exit(1);
}

// Copy public directory
const publicDir = path.join(process.cwd(), 'public');
const standalonePublicDir = path.join(standaloneDir, 'public');
copyFolderSync(publicDir, standalonePublicDir);
console.log('Copied public directory.');

// Copy .next/static directory
const staticDir = path.join(process.cwd(), '.next', 'static');
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
copyFolderSync(staticDir, standaloneStaticDir);
console.log('Copied .next/static directory.');

console.log('Preparation for Electron complete.');
