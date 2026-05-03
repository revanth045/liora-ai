import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

const REVEAL_SELECTOR = '[data-reveal], .reveal, .reveal-left, .reveal-right, .reveal-zoom, .reveal-mask, .reveal-stagger';

/**
 * Adds `is-visible` to reveal elements when they intersect the viewport.
 * Elements already in the viewport on mount get revealed immediately so
 * above-the-fold content is never stuck in a clipped/hidden state.
 */
export function useScrollRevealRoot<T extends HTMLElement = HTMLDivElement>(): React.RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const revealInView = () => {
      const vh = window.innerHeight;
      const targets = root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
      targets.forEach(el => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.classList.add('is-visible');
      });
    };

    // Reveal in-view items synchronously on mount AND after first paint
    // (covers race where layout/images shift the fold).
    revealInView();
    requestAnimationFrame(revealInView);
    const t1 = setTimeout(revealInView, 60);
    const t2 = setTimeout(revealInView, 400);

    const targets = root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR);
    if (targets.length === 0) return () => { clearTimeout(t1); clearTimeout(t2); };

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
    );

    targets.forEach(t => io.observe(t));

    // Safety net: any element still hidden after 1.5s gets force-revealed.
    const safety = setTimeout(() => {
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(el => el.classList.add('is-visible'));
    }, 1500);

    return () => { io.disconnect(); clearTimeout(t1); clearTimeout(t2); clearTimeout(safety); };
  }, []);
  return ref;
}

/**
 * Document-wide smooth parallax. Apply `data-parallax data-speed="0.18"` to any element.
 * No ref needed — call once near the root of a page.
 */
export function useParallax(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
    if (els.length === 0) return;

    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        const speed = parseFloat(el.dataset.speed || '0.18');
        const rect  = el.getBoundingClientRect();
        const offsetFromCenter = rect.top + rect.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-offsetFromCenter * speed).toFixed(2)}px, 0)`;
      });
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/** Animated number that counts up when it scrolls into view. */
export function useCountUp(end: number, durationMs = 1600): { ref: React.RefObject<HTMLSpanElement>; value: number } {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(end);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(end * eased * 100) / 100);
        if (t < 1) requestAnimationFrame(tick);
        else setValue(end);
      };
      requestAnimationFrame(tick);
    };
    // start immediately if already in view
    const r = node.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) start();
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { start(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(node);
    return () => io.disconnect();
  }, [end, durationMs]);
  return { ref, value };
}

/** Tracks scroll progress 0..1 — for the top progress bar. */
export function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max <= 0 ? 0 : Math.max(0, Math.min(1, h.scrollTop / max)));
      raf = 0;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return p;
}
