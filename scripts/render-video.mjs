// Renders the Kapkoti Solution homepage film frame by frame and encodes it with ffmpeg.
// Every frame is drawn in code: no stock footage, no video editor.
// Structure: a hook, then nine problem and solution pairs covering a business end to end
// (problems fast and tense, solutions calm), a summary of the whole chain, and "COMING SOON".
// Usage: pnpm video  (needs ffmpeg on PATH). Add --audio-only to redo just the soundtrack.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FPS = 30;
const W = 1600;   // logical design size; rendered at W*SS, then scaled to 1080p
const H = 900;
const SS = 1.5;   // supersample factor
const AUDIO_ONLY = process.argv.includes('--audio-only'); // reuse the last video render, redo only the sound
const FRAMES_DIR = join(ROOT, '.cache', 'frames');
const OUT_MP4 = join(ROOT, 'media', 'workflow.mp4');
const TEASER_MP4 = join(ROOT, 'media', 'teaser.mp4');

// soundtrack
const SR = 48000;
// Every pair gets its own bar: the key climbs twice (D, E, F sharp) and tempo, drums, bass line,
// transition and melody all change, so no two problems or solutions sound alike.
const KEY_OF = [0, 0, 0, 2, 2, 2, 4, 4, 4];
const TEMPO = [172, 172, 176, 168, 150, 172, 176, 178, 182];
const MINOR = { i: [0, 3, 7, 12], VI: [-4, 0, 3, 8], iv: [-7, -4, 0, 5], V: [-5, -1, 2, 7] };
const MAJOR = { I: [0, 4, 7, 12], ii: [2, 5, 9, 14], IV: [-7, -3, 0, 5], V: [-5, -1, 2, 7], vi: [-3, 0, 4, 9] };
const TENSE_SEQ = ['i', 'VI', 'iv', 'V', 'i', 'VI', 'iv', 'V', 'V'].map((name) => MINOR[name]);
const CALM_SEQ = ['I', 'IV', 'vi', 'I', 'ii', 'IV', 'vi', 'V', 'I', 'IV'].map((name) => MAJOR[name]); // last one is the summary
const _ = null; // a rest
const KICKS = [[0, 4], [0, 3, 6], [0, 4, 7], [0, 2, 4, 6], [0, 5], [0, 3, 4, 7], [0, 4], [0, 3, 6, 7], [0, 2, 4, 6]];
const BASSLINES = [  // semitones above the chord root, one per eighth note
  [0, 0, 0, 0, 0, 0, 0, 0], [0, _, 0, 0, _, 0, 0, _], [0, 0, 12, 0, 0, 12, 0, 7], [0, 12, 0, 12, 0, 12, 0, 12], [0, _, _, 0, _, _, 0, _],
  [0, 0, 7, 7, 5, 5, 7, 7], [0, 12, 7, 12, 0, 12, 7, 12], [0, 0, 0, 3, 0, 0, 7, 5], [0, 7, 12, 7, 0, 7, 12, 15],
];
const TICKS = [      // which chord tone the high pluck plays, one per eighth note
  [_, _, _, _, _, _, 2, _], [3, _, _, 3, _, _, 2, _], [_, 2, _, _, 3, _, _, 1], [3, _, 2, _, 1, _, 2, _], [_, _, _, 3, _, _, _, _],
  [2, _, 3, _, _, 2, _, 3], [3, 2, _, 3, 2, _, 3, _], [_, 3, _, 3, _, 3, 2, 1], [3, 3, _, 2, 3, _, 1, 2],
];
const MELODY = [     // one phrase per solution, in the key, one note per eighth note
  [4, _, 7, _, 9, _, 7, _, 4, _, _], [9, _, 7, _, 4, _, 2, _, 4, _, _], [4, 7, _, 9, _, 12, _, 9, 7, _, _],
  [12, _, 9, _, 7, 9, _, 4, _, 7, _], [2, _, 4, _, 7, _, _, 9, _, 7, _], [7, 9, 12, _, 9, _, 7, _, 4, _, _],
  [4, _, _, 7, 9, _, 12, _, 14, _, _], [14, _, 12, _, 9, _, 7, 9, _, 12, _], [12, 14, 16, _, 14, 12, _, 16, _, 19, _],
  [4, _, 7, _, 9, _, 12, _, 9, _, 7, _, 4, _, 7, _, 12, _, _, _],
];
const ARPS = [[0, 1, 2, 3, 2, 1], [3, 2, 1, 0, 1, 2], [0, 2, 1, 3, 2, 1]];
const hzOf = (semi, octave = 0) => 146.83 * Math.pow(2, semi / 12 + octave); // semitones from D3

// palettes
const INK = '#0a0a0b';      // site black
const CREAM = '#f4f4f5';
const DARK = '#16281f';
const PROB_BG = '#140b0b';  // problem-act charcoal
const BAD_RED = '#ef4444';  // alarm red, problem act only
const ACCENT = '#d97706';   // site amber, readable on light and dark
const EMERALD = '#10b981'; // site gradient start
const AMBER = '#fcd34d';   // site gradient end
const GOOD = '#10b981';

for (const font of ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Georgia Bold.ttf']) {
  try { GlobalFonts.registerFromPath(font); } catch { /* fall back to default sans */ }
}

// Format: one problem, then its solution, across the whole business from first order to last report.
// Each problem shows three messy things; each solution folds them into one.
const PAIRS = [
  { key: 'ORDERS',   problem: 'Orders arrive everywhere.', mess: ['WhatsApp', 'phone call', 'paper slip'], pain: 'And one always gets missed.',
    solution: 'Every order, logged once.', fix: 'one order list', gain: 'from the first message to delivery.' },
  { key: 'STOCK',    problem: 'Stock lives in three places.', mess: ['notebook', 'Excel', 'memory'], pain: 'Nobody knows what is really on the shelf.',
    solution: 'One live stock count.', fix: 'stock, in sync', gain: 'updated with every sale and every purchase.' },
  { key: 'PURCHASE', problem: 'Reordering by guesswork.', mess: ['too much', 'too late', 'wrong item'], pain: 'Cash stuck on the shelf, or an empty one.',
    solution: 'Reorder before you run out.', fix: 'low stock alert', gain: 'purchases tracked against what actually sells.' },
  { key: 'BILLING',  problem: 'Bills typed by hand.', mess: ['type', 'check', 'retype'], pain: 'One wrong HSN code and the return comes back.',
    solution: 'Invoices that check themselves.', fix: 'GST ready', gain: 'GSTIN, HSN and e-invoice details checked as you bill.' },
  { key: 'PAYMENTS', problem: 'Chase, remind, wait.', mess: ['payment pending', 'resend invoice', 'call me back'], pain: 'The owner becomes the clerk.',
    solution: 'Reminders send themselves.', fix: 'paid, thank you', gain: 'follow-ups on schedule, without the awkward calls.' },
  { key: 'PAYROLL',  problem: 'Salaries worked out by hand.', mess: ['attendance', 'advances', 'overtime'], pain: 'Payday turns into a day of arguments.',
    solution: 'Payroll that adds itself up.', fix: 'salaries ready', gain: 'attendance, leave, advances and overtime, counted for you.' },
  { key: 'BOOKS',    problem: 'Month end, a shoebox of bills.', mess: ['paper bills', 'bank statement', 'receipts'], pain: 'All typed in again for the accountant.',
    solution: 'Books that keep themselves.', fix: 'ledgers up to date', gain: 'bills and bank entries flow straight into the books.' },
  { key: 'TAX',      problem: 'Due dates sneak up.', mess: ['GST', 'TDS', 'returns'], pain: 'Late fees, just for being busy.',
    solution: 'Ready for your CA.', fix: 'GSTR-1 exported', gain: 'return data and due dates, prepared ahead.' },
  { key: 'REPORTS',  problem: 'Running the business blind.', mess: ['what sold?', 'who owes?', 'what is left?'], pain: 'The answers are buried in spreadsheets.',
    solution: 'Ask in plain words.', fix: 'What sold best this week?', gain: 'governed AI answers from your own live data.' },
];

// bpm is the marketing: problems run fast, solutions run calm, and the tension rises pair by pair
// flash: white-out at the end of a problem, into its solution
const scenes = [
  { name: 'hook', seconds: 6, draw: drawHook, music: { kind: 'tense', bpm: 172, intensity: 0.6, riser: 1.8 }, cam: { z0: 1.06, z1: 1.0 } },
  ...PAIRS.flatMap((pair, index) => [
    { name: `problem ${pair.key}`, seconds: 3, draw: drawProblem, pair, index, flash: true,
      music: { kind: 'tense', bpm: 172, intensity: 0.65 + index * 0.04, riser: 1.3 }, cam: { z0: 1.0, z1: 1.05 } },
    { name: `solution ${pair.key}`, seconds: 3.5, draw: drawSolution, pair, index,
      music: { kind: 'calm', bpm: 96 }, cam: { z0: 1.04, z1: 1.0 } },
  ]),
  { name: 'chain', seconds: 6, draw: drawChain, music: { kind: 'calm', bpm: 92 }, cam: { z0: 1.0, z1: 1.05 } },
  { name: 'close', seconds: 9, draw: drawClose, music: { kind: 'close', bpm: 108 }, cam: { z0: 1.0, z1: 1.05 } },
];

const totalSeconds = scenes.reduce((sum, s) => sum + s.seconds, 0);   // 79.5s
const totalFrames = totalSeconds * FPS;

// ---------- helpers ----------

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function outBack(t) { const c1 = 1.70158, c3 = c1 + 1; const p = Math.min(1, Math.max(0, t)); return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(t) { return Math.max(0, Math.min(1, t)); }
function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function card(ctx, x, y, w, h, fill = '#ffffff', radius = 14) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function pop(t, delay = 0, dur = 0.35) { return outBack((t - delay) / dur); }
function fadeInOut(t, inFrac = 0.15, outFrac = 0.15) {
  if (t < inFrac) return ease(t / inFrac);
  if (t > 1 - outFrac) return ease((1 - t) / outFrac);
  return 1;
}

// virtual camera: gentle push-in per scene
function applyCamera(ctx, scene, t) {
  const cam = scene.cam || {};
  const e = ease(t);
  const z = lerp(cam.z0 ?? 1.0, cam.z1 ?? 1.05, e);
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -H / 2);
}

// the dot protagonist: travels through every scene
function dot(ctx, x, y, r = 11, color = ACCENT) {
  ctx.fillStyle = withAlpha(color, 0.25);
  ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// film grain + vignette, drawn over everything
function grain(ctx, frameIndex, dark) {
  ctx.save();
  ctx.globalAlpha = dark ? 0.05 : 0.035;
  for (let i = 0; i < 240; i++) {
    const r1 = pseudo(frameIndex * 7919 + i * 17);
    const r2 = pseudo(frameIndex * 104729 + i * 31);
    ctx.fillStyle = r1 > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(r1 * W, r2 * H, 2, 2);
  }
  ctx.restore();
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

function pseudo(x) { return (Math.sin(x) + 1) / 2; } // deterministic 0..1

// problem-act background: slow charcoal swell + white flash at scene end (mirrors the riser)
function suspenseBG(ctx, t, swell = false) {
  ctx.fillStyle = PROB_BG;
  ctx.fillRect(0, 0, W, H);
  if (swell) {
    const w = 0.06 + Math.sin(t * Math.PI) * 0.05;
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
    v.addColorStop(0, withAlpha(BAD_RED, w));
    v.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

// red rubber stamp verdict
function stamp(ctx, x, y, text, scaleP = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(-0.1); ctx.scale(scaleP, scaleP);
  ctx.strokeStyle = BAD_RED; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(-150, -40, 300, 80, 10); ctx.stroke();
  ctx.fillStyle = BAD_RED;
  ctx.font = '700 34px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, 0, 12);
  ctx.restore();
}

// big centre statement
function headline(ctx, text, y, size = 72, color = CREAM, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px Avenir Next, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  ctx.globalAlpha = 1;
}

function subline(ctx, text, y, size = 30, color = withAlpha(CREAM, 0.75), alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Avenir Next, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  ctx.globalAlpha = 1;
}

// ---------- scenes ----------

// hook: closing time, but the paperwork is only starting
function drawHook(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, t > 0.5);
  const drop = ease(clamp01(t * 5));
  dot(ctx, W / 2, lerp(-60, H * 0.26, drop));
  const p = pop(t, 1.0 / S, 0.6);
  if (p > 0) headline(ctx, 'IT’S 9 PM.', H * 0.52, 96, CREAM, Math.min(1, p));
  const p2 = pop(t, 2.2 / S, 0.45);
  if (p2 > 0) subline(ctx, 'The shop is closed. The work is not.', H * 0.64, 34, withAlpha(CREAM, 0.75), Math.min(1, p2));
  const p3 = pop(t, 3.8 / S, 0.4);
  if (p3 > 0) subline(ctx, 'A   D A Y   I N   A   S M A L L   B U S I N E S S', H * 0.76, 24, BAD_RED, Math.min(1, p3) * 0.9);
  grain(ctx, frameIndex, true);
}

// problem: three messy things jitter on a dark stage, with the pain spelled out in red
function drawProblem(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  const { pair, index } = scene;
  suspenseBG(ctx, t, true);
  chip(ctx, `PROBLEM ${index + 1} OF ${PAIRS.length}`, BAD_RED, '#ffffff', clamp01(t * 10));
  headline(ctx, pair.problem, H * 0.25, 64, CREAM, clamp01(t * 6));
  pair.mess.forEach((label, k) => {
    const p = pop(t, (0.35 + k * 0.3) / S, 0.12);
    if (p <= 0) return;
    ctx.save();
    ctx.translate(W / 2 + (k - 1) * 350 + Math.sin(frameIndex * 0.9 + k * 2) * 5, H * 0.48 + Math.cos(frameIndex * 0.7 + k) * 5);
    ctx.rotate((k - 1) * 0.07 + Math.sin(frameIndex * 0.5 + k) * 0.03);
    ctx.scale(p, p);
    card(ctx, -150, -60, 300, 120, '#e4e4e7', 14);
    ctx.fillStyle = BAD_RED; ctx.beginPath(); ctx.arc(126, -36, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK; ctx.font = '700 28px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, 0, 12);
    ctx.restore();
  });
  const p2 = pop(t, 1.5 / S, 0.15);
  if (p2 > 0) subline(ctx, pair.pain, H * 0.71, 32, BAD_RED, Math.min(1, p2));
  chain(ctx, index, false, true);
  grain(ctx, frameIndex, true);
}

// solution: the three messy things fold into one tidy card on a light stage
function drawSolution(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  const { pair, index } = scene;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  chip(ctx, `SOLUTION ${index + 1}`, GOOD, INK, 1);
  headline(ctx, pair.solution, H * 0.25, 64, INK, clamp01(t * 8));
  const fold = ease(clamp01(t / (0.7 / S)));
  if (fold < 1) {
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = 1 - fold;
      card(ctx, W / 2 + (k - 1) * 350 * (1 - fold) - 150, H * 0.48 - 60, 300, 120, '#e4e4e7', 14);
    }
    ctx.globalAlpha = 1;
  }
  const p = pop(t, 0.6 / S, 0.12);
  if (p > 0) {
    ctx.save();
    ctx.translate(W / 2, H * 0.48);
    ctx.scale(p, p);
    card(ctx, -300, -62, 600, 124, INK, 62);
    ctx.fillStyle = GOOD; ctx.beginPath(); ctx.arc(-238, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-253, 1); ctx.lineTo(-242, 13); ctx.lineTo(-222, -12); ctx.stroke(); // tick, drawn: no tofu
    ctx.fillStyle = CREAM; ctx.font = '700 30px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pair.fix, 34, 11);
    ctx.restore();
  }
  const p2 = pop(t, 1.3 / S, 0.15);
  if (p2 > 0) subline(ctx, pair.gain, H * 0.71, 30, withAlpha(INK, 0.7), Math.min(1, p2));
  chain(ctx, index, true, false);
  grain(ctx, frameIndex, false);
}

// summary: the whole chain, lit from the first order to the last report
function drawChain(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p0 = pop(t, 0.3 / S, 0.3);
  if (p0 > 0) headline(ctx, 'End to end. One system.', H * 0.26, 72, INK, Math.min(1, p0));
  const x0 = W * 0.09, x1 = W * 0.91, y = H * 0.52;
  const grow = ease(clamp01((t - 0.9 / S) / (2.6 / S)));
  ctx.strokeStyle = GOOD; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, grow), y); ctx.stroke();
  PAIRS.forEach((pair, i) => {
    const np = pop(t, (0.9 + i * 0.3) / S, 0.1);
    if (np <= 0) return;
    const nx = lerp(x0, x1, i / (PAIRS.length - 1));
    ctx.save(); ctx.translate(nx, y); ctx.scale(np, np);
    card(ctx, -74, -30, 148, 60, INK, 30);
    ctx.fillStyle = CREAM; ctx.font = '700 17px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pair.key, 0, 6);
    ctx.restore();
  });
  dot(ctx, lerp(x0, x1, grow), y - 52, 10);
  const p2 = pop(t, 3.6 / S, 0.2);
  if (p2 > 0) subline(ctx, 'From the first order to the last report.', H * 0.72, 36, ACCENT, Math.min(1, p2));
  const p3 = pop(t, 4.4 / S, 0.2);
  if (p3 > 0) subline(ctx, 'built around how small and medium businesses really work.', H * 0.8, 26, withAlpha(INK, 0.6), Math.min(1, p3));
  grain(ctx, frameIndex, false);
}

// corner chip naming the scene
function chip(ctx, text, fill, ink, alpha) {
  ctx.globalAlpha = alpha;
  card(ctx, 60, 52, 250, 46, fill, 23);
  ctx.fillStyle = ink; ctx.font = '700 20px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, 185, 82);
  ctx.globalAlpha = 1;
}

// progress strip: where this pair sits in the business, and how much is already fixed
function chain(ctx, index, solved, dark) {
  const x0 = W * 0.1, x1 = W * 0.9, y = H * 0.89;
  const ink = dark ? CREAM : INK;
  const done = solved ? index : index - 1;
  ctx.strokeStyle = withAlpha(ink, 0.2); ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  if (done >= 0) {
    ctx.strokeStyle = GOOD;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, done / (PAIRS.length - 1)), y); ctx.stroke();
  }
  PAIRS.forEach((pair, i) => {
    const x = lerp(x0, x1, i / (PAIRS.length - 1));
    const current = i === index;
    ctx.fillStyle = i <= done ? GOOD : current ? BAD_RED : (dark ? '#3a2a2a' : '#d4d4d8');
    ctx.beginPath(); ctx.arc(x, y, current ? 13 : 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = withAlpha(ink, current ? 1 : 0.5);
    ctx.font = `${current ? 700 : 600} 16px Avenir Next, Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(pair.key, x, y + 38);
  });
}

// close: site black, brand mark, then COMING SOON in the site gradient
function drawClose(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  const a = fadeInOut(t, 0.08, 0.04);
  ctx.globalAlpha = a;
  const brand = ctx.createLinearGradient(W / 2 - 440, 0, W / 2 + 440, 0);
  brand.addColorStop(0, EMERALD); brand.addColorStop(0.75, AMBER); brand.addColorStop(1, '#fb923c');
  // brand mark
  const mark = ctx.createLinearGradient(W / 2 - 44, H * 0.1, W / 2 + 44, H * 0.1 + 88);
  mark.addColorStop(0, EMERALD); mark.addColorStop(1, AMBER);
  ctx.fillStyle = mark;
  ctx.beginPath(); ctx.roundRect(W / 2 - 44, H * 0.1, 88, 88, 24); ctx.fill();
  ctx.fillStyle = '#03251a'; ctx.font = 'bold 60px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('k', W / 2, H * 0.1 + 64);
  ctx.fillStyle = CREAM; ctx.font = '800 44px Avenir Next, Arial, sans-serif';
  ctx.fillText('kapkoti solution', W / 2, H * 0.1 + 152);
  subline(ctx, 'We solve everyday business problems.', H * 0.1 + 196, 26, withAlpha(CREAM, 0.8), a);
  // COMING SOON: big, pulsing, in the site gradient
  const cp = pop(t, 2.0 / S, 0.55);
  if (cp > 0) {
    const pulse = 1 + 0.02 * Math.sin(t * Math.PI * 2 * 2.2);
    ctx.save();
    ctx.translate(W / 2, H * 0.6);
    ctx.scale(pulse * cp, pulse * cp);
    ctx.translate(-W / 2, 0);
    ctx.fillStyle = brand;
    ctx.font = '800 132px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('COMING SOON', W / 2, 44);
    ctx.restore();
    // sparkle diamonds orbiting the words (drawn, not glyphs: no tofu)
    for (let i = 0; i < 8; i++) {
      const ang = t * 0.9 + i * Math.PI / 4;
      const sx = W / 2 + Math.cos(ang) * 600;
      const sy = H * 0.6 + Math.sin(ang) * 130;
      const r = 7 + 3 * Math.sin(t * 5 + i * 2);
      ctx.globalAlpha = (0.35 + 0.3 * Math.sin(t * 5 + i * 2)) * cp * a;
      ctx.fillStyle = i % 2 ? AMBER : EMERALD;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 1.6); ctx.lineTo(sx + r, sy); ctx.lineTo(sx, sy + r * 1.6); ctx.lineTo(sx - r, sy);
      ctx.closePath(); ctx.fill();
    }
  }
  subline(ctx, 'ERP \u00b7 e-invoicing \u00b7 accounts \u00b7 data \u00b7 automation \u00b7 governed AI', H * 0.8, 26, withAlpha(CREAM, 0.75), a * clamp01((t - 3.8 / S) / 0.4));
  subline(ctx, 'Tell us what you wish was easier \u00b7 kapkotisolution.com', H * 0.88, 28, AMBER, a * clamp01((t - 4.6 / S) / 0.4));
  ctx.globalAlpha = 1;
  grain(ctx, frameIndex, true);
}

// ---------- render loop ----------

mkdirSync(FRAMES_DIR, { recursive: true });
mkdirSync(dirname(OUT_MP4), { recursive: true });

const SILENT_MP4 = join(ROOT, '.cache', 'video-silent.mp4');
if (!AUDIO_ONLY) {
  console.log(`Rendering ${totalFrames} frames (${totalSeconds}s @ ${FPS}fps, ${W * SS}x${H * SS})…`);
  const canvas = createCanvas(W * SS, H * SS);
  const ctx = canvas.getContext('2d');
  ctx.scale(SS, SS);
  let frame = 0;
  for (const scene of scenes) {
    const count = scene.seconds * FPS;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      ctx.save();
      applyCamera(ctx, scene, t);
      scene.draw(ctx, scene, t, frame);
      ctx.restore();
      if (scene.flash && t > 0.9) {
        ctx.fillStyle = `rgba(244,244,245,${ease((t - 0.9) / 0.1)})`;
        ctx.fillRect(0, 0, W, H);
      }
      writeFileSync(join(FRAMES_DIR, `f${String(frame).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
      frame++;
    }
    console.log(`  ${scene.name} done (${frame}/${totalFrames})`);
  }

  console.log('Encoding video with ffmpeg…');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(FRAMES_DIR, 'f%05d.png'),
    '-vf', `scale=1920:1080:flags=lanczos`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', SILENT_MP4]);

  // teaser: 6-second montage cut from the film's best moments (muted hero loop)
  console.log('Cutting teaser…');
  const TEASER_FRAMES = join(ROOT, '.cache', 'teaser');
  mkdirSync(TEASER_FRAMES, { recursive: true });
  let teaserCount = 0;
  const take = (fromS, toS) => {
    for (let f = Math.round(fromS * FPS); f < Math.round(toS * FPS); f++) {
      const src = join(FRAMES_DIR, `f${String(f).padStart(5, '0')}.png`);
      const dst = join(TEASER_FRAMES, `t${String(teaserCount).padStart(5, '0')}.png`);
      execFileSync('cp', [src, dst]);
      teaserCount++;
    }
  };
  // hook 0 to 6; pair i starts at 6 + 6.5i (problem 3s, solution 3.5s); chain 64.5; close 70.5 (end 79.5)
  take(1.5, 2.7);    // hook: dot lands, title
  take(8.4, 9.6);    // orders: flash into the first solution
  take(26.9, 28.1);  // billing: problem cards
  take(66.5, 67.7);  // chain: end to end
  take(72.9, 74.1);  // close: COMING SOON pop
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(TEASER_FRAMES, 't%05d.png'),
    '-vf', 'scale=1920:1080:flags=lanczos',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', TEASER_MP4]);
}

console.log('Synthesising soundtrack…');
const AUDIO_WAV = join(ROOT, '.cache', 'audio.wav');
synthAudio(AUDIO_WAV, totalSeconds);

console.log('Muxing sound…');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SILENT_MP4, '-i', AUDIO_WAV,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT_MP4]);
console.log(`Wrote ${OUT_MP4}`);

if (!AUDIO_ONLY) {
  // poster: the COMING SOON frame reads best as a still
  const canvas2 = createCanvas(W * SS, H * SS);
  const ctx2 = canvas2.getContext('2d');
  ctx2.scale(SS, SS);
  const closeScene = scenes.find(s => s.name === 'close');
  ctx2.save(); applyCamera(ctx2, closeScene, 0.55); closeScene.draw(ctx2, closeScene, 0.75, 0); ctx2.restore();
  writeFileSync(join(ROOT, '.cache', 'poster.png'), canvas2.toBuffer('image/png'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(ROOT, '.cache', 'poster.png'), '-q:v', '2', join(ROOT, 'media', 'poster.jpg')]);
}

// ---------- soundtrack ----------

// ponytail: every sound is synthesised here; swap for recorded music if the film ever needs studio treatment.
// Shape: a ticking clock and heartbeat for the hook. Each problem runs fast and minor (kick, snare, bass,
// hats, a high pluck); each solution answers in the major with its own phrase of one long tune.
// The key steps up every three pairs and the later fixes keep a pulse, so it builds to the close,
// which rises into a bell on COMING SOON.
// Stereo, with a small room reverb so the sines do not sound dry.

function synthAudio(path, durationSeconds) {
  const n = Math.ceil((durationSeconds + 2) * SR);
  const bus = { left: new Float64Array(n), right: new Float64Array(n), send: new Float64Array(n) };

  let t0 = 0;
  for (const scene of scenes) {
    const m = scene.music;
    const dur = scene.seconds;
    if (scene.name === 'hook') {
      // 9 PM: a clock, a slow heartbeat and one held chord, before anything else starts
      MINOR.i.slice(0, 3).forEach((semi, i) => pad(bus, t0, dur + 0.4, hzOf(semi), 0.045, i - 1));
      for (let at = 0; at < dur - 0.2; at += 0.5) pluck(bus, t0 + at, hzOf(at % 1 ? 7 : 12, 2), 0.04, at % 1 ? 0.4 : -0.4, 0.5);
      for (let at = 0; at < dur - 1; at += 1.5) { kick(bus, t0 + at, 0.3); kick(bus, t0 + at + 0.24, 0.18); }
      riser(bus, t0 + dur - m.riser, m.riser, 0.14);
    } else if (m.kind === 'tense') {
      const i = scene.index;
      const key = KEY_OF[i];
      const chord = TENSE_SEQ[i];
      const step = 30 / TEMPO[i];
      const level = i === 4 ? 0.6 : 0.7 + i * 0.03; // pair five drops back before the last climb
      chord.slice(0, 3).forEach((semi, n) => pad(bus, t0, dur + 0.4, hzOf(semi + key), 0.045, n - 1));
      kick(bus, t0, 0.36);
      for (let k = 0, at = t0; at < t0 + dur - 0.05; k++, at += step) {
        const low = BASSLINES[i][k % 8];
        const high = TICKS[i][k % 8];
        if (low !== _) bass(bus, at, hzOf(chord[0] + low + key, -1), (k % 2 ? 0.08 : 0.12) * level, 0.15);
        if (KICKS[i].includes(k % 8)) kick(bus, at, 0.3 * level);
        if (i >= 2 && k % 8 === 4) snare(bus, at, 0.12 * level);
        if (i >= 1 && i !== 4 && k % 2 === 1) hat(bus, at, 0.035 * level, k % 4 === 1 ? -0.35 : 0.35);
        if (i >= 5) hat(bus, at + step / 2, 0.02 * level, 0.2);
        if (high !== _) pluck(bus, at, hzOf(chord[high] + key, 2), 0.045 * level, 0.5, 0.5);
      }
      // three different ways into the fix, in rotation
      if (i % 3 === 0) riser(bus, t0 + dur - 1.3, 1.3, 0.2 * level);
      else if (i % 3 === 1) roll(bus, t0 + dur - 1.0, 1.0, 0.05 * level);
      else { glide(bus, t0 + dur - 1.2, 1.2, hzOf(chord[0] + key, -1), 0.14 * level); riser(bus, t0 + dur - 0.8, 0.8, 0.1 * level); }
    } else if (m.kind === 'calm') {
      const i = scene.index ?? PAIRS.length; // the summary scene comes after the last pair
      const key = KEY_OF[Math.min(i, PAIRS.length - 1)];
      const chord = CALM_SEQ[i];
      const step = 30 / (92 + i);
      chord.forEach((semi, n) => pad(bus, t0, dur + 0.6, hzOf(semi + key), 0.036, n / 1.5 - 1));
      bass(bus, t0, hzOf(chord[0] + key, -1), 0.13, dur * 0.5);
      if (i % 3 === 0) sub(bus, t0); // only some fixes land with a drop
      // the tune: a new phrase each time, on a different instrument
      MELODY[i].forEach((semi, k) => {
        if (semi === _) return;
        const at = t0 + k * step;
        const hz = hzOf(semi + key, 1);
        if (i % 3 === 0) { pluck(bus, at, hz, 0.08, -0.2, 0.5); pluck(bus, at + step * 1.5, hz, 0.03, 0.5, 0.6); }
        else if (i % 3 === 1) { pluck(bus, at, hz * 2, 0.045, 0.2, 0.5); bell(bus, at, hz * 2, 0.022, -0.3); }
        else { pluck(bus, at, hz, 0.06, -0.3, 0.5); pluck(bus, at, hz * 2, 0.03, 0.3, 0.6); }
      });
      // underneath: rolling arpeggio on even pairs, chord on the beat on odd ones
      for (let k = 0, at = t0; at < t0 + dur - 0.1; k++, at += step) {
        if (i % 2 === 0) pluck(bus, at, hzOf(chord[ARPS[(i / 2) % ARPS.length][k % 6]] + key), 0.04, k % 2 ? 0.5 : -0.5, 0.45);
        else if (k % 2 === 0) chord.slice(0, 3).forEach((semi, n) => pluck(bus, at, hzOf(semi + key), 0.028, n - 1, 0.4));
        if (i >= 5 && k % 4 === 0) kick(bus, at, 0.15);   // later fixes keep a pulse, so the film builds
        if (i >= 7 && k % 2 === 1) hat(bus, at, 0.018, k % 4 === 1 ? -0.3 : 0.3);
      }
    } else {
      // close: hold the home chord, rise into the bell where COMING SOON pops, then let it ring
      const key = KEY_OF[PAIRS.length - 1];
      const hit = t0 + 2.0;
      const step = 30 / m.bpm;
      [0, 7, 12, 16, 19].forEach((semi, i) => pad(bus, t0, dur + 1.2, hzOf(semi + key), 0.036, i / 2 - 1));
      bass(bus, t0, hzOf(key, -1), 0.14, 1.5);
      riser(bus, t0 + 0.3, 1.7, 0.18);
      kick(bus, hit, 0.4);
      sub(bus, hit);
      bass(bus, hit, hzOf(key, -1), 0.16, dur * 0.4);
      bell(bus, hit, hzOf(12 + key, 1), 0.11, -0.2);
      bell(bus, hit + 0.02, hzOf(7 + key, 1), 0.07, 0.3);
      const climb = [0, 4, 7, 12, 16, 12, 7, 4, 2, 7, 9, 14, 16, 12, 9, 7];
      for (let k = 0, at = hit + step; at < t0 + dur - 2.2; k++, at += step) {
        pluck(bus, at, hzOf(climb[k % climb.length] + key, 1), 0.06, k % 2 ? 0.45 : -0.45, 0.5);
      }
      bell(bus, t0 + dur - 2.4, hzOf(12 + key, 1), 0.08, 0);
    }
    t0 += dur;
  }

  // room: the send bus through a small stereo reverb
  const wetLeft = reverb(bus.send, [0.0297, 0.0371, 0.0411, 0.0437]);
  const wetRight = reverb(bus.send, [0.0304, 0.0378, 0.0418, 0.0444]);
  let low = [0, 0];
  let sum = 0;
  const channels = [bus.left, bus.right];
  [wetLeft, wetRight].forEach((wet, c) => {
    for (let i = 0; i < n; i++) {
      const v = channels[c][i] + wet[i] * 0.3;
      low[c] += (v - low[c]) * 0.004;  // one-pole high-pass at about 30 Hz: no rumble, no DC
      channels[c][i] = v - low[c];
      sum += channels[c][i] * channels[c][i];
    }
  });

  // master: one level for the whole film, a soft knee instead of clipping, fades at both ends
  const gain = 0.092 / Math.sqrt(sum / (2 * n));
  const end = Math.round(durationSeconds * SR);
  const pcm = Buffer.alloc(end * 4);
  for (let i = 0; i < end; i++) {
    const fade = Math.min(1, i / (0.25 * SR), (end - 1 - i) / (1.5 * SR));
    channels.forEach((channel, c) => {
      const v = channel[i] * gain * fade;
      const a = Math.abs(v);
      const soft = a < 0.7 ? v : Math.sign(v) * (0.7 + 0.28 * Math.tanh((a - 0.7) / 0.28));
      pcm.writeInt16LE(Math.round(soft * 32767), i * 4 + c * 2);
    });
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 4, 28);
  header.writeUInt16LE(4, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.concat([header, pcm]));
}

// Adds one mono sound to the stereo mix and the reverb send.
// 3 ms ramps at both ends so no event starts or stops on a click.
function mix(bus, start, out, pan = 0, send = 0.25) {
  const s = Math.round(start * SR);
  if (s < 0) return;
  const edge = Math.min(144, out.length >> 1);
  const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
  const l = Math.cos(angle) * Math.SQRT2;
  const r = Math.sin(angle) * Math.SQRT2;
  for (let i = 0; i < out.length && s + i < bus.left.length; i++) {
    const v = out[i] * Math.min(1, i / edge, (out.length - 1 - i) / edge);
    bus.left[s + i] += v * l;
    bus.right[s + i] += v * r;
    bus.send[s + i] += v * send;
  }
}

// deterministic white noise: pseudo() turns tonal and gritty at audio rate
// (seed lives on the function: synthAudio runs before module-level lets below it initialise)
function noise() { noise.seed = ((noise.seed ?? 1) * 1664525 + 1013904223) >>> 0; return noise.seed / 2147483648 - 1; }

// four damped comb filters into two all-pass stages: a small, soft room
function reverb(input, delays) {
  const out = new Float64Array(input.length);
  for (const seconds of delays) {
    const line = new Float64Array(Math.round(seconds * SR));
    let at = 0;
    let damp = 0;
    for (let i = 0; i < input.length; i++) {
      const y = line[at];
      damp += (y - damp) * 0.55;
      line[at] = input[i] + damp * 0.8;
      out[i] += y * 0.25;
      at = (at + 1) % line.length;
    }
  }
  for (const seconds of [0.005, 0.0017]) {
    const line = new Float64Array(Math.round(seconds * SR));
    let at = 0;
    for (let i = 0; i < out.length; i++) {
      const y = line[at];
      line[at] = out[i] + y * 0.5;
      out[i] = y - out[i];
      at = (at + 1) % line.length;
    }
  }
  return out;
}

// warm sustained note: three soft harmonics, slow swell, gentle tremolo
function pad(bus, start, dur, hz, amp, pan = 0) {
  const len = Math.round(dur * SR);
  const out = new Float64Array(len);
  const attack = Math.min(0.9, dur * 0.3) * SR;
  const release = Math.min(1.4, dur * 0.35) * SR;
  const tune = hz * (1 + pan * 0.002); // left and right sit a hair apart, which reads as width
  for (let i = 0; i < len; i++) {
    const w = 2 * Math.PI * tune * i / SR;
    const env = Math.min(1, i / attack, (len - i) / release);
    out[i] = (Math.sin(w) + 0.3 * Math.sin(2 * w) + 0.1 * Math.sin(3 * w)) * env * env * amp * (1 + 0.08 * Math.sin(2 * Math.PI * 0.25 * i / SR));
  }
  mix(bus, start, out, pan * 0.7, 0.35);
}

// round bass note: short and muted in the evening, long in the morning
function bass(bus, start, hz, amp, decay) {
  const len = Math.round(Math.min(6, decay * 5) * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const w = 2 * Math.PI * hz * i / SR;
    out[i] = (Math.sin(w) + 0.3 * Math.sin(2 * w)) * Math.min(1, i / (0.008 * SR)) * Math.exp(-i / (decay * SR)) * amp;
  }
  mix(bus, start, out, 0, 0.05);
}

// kick drum: a sine that drops from 120 Hz to 45 Hz
function kick(bus, start, amp) {
  const len = Math.round(0.4 * SR);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    phase += 2 * Math.PI * (45 + 75 * Math.exp(-t / 0.03)) / SR;
    out[i] = Math.sin(phase) * Math.exp(-t / 0.11) * amp;
  }
  mix(bus, start, out, 0, 0.04);
}

// snare: a short tone with a burst of noise on top
function snare(bus, start, amp) {
  const len = Math.round(0.16 * SR);
  const out = new Float64Array(len);
  let low = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const x = noise();
    low += (x - low) * 0.45;
    out[i] = (low * Math.exp(-t / 0.045) + 0.5 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.03)) * amp;
  }
  mix(bus, start, out, 0.1, 0.2);
}

// hat roll: hits that get closer together and louder into the cut
function roll(bus, start, dur, amp) {
  for (let at = 0, gap = 0.11; at < dur; at += gap, gap = Math.max(0.035, gap * 0.9)) {
    hat(bus, start + at, amp * (0.3 + 0.7 * at / dur), at % 0.2 > 0.1 ? 0.3 : -0.3);
  }
}

// glide: a bass note that slides up an octave into the cut
function glide(bus, start, dur, hz, amp) {
  const len = Math.round(dur * SR);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    phase += 2 * Math.PI * hz * Math.pow(2, p) / SR;
    out[i] = (Math.sin(phase) + 0.3 * Math.sin(2 * phase)) * p * amp * Math.min(1, (1 - p) / 0.05);
  }
  mix(bus, start, out, 0, 0.15);
}

// closed hi-hat: a short burst of high-passed noise
function hat(bus, start, amp, pan) {
  const len = Math.round(0.06 * SR);
  const out = new Float64Array(len);
  let low = 0;
  for (let i = 0; i < len; i++) {
    const x = noise();
    low += (x - low) * 0.3;
    out[i] = (x - low) * Math.exp(-i / (0.012 * SR)) * amp;
  }
  mix(bus, start, out, pan, 0.15);
}

// marimba-like pluck: higher harmonics die away faster
function pluck(bus, start, hz, amp, pan, send) {
  const len = Math.round(1.4 * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 1; k <= 4; k++) v += Math.sin(2 * Math.PI * hz * k * t) * Math.exp(-t * k / 0.45) / Math.pow(k, 1.6);
    out[i] = v * Math.min(1, i / (0.003 * SR)) * amp;
  }
  mix(bus, start, out, pan, send);
}

// bell: inharmonic partials with a long tail
function bell(bus, start, hz, amp, pan) {
  const len = Math.round(4.5 * SR);
  const out = new Float64Array(len);
  const partials = [[1, 1, 1.6], [2.76, 0.4, 1.0], [5.4, 0.2, 0.5], [8.93, 0.1, 0.3]];
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    let v = 0;
    for (const [ratio, level, tail] of partials) v += Math.sin(2 * Math.PI * hz * ratio * t) * level * Math.exp(-t / tail);
    out[i] = v * amp;
  }
  mix(bus, start, out, pan, 0.6);
}

// riser: noise whose low-pass opens as it climbs, with a quick fade instead of a hard cut
function riser(bus, start, dur, amp) {
  const len = Math.round(dur * SR);
  const out = new Float64Array(len);
  let smooth = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    smooth += (noise() - smooth) * (0.02 + 0.09 * p * p);
    out[i] = smooth * p * p * 4 * amp * Math.min(1, (1 - p) / 0.04);
  }
  mix(bus, start, out, 0, 0.3);
}

// sub-drop for the flash and the final hit
function sub(bus, start) {
  const len = Math.round(1.4 * SR);
  const out = new Float64Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    phase += 2 * Math.PI * lerp(56, 34, p) / SR;
    out[i] = Math.sin(phase) * Math.exp(-3 * p) * 0.36;
  }
  mix(bus, start, out, 0, 0.1);
}
