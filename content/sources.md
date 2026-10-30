# מקורות לטענות ולמספרים באתר

כל מספר או טענה עובדתית באתר צריכים מקור כאן או בהערה בקוד. מה שעדיין לא אומת מסומן `TODO: לאמת`.

## מקדמי בליעה (הכלי "כמה עובי צריך?")

מקור: NIST, *X-Ray Mass Attenuation Coefficients* (J. H. Hubbell & S. M. Seltzer), Standard Reference Database 126.
https://physics.nist.gov/PhysRefData/XrayMassCoef/ — אומת מול הטבלאות ב-2026-10-13. הקישור לכל טבלה נמצא ב-`content/materials.json`.

ערכי μ/ρ באנרגיה 60 keV, וצפיפות מטבלה 1 / טבלה 2. ‏μ = (μ/ρ)·ρ:

| חומר | שם ב-NIST | μ/ρ ‏(cm²/g) | ρ ‏(g/cm³) | μ ‏(1/cm) |
|---|---|---|---|---|
| זהב | Gold (Z=79) | 4.528 | 19.32 | 87.5 |
| עופרת | Lead (Z=82) | 5.021 | 11.35 | 57.0 |
| נחושת | Copper (Z=29) | 1.593 | 8.96 | 14.3 |
| פלדה | Iron (Z=26) | 1.205 | 7.874 | 9.49 |
| אלומיניום | Aluminum (Z=13) | 0.2778 | 2.699 | 0.750 |
| עצם | Bone, Cortical (ICRU-44) | 0.3148 | 1.92 | 0.604 |
| שריר | Muscle, Skeletal (ICRU-44) | 0.2048 | 1.05 | 0.215 |
| מים | Water, Liquid | 0.2059 | 1.000 | 0.206 |
| שומן | Adipose Tissue (ICRU-44) | 0.1974 | 0.95 | 0.188 |
| אוויר | Air, Dry (near sea level) | 0.1875 | 0.001205 | 0.000226 |

החישוב: שתי שכבות עוצרות אותה כמות קרינה כאשר μ₁·x₁ = μ₂·x₂. דוגמה: ‏1 מ״מ פלדה ≈ 4.4 ס״מ שריר ≈ 1.6 ס״מ עצם ≈ 0.17 מ״מ עופרת ≈ 42 מטר אוויר. דרך 1 מ״מ פלדה עוברים כ-39% מהקרינה.

**הערות לעורך:**
- 60 keV נבחר כאנרגיה אחת לשם פשטות. קרן אבחנתית אמיתית היא ספקטרום רציף, והחומרים הכבדים (עופרת, זהב) רגישים במיוחד לאנרגיה, ולכן היחסים במכשיר אמיתי שונים. הסדר בין החומרים נשמר. כתוב בעמוד.
- "פלדה" מחושבת כברזל טהור. "עצם" היא עצם קורטיקלית (הקשה).
- גוון האריחים מוצג כ-(1 − I/I₀). תגובת גלאי אמיתית אינה ליניארית, אבל הכיוון נכון. מתועד ב-`src/components/thickness-equiv.js`.

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
| pneumonia-01 | PMC12576348 (Cureus 2025) | CC BY 4.0 — בעמוד המאמר ב-PMC. הוסר עיגול שצויר סביב הממצא |
| pacemaker-01 | PMC8887692 (Cureus 2022) | CC BY 3.0 — בעמוד המאמר ב-PMC |

- דלקת ריאות, "שקיקי האוויר מתמלאים בנוזל": NHLBI, "Pneumonia" — "It causes the air sacs, or alveoli, of the lungs to fill up with fluid or pus." https://www.nhlbi.nih.gov/health/pneumonia (נבדק 2026-10-13).
- הרעיון לתיק הקוצב ("בלע נגן mp3?") של נדב. חיפשנו צילום אחד שבו גם קוצב וגם דלקת ריאות, ולא נמצא ברישיון מותר: PMC4921173 (דלקת ריאות שמוסתרת מאחורי ICD) הוא CC BY-NC-ND; ‏PMC9314221 ו-PMC6764542 הם NC; ב-PMC7864261 (CC BY) יש גם דקסטרוקרדיה, כלומר עיקרון נוסף. צילום הקוצב "X-ray of pacemaker with right atrial and ventricular lead.jpg" מסומן ב-Commons כ-CC BY, אבל המאמר המקורי (PMC4286824) הוא CC BY-NC-SA. נפסל.

### טענות כלליות בתיקים (נבדק 2026-10-15)
- **compass-01**, רנטגן גילה את הקרניים בווירצבורג: University of Würzburg, University Archives, "Wilhelm Conrad Röntgen" — "In 1888 Röntgen decided to return to Würzburg, to work as an ordinary professor for physics", "Röntgen made the discovery of the X-rays on the 8th of November 1895". https://www.uni-wuerzburg.de/en/uniarchiv/personalities/eminent-scholars/wilhelm-conrad-roentgen/
- **extra-tooth-01**, צילום פנורמי: MedlinePlus, "Dental x-rays" — "Requires a special machine that rotates around the head. The x-ray captures all of the jaws and teeth in one shot." https://medlineplus.gov/ency/article/003801.htm
- **growing-hands-01**, לוחות גדילה: KidsHealth (Nemours), "Growth Plates" — לוחות הגדילה נמצאים ליד קצות העצמות הארוכות, מתקשים בהדרגה לעצם מלאה ("closed growth plate") בסוף ההתבגרות, "For girls, this usually is when they're 13–15; for boys, it's when they're 15–17." https://kidshealth.org/en/parents/growth-plates.html. המראה הכהה בצילום: KidsHealth, "X-Ray Exam: Bone Age Study" — "they're softer and contain less mineral, making them appear darker on an X-ray image than the rest of the bone." https://kidshealth.org/en/parents/xray-bone-age.html. בעקבות זה תוקן נוסח העיקרון (היה "סחוס בולע קרינה כמו רקמה רכה").
- **mixed-teeth-01**, אמייל: Young MF. "Skeletal biology: Where matrix meets mineral." Matrix Biology 2016;52–54:1–6 — "tooth enamel is the hardest and most highly mineralized tissue in the body", ‏96% מינרל. https://pmc.ncbi.nlm.nih.gov/articles/PMC5524450/
- **seahorse-01**, סוסון ים הוא דג: NOAA, Hawaiian Islands Humpback Whale National Marine Sanctuary, דף פעילות "Sea Horses" — "Sea horses are actually fish and have gills that they use to breathe", וסנפירים קטנים ליד הראש לשם היגוי. https://www.librarieshawaii.org/wp-content/uploads/2021/06/09_NOAA-Activities_Seahorses.pdf. ‏National Geographic Kids, "Seahorse" — "Seahorses are tiny fishes", "Tiny, spiny plates cover seahorses' bodies". https://kids.nationalgeographic.com/animals/fish/facts/seahorse

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
- Franklin & Gosling, Nature 171, 25.4.1953. הכינוי "תצלום 51" והשנה שבה צולם (1952) — אומתו (2026-10-12) מול שני מאמרים בביקורת עמיתים: Ciurea et al., J Med Life 2024 (PMC11282898) ו-Attar, Genome Biology 2013 (PMC3663117, ראיון עם גוסלינג).
  התאריך המדויק "2 במאי 1952" **לא** הוכנס: המקור היחיד שנמצא לו (Acta Cryst A, PMC13325185) מצטט את ויקיפדיה, ובארכיון המסמכים של פרנקלין ב-NLM הוא לא מופיע.
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

## סורק המזוודות (content/scanner.json)

- הצילומים: COMPASS-XP, ‏Griffin, Caldwell & Andrews, ‏UCL, ‏2019. https://zenodo.org/records/2654887 —
  רישיון CC BY 4.0, נבדק ב-Zenodo וב-Read Me של המאגר ("may be freely used for research and commercial purpose, including derivative works, providing the source is acknowledged"), 2026-10-12.
  הסורק: Gilardoni FEP ME 536, סורק דו-אנרגטי לדואר וחבילות. העיבוד: scripts/import_compass.py.
- הצבעים: Rapiscan Systems, "Dual-energy transmission X-ray": "Organic materials are orange, mixed materials are green, and metallic is blue."
  https://rapiscansystems.com/en/technologies/dual-energy-transmission-x-ray — צביעה לפי אומדן המספר האטומי משתי אנרגיות.
  וגם: Liang et al., arXiv:1912.06329 (2019). שיטת הצבעים משתנה מעט בין יצרנים.
- "הפוך מבית חולים": בצילומי האפור של המאגר הרקע בהיר וחומר שבולע הרבה כהה — נראה ישירות בצילומים שבאתר.
- התיאורים הקצרים של כל חפץ נכתבו לפי מה שנראה בצילומים עצמם.

## שיקוף דואר (עמוד סורק המזוודות)

- מכתבי נפץ בשנות ה-70: בספטמבר 1972 נשלחו מאמסטרדם עשרות מכתבי נפץ לנציגויות ישראליות בעולם (ארגון "ספטמבר השחור").
  https://en.wikipedia.org/wiki/Killing_of_Ami_Shachori ; https://en.wikipedia.org/wiki/List_of_attacks_against_Israeli_diplomatic_missions_and_personnel
- העברת דואר ברנטגן בשנות ה-70 וחותמות "נבדק": Ben Marks, "You've Got Mail Bombs", Collectors Weekly, 2015-10-16 —
  דואר נכנס למעבדה הלאומית אוק רידג' נבדק ברנטגן ב-1973; מכתב לנשיא ישראל זלמן שז"ר עם סימן שיקוף; ומכתבים למקומות רגישים כמו אוק רידג' עוברים גם היום מכונת רנטגן לפני שהם מגיעים לנמענים.
  https://www.collectorsweekly.com/articles/?p=64878
- המעטפה מ-1990 עם חותמת "שוקף" (מכתב רשום למשרד הביטחון): מהאוסף של נדב אלשיך, מאותה כתבה. שם הנמען הוסתר.
- המעטפה מ-1974 ("THIS MAIL WAS X-RAYED"): מהאוסף של נדב אלשיך, מתוך הכתבה "דואר X: כשהמכתבים שלך כבר לא פרטיים" (banknote.co.il, 2024-11-20). שם הנמען הוסתר.
- אחרי התקפות האנתרקס ב-2001, דואר למשרדי ממשל בארה"ב עובר הקרנה (להשמדת חיידקים — זה לא צילום). לא מוזכר באתר, רק לידיעת העורך.

## רנטגן בחלל (content/sky.json, content/sun.json)

- התמונות: מצפה הרנטגן צ'נדרה, https://chandra.harvard.edu/photo/ — "For Chandra content, no claim to copyright is being asserted and the material may be used in accordance with NASA guidelines", אבל "multiwavelength images with non-NASA data" עשויות להיות מוגנות.
  https://chandra.harvard.edu/photo/image_use.html (נבדק 2026-10-13). לכן נכנסת רק תמונת ה-X-ray בלבד (קובץ `*_xray*.jpg` בעמוד התמונה), ורק אם הקרדיט של חלק הרנטגן כולו נאס"א/CXC. נפסלו ב-2026: SMC (‏ESA/XMM-Newton בקרדיט הרנטגן), ‏Sgr C (אותו דבר), מיזוג כוכבי נייטרונים (איור CC BY-NC-SA בעמוד), צ'נדרה וסוויפט (אוקטובר 2026: תמונת ה-SMC היחידה, ו-ESA/XMM-Newton בקרדיט הרנטגן שלה). דילגנו גם על "רוח הרפאים" בערפילית קרינה (reaper, ‏28.10.2026): הקרדיט תקין, אבל בשכבת הרנטגן לבדה יש רק נקודות פזורות של כוכבים, והצורה עצמה נראית רק באור נראה ובאינפרה-אדום. כמה תמונות דילגנו כי שכבת הרנטגן לבדה היא כתם לא ברור (JADES-ID1, ‏"תפוח האדמה האדום", ‏X-ray dot, ‏NGC 2353, ‏bhgrowth).
  2025 (נבדק 2026-10-13): נכנסו 9. נפסלו M31 ו-PSZ2 G181 (‏ESA/XMM-Newton בשכבת הרנטגן), ‏Centaurus A מאוסף הסוניפיקציה (כבר באתר, ושכבת הרנטגן משלבת IXPE ו-XMM), ‏3D models, ‏GRO J1655-40 ו-X-ray Arithmetic (אין קובץ רנטגן נפרד), והטרנטולה (כבר באתר מ-2026). דילגנו על נקודה או כתם לא ברור: Wolf 359, ‏TOI 1227 b, ‏AT2024tvd, ‏AT 2024wpp, ‏RACS J0320, ‏NGC 6278, ‏ASKAP J1832, ‏G359.13 ("העצם"), ‏Helix, ‏Centaurus filaments, ‏G287, ‏Infinity Galaxy, ‏NGC 6099 (הקובץ לא נטען מהשרת, ובכל מקרה מקור נקודתי).
  2024 (נבדק 2026-10-13): נכנסו 7. בערפילית הסרטן שכבת הרנטגן היא צ'נדרה ו-IXPE, ושניהם של נאס"א (NASA/MSFC, כמו בתמונת שבתאי). ‏1054 והפולסר בערפילית הסרטן: https://chandra.harvard.edu/photo/2018/crab/ ("reportedly first seen from Earth in 1054 A.D."). נפסלו בגלל ESA/XMM-Newton בשכבת הרנטגן: SS 433 (גם IXPE), ‏SNR 1181, ‏3C 58 ("combines X-rays from Chandra & XMM-Newton"), סקר החורים השחורים (bhsim). כבר באתר: Cassiopeia A, ‏Westerlund 1. אין קובץ רנטגן נפרד: Centaurus A knots, ‏collide, ‏decoupling, ‏exoplanets, ‏Sgr A* (football), ‏LID-568, ‏timelapse, ‏Galactic Center vent, ‏sonify8. דילגנו על נקודה, כתם או לוח מתויג: AT2019qiz, ‏AT2018fyk, ‏SDSS J1531, ‏H1821+643, ‏NGC 602, ‏Abell 478, ‏BCG survey (ארבעה צילומים עם כיתוב).
- העובדות בכל כרטיס (מרחק, זמן צילום, תוכן המחקר) — מעמוד התמונה עצמו, שהקישור אליו שמור בשדה `page`. ב-Sgr A East בעמוד יש סתירה בזמן הצילום (422 שעות מול "5 days 6 hours"), ולכן לא הוצג.
- הצבעים "לא אמיתיים": Chandra, "Adding Color to Chandra Images" — "X rays … cannot be seen with the human eye", והצבעים "are chosen to bring out important details". https://chandra.harvard.edu/photo/false_color.html
- האטמוספרה עוצרת קרני רנטגן מהחלל: NobelPrize.org, The Nobel Prize in Physics 2002, Popular information (אותו מקור כמו בציר הזמן).
- השמש: שטף קרני X מלוויין GOES של NOAA, דרך האתר "השמש היום" (https://media.sunspots.co.il/xray.json, מתעדכן כל שעה; גיבוי: today.json), נמשך כל שעה בזמן ה-build (scripts/fetch-sun.mjs).
- סולם A/B/C/M/X, "כל אות חזקה פי 10": NOAA SWPC, "Solar Flares (Radio Blackouts)" — "The X-ray flux levels start with the 'A' level (nominally starting at 10^-8 W/m^2). The next level, ten times higher, is the 'B' level…". https://www.swpc.noaa.gov/phenomena/solar-flares-radio-blackouts
  התוויות "שקט / פעילות קלה / בינונית / חזקה" הן פישוט שלנו לאותיות.

## עמוד לכל תמונה ב"השמיים ברנטגן" (sky-<id>.html)

- הטקסט "עוד על..." (`more` ב-content/sky.json) נכתב מחדש בעברית מהעמודים שבשדה `moreSources` של כל פריט — עמוד התמונה של צ'נדרה, עמודי צ'נדרה קודמים על אותו עצם, ויקיפדיה האנגלית (לעובדות בלבד), SIMBAD ותקצירי מאמרים ב-arXiv. המקורות מוצגים בעמוד עצמו. נבדק 2026-10-15.
- המיקום בשמיים (`where.ra`, `where.dec`, ‏J2000) — מ-"Fast Facts" בעמוד התמונה של צ'נדרה. חריגים: Sgr A East — ב-Fast Facts כתוב Dec ‎-20°‎, טעות דפוס (Sgr A* נמצא ב-‎-29°‎), ולכן המיקום מ-SIMBAD. שבתאי — אין מיקום קבוע, ולכן מוצגת מפת מסלולים.
- "מבוא" לחלק של צ'נדרה (sky.html): "X-rays come from objects that are millions of degrees Celsius—such as pulsars, galactic supernovae remnants, and the accretion disk of black holes", ‏NASA Science, "X-Rays", https://science.nasa.gov/ems/11_xrays/ . המראות והגלאים: "The incoming X-rays are focused by the mirrors…", והגלאים מספקים "number, position, energy and time of arrival" — Chandra, Science Instruments, https://chandra.harvard.edu/about/science_instruments.html (נבדק 2026-10-15).

### מפות "איפה זה?" (src/lib/sky-maps.js)

- מפת השמיים: על הפנורמה של ESO/S. Brunier (eso0932a, ‏CC BY 4.0, https://www.eso.org/public/images/eso0932a/): "the Galactic Plane running horizontally through the image". התמונה היא היטל שווה-מרחקים (2:1) בקואורדינטות גלקטיות, מרכז הגלקסיה באמצע ו-l גדל שמאלה — נבדק מול מקום ענן מגלן הגדול בתמונה. ra/dec מומרים לקואורדינטות גלקטיות בעזרת הקוטב הגלקטי הצפוני ב-J2000 (α = 192.85948°, ‏δ = 27.12825°, ‏l של הקוטב השמימי = 122.93192°), Wikipedia, "Galactic coordinate system". מקום גלקסיית אנדרומדה (l = 121.17°, ‏b = −21.57°): SIMBAD.
- שביל החלב מלמעלה: איור NASA/JPL-Caltech/R. Hurt, ‏PIA10748 (https://images.nasa.gov/details/PIA10748). חומרי NASA "generally are not subject to copyright in the United States" (https://www.nasa.gov/nasa-brand-center/images-and-media/). מקום השמש באיור נלקח מ-PIA19341 (https://images.nasa.gov/details/PIA19341), אותו איור מסובב ב-90° עם השמש מסומנת (התאמה של 0.99 בין שתי התמונות אחרי הסיבוב). קנה המידה: המרחק מהשמש למרכז = 26,000 שנות אור.
- "לא זורח בישראל" (מסומן רק בעמודים של עצמים שבאמת לא זורחים בישראל): כוכב בנטייה δ מגיע לגובה מרבי של 90° − |φ − δ|, וב-φ = 31.8° (ירושלים) כל מה שמתחת ל-δ = −58.2° לא עולה מעל האופק. גאומטריה, בלי שבירת אור באטמוספרה.
- מרכזי קבוצות הכוכבים שמסומנות לעיגון (אוריון 5h +5°, הדובה הגדולה 10.67h +55.4°, אריה 11h +15°, ברבור 20.62h +42°, עקרב 16.89h −30.7°, הצלב הדרומי 12.5h −60°): מתיבת המידע של כל קבוצה בוויקיפדיה האנגלית (נבדק 2026-10-15).
- ציר המרחקים (קנה מידה אמיתי, אנכי; ההשוואה "פי N" מחושבת מאותם מספרים): ענן מגלן הגדול כ-160,000 שנות אור (צ'נדרה, עמוד 30 Doradus), גלקסיית אנדרומדה כ-2.5 מיליון שנות אור (NASA, Hubble Messier Catalog, Messier 31: "2.5 million light-years").
- מסלולי כוכבי הלכת: מרחק ממוצע מהשמש — כדור הארץ 149.6, מאדים 228.0, צדק 778.5, שבתאי 1,432.0 מיליון ק"מ. NASA Planetary Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/ (נבדק 2026-10-15).
- נפסלו בסינון של 2025 (מעבר לכללים שלמעלה): M31 ו-G181 (‏XMM-Newton בשכבת הרנטגן), אוספים של כמה עצמים (holidays, ‏cosmic, ‏fall, ‏sonify10, ‏xa, ‏3dmodels), וכתמים לא ברורים (helix, ‏infinity, ‏j1610, ‏lprt, ‏red6, ‏smbhs, ‏wolf359, ‏baby, ‏bhtde, ‏bone, ‏fbot, ‏g287, ענן האבן במרכז הגלקסיה). 30 Doradus של 2025 — כבר יש לנו את של 2026.

## הדפסות ישנות: למה העצמות כהות (physics.html#old-prints)

- Moritz Jastrowitz, "The Roentgen Experiments with Cathode Rays and their Diagnostic Application" (1896), בתרגום לאנגלית ב-German History Intersections (GHI):
  "Since denser bodies allow fewer rays to pass through, they appear as light figures on negatives and as dark objects on the developed photograph."
  https://germanhistory-intersections.org/en/knowledge-and-education/ghis:document-145
- ההדפסות של שוסטר ב-Wellcome Collection מתוארות שם כ-"Photoprint from radiograph", כלומר הדפסה מהצילום.
- צ'נדרה מקיף את כדור הארץ: "Orbit: 10,000 km x 140,161 km", Chandra Specifications, https://chandra.harvard.edu/about/specs.html (נבדק 2026-10-13).
