/* VELOUR — interactions (no dependencies, safe for B24 editor) */
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  var d = document;
  d.documentElement.classList.add("js-ready");

  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }

  /* scroll reveal */
  var reveals = qsa(".vl-fade");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* inject Bitrix24 native search form into header */
  (function () {
    var triggers = qsa('.vl-header__search-trigger');
    triggers.forEach(function (trigger) {
      var wrapper = trigger.parentElement;
      if (!wrapper) return;
      var form = document.createElement('form');
      form.action = '#system_catalog';
      form.className = 'vl-header__search-form';
      form.innerHTML = '<input type="text" name="q" autocomplete="off" class="vl-header__search-input" placeholder="Поиск…"><button type="button" class="vl-header__search-toggle"><span class="vl-ico">search</span></button><button type="submit" name="s" class="vl-header__search-submit" style="display:none"><span class="vl-ico">search</span></button>';
      wrapper.replaceChild(form, trigger);
      var input = form.querySelector('.vl-header__search-input');
      var toggle = form.querySelector('.vl-header__search-toggle');
      var submit = form.querySelector('.vl-header__search-submit');
      toggle.addEventListener('click', function () {
        var isOpen = input.classList.contains('is-open');
        if (isOpen) {
          var q = (input.value || '').trim();
          if (q) form.submit();
        } else {
          input.classList.add('is-open');
          submit.style.display = 'flex';
          toggle.style.display = 'none';
          input.focus();
        }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); form.submit(); }
        if (e.key === 'Escape') {
          input.classList.remove('is-open');
          input.value = '';
          submit.style.display = 'none';
          toggle.style.display = 'flex';
        }
      });
      input.addEventListener('blur', function () {
        if (!input.value.trim()) {
          input.classList.remove('is-open');
          submit.style.display = 'none';
          toggle.style.display = 'flex';
        }
      });
    });
  })();

  /* mobile menu */
  var burger = qsa(".vl-header__burger"),
    menu = d.querySelector(".vl-mmenu"),
    mmClose = d.querySelector(".vl-mmenu__close"),
    mmBackdrop = d.querySelector(".vl-mmenu__backdrop");
  function closeMenu() {
    if (menu) { menu.classList.remove("is-open"); document.body.style.overflow = ""; }
  }
  function openMenu() {
    if (menu) { menu.classList.add("is-open"); document.body.style.overflow = "hidden"; }
  }
  burger.forEach(function (b) { b.addEventListener("click", openMenu); });
  if (mmClose) mmClose.addEventListener("click", closeMenu);
  if (mmBackdrop) mmBackdrop.addEventListener("click", closeMenu);
  d.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  qsa(".vl-mmenu__link").forEach(function (l) { l.addEventListener("click", closeMenu); });

  /* accordion */
  qsa(".vl-acc__head").forEach(function (head) {
    head.addEventListener("click", function () {
      var item = head.closest(".vl-acc__item");
      if (!item) return;
      var body = item.querySelector(".vl-acc__body");
      if (!body) return;
      var open = item.classList.contains("is-open");
      if (open) {
        item.classList.remove("is-open");
        body.style.maxHeight = "0px";
      } else {
        item.classList.add("is-open");
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  /* mobile filters toggle */
  var ft = d.querySelector(".vl-filters__toggle");
  if (ft) {
    ft.addEventListener("click", function () {
      var p = d.querySelector(".vl-filters__panel");
      if (p) p.classList.toggle("is-open");
    });
  }

  /* product gallery thumbs */
  qsa(".vl-pd__thumb").forEach(function (th) {
    th.addEventListener("click", function () {
      var g = th.closest(".vl-pd__gallery");
      if (!g) return;
      var main = g.querySelector(".vl-pd__main-img");
      if (!main) return;
      var src = th.getAttribute("data-src") || (th.querySelector("img") && th.querySelector("img").src);
      if (src) main.src = src;
      qsa(".vl-pd__thumb", g).forEach(function (t) { t.classList.remove("is-active"); });
      th.classList.add("is-active");
    });
  });

  /* qty stepper */
  qsa(".vl-qty").forEach(function (q) {
    var val = q.querySelector(".vl-qty__val");
    var dec = q.querySelector("[data-qty='dec']");
    var inc = q.querySelector("[data-qty='inc']");
    if (!val) return;
    if (dec) dec.addEventListener("click", function () {
      var v = parseInt(val.textContent, 10) || 1;
      if (v > 1) val.textContent = v - 1;
    });
    if (inc) inc.addEventListener("click", function () {
      var v = parseInt(val.textContent, 10) || 1;
      val.textContent = v + 1;
    });
  });

  /* wishlist toggle + badge (localStorage) */
  function readLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch (e) { return JSON.parse(fallback); }
  }
  function writeLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }
  var WL_KEY = "vl_wishlist";
  var CART_KEY = "vl_cart_count";
  function wishlist() { return readLS(WL_KEY, "[]"); }
  function syncWish() {
    var wl = wishlist();
    qsa(".vl-card__wish").forEach(function (btn) {
      var id = btn.getAttribute("data-id");
      btn.classList.toggle("is-active", id ? wl.indexOf(id) !== -1 : false);
    });
  }
  qsa(".vl-card__wish").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-id");
      if (!id) return;
      var wl = wishlist();
      var i = wl.indexOf(id);
      if (i === -1) { wl.push(id); } else { wl.splice(i, 1); }
      writeLS(WL_KEY, wl);
      syncWish();
    });
  });
  syncWish();

  /* cart badge */
  function syncCart() {
    var n = parseInt(readLS(CART_KEY, "0"), 10) || 0;
    qsa(".vl-header__badge").forEach(function (b) {
      b.textContent = n;
      b.style.display = n > 0 ? "" : "none";
    });
  }
  syncCart();

  /* demo add-to-cart buttons bump counter */
  qsa("[data-add-cart]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var n = parseInt(readLS(CART_KEY, "0"), 10) || 0;
      writeLS(CART_KEY, n + 1);
      syncCart();
    });
  });

  /* search — client-side on /search/ page */
  (function () {
    var searchPage = "/search";
    if (window.location.pathname.indexOf(searchPage) !== 0) return;

    var PAGES = [
      { title: "Главная", url: "/home/", desc: "Последние коллекции и новинки" },
      { title: "Каталог", url: "/catalog/", desc: "Все товары магазина" },
      { title: "Новинки", url: "/new/", desc: "Новые поступления" },
      { title: "Карточка товара", url: "/product/", desc: "Детальная информация о товаре" },
      { title: "Избранное", url: "/wishlist/", desc: "Ваши сохранённые товары" },
      { title: "Корзина", url: "/cart/", desc: "Товары в корзине" },
      { title: "Оформление заказа", url: "/checkout/", desc: "Оформление и оплата" },
      { title: "Личный кабинет", url: "/personal/", desc: "Профиль и история заказов" },
      { title: "Мои адреса", url: "/addresses/", desc: "Адреса доставки" },
      { title: "О бренде", url: "/about/", desc: "История и ценности VELOUR" },
      { title: "Доставка", url: "/delivery/", desc: "Условия и способы доставки" },
      { title: "Возврат", url: "/returns/", desc: "Возврат и обмен товаров" },
      { title: "FAQ", url: "/faq/", desc: "Часто задаваемые вопросы" },
      { title: "Контакты", url: "/contacts/", desc: "Связаться с нами" },
      { title: "Политика конфиденциальности", url: "/privacy/", desc: "Обработка персональных данных" },
    ];

    var input = d.querySelector(".vl-searchbar__input");
    var empty = d.querySelector(".vl-search__empty");
    var resultsWrap = d.createElement("div");
    resultsWrap.className = "vl-search__results";
    resultsWrap.style.cssText = "margin-top:32px";
    var container = input && input.closest(".vl-container");
    if (container) container.appendChild(resultsWrap);

    function highlight(text, q) {
      if (!q) return text;
      var re = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      return text.replace(re, "<mark style='background:var(--vl-accent);color:#fff;border-radius:3px;padding:0 3px'>$1</mark>");
    }

    function doSearch() {
      var q = (input.value || "").trim().toLowerCase();
      resultsWrap.innerHTML = "";
      if (!q) { if (empty) empty.style.display = "none"; return; }

      var hits = PAGES.filter(function (p) {
        return p.title.toLowerCase().indexOf(q) !== -1 || p.desc.toLowerCase().indexOf(q) !== -1;
      });

      if (!hits.length) {
        if (empty) empty.style.display = "";
        return;
      }
      if (empty) empty.style.display = "none";

      var list = document.createElement("div");
      list.style.cssText = "display:flex;flex-direction:column;gap:12px";
      hits.forEach(function (p) {
        var card = document.createElement("a");
        card.href = p.url;
        card.className = "vl-card";
        card.style.cssText = "display:flex;align-items:center;gap:16px;padding:20px 24px;text-decoration:none;color:var(--vl-text);border:1px solid var(--vl-border);border-radius:16px;transition:border-color .2s,box-shadow .2s";
        card.onmouseenter = function () { card.style.borderColor = "var(--vl-accent)"; card.style.boxShadow = "0 4px 20px rgba(154,91,71,.12)"; };
        card.onmouseleave = function () { card.style.borderColor = ""; card.style.boxShadow = ""; };
        card.innerHTML = '<span class="vl-ico" style="color:var(--vl-accent);font-size:20px">search</span><div><div style="font-weight:600">' + highlight(p.title, q) + '</div><div style="font-size:13px;color:var(--vl-muted);margin-top:2px">' + highlight(p.desc, q) + '</div></div><span class="vl-ico" style="margin-left:auto;opacity:.4">arrow_forward</span>';
        list.appendChild(card);
      });
      resultsWrap.appendChild(list);
    }

    if (input) {
      input.addEventListener("input", doSearch);
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
      var btn = input.closest(".vl-searchbar") && input.closest(".vl-searchbar").querySelector(".vl-searchbar__btn");
      if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); doSearch(); });
    }

    var params = new URLSearchParams(window.location.search);
    var initQ = params.get("q");
    if (initQ && input) { input.value = initQ; doSearch(); }
  })();

  /* inline header search — redirect to /search/?q=... */
  qsa(".vl-header .vl-searchbar__input").forEach(function (input) {
    function submitSearch() {
      var q = (input.value || "").trim();
      if (q) window.location.href = "/search/?q=" + encodeURIComponent(q);
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitSearch(); } });
    var btn = input.closest(".vl-searchbar") && input.closest(".vl-searchbar").querySelector(".vl-searchbar__btn");
    if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); submitSearch(); });
  });

  /* auth check for /personal/ and /cart/ */
  var authPages = ["/personal/", "/cart/"];
  var pathname = window.location.pathname.replace(/\/+$/, "") + "/";
  if (authPages.indexOf(pathname) !== -1) {
    var needAuth = true;
    try {
      if (typeof BX24 !== "undefined" && BX24.isAuthorized && BX24.isAuthorized()) {
        needAuth = false;
      }
    } catch (e) { /* BX24 not available */ }
    try {
      if (document.cookie.indexOf("BITRIX_SM_LOGIN") !== -1) {
        needAuth = false;
      }
    } catch (e) { /* ignore */ }
    if (needAuth) {
      var main = d.querySelector("main");
      if (main) {
        var wrappers = main.querySelectorAll(".block-wrapper");
        wrappers.forEach(function (w) { w.style.display = "none"; });
        var p = d.createElement("div");
        p.style.cssText = "text-align:center;padding:120px 20px";
        p.innerHTML = '<div class="vl-container">' +
          '<span class="vl-ico" style="font-size:48px;opacity:.3">lock</span>' +
          '<h2 style="margin:24px 0 12px">Требуется авторизация</h2>' +
          '<p style="color:var(--vl-muted);margin-bottom:32px">Войдите или зарегистрируйтесь, чтобы получить доступ к личному кабинету.</p>' +
          '<a href="/auth/" class="vl-btn vl-btn--primary">Войти</a>' +
          '</div>';
        main.appendChild(p);
      }
    }
  }
})();
