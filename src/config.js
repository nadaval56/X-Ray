// הגדרות אתר מרוכזות. שם האתר והדומיין טרם נקבעו — זה ה-placeholder היחיד.
// הקובץ נטען גם ב-Node (vite.config.js) וגם בדפדפן, ולכן אין בו API של דפדפן.

export const SITE = {
  name: 'רנטגן',            // TODO: שם סופי
  tagline: 'לראות מבפנים',  // TODO: לאשר
  domain: 'example.org',    // TODO: דומיין
  // כתובת האתר החי (לקישורים מלאים ב-sitemap וב-Open Graph). TODO: לעדכן כשייקבע דומיין.
  url: 'https://nadaval56.github.io/X-Ray/',
  // מציג תגית "טיוטה" על תוכן שעדיין לא עבר עריכה סופית
  showDraftBadges: true,
};

export const NAV = [
  { href: 'cases.html', label: 'מקרים', pages: ['cases', 'case'] },
  { href: 'physics.html', label: 'איך זה עובד', pages: ['physics'] },
  { href: 'lab.html', label: 'מעבדה', pages: ['lab', 'lab-attenuation', 'lab-density', 'lab-window', 'lab-shadows', 'lab-dose'] },
  { href: 'history.html', label: 'היסטוריה', pages: ['history'] },
  { href: 'about.html', label: 'אודות', pages: ['about'] },
];

export const DISCLAIMER =
  'האתר נועד ללמידה בלבד ואינו כלי אבחון. אין להסתמך עליו להחלטות רפואיות — בכל שאלה רפואית יש לפנות לרופא.';
