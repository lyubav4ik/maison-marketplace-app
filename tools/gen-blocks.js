const fs = require('fs');
const path = require('path');

const TEMP = 'C:/Users/84A6~1/AppData/Local/Temp/opencode/';
const VELOUR_ASSETS = 'C:/Users/мама/Documents/Вайбкод приложения Битрикс24/velour-marketplace-app/app/assets/';
const ROOT = path.join(__dirname, '..');
const OUT_BLOCKS = path.join(ROOT, 'app', 'blocks');
const OUT_ASSETS = path.join(ROOT, 'app', 'assets');

// Хост не включаем: он уже стоит в оригинальных ссылках перед заменяемой частью
const NEW_CDN = 'lyubav4ik/maison-marketplace-app@v0.1/app/assets/';

const PAYLOADS = [
  'register-header.json',
  'register-hero.json',
  'register-cats.json',
  'register-products.json',
  'register-story.json',
  'register-footer.json',
  'register-vl-maison-pcard.json',
  'register-vl-maison-related.json',
  'register-vl-maison-abhero.json',
  'register-vl-maison-abstory.json',
  'register-vl-maison-values.json',
  'register-vl-maison-craft.json',
  'register-vl-maison-contacts.json',
  'register-vl-maison-mapimg.json',
  'register-vl-maison-delivery.json',
  'register-vl-maison-returns.json',
  'register-vl-maison-faq.json',
  'register-vl-maison-article.json',
];

fs.mkdirSync(OUT_BLOCKS, { recursive: true });
fs.mkdirSync(OUT_ASSETS, { recursive: true });

const usedAssets = new Set();
const registry = [];

for (const file of PAYLOADS) {
  const raw = fs.readFileSync(path.join(TEMP, file), 'utf8');
  const rewritten = raw.replace(
    /lyubav4ik\/velvet-marketplace-app@[a-z0-9.\-]+\/assets\//g,
    NEW_CDN
  );
  // страховка: не должно остаться ссылок на velour/vibecode домен
  if (/app-de233865f028|velour/i.test(rewritten)) {
    console.error('!! подозрительная ссылка в ' + file);
  }
  const json = JSON.parse(rewritten); // проверка валидности
  const code = json.code;
  fs.writeFileSync(path.join(OUT_BLOCKS, code + '.json'), JSON.stringify(json, null, 2), 'utf8');
  registry.push({ code, name: json.fields.NAME });

  // собираем ассеты: все ссылки на /assets/<файл>
  const urls = rewritten.match(/assets\/([A-Za-z0-9._\-]+\.(?:css|js|jpg|jpeg|png|svg|webp))/g) || [];
  for (const u of urls) usedAssets.add(u.slice('assets/'.length));

  console.log('ok', code.padEnd(24), json.fields.NAME);
}

// копируем ассеты из velour (там полный набор velvet + logo/common)
let missing = [];
for (const a of [...usedAssets].sort()) {
  const src = path.join(VELOUR_ASSETS, a);
  if (!fs.existsSync(src)) { missing.push(a); continue; }
  fs.copyFileSync(src, path.join(OUT_ASSETS, a));
}
// брендовые файлы для листинга и мастера установки
for (const extra of ['maison-logo.svg']) {
  const src = path.join(VELOUR_ASSETS, extra);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(OUT_ASSETS, extra));
  else missing.push(extra);
}

fs.writeFileSync(
  path.join(OUT_BLOCKS, '_registry.json'),
  JSON.stringify(registry, null, 2),
  'utf8'
);

console.log('\nблоков:', registry.length);
console.log('ассетов скопировано:', usedAssets.size + 1);
if (missing.length) console.log('ОТСУТСТВУЮТ:', missing.join(', '));
else console.log('все ассеты на месте');

// контроль: не осталось ссылок на чужие домены в блоках
let bad = [];
for (const f of fs.readdirSync(OUT_BLOCKS)) {
  if (!f.endsWith('.json') || f === '_registry.json') continue;
  const c = fs.readFileSync(path.join(OUT_BLOCKS, f), 'utf8');
  const foreign = c.match(/https:\/\/[a-z0-9.\-]+\/[^"'\s)]+/g) || [];
  for (const u of foreign) {
    if (!/^https:\/\/cdn\.jsdelivr\.net\/gh\/lyubav4ik\/maison-marketplace-app@v0\.1\//.test(u)
      && !/^https:\/\/fonts\.googleapis/.test(u)
      && !/^https:\/\/fonts\.gstatic/.test(u)
      && !/^https:\/\/images\.unsplash/.test(u)) {
      bad.push(f + ' -> ' + u.slice(0, 90));
    }
  }
}
console.log(bad.length ? 'ЧУЖИЕ ССЫЛКИ:\n' + bad.join('\n') : 'контроль ссылок пройден');
