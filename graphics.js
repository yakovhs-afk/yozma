/* =========================================================
   גרפיקה: סט אייקונים אחיד, סמל, איורים וקישוטים.
   כל האייקונים בקו (stroke) ומקבלים את הצבע מה-CSS.
   אמוג'י שמוזנים בבק אופיס מומרים אוטומטית לאייקון המתאים;
   אמוג'י שאין לו אייקון מוצג כמו שהוא.
   ========================================================= */
const ICONS = {
  brick: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 10h18M3 14h18M9 6v4M15 6v4M6 10v4M12 10v4M18 10v4M9 14v4M15 14v4"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
  window: '<path d="M6 21V10a6 6 0 0 1 12 0v11z"/><path d="M4 21h16M12 4v17M6 13h12"/>',
  lamp: '<path d="M12 2v5"/><path d="M6 13a6 6 0 0 1 12 0z"/><path d="M4 13h16"/><path d="M10 16.5a2 2 0 0 0 4 0"/>',
  building: '<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/><path d="M12 8.2l2.2 3.8H9.8zM12 13.4l2.2-3.8H9.8z" stroke-width="1.1"/>',
  ark: '<path d="M5 21V11h14v10z"/><path d="M3 21h18M12 11v10"/><path d="M7.5 11V7a2.25 2.25 0 0 1 4.5 0v4M12 11V7a2.25 2.25 0 0 1 4.5 0v4"/>',
  torah: '<path d="M5 2v20M19 2v20"/><path d="M5 5h14M5 19h14"/><path d="M9 9h6M9 12h6M9 15h4"/>',
  bimah: '<path d="M4 10h16l-2 4H6z"/><path d="M7 14v6M17 14v6M5 20h14"/><path d="M9 10l1.2-4h3.6L15 10"/>',
  books: '<path d="M4 20V5h4v15M8 20V7h4v13"/><path d="M13.2 20.4l3.4-14.2 3.9.9-3.4 14.2z"/><path d="M3 20.5h18"/>',
  seat: '<path d="M7 3v9h10M7 12v9M17 12v9M7 16h10"/><path d="M7 3h3"/>',
  candle: '<path d="M9 21V11h6v10"/><path d="M6 21h12M12 11V9"/><path d="M12 3c1.6 1.8 1.6 3.5 0 4.6-1.6-1.1-1.6-2.8 0-4.6z"/>',
  plane: '<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  wine: '<path d="M8 22h8M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5z"/>',
  bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  people: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.1a4 4 0 0 1 0 7.8M21 21v-2a4 4 0 0 0-3-3.9"/>',
  tent: '<path d="M3.5 21L14 3M20.5 21L10 3M15.5 21L12 15l-3.5 6M2 21h20"/>',
  tree: '<circle cx="12" cy="9" r="6"/><path d="M12 22v-7M9 22h6"/>',
  ticket: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  gift: '<path d="M3 8h18v4H3zM12 8v13M19 12v9H5v-9"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  star: '<path d="M12 2l3.1 6.3 6.9 1-5 4.8 1.2 6.9-6.2-3.2-6.2 3.2L7 14.1 2 9.3l6.9-1z"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  bank: '<path d="M3 22h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2l8 5H4z"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>'
};

// אמוג'י → אייקון (בלי תו הווריאציה FE0F)
const EMOJI_ICON = {
  '🧱': 'brick', '📖': 'book', '🪟': 'window', '💡': 'lamp', '🏛': 'building', '🕍': 'ark',
  '📜': 'torah', '🪑': 'bimah', '📚': 'books', '💺': 'seat', '🕯': 'candle', '✈': 'plane',
  '🍷': 'wine', '🏨': 'bed', '🙏': 'people', '⛺': 'tent', '🌳': 'tree', '🎟': 'ticket',
  '🏆': 'trophy', '🎁': 'gift', '★': 'star', '⭐': 'star', '📞': 'phone', '✉': 'mail',
  '📍': 'pin', '🏦': 'bank', '❤': 'heart', '📷': 'camera', '🎵': 'music', '🎶': 'music'
};
// בגלריה 🕍 מייצג את הבניין ולא את ארון הקודש
const GALLERY_ICON = Object.assign({}, EMOJI_ICON, { '🕍': 'building', '🕯': 'lamp' });

function iconKey(v, map = EMOJI_ICON) {
  if (!v) return null;
  const s = String(v).trim();
  if (ICONS[s]) return s;
  return map[s.replace(/️/g, '')] || null;
}
function svgIcon(key, size = 24, cls = '') {
  return `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg>`;
}
// אייקון לפי שם או אמוג'י; אם אין התאמה – מציג את הטקסט (מוגן)
function ico(v, size = 24, map) {
  const k = iconKey(v, map);
  if (k) return svgIcon(k, size);
  return `<span class="i-emoji">${String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))}</span>`;
}

// מגן דוד בקו – מרכז (cx,cy) ורדיוס r
function magen(cx, cy, r) {
  const w = r * 0.866, h = r / 2;
  return `M${cx} ${cy - r}L${cx + w} ${cy + h}H${cx - w}Z M${cx} ${cy + r}L${cx + w} ${cy - h}H${cx - w}Z`;
}

// הלוגו של הקמפיין הנוכחי: תמונה שהועלתה בבק אופיס, ואם אין – עיגול בצבעי הקמפיין עם האייקון שלו
function orgLogo(size) {
  if (C && C.logo) return `<img src="${esc(C.logo)}" class="site-logo" width="${size}" height="${size}" alt="" aria-hidden="true">`;
  const c = (C && C.cover && C.cover.colors) || ['var(--navy)', 'var(--navy-dark)'];
  return `<span class="site-logo logo-badge" aria-hidden="true" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px;background:linear-gradient(135deg,${esc(c[0])},${esc(c[1])})">${esc((C && C.cover && C.cover.emoji) || '✨')}</span>`;
}
// סמל הפלטפורמה "יוזמה": לב בתוך עיגול, בצבעי ערכת הצבע
function platformMark(size) {
  return `<svg class="site-logo" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="31" style="fill:var(--navy)"/>
    <circle cx="32" cy="32" r="26.5" fill="none" style="stroke:var(--gold)" stroke-width="1.6" opacity=".75"/>
    <path d="M32 46s-13-7.6-13-17a7.4 7.4 0 0 1 13-4.8A7.4 7.4 0 0 1 45 29c0 9.4-13 17-13 17z" style="fill:var(--gold-light)"/>
    <path d="M25.5 30.5l4.2 4.2 8.6-8.6" fill="none" style="stroke:var(--navy-dark)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
// איור חזית בית כנסת למקום הסרטון (כללי, לא המבנה האמיתי)
function buildingSVG() {
  const W = 'rgba(255,255,255,', G = 'var(--gold-light)';
  const arch = (x, y, w, h) => `M${x} ${y + h}v-${h - w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0v${h - w / 2}z`;
  return `<svg class="bld" viewBox="0 0 400 240" aria-hidden="true">
    <rect x="0" y="228" width="400" height="12" fill="${W}.06)"/>
    <rect x="140" y="223" width="120" height="6" fill="${W}.16)"/>
    <rect x="150" y="217" width="100" height="6" fill="${W}.2)"/>
    <rect x="62" y="122" width="78" height="96" fill="${W}.12)"/>
    <rect x="260" y="122" width="78" height="96" fill="${W}.12)"/>
    <path d="M54 124L101 98l47 26z M252 124l47-26 47 26z" fill="${W}.18)"/>
    <rect x="130" y="92" width="140" height="126" fill="${W}.18)"/>
    <path d="M118 96L200 40l82 56z" fill="${W}.24)"/>
    <path d="M118 96L200 40l82 56" fill="none" style="stroke:${G}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="200" cy="75" r="15" fill="${W}.1)" style="stroke:${G}" stroke-width="2"/>
    <path d="${magen(200, 75, 9)}" fill="none" style="stroke:${G}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="${arch(176, 150, 48, 67)}" fill="${W}.3)"/>
    <path d="M200 150v67" stroke="rgba(23,37,84,.35)" stroke-width="2"/>
    <path d="${arch(176, 150, 48, 67)}" fill="none" style="stroke:${G}" stroke-width="1.5" opacity=".7"/>
    ${[143, 237].map(x => `<path d="${arch(x, 118, 20, 64)}" fill="${W}.26)"/>`).join('')}
    ${[80, 106, 278, 304].map(x => `<path d="${arch(x, 146, 16, 54)}" fill="${W}.24)"/>`).join('')}
    <g style="fill:${G}" opacity=".8">
      <ellipse cx="320" cy="62" rx="6" ry="4.4" transform="rotate(-20 320 62)"/><rect x="324.6" y="34" width="2" height="27"/>
      <path d="M326.6 34c5 2 9 6 7 13 0-4-3-7-7-8z"/>
      <ellipse cx="350" cy="40" rx="5" ry="3.7" transform="rotate(-20 350 40)"/><ellipse cx="368" cy="34" rx="5" ry="3.7" transform="rotate(-20 368 34)"/>
      <rect x="353.8" y="16" width="1.8" height="23"/><rect x="371.8" y="10" width="1.8" height="23"/>
      <path d="M353.8 16l19.8-6v4l-19.8 6z"/>
    </g>
    <g fill="#fff" opacity=".5"><circle cx="60" cy="40" r="1.5"/><circle cx="96" cy="62" r="1"/><circle cx="34" cy="86" r="1.2"/><circle cx="270" cy="30" r="1.2"/></g>
  </svg>`;
}

// קישוט רקע ל-hero: רשת נקודות עדינה וגלים זורמים
function heroDecor() {
  const staff = [0, 1, 2, 3, 4].map(i => `<path d="M-20 ${250 + i * 11}C220 ${170 + i * 11} 420 ${330 + i * 11} 700 ${230 + i * 11}S1180 ${150 + i * 11} 1460 ${250 + i * 11}"/>`).join('');
  return `<svg class="hero-decor" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><pattern id="mgn" width="56" height="56" patternUnits="userSpaceOnUse">
      <circle cx="28" cy="28" r="2" fill="#fff"/></pattern></defs>
    <rect width="1440" height="400" fill="url(#mgn)" opacity=".05"/>
    <g fill="none" style="stroke:var(--gold-light)" stroke-width="1.2" opacity=".22">${staff}</g>
  </svg>`;
}

// איור placeholder לתמונת גלריה שעוד לא הועלתה
function galleryArt(g, size = 44) {
  const k = iconKey(g.emoji, GALLERY_ICON) || 'camera';
  return `<span class="g-art">${svgIcon(k, size)}</span>`;
}
