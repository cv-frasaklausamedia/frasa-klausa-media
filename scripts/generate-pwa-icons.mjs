import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourceLogoPath = path.resolve(process.cwd(), 'public/logo/logo.jpg');
const outputDir = path.resolve(process.cwd(), 'public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log(`Processing source logo from: ${sourceLogoPath}`);

  if (!fs.existsSync(sourceLogoPath)) {
    throw new Error(`Master logo not found at: ${sourceLogoPath}`);
  }

  // 1. Standard 192x192 icon
  await sharp(sourceLogoPath)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'icon-192x192.png'));
  console.log('✓ Created icon-192x192.png');

  // 2. Standard 512x512 icon
  await sharp(sourceLogoPath)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'icon-512x512.png'));
  console.log('✓ Created icon-512x512.png');

  // 3. Maskable 192x192 icon (with ~15% safe-zone padding on white canvas)
  const inner192Size = Math.round(192 * 0.76); // ~146px
  const resized192Inner = await sharp(sourceLogoPath)
    .resize(inner192Size, inner192Size, { fit: 'contain', background: '#ffffff' })
    .toBuffer();

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized192Inner, gravity: 'center' }])
    .png()
    .toFile(path.join(outputDir, 'icon-maskable-192x192.png'));
  console.log('✓ Created icon-maskable-192x192.png');

  // 4. Maskable 512x512 icon (with safe-zone padding)
  const inner512Size = Math.round(512 * 0.76); // ~389px
  const resized512Inner = await sharp(sourceLogoPath)
    .resize(inner512Size, inner512Size, { fit: 'contain', background: '#ffffff' })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: resized512Inner, gravity: 'center' }])
    .png()
    .toFile(path.join(outputDir, 'icon-maskable-512x512.png'));
  console.log('✓ Created icon-maskable-512x512.png');

  // 5. Apple Touch Icon 180x180
  await sharp(sourceLogoPath)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 6. Favicons 32x32 & 16x16
  await sharp(sourceLogoPath)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'));

  await sharp(sourceLogoPath)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(path.join(outputDir, 'favicon-16x16.png'));
  console.log('✓ Created favicon-32x32.png and favicon-16x16.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
