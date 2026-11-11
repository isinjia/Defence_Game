from PIL import Image
import numpy as np
from scipy import ndimage
from pathlib import Path
import json
import argparse
parser=argparse.ArgumentParser(description='생성된 아틀라스에서 초상화 파츠를 추출하고 등록 좌표를 저장한다.')
parser.add_argument('--source-dir', type=Path, required=True)
args=parser.parse_args()
project=Path(__file__).resolve().parent.parent
root=project/'assets/portraits/parts'
root.mkdir(parents=True, exist_ok=True)
sources={'face-m':'510f9cc7-734f-455c-b348-a72181a42df9','face-f':'cdc2110d-b09b-414a-af30-7c7a3f7f9696','hair-m':'5c15bb35-fee4-4e46-89cc-b4a87fa33f8c','hair-f':'2b3d6e77-97ed-47cd-a5e1-9e3048b012a5','cloth-m':'754c1542-e666-49c3-8d44-a6da19c8b530','cloth-f':'9545cd88-da69-4702-963a-fc8fdf235d52','traits':'5b6d8013-d964-4be8-898b-c52ca201bdb3'}
manifest={}
for kind,uid in sources.items():
 im=Image.open(args.source_dir/('exec-'+uid+'.png')).convert('RGBA'); w,h=im.size
 entries=[]
 for i in range(6):
  col,row=i%3,i//3
  if kind.startswith('cloth'):
   split=835 if kind=='cloth-m' else 800
   box=(col*w//3,400 if row==0 and kind=='cloth-m' else 350 if row==0 else split,(col+1)*w//3,split if row==0 else h)
  else:box=(col*w//3,row*h//2,(col+1)*w//3,(row+1)*h//2)
  tile=im.crop(box); a=np.array(tile); mask=a[:,:,3]>200
  labels,n=ndimage.label(mask); sizes=np.bincount(labels.ravel());sizes[0]=0
  keep=np.argsort(sizes)[-2:] if kind=='traits' and i<4 else [sizes.argmax()]
  keep=[v for v in keep if sizes[v]>25]
  solid=np.isin(labels,keep); solid=ndimage.binary_dilation(solid,iterations=1)
  # Atlas extraction: retain the selected sprite's antialiased edge, discard detached atlas matte/noise.
  a[:,:,3]=np.where(solid,a[:,:,3],0)
  tile=Image.fromarray(a); bbox=tile.getbbox()
  if not bbox:raise Exception(kind+str(i))
  sprite=tile.crop(bbox)
  if kind.startswith('face'):rect=[128,55,144,250]
  elif kind=='hair-m':rect=[105,28,190,round(sprite.height*190/sprite.width)]
  elif kind=='hair-f':rect=[80,24,240,round(sprite.height*240/sprite.width)]
  elif kind.startswith('cloth'):rect=[0 if kind=='cloth-m' else 10,258,400 if kind=='cloth-m' else 380,342]
  else:
   rect=[[91,162,218,66],[103,0,194,98],[100,0,200,106],[179,224,42,24],[139,222,122,98],[145,148,110,30]][i]
  sprite=sprite.resize((rect[2],rect[3]),Image.Resampling.LANCZOS)
  file=kind+'-'+str(i)+'.webp';sprite.save(root/file,'WEBP',quality=90,method=0)
  entries.append({'file':file,'rect':rect})
 manifest[kind]=entries
# 정면 기준 얼굴에 맞춰 제작한 헤어. 부분 늘이기 없이 전체 등록 캔버스를 유지한다.
for index, uid in [(0,'2c721269-ebc4-4a78-af16-adacdb50d805'),(2,'8f956432-4439-41f4-89aa-db57ce6c8107'),(3,'98867182-3a2b-4cd8-bfc6-14c82aa0c65d'),(5,'ac9ea95c-a9dc-4261-bf70-2f9f2dbb6735')]:
 im=Image.open(args.source_dir/('exec-'+uid+'.png')).convert('RGBA')
 a=np.array(im); labels,n=ndimage.label(a[:,:,3]>200); sizes=np.bincount(labels.ravel());sizes[0]=0
 solid=ndimage.binary_dilation(labels==sizes.argmax(),iterations=1)
 a[:,:,3]=np.where(solid,a[:,:,3],0)
 im=Image.fromarray(a).resize((400,600),Image.Resampling.LANCZOS)
 file='hair-f-'+str(index)+'.webp';im.save(root/file,'WEBP',quality=90,method=0)
 manifest['hair-f'][index]={'file':file,'rect':[0,0,400,600]}
# 안경은 높은 해상도의 얇은 테를 별도 제작하며 렌즈 안쪽의 투명도를 유지한다.
im=Image.open(args.source_dir/'exec-3808270e-002c-4921-bc96-89482563638d.png').convert('RGBA')
a=np.array(im);labels,n=ndimage.label(a[:,:,3]>180);sizes=np.bincount(labels.ravel());sizes[0]=0
solid=ndimage.binary_dilation(labels==sizes.argmax(),iterations=1)
a[:,:,3]=np.where(solid,a[:,:,3],0)
im=Image.fromarray(a);im=im.crop(im.getbbox()).resize((400,80),Image.Resampling.LANCZOS)
im.save(root/'traits-5.webp','WEBP',lossless=True,method=0)
manifest['traits'][5]={'file':'traits-5.webp','rect':[150,148,100,20]}
# 기본 몸체는 별도 아틀라스에서 준비한다. 기존 등록을 함께 유지한다.
for g in ['m', 'f']:
 if (root/('body-'+g+'.webp')).exists():
  previous=json.loads((root/'manifest.json').read_text())
  manifest['body-'+g]=previous.get('body-'+g,[{'file':'body-'+g+'.webp','rect':[0,0,400,600]}])
from calibrate_portrait_skin import calibrate
calibrate(manifest, root)
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
# Assembly preview using exactly the exported registered parts.
preview=Image.new('RGB',(1200,600),'#182230')
for j,(g,face,hair,cloth) in enumerate([('m',0,0,0),('f',0,0,0),('m',4,5,3)]):
 c=Image.new('RGBA',(400,600),'#182230')
 for k,i in [('face-'+g,face),('cloth-'+g,cloth),('hair-'+g,hair)]:
  p=manifest[k][i];c.alpha_composite(Image.open(root/p['file']),tuple(p['rect'][:2]))
 preview.paste(c.convert('RGB'),(j*400,0))
preview.save(project.parent/'portrait-parts-preview.png')
print('parts',sum(map(len,manifest.values())),'bytes',sum(p.stat().st_size for p in root.glob('*.webp')))

import re
module=project/'js/portrait_parts.js'
if module.exists():
 text=module.read_text()
 text=re.sub(r'  const parts = [\s\S]*?;\n  const escape',lambda _: '  const parts = '+(root/'manifest.json').read_text()+';\n  const escape',text,count=1)
 module.write_text(text)
