// Small helpers shared by every screen.

/** Escape text before putting it into HTML. Use for ALL user-entered text. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- dates (all task dates are local "YYYY-MM-DD") ---------- */
const pad = n => String(n).padStart(2, '0');
export function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function todayISO() { return toISO(new Date()); }
export function parseISO(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
export function addMonths(iso, n) {
  const d = parseISO(iso); const day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
}
export function daysBetween(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
/** Start of the week containing iso. weekStart: 0 = Sunday, 1 = Monday */
export function startOfWeek(iso, weekStart = 1) {
  const d = parseISO(iso); const diff = (d.getDay() - weekStart + 7) % 7;
  d.setDate(d.getDate() - diff); return toISO(d);
}
/** Combine a task's date + time into a Date (time defaults to 09:00). */
export function taskDateTime(task) {
  const d = parseISO(task.date);
  const [h, m] = (task.time || '09:00').split(':').map(Number);
  d.setHours(h, m, 0, 0); return d;
}

export function fmtTime(hhmm, lang = 'en') {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function monthName(monthIndex, lang = 'en', style = 'long') {
  return new Date(2020, monthIndex, 1).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: style });
}
export function weekdayNames(lang = 'en', weekStart = 1, style = 'short') {
  const base = new Date(2024, 0, 7); // a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base); d.setDate(base.getDate() + ((i + weekStart) % 7));
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: style });
  });
}

/** Format an ISO date using the user's chosen date format. */
export function fmtDate(iso, format = 'DD/MM/YYYY', lang = 'en') {
  if (!iso) return '';
  const d = parseISO(iso);
  const DD = pad(d.getDate()), MM = pad(d.getMonth() + 1), YYYY = d.getFullYear();
  switch (format) {
    case 'MM/DD/YYYY': return `${MM}/${DD}/${YYYY}`;
    case 'YYYY-MM-DD': return `${YYYY}-${MM}-${DD}`;
    case 'D MMM YYYY': return `${d.getDate()} ${monthName(d.getMonth(), lang, 'short')} ${YYYY}`;
    default: return `${DD}/${MM}/${YYYY}`;
  }
}

/* ---------- UI bits ---------- */
let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/** Simple confirm dialog that returns a Promise<boolean>. */
export function confirmBox(message, okLabel = 'OK', cancelLabel = 'Cancel') {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.innerHTML = `<div class="card stack"><p style="margin:0">${esc(message)}</p>
      <div class="row"><span class="spacer"></span>
      <button class="btn" value="no">${esc(cancelLabel)}</button>
      <button class="btn primary" value="yes">${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('click', e => {
      const v = e.target.closest('button')?.value;
      if (v || e.target === dlg) { dlg.close(); dlg.remove(); resolve(v === 'yes'); }
    });
    dlg.addEventListener('cancel', () => { dlg.remove(); resolve(false); });
    dlg.showModal();
  });
}

export function download(filename, text, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Resize an image file to a square data URL (for profile photos). */
export function imageToDataURL(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src); resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- icons (stroke icons, 24x24) ---------- */
const P = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  repeat: '<path d="M17 3l3 3-3 3"/><path d="M4 12V9a3 3 0 013-3h13M7 21l-3-3 3-3"/><path d="M20 12v3a3 3 0 01-3 3H4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5s.8-1.5 2-1.5H17a4 4 0 004-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>',
  cake: '<path d="M4 21h16M5 21v-7h14v7"/><path d="M5 16c2 1.5 4.5 1.5 7 0s5-1.5 7 0"/><path d="M12 14v-3M12 8a1.5 1.5 0 001.5-1.5C13.5 5 12 3 12 3s-1.5 2-1.5 3.5A1.5 1.5 0 0012 8z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M4 4h16"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>',
  refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
export function icon(name, extra = '') {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[name] || ''}</svg>`;
}
