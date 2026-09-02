// Redimensionne ssheet.png (3646x3583 -> max 2048) et re-scale les coords de frames inline dans main.js.
// Les spriteSourceSize/sourceSize (tailles logiques) restent inchanges : seul le rectangle source de l'atlas bouge.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIR = __dirname;
const MAIN = path.join(DIR, 'js', 'main.js');
const PNG = path.join(DIR, 'assets', 'hd', 'spritesheets', 'ssheet.png');

const src = fs.readFileSync(MAIN, 'latin1');
const START = src.indexOf('Ta.ssheet={frames:');
if (START === -1) throw new Error('ancre Ta.ssheet introuvable');
const OBJ_START = src.indexOf('{', START);
// trouver la fin de l'objet par comptage d'accolades (hors strings)
let depth = 0, i = OBJ_START, inStr = null, esc = false;
for (; i < src.length; i++) {
  const c = src[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === '\\') esc = true;
    else if (c === inStr) inStr = null;
    continue;
  }
  if (c === '"' || c === "'") { inStr = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
}
const blob = src.slice(OBJ_START, i);
console.log('blob atlas extrait:', blob.length, 'caracteres');

// eval de l'objet JS (litteral avec cles nus et !0/!1)
const atlas = new Function('return (' + blob + ')')();
const meta = atlas.meta;
console.log('meta size:', JSON.stringify(meta.size), 'image:', meta.image);
const oldW = meta.size.w, oldH = meta.size.h;
const MAX = 2048;
if (oldW <= MAX && oldH <= MAX) { console.log('atlas deja <= 2048, rien a faire'); process.exit(0); }
const f = MAX / Math.max(oldW, oldH);
const newW = Math.round(oldW * f), newH = Math.round(oldH * f);
console.log('facteur:', f.toFixed(6), '->', newW + 'x' + newH);

// rescaler uniquement frame:{x,y,w,h} (rectangle source dans l'atlas)
let nFrames = 0;
for (const [name, fr] of Object.entries(atlas.frames)) {
  if (fr.frame) {
    fr.frame.x = Math.round(fr.frame.x * f);
    fr.frame.y = Math.round(fr.frame.y * f);
    fr.frame.w = Math.round(fr.frame.w * f);
    fr.frame.h = Math.round(fr.frame.h * f);
    nFrames++;
  }
  if (fr.spriteSourceSize) { /* inchange (logique) */ }
}
console.log('frames re-scalees:', nFrames);
meta.size.w = newW; meta.size.h = newH;

// re-serialiser en style compact compatible avec le reste du fichier
function ser(v) {
  if (v === true) return '!0';
  if (v === false) return '!1';
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
  const keys = Object.keys(v);
  return '{' + keys.map((k) => (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k)) + ':' + ser(v[k])).join(',') + '}';
}
const newBlob = ser(atlas);
const out = src.slice(0, OBJ_START) + newBlob + src.slice(i);
fs.writeFileSync(MAIN, out, 'latin1');
console.log('main.js mis a jour (delta taille:', (newBlob.length - blob.length), 'octets)');

// redimensionner le PNG via PIL (meilleur reechantillonnage LANCZOS)
const py = `
from PIL import Image
im = Image.open(${JSON.stringify(PNG)})
print('avant:', im.size, im.mode)
im = im.convert('RGBA').resize((${newW}, ${newH}), Image.LANCZOS)
im.save(${JSON.stringify(PNG)}, optimize=True)
print('apres:', im.size)
`;
fs.writeFileSync(path.join(DIR, '_resize.py'), py);
console.log(execSync('python3 ' + path.join(DIR, '_resize.py')).toString());
fs.unlinkSync(path.join(DIR, '_resize.py'));
console.log('OK');
