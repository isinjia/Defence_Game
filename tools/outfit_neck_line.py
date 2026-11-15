#!/usr/bin/env python3
"""직업복 앞깃 윗선(목을 자르는 선) 측정·검토 도구. 방법은 docs/직업복_목선_맞춤.md.

사용:
  # 1) 검토 시트: 옷마다 목 구멍을 3배로 키우고 깊이 눈금(0~60px)과 지금 코드의 선(노랑)을 그린다
  python3 tools/outfit_neck_line.py sheet m out_dir      # 남자 37벌 → out_dir/neck_m0..3.png
  python3 tools/outfit_neck_line.py sheet f out_dir
  # 2) 눈으로 읽은 [양끝 깊이, 가운데 깊이] 표(JSON)를 코드의 IN_PROF/IN_PROF_OLD 에 넣는다
  python3 tools/outfit_neck_line.py apply table.json     # {"m":{"assassin":[15,29],...},"f":{...}}
  # 3) 표 일부만 바꿔 다시 시트로 확인: sheet 에 표를 주면 그 값으로 선을 그린다
  python3 tools/outfit_neck_line.py sheet m out_dir table.json
"""
import json, os, re, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets/portraits/outfits/')
JS = os.path.join(ROOT, 'js/job_outfits.js')
MAN = {c['id']: c for c in json.load(open(OUT + 'manifest.json'))['classes']}


def u_curve(side, center):
    """앞깃 윗선: 가운데에서 -44..44(4px 간격, 23점), 뒷깃 테두리(neck[1]) 기준 깊이(옷 그림 px)."""
    return [round(side + (center - side) * (1 - ((i - 11) / 11) ** 2) ** .8) for i in range(23)]


def read_table():
    s = open(JS, encoding='utf-8').read()
    return json.loads(re.search(r'const IN_PROF=(\{"m".*?\});\n', s).group(1))


def sheet(g, out_dir, table=None):
    prof = read_table()
    os.makedirs(out_dir, exist_ok=True)
    ids = list(MAN)
    for page in range((len(ids) + 11) // 12):
        tiles = []
        for c in ids[page * 12:page * 12 + 12]:
            v = MAN[c]['variants'][g]; nx, ny = v['neck']
            im = Image.open(OUT + v['file']).convert('RGBA')
            bg = Image.new('RGBA', im.size, (220, 80, 80, 255)); bg.alpha_composite(im)
            t = bg.crop((nx - 60, ny - 10, nx + 60, ny + 60)).resize((360, 210), Image.LANCZOS)
            d = ImageDraw.Draw(t, 'RGBA')
            for k in range(0, 61, 10):
                y = (k + 10) * 3; d.line([(0, y), (360, y)], fill=(0, 255, 255, 90)); d.text((2, y - 10), str(k), fill=(0, 255, 255))
            p = u_curve(*table[g][c]) if table and c in table.get(g, {}) else prof[g][c]
            d.line([((-44 + 4 * i + 60) * 3, (p[i] + 10) * 3) for i in range(23)], fill=(255, 255, 0), width=2)
            d.text((60, 2), '%s %s  %d/%d' % (g, c, p[0], p[11]), fill='white')
            tiles.append(t)
        o = Image.new('RGB', (360 * 4, 210 * ((len(tiles) + 3) // 4)))
        for i, t in enumerate(tiles): o.paste(t, ((i % 4) * 360, (i // 4) * 210))
        path = os.path.join(out_dir, 'neck_%s%d.png' % (g, page)); o.save(path); print(path)


def apply(table_path):
    table = json.load(open(table_path))
    s = open(JS, encoding='utf-8').read()
    cur = read_table()
    for g in 'mf':
        for c, (side, center) in table.get(g, {}).items():
            cur[g][c] = u_curve(side, center)
    js = json.dumps(cur, separators=(',', ':'))
    for name in ('IN_PROF', 'IN_PROF_OLD'):
        m = re.search(r'const %s=(\{"m".*?\});\n' % name, s)
        s = s[:m.start(1)] + js + s[m.end(1):]
    open(JS, 'w', encoding='utf-8').write(s)
    print('IN_PROF, IN_PROF_OLD 갱신:', sum(len(v) for v in table.values()), '벌')


if __name__ == '__main__':
    if len(sys.argv) >= 4 and sys.argv[1] == 'sheet':
        sheet(sys.argv[2], sys.argv[3], json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None)
    elif len(sys.argv) == 3 and sys.argv[1] == 'apply':
        apply(sys.argv[2])
    else:
        print(__doc__)
