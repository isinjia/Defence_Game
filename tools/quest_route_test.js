// 메인 자동 안내·의뢰 추적·노란 경로·저장·목적지 갱신과 모바일 조작을 검사한다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const browser = await chromium.launch();
  let server;
  try {
    let url = process.env.QUEST_ROUTE_TEST_URL;
    if (!url) {
      const root = path.resolve(__dirname, '..');
      server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]);
        const file = path.resolve(root, '.' + (rel === '/' ? '/index.html' : rel));
        if (!file.startsWith(root + '/')) { res.writeHead(403); return res.end(); }
        fs.readFile(file, (error, data) => {
          res.writeHead(error ? 404 : 200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' });
          res.end(error ? 'missing' : data);
        });
      });
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      url = 'http://127.0.0.1:' + server.address().port;
    }
    const errors=[], results=[];
    for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:568}]) {
    const page = await browser.newPage({viewport,reducedMotion:'reduce'});
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto(url);
    await page.click('[data-opening="skip"]');
    await page.waitForFunction(() => GateBoot.ready);
    await page.evaluate(() => {
      UI.handle('new');UI.handle('mode-manual');UI.create.name='경로 검사';UI.handle('c-start');UI.closeModal();UI._stPending=false;
      G.player.statusSeen=true;G.player.examDone=true;G.queue=[];UI.ctx=null;UI.exam=null;UI.travel=null;
      const p=G.player;[p.x,p.y]=WORLD.cityPos.gangnam;p.region='gangnam';p.questRoute=null;
      p.quests=[{id:101,kind:'bounty',type:'courier',title:'인천 봉인 화물 전달',from:'gangnam',dest:'incheon',status:'active',deadline:G.monthKey()+2},{id:102,kind:'bounty',type:'courier',title:'선임에게 서류 전달',from:'gangnam',dest:'gangbuk',status:'active',deadline:G.monthKey()+2}];
      MAIN.ch(1,{part:1,title:'북부 협회로',where:'gangbuk',goal:'강북 협회로 이동',scenes:[]});
      const M=G.mainState();M.ch=1;M.open[1]=true;M.done[1]=false;M.pendingDay=null;
      G.reveal(p.x,p.y,18);UI.renderGame();
      const data=UI.map.questRouteData();
      if(data.dest.kind!=='main'||data.path.at(-1)!==WORLD.idx(...WORLD.cityPos.gangbuk))throw Error('기본 메인 안내 없음');
      if(UI.map.hover!==-1||UI._moveSel)throw Error('마우스·칸 선택에 의존하는 안내');
      const old=WORLD.reach;let count=0;WORLD.reach=(...args)=>{count++;return old(...args)};
      try{for(let i=0;i<10;i++)UI.map.questRouteData();if(count)throw Error('프레임마다 길 찾기 재실행');}finally{WORLD.reach=old;}
      const ctx=UI.map.ctx,stroke=ctx.stroke,colors=[];
      ctx.stroke=function(...args){colors.push(this.strokeStyle);return stroke.apply(this,args)};
      try{UI.map.drawQuestRoute();}finally{ctx.stroke=stroke;}
      if(!colors.includes('#ffe23b'))throw Error('노란 안내선 없음');
      window.__beforeRoute={x:p.x,y:p.y,day:G.day,frac:p.dayFrac,hp:p.hp};
    });
    const first=page.locator('#hud-tr [data-act="qr-track"][data-v="q:101"]');
    if(await first.isVisible())await first.click();
    else { await page.evaluate(()=>UI.openSheet('quest'));await page.locator('#modal-box [data-act="qr-track"][data-v="q:101"]').click(); }
    await page.evaluate(()=>{
      const d=UI.map.questRouteData();
      if(d.dest.key!=='q:101'||d.path.at(-1)!==WORLD.idx(...WORLD.cityPos.incheon))throw Error('선택한 의뢰 안내로 바뀌지 않음');
      const p=G.player,b=__beforeRoute;
      if(p.x!==b.x||p.y!==b.y||G.day!==b.day||p.dayFrac!==b.frac||p.hp!==b.hp||UI.walking)throw Error('추적이 자동 이동·시간 진행을 시작함');
      G.save();if(!G.load())throw Error('저장 실패');UI.renderGame();
      if(G.player.questRoute!=='q:101'||UI.map.questRouteData().dest.key!=='q:101')throw Error('추적 저장 실패');
      const q=G.player.quests[0];q.type='hunt';q.status='done';
      if(UI.map.questRouteData().path.at(-1)!==WORLD.idx(...WORLD.cityPos.gangnam))throw Error('완료 후 보고 장소로 바뀌지 않음');
      G.player.quests=G.player.quests.filter(q=>q.id!==101);
      UI.renderGame();if(UI.map.questRouteData().dest.kind!=='main'||document.querySelector('#hud-tr [data-act="qr-track"][data-v="main"]').getAttribute('aria-pressed')!=='true')throw Error('보고 완료 후 메인 안내 복귀 실패');
      const r=G.player.quests[0];r.dest='jeju';G.player.questRoute='q:102';UI.renderGame();
      if(!G.canJeju()&&UI.map.questRouteData().path)throw Error('출입 불가 경로 안내');
      r.type='hunt';r.region=G.player.region;r.tier=0;r.status='active';
      const seen=G.seenNow;G.seenNow=()=>false;
      try{if(!QuestRoute.target()?.unlocated||UI.map.questRouteData())throw Error('미발견 토벌 대상 위치 노출');}finally{G.seenNow=seen;}
      r.type='courier';r.dest='gangbuk';G.player.questRoute=null;UI.renderGame();
      const map=UI.map,walking=UI.walking={test:true};UI.handle('qr-track','q:102');
      if(UI.map!==map||UI.walking!==walking)throw Error('추적 변경이 이동 애니메이션을 초기화함');UI.walking=null;
      const path=UI.map.questRouteData().path;[G.player.x,G.player.y]=WORLD.xy(path[1]);UI.map.refresh();
      const after=UI.map.questRouteData();if(after.path[0]!==path[1]||after.path.length>=path.length)throw Error('이동 후 남은 경로 갱신 실패');
      for(let i=0;i<4;i++)G.player.quests.push({id:200+i,kind:'bounty',type:'courier',title:'추가 의뢰 '+i,from:'gangnam',dest:'gangbuk',status:'active',deadline:G.monthKey()+2});
      UI.openSheet('quest');
      if(document.querySelectorAll('#modal-box [data-act="qr-track"]').length!==G.player.quests.length)throw Error('의뢰 창 추적 버튼 누락');
    });
    await page.locator('#modal-box [data-act="qr-track"][data-v="q:203"]').click();
    await page.evaluate(()=>{if(G.player.questRoute!=='q:203')throw Error('의뢰 창 실제 추적 실패');UI.closeModal();G.player.questRoute='main';UI.renderGame();});
    const shots=process.env.QUEST_ROUTE_SCREENSHOTS;
    if(shots){
      await page.evaluate(()=>{const m=UI.map,p=G.player,d=QuestRoute.target();m.tile=28;m.camX=(p.x+d.x)/2+.5;m.camY=(p.y+d.y)/2-3;m.clampCam();m.hover=-1;UI._moveSel=null;m.draw();});
      fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'quest-route-'+viewport.width+'.png')});
    }
    await page.evaluate(()=>{G.mainState().done[1]=true;if(UI.map.questRouteData())throw Error('완료한 메인 경로가 남음');});
    results.push(viewport.width);await page.close();
    }
    if(errors.length)throw Error(errors.join('\n'));
    console.log(JSON.stringify({viewports:results,mainDefault:true,tracking:true,persistentWithoutHover:true,yellowLine:true,routeCache:true,saveLoad:true,reportDestination:true,completion:true,blockedRoute:true,unknownTargetsHidden:true,movingRouteUpdate:true,noAutomaticTravel:true,pageErrors:errors.length}));
  } finally { await browser.close(); if(server)await new Promise(resolve=>server.close(resolve)); }
})().catch(error=>{console.error(error);process.exit(1)});
