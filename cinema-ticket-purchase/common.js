/* plain browser pop-ups are used only if modal.js did not load */
window.ui = window.ui || { confirm: async m => confirm(m), alert: async m => { alert(m); }, prompt: async (m, o) => prompt(m, o && o.value || '') };
/* Shared helpers for the ticket purchase pages. Needs config.js and the supabase script loaded first. */
const EVENT = {
  title: 'Avengers: Doomsday (2026)',
  date: 'December 19, 2026',
  time: '1:00 PM',
  venue: 'A. Bichara Silverscreens, Cinema 4'
};
const SEAT_URL = 'https://dwclbatch2002.github.io/blockscreening-doomsday/cinema-seatreservation-page/';
const MAX_PER_ORDER = 10;

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const peso = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Display only. The database calculates the real price.
const unitPrice = q => q < 1 ? 0 : q === 1 ? 480 : q === 2 ? 450 : 430;     // 1 ticket 480, 2 tickets 450 each, 3 or more 430 each
const priceFor = q => unitPrice(q) * q;

const STEPS = ['Details', 'Pay', 'Upload proof', 'Get tickets', 'Reserve seats'];
function renderSteps(el, current) {      // current is 1-5; 6 means everything is done (all seats reserved)
  if (el.dataset.cur === String(current)) return;                 // same step: leave it alone so a running animation is not cut off
  let prev = +(el.dataset.cur || 0);
  if (!prev) { try { prev = +(sessionStorage.getItem('tp_step') || 0); } catch (_) {} }   // the step the guest came from (even on the previous page)
  el.dataset.cur = current; try { sessionStorage.setItem('tp_step', current); } catch (_) {}
  const adv = prev > 0 && current > prev;
  el.innerHTML = STEPS.map((t, i) => {
    const n = i + 1, cls = (n < current ? 'done' : n === current ? 'cur' : '') + (adv && n === current ? ' go' : '') + (adv && n === prev ? ' fin' : '');
    return `<li class="${cls}"${n === current ? ' aria-current="step"' : ''}><span class="n">${n < current ? '✓' : n}</span>${t}</li>`;
  }).join('');
}
function copyText(t) {
  const fallback = () => { window.ui.prompt('Select the text below and copy it.', { title: 'Copy', value: t, ok: 'Done', cancel: 'Close' }); };
  try { return navigator.clipboard.writeText(t).catch(fallback); } catch (_) { fallback(); return Promise.resolve(); }
}
function flash(btn, text) {
  const old = btn.textContent; btn.textContent = text;
  setTimeout(() => { btn.textContent = old; }, 1400);
}


/* ---------- small icons for message screens (inline SVG: no extra downloads) ---------- */
const MICO = {
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/><path d="M4 4l16 16"/>',
  hourglass: '<path d="M7 3h10M7 21h10"/><path d="M8 3c0 5 4 5.5 4 9s-4 4-4 9"/><path d="M16 3c0 5-4 5.5-4 9s4 4 4 9"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  ticketx: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4z"/><path d="M10 10l4 4M14 10l-4 4"/>',
  seat: '<path d="M7 11V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V11"/><path d="M5 20v-3.5A2.5 2.5 0 0 1 7.5 14h9a2.5 2.5 0 0 1 2.5 2.5V20"/><path d="M4 11.5h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.4"/>'
};
function msgIcon(name, tone) {            // tone: '' (green), 'warn' (gold), 'bad' (red), 'mut' (grey)
  return `<div class="mico ${tone || ''}" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${MICO[name] || MICO.info}</svg></div>`;
}
const BRAND_HTML = '<div class="brand"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h15A1.5 1.5 0 0 1 21 8.5V10a2 2 0 0 0 0 4v1.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.5V14a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="1.8 2.4"/></svg><span>DWCL Batch 2002 &middot; Block screening</span></div>';

/* ---------- ticket picture ---------- */
const TW = 900, TH = 1790;
function rr(x, px, py, w, h, r) {
  x.beginPath(); x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
}
function fitText(x, text, maxW) {
  if (x.measureText(text).width <= maxW) return text;
  while (text.length > 1 && x.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text.trim() + '…';
}
async function drawTicketImage(ref, holder, code, cat, seat, group, tba) {
  try { await Promise.all([document.fonts.load('700 40px Metropolis'), document.fonts.load('400 40px Metropolis')]); } catch (_) {}
  // The ticket has its own artwork file (ticket-art.webp), separate from the link-preview image, so changing or removing og-image files never blanks the tickets. The others are only backups.
  const art = await (async () => { for (const f of ['ticket-art.webp?v=1', 'ticket-art.jpg?v=1', 'og-image-v3.jpg', 'og-image-v2.jpg', 'og-image.jpg?v=1']) { const i = await new Promise(ok => { const m = new Image(); m.onload = () => ok(m); m.onerror = () => ok(null); m.src = f; }); if (i) return i; } return null; })();
  const c = document.createElement('canvas'); c.width = TW; c.height = TH;
  const x = c.getContext('2d');
  const F = (w, s) => `${w} ${s}px Metropolis, "Trebuchet MS", Verdana, sans-serif`;

  rr(x, 0, 0, TW, TH, 44); x.fillStyle = '#050d09'; x.fill();
  x.save(); rr(x, 0, 0, TW, TH, 44); x.clip();
  if (art) { const r = Math.max(TW / art.width, 520 / art.height), w = art.width * r, h = art.height * r; x.drawImage(art, (TW - w) / 2, (520 - h) / 2, w, h); }
  const g = x.createLinearGradient(0, 450, 0, 520); g.addColorStop(0, 'rgba(5,13,9,0)'); g.addColorStop(1, '#050d09');      // only the last bit of the picture fades out, so the logo stays visible
  x.fillStyle = g; x.fillRect(0, 0, TW, 520);
  x.restore();

  // "3D EXPERIENCE" badge (smaller, tucked in the top-left corner so it stays off the face)
  x.save(); x.translate(60, 26); x.scale(.82, .82); x.translate(-70, -64);
  { const bx = 70, by = 64, bh = 68; x.font = F(800, 44); const w3 = x.measureText('3D').width; x.font = F(700, 26);
    try { x.letterSpacing = '5px'; } catch (_) {}
    const wt = x.measureText('EXPERIENCE').width; const bw = 28 + w3 + 22 + wt + 24;
    rr(x, bx, by, bw, bh, bh / 2); x.fillStyle = 'rgba(3,10,7,.82)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3; x.stroke();
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.font = F(800, 44); x.fillStyle = '#ff3b5c'; x.fillText('3D', bx + 28 - 3, by + 49); x.fillStyle = '#27d3ff'; x.fillText('3D', bx + 28 + 3, by + 49); x.fillStyle = '#fff'; x.fillText('3D', bx + 28, by + 49);
    x.font = F(700, 26); x.fillStyle = '#e8f1ec'; x.fillText('EXPERIENCE', bx + 28 + w3 + 22, by + 45);
    try { x.letterSpacing = '0px'; } catch (_) {} }
  x.restore();

  x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  if (!art) {                                                     // no picture: write the title instead (the picture itself carries the logo)
    x.fillStyle = '#fff'; x.shadowColor = 'rgba(57,255,122,.7)'; x.shadowBlur = 26;
    let fs = 68; x.font = F(700, fs);
    while (x.measureText('AVENGERS: DOOMSDAY').width > 800 && fs > 40) { fs -= 2; x.font = F(700, fs); }
    x.fillText('AVENGERS: DOOMSDAY', TW / 2, 535); x.shadowBlur = 0;
  }
  x.fillStyle = '#9db3a8'; x.font = F(400, 34); x.fillText('(2026)   Admit one', TW / 2, art ? 572 : 585);

  // perforation + notches
  x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 3; x.setLineDash([14, 12]);
  x.beginPath(); x.moveTo(70, 640); x.lineTo(TW - 70, 640); x.stroke(); x.setLineDash([]);
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(0, 640, 36, 0, 7); x.fill(); x.beginPath(); x.arc(TW, 640, 36, 0, 7); x.fill();
  x.globalCompositeOperation = 'source-over';

  const label = (t, px, py) => { x.textAlign = 'left'; x.fillStyle = '#9db3a8'; x.font = F(400, 28); x.fillText(t, px, py); };
  const value = (t, px, py, w = 760) => { x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = F(700, 44); x.fillText(fitText(x, t, w), px, py); };
  label('Date', 70, 722);   value('Dec 19, 2026', 70, 774, 380);
  label('Time', 500, 722);  value(EVENT.time, 500, 774, 330);
  label('Venue', 70, 860);  value('A. Bichara Silverscreens', 70, 912); value('Cinema 4', 70, 966);
  // reserved seat (shown once the guest has reserved on the seat page)
  const SX = 630;
  label('Seat', SX, 860);
  if (seat) {
    x.save(); x.shadowColor = 'rgba(57,255,122,.6)'; x.shadowBlur = 24; x.textAlign = 'left'; x.fillStyle = '#39ff7a'; x.font = F(800, 96); x.fillText(seat, SX, 950); x.restore();
    x.textAlign = 'left'; x.fillStyle = '#9db3a8'; x.font = F(400, 24); x.fillText('Row ' + seat[0] + ' \u00B7 Seat ' + seat.slice(1), SX, 990);
    if (group && group.length > 1) x.fillText(fitText(x, 'With ' + group.filter(s => s !== seat).join(', '), 200), SX, 1018);
  } else {
    x.textAlign = 'left'; x.fillStyle = '#e8f1ec'; x.font = F(700, 38); x.fillText(tba ? 'To be' : 'Not yet', SX, 912);
    x.fillStyle = '#9db3a8'; x.font = F(400, 30); x.fillText(tba ? 'assigned' : 'reserved', SX, 952);
  }

  rr(x, 70, 1030, 760, 196, 30); x.fillStyle = 'rgba(57,255,122,.08)'; x.fill();
  x.strokeStyle = 'rgba(57,255,122,.65)'; x.lineWidth = 3; x.stroke();
  x.textAlign = 'center'; x.fillStyle = '#9db3a8'; x.font = F(400, 28); x.fillText('Ticket number', TW / 2, 1082);
  x.fillStyle = '#39ff7a'; x.font = F(700, 108);
  try { x.letterSpacing = '8px'; } catch (_) {}
  x.fillText(ref, TW / 2 + 4, 1186);
  try { x.letterSpacing = '0px'; } catch (_) {}

  x.textAlign = 'left'; x.fillStyle = '#9db3a8'; x.font = F(400, 26); x.fillText('Ticket holder', 70, 1292);
  x.fillStyle = '#fff'; x.font = F(700, 40); x.fillText(fitText(x, holder || '', 760), 70, 1342);
  x.fillStyle = '#9db3a8'; x.font = F(400, 26); x.fillText('Order ' + code, 70, 1388);
  // QR with the ticket number, scanned at the entrance
  if (typeof qrcode === 'function') {
    try {
      const q = qrcode(0, 'M'); q.addData(ref); q.make();
      const n = q.getModuleCount(), m = Math.floor(290 / (n + 4)) || 1, side = m * (n + 4), qx = (TW - side) / 2, qy = 1430;
      x.fillStyle = '#fff'; rr(x, qx, qy, side, side, 16); x.fill();
      x.fillStyle = '#000';
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(qx + (k + 2) * m, qy + (r + 2) * m, m, m);
      x.textAlign = 'center'; x.fillStyle = '#9db3a8'; x.font = F(400, 26); x.fillText('Show this QR code at the entrance', TW / 2, qy + side + 44);
    } catch (_) {}
  }
  return c.toDataURL('image/png');
}


/* Field errors: the message appears right under the field that has the problem, scrolls into view and focuses it */
function clearFieldErrs() { document.querySelectorAll('.ferr').forEach(n => n.remove()); }
function fieldErr(el, text, anchor) {
  clearFieldErrs();
  const n = document.createElement('div'); n.className = 'ferr'; n.setAttribute('role', 'alert'); n.textContent = text;
  (anchor || el).insertAdjacentElement('afterend', n);
  const gone = () => n.remove(); el.addEventListener('input', gone, { once: true }); el.addEventListener('change', gone, { once: true });
  n.scrollIntoView({ block: 'center', behavior: 'smooth' });
  try { el.focus({ preventScroll: true }); } catch (_) {}
  return false;
}
