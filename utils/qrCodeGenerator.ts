/**
 * QR Code Generator — Liora
 *
 * Two formats are supported:
 *
 *   1. LEGACY  "tableNumber:restaurantName"  — kept for the in-app AI Waiter
 *                                                scanner (jsqr) which already
 *                                                expects this format.
 *
 *   2. URL     "{origin}/?r={restaurantId}[&t={tableNumber}]"
 *                                              — used for the printable QR
 *                                                codes a venue places on
 *                                                tables / posters. Native
 *                                                phone cameras open this URL,
 *                                                land in the Liora app, auto-
 *                                                select the restaurant and
 *                                                pre-fill the table number.
 */

// -------------------------------------------------------------------------
// LEGACY (kept for AI Waiter compatibility — DO NOT change the signatures)
// -------------------------------------------------------------------------

export const generateQRData = (tableNumber: string | number, restaurantName: string): string => {
  return `${tableNumber}:${restaurantName.replace(/\s+/g, '_')}`;
};

export const parseQRData = (qrData: string): { tableNumber: string; restaurantName: string } | null => {
  // Try URL form first
  try {
    const u = new URL(qrData);
    const t = u.searchParams.get('t');
    const r = u.searchParams.get('r');
    if (t && r) return { tableNumber: t, restaurantName: r };
  } catch { /* not a URL */ }
  const parts = qrData.split(':');
  if (parts.length === 2) {
    return { tableNumber: parts[0], restaurantName: parts[1].replace(/_/g, ' ') };
  }
  return null;
};

export const generateQRImageUrl = (
  tableNumber: string | number,
  restaurantName: string,
  size: number = 300
): string => {
  const qrData = generateQRData(tableNumber, restaurantName);
  const encoded = encodeURIComponent(qrData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
};

export const generateRestaurantQRCodes = (
  restaurantName: string,
  tableCount: number = 20
): Array<{ tableNumber: number; qrData: string; qrImageUrl: string; }> => {
  const tables = [];
  for (let i = 1; i <= tableCount; i++) {
    tables.push({
      tableNumber: i,
      qrData: generateQRData(i, restaurantName),
      qrImageUrl: generateQRImageUrl(i, restaurantName, 400)
    });
  }
  return tables;
};

// -------------------------------------------------------------------------
// NEW — URL-based QRs (works with native phone cameras)
// -------------------------------------------------------------------------

const safeOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return 'https://liora.app';
};

/** URL that opens the Liora app on a specific restaurant (menu / details). */
export const buildRestaurantUrl = (restaurantId: string): string =>
  `${safeOrigin()}/?r=${encodeURIComponent(restaurantId)}`;

/** URL that opens the Liora app on a specific restaurant + table (auto-fills table). */
export const buildTableUrl = (restaurantId: string, tableNumber: string | number): string =>
  `${safeOrigin()}/?r=${encodeURIComponent(restaurantId)}&t=${encodeURIComponent(String(tableNumber))}`;

/** Hosted PNG of any payload, sized in pixels (square). */
export const qrImageFor = (payload: string, size = 360): string =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(payload)}`;

/** Hosted SVG of any payload (crisp at print resolution). */
export const qrSvgFor = (payload: string): string =>
  `https://api.qrserver.com/v1/create-qr-code/?format=svg&margin=2&data=${encodeURIComponent(payload)}`;

/** Trigger a browser download of a QR PNG. */
export const downloadQRCode = async (payload: string, filename: string, size = 800): Promise<void> => {
  try {
    const res = await fetch(qrImageFor(payload, size));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Fallback — open in new tab so the user can right-click → save
    window.open(qrImageFor(payload, size), '_blank', 'noopener');
  }
};

export type PrintableTable = { number: number | string; label?: string };

/**
 * Print-ready HTML sheet — restaurant menu QR header + per-table grid.
 * Each table QR encodes the URL `?r=ID&t=N` so a phone camera scans
 * straight into the right venue and table.
 */
export const buildPrintableQRSheet = (opts: {
  restaurantId: string;
  restaurantName: string;
  tables: PrintableTable[];
}): string => {
  const { restaurantId, restaurantName, tables } = opts;
  const venueUrl = buildRestaurantUrl(restaurantId);
  const tableCards = tables.map(t => {
    const url = buildTableUrl(restaurantId, t.number);
    return `
      <div class="card">
        <img src="${qrImageFor(url, 480)}" alt="Table ${t.number}" />
        <h3>Table ${t.number}</h3>
        ${t.label ? `<p class="label">${t.label}</p>` : ''}
        <p class="hint">Scan to order at this table</p>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><title>${restaurantName} — QR Codes</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;margin:24px;background:#fff;color:#111}
    h1{text-align:center;margin:0 0 4px;font-size:26px;letter-spacing:-0.01em}
    .sub{text-align:center;color:#666;margin:0 0 28px;font-size:13px}
    .venue{display:flex;flex-direction:column;align-items:center;gap:10px;margin:0 auto 36px;padding:24px;border:2px solid #111;border-radius:18px;max-width:380px;page-break-inside:avoid}
    .venue img{width:260px;height:260px}
    .venue h2{margin:6px 0 0;font-size:20px}
    .venue p{margin:2px 0 0;color:#444;font-size:12px;text-align:center}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
    .card{text-align:center;border:1px solid #d4d4d4;border-radius:14px;padding:16px;page-break-inside:avoid}
    .card img{width:200px;height:200px;display:block;margin:0 auto}
    .card h3{margin:12px 0 2px;font-size:18px}
    .card .label{margin:0;color:#555;font-size:12px;font-weight:600}
    .card .hint{margin:6px 0 0;color:#888;font-size:11px}
    @media print{
      body{margin:12px}
      .grid{grid-template-columns:repeat(3,1fr);gap:14px}
      .card img{width:170px;height:170px}
      .venue img{width:220px;height:220px}
    }
  </style></head><body>
    <h1>${restaurantName}</h1>
    <p class="sub">Scan-to-order QR codes — print, laminate, and place at each table.</p>
    <div class="venue">
      <img src="${qrImageFor(venueUrl, 600)}" alt="${restaurantName} menu" />
      <h2>Venue Menu</h2>
      <p>Scan to view our full menu &amp; details</p>
      <p style="font-size:10px;color:#888;word-break:break-all">${venueUrl}</p>
    </div>
    ${tables.length > 0 ? `<div class="grid">${tableCards}</div>` : ''}
  </body></html>`;
};

/** Open the OS print dialog with the printable sheet. */
export const printQRSheet = (opts: {
  restaurantId: string;
  restaurantName: string;
  tables: PrintableTable[];
}): void => {
  const html = buildPrintableQRSheet(opts);
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch { /* noop */ } }, 400);
};

// Legacy print API kept as a thin wrapper (used by AiWaiterDemo if needed)
export const printQRCodes = (restaurantName: string, tableCount: number = 20): void => {
  printQRSheet({
    restaurantId: restaurantName.toLowerCase().replace(/\s+/g, '-'),
    restaurantName,
    tables: Array.from({ length: tableCount }, (_, i) => ({ number: i + 1 })),
  });
};

export const generatePrintableQRSheet = (restaurantName: string, tableCount: number = 20): string =>
  buildPrintableQRSheet({
    restaurantId: restaurantName.toLowerCase().replace(/\s+/g, '-'),
    restaurantName,
    tables: Array.from({ length: tableCount }, (_, i) => ({ number: i + 1 })),
  });
