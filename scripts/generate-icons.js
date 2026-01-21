/**
 * Script para gerar ícones PWA
 * Executa: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Cor do tema (roxo do SGE)
const THEME_COLOR = '#5B21B6';
const TEXT_COLOR = '#FFFFFF';

async function generateIcon(size) {
  // Criar SVG com as iniciais "SGE"
  const fontSize = Math.floor(size * 0.35);
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="${fontSize}px"
        font-weight="bold"
        fill="${TEXT_COLOR}"
        text-anchor="middle"
        dominant-baseline="middle"
      >SGE</text>
    </svg>
  `;

  const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`✓ Gerado: icon-${size}x${size}.png`);
}

async function generateFavicon() {
  const size = 32;
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="4" fill="#5B21B6"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="12px"
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        dominant-baseline="middle"
      >S</text>
    </svg>
  `;

  // Gerar favicon.ico (32x32)
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('✓ Gerado: favicon.ico');

  // Gerar apple-touch-icon (180x180)
  const appleSize = 180;
  const appleSvg = `
    <svg width="${appleSize}" height="${appleSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7C3AED;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#5B21B6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${appleSize}" height="${appleSize}" rx="${appleSize * 0.15}" fill="url(#grad)"/>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="65px"
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        dominant-baseline="middle"
      >SGE</text>
    </svg>
  `;

  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));

  console.log('✓ Gerado: apple-touch-icon.png');
}

async function main() {
  // Criar diretório se não existir
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }

  console.log('Gerando ícones PWA...\n');

  // Gerar todos os tamanhos
  for (const size of SIZES) {
    await generateIcon(size);
  }

  // Gerar favicon e apple-touch-icon
  await generateFavicon();

  console.log('\n✅ Todos os ícones foram gerados com sucesso!');
  console.log(`   Diretório: ${ICONS_DIR}`);
}

main().catch(console.error);
