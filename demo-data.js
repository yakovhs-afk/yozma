/* תרומות לדוגמה – משמשות להדגמה בלבד. אפשר למחוק אותן מהבק אופיס ("מחיקת נתוני הדגמה") */
function seedDonations(c, seed = 11) {
  if (!c.demo) return [];   // רק קמפיינים לדוגמה מקבלים תרומות לדוגמה
  const st = c.startsAt && Date.now() < c.startsAt ? 'upcoming' : 'other';
  if (st === 'upcoming') return [];
  const he = ['משה כהן', 'רחל לוי', 'יוסף מזרחי', 'שרה פרץ', 'דוד ביטון', 'מרים אברהם', 'אליהו דהן', 'חנה שלום', 'אברהם אזולאי', 'רבקה פרידמן', 'יעקב גבאי', 'אסתר חדד', 'שמואל עמר', 'לאה סעדה', 'נתן אוחיון', 'תמר בן דוד'];
  const en = ['Jacob Stein', 'Sarah Klein', 'Daniel Gold', 'Rebecca Adler', 'Michael Roth'];
  const msgs = ['זכות גדולה להיות שותפים!', '', 'בהצלחה רבה', '', 'לעילוי נשמת סבא וסבתא', 'כל הכבוד על העשייה', '', 'Good luck from New York!', ''];
  const ded = ['', '', '', 'לעילוי נשמת אבי מורי', '', 'לרפואת שרה בת רבקה', '', ''];
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const end = c.endsAt && c.endsAt < Date.now() ? c.endsAt : Date.now(), out = [];
  for (let k = 0; k < 24; k++) {
    const abroad = rnd() < 0.18;
    const cur = abroad ? 'USD' : 'ILS';
    const amount = abroad ? [36, 100, 180, 500][Math.floor(rnd() * 4)] : [36, 52, 100, 180, 360, 500, 1000, 1800][Math.floor(rnd() * 8)];
    const months = rnd() < 0.2 ? [12, 24, 36][Math.floor(rnd() * 3)] : 1;
    const baseIls = Math.round(amount * months * (cur === 'USD' ? c.usdRate : 1) * 100) / 100;
    const date = Math.round(end - k * HOUR * (0.15 + rnd() * 0.5));
    out.push({
      id: c.id + '-demo' + k, campaignId: c.id, date, createdAt: date, source: 'online', method: 'card', status: 'paid', demo: true,
      name: abroad ? en[Math.floor(rnd() * en.length)] : he[Math.floor(rnd() * he.length)],
      email: '', phone: '',
      amount, cur, months, baseIls, credited: baseIls * c.multiplier,
      teamId: c.teams.length && rnd() < 0.55 ? c.teams[Math.floor(rnd() * c.teams.length)].id : '',
      dedicationId: '', dedication: ded[Math.floor(rnd() * ded.length)], plaqueStatus: '', plaqueText: '',
      message: msgs[Math.floor(rnd() * msgs.length)], anon: rnd() < 0.1, hideMessage: false,
      wantsReceipt: true, receiptSent: false, notes: ''
    });
  }
  return out;
}
const seedAllDonations = () => CAMPAIGNS.flatMap((c, i) => seedDonations(c, 11 + i * 7));

/* בניית מסד הנתונים הראשוני מתוך config.js (משמש בהגדרה הראשונה של הבק אופיס) */
function buildInitialDb(withDemo) {
  const campaigns = JSON.parse(JSON.stringify(CAMPAIGNS)).map(c => {
    c.teams = c.teams.map(t => ({ ...t, status: 'approved', demo: !!withDemo, ...(withDemo ? {} : { raised: 0, donors: 0 }) }));
    c.raffle.winners = [];
    if (!withDemo) { c.baseRaised = 0; c.baseDonors = 0; }
    return c;
  });
  return { platform: JSON.parse(JSON.stringify(PLATFORM)), campaigns, donations: withDemo ? seedAllDonations() : [] };
}
