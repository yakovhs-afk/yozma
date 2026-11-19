/* ערכות הצבע של האתר. הצבעים עצמם מוגדרים ב-styles.css לפי data-theme.
   sw = דוגמית: צבע ראשי, צבע כהה, צבע הדגשה, רקע */
const THEMES = [
  { id: 'classic', he: 'כחול וזהב', en: 'Navy & gold', sw: ['#1e3a8a', '#172554', '#c8a24a', '#fbfaf7'] },
  { id: 'stone', he: 'אבן ירושלמית וטורקיז', en: 'Jerusalem stone & teal', sw: ['#0f4c5c', '#0a3440', '#b8925a', '#faf7f0'] },
  { id: 'bordeaux', he: 'בורדו וזהב', en: 'Bordeaux & gold', sw: ['#7a1f35', '#4e1222', '#c8a24a', '#fcf9f6'] },
  { id: 'olive', he: 'ירוק זית ושמש', en: 'Olive & sun', sw: ['#3e5a3a', '#263a24', '#c99a3e', '#fbfaf5'] },
  { id: 'sky', he: 'תכלת ולבן', en: 'Sky blue & white', sw: ['#1d5aa0', '#123c6e', '#3d9ad6', '#f9fbfd'] },
  { id: 'logo', he: 'ירוק, בורדו וחול (מהלוגו)', en: 'Green, burgundy & sand (logo)', sw: ['#025224', '#721819', '#cbb983', '#fbf9f1'] },
  { id: 'logo-rose', he: 'בורדו, ירוק וחול (מהלוגו)', en: 'Burgundy, green & sand (logo)', sw: ['#721819', '#025224', '#cbb983', '#fbf9f1'] }
];
function swatchHTML(th) {
  return `<span class="sw">${th.sw.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
}

/* זוגות גופנים: head = כותרות ומספרים גדולים, body = טקסט רגיל. כולם מ-Google Fonts ותומכים בעברית. */
const FONT_WEIGHTS = {
  'Frank Ruhl Libre': 'wght@500;700;900', 'Heebo': 'wght@300;400;500;700;800',
  'David Libre': 'wght@400;500;700', 'Assistant': 'wght@300;400;500;700;800',
  'Noto Serif Hebrew': 'wght@500;700;900', 'Noto Sans Hebrew': 'wght@300;400;500;700;800',
  'Suez One': '', 'Secular One': '', 'Bellefair': '',
  'Rubik': 'wght@300;400;500;700;800;900', 'IBM Plex Sans Hebrew': 'wght@300;400;500;700',
  'Noto Rashi Hebrew': 'wght@400;500;700;900', 'Bona Nova': 'wght@400;700', 'Open Sans': 'wght@300;400;500;700;800',
  'Miriam Libre': 'wght@400;500;700', 'Tinos': 'wght@400;700', 'Arimo': 'wght@400;500;700',
  'Alef': 'wght@400;700', 'Varela Round': '', 'Fredoka': 'wght@300;400;500;700',
  'Karantina': 'wght@300;400;700', 'Amatic SC': 'wght@400;700', 'Playpen Sans Hebrew': 'wght@400;500;700;800'
};
const FONTS = [
  { id: 'classic', head: 'Frank Ruhl Libre', body: 'Heebo', he: 'קלאסי – פרנק רוהל + חיבו', en: 'Classic – Frank Ruhl + Heebo' },
  { id: 'david', head: 'David Libre', body: 'Assistant', he: 'מסורתי – דוד + אסיסטנט', en: 'Traditional – David + Assistant' },
  { id: 'noto', head: 'Noto Serif Hebrew', body: 'Noto Sans Hebrew', he: 'ספרותי – נוטו סריף + נוטו', en: 'Literary – Noto Serif + Noto Sans' },
  { id: 'bellefair', head: 'Bellefair', body: 'Heebo', he: 'אלגנטי – בלפייר + חיבו', en: 'Elegant – Bellefair + Heebo' },
  { id: 'suez', head: 'Suez One', body: 'Rubik', he: 'חגיגי – סואץ + רוביק', en: 'Festive – Suez One + Rubik' },
  { id: 'secular', head: 'Secular One', body: 'Assistant', he: 'מודרני – סקולר + אסיסטנט', en: 'Modern – Secular One + Assistant' },
  { id: 'rubik', head: 'Rubik', body: 'Rubik', he: 'עגול וידידותי – רוביק', en: 'Friendly – Rubik' },
  { id: 'plex', head: 'IBM Plex Sans Hebrew', body: 'IBM Plex Sans Hebrew', he: 'עכשווי – IBM Plex', en: 'Contemporary – IBM Plex' },
  { id: 'rashi', head: 'Noto Rashi Hebrew', body: 'Assistant', he: 'כתב רש"י – נוטו רש"י + אסיסטנט', en: 'Rashi script – Noto Rashi + Assistant' },
  { id: 'bona', head: 'Bona Nova', body: 'Open Sans', he: 'ספר – בונה נובה + אופן סאנס', en: 'Bookish – Bona Nova + Open Sans' },
  { id: 'tinos', head: 'Tinos', body: 'Arimo', he: 'עיתון – טינוס + ארימו', en: 'Newspaper – Tinos + Arimo' },
  { id: 'miriam', head: 'Miriam Libre', body: 'Heebo', he: 'גאומטרי – מרים + חיבו', en: 'Geometric – Miriam Libre + Heebo' },
  { id: 'alef', head: 'Alef', body: 'Alef', he: 'פשוט ונקי – אלף', en: 'Simple – Alef' },
  { id: 'varela', head: 'Varela Round', body: 'Assistant', he: 'רך – ורלה ראונד + אסיסטנט', en: 'Soft – Varela Round + Assistant' },
  { id: 'fredoka', head: 'Fredoka', body: 'Rubik', he: 'שמח – פרדוקה + רוביק', en: 'Playful – Fredoka + Rubik' },
  { id: 'karantina', head: 'Karantina', body: 'Heebo', he: 'כרזה – קרנטינה + חיבו', en: 'Poster – Karantina + Heebo' },
  { id: 'amatic', head: 'Amatic SC', body: 'Assistant', he: 'כתב יד – אמאטיק + אסיסטנט', en: 'Handwritten – Amatic SC + Assistant' },
  { id: 'playpen', head: 'Playpen Sans Hebrew', body: 'Assistant', he: 'כתב יד עגול – פלייפן + אסיסטנט', en: 'Round handwriting – Playpen + Assistant' }
];
const SERIF_HEADS = ['Frank Ruhl Libre', 'David Libre', 'Noto Serif Hebrew', 'Bellefair', 'Noto Rashi Hebrew', 'Bona Nova', 'Tinos'];
function fontPair(id) { return FONTS.find(f => f.id === id) || FONTS[0]; }
function fontsURL(families) {
  const uniq = [...new Set(families)];
  return 'https://fonts.googleapis.com/css2?' + uniq.map(n => 'family=' + n.replace(/ /g, '+') + (FONT_WEIGHTS[n] ? ':' + FONT_WEIGHTS[n] : '')).join('&') + '&display=swap';
}
function allFontsURL() { return fontsURL(FONTS.flatMap(f => [f.head, f.body])); }
// מחיל זוג גופנים על הדף: טוען את הגופנים ומעדכן את משתני ה-CSS
function setFontVars(fp, linkId) {
  const link = document.getElementById(linkId);
  const url = fontsURL([fp.head, fp.body]);
  if (link && !link.dataset.all && link.href !== url) link.href = url;
  const s = document.documentElement.style;
  s.setProperty('--font-head', `'${fp.head}', '${fp.body}', ${SERIF_HEADS.includes(fp.head) ? 'serif' : 'sans-serif'}`);
  s.setProperty('--font-body', `'${fp.body}', system-ui, sans-serif`);
}

/* סגנונות לתצוגת ההתקדמות של הקמפיין (בכרטיס היעד בראש האתר) */
const PROGRESS_STYLES = [
  { id: 'bar', he: 'פס דק', en: 'Slim bar' },
  { id: 'thick', he: 'פס עבה עם אחוזים', en: 'Bold bar with percent' },
  { id: 'ring', he: 'עיגול', en: 'Ring' },
  { id: 'thermo', he: 'מדחום', en: 'Thermometer' },
  { id: 'building', he: 'בית כנסת שמתמלא', en: 'Filling synagogue' }
];
const progressStyleId = id => PROGRESS_STYLES.some(s => s.id === id) ? id : 'bar';
let meterSeq = 0;
// הגרפיקה בלבד. pct = אחוז אמיתי (יכול לעבור 100), marks = מיקומי יעדי בונוס באחוזים, over = עברנו את היעד
function meterGraphic(style, pct, marks = [], over = false) {
  const p = Math.max(0, Math.min(100, pct)), id = 'mtr' + (++meterSeq), cls = over ? ' over' : '';
  const grad = `<defs><linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="m-s1"/><stop offset="1" class="m-s2"/></linearGradient></defs>`;
  if (style === 'thick') return `<div class="m-bar thick${cls}"><div class="m-fill" style="width:${p}%"></div>
    ${marks.map(m => `<i style="inset-inline-start:${m}%"></i>`).join('')}<span class="m-lbl${p < 18 ? ' out' : ''}" style="inset-inline-start:${p < 18 ? p : 0}%;${p < 18 ? '' : `width:${p}%`}">${pct}%</span></div>`;
  if (style === 'ring') {
    const c = 2 * Math.PI * 52;
    return `<div class="m-ring${cls}"><svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">${grad}
      <circle cx="60" cy="60" r="52" class="m-track" fill="none" stroke-width="12"/>
      <circle cx="60" cy="60" r="52" class="m-arc" fill="none" stroke="url(#${id}g)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p / 100)).toFixed(1)}" transform="rotate(-90 60 60)"/></svg>
      <span class="m-ring-txt">${pct}%</span></div>`;
  }
  if (style === 'thermo') {
    const top = 8, h = 132, y = top + h * (1 - p / 100);
    return `<div class="m-thermo${cls}"><svg viewBox="0 0 56 184" aria-hidden="true" focusable="false">${grad}
      <clipPath id="${id}c"><rect x="18" y="${top}" width="20" height="${h + 20}" rx="10"/><circle cx="28" cy="160" r="20"/></clipPath>
      <rect x="18" y="${top}" width="20" height="${h + 20}" rx="10" class="m-track"/><circle cx="28" cy="160" r="20" class="m-track"/>
      <g clip-path="url(#${id}c)"><rect x="0" y="${y.toFixed(1)}" width="56" height="${(184 - y).toFixed(1)}" fill="url(#${id}g)" class="m-grow"/></g>
      ${[25, 50, 75].map(v => `<line x1="40" x2="46" y1="${top + h * (1 - v / 100)}" y2="${top + h * (1 - v / 100)}" class="m-tick"/>`).join('')}
      ${marks.map(m => `<line x1="10" x2="18" y1="${(top + h * (1 - m / 100)).toFixed(1)}" y2="${(top + h * (1 - m / 100)).toFixed(1)}" class="m-mark"/>`).join('')}</svg></div>`;
  }
  if (style === 'building') {
    const top = 6, bottom = 112, y = top + (bottom - top) * (1 - p / 100);
    const shape = 'M60 6 L112 46 L104 46 L104 112 L16 112 L16 46 L8 46 Z';
    return `<div class="m-bld${cls}"><svg viewBox="0 0 120 118" aria-hidden="true" focusable="false">${grad}
      <clipPath id="${id}c"><path d="${shape}"/></clipPath>
      <path d="${shape}" class="m-track"/>
      <g clip-path="url(#${id}c)"><rect x="0" y="${y.toFixed(1)}" width="120" height="${(118 - y).toFixed(1)}" fill="url(#${id}g)" class="m-grow"/></g>
      <path d="${shape}" class="m-outline" fill="none"/>
      <path d="M60 22 l5 8.7h-10z M60 33.6 l-5-8.7h10z" class="m-star" fill="none"/>
      <path d="M50 112 V92 a10 10 0 0 1 20 0 V112" class="m-win"/>
      <rect x="27" y="60" width="14" height="20" rx="7" class="m-win"/><rect x="79" y="60" width="14" height="20" rx="7" class="m-win"/>
      <rect x="53" y="56" width="14" height="20" rx="7" class="m-win"/></svg></div>`;
  }
  return `<div class="m-bar${cls}"><div class="m-fill" style="width:${p}%"></div>${marks.map(m => `<i style="inset-inline-start:${m}%"></i>`).join('')}</div>`;
}

/* בדיקת ספרת ביקורת של מספר תעודת זהות ישראלית (משותף לאתר ולבק אופיס).
   מחזיר את המספר בן 9 הספרות (עם אפסים מובילים), או '' אם הוא לא תקין. */
function cleanIsraeliId(v) {
  const s = String(v || '').replace(/[\s-]/g, '');
  if (!/^\d{5,9}$/.test(s)) return '';
  const id = s.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) { let d = Number(id[i]) * (i % 2 + 1); sum += d > 9 ? d - 9 : d; }
  return sum % 10 === 0 && !/^0+$/.test(id) ? id : '';
}
