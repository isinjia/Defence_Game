"""실제 얼굴·몸 이미지의 피부 중간색을 측정해 합성용 색 기준을 등록한다."""
from pathlib import Path
import json
import re
import numpy as np
from PIL import Image


def calibrate(manifest, root):
    for gender in ['m', 'f']:
        for part in manifest['face-' + gender]:
            rgba = np.array(Image.open(root / part['file']).convert('RGBA'))
            cheeks = np.concatenate([rgba[130:142, 42:54].reshape(-1, 4), rgba[130:142, 90:102].reshape(-1, 4)])
            skin = cheeks[cheeks[:, 3] > 220, :3]
            part['skinRgb'] = np.median(skin, axis=0).round(2).tolist()
            # 턱 아래 검은 윤곽을 찾아, 얼굴마다 다른 목 길이도 보정한다.
            jaw = np.median(rgba[180:225, 69:76, :3], axis=(1, 2))
            part['chinY'] = int(jaw.argmin()) + 235
        for part in manifest.get('body-' + gender, []):
            rgba = np.array(Image.open(root / part['file']).convert('RGBA'))
            part['skinRgb'] = np.median(rgba[380:388, 150:158, :3], axis=(0, 1)).round(2).tolist()
    return manifest


if __name__ == '__main__':
    project = Path(__file__).resolve().parent.parent
    root = project / 'assets/portraits/parts'
    manifest = calibrate(json.loads((root / 'manifest.json').read_text()), root)
    blob = json.dumps(manifest, ensure_ascii=False, indent=2)
    (root / 'manifest.json').write_text(blob)
    module = project / 'js/portrait_parts.js'
    text = re.sub(r'  const parts = [\s\S]*?;\n  const escape', lambda _: '  const parts = ' + blob + ';\n  const escape', module.read_text(), count=1)
    module.write_text(text)
