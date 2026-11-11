"""성인 기본 몸체·속옷 아틀라스를 공통 얼굴 좌표에 등록한다. 원본은 보존한다."""
import argparse
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
args = parser.parse_args()
source = Image.open(args.source).convert('RGBA')
if source.size != (1448, 1086):
    raise ValueError('등록 기준 아틀라스는 1448×1086 이미지입니다.')
root = Path(__file__).resolve().parent.parent / 'assets/portraits/parts'
# 자르기·균일 배율·목 중심 등록만 한다. 몸의 비율을 변형하지 않는다.
for gender, box, cx, top, scale in [
    ('m', (50, 350, 700, 1086), 366, 386, .76),
    ('f', (770, 350, 1400, 1086), 1087, 402, .86),
]:
    image = source.crop(box)
    rgba = np.array(image)
    labels, _ = ndimage.label(rgba[:, :, 3] > 180)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    keep = ndimage.binary_dilation(labels == sizes.argmax(), iterations=1)
    rgba[:, :, 3] = np.where(keep, rgba[:, :, 3], 0)
    image = Image.fromarray(rgba).resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (400, 900))
    canvas.alpha_composite(image, (round(200 + (box[0] - cx) * scale), round(270 + (box[1] - top) * scale)))
    canvas.save(root / ('body-' + gender + '.webp'), 'WEBP', quality=92, method=4)
