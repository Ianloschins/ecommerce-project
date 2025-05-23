// organizeProject.js
import fs from 'fs';
import path from 'path';

console.log("🛠️ Organizing project...");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function move(src, dest) {
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dest));
    fs.renameSync(src, dest);
    console.log(`✅ Moved ${src} -> ${dest}`);
  } else {
    console.warn(`⚠️  Not found: ${src}`);
  }
}

// === Create folder structure ===
ensureDir('frontend/src/api');
ensureDir('frontend/src/components');
ensureDir('frontend/src/styles');
ensureDir('backend/prisma');

// === Move Frontend Files ===
move('src/api/api.js', 'frontend/src/api/api.js');
move('src/components/allProducts.jsx', 'frontend/src/components/allProducts.jsx');
move('src/App.jsx', 'frontend/src/App.jsx');
move('src/main.jsx', 'frontend/src/main.jsx');
move('src/index.css', 'frontend/src/styles/index.css');
move('index.html', 'frontend/index.html');
move('vite.config.js', 'frontend/vite.config.js');
move('package.json', 'frontend/package.json');
move('package-lock.json', 'frontend/package-lock.json');

// === Move Backend Files ===
move('server.js', 'backend/server.js');
move('prisma/db.js', 'backend/db.js');
move('prisma/schema.prisma', 'backend/prisma/schema.prisma');
move('prisma/migrations', 'backend/prisma/migrations');
move('.env', 'backend/.env');

// === Done ===
console.log('\n🚀 Done! Your project is now organized into "frontend/" and "backend/".');
console.log('📦 Run "npm install" inside each folder to restore dependencies.');
