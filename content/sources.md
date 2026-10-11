# מקורות לטענות ולמספרים באתר

כל מספר או טענה עובדתית באתר צריכים מקור כאן או בהערה בקוד. מה שעדיין לא אומת מסומן `TODO: לאמת`.

## מקדמי בליעה (סימולטור הבליעה)

מקור: NIST, *X-Ray Mass Attenuation Coefficients* (J. H. Hubbell & S. M. Seltzer), Standard Reference Database 126.
https://physics.nist.gov/PhysRefData/XrayMassCoef/ — אומת מול הטבלאות ב-2026-10-10.

ערכי μ/ρ באנרגיה 60 keV (עמודה ראשונה בטבלה), וצפיפות מטבלה 1 / טבלה 2:

| חומר | שם ב-NIST | μ/ρ ‏(cm²/g) | ρ ‏(g/cm³) | μ ‏(1/cm) |
|---|---|---|---|---|
| אוויר | Air, Dry (near sea level) | 0.1875 | 0.001205 | 0.000226 |
| שומן | Adipose Tissue (ICRU-44) | 0.1974 | 0.95 | 0.188 |
| מים | Water, Liquid | 0.2059 | 1.000 | 0.206 |
| עצם | Bone, Cortical (ICRU-44) | 0.3148 | 1.92 | 0.604 |
| מתכת | Iron (Z=26) | 1.205 | 7.874 | 9.49 |

**הערות לעורך:**
- 60 keV נבחר כאנרגיה אחת לשם פשטות. קרן אבחנתית אמיתית היא ספקטרום רציף, ולכן המספרים בסימולטור מקורבים. סדר החומרים (אוויר < שומן ≈ מים < עצם < מתכת) נשמר.
- גוון האפור בסימולטור מוצג כ-(1 − I/I₀). תגובת גלאי אמיתית אינה ליניארית, אבל הכיוון נכון. מתועד ב-`src/components/attenuation-sim.js`.

## עמוד "איך זה עובד"

- "קרינת רנטגן היא קרינה אלקטרומגנטית עם אנרגיה גבוהה מאור נראה". TODO: לצטט מקור כללי (למשל NASA או NIBIB).
- "עצם בולעת יותר כי היא צפופה יותר ומכילה אטומים כבדים יותר (סידן)". TODO: לצטט מקור. הנתונים ב-NIST תומכים בכך שה-μ גבוה יותר.
- "שכבה עבה של מים בולעת בערך כמו שכבה דקה של עצם": נגזר מהטבלה למעלה. ‎1 ס״מ עצם ≈ 2.9 ס״מ מים.

## מקרים

העובדות הקליניות בכל מקרה לקוחות מהמאמר או מהפריט שבשדה `source` של התמונה הראשית. הסיפורים נכתבו מחדש עם שמות בדויים.
טענות כלליות שאינן מהמקור מסומנות `TODO: לאמת` בשדה `editorNotes` של המקרה.

| מקרה | מקור | רישיון (אומת במקור) |
|---|---|---|
| coin-swallowed-01 | PMC9445681 (Braz J Otorhinolaryngol 2006) | CC BY 4.0 — תגית license ב-XML של המאמר |
| aluminum-coin-01 | PMC3418023 (APSP J Case Rep 2011) | CC BY 3.0 |
| double-coin-01 | PMC2740069 (Cases J 2009) | CC BY 3.0 |
| buckle-fracture-01 | PMC9337257 (Pediatr Qual Saf 2022) | CC BY 4.0 |
| metacarpal-fracture-01 | PMC3151220 (J Orthop Surg Res 2011) | CC BY 2.0 |
| growing-hands-01 | PMC12457598 (Sci Rep 2025) | CC BY 4.0 |
| knee-growth-01 | Wikimedia Commons, אוסף Bonepit (UC San Diego Health) | PD-US-Medical imaging + אישור VRT |
| mixed-teeth-01 | PMC5227130 (Case Rep Dent 2016) | CC BY 4.0 |
| extra-tooth-01 | PMC4306249 (Case Rep Dent 2015) | CC BY 3.0 |
| snake-meal-01 | Wellcome Collection ee3ptpxe (Schuster, 1896) | Public Domain Mark |
| frog-healed-leg-01 | Wellcome Collection shuarr4t (Schuster, 1896) | Public Domain Mark |
| seahorse-01 | Wikimedia Commons, Smithsonian NMNH | PD-USGov-SI |
| compass-01 | Wellcome Collection q3kvkvak (Röntgen, 1895) | Public Domain Mark |
| door-plate-01 | Wellcome Collection w6y7a4mj (Röntgen) | CC BY 4.0 |

### מקורות שנבדקו ונפסלו
- **Wellcome V0029523** (יד עם טבעת, רנטגן) — ב-Commons מסומן נחלת הכלל, אבל ב-Wellcome עצמו CC BY-NC. לא בשימוש.
- **The Met, Eder & Valenta 1896** — ב-Commons מסומן CC0, אבל ב-API של המוזיאון `isPublicDomain: false`. לא בשימוש.
- **PMC4098608** (שבר בעצם הבריח) — המקרה כולל פגיעה עצבית; לא "רך". לא בשימוש.
- **PMC11420328** (שבר ענף ירוק) — המקרה הסתיים בשבר חוזר וניתוח; לא ניתן לכתוב סיום רגוע בלי לסטות מהמקור. לא בשימוש.

## ציר הזמן (content/timeline.json)

כל אירוע עם קישור למקור בקובץ. נבדק ב-2026-10-10:
- 8.11.1895, היד של אשת רנטגן — NobelPrize.org, Röntgen Biographical.
- פרס נובל 1901 — NobelPrize.org, Physics 1901 summary.
- מארי קירי: 20 תחנות ניידות, 200 קבועות, הכשרת כ-150 נשים — American Institute of Physics, Marie Curie exhibit.
- מכשירי רנטגן בחנויות נעליים: הוצג ב-1920, נפוץ בשנות ה-30 עד ה-50, פנסילבניה אסרה ב-1957 — ORAU Museum.
- Franklin & Gosling, Nature 171, 25.4.1953. **TODO: לאמת** את הכינוי "תצלום 51" ואת מועד הצילום (1952).
- ג׳קוני, יוני 1962, נובל 2002 — NobelPrize.org, Physics 2002 popular information.
- צ׳נדרה, 23.7.1999 — NASA.

### תמונות בציר הזמן

כל תמונה עם אובייקט `source` מלא ב-`content/timeline.json`; הרישיון נבדק במוסד המקורי (2026-10-11):
- Wellcome Collection: שפופרת קרוקס, דפוס פיזור (CC BY 4.0); ידיים וכף רגל של שוסטר (Public Domain Mark).
- ספריית הקונגרס: קריקטורה מ-1896, דיוקן רנטגן (אוסף Bain), רכב רנטגן של הצלב האדום מ-1918. כולם מסומנים שם "No known restrictions on publication" ונוצרו לפני 1931 — לכן סומנו נחלת הכלל. לאשר שזה מקובל עלינו.
- רקטת Aerobee: חיל האוויר האמריקאי (PD-USGov, דף הקובץ ב-Commons). צ׳נדרה, קסיופאה A: NASA (נחלת הכלל).
- **לא נמצאו תמונות חופשיות** של מכשיר רנטגן מחנות נעליים (כל התמונות ב-Commons הן CC BY-SA) ושל "תצלום 51" עצמו. במקומן יש תמונות קרובות, והכיתוב אומר זאת במפורש.

## סרגל הקרינה (content/doses.json)

כל המנות מ-RadiologyInfo.org (ACR ו-RSNA), כולל ההשוואה לימים של קרינת רקע. קרינת רקע: כ-3 mSv בשנה (ממוצע בארה"ב, לפי אותו מקור).
**TODO:** מנה בטיסה — לא נמצא מקור רשמי נגיש (דף ה-CDC חסום); לא מוצגת עד שיימצא מקור.
