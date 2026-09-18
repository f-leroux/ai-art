// Renders the music video to an MP4, frame by frame, with headless Chromium.
//   node render.mjs contact           -> a handful of PNG stills in ./out/stills
//   node render.mjs full [fps] [crf]  -> ./out/bumblebee.mp4
// Requires playwright-core (+ a Chromium) and an ffmpeg binary (FFMPEG env var, or imageio-ffmpeg via python).
import { chromium } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = path.dirname(new URL(import.meta.url).pathname);
const mode = process.argv[2] || 'contact';
const FPS = Number(process.argv[3] || 30);
const CRF = Number(process.argv[4] || 18);
const out = path.join(root, 'out');
fs.mkdirSync(out, { recursive: true });

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); res.end(data); });
});
await new Promise((r) => server.listen(4181, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:4181/index.html?render=1', { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (await page.evaluate(() => window.MV.fonts ? window.MV.fonts() : true) === false) console.log('WARNING: web fonts did not load');
const info = await page.evaluate(() => window.MV.load('audio/bumblebee.mp3'));
console.log('analysed', info);
console.log('analysis', JSON.stringify(await page.evaluate(() => window.MV.analysis())));
await page.evaluate(() => document.body.classList.add('render'));

async function grab(i, fps, file, type = 'jpeg') {
  await page.evaluate(([i, fps]) => window.MV.renderFrame(i, fps), [i, fps]);
  if (type === 'png') { await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 1080 } }); return; }
  const data = await page.evaluate(() => window.MV.jpeg(0.93));
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
}

if (mode === 'contact') {
  const stills = path.join(out, 'stills');
  fs.mkdirSync(stills, { recursive: true });
  const times = (process.argv[3] ? process.argv[3].split(',').map(Number) : [1.5, 5, 20, 45, 70, 95, 108, 118, 123.4, 127, 131]);
  for (const t of times) { await grab(Math.round(t * 60), 60, path.join(stills, `t${String(t).replace('.', '_')}.png`), 'png'); console.log('still', t); }
} else {
  const frames = path.join(out, 'frames');
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const total = Math.ceil(info.duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await grab(i, FPS, path.join(frames, `f${String(i).padStart(5, '0')}.jpg`));
    if (i % 300 === 0) console.log(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  let ffmpeg = process.env.FFMPEG;
  if (!ffmpeg) { const r = spawnSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }); ffmpeg = r.stdout.trim() || 'ffmpeg'; }
  const mp4 = path.join(out, 'bumblebee.mp4');
  const r = spawnSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.jpg'), '-i', (fs.existsSync(path.join(root, 'audio', 'bumblebee.wav')) ? path.join(root, 'audio', 'bumblebee.wav') : path.join(root, 'audio', 'bumblebee.mp3')), '-c:v', 'libx264', '-preset', 'medium', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { encoding: 'utf8' });
  console.log(r.status === 0 ? `wrote ${mp4}` : `ffmpeg failed: ${r.stderr}`);
}
await browser.close();
server.close();
