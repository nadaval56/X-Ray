# אתר רנטגן לימודי

אתר סטטי בעברית על צילומי רנטגן, בנוי סביב סיפורי מקרה. ההנחיות המלאות ב-[`CLAUDE.md`](./CLAUDE.md).

## הרצה

```bash
npm install
npm run dev        # שרת פיתוח עם רענון חי
npm run build      # בדיקת מקרים + בדיקת רישיונות + build ל-dist/
npm run preview    # הצגת ה-build
```

התלות היחידה היא [Vite](https://vite.dev) (כלי פיתוח בלבד), ומשמשת ל-build של כמה עמודים ולטעינת קובצי ה-JSON של המקרים.

## מבנה

```
*.html                    עמודים (index, cases, case, physics, history, about, lab, lab-*)
src/config.js             שם האתר (placeholder), ניווט והבהרה רפואית. במקום אחד
src/partials/             head, כותרת ופוטר משותפים, מוזרקים בזמן build
src/components/           רכיבים עצמאיים: hotspot, compare, attenuation-sim, bag-scanner, window-level, shadow-rotator, radiation-ruler, timeline, credits
src/pages/                קוד לכל עמוד
src/styles/main.css       מערכת העיצוב (tokens בראש הקובץ)
content/cases/*.json      מקרים, אחד לכל קובץ
content/categories.json   קטגוריות ושמותיהן בעברית
content/principles.json   עקרונות, עם קישור לעמוד ההסבר
content/materials.json    מקדמי בליעה לסימולטור (NIST)
content/media.json        תמונות שאינן חלק ממקרה (עמודי הסבר)
content/timeline.json     ציר הזמן, עם מקור לכל אירוע
content/doses.json        מנות קרינה לסרגל הקרינה, עם מקור
content/sources.md        מקורות לכל מספר וטענה
public/images/cases/      תמונות המקרים (WebP)
assets-src/originals/     קבצים מקוריים. לא נכנסים ל-build
scripts/                  validate-cases, check-licenses
```

## צינור תוכן

```bash
# חיפוש מועמדים. לא מוריד תמונות; מפיק רשימה לבדיקה ידנית ב-assets-src/candidates/
node scripts/find-candidates.mjs --source openi   --query "esophageal coin" --n 25
node scripts/find-candidates.mjs --source commons --query "Category:X-rays of fish" --n 50

# ייבוא תמונה שנבחרה: שומר את המקור, חותך או מסתיר, וממיר ל-WebP (דורש Python 3 + Pillow)
python3 scripts/import_image.py <url> <name> [--crop L,T,R,B] [--mask L,T,R,B] [--gray]
```

- ב-Open-i השאילתה מתאימה כביטוי שלם ("esophageal coin", לא "coin esophagus").
- הרישיון של מועמד מ-Open-i נבדק מול תגית ה-`license` ב-XML של המאמר ב-PMC. את הקבצים עצמם עדיף להוריד מ-[PMC Open Access ב-AWS](https://pmc-oa-opendata.s3.amazonaws.com/), שבו יש גם את התמונות ברזולוציה מלאה.
- Wikimedia מגביל קצב בקשות; הסקריפטים מחכים ומנסים שוב.
- גם כשהכלי אומר "מותר", בודקים בעין את עמוד המקור. בשני מקרים Commons סתר את המוסד המקורי (ראו `content/sources.md`).

## הוספת מקרה

1. שמים תמונה ב-`public/images/cases/` (WebP, ברוחב של עד 1600px), ואת המקור ב-`assets-src/originals/`.
2. יוצרים `content/cases/<id>.json` לפי הסכמה ב-`CLAUDE.md`. שם הקובץ זהה ל-`id`.
3. מריצים `npm run validate && npm run check-licenses`.

זהו. לא צריך לגעת בקוד: המקרה מופיע ברשימה, בעמוד משלו (`case.html?id=<id>`) ובקרדיטים.

### שדות רשות מעבר לסכמה
- `draft: true` — מציג תגית "טיוטה" (כל עוד `showDraftBadges` פעיל ב-`src/config.js`).
- `editorNotes` — הערות לעורך, מוצגות בעמוד המקרה כשהטיוטות מוצגות.
- `hint` — רמז שמוצג אחרי ניחוש שגוי.
- `images[].placeholder: true` — איור שיצרנו בעצמנו. רק איור כזה רשאי להיות SVG.
- `images[].caption` — כיתוב מתחת לתמונה.
- `images[].showIn` — לתמונות `second-view`: `"reveal"` (ברירת מחדל) או `"outcome"`.

### מזהי רישיון מותרים (`source.license`)
`CC-BY-1.0` … `CC-BY-4.0`, ‏`CC0-1.0`, ‏`Public-Domain`, ‏`US-Gov-PD`. כל רישיון אחר, או רישיון שכולל NC, ND או SA, מכשיל את ה-build.
