// Renders the Kapkoti Solution homepage film frame by frame and encodes it with ffmpeg.
// Every frame is drawn in code: no stock footage, no video editor.
// Structure: problem act (high BPM, suspense, rising curve) -> silence -> sub-drop ->
// solution act (low BPM, calm) -> exciting build into "COMING SOON". Single window, text-driven.
// Story follows the homepage: a small business owner's evening, then the solutions the site lists.
// Usage: pnpm video  (needs ffmpeg on PATH)
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
const FRAMES_DIR = join(ROOT, '.cache', 'frames');
const OUT_MP4 = join(ROOT, 'media', 'workflow.mp4');
const TEASER_MP4 = join(ROOT, 'media', 'teaser.mp4');

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

// bpm is the marketing: problems run fast, solutions run calm, and the curve keeps changing
const MUSIC = {
  hook:    { kind: 'tense', bpm: 176, intensity: 0.60, riser: 1.8 },
  billing: { kind: 'tense', bpm: 170, intensity: 0.75, riser: 2.0 },
  stock:   { kind: 'tense', bpm: 168, intensity: 0.85, riser: 2.2 },
  chase:   { kind: 'tense', bpm: 178, intensity: 0.95, riser: 2.6 },
  turn:    { kind: 'turn',  riser: 4.2 },
  reveal:  { kind: 'calm',  bpm: 92,  intensity: 0.50 },
  invoice: { kind: 'calm',  bpm: 94,  intensity: 0.55 },
  data:    { kind: 'calm',  bpm: 96,  intensity: 0.60 },
  flow:    { kind: 'calm',  bpm: 92,  intensity: 0.60 },
  build:   { kind: 'calm',  bpm: 90,  intensity: 0.55 },
  close:   { kind: 'close', bpm: 108, intensity: 0.70, riser: 3.0 },
};

const CAM = {
  hook:    { z0: 1.06, z1: 1.0 },
  billing: { z0: 1.0,  z1: 1.06 },
  stock:   { z0: 1.05, z1: 1.0 },
  chase:   { z0: 1.0,  z1: 1.07 },
  turn:    { z0: 1.08, z1: 1.0 },
  reveal:  { z0: 1.0,  z1: 1.05 },
  invoice: { z0: 1.04, z1: 1.0 },
  data:    { z0: 1.0,  z1: 1.05 },
  flow:    { z0: 1.04, z1: 1.0 },
  build:   { z0: 1.0,  z1: 1.06 },
  close:   { z0: 1.0,  z1: 1.05 },
};

const scenes = [
  { name: 'hook',    seconds: 6, draw: drawHook },
  { name: 'billing', seconds: 7, draw: drawBilling },
  { name: 'stock',   seconds: 7, draw: drawStock },
  { name: 'chase',   seconds: 7, draw: drawChase },
  { name: 'turn',    seconds: 5, draw: drawTurn },
  { name: 'reveal',  seconds: 5, draw: drawReveal },
  { name: 'invoice', seconds: 7, draw: drawInvoice },
  { name: 'data',    seconds: 7, draw: drawData },
  { name: 'flow',    seconds: 7, draw: drawFlow },
  { name: 'build',   seconds: 8, draw: drawBuild },
  { name: 'close',   seconds: 9, draw: drawClose },
].map(s => ({ ...s, music: MUSIC[s.name], cam: CAM[s.name] }));

const totalSeconds = scenes.reduce((sum, s) => sum + s.seconds, 0);   // 75s
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

// billing: TYPE > CHECK > RETYPE > FILE, then the GST mismatch stamp
function drawBilling(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  headline(ctx, 'bills, typed by hand.', H * 0.2, 50, withAlpha(CREAM, 0.85), clamp01((t - 0.3 / S) / 0.3));
  const steps = ['TYPE.', 'CHECK.', 'RETYPE.', 'FILE.'];
  steps.forEach((s, i) => {
    const p = pop(t, (1.2 + i * 0.85) / S, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = i === 3 ? BAD_RED : CREAM;
    ctx.font = '800 58px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(s, W * 0.5 + (i - 1.5) * 340, H * 0.38);
    ctx.globalAlpha = 1;
  });
  const sp = pop(t, 4.3 / S, 0.35);
  if (sp > 0) {
    ctx.globalAlpha = Math.min(1, sp);
    card(ctx, W * 0.5 - 380, H * 0.5, 760, 82, '#e4e4e7', 12);
    ctx.fillStyle = INK; ctx.font = '600 26px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('one wrong HSN code and the return comes back', W / 2, H * 0.5 + 51);
    ctx.globalAlpha = 1;
    stamp(ctx, W * 0.5, H * 0.5 + 142, 'GST MISMATCH', Math.min(1, sp));
  }
  const st = pop(t, 5.6 / S, 0.4);
  if (st > 0) subline(ctx, 'The return bounces. The evening is gone.', H * 0.86, 30, BAD_RED, Math.min(1, st));
  grain(ctx, frameIndex, true);
}

// stock: the same numbers kept in three places that never agree
function drawStock(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  const p1 = pop(t, 0.4 / S, 0.45);
  if (p1 > 0) headline(ctx, 'stock, kept in three places.', H * 0.18, 50, CREAM, Math.min(1, p1));
  const places = ['NOTEBOOK', 'EXCEL', 'WHATSAPP'];
  places.forEach((place, i) => {
    const p = pop(t, (1.1 + i * 0.8) / S, 0.35);
    if (p <= 0) return;
    const x = W * 0.5 - 490 + i * 340, y = H * 0.3;
    ctx.globalAlpha = Math.min(1, p);
    card(ctx, x, y, 300, 250, '#e4e4e7', 12);
    ctx.fillStyle = INK; ctx.font = '700 26px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(place, x + 24, y + 44);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = withAlpha(INK, 0.3);
      ctx.fillRect(x + 24, y + 70 + k * 32, 240, 10);
    }
    // someone typing: row highlights flicker
    if (t > (1.5 + i * 0.8) / S && pseudo(frameIndex * 3.1 + i) > 0.4) {
      ctx.fillStyle = withAlpha(BAD_RED, 0.55);
      ctx.fillRect(x + 24 + pseudo(frameIndex + i) * 200, y + 70 + (frameIndex % 5) * 32, 26, 10);
    }
    ctx.globalAlpha = 1;
  });
  const sp = pop(t, 4.2 / S, 0.35);
  if (sp > 0) stamp(ctx, W * 0.5, H * 0.7, 'NO MATCH', Math.min(1, sp));
  const p2 = pop(t, 5.5 / S, 0.45);
  if (p2 > 0) subline(ctx, 'Nobody knows what is really on the shelf.', H * 0.86, 30, BAD_RED, Math.min(1, p2));
  grain(ctx, frameIndex, true);
}

// chase: payments and orders followed up by hand, one message at a time
function drawChase(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  const p1 = pop(t, 0.4 / S, 0.45);
  if (p1 > 0) headline(ctx, 'chase, remind, wait.', H * 0.2, 62, CREAM, Math.min(1, p1));
  // buzzing phone right
  ctx.save();
  const shake = t > 0.2 ? Math.sin(t * 40) * 2 : 0;
  ctx.translate(W * 0.74 + shake, H * 0.54);
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.roundRect(-70, -150, 140, 300, 24); ctx.fill();
  ctx.fillStyle = PROB_BG; ctx.beginPath(); ctx.roundRect(-56, -124, 112, 248, 14); ctx.fill();
  const msgs = ['payment pending', 'resend the invoice', 'which order was it?', 'call me back'];
  msgs.forEach((msg, i) => {
    const p = pop(t, (1.4 + i * 0.8) / S, 0.3);
    if (p <= 0) return;
    ctx.fillStyle = BAD_RED;
    ctx.beginPath(); ctx.roundRect(60, -100 + i * 56, 210, 44, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 17px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(msg, 165, -72 + i * 56);
  });
  ctx.restore();
  ['reminder #1', 'reminder #4', 'reminder #9'].forEach((m, i) => {
    const p = pop(t, (1.8 + i * 0.9) / S, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p) * 0.9;
    ctx.fillStyle = CREAM; ctx.font = '700 32px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(m, W * 0.16, H * 0.42 + i * 70);
    ctx.globalAlpha = 1;
  });
  const p2 = pop(t, 5.4 / S, 0.45);
  if (p2 > 0) subline(ctx, 'The owner becomes the clerk.', H * 0.86, 32, BAD_RED, Math.min(1, p2));
  grain(ctx, frameIndex, true);
}

// the turn: heartbeat slows, near silence, then the white flash
function drawTurn(ctx, scene, t, frameIndex) {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  // three slow heartbeats
  const beatT = [0.12, 0.42, 0.72];
  beatT.forEach((b) => {
    const hb = Math.max(0, 1 - Math.abs(t - b) * 6);
    if (hb > 0) {
      const v = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.7);
      v.addColorStop(0, withAlpha(BAD_RED, 0.10 * hb));
      v.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      dot(ctx, W / 2, H * 0.42, 11 + hb * 5);
    }
  });
  const a = clamp01((t - 0.3) / 0.5);
  headline(ctx, 'The problem was never effort.', H * 0.62, 46, withAlpha(CREAM, 0.9), a);
  // final 18%: hard flash to white
  if (t > 0.82) {
    ctx.fillStyle = `rgba(244,244,245,${ease((t - 0.82) / 0.18)})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, frameIndex, true);
}

// reveal: light world, the day's work joins up into one line
function drawReveal(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.4 / S, 0.4);
  if (p1 > 0) headline(ctx, 'One place for the day’s work…', H * 0.24, 52, INK, Math.min(1, p1));
  // line grows left to right, nodes pop
  const nodes = ['ORDER', 'INVOICE', 'STOCK', 'BOOKS'];
  const nodesP = pop(t, 1.0 / S, 0.5);
  if (nodesP > 0) {
    const x0 = W * 0.18, x1 = W * 0.82, y = H * 0.5;
    const grow = ease(clamp01((t - 1.0 / S) / 0.5));
    const line = ctx.createLinearGradient(x0, 0, x1, 0);
    line.addColorStop(0, EMERALD); line.addColorStop(1, AMBER);
    ctx.strokeStyle = line; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, grow), y); ctx.stroke();
    ['MORNING', 'CLOSE'].forEach((w, i) => {
      ctx.fillStyle = withAlpha(INK, 0.55);
      ctx.font = '700 24px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(w, i === 0 ? x0 : x1, y + 60);
    });
    nodes.forEach((n, i) => {
      const np = pop(t, (1.4 + i * 0.5) / S, 0.3);
      if (np <= 0) return;
      const nx = lerp(x0, x1, (i + 0.5) / 4);
      ctx.globalAlpha = Math.min(1, np);
      card(ctx, nx - 78, y - 34, 156, 68, INK, 34);
      ctx.fillStyle = CREAM; ctx.font = '700 19px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(n, nx, y + 7);
      ctx.globalAlpha = 1;
    });
    dot(ctx, lerp(x0, x1, clamp01((t - 1.3 / S) / 0.55)), y, 10);
  }
  const p2 = pop(t, 3.6 / S, 0.45);
  if (p2 > 0) subline(ctx, '…is what Kapkoti Solution builds.', H * 0.76, 36, ACCENT, Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// invoice: billed from a phone, checked before it reaches the portal
function drawInvoice(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'Invoices that check themselves.', H * 0.18, 50, INK, Math.min(1, p1));
  // phone slides up from bottom right
  const up = ease(clamp01((t - 0.6 / S) / 0.4));
  ctx.save();
  ctx.translate(W * 0.72, lerp(H + 260, H * 0.58, up));
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-110, -200, 220, 400, 34); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-94, -170, 188, 340, 20); ctx.fill();
  card(ctx, -75, -150, 150, 46, INK, 23);
  ctx.fillStyle = CREAM; ctx.font = '600 16px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Tax invoice', 0, -121);
  // invoice rows
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = withAlpha(INK, 0.14); ctx.beginPath(); ctx.roundRect(-75, -84 + k * 22, 150 - k * 28, 10, 5); ctx.fill();
  }
  // checking progress
  const prog = clamp01((t - 1.6 / S) / (2.2 / S));
  ctx.fillStyle = withAlpha(INK, 0.15); ctx.beginPath(); ctx.roundRect(-75, 2, 150, 16, 8); ctx.fill();
  ctx.fillStyle = GOOD; ctx.beginPath(); ctx.roundRect(-75, 2, 150 * prog, 16, 8); ctx.fill();
  ctx.fillStyle = INK; ctx.font = '600 19px Avenir Next, Arial, sans-serif';
  ctx.fillText(`${Math.round(prog * 100)}% checked`, 0, 50);
  const rp = pop(t, 4.2 / S, 0.3);
  if (rp > 0) {
    ctx.globalAlpha = Math.min(1, rp);
    card(ctx, -75, 76, 150, 44, GOOD, 22);
    ctx.fillStyle = INK; ctx.font = '700 16px Avenir Next, Arial, sans-serif';
    ctx.fillText('GST ready', 0, 104);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // copy left
  const lines = [
    { text: 'Billed from your phone,', y: 0, delay: 1.4, big: true },
    { text: 'right the first time.', y: 46, delay: 1.4, big: true },
    { text: 'GSTIN and HSN checked as you type', y: 130, delay: 2.8 },
    { text: 'e-invoice and e-way bill details together', y: 186, delay: 3.6 },
    { text: 'GSTR-1 export ready for your CA', y: 242, delay: 4.4 },
  ];
  lines.forEach((line) => {
    const p = pop(t, line.delay / S, 0.4);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.textAlign = 'left';
    if (line.big) {
      ctx.fillStyle = INK; ctx.font = '700 38px Avenir Next, Arial, sans-serif';
      ctx.fillText(line.text, W * 0.09, H * 0.42 + line.y);
    } else {
      dot(ctx, W * 0.09 + 8, H * 0.42 + line.y - 8, 6, GOOD);
      ctx.fillStyle = withAlpha(INK, 0.7); ctx.font = '600 26px Avenir Next, Arial, sans-serif';
      ctx.fillText(line.text, W * 0.09 + 34, H * 0.42 + line.y);
    }
    ctx.globalAlpha = 1;
  });
  grain(ctx, frameIndex, false);
}

// data: a plain question typed in, an answer drawn back, with governed access
function drawData(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'Ask your data. In plain words.', H * 0.18, 50, INK, Math.min(1, p1));
  const left = W * 0.5 - 400;
  // question box, typed one letter at a time
  card(ctx, left, H * 0.27, 800, 84, '#ffffff', 16);
  const question = 'What sold best this week?';
  const typed = question.slice(0, Math.round(question.length * clamp01((t - 0.9 / S) / (1.6 / S))));
  ctx.fillStyle = INK; ctx.font = '600 30px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(typed, left + 30, H * 0.27 + 53);
  if (typed.length < question.length && frameIndex % 20 < 10) {
    ctx.fillRect(left + 34 + ctx.measureText(typed).width, H * 0.27 + 26, 3, 34);
  }
  // answer bars grow in
  const rows = [['Rice 25 kg', 1], ['Cooking oil', 0.76], ['Tea', 0.52], ['Sugar', 0.38]];
  rows.forEach(([label, share], i) => {
    const p = clamp01((t - (2.9 + i * 0.35) / S) / (0.9 / S));
    if (p <= 0) return;
    const y = H * 0.45 + i * 62;
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.fillStyle = withAlpha(INK, 0.75); ctx.font = '600 24px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(label, left, y + 22);
    const bar = ctx.createLinearGradient(left + 200, 0, left + 800, 0);
    bar.addColorStop(0, EMERALD); bar.addColorStop(1, AMBER);
    ctx.fillStyle = bar;
    ctx.beginPath(); ctx.roundRect(left + 200, y, 600 * share * ease(p), 30, 8); ctx.fill();
    ctx.globalAlpha = 1;
  });
  const p2 = pop(t, 5.4 / S, 0.4);
  if (p2 > 0) subline(ctx, 'Governed AI: only the access it needs, and a trail you can check.', H * 0.86, 28, ACCENT, Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// flow: the repetitive steps run on their own, people keep the decisions
function drawFlow(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'The repetitive part runs by itself.', H * 0.18, 50, INK, Math.min(1, p1));
  const cardsArr = [['ORDER IN', 'logged once'], ['INVOICE', 'sent, GST ready'], ['REMINDER', 'scheduled']];
  cardsArr.forEach(([h, s], i) => {
    const p = pop(t, (1.1 + i * 0.8) / S, 0.35);
    if (p <= 0) return;
    const x = W * 0.5 - 425 + i * 300, y = H * 0.36;
    ctx.globalAlpha = Math.min(1, p);
    card(ctx, x, y, 250, 150, i === 2 ? INK : '#ffffff', 14);
    ctx.fillStyle = i === 2 ? CREAM : INK;
    ctx.font = '700 26px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(h, x + 24, y + 56);
    ctx.font = '500 19px Avenir Next, Arial, sans-serif';
    ctx.fillStyle = i === 2 ? withAlpha(CREAM, 0.8) : withAlpha(INK, 0.65);
    ctx.fillText(s, x + 24, y + 92);
    ctx.globalAlpha = 1;
    if (i < 2) dot(ctx, x + 275, y + 75, 8, GOOD);
  });
  const ep = pop(t, 4.0 / S, 0.35);
  if (ep > 0) {
    ctx.globalAlpha = Math.min(1, ep);
    const chip = ctx.createLinearGradient(W * 0.5 - 230, 0, W * 0.5 + 230, 0);
    chip.addColorStop(0, EMERALD); chip.addColorStop(1, AMBER);
    card(ctx, W * 0.5 - 230, H * 0.63, 460, 60, chip, 30);
    ctx.fillStyle = INK; ctx.font = '700 22px Avenir Next, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('AI helps. You decide.', W / 2, H * 0.63 + 38);
    ctx.globalAlpha = 1;
  }
  const p2 = pop(t, 5.3 / S, 0.4);
  if (p2 > 0) subline(ctx, 'no copy and paste, no chasing, no month-end surprises.', H * 0.84, 28, withAlpha(INK, 0.65), Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// build: the solutions listed on the homepage, calm and plain
function drawBuild(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p0 = pop(t, 0.3 / S, 0.4);
  if (p0 > 0) headline(ctx, 'What we build.', H * 0.18, 62, INK, Math.min(1, p0));
  const rows = [
    ['ERP & inventory', 'one system for the business'],
    ['E-invoicing & GST', 'right the first time'],
    ['Accounts & CA', 'less typing, cleaner books'],
    ['Data & governed AI', 'answers you can check'],
  ];
  rows.forEach(([big, small], i) => {
    const p = pop(t, (1.1 + i * 1.0) / S, 0.4);
    if (p <= 0) return;
    const y = H * 0.36 + i * 100;
    ctx.globalAlpha = Math.min(1, p);
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = '800 44px Avenir Next, Arial, sans-serif';
    ctx.fillText(big, W * 0.16, y);
    ctx.fillStyle = ACCENT;
    ctx.font = '600 30px Avenir Next, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(small, W * 0.84, y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = withAlpha(INK, 0.25); ctx.fillRect(W * 0.16, y + 22, W * 0.68, 1);
  });
  const p2 = pop(t, 5.8 / S, 0.4);
  if (p2 > 0) subline(ctx, 'built around how small and medium businesses really work.', H * 0.88, 26, withAlpha(INK, 0.6), Math.min(1, p2));
  grain(ctx, frameIndex, false);
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
    writeFileSync(join(FRAMES_DIR, `f${String(frame).padStart(5, '0')}.png`), canvas.toBuffer('image/png'));
    frame++;
  }
  console.log(`  ${scene.name} done (${frame}/${totalFrames})`);
}

console.log('Encoding video with ffmpeg…');
const SILENT_MP4 = join(ROOT, '.cache', 'video-silent.mp4');
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
// scene starts: hook 0, billing 6, stock 13, chase 20, turn 27, reveal 32,
//               invoice 37, data 44, flow 51, build 58, close 66 (end 75)
take(1.5, 2.7);    // hook: dot lands, title
take(10.4, 11.6);  // billing: the mismatch stamp
take(31.4, 32.6);  // turn: white flash
take(47.4, 48.6);  // data: answer bars grow
take(69.4, 70.6);  // close: COMING SOON pop
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(TEASER_FRAMES, 't%05d.png'),
  '-vf', 'scale=1920:1080:flags=lanczos',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow', '-movflags', '+faststart', TEASER_MP4]);

console.log('Synthesising soundtrack…');
const AUDIO_WAV = join(ROOT, '.cache', 'audio.wav');
synthAudio(AUDIO_WAV, totalSeconds);

console.log('Muxing sound…');
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SILENT_MP4, '-i', AUDIO_WAV,
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT_MP4]);
console.log(`Wrote ${OUT_MP4}`);

// poster: the COMING SOON frame reads best as a still
const canvas2 = createCanvas(W * SS, H * SS);
const ctx2 = canvas2.getContext('2d');
ctx2.scale(SS, SS);
const closeScene = scenes.find(s => s.name === 'close');
ctx2.save(); applyCamera(ctx2, closeScene, 0.55); closeScene.draw(ctx2, closeScene, 0.75, 0); ctx2.restore();
writeFileSync(join(ROOT, '.cache', 'poster.png'), canvas2.toBuffer('image/png'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(ROOT, '.cache', 'poster.png'), '-q:v', '2', join(ROOT, 'media', 'poster.jpg')]);

// ---------- soundtrack ----------

// ponytail: single-pass additive synthesis; swap if the film ever needs studio treatment.
// Curve: every scene carries its own BPM and tension, so hits land exactly on scene boundaries.
// Problems = high BPM + ticks + risers. Turn = riser, silence, sub-drop. Calm = slow pads.
// Close = exciting build back up into a final bell.
function synthAudio(path, durationSeconds) {
  const SR = 44100;
  const n = Math.ceil((durationSeconds + 2) * SR);
  const buf = new Float64Array(n);

  const chords = {
    tense: [[0, 3, 7], [-2, 2, 5], [0, 3, 7, 10], [-2, 2, 5, 9], [0, 3, 7]],
    calm: [[0, 4, 9, 14], [5, 9, 12], [0, 4, 7, 14], [-2, 4, 9]],
    build: [[0, 4, 7], [5, 9, 12], [9, 12, 16]],
  };
  const rootHz = (semi) => 146.83 * Math.pow(2, semi / 12);
  const pulseHz = (semi) => 73.42 * Math.pow(2, semi / 12);

  let t0 = 0;
  scenes.forEach((scene, si) => {
    const m = scene.music;
    const dur = scene.seconds;
    if (m.kind !== 'turn') {
      const chord = (m.kind === 'calm' ? chords.calm : chords.tense)[si % (m.kind === 'calm' ? chords.calm.length : chords.tense.length)];
      const padAmp = m.kind === 'calm' ? 0.035 : 0.05;
      for (const semi of chord) {
        addPad(buf, SR, t0, dur + 0.5, rootHz(semi), padAmp);
        addPad(buf, SR, t0, dur + 0.6, rootHz(semi) * 2.002, padAmp * 0.5);
      }
      const beat = 60 / m.bpm;
      if (m.kind === 'tense') {
        // driving 8th-note pulse, accents on the beat; curve changes with this scene's bpm
        for (let p = t0; p < t0 + dur; p += beat / 2) {
          const isBeat = Math.abs((p - t0) / beat - Math.round((p - t0) / beat)) < 0.01;
          addPulse(buf, SR, p, pulseHz(chord[0]), (isBeat ? 0.15 : 0.08) * m.intensity);
        }
        // suspense offbeat ticks
        for (let p = t0 + beat / 4; p < t0 + dur; p += beat / 2) addTick(buf, SR, p, 0.05 * m.intensity);
        // riser into the next scene's downbeat
        addRiser(buf, SR, t0 + dur - m.riser, m.riser);
        // impact on this scene's first downbeat (except the very first scene)
        if (si > 0) addWhump(buf, SR, t0, dur);
      } else if (m.kind === 'calm') {
        // slow quarter-note pluck arp on major harmony
        const notes = [0, 7, 4, 9];
        for (let p = t0, k = 0; p < t0 + dur; p += beat, k++) {
          addPluck(buf, SR, p, rootHz(chord[k % chord.length] + 12), 0.03);
        }
      }
    } else {
      // the turn: riser climbs, then air, then the sub-drop on the flash
      addRiser(buf, SR, t0, m.riser);
      addSub(buf, SR, t0 + m.riser + 0.35, dur);
    }
    t0 += dur;
  });

  // final bell inside the close
  let closeStart = 0;
  for (const s of scenes) { if (s.name === 'close') break; closeStart += s.seconds; }
  addBell(buf, SR, closeStart + 4.2, rootHz(24), 0.09);
  addRiser(buf, SR, closeStart + 1.0, 3.0); // build into the bell

  mkdirSync(join(ROOT, '.cache'), { recursive: true });
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1;   // linear headroom, no saturation
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const v = buf[i] * g;
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

// 3 ms ramps at both ends so no event starts or stops on a click
function mixRaw(buf, startSample, out, gain = 1) {
  const edge = Math.min(132, out.length >> 1);
  for (let i = 0; i < out.length; i++) {
    const idx = startSample + i;
    if (idx >= buf.length) break;
    buf[idx] += out[i] * gain * Math.min(1, i / edge, (out.length - 1 - i) / edge);
  }
}

// deterministic white noise: pseudo() turns tonal and gritty at audio rate
// (seed lives on the function: synthAudio runs before module-level lets below it initialise)
function noise() { noise.seed = ((noise.seed ?? 1) * 1664525 + 1013904223) >>> 0; return noise.seed / 2147483648 - 1; }

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
  if (s < 0) return;
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = Math.sin(2 * Math.PI * hz * i / SR) * Math.exp(-16 * i / len) * amp;
  }
  mixRaw(buf, s, out);
}

function addPluck(buf, SR, start, hz, amp) {
  const dur = 0.8, len = Math.round(dur * SR), s = Math.round(start * SR);
  if (s < 0) return;
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
    smooth = smooth * 0.7 + noise() * 0.3;
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

// suspense riser: noise that grows and brightens, ends on the next downbeat
function addRiser(buf, SR, start, dur) {
  if (start < 0) return;
  const len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  let smooth = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    smooth += (noise() - smooth) * (0.02 + 0.1 * p * p); // low-pass opens gently as it climbs
    out[i] = smooth * p * p * 0.9 * Math.min(1, (1 - p) / 0.04); // quick fade, not a hard cut
  }
  mixRaw(buf, s, out);
}

// big sub-drop for the flash
function addSub(buf, SR, start, durFall = 1.2) {
  const len = Math.round(durFall * SR), s = Math.max(0, Math.round(start * SR));
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const p = i / len;
    const hz = lerp(52, 34, p);
    out[i] = Math.sin(2 * Math.PI * hz * i / SR) * Math.exp(-3 * p) * 0.6;
  }
  // soft click transient
  for (let i = 0; i < 400 && i < len; i++) out[i] += noise() * 0.1 * Math.exp(-40 * i / 400);
  mixRaw(buf, s, out);
}

// low impact thump on each problem-scene downbeat
function addWhump(buf, SR, start, dur) {
  const durL = 0.4, len = Math.round(durL * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) {
    const p = i / len;
    out[i] = Math.sin(2 * Math.PI * lerp(60, 38, p) * i / SR) * Math.exp(-8 * p) * 0.35;
  }
  mixRaw(buf, s, out);
}
