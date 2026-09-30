// Renders the Kapkoti Solution wealth-onboarding film frame by frame and encodes it with ffmpeg.
// Every frame is drawn in code: no stock footage, no video editor.
// Structure: problem act (high BPM, suspense, rising curve) -> silence -> sub-drop ->
// solution act (low BPM, calm) -> exciting build into "COMING SOON". Single window, text-driven.
// Usage: pnpm video  (needs ffmpeg on PATH)
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const FPS = 30;
const W = 1600;   // logical design size; rendered at W*SS for crispness
const H = 900;
const SS = 2;     // supersample factor
const FRAMES_DIR = join(ROOT, '.cache', 'frames');
const OUT_MP4 = join(ROOT, 'public', 'media', 'workflow.mp4');
const TEASER_MP4 = join(ROOT, 'public', 'media', 'teaser.mp4');

// palettes
const INK = '#243f35';      // brand green
const CREAM = '#f5f2e9';
const DARK = '#16281f';
const PROB_BG = '#1c1210';  // problem-act charcoal
const LEFT_INK = '#e8ded6'; // paper of the problem world
const BAD_RED = '#c2544a';  // alarm red, problem act only
const ACCENT = '#c96f4a';   // warm terracotta
const GOOD = '#4d8563';

for (const font of ['/System/Library/Fonts/Supplemental/Georgia.ttf', '/System/Library/Fonts/Supplemental/Georgia Bold.ttf']) {
  try { GlobalFonts.registerFromPath(font); } catch { /* fall back to default sans */ }
}

// bpm is the marketing: problems run fast, solutions run calm, and the curve keeps changing
const MUSIC = {
  hook:    { kind: 'tense', bpm: 176, intensity: 0.60, riser: 1.8 },
  packet:  { kind: 'tense', bpm: 170, intensity: 0.75, riser: 2.0 },
  chase:   { kind: 'tense', bpm: 174, intensity: 0.82, riser: 2.2 },
  retype:  { kind: 'tense', bpm: 168, intensity: 0.88, riser: 2.4 },
  clock:   { kind: 'tense', bpm: 178, intensity: 0.95, riser: 2.6 },
  turn:    { kind: 'turn',  riser: 4.2 },
  reveal:  { kind: 'calm',  bpm: 92,  intensity: 0.50 },
  intake:  { kind: 'calm',  bpm: 94,  intensity: 0.55 },
  verify:  { kind: 'calm',  bpm: 96,  intensity: 0.60 },
  flow:    { kind: 'calm',  bpm: 92,  intensity: 0.60 },
  numbers: { kind: 'calm',  bpm: 90,  intensity: 0.55 },
  close:   { kind: 'close', bpm: 108, intensity: 0.70, riser: 3.0 },
};

const CAM = {
  hook:    { z0: 1.06, z1: 1.0 },
  packet:  { z0: 1.0,  z1: 1.06 },
  chase:   { z0: 1.05, z1: 1.0 },
  retype:  { z0: 1.0,  z1: 1.05 },
  clock:   { z0: 1.0,  z1: 1.07 },
  turn:    { z0: 1.08, z1: 1.0 },
  reveal:  { z0: 1.0,  z1: 1.05 },
  intake:  { z0: 1.04, z1: 1.0 },
  verify:  { z0: 1.0,  z1: 1.05 },
  flow:    { z0: 1.04, z1: 1.0 },
  numbers: { z0: 1.0,  z1: 1.06 },
  close:   { z0: 1.0,  z1: 1.05 },
};

const scenes = [
  { name: 'hook',    seconds: 7, draw: drawHook },
  { name: 'packet',  seconds: 8, draw: drawPacket },
  { name: 'chase',   seconds: 8, draw: drawChase },
  { name: 'retype',  seconds: 8, draw: drawRetype },
  { name: 'clock',   seconds: 8, draw: drawClock },
  { name: 'turn',    seconds: 5, draw: drawTurn },
  { name: 'reveal',  seconds: 5, draw: drawReveal },
  { name: 'intake',  seconds: 8, draw: drawIntake },
  { name: 'verify',  seconds: 8, draw: drawVerify },
  { name: 'flow',    seconds: 8, draw: drawFlow },
  { name: 'numbers', seconds: 9, draw: drawNumbers },
  { name: 'close',   seconds: 10, draw: drawClose },
].map(s => ({ ...s, music: MUSIC[s.name], cam: CAM[s.name] }));

const totalSeconds = scenes.reduce((sum, s) => sum + s.seconds, 0);   // 92s
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
  ctx.font = '700 34px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, 0, 12);
  ctx.restore();
}

// big centre statement
function headline(ctx, text, y, size = 72, color = CREAM, alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  ctx.globalAlpha = 1;
}

function subline(ctx, text, y, size = 30, color = withAlpha(CREAM, 0.75), alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Manrope, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(text, W / 2, y);
  ctx.globalAlpha = 1;
}

// ---------- scenes ----------

// hook: "a client says yes" then the paperwork begins; riser into the next scene
function drawHook(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, t > 0.5);
  const drop = ease(clamp01(t * 5));
  dot(ctx, W / 2, lerp(-60, H * 0.26, drop));
  const p = pop(t, 1.2 / S, 0.6);
  if (p > 0) headline(ctx, 'A CLIENT SAYS YES.', H * 0.52, 88, CREAM, Math.min(1, p));
  const p2 = pop(t, 2.6 / S, 0.45);
  if (p2 > 0) subline(ctx, 'And then… the paperwork begins.', H * 0.64, 32, withAlpha(CREAM, 0.75), Math.min(1, p2));
  const p3 = pop(t, 4.4 / S, 0.4);
  if (p3 > 0) subline(ctx, 'W A T C H   W H A T   H A P P E N S', H * 0.76, 24, BAD_RED, Math.min(1, p3) * 0.9);
  grain(ctx, frameIndex, true);
}

// S2 packet: PRINT > SIGN > SCAN > EMAIL BACK, reject stamp, bounce rate
function drawPacket(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  headline(ctx, 'the form packet loop.', H * 0.2, 48, withAlpha(CREAM, 0.85), clamp01((t - 0.3 / S) / 0.3));
  const steps = ['PRINT.', 'SIGN.', 'SCAN.', 'EMAIL BACK.'];
  steps.forEach((s, i) => {
    const p = pop(t, (1.4 + i * 1.05) / S, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = i === 3 ? BAD_RED : CREAM;
    ctx.font = 'bold 58px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(s, W * 0.5 + (i - 1.5) * 360, H * 0.38);
    if (i > 0) {
      ctx.globalAlpha = Math.min(0.4, Math.min(1, p));
      ctx.fillStyle = CREAM;
      ctx.font = '600 22px Manrope, Arial, sans-serif';
      ctx.fillText(['wait', 'wait', 'wait'][i - 1], W * 0.5 + (i - 1.5) * 360 - 20, H * 0.38 - 14);
    }
    ctx.globalAlpha = 1;
  });
  const sp = pop(t, 4.6 / S, 0.35);
  if (sp > 0) {
    card(ctx, W * 0.5 - 250, H * 0.6 - 48, 500, 82, '#efe9dd', 12);
    ctx.fillStyle = INK; ctx.font = '600 26px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('one missing line = the whole packet returns', W / 2, H * 0.6 + 10);
    stamp(ctx, W * 0.5, H * 0.6 + 8 - 0, 'REJECTED · NIGO', Math.min(1, sp));
  }
  const st = pop(t, 6.2 / S, 0.4);
  if (st > 0) subline(ctx, '20–40% of applications bounce back at least once.', H * 0.82, 30, BAD_RED, Math.min(1, st));
  grain(ctx, frameIndex, true);
}

// S3 chase: advisor becomes the courier, phone calls and emails stack
function drawChase(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  const p1 = pop(t, 0.4 / S, 0.45);
  if (p1 > 0) headline(ctx, 'chase, resend, wait.', H * 0.2, 62, CREAM, Math.min(1, p1));
  // ringing phone right
  ctx.save();
  const shake = t > 0.2 ? Math.sin(t * 40) * 2 : 0;
  ctx.translate(W * 0.78 + shake, H * 0.56);
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.roundRect(-70, -150, 140, 300, 24); ctx.fill();
  ctx.fillStyle = PROB_BG; ctx.beginPath(); ctx.roundRect(-56, -124, 112, 248, 14); ctx.fill();
  const msgs = ['resend page 4', 'missing signature', 'illegible scan', 'wrong form version'];
  msgs.forEach((msg, i) => {
    const p = pop(t, (1.6 + i * 0.9) / S, 0.3);
    if (p <= 0) return;
    ctx.fillStyle = BAD_RED;
    ctx.beginPath(); ctx.roundRect(60, -100 + i * 56, 190, 44, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '600 16px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(msg, 155, -71 + i * 56);
  });
  ctx.restore();
  ['call #1', 'call #4', 'call #9'].forEach((m, i) => {
    const p = pop(t, (2.0 + i * 1.0) / S, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p) * 0.9;
    ctx.fillStyle = CREAM; ctx.font = '700 30px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(m, 120, H * 0.42 + i * 70);
    ctx.globalAlpha = 1;
  });
  const p2 = pop(t, 6.2 / S, 0.45);
  if (p2 > 0) subline(ctx, 'The most expensive person in the firm becomes the courier.', H * 0.84, 30, BAD_RED, Math.min(1, p2));
  grain(ctx, frameIndex, true);
}

// S4 retype: same data into three systems, mismatch stamp
function drawRetype(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  const p1 = pop(t, 0.4 / S, 0.45);
  if (p1 > 0) headline(ctx, 'one detail, retyped three times.', H * 0.18, 50, CREAM, Math.min(1, p1));
  const systems = ['CRM', 'PORTFOLIO', 'COMPLIANCE'];
  systems.forEach((sys, i) => {
    const p = pop(t, (1.2 + i * 0.9) / S, 0.35);
    if (p <= 0) return;
    const x = W * 0.5 - 480 + i * 340, y = H * 0.34;
    ctx.globalAlpha = Math.min(1, p);
    card(ctx, x, y, 300, 250, '#e8ded6', 12);
    ctx.fillStyle = INK; ctx.font = '700 26px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(sys, x + 24, y + 44);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = withAlpha(INK, 0.3);
      ctx.fillRect(x + 24, y + 70 + k * 32, 240, 10);
    }
    // someone typing: row highlights flicker
    if (t > (1.6 + i * 0.9) / S && pseudo(frameIndex * 3.1 + i) > 0.4) {
      ctx.fillStyle = withAlpha(BAD_RED, 0.45);
      ctx.fillRect(x + 24 + pseudo(frameIndex + i) * 200, y + 70 + (frameIndex % 5) * 32, 26, 10);
    }
    ctx.globalAlpha = 1;
  });
  const sp = pop(t, 4.8 / S, 0.35);
  if (sp > 0) stamp(ctx, W * 0.5, H * 0.62, 'MISMATCH', Math.min(1, sp));
  const p2 = pop(t, 6.4 / S, 0.45);
  if (p2 > 0) subline(ctx, 'every bounce costs $50–100 and days of waiting.', H * 0.84, 30, BAD_RED, Math.min(1, p2));
  grain(ctx, frameIndex, true);
}

// S5 clock: the calendar sprint, the three damning numbers, strongest heartbeat
function drawClock(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  suspenseBG(ctx, t, true);
  headline(ctx, 'meanwhile, the client waits.', H * 0.16, 44, CREAM, clamp01((t - 0.3 / S) / 0.3));
  // flipping calendar pages
  ctx.save();
  ctx.translate(W * 0.5, H * 0.42);
  for (let i = 0; i < 3; i++) {
    const flip = pseudo(frameIndex * 0.7 + i * 13); // deterministic page flutter
    ctx.globalAlpha = 0.9;
    ctx.save(); ctx.translate((i - 1) * 210, 0); ctx.rotate((i - 1) * flip * 0.12);
    card(ctx, -90, -60, 180, 120, '#e8ded6', 10);
    ctx.fillStyle = i === 2 ? BAD_RED : INK;
    ctx.font = 'bold 40px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('DAY', 0, -6);
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(String(3 + Math.floor(((t * 14 + i * 9) % 60))), 0, 46);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  const facts = [
    ['28% of firms take 20+ days to onboard.', 2.4],
    ['~30% take 90+ days for UHNW clients.', 3.9],
    ['70% of clients would switch for a digital-first firm.', 5.4],
  ];
  facts.forEach(([txt, d], i) => {
    const p = pop(t, d / S, 0.4);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = i === 2 ? BAD_RED : CREAM;
    ctx.font = `600 ${i === 2 ? 34 : 29}px Manrope, Arial, sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(txt, W / 2, H * 0.7 + i * 52);
    ctx.globalAlpha = 1;
  });
  const p2 = pop(t, 7.0 / S, 0.4);
  if (p2 > 0) subline(ctx, 'some firms lost half their clients during the wait.', H * 0.92, 26, BAD_RED, Math.min(1, p2));
  grain(ctx, frameIndex, true);
}

// S6 the turn: heartbeat slow, near silence, then the white flash
function drawTurn(ctx, scene, t, frameIndex) {
  ctx.fillStyle = '#0a0908'; ctx.fillRect(0, 0, W, H);
  // three slow heartbeats
  const beatT = [0.12, 0.42, 0.72];
  beatT.forEach((b, i) => {
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
  headline(ctx, 'The difference was never effort.', H * 0.62, 44, withAlpha(CREAM, 0.9), a);
  // final 18%: hard flash to white
  if (t > 0.82) {
    ctx.fillStyle = `rgba(245,242,233,${ease((t - 0.82) / 0.18)})`;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, frameIndex, true);
}

// S7 reveal: cream world, the pipeline draws itself: hello to invested
function drawReveal(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.4 / S, 0.4);
  if (p1 > 0) headline(ctx, 'What the work fell between…', H * 0.24, 50, INK, Math.min(1, p1));
  // pipeline: line grows left to right, nodes pop
  const nodes = ['INTAKE', 'VERIFY', 'MATCH', 'POST'];
  const nodesP = pop(t, 1.0 / S, 0.5);
  if (nodesP > 0) {
    const x0 = W * 0.18, x1 = W * 0.82, y = H * 0.5;
    const grow = ease(clamp01((t - 1.0 / S) / 0.5));
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, grow), y); ctx.stroke();
    ['HELLO', 'INVESTED'].forEach((w, i) => {
      ctx.fillStyle = withAlpha(INK, 0.55);
      ctx.font = '700 24px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(w, i === 0 ? x0 : x1, y + 60);
    });
    nodes.forEach((n, i) => {
      const np = pop(t, (1.4 + i * 0.5) / S, 0.3);
      if (np <= 0) return;
      const nx = lerp(x0, x1, (i + 0.5) / 4);
      ctx.globalAlpha = Math.min(1, np);
      card(ctx, nx - 72, y - 34, 144, 68, INK, 34);
      ctx.fillStyle = CREAM; ctx.font = '700 19px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(n, nx, y + 6);
      ctx.globalAlpha = 1;
    });
    dot(ctx, lerp(x0, x1, clamp01((t - 1.3 / S) / 0.55)), y, 10);
  }
  const p2 = pop(t, 3.8 / S, 0.45);
  if (p2 > 0) subline(ctx, '…is what the Kapkoti pipeline was built for.', H * 0.76, 34, ACCENT, Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// S8 intake: phone appears, secure link, progress bar, auto-resume
function drawIntake(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'A secure link. Not a packet.', H * 0.18, 46, INK, Math.min(1, p1));
  // phone slides up from bottom right
  const up = ease(clamp01((t - 0.6 / S) / 0.4));
  ctx.save();
  ctx.translate(W * 0.72, lerp(H + 260, H * 0.56, up));
  ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-110, -200, 220, 400, 34); ctx.fill();
  ctx.fillStyle = '#fdfcf6'; ctx.beginPath(); ctx.roundRect(-94, -170, 188, 340, 20); ctx.fill();
  // SMS bubble
  card(ctx, -70, -150, 150, 46, INK, 22);
  ctx.fillStyle = CREAM; ctx.font = '600 15px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('secure link sent', 0, -120);
  // progress
  const prog = clamp01((t - 1.6 / S) / (2.4 / S));
  ctx.fillStyle = withAlpha(INK, 0.15); ctx.beginPath(); ctx.roundRect(-70, -70, 150, 16, 8); ctx.fill();
  ctx.fillStyle = GOOD; ctx.beginPath(); ctx.roundRect(-70, -70, 150 * prog, 16, 8); ctx.fill();
  ctx.fillStyle = INK; ctx.font = '600 19px Manrope, Arial, sans-serif';
  ctx.fillText(`${Math.round(prog * 100)}% done`, 0, -22);
  // resume chip
  const rp = pop(t, 4.6 / S, 0.3);
  if (rp > 0) {
    ctx.globalAlpha = Math.min(1, rp);
    card(ctx, -70, -12, 150, 42, ACCENT, 21);
    ctx.fillStyle = '#fff'; ctx.font = '700 15px Manrope, Arial, sans-serif';
    ctx.fillText('auto-resume ✓', 0, 15);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // copy left
  const lines = [['Finish it on your phone,', 'in one sitting.', 1.6],
                 ['prefilled from your records', 2.8],
                 ['gentle reminders, so nobody chases', 3.8]];
  lines.forEach(([l1, l2, d], i) => {
    const p = pop(t, d / S, 0.4);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = i === 0 ? INK : withAlpha(INK, 0.65);
    if (i === 0) {
      ctx.font = '600 34px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(l1, W * 0.09, H * 0.46);
      ctx.fillText(l2, W * 0.09, H * 0.46 + 44);
    } else {
      ctx.font = '600 26px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(l1, W * 0.09, H * 0.46 + (i + 0.4) * 68);
    }
    ctx.globalAlpha = 1;
  });
  grain(ctx, frameIndex, false);
}

// S9 verify: guided e-sign that cannot be missed + automated KYC/AML
function drawVerify(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'Every field watched. Every signature guided.', H * 0.18, 46, INK, Math.min(1, p1));
  // signature glide
  card(ctx, W * 0.5 - 350, H * 0.4, 700, 140, '#fdfcf6', 14);
  ctx.fillStyle = withAlpha(INK, 0.6); ctx.font = '500 20px Manrope, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SIGN HERE', W * 0.5 - 320, H * 0.4 + 38);
  ctx.strokeStyle = withAlpha(INK, 0.3); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W * 0.5 - 320, H * 0.4 + 96); ctx.lineTo(W * 0.5 + 320, H * 0.4 + 96); ctx.stroke();
  const sig = ease(clamp01((t - 1.0 / S) / (1.6 / S)));
  if (sig > 0) {
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= sig * 60; i++) {
      const xx = W * 0.5 - 300 + i * 10;
      const yy = H * 0.4 + 74 + Math.sin(i * 0.5) * 16 * (i / 60);
      i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  const bp = pop(t, 2.8 / S, 0.3);
  if (bp > 0) {
    ctx.globalAlpha = Math.min(1, bp);
    ctx.fillStyle = GOOD; ctx.beginPath(); ctx.arc(W * 0.5 + 310, H * 0.4 + 70, 20 + bp * 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 26px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✓', W * 0.5 + 310, H * 0.4 + 79);
    ctx.globalAlpha = 1;
  }
  const checks = ['identity verified', 'sanctions screened', 'risk profile matched', '100% allocations'];
  checks.forEach((c, i) => {
    const p = pop(t, (2.8 + i * 0.75) / S, 0.3);
    if (p <= 0) return;
    ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = GOOD; ctx.beginPath(); ctx.arc(W * 0.5 - 540 + i * 360, H * 0.68, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = INK; ctx.font = '600 23px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(c, W * 0.5 - 516 + i * 360, H * 0.68 + 8);
    ctx.globalAlpha = 1;
  });
  const p2 = pop(t, 6.4 / S, 0.4);
  if (p2 > 0) subline(ctx, 'KYC, AML and suitability: minutes, not days.', H * 0.86, 30, ACCENT, Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// S10 flow: straight-through posting, exceptions to humans
function drawFlow(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p1 = pop(t, 0.3 / S, 0.45);
  if (p1 > 0) headline(ctx, 'Straight through. On the record.', H * 0.18, 48, INK, Math.min(1, p1));
  // three linked cards
  const cardsArr = [['INTAKE', 'verified data'], ['SYSTEMS', 'CRM · portfolio · compliance'], ['BOOKS', 'posted, one trail']];
  cardsArr.forEach(([h, s], i) => {
    const p = pop(t, (1.2 + i * 0.8) / S, 0.35);
    if (p <= 0) return;
    const x = W * 0.5 - 420 + i * 300, y = H * 0.4;
    ctx.globalAlpha = Math.min(1, p);
    card(ctx, x, y, 250, 150, i === 2 ? INK : '#fdfcf6', 14);
    ctx.fillStyle = i === 2 ? CREAM : INK;
    ctx.font = '700 26px Manrope, Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(h, x + 24, y + 48);
    ctx.font = '500 18px Manrope, Arial, sans-serif';
    ctx.fillStyle = i === 2 ? withAlpha(CREAM, 0.8) : withAlpha(INK, 0.65);
    ctx.fillText(s, x + 24, y + 82);
    ctx.globalAlpha = 1;
    if (i < 2) {
      dot(ctx, x + 280, y + 75, 8, GOOD);
    }
  });
  // exception routes politely
  const ep = pop(t, 4.2 / S, 0.35);
  if (ep > 0) {
    ctx.globalAlpha = Math.min(1, ep);
    card(ctx, W * 0.5 - 230, H * 0.66, 460, 60, ACCENT, 30);
    ctx.fillStyle = '#fff'; ctx.font = '700 22px Manrope, Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('exceptions reach a human, calmly', W / 2, H * 0.66 + 38);
    ctx.globalAlpha = 1;
  }
  const p2 = pop(t, 6.0 / S, 0.4);
  if (p2 > 0) subline(ctx, 'no rekeying, no blind spots, no month-end surprises.', H * 0.84, 28, withAlpha(INK, 0.65), Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// S11 numbers: the before/after, calm and undeniable
function drawNumbers(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const p0 = pop(t, 0.3 / S, 0.4);
  if (p0 > 0) headline(ctx, 'What changes.', H * 0.18, 60, INK, Math.min(1, p0));
  const stats = [
    ['NIGOs', '25% -> under 2%'],
    ['Onboarding', '90 days -> days'],
    ['The work', 'handled straight-through'],
    ['Decisions', 'one auditable trail'],
  ];
  stats.forEach(([big, small], i) => {
    const p = pop(t, (1.2 + i * 1.1) / S, 0.4);
    if (p <= 0) return;
    const y = H * 0.38 + i * 100;
    ctx.globalAlpha = Math.min(1, p);
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = 'bold 50px Georgia, serif';
    ctx.fillText(big, W * 0.2, y);
    ctx.fillStyle = ACCENT;
    ctx.font = '600 36px Manrope, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(small, W * 0.8, y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = withAlpha(INK, 0.25); ctx.fillRect(W * 0.2, y + 20, W * 0.6, 1);
  });
  const p2 = pop(t, 6.6 / S, 0.4);
  if (p2 > 0) subline(ctx, 'the numbers every wealth firm is chasing.', H * 0.88, 26, withAlpha(INK, 0.55), Math.min(1, p2));
  grain(ctx, frameIndex, false);
}

// S12 close: brand, then the exciting COMING SOON with rising build
function drawClose(ctx, scene, t, frameIndex) {
  const S = scene.seconds;
  ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H);
  const a = fadeInOut(t, 0.08, 0.04);
  ctx.globalAlpha = a;
  // brand mark
  ctx.fillStyle = CREAM;
  ctx.beginPath(); ctx.roundRect(W / 2 - 44, H * 0.11, 88, 88, 24); ctx.fill();
  ctx.fillStyle = INK; ctx.font = 'bold 56px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('k', W / 2 - 6, H * 0.11 + 63);
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(W / 2 + 16, H * 0.11 + 53, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CREAM; ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText('Kapkoti Solution', W / 2, H * 0.11 + 158);
  subline(ctx, 'One pipeline for the work that falls between your systems.', H * 0.11 + 200, 26, withAlpha(CREAM, 0.85));
  // COMING SOON: big, pulsing, energised
  const cp = pop(t, 2.2 / S, 0.55);
  if (cp > 0) {
    const pulse = 1 + 0.03 * Math.sin(t * Math.PI * 2 * 2.2);
    ctx.save();
    ctx.translate(W / 2, H * 0.6);
    ctx.scale(pulse * cp, pulse * cp);
    const v = ctx.createLinearGradient(-480, 0, 480, 0);
    v.addColorStop(0, ACCENT); v.addColorStop(0.5, CREAM); v.addColorStop(1, ACCENT);
    ctx.fillStyle = v;
    ctx.font = 'bold 138px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('COMING SOON', 0, 44);
    ctx.restore();
    // sparkle diamonds orbiting the words (drawn, not glyphs: no tofu)
    for (let i = 0; i < 8; i++) {
      const ang = t * 0.9 + i * Math.PI / 4;
      const sx = W / 2 + Math.cos(ang) * 620;
      const sy = H * 0.6 + Math.sin(ang) * 130;
      const r = 8 + 4 * Math.sin(t * 5 + i * 2);
      ctx.globalAlpha = (0.35 + 0.3 * Math.sin(t * 5 + i * 2)) * cp;
      ctx.fillStyle = i % 2 ? ACCENT : CREAM;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 1.6); ctx.lineTo(sx + r, sy); ctx.lineTo(sx, sy + r * 1.6); ctx.lineTo(sx - r, sy);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  subline(ctx, 'the client pipeline for wealth firms · onboarding, KYC and everything after', H * 0.8, 24, withAlpha(CREAM, 0.75), clamp01((t - 4.2 / S) / 0.4));
  subline(ctx, 'www.kapkotisolution.com', H * 0.88, 28, ACCENT, clamp01((t - 5.0 / S) / 0.4));
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
  '-vf', `scale=2560:1440:flags=lanczos`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', SILENT_MP4]);

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
// scene starts: hook 0, packet 7, chase 15, retype 23, clock 31, turn 39, reveal 44,
//               intake 49, verify 57, flow 65, numbers 73, close 82 (end 92)
take(2.7, 3.9);    // hook: dot lands, title
take(13.9, 15.1);  // packet: the reject stamp
take(43.4, 44.6);  // turn: white flash
take(60.9, 62.1);  // verify: signature check
take(87.4, 88.6);  // close: COMING SOON pop
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(TEASER_FRAMES, 't%05d.png'),
  '-vf', 'scale=2560:1440:flags=lanczos',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', TEASER_MP4]);

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
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(ROOT, '.cache', 'poster.png'), '-q:v', '2', join(ROOT, 'public', 'media', 'poster.jpg')]);

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

// suspense riser: noise that grows and brightens, ends on the next downbeat
function addRiser(buf, SR, start, dur) {
  if (start < 0) return;
  const len = Math.round(dur * SR), s = Math.round(start * SR);
  const out = new Float64Array(len);
  let smooth = 1;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    const raw = pseudo(i * 29.3 + s) * 2 - 1;
    smooth = smooth * (0.96 - 0.004 * p) + raw * (1 - smooth); // brightens as it climbs
    out[i] = smooth * p * p * 0.5;
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
  for (let i = 0; i < 400 && i < len; i++) out[i] += (pseudo(i) * 2 - 1) * 0.2 * Math.exp(-40 * i / 400);
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
