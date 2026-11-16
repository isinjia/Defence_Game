// 보물 보상은 기존 규칙으로 한 번만 지급하고, 확인한 뒤 다음 경로 상의를 연다.
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let view = null;
  const pending = ui => ui.ctx?.run?.treasureReveal;
  const persist = c => {
    if (!G.player || c.kind !== 'gate') return;
    try {
      const copy = x => JSON.parse(JSON.stringify(x));
      G.player.gateRunSave = { gid:c.gate.id, run:copy(c.run), loot:copy(c.loot), hidden:!!c.hidden,
        crewRaid:!!c.crewRaid, hp:G.player.hp, mp:G.player.mp };
      G.save();
    } catch (e) { /* 저장 불가 환경에서도 화면은 진행한다. */ }
  };
  const closeView = () => {
    if (!view) return;
    for (const timer of view.timers) clearTimeout(timer);
    for (const raf of view.rafs) cancelAnimationFrame(raf);
    view.root.remove(); view = null;
  };
  const rowsFrom = (c, before) => {
    const p = G.player, rows = [];
    const add = (name, value, icon, where) => { if (value > 0) rows.push({name,value,icon,where}); };
    add('크레딧', (c.loot.money || 0)-before.money, {type:'money'}, '게이트 전리품');
    add('에테르', (c.loot.ether || 0)-before.ether, {type:'cons',id:'crystal'}, '게이트 전리품');
    for (const [id,n] of Object.entries(p.items || {})) add((CONSUMABLES.find(x=>x.id===id)||{name:id}).name, n-(before.items[id]||0), {type:'cons',id}, '소지품');
    for (const r of p.relics || []) if (!before.relics.has(r.uid)) rows.push({name:relicById(r.id).name,value:1,icon:{type:'relic',id:r.id},where:RARITY[r.grade].name+' 유물'});
    add('체력 회복', p.hp-before.hp, {type:'health'}, '즉시 회복');
    return rows;
  };
  const show = ui => {
    const c = ui.ctx, record = pending(ui); if (!record) return;
    if (view?.root.isConnected && view.record === record) return;
    closeView();
    const root = document.createElement('div'); root.id = 'treasure-reveal';
    root.innerHTML = `<section class="tr-panel" role="dialog" aria-modal="true" aria-labelledby="tr-title" tabindex="-1"><header><span>${c.run.floor+1}층 · 보물</span><h2 id="tr-title">보물 발견</h2></header><div class="tr-hero"><img src="${record.hero}" alt="발견한 보물" decoding="async"><div class="tr-glow" aria-hidden="true"></div><div class="tr-shine" aria-hidden="true"></div><span class="tr-discovery">잠들어 있던 보물을 발견했다.</span></div><div class="tr-result"><p class="tr-story">${esc(record.story)}</p><div class="tr-rewards" aria-live="polite">${record.rows.map((r,i)=>`<article class="tr-reward" style="--order:${i}"><div class="tr-icon">${r.icon.type==='money'?FX.icon('coin',38):r.icon.type==='health'?FX.icon('rest',38):ItemArt.icon(r.icon,64)||FX.icon('star',38)}</div><div><small>${esc(r.where)}</small><strong>${esc(r.name)}</strong></div><b class="tr-value" data-value="${r.value}">+${fmt(r.value)}</b></article>`).join('')}</div></div><footer><p>획득 내역을 확인하고 계속하세요.</p><button class="primary" data-act="treasure-confirm" disabled>확인</button></footer></section>`;
    document.body.appendChild(root);
    const state = view = {root,record,c,timers:[],rafs:[],ready:false};
    const later = (fn,ms) => state.timers.push(setTimeout(()=>{if(view===state&&ui.ctx===c)fn();},ms));
    const frame = fn => state.rafs.push(requestAnimationFrame(now=>{if(view===state&&ui.ctx===c)fn(now);}));
    const finish = () => {
      state.ready = true; root.classList.add('tr-ready'); root.querySelector('button').disabled = false;
      root.querySelector('button').focus({preventScroll:true});
    };
    const reveal = () => {
      if (view!==state || ui.ctx!==c) return;
      root.classList.add('tr-opening');
      const reduced = typeof FX!=='undefined' && FX.reduced;
      later(()=>{
        root.classList.add('tr-revealed'); root.querySelector('h2').textContent='보물 획득';
        if (typeof SFX!=='undefined') SFX.play('heal');
        if (reduced) { finish(); return; }
        const start=performance.now(), counters=[...root.querySelectorAll('.tr-value')];
        const count=now=>{
          const k=Math.min(1,(now-start)/650);
          for(const el of counters)el.textContent='+'+fmt(Math.round(Number(el.dataset.value)*(1-Math.pow(1-k,3))));
          if(k<1)frame(count);else finish();
        };
        frame(count);
      },reduced?0:950);
    };
    root.querySelector('.tr-panel').focus({preventScroll:true});
    // 그림이 도착하기 전에 연출 시간이 소모되지 않게 한다. 실패해도 보상 확인은 가능하다.
    const images=[...root.querySelectorAll('img')];
    Promise.all(images.map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve())).then(()=>frame(()=>frame(reveal)));
  };
  const baseTreasure = UI.gateTreasure;
  UI.gateTreasure = function (...args) {
    const c=this.ctx;if(!c?.run)return baseTreasure.apply(this,args);
    const id=c.run.floor+':'+(c.run.map.pos?.join(':')||'treasure');
    if(c.run.treasureReveal){show(this);return;}
    if(c.run.treasureClaimed?.[id])return this.renderGateMap();
    const p=G.player,before={money:c.loot.money||0,ether:c.loot.ether||0,items:{...p.items},relics:new Set((p.relics||[]).map(r=>r.uid)),hp:p.hp};
    const render=this.renderGateMap;let note='';
    this.renderGateMap=message=>{note=String(message||'');};
    try{baseTreasure.apply(this,args);}finally{this.renderGateMap=render;}
    const plain=document.createElement('div');plain.innerHTML=note;
    const rows=rowsFrom(c,before);
    c.run.treasureReveal={id,rows,hero:'assets/explore/'+(rows.some(r=>r.name==='에테르')?'crystal':'chest')+'.webp',story:plain.textContent.replace(/^보물\s*·\s*/, '')};
    (c.run.treasureClaimed||={})[id]=true;
    persist(c);show(this);
  };
  // 이어하기와 이미 예약돼 있던 지도 갱신도 확인 전에는 다음 상의를 열지 않는다.
  const baseMap=UI.renderGateMap;
  UI.renderGateMap=function(...args){if(pending(this)){show(this);return;}return baseMap.apply(this,args);};
  for(const name of ['councilStart','renderCouncil','councilPanel']){
    const base=UI[name];if(base)UI[name]=function(...args){if(pending(this))return;return base.apply(this,args);};
  }
  const baseHandle=UI.handle;
  UI.handle=function(act,...args){
    if(act==='treasure-confirm'){
      if(!view?.ready||!pending(this)||this.ctx!==view.c)return;
      delete this.ctx.run.treasureReveal;closeView();
      this.ctx.run.leadAsked=null;
      return this.renderGateMap();
    }
    if(pending(this))return;
    return baseHandle.call(this,act,...args);
  };
  const baseClose=UI.closeModal;
  UI.closeModal=function(...args){closeView();return baseClose.apply(this,args);};
  document.addEventListener('keydown',event=>{
    if(!view?.root.isConnected)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();}
    if(event.key==='Tab'){event.preventDefault();(view.ready?view.root.querySelector('button'):view.root.querySelector('section')).focus({preventScroll:true});}
  },true);
})();
