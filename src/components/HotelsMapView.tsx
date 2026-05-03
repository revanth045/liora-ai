import React, { useEffect, useRef } from 'react';
import type { DemoHotel } from '../hotelDb';

declare const L: any;

let leafletPromise: Promise<void> | null = null;
function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).L) return Promise.resolve();
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise<void>((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    css.crossOrigin = '';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    s.crossOrigin = '';
    s.onload = () => resolve();
    s.onerror = () => { leafletPromise = null; reject(new Error('Leaflet failed to load')); };
    document.head.appendChild(s);
  });
  return leafletPromise;
}

export default function HotelsMapView({
  hotels, onOpen,
}: { hotels: DemoHotel[]; onOpen: (h: DemoHotel) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then(() => {
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, { zoomControl: true, scrollWheelZoom: false }).setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      renderMarkers();
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { renderMarkers(); /* eslint-disable-next-line */ }, [hotels]);

  function renderMarkers() {
    const map = mapRef.current; const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const pts: [number, number][] = [];
    hotels.forEach(h => {
      if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') return;
      const m = L.marker([h.latitude, h.longitude]).addTo(layer);
      const safe = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));
      m.bindPopup(
        `<div style="min-width:160px"><div style="font-weight:700;font-size:14px;margin-bottom:2px">${safe(h.name)}</div>` +
        (h.city ? `<div style="font-size:12px;color:#78716c;margin-bottom:6px">${safe(h.city)}</div>` : '') +
        `<button data-hotel-id="${safe(h.id)}" style="font-size:12px;font-weight:600;color:#E85D2A;cursor:pointer;background:none;border:none;padding:0">View details →</button></div>`
      );
      m.on('popupopen', (e: any) => {
        const btn = e.popup.getElement()?.querySelector('button[data-hotel-id]');
        if (btn) btn.addEventListener('click', () => onOpenRef.current(h), { once: true });
      });
      pts.push([h.latitude, h.longitude]);
    });
    if (pts.length === 1) map.setView(pts[0], 11);
    else if (pts.length > 1) map.fitBounds(pts as any, { padding: [40, 40], maxZoom: 12 });
  }

  return <div ref={ref} className="w-full h-[60vh] min-h-[420px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100" aria-label="Hotels map" />;
}
