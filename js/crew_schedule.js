// 팀 공략 뒤 최소 한 달은 개인 시간. 일정 연락은 월 1회, 최소 30일 간격.
{
  const GP=Game.prototype;
  const led=g=>{const c=g.player?.crew;return c&&g.npcById(c.leader)?.alive?c:null};
  const day=g=>g.monthKey()*30+g.day;
  const clearCalls=g=>{g.queue=(g.queue||[]).filter(q=>!['crewCall','crewLate'].includes(q.type))};
  const postpone=(g,c,at)=>{c.scheduleNextAt=at;c.due=null;c.dueWarned=false;c.gateCallPending=false;c.plan=null;clearCalls(g)};
  GP.crewScheduleWaiting=function(){const c=led(this);return !!(c&&c.scheduleNextAt!=null&&!c.on&&!c.job&&c.due==null)};
  const due=GP.crewSetDue;
  GP.crewSetDue=function(first,...a){
    const c=led(this);if(!c)return due.call(this,first,...a);
    if(this._crewScheduleFinishing===c)return;
    const now=day(this), next=Math.max(c.scheduleNextAt??0,(c.scheduleNoticeAt??-Infinity)+30,c.scheduleNoticeMonth===this.monthKey()?(this.monthKey()+1)*30+1:0);
    if(now<next){if(c.due!=null&&c.due>=now)return;postpone(this,c,next);return;}
    const result=due.call(this,first,...a);
    c.scheduleNextAt=null;c.scheduleNoticeAt=now;c.scheduleNoticeMonth=this.monthKey();
    return result;
  };
  GP.crewScheduleTick=function(){
    const c=led(this);if(!c||this.over||this._crewScheduleFinishing===c||c.on||c.job||c.scheduleNextAt==null)return;
    if(day(this)>=c.scheduleNextAt)this.crewSetDue(false);
  };
  const tick=GP.crewDayTick;
  GP.crewDayTick=function(...a){this.crewScheduleTick();return tick.apply(this,a)};
  const month=GP.advanceMonth;
  GP.advanceMonth=function(...a){const result=month.apply(this,a),c=led(this),pending=c?.scheduleNextAt;this.crewScheduleTick();if(pending!=null&&c.scheduleNextAt==null&&!a[1]?.noSave)this.save();return result};
  const init=GP.initSandbox;
  GP.initSandbox=function(...a){
    const result=init.apply(this,a),c=led(this);if(!c)return result;
    c.scheduleVersion??=0;c.scheduleNextAt??=null;c.scheduleNoticeAt??=null;c.scheduleNoticeMonth??=null;
    if(!c.scheduleVersion){
      // 완료한 공략 직후 발급돼 남아 있던 옛 집결 일정도 한 번 정리한다.
      if(c.done>0&&!c.on&&!c.job)postpone(this,c,day(this)+30);
      c.scheduleVersion=1;
    }
    return result;
  };
  const done=UI.crewJobDone;
  UI.crewJobDone=function(...a){
    const c=led(G);if(!c?.job)return done.apply(this,a);
    c.due=null;clearCalls(G);
    const previous=G._crewScheduleFinishing;G._crewScheduleFinishing=c;
    try{return done.apply(this,a)}finally{
      G._crewScheduleFinishing=previous;
      if(led(G)===c&&!c.job){postpone(G,c,day(G)+30);c.scheduleVersion=1;G.save()}
    }
  };
  const call=UI.crewCall;
  UI.crewCall=function(...a){
    const c=led(G);if(c&&G.crewScheduleWaiting())return this.processQueue();
    const result=call.apply(this,a);
    if(c&&c.due&&!c.on&&!c.job){c.scheduleNoticeAt=day(G);c.scheduleNoticeMonth=G.monthKey();G.save()}
    return result;
  };
  for(const name of ['crewTalk','crewWork']){
    const base=UI[name];
    UI[name]=function(...a){
      const c=led(G);
      if(c&&G.crewScheduleWaiting()){
        const left=Math.max(0,c.scheduleNextAt-day(G));
        return this.after(`지금은 개인 활동 기간입니다. 다음 게이트 공략 일정은 ${left}일 뒤에 연락합니다.`);
      }
      return base.apply(this,a);
    };
  }
  const party=UI.partyHtml;
  UI.partyHtml=function(...a){
    const html=party.apply(this,a),c=led(G);
    return c&&G.crewScheduleWaiting()?html.replace('합류 기한까지 가서 리더에게 말을 걸면 바로 일하러 간다.',`다음 공략 일정은 ${Math.max(0,c.scheduleNextAt-day(G))}일 뒤에 연락한다. 그동안 자유롭게 활동할 수 있다.`):html;
  };
}
