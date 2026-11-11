(function () {
  'use strict';

  const isDesktop = () => window.matchMedia('(min-width: 821px)').matches;

  const timeline = document.getElementById('timeline');
  const chromeNav = document.getElementById('chromeNav');
  const rulerTrack = document.getElementById('rulerTrack');
  const rulerPointer = document.getElementById('rulerPointer');
  const cover = document.getElementById('cover');
  const enterBtn = document.getElementById('enter');
  const brand = document.getElementById('brand');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCat = document.getElementById('lightboxCat');
  const lightboxName = document.getElementById('lightboxName');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxSpecs = document.getElementById('lightboxSpecs');

  const { decades, pieces } = window.ARCHIVE;

  // ---- Render ----
  decades.forEach((d) => {
    const items = pieces.filter((p) => p.decade === d.id);

    const cards = items.map((p, i) => `
      <button class="piece" data-id="${p.id}" aria-haspopup="dialog">
        <span class="piece__frame">
          <img src="${p.img}" alt="${p.name}" loading="lazy">
        </span>
        <span class="piece__plate">
          <span class="piece__no">No. ${String(i + 1).padStart(3, '0')}</span>
          <span class="piece__name">${p.name}</span>
          <span class="piece__meta">${p.material} &middot; ${p.year}</span>
        </span>
      </button>
    `).join('');

    const panel = document.createElement('section');
    panel.className = 'decade';
    panel.dataset.decade = d.id;
    panel.innerHTML = `
      <div class="decade__ghost">${d.label}</div>
      <div class="decade__inner">
        <header class="decade__head">
          <p class="decade__kicker">${d.roman}</p>
          <h2 class="decade__year">${d.label}</h2>
          <p class="decade__blurb">${d.blurb}</p>
          <p class="decade__count">${items.length} ${items.length === 1 ? 'piece' : 'pieces'}</p>
        </header>
        <div class="decade__pieces">${cards}</div>
      </div>
    `;
    timeline.appendChild(panel);

    const link = document.createElement('button');
    link.className = 'nav-link';
    link.textContent = d.label;
    link.dataset.target = d.id;
    chromeNav.appendChild(link);

    const tick = document.createElement('button');
    tick.className = 'ruler__tick';
    tick.dataset.target = d.id;
    tick.innerHTML = `<span class="ruler__tick-label">${d.label}</span>`;
    rulerTrack.appendChild(tick);
  });

  // ---- Jump to decade ----
  function scrollToDecade(id) {
    const panel = timeline.querySelector(`.decade[data-decade="${id}"]`);
    if (!panel) return;
    if (isDesktop()) {
      timeline.scrollTo({ left: panel.offsetLeft, behavior: 'smooth' });
    } else {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function jumpHandler(e) {
    const b = e.target.closest('[data-target]');
    if (b) scrollToDecade(b.dataset.target);
  }
  chromeNav.addEventListener('click', jumpHandler);
  rulerTrack.addEventListener('click', jumpHandler);

  // ---- Active decade + ruler pointer ----
  function updateProgress() {
    let activeId = decades[0].id;

    if (isDesktop()) {
      const max = timeline.scrollWidth - timeline.clientWidth;
      const p = max > 0 ? timeline.scrollLeft / max : 0;
      rulerPointer.style.left = (p * 100) + '%';

      const center = timeline.scrollLeft + timeline.clientWidth / 2;
      const panels = timeline.querySelectorAll('.decade');
      for (const panel of panels) {
        if (center >= panel.offsetLeft && center < panel.offsetLeft + panel.offsetWidth) {
          activeId = panel.dataset.decade;
          break;
        }
      }
    }

    document.querySelectorAll('.nav-link, .ruler__tick').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.target === activeId);
    });
  }

  let raf = 0;
  timeline.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateProgress);
  }, { passive: true });

  // ---- Wheel: vertical -> horizontal (desktop) ----
  timeline.addEventListener('wheel', (e) => {
    if (!isDesktop()) return;

    const target = e.target.closest('.decade');
    if (target && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const canY = target.scrollHeight > target.clientHeight + 1;
      if (canY) {
        const atTop = target.scrollTop <= 0 && e.deltaY < 0;
        const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1 && e.deltaY > 0;
        if (!atTop && !atBottom) return;
      }
    }

    timeline.scrollLeft += e.deltaY + e.deltaX;
    e.preventDefault();
  }, { passive: false });

  // ---- Drag to scroll (desktop) ----
  let dragging = false, startX = 0, startLeft = 0;
  timeline.addEventListener('mousedown', (e) => {
    if (!isDesktop()) return;
    if (e.target.closest('.piece')) return;
    dragging = true;
    startX = e.clientX;
    startLeft = timeline.scrollLeft;
    timeline.classList.add('is-dragging');
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    timeline.scrollLeft = startLeft - (e.clientX - startX);
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    timeline.classList.remove('is-dragging');
  });

  // ---- Cover / enter ----
  function enter() {
    if (document.body.classList.contains('is-entered')) return;
    document.body.classList.add('is-entered');
    cover.setAttribute('aria-hidden', 'true');
  }
  enterBtn.addEventListener('click', enter);
  cover.addEventListener('wheel', enter, { passive: true });
  cover.addEventListener('click', (e) => {
    if (!e.target.closest('.cover__enter')) enter();
  });
  brand.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.body.classList.contains('is-entered')) {
      timeline.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      enter();
    }
  });

  // ---- Lightbox ----
  function openLightbox(id) {
    const p = pieces.find((x) => x.id === id);
    if (!p) return;
    const d = decades.find((x) => x.id === p.decade);
    lightboxImg.src = p.img;
    lightboxImg.alt = p.name;
    lightboxCat.textContent = `${d.label} · ${p.category}`;
    lightboxName.textContent = p.name;
    lightboxDesc.textContent = p.desc;
    lightboxSpecs.innerHTML = `
      <div><dt>Material</dt><dd>${p.material}</dd></div>
      <div><dt>Year</dt><dd>${p.year}</dd></div>
      <div><dt>Decade</dt><dd>${d.label}</dd></div>
      <div><dt>Ref.</dt><dd>${p.id}</dd></div>
    `;
    lightbox.hidden = false;
  }
  function closeLightbox() { lightbox.hidden = true; }

  timeline.addEventListener('click', (e) => {
    const card = e.target.closest('.piece');
    if (card) openLightbox(card.dataset.id);
  });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.querySelector('.lightbox__scrim').addEventListener('click', closeLightbox);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('is-visible'); });
  }, { threshold: 0.12 });
  timeline.querySelectorAll('.piece').forEach((el) => io.observe(el));

  updateProgress();
})();
