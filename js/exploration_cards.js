// 승인된 탐색 2안. 기존 경로 생성·정찰·리더·시험 진행을 유지하고 표시와 선택/실행만 분리한다.
const ExplorationCards = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const places = {
    start: ['게이트 입구', '탐색을 시작한 곳', 'fork'],
    fight: ['괴수 무리', '등장 괴수 미확인', null],
    elite: ['정예 전투', '강한 괴수의 기척', null],
    event: ['사건', '무슨 일이 있을지 살펴보세요', 'fork'],
    rest: ['휴식 지점', '잠시 숨을 고를 장소', 'camp'],
    treasure: ['보물', '내용물 미확인', 'chest'],
    boss: ['층 보스', '이 층의 마지막 관문', 'boss_door'],
    unknown: ['미확인 경로', '아직 장소의 종류를 모릅니다', 'fork'],
  };
  let view = null;
  const current = exam => exam ? UI.exam?.map : UI.ctx?.run?.map;
  const valid = () => view && view.root.isConnected && view.box.contains(view.root) && UI.ctx === view.ctx && current(view.exam) === view.map;
  const reachable = v => (v.exam ? UI.examReach() : UI.reachable()).map(pair => pair.join(':'));
  const icon = (type, size = 30) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(GNODE[type] || GNODE.unknown).svg}</svg>`;
  function shown(v, key) {
    const [r,i] = key.split(':').map(Number), nd = v.map.rows[r]?.[i];
    if (!nd) return {t:'unknown'};
    return v.exam ? {t:nd.t} : GateScout.shown(v.map,r,i);
  }
  function info(v, key) {
    const s = shown(v,key), type = places[s.t] ? s.t : 'unknown', p = places[type];
    return {...s, type, title:p[0], description:p[1], art:p[2], label:(GNODE[type] || GNODE.unknown).name};
  }
  const intel = (v, p) => p.type === 'unknown' ? '종류 미확인' : p.a != null ? `정찰 확신 ${p.a}%` : v.exam ? '훈련 안내' : '확인된 경로';
  function illustration(p) {
    if (p.type === 'fight' || p.type === 'elite') {
      const name = p.type === 'elite' ? '오크 약탈자' : '가시털 들개';
      return `<img class="xr-monster" src="${MonsterArt.url(name)}" alt="${esc(p.label)} 유형 일러스트" decoding="async" draggable="false">`;
    }
    return `<img src="assets/explore/${p.art}.webp" alt="" decoding="async" draggable="false">${p.type === 'unknown' ? `<span class="xr-unknown-icon">${icon('unknown',44)}</span>` : ''}`;
  }
  function card(v, key) {
    const p=info(v,key);
    return `<button class="xr-card xr-${p.type}" data-act="xr-select" data-v="${key}" data-shown-type="${p.type}" aria-pressed="false"><span class="xr-art">${illustration(p)}<span class="xr-picked">✓ 선택한 경로</span><span class="xr-kind">${esc(p.label)}</span></span><span class="xr-card-body"><b class="xr-card-title">${esc(p.title)}</b><span class="xr-card-desc">${esc(p.description)}</span><span class="xr-intel ${p.a != null && p.a < 75 ? 'unsure' : ''}">${esc(intel(v,p))}</span></span></button>`;
  }
  function details(v) {
    const p=v.selected ? info(v,v.selected) : null, L=v.exam ? UI.examLeader?.() : UI.councilLeader?.();
    const locked=v.exam || !!v.ctx.run?.scoutPending || !!v.ctx.council;
    const label=!p ? '이동 가능한 경로를 확인하고 있습니다' : v.exam ? '리더가 경로를 결정합니다' : locked ? '팀 안내·상의를 기다려 주세요' : L ? '이 경로로 의견 내기' : '이 경로로 이동';
    const body=!p ? '현재 진행 중인 안내가 끝나면 다음 경로가 표시됩니다.' : p.type === 'unknown' ? '아직 어떤 장소인지 확인하지 못했습니다. 이 경로로 들어가면 종류가 드러납니다.' : p.type === 'fight' || p.type === 'elite' ? '전투로 보이는 경로입니다. 등장 괴수의 종류와 보상은 진입 후 확인합니다.' : (GNODE[p.type]?.desc || p.description);
    v.details.innerHTML=`<div class="xr-detail-head"><h3>선택한 목적지</h3>${p?'<span>선택됨</span>':''}</div><div class="xr-detail-title">${p ? `<span class="xr-detail-kind xr-${p.type}">${esc(p.label)}</span>` : ''}<h2>${esc(p?.title || '경로 확인 중')}</h2><p>${esc(v.title)} · ${esc(v.floor)}</p></div><p class="xr-description">${esc(body)}</p>${p?`<dl class="xr-info"><div><dt>장소 유형</dt><dd>${esc(p.label)}</dd></div><div><dt>정찰 정보</dt><dd>${esc(intel(v,p))}</dd></div><div><dt>예상 보상</dt><dd>미확인</dd></div></dl>`:''}<div class="xr-action-area"><p class="xr-selection-summary" aria-live="polite">${p?`선택: ${esc(p.title)}`:'다음 목적지를 기다리고 있습니다.'}</p><button class="xr-go" data-act="xr-go" ${!p||locked?'disabled':''}><span>${esc(label)}</span>${!v.exam&&p&&!locked?'<span aria-hidden="true">→</span>':''}</button><small>${v.exam ? '경로 선택과 이동은 시험 리더가 진행합니다.' : L ? '경로에 대한 의견을 팀 상의에 전달합니다.' : '이동 전 다른 목적지로 변경할 수 있습니다.'}</small></div>`;
  }
  function select(key, focus = false) {
    if (!valid() || !reachable(view).includes(key)) return;
    view.selected=key;
    for (const c of view.box.querySelectorAll('.xr-card')) {const on=c.dataset.v===key;c.classList.toggle('selected',on);c.setAttribute('aria-pressed',String(on));}
    for (const n of view.mapElement.querySelectorAll('.gnode')) n.classList.toggle('xr-selected-node',n.dataset.xrKey===key);
    details(view);
    if(focus)view.box.querySelector(`.xr-card[data-v="${key}"]`)?.focus({preventScroll:true});
  }
  function overview(open) {
    if(!valid())return;
    if(open&&window.innerWidth>=1100){view.route.focus({preventScroll:true});return;}
    view.root.classList.toggle('xr-overview',open);
    const toggle=view.root.querySelector('[data-act="xr-map"]');toggle?.setAttribute('aria-expanded',String(open));
    if(open)view.route.querySelector('[data-act="xr-map-close"]')?.focus({preventScroll:true});else toggle?.focus({preventScroll:true});
  }
  function enhance(exam, opts = {}) {
    const box=document.getElementById('modal-box'), map=current(exam), oldMap=box?.querySelector('.gmap'), oldHead=box?.querySelector('.cb-head');
    if(!map||!oldMap||!oldHead||box.querySelector('.exploration-layout'))return;
    const old=view, ctx=UI.ctx, reach=(exam?UI.examReach():UI.reachable()).map(pair=>pair.join(':'));
    const title=oldHead.querySelector('h3')?.textContent || '게이트 탐색';
    const floor=exam?'훈련용 게이트':`${ctx.run.floor+1}층 / ${ctx.run.floors}층`;
    const root=document.createElement('div');root.className='exploration-layout';
    const pos=map.pos?.join(':') || 'start';
    const L=exam?UI.examLeader?.():UI.councilLeader?.();
    const face=exam&&L?UI.npcAvatar(L,56):UI.exploreLeaderFace(56);
    const here=map.pos ? (GNODE[(exam?{t:map.rows[map.pos[0]][map.pos[1]].t}:GateScout.shown(map,...map.pos)).t]?.name || '탐색 지점')+' 지점' : '게이트 입구';
    const p=G.player, hp=Math.max(0,Math.min(100,p.hp/p.maxHp*100)), mp=Math.max(0,Math.min(100,p.mp/p.maxMp*100));
    root.innerHTML=`<header class="xr-header"><div><div class="xr-eyebrow">게이트 탐색 <span>${esc(floor)}</span></div><h2>${esc(title)}</h2></div><div class="xr-header-actions"><button data-act="xr-map" aria-controls="xr-route" aria-expanded="false">전체 경로 보기</button></div><div class="gmap-stat xr-vitals"><div><span>체력 <b>${Math.round(p.hp)} / ${p.maxHp}</b></span><i><em style="width:${hp}%"></em></i></div><div><span>정신력 <b>${Math.round(p.mp)} / ${p.maxMp}</b></span><i><em style="width:${mp}%"></em></i></div></div></header><div class="xr-layout"><aside class="xr-route" id="xr-route" tabindex="-1"><div class="xr-route-head"><h3>전체 경로</h3><button data-act="xr-map-close">닫기</button></div><div class="xr-map-scroll"></div><div class="xr-legend"></div></aside><section class="xr-main"><div class="xr-location"><div class="xr-face">${face}</div><div><span>현재 위치${L?' · 리더 '+esc(L.name):''}</span><h3>${esc(here)}</h3><p>${exam?'시험 리더의 안내를 따라갑니다.':'다음에 나아갈 길을 선택하세요.'}</p></div></div><div class="xr-messages"></div><div class="xr-heading"><h3>${opts.move?'이동 중':'다음 목적지'}</h3><span>${reach.length?`이동 가능한 경로 ${reach.length}개`:'안내 진행 중'}</span></div><div class="xr-cards"></div></section><section class="xr-details" aria-label="선택한 목적지 정보"></section></div>`;
    const v={root,box,map,ctx,exam,pos,title,floor,selected:null,mapElement:oldMap,route:root.querySelector('.xr-route'),details:root.querySelector('.xr-details')};
    root.querySelector('.xr-map-scroll').append(oldMap);
    // 부가 시스템이 붙인 표식·정찰·추격 정보와 철수·귀환 버튼을 실제 노드째 옮긴다.
    for(const el of [...oldHead.querySelectorAll('button,[data-act="g-leave"],.no-leave')])root.querySelector('.xr-header-actions').append(el);
    const oldFoot=box.querySelector(':scope > .row.end');if(oldFoot)for(const el of [...oldFoot.children])root.querySelector('.xr-header-actions').append(el);
    const legend=box.querySelector('.gmap-legend');if(legend)root.querySelector('.xr-legend').append(legend);
    for(const el of [...box.querySelectorAll(':scope > .scout-line,:scope > .gp-line,:scope > .pursuit-line,:scope > .gmap-note')])root.querySelector('.xr-messages').append(el);
    // 정산 등 기존 렌더러가 붙인 독립 오버레이는 유지한다.
    for(const el of [...box.children])if(el.matches('.cb-head,.gmap-stat,.small.dim,.row.end,.coach'))el.remove();
    const count=reach.length;root.querySelector('.xr-cards').innerHTML=reach.map(key=>card(v,key)).join('');root.style.setProperty('--xr-count',count===4?2:Math.min(3,Math.max(1,count)));
    if(!count)root.querySelector('.xr-cards').innerHTML='<p class="xr-empty">다음 이동 안내를 기다리고 있습니다.</p>';
    box.classList.add('xr-box');box.append(root);
    let n=0;const nodes=[...oldMap.querySelectorAll('.gnode')].filter(node=>!exam||!node.classList.contains('start'));
    map.rows.forEach((row,r)=>row.forEach((nd,i)=>{const node=nodes[n++];if(!node)return;const key=`${r}:${i}`,s=info(v,key);node.dataset.xrKey=key;let name=node.querySelector('.gnode-name');if(!name){name=document.createElement('span');name.className='gnode-name';node.append(name);}name.textContent=s.label;if(reach.includes(key)){node.disabled=false;node.dataset.act='xr-select';node.dataset.v=key;node.setAttribute('aria-label',s.label+' 경로 정보');}}));
    const wanted=opts.leaderPick || (old?.map===map&&old.pos===pos?old.selected:null);
    view=v;select(reach.includes(wanted)?wanted:reach[0]);if(!v.selected)details(v);
  }
  const baseGate=UI.renderGateMap, baseExam=UI.renderExamMap;
  UI.renderGateMap=function(...args){const result=baseGate.apply(this,args);enhance(false);return result;};
  UI.renderExamMap=function(opts={}){const result=baseExam.apply(this,arguments);enhance(true,opts);return result;};
  const baseHandle=UI.handle;
  UI.handle=function(act,value){
    if(act==='xr-select'){select(value);if(valid()&&view.root.classList.contains('xr-overview'))overview(false);return;}
    if(act==='xr-map'){overview(true);return;}
    if(act==='xr-map-close'){overview(false);return;}
    if(act==='xr-go'){
      if(!valid()||view.exam||view.ctx.council||view.ctx.run?.scoutPending||!reachable(view).includes(view.selected))return;
      return baseHandle.call(this,'g-node',view.selected);
    }
    const result=baseHandle.apply(this,arguments);
    if(valid()&&['cn-back','lead-hold'].includes(act))details(view);
    return result;
  };
  document.addEventListener('keydown',event=>{
    if(!valid()||window.innerWidth>=1100||!view.root.classList.contains('xr-overview'))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();overview(false);}
    if(event.key==='Tab'){
      const items=[...view.route.querySelectorAll('button:not(:disabled)')].filter(el=>el.getClientRects().length),first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  },true);
  return {refresh:()=>valid()&&select(view.selected)};
})();
