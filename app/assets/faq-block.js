(function () {
  'use strict';
  function boot() {
    document.querySelectorAll('.vl-faq').forEach(function (root) {
      root.querySelectorAll('.vl-faq-item').forEach(function (item) {
        var q = item.querySelector('.vl-faq-q');
        if (!q || q.getAttribute('data-faq-init') === '1') return;
        q.setAttribute('data-faq-init', '1');
        q.addEventListener('click', function () { item.classList.toggle('open'); });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
