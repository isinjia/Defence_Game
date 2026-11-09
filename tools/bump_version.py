"""업데이트마다 버전을 0.01 올린다.
js/data.js 의 GAME_VERSION 과 index.html 의 스크립트·스타일 버전 표시를 함께 바꾼다.
사용법: python3 tools/bump_version.py
"""
import re
from decimal import Decimal
from pathlib import Path

root = Path(__file__).resolve().parent.parent
data = root / 'js' / 'data.js'
index = root / 'index.html'

src = data.read_text(encoding='utf-8')
m = re.search(r"const GAME_VERSION = '([0-9.]+)';", src)
old = m.group(1)
new = f"{Decimal(old) + Decimal('0.01'):.2f}"
data.write_text(src.replace(m.group(0), f"const GAME_VERSION = '{new}';"), encoding='utf-8')

html = index.read_text(encoding='utf-8')
html = re.sub(r'\?v=[0-9A-Za-z.]+', f'?v={new}', html)
index.write_text(html, encoding='utf-8')
print(f'{old} -> {new}')
