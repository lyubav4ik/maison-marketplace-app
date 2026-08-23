(function () {
  'use strict';
  var ORIGIN = window.location.origin;

  function initFade(root) {
    var els = root.querySelectorAll('.fade-in');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('visible');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    for (var j = 0; j < els.length; j++) obs.observe(els[j]);
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
    var a = el('a', 'vl-prod-card landing-block-card-prod landing-block-node-prod-link fade-in visible');
    a.href = data.url;
    var media = el('div', 'vl-prod-media');
    var imgA = el('img', 'vl-prod-img vl-prod-img-a landing-block-node-prod-img');
    imgA.src = data.img; imgA.alt = data.title;
    media.appendChild(imgA);
    if (data.imgHover) {
      var imgB = el('img', 'vl-prod-img vl-prod-img-b');
      imgB.src = data.imgHover; imgB.alt = '';
      media.appendChild(imgB);
    }
    var wish = el('span', 'vl-prod-wish');
    wish.setAttribute('role', 'button');
    wish.setAttribute('aria-label', 'В избранное');
    wish.title = 'В избранное';
    wish.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); wish.classList.toggle('active'); });
    media.appendChild(wish);
    var name = el('h3', 'vl-prod-name landing-block-node-prod-name');
    name.textContent = data.title;
    var price = el('p', 'vl-prod-price landing-block-node-prod-price');
    price.textContent = data.price;
    a.appendChild(media);
    a.appendChild(name);
    a.appendChild(price);
    return a;
  }

  function getProducts(html, count) {
    var parts = html.split('data-entity="item"').slice(1);
    var out = [];
    for (var i = 0; i < parts.length && out.length < count; i++) {
      var p = parts[i];
      var linkM = /<h3 class="product-item-title">[\s\S]*?<a href="([^"]+)"/.exec(p);
      if (!linkM) continue;
      var titleM = /<h3 class="product-item-title">([\s\S]*?)<\/h3>/.exec(p);
      var title = stripTags(titleM ? titleM[1] : '');
      if (!title) continue;
      var imgs = [];
      var re = /background-image:\s*url\('([^']+)'\)/g, m;
      while ((m = re.exec(p)) !== null) {
        if (imgs.indexOf(m[1]) < 0) imgs.push(m[1]);
        if (imgs.length >= 2) break;
      }
      var priceM = /<span class="product-item-price-current"[^>]*>([\s\S]*?)<\/span>/.exec(p);
      var price = priceM ? stripTags(priceM[1]).replace(/\u00a0/g, ' ') : '';
      out.push({ url: linkM[1], title: title, img: imgs[0] || '', imgHover: imgs[1] || '', price: price });
    }
    return out;
  }

  function fillDynamic(grid, count) {
    return fetch(ORIGIN + '/katalog/', { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var items = getProducts(html, count);
        if (!items.length) throw new Error('no products');
        while (grid.firstChild) grid.removeChild(grid.firstChild);
        items.forEach(function (it) { grid.appendChild(buildCard(it)); });
      });
  }

  function boot() {
    var section = document.querySelector('.vl-prods');
    if (!section) return;
    initFade(section);
    var grid = section.querySelector('.vl-prods-grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('a.vl-prod-card');
    var dynamicWanted = false;
    for (var i = 0; i < cards.length; i++) {
      if ((cards[i].getAttribute('href') || '').indexOf('#dynamic') === 0) { dynamicWanted = true; break; }
    }
    if (dynamicWanted && cards.length > 0) {
      fillDynamic(grid, cards.length)
        .then(function () { console.log('vl-prods: заполнено из каталога'); })
        .catch(function (e) { console.log('vl-prods: каталог недоступен, остались статичные карточки', e && e.message); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
