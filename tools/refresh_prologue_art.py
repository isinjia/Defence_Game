"""Copy generated prologue art to web assets and record prompts.

Usage: python tools/refresh_prologue_art.py <generation-manifest.json>
The manifest contains {id, source, prompt} entries exported by the image tool.
Original generated PNGs are retained; only web delivery copies are optimized.
"""
import json
import sys
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
entries = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
destination = root / 'assets' / 'prologue'
destination.mkdir(parents=True, exist_ok=True)
records = []
for entry in entries:
    name = entry['id']
    if not name or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in name):
        raise ValueError(f'Invalid asset name: {name}')
    with Image.open(entry['source']) as original:
        picture = original.convert('RGB')
        picture.thumbnail((1536, 1024), Image.Resampling.LANCZOS)
        picture.save(destination / f'{name}.webp', 'WEBP', quality=88, method=6)
        records.append({'id': name, 'file': f'{name}.webp', 'width': picture.width,
                        'height': picture.height, 'prompt': entry['prompt']})
(destination / '제작기록.json').write_text(json.dumps({
    '제작방식': '내장 image_gen 이미지 생성 도구',
    '참조': 'assets/monsters/web/서리 늑대.webp — 기존 몬스터 원화의 화풍과 완성도',
    '원칙': '프롤로그의 장소·핵심 사물·각성 흔적으로 이야기 표현. 사람·실루엣·손·초상화 제외.',
    'images': sorted(records, key=lambda item: item['id']),
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(records)} WebP illustrations in {destination}')
