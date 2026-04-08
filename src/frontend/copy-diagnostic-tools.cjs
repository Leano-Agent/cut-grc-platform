// Script to copy diagnostic tools to dist directory
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../diagnostic-tools');
const targetDir = path.join(__dirname, 'dist/diagnostic-tools');

if (!fs.existsSync(sourceDir)) {
  console.log('❌ Diagnostic tools directory not found:', sourceDir);
  process.exit(1);
}

// Create target directory
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy files
const files = [
  'diagnostics.html',
  'diagnostic-tools.js',
  'test-suite.js',
  'react-debugger.js',
  'deployment-verification.js',
  'DIAGNOSTIC_TOOLS_README.md',
  'index.html'
];

let copied = 0;
files.forEach(file => {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, target);
    console.log(`✅ Copied: ${file}`);
    copied++;
  } else {
    console.log(`⚠️  Missing: ${file}`);
  }
});

console.log(`\n📋 Copied ${copied}/${files.length} files to ${targetDir}`);
console.log('🚀 Diagnostic tools are now available at: /diagnostic-tools/');
