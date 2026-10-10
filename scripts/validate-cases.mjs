// בדיקת מבנה לכל קובצי המקרים ב-content/cases/. רץ לפני כל build; build נכשל אם יש שגיאה.
// ראו "סכמת מקרה" ב-CLAUDE.md.
import { existsSync } from 'node:fs';
import { resolve, extname, basename } from 'node:path';
import { ROOT, IMAGES_DIR, loadCases, readJson, report } from './lib/load-cases.mjs';

const CATEGORIES = Object.keys(readJson(resolve(ROOT, 'content/categories.json')));
const PRINCIPLES = Object.keys(readJson(resolve(ROOT, 'content/principles.json')));
const ROLES = ['main', 'normal', 'second-view'];
const SOURCE_FIELDS = ['title', 'author', 'url', 'license', 'licenseUrl', 'modifications', 'verifiedOn'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const inUnit = (v) => typeof v === 'number' && v >= 0 && v <= 1;
const isUrl = (v) => isText(v) && /^https?:\/\/\S+$/.test(v);
const isDate = (v) => isText(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

const errors = [];
const seenIds = new Map();
const cases = loadCases();

for (const { file, data, error } of cases) {
  const err = (msg) => errors.push(`${file}: ${msg}`);
  if (error) { err(error); continue; }
  const c = data;

  if (!ID_RE.test(c.id ?? '')) err('id חסר או לא בפורמט kebab-case');
  else if (c.id !== basename(file, '.json')) err(`id "${c.id}" לא תואם לשם הקובץ`);
  if (seenIds.has(c.id)) err(`id כפול (גם ב-${seenIds.get(c.id)})`);
  seenIds.set(c.id, file);

  for (const key of ['title', 'story', 'question', 'reveal', 'outcome']) {
    if (!isText(c[key])) err(`שדה "${key}" חסר או ריק`);
  }
  if (!CATEGORIES.includes(c.category)) err(`category "${c.category}" לא ברשימה (${CATEGORIES.join(', ')})`);
  if (![1, 2, 3].includes(c.difficulty)) err('difficulty חייב להיות 1, 2 או 3');

  if (!c.principle || !isText(c.principle.text)) err('principle.text חסר');
  else if (!PRINCIPLES.includes(c.principle.id)) err(`principle.id "${c.principle.id}" לא מוגדר ב-content/principles.json`);

  if (!Array.isArray(c.images) || c.images.length === 0) { err('images ריק'); continue; }
  const mains = c.images.filter((im) => im.role === 'main');
  if (mains.length !== 1) err(`צריכה להיות בדיוק תמונה אחת עם role "main" (נמצאו ${mains.length})`);

  c.images.forEach((im, i) => {
    const where = `images[${i}]${im.file ? ` (${im.file})` : ''}`;
    const ierr = (msg) => err(`${where}: ${msg}`);

    if (!isText(im.file)) ierr('file חסר');
    else {
      const ext = extname(im.file).toLowerCase();
      // SVG מותר רק לאיורי placeholder שיצרנו בעצמנו; צילומים אמיתיים — WebP בלבד
      if (ext !== '.webp' && !(ext === '.svg' && im.placeholder === true)) ierr('פורמט חייב להיות WebP');
      if (!existsSync(resolve(IMAGES_DIR, im.file))) ierr('הקובץ לא קיים ב-public/images/cases/');
    }
    if (!ROLES.includes(im.role)) ierr(`role "${im.role}" לא חוקי (${ROLES.join(', ')})`);
    if (!isText(im.alt) || im.alt.trim().length < 15) ierr('alt חסר או קצר מדי — נדרש תיאור של הצילום');

    if (im.findings !== undefined && !Array.isArray(im.findings)) ierr('findings חייב להיות מערך');
    const findings = im.findings ?? [];
    if (im.role === 'main' && findings.length === 0) ierr('לתמונה הראשית חייב להיות לפחות ממצא אחד');
    findings.forEach((f, j) => {
      if (f.shape !== 'circle') ierr(`findings[${j}]: shape נתמך כרגע רק "circle"`);
      if (!inUnit(f.x) || !inUnit(f.y)) ierr(`findings[${j}]: x ו-y חייבים להיות בין 0 ל-1`);
      if (!(typeof f.r === 'number' && f.r > 0 && f.r <= 0.5)) ierr(`findings[${j}]: r חייב להיות בין 0 ל-0.5`);
      if (!isText(f.label)) ierr(`findings[${j}]: label חסר`);
    });

    const s = im.source;
    if (!s || typeof s !== 'object') { ierr('אובייקט source חסר'); return; }
    for (const key of SOURCE_FIELDS) if (!isText(s[key])) ierr(`source.${key} חסר`);
    if (s.url && !isUrl(s.url)) ierr('source.url אינו כתובת תקינה');
    if (s.licenseUrl && !isUrl(s.licenseUrl)) ierr('source.licenseUrl אינו כתובת תקינה');
    if (s.verifiedOn && !isDate(s.verifiedOn)) ierr('source.verifiedOn חייב להיות בפורמט YYYY-MM-DD');
  });
}

report('בדיקת מקרים', errors, `${cases.length} מקרים תקינים`);
