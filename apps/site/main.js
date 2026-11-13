// Karga — landing page: simulador, separadores, lista de espera e animações (sem dependências).
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n, d) { return n.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  // ---------- Simulador de ganhos ----------
  // Ganho = preço/h × horas por reserva × reservas por semana × 4 semanas. A energia não entra: é paga a preço de custo.
  var POWER = { '2.3': { kw: 2.3, fair: 0.3, tip: 'Numa tomada normal o carro carrega devagar. Preços entre 0,20 € e 0,30 €/h mantêm a Karga competitiva com a rede pública.' },
                '7.4': { kw: 7.4, fair: 0.5, tip: 'Com wallbox o carregamento é mais rápido e preços até 0,50 €/h continuam competitivos.' } };
  var s = { power: '2.3', sessions: 2, hours: 10, fee: 0.3, tick: 0 };

  function paint(el, color) {
    var min = Number(el.min), max = Number(el.max), v = Number(el.value);
    el.style.setProperty('--k-c', color);
    el.style.setProperty('--k-fill', ((v - min) / (max - min)) * 100 + '%');
  }

  function render() {
    var p = POWER[s.power];
    var monthHours = s.hours * s.sessions * 4;
    var monthly = s.fee * monthHours;
    var high = s.fee > p.fair + 1e-9;
    var accent = s.power === '7.4' ? '#059669' : '#10B981';

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
    paint($('k-fee'), high ? '#EA580C' : accent);
    $('k-sessions-label').textContent = s.sessions + (s.sessions === 1 ? ' reserva' : ' reservas');
    $('k-hours-label').textContent = s.hours + (s.hours === 1 ? ' hora' : ' horas');
    var feeLabel = $('k-fee-label');
    feeLabel.textContent = fmt(s.fee, 2) + ' €/h';
    feeLabel.style.color = high ? '#9A3412' : '#065F46';
    feeLabel.style.background = high ? '#FFEDD5' : '#ECFDF5';
    var tip = $('k-tip');
    tip.textContent = p.tip;
    tip.style.color = high ? '#9A3412' : '#475569';

    var m = $('k-monthly');
    m.textContent = fmt(monthly, 2);
    m.className = s.tick % 2 ? 'k-pop-a' : 'k-pop-b';
    $('k-yearly').textContent = fmt(monthly * 12, 0) + ' €';
    $('k-month-hours').textContent = monthHours + ' h';
    $('k-kwh').textContent = 'até ' + fmt(p.kw * monthHours, 0) + ' kWh';
  }

  function update(patch) {
    for (var k in patch) s[k] = patch[k];
    s.tick++;
    render();
  }

  if ($('k-monthly')) {
    document.querySelectorAll('[data-power]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-power');
        if (p !== s.power) update({ power: p });
      });
    });
    $('k-sessions').addEventListener('input', function (e) { update({ sessions: Number(e.target.value) }); });
    $('k-hours').addEventListener('input', function (e) { update({ hours: Number(e.target.value) }); });
    $('k-fee').addEventListener('input', function (e) { update({ fee: Math.round(Number(e.target.value) * 20) / 20 }); });
    render();
  }

  // ---------- Separadores "Como funciona" ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
  function selectTab(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      $(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(n);
      n.focus();
    });
  });

  // ---------- Lista de espera ----------
  // Inserção direta no Supabase com a chave pública: a tabela só aceita inserções (ninguém lê pelo site).
  var SUPABASE_URL = 'https://vfpgzvhfxezszjrajuyv.supabase.co';
  var SUPABASE_KEY = 'sb_publishable__voVNlvZIR9p0jRP3jIvkA_vk_KY98_';
  var form = $('k-form');

  function radio(name, value) {
    var el = form && form.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }
  function value(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function syncProfile() {
    var p = value('perfil');
    form.querySelectorAll('[data-for]').forEach(function (box) {
      var show = p === 'ambos' || p === box.getAttribute('data-for');
      box.hidden = !show;
      box.style.display = show ? 'flex' : 'none';
    });
  }

  // Links "#lista-espera?perfil=condutor&kit=basico": marcam o perfil (e o kit) e descem até ao formulário.
  var KITS = { sem: 'sem', basico: 'basico', pro: 'pro' };
  function applyHash() {
    var h = location.hash || '';
    if (h.indexOf('#lista-espera') !== 0) return;
    var q = h.split('?')[1] || '';
    q.split('&').forEach(function (pair) {
      var kv = pair.split('=');
      var k = decodeURIComponent(kv[0] || ''), v = decodeURIComponent(kv[1] || '');
      if (k === 'perfil' && (v === 'condutor' || v === 'proprietario' || v === 'ambos')) radio('perfil', v);
      if (k === 'kit' && KITS[v]) radio('kit', KITS[v]);
    });
    syncProfile();
    var sec = $('lista-espera');
    if (sec) sec.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  if (form) {
    form.addEventListener('change', function (e) { if (e.target.name === 'perfil') syncProfile(); });
    window.addEventListener('hashchange', applyHash);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#lista-espera"]');
      if (!a) return;
      // Mesmo link duas vezes não muda o hash: aplica na mesma.
      if (location.hash === a.getAttribute('href')) { e.preventDefault(); applyHash(); }
    });
    applyHash();
    syncProfile();

    // UTM das campanhas (cartazes com QR, grupos, anúncios).
    var utm = {};
    try {
      var sp = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { var v = sp.get(k); if (v) utm[k] = v.slice(0, 100); });
    } catch (err) { /* browsers antigos: sem UTM */ }

    var errBox = $('k-form-error');
    function fail(msg, field) {
      errBox.textContent = msg;
      errBox.hidden = false;
      if (field) field.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      if (form.site.value) return; // armadilha para robôs
      var perfil = value('perfil');
      var nome = form.nome.value.trim();
      var email = form.email.value.trim();
      var cp = form.codigo_postal.value.trim();
      if (!perfil) return fail('Escolha se tem carro elétrico, garagem com tomada ou as duas coisas.', form.querySelector('input[name=perfil]'));
      if (!nome) return fail('Indique o seu primeiro nome.', form.nome);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Indique um email válido.', form.email);
      if (!/^\d{4}-\d{3}$/.test(cp)) return fail('Indique o código postal no formato 0000-000.', form.codigo_postal);
      if (!form.consentimento.checked) return fail('Para o inscrevermos, aceite que guardemos estes dados.', form.consentimento);

      var driver = perfil !== 'proprietario', host = perfil !== 'condutor';
      var row = {
        perfil: perfil, nome: nome, email: email.toLowerCase(), codigo_postal: cp, consentimento: true,
        ve_situacao: driver ? value('ve_situacao') : null, carrega_onde: driver ? value('carrega_onde') : null,
        tipo_lugar: host ? value('tipo_lugar') : null, tomada: host ? value('tomada') : null, kit: host ? value('kit') : null,
        utm_source: utm.utm_source || null, utm_medium: utm.utm_medium || null, utm_campaign: utm.utm_campaign || null,
      };
      var btn = $('k-submit');
      btn.disabled = true;
      btn.textContent = 'A enviar…';
      fetch(SUPABASE_URL + '/rest/v1/lista_espera', {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        $('k-ok-text').textContent = 'Obrigado, ' + nome + '! Está na lista.';
        form.hidden = true;
        $('k-form-ok').hidden = false;
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = 'Inscrever-me';
        fail('Não foi possível enviar. Tente de novo ou escreva-nos para ola@karga.pt.');
      });
    });
  }

  // ---------- Secções que aparecem ao entrar no ecrã ----------
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
})();
