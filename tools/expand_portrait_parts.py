#!/usr/bin/env python3
"""초상화 파츠를 10~40대 초반 기준으로 약 5배 확장한다.

기존 파츠(성별당 얼굴·머리·의상 6종)를 유지한 채
- 얼굴: 피부톤·대비 변형 + (있으면) generated/ 신규 얼굴
- 머리: 스타일×자연 모발색
- 의상: 스타일×색상 변형
을 만들어 manifest와 js/portrait_parts.js 를 갱신한다.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / 'assets/portraits/parts'
GENERATED = PARTS / 'generated'
MODULE = ROOT / 'js/portrait_parts.js'

# 목표 수량 (성별당). 기존 0..5 를 포함해 채운다.
FACE_N = 15          # 성인·청소년 풀 (10대 후반~40대 초)
FACE_YOUTH_N = 3     # 10~12세 풀 (인덱스 FACE_N ..)
HAIR_N = 20
CLOTH_N = 30

HAIR_COLORS = [
    (0.00, 1.00, 1.00),   # 원본(검정 계열)
    (0.06, 0.85, 1.15),   # 따뜻한 다크브라운
    (0.10, 0.55, 1.45),   # 라이트 브라운
    (-0.05, 0.25, 1.55),  # 애쉬/회갈
    (0.14, 0.70, 1.65),   # 호박 브라운
    (-0.02, 0.05, 1.85),  # 은빛(이른 흰머리, 40대 초)
]

CLOTH_HUES = [0.0, 0.08, 0.18, -0.12, 0.33, -0.28, 0.45, -0.40]


def load_rgba(path: Path) -> np.ndarray:
    return np.array(Image.open(path).convert('RGBA'), dtype=np.float32)


def save_webp(arr: np.ndarray, path: Path) -> None:
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=90, method=0)


def rgb_to_hsv(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0] / 255.0, rgb[..., 1] / 255.0, rgb[..., 2] / 255.0
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    df = mx - mn
    h = np.zeros_like(mx)
    mask = df > 1e-6
    r_eq = (mx == r) & mask
    g_eq = (mx == g) & mask
    b_eq = (mx == b) & mask
    h[r_eq] = np.mod((g[r_eq] - b[r_eq]) / df[r_eq], 6.0)
    h[g_eq] = (b[g_eq] - r[g_eq]) / df[g_eq] + 2.0
    h[b_eq] = (r[b_eq] - g[b_eq]) / df[b_eq] + 4.0
    h = h / 6.0
    s = np.zeros_like(mx)
    s[mx > 1e-6] = df[mx > 1e-6] / mx[mx > 1e-6]
    return np.stack([h, s, mx], axis=-1)


def hsv_to_rgb(hsv: np.ndarray) -> np.ndarray:
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    i = np.floor(h * 6.0).astype(np.int32)
    f = h * 6.0 - i
    p = v * (1.0 - s)
    q = v * (1.0 - f * s)
    t = v * (1.0 - (1.0 - f) * s)
    i = i % 6
    out = np.zeros(hsv.shape[:-1] + (3,), dtype=np.float32)
    choices = [
        (v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q),
    ]
    for k, (rr, gg, bb) in enumerate(choices):
        m = i == k
        out[m, 0], out[m, 1], out[m, 2] = rr[m], gg[m], bb[m]
    return out * 255.0


def shift_hue(arr: np.ndarray, dh: float, sat_mul: float = 1.0, val_mul: float = 1.0, protect_white: bool = True) -> np.ndarray:
    out = arr.copy()
    a = out[..., 3] > 8
    if not np.any(a):
        return out
    hsv = rgb_to_hsv(out[..., :3])
    if protect_white:
        # 깃·단추 등 밝은 중립색은 유지
        keep = (hsv[..., 1] < 0.12) & (hsv[..., 2] > 0.72)
        editable = a & ~keep
    else:
        editable = a
    hsv[editable, 0] = np.mod(hsv[editable, 0] + dh, 1.0)
    hsv[editable, 1] = np.clip(hsv[editable, 1] * sat_mul, 0, 1)
    hsv[editable, 2] = np.clip(hsv[editable, 2] * val_mul, 0, 1)
    out[editable, :3] = hsv_to_rgb(hsv)[editable]
    return out


def recolor_hair(arr: np.ndarray, dh: float, sat_mul: float, val_mul: float) -> np.ndarray:
    # 머리 파츠는 거의 전부가 모발. 하이라이트 비율을 유지하며 색만 옮긴다.
    return shift_hue(arr, dh, sat_mul, val_mul, protect_white=False)


def recolor_face(arr: np.ndarray, tone: str) -> np.ndarray:
    out = arr.copy()
    a = out[..., 3] > 8
    rgb = out[..., :3]
    # 눈·입술·눈썹(어둡거나 채도 높은 부분)은 덜 건드린다.
    lum = rgb.mean(axis=-1)
    hsv = rgb_to_hsv(rgb)
    skin = a & (hsv[..., 1] < 0.55) & (lum > 70) & (lum < 245)
    if tone == 'warm':
        rgb[skin, 0] = np.clip(rgb[skin, 0] * 1.06 + 6, 0, 255)
        rgb[skin, 1] = np.clip(rgb[skin, 1] * 1.01, 0, 255)
        rgb[skin, 2] = np.clip(rgb[skin, 2] * 0.94, 0, 255)
    elif tone == 'cool':
        rgb[skin, 0] = np.clip(rgb[skin, 0] * 0.95, 0, 255)
        rgb[skin, 1] = np.clip(rgb[skin, 1] * 1.00, 0, 255)
        rgb[skin, 2] = np.clip(rgb[skin, 2] * 1.08 + 4, 0, 255)
    elif tone == 'deep':
        rgb[skin] = np.clip(rgb[skin] * 0.78 + np.array([18, 10, 4]), 0, 255)
    elif tone == 'fair':
        rgb[skin] = np.clip(rgb[skin] * 1.08 + 10, 0, 255)
    elif tone == 'olive':
        rgb[skin, 0] = np.clip(rgb[skin, 0] * 0.96, 0, 255)
        rgb[skin, 1] = np.clip(rgb[skin, 1] * 1.05 + 4, 0, 255)
        rgb[skin, 2] = np.clip(rgb[skin, 2] * 0.90, 0, 255)
    out[..., :3] = rgb
    return out


def ensure_base(kind: str, g: str, n: int) -> Path:
    path = PARTS / f'{kind}-{g}-{n}.webp'
    if not path.exists():
        raise SystemExit(f'missing base part: {path}')
    return path


def rect_for(kind: str, g: str, index: int, base_manifest: dict) -> list[int]:
    key = f'{kind}-{g}' if kind != 'traits' else 'traits'
    base = base_manifest[key][index % len(base_manifest[key])]['rect']
    return list(base)


def import_generated_face(g: str, src: Path, size=(144, 250)) -> np.ndarray:
    """생성 얼굴을 기존 파츠와 같은 눈·턱 높이에 맞춰 144×250으로 넣는다."""
    im = Image.open(src).convert('RGBA')
    arr = np.array(im)
    rgb = arr[..., :3].astype(np.int16)
    dark = (rgb.max(axis=-1) < 45) | ((rgb.max(axis=-1) < 70) & (np.ptp(rgb, axis=-1) < 12))
    arr[..., 3] = np.where(dark, 0, np.maximum(arr[..., 3], 255))
    ys, xs = np.where(arr[..., 3] > 10)
    if len(xs) == 0:
        raise SystemExit(f'empty generated face: {src}')
    crop = Image.fromarray(arr).crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    c = np.array(crop)
    a = c[..., 3]; rgb = c[..., :3].astype(float)
    h, w = a.shape
    cx0, cx1 = w * 30 // 100, w * 70 // 100
    chin = next((y for y in range(h - 1, -1, -1) if a[y, cx0:cx1].max() > 40), h - 1)
    eye, best = int(h * 0.35), -1.0
    for y in range(int(h * 0.2), int(h * 0.55)):
        if a[y, cx0:cx1].max() < 40:
            continue
        score = float(rgb[y, cx0:cx1].std())
        if score > best:
            best, eye = score, y
    ref_eye, ref_chin = 96, 248
    scale = (ref_chin - ref_eye) / max(1, chin - eye)
    nw, nh = max(1, int(round(crop.width * scale))), max(1, int(round(crop.height * scale)))
    resized = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (size[0] - nw) // 2, int(round(ref_eye - eye * scale))
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    left, top = max(0, -ox), max(0, -oy)
    right = nw - max(0, (ox + nw) - size[0])
    bot = nh - max(0, (oy + nh) - size[1])
    if right > left and bot > top:
        canvas.alpha_composite(resized.crop((left, top, right, bot)), (max(0, ox), max(0, oy)))
    return np.array(canvas.convert('RGBA'), dtype=np.float32)


def build() -> dict:
    base_manifest = json.loads((PARTS / 'manifest.json').read_text())
    manifest: dict[str, list] = {k: [] for k in [
        'face-m', 'face-f', 'hair-m', 'hair-f', 'cloth-m', 'cloth-f', 'traits'
    ]}
    # traits 는 그대로
    manifest['traits'] = base_manifest['traits']

    face_tones = ['base', 'warm', 'cool', 'deep', 'fair']
    # 성인 얼굴 0,1,2 를 톤별로 펼치고, 남는 칸은 순환
    for g in ('m', 'f'):
        # 옛 child(인덱스 5)를 유스 원본으로 고정 보존한다. 한 번 저장하면 이후 재실행에도 유지.
        youth_path = PARTS / f'face-{g}-youth-base.webp'
        if youth_path.exists():
            youth_base = load_rgba(youth_path)
        else:
            youth_base = load_rgba(ensure_base('face', g, 5))
            save_webp(youth_base, youth_path)
        adult_sources = [0, 1, 2]
        for i in range(FACE_N):
            src_i = adult_sources[i % 3]
            tone = face_tones[(i // 3) % len(face_tones)]
            src = load_rgba(ensure_base('face', g, src_i if src_i < 3 else 0))
            # 인덱스 5는 원래 child였으므로 성인 변형은 0번을 원본으로 쓴다.
            if i == 5:
                src = load_rgba(ensure_base('face', g, 0))
            arr = src if tone == 'base' and i < 3 else recolor_face(src, 'warm' if tone == 'base' else tone)
            if i >= 3:
                contrast = 1.0 + ((i // 3) % 3) * 0.03
                mid = arr[..., :3]
                a = arr[..., 3] > 8
                mid[a] = np.clip((mid[a] - 128) * contrast + 128, 0, 255)
                arr[..., :3] = mid
            used_gen = False
            for ext in ('.webp', '.png', '.jpg', '.jpeg'):
                gen = GENERATED / f'face-{g}-{i}{ext}'
                if gen.exists():
                    arr = import_generated_face(g, gen)
                    used_gen = True
                    break
            path = PARTS / f'face-{g}-{i}.webp'
            # 0..2 원본만 보존. 3..14(옛 child 슬롯 5 포함)는 성인 풀로 저장.
            if i >= 3 or used_gen:
                save_webp(arr, path)
            manifest[f'face-{g}'].append({'file': f'face-{g}-{i}.webp', 'rect': [128, 55, 144, 250]})

        # 유스(10~12): 보존해 둔 child + 톤 변형 → 인덱스 15..
        for j, tone in enumerate(['base', 'warm', 'fair'][:FACE_YOUTH_N]):
            idx = FACE_N + j
            arr = youth_base if tone == 'base' else recolor_face(youth_base, tone)
            save_webp(arr, PARTS / f'face-{g}-{idx}.webp')
            manifest[f'face-{g}'].append({'file': f'face-{g}-{idx}.webp', 'rect': [128, 55, 144, 250]})

        # 머리: 젊은 스타일 0..3(+4) × 서로 다른 색 조합으로 HAIR_N개 (중복 없이)
        style_pool = [0, 1, 2, 3, 4]
        pairs = []
        for color in HAIR_COLORS:
            for style in style_pool:
                pairs.append((style, color))
        # 원본 6종을 앞에 고정
        ordered = [(i, HAIR_COLORS[0]) for i in range(6)]
        for pair in pairs:
            if len(ordered) >= HAIR_N:
                break
            if pair[0] < 6 and pair[1] == HAIR_COLORS[0]:
                continue
            ordered.append(pair)
        while len(ordered) < HAIR_N:
            ordered.append(pairs[len(ordered) % len(pairs)])
        for i in range(HAIR_N):
            style, (dh, sat, val) = ordered[i]
            base = load_rgba(ensure_base('hair', g, style))
            base_entry = base_manifest[f'hair-{g}'][style]
            rect = list(base_entry['rect'])
            arr = base if (dh == 0 and sat == 1 and val == 1) else recolor_hair(base, dh, sat, val)
            for ext in ('.webp', '.png', '.jpg', '.jpeg'):
                gen = GENERATED / f'hair-{g}-{i}{ext}'
                if gen.exists():
                    gim = Image.open(gen).convert('RGBA')
                    a = np.array(gim)
                    rgb = a[..., :3].astype(np.int16)
                    dark = rgb.max(axis=-1) < 28
                    a[..., 3] = np.where(dark, 0, np.maximum(a[..., 3], 220))
                    ys, xs = np.where(a[..., 3] > 10)
                    if len(xs):
                        crop = Image.fromarray(a).crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
                        arr = np.array(crop.resize((rect[2], rect[3]), Image.Resampling.LANCZOS), dtype=np.float32)
                    break
            path = PARTS / f'hair-{g}-{i}.webp'
            # 0..5 원본 헤어 파일은 절대 덮지 않는다.
            if i >= 6:
                save_webp(arr, path)
            manifest[f'hair-{g}'].append({'file': f'hair-{g}-{i}.webp', 'rect': rect})

        # 의상: 6종 스타일 × 색
        for i in range(CLOTH_N):
            style = i % 6
            hue = CLOTH_HUES[(i // 6) % len(CLOTH_HUES)]
            sat = 1.0 if (i // 6) == 0 else 0.92 + (i % 5) * 0.03
            val = 1.0 if (i // 6) == 0 else 0.90 + (i % 4) * 0.04
            base = load_rgba(ensure_base('cloth', g, style))
            rect = list(base_manifest[f'cloth-{g}'][style]['rect'])
            arr = base if (hue == 0 and sat == 1 and val == 1 and i < 6) else shift_hue(base, hue, sat, val, protect_white=True)
            path = PARTS / f'cloth-{g}-{i}.webp'
            # 0..5 원본 의상 파일은 절대 덮지 않는다.
            if i >= 6:
                save_webp(arr, path)
            manifest[f'cloth-{g}'].append({'file': f'cloth-{g}-{i}.webp', 'rect': rect})

    for g in ['m', 'f']:
        if (PARTS / f'body-{g}.webp').exists():
            manifest[f'body-{g}'] = [{'file': f'body-{g}.webp', 'rect': [0, 0, 400, 900]}]
    from calibrate_portrait_skin import calibrate
    calibrate(manifest, PARTS)
    (PARTS / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    return manifest


def patch_module(manifest: dict) -> None:
    text = MODULE.read_text(encoding='utf-8')
    blob = json.dumps(manifest, ensure_ascii=False, indent=2)
    # portrait_parts.js 안의 parts 리터럴을 manifest로 교체
    text2, n = re.subn(
        r'  const parts = \{[\s\S]*?\n\};\n  const escape',
        '  const parts = ' + blob + ';\n  const escape',
        text,
        count=1,
    )
    if n != 1:
        raise SystemExit('failed to patch js/portrait_parts.js parts literal')
    MODULE.write_text(text2, encoding='utf-8')


def main() -> None:
    GENERATED.mkdir(parents=True, exist_ok=True)
    manifest = build()
    patch_module(manifest)
    counts = {k: len(v) for k, v in manifest.items()}
    print('expanded', counts)
    print('webp', sum(1 for _ in PARTS.glob('*.webp')))


if __name__ == '__main__':
    main()
