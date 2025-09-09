const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createPNGIcon() {
  // Create a simple PNG icon using Sharp
  const size = 1024;
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <rect width="${size}" height="${size}" fill="#1e293b"/>
  
  <!-- Port dots grid -->
  <circle cx="${size * 0.3}" cy="${size * 0.3}" r="${size * 0.04}" fill="#22c55e"/>
  <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.04}" fill="#22c55e"/>
  <circle cx="${size * 0.7}" cy="${size * 0.3}" r="${size * 0.04}" fill="#3b82f6"/>
  
  <circle cx="${size * 0.3}" cy="${size * 0.5}" r="${size * 0.04}" fill="#3b82f6"/>
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.06}" fill="#22c55e"/>
  <circle cx="${size * 0.7}" cy="${size * 0.5}" r="${size * 0.04}" fill="#8b5cf6"/>
  
  <circle cx="${size * 0.3}" cy="${size * 0.7}" r="${size * 0.04}" fill="#8b5cf6"/>
  <circle cx="${size * 0.5}" cy="${size * 0.7}" r="${size * 0.04}" fill="#3b82f6"/>
  <circle cx="${size * 0.7}" cy="${size * 0.7}" r="${size * 0.04}" fill="#22c55e"/>
  
  <!-- Center P -->
  <text x="${size * 0.5}" y="${size * 0.53}" font-family="Helvetica" font-size="${size * 0.15}" font-weight="bold" fill="white" text-anchor="middle">P</text>
</svg>`;

  try {
    // Create PNG from SVG
    await sharp(Buffer.from(svgContent))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(__dirname, 'assets', 'icon.png'));
    
    console.log('✓ Created icon.png (1024x1024)');

    // Create smaller sizes for iconset
    const sizes = [16, 32, 64, 128, 256, 512];
    
    for (const s of sizes) {
      await sharp(Buffer.from(svgContent))
        .resize(s, s)
        .png()
        .toFile(path.join(__dirname, 'assets', `icon_${s}.png`));
      
      console.log(`✓ Created icon_${s}.png`);
    }

    // Create tray icon
    const traySize = 22;
    const traySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${traySize}" height="${traySize}" viewBox="0 0 ${traySize} ${traySize}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="11" r="2" fill="#ffffff"/>
  <circle cx="11" cy="11" r="2" fill="#22c55e"/>
  <circle cx="17" cy="11" r="2" fill="#3b82f6"/>
</svg>`;

    await sharp(Buffer.from(traySvg))
      .resize(22, 22)
      .png()
      .toFile(path.join(__dirname, 'assets', 'tray-icon.png'));
    
    console.log('✓ Created tray-icon.png');

    // Create @2x version for Retina
    await sharp(Buffer.from(traySvg))
      .resize(44, 44)
      .png()
      .toFile(path.join(__dirname, 'assets', 'tray-icon@2x.png'));
    
    console.log('✓ Created tray-icon@2x.png');

    console.log('\nIcon creation complete!');
  } catch (error) {
    console.error('Error creating icons:', error);
  }
}

createPNGIcon();