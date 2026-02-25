import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const sizes = [192, 512];
const primaryColor = '#5B5FDE';
const bgColor = '#ffffff';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Rounded square background
  const radius = size * 0.15;
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.fill();

  // Checkmark
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const checkSize = size * 0.35;
  const startX = size * 0.28;
  const startY = size * 0.5;
  const midX = size * 0.42;
  const midY = size * 0.62;
  const endX = size * 0.72;
  const endY = size * 0.32;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(midX, midY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  return canvas.toBuffer('image/png');
}

const publicDir = './public';
sizes.forEach(size => {
  const buffer = generateIcon(size);
  const filename = path.join(publicDir, `pwa-${size}x${size}.png`);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
});

// Generate apple-touch-icon
const appleBuffer = generateIcon(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleBuffer);
console.log('Generated apple-touch-icon.png');
