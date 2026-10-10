// מוודא שלכל תמונה רישיון מרשימת המותרים. ראו "רישיונות תמונות — כללים מחייבים" ב-CLAUDE.md.
//
// מותר: CC BY (כל גרסה), CC0, נחלת הכלל, יצירות של ממשלת ארה"ב.
// אסור: כל רישיון עם NC / ND / SA, או בלי רישיון מפורש.
import { loadCases, report } from './lib/load-cases.mjs';

// מזהים קנוניים (בסגנון SPDX) שמותר לכתוב ב-source.license
const ALLOWED = [
  /^CC-BY-(1\.0|2\.0|2\.5|3\.0|4\.0)$/,
  /^CC0-1\.0$/,
  /^Public-Domain$/,  // נחלת הכלל (למשל זכויות שפקעו) — לתעד את הנימוק ב-modifications או בהערה
  /^US-Gov-PD$/,      // יצירה של עובד ממשלת ארה"ב במסגרת עבודתו
];
const FORBIDDEN = /(^|[-\s])(NC|ND|SA)([-\s]|$)/i;

const errors = [];
let count = 0;

for (const { file, data, error } of loadCases()) {
  if (error) continue; // validate-cases מדווח על JSON שבור
  for (const im of data.images ?? []) {
    count++;
    const where = `${file} → ${im.file ?? '?'}`;
    const license = im.source?.license?.trim();
    if (!license) { errors.push(`${where}: אין רישיון`); continue; }
    if (FORBIDDEN.test(license)) {
      errors.push(`${where}: "${license}" כולל NC/ND/SA — אסור לפי מדיניות האתר`);
      continue;
    }
    if (!ALLOWED.some((re) => re.test(license))) {
      errors.push(`${where}: "${license}" לא ברשימת המותרים (CC-BY-x.x, CC0-1.0, Public-Domain, US-Gov-PD)`);
    }
  }
}

report('בדיקת רישיונות', errors, `${count} תמונות עם רישיון מותר`);
