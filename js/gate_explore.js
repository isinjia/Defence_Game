// ===== 게이트 크로니클: 헌터 자격 시험용 탐색 장면 =====
// 시험 리더가 탐색을 가르칠 때 쓰는 장면들. 고른 행동에 따라 다음 전투의 적 수·체력, 내 체력·정신력, 전리품이 달라진다.
// 실제 게이트의 탐색 시스템은 별도 작업에서 만든다. 그쪽이 들어오면 시험도 그 시스템을 쓰도록 바꾼다.

const EX_GROUP_SCOUT = ['shadow', 'esper', 'shooter'];
const exGroup = () => (classById(G.player.cls) || {}).g;

// 다음 전투 구역을 고치는 도구
const exRoom = (c) => c.rooms[c.roomIdx] || [];
const EX = {
  weaken(c, pct) { for (const e of exRoom(c)) { e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * (1 - pct))); } return ` (다음 구역 적 체력 -${Math.round(pct * 100)}%)`; },
  enrage(c, pct) { for (const e of exRoom(c)) { e.hp = e.maxHp = Math.round(e.maxHp * (1 + pct)); } return ` (남은 적이 성나 체력 +${Math.round(pct * 100)}%)`; },
  thin(c) { const r = exRoom(c); if (r.length > 1) { const i = r.findIndex((e) => !e.boss); r.splice(i >= 0 ? i : r.length - 1, 1); return ' (다음 구역 적 1마리 줄어듦)'; } return ''; },
  add(c) { const r = exRoom(c); const t = c.gate.realTier ?? c.gate.tier; if (r.length < 6) r.push(G.makeMonster(t, false, c.gate.elem)); return ' (다음 구역 적 1마리 늘어남)'; },
  hurt(pct) { const p = G.player; const v = Math.round(p.maxHp * pct); p.hp = Math.max(1, p.hp - v); return ` (체력 -${v})`; },
  heal(pct, mp = 0) { const p = G.player; const v = Math.round(p.maxHp * pct); p.hp = Math.min(p.maxHp, p.hp + v); let s = ` (체력 +${v}`; if (mp) { const m = Math.round(p.maxMp * mp); p.mp = Math.min(p.maxMp, p.mp + m); s += `, 정신력 +${m}`; } return s + ')'; },
  mp(pct) { const p = G.player; const v = Math.round(p.maxMp * pct); p.mp = Math.max(0, p.mp - v); return ` (정신력 -${v})`; },
  money(c, base) { const v = Math.round(base * RANKS[c.gate.realTier ?? c.gate.tier].mult * RNG.range(0.8, 1.3)); c.loot.money += v; return ` (전리품 ${fmt(v)} 크레딧)`; },
  ether(c, base) { const v = Math.round(base * RANKS[c.gate.realTier ?? c.gate.tier].mult); c.loot.ether += v; return ` (에테르 +${v})`; },
  core(c, n) { const t = c.gate.realTier ?? c.gate.tier; if (G.addCore) G.addCore(t, n); return ` (${RANKS[t].key}급 코어 ${n}개)`; },
  item(id, n = 1) { const p = G.player; p.items[id] = (p.items[id] || 0) + n; const it = CONSUMABLES.find((x) => x.id === id); return ` (${it ? it.name : id} +${n})`; },
};

// 탐색 지점. text 는 문자열이나 (c) => 문자열, choices 의 do(c) 는 결과 문장을 돌려준다
const EXPLORE_NODES = [
  { id: 'fork', title: '갈림길', text: '통로가 둘로 갈린다. 왼쪽 바닥엔 젖은 발자국이 어지럽고, 오른쪽은 이상하리만큼 조용하다.',
    choices: [
      { text: '발자국 쪽으로 간다. 괴수가 많은 곳에 코어도 많다', do: (c) => '굴 안쪽에 먹다 남긴 코어 조각이 흩어져 있다. 대신 녀석들이 냄새를 맡았다.' + EX.money(c, 60) + EX.add(c) },
      { text: '조용한 쪽으로 간다', do: (c) => (G.roll(0.7) ? '조용한 길은 정말 조용했다. 몇 마리를 피해 돌아 나왔다.' + EX.thin(c) : '조용했던 이유가 있었다. 천장에 매달린 놈들이 떨어져 내린다.' + EX.hurt(0.1)) },
      { text: '먼저 혼자 정찰한다', do: (c) => (G.roll(EX_GROUP_SCOUT.includes(exGroup()) ? 0.85 : 0.55) ? '놈들의 위치와 약한 곳을 다 봐 두었다. 첫 일격은 이쪽 몫이다.' + EX.weaken(c, 0.2) : '들켰다. 쫓기듯 돌아왔다.' + EX.hurt(0.12)) },
    ] },
  { id: 'spring', title: '에테르 샘', text: '바위틈에서 푸른 물이 솟는다. 에테르가 짙게 녹아 있다. 손을 대니 피로가 씻겨 내려가는 것 같다.',
    choices: [
      { text: '마신다', do: () => (G.roll(0.8) ? '온몸에 힘이 돈다.' + EX.heal(0.3, 0.3) : '너무 짙었다. 속이 뒤집힌다.' + EX.heal(0.1) + EX.mp(0.15)) },
      { text: '빈 병에 담아 둔다', do: () => '나중을 위해 아껴 둔다.' + EX.item('potion') },
      { text: '손만 적시고 지나간다', do: () => '조심해서 나쁠 건 없다.' + EX.heal(0.08) },
    ] },
  { id: 'chest', title: '녹슨 상자', text: '구석에 헌터 협회 표식이 찍힌 보급 상자가 있다. 몇 년은 묵은 것 같다. 뚜껑 틈으로 무언가 숨 쉬는 소리가 나는 것도 같고, 아닌 것도 같다.',
    choices: [
      { text: '연다', do: (c) => (G.roll(0.6) ? '협회 보급품이 그대로 남아 있었다.' + EX.money(c, 90) + EX.item('mana') : '상자가 입을 벌렸다. 의태 괴수다! 다음 구역까지 쫓아온다.' + EX.hurt(0.12) + EX.add(c)) },
      { text: '돌을 던져 먼저 건드려 본다', do: (c) => (G.roll(0.5) ? '반응이 없다. 안에는 녹슨 응급 키트뿐이다.' + EX.item('potion') : '상자가 돌을 씹었다. 정체를 알았으니 상대하기 쉽다.' + EX.money(c, 40)) },
      { text: '건드리지 않는다', do: () => '아쉽지만 지나친다. 살아남은 헌터들은 다 이렇게 말한다.' },
    ] },
  { id: 'trap', title: '갈라진 바닥', text: '앞길이 두 걸음 폭으로 갈라져 있다. 아래는 보이지 않는다. 건너편 벽에 다른 파티가 박아 둔 앵커가 보인다.',
    choices: [
      { text: '뛰어넘는다', do: () => (G.roll(0.45 + Math.min(0.4, G.player.spd / 120)) ? '가볍게 건넜다.' : '발끝이 미끄러졌다. 가장자리를 붙잡고 기어올랐다.' + EX.hurt(0.15)) },
      { text: '앵커에 줄을 걸고 한 명씩 건넌다', do: (c) => '시간은 걸렸지만 모두 무사하다. 그 사이 앞쪽에 놈들이 모여들었다.' + EX.add(c) },
      { text: '방패를 걸쳐 다리를 놓는다', when: () => exGroup() === 'guard', do: () => '방패 위로 파티가 건넌다. 팔이 저릿하지만 다들 무사하다.' + EX.mp(0.05) },
      { text: '힘으로 바위를 띄워 발판을 만든다', when: () => ['esper', 'mage'].includes(exGroup()), do: () => '떠오른 바위를 밟고 건넜다. 머리가 조금 띵하다.' + EX.mp(0.12) },
    ] },
  { id: 'hunter', title: '먼저 온 헌터', text: '벽에 기대 앉은 헌터가 숨을 몰아쉰다. 다른 파티에서 떨어져 나온 모양이다. 다리에 감은 붕대가 피로 젖어 있다.',
    choices: [
      { text: '치료해 주고 길을 묻는다', do: (c) => { G.player.fame += 1; return '헌터가 고개를 숙인다. "고마워요. 이 앞 방, 오른쪽 기둥 뒤에 큰 놈이 숨어 있어요."' + EX.mp(0.15) + EX.weaken(c, 0.15) + ' (명성 +1)'; } },
      { text: '출구 방향만 알려 주고 간다', do: () => '헌터는 절뚝이며 출구 쪽으로 사라졌다.' },
      { text: '그가 떨어뜨린 전리품 자루를 챙긴다', do: (c) => { G.player.fame = Math.max(0, G.player.fame - 2); return '헌터가 뭐라 소리치지만 못 들은 척했다. 이 바닥 소문은 빠르다.' + EX.money(c, 120) + ' (명성 -2)'; } },
    ] },
  { id: 'vein', title: '코어 광맥', text: '천장에서 결정이 고드름처럼 자라 있다. 괴수 코어가 굳어 생긴 광맥이다. 캐는 소리는 멀리까지 울릴 것이다.',
    choices: [
      { text: '다 캐 간다', do: (c) => '자루가 묵직해졌다. 멀리서 무언가 깨어나는 소리가 들린다.' + EX.core(c, 3) + EX.add(c) },
      { text: '소리 안 나게 두어 개만', do: (c) => '조심조심 떼어 냈다.' + EX.core(c, 1) },
      { text: '그냥 지나간다', do: () => '욕심은 다음에.' },
    ] },
  { id: 'nest', title: '알 무더기', text: '끈적한 막에 싸인 알 수십 개가 벽에 붙어 있다. 몇 개는 벌써 꿈틀거린다.',
    choices: [
      { text: '전부 부순다', do: (c) => '알을 짓밟았다. 안쪽에서 성난 울음이 터진다.' + EX.thin(c) + EX.enrage(c, 0.1) },
      { text: '숨죽이고 지나간다', do: (c) => (G.roll(0.65) ? '아무것도 깨지 않았다.' + EX.thin(c) : '알 하나가 터지며 새끼가 비명을 질렀다.' + EX.add(c)) },
      { text: '하나를 떼어 간다. 연구소에서 비싸게 산다', do: (c) => '품 안의 알이 따뜻하다.' + EX.money(c, 150) + EX.hurt(0.05) },
    ] },
  { id: 'mural', title: '벽화', text: '매끈한 벽에 누군가 그린 그림이 있다. 사람인지 아닌지 모를 형체들이 문 하나를 둘러싸고 있다. 이 게이트가 생기기 전부터 있던 것 같다.',
    choices: [
      { text: '한참 들여다본다', do: (c) => '그림 속 문이 조금 움직인 것 같다. 몸속 에테르가 공명한다.' + EX.ether(c, 6) },
      { text: '사진을 찍어 둔다. 연구소에 팔 수 있다', do: (c) => '셔터 소리가 유난히 크게 울렸다.' + EX.money(c, 70) },
      { text: '이 구역 구조를 읽는다', do: (c) => '벽화 속 통로가 실제 지형과 같다. 놈들이 어디서 나올지 보인다.' + EX.weaken(c, 0.12) },
    ] },
  { id: 'echo', title: '메아리', text: '어딘가에서 당신 이름을 부르는 소리가 난다. 아는 목소리 같기도 하다. 게이트는 가끔 이런 장난을 친다고 들었다.',
    choices: [
      { text: '소리를 따라간다', do: (c) => (G.roll(0.45) ? '막다른 곳에 오래된 유물이 놓여 있다. 누군가 남기고 간 것이다.' + (G.addRelic ? ' (' + G.addRelic() + ')' : EX.money(c, 120)) : '소리는 멀어지기만 했다. 돌아오는 길에 넘어져 무릎이 깨졌다.' + EX.hurt(0.1)) },
      { text: '귀를 막고 앞으로 간다', do: () => '소리가 잦아든다. 정신이 맑아진다.' + EX.heal(0, 0.1) },
    ] },
  { id: 'camp', title: '버려진 야영지', text: '꺼진 모닥불, 찢어진 침낭, 반쯤 먹다 만 통조림. 다른 파티가 서둘러 떠난 흔적이다. 벽에 매직으로 쓴 글씨: "안쪽 방 조심. 둘이 한꺼번에 온다."',
    choices: [
      { text: '잠깐 쉬어 간다', do: () => '눈을 붙이니 한결 낫다.' + EX.heal(0.15, 0.15) },
      { text: '남은 물자를 챙긴다', do: (c) => '쓸 만한 게 꽤 있다.' + EX.item('mana') + EX.money(c, 30) },
      { text: '경고문을 믿고 작전을 짠다', do: (c) => '둘이 한꺼번에 온다면, 둘을 떼어 놓으면 된다.' + EX.weaken(c, 0.15) },
    ] },
];
const EXPLORE_BOSS = { id: 'boss_door', title: '보스 구역 앞', text: '공기가 무거워진다. 거대한 무언가가 숨 쉬는 소리가 벽을 타고 울린다. 이 문을 넘으면 돌아갈 수 없다.',
  choices: [
    { text: '숨을 고르고 장비를 점검한다', do: () => '심장이 가라앉는다.' + EX.heal(0.12, 0.12) },
    { text: '동료들과 작전을 맞춘다', when: () => G.party().length > 0, do: (c) => '누가 막고 누가 치고 누가 받칠지, 손짓으로 정했다.' + EX.weaken(c, 0.1) },
    { text: '문을 걷어차고 먼저 들어간다', do: (c) => '선수를 쳤다. 놈이 몸을 일으키기 전에 한 방 먹였다.' + EX.weaken(c, 0.08) + EX.hurt(0.05) },
  ] };

Object.assign(UI, {
  // 탐색 지점 하나를 보여 준다. lead 가 있으면 리더가 한마디 덧붙인다
  showExplore(node, opts = {}) {
    const c = this.ctx; this.exNode = { node, opts };
    const text = typeof node.text === 'function' ? node.text(c) : node.text;
    const choices = node.choices.map((ch, i) => ({ ch, i })).filter(({ ch }) => !ch.when || ch.when(c));
    const head = c && c.gate ? `${G.gateName(c.gate)} · ${c.roomIdx === c.rooms.length - 1 ? '보스 구역 앞' : `구역 ${c.roomIdx + 1}`}` : '게이트 안';
    this.modal(`<div class="eyebrow">탐색 · ${head}</div><h3>${node.title}</h3>
      <p class="event-text">${text}</p>
      ${opts.lead ? `<div class="coach lead-say"><span class="eyebrow">${opts.leadName || '리더'}</span><div>${opts.lead}</div></div>` : ''}
      <div class="small dim">체력 ${fmt(G.player.hp)}/${fmt(G.player.maxHp)} · 정신력 ${fmt(G.player.mp)}/${fmt(G.player.maxMp)}</div>
      <div class="cards">${choices.map(({ ch, i }) => `<button class="choice-btn" data-act="ex-choice" data-v="${i}">${ch.text}</button>`).join('')}</div>`, 'event-box');
  },
  exploreChoose(i) {
    const { node, opts } = this.exNode || {}; if (!node) return;
    const c = this.ctx; const res = node.choices[i].do(c);
    this.exNode = null; G.save();
    this.modal(`<div class="eyebrow">탐색 · ${node.title}</div><p class="event-text">${fixJosa(res)}</p>
      ${opts.after ? `<div class="coach lead-say"><span class="eyebrow">${opts.leadName || '리더'}</span><div>${opts.after}</div></div>` : ''}
      <div class="row end"><button class="primary" data-act="ex-go">${opts.goLabel || '앞으로 나아간다'}</button></div>`, 'event-box');
    this.exThen = opts.then;
  },
  // 이번 게이트에서 아직 안 나온 탐색 지점 하나
  pickExplore() {
    const c = this.ctx; c.exUsed = c.exUsed || [];
    if (c.roomIdx === c.rooms.length - 1) return EXPLORE_BOSS;
    const pool = EXPLORE_NODES.filter((n) => !c.exUsed.includes(n.id));
    const n = RNG.pick(pool.length ? pool : EXPLORE_NODES); c.exUsed.push(n.id);
    return n;
  },
});

{
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'ex-choice': return this.exploreChoose(+v);
      case 'ex-go': { const f = this.exThen; this.exThen = null; this.closeModal(); if (G.over) return this.after(); return f ? f() : this.after(); }
      default: return baseHandle.call(this, act, v);
    }
  };
}
