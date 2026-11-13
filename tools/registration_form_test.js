// 신청서의 실제 모바일 배치, 상세 보기, 재열람·시험 전환·저장 상태를 확인한다.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream'});res.end(error?'missing':data)});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch(),results=[],errors=[];
 try{
  for(const viewport of[{width:320,height:568},{width:390,height:844},{width:1024,height:900}]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   await page.goto('http://127.0.0.1:'+server.address().port);await page.click('[data-opening="skip"]');await page.waitForFunction(()=>GateBoot.ready);
   await page.evaluate(()=>{UI.handle('new');UI.handle('mode-manual');UI.create.name='등록검사';UI.handle('c-start');});
   await page.waitForSelector('.registration-modal .registration');
   const skill=page.locator('.registration [data-act="st-sk"]').first();
   if(await skill.count()){await skill.click();await page.waitForSelector('#skill-hold');await page.evaluate(()=>UI.hideSkillHold());}
   const layout=await page.evaluate(()=>{
    const p=G.player,form=document.querySelector('.registration'),paper=form.querySelector('.reg-paper'),foot=form.querySelector('.reg-action'),button=foot.querySelector('button');
    if(!form.textContent.includes(p.name)||form.querySelector('h2').textContent!=='각성자 등록 신청서')throw Error('신청인 또는 제목 누락');
    if(form.querySelectorAll('.reg-stats b').length!==6||form.querySelectorAll('.reg-section').length!==6)throw Error('등록 항목 누락');
    if(form.querySelector('[data-act="st-go"]').textContent.indexOf('신청서 제출')<0)throw Error('제출 버튼 없음');
    const before=button.getBoundingClientRect();paper.scrollTop=paper.scrollHeight;const after=button.getBoundingClientRect();
    if(Math.abs(before.top-after.top)>1||after.bottom>innerHeight||after.height<48)throw Error('제출 버튼 고정·접근 실패');
    if(paper.scrollWidth>paper.clientWidth+1||document.documentElement.scrollWidth>innerWidth)throw Error('가로 넘침');
    // 긴 이름·빈 목록이 문서를 깨거나 마크업으로 실행되지 않아야 한다.
    const saved={name:p.name,skills:p.skills,traits:p.traits};
    try{
     p.name='아주긴이름의신청인 <검사>';p.skills=['strike'];p.traits=[];
     UI.showStatusCheck(true);const long=document.querySelector('.registration');
     if(!long.textContent.includes(p.name)||long.querySelector('검사')||!long.textContent.includes('등록된 기술 없음')||!long.textContent.includes('특이 사항 없음'))throw Error('긴 이름·빈 목록 처리 실패');
     const scroll=long.querySelector('.reg-paper');if(scroll.scrollWidth>scroll.clientWidth+1)throw Error('긴 이름 가로 넘침');
    }finally{Object.assign(p,saved);UI.showStatusCheck(true);}
    return {width:innerWidth,height:innerHeight,buttonHeight:after.height};
   });
   const output=process.env.REGISTRATION_SCREENSHOTS;if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,`registration-${viewport.width}.png`)});}
   await page.evaluate(()=>{
    // 신청서가 기존 정보를 읽을 뿐 등급을 미리 공개하거나 시험을 먼저 끝내면 안 된다.
    if(G.player.rankRevealed)throw Error('등급 조기 공개');
    UI.showStatusCheck(false);
    if(document.querySelector('.registration')||!document.querySelector('[data-act="st-back"]')||document.querySelector('.registration-modal'))throw Error('정보 탭 재열람 변경됨');
    UI.showStatusCheck(true);
   });
   await page.click('[data-act="st-go"]');
   // 서명·페이드 연출 후 시험장으로 (reducedMotion이면 짧게)
   await page.waitForFunction(()=>G.player.statusSeen&&!UI._stPending&&!UI._regSigning&&!document.querySelector('.registration')&&!!UI.exam,{timeout:15000});
   await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem(SAVE_KEY));if(!data.player.statusSeen)throw Error('신청서 제출 상태 저장 실패');});
   results.push(layout);await page.close();
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({viewports:results,skillDetails:true,existingInfoView:true,examTransition:true,submitSignFade:true,savedStatus:true,pageErrors:errors.length}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1)});
