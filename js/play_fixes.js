// ===== 게이트 크로니클: 플레이 점검에서 찾은 흐름 보정 =====
// 1. 첫 공략(신입의 첫 게이트) 동안에는 경쟁 파티가 게이트 보스를 먼저 잡아 닫지 않는다.
//    자동 플레이 점검에서 첫 공략이 '선점당했다 · 받은 크레딧 0'으로 끝나 첫 게이트를 다시 신청해야 했다.
//    첫 경험은 끝까지 해 보게 하고, 경쟁은 그다음 게이트부터.
{
  const GP = Game.prototype;
  const firstGate = (g, gate) => {
    const s = g.player && g.player.firstSortie;
    return !!(s && s.status === 'active' && gate && (s.gate == null || s.gate === gate.id));
  };
  const baseStep = GP.gatePartiesStep;
  if (baseStep) GP.gatePartiesStep = function (gate, run) {
    const ev = baseStep.call(this, gate, run);
    if (!firstGate(this, gate)) return ev;
    return ev.filter((e) => e.type !== 'closed');
  };
  const baseBoss = GP.gatePartyBoss;
  if (baseBoss) GP.gatePartyBoss = function (gate, pt) {
    if (firstGate(this, gate)) return null; // 첫 공략 중엔 보스전에 끼어들지 않는다(다음 층으로도 서두르지 않음)
    return baseBoss.call(this, gate, pt);
  };
}

// 2. 솔로를 고른 신입에게 '공략대 모집' 창이 갑자기 뜨던 것: 그 전에 협회 담당자가 의무 동행 규정을 설명한다(사용자 요청).
//    실전 경험 없는 신규 헌터는 첫 게이트 한 번을 경험 있는 리더의 공략대와 함께 들어가야 한다. 끝나면 다시 솔로.
{
  const baseShow = UI.showFirstSortie;
  if (baseShow) UI.showFirstSortie = function (...a) {
    const p = G.player;
    const pending = p && p.notebook && G.nbTask && G.nbTask()?.id === 'gate' && p.firstSortie?.status !== 'done';
    const solo = !(G.crew && G.crew()) && !G.party().length;
    if (!pending || !solo || this.dlg || (p.firstSortie && (p.firstSortie.status === 'active' || p.firstSortie.briefed))) return baseShow.apply(this, a);
    const s = G.firstSortieOffer();
    s.briefed = true; G.save();
    const L = s.listing && G.npcById(s.listing.leader);
    const staff = { name: '협회 활동 지원 담당자', sub: '헌터 협회', seed: 'nb-free-staff', elem: 'holy' };
    const rk = RANKS[p.rankIdx].key;
    this.talk([
      { narr: '협회 지부 창구. 활동 지원 담당자가 서류 한 장을 내민다. 맨 위에 굵은 글씨로 "신규 헌터 실전 동행 확인서".' },
      { who: staff, text: '솔로로 활동하시겠다고요. 그건 존중합니다. 다만 그 전에 꼭 거쳐야 하는 규정이 하나 있어요.' },
      { who: staff, text: '실전 경험이 없는 신규 헌터는 첫 게이트 한 번을, 경험 있는 리더의 공략대와 함께 들어가야 합니다. 협회 의무 동행이에요.' },
      { who: staff, text: '첫 게이트에 혼자 들어갔다가 못 나오는 신입이 해마다 나옵니다. 그래서 생긴 규정이에요. 예외는 없습니다.' },
      { who: 'player', text: '한 번만 다녀오면 되는 거죠?' },
      { who: staff, text: '네, 이번 한 번입니다. 정산이 끝나면 다시 솔로로 돌아가시면 되고, 첫 공략 입장료는 협회가 냅니다.' },
      L ? { who: staff, text: `마침 ${RANKS[L.rankIdx].key}급 리더 ${L.name} 씨 공략대가 ${rk}급 인원을 찾고 있어요. 바로 연결해 드릴게요.` }
        : { who: staff, text: `${rk}급 인원을 찾는 공략대가 있는지 바로 알아봐 드릴게요.` },
    ], () => baseShow.apply(this, a));
  };
}

// 3. 시험 뒤 순서: 연락처 교환 → 등록 창구에서 등급 판정 대화 → (선임의 연락처) → 판정 통지서 → 헌터 카드 발급 (사용자 요청)
//    예전엔 등급을 알려 주는 대사가 연락처 교환 앞에 나왔다(js/tutorial.js examResultTalk 에서 뺌).
{
  const baseNotice = UI.showNotice;
  if (baseNotice) UI.showNotice = function (...a) {
    const f = G.flags || (G.flags = {});
    if (f.rankTalkDone || !this.talk || !G.player) return baseNotice.apply(this, a);
    f.rankTalkDone = true;
    const rk = RANKS[Math.max(0, Math.min(RANKS.length - 1, G.player.rankIdx))].key;
    const meter = { name: '등록 담당자', sub: '헌터 협회' };
    this.closeModal();
    this.talk([
      { narr: '동기들과 헤어진 뒤, 협회 등록 창구에서 시험 결과를 확인한다.' },
      { who: meter, text: `기존 측정 기록과 실기 결과를 확인했습니다. 등록 등급은 ${rk}급입니다.` },
      { who: meter, text: '정식 판정 통지서와 헌터 카드는 발급 창구에서 받으시면 됩니다. 수고하셨습니다.' },
    ], () => baseNotice.apply(this, a));
  };
}
