const fs = require('fs');
const https = require('https');

function call(domain, token, method, params) {
  return new Promise((resolve) => {
    const data = 'access_token=' + encodeURIComponent(token) + '&params=' + encodeURIComponent(JSON.stringify(params));
    const req = https.request({ hostname: domain, path: '/rest/' + method + '.json', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => { try { resolve(JSON.parse(b)); } catch (e) { resolve({ raw: b.slice(0, 200) }); } });
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.write(data); req.end();
  });
}

(async () => {
  let installs = {};
  try { installs = JSON.parse(fs.readFileSync('/opt/app/data/installs.json', 'utf8')); } catch (e) { console.log('NO INSTALLS FILE at /opt/app/data/'); }
  for (const [key, v] of Object.entries(installs)) {
    console.log('\n==== PORTAL', v.domain, '| siteId:', v.siteId);
    if (!v.access_token) { console.log('нет токена в записи'); continue; }
    const pages = await call(v.domain, v.access_token, 'landing.landing.getList', { select: ['ID', 'CODE', 'TITLE', 'ACTIVE'], filter: { SITE_ID: v.siteId } });
    if (!pages.result) { console.log('getList fail:', JSON.stringify(pages).slice(0, 200)); continue; }
    for (const p of pages.result) console.log('page #' + p.ID, p.CODE || '(без кода)', '|', p.TITLE);
    const home = pages.result.find(p => p.CODE === 'home' || /Главная/i.test(p.TITLE || ''));
    if (!home) continue;
    const blocks = await call(v.domain, v.access_token, 'landing.block.getList', { lid: Number(home.ID) });
    if (!blocks.result) { console.log('blockList fail:', JSON.stringify(blocks).slice(0, 200)); continue; }
    console.log('-- блоки главной сверху вниз:');
    for (const bl of blocks.result) {
      const code = (bl.CODE || bl.meta || '').toString().slice(0, 40);
      console.log('  #' + bl.ID, 'sort=' + (bl.SORT !== undefined ? bl.SORT : '?'), code);
    }
  }
})();
