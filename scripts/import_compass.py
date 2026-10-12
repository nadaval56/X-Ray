#!/usr/bin/env python3
"""צילומי סורק אמיתיים מ-COMPASS-XP (UCL, ‏CC BY 4.0) לעמוד "סורק מזוודות".

כלי עזר לעורך בלבד — לא חלק מה-build. דורש Python 3 עם Pillow.

המאגר הוא קובץ zip אחד של כ-6GB ב-Zenodo. הסקריפט מוריד ממנו רק את הקבצים הדרושים
(בקשות Range), שומר את המקור ב-assets-src/originals/compass-xp/ (לא בגיט),
וחותך לכל חפץ ריבוע סביב החפץ: צילום רגיל, צילום רנטגן בצבע, וצילום רנטגן באפור.

  python3 scripts/import_compass.py            # מוריד מה שחסר ומעבד הכול
  python3 scripts/import_compass.py --no-fetch # רק מעבד מחדש מהמקורות השמורים

תיבות החיתוך (x0,y0,x1,y1 יחסיים) נקבעו ידנית לכל חפץ: PHOTO לצילום הרגיל, XRAY לשני צילומי הרנטגן.
"""
import io
import pathlib
import sys
import zipfile

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-src' / 'originals' / 'compass-xp'
OUT = ROOT / 'public' / 'images' / 'scanner'
ZIP_URL = 'https://zenodo.org/records/2654887/files/COMPASS-XP.zip'

XRAY = {'0044': (.28, .30, .70, .75), '0052': (.35, .40, .55, .57), '0056': (.40, .38, .62, .72), '0178': (.36, .38, .60, .70),
        '0191': (.44, .48, .52, .62), '0390': (.36, .45, .58, .65), '0676': (.30, .45, .66, .68), '0685': (.30, .42, .65, .66),
        '0927': (.42, .42, .57, .57), '0942': (.42, .45, .52, .92), '0995': (.38, .41, .50, .63), '1126': (.12, .25, .94, .92),
        '1437': (.45, .47, .53, .62), '1633': (.40, .50, .58, .68), '1809': (.40, .43, .52, .62), '1845': (.44, .40, .58, .71)}
PHOTO = {'0044': (.33, .33, .67, .62), '0052': (.41, .43, .57, .55), '0056': (.43, .27, .62, .62), '0178': (.40, .38, .58, .66),
         '0191': (.45, .45, .53, .58), '0390': (.38, .40, .60, .58), '0676': (.34, .40, .63, .65), '0685': (.36, .33, .62, .62),
         '0927': (.43, .43, .55, .55), '0942': (.45, .38, .55, .85), '0995': (.42, .38, .55, .58), '1126': (.22, .08, .95, .88),
         '1437': (.45, .42, .53, .60), '1633': (.43, .42, .58, .60), '1809': (.40, .33, .52, .58), '1845': (.40, .32, .55, .62)}
KINDS = [('Photo', 'jpg', 'photo'), ('Colour', 'png', 'colour'), ('Grey', 'png', 'grey')]


def fetch(ids):
    sys.path.insert(0, str(ROOT / 'scripts' / 'lib'))
    src = (ROOT / 'scripts' / 'lib' / 'rzip.py').read_text().split('url=sys.argv[1]')[0]
    ns = {}
    exec(src, ns)  # מגדיר HF: קובץ "וירטואלי" שקורא חלקים מה-zip ברשת
    z = zipfile.ZipFile(io.BufferedReader(ns['HF'](ZIP_URL), buffer_size=1 << 16))
    for b in ids:
        for kind, ext, _ in KINDS:
            dest = SRC / f'{kind}_{b}.{ext}'
            if not dest.exists():
                dest.write_bytes(z.read(f'COMPASS-XP/{kind}/{b}.{ext}'))
        print('✓ הורד', b)


def square(im, box, pad=1.4, minfrac=0.14):
    W, H = im.size
    x0, y0, x1, y1 = box[0] * W, box[1] * H, box[2] * W, box[3] * H
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    s = min(max(max(x1 - x0, y1 - y0) * pad, minfrac * W), W, H)
    left = min(max(cx - s / 2, 0), W - s)
    top = min(max(cy - s / 2, 0), H - s)
    return im.crop((round(left), round(top), round(left + s), round(top + s)))


def main():
    SRC.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    if '--no-fetch' not in sys.argv:
        fetch(XRAY)
    for b in XRAY:
        for kind, ext, name in KINDS:
            im = Image.open(SRC / f'{kind}_{b}.{ext}').convert('RGB')
            im = square(im, PHOTO[b]) if kind == 'Photo' else square(im, XRAY[b], minfrac=0.18)
            if im.width > 640:
                im = im.resize((640, 640), Image.LANCZOS)
            im.save(OUT / f'{b}-{name}.webp', 'WEBP', quality=82, method=6)
        print('✓', b)


if __name__ == '__main__':
    main()
