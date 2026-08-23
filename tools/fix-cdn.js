const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'app', 'blocks');

for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json')) continue;
  const p = path.join(DIR, f);
  let c = fs.readFileSync(p, 'utf8');
  // склеиваем задвоенные префиксы jsDelivr в один канонический
  const fixed = c.replace(/((?:https?:)?\/\/(?:cdn\.jsdelivr\.net\/gh\/)+)/g, 'https://cdn.jsdelivr.net/gh/');
  if (fixed !== c) { fs.writeFileSync(p, fixed, 'utf8'); console.log('fixed', f); }
}

// повторный контроль чужих ссылок
let bad = [];
const ok = [
  /^https:\/\/cdn\.jsdelivr\.net\/gh\/lyubav4ik\/maison-marketplace-app@v0\.1\//,
  /^https:\/\/cdnjs\.cloudflare\.com\//,
  /^https:\/\/fonts\.googleapis/,
  /^https:\/\/fonts\.gstatic/,
];
for (const f of fs.readdirSync(DIR)) {
  if (!f.endsWith('.json') || f === '_registry.json') continue;
  const c = fs.readFileSync(path.join(DIR, f), 'utf8');
  for (const u of c.match(/https:\/\/[a-z0-9.\-]+\/[^"'\s)\\]+/g) || []) {
    if (!ok.some(r => r.test(u))) bad.push(f + ' -> ' + u.slice(0, 100));
  }
}
console.log(bad.length ? 'ЧУЖИЕ:\n' + [...new Set(bad)].join('\n') : 'контроль пройден');

// выборочная проверка одной ссылки на доступность после пуша
console.log('пример:', 'https://cdn.jsdelivr.net/gh/lyubav4ik/maison-marketplace-app@v0.1/assets/header-block.css');
