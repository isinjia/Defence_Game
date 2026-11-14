// 메인·선택한 퀘스트의 노란 월드맵 안내. 경로 표시는 이동을 시작하거나 퀘스트를 진행시키지 않는다.
const QuestRoute = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const questKey = q => `q:${q.id}`;
  const firstSortiePending = () => { const s = G.player?.firstSortie; return !!(s && !s.returned); };
  const selected = () => {
    const value=G.player?.questRoute;
    if(value === 'first-sortie' && firstSortiePending()) return value;
    if(value === 'main') return value;
    if(typeof value === 'string' && value.startsWith('nb:') && value === `nb:${G.nbTask?.()?.id}`) return value;
    if(typeof value === 'string' && value.startsWith('q:')&&(G.player.quests||[]).some(q=>questKey(q)===value&&q.status!=='claimed'))return value;
    if(typeof value === 'string' && value.startsWith('c:')&&(G.clueList?.()||[]).some(c=>`c:${c.ch}`===value))return value;
    if(firstSortiePending()) return 'first-sortie';
    if(UI.mainGoal?.()) return 'main';
    const task = G.nbTask?.();
    return task ? `nb:${task.id}` : 'main';
  };
  function city(region, key, title, kind) {
    const pos = WORLD.cityPos[region];
    return pos ? { key, title:String(title || '퀘스트'), kind, x:pos[0], y:pos[1] } : null;
  }
  function mainTarget() {
    const goal = UI.mainGoal?.();
    if (!goal || goal.wait || goal.here) return null;
    const where = G.mainWhere(goal.def), key = `main:${goal.def.n}`, title = `${goal.def.n}장 ${goal.def.title}`;
    if (where === 'any') return null;
    if (where === 'city') {
      const rd = UI.map?.reachData;
      const spots = [...Object.values(WORLD.cityPos), ...(WORLD.towns || []).map(t => [t.x,t.y])];
      const near = spots.filter(([x,y]) => WORLD.inb(x,y) && (!rd || rd.dist.has(WORLD.idx(x,y)))).sort((a,b) => (rd?.dist.get(WORLD.idx(...a)) ?? Math.hypot(a[0]-G.player.x,a[1]-G.player.y)) - (rd?.dist.get(WORLD.idx(...b)) ?? Math.hypot(b[0]-G.player.x,b[1]-G.player.y)))[0];
      return near ? {key,title,kind:'main',x:near[0],y:near[1]} : null;
    }
    return city(where,key,title,'main');
  }
  function questTarget(q) {
    if (!q || q.status === 'claimed') return null;
    const key = questKey(q), title = String(q.title || '의뢰');
    if (q.status === 'done' || q.type === 'deliver') return city(q.from || UI.questTarget(q),key,title,'quest');
    if (q.type === 'hunt' || q.type === 'gate' || q.type === 'npc_gate') {
      const gates = q.type !== 'hunt';
      const known = (gates ? G.mapGates : G.mobs).filter(o => o.region === q.region && o.tier >= q.tier && !o.cleared && (gates ? G.gateSeen(o) : G.seenNow(o.x,o.y)));
      const rd = UI.map?.reachData;
      const near = known.filter(o => !rd || rd.dist.has(WORLD.idx(o.x,o.y))).sort((a,b) => (rd?.dist.get(WORLD.idx(a.x,a.y)) ?? Math.hypot(a.x-G.player.x,a.y-G.player.y)) - (rd?.dist.get(WORLD.idx(b.x,b.y)) ?? Math.hypot(b.x-G.player.x,b.y-G.player.y)))[0];
      if (near) return {key,title,kind:'quest',x:near.x,y:near.y};
      if (q.region === G.player.region) return {key,title,kind:'quest',unlocated:true};
    }
    const npc = q.target != null ? G.npcById(q.target) : q.npc != null ? G.npcById(q.npc) : null;
    if (npc?.alive && npc.met && UI.npcPos) {
      const [x,y] = UI.npcPos(npc); return {key,title,kind:'quest',x,y};
    }
    return city(UI.questTarget(q),key,title,'quest');
  }
  function nearestCity(key, title) {
    const p = G.player, rd = UI.map?.reachData;
    const list = Object.entries(WORLD.cityPos).filter(([, [x,y]]) => !rd || rd.dist.has(WORLD.idx(x,y)))
      .sort(([,a],[,b]) => Math.hypot(a[0]-p.x,a[1]-p.y)-Math.hypot(b[0]-p.x,b[1]-p.y));
    return list.length ? city(list[0][0],key,title,'quest') : null;
  }
  function notebookTarget() {
    const task=G.nbTask?.(); if(!task)return null;
    const key=`nb:${task.id}`;
    if(task.id==='gate') {
      const s=G.player.firstSortie;
      const g=G.mapGates.find(g=>g.id===s?.gate&&!g.cleared) || G.mapGates.filter(g=>!g.cleared&&g.tier<=G.player.rankIdx&&G.gateSeen(g))
        .sort((a,b)=>Math.hypot(a.x-G.player.x,a.y-G.player.y)-Math.hypot(b.x-G.player.x,b.y-G.player.y))[0];
      return g?{key,title:'첫 게이트 공략',kind:'quest',x:g.x,y:g.y}:{key,title:'첫 게이트 공략',kind:'quest',unlocated:true};
    }
    if(task.id==='report') {
      const q=G.player.quests.find(q=>q.kind==='bounty'&&q.status==='done');
      if(q)return city(q.from,key,'의뢰 보고','quest');
    }
    if(['train','break'].includes(task.id)) return {key,title:task.id==='train'?'수련':'첫 돌파',kind:'quest',x:G.player.x,y:G.player.y};
    return nearestCity(key,task.id==='craft'?'공방 제작':'협회 의뢰 수락');
  }
  function target() {
    if (!G.player || G.over) return null;
    const token = selected();
    if(token === 'first-sortie') {
      const s=G.player.firstSortie;
      if(s.status==='done')return nearestCity(token,'도시 복귀');
      const t=notebookTarget(); return t?{...t,key:token}:null;
    }
    if(token.startsWith('nb:')) return notebookTarget();
    if (token.startsWith('q:')) {
      const q = (G.player.quests || []).find(q => questKey(q) === token);
      if (q) return questTarget(q);
    }
    if (token.startsWith('c:')) {
      const clue = (G.clueList?.() || []).find(c => `c:${c.ch}` === token);
      if (clue) return city(clue.region,token,clue.name,'quest');
    }
    return mainTarget();
  }
  function button(key) {
    const active = key === selected();
    return `<button class="qr-track${active?' active':''}" data-act="qr-track" data-v="${esc(key)}" aria-pressed="${active}">${active?'추적 중':'추적'}</button>`;
  }
  const baseInit = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function (...args) { const result=baseInit.apply(this,args); this.player.questRoute ??= null; return result; };
  const baseHQ = UI.hudQuests;
  UI.hudQuests = function (...args) {
    const box=document.createElement('div');box.innerHTML=baseHQ.apply(this,args);
    for (const row of box.querySelectorAll('[data-act="hq-go"],[data-act="main-go"],.nb-task')) {
      let key='main';
      if(row.classList.contains('nb-task')) key=firstSortiePending()?'first-sortie':`nb:${G.nbTask?.()?.id}`;
      if (row.dataset.act==='hq-go') {
        const value=row.dataset.v || '', index=Number(value.slice(1));
        const item=value[0]==='c'?(G.clueList?.()||[])[index]:(G.player.quests||[])[index];
        if(!item)continue; key=value[0]==='c'?`c:${item.ch}`:questKey(item);
      }
      const wrap=document.createElement('div');wrap.className='qr-hud-row';row.before(wrap);wrap.append(row);wrap.insertAdjacentHTML('beforeend',button(key));
    }
    const current=target();
    if(current?.unlocated)box.insertAdjacentHTML('beforeend','<div class="qr-route-status">추적 중 · 이 지역에서 대상을 찾아보세요.</div>');
    else if(current&&UI.map?.reachData&&!UI.map.reachData.dist.has(WORLD.idx(current.x,current.y)))box.insertAdjacentHTML('beforeend','<div class="qr-route-status">목적지까지 육로가 없습니다. 교통수단·출입 자격을 확인하세요.</div>');
    return box.innerHTML;
  };
  const baseHud=UI.renderHud;
  UI.renderHud=function(...args){
    const result=baseHud.apply(this,args), host=document.getElementById('hud-tr');
    if(host&&G.player&&!G.over){host.innerHTML=fixJosa(this.hudQuests());this.applyFold?.();}
    return result;
  };
  const baseQuests=UI.questsHtml;
  UI.questsHtml=function(...args){
    const box=document.createElement('div');box.innerHTML=baseQuests.apply(this,args);
    const panel=[...box.querySelectorAll('.panel')].find(p=>p.querySelector('h3')?.textContent==='진행 중인 일');
    panel?.querySelectorAll('.cards > .item-row').forEach((row,i)=>{const q=G.player.quests[i];if(q)row.insertAdjacentHTML('beforeend',button(questKey(q)));});
    const notebook=[...box.querySelectorAll('.panel')].find(p=>p.querySelector('h3')?.textContent==='첫 해 수첩');
    const current=notebook?.querySelector('.item-row.hl');
    if(current)current.insertAdjacentHTML('beforeend',button(firstSortiePending()?'first-sortie':`nb:${G.nbTask?.()?.id}`));
    return box.innerHTML;
  };
  const baseHandle=UI.handle;
  UI.handle=function(act,value){
    if(act!=='qr-track')return baseHandle.apply(this,arguments);
    G.player.questRoute=value!=='main'&&selected()===value?null:value;
    G.save();
    if(this.map)this.map._questRouteCache=null;
    if(this.walking){
      for(const button of document.querySelectorAll('[data-act="qr-track"]')){const active=button.dataset.v===selected();button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));button.textContent=active?'추적 중':'추적';}
      return;
    }
    if(this.sheet==='quest')this.openSheet('quest');else this.renderGame();
    [...document.querySelectorAll('[data-act="qr-track"]')].find(b=>b.dataset.v===value&&b.getClientRects().length)?.focus({preventScroll:true});
  };
  MapView.prototype.questRouteData=function(){
    const dest=target(), p=G.player;
    if(!dest||dest.unlocated){this._questRouteCache=null;return null;}
    const rd=this.reachData, key=[dest.key,dest.x,dest.y,p.x,p.y,p.spd,WORLD.DAYS_PER_COST,WORLD.T_COST.join(','),G.canJeju(),UI.crewMarch?.ride].join('|');
    if(this._questRouteCache?.key===key&&(!rd||rd===this._questRouteCache.rd))return this._questRouteCache;
    const reach=rd?.start===WORLD.idx(p.x,p.y)?rd:WORLD.reach(p.x,p.y,Infinity,G.canJeju());
    const path=WORLD.pathTo(reach,WORLD.idx(dest.x,dest.y));
    return this._questRouteCache={key,rd,dest,path,days:path?G.travelPathDays(path.slice(1)):0};
  };
  MapView.prototype.drawQuestRoute=function(){
    if(UI.ctx)return;
    const route=this.questRouteData();if(!route?.path)return;
    const {path}=route,c=this.ctx;
    const pts=path.map(i=>{const[x,y]=WORLD.xy(i);return this.toScreen(x+.5,y+.5);});
    if(this.token?.walking)pts[0]=this.toScreen(this.token.x+.5,this.token.y+.5);
    c.save();c.setLineDash([]);c.lineJoin='round';c.lineCap='round';
    if(path.length>1){
      for(const [width,color] of [[8,'#11170be8'],[4.5,'#ffe23b']]){c.lineWidth=width;c.strokeStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
    }
    c.restore();
  };
  MapView.prototype.drawQuestRouteMarker=function(){
    if(UI.ctx)return;
    const route=this.questRouteData();if(!route?.path)return;
    const {dest,path,days}=route,c=this.ctx,s=this.tile;
    const [x,y]=this.toScreen(dest.x+.5,dest.y+.5);c.save();
    if(x>=-s&&y>=-s&&x<=this.w+s&&y<=this.hgt+s){
      c.strokeStyle='#ffe23b';c.lineWidth=3;c.strokeRect(x-s*.43,y-s*.43,s*.86,s*.86);
      const text=`${dest.kind==='main'?'메인':'추적'} · ${dest.title.slice(0,this.w<600?10:17)}${path.length===1?' · 도착':` · ${WORLD.formatTravelTime(days)}`}`;
      c.font='700 12px "IBM Plex Sans KR", sans-serif';const half=Math.min(this.w/2-8,c.measureText(text).width/2+10);
      this.chip(Math.max(half+4,Math.min(this.w-half-4,x)),Math.max(16,y-s*.6-10),text,'#ffe23b','#171b0bf2');
    }
    c.restore();
  };
  const baseObjects=MapView.prototype.drawObjects;
  MapView.prototype.drawObjects=function(...args){this.drawQuestRoute();return baseObjects.apply(this,args);};
  const baseCities=MapView.prototype.drawCities;
  MapView.prototype.drawCities=function(...args){const result=baseCities.apply(this,args);this.drawQuestRouteMarker();return result;};
  return { target, questKey };
})();
