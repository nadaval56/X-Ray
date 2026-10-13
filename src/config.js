// הגדרות אתר מרוכזות. שם האתר טרם נקבע סופית — זה ה-placeholder היחיד.
// הקובץ נטען גם ב-Node (vite.config.js) וגם בדפדפן, ולכן אין בו API של דפדפן.

export const SITE = {
  name: 'רנטגן',            // TODO: שם סופי
  tagline: 'לראות מבפנים',  // TODO: לאשר
  domain: 'roentgen.co.il',
  // כתובת האתר החי (לקישורים מלאים ב-sitemap וב-Open Graph). הדומיין מוגדר ב-GitHub Pages ובקובץ public/CNAME.
  url: 'https://roentgen.co.il/',
};

// icon: תוכן ה-SVG (viewBox 0 0 36 36), אותם אייקונים כמו בקוביות בעמוד הבית. מוצג רק בתפריט הנפתח בנייד.
export const NAV = [
  { href: 'cases.html', label: 'התיקים', pages: ['cases', 'case'],
    icon: '<rect x="5" y="4" width="26" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 12.5l9 11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="13" r="2.2" fill="currentColor"/><circle cx="14.5" cy="10.5" r="2.2" fill="currentColor"/><circle cx="21.5" cy="25.5" r="2.2" fill="currentColor"/><circle cx="24" cy="23" r="2.2" fill="currentColor"/>' },
  { href: 'physics.html', label: 'איך זה עובד', pages: ['physics'],
    icon: '<ellipse cx="18" cy="18" rx="14" ry="5.5" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="18" cy="18" rx="14" ry="5.5" transform="rotate(60 18 18)" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="18" cy="18" rx="14" ry="5.5" transform="rotate(-60 18 18)" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="18" cy="18" r="2.5" fill="currentColor"/>' },
  { href: 'lab.html', label: 'המעבדה', pages: ['lab', 'lab-thickness', 'lab-scanner', 'lab-window', 'lab-shadows', 'lab-dose'],
    icon: '<path d="M14 4h8M15 4v10L6 29a2 2 0 0 0 1.7 3h20.6a2 2 0 0 0 1.7-3L21 14V4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.5 23h15l3 5.5H7.5z" fill="currentColor" opacity=".5"/>' },
  { href: 'history.html', label: 'היסטוריה', pages: ['history'],
    icon: '<path d="M9 4h18M9 32h18M11 4c0 8 7 10 7 14s-7 6-7 14M25 4c0 8-7 10-7 14s7 6 7 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 30c1-3 5-5 5-8 0 3 4 5 5 8z" fill="currentColor" opacity=".6"/>' },
  { href: 'sky.html', label: 'רנטגן בחלל', pages: ['sky'],
    icon: '<path d="M15 6l2.2 6.8L24 15l-6.8 2.2L15 24l-2.2-6.8L6 15l6.8-2.2z" fill="currentColor"/><path d="M27 21l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="currentColor" opacity=".6"/><circle cx="28" cy="8" r="1.5" fill="currentColor" opacity=".6"/>' },
  { href: 'about.html', label: 'אודות', pages: ['about'],
    icon: '<circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M18 16v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="11.5" r="1.6" fill="currentColor"/>' },
];

// כלי המעבדה, לפי הסדר — לתפריט המעבדה ולמעבר "הקודם / הבא" בעמודי הכלים
export const LAB = [
  { page: 'lab-thickness', label: 'כמה עובי צריך?' },
  { page: 'lab-scanner', label: 'סורק מזוודות' },
  { page: 'lab-window', label: 'בהירות וניגודיות' },
  { page: 'lab-shadows', label: 'צורה וצל' },
  { page: 'lab-dose', label: 'סרגל קרינה' },
];

// שורה קצרה בפוטר, שמקשרת להבהרה המלאה בעמוד אודות (about.html#medical).
export const DISCLAIMER = 'ללימוד בלבד, לא לאבחון רפואי';

// פס "עוד אתרים שלי" בתחתית כל עמוד — אותו פס כמו בשאר האתרים של נדב (geniza-explorer, RATA).
// קישורים בלבד: שום דבר לא נטען מהאתרים האלה. [אימוג'י, כתובת, טקסט הקישור, המשך שאינו קישור]
// הפריט הראשון הוא הזמנה לקבוצת הווטסאפ (מודגש).
export const SISTER_INVITE = 'https://chat.whatsapp.com/JPkp1hyk4J938apVTFu6J1';
export const SISTER_SITES = [
  ['🔭', SISTER_INVITE, 'קבוצת ווטסאפ · עדכוני אסטרונומיה יומיים (קבוצה שקטה)', ''],
  ['☀️', 'https://sunspots.co.il/', 'השמש היום · כתמי שמש בזמן אמת', ''],
  ['📜', 'https://geniza.co.il/', 'הגניזה הקהירית', ''],
  ['🛠️', 'https://making-il.co.il/', 'מייקינג', ' · יצירה טכנולוגית'],
  ['💶', 'https://banknote.co.il/', 'Banknote · שטרות ומטבעות', ''],
  ['🛩️', 'https://dronexam.co.il/', 'לעוף לשמיים · מבחן רת"א לרחפנים', ''],
  ['🌱', 'https://holisticcenter.co.il/', 'מעט צרי · רפואה משלימה', ''],
  ['🛸', 'https://pursue.co.il/', 'PURSUE · ארכיון עב"מים', ''],
  ['🌍', 'https://quake.co.il/', 'רעידת אדמה · רעידות היסטוריות', ''],
  ['📅', 'https://heb-cal.co.il/', 'לוח עברי', ''],
];
