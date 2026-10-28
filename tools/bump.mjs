// Перед каждой выкладкой: node tools/bump.mjs
// Меняет номер версии в sw.js и все ?v= в index.html, чтобы у игроков не смешались старые и новые файлы.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const swp = path.join(ROOT, 'sw.js'), ixp = path.join(ROOT, 'index.html');
let sw = fs.readFileSync(swp, 'utf8');
const cur = +(sw.match(/const V = (\d+);/) || [])[1];
if (!cur) { console.error('Не нашёл версию в sw.js'); process.exit(1); }
const next = cur + 1;
sw = sw.replace(/const V = \d+;/, `const V = ${next};`);
fs.writeFileSync(swp, sw);
fs.writeFileSync(ixp, fs.readFileSync(ixp, 'utf8').replace(/\?v=\d+/g, `?v=${next}`));
console.log(`версия ${cur} → ${next}`);
