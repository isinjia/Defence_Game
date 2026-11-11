"""체형별 턱·목·어깨 통합 원화를 동일한 얼굴 기준에 등록한다."""
import argparse
import json
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-dir', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent / 'assets/portraits/parts'
manifest = json.loads((root / 'manifest.json').read_text())
specs = {
 'm': [('normal','20a45a5e-8d84-4c79-91ae-aa24c7850469',648),('thin','a2c184f8-a59b-4997-a83e-d9c0e7cdc54d',647),('strong','2fa31684-5df1-49ff-8dde-07b9de88b911',648),('heavy','e873ea83-4158-4d33-af04-20f042f6f5e0',651)],
 'f': [('normal','e946f616-953c-45d0-b3f3-03881b0cc438',665),('thin','920db11e-7bea-47ad-b597-90dcbac49db7',663),('strong','87556948-3768-4cb2-bcbd-e274b59dcf32',664),('heavy','70d6e069-6584-4e39-82e3-41143933ed16',660)],
}
for gender, entries in specs.items():
    manifest['body-' + gender] = []
    for body_type, uid, source_chin in entries:
        image = Image.open(args.source_dir / ('exec-' + uid + '.png')).convert('RGBA')
        if image.size != (1254, 1254):
            raise ValueError('등록 기준 원화는 1254×1254입니다.')
        rgba = np.array(image)
        labels, _ = ndimage.label(rgba[:, :, 3] > 180)
        sizes = np.bincount(labels.ravel()); sizes[0] = 0
        keep = ndimage.binary_dilation(labels == sizes.argmax(), iterations=1)
        rgba[:, :, 3] = np.where(keep, rgba[:, :, 3], 0)
        scale, target_chin = (.335, 251) if gender == 'm' else (.379, 261)
        image = Image.fromarray(rgba).resize((round(image.width*scale), round(image.height*scale)), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (400, 600))
        canvas.alpha_composite(image, (round(200-627*scale), round(target_chin-source_chin*scale)))
        file = 'body-' + gender + ('' if (gender,body_type) in [('m','strong'),('f','normal')] else '-' + body_type) + '.webp'
        canvas.save(root / file, 'WEBP', quality=94, method=4)
        manifest['body-'+gender].append({'file':file,'rect':[0,0,400,600],'bodyType':body_type})
(root / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
