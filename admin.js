/* ===================== בק אופיס – פלטפורמת יוזמה =====================
   כל משתמש רואה רק את הקמפיינים שלו. מנהל פלטפורמה רואה הכול, מאשר בקשות לקמפיינים
   חדשים, מנהל משתמשים ואת הגדרות הפלטפורמה. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = v => Number(v) || 0;
const ils = n => '₪' + Math.round(N(n)).toLocaleString('he-IL');
const num = n => Math.round(N(n)).toLocaleString('he-IL');
const clone = o => JSON.parse(JSON.stringify(o));
const L = v => v && typeof v === 'object' ? (v.he || v.en || '') : (v ?? '');
const pad = n => String(n).padStart(2, '0');
const fmtDate = ms => { if (!ms) return '—'; const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDay = ms => { const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
const toLocalInput = ms => { if (!ms) return ''; const d = new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fromLocalInput = s => s ? new Date(s).getTime() : null;
const toDateInput = ms => toLocalInput(ms).slice(0, 10);

const METHODS = { card: 'כרטיס אשראי', cash: 'מזומן', check: 'צ\'ק', bank: 'העברה בנקאית', bit: 'ביט / פייבוקס', other: 'אחר' };
const STATUSES = { paid: 'שולם', pending: 'ממתין לתשלום', refunded: 'הוחזר', cancelled: 'בוטל' };
const SOURCES = { online: 'אתר', manual: 'ידני' };
const PLAQUE = { new: 'חדש', progress: 'בטיפול', done: 'הושלם' };
const TEAM_ST = { approved: 'מאושר', pending: 'ממתין לאישור', hidden: 'מוסתר' };
const MS_ST = { done: 'הושלם', active: 'בתהליך עכשיו', todo: 'בעתיד' };

let SAVED = null, draft = null, DON = [], dirty = false, page = 'dashboard';
/* הקמפיין שנבחר לניהול, רשימת הקמפיינים של המשתמש, והגדרות הפלטפורמה (למנהל פלטפורמה) */
let CAMP_ID = null, CAMPS = [], CAN_EDIT = false, PLAT_SAVED = null, PLAT = null;
/* משתמש מחובר והרשאות:
   admin = מנהל פלטפורמה (הכול) · manager = מנהל קמפיין (הקמפיינים שלו) · viewer = מורשה (צפייה בלבד) */
let ME = null;
const ROLES = { admin: 'מנהל פלטפורמה', manager: 'מנהל קמפיין', viewer: 'מורשה – צפייה בלבד' };
const isAdmin = () => ME?.role === 'admin';
const isViewer = () => !!ME && !(isPlatPage() ? isAdmin() : CAN_EDIT);
const isPlatPage = (p = page) => !!PAGES[p]?.platform;
const campPath = (hash = '') => `/#/c/${encodeURIComponent(CAMP_ID || '')}${hash}`;
const CAMP_ST = { live: 'פורסם באתר', pending: 'ממתין לאישור', hidden: 'מוסתר' };
const RO_ACTS = ['new-donation', 'team-status', 'clear-dates', 'rm-img', 'raffle-draw', 'raffle-reset', 'purge-demo', 'pick-theme', 'pick-fonts', 'pick-progress', 'user-pw', 'user-del', 'camp-status', 'camp-del', 'pick-cover'];
const NO_PERM = 'הרשאת צפייה בלבד – אין אפשרות לבצע שינויים';
// במצב צפייה: נועל שדות ומסתיר כפתורי עריכה (השרת חוסם שינויים בכל מקרה)
function lockReadOnly(root) {
  if (!isViewer() || !root) return;
  $$('[data-p],[data-dp],[data-e],#e-matched,#e-credited,[data-act="pick-theme"],[data-act="pick-fonts"],[data-act="pick-progress"]', root).forEach(el => { el.disabled = true; });
  $$(['[data-la]', '[data-save]', '.row-ctl', '#e-del', '#e-print', '#don-form button[type=submit]', ...RO_ACTS.filter(a => !a.startsWith('pick-')).map(a => `[data-act="${a}"]`)].join(','), root).forEach(el => { el.hidden = true; });
  $$('[data-upload],#restore-file', root).forEach(el => { const l = el.closest('label'); if (l) l.hidden = true; });
}
const ui = { don: { q: '', status: '', source: '', team: '', type: '', from: '', to: '', pageNo: 0 }, donors: { q: '', sort: 'total' } };

/* ===================== שרת ===================== */
async function call(path, body, method) {
  const opt = { method: method || (body ? 'POST' : 'GET'), headers: {}, credentials: 'same-origin' };
  if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  let r;
  try { r = await fetch('/api/admin/' + path, opt); }
  catch (e) { toast('אין חיבור לשרת – ודאו ש-server.ps1 פועל', true); throw e; }
  const data = await r.json().catch(() => ({ ok: false, error: 'server' }));
  if (r.status === 401 && data.error === 'auth') { showLogin('פג תוקף ההתחברות – התחברו מחדש'); throw new Error('auth'); }
  if (r.status === 403 && data.error === 'forbidden') toast(NO_PERM, true);
  return data;
}
function toast(msg, bad = false) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2800);
}

/* ===================== התחברות ===================== */
async function boot() {
  let st;
  try { st = await (await fetch('/api/admin/status', { credentials: 'same-origin' })).json(); }
  catch (e) {
    $('#root').innerHTML = authCard(`<h1>השרת לא פועל</h1><p class="muted">הבק אופיס עובד רק כשהאתר רץ דרך <b>server.ps1</b>. הפעילו אותו ורעננו את הדף.</p>`);
    return;
  }
  if (st.setup) return showSetup();
  if (!st.loggedIn) return showLogin();
  await loadData();
}
const authCard = inner => `<div class="auth"><div class="auth-card"><img src="favicon.svg" class="auth-logo" alt="">${inner}</div></div>`;

function showSetup() {
  $('#root').innerHTML = authCard(`
    <h1>הגדרה ראשונית של הבק אופיס</h1>
    <p class="muted">צרו את המשתמש הראשון – "מנהל פלטפורמה" עם כל ההרשאות. אחר כך תוכלו להוסיף מנהלי קמפיין לכל עמותה במסך "משתמשים".</p>
    <form id="setup-form">
      <div class="fld"><label>השם שלך <span class="hint">(לא חובה)</span></label><input type="text" id="su-name" maxlength="60"></div>
      <div class="fld"><label>שם משתמש <span class="hint">(באנגלית)</span></label><input type="text" id="su-user" value="admin" dir="ltr" autocomplete="username"></div>
      <div class="fld"><label>סיסמה (לפחות 8 תווים)</label><input type="password" id="pw1" autocomplete="new-password"></div>
      <div class="fld"><label>אימות סיסמה</label><input type="password" id="pw2" autocomplete="new-password"></div>
      <label class="chk"><input type="checkbox" id="demo" checked> לטעון קמפיינים, תרומות וצוותים לדוגמה (אפשר למחוק או להסתיר אחר כך)</label>
      <div class="err" id="err"></div>
      <button class="btn gold" style="width:100%;justify-content:center">יצירת הבק אופיס</button>
    </form>`);
  $('#setup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const p1 = $('#pw1').value, p2 = $('#pw2').value;
    if (p1.length < 8) return $('#err').textContent = 'הסיסמה צריכה להכיל לפחות 8 תווים';
    if (p1 !== p2) return $('#err').textContent = 'הסיסמאות אינן תואמות';
    const res = await (await fetch('/api/admin/setup', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('#su-name').value.trim(), username: $('#su-user').value.trim(), password: p1, db: buildInitialDb($('#demo').checked) }) })).json();
    if (!res.ok) return $('#err').textContent = res.error === 'username' ? USER_ERR.username : 'ההגדרה נכשלה (' + res.error + ')';
    await loadData();
    toast('הבק אופיס מוכן! ברוכים הבאים 🎉');
  });
}

function showLogin(msg = '') {
  closeModal();
  $('#root').innerHTML = authCard(`
    <h1>כניסה לבק אופיס</h1>
    <p class="muted">${esc(L(PLATFORM.name))} – ניהול קמפיינים</p>
    <form id="login-form">
      <div class="fld"><label>שם משתמש</label><input type="text" id="un" dir="ltr" autocomplete="username" autofocus></div>
      <div class="fld"><label>סיסמה</label><input type="password" id="pw" autocomplete="current-password"></div>
      <label class="chk remember"><input type="checkbox" id="remember"> זכור אותי במחשב הזה (30 יום)</label>
      <p class="muted small remember-hint">לא לסמן במחשב משותף או ציבורי.</p>
      <div class="err" id="err">${esc(msg)}</div>
      <button class="btn" style="width:100%;justify-content:center">כניסה</button>
    </form>
    <p class="muted small">שכחתם סיסמה? מנהל הפלטפורמה יכול לקבוע לכם סיסמה חדשה במסך "משתמשים".</p>
    <p class="small" style="margin-top:14px"><a href="/">→ חזרה לאתר</a></p>`);
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const r = await fetch('/api/admin/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: $('#un').value.trim(), password: $('#pw').value, remember: $('#remember').checked }) });
    const res = await r.json();
    if (res.ok) return loadData();
    $('#err').textContent = res.error === 'locked' ? 'יותר מדי ניסיונות – נסו שוב בעוד דקה' : 'שם משתמש או סיסמה שגויים';
  });
}

async function loadData(campId) {
  try { ME = (await (await fetch('/api/admin/status', { credentials: 'same-origin' })).json()).user || null; } catch (e) { ME = null; }
  const list = await call('campaigns');
  if (!list.ok) return toast('טעינת הנתונים נכשלה', true);
  CAMPS = list.campaigns || [];
  if (isAdmin()) {
    const pr = await call('platform');
    if (pr.ok) { PLAT_SAVED = normalizePlat(pr.platform); PLAT = clone(PLAT_SAVED); }
  }
  let want = campId || CAMP_ID;
  if (!want) { try { want = localStorage.getItem('yz_admin_camp'); } catch (e) {} }
  CAMP_ID = CAMPS.some(c => c.id === want) ? want : (CAMPS[0]?.id || null);
  if (!CAMP_ID) {
    if (isAdmin()) { draft = null; DON = []; CAN_EDIT = false; dirty = false; page = 'camps'; return renderShell(); }
    $('#root').innerHTML = authCard(`<h1>אין קמפיינים משויכים</h1><p class="muted">המשתמש שלך עדיין לא שויך לאף קמפיין. פנו למנהל הפלטפורמה.</p><button class="btn" data-logout>יציאה</button>`);
    return;
  }
  try { localStorage.setItem('yz_admin_camp', CAMP_ID); } catch (e) {}
  const res = await call('data?c=' + encodeURIComponent(CAMP_ID));
  if (!res.ok) return toast('טעינת הנתונים נכשלה', true);
  SAVED = normalize(res.config);
  draft = clone(SAVED);
  DON = res.donations || [];
  CAN_EDIT = !!res.canEdit;
  dirty = false;
  if (PAGES[page]?.adminOnly && !isAdmin()) page = 'dashboard';
  renderShell();
}
function normalizePlat(p) {
  p.categories = p.categories || []; p.contact = p.contact || {}; p.a11y = p.a11y || {};
  p.operator = p.operator || { he: '', en: '' }; p.settings = p.settings || {};
  return p;
}
async function switchCampaign(id) {
  if (id === CAMP_ID) return;
  if (dirty && !confirm('יש שינויים שלא נשמרו בקמפיין הנוכחי. לעבור בכל זאת? השינויים יאבדו.')) { renderShell(); return; }
  dirty = false;
  if (isPlatPage()) page = 'dashboard';
  await loadData(id);
}
function normalize(c) {
  for (const k of ['teams', 'matchers', 'stretch', 'impact', 'dedications', 'milestones', 'faq', 'gallery']) c[k] = c[k] || [];
  c.raffle = c.raffle || { enabled: false, ticketPrice: 360, prizes: [] };
  c.raffle.prizes = c.raffle.prizes || []; c.raffle.winners = c.raffle.winners || [];
  c.settings = c.settings || { approveTeams: true };
  c.contact = c.contact || {};
  c.story = c.story || { he: [], en: [] };
  c.cover = c.cover || { emoji: '✨', colors: ['#1e3a8a', '#3b82f6'] }; c.cover.colors = c.cover.colors || ['#1e3a8a', '#3b82f6'];
  c.short = c.short || { he: '', en: '' }; c.logo = c.logo || '';
  for (const t of c.teams) {
    if (typeof t.name !== 'object' || !t.name) t.name = { he: t.name || '', en: t.name || '' };
    if (typeof t.leader !== 'object' || !t.leader) t.leader = { he: t.leader || '', en: t.leader || '' };
    t.status = t.status || 'approved';
  }
  return c;
}

/* ===================== חישובים ===================== */
const paid = () => DON.filter(d => d.status === 'paid');
const raised = () => N(draft.baseRaised) + paid().reduce((s, d) => s + N(d.credited), 0);
const campStatus = c => c.startsAt && Date.now() < c.startsAt ? 'upcoming' : (!c.endsAt || Date.now() < c.endsAt) ? 'live' : 'ended';
const teamById = id => draft.teams.find(t => t.id === id);
const teamName = id => { const t = teamById(id); return t ? L(t.name) : (id ? '(צוות שנמחק)' : ''); };
const dedById = id => draft.dedications.find(d => d.id === id);
const teamOnline = id => paid().filter(d => d.teamId === id);
const amountLabel = d => `${d.cur === 'USD' ? '$' : '₪'}${num(d.amount)}${N(d.months) > 1 ? ` × ${d.months}` : ''}`;
const matchPool = () => draft.matchers.reduce((s, m) => s + N(m.amount), 0);
const matchedUsed = () => paid().reduce((s, d) => s + Math.max(0, N(d.credited) - N(d.baseIls)), 0);
const pendingTeams = () => draft.teams.filter(t => t.status === 'pending');

/* ===================== מבנה ===================== */
const PAGES = {
  dashboard: { title: 'לוח בקרה', ico: '📊' },
  donations: { title: 'תרומות', ico: '💳' },
  donors: { title: 'תורמים', ico: '👥' },
  dedications: { title: 'הקדשות', ico: '🕍' },
  teams: { title: 'שגרירים וצוותים', ico: '🏆' },
  campaign: { title: 'הקמפיין', ico: '🎯' },
  raffle: { title: 'הגרלה', ico: '🎟️' },
  content: { title: 'תוכן האתר', ico: '📝' },
  settings: { title: 'הגדרות הקמפיין', ico: '⚙️' },
  camps: { title: 'כל הקמפיינים', ico: '🗂️', platform: true, adminOnly: true },
  platform: { title: 'הגדרות הפלטפורמה', ico: '🌐', platform: true, adminOnly: true },
  users: { title: 'משתמשים והרשאות', ico: '🔑', platform: true, adminOnly: true }
};

function renderShell() {
  const camp = CAMPS.find(c => c.id === CAMP_ID);
  const pendingCamps = CAMPS.filter(c => c.status === 'pending').length;
  $('#root').innerHTML = `<div class="shell">
    <aside class="side">
      <div class="side-brand"><img src="favicon.svg" class="auth-logo" alt=""><div>${esc(L(PLAT?.name || PLATFORM.name))}<small>בק אופיס</small></div></div>
      ${CAMPS.length ? `<div class="camp-switch"><label for="camp-sel">הקמפיין שבניהול</label>
        <select id="camp-sel">${CAMPS.map(c => `<option value="${esc(c.id)}" ${c.id === CAMP_ID ? 'selected' : ''}>${esc((c.cover?.emoji || '') + ' ' + L(c.name))}${c.status !== 'live' ? ' (' + CAMP_ST[c.status] + ')' : ''}</option>`).join('')}</select>
        ${camp && camp.status !== 'live' ? `<span class="pill ${esc(camp.status)}">${esc(CAMP_ST[camp.status])}</span>` : ''}</div>` : ''}
      <nav id="nav"></nav>
      ${isAdmin() ? `<div class="nav-group">פלטפורמה${pendingCamps ? ` <span class="badge">${pendingCamps}</span>` : ''}</div><nav id="nav-plat"></nav>` : ''}
      <div class="side-foot">
        <div class="me"><span class="ico">👤</span><div>${esc(ME?.name || ME?.username || '')}<small>${esc(ROLES[ME?.role] || '')}</small></div></div>
        ${CAMP_ID ? `<a class="nav-item" href="${campPath()}" target="_blank" rel="noopener"><span class="ico">↗</span>דף הקמפיין באתר</a>` : ''}
        <a class="nav-item" href="/" target="_blank" rel="noopener"><span class="ico">↗</span>דף הבית של הפלטפורמה</a>
        <button class="nav-item" data-logout><span class="ico">⎋</span>יציאה</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar"><h1 id="page-title"></h1>
        <div class="top-actions">
          <span class="ro-pill" id="ro-pill" title="${esc(NO_PERM)}" hidden>👁 צפייה בלבד</span>
          <div class="savebar" id="savebar"><span>יש שינויים שלא נשמרו</span><button class="btn ghost sm" data-discard>ביטול</button><button class="btn gold sm" data-save>שמירה</button></div>
          <a class="btn ghost sm" id="view-link" href="${CAMP_ID ? campPath() : '/'}" target="_blank" rel="noopener" title="האתר ייפתח בלשונית חדשה">צפייה באתר ↗</a>
        </div>
      </div>
      <div class="content" id="content"></div>
    </div>
  </div>`;
  $('#camp-sel')?.addEventListener('change', e => switchCampaign(e.target.value));
  go(page);
}
function renderNav() {
  const btn = (k, p, badge = '') => `<button class="nav-item ${k === page ? 'active' : ''}" data-go="${k}"><span class="ico">${p.ico}</span>${p.title}${badge}</button>`;
  if (draft) {
    const pend = pendingTeams().length;
    const plaque = paid().filter(d => d.dedicationId && d.plaqueStatus !== 'done').length;
    $('#nav').innerHTML = Object.entries(PAGES).filter(([, p]) => !p.platform).map(([k, p]) => btn(k, p,
      k === 'teams' && pend ? `<span class="badge">${pend}</span>` : k === 'dedications' && plaque ? `<span class="badge">${plaque}</span>` : '')).join('');
  } else $('#nav').innerHTML = '';
  if ($('#nav-plat')) {
    const pc = CAMPS.filter(c => c.status === 'pending').length;
    $('#nav-plat').innerHTML = Object.entries(PAGES).filter(([, p]) => p.platform).map(([k, p]) => btn(k, p, k === 'camps' && pc ? `<span class="badge">${pc}</span>` : '')).join('');
  }
}
function go(p, keepScroll = false) {
  if (PAGES[p]?.adminOnly && !isAdmin()) p = 'dashboard';
  if (!isPlatPage(p) && !draft) p = 'camps';
  if (p !== page && dirty && isPlatPage(p) !== isPlatPage(page)) {
    if (!confirm('יש שינויים שלא נשמרו. לעבור למסך אחר? השינויים יאבדו.')) return;
    discardChanges();
  }
  page = p;
  const y = window.scrollY;
  renderNav();
  $('#page-title').textContent = PAGES[p].title + (isPlatPage(p) || !draft ? '' : ' · ' + L(draft.name));
  $('#ro-pill').hidden = !isViewer();
  $('#view-link').href = isPlatPage(p) || !CAMP_ID ? '/' : campPath();
  $('#content').innerHTML = (isViewer() ? `<div class="ro-banner">👁 בקמפיין הזה יש לך הרשאת <b>צפייה בלבד</b>. אפשר לצפות בכל הנתונים ולייצא אותם, אבל לא לשנות דבר.</div>` : '') + RENDER[p]();
  BIND[p] && BIND[p]();
  lockReadOnly($('#content'));
  window.scrollTo(0, keepScroll ? y : 0);
  updateSaveBar();
}
const rerender = () => go(page, true);
function markDirty() { dirty = true; updateSaveBar(); }
function updateSaveBar() { $('#savebar')?.classList.toggle('show', dirty); }
function discardChanges() { if (draft) draft = clone(SAVED); if (PLAT_SAVED) PLAT = clone(PLAT_SAVED); dirty = false; }
async function save() {
  if (page === 'platform') {
    const res = await call('platform', { platform: PLAT });
    if (!res.ok) { toast('השמירה נכשלה', true); return false; }
    PLAT_SAVED = clone(PLAT); dirty = false; updateSaveBar();
    toast('הגדרות הפלטפורמה נשמרו ✓');
    return true;
  }
  const res = await call('config', { campaignId: CAMP_ID, config: draft });
  if (!res.ok) { toast('השמירה נכשלה', true); return false; }
  SAVED = clone(draft); dirty = false; updateSaveBar(); renderNav();
  const s = CAMPS.find(c => c.id === CAMP_ID); if (s) { s.name = draft.name; s.cover = draft.cover; }
  toast('השינויים נשמרו ✓');
  return true;
}
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ===================== טפסים ===================== */
const tgt = () => page === 'platform' ? PLAT : draft;   // מה נערך במסך הנוכחי: הקמפיין או הגדרות הפלטפורמה
function getP(path) { return path.split('.').reduce((o, k) => o == null ? undefined : o[k], tgt()); }
function setP(path, v) {
  const ks = path.split('.'); let o = tgt();
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = v;
}
function F(path, label, o = {}) {
  const k = o.k || 'text'; const v = getP(path);
  const rr = o.rr ? ' data-rr="1"' : '';
  if (k === 'bool') return `<label class="chk"><input type="checkbox" data-p="${path}" data-k="bool"${rr} ${v ? 'checked' : ''}> ${label}</label>`;
  let input;
  if (k === 'area' || k === 'paras') {
    const val = k === 'paras' ? (v || []).join('\n\n') : (v ?? '');
    input = `<textarea data-p="${path}" data-k="${k}" rows="${o.rows || 3}" ${o.dir ? `dir="${o.dir}"` : ''} placeholder="${esc(o.ph || '')}">${esc(val)}</textarea>`;
  } else if (k === 'select') {
    input = `<select data-p="${path}" data-k="${o.num ? 'num' : 'text'}"${rr}>${Object.entries(o.opts).map(([a, b]) => `<option value="${esc(a)}" ${String(v ?? '') === a ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  } else if (k === 'date') {
    input = `<input type="datetime-local" data-p="${path}" data-k="date"${rr} value="${toLocalInput(v)}">`;
  } else {
    input = `<input type="${k === 'num' ? 'number' : 'text'}" data-p="${path}" data-k="${k}"${rr} value="${esc(v ?? '')}" placeholder="${esc(o.ph || '')}" ${o.dir ? `dir="${o.dir}"` : ''} ${k === 'num' ? 'min="0"' : ''}>`;
  }
  return `<div class="fld ${o.cls || ''}"><label>${label}${o.hint ? ` <span class="hint">${o.hint}</span>` : ''}</label>${input}</div>`;
}
const BI = (path, label, o = {}) => `<div class="bi">${F(path + '.he', label + ' – עברית', o)}${F(path + '.en', label + ' – English', { ...o, dir: 'ltr' })}</div>`;

const NEW_ITEM = {
  matchers: () => ({ name: { he: '', en: '' }, amount: 0 }),
  stretch: () => ({ amount: 0, he: '', en: '' }),
  impact: () => ({ amount: 0, icon: '🧱', he: '', en: '' }),
  dedications: () => ({ id: 'ded' + Date.now().toString(36), icon: '✨', amount: 0, total: 1, taken: 0, he: '', en: '', descHe: '', descEn: '' }),
  milestones: () => ({ he: '', en: '', date: { he: '', en: '' }, status: 'todo' }),
  faq: () => ({ q: { he: '', en: '' }, a: { he: '', en: '' } }),
  gallery: () => ({ src: '', emoji: '🕍', colors: ['#1e3a8a', '#3b82f6'], he: '', en: '' }),
  teams: () => ({ id: 'm' + Date.now().toString(36), name: { he: '', en: '' }, leader: { he: '', en: '' }, goal: 10000, raised: 0, donors: 0, status: 'approved' }),
  'raffle.prizes': () => ({ icon: '🎁', he: '', en: '' }),
  categories: () => ({ id: 'cat' + Date.now().toString(36), icon: '✨', he: '', en: '' })
};
function LIST(path, rowFn, addLabel = 'הוספה') {
  const arr = getP(path) || [];
  return `<div class="list">
    ${arr.map((item, i) => `<div class="list-row"><div class="row-fields">${rowFn(`${path}.${i}`, item, i)}</div>
      <div class="row-ctl"><button type="button" data-lu="${path}:${i}" title="הזזה למעלה" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button type="button" data-ldn="${path}:${i}" title="הזזה למטה" ${i === arr.length - 1 ? 'disabled' : ''}>↓</button>
      <button type="button" class="del" data-ld="${path}:${i}" title="מחיקה">✕</button></div></div>`).join('') || '<div class="empty-row">אין פריטים עדיין</div>'}
    <div><button type="button" class="btn ghost sm" data-la="${path}">+ ${addLabel}</button></div></div>`;
}
const toEmbed = u => { u = (u || '').trim(); const m = u.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] : u; };

document.addEventListener('input', e => {
  const el = e.target.closest('[data-p]');
  if (!el || !tgt() || isViewer()) return;
  let v;
  switch (el.dataset.k) {
    case 'num': v = el.value === '' ? 0 : Number(el.value); break;
    case 'bool': v = el.checked; break;
    case 'date': v = fromLocalInput(el.value); break;
    case 'paras': v = el.value.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean); break;
    case 'yt': v = toEmbed(el.value); break;
    default: v = el.value;
  }
  setP(el.dataset.p, v);
  markDirty();
});
document.addEventListener('change', e => { if (e.target.closest('[data-rr]')) rerender(); });

/* ===================== קליקים ===================== */
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-go],[data-save],[data-discard],[data-logout],[data-la],[data-ld],[data-lu],[data-ldn],[data-act]');
  if (!el) return;
  if (isViewer() && (el.dataset.la || el.dataset.ld || el.dataset.lu || el.dataset.ldn || el.matches('[data-save]') || RO_ACTS.includes(el.dataset.act))) return toast(NO_PERM, true);
  if (el.dataset.go) return go(el.dataset.go);
  if (el.matches('[data-save]')) return save();
  if (el.matches('[data-discard]')) { if (confirm('לבטל את כל השינויים שלא נשמרו?')) { discardChanges(); rerender(); } return; }
  if (el.matches('[data-logout]')) {
    if (dirty && !confirm('יש שינויים שלא נשמרו. לצאת בכל זאת?')) return;
    await call('logout', {}); dirty = false; return showLogin();
  }
  if (el.dataset.la) { const p = el.dataset.la; const arr = getP(p) || []; arr.push(NEW_ITEM[p] ? NEW_ITEM[p]() : {}); setP(p, arr); markDirty(); return rerender(); }
  if (el.dataset.ld || el.dataset.lu || el.dataset.ldn) {
    const [p, i] = (el.dataset.ld || el.dataset.lu || el.dataset.ldn).split(':'); const arr = getP(p); const idx = Number(i);
    if (el.dataset.ld) { if (!confirm('למחוק את הפריט?')) return; arr.splice(idx, 1); }
    else { const j = el.dataset.lu ? idx - 1 : idx + 1; [arr[idx], arr[j]] = [arr[j], arr[idx]]; }
    markDirty(); return rerender();
  }
  const fn = ACTIONS[el.dataset.act];
  if (fn) fn(el, e);
});

/* ===================== לוח בקרה ===================== */
function chartSVG(days = 14) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const t0 = start.getTime() - (days - 1) * DAY;
  const sums = Array(days).fill(0), counts = Array(days).fill(0);
  for (const d of paid()) { const i = Math.floor((d.date - t0) / DAY); if (i >= 0 && i < days) { sums[i] += N(d.credited); counts[i]++; } }
  const max = Math.max(...sums, 1), W = 720, H = 220, pb = 28, pt = 18, bw = W / days;
  const bars = sums.map((s, i) => {
    const h = (s / max) * (H - pb - pt), x = i * bw + bw * 0.18, y = H - pb - h;
    return `<g><rect x="${x}" y="${y}" width="${bw * 0.64}" height="${Math.max(h, s ? 2 : 0)}" rx="4" fill="${i === days - 1 ? '#c8a24a' : '#1e3a8a'}"><title>${fmtDay(t0 + i * DAY)}: ${ils(s)} (${counts[i]} תרומות)</title></rect>
      <text x="${x + bw * 0.32}" y="${H - 9}" font-size="11" text-anchor="middle" fill="#6b7280">${fmtDay(t0 + i * DAY)}</text>
      ${s ? `<text x="${x + bw * 0.32}" y="${y - 4}" font-size="10" text-anchor="middle" fill="#1c2434">${s >= 1000 ? Math.round(s / 1000) + 'K' : Math.round(s)}</text>` : ''}</g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" dir="ltr" role="img" aria-label="תרומות לפי יום">${bars}<line x1="0" x2="${W}" y1="${H - pb}" y2="${H - pb}" stroke="#e3e6ed"/></svg>`;
}
function dashboard() {
  const r = raised(), g = N(draft.goal), p = paid();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayList = p.filter(d => d.date >= today.getTime());
  const recurring = p.filter(d => N(d.months) > 1);
  const st = campStatus(draft);
  const stTxt = { upcoming: '⏳ טרם התחיל', live: '🔴 פעיל עכשיו', ended: '🏁 הסתיים' }[st];
  const pend = pendingTeams().length;
  const plaque = p.filter(d => d.dedicationId && d.plaqueStatus !== 'done').length;
  const receipts = p.filter(d => d.wantsReceipt && !d.receiptSent && d.email).length;
  const demo = DON.filter(d => d.demo).length;
  const teams = [...draft.teams].filter(t => t.status === 'approved').map(t => ({ t, sum: N(t.raised) + teamOnline(t.id).reduce((s, d) => s + N(d.credited), 0) })).sort((a, b) => b.sum - a.sum).slice(0, 5);
  return `
  <div class="kpis">
    <div class="kpi"><div class="lbl">סה"כ גויס (כולל הכפלה)</div><div class="val">${ils(r)}</div>
      <div class="progress"><div style="width:${Math.min(100, g ? r / g * 100 : 0)}%"></div></div><div class="sub">${g ? Math.round(r / g * 100) : 0}% מיעד של ${ils(g)}</div></div>
    <div class="kpi click" data-go="donations"><div class="lbl">תרומות שהתקבלו</div><div class="val">${num(p.length)}</div><div class="sub">+ ${num(draft.baseDonors)} תורמים מחוץ לאתר</div></div>
    <div class="kpi"><div class="lbl">היום</div><div class="val">${ils(todayList.reduce((s, d) => s + N(d.baseIls), 0))}</div><div class="sub">${todayList.length} תרומות היום</div></div>
    <div class="kpi"><div class="lbl">תרומה ממוצעת</div><div class="val">${ils(p.length ? p.reduce((s, d) => s + N(d.baseIls), 0) / p.length : 0)}</div><div class="sub">לפני הכפלה</div></div>
    <div class="kpi"><div class="lbl">הוראות קבע</div><div class="val">${recurring.length}</div><div class="sub">${ils(recurring.reduce((s, d) => s + N(d.baseIls) / N(d.months), 0))} בחודש</div></div>
    <div class="kpi"><div class="lbl">קרן ההכפלה שנוצלה</div><div class="val">${ils(matchedUsed())}</div><div class="sub">מתוך ${ils(matchPool())} שהתחייבו</div></div>
    <div class="kpi click" data-go="dedications"><div class="lbl">הקדשות</div><div class="val">${p.filter(d => d.dedicationId).length}</div><div class="sub">${plaque} ממתינות לטיפול</div></div>
    <div class="kpi"><div class="lbl">סטטוס הקמפיין</div><div class="val" style="font-size:20px">${stTxt}</div><div class="sub">${draft.startsAt ? fmtDate(draft.startsAt) : 'לא נקבע מועד'} – ${draft.endsAt ? fmtDate(draft.endsAt) : 'ללא סיום'}</div></div>
  </div>
  ${pend || plaque || receipts || demo ? `<div class="card"><h2>לטיפולך</h2>
    ${pend ? `<button class="alert" data-go="teams">🏆 <span><b>${pend}</b> דפי שגרירים ממתינים לאישור</span></button>` : ''}
    ${plaque ? `<button class="alert" data-go="dedications">🕍 <span><b>${plaque}</b> הקדשות ממתינות לתיאום נוסח השלט</span></button>` : ''}
    ${receipts ? `<button class="alert" data-act="filter-receipts">🧾 <span><b>${receipts}</b> תורמים ביקשו קבלה ועוד לא סומן שנשלחה</span></button>` : ''}
    ${demo ? `<button class="alert" data-go="settings">🧪 <span>במערכת יש <b>${demo}</b> תרומות לדוגמה – מחקו אותן לפני העלייה לאוויר</span></button>` : ''}
  </div>` : ''}
  <div class="grid2">
    <div class="card"><h2>תרומות ב-14 הימים האחרונים</h2>${chartSVG()}</div>
    <div class="card"><h2>הצוותים המובילים</h2>
      ${teams.length ? teams.map(({ t, sum }) => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><b>${esc(L(t.name))}</b><span class="num">${ils(sum)}</span></div>
        <div class="progress"><div style="width:${Math.min(100, N(t.goal) ? sum / N(t.goal) * 100 : 0)}%"></div></div></div>`).join('') : '<p class="muted">אין צוותים עדיין</p>'}
    </div>
  </div>
  <div class="card"><div class="card-head"><h2>תרומות אחרונות</h2><button class="btn ghost sm" data-go="donations">לכל התרומות</button></div>
    ${donationsTable([...DON].sort((a, b) => b.date - a.date).slice(0, 8), true)}</div>`;
}

/* ===================== תרומות ===================== */
function filteredDonations() {
  const f = ui.don, q = f.q.trim().toLowerCase();
  const from = f.from ? new Date(f.from).getTime() : 0, to = f.to ? new Date(f.to).getTime() + DAY : Infinity;
  return DON.filter(d =>
    (!q || [d.name, d.email, d.phone, d.idNumber, d.message, d.dedication, d.notes].join(' ').toLowerCase().includes(q)) &&
    (!f.status || d.status === f.status) && (!f.source || d.source === f.source) &&
    (!f.team || d.teamId === f.team) &&
    (!f.type || (f.type === 'recurring' ? N(d.months) > 1 : f.type === 'one' ? N(d.months) <= 1 : f.type === 'ded' ? !!d.dedicationId : f.type === 'receipt' ? d.wantsReceipt && !d.receiptSent : f.type === 'usd' ? d.cur === 'USD' : f.type === 'demo' ? d.demo : true)) &&
    d.date >= from && d.date < to
  ).sort((a, b) => b.date - a.date);
}
function donationsTable(list, compact = false) {
  if (!list.length) return '<p class="muted">אין תרומות להצגה</p>';
  return `<div class="tbl-wrap"><table><thead><tr><th>תאריך</th><th>שם</th>${compact ? '' : '<th>טלפון / אימייל</th>'}<th>סכום</th><th>נספר לקמפיין</th><th>צוות</th>${compact ? '' : '<th>הקדשה</th><th>אמצעי</th>'}<th>סטטוס</th>${compact ? '' : '<th>קבלה</th>'}</tr></thead><tbody>
    ${list.map(d => `<tr class="click" data-act="edit-donation" data-id="${esc(d.id)}">
      <td class="num">${fmtDate(d.date)}</td>
      <td><b>${esc(d.name)}</b>${d.anon ? ' <span class="pill">אנונימי</span>' : ''}${d.demo ? ' <span class="pill demo">דוגמה</span>' : ''}</td>
      ${compact ? '' : `<td class="small"><span class="ltr">${esc(d.phone || '')}</span>${d.phone && d.email ? '<br>' : ''}<span class="ltr">${esc(d.email || '')}</span></td>`}
      <td class="num">${amountLabel(d)}</td>
      <td class="num"><b>${ils(d.credited)}</b></td>
      <td class="small">${esc(teamName(d.teamId))}</td>
      ${compact ? '' : `<td class="small">${d.dedicationId ? esc((dedById(d.dedicationId)?.icon || '') + ' ' + L(dedById(d.dedicationId)) ) : ''}${d.dedication ? `<div class="muted">${esc(d.dedication)}</div>` : ''}</td>
      <td class="small">${esc(METHODS[d.method] || d.method || '')}${d.source === 'manual' ? ' · ידני' : ''}</td>`}
      <td><span class="pill ${esc(d.status)}">${esc(STATUSES[d.status] || d.status)}</span></td>
      ${compact ? '' : `<td class="small">${d.receiptSent ? '✅ נשלחה' : d.wantsReceipt ? '⏳ ביקש/ה' : '—'}${d.receiptNo ? ` <span class="muted">#${d.receiptNo}</span>` : ''}</td>`}
    </tr>`).join('')}</tbody></table></div>`;
}
function donationsPage() {
  const f = ui.don;
  const opt = (obj, v, all) => `<option value="">${all}</option>` + Object.entries(obj).map(([a, b]) => `<option value="${esc(a)}" ${v === a ? 'selected' : ''}>${esc(b)}</option>`).join('');
  return `
  <div class="toolbar">
    <input class="search" id="f-q" type="search" placeholder="🔍 חיפוש לפי שם, טלפון, אימייל, הקדשה..." value="${esc(f.q)}">
    <select id="f-status">${opt(STATUSES, f.status, 'כל הסטטוסים')}</select>
    <select id="f-source">${opt(SOURCES, f.source, 'כל המקורות')}</select>
    <select id="f-team">${opt(Object.fromEntries(draft.teams.map(t => [t.id, L(t.name)])), f.team, 'כל הצוותים')}</select>
    <select id="f-type">${opt({ one: 'חד-פעמי', recurring: 'הוראת קבע', ded: 'עם הקדשה', receipt: 'ביקשו קבלה – לא נשלחה', usd: 'בדולרים', demo: 'נתוני דוגמה' }, f.type, 'כל הסוגים')}</select>
    <label class="small">מ-<input type="date" id="f-from" value="${esc(f.from)}"></label>
    <label class="small">עד<input type="date" id="f-to" value="${esc(f.to)}"></label>
  </div>
  <div class="toolbar"><button class="btn gold" data-act="new-donation">+ הוספת תרומה ידנית</button>
    <span class="muted small">מזומן, צ'ק, העברה בנקאית או תרומה טלפונית</span><span class="spacer"></span>
    <button class="btn ghost" data-act="export-donations">⬇ ייצוא לאקסל (CSV)</button></div>
  <div id="don-results"></div>`;
}
function renderDonationResults() {
  const list = filteredDonations(), f = ui.don, per = 50;
  const pages = Math.max(1, Math.ceil(list.length / per));
  f.pageNo = Math.min(f.pageNo, pages - 1);
  const p = list.filter(d => d.status === 'paid');
  $('#don-results').innerHTML = `
    <div class="summary"><span><b>${list.length}</b> תרומות</span><span>שולם: <b>${ils(p.reduce((s, d) => s + N(d.baseIls), 0))}</b></span><span>לקמפיין (כולל הכפלה): <b>${ils(p.reduce((s, d) => s + N(d.credited), 0))}</b></span></div>
    ${donationsTable(list.slice(f.pageNo * per, f.pageNo * per + per))}
    ${pages > 1 ? `<div class="pager"><button class="btn ghost sm" data-act="page" data-d="-1" ${f.pageNo === 0 ? 'disabled' : ''}>הקודם</button><span>עמוד ${f.pageNo + 1} מתוך ${pages}</span><button class="btn ghost sm" data-act="page" data-d="1" ${f.pageNo >= pages - 1 ? 'disabled' : ''}>הבא</button></div>` : ''}`;
}
function bindDonations() {
  const map = { 'f-q': 'q', 'f-status': 'status', 'f-source': 'source', 'f-team': 'team', 'f-type': 'type', 'f-from': 'from', 'f-to': 'to' };
  for (const [id, key] of Object.entries(map)) $('#' + id).addEventListener('input', e => { ui.don[key] = e.target.value; ui.don.pageNo = 0; renderDonationResults(); });
  renderDonationResults();
}

function openDonation(id) {
  const isNew = !id;
  const mult = N(draft.multiplier) || 1;
  const ed = isNew ? { campaignId: CAMP_ID, name: '', email: '', phone: '', amount: '', cur: 'ILS', months: 1, baseIls: 0, credited: 0, date: Date.now(), status: 'paid', source: 'manual', method: 'cash', teamId: '', dedicationId: '', dedication: '', plaqueStatus: '', plaqueText: '', message: '', hideMessage: false, anon: false, wantsReceipt: true, receiptSent: false, notes: '', demo: false }
    : clone(DON.find(d => d.id === id));
  if (!ed) return;
  let matched = isNew ? (mult > 1 && campStatus(draft) === 'live') : N(ed.credited) > N(ed.baseIls) + 0.5;
  const sel = (key, obj, extra = '') => `<select data-e="${key}" ${extra}>${Object.entries(obj).map(([a, b]) => `<option value="${esc(a)}" ${String(ed[key] ?? '') === a ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  const inp = (key, type = 'text', extra = '') => `<input type="${type}" data-e="${key}" value="${esc(ed[key] ?? '')}" ${extra}>`;
  modal(`<form id="don-form" novalidate>
    <h2>${isNew ? 'הוספת תרומה ידנית' : isViewer() ? 'פרטי תרומה' : 'עריכת תרומה'} ${ed.demo ? '<span class="pill demo">דוגמה</span>' : ''}</h2>
    ${isNew ? '' : `<p class="muted small">מזהה: ${esc(ed.id)} · מקור: ${esc(SOURCES[ed.source] || ed.source)} · נוצרה ${fmtDate(ed.createdAt)}</p>`}
    <div class="cols3">
      <div class="fld"><label>שם התורם *</label>${inp('name')}</div>
      <div class="fld"><label>טלפון</label>${inp('phone', 'tel', 'dir="ltr"')}</div>
      <div class="fld"><label>אימייל</label>${inp('email', 'email', 'dir="ltr"')}</div>
    </div>
    ${draft.section46 || ed.idNumber ? `<div class="cols3"><div class="fld"><label>מספר תעודת זהות <span class="muted small">(לקבלה לפי סעיף 46)</span></label>${inp('idNumber', 'text', 'dir="ltr" inputmode="numeric" maxlength="11"')}</div></div>` : ''}
    <div class="cols4">
      <div class="fld"><label>סכום (לתשלום) *</label>${inp('amount', 'number', 'min="0"')}</div>
      <div class="fld"><label>מטבע</label>${sel('cur', { ILS: '₪ שקל', USD: '$ דולר' })}</div>
      <div class="fld"><label>מספר תשלומים</label>${sel('months', { 1: 'חד-פעמי', 12: '12 חודשים', 24: '24 חודשים', 36: '36 חודשים' })}</div>
      <div class="fld"><label>תאריך</label><input type="datetime-local" data-e="date" value="${toLocalInput(ed.date)}"></div>
    </div>
    <div class="calc"><span>סה"כ בש"ח: <b id="e-base">${ils(ed.baseIls)}</b></span>
      <label class="chk" style="margin:0"><input type="checkbox" id="e-matched" ${matched ? 'checked' : ''} ${mult > 1 ? '' : 'disabled'}> להכפיל ×${mult}</label>
      <span>נספר לקמפיין: <input type="number" data-e="credited" id="e-credited" value="${Math.round(N(ed.credited))}" style="width:120px" class="inline-in"> ₪</span></div>
    <div class="cols3">
      <div class="fld"><label>סטטוס</label>${sel('status', STATUSES)}</div>
      <div class="fld"><label>אמצעי תשלום</label>${sel('method', METHODS)}</div>
      <div class="fld"><label>לזכות צוות</label>${sel('teamId', { '': 'ללא', ...Object.fromEntries(draft.teams.map(t => [t.id, L(t.name)])) })}</div>
    </div>
    <div class="cols3">
      <div class="fld"><label>פריט הקדשה</label>${sel('dedicationId', { '': 'ללא', ...Object.fromEntries(draft.dedications.map(d => [d.id, `${d.icon} ${L(d)} (${ils(d.amount)})`])) })}</div>
      <div class="fld"><label>סטטוס שלט</label>${sel('plaqueStatus', { '': '—', ...PLAQUE })}</div>
      <div class="fld"><label>הקדשה (לעילוי נשמת / לכבוד...)</label>${inp('dedication')}</div>
    </div>
    <div class="fld"><label>נוסח השלט המאושר</label>${inp('plaqueText')}</div>
    <div class="fld"><label>ברכה שהתורם כתב</label>${inp('message')}</div>
    <div class="cols2">
      <div>
        <label class="chk"><input type="checkbox" data-e="anon" ${ed.anon ? 'checked' : ''}> להציג כאנונימי באתר</label>
        <label class="chk"><input type="checkbox" data-e="hideMessage" ${ed.hideMessage ? 'checked' : ''}> להסתיר את הברכה מהאתר</label>
      </div>
      <div>
        <label class="chk"><input type="checkbox" data-e="wantsReceipt" ${ed.wantsReceipt ? 'checked' : ''}> ביקש/ה קבלה</label>
        <label class="chk"><input type="checkbox" data-e="receiptSent" ${ed.receiptSent ? 'checked' : ''}> הקבלה נשלחה</label>
      </div>
    </div>
    <div class="fld"><label>הערות פנימיות <span class="hint">(לא מוצגות באתר)</span></label><textarea data-e="notes" rows="2">${esc(ed.notes || '')}</textarea></div>
    <div class="err" id="e-err"></div>
    <div class="modal-foot">
      <div class="grp"><button class="btn gold" type="submit">שמירה</button><button class="btn ghost" type="button" data-act="close-modal">סגירה</button></div>
      <div class="grp">${isNew ? '' : `<button class="btn ghost" type="button" id="e-print">🧾 הפקת אישור תרומה</button><button class="btn danger" type="button" id="e-del">מחיקה</button>`}</div>
    </div></form>`);

  const recalc = () => {
    const rate = ed.cur === 'USD' ? (N(draft.usdRate) || 1) : 1;
    ed.baseIls = Math.round(N(ed.amount) * (N(ed.months) || 1) * rate * 100) / 100;
    ed.credited = matched ? ed.baseIls * mult : ed.baseIls;
    $('#e-base').textContent = ils(ed.baseIls);
    $('#e-credited').value = Math.round(ed.credited);
  };
  $('#don-form').addEventListener('input', e => {
    const el = e.target.closest('[data-e]'); if (!el) return;
    const k = el.dataset.e;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (['amount', 'months', 'credited'].includes(k)) v = N(v);
    if (k === 'date') v = fromLocalInput(v) || Date.now();
    ed[k] = v;
    if (k === 'dedicationId' && v && !ed.plaqueStatus) { ed.plaqueStatus = 'new'; $('[data-e=plaqueStatus]').value = 'new'; }
    if (['amount', 'months', 'cur'].includes(k)) recalc();
  });
  $('#e-matched').addEventListener('change', e => { matched = e.target.checked; recalc(); });
  $('#don-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!ed.name.trim()) return $('#e-err').textContent = 'נא למלא שם';
    if (!(N(ed.amount) > 0)) return $('#e-err').textContent = 'נא למלא סכום';
    if (ed.idNumber && String(ed.idNumber).trim()) {
      const id9 = cleanIsraeliId(ed.idNumber);
      if (!id9) return $('#e-err').textContent = 'מספר תעודת הזהות לא תקין (ספרת הביקורת לא מתאימה)';
      ed.idNumber = id9;
    } else ed.idNumber = '';
    const res = isNew ? await call('donations', { donation: ed }) : await call('donations/' + encodeURIComponent(id), { donation: ed }, 'PUT');
    if (!res.ok) return $('#e-err').textContent = 'השמירה נכשלה';
    if (isNew) DON.push(res.donation); else DON[DON.findIndex(d => d.id === id)] = res.donation;
    closeModal(); rerender(); toast(isNew ? 'התרומה נוספה ✓' : 'התרומה עודכנה ✓');
  });
  $('#e-del')?.addEventListener('click', async () => {
    if (!confirm(`למחוק לצמיתות את התרומה של ${ed.name} (${amountLabel(ed)})?\nאי אפשר לבטל את הפעולה. כדי לשמור תיעוד, אפשר במקום זה לשנות סטטוס ל"בוטל".`)) return;
    const res = await call('donations/' + encodeURIComponent(id), null, 'DELETE');
    if (!res.ok) return toast('המחיקה נכשלה', true);
    DON = DON.filter(d => d.id !== id); closeModal(); rerender(); toast('התרומה נמחקה');
  });
  $('#e-print')?.addEventListener('click', () => printReceipt(id));
}

async function printReceipt(id) {
  const w = window.open('', '_blank');
  if (!w) return toast('הדפדפן חסם חלון קופץ – אפשרו חלונות קופצים לאתר', true);
  let d = DON.find(x => x.id === id);
  if (!d.receiptNo) {
    const next = Math.max(1000, ...DON.map(x => N(x.receiptNo))) + 1;
    const res = await call('donations/' + encodeURIComponent(id), { donation: { receiptNo: next } }, 'PUT');
    if (res.ok) { DON[DON.findIndex(x => x.id === id)] = res.donation; d = res.donation; }
  }
  const ded = dedById(d.dedicationId);
  w.document.write(`<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>אישור תרומה ${d.receiptNo || ''}</title>
  <style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#1c2434}h1{font-size:22px;margin:0}
  .head{display:flex;justify-content:space-between;border-bottom:3px solid #c8a24a;padding-bottom:12px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px;border-bottom:1px solid #e3e6ed}td:first-child{color:#6b7280;width:40%}
  .note{font-size:13px;color:#6b7280;margin-top:24px}.sign{margin-top:48px;display:flex;justify-content:space-between}@media print{button{display:none}}</style></head><body>
  <div class="head"><div><h1>${esc(L(SAVED.orgName))}</h1><div>ע"ר ${esc(SAVED.orgNumber || '')}</div><div>${esc(L(SAVED.contact?.address))} · ${esc(SAVED.contact?.phone || '')}</div></div>
  <div style="text-align:left"><b>אישור תרומה מס' ${d.receiptNo || '—'}</b><div>${fmtDate(Date.now()).slice(0, 10)}</div></div></div>
  <p>אנו מאשרים בתודה את קבלת תרומתך עבור "${esc(L(SAVED.name))}":</p>
  <table><tr><td>שם התורם</td><td><b>${esc(d.name)}</b></td></tr>
  ${d.idNumber ? `<tr><td>מספר תעודת זהות</td><td>${esc(d.idNumber)}</td></tr>` : ''}
  <tr><td>תאריך התרומה</td><td>${fmtDate(d.date)}</td></tr>
  <tr><td>סכום</td><td><b>${d.cur === 'USD' ? '$' : '₪'}${num(d.amount)}${N(d.months) > 1 ? ` × ${d.months} תשלומים חודשיים` : ''}</b>${d.cur === 'USD' || N(d.months) > 1 ? ` (סה"כ ${ils(d.baseIls)})` : ''}</td></tr>
  <tr><td>אמצעי תשלום</td><td>${esc(METHODS[d.method] || '')}</td></tr>
  ${ded ? `<tr><td>הקדשה</td><td>${esc(L(ded))}${d.plaqueText ? ' – ' + esc(d.plaqueText) : ''}</td></tr>` : ''}
  ${d.dedication ? `<tr><td>מוקדש</td><td>${esc(d.dedication)}</td></tr>` : ''}</table>
  <p>תודה רבה על השותפות ועל התמיכה.</p>
  <div class="sign"><span>חתימה: ____________</span><span>חותמת העמותה</span></div>
  <p class="note">${SAVED.section46 ? 'העמותה מוכרת לעניין סעיף 46 לפקודת מס הכנסה.' : 'מסמך זה הוא אישור על קבלת תרומה בלבד, ואינו קבלה לצורכי זיכוי ממס לפי סעיף 46 – לעמותה טרם התקבל אישור כזה.'} קבלה רשמית מופקת ממערכת הנהלת החשבונות של העמותה.</p>
  <button onclick="print()">הדפסה / שמירה כ-PDF</button></body></html>`);
  w.document.close();
  rerender();
}

function downloadCSV(name, headers, rows) {
  const cell = c => { let s = String(c ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const text = '﻿' + [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  download(new Blob([text], { type: 'text/csv;charset=utf-8' }), name);
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
const today = () => toDateInput(Date.now());

/* ===================== תורמים ===================== */
function donorsList() {
  const map = new Map();
  for (const d of DON) {
    if (d.status !== 'paid') continue;
    const key = (d.email || '').toLowerCase().trim() || 'n:' + (d.name || '').trim();
    let p = map.get(key);
    if (!p) { p = { key, name: d.name, email: d.email, phone: d.phone, count: 0, total: 0, credited: 0, last: 0, recurring: false, demo: d.demo }; map.set(key, p); }
    p.count++; p.total += N(d.baseIls); p.credited += N(d.credited);
    if (d.date > p.last) { p.last = d.date; p.name = d.name || p.name; p.phone = d.phone || p.phone; }
    if (N(d.months) > 1) p.recurring = true;
  }
  return [...map.values()];
}
function donorsPage() {
  const f = ui.donors;
  return `<div class="toolbar"><input class="search" id="dn-q" type="search" placeholder="🔍 חיפוש תורם..." value="${esc(f.q)}">
    <select id="dn-sort"><option value="total" ${f.sort === 'total' ? 'selected' : ''}>לפי סכום</option><option value="last" ${f.sort === 'last' ? 'selected' : ''}>לפי תרומה אחרונה</option><option value="count" ${f.sort === 'count' ? 'selected' : ''}>לפי מספר תרומות</option></select>
    <span class="spacer"></span><button class="btn ghost" data-act="export-donors">⬇ ייצוא רשימת תורמים</button></div>
    <p class="muted small">תורמים מאוחדים לפי כתובת אימייל (או לפי שם כשאין אימייל). לחיצה על תורם מציגה את כל התרומות שלו.</p>
    <div id="dn-results"></div>`;
}
function renderDonors() {
  const f = ui.donors, q = f.q.trim().toLowerCase();
  const list = donorsList().filter(p => !q || [p.name, p.email, p.phone].join(' ').toLowerCase().includes(q))
    .sort((a, b) => f.sort === 'last' ? b.last - a.last : f.sort === 'count' ? b.count - a.count : b.total - a.total);
  $('#dn-results').innerHTML = `<div class="summary"><span><b>${list.length}</b> תורמים</span><span>סה"כ: <b>${ils(list.reduce((s, p) => s + p.total, 0))}</b></span></div>
    ${list.length ? `<div class="tbl-wrap"><table><thead><tr><th>שם</th><th>טלפון</th><th>אימייל</th><th>תרומות</th><th>סה"כ תרם</th><th>נספר לקמפיין</th><th>תרומה אחרונה</th></tr></thead><tbody>
    ${list.map(p => `<tr class="click" data-act="donor-filter" data-q="${esc(p.email || p.name)}"><td><b>${esc(p.name)}</b>${p.recurring ? ' <span class="pill active">הו"ק</span>' : ''}${p.demo ? ' <span class="pill demo">דוגמה</span>' : ''}</td>
      <td class="ltr">${esc(p.phone || '')}</td><td class="ltr">${esc(p.email || '')}</td><td>${p.count}</td><td class="num"><b>${ils(p.total)}</b></td><td class="num">${ils(p.credited)}</td><td class="num">${fmtDate(p.last)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">אין תורמים</p>'}`;
}
function bindDonors() {
  $('#dn-q').addEventListener('input', e => { ui.donors.q = e.target.value; renderDonors(); });
  $('#dn-sort').addEventListener('input', e => { ui.donors.sort = e.target.value; renderDonors(); });
  renderDonors();
}

/* ===================== הקדשות ===================== */
function dedicationsPage() {
  const got = paid().filter(d => d.dedicationId).sort((a, b) => b.date - a.date);
  return `
  <div class="card"><div class="card-head"><h2>פריטי הקדשה באתר</h2></div>
    <p class="muted small">"נתפסו מחוץ לאתר" = הקדשות שנמכרו לפני האתר או ישירות. הקדשות שנתרמו באתר נספרות אוטומטית.</p>
    ${LIST('dedications', (p, d) => {
      const online = got.filter(x => x.dedicationId === d.id).length;
      const left = N(d.total) - N(d.taken) - online;
      return `<div class="ded-head"><span class="ico">${esc(d.icon)}</span><b>${esc(d.he || 'פריט חדש')}</b>
        <span class="stat-line"><span>באתר: <b>${online}</b></span><span>נותרו: <b>${Math.max(0, left)}</b> מתוך ${N(d.total)}</span></span></div>
        <div class="cols4">${F(p + '.icon', 'אייקון')}${F(p + '.amount', 'מחיר (₪)', { k: 'num' })}${F(p + '.total', 'כמות כוללת', { k: 'num' })}${F(p + '.taken', 'נתפסו מחוץ לאתר', { k: 'num' })}</div>
        <div class="bi">${F(p + '.he', 'שם – עברית')}${F(p + '.en', 'שם – English', { dir: 'ltr' })}</div>
        <div class="bi">${F(p + '.descHe', 'תיאור – עברית')}${F(p + '.descEn', 'תיאור – English', { dir: 'ltr' })}</div>`;
    }, 'הוספת פריט הקדשה')}
  </div>
  <div class="card"><div class="card-head"><h2>הקדשות שהתקבלו (${got.length})</h2><button class="btn ghost sm" data-act="export-dedications">⬇ ייצוא</button></div>
    <p class="muted small">כאן מתאמים את נוסח השלט עם התורם. השינויים בטבלה נשמרים מיד.</p>
    ${got.length ? `<div class="tbl-wrap"><table><thead><tr><th>תאריך</th><th>פריט</th><th>תורם</th><th>טלפון</th><th>הקדשה שנכתבה</th><th>נוסח השלט</th><th>סטטוס</th></tr></thead><tbody>
      ${got.map(d => `<tr><td class="num">${fmtDate(d.date)}</td><td>${esc((dedById(d.dedicationId)?.icon || '') + ' ' + L(dedById(d.dedicationId)))}</td>
        <td><a href="#" data-act="edit-donation" data-id="${esc(d.id)}">${esc(d.name)}</a></td><td class="ltr">${esc(d.phone || d.email || '')}</td>
        <td class="wrap small">${esc(d.dedication || '')}</td>
        <td class="wrap"><input class="inline-in" data-dp="${esc(d.id)}:plaqueText" value="${esc(d.plaqueText || '')}" placeholder="הנוסח שיופיע על השלט"></td>
        <td><select class="inline-in" data-dp="${esc(d.id)}:plaqueStatus">${Object.entries(PLAQUE).map(([a, b]) => `<option value="${a}" ${(d.plaqueStatus || 'new') === a ? 'selected' : ''}>${b}</option>`).join('')}</select></td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">עדיין לא התקבלו הקדשות</p>'}
  </div>`;
}
function bindDedications() {
  $$('[data-dp]').forEach(el => el.addEventListener('change', async () => {
    const [id, field] = el.dataset.dp.split(':');
    const res = await call('donations/' + encodeURIComponent(id), { donation: { [field]: el.value } }, 'PUT');
    if (!res.ok) return toast('השמירה נכשלה', true);
    DON[DON.findIndex(d => d.id === id)] = res.donation; renderNav(); toast('נשמר ✓');
  }));
}

/* ===================== שגרירים ===================== */
function teamsPage() {
  const pend = draft.teams.map((t, i) => ({ t, i })).filter(x => x.t.status === 'pending');
  return `
  ${pend.length ? `<div class="card"><h2>ממתינים לאישור (${pend.length})</h2>
    ${pend.map(({ t, i }) => `<div class="team-pending"><div><b>${esc(L(t.name))}</b> · ${esc(L(t.leader))} · יעד ${ils(t.goal)}
      <div class="muted small">נשלח ${fmtDate(t.createdAt)}${t.email ? ' · ' + esc(t.email) : ''}</div></div>
      <div style="display:flex;gap:8px"><button class="btn green sm" data-act="team-status" data-i="${i}" data-st="approved">✓ אישור</button><button class="btn danger sm" data-act="team-status" data-i="${i}" data-st="hidden">דחייה</button></div></div>`).join('')}
  </div>` : ''}
  <div class="card">${F('settings.approveTeams', 'דפי שגרירים חדשים שנפתחים מהאתר דורשים את אישורכם לפני שהם מופיעים', { k: 'bool' })}</div>
  <div class="card"><div class="card-head"><h2>כל הצוותים (${draft.teams.length})</h2><button class="btn ghost sm" data-act="export-teams">⬇ ייצוא</button></div>
    ${LIST('teams', (p, t) => {
      const on = teamOnline(t.id), sum = N(t.raised) + on.reduce((s, d) => s + N(d.credited), 0);
      return `<div class="ded-head"><b>${esc(L(t.name) || 'צוות חדש')}</b><span class="pill ${esc(t.status)}">${esc(TEAM_ST[t.status] || t.status)}</span>${t.demo ? '<span class="pill demo">דוגמה</span>' : ''}
        <span class="stat-line"><span>גויס: <b>${ils(sum)}</b> מתוך ${ils(t.goal)}</span><span>באתר: <b>${on.length}</b> תרומות</span>
        <a href="${campPath('/team/' + encodeURIComponent(t.id))}" target="_blank" rel="noopener">לדף הצוות ↗</a></span></div>
        ${BI(p + '.name', 'שם הצוות')}${BI(p + '.leader', 'ראש הצוות')}
        <div class="cols4">${F(p + '.goal', 'יעד (₪)', { k: 'num' })}${F(p + '.raised', 'גויס מחוץ לאתר (₪)', { k: 'num' })}${F(p + '.donors', 'תורמים מחוץ לאתר', { k: 'num' })}${F(p + '.status', 'סטטוס', { k: 'select', opts: TEAM_ST, rr: 1 })}</div>`;
    }, 'הוספת צוות')}
  </div>`;
}

/* ===================== קמפיין ===================== */
function campaignPage() {
  const m = N(draft.multiplier), need = m > 1 ? N(draft.goal) * (m - 1) / m : 0, pool = matchPool();
  return `
  <div class="card"><h2>יעד ותאריכים</h2>
    <div class="cols3">${F('goal', 'יעד הגיוס (₪)', { k: 'num', rr: 1 })}${F('baseRaised', 'גויס מחוץ לאתר (₪)', { k: 'num', hint: 'צ\'קים, העברות, התחייבויות' })}${F('baseDonors', 'מספר תורמים מחוץ לאתר', { k: 'num' })}</div>
    <div class="cols3">${F('startsAt', 'תחילת הקמפיין', { k: 'date', rr: 1 })}${F('endsAt', 'סיום הקמפיין', { k: 'date', rr: 1 })}
      <div class="fld"><label>&nbsp;</label><button class="btn ghost" data-act="clear-dates">ניקוי תאריכים (קמפיין פתוח ללא שעון)</button></div></div>
    <div class="note">${draft.startsAt || draft.endsAt ? `השעון באתר יספור לאחור ${campStatus(draft) === 'upcoming' ? 'לתחילת הקמפיין' : 'לסיום הקמפיין'}. אחרי הסיום אפשר עדיין לתרום, אבל בלי הכפלה.` : 'לא נקבעו תאריכים: באתר לא יוצג שעון, וההכפלה (אם הוגדרה) פעילה עד שמגיעים ליעד.'}</div>
    <div class="cols3">${F('multiplier', 'הכפלת תרומות', { k: 'select', num: 1, opts: { 1: 'ללא הכפלה', 2: '×2 – כל תרומה מוכפלת', 3: '×3 – כל תרומה משולשת' }, rr: 1 })}${F('usdRate', 'שער דולר', { k: 'num' })}</div>
  </div>
  <div class="card"><h2>תצוגת ההתקדמות באתר</h2>
    <p class="muted small">איך יוצג הסכום שגויס בכרטיס שבראש האתר. הבחירה נכנסת לתוקף אחרי "שמירה".
      <a href="/?progress${campPath().slice(1)}" target="_blank" rel="noopener">תצוגה מקדימה באתר ↗</a></p>
    ${F('hideGoal', 'קמפיין בלי יעד גלוי: להציג רק את הסכום שנתרם ואת מספר התורמים, בלי יעד, אחוזים ויעדי בונוס', { k: 'bool', rr: 1 })}
    <div class="note">${draft.hideGoal ? 'היעד מוסתר באתר. הוא עדיין משמש בתוך המערכת כתקרה להכפלת התרומות, אז כדאי להשאיר בו סכום.' : 'כרגע היעד מוצג באתר בסגנון שנבחר למטה.'}</div>
    <div class="meter-grid">${PROGRESS_STYLES.map(s => `<button type="button" class="meter-opt ${progressStyleId(draft.progressStyle) === s.id ? 'sel' : ''}" data-act="pick-progress" data-id="${s.id}">
      <span class="mo-gfx">${meterGraphic(s.id, 62)}</span><span>${esc(s.he)}</span></button>`).join('')}</div>
  </div>
  <div class="card"><h2>תורמים מכפילים</h2>
    ${m > 1 ? `<div class="note ${pool >= need ? '' : 'warn'}">כדי להכפיל ×${m} עד היעד צריך התחייבויות של <b>${ils(need)}</b>. כרגע התחייבו <b>${ils(pool)}</b> ${pool >= need ? '✅' : '– חסרים ' + ils(need - pool)}. נוצל עד כה: <b>${ils(matchedUsed())}</b>.</div>` : '<div class="note">ההכפלה כבויה. אפשר להפעיל אותה למעלה.</div>'}
    ${LIST('matchers', p => `${BI(p + '.name', 'שם המכפיל')}<div class="cols3">${F(p + '.amount', 'סכום ההתחייבות (₪)', { k: 'num' })}</div>`, 'הוספת מכפיל')}
  </div>
  <div class="card"><h2>יעדי ביניים</h2><p class="muted small">מוצגים באתר בחלק "איפה אנחנו עומדים", ומסומנים על פס ההתקדמות.</p>
    ${LIST('stretch', p => `<div class="cols3">${F(p + '.amount', 'סכום (₪)', { k: 'num' })}${F(p + '.he', 'מה זה מאפשר – עברית')}${F(p + '.en', 'English', { dir: 'ltr' })}</div>`, 'הוספת יעד ביניים')}
  </div>
  <div class="card"><h2>"מה התרומה שלך בונה"</h2>
    ${LIST('impact', p => `<div class="cols4">${F(p + '.icon', 'אייקון')}${F(p + '.amount', 'סכום (₪)', { k: 'num' })}${F(p + '.he', 'עברית')}${F(p + '.en', 'English', { dir: 'ltr' })}</div>`, 'הוספה')}
  </div>`;
}

/* ===================== הגרלה ===================== */
function raffleParticipants() {
  const price = N(draft.raffle.ticketPrice); if (!price) return [];
  const map = new Map();
  for (const d of paid()) {
    const n = Math.floor(N(d.baseIls) / price); if (!n) continue;
    const key = (d.email || '').toLowerCase().trim() || 'n:' + d.name;
    const p = map.get(key) || { name: d.name, email: d.email, phone: d.phone, tickets: 0, demo: d.demo };
    p.tickets += n; map.set(key, p);
  }
  return [...map.values()].sort((a, b) => b.tickets - a.tickets);
}
function randInt(n) { const a = new Uint32Array(1), lim = Math.floor(0x100000000 / n) * n; let x; do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim); return x % n; }
function rafflePage() {
  const parts = raffleParticipants(), total = parts.reduce((s, p) => s + p.tickets, 0), w = draft.raffle.winners || [];
  return `
  <div class="card"><h2>הגדרות ההגרלה</h2>
    ${F('raffle.enabled', 'להציג את ההגרלה באתר', { k: 'bool' })}
    <div class="cols3">${F('raffle.ticketPrice', 'כל X ₪ בתרומה = כרטיס אחד', { k: 'num' })}</div>
    ${BI('raffle.drawDate', 'מועד ההגרלה (טקסט)')}
  </div>
  <div class="card"><h2>פרסים</h2>${LIST('raffle.prizes', p => `<div class="cols3">${F(p + '.icon', 'אייקון')}${F(p + '.he', 'פרס – עברית')}${F(p + '.en', 'English', { dir: 'ltr' })}</div>`, 'הוספת פרס')}</div>
  <div class="card"><div class="card-head"><h2>ביצוע ההגרלה</h2>
    <div style="display:flex;gap:8px">${w.length ? '<button class="btn ghost sm" data-act="raffle-reset">איפוס זוכים</button>' : ''}<button class="btn gold" data-act="raffle-draw" ${parts.length && draft.raffle.prizes.length ? '' : 'disabled'}>🎲 ${w.length ? 'הגרלה מחדש' : 'ביצוע הגרלה'}</button></div></div>
    <p class="muted small">ההגרלה משוקללת: לכל משתתף סיכוי לפי מספר הכרטיסים שלו. כל משתתף יכול לזכות בפרס אחד בלבד. הזוכים מוצגים באתר בשם פרטי ואות ראשונה של שם המשפחה.</p>
    ${w.length ? w.map((x, i) => `<div class="winner"><div class="place">${i + 1}</div><div><b>${esc(x.prizeName)}</b> – ${esc(x.name)} <span class="muted small">(${x.tickets} כרטיסים · ${esc(x.phone || x.email || '')})</span></div></div>`).join('') + `<p class="muted small">ההגרלה בוצעה ב-${fmtDate(w[0].at)}</p>` : ''}
  </div>
  <div class="card"><div class="card-head"><h2>משתתפים (${parts.length}) · ${num(total)} כרטיסים</h2><button class="btn ghost sm" data-act="export-raffle">⬇ ייצוא</button></div>
    ${parts.length ? `<div class="tbl-wrap"><table><thead><tr><th>שם</th><th>טלפון</th><th>אימייל</th><th>כרטיסים</th><th>סיכוי</th></tr></thead><tbody>
      ${parts.map(p => `<tr><td>${esc(p.name)}${p.demo ? ' <span class="pill demo">דוגמה</span>' : ''}</td><td class="ltr">${esc(p.phone || '')}</td><td class="ltr">${esc(p.email || '')}</td><td>${p.tickets}</td><td>${(p.tickets / total * 100).toFixed(1)}%</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">אין עדיין משתתפים</p>'}
  </div>`;
}

/* ===================== תוכן ===================== */
function contentPage() {
  return `
  <div class="card"><h2>פרטים כלליים</h2>
    ${BI('name', 'שם הקמפיין')}${BI('shortName', 'שם מקוצר (בראש העמוד)')}${BI('tagline', 'משפט פתיחה')}${BI('location', 'מיקום')}</div>
  <div class="card"><h2>לוגו וכרטיס הקמפיין</h2>
    <p class="muted small">הלוגו מוצג בראש דף הקמפיין, בחלון התרומה ובכרטיס הקמפיין בדף הבית של הפלטפורמה. בלי לוגו מוצג עיגול בצבעי הכרטיס עם האייקון.</p>
    <div class="gal-row">
      <div class="thumb logo-thumb" style="${draft.logo ? `background-image:url('${esc(draft.logo)}')` : `background:linear-gradient(135deg,${esc(draft.cover.colors[0])},${esc(draft.cover.colors[1])})`}">${draft.logo ? '' : esc(draft.cover.emoji)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><label class="btn ghost sm">🖼️ העלאת לוגו<input type="file" accept="image/*" hidden data-upload="logo" data-max="600"></label>
          ${draft.logo ? '<button type="button" class="btn ghost sm" data-act="rm-img" data-p="logo">הסרת הלוגו</button>' : ''}</div>
        <p class="muted small">מומלץ לוגו עגול או מרובע, ברקע לבן או שקוף.</p>
      </div></div>
    ${BI('short', 'תיאור קצר לכרטיס בדף הבית')}
    <div class="cols4">${F('category', 'תחום', { k: 'select', opts: Object.fromEntries((PLAT?.categories || PLATFORM.categories).map(c => [c.id, `${c.icon} ${L(c)}`])) })}
      ${F('cover.emoji', 'אייקון', { rr: 1 })}${F('cover.colors.0', 'צבע 1', { ph: '#1e3a8a', dir: 'ltr' })}${F('cover.colors.1', 'צבע 2', { ph: '#3b82f6', dir: 'ltr' })}</div>
  </div>
  <div class="card"><h2>הסיפור שלנו</h2><p class="muted small">שורה ריקה בין פסקאות יוצרת פסקה חדשה.</p>
    <div class="bi">${F('story.he', 'עברית', { k: 'paras', rows: 9 })}${F('story.en', 'English', { k: 'paras', rows: 9, dir: 'ltr' })}</div></div>
  <div class="card"><h2>סרטון</h2>
    <div class="fld"><label>קישור ליוטיוב <span class="hint">(אפשר להדביק קישור רגיל – הוא יומר אוטומטית)</span></label>
      <input type="text" dir="ltr" data-p="videoUrl" data-k="yt" value="${esc(draft.videoUrl || '')}" placeholder="https://www.youtube.com/watch?v=..."></div></div>
  <div class="card"><h2>גלריה</h2>
    ${LIST('gallery', (p, g, i) => `<div class="gal-row">
      <div class="thumb" style="${g.src ? `background-image:url('${esc(g.src)}')` : `background:linear-gradient(135deg,${esc(g.colors?.[0] || '#1e3a8a')},${esc(g.colors?.[1] || '#3b82f6')})`}">${g.src ? '' : esc(g.emoji)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px"><label class="btn ghost sm">📷 העלאת תמונה<input type="file" accept="image/*" hidden data-upload="${p}.src"></label>
          ${g.src ? `<button type="button" class="btn ghost sm" data-act="rm-img" data-p="${p}.src">הסרת תמונה</button>` : ''}</div>
        <div class="bi">${F(p + '.he', 'כיתוב – עברית')}${F(p + '.en', 'English', { dir: 'ltr' })}</div>
        ${g.src ? '' : `<div class="cols3">${F(p + '.emoji', 'אייקון (כשאין תמונה)')}${F(p + '.colors.0', 'צבע 1')}${F(p + '.colors.1', 'צבע 2')}</div>`}
      </div></div>`, 'הוספת תמונה')}</div>
  <div class="card"><h2>שלבי הפרויקט</h2>
    ${LIST('milestones', p => `<div class="bi">${F(p + '.he', 'שלב – עברית')}${F(p + '.en', 'English', { dir: 'ltr' })}</div>
      <div class="cols3">${F(p + '.date.he', 'תאריך / תקופה')}${F(p + '.date.en', 'Date (English)', { dir: 'ltr' })}${F(p + '.status', 'מצב', { k: 'select', opts: MS_ST })}</div>`, 'הוספת שלב')}</div>
  <div class="card"><h2>שאלות נפוצות</h2>
    ${LIST('faq', p => `<div class="bi">${F(p + '.q.he', 'שאלה – עברית')}${F(p + '.q.en', 'Question', { dir: 'ltr' })}</div>
      <div class="bi">${F(p + '.a.he', 'תשובה – עברית', { k: 'area' })}${F(p + '.a.en', 'Answer', { k: 'area', dir: 'ltr' })}</div>`, 'הוספת שאלה')}</div>
  <div class="card"><h2>יצירת קשר ותרומה בהעברה</h2>
    <div class="cols2">${F('contact.phone', 'טלפון', { dir: 'ltr' })}${F('contact.email', 'אימייל', { dir: 'ltr' })}</div>
    ${BI('contact.address', 'כתובת')}${BI('contact.bank', 'פרטי חשבון בנק', { k: 'area' })}</div>`;
}
function bindContent() {
  $$('[data-upload]').forEach(inp => inp.addEventListener('change', async () => {
    const file = inp.files[0]; if (!file) return;
    toast('מעלה תמונה...');
    const dataUrl = await resizeImage(file, Number(inp.dataset.max) || 1600);
    const res = await call('upload', { dataUrl });
    if (!res.ok) return toast('ההעלאה נכשלה', true);
    setP(inp.dataset.upload, res.path); markDirty(); rerender(); toast('התמונה הועלתה – לחצו "שמירה"');
  }));
}
function resizeImage(file, max) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); resolve(cv.toDataURL('image/jpeg', 0.84));
    }; img.onerror = reject; img.src = r.result; };
    r.onerror = reject; r.readAsDataURL(file);
  });
}

/* ===================== הגדרות ===================== */
function settingsPage() {
  // טוענים את כל הגופנים פעם אחת, כדי שהדוגמאות בכרטיס "גופנים" יוצגו בגופן שלהן
  if (!document.getElementById('all-fonts')) document.head.insertAdjacentHTML('beforeend', `<link id="all-fonts" rel="stylesheet" href="${allFontsURL()}">`);
  const demo = DON.filter(d => d.demo).length, demoTeams = draft.teams.filter(t => t.demo).length;
  return `
  <div class="card"><h2>פרטי העמותה</h2>
    ${BI('orgName', 'שם העמותה')}<div class="cols3">${F('orgNumber', 'מספר עמותה', { dir: 'ltr' })}</div>
    ${F('section46', 'לעמותה יש אישור לפי סעיף 46', { k: 'bool', rr: 1 })}
    <div class="note ${draft.section46 ? 'warn' : ''}">${draft.section46 ? 'אחרי ההפעלה, עדכנו גם את התשובה על זיכוי מס ב"תוכן האתר ← שאלות נפוצות".' : 'כרגע האתר לא מציג שהתרומות מוכרות לפי סעיף 46.'}</div>
  </div>
  <div class="card"><h2>צבעי האתר</h2>
    <p class="muted small">בחרו ערכת צבע לאתר הציבורי. הבחירה נכנסת לתוקף אחרי "שמירה".
      <a href="/?palette${campPath().slice(1)}" target="_blank" rel="noopener">תצוגה מקדימה של כל הערכות באתר ↗</a></p>
    <div class="theme-grid">${THEMES.map(th => `<button type="button" class="theme-opt ${(draft.theme || 'classic') === th.id ? 'sel' : ''}" data-act="pick-theme" data-id="${th.id}">
      ${swatchHTML(th)}<span>${esc(th.he)}</span></button>`).join('')}</div>
  </div>
  <div class="card"><h2>גופנים</h2>
    <p class="muted small">בחרו זוג גופנים לאתר הציבורי: אחד לכותרות ואחד לטקסט. הבחירה נכנסת לתוקף אחרי "שמירה".
      <a href="/?fonts${campPath().slice(1)}" target="_blank" rel="noopener">תצוגה מקדימה של כל הגופנים באתר ↗</a></p>
    <div class="font-grid">${FONTS.map(f => `<button type="button" class="font-opt ${(draft.fonts || 'classic') === f.id ? 'sel' : ''}" data-act="pick-fonts" data-id="${f.id}">
      <span class="fo-head" style="font-family:'${f.head}'">${esc(L(draft.shortName) || 'יוזמה')}</span><span class="fo-body" style="font-family:'${f.body}'">כל תרומה מוכפלת · ${esc(f.he)}</span></button>`).join('')}</div>
  </div>
  <div class="card"><h2>נתוני הדגמה</h2>
    ${demo || demoTeams ? `<p>במערכת יש <b>${demo}</b> תרומות לדוגמה ו-<b>${demoTeams}</b> צוותים עם סכומים לדוגמה. לפני העלייה לאוויר מחקו אותם.</p>
      <p class="muted small">המחיקה מוחקת את התרומות לדוגמה, מאפסת את הסכומים של הצוותים לדוגמה ואת "גויס מחוץ לאתר". שמות הצוותים, המכפילים וההקדשות נשארים – ערכו אותם בעמודים שלהם.</p>
      <button class="btn danger" data-act="purge-demo">מחיקת נתוני הדגמה</button>` : '<p class="muted">אין נתוני הדגמה במערכת ✓</p>'}
  </div>
  <div class="card"><h2>שינוי סיסמה</h2>
    <form id="pw-form" class="cols3" autocomplete="off">
      <div class="fld"><label>סיסמה נוכחית</label><input type="password" id="pw-cur" autocomplete="current-password"></div>
      <div class="fld"><label>סיסמה חדשה (8 תווים לפחות)</label><input type="password" id="pw-new" autocomplete="new-password"></div>
      <div class="fld"><label>אימות</label><input type="password" id="pw-new2" autocomplete="new-password"></div>
      <div><button class="btn">עדכון סיסמה</button><div class="err" id="pw-err"></div></div>
    </form>
  </div>
  <div class="card"><h2>גיבוי הקמפיין</h2>
    <p class="muted small">קובץ עם כל התוכן ואת כל התרומות של הקמפיין הזה (כולל פרטי קשר של תורמים) – שמרו אותו במקום מאובטח.${isAdmin() ? ' גיבוי ושחזור של כל הפלטפורמה נמצאים ב"הגדרות הפלטפורמה".' : ''}</p>
    <button class="btn ghost" data-act="backup">⬇ הורדת גיבוי הקמפיין</button>
  </div>`;
}
function bindPwForm() {
  $('#pw-form').addEventListener('submit', async e => {
    e.preventDefault();
    const cur = $('#pw-cur').value, n1 = $('#pw-new').value, n2 = $('#pw-new2').value;
    if (n1.length < 8) return $('#pw-err').textContent = 'הסיסמה החדשה קצרה מדי';
    if (n1 !== n2) return $('#pw-err').textContent = 'הסיסמאות אינן תואמות';
    const res = await call('password', { current: cur, password: n1 });
    if (!res.ok) return $('#pw-err').textContent = res.error === 'wrong' ? 'הסיסמה הנוכחית שגויה' : 'העדכון נכשל';
    e.target.reset(); $('#pw-err').textContent = ''; toast('הסיסמה עודכנה ✓');
  });
}
const bindSettings = bindPwForm;
function bindRestore() {
  $('#restore-file').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    let dbObj;
    try { dbObj = JSON.parse(await file.text()); } catch (err) { return toast('הקובץ אינו גיבוי תקין', true); }
    if (!dbObj.platform || !Array.isArray(dbObj.campaigns) || !Array.isArray(dbObj.donations)) return toast('הקובץ אינו גיבוי מלא של הפלטפורמה', true);
    if (!confirm(`לשחזר את הגיבוי? הוא כולל ${dbObj.campaigns.length} קמפיינים ו-${dbObj.donations.length} תרומות, ויחליף את כל הנתונים הנוכחיים.\n(עותק של המצב הנוכחי יישמר בשרת בקובץ db.json.before-restore)`)) return;
    const res = await call('restore', { db: dbObj });
    if (!res.ok) return toast('השחזור נכשל', true);
    await loadData(); toast('הגיבוי שוחזר ✓');
  });
}

/* ===================== פעולות ===================== */
const ACTIONS = {
  'close-modal': () => closeModal(),
  'edit-donation': (el, e) => { e.preventDefault(); openDonation(el.dataset.id); },
  'new-donation': () => openDonation(null),
  'page': el => { ui.don.pageNo += Number(el.dataset.d); renderDonationResults(); },
  'filter-receipts': () => { ui.don = { ...ui.don, q: '', status: 'paid', type: 'receipt', pageNo: 0 }; go('donations'); },
  'donor-filter': el => { ui.don = { q: el.dataset.q, status: '', source: '', team: '', type: '', from: '', to: '', pageNo: 0 }; go('donations'); },
  'export-donations': () => downloadCSV(`donations-${today()}.csv`,
    ['תאריך', 'שם', 'טלפון', 'אימייל', 'ת"ז', 'סכום', 'מטבע', 'תשלומים', 'סה"כ בש"ח', 'נספר לקמפיין', 'צוות', 'פריט הקדשה', 'הקדשה', 'נוסח שלט', 'ברכה', 'אמצעי תשלום', 'מקור', 'סטטוס', 'אנונימי', 'ביקש קבלה', 'קבלה נשלחה', 'מס\' אישור', 'הערות'],
    filteredDonations().map(d => [fmtDate(d.date), d.name, d.phone, d.email, d.idNumber ? '‎' + d.idNumber : '', d.amount, d.cur, d.months, d.baseIls, d.credited, teamName(d.teamId), L(dedById(d.dedicationId)), d.dedication, d.plaqueText, d.message, METHODS[d.method] || d.method, SOURCES[d.source] || d.source, STATUSES[d.status] || d.status, d.anon ? 'כן' : '', d.wantsReceipt ? 'כן' : '', d.receiptSent ? 'כן' : '', d.receiptNo || '', d.notes])),
  'export-donors': () => downloadCSV(`donors-${today()}.csv`, ['שם', 'טלפון', 'אימייל', 'מספר תרומות', 'סה"כ תרם', 'נספר לקמפיין', 'תרומה אחרונה', 'הוראת קבע'],
    donorsList().sort((a, b) => b.total - a.total).map(p => [p.name, p.phone, p.email, p.count, p.total, p.credited, fmtDate(p.last), p.recurring ? 'כן' : ''])),
  'export-dedications': () => downloadCSV(`dedications-${today()}.csv`, ['תאריך', 'פריט', 'תורם', 'טלפון', 'אימייל', 'הקדשה', 'נוסח שלט', 'סטטוס'],
    paid().filter(d => d.dedicationId).map(d => [fmtDate(d.date), L(dedById(d.dedicationId)), d.name, d.phone, d.email, d.dedication, d.plaqueText, PLAQUE[d.plaqueStatus] || ''])),
  'export-teams': () => downloadCSV(`teams-${today()}.csv`, ['צוות', 'ראש צוות', 'יעד', 'גויס מחוץ לאתר', 'גויס באתר', 'סה"כ', 'תרומות באתר', 'סטטוס'],
    draft.teams.map(t => { const on = teamOnline(t.id), s = on.reduce((a, d) => a + N(d.credited), 0); return [L(t.name), L(t.leader), t.goal, t.raised, s, N(t.raised) + s, on.length, TEAM_ST[t.status]]; })),
  'export-raffle': () => downloadCSV(`raffle-${today()}.csv`, ['שם', 'טלפון', 'אימייל', 'כרטיסים'], raffleParticipants().map(p => [p.name, p.phone, p.email, p.tickets])),
  'team-status': async el => { draft.teams[Number(el.dataset.i)].status = el.dataset.st; if (await save()) rerender(); },
  'clear-dates': () => { draft.startsAt = null; draft.endsAt = null; markDirty(); rerender(); },
  'rm-img': el => { setP(el.dataset.p, ''); markDirty(); rerender(); },
  'raffle-draw': async () => {
    if (dirty && !confirm('יש שינויים שלא נשמרו – הם יישמרו יחד עם תוצאות ההגרלה. להמשיך?')) return;
    if ((draft.raffle.winners || []).length && !confirm('כבר בוצעה הגרלה. לבצע הגרלה חדשה במקומה?')) return;
    if (!confirm('לבצע את ההגרלה עכשיו?')) return;
    const parts = raffleParticipants().map(p => ({ ...p })), winners = [];
    draft.raffle.prizes.forEach((pr, i) => {
      const total = parts.reduce((s, p) => s + p.tickets, 0); if (!total) return;
      let r = randInt(total), idx = 0;
      while (r >= parts[idx].tickets) { r -= parts[idx].tickets; idx++; }
      const w = parts.splice(idx, 1)[0];
      winners.push({ prize: i, prizeName: L(pr), name: w.name, email: w.email || '', phone: w.phone || '', tickets: w.tickets, at: Date.now() });
    });
    draft.raffle.winners = winners;
    if (await save()) rerender();
  },
  'raffle-reset': async () => { if (!confirm('למחוק את תוצאות ההגרלה?')) return; draft.raffle.winners = []; if (await save()) rerender(); },
  'purge-demo': async () => {
    if (!confirm('למחוק את כל נתוני ההדגמה? אי אפשר לבטל את הפעולה.')) return;
    if (dirty && !(await save())) return;
    const res = await call('purge-demo', { campaignId: CAMP_ID });
    if (!res.ok) return toast('המחיקה נכשלה', true);
    await loadData();
    draft.baseRaised = 0; draft.baseDonors = 0;
    await save(); go('settings'); toast('נתוני ההדגמה נמחקו ✓');
  },
  'backup': async () => {
    const res = await call('data?c=' + encodeURIComponent(CAMP_ID));
    if (!res.ok) return toast('הגיבוי נכשל', true);
    download(new Blob([JSON.stringify({ campaign: res.config, donations: res.donations, backupAt: Date.now() }, null, 1)], { type: 'application/json' }), `campaign-${CAMP_ID}-backup-${today()}.json`);
  },
  'backup-all': async () => {
    const res = await call('backup');
    if (!res.ok) return toast('הגיבוי נכשל', true);
    download(new Blob([JSON.stringify({ ...res.db, backupAt: Date.now() }, null, 1)], { type: 'application/json' }), `platform-backup-${today()}.json`);
  }
};

/* ===================== חלון ===================== */
function modal(inner) {
  $('#modal-root').innerHTML = `<div class="modal-back" id="mb"><div class="modal"><button class="x" data-act="close-modal" aria-label="סגירה">✕</button>${inner}</div></div>`;
  $('#mb').addEventListener('mousedown', e => { if (e.target.id === 'mb') closeModal(); });
  lockReadOnly($('#modal-root'));
}
function closeModal() { $('#modal-root').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ===================== כל הקמפיינים (מנהל פלטפורמה) ===================== */
const PHASE = { live: '🔴 פעיל', upcoming: '⏳ טרם התחיל', ended: '🏁 הסתיים' };
function campsPage() {
  const pend = CAMPS.filter(c => c.status === 'pending');
  const row = c => `<tr>
    <td><span class="camp-dot" style="background:linear-gradient(135deg,${esc(c.cover?.colors?.[0] || '#1e3a8a')},${esc(c.cover?.colors?.[1] || '#3b82f6')})">${esc(c.cover?.emoji || '')}</span></td>
    <td><b>${esc(L(c.name))}</b><div class="muted small">${esc(L(c.orgName))}</div></td>
    <td><span class="pill ${esc(c.status)}">${esc(CAMP_ST[c.status] || c.status)}</span></td>
    <td class="small">${PHASE[c.phase] || ''}<div class="muted">${c.startsAt ? fmtDate(c.startsAt).slice(0, 10) : ''}${c.endsAt ? ' – ' + fmtDate(c.endsAt).slice(0, 10) : ''}</div></td>
    <td class="num"><b>${ils(c.raised)}</b><div class="muted small">${c.goal ? Math.round(c.raised / c.goal * 100) + '% מ-' + ils(c.goal) : ''}</div></td>
    <td class="num">${num(c.donations)}</td>
    <td style="white-space:nowrap">
      <button class="btn ghost sm" data-act="camp-open" data-id="${esc(c.id)}">ניהול</button>
      <a class="btn ghost sm" href="/#/c/${encodeURIComponent(c.id)}" target="_blank" rel="noopener">באתר ↗</a>
      ${c.status === 'live' ? `<button class="btn ghost sm" data-act="camp-status" data-id="${esc(c.id)}" data-st="hidden">הסתרה</button>` : `<button class="btn green sm" data-act="camp-status" data-id="${esc(c.id)}" data-st="live">${c.status === 'pending' ? '✓ אישור ופרסום' : 'פרסום'}</button>`}
      <button class="btn danger sm" data-act="camp-del" data-id="${esc(c.id)}" title="מחיקה">✕</button></td></tr>`;
  return `
  ${pend.length ? `<div class="card"><h2>בקשות לפתיחת קמפיין (${pend.length})</h2>
    <p class="muted small">עמותות שמילאו את הטופס "פתיחת קמפיין" באתר. בדקו את הפרטים, היכנסו לקמפיין כדי להשלים תוכן, ואשרו כדי לפרסם אותו בדף הבית.</p>
    ${pend.map(c => `<div class="team-pending"><div><b>${esc(L(c.name))}</b> · ${esc(L(c.orgName))} · יעד ${ils(c.goal)}
      <div class="muted small">נשלח ${fmtDate(c.createdAt)}${c.applicant ? ` · ${esc(c.applicant.name)} · <span class="ltr">${esc(c.applicant.phone)}</span> · <span class="ltr">${esc(c.applicant.email)}</span>` : ''}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-act="camp-open" data-id="${esc(c.id)}">צפייה ועריכה</button>
        <button class="btn green sm" data-act="camp-status" data-id="${esc(c.id)}" data-st="live">✓ אישור ופרסום</button>
        <button class="btn danger sm" data-act="camp-status" data-id="${esc(c.id)}" data-st="hidden">דחייה</button></div></div>`).join('')}
  </div>` : ''}
  <div class="card"><div class="card-head"><h2>כל הקמפיינים (${CAMPS.length})</h2><button class="btn gold" data-act="camp-new">+ קמפיין חדש</button></div>
    <p class="muted small">"פורסם באתר" = מופיע בדף הבית ופתוח לתרומות. "מוסתר" = לא מופיע באתר, אבל הנתונים נשמרים.</p>
    ${CAMPS.length ? `<div class="tbl-wrap"><table><thead><tr><th></th><th>קמפיין</th><th>סטטוס</th><th>מועדים</th><th>גויס</th><th>תרומות</th><th></th></tr></thead>
      <tbody>${CAMPS.map(row).join('')}</tbody></table></div>` : '<p class="muted">אין עדיין קמפיינים</p>'}
  </div>`;
}
ACTIONS['camp-open'] = el => { page = 'dashboard'; switchCampaign(el.dataset.id).then(() => { if (CAMP_ID === el.dataset.id) go('dashboard'); }); };
ACTIONS['camp-status'] = async el => {
  const c = CAMPS.find(x => x.id === el.dataset.id), st = el.dataset.st;
  const q = st === 'live' ? `לפרסם את "${L(c.name)}" בדף הבית ולפתוח אותו לתרומות?` : `להסתיר את "${L(c.name)}" מהאתר? הנתונים יישמרו, ואפשר לפרסם שוב בכל עת.`;
  if (!confirm(q)) return;
  const res = await call('campaigns/' + encodeURIComponent(c.id), { status: st }, 'PUT');
  if (!res.ok) return toast('העדכון נכשל', true);
  Object.assign(c, res.campaign); toast(st === 'live' ? 'הקמפיין פורסם ✓' : 'הקמפיין הוסתר');
  renderShell();
};
ACTIONS['camp-del'] = async el => {
  const c = CAMPS.find(x => x.id === el.dataset.id);
  if (!confirm(`למחוק לצמיתות את הקמפיין "${L(c.name)}"?\nאי אפשר לבטל את הפעולה. אפשר למחוק רק קמפיין שאין בו תרומות אמיתיות – אחרת השתמשו ב"הסתרה".`)) return;
  const res = await call('campaigns/' + encodeURIComponent(c.id), null, 'DELETE');
  if (!res.ok) return toast(res.error === 'has-donations' ? 'בקמפיין יש תרומות אמיתיות – אי אפשר למחוק אותו. אפשר להסתיר אותו.' : 'המחיקה נכשלה', true);
  toast('הקמפיין נמחק');
  if (CAMP_ID === c.id) CAMP_ID = null;
  await loadData();
};
ACTIONS['camp-new'] = () => {
  modal(`<form id="nc-form" autocomplete="off"><h2>קמפיין חדש</h2>
    <p class="muted small">הקמפיין נוצר במצב "מוסתר". אחרי שתמלאו את התוכן, פרסמו אותו מהטבלה.</p>
    <div class="fld"><label>שם הקמפיין</label><input id="nc-name" maxlength="70"></div>
    <div class="fld"><label>שם העמותה</label><input id="nc-org" maxlength="80"></div>
    <div class="fld"><label>כתובת הקמפיין באתר <span class="hint">(אותיות קטנות באנגלית, ספרות ומקף)</span></label><input id="nc-id" dir="ltr" placeholder="my-campaign" maxlength="40"></div>
    <div class="err" id="nc-err"></div>
    <div class="modal-foot"><div class="grp"><button class="btn gold">יצירה</button><button class="btn ghost" type="button" data-act="close-modal">ביטול</button></div></div></form>`);
  $('#nc-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#nc-name').value.trim(), org = $('#nc-org').value.trim(), id = $('#nc-id').value.trim().toLowerCase();
    if (!name || !org) return $('#nc-err').textContent = 'נא למלא שם קמפיין ושם עמותה';
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(id)) return $('#nc-err').textContent = 'כתובת: לפחות 2 תווים – אותיות קטנות באנגלית, ספרות ומקף';
    const res = await call('campaigns', { campaign: blankCampaign(id, name, org) });
    if (!res.ok) return $('#nc-err').textContent = res.error === 'exists' ? 'כבר יש קמפיין עם הכתובת הזו' : 'היצירה נכשלה';
    closeModal(); toast('הקמפיין נוצר ✓ – עכשיו מלאו את התוכן');
    page = 'content'; await loadData(id);
  });
};
function blankCampaign(id, name, org) {
  const b = s => ({ he: s, en: '' }), p = PLAT || PLATFORM;
  return {
    id, status: 'hidden', category: p.categories[0]?.id || '', logo: '', cover: { emoji: '✨', colors: ['#1e3a8a', '#3b82f6'] },
    name: b(name), shortName: b(org), tagline: b(''), short: b(''), location: b(''), orgName: b(org), orgNumber: '', section46: false,
    theme: 'classic', progressStyle: 'bar', hideGoal: false, fonts: 'classic', a11y: {},
    goal: 100000, baseRaised: 0, baseDonors: 0, multiplier: 2, startsAt: null, endsAt: null, usdRate: N(p.usdRate) || 3.65,
    videoUrl: '', contact: { phone: '', email: '', address: b(''), bank: b('') }, story: { he: [], en: [] },
    milestones: [], stretch: [], impact: [], dedications: [], matchers: [], teams: [], gallery: [], faq: [],
    raffle: { enabled: false, ticketPrice: 360, drawDate: b(''), prizes: [], winners: [] }, settings: { approveTeams: true }
  };
}

/* ===================== הגדרות הפלטפורמה (מנהל פלטפורמה) ===================== */
function platformPage() {
  if (!PLAT) return '<p class="muted">טוען...</p>';
  if (!document.getElementById('all-fonts')) document.head.insertAdjacentHTML('beforeend', `<link id="all-fonts" rel="stylesheet" href="${allFontsURL()}">`);
  return `
  <div class="card"><h2>פרטי הפלטפורמה</h2>
    ${BI('name', 'שם הפלטפורמה')}${BI('tagline', 'משפט מסר')}
    ${BI('operator', 'הגוף שמפעיל את הפלטפורמה', { hint: '(חברה או עמותה – יוצג בתחתית האתר)' })}
    <div class="cols3">${F('operatorNumber', 'מספר ח"פ / ע"ר', { dir: 'ltr' })}${F('contact.phone', 'טלפון', { dir: 'ltr' })}${F('contact.email', 'אימייל', { dir: 'ltr' })}</div>
    <div class="cols3">${F('usdRate', 'שער דולר לקמפיינים חדשים', { k: 'num' })}</div>
  </div>
  <div class="card"><h2>תחומים</h2><p class="muted small">התחומים שמהם בוחרים בטופס פתיחת קמפיין ובסינון בדף "קמפיינים".</p>
    ${LIST('categories', pth => `<div class="cols4">${F(pth + '.icon', 'אייקון')}${F(pth + '.id', 'מזהה (באנגלית)', { dir: 'ltr' })}${F(pth + '.he', 'עברית')}${F(pth + '.en', 'English', { dir: 'ltr' })}</div>`, 'הוספת תחום')}</div>
  <div class="card"><h2>צבעי דפי הפלטפורמה</h2>
    <p class="muted small">דף הבית, "קמפיינים", "איך זה עובד" ו"לעמותות". לכל קמפיין יש צבעים משלו בהגדרות הקמפיין. <a href="/?palette" target="_blank" rel="noopener">תצוגה מקדימה ↗</a></p>
    <div class="theme-grid">${THEMES.map(th => `<button type="button" class="theme-opt ${(PLAT.theme || 'classic') === th.id ? 'sel' : ''}" data-act="pick-theme" data-id="${th.id}">${swatchHTML(th)}<span>${esc(th.he)}</span></button>`).join('')}</div>
  </div>
  <div class="card"><h2>גופנים לדפי הפלטפורמה</h2>
    <div class="font-grid">${FONTS.map(f => `<button type="button" class="font-opt ${(PLAT.fonts || 'classic') === f.id ? 'sel' : ''}" data-act="pick-fonts" data-id="${f.id}">
      <span class="fo-head" style="font-family:'${f.head}'">${esc(L(PLAT.name))}</span><span class="fo-body" style="font-family:'${f.body}'">כל תרומה מוכפלת · ${esc(f.he)}</span></button>`).join('')}</div>
  </div>
  <div class="card"><h2>נגישות</h2>
    <p class="muted small">לפי תקנות הנגישות, באתר שנותן שירות לציבור צריכה להיות הצהרת נגישות עם פרטים של איש קשר לנושא נגישות.
      ההצהרה משותפת לכל האתר, וקישור אליה מופיע בתחתית כל עמוד ובתפריט הנגישות. <a href="/#/accessibility" target="_blank" rel="noopener">צפייה בהצהרה ↗</a></p>
    <div class="cols3">${F('a11y.coordName', 'שם רכז/ת הנגישות')}${F('a11y.phone', 'טלפון', { dir: 'ltr' })}${F('a11y.email', 'אימייל', { dir: 'ltr' })}</div>
    <div class="cols3">${F('a11y.updated', 'תאריך עדכון ההצהרה', { ph: 'לדוגמה: נובמבר 2026' })}</div>
    ${BI('a11y.limits', 'מגבלות נגישות ידועות', { k: 'area', hint: '(ריק = לא יוצג)' })}
    ${PLAT.a11y?.coordName ? '' : '<div class="note warn">עדיין לא הוזנו פרטי רכז/ת נגישות – כרגע ההצהרה מפנה לטלפון ולאימייל של הפלטפורמה.</div>'}
  </div>
  <div class="card"><h2>שינוי סיסמה</h2>
    <form id="pw-form" class="cols3" autocomplete="off">
      <div class="fld"><label>סיסמה נוכחית</label><input type="password" id="pw-cur" autocomplete="current-password"></div>
      <div class="fld"><label>סיסמה חדשה (8 תווים לפחות)</label><input type="password" id="pw-new" autocomplete="new-password"></div>
      <div class="fld"><label>אימות</label><input type="password" id="pw-new2" autocomplete="new-password"></div>
      <div><button class="btn">עדכון סיסמה</button><div class="err" id="pw-err"></div></div>
    </form>
  </div>
  <div class="card"><h2>גיבוי ושחזור של כל הפלטפורמה</h2>
    <p class="muted small">הגיבוי כולל את כל הקמפיינים ואת כל התרומות (כולל פרטי קשר של תורמים) – שמרו אותו במקום מאובטח. המשתמשים והסיסמאות לא נכללים.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-act="backup-all">⬇ הורדת גיבוי מלא</button>
      <label class="btn ghost">⬆ שחזור מגיבוי<input type="file" accept="application/json,.json" hidden id="restore-file"></label></div>
  </div>`;
}
function bindPlatform() { bindPwForm(); bindRestore(); }

/* ===================== משתמשים והרשאות (מנהל פלטפורמה) ===================== */
const USER_ERR = {
  username: 'שם משתמש: 3–32 תווים – אותיות באנגלית, ספרות או . _ -',
  exists: 'שם המשתמש הזה כבר קיים',
  weak: 'הסיסמה צריכה להכיל לפחות 8 תווים',
  self: 'אי אפשר למחוק את המשתמש שאיתו נכנסת',
  'last-admin': 'חייב להישאר לפחות מנהל פלטפורמה אחד',
  forbidden: NO_PERM
};
let USERS = [];
const campName = id => { const c = CAMPS.find(x => x.id === id); return c ? L(c.name) : id; };
function campChecks(name, sel = []) {
  return `<div class="camp-checks">${CAMPS.map(c => `<label class="chk"><input type="checkbox" name="${name}" value="${esc(c.id)}" ${sel.includes(c.id) ? 'checked' : ''}> ${esc((c.cover?.emoji || '') + ' ' + L(c.name))}</label>`).join('') || '<span class="muted small">אין קמפיינים</span>'}</div>`;
}
function usersPage() {
  return `
  <div class="card"><h2>רמות הרשאה</h2>
    <div class="roles-info">
      <div><b>מנהל פלטפורמה</b><span>כל ההרשאות בכל הקמפיינים: אישור בקשות, פרסום והסתרה של קמפיינים, הגדרות הפלטפורמה וניהול משתמשים.</span></div>
      <div><b>מנהל קמפיין</b><span>כל ההרשאות בקמפיינים שמסומנים לו: תוכן, עיצוב, תרומות, הקדשות, צוותים והגרלה. לא רואה קמפיינים אחרים.</span></div>
      <div><b>מורשה – צפייה בלבד</b><span>רואה את הנתונים של הקמפיינים שמסומנים לו (כולל פרטי תורמים) ויכול לייצא לאקסל, אבל לא יכול לשנות דבר.</span></div>
    </div></div>
  <div class="card"><h2>משתמשים</h2><div id="users-list"><p class="muted">טוען...</p></div></div>
  <div class="card"><h2>הוספת משתמש</h2>
    <form id="user-form" autocomplete="off">
      <div class="cols4">
        <div class="fld"><label>שם</label><input type="text" id="nu-name" maxlength="60" placeholder="לדוגמה: רכזת הקמפיין"></div>
        <div class="fld"><label>שם משתמש <span class="hint">(באנגלית)</span></label><input type="text" id="nu-user" dir="ltr" autocomplete="off"></div>
        <div class="fld"><label>הרשאה</label><select id="nu-role"><option value="manager">${ROLES.manager}</option><option value="viewer">${ROLES.viewer}</option><option value="admin">${ROLES.admin}</option></select></div>
        <div class="fld"><label>סיסמה ראשונית</label><input type="password" id="nu-pw" autocomplete="new-password"></div>
      </div>
      <div class="fld"><label>קמפיינים <span class="hint">(למנהל קמפיין ולמורשה)</span></label>${campChecks('nu-camps', CAMP_ID ? [CAMP_ID] : [])}</div>
      <button class="btn gold">+ הוספת משתמש</button><div class="err" id="nu-err"></div>
      <p class="muted small">מסרו למשתמש את שם המשתמש והסיסמה, והמליצו לו להחליף סיסמה בהגדרות אחרי הכניסה הראשונה.</p>
    </form></div>`;
}
async function loadUsers() {
  const res = await call('users');
  if (!res.ok) { $('#users-list').innerHTML = '<p class="muted">טעינת המשתמשים נכשלה</p>'; return; }
  USERS = res.users || [];
  $('#users-list').innerHTML = `<div class="tbl-wrap"><table><thead><tr><th>שם</th><th>שם משתמש</th><th>הרשאה</th><th>קמפיינים</th><th></th></tr></thead><tbody>
    ${USERS.map(u => `<tr><td><b>${esc(u.name || '—')}</b>${u.id === ME?.id ? ' <span class="pill active">את/ה</span>' : ''}</td>
      <td class="ltr">${esc(u.username)}</td>
      <td><select class="inline-in" data-urole="${esc(u.id)}">${Object.entries(ROLES).map(([a, b]) => `<option value="${a}" ${u.role === a ? 'selected' : ''}>${b}</option>`).join('')}</select></td>
      <td class="small wrap">${u.role === 'admin' ? '<span class="muted">כל הקמפיינים</span>' : (u.campaigns || []).map(id => esc(campName(id))).join(' · ') || '<span class="muted">—</span>'}
        ${u.role === 'admin' ? '' : `<div><button class="btn ghost sm" data-act="user-camps" data-id="${esc(u.id)}">שיוך לקמפיינים</button></div>`}</td>
      <td style="white-space:nowrap"><button class="btn ghost sm" data-act="user-pw" data-id="${esc(u.id)}">קביעת סיסמה חדשה</button>
        ${u.id === ME?.id ? '' : `<button class="btn danger sm" data-act="user-del" data-id="${esc(u.id)}">מחיקה</button>`}</td></tr>`).join('')}
  </tbody></table></div>`;
  $$('[data-urole]').forEach(sel => sel.addEventListener('change', async () => {
    const u = USERS.find(x => x.id === sel.dataset.urole);
    const self = u.id === ME?.id;
    if (self && sel.value !== 'admin' && !confirm('להוריד את ההרשאה שלך? לא תוכל/י לנהל את הפלטפורמה עד שמנהל אחר יחזיר אותה.')) { sel.value = u.role; return; }
    const res = await call('users/' + encodeURIComponent(u.id), { role: sel.value }, 'PUT');
    if (!res.ok) { sel.value = u.role; return toast(USER_ERR[res.error] || 'העדכון נכשל', true); }
    toast(`ההרשאה של ${u.name || u.username} עודכנה ✓`);
    if (self) return loadData();
    loadUsers();
  }));
}
function bindUsers() {
  loadUsers();
  $('#user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const body = { name: $('#nu-name').value.trim(), username: $('#nu-user').value.trim(), role: $('#nu-role').value, password: $('#nu-pw').value,
      campaigns: $$('[name="nu-camps"]:checked').map(x => x.value) };
    if (body.password.length < 8) return $('#nu-err').textContent = USER_ERR.weak;
    if (body.role !== 'admin' && !body.campaigns.length) return $('#nu-err').textContent = 'סמנו לפחות קמפיין אחד';
    const res = await call('users', body);
    if (!res.ok) return $('#nu-err').textContent = USER_ERR[res.error] || 'ההוספה נכשלה';
    e.target.reset(); $('#nu-err').textContent = ''; toast('המשתמש נוסף ✓'); loadUsers();
  });
}
ACTIONS['user-camps'] = el => {
  const u = USERS.find(x => x.id === el.dataset.id); if (!u) return;
  modal(`<form id="uc-form"><h2>הקמפיינים של ${esc(u.name || u.username)}</h2>
    <p class="muted small">${esc(ROLES[u.role])} – יראה רק את הקמפיינים המסומנים.</p>
    ${campChecks('uc-camps', u.campaigns || [])}
    <div class="err" id="uc-err"></div>
    <div class="modal-foot"><div class="grp"><button class="btn gold">שמירה</button><button class="btn ghost" type="button" data-act="close-modal">ביטול</button></div></div></form>`);
  $('#uc-form').addEventListener('submit', async e => {
    e.preventDefault();
    const res = await call('users/' + encodeURIComponent(u.id), { campaigns: $$('[name="uc-camps"]:checked').map(x => x.value) }, 'PUT');
    if (!res.ok) return $('#uc-err').textContent = USER_ERR[res.error] || 'העדכון נכשל';
    closeModal(); toast('השיוך עודכן ✓'); loadUsers();
  });
};
ACTIONS['user-del'] = async el => {
  const u = USERS.find(x => x.id === el.dataset.id); if (!u) return;
  if (!confirm(`למחוק את המשתמש ${u.name || u.username}? הוא לא יוכל להיכנס יותר לבק אופיס.`)) return;
  const res = await call('users/' + encodeURIComponent(u.id), null, 'DELETE');
  if (!res.ok) return toast(USER_ERR[res.error] || 'המחיקה נכשלה', true);
  toast('המשתמש נמחק'); loadUsers();
};
ACTIONS['user-pw'] = el => {
  const u = USERS.find(x => x.id === el.dataset.id); if (!u) return;
  modal(`<form id="upw-form" autocomplete="off"><h2>סיסמה חדשה ל${esc(u.name || u.username)}</h2>
    <div class="fld"><label>סיסמה חדשה (לפחות 8 תווים)</label><input type="password" id="upw1" autocomplete="new-password"></div>
    <div class="fld"><label>אימות</label><input type="password" id="upw2" autocomplete="new-password"></div>
    <div class="err" id="upw-err"></div>
    <div class="modal-foot"><div class="grp"><button class="btn gold">שמירה</button><button class="btn ghost" type="button" data-act="close-modal">ביטול</button></div></div></form>`);
  $('#upw-form').addEventListener('submit', async e => {
    e.preventDefault();
    const p1 = $('#upw1').value;
    if (p1.length < 8) return $('#upw-err').textContent = USER_ERR.weak;
    if (p1 !== $('#upw2').value) return $('#upw-err').textContent = 'הסיסמאות אינן תואמות';
    const res = await call('users/' + encodeURIComponent(u.id), { password: p1 }, 'PUT');
    if (!res.ok) return $('#upw-err').textContent = USER_ERR[res.error] || 'העדכון נכשל';
    closeModal(); toast('הסיסמה עודכנה ✓');
  });
};

const RENDER = { dashboard, donations: donationsPage, donors: donorsPage, dedications: dedicationsPage, teams: teamsPage, campaign: campaignPage, raffle: rafflePage, content: contentPage, settings: settingsPage, camps: campsPage, platform: platformPage, users: usersPage };
const BIND = { donations: bindDonations, donors: bindDonors, dedications: bindDedications, content: bindContent, settings: bindSettings, platform: bindPlatform, users: bindUsers };

/* ערכת צבע וגופנים – לקמפיין או לדפי הפלטפורמה, לפי המסך */
ACTIONS['pick-theme'] = el => { tgt().theme = el.dataset.id; markDirty(); rerender(); };
ACTIONS['pick-fonts'] = el => { tgt().fonts = el.dataset.id; markDirty(); rerender(); };
ACTIONS['pick-progress'] = el => { draft.progressStyle = el.dataset.id; markDirty(); rerender(); };

boot();
