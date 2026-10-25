import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';

const canvas = createCanvas(1200, 630);
const context = canvas.getContext('2d');
context.fillStyle = '#0b1019';
context.fillRect(0, 0, 1200, 630);
context.strokeStyle = '#1b2c46';
for (let x = 700; x < 1200; x += 40) {
  context.beginPath(); context.moveTo(x, 0); context.lineTo(x, 630); context.stroke();
}
for (let y = 30; y < 630; y += 40) {
  context.beginPath(); context.moveTo(700, y); context.lineTo(1200, y); context.stroke();
}
context.fillStyle = '#edf1f8';
context.font = 'bold 25px sans-serif';
context.fillText('kapkoti solution', 70, 82);
context.fillStyle = '#aac4ff';
context.font = '14px monospace';
context.fillText('PRACTICAL HELP FOR EVERYDAY WORK.', 70, 157);
context.fillStyle = '#edf1f8';
context.font = 'bold 64px sans-serif';
context.fillText('Less busywork.', 66, 260);
context.fillText('More time', 66, 334);
context.fillStyle = '#aac4ff';
context.fillText('for business.', 66, 408);
context.fillStyle = '#a8b5ca';
context.font = '21px sans-serif';
context.fillText('Practical AI. Built around your business.', 70, 474);
context.strokeStyle = '#3c5378';
context.lineWidth = 2;
for (const [y, label] of [[160, 'YOUR BUSINESS'], [280, 'A USEFUL TOOL'], [400, 'LESS BUSYWORK']]) {
  context.fillStyle = y === 280 ? '#243c62' : '#111a28';
  context.fillRect(858, y, 230, 65); context.strokeRect(858, y, 230, 65);
  context.fillStyle = '#dae5fa'; context.font = '14px monospace'; context.fillText(label, 880, y + 39);
  if (y < 400) { context.beginPath(); context.moveTo(973, y + 65); context.lineTo(973, y + 120); context.stroke(); }
}
context.fillStyle = '#a8b5ca'; context.font = '14px monospace';
context.fillText('kapkotisolution.com', 70, 572);
const png = canvas.toBuffer('image/png');
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
await writeFile('media/social-card.png', png);
