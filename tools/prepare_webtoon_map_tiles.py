#!/usr/bin/env python3
"""승인된 4×3 웹툰 타일 시트에서 지형 11종과 연결 마스크를 준비한다."""
from argparse import ArgumentParser
from pathlib import Path
import numpy as np
from PIL import Image

NAMES = ['sea', 'plain', 'mountain', 'ruin', 'ether', 'city', 'bridge', 'north', 'forest', 'field', 'waste']


def save(image, path):
    pixels = np.array(image.convert('RGBA'))
    # 완전 투명한 픽셀의 숨은 RGB만 비워 PNG 용량을 줄인다. 표시 결과는 동일하다.
    pixels[pixels[:, :, 3] == 0, :3] = 0
    Image.fromarray(pixels).save(path, 'PNG', optimize=True)


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--sheet', type=Path, help='4열×3행 원본 시트. 생략하면 등록된 타일로 마스크만 갱신한다.')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parent.parent / 'assets/map')
    args = parser.parse_args()
    (args.output / 'tiles').mkdir(parents=True, exist_ok=True)
    (args.output / 'overlays').mkdir(exist_ok=True)
    sheet = Image.open(args.sheet).convert('RGBA') if args.sheet else None
    if sheet and (sheet.width % 4 or sheet.height % 3 or sheet.width // 4 != sheet.height // 3):
        raise ValueError('동일 크기의 정사각형 4열×3행 시트가 필요합니다.')
    for i, name in enumerate(NAMES):
        if sheet:
            n = sheet.width // 4
            x, y = i % 4 * n, i // 4 * n
            tile = sheet.crop((x, y, x+n, y+n))
            save(tile, args.output / 'tiles' / f'{name}.png')
        else:
            tile = Image.open(args.output / 'tiles' / f'{name}.png').convert('RGBA')
        n = tile.width
        yy, xx = np.indices((n, n))
        if name == 'plain':
            continue
        pixels = np.array(tile)
        pixels[:, :, 3] = (.55 * np.clip(1-yy/(n*.22), 0, 1)**1.5 * 255).astype('uint8')
        save(Image.fromarray(pixels), args.output / 'overlays' / f'{name}_N.png')
        for corner, (cx, cy) in enumerate([(0, n), (n, n), (n, 0), (0, 0)]):
            pixels = np.array(tile)
            alpha = .35 * np.clip(1-np.hypot(xx-cx, yy-cy)/(n*.20), 0, 1)**1.5
            pixels[:, :, 3] = (alpha*255).astype('uint8')
            save(Image.fromarray(pixels), args.output / 'overlays' / f'{name}_C{corner}.png')
    print('웹툰 타일 11종, 연결 이미지 50종 준비 완료')


if __name__ == '__main__':
    main()
