/* biohacker.fun — netadmin-toolbox 官网
   原生 JS，无依赖。四个开关：数据层 / 网格 / 菜单 / 筛选。
   动效全部走 IntersectionObserver，尊重 prefers-reduced-motion。 */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 01 顶栏状态 ---------- */
  var bar = document.getElementById('topbar');
  var onScroll = function () {
    if (bar) bar.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 02 数据层 / 网格 ---------- */
  var KEY = 'bf.pref.';

  function read(k) {
    try { return localStorage.getItem(KEY + k); } catch (e) { return null; }
  }
  function write(k, v) {
    try { localStorage.setItem(KEY + k, v); } catch (e) { /* 忽略隐私模式 */ }
  }

  var toggles = {
    layer: {
      attr: 'layer', on: 'data', off: 'identity',
      btn: document.querySelector('[data-toggle="layer"]')
    },
    grid: {
      attr: 'grid', on: 'on', off: 'off',
      btn: document.querySelector('[data-toggle="grid"]')
    }
  };

  function apply(name, value) {
    var t = toggles[name];
    if (!t) return;
    root.setAttribute('data-' + t.attr, value);
    if (t.btn) t.btn.setAttribute('aria-pressed', value === t.on ? 'true' : 'false');
    write(name, value);
    if (name === 'grid' && value === t.on) measureWrap();
  }

  Object.keys(toggles).forEach(function (name) {
    var t = toggles[name];
    var saved = read(name);
    var initial = saved === t.on || saved === t.off ? saved : t.off;
    apply(name, initial);
    if (t.btn) {
      t.btn.addEventListener('click', function () {
        var now = root.getAttribute('data-' + t.attr);
        apply(name, now === t.on ? t.off : t.on);
      });
    }
  });

  /* 键盘：D 数据层 / G 网格 / Esc 关菜单；输入框内不拦截 */
  document.addEventListener('keydown', function (e) {
    var el = e.target;
    var typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (e.key === 'Escape') {
      body.classList.remove('is-menu');
      var mb = document.querySelector('.menu-btn');
      if (mb) { mb.setAttribute('aria-expanded', 'false'); mb.textContent = '菜单'; }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toLowerCase();
    if (k === 'd' || k === 'g') {
      var name = k === 'd' ? 'layer' : 'grid';
      var now = root.getAttribute('data-' + toggles[name].attr);
      apply(name, now === toggles[name].on ? toggles[name].off : toggles[name].on);
    }
    if (k === '/') {
      var q = document.getElementById('atlas-q');
      if (q) { e.preventDefault(); q.focus(); }
    }
  });

  /* ---------- 03 首屏走线：进入视口后画出 ---------- */
  var traces = document.querySelector('.traces');
  if (traces) {
    if (reduce || !('IntersectionObserver' in window)) {
      traces.classList.add('is-drawn');
    } else {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { traces.classList.add('is-drawn'); tio.disconnect(); }
        });
      }, { threshold: 0.15 });
      tio.observe(traces);
    }
  }

  /* ---------- 04 逐段显现 ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
        el.style.transitionDelay = Math.min(sibs, 5) * 45 + 'ms';
        el.classList.add('is-in');
        rio.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- 05 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var current = null;
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (current === en.target) return;
        current = en.target;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { nio.observe(s); });
  }

  /* ---------- 06 移动端菜单 ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = body.classList.toggle('is-menu');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? '关闭' : '菜单';
    });
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('is-menu');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.textContent = '菜单';
      });
    });
  }

  /* ---------- 07 模块图谱筛选 ---------- */
  var q = document.getElementById('atlas-q');
  var boards = Array.prototype.slice.call(document.querySelectorAll('.board'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var nMods = document.getElementById('atlas-n');
  var nGroups = document.getElementById('atlas-g');
  var empty = document.getElementById('atlas-empty');
  var reset = document.getElementById('atlas-reset');
  var group = 'all';

  function weight(li) {
    var n = li.getAttribute('data-n');
    return n ? parseInt(n, 10) : 1;
  }

  function filter() {
    var kw = (q && q.value || '').trim().toLowerCase();
    var total = 0, groups = 0;

    boards.forEach(function (b) {
      var hit = group === 'all' || b.getAttribute('data-g') === group;
      var shown = 0;

      b.querySelectorAll('.mod').forEach(function (li) {
        var k = (li.getAttribute('data-k') || '') + ' ' + li.textContent.toLowerCase();
        var ok = hit && (!kw || k.toLowerCase().indexOf(kw) > -1);
        li.classList.toggle('is-hidden', !ok);
        if (ok) shown += weight(li);
      });

      var visible = hit && shown > 0;
      b.classList.toggle('is-hidden', !visible);
      if (visible) { groups++; total += shown; }
    });

    if (nMods) nMods.textContent = total;
    if (nGroups) nGroups.textContent = groups;
    if (empty) empty.hidden = total !== 0;
    return total;
  }

  if (q) {
    q.addEventListener('input', filter);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { q.value = ''; filter(); q.blur(); }
    });
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.remove('is-on'); });
      c.classList.add('is-on');
      group = c.getAttribute('data-g');
      filter();
    });
  });

  if (reset) {
    reset.addEventListener('click', function () {
      if (q) q.value = '';
      group = 'all';
      chips.forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-g') === 'all'); });
      filter();
    });
  }

  filter();

  /* ---------- 08 复制 ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var old = btn.innerHTML;
        btn.classList.add('is-done');
        btn.innerHTML = '已复制 <span class="mono">✓</span>';
        setTimeout(function () {
          btn.classList.remove('is-done');
          btn.innerHTML = old;
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { /* 无权限时静默 */ });
      }
    });
  });

  /* ---------- 09 网格标尺读数 ---------- */
  function measureWrap() {
    var out = document.querySelector('.js-wrap-w');
    var box = document.querySelector('.gridlayer__in');
    if (out && box) out.textContent = Math.round(box.getBoundingClientRect().width);
  }
  measureWrap();
  window.addEventListener('resize', measureWrap);

  /* ---------- 10 横向溢出提示 ---------- */
  /* 代码块 / CLI 块 / 表格在窄屏会横向滚动，右缘渐隐表示"还有内容"，
     滚到末尾即恢复实色——不做假的永远渐隐。 */
  (function () {
    var els = [].slice.call(document.querySelectorAll('pre.code, .cli__pre, .tree pre, .tblwrap'));
    if (!els.length) return;

    function check(el) {
      var more = el.scrollWidth - el.clientWidth;
      if (more > 2) {
        el.classList.add('ovfx');
        el.classList.toggle('at-end', el.scrollLeft >= more - 2);
      } else {
        el.classList.remove('ovfx', 'at-end');
      }
    }

    els.forEach(function (el) {
      el.addEventListener('scroll', function () { check(el); }, { passive: true });
    });

    function all() { els.forEach(check); }
    all();
    window.addEventListener('resize', all);

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  })();
})();
