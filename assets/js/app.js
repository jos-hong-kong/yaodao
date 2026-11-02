/* Yao Dao Project — client app.
   Hash routing: #/<lang>/<page>[/<section>]   e.g. #/zh/research/overview
   No framework, no build step. */
(() => {
  'use strict';

  const LANGS = ['en', 'zh'];
  const HTML_LANG = { en: 'en', zh: 'zh-Hant' };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage may be blocked in sandboxed previews */ } }
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const S = { translated: {}, lang: 'en', page: 'home', anchor: null, ui: null, tree: [], flat: [], byId: {}, videos: {}, cache: {}, open: new Set(), lastHeads: [] };

  /* ---------- data ---------- */
  async function getJSON(url) {
    if (S.cache[url]) return S.cache[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ' ' + r.status);
    return (S.cache[url] = await r.json());
  }
  async function tryJSON(url) { try { return await getJSON(url); } catch { return null; } }

  function indexTree(nodes, parent = null, depth = 0) {
    nodes.forEach(n => {
      n.parent = parent; n.depth = depth;
      S.byId[n.id] = n; S.flat.push(n);
      if (n.children) indexTree(n.children, n, depth + 1);
    });
  }
  const t = key => (S.ui[S.lang] && S.ui[S.lang][key]) || S.ui.en[key] || key;
  const title = n => n.title[S.lang] || n.title.en;

  /* ---------- routing ---------- */
  function parseHash() {
    const parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    let lang = LANGS.includes(parts[0]) ? parts.shift() : null;
    if (!lang) {
      lang = store.get('yd-lang');
      if (!LANGS.includes(lang)) lang = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
    }
    const page = S.byId[parts[0]] ? parts[0] : 'home';
    return { lang, page, anchor: parts[1] || null };
  }
  const href = (page, anchor, lang = S.lang) => '#/' + lang + '/' + page + (anchor ? '/' + encodeURIComponent(anchor) : '');
  function go(page, anchor) { location.hash = href(page, anchor).slice(1); }

  /* ---------- UI strings, theme, language ---------- */
  function applyI18n() {
    document.documentElement.lang = HTML_LANG[S.lang];
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('#langSwitch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === S.lang)));
    $('#langSwitch').setAttribute('aria-label', t('lang'));
    $('#wordmark').setAttribute('href', href('home'));
    $('#expandAll').textContent = t('expandAll');
    $('#collapseAll').textContent = t('collapseAll');
    $('#treeClose').setAttribute('aria-label', t('closeMenu'));
    updateTreeToggle();
    updateThemeButton();
  }
  function setTheme(th) {
    document.documentElement.setAttribute('data-theme', th);
    store.set('yd-theme', th);
    updateThemeButton();
  }
  function updateThemeButton() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const b = $('#themeToggle');
    b.setAttribute('aria-pressed', String(dark));
    b.setAttribute('aria-label', dark ? t('toLight') : t('toDark'));
    b.title = dark ? t('toLight') : t('toDark');
    $('#themeLabel').textContent = dark ? t('toLight') : t('toDark');
  }
  const isMobile = () => window.matchMedia('(max-width: 1023px)').matches;
  function updateTreeToggle() {
    const b = $('#treeToggle');
    const open = isMobile() ? document.body.classList.contains('tree-open') : !document.body.classList.contains('tree-collapsed');
    b.setAttribute('aria-expanded', String(open));
    b.title = open && !isMobile() ? t('hideTree') : t('showTree');
  }
  function openDrawer(open) {
    document.body.classList.toggle('tree-open', open);
    $('#scrim').hidden = !open;
    updateTreeToggle();
    if (open) { const cur = $('#tree a[aria-current="page"]') || $('#tree a[tabindex="0"]'); cur && cur.focus(); }
    else if (isMobile()) $('#treeToggle').focus();
  }

  /* ---------- tree ---------- */
  const CHEV = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildTree() {
    const root = $('#tree');
    const mk = (nodes, level) => {
      const ul = document.createElement('ul');
      if (level === 1) { ul.setAttribute('role', 'tree'); ul.setAttribute('aria-label', t('treeLabel')); } else ul.setAttribute('role', 'group');
      nodes.forEach(n => {
        const li = document.createElement('li'); li.setAttribute('role', 'none'); li.dataset.id = n.id;
        const hasKids = !!(n.children && n.children.length);
        const a = document.createElement('a');
        a.setAttribute('role', 'treeitem'); a.setAttribute('aria-level', level); a.href = href(n.id); a.tabIndex = -1; a.dataset.id = n.id;
        a.innerHTML = '<span class="chev' + (hasKids ? '' : ' none') + '" data-chev>' + CHEV + '</span><span class="label"></span>';
        a.querySelector('.label').textContent = title(n);
        if (hasKids || n.id) a.setAttribute('aria-expanded', hasKids ? String(S.open.has(n.id)) : 'false');
        if (!hasKids) a.removeAttribute('aria-expanded');
        li.appendChild(a);
        if (hasKids) {
          const sub = mk(n.children, level + 1); sub.hidden = !S.open.has(n.id); li.appendChild(sub);
        }
        const grp = document.createElement('ul'); grp.setAttribute('role', 'group'); grp.className = 'group-sections'; grp.hidden = true;
        li.appendChild(grp);
        ul.appendChild(li);
      });
      return ul;
    };
    root.replaceChildren(mk(S.tree, 1));
    const first = $('#tree a[role="treeitem"]'); if (first) first.tabIndex = 0;
  }

  function setExpanded(li, open) {
    const a = li.querySelector(':scope > a');
    const kids = li.querySelector(':scope > ul:not(.group-sections)');
    const secs = li.querySelector(':scope > ul.group-sections');
    const hasSecs = secs && secs.children.length;
    if (!kids && !hasSecs) return;
    a.setAttribute('aria-expanded', String(open));
    if (kids) kids.hidden = !open;
    if (secs) secs.hidden = !open || !hasSecs;
    open ? S.open.add(li.dataset.id) : S.open.delete(li.dataset.id);
  }

  function renderSectionLeaves(pageId, heads) {
    $$('#tree ul.group-sections').forEach(u => { u.replaceChildren(); u.hidden = true; });
    $$('#tree li.section').forEach(x => x.remove());
    const li = $(`#tree li[data-id="${pageId}"]`);
    if (!li) return;
    const secs = li.querySelector(':scope > ul.group-sections');
    heads.forEach(h => {
      const s = document.createElement('li'); s.setAttribute('role', 'none'); s.className = 'section';
      const a = document.createElement('a'); a.setAttribute('role', 'treeitem'); a.setAttribute('aria-level', (S.byId[pageId].depth || 0) + 2);
      a.tabIndex = -1; a.href = href(pageId, h.id); a.dataset.section = h.id; a.textContent = h.text;
      s.appendChild(a); secs.appendChild(s);
    });
    const a = li.querySelector(':scope > a');
    const kids = li.querySelector(':scope > ul:not(.group-sections)');
    if (heads.length && !kids) { a.setAttribute('aria-expanded', 'true'); S.open.add(pageId); }
    if (heads.length || kids) { a.querySelector('.chev').classList.remove('none'); }
    if (heads.length) { if (!a.hasAttribute('aria-expanded')) a.setAttribute('aria-expanded', 'true'); }
    const open = a.getAttribute('aria-expanded') === 'true';
    secs.hidden = !open || !heads.length;
    if (kids) kids.hidden = !open;
  }

  function markCurrent(pageId) {
    $$('#tree a[role="treeitem"]').forEach(a => { a.removeAttribute('aria-current'); a.classList.remove('spy'); });
    const a = $(`#tree li[data-id="${pageId}"] > a`);
    if (!a) return;
    a.setAttribute('aria-current', 'page');
    // the current branch opens by itself so its children and sections are visible
    if (a.hasAttribute('aria-expanded')) setExpanded(a.parentElement, true);
    // open ancestors
    let n = S.byId[pageId].parent;
    while (n) { const li = $(`#tree li[data-id="${n.id}"]`); li && setExpanded(li, true); n = n.parent; }
    // roving tabindex
    $$('#tree a[role="treeitem"]').forEach(x => (x.tabIndex = -1)); a.tabIndex = 0;
  }

  function visibleItems() {
    return $$('#tree a[role="treeitem"]').filter(a => { let p = a.parentElement; while (p && p.id !== 'tree') { if (p.hidden) return false; p = p.parentElement; } return true; });
  }
  function focusItem(a) { if (!a) return; $$('#tree a[role="treeitem"]').forEach(x => (x.tabIndex = -1)); a.tabIndex = 0; a.focus(); }

  function wireTree() {
    const tree = $('#tree');
    tree.addEventListener('click', e => {
      const chev = e.target.closest('[data-chev]');
      const a = e.target.closest('a[role="treeitem"]');
      if (!a) return;
      const li = a.parentElement;
      if (chev && a.hasAttribute('aria-expanded')) {
        e.preventDefault(); setExpanded(li, a.getAttribute('aria-expanded') !== 'true'); focusItem(a); return;
      }
      // label click: open the branch and load the page
      if (a.dataset.id && a.hasAttribute('aria-expanded') && a.getAttribute('aria-expanded') !== 'true') setExpanded(li, true);
      if (isMobile()) openDrawer(false);
    });
    tree.addEventListener('keydown', e => {
      const a = e.target.closest('a[role="treeitem"]'); if (!a) return;
      const items = visibleItems(); const i = items.indexOf(a); const li = a.parentElement;
      const expanded = a.getAttribute('aria-expanded');
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); focusItem(items[i + 1]); break;
        case 'ArrowUp': e.preventDefault(); focusItem(items[i - 1]); break;
        case 'Home': e.preventDefault(); focusItem(items[0]); break;
        case 'End': e.preventDefault(); focusItem(items[items.length - 1]); break;
        case 'ArrowRight':
          e.preventDefault();
          if (expanded === 'false') setExpanded(li, true);
          else if (expanded === 'true') focusItem(items[i + 1]);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (expanded === 'true') setExpanded(li, false);
          else { const parent = li.parentElement.closest('li'); parent && focusItem(parent.querySelector(':scope > a')); }
          break;
        case ' ': if (expanded) { e.preventDefault(); setExpanded(li, expanded !== 'true'); } break;
        case 'Escape': if (isMobile()) openDrawer(false); break;
      }
    });
    $('#expandAll').addEventListener('click', () => $$('#tree li').forEach(li => li.querySelector(':scope > a[aria-expanded]') && setExpanded(li, true)));
    $('#collapseAll').addEventListener('click', () => {
      $$('#tree li').forEach(li => li.querySelector(':scope > a[aria-expanded]') && setExpanded(li, false));
    });
  }

  /* ---------- content ---------- */
  const slug = (s, i) => { const x = s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}]+/g, '-').replace(/^-|-$/g, '').slice(0, 48); return x || 'part-' + i; };

  async function loadContent(id) {
    const en = await getJSON(`content/en/${id}.json`);
    if (S.lang === 'en') return { data: en, state: 'full' };
    const zh = (S.translated.zh || []).includes(id) ? await tryJSON(`content/zh/${id}.json`) : null;
    if (!zh) return { data: en, state: 'none' };
    if (id === 'team') return { data: zh, state: zh.partial ? 'partial' : 'full' };
    const data = JSON.parse(JSON.stringify(en));
    let missing = 0;
    data.blocks.forEach((b, i) => {
      if (b.t === 'html' || b.t === 'blurb') {
        const tr = zh.blocks && zh.blocks[i];
        if (tr && tr.html) { b.html = tr.html; if (tr.title) b.title = tr.title; } else missing++;
      }
    });
    if (zh.title) data.title = zh.title;
    return { data, state: missing ? 'partial' : 'full' };
  }

  /* Pull a leading heading out of the first block so it can be the page title. */
  function extractTitle(data, node) {
    const first = data.blocks[0];
    if (first && first.t === 'html') {
      const d = document.createElement('div'); d.innerHTML = first.html;
      const h = d.firstElementChild;
      if (h && /^H[12]$/.test(h.tagName)) {
        const text = h.textContent.trim();
        h.remove();
        first.html = d.innerHTML.trim();
        if (!first.html) data.blocks.shift();
        return text;
      }
    }
    return title(node);
  }

  function prepProse(html, heads) {
    const d = document.createElement('div'); d.innerHTML = html;
    $$('h1,h2', d).forEach(h => {
      const text = h.textContent.replace(/\s+/g, ' ').trim();
      const n = document.createElement('h2'); n.innerHTML = h.innerHTML;
      let id = slug(text, heads.length), k = 2; while (heads.some(x => x.id === id)) id = slug(text, heads.length) + '-' + k++;
      n.id = id; heads.push({ id, text });
      h.replaceWith(n);
    });
    $$('a[href^="route:"]', d).forEach(a => { a.setAttribute('href', href(a.getAttribute('href').slice(6))); });
    $$('img', d).forEach(i => { i.loading = 'lazy'; });
    return d.innerHTML;
  }

  function figure(src, alt, cls = '') {
    return `<figure class="${cls}"><img src="${esc(src)}" alt="${esc(alt || '')}" loading="lazy" data-zoom></figure>`;
  }

  function videoHTML(id, poster) {
    const v = S.videos[id]; if (!v) return '';
    const pimg = poster || v.poster;
    const ttl = (v.title && (v.title[S.lang] || v.title.en)) || id;
    return `<figure class="video" data-video="${esc(id)}">
      <div class="video-frame"><button type="button" class="video-poster" aria-label="${esc(t('play') + ': ' + ttl)}" ${pimg ? `style="background-image:url('${esc(pimg)}')"` : ''}>
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg></span></button></div>
      <figcaption><strong>${esc(ttl)}</strong>${v.duration ? `<span>${esc(v.duration)}</span>` : ''}${v.type === 'drive' ? `<span>${esc(t('videoLarge'))}</span><a href="https://drive.google.com/file/d/${esc(v.id)}/view" target="_blank" rel="noopener">${esc(t('openDrive'))}</a>` : ''}${v.type === 'youtube' ? `<a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener">${esc(t('watchYouTube'))}</a>` : ''}</figcaption>
    </figure>`;
  }
  function activateVideo(fig) {
    const v = S.videos[fig.dataset.video]; const frame = $('.video-frame', fig);
    let el;
    if (v.type === 'youtube') {
      el = document.createElement('iframe'); el.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`;
      el.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; el.allowFullscreen = true;
    } else if (v.type === 'drive') {
      el = document.createElement('iframe'); el.src = `https://drive.google.com/file/d/${v.id}/preview`;
      el.allow = 'autoplay; fullscreen'; el.allowFullscreen = true;
    } else {
      el = document.createElement('video'); el.src = v.src; el.controls = true; el.autoplay = true; el.playsInline = true;
    }
    el.title = ($('strong', fig) || {}).textContent || '';
    frame.replaceChildren(el);
    if (el.focus) el.focus();
  }

  function renderBlocks(data, heads) {
    let out = ''; const b = data.blocks;
    for (let i = 0; i < b.length; i++) {
      const x = b[i];
      if (x.t === 'html') out += `<div class="prose${data.slug === 'publications' ? ' refs' : ''}">${prepProse(x.html, heads)}</div>`;
      else if (x.t === 'image') {
        const run = [x]; while (b[i + 1] && b[i + 1].t === 'image') run.push(b[++i]);
        out += run.length === 1 ? figure(x.src, x.alt, 'fig fig-wide') : `<div class="fig-row">${run.map(r => figure(r.src, r.alt)).join('')}</div>`;
      } else if (x.t === 'gallery') out += `<div class="fig-row">${x.images.map(s => figure(s, '')).join('')}</div>`;
      else if (x.t === 'video') {
        out += videoHTML(x.id, x.poster);
      } else if (x.t === 'blurb') {
        out += `<section class="blurb">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy">` : ''}<div><h2>${esc(x.title || '')}</h2><div class="prose">${prepProse(x.html, [])}</div></div></section>`;
        if (x.title) heads.push({ id: slug(x.title, heads.length), text: x.title });
      }
    }
    return out;
  }

  function renderTeam(data, heads) {
    return data.groups.map(g => {
      const label = (S.ui[S.lang]['team.' + g.id] && t('team.' + g.id)) || g.title;
      const id = 'team-' + g.id; heads.push({ id, text: label });
      let body = '';
      if (g.intro) body += `<div class="prose">${prepProse(g.intro, [])}</div>`;
      if (g.layout === 'bio') body += g.members.map(m => `<article class="bio"><img src="${esc(m.img)}" alt="" loading="lazy"><div class="prose">${prepProse(m.html, [])}</div></article>`).join('');
      else if (g.layout === 'card') body += `<div class="cards">${g.members.map(m => `<div class="card${m.bio ? ' has-bio' : ''}"><img src="${esc(m.img)}" alt="" loading="lazy"><div>${prepProse(m.html, [])}</div>${m.bio ? `<details><summary>${esc(t('readBio'))}</summary><div class="prose">${prepProse(m.bio, [])}</div></details>` : ''}</div>`).join('')}</div>`;
      else if (g.layout === 'figure') body += g.members.map(m => `<figure class="figure-block fig"><img src="${esc(m.img)}" alt="" loading="lazy" data-zoom><figcaption>${m.html.replace(/<\/?p>/g, ' ')}</figcaption></figure>`).join('');
      return `<section class="team-group"><h2 id="${id}">${esc(label)}</h2>${body}</section>`;
    }).join('');
  }

  function crumbs(node) {
    const chain = []; for (let n = node; n; n = n.parent) chain.unshift(n);
    if (chain[0].id !== 'home') chain.unshift(S.byId.home);
    return `<nav class="crumbs" aria-label="${esc(t('breadcrumb'))}"><ol>${chain.map((n, i) => i === chain.length - 1 ? `<li><span aria-current="page">${esc(title(n))}</span></li>` : `<li><a href="${href(n.id)}">${esc(title(n))}</a></li>`).join('')}</ol></nav>`;
  }
  function pager(node) {
    const i = S.flat.indexOf(node); const p = S.flat[i - 1], n = S.flat[i + 1];
    return `<nav class="pager" aria-label="${esc(t('prev') + ' / ' + t('next'))}">${p ? `<a class="prev" href="${href(p.id)}"><small>← ${esc(t('prev'))}</small><span class="t">${esc(title(p))}</span></a>` : '<span></span>'}${n ? `<a class="next" href="${href(n.id)}"><small>${esc(t('next'))} →</small><span class="t">${esc(title(n))}</span></a>` : ''}</nav>`;
  }
  function exploreTree() {
    const li = n => `<li><a href="${href(n.id)}">${esc(title(n))}</a>${n.children ? `<ul>${n.children.map(li).join('')}</ul>` : ''}</li>`;
    return `<section class="explore" aria-labelledby="explore-h"><h2 id="explore-h">${esc(t('explore'))}</h2><ul class="map-tree">${S.tree.filter(n => n.id !== 'home').map(li).join('')}</ul></section>`;
  }

  async function render() {
    const main = $('#main'); const node = S.byId[S.page];
    let res;
    try { res = await loadContent(S.page); } catch (e) {
      main.innerHTML = `<div class="page"><p class="notice">${esc(t('loadError'))} <a href="${href('home')}">${esc(t('backHome'))}</a></p></div>`;
      return;
    }
    const { data, state } = res; const heads = [];
    let html;
    if (S.page === 'team') {
      const ttl = title(node);
      html = `${crumbs(node)}<h1 class="page-title">${esc(ttl)}</h1><hr class="rule">${state !== 'full' && S.lang === 'zh' ? `<p class="notice" role="status">${esc(t(state === 'none' ? 'noTranslation' : 'partialTranslation'))}</p>` : ''}${renderTeam(data, heads)}`;
    } else if (S.page === 'home') {
      const first = data.blocks[0]; const d = document.createElement('div'); d.innerHTML = first.html;
      const lead = $('p', d); const leadHTML = lead ? lead.innerHTML : ''; if (lead) lead.remove();
      const h1s = $$('h1', d).map(h => h.textContent.trim()); $$('h1', d).forEach(h => h.remove());
      first.html = d.innerHTML;
      const latin = h1s.find(x => /[A-Za-z]/.test(x)) || 'The Yao Dao Project';
      html = `<section class="hero"><p class="hero-eyebrow">${S.lang === 'zh' ? '道教 · 藍靛瑤 · 老撾、中國、越南' : 'Daoism · Lanten Yao · Laos, China, Vietnam'}</p>
        <h1>${esc(latin.replace(/^The /, S.lang === 'en' ? 'The ' : ''))}<span class="han" lang="zh-Hant">瑤道</span></h1>
        <p class="lead">${leadHTML}</p></section>${state !== 'full' && S.lang === 'zh' ? `<p class="notice" role="status">${esc(t(state === 'none' ? 'noTranslation' : 'partialTranslation'))}</p>` : ''}
        ${renderBlocks(data, heads)}${exploreTree()}`;
    } else {
      const ttl = extractTitle(data, node);
      html = `${crumbs(node)}<h1 class="page-title">${esc(ttl)}</h1><hr class="rule">${state !== 'full' && S.lang === 'zh' ? `<p class="notice" role="status">${esc(t(state === 'none' ? 'noTranslation' : 'partialTranslation'))}</p>` : ''}${renderBlocks(data, heads)}${pager(node)}`;
      document.title = ttl + ' · ' + t('siteName') + ' 瑤道';
    }
    if (S.page === 'home' || S.page === 'team') document.title = (S.page === 'home' ? t('siteName') : title(node) + ' · ' + t('siteName')) + ' 瑤道';
    main.innerHTML = `<div class="page">${html}</div>`;
    S.lastHeads = heads;
    renderSectionLeaves(S.page, S.page === 'home' ? [] : heads);
    markCurrent(S.page);
    watchSections();
    if (S.anchor) { const el = document.getElementById(S.anchor); el ? el.scrollIntoView({ block: 'start' }) : window.scrollTo(0, 0); }
    else window.scrollTo(0, 0);
  }

  let spy;
  function watchSections() {
    if (spy) spy.disconnect();
    const hs = $$('#main h2[id]'); if (!hs.length) return;
    spy = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      $$('#tree a.spy').forEach(a => a.classList.remove('spy'));
      const leaf = $(`#tree a[data-section="${CSS.escape(visible.target.id)}"]`); leaf && leaf.classList.add('spy');
    }, { rootMargin: '-72px 0px -70% 0px' });
    hs.forEach(h => spy.observe(h));
  }

  /* ---------- lightbox ---------- */
  const LB = { list: [], i: 0 };
  function lbShow(i) {
    LB.i = (i + LB.list.length) % LB.list.length;
    const img = LB.list[LB.i]; $('#lbImg').src = img.currentSrc || img.src; $('#lbImg').alt = img.alt || '';
    $('#lbCap').textContent = (LB.i + 1) + ' / ' + LB.list.length;
    const single = LB.list.length < 2; $('#lbPrev').hidden = single; $('#lbNext').hidden = single;
  }

  /* ---------- boot ---------- */
  async function route() {
    const r = parseHash();
    const langChanged = r.lang !== S.lang || !$('#tree').children.length;
    const samePage = r.page === S.page && !langChanged && $('#main .page');
    S.lang = r.lang; S.page = r.page; S.anchor = r.anchor;
    store.set('yd-lang', S.lang);
    if (samePage) {   // only an in-page anchor changed
      if (S.anchor) { const el = document.getElementById(S.anchor); el && el.scrollIntoView({ block: 'start' }); }
      return;
    }
    applyI18n();
    if (langChanged) buildTree();
    await render();
    if (isMobile()) openDrawer(false);
  }

  async function boot() {
    const [pages, ui, videos] = await Promise.all([getJSON('content/pages.json'), getJSON('content/ui.json'), getJSON('media/videos.json')]);
    S.ui = ui; S.tree = pages.tree; S.translated = pages.translated || {}; S.videos = videos; indexTree(S.tree);

    if (!isMobile() && store.get('yd-tree') === 'collapsed') document.body.classList.add('tree-collapsed');
    wireTree();

    $('#langSwitch').addEventListener('click', e => {
      const b = e.target.closest('button[data-lang]'); if (!b || b.dataset.lang === S.lang) return;
      const y = window.scrollY; location.hash = href(S.page, S.anchor, b.dataset.lang).slice(1); window.scrollTo(0, y);
    });
    $('#themeToggle').addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    $('#treeToggle').addEventListener('click', () => {
      if (isMobile()) openDrawer(!document.body.classList.contains('tree-open'));
      else { const c = document.body.classList.toggle('tree-collapsed'); store.set('yd-tree', c ? 'collapsed' : 'open'); updateTreeToggle(); }
    });
    $('#treeClose').addEventListener('click', () => openDrawer(false));
    $('#scrim').addEventListener('click', () => openDrawer(false));
    window.addEventListener('resize', updateTreeToggle);
    window.addEventListener('hashchange', route);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('tree-open')) openDrawer(false); });

    $('#main').addEventListener('click', e => {
      const poster = e.target.closest('.video-poster'); if (poster) { activateVideo(poster.closest('[data-video]')); return; }
      const img = e.target.closest('img[data-zoom]');
      if (img) {
        LB.list = $$('#main img[data-zoom]'); LB.i = LB.list.indexOf(img); lbShow(LB.i);
        const dlg = $('#lightbox'); dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
      }
    });
    $('#lbClose').addEventListener('click', () => $('#lightbox').close());
    $('#lbPrev').addEventListener('click', () => lbShow(LB.i - 1));
    $('#lbNext').addEventListener('click', () => lbShow(LB.i + 1));
    $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.close(); });
    $('#lightbox').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') lbShow(LB.i - 1); if (e.key === 'ArrowRight') lbShow(LB.i + 1); });

    if (!location.hash) { S.lang = parseHash().lang; }
    await route();
  }

  boot().catch(err => { console.error(err); $('#main').innerHTML = '<p class="notice">Unable to start the site.</p>'; });
})();
