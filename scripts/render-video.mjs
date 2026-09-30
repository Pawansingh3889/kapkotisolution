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
  { name: 'hook', seconds: 5, draw: drawHook, line: 'Life has enough little problems. Let’s solve one.' },
  { name: 'inbox', seconds: 7, draw: drawInbox, line: 'Mail, documents, PDFs, orders and requests. It all arrives at once.' },
  { name: 'ingestion', seconds: 8, draw: drawIngestion, line: 'Ingestion extracts the signal from the noise.' },
  { name: 'erp', seconds: 11, draw: drawERP, line: 'One ERP underneath everything: stock, orders, invoices and people. This one is on the workbench.' },
  { name: 'stock', seconds: 5, draw: drawStock, line: 'Stock levels, watched before they run out.' },
  { name: 'invoices', seconds: 5, draw: drawInvoices, line: 'Three-way match, then posted. Exceptions reach a human.' },
  { name: 'tax', seconds: 8, draw: drawTax, line: 'VAT returns, calculated from the ledger, and filed without the spreadsheet dance.' },
  { name: 'floor', seconds: 7, draw: drawFloor, line: 'On the factory floor, OEE stops running on paper.' },
  { name: 'payroll', seconds: 7, draw: drawPayroll, line: 'HR and payroll, on time, in either currency.' },
  { name: 'agents', seconds: 7, draw: drawAgents, line: 'Agents flag the problems. Surveys keep making it better.' },
  { name: 'human', seconds: 5, draw: drawHuman, line: 'AI does the fiddly work. You make the calls.' },
  { name: 'pipeline', seconds: 9, draw: drawPipeline, line: 'One workflow, end to end, with governed AI underneath.' },
  { name: 'close', seconds: 12, draw: drawClose, line: 'Kapkoti Solution. One pipeline for the work that falls between your systems. Tell us what you wish was easier.' },
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

function fadeInOut(t, inFrac = 0.15, outFrac = 0.15) {
  if (t < inFrac) return ease(t / inFrac);
  if (t > 1 - outFrac) return ease((1 - t) / outFrac);
  return 1;
}

function drawInbox(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '01 / The problem');
  caption(ctx, ['Mail, docs, PDFs, orders, requests:', 'it all arrives at once.']);
  const items = [
    { label: 'INVOICE', dx: 0.10, dy: 0.60, r: -0.10, delay: 0.00 },
    { label: 'SALES ORDER', dx: 0.26, dy: 0.42, r: 0.07, delay: 0.12 },
    { label: 'PDF · 4 pages', dx: 0.44, dy: 0.64, r: -0.05, delay: 0.24 },
    { label: 'POD', dx: 0.60, dy: 0.38, r: 0.11, delay: 0.36 },
    { label: 'REMITTANCE', dx: 0.76, dy: 0.58, r: -0.08, delay: 0.48 },
    { label: 'REQUEST', dx: 0.88, dy: 0.44, r: 0.05, delay: 0.60 },
  ];
  for (const it of items) {
    const p = ease(Math.max(0, Math.min(1, (t - it.delay) / 0.22)));
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
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = withAlpha(INK, 0.3);
    ctx.fillRect(x0 + 30, y0 + 40 + i * 34, w0 - 60 - (i % 3) * 60, 10);
  }
  ctx.fillStyle = withAlpha(INK, 0.5);
  ctx.fillRect(x0 + 30, y0 + h0 - 70, 160, 26);
  const sx = x0 + sweep * w0;
  ctx.fillStyle = withAlpha(ACCENT, 0.9);
  ctx.fillRect(sx - 2, y0, 4, h0);
  ctx.fillStyle = withAlpha(ACCENT, 0.15);
  ctx.fillRect(sx - 40, y0, 40, h0);
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
  eyebrow(ctx, '03 / The system of record · Kapkoti ERP, on the workbench');
  caption(ctx, ['One ERP underneath everything:', 'stock, orders, invoices, people.']);
  const gx = W * 0.14, gy = H * 0.18, gw = W * 0.72, gh = H * 0.44;
  card(ctx, gx, gy, gw, gh, '#ffffff');
  ctx.fillStyle = INK;
  ctx.fillRect(gx, gy, gw, 44);
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ['MODULE', 'RECORD', 'AMOUNT', 'STATUS'].forEach((h, i) => ctx.fillText(h, gx + 30 + i * (gw - 60) / 4, gy + 29));
  const rows = [
    ['STOCK', 'GRPO 221', '₹ 96,400', 'POSTED'],
    ['SALES', 'Order 1042', '£ 1,480', 'POSTED'],
    ['INVOICE', 'Invoice 331', '₹ 12,875', 'MATCHED'],
    ['INVOICE', 'Invoice 332', '£ 7,310', 'MATCHED'],
  ];
  rows.forEach((row, r) => {
    const p = ease(Math.max(0, Math.min(1, (t * 2.2 - r * 0.45) / 0.5)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    const ry = gy + 62 + r * 52;
    if (r % 2 === 0) { ctx.fillStyle = SOFT; ctx.fillRect(gx + 2, ry - 18, gw - 4, 40); }
    ctx.fillStyle = INK;
    ctx.font = '500 17px Manrope, Helvetica, sans-serif';
    row.forEach((cell, c) => ctx.fillText(cell, gx + 30 + c * (gw - 60) / 4, ry + 8));
    ctx.globalAlpha = 1;
  });
  // workbench chip slides in under the table
  const p = ease(Math.max(0, Math.min(1, (t - 0.62) / 0.35)));
  const px = lerp(W + 300, W * 0.62, p);
  ctx.globalAlpha = p;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.roundRect(px, gy + gh + 30, 300, 50, 25);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('the Kapkoti ERP · on the workbench', px + 150, gy + gh + 63);
  ctx.globalAlpha = 1;
}

function drawStock(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '04 / STOCK · SEDNO, LIVE DEMO');
  caption(ctx, ['Stock levels, watched', 'before they run out.'], H - 100, CREAM);
  const bars = [0.72, 0.48, 0.85, 0.22, 0.6];
  bars.forEach((h, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.6 - i * 0.1) / 0.4)));
    const bh = h * H * 0.36 * p;
    const bx = W * 0.18 + i * 82, by = H * 0.64 - bh;
    ctx.fillStyle = h < 0.3 ? ACCENT : withAlpha(CREAM, 0.85);
    ctx.beginPath();
    ctx.roundRect(bx, by, 50, bh, 8);
    ctx.fill();
  });
  const alert = ease(Math.max(0, Math.min(1, (t - 0.5) / 0.4)));
  if (alert > 0) {
    ctx.globalAlpha = alert;
    card(ctx, W * 0.58, H * 0.26, 400, 120, CREAM);
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(W * 0.58 + 34, H * 0.26 + 60, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '600 19px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SED-014 below reorder point', W * 0.58 + 62, H * 0.26 + 52);
    ctx.font = '500 16px Manrope, Helvetica, sans-serif';
    ctx.fillText('Reorder raised: ₹ 24,300 across 3 suppliers', W * 0.58 + 62, H * 0.26 + 84);
    ctx.globalAlpha = 1;
  }
}

function drawInvoices(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '05 / INVOICES · SEDNO, LIVE DEMO');
  caption(ctx, ['Three-way match, then posted.', 'Exceptions reach a human.']);
  const gx = W * 0.16, gy = H * 0.20, gw = W * 0.68, gh = H * 0.42;
  card(ctx, gx, gy, gw, gh, '#ffffff');
  ctx.fillStyle = INK;
  ctx.fillRect(gx, gy, gw, 42);
  ctx.fillStyle = CREAM;
  ctx.font = '700 17px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ['PO', 'GRPO', 'INVOICE', 'RESULT'].forEach((h, i) => ctx.fillText(h, gx + 28 + i * (gw - 56) / 4, gy + 28));
  const rows = [
    ['£ 1,480', 'received', '₹ 12,875', 'AUTO-POSTED'],
    ['₹ 96,400', 'pending', '£ 7,310', 'EXCEPTION'],
  ];
  rows.forEach((row, r) => {
    const p = ease(Math.max(0, Math.min(1, (t * 2 - r * 0.6) / 0.5)));
    if (p <= 0) return;
    ctx.globalAlpha = p;
    const ry = gy + 66 + r * 56;
    ctx.font = '500 17px Manrope, Helvetica, sans-serif';
    row.forEach((cell, c) => {
      ctx.fillStyle = c === 3 ? (r === 0 ? '#3d6b4f' : ACCENT) : INK;
      ctx.fillText(cell, gx + 28 + c * (gw - 56) / 4, ry);
    });
    ctx.globalAlpha = 1;
  });
}

function drawTax(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '06 / TAX · VAT RETURNS & HMRC FILING, ON THE WORKBENCH');
  caption(ctx, ['VAT calculated from the ledger,', 'filed without the spreadsheet dance.'], H - 100, CREAM);
  const card_ = ease(Math.max(0, Math.min(1, t * 2.4)));
  if (card_ > 0) {
    ctx.globalAlpha = card_;
    card(ctx, W * 0.24, H * 0.16, 520, 300, CREAM);
    ctx.fillStyle = INK;
    ctx.font = '700 20px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VAT RETURN · Q3', W * 0.24 + 34, H * 0.16 + 48);
    const lines = [
      ['Output tax', '£ 8,410'],
      ['Input tax', '£ 3,260'],
      ['Due to HMRC', '£ 5,150'],
    ];
    lines.forEach(([label, val], i) => {
      const p = ease(Math.max(0, Math.min(1, (t * 2.6 - 0.4 - i * 0.25) / 0.4)));
      if (p <= 0) return;
      ctx.globalAlpha = p;
      const y = H * 0.16 + 106 + i * 48;
      ctx.font = '500 19px Manrope, Helvetica, sans-serif';
      ctx.fillText(label, W * 0.24 + 34, y);
      ctx.font = '700 19px Manrope, Helvetica, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, W * 0.24 + 486, y);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    });
    const stamp = ease(Math.max(0, Math.min(1, (t - 0.72) / 0.25)));
    if (stamp > 0) {
      ctx.globalAlpha = stamp;
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.roundRect(W * 0.30, H * 0.16 + 210, 400, 52, 26);
      ctx.fill();
      ctx.fillStyle = CREAM;
      ctx.font = '700 17px Manrope, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('filed · MTD-ready · audit trail kept', W * 0.30 + 200, H * 0.16 + 243);
      // India GST note
      ctx.font = '500 15px Manrope, Helvetica, sans-serif';
      ctx.fillStyle = INK;
      ctx.fillText('India: the same pattern, GST returns in ₹', W * 0.30 + 200, H * 0.16 + 288);
      ctx.globalAlpha = 1;
    }
  }
  ctx.globalAlpha = 1;
}

function drawFloor(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '07 / FACTORY FLOOR · LIVE OEE');
  caption(ctx, ['The floor stops running on paper.']);
  // shift terminal strip
  card(ctx, W * 0.16, H * 0.18, W * 0.68, 60, '#ffffff');
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W * 0.16 + 32, H * 0.18 + 30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = '600 19px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Shift 2 · Line 3 · OEE 87%', W * 0.16 + 58, H * 0.18 + 38);
  // six cells light up
  const cells = [0.86, 0.91, 0.74, 0.88, 0.95, 0.69];
  cells.forEach((oee, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 1.5 - i * 0.14) / 0.45)));
    if (p <= 0) return;
    const cw = 120, cx = W * 0.12 + i * 176, cy = H * 0.60;
    ctx.globalAlpha = p;
    card(ctx, cx, cy - 90 * oee * p, cw, 90 * oee * p + 60, oee < 0.75 ? withAlpha(ACCENT, 0.25) : '#ffffff', 12);
    ctx.fillStyle = INK;
    ctx.font = '700 15px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CELL ${i + 1}`, cx + cw / 2, cy + 28);
    ctx.font = '600 22px Manrope, Helvetica, sans-serif';
    ctx.fillText(`${Math.round(oee * 100)}%`, cx + cw / 2, cy - 90 * oee * p + 40);
    ctx.globalAlpha = 1;
  });
}

function drawPayroll(ctx, t) {
  bg(ctx, INK);
  eyebrow(ctx, '08 / HR & PAYROLL · ON THE WORKBENCH');
  caption(ctx, ['Payday, on time, in either currency.'], H - 100, CREAM);
  const slips = [
    { name: 'A. Sharma', net: '₹ 86,400', gross: '₹ 1,02,000', delay: 0.0, x: 0.14 },
    { name: 'J. Smith', net: '£ 2,480', gross: '£ 3,100', delay: 0.15, x: 0.40 },
    { name: 'R. Verma', net: '₹ 74,200', gross: '₹ 88,000', delay: 0.30, x: 0.66 },
  ];
  slips.forEach((s) => {
    const p = ease(Math.max(0, Math.min(1, (t - s.delay) / 0.45)));
    if (p <= 0) return;
    const x = s.x * W, y = H * 0.18;
    ctx.globalAlpha = p;
    card(ctx, x, y, 300, 250, CREAM);
    ctx.fillStyle = INK;
    ctx.font = '700 18px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PAYSLIP · ${s.name}`, x + 26, y + 40);
    ctx.font = '500 16px Manrope, Helvetica, sans-serif';
    ctx.fillText('Gross', x + 26, y + 92);
    ctx.fillText('Deductions', x + 26, y + 122);
    ctx.fillText('Net pay', x + 26, y + 158);
    ctx.font = '700 17px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(s.gross, x + 274, y + 92);
    ctx.fillText('computed', x + 274, y + 122);
    ctx.fillStyle = ACCENT;
    ctx.fillText(s.net, x + 274, y + 158);
    // progress line
    ctx.fillStyle = withAlpha(INK, 0.25);
    ctx.fillRect(x + 26, y + 200, 248, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x + 26, y + 200, 248 * p, 6);
    ctx.globalAlpha = 1;
  });
}

function drawAgents(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '09 / AGENTS & SURVEYS · ELENCHUS, LIVE APP');
  caption(ctx, ['Agents flag the problems.', 'Surveys keep making it better.']);
  const bubbles = [
    { text: 'Invoice 332 differs from PO by £ 240', y: 0.16, delay: 0.0 },
    { text: 'VAT box 6 doesn’t tie to the ledger', y: 0.32, delay: 0.18 },
    { text: 'Cell 4 OEE fell 9% this week', y: 0.48, delay: 0.36 },
    { text: '“What slowed you down this shift?”', y: 0.64, delay: 0.54, survey: true },
  ];
  bubbles.forEach((b) => {
    const p = ease(Math.max(0, Math.min(1, (t - b.delay) / 0.4)));
    if (p <= 0) return;
    const x = b.survey ? W * 0.30 : W * 0.10;
    ctx.globalAlpha = p;
    card(ctx, x, b.y * H, 560, 56, b.survey ? SOFT : '#ffffff', 28);
    ctx.fillStyle = b.survey ? '#3d6b4f' : ACCENT;
    ctx.beginPath();
    ctx.arc(x + 32, b.y * H + 28, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = '500 19px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.text, x + 56, b.y * H + 35);
    ctx.globalAlpha = 1;
  });
  // loop arrow back to the pipeline
  const loop = ease(Math.max(0, Math.min(1, (t - 0.7) / 0.3)));
  if (loop > 0) {
    ctx.globalAlpha = loop;
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(W * 0.30 + 280, H * 0.64 + 60);
    ctx.bezierCurveTo(W * 0.18, H * 0.86, W * 0.06, H * 0.5, W * 0.10 + 40, H * 0.16 + 70);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = ACCENT;
    ctx.beginPath();
    ctx.arc(W * 0.10 + 40, H * 0.16 + 70, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '600 16px Manrope, Helvetica, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('feedback re-tunes the whole pipeline', W * 0.34, H * 0.80);
    ctx.globalAlpha = 1;
  }
}

function drawHuman(ctx, t) {
  bg(ctx);
  eyebrow(ctx, '10 / PEOPLE STAY IN CHARGE');
  caption(ctx, ['AI does the fiddly work.', 'You make the calls.']);
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
  const p = ease(Math.max(0, Math.min(1, (t - 0.35) / 0.3)));
  const cx = lerp(W * 0.16, W * 0.24 + 470, p);
  const cy = lerp(H * 0.9, H * 0.24 + 190, p);
  const click = t > 0.85 ? (Math.sin((t - 0.85) * 40) + 1) / 2 : 1;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(W * 0.24 + 380, H * 0.24 + 165, 180, 48, 24);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '700 18px Manrope, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Send to supplier', W * 0.24 + 470, H * 0.24 + 196);
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
  eyebrow(ctx, '11 / ONE WORKFLOW, END TO END');
  caption(ctx, ['From a messy inbox to a filed return,', 'with governed AI underneath.'], H - 100, CREAM);
  const nodes = ['INBOX', 'INGEST', 'ERP', 'OPERATE', 'SURVEY', 'YOU'];
  const nodeW = 150, gap = (W - 120 - nodes.length * nodeW) / (nodes.length - 1);
  nodes.forEach((label, i) => {
    const p = ease(Math.max(0, Math.min(1, (t * 2 - i * 0.3) / 0.5)));
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
  ctx.fillText('stock · invoices · VAT & HMRC · factory floor · HR & payroll', W / 2, H * 0.62);
}

function drawClose(ctx, t) {
  bg(ctx, INK);
  const a = fadeInOut(t, 0.1, 0.1);
  ctx.globalAlpha = a;
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.roundRect(W / 2 - 46, H * 0.18, 92, 92, 26);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.font = 'bold 60px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('k', W / 2 - 6, H * 0.18 + 66);
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W / 2 + 16, H * 0.18 + 56, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText('Kapkoti Solution', W / 2, H * 0.18 + 190);
  ctx.font = '500 26px Manrope, Helvetica, sans-serif';
  ctx.fillText('One pipeline for the work that falls between your systems.', W / 2, H * 0.18 + 250);
  ctx.font = '600 20px Manrope, Helvetica, sans-serif';
  ctx.fillStyle = withAlpha(CREAM, 0.8);
  ctx.fillText('From mail and orders to stock, invoices, VAT & HMRC,', W / 2, H * 0.18 + 300);
  ctx.fillText('the factory floor, HR and payroll. Elenchus keeps it improving.', W / 2, H * 0.18 + 334);
  ctx.fillStyle = ACCENT;
  ctx.font = '700 26px Manrope, Helvetica, sans-serif';
  const beat = Math.min(1, Math.max(0, (t - 0.4) * 2));
  ctx.globalAlpha = a * beat;
  ctx.fillText('Tell us what you wish was easier · www.kapkotisolution.com', W / 2, H * 0.74);
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
function synthAudio(path, durationSeconds, narrationVoice = 'Daniel') { // 'Daniel' = en_GB, present on macOS
  const SR = 44100;
  const n = Math.ceil((durationSeconds + 2) * SR);
  const buf = new Float64Array(n);
  const beat = 60 / 96; // 96 BPM grid

  const chordByScene = [
    [0, 4, 9], [9, 0, 4], [2, 5, 9], [0, 7, 14], [4, 7, 11], [9, 12, 16], [5, 9, 12], [0, 4, 9],
    [5, 9, 12], [9, 12, 16], [0, 4, 9], [0, 5, 12], [0, 4, 9, 14],
  ];
  const rootHz = (semi) => 146.83 * Math.pow(2, semi / 12); // D3

  // music bed, quiet under the narration
  let t0 = 0;
  scenes.forEach((scene, si) => {
    for (const semi of chordByScene[si]) {
      addPad(buf, SR, t0, scene.seconds + 0.6, rootHz(semi), 0.05);
      addPad(buf, SR, t0, scene.seconds + 0.6, rootHz(semi) * 2.002, 0.025); // octave shimmer
    }
    addWhoosh(buf, SR, t0 - 0.3, 0.7);
    t0 += scene.seconds;
  });

  // plucks: pentatonic D major on the eighth-note grid, sparse and deterministic
  const pent = [0, 2, 4, 7, 9, 12, 14, 16];
  for (let step = 0; step * beat / 2 < durationSeconds; step++) {
    const r = pseudo(step * 7919);
    if (r < 0.75) continue; // sparse: narration needs room
    const sceneIdx = sceneAt(scenes, step * beat / 2);
    const chord = chordByScene[sceneIdx];
    const semi = chord[Math.floor(pseudo(step * 31) * chord.length)] + (r > 0.9 ? 12 : 0);
    addPluck(buf, SR, step * beat / 2, rootHz(semi) * 2, 0.035);
  }

  // bell on the closing call-to-action
  let closeStart = 0;
  for (let i = 0; i < scenes.length - 1; i++) closeStart += scenes[i].seconds;
  addBell(buf, SR, closeStart + 4.8, rootHz(24), 0.1);

  // narration: one macOS `say` clip per scene, mixed 0.4s after each scene start
  mkdirSync(join(ROOT, '.cache', 'narration'), { recursive: true });
  let sceneStart = 0;
  scenes.forEach((scene, si) => {
    const aiff = join(ROOT, '.cache', 'narration', `n${si}.aiff`);
    if (scene.line) execFileSync('say', ['-v', narrationVoice, '-r', '168', '-o', aiff, scene.line]);
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

function envAt(i, n, attack, release) {
  const t = i / n;
  if (t < attack) return t / attack;
  if (t > 1 - release) return (1 - t) / release;
  return 1;
}

function addPad(buf, SR, start, dur, hz, amp) {
  const s = Math.round((start < 0 ? 0 : start) * SR), len = Math.round(dur * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const e = envAt(i, len, 0.25, 0.35);
    out[i] = (Math.sin(2 * Math.PI * hz * i / SR) + 0.5 * Math.sin(2 * Math.PI * hz * 1.003 * i / SR)) * e * amp;
  }
  mixRaw(buf, s, out);
}

function addPluck(buf, SR, start, hz, amp) {
  const dur = 0.9, len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Math.sin(2 * Math.PI * hz * i / SR) * Math.exp(-6 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addBell(buf, SR, start, hz, amp) {
  const dur = 4, len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (Math.sin(2 * Math.PI * hz * i / SR) + 0.3 * Math.sin(2 * Math.PI * hz * 2.76 * i / SR)) * Math.exp(-1.8 * i / len) * amp;
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
    smooth = smooth * 0.985 + raw * 0.015; // cheap low-pass
    out[i] = smooth * e * 0.5;
  }
  mixRaw(buf, s, out);
}

function mixRaw(buf, startSample, out, gain = 1) {
  for (let i = 0; i < out.length; i++) {
    const idx = startSample + i;
    if (idx >= buf.length) break;
    buf[idx] += out[i] * gain;
  }
}

function sceneAt(scenes, timeSeconds) {
  let t = 0;
  for (let i = 0; i < scenes.length; i++) {
    t += scenes[i].seconds;
    if (timeSeconds < t) return i;
  }
  return scenes.length - 1;
}
