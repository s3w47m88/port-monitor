#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon for Port Monitor
function createSVGIcon(size = 1024) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#1e293b"/>
  
  <!-- Grid pattern background -->
  <defs>
    <pattern id="grid" width="${size/8}" height="${size/8}" patternUnits="userSpaceOnUse">
      <path d="M ${size/8} 0 L 0 0 0 ${size/8}" fill="none" stroke="#334155" stroke-width="1" opacity="0.3"/>
    </pattern>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grid)" rx="${size * 0.1}"/>
  
  <!-- Network connection lines -->
  <g opacity="0.4">
    <line x1="${size * 0.2}" y1="${size * 0.3}" x2="${size * 0.8}" y2="${size * 0.3}" stroke="#64748b" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.2}" y1="${size * 0.5}" x2="${size * 0.8}" y2="${size * 0.5}" stroke="#64748b" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.2}" y1="${size * 0.7}" x2="${size * 0.8}" y2="${size * 0.7}" stroke="#64748b" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.3}" y1="${size * 0.2}" x2="${size * 0.3}" y2="${size * 0.8}" stroke="#64748b" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.5}" y1="${size * 0.2}" x2="${size * 0.5}" y2="${size * 0.8}" stroke="#64748b" stroke-width="${size * 0.01}"/>
    <line x1="${size * 0.7}" y1="${size * 0.2}" x2="${size * 0.7}" y2="${size * 0.8}" stroke="#64748b" stroke-width="${size * 0.01}"/>
  </g>
  
  <!-- Port dots with glow effect -->
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.015}" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Active ports (green) -->
  <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.04}" fill="#22c55e" filter="url(#glow)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.04}" fill="#22c55e" filter="url(#glow)"/>
  <circle cx="${size * 0.7}" cy="${size * 0.3}" r="${size * 0.04}" fill="#3b82f6" filter="url(#glow)"/>
  
  <!-- Middle row ports -->
  <circle cx="${size * 0.3}" cy="${size * 0.5}" r="${size * 0.04}" fill="#3b82f6" filter="url(#glow)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.06}" fill="#22c55e" filter="url(#glow)"/>
  <circle cx="${size * 0.7}" cy="${size * 0.5}" r="${size * 0.04}" fill="#8b5cf6" filter="url(#glow)"/>
  
  <!-- Bottom row ports -->
  <circle cx="${size * 0.3}" cy="${size * 0.7}" r="${size * 0.04}" fill="#8b5cf6" filter="url(#glow)"/>
  <circle cx="${size * 0.5}" cy="${size * 0.7}" r="${size * 0.04}" fill="#3b82f6" filter="url(#glow)"/>
  <circle cx="${size * 0.7}" cy="${size * 0.7}" r="${size * 0.04}" fill="#22c55e" filter="url(#glow)"/>
  
  <!-- Center "P" letter -->
  <text x="${size * 0.5}" y="${size * 0.53}" font-family="SF Pro Display, Helvetica, Arial" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">P</text>
</svg>`;
  
  return svg;
}

// Create tray icon SVG (simpler, smaller)
function createTrayIcon() {
  const size = 22;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Simple dots for menu bar -->
  <circle cx="5" cy="11" r="2" fill="#ffffff"/>
  <circle cx="11" cy="11" r="2" fill="#22c55e"/>
  <circle cx="17" cy="11" r="2" fill="#3b82f6"/>
</svg>`;
  
  return svg;
}

// Create all necessary icon files
console.log('Generating icons for Port Monitor...');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}

// Generate main icon
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), createSVGIcon(1024));
console.log('✓ Created icon.svg');

// Generate tray icon
fs.writeFileSync(path.join(assetsDir, 'tray-icon.svg'), createTrayIcon());
console.log('✓ Created tray-icon.svg');

// Create iconset directory for macOS
const iconsetDir = path.join(assetsDir, 'icon.iconset');
if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir);
}

// Generate different sizes for iconset
const sizes = [16, 32, 64, 128, 256, 512, 1024];
sizes.forEach(size => {
  fs.writeFileSync(
    path.join(iconsetDir, `icon_${size}x${size}.svg`),
    createSVGIcon(size)
  );
  console.log(`✓ Created icon_${size}x${size}.svg`);
});

console.log('\nIcon generation complete!');
console.log('Note: For production, convert SVG files to PNG/ICNS format using a tool like:');
console.log('  - svg2png for PNG conversion');
console.log('  - iconutil -c icns assets/icon.iconset for ICNS creation');