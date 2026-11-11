"""실제 얼굴·몸 이미지의 피부 중간색을 측정해 합성용 색 기준을 등록한다."""
from pathlib import Path
import json
import re
import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull
from PIL import ImageDraw


def skin_mask(part, rgba, root, gender, kind):
    rgb = rgba[:, :, :3].astype(float)
    hsv = np.array(Image.fromarray(rgba[:, :, :3]).convert('HSV')).astype(float) / 255
    hue, sat, val = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    # 밝은 하이라이트와 어두운 피부 그림자도 같은 피부 재질에 포함한다.
    skin = ((((hue < .21) | (hue > .85)) & (sat > .015) & (sat < .8) & (val > .14)) | ((sat < .15) & (val > .70))) & (rgba[:,:,3] > 8)
    holes = ndimage.binary_fill_holes(skin) & ~skin
    labels, _ = ndimage.label(holes)
    sizes = np.bincount(labels.ravel())
    skin |= holes & (sizes[labels] < 500) & (rgba[:,:,3] > 8) & (val > .14)
    yy, xx = np.indices(skin.shape)
    if kind == 'face':
        # 얼굴은 피부 한 재질이다. HSV 임계값으로 코·눈 밑·하이라이트를 도려내지 않는다.
        skin = (rgba[:,:,3] > 8) & (val > .12)
        eye_y = (108 if gender == 'f' else 98) + (part.get('chinY', 261 if gender == 'f' else 251) - (261 if gender == 'f' else 251)) * .5
        eye_centers = [43, 101]
        eye_y = part.get('eyeY', eye_y)
        eye_centers = part.get('eyeCenters', eye_centers)
        eye_rx, eye_ry = 20, 8
        mouth = ((xx-72)/20)**2 + ((yy-part.get('mouthY',174 if gender == 'f' else 162))/(9.5 if gender == 'f' else 7))**2 < 1
    else:
        eye_y = 163 if gender == 'f' else 153
        eye_centers = [171, 229]
        eye_rx, eye_ry = 21, 10
        mouth = ((xx-200)/21)**2 + ((yy-(233 if gender == 'f' else 222))/9)**2 < 1
        if gender == 'f':
            skin[(yy > 315) & (val < .57)] = False
    # 눈 주변 전체를 빼지 않고 흰자에서 실제 눈의 안쪽 윤곽을 찾는다.
    # 좌우 흰자 사이의 홍채도 같은 윤곽 안에서 보호한다.
    eye_rgba = rgba
    if kind == 'face':
        index = int(part['file'].split('-')[-1].split('.')[0])
        if index in [0,1,2,5,7,8,10,11,13,14]:
            source_index = 0 if index == 5 else index % 3
            eye_rgba = np.array(Image.open(root / f'face-{gender}-{source_index}.webp').convert('RGBA'))
    eye_hsv = np.array(Image.fromarray(eye_rgba[:,:,:3]).convert('HSV')).astype(float)/255
    eye_sat, eye_val = eye_hsv[:,:,1], eye_hsv[:,:,2]
    ref = np.array(part.get('skinRgb', [230,195,180]), dtype=float)
    if kind == 'face':
        ref = np.median(eye_rgba[130:142,42:54,:3].reshape(-1,3),axis=0)
    ref_sat = (ref.max()-ref.min())/ref.max()
    # 따뜻한 흰자도 포함하되 붉은 피부 하이라이트는 눈 윤곽으로 오인하지 않는다.
    er, eg, eb = [eye_rgba[:,:,i].astype(float) for i in range(3)]
    neutral = (eye_sat < max(.035, min(.11, ref_sat*.45))) & (eye_val > .58)
    neutral |= (er-eg < 18) & (eg-eb < 25) & (np.minimum.reduce([er,eg,eb]) > 135) & (np.maximum.reduce([er,eg,eb])-np.minimum.reduce([er,eg,eb]) < 45)
    for eye_x in eye_centers:
        roi = (((xx-eye_x)/eye_rx)**2 + ((yy-eye_y)/eye_ry)**2 < 1)
        ys, xs = np.where(roi & neutral & (eye_rgba[:,:,3] > 220))
        if len(xs) < 4:
            continue
        points = np.column_stack([xs,ys])
        try:
            hull = ConvexHull(points)
        except Exception:
            continue
        protected = Image.new('L', (skin.shape[1],skin.shape[0]))
        ImageDraw.Draw(protected).polygon([tuple(p) for p in points[hull.vertices]],fill=255)
        opening = ndimage.binary_dilation(np.array(protected)>0,structure=np.ones((3,3)),iterations=1)
        skin[opening] = False
    # 입술의 붉은 색과 흰자·검은 선·속옷은 그대로 남긴다.
    lip = mouth & ((hue < .04) | (hue > .98)) & (sat > .25)
    if part.get('registrationVersion') != 3:
        skin[lip] = False
    # 원본 알파는 최종 이미지 합성에서 이미 사용한다. 여기서 다시 곱하면
    # 반투명한 피부 픽셀만 덜 칠해져 얼룩처럼 남는다.
    mask = ndimage.gaussian_filter(skin.astype(float), .35) * 255
    # 입술의 붉은 색은 남기되 피부가 어두워져도 원래 밝기의 반점처럼 뜨지 않게 한다.
    mask[lip] = 153
    if part.get('registrationVersion') == 3:
        # 확장 원화는 입술 일부만 색상 임계값으로 제외하면 밝은 점이 생긴다.
        mask = ndimage.gaussian_filter(skin.astype(float), .35) * 255
        mouth_y = part['mouthY']
        radius = np.sqrt(((xx-72)/19)**2+((yy-(mouth_y+2.5))/6.5)**2)
        mask *= 1-.15*np.clip((1-radius)/.35,0,1)
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
            if part.get('registrationVersion') != 3:
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
