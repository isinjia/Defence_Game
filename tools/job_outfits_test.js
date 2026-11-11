// 현대 헌터 직업복: 전체 직업·남녀·체형의 턱/목/피부색 합성과 NPC 연결을 확인한다.
const fs=require('fs'),path=require('path'),http=require('http');
const{chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{
  const u=decodeURIComponent(req.url.split('?')[0]),file=path.join(root,u==='/'?'index.html':u);
  fs.readFile(file,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'}[path.extname(file)]||'application/octet-stream'});res.end(e?'missing':b)});
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch();
 try{
 const p=await browser.newPage({viewport:{width:1300,height:950},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('https://fonts.googleapis.com/**',r=>r.abort());await p.goto('http://127.0.0.1:'+server.address().port);await p.click('[data-opening="skip"]');
 const result=await p.evaluate(async()=>{
  const seen=new Set(),pictures=[],bodies=['thin','normal','strong','heavy'];let cards=0,avatars=0;
  const read=async source=>{const im=new Image();im.src=await PortraitParts.rasterize(source);await im.decode();const cv=document.createElement('canvas');cv.width=400;cv.height=480;const c=cv.getContext('2d');c.drawImage(im,0,0);return c;};
  for(const gender of ['M','F']){
   let seed;for(let i=0;i<30000;i++){const s='look3:outfit-test-'+i,q=PortraitParts.select(s,gender,{outfit:'underwear'});if(q.layers[0].file===`face-${gender.toLowerCase()}-${gender==='M'?18:19}.webp`&&q.layers[2].file===`hair-${gender.toLowerCase()}-${gender==='M'?20:26}.webp`&&q.layers.length===3){seed=s;break;}}
   if(!seed)throw Error('검사 인물 없음');
   const bare=new Map();for(const bodyType of bodies)for(const skinTone of ['natural','deep'])bare.set(bodyType+skinTone,await read(PORTRAIT.card(seed,gender,null,0,400,{outfit:'underwear',bodyType,skinTone})));
   for(const cls of CLASSES){
    const outfit=HunterOutfits.outfitFor(cls.id);if(!outfit||Wardrobe.profession(cls.id)!==outfit)throw Error('직업 누락 '+cls.id);
    const part=HunterOutfits.get(outfit,gender);seen.add(part.file);
    const npc=UI.npcLook({id:10,name:cls.name,gender,ageMonths:300,race:'human',cls:cls.id});if(npc.outfit!==outfit)throw Error('NPC 직업복 누락 '+cls.id);
    const helper=UI.unitSprite({cls:cls.id,portrait:{seed,gender,elem:'fire'},tier:0},64);
    if(new DOMParser().parseFromString(helper,'image/svg+xml').documentElement.dataset.jobClass!==cls.id)throw Error('지원 헌터 직업복 누락 '+cls.id);
    for(const bodyType of bodies){
     const palette=[];
     for(const skinTone of ['natural','deep']){
      const source=PORTRAIT.card(seed,gender,null,0,400,{outfit,bodyType,skinTone});const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
      if(svg.dataset.jobClass!==cls.id||svg.dataset.bodyType!==bodyType||svg.dataset.skinTone!==skinTone)throw Error('외형 정보 소실');
      const ctx=await read(source),base=bare.get(bodyType+skinTone),chin=(gender==='M'?251:261),pivot=chin+24,actual=pivot+(chin-pivot)*PortraitParts.HEAD_SCALE[gender][bodyType];
      const jawY=Math.floor(actual-4),a=ctx.getImageData(200,jawY,1,1).data,b=base.getImageData(200,jawY,1,1).data;
      if([0,1,2].some(k=>Math.abs(a[k]-b[k])>8))throw Error('턱 덮임 '+gender+cls.id+bodyType);
      const front=Number(svg.dataset.jobFrontY),neckY=Math.round((actual+front)/2),n=ctx.getImageData(200,neckY,1,1).data;
      const bn=base.getImageData(200,neckY,1,1).data;
      if([0,1,2].some(k=>Math.abs(n[k]-bn[k])>8))throw Error('목 연결 단절 '+gender+cls.id+bodyType+' '+[...n]);
      palette.push([...ctx.getImageData(200,Math.ceil(front+20),1,1).data]);cards++;
     }
     if([0,1,2].some(k=>Math.abs(palette[0][k]-palette[1][k])>3))throw Error('피부색이 의상에 적용됨 '+cls.id);
    }
    const avatar=await PortraitParts.rasterize(PORTRAIT.avatar(seed,gender,null,0,64,{outfit}));if(!avatar.startsWith('data:image/png'))throw Error('원형 초상 변환 실패');avatars++;
    pictures.push({gender,id:cls.id,name:cls.name,data:await PortraitParts.rasterize(PORTRAIT.card(seed,gender,null,0,200,{outfit}))});
   }
  }
  if(seen.size!==74)throw Error('의상 파일 중복 또는 누락');
  window.outfitPictures=pictures;
  return{jobs:CLASSES.length,garments:seen.size,cards,avatars,npcMappings:CLASSES.length*2,helpers:CLASSES.length*2};
 });
 const dest=process.env.OUTFIT_SCREENSHOTS;if(dest){fs.mkdirSync(dest,{recursive:true});for(const g of ['M','F'])for(let page=0;page<Math.ceil(result.jobs/10);page++){
  await p.evaluate(({g,page})=>{const a=outfitPictures.filter(x=>x.gender===g).slice(page*10,page*10+10);document.getElementById('app').innerHTML='<div id="outfits" style="display:grid;grid-template-columns:repeat(5,220px);gap:14px;padding:18px;background:#101922;color:#e0edef">'+a.map(x=>`<div><p>${x.name}</p><img width="220" src="${x.data}"></div>`).join('')+'</div>';return Promise.all([...document.querySelectorAll('#outfits img')].map(i=>i.decode()))},{g,page});
  await p.locator('#outfits').screenshot({path:path.join(dest,`jobs-${g}-${page+1}.png`)});
 }}
 if(errors.length)throw Error(errors[0]);console.log(JSON.stringify({...result,pageErrors:errors.length}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
