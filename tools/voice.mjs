// Озвучка через ElevenLabs: генерирует все реплики из js/lines.js и собирает их в пакеты
// audio/c.mp3 (общие) и audio/w1.mp3 (мир «Колобок») + js/voice-packs.js со смещениями.
//
//   node tools/voice.mjs --voices                 список голосов аккаунта
//   node tools/voice.mjs --sample <voice_id> ...  пробы голосов → audio/samples/
//   node tools/voice.mjs --voice <voice_id>       сгенерировать всё (голос запоминается в tools/voice.json)
//
// Ключ берётся из переменной ELEVENLABS_API_KEY. Уже сгенерированные реплики с тем же текстом
// не перегенерируются (кэш в audio/src/). Нужен ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const KEY = process.env.ELEVENLABS_API_KEY;
const CFG = path.join(ROOT, 'tools/voice.json');
const SRC = path.join(ROOT, 'audio/src');
const API = 'https://api.elevenlabs.io/v1';
const args = process.argv.slice(2);
const arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

if (!KEY) { console.error('Нет ключа: добавь ELEVENLABS_API_KEY в ~/.zshrc'); process.exit(1); }
const cfg = fs.existsSync(CFG) ? JSON.parse(fs.readFileSync(CFG, 'utf8')) : {};
const model = arg('--model') || cfg.model || 'eleven_multilingual_v2';
const settings = cfg.settings || { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 0.92 };

function loadLines() {
  const G = { lines: o => Object.assign(G._l, o), _l: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/lines.js'), 'utf8'), { G });
  return G._l;
}
const packOf = id => (/^w\d+_/.test(id) ? id.split('_')[0] : 'c');

async function tts(voice, text, out) {
  const r = await fetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: model, language_code: 'ru', voice_settings: settings })
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
}

if (args.includes('--voices')) {
  const r = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } });
  if (!r.ok) { console.error(r.status, await r.text()); process.exit(1); }
  const { voices } = await r.json();
  for (const v of voices) console.log([v.voice_id, v.name, v.labels?.gender, v.labels?.accent, v.labels?.language, v.category].filter(Boolean).join(' · '));
  process.exit(0);
}

if (args.includes('--sample')) {
  const ids = args.slice(args.indexOf('--sample') + 1).filter(a => !a.startsWith('--'));
  const dir = path.join(ROOT, 'audio/samples'); fs.mkdirSync(dir, { recursive: true });
  const text = 'Привет! Добро пожаловать в Сказкоград! Колобок катится по тропинке. Нажимай на экран — и он прыгнет через пенёк! Молодец! Три ягодки — вот цифра три.';
  for (const id of ids) { const f = path.join(dir, id + '.mp3'); await tts(id, text, f); console.log('проба:', f); }
  process.exit(0);
}

const voice = arg('--voice') || cfg.voice;
if (!voice) { console.error('Укажи голос: --voice <voice_id> (список: --voices)'); process.exit(1); }
fs.writeFileSync(CFG, JSON.stringify({ ...cfg, voice, model, settings }, null, 2));
fs.mkdirSync(SRC, { recursive: true });

const lines = loadLines();
const idxFile = path.join(SRC, 'index.json');
const idx = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf8')) : {};
const ids = Object.keys(lines);
let made = 0;
for (const id of ids) {
  const text = lines[id];
  const h = crypto.createHash('md5').update(voice + model + JSON.stringify(settings) + text).digest('hex').slice(0, 10);
  const f = path.join(SRC, id + '.mp3');
  if (idx[id] === h && fs.existsSync(f)) continue;
  process.stdout.write(`${id}… `);
  for (let a = 1; ; a++) {
    try { await tts(voice, text, f); break; } catch (e) { if (a >= 3) throw e; console.warn('повтор', e.message); await new Promise(r => setTimeout(r, 1500 * a)); }
  }
  idx[id] = h; made++;
  fs.writeFileSync(idxFile, JSON.stringify(idx, null, 1));
}
console.log(`\nсгенерировано: ${made}, всего реплик: ${ids.length}`);

// Сборка пакетов: каждая реплика → wav 44.1k моно, между ними 0.3 с тишины, всё → один mp3
const RATE = 44100, GAP = 0.3, tmp = path.join(SRC, '_tmp');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp);
const packs = {};
for (const id of ids) (packs[packOf(id)] = packs[packOf(id)] || []).push(id);
const out = {};
for (const [pk, list] of Object.entries(packs)) {
  const silence = path.join(tmp, 'gap.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `anullsrc=r=${RATE}:cl=mono`, '-t', String(GAP), silence]);
  const parts = [], offs = {};
  let t = GAP;
  parts.push(silence);
  for (const id of list) {
    const w = path.join(tmp, id + '.wav');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(SRC, id + '.mp3'), '-ac', '1', '-ar', String(RATE), '-fflags', '+bitexact', '-map_metadata', '-1', w]);
    const dur = (fs.statSync(w).size - 44) / 2 / RATE; // 16 бит моно
    offs[id] = [+(t - 0.03).toFixed(3), +(dur + 0.08).toFixed(3)];
    t += dur + GAP; parts.push(w, silence);
  }
  const listFile = path.join(tmp, pk + '.txt');
  fs.writeFileSync(listFile, parts.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const mp3 = path.join(ROOT, 'audio', pk + '.mp3');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-ac', '1', '-b:a', '48k', mp3]);
  const v = crypto.createHash('md5').update(fs.readFileSync(mp3)).digest('hex').slice(0, 8);
  out[pk] = { file: `audio/${pk}.mp3?v=${v}`, lines: offs };
  console.log(`пакет ${pk}: ${list.length} реплик, ${(fs.statSync(mp3).size / 1024).toFixed(0)} КБ`);
}
fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(path.join(ROOT, 'js/voice-packs.js'),
  '// Сгенерировано tools/voice.mjs — не править руками.\nG.VOICE_PACKS = ' + JSON.stringify(out) + ';\n');
console.log('готово: js/voice-packs.js');
