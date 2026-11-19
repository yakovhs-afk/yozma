/* =====================================================================
   נגישות – לפי תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
   התשע"ג-2013, ות"י 5568 (מבוסס WCAG 2.0, רמה AA).
   כאן: סרגל הנגישות, הצהרת הנגישות וטקסטי הנגישות.
   ===================================================================== */
const A11Y_KEY = 'sc_a11y';
const A11Y_T = {
  he: {
    skip: 'דילוג לתוכן הראשי', menu: 'תפריט נגישות', open_menu: 'פתיחת תפריט נגישות', close: 'סגירה', close_menu: 'סגירת תפריט הנגישות',
    text_size: 'גודל טקסט', smaller: 'הקטנת טקסט', bigger: 'הגדלת טקסט',
    contrast: 'ניגודיות גבוהה', gray: 'גווני אפור', links: 'הדגשת קישורים', font: 'גופן קריא',
    spacing: 'ריווח טקסט', motion: 'עצירת אנימציות', cursor: 'סמן עכבר גדול',
    reset: 'איפוס הגדרות נגישות', statement: 'הצהרת נגישות', main_nav: 'ניווט ראשי', currency: 'מטבע',
    ils: 'שקלים', usd: 'דולרים', new_window: '(נפתח בחלון חדש)', progress: 'התקדמות', sort: 'מיון',
    ticker: 'תרומות אחרונות', pause: 'עצירת הגלילה', play: 'הפעלת הגלילה', video: 'סרטון הקמפיין',
    prev: 'התמונה הקודמת', next: 'התמונה הבאה', search_team: 'חיפוש צוות או שגריר', search_donor: 'חיפוש תורם',
    freq: 'אופן התרומה', amount: 'סכום', amounts: 'סכומים מוצעים', remaining: 'זמן שנותר'
  },
  en: {
    skip: 'Skip to main content', menu: 'Accessibility menu', open_menu: 'Open accessibility menu', close: 'Close', close_menu: 'Close accessibility menu',
    text_size: 'Text size', smaller: 'Smaller text', bigger: 'Larger text',
    contrast: 'High contrast', gray: 'Grayscale', links: 'Highlight links', font: 'Readable font',
    spacing: 'Text spacing', motion: 'Stop animations', cursor: 'Large cursor',
    reset: 'Reset accessibility settings', statement: 'Accessibility statement', main_nav: 'Main navigation', currency: 'Currency',
    ils: 'Shekels', usd: 'Dollars', new_window: '(opens in a new window)', progress: 'Progress', sort: 'Sort',
    ticker: 'Recent donations', pause: 'Pause scrolling', play: 'Resume scrolling', video: 'Campaign video',
    prev: 'Previous image', next: 'Next image', search_team: 'Search team or ambassador', search_donor: 'Search donor',
    freq: 'Donation type', amount: 'Amount', amounts: 'Suggested amounts', remaining: 'Time remaining'
  }
};
const ax = k => (A11Y_T[prefs.lang] || A11Y_T.he)[k] ?? A11Y_T.he[k] ?? k;
const srOnly = s => `<span class="sr-only">${s}</span>`;

/* ---------- העדפות המשתמש (נשמרות בדפדפן שלו בלבד) ---------- */
const A11Y_TOGGLES = ['contrast', 'gray', 'links', 'font', 'spacing', 'motion', 'cursor'];
const A11Y_ZOOMS = [1, 1.15, 1.3, 1.5];
const A11Y_DEFAULT = () => ({ zoom: 0, contrast: false, gray: false, links: false, font: false, spacing: false, motion: false, cursor: false });
let a11y = A11Y_DEFAULT();
try { Object.assign(a11y, JSON.parse(localStorage.getItem(A11Y_KEY)) || {}); } catch (e) {}
a11y.zoom = Math.min(A11Y_ZOOMS.length - 1, Math.max(0, Number(a11y.zoom) || 0));
const reducedMotion = () => a11y.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyA11y() {
  const h = document.documentElement;
  A11Y_TOGGLES.forEach(k => h.classList.toggle('a11y-' + k, !!a11y[k]));
  h.classList.toggle('a11y-zoomed', a11y.zoom > 0);
  h.style.setProperty('--a11y-zoom', A11Y_ZOOMS[a11y.zoom]);
}
function saveA11y() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch (e) {} }

const A11Y_ICONS = {
  person: '<circle cx="12" cy="4.2" r="2"/><path d="M4.5 8.5l7.5 1.5 7.5-1.5M12 10v5m0 0l-3.5 6.5M12 15l3.5 6.5"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 000-18z" fill="currentColor"/>',
  gray: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  links: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  font: '<path d="M4 19l6-14 6 14M6.5 14h7"/><path d="M17 19v-6m-2 0h4"/>',
  spacing: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M2 4v16M22 4v16" stroke-dasharray="2 2"/>',
  motion: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  cursor: '<path d="M6 3l12 9-5.5 1.2L15.5 20l-2.6 1.2-3-6.8L6 18z"/>',
  reset: '<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7"/><path d="M4 3v5h5"/>'
};
const a11yIcon = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${A11Y_ICONS[k]}</svg>`;

/* ---------- סרגל הנגישות ---------- */
function renderA11yBar() {
  applyA11y();
  let box = document.getElementById('a11y');
  const wasOpen = box && !box.querySelector('#a11y-panel').hidden;
  if (!box) { box = document.createElement('div'); box.id = 'a11y'; box.className = 'a11y'; document.getElementById('skip').after(box); }
  box.innerHTML = `
    <button type="button" class="a11y-btn" id="a11y-btn" aria-expanded="${wasOpen}" aria-controls="a11y-panel" aria-label="${ax('open_menu')}" title="${ax('menu')}">${a11yIcon('person', 26)}</button>
    <div class="a11y-panel" id="a11y-panel" role="dialog" aria-labelledby="a11y-title" ${wasOpen ? '' : 'hidden'}>
      <div class="a11y-head"><h2 id="a11y-title">${ax('menu')}</h2>
        <button type="button" class="a11y-x" data-a11y-close aria-label="${ax('close_menu')}">✕</button></div>
      <div class="a11y-zoom" role="group" aria-labelledby="a11y-zoom-lbl">
        <span id="a11y-zoom-lbl">${ax('text_size')}</span>
        <button type="button" data-a11y-zoom="-1" aria-label="${ax('smaller')}" ${a11y.zoom === 0 ? 'disabled' : ''}>${prefs.lang === 'he' ? 'א' : 'A'}-</button>
        <output aria-live="polite">${Math.round(A11Y_ZOOMS[a11y.zoom] * 100)}%</output>
        <button type="button" data-a11y-zoom="1" aria-label="${ax('bigger')}" ${a11y.zoom === A11Y_ZOOMS.length - 1 ? 'disabled' : ''}>${prefs.lang === 'he' ? 'א' : 'A'}+</button>
      </div>
      <div class="a11y-grid">${A11Y_TOGGLES.map(k => `<button type="button" data-a11y="${k}" aria-pressed="${!!a11y[k]}">${a11yIcon(k)}<span>${ax(k)}</span></button>`).join('')}</div>
      <button type="button" class="a11y-reset" data-a11y-reset>${a11yIcon('reset', 18)} ${ax('reset')}</button>
      <a class="a11y-link" href="#/accessibility" data-a11y-statement>${ax('statement')}</a>
    </div>`;
  box.setAttribute('dir', prefs.lang === 'he' ? 'rtl' : 'ltr');
}
function setA11yPanel(open, focusBtn) {
  const panel = $('#a11y-panel'), btn = $('#a11y-btn');
  if (!panel) return;
  panel.hidden = !open;
  btn.setAttribute('aria-expanded', open);
  if (open) panel.querySelector('button').focus();
  else if (focusBtn) btn.focus();
}
document.addEventListener('click', e => {
  const box = document.getElementById('a11y');
  if (!box) return;
  if (!box.contains(e.target)) { if (!$('#a11y-panel').hidden) setA11yPanel(false); return; }
  const el = e.target.closest('button,a');
  if (!el) return;
  if (el.id === 'a11y-btn') return setA11yPanel($('#a11y-panel').hidden);
  if (el.matches('[data-a11y-close]')) return setA11yPanel(false, true);
  if (el.matches('[data-a11y-statement]')) return setA11yPanel(false);
  let focusSel = null;
  if (el.matches('[data-a11y-zoom]')) {
    a11y.zoom = Math.min(A11Y_ZOOMS.length - 1, Math.max(0, a11y.zoom + Number(el.dataset.a11yZoom)));
    focusSel = `[data-a11y-zoom="${el.dataset.a11yZoom}"]`;
  } else if (el.matches('[data-a11y]')) {
    a11y[el.dataset.a11y] = !a11y[el.dataset.a11y];
    focusSel = `[data-a11y="${el.dataset.a11y}"]`;
  } else if (el.matches('[data-a11y-reset]')) {
    a11y = A11Y_DEFAULT(); focusSel = '[data-a11y-reset]';
  } else return;
  saveA11y();
  renderA11yBar();
  const f = $(focusSel);
  (f && !f.disabled ? f : $('#a11y-panel button')).focus();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#a11y-panel') && !$('#a11y-panel').hidden) { e.stopImmediatePropagation(); setA11yPanel(false, true); }
}, true);

/* ---------- הצהרת נגישות ---------- */
function a11yStatementPage() {
  const A = C.a11y || {}, ct = C.contact || {}, he = prefs.lang === 'he';
  const org = esc(L(C.orgName));
  const phone = A.phone || ct.phone, email = A.email || ct.email;
  const physical = L(A.physical), limits = L(A.limits);
  const paras = s => String(s).split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join('');
  const contactBlock = `<ul class="st-contact">
      ${A.coordName ? `<li><strong>${he ? 'רכז/ת נגישות:' : 'Accessibility coordinator:'}</strong> ${esc(A.coordName)}</li>` : ''}
      ${phone ? `<li><strong>${he ? 'טלפון:' : 'Phone:'}</strong> <a href="tel:${esc(phone)}" dir="ltr">${esc(phone)}</a></li>` : ''}
      ${email ? `<li><strong>${he ? 'דוא"ל:' : 'Email:'}</strong> <a href="mailto:${esc(email)}" dir="ltr">${esc(email)}</a></li>` : ''}
      ${L(ct.address) ? `<li><strong>${he ? 'כתובת:' : 'Address:'}</strong> ${esc(L(ct.address))}</li>` : ''}
    </ul>`;
  const body = he ? `
    <p>${org} רואה חשיבות רבה במתן שירות שוויוני, מכבד ונגיש לכל הציבור, ובכלל זה לאנשים עם מוגבלות. השקענו מאמצים כדי שכל אחד ואחת יוכלו לגלוש באתר, לקרוא על הפרויקט ולתרום בקלות ובנוחות.</p>
    <h2>התקן שלפיו הונגש האתר</h2>
    <p>האתר הונגש בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ולתקן הישראלי ת"י 5568 – "קווים מנחים לנגישות תכנים באינטרנט", ברמת התאמה AA. התקן מבוסס על הנחיות WCAG 2.0 של ארגון W3C.</p>
    <h2>מה עשינו באתר</h2>
    <ul>
      <li>אפשר לנווט בכל האתר באמצעות המקלדת בלבד (<kbd>Tab</kbd> ו-<kbd>Shift+Tab</kbd> למעבר, <kbd>Enter</kbd> להפעלה, <kbd>Esc</kbd> לסגירת חלונות), והרכיב שבפוקוס מסומן במסגרת בולטת.</li>
      <li>בראש כל עמוד יש קישור "דילוג לתוכן הראשי".</li>
      <li>מבנה העמודים מסודר בכותרות, אזורים ורשימות, כך שקוראי מסך יכולים להציג אותו נכון.</li>
      <li>לכל שדה בטופס התרומה יש תווית, והודעות שגיאה מוקראות אוטומטית.</li>
      <li>לכפתורים ולרכיבים גרפיים יש תיאור טקסטואלי, ורכיבים קישוטיים מוסתרים מקוראי מסך.</li>
      <li>חלונות קופצים (כמו חלון התרומה) נפתחים כחלון דו-שיח נגיש: הפוקוס עובר אליהם, נשאר בתוכם וחוזר למקומו בסגירה.</li>
      <li>ניגודיות הצבעים בין הטקסט לרקע עומדת בדרישות רמה AA.</li>
      <li>אפשר לעצור את פס התרומות הנע, והאנימציות נעצרות אוטומטית כשבמערכת ההפעלה מוגדרת "הפחתת תנועה".</li>
      <li>האתר מותאם לטלפונים ולמסכים בכל גודל, ואפשר להגדיל את התצוגה בדפדפן עד 200% בלי לאבד תוכן.</li>
      <li>האתר זמין בעברית ובאנגלית, ושפת כל עמוד מוגדרת כך שקוראי מסך יקריאו אותו במבטא הנכון.</li>
    </ul>
    <h2>תפריט הנגישות</h2>
    <p>בצד המסך יש כפתור נגישות ${a11yIcon('person', 16)} שפותח תפריט עם האפשרויות: הגדלה והקטנה של הטקסט, ניגודיות גבוהה, גווני אפור, הדגשת קישורים, גופן קריא, ריווח טקסט, עצירת אנימציות וסמן עכבר גדול. ההגדרות נשמרות בדפדפן שלכם לביקור הבא.</p>
    ${physical ? `<h2>הסדרי נגישות פיזיים</h2>${paras(physical)}` : ''}
    <h2>מגבלות ידועות</h2>
    <p>למרות מאמצינו, ייתכן שיימצאו באתר חלקים שעדיין אינם נגישים במלואם. תכנים של ספקים חיצוניים המוטמעים באתר, כמו סרטוני וידאו או עמוד התשלום של חברת הסליקה, אינם בשליטתנו המלאה וייתכן שאינם נגישים לגמרי.</p>
    ${limits ? paras(limits) : ''}
    <h2>נתקלתם בבעיה? נשמח לעזור</h2>
    <p>אם נתקלתם בקושי בגלישה או בתרומה, או שיש לכם הצעה לשיפור, נשמח שתפנו אלינו. כדי שנוכל לטפל בפנייה, כתבו בבקשה מה הבעיה, באיזה עמוד נתקלתם בה, ובאיזה דפדפן וטכנולוגיה מסייעת השתמשתם (אם השתמשתם). אפשר גם לתרום בטלפון או בהעברה בנקאית – הפרטים בתחתית העמוד הראשי.</p>
    ${contactBlock}`
  : `
    <p>${org} is committed to providing an equal, respectful and accessible service to everyone, including people with disabilities. We have worked to make it easy for everyone to browse this site, read about the project and donate.</p>
    <h2>Standard</h2>
    <p>This site was made accessible in accordance with the Israeli Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 2013, and Israeli Standard IS 5568 ("Web Content Accessibility Guidelines"), at conformance level AA. The standard is based on the W3C WCAG 2.0 guidelines.</p>
    <h2>What we did</h2>
    <ul>
      <li>The whole site can be used with a keyboard alone (<kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> to move, <kbd>Enter</kbd> to activate, <kbd>Esc</kbd> to close windows), with a clearly visible focus indicator.</li>
      <li>Every page starts with a "Skip to main content" link.</li>
      <li>Pages are structured with headings, landmarks and lists for screen readers.</li>
      <li>Every field in the donation form has a label, and error messages are announced automatically.</li>
      <li>Buttons and graphics have text alternatives; decorative graphics are hidden from screen readers.</li>
      <li>Pop-up windows (such as the donation form) are accessible dialogs: focus moves into them, stays inside, and returns when they close.</li>
      <li>Text colour contrast meets level AA.</li>
      <li>The moving donations bar can be paused, and animations stop automatically when "reduce motion" is set in your operating system.</li>
      <li>The site works on phones and screens of any size, and can be zoomed to 200% without losing content.</li>
      <li>The site is available in Hebrew and English, and each page declares its language for screen readers.</li>
    </ul>
    <h2>Accessibility menu</h2>
    <p>The accessibility button ${a11yIcon('person', 16)} at the side of the screen opens a menu with: larger and smaller text, high contrast, grayscale, highlighted links, readable font, text spacing, stopping animations and a large cursor. Your settings are saved in your browser for your next visit.</p>
    ${physical ? `<h2>Physical accessibility</h2>${paras(physical)}` : ''}
    <h2>Known limitations</h2>
    <p>Despite our efforts, some parts of the site may not yet be fully accessible. Third-party content embedded in the site, such as videos or the payment provider's checkout page, is not fully under our control and may not be fully accessible.</p>
    ${limits ? paras(limits) : ''}
    <h2>Need help?</h2>
    <p>If you have difficulty using the site or donating, or have a suggestion, please contact us. Please describe the problem, the page where it happened, and the browser and assistive technology you used (if any). You can also donate by phone or bank transfer – details are at the bottom of the main page.</p>
    ${contactBlock}`;
  return `<section class="hero small"><div class="hero-bg">${heroDecor()}</div>
      <div class="container hero-text"><a class="back-link" href="#/">${he ? '→' : '←'} ${esc(L(C.name))}</a><h1>${ax('statement')}</h1></div></section>
    <article class="container narrow statement">${body}
      ${A.updated ? `<p class="muted small st-date">${he ? 'תאריך עדכון ההצהרה:' : 'Statement last updated:'} ${esc(A.updated)}</p>` : ''}
    </article>`;
}

applyA11y();
