(function () {
  'use strict';
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
  function boot() {
    var s = document.querySelector('.vl-story');
    if (s) initFade(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
