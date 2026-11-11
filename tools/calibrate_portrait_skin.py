"""실제 얼굴·몸 이미지의 피부 중간색을 측정해 합성용 색 기준을 등록한다."""
from pathlib import Path
import json
import re
import numpy as np
from PIL import Image
from scipy import ndimage


def skin_mask(part, rgba, root, gender, kind):
    rgb = rgba[:, :, :3].astype(float)
    hsv = np.array(Image.fromarray(rgba[:, :, :3]).convert('HSV')).astype(float) / 255
    hue, sat, val = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    skin = (((hue > .015) & (hue < .18)) | (hue > .88)) & (sat > .065) & (sat < .65) & (val > .27) & (rgba[:, :, 3] > 8)
    yy, xx = np.indices(skin.shape)
    if kind == 'face':
        eye_y = (108 if gender == 'f' else 98) + (part.get('chinY', 261 if gender == 'f' else 251) - (261 if gender == 'f' else 251)) * .5
        for eye_x in [43, 101]:
            skin[((xx-eye_x)/20)**2 + ((yy-eye_y)/10)**2 < 1] = False
        mouth = (xx > 44) & (xx < 102) & (yy > 148) & (yy < 185)
    else:
        eye_y = 163 if gender == 'f' else 153
        for eye_x in [171, 229]:
            skin[((xx-eye_x)/21)**2 + ((yy-eye_y)/12)**2 < 1] = False
        mouth = (xx > 172) & (xx < 228) & (yy > 202) & (yy < 244)
        if gender == 'f':
            skin[(yy > 315) & (val < .57)] = False
    # 입술의 붉은 색과 흰자·검은 선·속옷은 그대로 남긴다.
    skin[mouth & ((hue < .04) | (hue > .98)) & (sat > .25)] = False
    mask = ndimage.gaussian_filter(skin.astype(float), .45) * rgba[:, :, 3]
    file = part['file'].replace('.webp', '-skin.webp')
    Image.fromarray(mask.clip(0,255).astype('uint8'), 'L').save(root / file, 'WEBP', lossless=True, method=4)
    part['skinMask'] = file
    return skin


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
            skin_mask(part, rgba, root, gender, 'face')
        for part in manifest.get('body-' + gender, []):
            rgba = np.array(Image.open(root / part['file']).convert('RGBA'))
            skin = skin_mask(part, rgba, root, gender, 'body')
            yy, xx = np.indices(skin.shape)
            roi = skin & (rgba[:,:,3] > 240) & (yy >= 310) & (yy < 390) & (((xx > 35) & (xx < 145)) | ((xx > 255) & (xx < 365)))
            median = np.median(rgba[roi,:3], axis=0)
            best = None
            for y in range(310,382,4):
                for x in list(range(36,138,4)) + list(range(256,358,4)):
                    if not roi[y:y+8,x:x+8].all():
                        continue
                    rgb = np.median(rgba[y:y+8,x:x+8,:3],axis=(0,1))
                    score = float(np.linalg.norm(rgb-median))
                    if best is None or score < best[0]: best = (score,x,y,rgb)
            if best is None: raise ValueError('상체 피부 기준을 찾지 못함: '+part['file'])
            _, x, y, rgb = best
            part['skinSample'] = [x,y,8,8]
            part['skinRgb'] = rgb.round(2).tolist()
    for part in manifest.get('traits', [])[:1]:
        rgba = np.array(Image.open(root / part['file']).convert('RGBA'))
        rgb = rgba[:, :, :3]
        keep = (rgba[:, :, 3] > 220) & (rgb[:, :, 0] > 140) & (rgb[:, :, 1] > 100)
        part['skinRgb'] = np.median(rgb[keep], axis=0).round(2).tolist()
        skin_mask(part, rgba, root, 'm', 'trait')
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
