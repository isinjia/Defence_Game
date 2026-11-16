// 소꿉친구의 첫 해 수첩에서 이어지던 기본 활동 서브퀘스트를 폐기한다.
// 첫 게이트 공략·도시 복귀는 first_sortie.js의 메인 진행으로 유지한다.
{
  const GP=Game.prototype;
  const retired=g=>!!(g.player?.notebook && g.player.notebook.i>=1);
  const clean=g=>{
    const p=g.player, nb=p?.notebook;
    if(!nb || nb.i<1)return;
    nb.i=NB_TASKS.length;
    p.facTour=false;
    if(typeof p.questRoute==='string'&&p.questRoute.startsWith('nb:')&&p.questRoute!=='nb:gate')p.questRoute=null;
    g.queue=(g.queue||[]).filter(q=>!['nb_msg','nb_end'].includes(q.id));
  };
  const init=GP.initSandbox;
  GP.initSandbox=function(...a){const result=init.apply(this,a);clean(this);return result};
  const task=GP.nbTask;
  GP.nbTask=function(...a){clean(this);return retired(this)?null:task.apply(this,a)};
  const check=GP.nbCheck;
  GP.nbCheck=function(...a){
    clean(this);
    if(retired(this))return;
    const result=check.apply(this,a);
    clean(this);
    return result;
  };
  const show=UI.showStory;
  UI.showStory=function(q,...a){
    clean(G);
    if(q.id==='nb_end'||q.id==='nb_msg'&&retired(G))return this.processQueue();
    return show.call(this,q,...a);
  };
}
