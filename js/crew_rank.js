// 소속 파티 안의 내 자리: 신입 → 정식 → 고참 → 부리더 (사용자 요청 2-②)
// 전에는 신뢰 숫자 하나뿐이라 파티 안에서 자라는 느낌이 없었다.
// 단계는 함께한 일 수와 신뢰로 오른다. 신뢰가 떨어지면 단계도 내려간다(빠진 일 수는 그대로 남는다).
//   신입: 처음 · 정식: 함께한 일 2회+·신뢰 60+ · 고참: 6회+·신뢰 75+ · 부리더: 12회+·신뢰 90+
// 혜택: 보상 분배율 +0/+3/+7/+10%p, 일 제안이 받아들여질 확률 +0/+5/+10/+20%p,
//       부리더는 리더가 다쳤을 때 대신 지휘한다(js/crew_events.js).
const CREW_RANKS = [
  { id: 'new', name: '신입', done: 0, trust: 0, share: 0, propose: 0 },
  { id: 'reg', name: '정식', done: 2, trust: 60, share: 0.03, propose: 0.05 },
  { id: 'vet', name: '고참', done: 6, trust: 75, share: 0.07, propose: 0.10 },
  { id: 'sub', name: '부리더', done: 12, trust: 90, share: 0.10, propose: 0.20 },
];
{
  const GP = Game.prototype;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  GP.crewRankOf = function (c = npcLed(this)) {
    if (!c) return null; let r = CREW_RANKS[0];
    for (const x of CREW_RANKS) if ((c.done || 0) >= x.done && (c.trust || 0) >= x.trust) r = x;
    return r;
  };
  GP.crewStageBonus = function (key) { const r = this.crewRankOf(); return r ? r[key] || 0 : 0; };
  // 분배율에 단계 보너스
  const baseRate = GP.crewShareRate;
  if (baseRate) GP.crewShareRate = function (...a) { const v = baseRate.apply(this, a); const b = npcLed(this) ? this.crewStageBonus('share') : 0; return Math.min(0.95, v + b); };
  const basePay = GP.crewPay;
  if (basePay) GP.crewPay = function (perHead, ...a) {
    const v = basePay.call(this, perHead, ...a); const b = npcLed(this) ? this.crewStageBonus('share') : 0;
    return b ? Math.round(v + perHead * (this.party().length + 1) * b) : v;
  };
  // 일이 끝날 때 단계가 오르면 리더가 알려 준다
  if (typeof UI !== 'undefined' && UI.crewJobDone) {
    const baseDone = UI.crewJobDone;
    UI.crewJobDone = function (...a) {
      // 함께한 일 수는 출발할 때 오르므로, 마지막으로 알린 단계(c.rankSeen)와 비교한다
      const c = npcLed(G); const r0 = c ? (CREW_RANKS.find((x) => x.id === c.rankSeen) || CREW_RANKS[0]) : null;
      const r = baseDone.apply(this, a);
      try {
        const c2 = npcLed(G); const r1 = c2 ? G.crewRankOf(c2) : null; const L = G.crewLeader();
        if (c2 && r1 && CREW_RANKS.indexOf(r1) < CREW_RANKS.indexOf(r0)) c2.rankSeen = r1.id; // 내려가면 조용히 맞춘다
        if (c2 && r0 && r1 && CREW_RANKS.indexOf(r1) > CREW_RANKS.indexOf(r0) && L) {
          c2.rankSeen = r1.id;
          const k = typeof voiceCol === 'function' ? voiceCol(L) : 'just';
          const T = {
            reg: { just: '이제 정식 파티원이다. 몫도 조금 더 챙겨 주지.', kind: '이제 정식 파티원이에요! 몫도 조금 더 드릴게요.', cold: '정식이다. 몫 올린다.' },
            vet: { just: '네 판단은 믿을 만하다. 이제부터 고참으로 대한다.', kind: '이제 고참이에요. 제가 고르는 일에도 의견 많이 내 줘요.', cold: '고참. 의견 들어 주지.' },
            sub: { just: '내가 못 움직일 땐 네가 팀을 이끌어라. 부리더다.', kind: '제가 다치면 팀은 당신이 이끌어 줘요. 부리더예요.', cold: '부리더. 내가 빠지면 네가 지휘.' },
          }[r1.id];
          G.lifeEvent(`${c2.name}에서 ${r1.name}이(가) 되었다.`);
          G.queue.push({ type: 'toast', text: `${L.name}: "${(T && (T[k] || T.just)) || ''}" · ${c2.name} ${r1.name} (분배율 +${Math.round(r1.share * 100)}%p · 제안 수락 +${Math.round(r1.propose * 100)}%p)` });
        }
      } catch (e) { /* 무시 */ }
      return r;
    };
  }
  // 파티 화면에 내 자리와 다음 단계
  if (typeof UI !== 'undefined' && UI.crewHtml) {
    const baseHtml = UI.crewHtml;
    UI.crewHtml = function (...a) {
      let h = baseHtml.apply(this, a);
      try {
        const c = npcLed(G); if (!c) return h;
        const r = G.crewRankOf(c); const i = CREW_RANKS.indexOf(r); const nx = CREW_RANKS[i + 1];
        const perks = r.share ? `분배율 +${Math.round(r.share * 100)}%p · 제안 수락 +${Math.round(r.propose * 100)}%p${r.id === 'sub' ? ' · 리더가 다치면 대신 지휘' : ''}` : '혜택 없음';
        const next = nx ? `다음 단계 <b>${nx.name}</b>: 함께한 일 ${c.done || 0}/${nx.done} · 신뢰 ${c.trust || 0}/${nx.trust}` : '가장 높은 단계';
        const line = `<p class="small crew-rank">내 자리 <b class="amber">${r.name}</b> · ${perks}<br><span class="dim">${next}</span></p>`;
        h = h.replace(/(<div class="row small"><span class="dim">신뢰<\/span>)/, `${line}$1`);
        h = h.replace(/게이트 보상은 75%를 받는다\./, `게이트 보상은 ${Math.round((G.crewShareRate ? G.crewShareRate() : 0.75) * 100)}%를 받는다.`);
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
}
