// 화면 밖 캐릭터의 방향과 카메라 복귀·반응형·키보드 조작을 검사한다.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const browser = await chromium.launch();
  let server;
  try {
    let url = process.env.ORIGIN_TEST_URL;
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
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:568}]){
    const page = await browser.newPage({viewport,reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto(url);
    await page.click('[data-opening="skip"]');
    await page.waitForFunction(() => GateBoot.ready);
    await page.evaluate(()=>{
      UI.handle('new');UI.handle('mode-manual');UI.create.name='내 위치';UI.handle('c-start');UI.closeModal();UI._stPending=false;
      if(UI.dlg){UI.dlg.onDone=null;UI.dlgEnd();}G.player.statusSeen=true;G.player.examDone=true;G.queue=[];UI.ctx=null;UI.screen='game';UI.renderGame();
      const m=UI.map,p=G.player;m.centerOn(p.x,p.y);m.updateOriginIndicator();
      if(!document.querySelector('.map-origin').hidden)throw Error('캐릭터가 보이는데 표시됨');
      window.__originState={x:p.x,y:p.y,day:G.day,month:G.month,year:G.year,frac:p.dayFrac,hp:p.hp,money:p.money};
      for(const [dx,dy,bearing] of [[1,0,90],[1,1,135],[0,1,180],[-1,1,225],[-1,0,270],[-1,-1,315],[0,-1,0],[1,-1,45]]){
        m.camX=p.x+.5-dx*40;m.camY=p.y+.5-dy*40;m.updateOriginIndicator();
        const button=document.querySelector('.map-origin');
        if(button.hidden||Math.abs(Number(button.dataset.bearing)-bearing)>.1)throw Error('방향 표시 오류 '+bearing);
      }
      for(let i=0;i<10;i++)m.updateOriginIndicator();
      if(document.querySelectorAll('.map-origin').length!==1)throw Error('중복 복귀 버튼');
      const radius=m.tile*.5;m.camY=p.y+.5;m.camX=p.x+.5+(m.w/2+radius/2)/m.tile;m.updateOriginIndicator();
      if(!document.querySelector('.map-origin').hidden)throw Error('캐릭터 일부가 보일 때 표시됨');
      m.camX=p.x+.5+(m.w/2+radius+1)/m.tile;m.updateOriginIndicator();
      if(document.querySelector('.map-origin').hidden)throw Error('화면 밖 캐릭터 감지 실패');
      m.camX=p.x+.5-(m.w/2+radius*2)/m.tile;m.updateOriginIndicator();m.zoom(.5,m.w/2,m.hgt/2);m.updateOriginIndicator();
      if(!document.querySelector('.map-origin').hidden)throw Error('축소로 캐릭터가 나타나도 버튼이 남음');
      m.tile=42;m.camX=p.x+.5+40;m.camY=p.y+.5-40;m.updateOriginIndicator();
    });
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('.map-origin')).borderRadius==='50%');
    const bounds=await page.locator('.map-origin').boundingBox();
    if(!bounds||Math.abs(bounds.x+bounds.width/2-viewport.width/2)>2||Math.abs(bounds.y+bounds.height/2-viewport.height/2)>2||bounds.width<44||bounds.height<44)throw Error('중앙 배치·터치 크기 오류');
    const shots=process.env.ORIGIN_SCREENSHOTS;
    if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'map-origin-'+viewport.width+'.png')});}
    await page.locator('.map-origin').click();
    await page.evaluate(()=>{
      const p=G.player,m=UI.map,b=__originState;m.updateOriginIndicator();
      if(Math.abs(m.camX-p.x-.5)>.01||Math.abs(m.camY-p.y-.5)>.01||!document.querySelector('.map-origin').hidden)throw Error('카메라 복귀 실패');
      if(JSON.stringify({x:p.x,y:p.y,day:G.day,month:G.month,year:G.year,frac:p.dayFrac,hp:p.hp,money:p.money})!==JSON.stringify(b))throw Error('카메라 복귀가 캐릭터·시간·자원을 변경함');
      m.camX=p.x+.5+40;m.updateOriginIndicator();UI.openSheet('quest');m.updateOriginIndicator();
      if(!document.querySelector('.map-origin').hidden)throw Error('모달 위에 복귀 버튼 표시');
      UI.closeModal();m.updateOriginIndicator();
    });
    await page.locator('.map-origin').focus();await page.keyboard.press('Enter');
    await page.evaluate(()=>{if(!document.querySelector('.map-origin').hidden)throw Error('키보드 복귀 실패');});
    await page.evaluate(()=>{
      const m=UI.map,p=G.player;const before={x:p.x,y:p.y};
      m.token={x:p.x+3.25,y:p.y+1.5};m.camX=p.x+.5+40;m.camY=p.y+.5;m.updateOriginIndicator();UI.handle('map-origin');
      if(Math.abs(m.camX-m.token.x-.5)>.01||Math.abs(m.camY-m.token.y-.5)>.01||p.x!==before.x||p.y!==before.y)throw Error('이동 중 현재 표식으로 복귀 실패');
      m.token=null;const button=document.querySelector('.map-origin');m.destroy();if(button.isConnected)throw Error('지도 종료 시 버튼 미제거');
    });
    results.push(viewport.width);await page.close();
    }
    if(errors.length)throw Error(errors.join('\n'));
    console.log(JSON.stringify({viewports:results,eightDirections:true,onlyWhenOutside:true,centered:true,clickRecenter:true,keyboard:true,zoom:true,animatedPosition:true,noCharacterOrTimeChange:true,modalHidden:true,noDuplicates:true,lifecycle:true,pageErrors:0}));
  }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exit(1)});
