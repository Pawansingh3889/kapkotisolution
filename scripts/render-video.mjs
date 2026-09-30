// Renders the Kapkoti Solution workflow film frame by frame and encodes it with ffmpeg.
// Every frame is drawn in code: no stock footage, no video editor.
// Usage: pnpm video  (needs ffmpeg on PATH)
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FPS = 30;
const W = 1280;
const H = 720;
const FRAMES_DIR = join(ROOT, '.cache', 'frames');
const OUT_MP4 = join(ROOT, 'public', 'media', 'workflow.mp4');

const INK = '#243f35';
const CREAM = '#f5f2e9';
const ACCENT = '#c96f4a'; // warm terracotta for flags and highlights
const SOFT = '#243f3522';

for (const font of ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Georgia Bold.ttf']) {
  try { GlobalFonts.registerFromPath(font); } catch { /* fall back to default sans */ }
}

const scenes = [
  { name: 'hook', seconds: 7, draw: drawHook },
  { name: 'inbox', seconds: 9, draw: drawInbox },
  { name: 'ingestion', seconds: 11, draw: drawIngestion },
  { name: 'erp', seconds: 11, draw: drawERP },
  { name: 'rag', seconds: 12, draw: drawRAG },
  { name: 'agents', seconds: 12, draw: drawAgents },
  { name: 'human', seconds: 8, draw: drawHuman },
  { name: 'pipeline', seconds: 8, draw: drawPipeline },
  { name: 'values', seconds: 8, draw: drawValues },
  { name: 'close', seconds: 10, draw: drawClose },
];

const totalSeconds = scenes.reduce((sum, s) => sum + s.seconds, 0);
const totalFrames = totalSeconds * FPS;

// ---------- helpers ----------

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function lerp(a, b, t) { return a + (b - a) * t; }

function bg(ctx, color = CREAM) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

function caption(ctx, lines, y = H - 110, color = INK) {
  ctx.fillStyle = color;
  ctx.font = '600 30px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 40));
}

function eyebrow(ctx, text, y = 70) {
  ctx.fillStyle = ACCENT;
  ctx.font = '700 22px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), W / 2, y);
}

// progress within scene: 0..1, clamped fade windows
function fadeInOut(t, inFrac = 0.15, outFrac = 0.15) {
  if (t < inFrac) return ease(t / inFrac);
  if (t > 1 - outFrac) return ease((1 - t) / outFrac);
  return 1;
}

function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function card(ctx, x, y, w, h, fill = '#ffffff', radius = 14) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

// ---------- scenes ----------

function drawHook(ctx, t) {
  bg(ctx);
  const a = fadeInOut(t);
  ctx.globalAlpha = a;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = 'bold 58px Georgia, serif';
  const beat = Math.min(1, t * FPS / 18);
  const lines = ['Life has enough', 'little problems.'];
  lines.forEach((line, i) => {
    const p = Math.max(0, Math.min(1, beat * 2 - i));
    ctx.globalAlpha = a * p;
    ctx.fillText(line, W / 2, 260 + i * 84);
  });
  ctx.globalAlpha = a * Math.max(0, beat - 0.5) * 2;
  ctx.fillStyle = ACCENT;
  ctx.fillText('Let’s solve one.', W / 2, 470);
  ctx.globalAlpha = 1;
}

function drawInbox(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '01 / The problem');
  caption(ctx, ['Work arrives faster than', 'a team can process it.']);
  const items = [
    { label: 'INVOICE', dx: 0.10, dy: 0.62, r: -0.10, delay: 0.00 },
    { label: 'SALES ORDER', dx: 0.26, dy: 0.44, r: 0.07, delay: 0.35 },
    { label: 'PDF · 4 pages', dx: 0.44, dy: 0.66, r: -0.05, delay: 0.70 },
    { label: 'POD', dx: 0.60, dy: 0.40, r: 0.11, delay: 1.05 },
    { label: 'REMITTANCE', dx: 0.76, dy: 0.60, r: -0.08, delay: 1.40 },
    { label: 'EXCEL FILE', dx: 0.88, dy: 0.46, r: 0.05, delay: 1.75 },
  ];
  for (const it of items) {
    const p = ease(Math.max(0, Math.min(1, (t * scenes[1].seconds - it.delay) / 1.2)));
    if (p <= 0) continue;
    const x = lerp(-200, it.dx * W, p);
    const y = it.dy * H + Math.sin((x + it.dx * 900) / 90) * 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(it.r);
    ctx.globalAlpha = p;
    card(ctx, -110, -64, 220, 128, '#ffffff');
    ctx.fillStyle = SOFT;
    ctx.fillRect(-110, -64, 220, 26);
    ctx.fillStyle = INK;
    ctx.font = '700 16px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(it.label, 0, -46);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = withAlpha(INK, 0.25);
      const w = 150 - i * 34;
      ctx.fillRect(-90, -14 + i * 20, w, 6);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawIngestion(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '02 / Ingestion · prototype');
  caption(ctx, ['Ingestion extracts the signal', 'from the noise.'], H - 100, CREAM);
  const sweep = ease(Math.min(1, t * 1.6));
  const x0 = W * 0.22, y0 = H * 0.16, w0 = W * 0.42, h0 = H * 0.60;
  card(ctx, x0, y0, w0, h0, '#ffffff');
  // document lines
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = withAlpha(INK, 0.3);
    ctx.fillRect(x0 + 30, y0 + 40 + i * 34, w0 - 60 - (i % 3) * 60, 10);
  }
  ctx.fillStyle = withAlpha(INK, 0.5);
  ctx.fillRect(x0 + 30, y0 + h0 - 70, 160, 26);
  // scan line
  const sx = x0 + sweep * w0;
  ctx.fillStyle = withAlpha(ACCENT, 0.9);
  ctx.fillRect(sx - 2, y0, 4, h0);
  ctx.fillStyle = withAlpha(ACCENT, 0.15);
  ctx.fillRect(sx - 40, y0, 40, h0);
  // extracted chips fly out
  const chips = [['Supplier', 0.30], ['PO number', 0.42], ['Total', 0.55], ['Due date', 0.68]];
  chips.forEach(([label, d], i) => {
    const p = ease(Math.max(0, Math.min(1, (t - d) / 0.5)));
    if (p <= 0) return;
    const cx = lerp(x0 + w0 + 10, x0 + w0 + 90, p);
    const cy = y0 + 70 + i * 62;
    ctx.globalAlpha = p;
    card(ctx, cx, cy - 22, 230, 44, CREAM, 22);
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(cx + 26, cy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '600 18px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx + 128, cy + 6);
    ctx.globalAlpha = 1;
  });
}

function drawERP(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '03 / System of record · Sedno, live demo');
  caption(ctx, ['Matched work posts itself', 'into the ERP.']);
  // ledger grid
  const gx = W * 0.14, gy = H * 0.18, gw = W * 0.72, gh = H * 0.44;
  card(ctx, gx, gy, gw, gh, '#ffffff');
  ctx.fillStyle = INK;
  ctx.fillRect(gx, gy, gw, 44);
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ['STOCK', 'SALES', 'INVOICE', 'STATUS'].forEach((h, i) => ctx.fillText(h, gx + 30 + i * (gw - 60) / 4, gy + 29));
  // rows appear
  const rows = [['SED-014', 'Order 1042', '₹ 48,200', 'POSTED'], ['SED-015', 'Invoice 331', '₹ 12,875', 'MATCHED'], ['SED-016', 'Order 1043', '₹ 96,400', 'POSTED'], ['SED-017', 'Invoice 332', '₹ 7,310', 'MATCHED']];
  rows.forEach((row, r) => {
    const p = ease(Math.max(0, Math.min(1, (t * 2.2 - r * 0.5) / 0.5)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    const ry = gy + 62 + r * 52;
    if (r % 2 === 0) { ctx.fillStyle = SOFT; ctx.fillRect(gx + 2, ry - 18, gw - 4, 40); }
    ctx.fillStyle = INK;
    ctx.font = '500 17px Manrope, Helvetica, sans-serif';
    row.forEach((cell, c) => ctx.fillText(cell, gx + 30 + c * (gw - 60) / 4, ry + 8));
    ctx.globalAlpha = 1;
  });
  // a chip slides in under the table
  const p = ease(Math.max(0, Math.min(1, (t - 1.1) / 0.4)));
  const px = lerp(W + 300, W * 0.62, p);
  ctx.globalAlpha = p;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.roundRect(px, gy + gh + 30, 260, 50, 25);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('no human handling', px + 130, gy + gh + 63);
  ctx.globalAlpha = 1;
}

function drawRAG(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '04 / Governed answers · FloorMind, live site');
  caption(ctx, ['Ask your own data a question,', 'with governed access.'], H - 100, CREAM);
  // question bubble
  const q = ease(Math.min(1, t * 2));
  card(ctx, W * 0.12, lerp(-80, H * 0.16, q), 430, 58, CREAM, 29);
  ctx.fillStyle = INK;
  ctx.font = '600 20px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('What’s happening on the floor?', W * 0.12 + 30, lerp(-80, H * 0.16, q) + 37);
  // data bars light up
  const bars = [0.35, 0.62, 0.48, 0.8, 0.55];
  bars.forEach((h, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.6 - 0.25 - i * 0.12) / 0.4)));
    const bh = h * H * 0.34 * p;
    const bx = W * 0.16 + i * 76, by = H * 0.66 - bh;
    ctx.fillStyle = i === 3 ? ACCENT : withAlpha(CREAM, 0.85);
    ctx.beginPath();
    ctx.roundRect(bx, by, 48, bh, 8);
    ctx.fill();
  });
  // answer card
  const a = ease(Math.max(0, Math.min(1, (t - 0.55) / 0.45)));
  ctx.globalAlpha = a;
  card(ctx, W * 0.56, H * 0.30, 400, 210, CREAM);
  ctx.fillStyle = INK;
  ctx.font = '700 17px Manrope, Helvetica, sans-serif';
  ctx.fillText('GOVERNED ANSWER', W * 0.56 + 28, H * 0.30 + 40);
  ctx.font = '500 19px Manrope, Helvetica, sans-serif';
  ['Line 3 output is up 8% this shift.', 'Scrap is concentrated in one batch.', 'Access limited to production data.'].forEach((line, i) => ctx.fillText(line, W * 0.56 + 28, H * 0.30 + 82 + i * 36));
  ctx.globalAlpha = 1;
}

function drawAgents(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '05 / Agents on top · Elenchus, live app');
  caption(ctx, ['Agents watch the flow and', 'flag the problems.']);
  const bubbles = [
    { text: 'Invoice total differs from PO by ₹ 4,200', good: false, delay: 0.0 },
    { text: '3-way match failed: no GRPO yet', good: false, delay: 0.3 },
    { text: 'Stock below reorder point: SED-014', good: false, delay: 0.6 },
    { text: 'Order 1043 matches everything', good: true, delay: 0.9 },
  ];
  bubbles.forEach((b, i) => {
    const p = ease(Math.max(0, Math.min(1, (t - b.delay) / 0.5)));
    if (p <= 0) return;
    const y = H * 0.18 + i * 76;
    const x = i % 2 ? W * 0.10 : W * 0.30;
    ctx.globalAlpha = p;
    card(ctx, x, y, 560, 56, i % 2 ? '#ffffff' : SOFT, 28);
    ctx.fillStyle = b.good ? '#3d6b4f' : ACCENT;
    ctx.beginPath();
    ctx.arc(x + 32, y + 28, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '500 19px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.text, x + 56, y + 35);
    ctx.globalAlpha = 1;
  });
}

function drawHuman(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '06 / People stay in charge');
  caption(ctx, ['AI does the fiddly work.', 'You make the calls.']);
  const p = ease(Math.min(1, t * 1.4));
  card(ctx, W * 0.24, H * 0.24, 620, 150, '#ffffff');
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W * 0.24 + 50, H * 0.24 + 75, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '600 22px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Invoice 331 differs from PO 88 by ₹ 4,200.', W * 0.24 + 80, H * 0.24 + 66);
  ctx.font = '400 17px Manrope, Helvetica, sans-serif';
  ctx.fillText('Suggested: request the supplier’s revised copy.', W * 0.24 + 80, H * 0.24 + 100);
  // cursor moves to approve
  const cx = lerp(W * 0.16, W * 0.24 + 470, ease(Math.max(0, Math.min(1, (t - 0.45) / 0.35))));
  const cy = lerp(H * 0.9, H * 0.24 + 190, ease(Math.max(0, Math.min(1, (t - 0.45) / 0.35))));
  const click = t > 0.85 ? (Math.sin((t - 0.85) * 40) + 1) / 2 : 1;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(W * 0.24 + 380, H * 0.24 + 165, 180, 48, 24);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Send to supplier', W * 0.24 + 470, H * 0.24 + 196);
  // cursor arrow
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(click * 0.2 + 0.8, click * 0.2 + 0.8);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = CREAM;
  ctx.stroke();
  ctx.restore();
}

function drawPipeline(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '07 / One workflow');
  caption(ctx, ['From a messy inbox to a decision,', 'with governed AI underneath.'], H - 100, CREAM);
  const nodes = ['INBOX', 'INGEST', 'ERP', 'RAG', 'AGENTS', 'YOU'];
  const nodeW = 150, gap = (W - 120 - nodes.length * nodeW) / (nodes.length - 1);
  nodes.forEach((label, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 2.2 - i * 0.35) / 0.5)));
    const x = 60 + i * (nodeW + gap), y = H * 0.42;
    ctx.globalAlpha = p;
    card(ctx, x, y, nodeW, 84, i === nodes.length - 1 ? ACCENT : CREAM, 16);
    ctx.fillStyle = i === nodes.length - 1 ? CREAM : INK;
    ctx.font = '700 20px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + nodeW / 2, y + 50);
    if (i > 0) {
      const px = 60 + (i - 1) * (nodeW + gap) + nodeW;
      ctx.strokeStyle = withAlpha(CREAM, 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + 4, y + 42);
      ctx.lineTo(x - 6, y + 42);
      ctx.stroke();
      // pulse travelling along the link
      const pulse = ((t * 0.6 + i * 0.16) % 1);
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(lerp(px + 4, x - 6, pulse), y + 42, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = withAlpha(CREAM, 0.9);
  ctx.font = '500 20px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Sedno · FloorMind · Elenchus, on top of one pipeline', W / 2, H * 0.60);
}

function drawValues(ctx, t) {
  bg(ctx);
  const values = [['01', 'Understand the real problem.'], ['02', 'Build something that helps.'], ['03', 'Keep making it better.']];
  values.forEach(([n, text], i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.8 - i * 0.5) / 0.5)));
    if (p <= 0) return;
    const y = H * 0.28 + i * 110;
    ctx.globalAlpha = p;
    ctx.fillStyle = ACCENT;
    ctx.font = '700 40px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(n, W / 2 - 210, y);
    ctx.fillStyle = INK;
    ctx.font = '600 34px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, W / 2 - 180, y);
    ctx.globalAlpha = 1;
  });
}

function drawClose(ctx, t) {
  bg(ctx, INK);
  const a = fadeInOut(t, 0.1, 0.1);
  ctx.globalAlpha = a;
  // k· mark
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 46, H * 0.20, 92, 92, 26);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = 'bold 60px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('k', W / 2 - 6, H * 0.20 + 66);
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W / 2 + 16, H * 0.20 + 56, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('Kapkoti Solution', W / 2, H * 0.20 + 190);
  ctx.font = '500 26px Manrope, Helvetica, sans-serif';
  ctx.fillText('AI for the work that falls between your systems.', W / 2, H * 0.20 + 250);
  ctx.fillStyle = ACCENT;
  ctx.font = '700 26px Manrope, Helvetica, sans-serif';
  const beat = Math.min(1, Math.max(0, (t - 0.35) * 2.2));
  ctx.globalAlpha = a * beat;
  ctx.fillText('Tell us what you wish was easier · kapkotisolution.com', W / 2, H * 0.72);
  ctx.globalAlpha = 1;
}

// ---------- render loop ----------

mkdirSync(FRAMES_DIR, { recursive: true });
mkdirSync(dirname(OUT_MP4), { recursive: true });

console.log(`Rendering ${totalFrames} frames (${totalSeconds}s @ ${FPS}fps)…`);
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
let frame = 0;
for (const scene of scenes) {
  const count = scene.seconds * FPS;
  for (let i = 0; i < count; i++) {
    scene.draw(ctx, i / count, i, count);
    writeFileSync(join(FRAMES_DIR, `f${String(frame).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
    frame++;
  }
  console.log(`  ${scene.name} done (${frame}/${totalFrames})`);
}

console.log('Encoding with ffmpeg…');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(FRAMES_DIR, 'f%05d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', OUT_MP4]);
console.log(`Wrote ${OUT_MP4}`);
