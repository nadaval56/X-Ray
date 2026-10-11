#!/usr/bin/env python3
"""ייבוא תמונה למקרה: הורדת המקור, חיתוך אופציונלי, המרה ל-WebP ברוחב מרבי 1600px.

כלי עזר לעורך בלבד — לא חלק מה-build. דורש Python 3 עם Pillow (pip install pillow).

שימוש:
  python3 scripts/import_image.py <url> <name> [--crop L,T,R,B] [--gray] [--max 1600]

  <name>   שם הקובץ בלי סיומת, למשל coin-swallowed-01-ap
  --crop   חיתוך ביחס לגודל התמונה (0–1): שמאל,למעלה,ימין,למטה. למשל 0,0,1,0.92 חותך את 8% התחתונים.
           לתעד כל חיתוך ב-source.modifications של המקרה.
  --gray   המרה לגווני אפור (לצילומים שנסרקו עם גוון צבע)
  --mask   הסתרת אזור (L,T,R,B יחסי, לפני החיתוך) במילוי מהפיקסלים שמסביב. לחץ או טקסט
           שמסגירים את התשובה. אפשר לחזור על הדגל. לתעד ב-modifications.

פלט:
  assets-src/originals/<name>.<ext>   — הקובץ המקורי כפי שהורד (לא נכנס ל-build)
  public/images/<dir>/<name>.webp     — הקובץ שמוגש באתר (ברירת מחדל: cases)
"""
import argparse
import io
import pathlib
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = 'XRayEduSite/0.1 (educational; https://github.com/nadaval56/X-Ray)'


def fetch(url, attempts=5):
    """הורדה עם המתנה הולכת וגדלה כשהשרת מגביל קצב (429), למשל Wikimedia."""
    import time
    import urllib.error
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == attempts - 1:
                raise
            time.sleep(30 * (i + 1))


def fill_region(img, l, t, r, b, iterations=300):
    """ממלא מלבן מכל צדדיו (דיפוזיה: ממוצע שכנים חוזר) ומוסיף רעש בעוצמת הרקע, כדי שלא ייראה כמו טלאי."""
    import random
    import statistics
    gray = img.mode == 'L'
    bands = [img] if gray else list(img.split())
    w, h = img.size
    x0, y0 = max(1, round(l * w)), max(1, round(t * h))
    x1, y1 = min(w - 2, round(r * w)), min(h - 2, round(b * h))
    rng = random.Random(1)
    out = []
    for band in bands:
        px = band.load()
        border = [px[x, y0 - 1] for x in range(x0, x1 + 1)] + [px[x, y1 + 1] for x in range(x0, x1 + 1)]
        noise = min(3.0, statistics.pstdev(border) * 0.1) if len(border) > 1 else 0
        g = {(x, y): float(px[x, y]) for x in range(x0 - 1, x1 + 2) for y in range(y0 - 1, y1 + 2)}
        for _ in range(iterations):
            for y in range(y0, y1 + 1):
                for x in range(x0, x1 + 1):
                    g[x, y] = (g[x - 1, y] + g[x + 1, y] + g[x, y - 1] + g[x, y + 1]) / 4
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                px[x, y] = max(0, min(255, round(g[x, y] + rng.gauss(0, noise))))
        out.append(band)
    return out[0] if gray else Image.merge(img.mode, out)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('url')
    p.add_argument('name')
    p.add_argument('--crop', help='L,T,R,B יחסי (0–1)')
    p.add_argument('--gray', action='store_true')
    p.add_argument('--mask', action='append', default=[], help='L,T,R,B יחסי (0–1)')
    p.add_argument('--max', type=int, default=1600)
    p.add_argument('--quality', type=int, default=82)
    p.add_argument('--dir', default='cases', help='תיקיית יעד תחת public/images (cases, history, physics)')
    a = p.parse_args()

    if a.url.startswith('http'):
        data = fetch(a.url)
    else:
        data = pathlib.Path(a.url).read_bytes()
    img = Image.open(io.BytesIO(data))
    ext = (img.format or 'bin').lower().replace('jpeg', 'jpg')

    orig = ROOT / 'assets-src' / 'originals' / f'{a.name}.{ext}'
    orig.parent.mkdir(parents=True, exist_ok=True)
    orig.write_bytes(data)

    img = img.convert('L' if a.gray else 'RGB')
    for m in a.mask:
        img = fill_region(img, *(float(v) for v in m.split(',')))
    if a.crop:
        l, t, r, b = (float(v) for v in a.crop.split(','))
        w, h = img.size
        img = img.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
    if img.width > a.max:
        img = img.resize((a.max, round(img.height * a.max / img.width)), Image.LANCZOS)

    out = ROOT / 'public' / 'images' / a.dir / f'{a.name}.webp'
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, 'WEBP', quality=a.quality, method=6)
    print(f'✓ {orig.relative_to(ROOT)} → {out.relative_to(ROOT)} ({img.width}×{img.height}, {out.stat().st_size // 1024}KB)')


if __name__ == '__main__':
    sys.exit(main())
