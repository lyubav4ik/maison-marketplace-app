(function () {
  'use strict';
  function initFade(root) {
    if (!root) return;
    var els = root.querySelectorAll('.fade-in');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < els.length; i++) els[i].classList.add('visible');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    for (var j = 0; j < els.length; j++) obs.observe(els[j]);
  }
  function boot() {
    initFade(document);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
