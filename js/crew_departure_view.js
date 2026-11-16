// 팀장이 정한 공략 하나만 안내한다. 팀원의 대안 제안·추천 문구는 표시하지 않는다.
{
  const baseTalk = UI.crewTalk;
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  UI.crewTalk = function (...args) {
    const c=G.crew(), L=G.crewLeader();
    if(!c||!L||!G.crewAtBase()||(G.player.rankIdx>=L.rankIdx+2&&!c.offeredLead))return baseTalk.apply(this,args);
    const choices=G.crewJobCands(), target=choices.find(x=>x.rec)||choices[0];
    this._crewCands=[];
    this._crewDeparture=target?{crew:c.id,gateId:target.id}:null;
    const register=G.personaRegister?G.personaRegister(L):'banmal';
    const say={haera:'이번 공략은 여기다. 준비됐으면 출발하자.',banmal:'이번엔 여기로 가자. 준비됐으면 출발할게.',short:'이번엔 여기. 준비됐으면 출발.',haeyo:'이번에는 여기로 가요. 준비됐으면 출발해요.',hapsyo:'이번에는 이 게이트를 공략하겠습니다. 준비되셨으면 출발하겠습니다.',hao:'이번에는 여기로 갑시다. 준비됐으면 출발하겠소.',hage:'이번에는 여기로 가세. 준비됐으면 출발하겠네.'};
    const share=Math.round((G.crewShareRate?G.crewShareRate():.75)*100);
    const detail=target?`<div class="cn-card crew-destination"><div class="row between"><b>${esc(target.title)}</b><span class="tag tiny">${RANKS[target.tier].key}급</span></div><p class="small dim">${esc(regionById(target.region).name)} · ${WORLD.formatTravelTime(target.days)} · 게이트 전리품의 ${share}%</p></div>`:'<p class="event-text">현재 공략할 수 있는 게이트가 없다. 게이트 정보를 확인한 뒤 다시 모이기로 했다.</p>';
    this.modal(`<div class="story-portrait crew-departure-head"><div class="crew-departure-face">${this.npcPortrait(L,96)}</div><div class="crew-departure-copy"><div class="eyebrow">${esc(c.name)} · 거점 ${esc(G.crewBaseName())}</div><b>${esc(L.name)}</b><span class="small dim">리더</span>${target?`<p class="event-text">${say[register]||say.banmal}</p>`:''}</div></div>${detail}<div class="cards">${target?'<button class="choice-btn primary" data-act="crew-depart-confirm">출발한다</button>':''}<button class="choice-btn" data-act="modal-close">나중에</button></div>`,'event-box crew-departure-view');
  };
  const handle=UI.handle;
  UI.handle=function(act,v){
    if(act==='crew-depart-confirm'){
      const d=this._crewDeparture,c=G.crew();
      if(!d||!c||c.id!==d.crew||this.ctx||this.dlg||this.walking)return;
      this._crewDeparture=null;
      return this.crewWork(d.gateId);
    }
    if(['crew-propose','crew-job'].includes(act)&&G.crew()&&G.crewLeader())return this.crewTalk();
    return handle.call(this,act,v);
  };
}
