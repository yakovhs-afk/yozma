/* =====================================================================
   הגדרות הפלטפורמה "יוזמה" והקמפיינים לדוגמה.
   כל טקסט מופיע בעברית (he) ובאנגלית (en). אם en חסר – מוצג הטקסט העברי.
   אחרי ההגדרה הראשונה של הבק אופיס, התוכן נשמר בשרת (data/db.json)
   והקובץ הזה משמש רק כנקודת התחלה וכגיבוי לאתר ההדגמה.
   ⚠️ כל העמותות והקמפיינים כאן הם דוגמאות בדויות להדגמה בלבד.
   ===================================================================== */

const HOUR = 3600000, DAY = 86400000;
const NOW = Date.now();

const PLATFORM = {
  name: { he: 'יוזמה', en: 'Yozma' },
  shortName: { he: 'יוזמה', en: 'Yozma' },
  tagline: { he: 'קמפייני תרומות לעמותות – כל תרומה מוכפלת', en: 'Matching campaigns for nonprofits – every gift is multiplied' },
  // ⚠️ פרטי הגוף שמפעיל את הפלטפורמה – עדיין לא נקבעו
  operator: { he: '', en: '' },
  operatorNumber: '',
  theme: 'classic',
  fonts: 'classic',
  usdRate: 3.65,
  contact: { phone: '050-000-0000', email: 'info@example.org' },
  a11y: { coordName: '', phone: '', email: '', updated: '', physical: { he: '', en: '' }, limits: { he: '', en: '' } },
  settings: { approveCampaigns: true },
  categories: [
    { id: 'welfare', icon: '🤲', he: 'חסד ורווחה', en: 'Welfare' },
    { id: 'education', icon: '🎓', he: 'חינוך', en: 'Education' },
    { id: 'health', icon: '🩺', he: 'בריאות', en: 'Health' },
    { id: 'youth', icon: '🧒', he: 'ילדים ונוער', en: 'Children & youth' },
    { id: 'community', icon: '🏘️', he: 'קהילה ובתי כנסת', en: 'Community & synagogues' },
    { id: 'animals', icon: '🐾', he: 'בעלי חיים', en: 'Animals' }
  ]
};

/* ---------- בניית קמפיין מלא מתוך תיאור קצר ---------- */
function makeCampaign(b) {
  const startsAt = NOW + b.startH * HOUR;
  const he46 = b.section46
    ? 'כן. לעמותה יש אישור לפי סעיף 46, וכל תורם יקבל קבלה המזכה בזיכוי ממס.'
    : 'לעמותה אין כרגע אישור לפי סעיף 46, ולכן התרומות אינן מזכות בזיכוי ממס. כל תורם יקבל קבלה לאימייל.';
  const en46 = b.section46
    ? 'Yes. The organization holds Section 46 approval, and every donor receives a tax-deductible receipt.'
    : 'The organization does not currently hold Section 46 approval, so donations are not tax-deductible in Israel. Every donor receives an emailed receipt.';
  return {
    id: b.id, status: b.status || 'live', category: b.category, demo: true,
    logo: '', cover: { emoji: b.emoji, colors: b.colors },
    name: b.name, shortName: b.shortName, tagline: b.tagline, short: b.short, location: b.location,
    orgName: b.orgName, orgNumber: b.orgNumber, section46: !!b.section46,
    theme: b.theme || 'classic', progressStyle: b.progressStyle || 'bar', hideGoal: false, fonts: b.fonts || 'classic',
    a11y: { coordName: '', phone: '', email: '', updated: '', physical: { he: '', en: '' }, limits: { he: '', en: '' } },
    goal: b.goal, baseRaised: b.baseRaised, baseDonors: b.baseDonors, multiplier: b.multiplier,
    startsAt, endsAt: startsAt + b.durH * HOUR, usdRate: PLATFORM.usdRate,
    videoUrl: '',
    contact: {
      phone: '050-000-0000', email: 'info@example.org', address: b.location,
      bank: { he: 'בנק ______, סניף ___, חשבון ______ – על שם ' + b.orgName.he, en: 'Bank ______, branch ___, account ______' }
    },
    story: b.story, milestones: b.milestones, stretch: b.stretch, impact: b.impact,
    dedications: b.dedications, matchers: b.matchers, teams: b.teams,
    raffle: b.raffle || { enabled: false, ticketPrice: 360, drawDate: { he: '', en: '' }, prizes: [] },
    gallery: b.gallery,
    faq: [
      { q: { he: 'איך עובדת ההכפלה?', en: 'How does matching work?' },
        a: { he: 'תורמים מכפילים התחייבו מראש להכפיל כל תרומה במהלך הקמפיין, עד להשגת היעד.', en: 'Matching donors pledged in advance to multiply every gift during the campaign, up to the goal.' } },
      { q: { he: 'האם התרומה מוכרת לצורכי מס?', en: 'Is my donation tax-deductible?' }, a: { he: he46, en: en46 } },
      { q: { he: 'אפשר לתרום בהוראת קבע?', en: 'Can I give monthly?' },
        a: { he: 'כן – אפשר לבחור 12, 24 או 36 תשלומים חודשיים. כל הסכום נספר לקמפיין ומוכפל.', en: 'Yes – choose 12, 24 or 36 monthly payments. The full amount counts and is matched.' } },
      { q: { he: 'מה קורה אחרי שהקמפיין נגמר?', en: 'What happens after the campaign ends?' },
        a: { he: 'אפשר להמשיך לתרום, אבל התרומות כבר לא יוכפלו.', en: 'You can keep donating, but gifts are no longer matched.' } }
    ],
    settings: { approveTeams: true }
  };
}
const team = (id, he, en, leaderHe, leaderEn, goal, raised, donors) => ({ id, name: { he, en }, leader: { he: leaderHe, en: leaderEn }, goal, raised, donors });
const ph = (emoji, c1, c2, he, en) => ({ src: '', emoji, colors: [c1, c2], he, en });

const CAMPAIGNS = [
  makeCampaign({
    id: 'shulchan-male', category: 'welfare', emoji: '🧺', colors: ['#fbbf24', '#f97316'], theme: 'olive',
    name: { he: 'סל חג לאלף משפחות', en: 'Holiday baskets for 1,000 families' },
    shortName: { he: 'שולחן מלא', en: 'Full Table' },
    tagline: { he: 'כל תרומה מוכפלת – ועוזרת למשפחה לשבת לשולחן חג מכובד', en: 'Every gift is doubled – helping a family sit down to a dignified holiday table' },
    short: { he: 'כל תרומה מוכפלת פי 2 – ועוזרת למשפחה לשבת לשולחן חג מכובד.', en: 'Every gift doubled – helping a family to a dignified holiday table.' },
    location: { he: 'ארצי', en: 'Nationwide' },
    orgName: { he: 'עמותת "שולחן מלא"', en: 'Shulchan Male (R.A.)' }, orgNumber: '580123456', section46: true,
    goal: 360000, baseRaised: 210000, baseDonors: 540, multiplier: 2, startH: -30, durH: 48,
    story: {
      he: ['לקראת החגים, אלפי משפחות בישראל מתמודדות עם השאלה איך יערכו שולחן חג.', '"שולחן מלא" מחלקת כבר 12 שנה סלי מזון מכובדים, בצנעה ובכבוד, למשפחות שהופנו אלינו מהרווחה.', 'השנה היעד שלנו הוא 1,000 משפחות. סל אחד עולה ₪360.'],
      en: ['Ahead of the holidays, thousands of families in Israel wonder how they will set a holiday table.', 'For 12 years, Shulchan Male has discreetly delivered dignified food baskets to families referred by social services.', 'This year our goal is 1,000 families. One basket costs ₪360.']
    },
    milestones: [
      { he: 'איסוף הפניות מהרווחה', en: 'Collecting referrals from social services', date: { he: '', en: '' }, status: 'done' },
      { he: 'גיוס התרומות', en: 'Fundraising', date: { he: 'עכשיו', en: 'Now' }, status: 'active' },
      { he: 'אריזה וחלוקה לפני החג', en: 'Packing and delivery before the holiday', date: { he: '', en: '' }, status: 'todo' }
    ],
    stretch: [{ amount: 500000, he: 'יעד בונוס: 400 משפחות נוספות', en: 'Bonus goal: 400 more families' }],
    impact: [
      { amount: 52, icon: '🍞', he: 'חלות ויין לשבת', en: 'Challah and wine for Shabbat' },
      { amount: 180, icon: '🍗', he: 'עוף וירקות לחג', en: 'Chicken and vegetables for the holiday' },
      { amount: 360, icon: '🧺', he: 'סל חג שלם למשפחה', en: 'A full holiday basket' },
      { amount: 1800, icon: '❤️', he: 'סלים לחמש משפחות', en: 'Baskets for five families' }
    ],
    dedications: [
      { id: 'day', icon: '📅', amount: 3600, total: 10, taken: 3, he: 'יום חלוקה', en: 'A delivery day', descHe: 'יום החלוקה כולו יוקדש על שמכם.', descEn: 'A full delivery day dedicated in your name.' },
      { id: 'truck', icon: '🚚', amount: 1800, total: 20, taken: 6, he: 'משאית חלוקה', en: 'A delivery truck', descHe: 'שלט על משאית החלוקה.', descEn: 'A sign on a delivery truck.' }
    ],
    matchers: [{ name: { he: 'קרן משפחת אלמוג', en: 'Almog Family Fund' }, amount: 100000 }, { name: { he: 'תורם אנונימי', en: 'Anonymous' }, amount: 50000 }, { name: { he: 'קבוצת "אור" נדל"ן', en: 'Or Real Estate' }, amount: 30000 }],
    teams: [team('t1', 'צוות בית הכנסת "אוהל משה"', 'Ohel Moshe synagogue team', 'נועה כהן', 'Noa Cohen', 30000, 18400, 44), team('t2', 'השגרירים של רמת גן', 'Ramat Gan ambassadors', 'אורי לוי', 'Uri Levi', 25000, 9100, 21), team('t3', 'בוגרי מחזור 2009', 'Class of 2009', 'מיכל מזרחי', 'Michal Mizrahi', 15000, 12600, 37)],
    gallery: [ph('🧺', '#f59e0b', '#ea580c', 'אריזת הסלים', 'Packing baskets'), ph('🚚', '#0e7490', '#22d3ee', 'יום חלוקה', 'Delivery day'), ph('🤝', '#4d7c0f', '#a3e635', 'המתנדבים שלנו', 'Our volunteers')]
  }),
  makeCampaign({
    id: 'gesher-lanoar', category: 'youth', emoji: '🏠', colors: ['#60a5fa', '#6366f1'], theme: 'sky', progressStyle: 'ring',
    name: { he: 'בית חם לנוער בסיכון', en: 'A warm home for at-risk youth' },
    shortName: { he: 'גשר לנוער', en: 'Gesher LaNoar' },
    tagline: { he: 'פותחים מועדונית לילה לבני נוער בשכונות הדרום', en: 'Opening a night club-house for teens in the southern neighborhoods' },
    short: { he: 'מכפילים פי 3! עוזרים לפתוח מועדונית לילה לבני נוער בשכונות הדרום.', en: 'Tripled! Help open a night club-house for teens.' },
    location: { he: 'באר שבע', en: 'Be\'er Sheva' },
    orgName: { he: 'מרכז "גשר לנוער"', en: 'Gesher LaNoar Center' }, orgNumber: '580234567',
    goal: 250000, baseRaised: 90000, baseDonors: 210, multiplier: 3, startH: -10, durH: 36,
    story: {
      he: ['בכל לילה, עשרות בני נוער מסתובבים ברחובות בלי מקום בטוח לחזור אליו.', '"גשר לנוער" פותח מועדונית לילה עם מדריכים, ארוחה חמה ואוזן קשבת.', 'הכסף יממן שנת פעילות מלאה: שכר מדריכים ועובדת סוציאלית, שיפוץ המבנה ותוכנית העשרה.'],
      en: ['Every night, dozens of teens wander the streets with no safe place to go.', 'Gesher LaNoar is opening a night club-house with counselors, a hot meal and a listening ear.', 'The funds cover a full year: counselors, a social worker, renovation and enrichment.']
    },
    milestones: [
      { he: 'איתור מבנה', en: 'Finding a building', date: { he: '', en: '' }, status: 'done' },
      { he: 'גיוס לשנת פעילות', en: 'Raising a year of activity', date: { he: 'עכשיו', en: 'Now' }, status: 'active' },
      { he: 'פתיחת המועדונית', en: 'Opening the club-house', date: { he: '', en: '' }, status: 'todo' }
    ],
    stretch: [{ amount: 320000, he: 'יעד בונוס: הסעות בלילה', en: 'Bonus goal: night transport' }],
    impact: [
      { amount: 36, icon: '🍲', he: 'ארוחה חמה לנער', en: 'A hot meal for a teen' },
      { amount: 180, icon: '📚', he: 'שיעור תגבור שבועי', en: 'A weekly tutoring session' },
      { amount: 500, icon: '🛋️', he: 'ריהוט לפינת השיחה', en: 'Furniture for the talk corner' },
      { amount: 1800, icon: '🧑‍🏫', he: 'חודש של מדריך', en: 'A month of a counselor' }
    ],
    dedications: [
      { id: 'room', icon: '🚪', amount: 25000, total: 3, taken: 0, he: 'חדר במועדונית', en: 'A room in the club-house', descHe: 'שלט הקדשה על דלת החדר.', descEn: 'A dedication sign on the door.' }
    ],
    matchers: [{ name: { he: 'קרן "עתיד לכל ילד"', en: 'A Future for Every Child Fund' }, amount: 120000 }, { name: { he: 'משפחת ברק', en: 'Barak Family' }, amount: 46000 }],
    teams: [team('t1', 'מדריכי התנועה', 'Youth movement counselors', 'דניאל פרץ', 'Daniel Peretz', 20000, 8800, 30), team('t2', 'תיכון "הראל" – שכבת י"ב', 'Harel High School, 12th grade', 'תמר ביטון', 'Tamar Biton', 15000, 11200, 64)],
    gallery: [ph('🏠', '#1d4ed8', '#60a5fa', 'המבנה לפני השיפוץ', 'The building before renovation'), ph('🎸', '#7c3aed', '#c084fc', 'ערב מוזיקה', 'Music night')]
  }),
  makeCampaign({
    id: 'yad-lacholeh', category: 'health', emoji: '🩺', colors: ['#2dd4bf', '#0891b2'], theme: 'stone', progressStyle: 'thick',
    name: { he: 'ציוד רפואי להשאלה בכל עיר', en: 'Medical equipment loans in every city' },
    shortName: { he: 'יד לחולה', en: 'Yad LaCholeh' },
    tagline: { he: 'כיסאות גלגלים, מיטות סיעודיות ומכשירי חמצן – בחינם, למי שצריך', en: 'Wheelchairs, nursing beds and oxygen – free, for anyone in need' },
    short: { he: 'כיסאות גלגלים, מיטות סיעודיות ומכשירי חמצן – בחינם, למי שצריך.', en: 'Wheelchairs, nursing beds and oxygen – free for anyone in need.' },
    location: { he: 'ארצי', en: 'Nationwide' },
    orgName: { he: 'יד לחולה – השאלת ציוד רפואי', en: 'Yad LaCholeh medical equipment loans' }, orgNumber: '580345678', section46: true,
    goal: 500000, baseRaised: 330000, baseDonors: 900, multiplier: 2, startH: -40, durH: 46,
    story: {
      he: ['כשאדם יקר משתחרר מבית חולים, המשפחה צריכה ציוד רפואי מיידי – ולא תמיד יש מאיפה לקנות.', 'הסניפים שלנו משאילים ציוד בחינם, במסירות של מתנדבים.', 'בקמפיין הזה נפתח 4 סניפים חדשים ונרכוש 300 פריטי ציוד.'],
      en: ['When a loved one leaves the hospital, the family needs medical equipment immediately.', 'Our branches lend equipment free of charge, run by devoted volunteers.', 'This campaign opens 4 new branches and buys 300 items.']
    },
    milestones: [
      { he: '12 סניפים פעילים', en: '12 active branches', date: { he: '', en: '' }, status: 'done' },
      { he: 'גיוס ל-4 סניפים חדשים', en: 'Raising for 4 new branches', date: { he: 'עכשיו', en: 'Now' }, status: 'active' }
    ],
    stretch: [{ amount: 650000, he: 'יעד בונוס: סניף חמישי', en: 'Bonus goal: a fifth branch' }],
    impact: [
      { amount: 180, icon: '🦯', he: 'הליכון', en: 'A walker' },
      { amount: 720, icon: '♿', he: 'כיסא גלגלים', en: 'A wheelchair' },
      { amount: 2600, icon: '🛏️', he: 'מיטה סיעודית', en: 'A nursing bed' }
    ],
    dedications: [
      { id: 'branch', icon: '🏥', amount: 90000, total: 4, taken: 1, he: 'סניף חדש', en: 'A new branch', descHe: 'הסניף ייקרא על שמכם.', descEn: 'The branch will bear your name.' }
    ],
    matchers: [{ name: { he: 'קרן "בריאות לכולם"', en: 'Health for All Fund' }, amount: 150000 }, { name: { he: 'משפחת רוזנטל', en: 'Rosenthal Family' }, amount: 70000 }, { name: { he: 'תורם אנונימי', en: 'Anonymous' }, amount: 30000 }],
    teams: [team('t1', 'מתנדבי סניף חיפה', 'Haifa branch volunteers', 'יונתן שלום', 'Yonatan Shalom', 40000, 31000, 80), team('t2', 'מתנדבי סניף ירושלים', 'Jerusalem branch volunteers', 'שירה אזולאי', 'Shira Azoulay', 40000, 42000, 96)],
    gallery: [ph('♿', '#0f766e', '#2dd4bf', 'המחסן בחיפה', 'The Haifa warehouse')]
  }),
  makeCampaign({
    id: 'milga-leatid', category: 'education', emoji: '🎓', colors: ['#a78bfa', '#7c3aed'], theme: 'bordeaux',
    name: { he: 'מלגות לסטודנטים מהפריפריה', en: 'Scholarships for students from the periphery' },
    shortName: { he: 'מלגה לעתיד', en: 'Milga LeAtid' },
    tagline: { he: '150 מלגות לימודים לסטודנטים מהנגב והגליל', en: '150 scholarships for students from the Negev and Galilee' },
    short: { he: 'מעניקים 150 מלגות לימודים לסטודנטים מהנגב והגליל.', en: '150 scholarships for students from the Negev and Galilee.' },
    location: { he: 'נגב וגליל', en: 'Negev & Galilee' },
    orgName: { he: 'קרן "מלגה לעתיד"', en: 'Milga LeAtid Fund' }, orgNumber: '580456789',
    goal: 1800000, baseRaised: 420000, baseDonors: 300, multiplier: 2, startH: -4, durH: 72,
    story: {
      he: ['כישרון מתחלק באופן שווה – הזדמנויות לא.', 'הקרן מעניקה מלגות לסטודנטים מהפריפריה, בתמורה להתנדבות בקהילה שממנה באו.', 'כל מלגה היא ₪12,000 לשנה.'],
      en: ['Talent is distributed equally – opportunity is not.', 'The fund grants scholarships to students from the periphery, in return for volunteering in their home communities.', 'Each scholarship is ₪12,000 a year.']
    },
    milestones: [{ he: 'מיון המועמדים', en: 'Selecting candidates', date: { he: '', en: '' }, status: 'active' }],
    stretch: [],
    impact: [
      { amount: 250, icon: '📖', he: 'ספרי לימוד לסמסטר', en: 'Textbooks for a semester' },
      { amount: 1000, icon: '💻', he: 'מחשב נייד יד שנייה', en: 'A refurbished laptop' },
      { amount: 12000, icon: '🎓', he: 'מלגה שלמה לשנה', en: 'A full one-year scholarship' }
    ],
    dedications: [{ id: 'scholar', icon: '🎓', amount: 12000, total: 150, taken: 41, he: 'מלגה על שמכם', en: 'A named scholarship', descHe: 'המלגה תוענק על שמכם או על שם יקיריכם.', descEn: 'The scholarship is awarded in your name.' }],
    matchers: [{ name: { he: 'קרן משפחת לנדאו', en: 'Landau Family Fund' }, amount: 600000 }, { name: { he: 'בוגרי התוכנית', en: 'Program alumni' }, amount: 300000 }],
    teams: [team('t1', 'בוגרי מחזור א\'', 'First cohort alumni', 'איתי דהן', 'Itai Dahan', 60000, 22000, 40)],
    gallery: [ph('🎓', '#6d28d9', '#a78bfa', 'טקס הענקת המלגות', 'Scholarship ceremony')]
  }),
  makeCampaign({
    id: 'kaf-regel', category: 'animals', emoji: '🐾', colors: ['#34d399', '#0e9f6e'], theme: 'olive', progressStyle: 'thermo',
    name: { he: 'בית חדש לכלבים ולחתולים', en: 'A new home for dogs and cats' },
    shortName: { he: 'כף רגל', en: 'Kaf Regel' },
    tagline: { he: 'בונים מתחם וטרינרי חדש במקלט ומאמצים 500 חיות השנה', en: 'Building a new veterinary compound and finding homes for 500 animals' },
    short: { he: 'בונים מתחם וטרינרי חדש במקלט ומאמצים 500 חיות השנה.', en: 'A new vet compound and 500 adoptions this year.' },
    location: { he: 'השרון', en: 'Sharon region' },
    orgName: { he: 'מקלט "כף רגל"', en: 'Kaf Regel Shelter' }, orgNumber: '580567890',
    goal: 200000, baseRaised: 0, baseDonors: 0, multiplier: 2, startH: 72, durH: 36,
    story: { he: ['במקלט שלנו חיים כיום יותר מ-200 כלבים וחתולים. המתחם הישן צפוף, והמרפאה קטנה מדי.', 'הקמפיין יממן מתחם חדש עם מרפאה, חצרות ריצה ופינת אימוץ.'], en: ['Our shelter is home to over 200 dogs and cats. The old compound is crowded and the clinic too small.', 'This campaign funds a new compound with a clinic, run yards and an adoption corner.'] },
    milestones: [{ he: 'תכנון המתחם', en: 'Planning the compound', date: { he: '', en: '' }, status: 'active' }],
    stretch: [],
    impact: [{ amount: 100, icon: '🦴', he: 'מזון לחודש לכלב', en: 'A month of food for a dog' }, { amount: 400, icon: '💉', he: 'חיסונים ועיקור', en: 'Vaccines and spaying' }],
    dedications: [], matchers: [{ name: { he: 'רשת "חיות בכיף"', en: 'Happy Pets chain' }, amount: 60000 }, { name: { he: 'משפחת גל', en: 'Gal Family' }, amount: 40000 }],
    teams: [team('t1', 'מתנדבי סוף השבוע', 'Weekend volunteers', 'הדס פרידמן', 'Hadas Friedman', 15000, 0, 0)],
    gallery: [ph('🐕', '#15803d', '#4ade80', 'החצר הישנה', 'The old yard')]
  }),
  makeCampaign({
    id: 'kehila-mechabeket', category: 'community', emoji: '👵', colors: ['#fca5a5', '#f59e0b'], theme: 'bordeaux',
    name: { he: 'מרכז קהילתי לקשישים', en: 'A community center for seniors' },
    shortName: { he: 'קהילה מחבקת', en: 'Kehila Mechabeket' },
    tagline: { he: 'מרכז יום לקשישים בודדים בשכונת נווה שאנן', en: 'A day center for lonely seniors in Neve Sha\'anan' },
    short: { he: 'הקמפיין הסתיים בהצלחה – תודה לכל התורמים!', en: 'The campaign ended successfully – thank you!' },
    location: { he: 'תל אביב', en: 'Tel Aviv' },
    orgName: { he: 'עמותת "קהילה מחבקת"', en: 'Kehila Mechabeket (R.A.)' }, orgNumber: '580678901',
    goal: 150000, baseRaised: 177000, baseDonors: 610, multiplier: 2, startH: -24 * 8, durH: 48,
    story: { he: ['בזכותכם נפתח מרכז יום לקשישים בודדים בשכונת נווה שאנן, עם ארוחות, חוגים וליווי רפואי.'], en: ['Thanks to you, a day center for lonely seniors opened in Neve Sha\'anan, with meals, classes and medical support.'] },
    milestones: [{ he: 'פתיחת המרכז', en: 'Opening the center', date: { he: '', en: '' }, status: 'done' }],
    stretch: [], impact: [{ amount: 72, icon: '🍽️', he: 'ארוחת צהריים לשבוע', en: 'A week of lunches' }],
    dedications: [], matchers: [{ name: { he: 'קרן "דור לדור"', en: 'Dor LeDor Fund' }, amount: 75000 }],
    teams: [team('t1', 'המתנדבים הוותיקים', 'Veteran volunteers', 'אליהו אברהם', 'Eliyahu Avraham', 30000, 36000, 120)],
    gallery: [ph('👵', '#be123c', '#fda4af', 'יום הפתיחה', 'Opening day')]
  })
];
