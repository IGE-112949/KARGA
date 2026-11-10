// Karga — landing page: simulador de ganhos e animações ao aparecer (sem dependências).
(function () {
  'use strict';
  var OPTS = { '3.7': { kwNum: 3.7 }, '7.4': { kwNum: 7.4 } };
  var s = { power: '3.7', sessions: 3, hours: 4, fee: 0.5, tick: 0 };
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n, d) { return n.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  // Barra: parte preenchida na cor do estado, o resto cinzento claro.
  function paint(el, color) {
    var min = Number(el.min), max = Number(el.max), v = Number(el.value);
    el.style.setProperty('--k-c', color);
    el.style.setProperty('--k-fill', ((v - min) / (max - min)) * 100 + '%');
  }

  function render() {
    var sel = OPTS[s.power];
    var monthHours = s.hours * s.sessions * 4;
    var monthly = s.fee * monthHours;
    var warn = s.power === '3.7' && s.fee > 0.6 + 1e-9;
    var accent = s.power === '7.4' ? '#059669' : '#10B981';
    var feeAccent = warn ? '#EA580C' : accent;

    document.querySelectorAll('[data-power]').forEach(function (b) {
      var on = b.getAttribute('data-power') === s.power;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.borderColor = on ? '#10B981' : '#E2E8F0';
      b.style.background = on ? '#ECFDF5' : '#FFFFFF';
      var ring = b.querySelector('.k-ring');
      var dot = b.querySelector('.k-dot');
      if (ring) ring.style.borderColor = on ? '#10B981' : '#94A3B8';
      if (dot) dot.style.background = on ? '#10B981' : 'transparent';
    });

    paint($('k-sessions'), accent);
    paint($('k-hours'), accent);
    paint($('k-fee'), feeAccent);
    $('k-sessions-label').textContent = s.sessions + (s.sessions === 1 ? ' sessão' : ' sessões');
    $('k-hours-label').textContent = s.hours + ' horas';
    var feeLabel = $('k-fee-label');
    feeLabel.textContent = fmt(s.fee, 2) + ' €/h';
    feeLabel.style.color = warn ? '#9A3412' : '#065F46';
    feeLabel.style.background = warn ? '#FFEDD5' : '#ECFDF5';

    var m = $('k-monthly');
    m.textContent = fmt(monthly, 2);
    m.className = s.tick % 2 ? 'k-pop-a' : 'k-pop-b';
    $('k-yearly').textContent = fmt(monthly * 12, 0) + ' €';
    $('k-rate').textContent = fmt(s.fee, 2) + ' €';
    $('k-month-hours').textContent = monthHours + ' h';
    $('k-kwh').textContent = fmt(sel.kwNum * monthHours, 0) + ' kWh';
    $('k-warning').hidden = !warn;
  }

  function update(patch) {
    for (var k in patch) s[k] = patch[k];
    s.tick++;
    render();
  }

  document.querySelectorAll('[data-power]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-power');
      if (p !== s.power) update({ power: p });
    });
  });
  $('k-sessions').addEventListener('input', function (e) { update({ sessions: Number(e.target.value) }); });
  $('k-hours').addEventListener('input', function (e) { update({ hours: Number(e.target.value) }); });
  $('k-fee').addEventListener('input', function (e) { update({ fee: Math.round(Number(e.target.value) * 10) / 10 }); });

  // Secções que aparecem ao entrar no ecrã.
  var reveals = document.querySelectorAll('.k-reveal');
  if (typeof IntersectionObserver === 'undefined') {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  render();
})();
