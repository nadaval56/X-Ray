// הגדרות אתר מרוכזות. שם האתר והדומיין טרם נקבעו — זה ה-placeholder היחיד.
// הקובץ נטען גם ב-Node (vite.config.js) וגם בדפדפן, ולכן אין בו API של דפדפן.

export const SITE = {
  name: 'רנטגן',            // TODO: שם סופי
  tagline: 'לראות מבפנים',  // TODO: לאשר
  domain: 'example.org',    // TODO: דומיין
  // כתובת האתר החי (לקישורים מלאים ב-sitemap וב-Open Graph). TODO: לעדכן כשייקבע דומיין.
  url: 'https://nadaval56.github.io/X-Ray/',
};

export const NAV = [
  { href: 'cases.html', label: 'מקרים', pages: ['cases', 'case'] },
  { href: 'physics.html', label: 'איך זה עובד', pages: ['physics'] },
  { href: 'lab.html', label: 'מעבדה', pages: ['lab', 'lab-thickness', 'lab-scanner', 'lab-window', 'lab-shadows', 'lab-dose'] },
  { href: 'history.html', label: 'היסטוריה', pages: ['history'] },
  { href: 'sky.html', label: 'השמיים', pages: ['sky'] },
  { href: 'about.html', label: 'אודות', pages: ['about'] },
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
