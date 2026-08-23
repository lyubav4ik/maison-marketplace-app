(function () {
  'use strict';
  var ORIGIN = window.location.origin;

  function initFade(grid) {
    var cards = grid.querySelectorAll('.vl-cat.fade-in');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < cards.length; i++) cards[i].classList.add('visible');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    for (var j = 0; j < cards.length; j++) obs.observe(cards[j]);
  }

  function stripTags(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    e.className = cls;
    return e;
  }

  function buildCard(data) {
    var a = el('a', 'vl-cat landing-block-card-cat landing-block-node-cat-link fade-in visible');
    a.href = data.url;
    var img = el('img', 'vl-cat-img landing-block-node-cat-img');
    img.src = data.img;
    img.alt = data.title;
    var veil = el('div', 'vl-cat-veil');
    var bottom = el('div', 'vl-cat-bottom');
    var title = el('h3', 'vl-cat-title landing-block-node-cat-title');
    title.textContent = data.title;
    var arrow = el('span', 'vl-cat-arrow');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '\u2192';
    bottom.appendChild(title);
    bottom.appendChild(arrow);
    a.appendChild(img);
    a.appendChild(veil);
    a.appendChild(bottom);
    return a;
  }

  function getSections(html) {
    var out = [];
    var seen = {};
    var re = /href="([^"]*\/katalog\/[a-zA-Z0-9/_-]+\/)"[^>]*data-url="#catalogSection\d+"[^>]*>([\s\S]*?)<\/a>/g;
    var m;
    while ((m = re.exec(html)) !== null) {
      var url = m[1];
      if (url.indexOf('http') !== 0) url = ORIGIN + url;
      if (seen[url]) continue;
      seen[url] = 1;
      var title = stripTags(m[2]);
      if (title) out.push({ url: url, title: title });
    }
    return out;
  }

  function getFirstImage(html) {
    var m = /product-item-image-wrapper[\s\S]{0,1500}?url\((['"])(https?:\/\/[^'")]+?\.(?:jpe?g|png|webp)[^'")]*)\1/i.exec(html)
         || /product-item-image-wrapper[\s\S]{0,1500}?<img[^>]+(?:data-src|src)="([^"]+(?:jpe?g|png|webp)[^"]*)"/i.exec(html);
    if (!m) return '';
    var src = m[2] || m[1];
    if (src.indexOf('http') !== 0) src = src.indexOf('/') === 0 ? ORIGIN + src : ORIGIN + '/' + src;
    return src;
  }

  function fillDynamic(grid, count) {
    return fetch(ORIGIN + '/katalog/', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var sections = getSections(html).slice(0, count);
        if (!sections.length) throw new Error('no sections');
        return Promise.all(sections.map(function (s) {
          return fetch(s.url, { credentials: 'same-origin' })
            .then(function (r) { return r.text(); })
            .then(function (pageHtml) { s.img = getFirstImage(pageHtml); return s; })
            .catch(function () { s.img = ''; return s; });
        }));
      })
      .then(function (sections) {
        while (grid.firstChild) grid.removeChild(grid.firstChild);
        sections.forEach(function (s) {
          grid.appendChild(buildCard({ url: s.url, title: s.title, img: s.img || ORIGIN + '/upload/images/default-category.jpg' }));
        });
      });
  }

  function boot() {
    var grid = document.querySelector('.vl-cats-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('a.vl-cat');
    var dynamicWanted = false;
    for (var i = 0; i < cards.length; i++) {
      if ((cards[i].getAttribute('href') || '').indexOf('#dynamic') === 0) { dynamicWanted = true; break; }
    }
    if (dynamicWanted && cards.length > 0) {
      fillDynamic(grid, cards.length)
        .then(function () { console.log('vl-cats: заполнено из каталога'); })
        .catch(function (e) {
          console.log('vl-cats: каталог недоступен, остались статичные карточки', e && e.message);
          initFade(grid);
        });
    } else {
      initFade(grid);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
