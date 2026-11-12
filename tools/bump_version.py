"""업데이트마다 버전을 0.01 올린다. (2026-11-12 사용자 요청: 0.001 → 0.01 단위)
js/data.js 의 GAME_VERSION 과 index.html 의 스크립트·스타일 버전 표시를 함께 바꾼다.
사용법: python3 tools/bump_version.py

푸시 전·rebase 뒤 반드시 한 번 돌린다. 원격에 같은/더 높은 버전이 먼저 올라가면
상대 버전을 받은 뒤 이 스크립트를 다시 돌려 +0.01 하고 다시 푸시한다.

SERIES: 버전 번호를 처음(0.01)부터 다시 셀 때마다 1 올린다.
index.html 의 캐시 갱신 표시는 s{SERIES}.{버전} 이라, 예전 같은 번호의 파일을 휴대폰이 캐시에서 꺼내 쓰지 않는다.
(2026-11-09 사용자 요청으로 0.99 다음을 0.01로 되돌림 → SERIES 2)
"""
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

SERIES = 2
STEP = Decimal('0.01')
root = Path(__file__).resolve().parent.parent
data = root / 'js' / 'data.js'
index = root / 'index.html'

src = data.read_text(encoding='utf-8')
m = re.search(r"const GAME_VERSION = '([0-9.]+)';", src)
old = m.group(1)
new = str((Decimal(old) + STEP).quantize(STEP, rounding=ROUND_HALF_UP))
data.write_text(src.replace(m.group(0), f"const GAME_VERSION = '{new}';"), encoding='utf-8')

html = index.read_text(encoding='utf-8')
html = re.sub(r'\?v=[0-9A-Za-z.]+', f'?v=s{SERIES}.{new}', html)
index.write_text(html, encoding='utf-8')
print(f'{old} -> {new}')
