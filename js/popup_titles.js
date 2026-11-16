// 공통 팝업에 용도를 나타내는 제목을 붙인다. 전용 전체 화면과 기존 제목은 유지한다.
{
  const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const methods = {
    crewTalk:'게이트 공략 일정', showCrewPlan:'파티 활동 일정', showCrewInvite:'파티 가입 제안',
    showRequest:'헌터의 부탁', answerRequest:'부탁 결과', storyChoice:'사건 결과',
    finishStoryFight:'전투 결과', finishPersonalCombat:'전투 결과', finishGate:'게이트 공략 결과',
    showFirstSortie:'첫 게이트 공략', showTourney:'헌터 대회', finishTourney:'헌터 대회 결과',
    after:'처리 결과',
  };
  for(const [name,title] of Object.entries(methods)){
    const base=UI[name]; if(typeof base!=='function')continue;
    UI[name]=function(...args){const previous=this._popupTitle;this._popupTitle=title;try{return base.apply(this,args)}finally{this._popupTitle=previous}};
  }
  const story=UI.showStory;
  UI.showStory=function(q,...args){
    const ev=G.storyById(q.id), previous=this._popupTitle;
    this._popupTitle=ev?.title || (q.id==='debut_normal_0'?'헌터 등록 안내':q.id.startsWith('nb_')?'활동 안내':'사건 안내');
    try{return story.call(this,q,...args)}finally{this._popupTitle=previous}
  };
  const base=UI.modal;
  UI.modal=function(html,cls='',...args){
    const classes=String(cls).split(/\s+/);
    const dedicated=classes.some(c=>['combat-box','gscene','gfull','gate-map','exam-map','city-box'].includes(c));
    if(!dedicated && typeof html==='string'){
      const root=document.createElement('div');root.innerHTML=html;
      const heading=root.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > header h1,:scope > header h2,:scope > header h3,:scope > .row > h2,:scope > .row > h3,:scope > .sheet-head h2,:scope > .sheet-head h3');
      if(!heading){
        const act=root.querySelector('[data-act]')?.dataset.act || '';
        const byClass={'crew-departure-view':'게이트 공략 일정','first-sortie-required':'첫 게이트 공략','idc-box':'헌터 자격증','doc-box':'협회 안내','party-sheet':'파티 정보','st-modal':'능력 정보','skill-box':'스킬 정보'};
        let title=classes.map(c=>byClass[c]).find(Boolean)||this._popupTitle;
        if(!title&&classes.includes('sheet'))title=root.querySelector('.tabs button.on')?.textContent.trim();
        if(!title){
          title=/^(crew|pty)-/.test(act)?'파티 안내':/^req/.test(act)?'헌터의 부탁':/^story-/.test(act)?'사건 안내':/^tourney-/.test(act)?'헌터 대회':classes.includes('sheet')?'인물 정보':'안내';
          // 목적이 적힌 상단 소제목은 그대로 정식 제목으로 사용한다.
          const eyebrow=root.querySelector(':scope > .eyebrow');
          const text=eyebrow?.textContent.trim();
          if(text && text.length<=32 && !/^(사건|기연|메시지)\s*·|\d{4}년|\d{4}\.\d/.test(text)){title=text;eyebrow.remove();html=root.innerHTML;}
        }
        html=`<header class="popup-heading"><h2>${escape(title)}</h2></header>${html}`;
      }
    }
    return base.call(this,html,cls,...args);
  };
}
