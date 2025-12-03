const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'css');
const dest = path.resolve(__dirname, '..', 'dist', 'css');

function copyRecursive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursive(src, dest);
  console.log('Copied css/ to dist/css/');
} catch (err) {
  console.error('Failed to copy css folder:', err);
  process.exit(1);
}
