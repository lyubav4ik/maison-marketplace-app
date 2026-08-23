(function () {
	var isEdit = false;
	try { isEdit = window.BX && window.BX.Landing && typeof window.BX.Landing.getMode === 'function' && window.BX.Landing.getMode() === 'edit'; } catch (e) {}
	if (isEdit) return;
	var CANDIDATES = ['katalog', 'catalog', 'shop'];
	function collectCatalogBase() {
		var best = null, bestDepth = 99, seen = {};
		Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (a) {
			var u;
			try { u = new URL(a.getAttribute('href') || '', location.href); } catch (e) { return; }
			if (u.origin !== location.origin) return;
			var m = u.pathname.match(/^\/(katalog|catalog|shop)(?:\/|$)/i);
			if (!m) return;
			var seg = m[1].toLowerCase();
			if (seen[seg]) return;
			seen[seg] = true;
			var depth = u.pathname.split('/').filter(Boolean).length || 1;
			if (depth < bestDepth) { bestDepth = depth; best = '/' + seg + '/'; }
		});
		return best || '';
	}
	function probe(path) {
		return fetch(location.origin + path, { method: 'HEAD' }).then(function (r) { return r.ok ? path : null; }).catch(function () { return null; });
	}
	function resolveCatalog() {
		var found = collectCatalogBase();
		if (found) return Promise.resolve(found);
		var chain = Promise.resolve(null);
		CANDIDATES.forEach(function (seg) {
			chain = chain.then(function (res) { return res || probe('/' + seg + '/'); });
		});
		return chain.then(function (res) { return res || '/katalog/'; });
	}
	function setup(h) {
		if (h.dataset.vlInit) return;
		h.dataset.vlInit = '1';
		var burger = h.querySelector('.vl-burger');
		if (burger) burger.addEventListener('click', function () { h.classList.toggle('vl-open'); });
		document.addEventListener('click', function (e) {
			if (h.classList.contains('vl-open') && !h.contains(e.target)) h.classList.remove('vl-open');
		});
		var wrap = h.querySelector('.vl-search'), toggle = h.querySelector('.vl-search-toggle'), input = h.querySelector('.vl-search-input');
		if (toggle && input) {
			toggle.addEventListener('click', function () {
				wrap.classList.toggle('open');
				if (wrap.classList.contains('open')) input.focus();
			});
			input.addEventListener('keydown', function (e) {
				if (e.key !== 'Enter') return;
				e.preventDefault();
				var q = (input.value || '').trim();
				resolveCatalog().then(function (base) {
					window.location.href = base + '?q=' + encodeURIComponent(q);
				});
			});
		}
	}
	document.querySelectorAll('.vl-header').forEach(setup);
})();
