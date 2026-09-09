const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SVG_PATH = path.join(__dirname, '..', 'public', 'logo.svg');

// Density mappings for Android
const legacySizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

const foregroundSizes = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

const targetProjects = [
  path.join(__dirname, '..', 'android-user', 'app', 'src', 'main', 'res'),
  path.join(__dirname, '..', 'android-admin', 'app', 'src', 'main', 'res'),
  path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res'),
];

async function generateIcons() {
  console.log('🎨 Generating Android Launcher & In-App Icons from SVG...');

  const svgBuffer = fs.readFileSync(SVG_PATH);

  for (const resDir of targetProjects) {
    if (!fs.existsSync(resDir)) continue;
    console.log(`\n📁 Processing target: ${resDir}`);

    // 1. Generate Legacy Full Launcher Icons (Square and Round)
    for (const item of legacySizes) {
      const folderPath = path.join(resDir, item.folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Render full icon with rounded corners
      const fullIconBuffer = await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(folderPath, 'ic_launcher.png'), fullIconBuffer);
      fs.writeFileSync(path.join(folderPath, 'ic_launcher_round.png'), fullIconBuffer);
      console.log(`  ✓ Created ${item.folder}/ic_launcher.png (${item.size}x${item.size})`);
    }

    // 2. Generate Adaptive Icon Foreground with 25% safe padding
    for (const item of foregroundSizes) {
      const folderPath = path.join(resDir, item.folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Android adaptive icon foreground: total size (e.g. 432), safe inner logo size (approx 66% = 288)
      const innerLogoSize = Math.round(item.size * 0.66);
      const innerLogoBuffer = await sharp(svgBuffer)
        .resize(innerLogoSize, innerLogoSize)
        .png()
        .toBuffer();

      const foregroundBuffer = await sharp({
        create: {
          width: item.size,
          height: item.size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{ input: innerLogoBuffer, gravity: 'center' }])
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(folderPath, 'ic_launcher_foreground.png'), foregroundBuffer);
      console.log(`  ✓ Created ${item.folder}/ic_launcher_foreground.png (${item.size}x${item.size})`);
    }

    // 3. Generate high-res app_logo.png in drawable for splash screen & in-app UI
    const drawableDir = path.join(resDir, 'drawable');
    if (!fs.existsSync(drawableDir)) {
      fs.mkdirSync(drawableDir, { recursive: true });
    }

    const appLogo512 = await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(drawableDir, 'app_logo.png'), appLogo512);
    console.log(`  ✓ Created drawable/app_logo.png (512x512)`);
  }

  console.log('\n✨ All Android launcher and splash icon assets generated successfully!');
}

generateIcons().catch(err => {
  console.error('❌ Icon generation failed:', err);
  process.exit(1);
});
