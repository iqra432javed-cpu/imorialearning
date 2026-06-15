/* ============================================================
   IMORIA LEARNING — main.js
   Shared utilities, navbar, animations
   ============================================================ */

'use strict';

// ---- Navbar mobile toggle ----
(function initNavbar() {
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    // animate hamburger → X
    const spans = toggle.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  // close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.navbar')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
})();

// ---- Navbar active link highlighting ----
(function highlightNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ---- Scroll-based navbar shadow ----
(function navbarScroll() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => { nav.style.boxShadow = window.scrollY > 10 ? '0 4px 32px rgba(0,0,0,0.4)' : ''; };
  window.addEventListener('scroll', update, { passive: true });
})();

// ---- Toast notification ----
function showToast(msg, type = 'success', duration = 3000) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = `toast ${type}`;
  t.textContent = msg;
  requestAnimationFrame(() => { t.classList.add('show'); });
  setTimeout(() => { t.classList.remove('show'); }, duration);
}

// ---- Intersection Observer animations ----
(function initFadeIn() {
  const els = document.querySelectorAll('.card, .subject-card, .feature-card, .topic-card, .mcq-card, .sq-card, .lq-card, .hy-item, .family-card');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.style.opacity = 1); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = 'translateY(0)'; obs.unobserve(e.target); }
    });
  }, { threshold: 0.06 });
  els.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    obs.observe(el);
  });
})();

// ---- Generic accordion/toggle helper ----
function initAccordion(headSel, bodySel, headClass = 'open', bodyClass = 'open', solo = false) {
  const heads = document.querySelectorAll(headSel);
  heads.forEach(head => {
    head.addEventListener('click', () => {
      const body = head.nextElementSibling;
      if (!body) return;
      const wasOpen = head.classList.contains(headClass);
      if (solo) {
        heads.forEach(h => {
          h.classList.remove(headClass);
          if (h.nextElementSibling) h.nextElementSibling.classList.remove(bodyClass);
        });
      }
      if (!wasOpen) {
        head.classList.add(headClass);
        body.classList.add(bodyClass);
      }
    });
  });
}

// ---- Smooth number counter animation ----
function animateCounter(el, end, duration = 1200) {
  let start = 0;
  const step = Math.ceil(end / (duration / 16));
  const timer = setInterval(() => {
    start = Math.min(start + step, end);
    el.textContent = start.toLocaleString();
    if (start >= end) clearInterval(timer);
  }, 16);
}

// ---- Expose globals ----
window.ImoriaApp = { showToast, animateCounter, initAccordion };
