(function () {
  'use strict';
  function boot() {
    var root = document.querySelector('.vl-pcard');
    if (!root) return;
    var main = root.querySelector('.vl-pc-mainimg');
    root.querySelectorAll('.vl-pc-thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        root.querySelectorAll('.vl-pc-thumb').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        var img = t.querySelector('img');
        if (main && img && img.getAttribute('data-full')) main.src = img.getAttribute('data-full');
      });
    });
    var label = root.querySelector('.vl-pc-colorlabel');
    root.querySelectorAll('.vl-pc-dot').forEach(function (d) {
      d.addEventListener('click', function () {
        root.querySelectorAll('.vl-pc-dot').forEach(function (x) { x.classList.remove('active'); });
        d.classList.add('active');
        if (label) label.textContent = 'Цвет: ' + (d.getAttribute('data-color') || '');
      });
    });
    root.querySelectorAll('.vl-pc-size:not(:disabled)').forEach(function (s) {
      s.addEventListener('click', function () {
        root.querySelectorAll('.vl-pc-size').forEach(function (x) { x.classList.remove('selected'); });
        s.classList.add('selected');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
