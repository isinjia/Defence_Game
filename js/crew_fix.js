// 소속 파티(NPC 리더) 다듬기 (사용자 요청: "기한을 매우 넉넉하게", 파티 시스템 완성도)
// 1. 합류 기한을 매우 넉넉하게: 첫 기한 21일 이상, 다음 기한 18~28일(지휘가 서툰 리더도 14~20일).
//    거점이 멀면 이동 시간만큼 더 준다.
// 2. 지각 불이익을 가볍게: 리더 관계 −4, 다른 팀원 −1, 명성 −1, 신뢰 −8. 다섯 번 어기면 제명.
// 3. 다른 일을 하는 중에는 기한을 어긴 것으로 치지 않는다: 게이트 안·전투 중, 첫 공략 진행 중, 리더가 이끄는 이동 중이면
//    기한을 그만큼 미룬다(연락은 일이 끝난 뒤).
// 4. 말 다듬기: 기한을 어겨 팀이 따로 나간 직후에 "수고했다"라고 하지 않는다. 일감이 없어 훈련으로 바꿀 때는 이유를 말한다.
{
  if (typeof CREW_TIME !== 'undefined') Object.assign(CREW_TIME, { firstDue: 21, dueMin: 18, dueMax: 28, dueLowMin: 14, dueLowMax: 20 });
  if (typeof RALLY !== 'undefined') Object.assign(RALLY, { missLeader: 4, missMember: 1, missFame: 1, missTrust: 8, kickAfter: 5 });

  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };

  // 1. 거점이 멀면 이동 시간만큼 더
  const baseSet = GP.crewSetDue;
  if (baseSet) GP.crewSetDue = function (first) {
    const r = baseSet.call(this, first);
    try {
      const c = npcLed(this);
      if (c && c.due != null && typeof regionDist === 'function') c.due += Math.max(0, regionDist(this.player.region, c.base)) * 3;
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 3. 다른 일을 하는 중이면 기한을 미룬다
  const busy = (g) => {
    if (typeof UI === 'undefined') return false;
    if (UI.ctx) return true; // 게이트 안·전투·상의
    if (UI.crewMarch) return true; // 리더가 이끄는 이동
    const s = g.player && g.player.firstSortie; if (s && !s.returned && s.status === 'active') return true; // 첫 공략 진행 중
    return false;
  };
  const baseTick = GP.crewDayTick;
  if (baseTick) GP.crewDayTick = function (...a) {
    try {
      const c = npcLed(this);
      if (c && !c.on && c.due != null && busy(this) && c.due - absDay(this) < 2) { c.due = absDay(this) + 2; c.dueWarned = false; }
    } catch (e) { /* 무시 */ }
    return baseTick.apply(this, a);
  };

  // 4. 기한을 어긴 직후의 연락은 "수고했다"가 아니라 다음엔 오라는 말로
  const baseMiss = GP.crewMissDue;
  if (baseMiss) GP.crewMissDue = function (...a) {
    const c = npcLed(this); const before = c ? c.missed || 0 : 0;
    const r = baseMiss.apply(this, a);
    try { const c2 = npcLed(this); if (c2 && (c2.missed || 0) > before) c2._justMissed = true; } catch (e) { /* 무시 */ }
    return typeof r === 'string' ? r.replace('세 번이면 충분해.', '다섯 번이면 충분해.') : r;
  };
  if (typeof UI !== 'undefined' && UI.talk) {
    const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };
    const baseTalk = UI.talk;
    UI.talk = function (lines, ...a) {
      try {
        if (Array.isArray(lines)) {
          const c = npcLed(G);
          lines = lines.map((l) => {
            if (!l || typeof l.text !== 'string' || !l.who || typeof l.who !== 'object') return l;
            const k = col(l.who);
            // 기한을 어긴 직후: "수고했다/수고했어요. 다음은 ○일까지 …"
            let m = /^(?:수고했다|수고했어요!?|수고)[.!]?\s*다음(?:은|엔)\s*(.+?)까지\s*(.+?)(?:\(으\)로|으로|로|에서)/.exec(l.text);
            if (m && c && c._justMissed) {
              c._justMissed = false;
              const when = m[1], where = m[2].replace(/\(으\)$/, '');
              const T = { just: `이번엔 우리끼리 다녀왔다. 다음엔 꼭 와라. ${when}까지 ${where}(으)로.`, kind: `이번엔 저희끼리 다녀왔어요. 다음엔 꼭 와요. ${when}까지 ${where}에서 봐요.`, cold: `다음엔 와라. ${when}, ${where}.` };
              return { ...l, text: fixJosa(T[k] || T.just) };
            }
            // 일감이 없어 훈련으로: 이유를 말한다
            if (/합동 훈련/.test(l.text) && /출발/.test(l.text)) {
              const T = { just: '근처에 갈 만한 게이트가 없다. 이번엔 합동 훈련이다. 손발부터 맞춘다.', kind: '근처에 마땅한 일이 없어서, 이번엔 합동 훈련이에요. 손발부터 맞춰 봐요.', cold: '근처에 일이 없다. 합동 훈련.' };
              return { ...l, text: T[k] || T.just };
            }
            return l;
          });
        }
      } catch (e) { /* 무시 */ }
      return baseTalk.call(this, lines, ...a);
    };
  }
}
