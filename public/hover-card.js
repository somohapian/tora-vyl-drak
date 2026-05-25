// Hover-card previews on internal wiki-links. Desktop-only — disabled on
// touch / no-hover devices so mobile users just tap through.
//
// Targets <a class="wiki-link" href="/collection/slug"> rendered by the
// crosslink pass. On pointer-hover (after a short delay), shows a floating
// card containing the first 1-2 sentences of the linked entry, sourced from
// /previews.json. Card lives in a single shared DOM node; we move it around
// rather than mounting one per link.
(() => {
  // Disable on touch / no-hover devices. iOS-Safari without a mouse falls
  // through here — taps still navigate normally.
  if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;

  const SHOW_DELAY_MS = 220;
  const HIDE_DELAY_MS = 140;
  const VIEWPORT_MARGIN = 12;

  let previews = null;
  let loadingPreviews = null;
  let card = null;
  let showTimer = null;
  let hideTimer = null;
  let activeLink = null;

  function loadPreviews() {
    if (previews) return Promise.resolve(previews);
    if (loadingPreviews) return loadingPreviews;
    loadingPreviews = fetch('/previews.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => { previews = data || {}; return previews; })
      .catch(() => { previews = {}; return previews; });
    return loadingPreviews;
  }

  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'wiki-hover-card';
    card.setAttribute('role', 'tooltip');
    card.setAttribute('aria-hidden', 'true');
    card.hidden = true;
    // Pointer events on so the user can move into the card without it
    // dismissing — useful if we ever add follow-up links inside it.
    card.addEventListener('mouseenter', cancelHide);
    card.addEventListener('mouseleave', scheduleHide);
    document.body.appendChild(card);
    return card;
  }

  function keyFromHref(href) {
    // href looks like "/people/bixel" or "/language/kahu". Skip anchors,
    // query strings, off-site links.
    if (!href || !href.startsWith('/')) return null;
    const pathOnly = href.split('#')[0].split('?')[0];
    const parts = pathOnly.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts.slice(1).join('/')}`;
  }

  function position(el, link) {
    // Position below the link by default; flip above if it would overflow.
    const rect = link.getBoundingClientRect();
    el.style.visibility = 'hidden';
    el.hidden = false;
    el.style.left = '0px';
    el.style.top = '0px';
    const cardRect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left + window.scrollX;
    // Clamp so it stays in the viewport horizontally.
    const maxLeft = window.scrollX + vw - cardRect.width - VIEWPORT_MARGIN;
    if (left > maxLeft) left = maxLeft;
    if (left < window.scrollX + VIEWPORT_MARGIN) left = window.scrollX + VIEWPORT_MARGIN;

    let top = rect.bottom + window.scrollY + 8;
    const wouldOverflowBottom = rect.bottom + cardRect.height + 16 > vh;
    if (wouldOverflowBottom && rect.top - cardRect.height - 8 > 0) {
      top = rect.top + window.scrollY - cardRect.height - 8;
    }

    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.visibility = '';
  }

  async function show(link) {
    const key = keyFromHref(link.getAttribute('href'));
    if (!key) return;
    const data = await loadPreviews();
    // The user may have already moved off the link by the time the fetch
    // resolves — only render if we're still hovering the same target.
    if (activeLink !== link) return;
    const text = data[key];
    if (!text) return;
    const el = ensureCard();
    el.textContent = text;
    el.setAttribute('aria-hidden', 'false');
    position(el, link);
  }

  function hideNow() {
    if (!card) return;
    card.hidden = true;
    card.setAttribute('aria-hidden', 'true');
    card.textContent = '';
  }

  function cancelShow() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  }
  function cancelHide() {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  }
  function scheduleHide() {
    cancelHide();
    hideTimer = setTimeout(hideNow, HIDE_DELAY_MS);
  }

  function onEnter(e) {
    const link = e.target.closest('a.wiki-link');
    if (!link) return;
    activeLink = link;
    cancelHide();
    cancelShow();
    showTimer = setTimeout(() => show(link), SHOW_DELAY_MS);
  }

  function onLeave(e) {
    const link = e.target.closest('a.wiki-link');
    if (!link) return;
    if (activeLink === link) activeLink = null;
    cancelShow();
    scheduleHide();
  }

  // Use capture-phase delegation so we don't have to re-bind when the DOM
  // changes (not that it does on static pages, but cheap insurance).
  document.addEventListener('mouseover', onEnter, true);
  document.addEventListener('mouseout', onLeave, true);
  // Dismiss on scroll — the position would otherwise drift relative to the link.
  window.addEventListener('scroll', () => { if (card && !card.hidden) hideNow(); }, { passive: true });
  // Esc closes it.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideNow(); });
})();
