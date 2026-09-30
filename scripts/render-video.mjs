// Renders the Kapkoti Solution workflow film frame by frame and encodes it with ffmpeg.
// Every frame is drawn in code: no stock footage, no video editor.
// Structure: Act I "what is" (tense) -> the turn -> Act II "the pipeline" (building) -> Act III "what could be" (calm).
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
const DARK = '#16281f';   // Act I tension background
const BLACK = '#0c1712';  // the turn
const CREAM = '#f5f2e9';
const ACCENT = '#c96f4a'; // warm terracotta
const GOOD = '#3d6b4f';
const SOFT = '#243f3522';

for (const font of ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Georgia Bold.ttf']) {
  try { GlobalFonts.registerFromPath(font); } catch { /* fall back to default sans */ }
}

// act: I (tense) | turn | II (build) | III (calm). rate: say speech rate.
const NARRATION = {
  hook: 'Life has enough little problems.',
  inbox: 'Invoices, orders, PDFs, requests. Everything lands at once.',
  cost: 'Volume grows. Headcount doesn’t. Someone has to keep up.',
  turn: 'What if the work did itself?',
  ingestion: 'Ingestion reads the noise and extracts what matters.',
  erp: 'One ERP underneath everything: stock, orders, invoices and people. This one is coming soon.',
  split: 'Stock, watched before it runs out. Invoices, matched before they post.',
  tax: 'VAT returns, straight from the ledger, filed with an audit trail.',
  floor: 'On the factory floor, OEE stops running on paper.',
  payroll: 'HR and payroll, on time, in either currency.',
  results: 'The result: most of the work flows through. People handle the judgement.',
  human: 'AI does the fiddly work. You make the calls.',
  pipeline: 'One workflow, end to end, with governed AI underneath.',
  close: 'Kapkoti Solution. Tell us what you wish was easier.',
};

const scenes = [
  { name: 'hook',     seconds: 6,  act: 'I',    rate: 180, music: { mode: 'tense', intensity: 0.6 }, draw: drawHook },
  { name: 'inbox',    seconds: 6,  act: 'I',    rate: 180, music: { mode: 'tense', intensity: 0.85 }, draw: drawInbox },
  { name: 'cost',     seconds: 6,  act: 'I',    rate: 180, music: { mode: 'tense', intensity: 1.0 }, draw: drawCost },
  { name: 'turn',     seconds: 4,  act: 'turn', rate: 150, music: { mode: 'silence' }, draw: drawTurn },
  { name: 'ingestion',seconds: 8,  act: 'II',   rate: 168, music: { mode: 'build', intensity: 0.35 }, draw: drawIngestion },
  { name: 'erp',      seconds: 10, act: 'II',   rate: 168, music: { mode: 'build', intensity: 0.5 }, draw: drawERP },
  { name: 'split',    seconds: 10, act: 'II',   rate: 168, music: { mode: 'build', intensity: 0.65 }, draw: drawSplit },
  { name: 'tax',      seconds: 10, act: 'II',   rate: 168, music: { mode: 'build', intensity: 0.8 }, draw: drawTax },
  { name: 'floor',    seconds: 8,  act: 'II',   rate: 168, music: { mode: 'build', intensity: 1.0, peak: true }, draw: drawFloor },
  { name: 'payroll',  seconds: 7,  act: 'III',  rate: 152, music: { mode: 'calm', intensity: 0.5 }, draw: drawPayroll },
  { name: 'results',  seconds: 8,  act: 'III',  rate: 152, music: { mode: 'calm', intensity: 0.4 }, draw: drawResults },
  { name: 'human',    seconds: 6,  act: 'III',  rate: 152, music: { mode: 'calm', intensity: 0.35 }, draw: drawHuman },
  { name: 'pipeline', seconds: 7,  act: 'III',  rate: 152, music: { mode: 'calm', intensity: 0.3 }, draw: drawPipeline },
  { name: 'close',    seconds: 10, act: 'III',  rate: 152, music: { mode: 'calm', intensity: 0.4, final: true }, draw: drawClose },
];

const totalSeconds = scenes.reduce((sum, s) => sum + s.seconds, 0);
const totalFrames = totalSeconds * FPS;

// ---------- drawing helpers ----------

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }
function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function bg(ctx, color) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }
function card(ctx, x, y, w, h, fill = '#ffffff', radius = 14) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function caption(ctx, lines, y = H - 110, color = INK) {
  ctx.fillStyle = color;
  ctx.font = '600 30px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 40));
}
function fadeInOut(t, inFrac = 0.15, outFrac = 0.15) {
  if (t < inFrac) return ease(t / inFrac);
  if (t > 1 - outFrac) return ease((1 - t) / outFrac);
  return 1;
}
// one-time pop: 0→1 with overshoot
function pop(t, delay = 0, dur = 0.35) {
  const p = Math.max(0, Math.min(1, (t - delay) / dur));
  return p === 0 ? 0 : 1 + Math.sin(Math.min(1, p) * Math.PI) * 0.08 * p;
}

// ---------- ACT I : tense, dark ----------

function drawHook(ctx, t) {
  bg(ctx, DARK);
  const shake = Math.sin(t * 90) * (t > 0.15 ? 1.4 : 0);
  ctx.save();
  ctx.translate(shake, Math.sin(t * 70) * 0.8);
  ctx.textAlign = 'center';
  ctx.font = 'bold 58px Georgia, serif';
  const lines = [['Life has enough', 0.05], ['little problems.', 0.25]];
  lines.forEach(([line, d], i) => {
    const p = pop(t, d, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = CREAM;
    ctx.fillText(line, W / 2, 258 + i * 84);
  });
  const p2 = pop(t, 0.55, 0.3);
  if (p2 > 0) {
    ctx.globalAlpha = Math.min(1, p2);
    ctx.fillStyle = ACCENT;
    ctx.fillText('Let’s solve one.', W / 2, 470);
    // underline sweep
    const w = ctx.measureText('Let’s solve one.').width;
    const sweep = Math.max(0, Math.min(1, (t - 0.75) / 0.4));
    ctx.fillRect(W / 2 - w / 2, 492, w * sweep, 4);
  }
  ctx.globalAlpha = 0.45 * fadeInOut(t, 0.2, 0.1);
  ctx.fillStyle = CREAM;
  ctx.font = '700 20px Manrope, Helvetica, sans-serif';
  ctx.fillText('KAPKOTI SOLUTION', W / 2, H - 60);
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawInbox(ctx, t) {
  bg(ctx, DARK);
  eyebrowLeft(ctx, '01 / MONDAY, 9:02 AM', CREAM);
  caption(ctx, ['Volume grows.', 'Headcount doesn’t.'], H - 100, CREAM);
  const items = [
    { label: 'INVOICE', x: 0.12, y: 0.72, r: -0.09, d: 0.00, warn: true },
    { label: 'SALES ORDER', x: 0.30, y: 0.66, r: 0.07, d: 0.10, warn: false },
    { label: 'PDF · 4 pages', x: 0.47, y: 0.74, r: -0.05, d: 0.20, warn: true },
    { label: 'POD', x: 0.62, y: 0.64, r: 0.11, d: 0.32, warn: false },
    { label: 'REMITTANCE', x: 0.78, y: 0.72, r: -0.07, d: 0.44, warn: true },
    { label: 'REQUEST', x: 0.90, y: 0.62, r: 0.05, d: 0.55, warn: false },
  ];
  const shake = Math.sin(t * 80) * 1.6;
  for (const it of items) {
    const p = ease(Math.max(0, Math.min(1, (t - it.d) / 0.2)));
    if (p <= 0) continue;
    // falls from above, lands on the pile
    const x = it.x * W + shake;
    const y = lerp(-160, it.y * H, p) + Math.sin(x / 80) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(it.r * p);
    ctx.globalAlpha = Math.min(1, p * 1.4);
    card(ctx, -105, -58, 210, 116, '#fdfcf6');
    ctx.fillStyle = SOFT;
    ctx.fillRect(-105, -58, 210, 24);
    ctx.fillStyle = INK;
    ctx.font = '700 15px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(it.label, 0, -41);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = withAlpha(INK, 0.25);
      ctx.fillRect(-86, -12 + i * 19, 146 - i * 32, 6);
    }
    if (it.warn) {
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(78, -46); ctx.lineTo(92, -20); ctx.lineTo(64, -20);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '700 16px Manrope, Helvetica, sans-serif';
      ctx.fillText('!', 78, -26);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function eyebrowLeft(ctx, text, color = ACCENT, y = 66) {
  ctx.fillStyle = color;
  ctx.font = '700 22px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text.toUpperCase(), 64, y);
}

function drawCost(ctx, t) {
  bg(ctx, DARK);
  eyebrowLeft(ctx, '02 / THE COST OF MANUAL', CREAM);
  const rows = [
    ['10,000+', 'orders and invoices a month'],
    ['3×', 'the volume, the same team'],
    ['Weeks', 'of month-end every month'],
  ];
  rows.forEach(([big, small], i) => {
    const p = pop(t, 0.12 + i * 0.28, 0.35);
    if (p <= 0) return;
    const y = 190 + i * 118;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(64, y - 44, 8, 64);
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 52px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(big, 96, y);
    const bigW = ctx.measureText(big).width;
    ctx.font = '500 22px Manrope, Helvetica, sans-serif';
    ctx.fillStyle = withAlpha(CREAM, 0.75);
    ctx.fillText(small, 96 + bigW + 26, y);
    ctx.globalAlpha = 1;
  });
  // chore ticker
  const words = 'AP backlog · month-end · sick calls · firefighting · stale pricing · spreadsheet nobody owns · ';
  ctx.font = '600 22px Manrope, Helvetica, sans-serif';
  const w = ctx.measureText(words).width;
  const off = (t * 160) % w;
  ctx.fillStyle = withAlpha(ACCENT, 0.8);
  ctx.fillText(words + words, 64 - off, H - 64);
}

// ---------- the turn ----------

function drawTurn(ctx, t) {
  bg(ctx, BLACK);
  // one dot, one breath
  const dot = pop(t, 0.45, 0.5);
  if (dot > 0) {
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.34, 7 * Math.min(1.6, dot), 0, Math.PI * 2);
    ctx.fill();
  }
  const p = t > 0.45 ? fadeInOut((t - 0.45) / 0.55, 0.2, 0.1) : 0;
  if (p > 0) {
    ctx.globalAlpha = p;
    ctx.fillStyle = CREAM;
    ctx.font = 'bold 50px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('What if the work did itself?', W / 2, H * 0.56);
    ctx.globalAlpha = 1;
  }
}

// ---------- ACT II : the pipeline, building ----------

function drawIngestion(ctx, t) {
  bg(ctx, DARK);
  eyebrowLeft(ctx, '03 / INGESTION · COMING SOON', CREAM);
  caption(ctx, ['Ingestion reads the noise', 'and extracts what matters.'], H - 100, CREAM);
  const sweep = ease(Math.min(1, t * 1.4));
  const x0 = W * 0.10, y0 = H * 0.18, w0 = W * 0.36, h0 = H * 0.54;
  card(ctx, x0, y0, w0, h0, '#fdfcf6');
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = withAlpha(INK, 0.3);
    ctx.fillRect(x0 + 28, y0 + 38 + i * 32, w0 - 56 - (i % 3) * 52, 9);
  }
  const sx = x0 + sweep * w0;
  ctx.fillStyle = withAlpha(ACCENT, 0.9);
  ctx.fillRect(sx - 2, y0, 4, h0);
  ctx.fillStyle = withAlpha(ACCENT, 0.15);
  ctx.fillRect(sx - 36, y0, 36, h0);
  const chips = [['Supplier', 0.22], ['PO number', 0.34], ['Total', 0.48], ['Due date', 0.6]];
  chips.forEach(([label, d], i) => {
    const p = ease(Math.max(0, Math.min(1, (t - d) / 0.4)));
    if (p <= 0) return;
    const cx = lerp(x0 + w0 + 16, W * 0.66, p);
    const cy = y0 + 62 + i * 64;
    ctx.globalAlpha = p;
    card(ctx, cx, cy - 22, 250, 44, CREAM, 22);
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(cx + 26, cy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '600 18px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx + 138, cy + 6);
    ctx.globalAlpha = 1;
  });
}

function drawERP(ctx, t) {
  bg(ctx);
  eyebrowLeft(ctx, '04 / THE SYSTEM OF RECORD · KAPKOTI ERP, COMING SOON');
  // left-aligned caption for a different rhythm
  ctx.fillStyle = INK;
  ctx.font = '600 30px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('One ERP underneath everything:', 64, H - 96);
  ctx.fillText('stock, orders, invoices, people.', 64, H - 54);
  const gx = 64, gy = 110, gw = W - 128, gh = H * 0.42;
  card(ctx, gx, gy, gw, gh, '#ffffff');
  ctx.fillStyle = INK;
  ctx.fillRect(gx, gy, gw, 42);
  ctx.fillStyle = CREAM;
  ctx.font = '700 17px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ['MODULE', 'RECORD', 'AMOUNT', 'STATUS'].forEach((h, i) => ctx.fillText(h, gx + 26 + i * (gw - 52) / 4, gy + 27));
  const rows = [
    ['STOCK', 'GRPO 221', '₹ 96,400', 'POSTED'],
    ['SALES', 'Order 1042', '£ 1,480', 'POSTED'],
    ['INVOICE', 'Invoice 331', '₹ 12,875', 'MATCHED'],
    ['INVOICE', 'Invoice 332', '£ 7,310', 'MATCHED'],
  ];
  rows.forEach((row, r) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.7 - r * 0.22) / 0.4)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    const ry = gy + 58 + r * 46;
    if (r % 2 === 0) { ctx.fillStyle = SOFT; ctx.fillRect(gx + 2, ry - 16, gw - 4, 36); }
    ctx.fillStyle = INK;
    ctx.font = '500 16px Manrope, Helvetica, sans-serif';
    row.forEach((cell, c) => ctx.fillText(cell, gx + 26 + c * (gw - 52) / 4, ry + 6));
    ctx.globalAlpha = 1;
  });
  const p = ease(Math.max(0, Math.min(1, (t - 0.55) / 0.3)));
  const px = lerp(W + 300, gw + 64 - 340, p);
  ctx.globalAlpha = p;
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.roundRect(px, gy + gh + 26, 340, 50, 25); ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('the Kapkoti ERP · coming soon', px + 170, gy + gh + 58);
  ctx.globalAlpha = 1;
}

function drawSplit(ctx, t) {
  bg(ctx, DARK);
  const mid = W / 2;
  // left: stock (dark, bars)
  eyebrowLeft(ctx, '05 / STOCK · SEDNO, LIVE', CREAM);
  const bars = [0.72, 0.48, 0.85, 0.22, 0.6];
  bars.forEach((h, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.5 - i * 0.12) / 0.4)));
    const bh = h * H * 0.34 * p;
    const bx = W * 0.07 + i * 74, by = H * 0.62 - bh;
    ctx.fillStyle = h < 0.3 ? ACCENT : withAlpha(CREAM, 0.85);
    ctx.beginPath(); ctx.roundRect(bx, by, 46, bh, 8); ctx.fill();
  });
  const alert = ease(Math.max(0, Math.min(1, (t - 0.4) / 0.35)));
  if (alert > 0) {
    ctx.globalAlpha = alert;
    card(ctx, W * 0.05, H * 0.70, 380, 84, CREAM);
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(W * 0.05 + 30, H * 0.70 + 42, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '600 17px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SED-014 below reorder point', W * 0.05 + 58, H * 0.70 + 34);
    ctx.font = '500 14px Manrope, Helvetica, sans-serif';
    ctx.fillText('reorder raised: ₹ 24,300 · 3 suppliers', W * 0.05 + 58, H * 0.70 + 62);
    ctx.globalAlpha = 1;
  }
  // divider
  ctx.fillStyle = ACCENT;
  ctx.fillRect(mid - 2, 120, 4, H - 240);
  // right: invoices (cream card)
  ctx.save();
  ctx.translate(mid + 20, 0);
  card(ctx, 0, 150, mid - 40, H * 0.56, '#fdfcf6');
  ctx.fillStyle = INK;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('INVOICES · SEDNO, LIVE', 30, 200);
  const rows2 = [['PO £ 1,480', 'GRPO received', 'AUTO-POSTED', GOOD], ['PO ₹ 96,400', 'GRPO pending', 'EXCEPTION', ACCENT]];
  rows2.forEach(([a, b, status, color], r) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.8 - 0.3 - r * 0.4) / 0.4)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    const y = 260 + r * 74;
    ctx.fillStyle = INK;
    ctx.font = '500 17px Manrope, Helvetica, sans-serif';
    ctx.fillText(a, 30, y);
    ctx.fillStyle = withAlpha(INK, 0.55);
    ctx.fillText(b, 30, y + 28);
    ctx.fillStyle = color;
    ctx.font = '700 17px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(status, mid - 70, y + 14);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });
  ctx.restore();
}

function drawTax(ctx, t) {
  bg(ctx, DARK);
  eyebrowLeft(ctx, '06 / TAX · VAT RETURNS & HMRC FILING, COMING SOON', CREAM);
  // horizontal timeline: ledger -> vat -> hmrc
  const stations = [
    { x: W * 0.14, label: 'LEDGER', detail: 'every posting,\nrecorded' },
    { x: W * 0.5, label: 'VAT', detail: 'output £ 8,410\ninput £ 3,260\ndue £ 5,150' },
    { x: W * 0.86, label: 'HMRC', detail: 'filed · MTD-ready\naudit trail kept' },
  ];
  ctx.font = '700 20px Manrope, Helvetica, sans-serif';
  stations.forEach((s, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.6 - i * 0.28) / 0.45)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    card(ctx, s.x - 90, H * 0.24, 180, 84, CREAM, 16);
    ctx.fillStyle = i === 2 ? ACCENT : INK;
    ctx.textAlign = 'center';
    ctx.fillText(s.label, s.x, H * 0.24 + 52);
    // details under
    ctx.fillStyle = withAlpha(CREAM, 0.85);
    ctx.font = '500 15px Manrope, Helvetica, sans-serif';
    s.detail.split('\n').forEach((line, li) => ctx.fillText(line, s.x, H * 0.24 + 122 + li * 26));
    ctx.globalAlpha = 1;
    if (i > 0) {
      const px0 = stations[i - 1].x + 92, px1 = s.x - 92;
      ctx.strokeStyle = withAlpha(CREAM, 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px0, H * 0.24 + 42); ctx.lineTo(px1, H * 0.24 + 42); ctx.stroke();
      const pulse = ((t * 0.7 + i * 0.3) % 1);
      ctx.fillStyle = ACCENT;
      ctx.beginPath(); ctx.arc(lerp(px0, px1, pulse), H * 0.24 + 42, 5, 0, Math.PI * 2); ctx.fill();
    }
  });
  const note = ease(Math.max(0, Math.min(1, (t - 0.7) / 0.3)));
  if (note > 0) {
    ctx.globalAlpha = note;
    ctx.fillStyle = withAlpha(ACCENT, 0.95);
    ctx.font = '600 18px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('India: the same pattern, GST returns in ₹', W / 2, H - 170);
    ctx.globalAlpha = 1;
  }
  caption(ctx, ['VAT calculated from the ledger,', 'filed without the spreadsheet dance.'], H - 110, CREAM);
}

function drawFloor(ctx, t) {
  bg(ctx);
  eyebrowLeft(ctx, '07 / FACTORY FLOOR · LIVE OEE');
  ctx.fillStyle = INK;
  ctx.font = '600 30px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('The floor stops running on paper.', 64, H - 54);
  // terminal strip
  card(ctx, 64, 110, W - 128, 58, '#ffffff');
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(96, 139, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '600 19px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Shift 2 · Line 3 · OEE 87%', 122, 147);
  // six cells rise, one lags (amber)
  const cells = [0.86, 0.91, 0.74, 0.58, 0.88, 0.69];
  cells.forEach((oee, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.5 - i * 0.12) / 0.45)));
    if (p <= 0) return;
    const cw = 128, cx = 72 + i * 190, base = H * 0.62;
    const ch = (H * 0.36) * oee * p;
    ctx.globalAlpha = p;
    card(ctx, cx, base - ch, cw, ch + 52, oee < 0.65 ? withAlpha(ACCENT, 0.28) : '#ffffff', 12);
    ctx.fillStyle = INK;
    ctx.font = '700 14px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CELL ${i + 1}`, cx + cw / 2, base + 30);
    ctx.font = '600 24px Manrope, Helvetica, sans-serif';
    ctx.fillText(`${Math.round(oee * 100)}%`, cx + cw / 2, base - ch + 38);
    if (oee < 0.65 && t > 0.5) {
      ctx.fillStyle = ACCENT;
      ctx.font = '700 14px Manrope, Helvetica, sans-serif';
      ctx.fillText('needs a look', cx + cw / 2, base - ch - 12);
    }
    ctx.globalAlpha = 1;
  });
}

function drawPayroll(ctx, t) {
  bg(ctx, CREAM);
  eyebrowLeft(ctx, '08 / HR & PAYROLL · COMING SOON');
  caption(ctx, ['Payday, on time,', 'in either currency.'], H - 100);
  const slips = [
    { name: 'A. SHARMA', net: '₹ 86,400', gross: '₹ 1,02,000', d: 0.0, x: 0.10 },
    { name: 'J. SMITH', net: '£ 2,480', gross: '£ 3,100', d: 0.16, x: 0.39 },
    { name: 'R. VERMA', net: '₹ 74,200', gross: '₹ 88,000', d: 0.32, x: 0.68 },
  ];
  slips.forEach((s) => {
    const p = ease(Math.max(0, Math.min(1, (t - s.d) / 0.4)));
    if (p <= 0) return;
    const x = lerp(W, s.x * W, p), y = H * 0.18;
    ctx.globalAlpha = p;
    card(ctx, x, y, 290, 240, '#ffffff');
    ctx.fillStyle = INK;
    ctx.font = '700 17px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PAYSLIP · ${s.name}`, x + 24, y + 38);
    ctx.font = '500 15px Manrope, Helvetica, sans-serif';
    ctx.fillText('Gross', x + 24, y + 88);
    ctx.fillText('Deductions', x + 24, y + 116);
    ctx.fillText('Net pay', x + 24, y + 150);
    ctx.font = '700 16px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(s.gross, x + 266, y + 88);
    ctx.fillText('computed', x + 266, y + 116);
    ctx.fillStyle = ACCENT;
    ctx.fillText(s.net, x + 266, y + 150);
    ctx.fillStyle = withAlpha(INK, 0.25);
    ctx.fillRect(x + 24, y + 190, 242, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 24, y + 190, 242 * p, 6);
    ctx.globalAlpha = 1;
  });
}

// ---------- ACT III : calm, bright ----------

function drawResults(ctx, t) {
  bg(ctx, CREAM);
  eyebrowLeft(ctx, '09 / WHAT CHANGES', GOOD);
  const stats = [
    ['70%', 'handled straight-through'],
    ['Minutes', 'not days, per order'],
    ['One trail', 'for every AI decision'],
  ];
  stats.forEach(([big, small], i) => {
    const p = pop(t, 0.15 + i * 0.3, 0.5);
    if (p <= 0) return;
    const y = 200 + i * 116;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = INK;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(big, W / 2, y);
    ctx.font = '500 22px Manrope, Helvetica, sans-serif';
    ctx.fillStyle = withAlpha(INK, 0.65);
    ctx.fillText(small, W / 2, y + 40);
    ctx.globalAlpha = 1;
  });
}

function drawHuman(ctx, t) {
  bg(ctx, CREAM);
  eyebrowLeft(ctx, '10 / PEOPLE STAY IN CHARGE', GOOD);
  caption(ctx, ['AI does the fiddly work.', 'You make the calls.'], H - 100);
  card(ctx, W * 0.24, H * 0.24, 620, 150, '#ffffff');
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(W * 0.24 + 50, H * 0.24 + 75, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '600 22px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Invoice 331 differs from PO 88 by ₹ 4,200.', W * 0.24 + 80, H * 0.24 + 66);
  ctx.font = '400 17px Manrope, Helvetica, sans-serif';
  ctx.fillText('Suggested: request the supplier’s revised copy.', W * 0.24 + 80, H * 0.24 + 100);
  const p = ease(Math.max(0, Math.min(1, (t - 0.35) / 0.3)));
  const cx = lerp(W * 0.16, W * 0.24 + 470, p);
  const cy = lerp(H * 0.9, H * 0.24 + 190, p);
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.roundRect(W * 0.24 + 380, H * 0.24 + 165, 180, 48, 24); ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Send to supplier', W * 0.24 + 470, H * 0.24 + 196);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = CREAM; ctx.stroke();
  ctx.restore();
}

function drawPipeline(ctx, t) {
  bg(ctx, CREAM);
  eyebrowLeft(ctx, '11 / ONE WORKFLOW, END TO END', GOOD);
  caption(ctx, ['From a messy inbox to a filed return,', 'with governed AI underneath.'], H - 100);
  const nodes = ['INBOX', 'INGEST', 'ERP', 'OPERATE', 'SURVEY', 'YOU'];
  const nodeW = 150, gap = (W - 120 - nodes.length * nodeW) / (nodes.length - 1);
  nodes.forEach((label, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.8 - i * 0.25) / 0.5)));
    const x = 60 + i * (nodeW + gap), y = H * 0.40;
    ctx.globalAlpha = p;
    card(ctx, x, y, nodeW, 84, i === nodes.length - 1 ? ACCENT : '#ffffff', 16);
    ctx.fillStyle = i === nodes.length - 1 ? CREAM : INK;
    ctx.font = '700 20px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + nodeW / 2, y + 50);
    if (i > 0) {
      const px = 60 + (i - 1) * (nodeW + gap) + nodeW;
      ctx.strokeStyle = withAlpha(INK, 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px + 4, y + 42); ctx.lineTo(x - 6, y + 42); ctx.stroke();
      const pulse = ((t * 0.5 + i * 0.16) % 1);
      ctx.fillStyle = ACCENT;
      ctx.beginPath(); ctx.arc(lerp(px + 4, x - 6, pulse), y + 42, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = withAlpha(INK, 0.6);
  ctx.font = '500 19px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('stock · invoices · VAT & HMRC · factory floor · HR & payroll', W / 2, H * 0.60);
}

function drawClose(ctx, t) {
  bg(ctx, INK);
  const a = fadeInOut(t, 0.12, 0.08);
  ctx.globalAlpha = a;
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.roundRect(W / 2 - 46, H * 0.16, 92, 92, 26); ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = 'bold 60px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('k', W / 2 - 6, H * 0.16 + 66);
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(W / 2 + 16, H * 0.16 + 56, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('Kapkoti Solution', W / 2, H * 0.16 + 186);
  ctx.font = '500 25px Manrope, Helvetica, sans-serif';
  ctx.fillText('One pipeline for the work that falls between your systems.', W / 2, H * 0.16 + 242);
  ctx.font = '600 19px Manrope, Helvetica, sans-serif';
  ctx.fillStyle = withAlpha(CREAM, 0.75);
  ctx.fillText('From mail and orders to stock, invoices, VAT & HMRC,', W / 2, H * 0.16 + 288);
  ctx.fillText('the factory floor, HR and payroll. Elenchus keeps it improving.', W / 2, H * 0.16 + 320);
  ctx.fillStyle = ACCENT;
  ctx.font = '700 25px Manrope, Helvetica, sans-serif';
  const beat = Math.min(1, Math.max(0, (t - 0.42) * 2));
  ctx.globalAlpha = a * beat;
  ctx.fillText('Tell us what you wish was easier · www.kapkotisolution.com', W / 2, H * 0.72);
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
    scene.draw(ctx, i / count);
    writeFileSync(join(FRAMES_DIR, `f${String(frame).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
    frame++;
  }
  console.log(`  ${scene.name} done (${frame}/${totalFrames})`);
}

console.log('Encoding video with ffmpeg…');
const SILENT_MP4 = join(ROOT, '.cache', 'video-silent.mp4');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(FRAMES_DIR, 'f%05d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', SILENT_MP4]);

console.log('Synthesising soundtrack…');
const AUDIO_WAV = join(ROOT, '.cache', 'audio.wav');
synthAudio(AUDIO_WAV, totalSeconds);

console.log('Muxing sound…');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SILENT_MP4, '-i', AUDIO_WAV,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', OUT_MP4]);
console.log(`Wrote ${OUT_MP4}`);

// ---------- soundtrack ----------

// ponytail: single-pass additive synthesis + macOS `say` narration; swap both if the film ever needs studio treatment
function synthAudio(path, durationSeconds, narrationVoice = 'Daniel') { // 'Daniel' = en_GB, on macOS
  const SR = 44100;
  const n = Math.ceil((durationSeconds + 2) * SR);
  const buf = new Float64Array(n);
  const beat = 60 / 128; // 128 BPM, Apridata-style drive

  const chords = {
    tense: [[0, 3, 7], [-2, 2, 5], [0, 3, 7, 10], [-2, 2, 5, 9]], // Dm, C(add Bb flavour), Dm7, Bb colour
    build: [[0, 4, 7], [5, 9, 12], [9, 12, 16], [5, 9, 12]],      // D, G, Bm, G
    calm: [[0, 4, 9, 14], [5, 9, 12], [0, 4, 7, 14], [-2, 4, 9]], // Dmaj9 colour, G, D, warm
  };
  const rootHz = (semi) => 146.83 * Math.pow(2, semi / 12); // D3
  const pulseHz = (semi) => 73.42 * Math.pow(2, semi / 12); // D2

  let t0 = 0;
  scenes.forEach((scene, si) => {
    const m = scene.music;
    if (m.mode === 'silence') { t0 += scene.seconds; return; }
    const chord = chords[m.mode][si % chords[m.mode].length];
    const padAmp = m.mode === 'tense' ? 0.05 : m.mode === 'build' ? 0.045 : 0.04;
    for (const semi of chord) {
      addPad(buf, SR, t0, scene.seconds + 0.5, rootHz(semi), padAmp);
      addPad(buf, SR, t0, scene.seconds + 0.6, rootHz(semi) * 2.002, padAmp * 0.5);
    }
    if (m.mode !== 'calm') {
      // driving pulse on the eighths, louder with intensity
      const step = beat / 2;
      for (let p = t0; p < t0 + scene.seconds; p += step) {
        const isBeat = Math.abs((p - t0) / beat - Math.round((p - t0) / beat)) < 0.01;
        addPulse(buf, SR, p, pulseHz(m.mode === 'tense' ? 0 : chord[0]), (isBeat ? 0.16 : 0.09) * m.intensity);
      }
      if (m.intensity > 0.6) {
        for (let b = t0; b < t0 + scene.seconds; b += beat) addTick(buf, SR, b, 0.05 * m.intensity);
      }
      if (m.peak) {
        for (let p = t0 + beat / 4; p < t0 + scene.seconds; p += beat / 2) {
          addPluck(buf, SR, p, rootHz(chord[1 % chord.length]) * 4, 0.05);
        }
      }
    } else {
      // calm: slow arpeggio, one note per half-bar
      const step = beat * 2;
      const notes = [0, 7, 4, 9];
      for (let p = t0, k = 0; p < t0 + scene.seconds; p += step, k++) {
        addPluck(buf, SR, p, rootHz(chord[k % chord.length] + 12), 0.03);
      }
    }
    addWhoosh(buf, SR, t0 - 0.3, 0.7);
    t0 += scene.seconds;
  });

  let closeStart = 0;
  for (let i = 0; i < scenes.length - 1; i++) closeStart += scenes[i].seconds;
  addBell(buf, SR, closeStart + 4.4, rootHz(24), 0.09);

  // narration: one macOS `say` clip per scene, mixed 0.4s after each scene start
  mkdirSync(join(ROOT, '.cache', 'narration'), { recursive: true });
  let sceneStart = 0;
  scenes.forEach((scene, si) => {
    const aiff = join(ROOT, '.cache', 'narration', `n${si}.aiff`);
    if (scene.line) execFileSync('say', ['-v', narrationVoice, '-r', String(scene.rate), '-o', aiff, scene.line]);
    if (!scene.line) { sceneStart += scene.seconds; return; }
    const raw = execFileSync('ffmpeg', ['-i', aiff, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 64 * 1024 * 1024 });
    const floats = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
    mixRaw(buf, Math.round((sceneStart + 0.4) * SR), floats, 1.1);
    sceneStart += scene.seconds;
  });

  // normalise and soft-clip
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.85 / peak : 1;
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const v = Math.tanh(buf[i] * g * 1.3) * 0.95;
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  writeFileSync(path, Buffer.concat([header, pcm]));
}

function pseudo(x) { return (Math.sin(x) + 1) / 2; } // deterministic 0..1

function mixRaw(buf, startSample, out, gain = 1) {
  for (let i = 0; i < out.length; i++) {
    const idx = startSample + i;
    if (idx >= buf.length) break;
    buf[idx] += out[i] * gain;
  }
}

function envAt(i, n, attack, release) {
  const t = i / n;
  if (t < attack) return t / attack;
  if (t > 1 - release) return (1 - t) / release;
  return 1;
}

function addPad(buf, SR, start, dur, hz, amp) {
  const s = Math.max(0, Math.round(start * SR)), len = Math.round(dur * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const e = envAt(i, len, 0.3, 0.4);
    out[i] = (Math.sin(2 * Math.PI * hz * i / SR) + 0.5 * Math.sin(2 * Math.PI * hz * 1.003 * i / SR)) * e * amp;
  }
  mixRaw(buf, s, out);
}

function addPulse(buf, SR, start, hz, amp) {
  const dur = 0.22, len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Math.sin(2 * Math.PI * hz * i / SR) * Math.exp(-16 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addPluck(buf, SR, start, hz, amp) {
  const dur = 0.8, len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Math.sin(2 * Math.PI * hz * i / SR) * Math.exp(-5 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addBell(buf, SR, start, hz, amp) {
  const dur = 4, len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (Math.sin(2 * Math.PI * hz * i / SR) + 0.3 * Math.sin(2 * Math.PI * hz * 2.76 * i / SR)) * Math.exp(-1.6 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addTick(buf, SR, start, amp) {
  const dur = 0.05, len = Math.round(dur * SR), s = Math.max(0, Math.round(start * SR));
  const out = new Float64Array(len);
  let smooth = 0;
  for (let i = 0; i < len; i++) {
    const raw = pseudo(i * 17.3 + s) * 2 - 1;
    smooth = smooth * 0.7 + raw * 0.3;
    out[i] = smooth * Math.exp(-10 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addWhoosh(buf, SR, start, dur) {
  const len = Math.round(dur * SR), s = Math.max(0, Math.round(start * SR));
  const out = new Float64Array(len);
  let smooth = 0;
  for (let i = 0; i < len; i++) {
    const e = envAt(i, len, 0.5, 0.4);
    const raw = pseudo(i * 31.7 + s) * 2 - 1;
    smooth = smooth * 0.94 + raw * 0.06;
    out[i] = smooth * e * 0.4;
  }
  mixRaw(buf, s, out);
}

function sceneAt(list, timeSeconds) {
  let t = 0;
  for (let i = 0; i < list.length; i++) {
    t += list[i].seconds;
    if (timeSeconds < t) return i;
  }
  return list.length - 1;
}
