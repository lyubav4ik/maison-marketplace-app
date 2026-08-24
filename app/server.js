const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const VERSION = '1.0.0';
const B24_OAUTH = 'https://oauth.bitrix.info/oauth/token';
const APP_NAME = 'MAISON — интернет-магазин женской одежды';
const BLOCKS_DIR = path.join(ROOT, 'blocks');
const PAGES = require('./pages');

function loadConfig() {
  let cfg = {};
  const cfgPath = path.join(ROOT, 'config.json');
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (e) { cfg = {}; }
  return cfg;
}
const CONFIG = loadConfig();

const CLIENT_ID = process.env.MAISON_CLIENT_ID || CONFIG.client_id || '';
const CLIENT_SECRET = process.env.MAISON_CLIENT_SECRET || CONFIG.client_secret || '';
const APP_URL = (process.env.APP_URL || CONFIG.app_url || ('http://localhost:' + PORT)).replace(/\/$/, '');

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.html': 'text/html; charset=utf-8',
};

function send(res, code, type, body, headers) {
  const h = { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', ...headers };
  res.writeHead(code, h);
  res.end(body);
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log('[' + ts + '] ' + msg);
}

function sendJson(res, code, obj) {
  send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj), { 'Cache-Control': 'no-store' });
}

function sendHtml(res, code, title, body) {
  const html = '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>' + title + '</title>' +
    '<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b0d;color:#f2efe9;margin:0;padding:40px 16px;display:flex;justify-content:center}' +
    '.card{background:#161619;border:1px solid #26262b;border-radius:16px;max-width:560px;width:100%;padding:28px}h1{font-size:20px;margin:0 0 12px;color:#e9e4dc}' +
    'p{line-height:1.55;margin:8px 0}.muted{color:#8f8c86;font-size:13px}.ok{color:#7fd694;font-weight:600}</style></head><body><div class="card">' + body + '</div></body></html>';
  send(res, code, 'text/html; charset=utf-8', html);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'NOT_FOUND', path: path.basename(filePath) });
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, MIME[ext] || 'application/octet-stream', data);
  });
}

function requestJson(url, postData) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = postData ? JSON.stringify(postData) : null;
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: postData ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => resolve(body));
    req.on('error', () => resolve(''));
  });
}

function parseBody(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) {}
  try {
    const sp = new URLSearchParams(raw);
    const out = {};
    for (const [k, v] of sp) {
      const m = k.match(/^([^\[\]]+)(?:\[([^\[\]]+)\])*$/);
      if (m && k.indexOf('[') >= 0) {
        const parts = [];
        for (const part of k.match(/\[([^\]]*)\]/g) || []) parts.push(part.slice(1, -1));
        if (!out[m[1]]) out[m[1]] = {};
        let cur = out[m[1]];
        for (let i = 0; i < parts.length - 1; i++) {
          if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
          cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = v;
      } else {
        out[k] = v;
      }
    }
    return out;
  } catch (e) {}
  return {};
}

function saveAuth(auth) {
  const dir = path.join(ROOT, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'installs.json');
  let all = {};
  try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { all = {}; }
  const key = auth.member_id || 'unknown';
  all[key] = { ...(all[key] || {}), ...auth, savedAt: Date.now() };
  fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf8');
  return file;
}

function saveInstallSite(auth, siteId) {
  const file = path.join(ROOT, 'data', 'installs.json');
  let all = {};
  try { all = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { all = {}; }
  const key = auth.member_id || 'unknown';
  all[key] = { ...(all[key] || {}), siteId, savedAt: Date.now() };
  fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf8');
  return file;
}

function loadInstalls() {
  const file = path.join(ROOT, 'data', 'installs.json');
  try {
    const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) || {};
  } catch (e) { return {}; }
}

async function siteExists(token, domain, siteId) {
  try {
    const r = await callRest(domain, token, 'landing.site.getList', {
      params: {
        select: ['ID', 'TYPE'],
        filter: { '=ID': Number(siteId), '=DELETED': 'N' },
        limit: 1,
      },
    });
    return !!(r.body && r.body.result && r.body.result.length > 0);
  } catch (e) {
    return false;
  }
}

async function fetchPublicUrl(install) {
  try {
    const r = await callRest(install.domain, install.access_token, 'landing.site.getPublicUrl', { id: install.siteId });
    if (r.body && r.body.result) {
      if (typeof r.body.result === 'string') return r.body.result;
      if (typeof r.body.result === 'object') return r.body.result[install.siteId] || '';
    }
  } catch (e) {}
  return '';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- страницы приложения (тёмный люкс MAISON) ----------

function appPageHtml(data) {
  const q = (url) => esc(url || '');
  const rows = (data.rows || []).map((r) => {
    const d = q(r.domain);
    const shopLinks = [
      { href: q(r.catalogUrl) || ('https://' + d + '/shop/catalog/'), icon: '&#128100;', t: 'Каталог', s: 'товары и торговые предложения' },
      { href: 'https://' + d + '/shop/stores/', icon: '&#127980;', t: 'Магазины', s: 'настройки витрины' },
      { href: 'https://' + d + '/crm/', icon: '&#129309;', t: 'CRM', s: 'клиенты и сделки' },
    ].map((l) => '<a class="ql" href="' + l.href + '" target="_blank" rel="noopener"><span class="ql__ic">' + l.icon + '</span><span class="ql__tx"><b>' + l.t + '</b><small>' + l.s + '</small></span><span class="ql__arr">&#8599;</span></a>').join('');
    return `
        <div class="card">
          <div class="card__head">
            <span class="dot is-ok"></span>
            <span class="card__status">Магазин работает</span>
          </div>
          <h1 class="card__title">Ваш бутик MAISON готов</h1>
          <p class="card__sub">Витрина, каталог и страницы уже в вашем Битрикс24${r.publicUrl ? '' : '. Публикация сайта появится после снятия тарифного лимита'}.</p>
          <div class="card__actions">
            ${r.publicUrl ? '<a class="btn btn--primary" href="' + q(r.publicUrl) + '" target="_blank" rel="noopener">Открыть сайт</a>' : '<span class="btn btn--ghost">Сайт пока не опубликован</span>'}
            <a class="btn btn--secondary" href="${q(r.editUrl)}" target="_blank" rel="noopener">Редактировать сайт</a>
          </div>
        </div>
        <div class="card">
          <h2 class="card__label">Управление магазином</h2>
          <div class="ql-grid">${shopLinks}</div>
        </div>
        <div class="card">
          <h2 class="card__label">Что дальше</h2>
          <div class="features" style="margin-bottom:0">
            <div class="feature"><span class="feature__ic">1</span><span>Замените демо-товары своими<small>раздел Магазин → Каталог, фото загрузите к товарам</small></span></div>
            <div class="feature"><span class="feature__ic">2</span><span>Настройте оплату и доставку<small>Магазин → Настройки → Платёжные системы и службы доставки</small></span></div>
            <div class="feature"><span class="feature__ic">3</span><span>Меняйте дизайн витрины<small>Сайты → ваш магазин: 18 блоков MAISON в категории бренда</small></span></div>
          </div>
        </div>`;
  }).join('\n');
  return pageShell('MAISON — панель управления', 'управление', 'MAISON', rows ||
    '<div class="card"><h1 class="card__title">Приложение ещё не установлено</h1><p class="card__sub">Установите MAISON, чтобы создать интернет-магазин: витрину, каталог и страницы.</p></div>') +
    '\n<script src="//api.bitrix24.tech/api/v1/"></script>\n<script>try{BX24.init(function(){BX24.fitWindow();});}catch(e){}</script>';
}

function installMasterHtml() {
  const body = `
    <div class="card">
      <h1 class="card__title">Установка интернет-магазина</h1>
      <p class="card__sub">Приложение MAISON создаст в вашем Битрикс24 готовый интернет-магазин женской одежды: витрину, демо-каталог и блоки конструктора.</p>
      <div class="features">
        <div class="feature"><span class="feature__ic">&#10003;</span><span>Сайт-витрина<small>тип STORE, публикуется автоматически</small></span></div>
        <div class="feature"><span class="feature__ic">&#10003;</span><span>10 страниц<small>главная, каталог, карточка товара, о бренде, доставка, возврат и другие</small></span></div>
        <div class="feature"><span class="feature__ic">&#10003;</span><span>18 премиум-блоков<small>шапка, баннер, карточки товаров, FAQ, карта и прочее</small></span></div>
        <div class="feature"><span class="feature__ic">&#10003;</span><span>Демо-каталог<small>6 разделов и 30 товаров с торговыми предложениями</small></span></div>
      </div>
      <button id="install-btn" class="btn"><span class="spinner"></span><span class="lbl">Установить магазин</span></button>
      <div id="status" class="status"></div>
    </div>
    <div class="note">Корзина, оформление заказа и личный кабинет работают штатно через магазин Битрикс24. Установка займёт несколько минут.</div>
    <div class="meta">v${VERSION}</div>

  <script src="//api.bitrix24.tech/api/v1/"></script>
  <script>
  (function(){
    var btn = document.getElementById('install-btn');
    var statusEl = document.getElementById('status');

    function setStatus(text, cls){
      statusEl.textContent = text;
      statusEl.className = 'status is-on' + (cls ? ' is-' + cls : '');
    }
    function hideStatus(){ statusEl.className = 'status'; }
    function setBusy(busy){
      btn.disabled = busy;
      btn.classList.toggle('is-busy', busy);
    }

    function sendAuth(auth){
      setBusy(true);
      setStatus('Создаём сайт, каталог и страницы в Битрикс24…');
      attemptInstall(auth, 0);
    }

    function attemptInstall(auth, attempt) {
      console.log('[MAISON] attemptInstall attempt=' + attempt);
      fetch('/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: auth.access_token,
          refresh_token: auth.refresh_token,
          expires_in: auth.expires_in,
          member_id: auth.member_id,
          domain: auth.domain,
          scope: auth.scope,
          client_endpoint: auth.client_endpoint
        })
      }).then(function(r){
        console.log('[MAISON] fetch response status:', r.status);
        return r.text();
      }).then(function(text){
        console.log('[MAISON] fetch response text:', text.substring(0, 200));
        var data = null;
        try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
        if (data && (data.status === 'success' || data.status === 'ok')) {
          console.log('[MAISON] success!');
          setStatus('Магазин установлен! Завершаем установку приложения…', 'ok');
          try { BX24.installFinish(); } catch(e) {}
        } else if (data && (data.code === 'BH_APP_STARTING' || (data.raw && data.raw.includes('BH_APP_STARTING')) || (typeof text === 'string' && text.includes('BH_APP_STARTING')))) {
          var delay = data.retryAfter ? data.retryAfter * 1000 : 3000;
          if (attempt < 10) {
            console.log('[MAISON] BH_APP_STARTING, retry in ' + delay + 'ms');
            setStatus('Сервер запускается, подождите ' + Math.ceil(delay/1000) + 'с… (попытка ' + (attempt + 1) + '/10)');
            setTimeout(function() { attemptInstall(auth, attempt + 1); }, delay);
          } else {
            setStatus('Превышено время ожидания. Попробуйте установить ещё раз.', 'error');
            setBusy(false);
          }
        } else {
          var err = data && (data.error || data.raw || data.message);
          if (err && typeof err === 'object') err = JSON.stringify(err);
          console.log('[MAISON] error:', err);
          setStatus('Ошибка установки: ' + (err || 'неизвестная ошибка'), 'error');
          setBusy(false);
        }
      }).catch(function(e){
        console.error('[MAISON] network error:', e);
        setStatus('Ошибка сети: ' + (e && e.message || 'неизвестная'), 'error');
        setBusy(false);
      });
    }

    function install(){
      hideStatus();
      setBusy(true);
      setStatus('Подключение к вашему Битрикс24…');
      try {
        BX24.init(function(){
          var auth = BX24.getAuth();
          if (!auth || !auth.access_token) {
            setStatus('Не удалось получить доступ к порталу. Закройте это окно и нажмите «Установить» в Маркетплейсе ещё раз.', 'error');
            setBusy(false);
            return;
          }
          sendAuth(auth);
        });
      } catch(e) {
        setStatus('Битрикс24 не найден в этом окне. Нажмите «Установить» в Маркетплейсе, чтобы открыть мастер установки.', 'error');
        setBusy(false);
      }
    }

    btn.addEventListener('click', install);
  })();
  </script>`;
  return pageShell('MAISON — установка магазина', 'мастер установки', 'MAISON', body);
}

function pageShell(title, tag, brand, inner) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    font-family:'Montserrat',-apple-system,'Segoe UI',Roboto,sans-serif;
    background:
      radial-gradient(1100px 550px at 88% -8%, rgba(201,169,110,.14), transparent 60%),
      radial-gradient(900px 480px at -8% 108%, rgba(255,255,255,.06), transparent 55%),
      linear-gradient(160deg,#101013 0%,#0a0a0c 60%,#0f0f12 100%);
    color:#f2efe9;min-height:100vh;padding:32px 16px;
    display:flex;justify-content:center;align-items:flex-start;
  }
  .wrap{width:100%;max-width:560px;display:flex;flex-direction:column;gap:18px}
  .brand{display:flex;align-items:center;gap:12px;padding:4px 6px}
  .brand__logo{
    font-family:'Playfair Display',serif;font-weight:700;font-size:22px;letter-spacing:.28em;
    color:#f2efe9;text-transform:uppercase;
  }
  .brand__tag{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8f8c86;border:1px solid rgba(255,255,255,.16);padding:3px 10px;border-radius:99px}
  .card{
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.12);
    border-radius:22px;padding:28px 24px;
    backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
    box-shadow:0 20px 60px rgba(0,0,0,.5);
  }
  .card__head{display:flex;align-items:center;gap:9px;margin-bottom:14px}
  .dot{width:10px;height:10px;border-radius:50%;display:inline-block}
  .dot.is-ok{background:#7fd694;box-shadow:0 0 0 4px rgba(127,214,148,.15),0 0 16px rgba(127,214,148,.5)}
  .card__status{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#a9dfb7}
  .card__title{font-family:'Playfair Display',serif;font-size:26px;line-height:1.2;margin:0 0 10px}
  .card__sub{color:#b3afa7;font-size:14px;margin:0 0 22px;line-height:1.6}
  .features{display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:22px}
  .feature{display:flex;align-items:center;gap:10px;font-size:13.5px;color:#ddd9d1}
  .feature__ic{flex:none;width:22px;height:22px;border-radius:7px;background:rgba(201,169,110,.14);color:#c9a96e;display:flex;align-items:center;justify-content:center;font-size:12px}
  .feature small{display:block;color:#8f8c86;font-size:12px;margin-top:1px}
  .btn{
    display:inline-flex;align-items:center;justify-content:center;gap:10px;
    font-family:inherit;font-size:15px;font-weight:600;color:#0b0b0d;cursor:pointer;
    width:100%;padding:16px 18px;border-radius:16px;border:1px solid transparent;
    background:linear-gradient(135deg,#f4f0e8,#d9d2c4);
    box-shadow:0 12px 30px rgba(217,210,196,.18);
    transition:transform .18s ease, box-shadow .18s ease, filter .18s ease;
    text-decoration:none;
  }
  .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 16px 36px rgba(217,210,196,.28)}
  .btn:disabled{opacity:.7;cursor:default;filter:saturate(.7)}
  .btn .spinner{display:none;width:16px;height:16px;border:2px solid rgba(11,11,13,.35);border-top-color:#0b0b0d;border-radius:50%;animation:spin .8s linear infinite}
  .btn.is-busy .spinner{display:inline-block}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn--secondary{background:rgba(255,255,255,.08);color:#f2efe9;border-color:rgba(255,255,255,.2);box-shadow:none}
  .btn--secondary:hover{background:rgba(255,255,255,.14)}
  .btn--ghost{background:rgba(255,255,255,.04);color:#8f8c86;cursor:default;box-shadow:none}
  .status{display:none;margin-top:14px;padding:12px 14px;border-radius:12px;font-size:13px;line-height:1.5;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#b3afa7}
  .status.is-on{display:block}
  .status.is-ok{color:#a9dfb7;border-color:rgba(127,214,148,.3);background:rgba(127,214,148,.07)}
  .status.is-error{color:#ffb4a3;border-color:rgba(255,120,90,.35);background:rgba(255,120,90,.08)}
  .note{text-align:center;font-size:11.5px;color:#6d6a64;line-height:1.5}
  .meta{text-align:center;font-size:11px;color:#6d6a64}
  .card__label{font-family:'Playfair Display',serif;font-size:19px;margin:0 0 14px}
  .ql-grid{display:grid;grid-template-columns:1fr;gap:10px}
  .ql{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;text-decoration:none;
      background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
      transition:transform .16s ease, background .16s ease, border-color .16s ease}
  .ql:hover{transform:translateY(-2px);background:rgba(255,255,255,.08);border-color:rgba(201,169,110,.35)}
  .ql__ic{flex:none;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;
          font-size:16px;background:rgba(201,169,110,.13);color:#c9a96e}
  .ql__tx{display:flex;flex-direction:column;min-width:0;flex:1}
  .ql__tx b{font-size:13.5px;font-weight:600;color:#f2efe9}
  .ql__tx small{font-size:11.5px;color:#8f8c86;margin-top:1px}
  .ql__arr{color:#6d6a64;font-size:13px;transition:color .16s ease, transform .16s ease}
  .ql:hover .ql__arr{color:#c9a96e;transform:translate(1px,-1px)}
  @media (min-width:480px){ .ql-grid{grid-template-columns:1fr 1fr} .ql:nth-child(odd):last-child{grid-column:1/-1} }
  @media (min-width:560px){ .card__actions{flex-direction:row;display:flex} .card__actions .btn{flex:1} }
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><span class="brand__logo">${brand}</span><span class="brand__tag">${tag}</span></div>
    ${inner}
  </div>
</body>
</html>`;
}

function flattenParams(obj, prefix) {
  const result = {};
  for (const key of Object.keys(obj || {})) {
    const fullKey = prefix ? prefix + '[' + key + ']' : key;
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenParams(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }

  // Диагностика: сохраняем лог провижининга в запись портала (виден на /app?debug=1)
  try {
    const installs = loadInstalls();
    for (const key of Object.keys(installs)) {
      if (installs[key] && installs[key].member_id === memberId) {
        installs[key].lastLog = (result.log || []).slice(-120);
      }
    }
    fs.writeFileSync(path.join(ROOT, 'data', 'installs.json'), JSON.stringify(installs, null, 2), 'utf8');
  } catch (e) { /* не критично */ }

  return result;
}
function requestForm(url, postData) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const flat = flattenParams(postData);
    const data = Object.keys(flat).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(flat[k])).join('&');
    const options = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function callRest(endpoint, token, method, params) {
  const base = 'https://' + endpoint + '/rest/' + method + '.json';
  const body = { auth: token, ...params };
  return requestJson(base, body);
}

function batchRest(endpoint, token, cmd) {
  return requestJson('https://' + endpoint + '/rest/batch.json', { auth: token, halt: 0, cmd });
}

function getBlocks() {
  const files = fs.readdirSync(BLOCKS_DIR).filter((f) => f.endsWith('.json') && f !== '_registry.json');
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(BLOCKS_DIR, f), 'utf8')));
}

function oauthRequest(params) {
  return new Promise((resolve, reject) => {
    const data = querystring.stringify(params);
    const u = new URL(B24_OAUTH);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data);
    req.end();
  });
}

async function exchangeCode(code) {
  return oauthRequest({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: APP_URL + '/install',
    scope: 'landing,catalog,sale,user_brief',
  });
}

function refreshToken(domain, refreshTokenVal) {
  return oauthRequest({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refreshTokenVal,
    redirect_uri: APP_URL + '/install',
    scope: 'landing,catalog,sale,user_brief',
  });
}

async function importProducts(domain, token, refreshTokenVal, memberId, log) {
  const result = { count: 0, errors: [] };

  // ID инфоблока торгового каталога
  let iblockId = 1;
  try {
    const catRes = await callRest(domain, token, 'catalog.catalog.get', { id: 1 });
    if (catRes.body && catRes.body.result && catRes.body.result.IBLOCK_ID) {
      iblockId = catRes.body.result.IBLOCK_ID;
      log.push('catalog iblockId: ' + iblockId);
    } else {
      const listRes = await callRest(domain, token, 'catalog.catalog.list', {});
      if (listRes.body && listRes.body.result && listRes.body.result.length > 0) {
        iblockId = listRes.body.result[0].IBLOCK_ID || 1;
        log.push('catalog iblockId from list: ' + iblockId);
      }
    }
  } catch (e) {
    log.push('get iblockId failed, using default 1: ' + e.message);
  }

  // Разделы каталога
  const sections = [
    { name: 'Платья', code: 'dresses', sort: 10 },
    { name: 'Топы и блузы', code: 'tops', sort: 20 },
    { name: 'Брюки и юбки', code: 'bottoms', sort: 30 },
    { name: 'Верхняя одежда', code: 'outerwear', sort: 40 },
    { name: 'Обувь', code: 'shoes', sort: 50 },
    { name: 'Аксессуары', code: 'accessories', sort: 60 },
  ];

  const sectionIds = {};
  for (const sec of sections) {
    const r = await callRest(domain, token, 'catalog.section.add', {
      fields: {
        NAME: sec.name,
        CODE: sec.code,
        SORT: sec.sort,
        ACTIVE: 'Y',
        IBLOCK_ID: iblockId,
        iblockId: iblockId,
      },
    });
    if (r.body && r.body.result) {
      sectionIds[sec.code] = r.body.result;
      log.push('section created: ' + sec.name + ' #' + r.body.result);
    } else {
      log.push('section fail: ' + sec.name + ' ' + JSON.stringify(r.body));
    }
  }

  // Демо-товары
  const products = [
    { name: 'Платье шёлковое «Вечерняя звезда»', price: 21500, section: 'dresses', desc: 'Шёлковое платье с глубоким декольте и расклешенной юбкой. Идеально для вечернего выхода.' },
    { name: 'Платье вязаное «Уютный вечер»', price: 14900, section: 'dresses', desc: 'Мягкое вязаное платье оверсайз. Тёплое и удобное для повседневной носки.' },
    { name: 'Платье хлопковое «Летний бриз»', price: 9900, section: 'dresses', desc: 'Лёгкое хлопковое платье с цветочным принтом. Отличный выбор для жаркого дня.' },
    { name: 'Платье бархатное «Королева ночи»', price: 32000, section: 'dresses', desc: 'Роскошное бархатное платье с высоким воротом и длинным рукавом. Для особых случаев.' },
    { name: 'Платье льняное «Натуральный стиль»', price: 16800, section: 'dresses', desc: 'Натуральный лён, свободный крой. Комфорт и стиль в одном.' },
    { name: 'Блуза шёлковая «Нежность»', price: 18900, section: 'tops', desc: 'Струящаяся шёлковая блуза с бантом на шее. Деловой и женственный образ.' },
    { name: 'Топ хлопковый «Базовый»', price: 4900, section: 'tops', desc: 'Идеальный базовый топ из премиального хлопка. Сочетается с чем угодно.' },
    { name: 'Боди джинсовое «Свобода»', price: 12500, section: 'tops', desc: 'Джинсовое боди с застежкой на пуговицы. Стильно и практично.' },
    { name: 'Рубашка льняная «Лёгкость»', price: 15600, section: 'tops', desc: 'Натуральный лён, свободный крой. Классика женского гардероба.' },
    { name: 'Кардиган кашемировый «Облако»', price: 28900, section: 'tops', desc: 'Невесомый кашемир. Тёплый, мягкий, невероятно приятный к телу.' },
    { name: 'Брюки классические «Деловой код»', price: 12400, section: 'bottoms', desc: 'Идеальная посадка, ткань с эластаном. Не сковывают движений.' },
    { name: 'Юбка плиссе «Танец»', price: 9900, section: 'bottoms', desc: 'Лёгкая плиссированная юбка миди. Движется вместе с вами.' },
    { name: 'Джинсы высокой посадки «Любимые»', price: 16500, section: 'bottoms', desc: 'Премиальный деним, идеальная посадка. Стираются без потери формы.' },
    { name: 'Шорты тёмные «Лето в городе»', price: 8900, section: 'bottoms', desc: 'Удобные шорты из твида. С карманами и ремнём в комплекте.' },
    { name: 'Брюки широкие «Поток»', price: 14200, section: 'bottoms', desc: 'Широкий крой, высокий пояс. Элегантно и удобно.' },
    { name: 'Пальто шерстяное «Графит»', price: 34900, section: 'outerwear', desc: 'Шерстяное пальто прямого силуэта с лацканами. Двухслойная итальянская шерсть.' },
    { name: 'Куртка пуховая «Снежная королева»', price: 42000, section: 'outerwear', desc: 'Лёгкая и тёплая. Натуральный пух, ветрозащитная ткань.' },
    { name: 'Тренч классический «Лондон»', price: 29500, section: 'outerwear', desc: 'Водоотталкивающая ткань, съёмная подкладка. Классика жанра.' },
    { name: 'Жилет шерстяной «Уют»', price: 14200, section: 'outerwear', desc: 'Безрукавный жилет из шерсти. Идеален для слоёного образа.' },
    { name: 'Пальто кашемировое «Роскошь»', price: 89000, section: 'outerwear', desc: '100% кашемир. Невесомая теплота. Инвестиция в себя.' },
    { name: 'Ботинки кожаные «Ходьба»', price: 24500, section: 'shoes', desc: 'Натуральная кожа, удобная подошва. Для долгих прогулок.' },
    { name: 'Туфли на шпильке «Вечер»', price: 18900, section: 'shoes', desc: 'Классические туфли 8 см. Стабильная шпилька, мягкая стелька.' },
    { name: 'Кеды на платформе «Ритм»', price: 12900, section: 'shoes', desc: 'Модная платформа 4 см. Ткань и кожа. Удобство весь день.' },
    { name: 'Сапоги высокие «Осенний дождь»', price: 21500, section: 'shoes', desc: 'Водонепроницаемые, с меховой подкладкой. Стильно и тепло.' },
    { name: 'Лоферы классические «Офис»', price: 16800, section: 'shoes', desc: 'Натуральная кожа, мягкая подкладка. Элегантность и комфорт.' },
    { name: 'Сумка кожаная «Ежедневная»', price: 28500, section: 'accessories', desc: 'Просторная сумка из натуральной кожи. Вместит ноутбук и документы.' },
    { name: 'Шарф шёлковый «Акцент»', price: 6500, section: 'accessories', desc: 'Натуральный шёлк, ручная роспись. Яркий акцент образа.' },
    { name: 'Ремень кожаный «Структура»', price: 4200, section: 'accessories', desc: 'Натуральная кожа, классическая пряжка. Базовый аксессуар.' },
    { name: 'Очки солнцезащитные «Стиль»', price: 9500, section: 'accessories', desc: 'УФ-защита 400, поляризация. Модная оправа.' },
    { name: 'Бижутерия набор «Сияние»', price: 12500, section: 'accessories', desc: 'Серьги, кольцо, браслет. Ювелирное стекло.' },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const sectionId = sectionIds[p.section];
    if (!sectionId) continue;

    const prodRes = await callRest(domain, token, 'catalog.product.add', {
      fields: {
        NAME: p.name,
        PRICE: p.price,
        CURRENCY: 'RUB',
        SECTION_ID: sectionId,
        IBLOCK_ID: iblockId,
        iblockId: iblockId,
        ACTIVE: 'Y',
        DETAIL_TEXT: p.desc,
        PREVIEW_TEXT: p.desc.slice(0, 200),
      },
    });

    if (prodRes.body && prodRes.body.result) {
      const productId = prodRes.body.result;
      result.count++;
      log.push('product created: ' + p.name + ' #' + productId + ' (' + p.price + ' ₽)');

      // Торговые предложения по цвету и размеру
      const colors = ['Чёрный', 'Бежевый', 'Синий', 'Белый'];
      const sizes = ['XS', 'S', 'M', 'L', 'XL'];

      for (const color of colors) {
        for (const size of sizes) {
          if (Math.random() > 0.7) continue;

          const skuRes = await callRest(domain, token, 'catalog.product.add', {
            fields: {
              NAME: p.name + ' ' + color + ' / ' + size,
              PRICE: p.price,
              CURRENCY: 'RUB',
              SECTION_ID: sectionId,
              IBLOCK_ID: iblockId,
              iblockId: iblockId,
              ACTIVE: 'Y',
              TYPE: 2,
              DETAIL_TEXT: p.desc,
              PARENT_ID: productId,
              PROPERTY_VALUES: {
                COLOR: color,
                SIZE: size,
              },
            },
          });
          if (skuRes.body && skuRes.body.result) {
            log.push('  sku: ' + color + ' / ' + size + ' #' + skuRes.body.result);
          }
        }
      }
    } else {
      result.errors.push(p.name + ': ' + JSON.stringify(prodRes.body));
      log.push('product fail: ' + p.name + ' ' + JSON.stringify(prodRes.body).slice(0, 200));
    }

    if (i % 5 === 0) await new Promise(r => setTimeout(r, 100));
  }

  return result;
}

async function provisionPortal(memberId, token, domain, refreshTokenVal) {
  const log = [];
  const result = { memberId, domain, siteId: null, published: false, blocks: 0, pages: 0, pageBlocks: 0, log };
  let currentToken = token;

  // 1. Регистрируем все премиум-блоки.
  // Ассеты в определениях лежат плейсхолдером __ASSETS__/ — при регистрации
  // подставляем актуальную базу (свой сервер /assets/ или CDN через env).
  const ASSET_BASE = (process.env.MAISON_ASSETS || APP_URL + '/assets').replace(/\/$/, '');
  const subAssets = (s) => typeof s === 'string' ? s.split('__ASSETS__/').join(ASSET_BASE + '/') : s;
  const repoIds = {};
  const repoContent = {};
  const blocks = getBlocks();
  for (const b of blocks) {
    const fields = JSON.parse(subAssets(JSON.stringify(b.fields)));
    const manifest = JSON.parse(subAssets(JSON.stringify(b.manifest)));
    const r = await callRest(domain, currentToken, 'landing.repo.register', {
      fields,
      manifest,
      code: b.code,
      addblock: b.code,
      addblock_name: fields.NAME,
    });
    if (r.body && r.body.result) {
      repoIds[b.code] = r.body.result;
      repoContent[b.code] = fields.CONTENT || '';
      result.blocks++;
    } else {
      log.push('block fail: ' + fields.NAME + ' ' + JSON.stringify(r.body));
    }
  }

  // Обновляем токен перед долгой частью
  if (result.blocks > 0 && refreshTokenVal && CLIENT_ID && CLIENT_SECRET) {
    log.push('refreshing token before pages...');
    const refreshed = await refreshToken(domain, refreshTokenVal);
    if (refreshed.access_token) {
      currentToken = refreshed.access_token;
      saveAuth({
        member_id: memberId, domain: domain,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || refreshTokenVal,
        expires_in: refreshed.expires_in,
      });
      log.push('token refreshed, expires_in=' + refreshed.expires_in);
    } else {
      log.push('token refresh failed: ' + JSON.stringify(refreshed).slice(0, 200));
    }
  }

  // 2. Создаём сайт-витрину (защита от занятого кода при повторной установке)
  let siteCode = 'maison';
  let site = await callRest(domain, currentToken, 'landing.site.add', {
    fields: { TITLE: 'MAISON', CODE: siteCode, TYPE: 'STORE', ACTIVE: 'Y' },
  });
  if (!site.body || !site.body.result) {
    const errStr = JSON.stringify(site.body || {});
    log.push('site add with code "' + siteCode + '" failed, retrying with unique code: ' + errStr.slice(0, 150));
    siteCode = 'maison-' + Date.now().toString(36);
    site = await callRest(domain, currentToken, 'landing.site.add', {
      fields: { TITLE: 'MAISON', CODE: siteCode, TYPE: 'STORE', ACTIVE: 'Y' },
    });
  }
  if (site.body && site.body.result) {
    result.siteId = site.body.result;
    log.push('site ok: #' + site.body.result + ' code=' + siteCode);
  } else {
    log.push('site fail: ' + JSON.stringify(site.body));
  }

  // 3. Каталог и товары
  if (result.siteId) {
    if (refreshTokenVal && CLIENT_ID && CLIENT_SECRET) {
      log.push('importing demo products...');
      const productsResult = await importProducts(domain, currentToken, refreshTokenVal, memberId, log);
      result.products = productsResult.count;
      log.push('products imported: ' + productsResult.count);
    }

    // 4. Страницы из карты PAGES (массив blocks идёт снизу вверх)
    let indexLid = null;
    for (const page of PAGES) {
      const lp = await callRest(domain, currentToken, 'landing.landing.add', {
        fields: { TITLE: page.title, SITE_ID: result.siteId, CODE: page.code, ACTIVE: 'Y' },
      });
      if (!lp.body || !lp.body.result) {
        log.push('page fail: ' + page.code + ' ' + JSON.stringify(lp.body));
        continue;
      }
      const lid = lp.body.result;
      result.pages++;
      if (page.code === 'home') indexLid = lid;
      log.push('page ok: ' + page.code + ' #' + lid);

      // Массив blocks идёт снизу вверх (footer...header). addblock без
      // AFTER_ID вставляет блок НАВЕРХ страницы (проверено на двух
      // порталах), поэтому идём по массиву в прямом порядке: header
      // добавится последним и окажется сверху.
      const pageBlockIds = [];
      for (const bcode of page.blocks) {
        const codeField = repoIds[bcode] ? 'repo_' + repoIds[bcode] : bcode;
        const params = { lid, fields: { CODE: codeField }, ACTIVE: 'Y' };
        const ab = await callRest(domain, currentToken, 'landing.landing.addblock', params);
        if (ab.body && ab.body.result) {
          pageBlockIds.push({ bcode, id: ab.body.result });
          result.pageBlocks++;
        } else {
          log.push('  addblock FAIL: ' + bcode + ' resp=' + JSON.stringify(ab.body).slice(0, 200));
        }
      }

      // Обновляем токен в середине сборки страниц
      if (result.pages === 5 && refreshTokenVal && CLIENT_ID && CLIENT_SECRET) {
        log.push('refreshing token at page 5...');
        const refreshed = await refreshToken(domain, refreshTokenVal);
        if (refreshed.access_token) {
          currentToken = refreshed.access_token;
          saveAuth({
            member_id: memberId, domain: domain,
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || refreshTokenVal,
            expires_in: refreshed.expires_in,
          });
          log.push('token refreshed again, expires_in=' + refreshed.expires_in);
        }
      }
    }

    // 4b. Динамические ссылки на каталог. Правильный адрес страницы каталога
    // магазина: /shop/catalog/<ID торгового каталога>/ (даёт сам пользователь).
    // Узнаём ID через catalog.catalog.list и пропатчиваем все /katalog/ ссылки.
    try {
      let catPath = '';
      try {
        const cl = await callRest(domain, currentToken, 'catalog.catalog.list', {});
        const raw = cl.body && cl.body.result;
        log.push('catalog.catalog.list raw: ' + JSON.stringify(raw).slice(0, 300));
        const arr = Array.isArray(raw) ? raw
          : (raw && Array.isArray(raw.catalogs) ? raw.catalogs : []);
        const first = arr[0] || null;
        const ib = first && (first.IBLOCK_ID || first.ID || first.iblockId || first.id);
        if (ib) catPath = '/shop/catalog/' + ib + '/';
      } catch (e) {
        log.push('catalog.catalog.list unavailable: ' + (e.message || e));
      }
      if (!catPath) {
        const lst = await callRest(domain, currentToken, 'landing.landing.getList', {
          params: { select: ['ID', 'CODE', 'ADDRESS'], filter: { SITE_ID: result.siteId } },
        });
        const rows0 = (lst.body && lst.body.result) || [];
        const catRow = rows0.find((r) => r.CODE === 'katalog' && r.ADDRESS)
          || rows0.find((r) => /catalog/i.test(String(r.ADDRESS || '')));
        if (catRow && catRow.ADDRESS) {
          catPath = String(catRow.ADDRESS);
          if (!catPath.startsWith('/')) catPath = '/' + catPath;
          if (!/\/$/.test(catPath)) catPath += '/';
        }
      }
      if (catPath) {
        log.push('catalog address resolved: ' + catPath);
        if (catPath !== '/katalog/') {
          const lst2 = await callRest(domain, currentToken, 'landing.landing.getList', {
            params: { select: ['ID', 'CODE'], filter: { SITE_ID: result.siteId } },
          });
          const rows = (lst2.body && lst2.body.result) || [];
          const id2code = {};
          for (const [c, id] of Object.entries(repoIds)) id2code['repo_' + id] = c;
          for (const row of rows) {
            if (!row.ID) continue;
            const bl = await callRest(domain, currentToken, 'landing.block.getList', { params: { lid: Number(row.ID) } });
            const bls = (bl.body && bl.body.result) || [];
            for (const inst of bls) {
              const c0 = id2code[String(inst.CODE || '')];
              if (!c0 || !repoContent[c0] || !repoContent[c0].includes('/katalog/')) continue;
              const patched = repoContent[c0].split('/katalog/').join(catPath);
              const up = await callRest(domain, currentToken, 'landing.block.update', { id: inst.ID, fields: { CONTENT: patched } });
              if (!(up.body && up.body.result)) {
                log.push('  block.update fail #' + inst.ID + ' ' + JSON.stringify(up.body).slice(0, 150));
              }
            }
          }
          log.push('catalog links patched to ' + catPath);
        }
      } else {
        log.push('catalog address not found, keep /katalog/');
      }
    } catch (e) {
      log.push('catalog link patch error: ' + (e.message || e));
    }

    // 5. Главная страница и публикация
    if (indexLid) {
      const up = await callRest(domain, currentToken, 'landing.site.update', { id: result.siteId, fields: { LANDING_ID_INDEX: indexLid } });
      log.push('index set: ' + (up.body && up.body.result ? 'ok #' + indexLid : JSON.stringify(up.body)));
    }

    const pub = await callRest(domain, currentToken, 'landing.site.publication', { id: result.siteId });
    if (pub.body && pub.body.result) {
      result.published = true;
      log.push('site published: ' + JSON.stringify(pub.body.result));
    } else {
      const err = pub.body && pub.body.error;
      if (err === 'PUBLIC_SITE_REACHED') {
        log.push('site publish skipped: tariff limit reached (site created but not published)');
      } else {
        log.push('site publish fail: ' + JSON.stringify(pub.body));
      }
    }
  }

  return result;
}

const inFlightProvision = {};

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const q = new URL(req.url || '/', APP_URL).searchParams;
  const isHead = req.method === 'HEAD';
  log(req.method + ' ' + (req.url || '/') + ' UA=' + (req.headers['user-agent'] || '?'));

  function answer(code, type, body) {
    if (isHead) return send(res, code, type, '', { 'Content-Length': Buffer.byteLength(body) });
    return send(res, code, type, body);
  }

  if (url === '/status') {
    const body = JSON.stringify({ ok: true, app: 'maison', version: VERSION, time: Date.now() });
    return answer(200, 'application/json; charset=utf-8', body);
  }

  if (url === '/settings' || url === '/app' || url === '/index.html' || url === '/') {
    const requestDomain = String(q.get('DOMAIN') || q.get('domain') || '').replace(/^https?:\/\//, '').toLowerCase();
    const requestMember = String(q.get('MEMBER_ID') || q.get('member_id') || '');
    (async () => {
      try {
        const installs = loadInstalls();
        const members = Object.values(installs);
        let install = members.find((m) => requestMember && m.member_id === requestMember)
          || members.find((m) => requestDomain && String(m.domain || '').toLowerCase() === requestDomain)
          || (members.length === 1 ? members[0] : null);
        if (!install || !install.siteId) {
          const html = appPageHtml({ rows: [] });
          return answer(200, 'text/html; charset=utf-8', html);
        }
        const publicUrl = await fetchPublicUrl(install);
        let catalogUrl = 'https://' + install.domain + '/shop/catalog/';
        try {
          const cl = await callRest(install.domain, install.access_token, 'catalog.catalog.list', {});
          const first = cl.body && Array.isArray(cl.body.result) ? cl.body.result[0] : null;
          const ib = first && (first.IBLOCK_ID || first.id);
          if (ib) catalogUrl = 'https://' + install.domain + '/shop/catalog/' + ib + '/';
        } catch (e) { /* остаёмся на общем списке каталогов */ }
        const editUrl = 'https://' + install.domain + '/shop/stores/site/' + install.siteId + '/';
        let html = appPageHtml({
          rows: [{ domain: install.domain, siteId: install.siteId, publicUrl: publicUrl, editUrl: editUrl, catalogUrl: catalogUrl }]
        });
        if (q.get('debug') === '1' && Array.isArray(install.lastLog) && install.lastLog.length) {
          const pre = install.lastLog.map((l) => String(l)).join('\n');
          html += '\n<details style="max-width:860px;margin:24px auto;font-family:sans-serif"><summary style="cursor:pointer">Лог провижининга</summary><pre style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px;font-size:12px">' + pre.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])) + '</pre></details>';
        }
        return answer(200, 'text/html; charset=utf-8', html);
      } catch (e) {
        log('app page: exception ' + (e.stack || e.message || String(e)));
        const html = appPageHtml({ rows: [] });
        return answer(200, 'text/html; charset=utf-8', html);
      }
    })();
    return;
  }

  if (url === '/install') {
    if (req.method === 'POST') {
      (async () => {
        try {
          const raw = await readBody(req);
          const body = parseBody(raw);
          let auth = null;
          if (body.auth && typeof body.auth === 'object' && body.auth.access_token) {
            auth = body.auth;
          } else if (body.access_token) {
            auth = body;
          } else if (body.AUTH_ID) {
            auth = {
              access_token: body.AUTH_ID,
              refresh_token: body.REFRESH_ID,
              expires_in: body.AUTH_EXPIRES,
              member_id: body.member_id,
              domain: String(q.get('DOMAIN') || '').replace(/^https?:\/\//, ''),
              scope: body.APPLICATION_SCOPE,
              application_token: body.APPLICATION_TOKEN,
              client_endpoint: body.SERVER_ENDPOINT,
              status: body.status,
            };
          }
          log('install POST body keys=' + Object.keys(body).join(',') + ' hasAuth=' + (!!auth));
          const isJsonRequest = (req.headers['content-type'] || '').indexOf('application/json') !== -1;
          if (!auth) {
            log('install POST: no auth (health check)');
            return answer(200, 'text/html; charset=utf-8', installMasterHtml());
          }
          const domain = String(auth.domain || '').replace(/^https?:\/\//, '');
          const memberId = String(auth.member_id || '');
          log('install POST: member=' + memberId + ' domain=' + domain + ' json=' + isJsonRequest);
          saveAuth(auth);
          const existing = loadInstalls()[memberId];
          // Колбэк переустановки всегда провижинит заново (обновляет блоки/страницы/товары)
          const isCallback = !isJsonRequest;
          if (!isCallback && existing && existing.siteId && await siteExists(auth.access_token, domain, existing.siteId)) {
            log('install POST: site already exists #' + existing.siteId + ', skip provisioning (OAuth flow)');
            if (isJsonRequest) return sendJson(res, 200, { status: 'success', siteId: existing.siteId, blocks: existing.blocks || 0, reused: true });
            return answer(200, 'text/html; charset=utf-8', '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>OK</body></html>');
          }
          if (existing && existing.siteId) {
            log('install POST: stored site #' + existing.siteId + (isCallback ? ' (callback reinstall)' : ' no longer exists, re-provisioning'));
          }
          if (inFlightProvision[memberId]) {
            log('install POST: provisioning already in progress for member, waiting');
            const waitRes = await inFlightProvision[memberId];
            if (isJsonRequest) return sendJson(res, 200, { status: 'success', siteId: waitRes.siteId, blocks: waitRes.blocks, reused: true });
            return answer(200, 'text/html; charset=utf-8', installMasterHtml());
          }
          const provisionPromise = provisionPortal(memberId, auth.access_token, domain, auth.refresh_token)
            .catch((e) => { throw e; })
            .finally(() => { delete inFlightProvision[memberId]; });
          inFlightProvision[memberId] = provisionPromise;

          if (isJsonRequest) {
            // Ждём завершения провижининга (максимум 240с) и возвращаем результат
            try {
              const result = await Promise.race([
                provisionPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Provisioning timeout')), 240000))
              ]);
              if (result.siteId) saveInstallSite(auth, result.siteId);
              return sendJson(res, 200, {
                status: 'success',
                siteId: result.siteId,
                pages: result.pages,
                pageBlocks: result.pageBlocks,
                blocks: result.blocks,
                products: result.products || 0,
                published: result.published || false
              });
            } catch (e) {
              log('install POST JSON: provisioning failed ' + (e.message || String(e)));
              return sendJson(res, 200, { status: 'error', error: e && e.message ? String(e.message) : String(e) });
            }
          }

          // Для колбэка возвращаем мастер установки
          provisionPromise.then((result) => {
            if (result.siteId) saveInstallSite(auth, result.siteId);
            log('install POST bg: provision done site=' + result.siteId + ' pages=' + result.pages + ' pageBlocks=' + result.pageBlocks + ' blocks=' + result.blocks);
            if (result.log) result.log.forEach(function (l) { log('  ' + l); });
          }).catch((e) => { log('install POST bg: provision failed ' + (e.message || String(e))); });
          return answer(200, 'text/html; charset=utf-8', installMasterHtml());
        } catch (e) {
          log('install POST: exception ' + (e.stack || e.message || String(e)));
          if (isJsonRequest) return sendJson(res, 200, { status: 'error', error: e && e.message ? String(e.message) : String(e) });
          return answer(200, 'text/html; charset=utf-8', installMasterHtml());
        }
      })();
      return;
    }

    const code = q.get('code');
    if (!code) {
      log('install: no code param, serving install master');
      return answer(200, 'text/html; charset=utf-8', installMasterHtml());
    }
    (async () => {
      let html;
      try {
        log('install: exchanging code len=' + code.length + ' client_id=' + CLIENT_ID.slice(0, 8));
        const oauth = await exchangeCode(code);
        if (oauth.error) {
          log('install: oauth error: ' + JSON.stringify(oauth));
          html = '<h1>Ошибка авторизации</h1><p class="muted">' + esc(oauth.error_description || oauth.error) + '</p>';
        } else {
          const memberId = oauth.member_id || '';
          const domain = (oauth.domain || '').replace(/^https?:\/\//, '');
          log('install: oauth ok member=' + memberId + ' domain=' + domain);
          saveAuth(oauth);
          const checkToken = oauth.access_token;
          const existing = loadInstalls()[memberId];
          if (existing && existing.siteId && await siteExists(checkToken, domain, existing.siteId)) {
            log('install: site already exists #' + existing.siteId + ', skip provisioning');
            html = '<h1>Установка завершена</h1><p class="ok">Магазин уже установлен.</p><script>if(window.BX24){BX24.installFinish();}</script>';
            return answer(200, 'text/html; charset=utf-8', html);
          }
          if (existing && existing.siteId) {
            log('install: stored site #' + existing.siteId + ' no longer exists, re-provisioning');
          }
          let result;
          if (inFlightProvision[memberId]) {
            log('install: provisioning already in progress for member, waiting');
            result = await inFlightProvision[memberId];
          } else {
            const provisionPromise = provisionPortal(memberId, oauth.access_token, domain, oauth.refresh_token)
              .catch((e) => { throw e; })
              .finally(() => { delete inFlightProvision[memberId]; });
            inFlightProvision[memberId] = provisionPromise;
            provisionPromise.then((res) => {
              if (res.siteId) saveInstallSite(oauth, res.siteId);
              log('install bg: provision done site=' + res.siteId + ' blocks=' + res.blocks);
            }).catch((e) => { log('install bg: provision failed ' + (e.message || String(e))); });
            html = '<h1>Установка запущена</h1><p class="ok">Магазин создаётся, это займёт пару минут.</p>' +
              '<p class="muted">Откройте «Сайты и магазины» в левом меню портала, чтобы посмотреть магазин MAISON.</p>' +
              '<script>if(window.BX24){BX24.installFinish();}</script>';
            return answer(200, 'text/html; charset=utf-8', html);
          }
          if (result.siteId) saveInstallSite(oauth, result.siteId);
          log('install: provision done site=' + result.siteId + ' blocks=' + result.blocks);
          log(result.log.join('\n'));
          const ok = result.siteId ? '<p class="ok">Магазин и ' + result.blocks + ' блоков установлены.</p>' : '<p>Установка завершена.</p>';
          html = '<h1>Установка завершена</h1>' + ok +
            '<p class="muted">Откройте «Сайты и магазины» в левом меню портала, чтобы посмотреть магазин MAISON.</p>' +
            '<script>if(window.BX24){BX24.installFinish();}</script>';
        }
      } catch (e) {
        log('install: exception ' + (e.stack || e.message || String(e)));
        html = '<h1>Ошибка установки</h1><p class="muted">' + esc(e.message || String(e)) + '</p>';
      }
      return answer(200, 'text/html; charset=utf-8', html);
    })();
    return;
  }

  if (url === '/uninstall') {
    (async () => {
      try {
        const raw = await readBody(req);
        const body = parseBody(raw);
        const auth = body.auth || body;
        const memberId = String(auth.member_id || auth.MEMBER_ID || '').trim();
        const domain = String(auth.domain || auth.DOMAIN || '').replace(/^https?:\/\//, '').toLowerCase().trim();
        const installs = loadInstalls();
        let removed = 0;
        for (const key of Object.keys(installs)) {
          const rec = installs[key] || {};
          const recDomain = String(rec.domain || '').toLowerCase();
          if ((memberId && rec.member_id === memberId) || (domain && recDomain === domain)) {
            delete installs[key];
            removed++;
          }
        }
        if (removed > 0) fs.writeFileSync(path.join(ROOT, 'data', 'installs.json'), JSON.stringify(installs, null, 2), 'utf8');
        log('uninstall: removed=' + removed + ' member=' + memberId + ' domain=' + domain);
      } catch (e) {
        log('uninstall handler error: ' + (e.stack || e.message || e));
      }
    })();
    const body = '<h1>Приложение удалено</h1><p class="muted">Спасибо, что пользовались MAISON.</p>';
    return answer(200, 'text/html; charset=utf-8', body);
  }

  if (url.startsWith('/assets/')) {
    const rel = url.replace(/^\/assets\//, '');
    const filePath = path.resolve(ROOT, 'assets', rel);
    if (!filePath.startsWith(path.resolve(ROOT, 'assets') + path.sep)) {
      return sendJson(res, 403, { error: 'FORBIDDEN' });
    }
    if (isHead) return send(res, 200, 'application/octet-stream', '');
    return serveFile(res, filePath);
  }

  const body404 = JSON.stringify({ error: 'NOT_FOUND' });
  return answer(404, 'application/json; charset=utf-8', body404);
});

server.listen(PORT, () => {
  console.log('maison app v' + VERSION + ' listening on port ' + PORT);
});
