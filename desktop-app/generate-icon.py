#!/usr/bin/env python3
"""
Generate app icons for Port Monitor
Creates a modern, minimalist icon with a port/network theme
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size):
    """Create a port monitor icon at the specified size"""
    # Create a new image with a dark background
    img = Image.new('RGBA', (size, size), (30, 41, 59, 255))  # Dark slate color
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    margin = size * 0.15
    center = size / 2
    
    # Draw port dots (representing network ports)
    dot_size = size * 0.08
    spacing = size * 0.25
    
    # Colors for the dots - gradient from green to blue
    colors = [
        (34, 197, 94, 255),   # Green (active)
        (59, 130, 246, 255),  # Blue
        (139, 92, 246, 255),  # Purple
    ]
    
    # Draw connecting lines first (network connections)
    line_width = max(2, int(size * 0.02))
    for i in range(3):
        y = center - spacing + (i * spacing)
        # Horizontal lines
        draw.line(
            [(margin, y), (size - margin, y)],
            fill=(100, 116, 139, 128),  # Semi-transparent gray
            width=line_width
        )
    
    # Draw vertical connecting line
    draw.line(
        [(center, margin), (center, size - margin)],
        fill=(100, 116, 139, 128),
        width=line_width
    )
    
    # Draw port dots in a grid pattern
    positions = [
        (margin, center - spacing),
        (center, center - spacing),
        (size - margin, center - spacing),
        (margin, center),
        (center, center),
        (size - margin, center),
        (margin, center + spacing),
        (center, center + spacing),
        (size - margin, center + spacing),
    ]
    
    for i, (x, y) in enumerate(positions):
        color_index = i % len(colors)
        # Outer glow
        glow_size = dot_size * 1.5
        for j in range(3):
            alpha = 50 - (j * 15)
            glow_color = colors[color_index][:3] + (alpha,)
            draw.ellipse(
                [(x - glow_size/2 - j*2, y - glow_size/2 - j*2),
                 (x + glow_size/2 + j*2, y + glow_size/2 + j*2)],
                fill=glow_color
            )
        
        # Main dot
        draw.ellipse(
            [(x - dot_size/2, y - dot_size/2),
             (x + dot_size/2, y + dot_size/2)],
            fill=colors[color_index]
        )
        
        # Inner highlight
        highlight_size = dot_size * 0.3
        draw.ellipse(
            [(x - highlight_size/2, y - highlight_size/2),
             (x + highlight_size/2, y + highlight_size/2)],
            fill=(255, 255, 255, 200)
        )
    
    # Add "P" letter in the center for branding
    try:
        font_size = int(size * 0.15)
        # Try to use a system font, fall back to default if not available
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw the P with a subtle shadow
    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Shadow
    draw.text(
        (center - text_width/2 + 2, center - text_height/2 + 2),
        text,
        fill=(0, 0, 0, 100),
        font=font
    )
    
    # Main text
    draw.text(
        (center - text_width/2, center - text_height/2),
        text,
        fill=(255, 255, 255, 230),
        font=font
    )
    
    return img

def create_icns():
    """Create an ICNS file for macOS"""
    # Required sizes for macOS icons
    sizes = [16, 32, 64, 128, 256, 512, 1024]
    
    # Create icons at each size
    icons = []
    for size in sizes:
        icon = create_icon(size)
        # Save individual PNG
        icon.save(f'assets/icon_{size}.png')
        icons.append(icon)
        print(f"Created {size}x{size} icon")
    
    # Also create the main icon at 1024x1024
    main_icon = icons[-1]
    main_icon.save('assets/icon.png')
    print("Created main icon.png")
    
    # Create tray icon (smaller, simpler version)
    tray_size = 22  # Standard macOS menu bar icon size
    tray_icon = Image.new('RGBA', (tray_size, tray_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tray_icon)
    
    # Simple dots for tray
    dot_size = 4
    spacing = 7
    center = tray_size / 2
    
    positions = [
        (center - spacing, center),
        (center, center),
        (center + spacing, center),
    ]
    
    for x, y in positions:
        draw.ellipse(
            [(x - dot_size/2, y - dot_size/2),
             (x + dot_size/2, y + dot_size/2)],
            fill=(255, 255, 255, 255)
        )
    
    # Save tray icons
    tray_icon.save('assets/tray-icon.png')
    for scale in [1, 2]:  # Regular and Retina displays
        scaled_size = tray_size * scale
        scaled_tray = create_icon(scaled_size)
        scaled_tray.save(f'assets/tray-icon@{scale}x.png')
    
    print("Created tray icons")
    
    # Create iconset directory for macOS
    os.makedirs('assets/icon.iconset', exist_ok=True)
    
    # macOS iconset naming convention
    iconset_sizes = {
        16: ['16x16'],
        32: ['16x16@2x', '32x32'],
        64: ['32x32@2x'],
        128: ['128x128'],
        256: ['128x128@2x', '256x256'],
        512: ['256x256@2x', '512x512'],
        1024: ['512x512@2x']
    }
    
    for size, names in iconset_sizes.items():
        icon = create_icon(size)
        for name in names:
            icon.save(f'assets/icon.iconset/icon_{name}.png')
    
    print("Created iconset for macOS")
    
    # Try to create ICNS file using iconutil (macOS only)
    try:
        import subprocess
        subprocess.run(['iconutil', '-c', 'icns', 'assets/icon.iconset', '-o', 'assets/icon.icns'])
        print("Created icon.icns file")
    except:
        print("Could not create ICNS file (iconutil not available)")

if __name__ == '__main__':
    # Change to desktop-app directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Create assets directory if it doesn't exist
    os.makedirs('assets', exist_ok=True)
    
    # Generate all icons
    create_icns()
    
    print("\nIcon generation complete!")
    print("Files created in assets/ directory")