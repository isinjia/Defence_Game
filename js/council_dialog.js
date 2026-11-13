// 승인 1안: 중앙 회의 패널. 선택 결과와 관계 판정은 원래 핸들러에 맡긴다.
const CouncilDialog = (() => {
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let parkedSkip=null, observedBox=null, previousFocus=null;
  function restoreSkip(){if(parkedSkip&&!parkedSkip.isConnected){const skip=parkedSkip;parkedSkip=null;if(!document.getElementById('tut-skip'))document.body.append(skip);UI.tutSkipBtn?.(false);}}
  const observer=new MutationObserver(()=>{
    restoreSkip();
    if(!document.querySelector('#council-ov.council-dialog')&&previousFocus?.isConnected&&!UI.dlg){previousFocus.focus({preventScroll:true});previousFocus=null;}
  });
  function context(){
    const c=UI.ctx, exam=!!(UI.exam?.map&&!c?.run), state=exam?(UI.councilLead||UI.councilTut):c?.council;
    const ownTutorial=exam&&!!UI.councilTut&&state===UI.councilTut;
    const leader=ownTutorial?null:state?.leader!=null?G.npcById(state.leader):exam?UI.examLeader?.():UI.councilLeader?.();
    const key=state?.key||state?.k;let node=state?.nd;
    if(!node&&key){if(c?.run)node=UI.nodeOf(key);else if(exam){const[r,i]=key.split(':').map(Number);node=UI.exam.map.rows[r]?.[i];}}
    return{c,exam,state,leader,node};
  }
  function decorate(){
    const ov=document.getElementById('council-ov'), source=ov?.querySelector(':scope > .cn-card');
    if(source?.classList.contains('cv-dialog'))return;
    const actions=source?.querySelector('.cn-btns');
    if(!source||source.classList.contains('cn-block')||!actions){
      if(ov){ov.classList.remove('council-dialog','cv-1');for(const attr of ['role','aria-modal','aria-labelledby'])ov.removeAttribute(attr);}
      restoreSkip();return;
    }
    const {exam,state,leader,node}=context(),type=node?.t;
    const title=source.querySelector(':scope > b,:scope > .row b')?.textContent||'팀 상의';
    const label=type&&GNODE[type]?GNODE[type].name:null;
    const art={event:'fork',rest:'camp',treasure:'chest',boss:'boss_door',fight:'nest',elite:'nest',unknown:'fork',start:'fork'};
    const name=leader?.name||G.player.name;
    const portrait=leader?UI.npcAvatar(leader,76):UI.playerAvatar(76);
    const members=source.querySelector('.cn-mems'), memberNodes=members?[...members.querySelectorAll('.cn-mem')]:[];
    const yes=memberNodes.filter(n=>n.querySelector('.cn-badge.o')).length, no=memberNodes.filter(n=>n.querySelector('.cn-badge.x')).length;
    const dialog=document.createElement('section');dialog.className='cn-card cv-dialog';
    dialog.innerHTML=`<header class="cv-header"><div><span class="cv-eyebrow">팀 상의</span><h2 id="cv-title">${leader?'리더의 제안':'경로 상의'}</h2></div><span class="cv-state"><i></i>의견 확인 중</span></header><div class="cv-scroll"><section class="cv-proposal"><div class="cv-leader"><div class="cv-leader-avatar">${portrait}</div><div class="cv-leader-text"><span class="cv-role">${leader?(exam?'선임 · 시험 리더':'파티 리더'):'나 · 파티 리더'}</span><h3>${esc(name)}</h3><p>${label?'제안한 경로와 팀원의 의견을 확인하세요.':esc(title)}</p></div></div>${label?`<div class="cv-destination"><img src="assets/explore/${art[type]||'fork'}.webp" alt="" decoding="async"><div><span class="cv-type">제안 경로 · ${esc(label)}</span><b>${esc(label)}${type==='event'?' 지점':''}</b><p>${esc(GNODE[type].desc)}</p></div></div>`:''}</section><section class="cv-opinions"><div class="cv-opinions-heading"><h3>팀원 의견</h3><div><span class="cv-count-yes">찬성 ${yes}</span><span>반대 ${no}</span></div></div></section><div class="cv-notes"></div></div><footer class="cv-footer"><div class="cv-question"><b>의견을 확인하고 응답을 선택하세요.</b></div></footer>`;
    if(members){
      members.classList.add('cv-members');
      for(const item of memberNodes){
        const avatar=item.querySelector('svg.avatar,img.avatar,.avatar'),badge=item.querySelector('.cn-badge'),say=item.querySelector('.cn-say');
        const heading=document.createElement('div');heading.className='cv-member-top';
        if(avatar){const wrap=document.createElement('div');wrap.className='cv-avatar';wrap.append(avatar);heading.append(wrap);}
        const identity=document.createElement('div');identity.className='cv-member-identity';const who=say?.querySelector('b');if(who)identity.append(who);heading.append(identity);
        if(badge){const agree=badge.classList.contains('o');badge.classList.add('cv-vote',agree?'yes':'no');badge.textContent=agree?'✓ 찬성':'− 반대';heading.append(badge);}
        const p=document.createElement('p');p.textContent=say?.querySelector('span')?.textContent||'추가 의견 없음';
        item.classList.add('cv-member');item.replaceChildren(heading,p);
      }
      dialog.querySelector('.cv-opinions').append(members);
    }else{dialog.querySelector('.cv-opinions').remove();}
    // 기존 행동 버튼을 옮겨 이벤트·선택값과 보조 행동을 보존한다.
    actions.classList.add('cv-actions');actions.dataset.count=actions.querySelectorAll('button').length;
    for(const button of actions.querySelectorAll('button')){
      const act=button.dataset.act,value=button.dataset.v;
      if((act==='cn-lead'||act==='cn-vote')&&value==='O')button.textContent='제안에 따른다';
      if((act==='cn-lead'||act==='cn-vote')&&value==='X')button.textContent='반대 의견을 낸다';
      if(button.classList.contains('primary'))button.classList.add('cv-agree');else button.classList.add('cv-disagree');
    }
    dialog.querySelector('.cv-footer').append(actions);
    // 반대·설득·강행에 대한 기존 설명과 관계 변화 안내를 유지한다.
    for(const el of [...source.children]){
      if(el===members||el===actions||el.matches('b,.row,.cn-mems'))continue;
      if(/가만히 있으면|응답이 없으면|몇 초 뒤|저절로 눌/.test(el.textContent))continue;
      dialog.querySelector('.cv-notes').append(el);
    }
    if(!dialog.querySelector('.cv-notes').children.length)dialog.querySelector('.cv-notes').remove();
    if(!ov.contains(document.activeElement))previousFocus=document.activeElement;
    ov.classList.add('council-dialog','cv-1');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','cv-title');ov.replaceChildren(dialog);
    const skip=document.getElementById('tut-skip')||parkedSkip;if(skip){dialog.querySelector('.cv-footer').append(skip);parkedSkip=skip;}
    if(observedBox!==ov.parentNode){observer.disconnect();observedBox=ov.parentNode;observer.observe(observedBox,{childList:true});}
    requestAnimationFrame(()=>{if(ov.isConnected&&!UI.dlg&&!UI.tutHeld?.())dialog.querySelector('.cv-actions button:not(:disabled)')?.focus({preventScroll:true});});
  }
  const base=UI.councilPanel;
  UI.councilPanel=function(...args){const result=base.apply(this,args);decorate();return result;};
  document.addEventListener('keydown',e=>{
    const root=document.querySelector('#council-ov.council-dialog');if(!root||UI.dlg||document.getElementById('skill-hold')||UI.tutHeld?.())return;
    const buttons=[...root.querySelectorAll('button:not(:disabled)')].filter(n=>n.getClientRects().length),first=buttons[0],last=buttons[buttons.length-1];
    if(e.key==='Tab'){
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    if(e.key==='Escape'){const back=root.querySelector('[data-act="cn-back"]');e.preventDefault();e.stopImmediatePropagation();if(back)back.click();}
  },true);
  return{decorate};
})();
