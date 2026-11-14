// 월드맵에 알려진 중요 대상의 마지막 확인 정보를 남긴다.
// 직접 시야·정찰·관리국 공유·명시적인 정보 수신만 기록을 갱신한다.
{
  const GP = Game.prototype;
  const important = o => !!(o && (o.named || o.boss || o.important || o.mission));
  const keyOf = (o, type) => type === 'mob' && o.named ? `named:${o.named}` : String(o.id);
  const fields = ['id','kind','x','y','region','name','tier','elem','shape','count','named','boss','important','final','variant','theme','owner','policy','mission','bid','north','calamity','known','visited','used'];
  GP.mapIntelState = function () {
    const w = this.world;
    w.gateMemo ??= {}; w.mapIntel ??= { mobs: {}, sites: {} };
    w.mapIntel.mobs ??= {}; w.mapIntel.sites ??= {};
    return { gate: w.gateMemo, mob: w.mapIntel.mobs, site: w.mapIntel.sites };
  };
  GP.learnMapObject = function (o, source = '직접 확인', type = o?.kind) {
    if (!o || !['gate','mob','site'].includes(type) || !WORLD.inb(o.x,o.y)) return;
    if (type === 'mob' && !important(o)) return;
    const record = {};
    for (const field of fields) if (o[field] != null) record[field] = o[field];
    record.id = o.id; record.x = o.x; record.y = o.y;
    record._intelType = type; record._mapMemo = true;
    record.mk = this.monthKey(); record.day = this.day; record.source = source; record.date = this.fullDate ? this.fullDate() : this.dateStr();
    if (type === 'site') record._knownActive = this.siteActive(o);
    this.mapIntelState()[type][keyOf(o,type)] = record;
    this.fog[WORLD.idx(o.x,o.y)] = 1;
    return record;
  };
  // 호출자가 실제로 받은 정보만 전달한다. 화면 갱신은 이 API로 원격 상태를 조회하지 않는다.
  GP.receiveMapIntel = function (objects, source = '정보 갱신') {
    for (const item of objects || []) {
      const type=item.type||item.kind;
      if(item.removed && ['gate','mob','site'].includes(type)) delete this.mapIntelState()[type][keyOf(item,type)];
      else this.learnMapObject(item.object || item, source, type);
    }
    this._intelAt = 0;
  };
  GP.sightSync = function (force = false) {
    if (!this.player || !this.world || !this.fog) return;
    const now = Date.now(), pos = `${this.player.x},${this.player.y}`;
    if (!force && this._intelPos === pos && now - (this._intelAt || 0) < 200) return;
    this._intelAt = now; this._intelPos = pos;
    const stores = this.mapIntelState();
    const lists = { gate: (this.mapGates || []).filter(g=>!g.cleared), mob: (this.mobs || []).filter(important), site: this.sites?.() || [] };
    for (const [type, list] of Object.entries(lists)) {
      for (const o of list) if (this.seenNow(o.x,o.y)) this.learnMapObject(o,'직접 확인',type);
      // 마지막 확인 위치가 다시 보였을 때만 부재·이동을 확인한다.
      for (const [key, record] of Object.entries(stores[type])) {
        if (this.seenNow(record.x,record.y) && !list.some(o=>keyOf(o,type)===key && o.x===record.x && o.y===record.y)) delete stores[type][key];
      }
    }
  };
  GP.gatesShown = function () {
    this.sightSync();
    const records = this.mapIntelState().gate;
    return Object.entries(records).map(([id,r]) => ({ kind:'gate',id:Number.isNaN(+id)?id:+id,...r,_mapMemo:!this.seenNow(r.x,r.y) }));
  };
  GP.mobsShown = function () {
    this.sightSync();
    const visible = (this.mobs || []).filter(o=>this.seenNow(o.x,o.y));
    const remembered = Object.values(this.mapIntelState().mob).filter(r=>!this.seenNow(r.x,r.y));
    return [...visible,...remembered];
  };
  GP.sitesShown = function () {
    this.sightSync();
    const visible = (this.sites?.() || []).filter(o=>this.seenNow(o.x,o.y));
    const remembered = Object.values(this.mapIntelState().site).filter(r=>!this.seenNow(r.x,r.y));
    return [...visible,...remembered];
  };
  GP.gateSeen = function (o) {
    if (!o) return false;
    if (this.seenNow(o.x,o.y)) return true;
    this.sightSync(); const r = this.mapIntelState().gate[o.id];
    return !!r && r.x===o.x && r.y===o.y;
  };
  GP.objSeen = function (o) {
    if (!o) return false;
    if (o.kind==='gate') return this.gateSeen(o);
    if (this.seenNow(o.x,o.y)) return true;
    const r = this.mapIntelState().mob[keyOf(o,'mob')];
    return !!r && r.x===o.x && r.y===o.y;
  };
  GP.mapMemoAt = function (x,y) {
    this.sightSync();
    const stores = this.mapIntelState();
    for (const type of ['gate','mob','site']) for (const [id,r] of Object.entries(stores[type])) {
      if (r.x===x && r.y===y) return {id:Number.isNaN(+id)?id:+id,kind:type,...r,_mapMemo:!this.seenNow(x,y)};
    }
    return null;
  };
  GP.gateMemoAt = function (x,y) { const r=this.mapMemoAt(x,y); return r?._intelType==='gate'||r?.kind==='gate'?r:null; };
  GP.objAtSeen = function (x,y) {
    if (this.seenNow(x,y)) { this.sightSync(); return this.objAt(x,y); }
    const r=this.mapMemoAt(x,y); return r && r._intelType!=='site'?r:null;
  };
  GP.siteAtKnown = function (x,y) {
    if (this.seenNow(x,y)) return this.siteAt(x,y);
    this.sightSync(); return Object.values(this.mapIntelState().site).find(s=>s.x===x&&s.y===y)||null;
  };
  const baseActive = GP.siteActive;
  GP.siteActive = function (site) { return site?._mapMemo ? site._knownActive !== false : baseActive.call(this,site); };

  // 기존 reveal이 실제로 공개한 게이트 기록을 충분한 표시 정보로 보강한다.
  const baseReveal = GP.reveal;
  GP.reveal = function (...args) {
    const before = new Map(Object.entries(this.world?.gateMemo || {}));
    const result = baseReveal.apply(this,args);
    if (!this.world || !this.fog) return result;
    for (const [id,r] of Object.entries(this.world.gateMemo || {})) if (before.get(id)!==r) {
      const o=this.mapGates.find(g=>String(g.id)===id&&!g.cleared);
      if(o)this.learnMapObject(o,'시야·정찰 정보','gate');
    }
    this._intelAt=0; this.sightSync(true);
    return result;
  };
  const baseSites = GP.revealSitesNear;
  GP.revealSitesNear = function (...args) {
    const known = new Set((this.sites?.()||[]).filter(s=>s.known||s.visited).map(s=>s.id));
    const result = baseSites.apply(this,args);
    for(const s of this.sites()) if((s.known||s.visited)&&!known.has(s.id))this.learnMapObject(s,'발견 정보','site');
    return result;
  };
  GP.shareStarterGateIntel = function () {
    const p=this.player;
    if(!p.examDone || !p.notebook || p.starterGateIntelShared)return;
    const city = WORLD.cityPos[p.region] || [p.x,p.y];
    const gates=this.mapGates.filter(g=>g.region===p.region&&!g.cleared&&!g.final)
      .sort((a,b)=>Math.hypot(a.x-city[0],a.y-city[1])-Math.hypot(b.x-city[0],b.y-city[1])).slice(0,3);
    if(!gates.length)return;
    this.receiveMapIntel(gates,'관리국 위치 공유');
    p.starterGateIntelShared=true;
    this.queue.unshift({type:'toast',text:`관리국이 도시 근처 게이트 ${gates.length}곳의 위치를 공유했습니다. 월드맵에 표시됩니다.`});
    this.log('관리국이 도시 근처 게이트 위치를 공유했다. 이후 변경은 직접 확인하거나 새 정보를 받아야 알 수 있다.');
  };
  const baseStart=GP.nbStart;
  GP.nbStart=function(...args){const result=baseStart.apply(this,args);this.shareStarterGateIntel();return result;};
  const baseInit=GP.initSandbox;
  GP.initSandbox=function(...args){
    const result=baseInit.apply(this,args);const stores=this.mapIntelState();
    // 이전 저장의 기록은 보존한다. 현재 세계 상태로 과거 기록을 덮어쓰지 않는다.
    for(const [id,r]of Object.entries(stores.gate)){r.id??=Number.isNaN(+id)?id:+id;r.kind??='gate';r._intelType='gate';}
    for(const site of this.sites?.()||[]) if((site.known||site.visited)&&!stores.site[String(site.id)]) {
      stores.site[String(site.id)]={id:site.id,kind:site.kind,x:site.x,y:site.y,region:site.region,known:site.known,visited:site.visited,
        _intelType:'site',_mapMemo:true,_knownActive:null,source:'기존 지도 기록'};
    }
    this._intelAt=0;this.sightSync(true);this.shareStarterGateIntel();return result;
  };
  const baseRumor=GP.rumor;
  GP.rumor=function(text,meta,...args){
    const result=baseRumor.call(this,text,meta,...args);
    if(!this.world)return result;
    const thread=meta?.thread||'';
    if(thread.startsWith('gate:')){
      const id=thread.slice(5),gate=this.mapGates.find(g=>String(g.id)===id&&!g.cleared);
      if(gate)this.learnMapObject(gate,'관리국·게이트 소식','gate');
      else if(/닫혔|폐쇄|공략.*완료/.test(text))delete this.mapIntelState().gate[id];
    }
    if(thread.startsWith('named:')&&/사살|쓰러뜨렸/.test(text))delete this.mapIntelState().mob[thread];
    return result;
  };
}
