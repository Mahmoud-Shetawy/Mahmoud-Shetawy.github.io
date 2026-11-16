(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  (function theme() {
    var btn = $('#themeBtn'), label = $('#themeLabel'), root = document.documentElement;
    function paint() { label.textContent = root.dataset.theme; }
    btn.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
      paint();
    });
    paint();
  })();

  (function reveal() {
    var items = $$('.sec__head, .prose, .case, .job, .skills > div, .card--proj, .entry, .facts > div, .contact__head, .reach__card');
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    items.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  })();

  $('#year').textContent = new Date().getFullYear();

  (function dates() {
    var now = new Date();
    function months(from, to) {
      var f = from.split('-').map(Number);
      var t = to ? to.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
      return Math.max(1, (t[0] - f[0]) * 12 + (t[1] - f[1]) + 1);
    }
    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    $$('.job__dur').forEach(function (el) {
      var m = months(el.dataset.from, el.dataset.to), y = Math.floor(m / 12), r = m % 12;
      el.textContent = '· ' + [y ? plural(y, 'yr', 'yrs') : '', r ? plural(r, 'mo', 'mos') : ''].filter(Boolean).join(' ');
    });

    var periods = [['2022-10', '2023-01'], ['2024-10', '2025-06'], ['2025-09', null]];
    var total = periods.reduce(function (s, p) { return s + months(p[0], p[1]); }, 0);
    var xp = $('#xpTotal');
    if (xp) xp.textContent = Math.max(2, Math.floor(total / 12)) + '+ years';
  })();

  (function copyEmail() {
    var btn = $('#copyEmail');
    if (!btn) return;
    var label = $('span', btn), icon = $('use', btn), timer;
    function done(ok) {
      if (!ok) {
        var addr = $('.reach__card--main .reach__v');
        var range = document.createRange(); range.selectNodeContents(addr);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      }
      label.textContent = ok ? 'Copied' : 'Selected, press Ctrl+C';
      icon.setAttribute('href', ok ? '#i-check' : '#i-copy');
      btn.classList.toggle('is-done', ok);
      clearTimeout(timer);
      timer = setTimeout(function () {
        label.textContent = 'Copy address'; icon.setAttribute('href', '#i-copy'); btn.classList.remove('is-done');
      }, 2000);
    }
    function fallback(text) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      return ok;
    }
    btn.addEventListener('click', function () {
      var text = btn.dataset.email;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback(text)); });
      } else {
        done(fallback(text));
      }
    });
  })();

  (function activeTab() {
    var nav = $('.nav__links');
    var links = $$('a', nav);
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var current = null;

    function update() {
      var line = Math.max(140, window.innerHeight * 0.35), idx = -1;
      sections.forEach(function (sec, i) { if (sec && sec.getBoundingClientRect().top <= line) idx = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = sections.length - 1;
      var next = idx > -1 ? links[idx] : null;
      if (next === current) return;
      if (current) { current.classList.remove('is-active'); current.removeAttribute('aria-current'); }
      current = next;
      if (!current) return;
      current.classList.add('is-active');
      current.setAttribute('aria-current', 'true');
      if (nav.scrollWidth > nav.clientWidth) {
        var left = current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
        nav.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  (function glance() {
    var tabs = [$('#gTabProfile'), $('#gTabJson')];
    if (!tabs[0] || !tabs[1]) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', on);
          $('#' + t.getAttribute('aria-controls')).hidden = !on;
        });
      });
    });
  })();
  function setSeg(group, btn) {
    $$('button', group).forEach(function (b) { b.classList.toggle('is-on', b === btn); });
  }
  function onSeg(group, fn) {
    $$('button', group).forEach(function (b) {
      b.addEventListener('click', function () { if (b.disabled) return; setSeg(group, b); fn(b); });
    });
  }
  function bump(el) {
    if (!el || reduceMotion) return;
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
  }

  (function estimate() {
    var panel = $('[data-demo="estimate"]');
    if (!panel) return;
    var DAYS = 21;
    var gantt = $('#gantt'), ext = $('#eExt'), extOut = $('#eExtOut');
    var out = { eta: $('#eEta'), total: $('#eTotal'), sum: $('#eSum') };
    var quotes = $$('.quote', panel);

    function isFri(d) { return d % 7 === 5; }

    function readQuote(fs) {
      var v = {};
      $$('[data-k]', fs).forEach(function (i) { v[i.dataset.k] = i.type === 'checkbox' ? i.checked : +i.value; });
      $('[data-out="edt"]', fs).textContent = v.edt + 'd';
      $('[data-out="ert"]', fs).textContent = v.ert + 'd';
      $('[data-out="day"]', fs).textContent = 'day ' + (v.day + 1);
      return v;
    }

    function layout(q) {
      var cells = {}, start = q.day, cursor = start;
      var penalty = q.late || isFri(start);
      if (penalty) { cells[start] = 'wait'; cursor = start + 1; }
      function place(n, kind) {
        var placed = 0;
        while (placed < n) {
          if (!isFri(cursor)) { cells[cursor] = kind; placed++; }
          cursor++;
        }
      }
      place(q.edt, 'parts');
      place(q.ert, 'work');
      var end = cursor - 1;
      return { start: start, end: end, days: end - start + 1, cells: cells };
    }

    var head = document.createElement('div');
    head.className = 'gantt__row gantt__row--head';
    head.innerHTML = '<span class="gantt__label"></span>' + Array.apply(null, Array(DAYS)).map(function (_, d) {
      return '<span class="gantt__day' + (isFri(d) ? ' is-fri' : '') + '">' + (d + 1) + '</span>';
    }).join('');
    gantt.appendChild(head);

    var rows = ['A', 'B', 'Order'].map(function (label, i) {
      var row = document.createElement('div');
      row.className = 'gantt__row' + (i === 2 ? ' gantt__row--order' : '');
      var html = '<span class="gantt__label">' + label + '</span>';
      for (var d = 0; d < DAYS; d++) html += '<span class="gantt__cell' + (isFri(d) ? ' is-fri' : '') + '"></span>';
      row.innerHTML = html;
      gantt.appendChild(row);
      return $$('.gantt__cell', row);
    });

    var runs = 0;
    function render() {
      var qs = quotes.map(readQuote).map(layout);
      var extDays = +ext.value;
      extOut.textContent = extDays + 'd';

      var union = {}, maxEnd = 0;
      qs.forEach(function (w) {
        for (var d = w.start; d <= w.end; d++) union[d] = true;
        maxEnd = Math.max(maxEnd, w.end);
      });
      var orderEnd = maxEnd, extCells = {}, placed = 0, c = maxEnd + 1;
      while (placed < extDays) { if (!isFri(c)) { extCells[c] = true; placed++; orderEnd = c; } c++; }
      var orderDays = Object.keys(union).length + (orderEnd - maxEnd);
      var naive = qs.reduce(function (s, w) { return s + w.days; }, 0) + extDays;

      qs.forEach(function (w, i) {
        rows[i].forEach(function (cell, d) {
          cell.className = 'gantt__cell' + (isFri(d) ? ' is-fri' : '') + (w.cells[d] ? ' c--' + w.cells[d] + ' c--q' + i : '');
        });
      });
      rows[2].forEach(function (cell, d) {
        var k = extCells[d] ? ' c--ext' : (union[d] ? ' c--order' : '');
        cell.className = 'gantt__cell' + (isFri(d) ? ' is-fri' : '') + k + (d === orderEnd ? ' is-end' : '');
      });

      out.eta.textContent = 'Day ' + (orderEnd + 1);
      out.total.textContent = orderDays + ' days';
      out.sum.textContent = naive + ' days';
      if (runs++ > 0) bump(out.eta);
    }

    $$('input', panel).forEach(function (i) { i.addEventListener('input', render); });
    render();
  })();

  (function points() {
    var el = {
      balance: $('#bBalance'), redeem: $('#bRedeem'), redeemOut: $('#bRedeemOut'), receipt: $('#bReceipt'),
      pay: $('#bPay'), refund: $('#bRefund'), tx: $('#bTx'), send: $('#bSend'), retry: $('#bRetry'), next: $('#bNew'),
      verdict: $('#bVerdict'), ledger: $('#bLedger')
    };
    if (!el.balance) return;

    var CENTS_PER_POINT = 10, VAT = 15, EARN_PCT = 5, PARTNER_RATE = 2;
    var state = { balance: 500, amount: 30000, partnerPts: 500, txNo: 1001, processed: {}, ledger: [], anim: 0, order: null, orderNo: 2040 };

    function sar(h) { return (h / 100).toFixed(2); }
    function txId() { return 'TX-' + state.txNo; }

    function quote() {
      var vat = Math.round(state.amount * VAT / 100);
      var total = state.amount + vat;
      var maxPts = Math.min(state.balance, Math.floor(total / CENTS_PER_POINT));
      maxPts -= maxPts % 50;
      var pts = Math.min(+el.redeem.value, maxPts);
      var discount = pts * CENTS_PER_POINT;
      var due = total - discount;
      var earn = Math.floor(due * EARN_PCT / 100 / CENTS_PER_POINT);
      return { vat: vat, total: total, maxPts: maxPts, pts: pts, discount: discount, due: due, earn: earn };
    }

    function row(k, v, cls) { return '<div class="' + (cls || '') + '"><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

    function renderReceipt() {
      var q = quote();
      el.redeem.max = Math.max(q.maxPts, 0);
      el.redeem.value = q.pts;
      el.redeemOut.textContent = q.pts + ' pts';
      el.receipt.innerHTML =
        row('Subtotal', sar(state.amount)) +
        row('Tax 15%', sar(q.vat)) +
        row('Points redeemed (' + q.pts + ')', '−' + sar(q.discount)) +
        row('Amount due', sar(q.due), 'is-total') +
        row('Points earned (rounded down)', '+' + q.earn + ' pts', 'is-pts');
    }

    function countTo(target) {
      var from = +el.balance.textContent, start = null, id = ++state.anim;
      if (reduceMotion || from === target) { el.balance.textContent = target; return; }
      function step(ts) {
        if (id !== state.anim) return;
        if (!start) start = ts;
        var p = Math.min((ts - start) / 450, 1);
        el.balance.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function renderLedger() {
      if (!state.ledger.length) { el.ledger.innerHTML = '<li class="is-empty">ledger is empty</li>'; return; }
      el.ledger.innerHTML = state.ledger.slice(-6).reverse().map(function (e) {
        return '<li><span class="t t--' + e.type.toLowerCase() + '">' + e.type + '</span><span class="d">' + e.note + '</span>' +
          '<span class="' + (e.delta >= 0 ? 'pos' : 'neg') + '">' + (e.delta >= 0 ? '+' : '−') + Math.abs(e.delta) + '</span>' +
          '<span class="bal">= ' + e.balance + '</span></li>';
      }).join('');
    }

    function post(type, delta, note) {
      state.balance += delta;
      state.ledger.push({ type: type, delta: delta, note: note, balance: state.balance });
    }

    function say(text, cls) { el.verdict.textContent = text; el.verdict.className = 'verdict ' + (cls || ''); bump(el.verdict); }

    function sync() {
      el.tx.textContent = 'transactionId: ' + txId();
      var sent = !!state.processed[txId()];
      el.send.disabled = sent;
      el.retry.disabled = !sent;
      el.next.disabled = !sent;
      el.refund.disabled = !state.order || state.order.refunded;
      renderReceipt(); renderLedger(); countTo(state.balance);
    }

    onSeg($('#bAmounts'), function (b) { state.amount = Math.round(parseFloat(b.dataset.amount) * 100); say(''); renderReceipt(); });
    onSeg($('#bPartnerPts'), function (b) { state.partnerPts = +b.dataset.pts; });
    el.redeem.addEventListener('input', function () { renderReceipt(); });

    el.pay.addEventListener('click', function () {
      var q = quote(), no = ++state.orderNo;
      q.no = no; q.before = state.balance; q.refunded = false;
      if (q.pts > 0) post('REDEEMED', -q.pts, 'order #' + no);
      if (q.earn > 0) post('EARNED', q.earn, 'order #' + no + ' · 5% of ' + sar(q.due));
      state.order = q;
      say('Order #' + no + ' paid ' + sar(q.due) + ' · used ' + q.pts + ' pts · earned ' + q.earn + ' pts', 'is-mute');
      sync();
    });

    el.refund.addEventListener('click', function () {
      var o = state.order;
      if (!o || o.refunded) return;
      if (o.pts > 0) post('RESTORED', o.pts, 'refund #' + o.no + ' · spent points back');
      if (o.earn > 0) post('REVERSED', -o.earn, 'refund #' + o.no + ' · earned points undone');
      o.refunded = true;
      var net = state.ledger.filter(function (e) { return e.note.indexOf('#' + o.no) > -1; })
        .reduce(function (s, e) { return s + e.delta; }, 0);
      say(net === 0 ? '✓ refund #' + o.no + ': the order\'s points net to exactly 0' : 'mismatch', net === 0 ? 'is-ok' : 'is-warn');
      sync();
    });

    el.send.addEventListener('click', function () {
      var id = txId();
      if (state.processed[id]) return;
      var credit = Math.floor(state.partnerPts / PARTNER_RATE);
      state.processed[id] = { credit: credit };
      post('PARTNER', credit, id + ' · ' + state.partnerPts + ' partner pts');
      say('✓ ' + id + ' processed: +' + credit + ' points', 'is-ok');
      sync();
    });

    el.retry.addEventListener('click', function () {
      var id = txId(), r = state.processed[id];
      if (!r) return;
      say('↺ ' + id + ' was already processed: same result returned (+' + r.credit + '), nothing credited again', 'is-warn');
    });

    el.next.addEventListener('click', function () { state.txNo++; say(''); sync(); });

    sync();
  })();

  (function flags() {
    var flow = $('#flow');
    if (!flow) return;
    var log = $('#fLog code') || $('#fLog'), verdict = $('#fVerdict'), send = $('#fSend');
    var state = { flag: 'on', prov: 'healthy' }, busy = false;

    onSeg($('#fFlag'), function (b) { state.flag = b.dataset.v; });
    onSeg($('#fProv'), function (b) { state.prov = b.dataset.v; });

    function reset() { $$('.node, .wire', flow).forEach(function (n) { n.classList.remove('is-ok', 'is-err', 'is-warn'); }); }
    function mark(sel, cls) { var n = $(sel, flow); if (n) { n.classList.remove('is-ok', 'is-err', 'is-warn'); n.classList.add(cls); } }
    function line(html) { log.innerHTML += (log.dataset.started ? '\n' : '') + html; log.dataset.started = '1'; }

    function run() {
      if (busy) return;
      busy = true; send.disabled = true;
      reset(); log.innerHTML = ''; delete log.dataset.started;
      verdict.textContent = ''; verdict.className = 'verdict';

      var healthy = state.prov === 'healthy';
      var steps = [
        function () { mark('[data-n="0"]', 'is-ok'); line('→ POST /reports'); },
        function () { mark('[data-w="0"]', 'is-ok'); mark('[data-n="1"]', 'is-ok'); line('  FeatureFlagGuard reads @FeatureFlag("new-report")'); },
        function () { mark('[data-w="1"]', 'is-ok'); mark('[data-n="2"]', 'is-ok'); line('  FeatureFlagService → port → UnleashAdapter.isEnabled()'); },
        function () {
          if (healthy) {
            mark('[data-w="2"]', 'is-ok'); mark('[data-n="3"]', 'is-ok');
            line('  unleash → <span class="ok">' + (state.flag === 'on') + '</span>');
          } else {
            mark('[data-w="2"]', 'is-err'); mark('[data-n="3"]', 'is-err');
            line('  unleash → <span class="err">' + (state.prov === 'timeout' ? 'SDK not synced within the timeout' : 'unreachable') + '</span>');
          }
        },
        function () {
          if (healthy && state.flag === 'on') {
            line('<span class="ok">← 201 report created</span>');
            verdict.textContent = '✓ feature on'; verdict.classList.add('is-ok');
          } else if (healthy) {
            line('← denied through the app\'s own exception: feature disabled');
            verdict.textContent = 'feature off (flag says so)'; verdict.classList.add('is-mute');
          } else {
            mark('[data-n="2"]', 'is-warn');
            line('<span class="warn">  adapter: no trusted answer → treat as disabled (fail-closed)</span>');
            line('← denied, exactly like a disabled flag');
            verdict.textContent = '⚠ fail-closed: denied'; verdict.classList.add('is-warn');
          }
          busy = false; send.disabled = false;
        }
      ];
      var gap = reduceMotion ? 0 : 330;
      steps.forEach(function (fn, i) { setTimeout(fn, i * gap); });
    }

    send.addEventListener('click', run);
  })();

  (function codes() {
    var panel = $('[data-demo="codes"]');
    if (!panel) return;
    var el = {
      method: $('#dMethod'), mode: $('#dMode'), chain: $('#dChain'), orders: $('#dOrders'), hint: $('#dHint'),
      global: $('#dGlobal'), cat: $('#dCat'), opt: $('#dOpt'), optLabel: $('#dOptLabel'), create: $('#dCreate')
    };
    var LABEL = { courier: 'Courier', locker: 'Locker', pickup: 'Pickup point' };
    var methodOn = { courier: true, locker: false, pickup: true };
    var state = { method: 'courier', mode: 'snapshot', next: 501 };
    var orders = [];

    function resolve(method) {
      return [['Store-wide', el.global.checked], ['Category', el.cat.checked], [LABEL[method], methodOn[method]]];
    }
    function allowed(method) { return resolve(method).every(function (l) { return l[1]; }); }

    function renderChain() {
      var active = true, html = '';
      resolve(state.method).forEach(function (l) {
        if (!active) { html += '<li class="is-skip"><span>·</span>' + l[0] + '</li>'; return; }
        html += '<li class="' + (l[1] ? 'is-on' : 'is-off') + '"><span>' + (l[1] ? '✓' : '✕') + '</span>' + l[0] + '</li>';
        if (!l[1]) active = false;
      });
      html += '<li class="chain__result ' + (active ? 'is-on' : 'is-off') + '">' + (active ? 'PIN required' : 'No PIN') + '</li>';
      el.chain.innerHTML = html;
    }

    function renderOrders(changed) {
      if (!orders.length) {
        el.orders.innerHTML = '';
        el.hint.textContent = 'No open orders yet. Create one, then change a setting.';
        return;
      }
      var diverged = 0;
      el.orders.innerHTML = orders.map(function (o) {
        var live = allowed(o.method);
        var needs = state.mode === 'snapshot' ? o.snapshot : live;
        var differs = o.snapshot !== live;
        if (differs) diverged++;
        return '<li class="' + (differs && changed ? 'is-held' : '') + '">' +
          '<span class="id">#' + o.id + '</span>' +
          '<span class="snap">' + LABEL[o.method] + ' → <b class="' + (needs ? 'y' : 'n') + '">' + (needs ? 'PIN required' : 'no PIN') + '</b></span>' +
          '<span class="lock">' + (state.mode === 'snapshot' ? 'decided at creation' : 'decided now') + '</span></li>';
      }).join('');
      el.hint.textContent = state.mode === 'snapshot'
        ? (diverged ? diverged + ' open order' + (diverged === 1 ? ' keeps' : 's keep') + ' the answer from when it was created. Switch to live to see the difference.' : 'Each order keeps the answer it got at creation.')
        : (diverged ? diverged + ' open order' + (diverged === 1 ? ' follows' : 's follow') + ' today\'s settings instead of the answer stored at creation.' : 'Every open order follows today\'s settings.');
    }

    function render(changed) {
      el.optLabel.textContent = LABEL[state.method];
      el.opt.checked = methodOn[state.method];
      renderChain();
      renderOrders(changed);
    }

    onSeg(el.method, function (b) { state.method = b.dataset.v; render(false); });
    onSeg(el.mode, function (b) { state.mode = b.dataset.v; render(false); });
    el.opt.addEventListener('change', function () { methodOn[state.method] = el.opt.checked; render(true); });
    [el.global, el.cat].forEach(function (i) { i.addEventListener('change', function () { render(true); }); });
    el.create.addEventListener('click', function () {
      orders.unshift({ id: state.next++, method: state.method, snapshot: allowed(state.method) });
      if (orders.length > 4) orders.pop();
      render(false);
    });
    render(false);
  })();
})();
