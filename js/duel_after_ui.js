// ===== 게이트 크로니클: 생사결 뒤 선택 화면 (영역 A, 4-18) =====
// 판정은 C(js/duel_after.js). 여기서는 화면만 다듬는다.
//  - 이겼을 때: 무릎 꿇은 상대, 장소(법 적용 / 법이 닿지 않는 곳), 세 선택지마다 범죄 표시(도시·월드맵에서만)와 결과 미리 보기.
//  - 졌을 때: 토스트 한 줄 대신 "쓰러진 나를 내려다보는 승자 → 그의 선택" 창. 성격에 맞는 한마디와 잃은 것.
//  - 게이트 안 길드 추격대(js/gate_pursuit.js)를 이기면 추격대장에게 같은 창을 띄우고, 고른 뒤 층 지도로 돌아간다.

const DUEL_WIN_LINE = {
  kind: ['"…끝내. 원망은 안 할게."', '"부탁이야, 동생이 기다려."'],
  just: ['"졌다. 네 판단에 맡기지."', '"규칙대로 해."'],
  greedy: ['"돈이면 돼? 원하는 만큼 줄게!"', '"살려만 줘, 계산은 나중에."'],
  warlike: ['"베어. 구걸은 안 한다."', '"…다음엔 내가 이긴다."'],
  cold: ['"…"', '"빨리 정해."'],
};
const DUEL_LOSE_LINE = {
  spare: { kind: '"됐어. 다신 이러지 마."', just: '"목숨까지 가져갈 일은 아니야."', greedy: '"죽여 봐야 돈이 안 돼."', warlike: '"약한 놈 목은 안 따. 더 강해져서 와."', cold: '"…가."' },
  rob: { kind: '"미안. 이건 치료비로 받을게."', just: '"대가는 치러야지."', greedy: '"수업료다. 싸게 먹힌 줄 알아."', warlike: '"전리품은 이긴 놈 몫이야."', cold: '"가진 거 다 내놔."' },
};

Object.assign(UI, {
  duelPlaceInfo(place) {
    if (place === 'gate') return { cls: 'lawless', label: '게이트 안 · 법이 닿지 않는 곳', note: '범죄가 되지 않는다. 목격자가 있으면 소문만 난다.' };
    if (place === 'lawless') return { cls: 'lawless', label: '봉쇄 구역 · 법이 닿지 않는 곳', note: '범죄가 되지 않는다. 목격자가 있으면 소문만 난다.' };
    return { cls: 'lawful', label: `${regionById(G.player.region).name} · 법이 적용되는 곳`, note: '여기서의 살인·강도는 범죄다. 관리국 감찰과 수배가 따른다.' };
  },
  showDuelChoice(n) {
    const d = G.world.duelPending; const place = d && d.place; const lawful = G.duelLawful(place); const selfDef = G.duelSelfDefense(n);
    const P = this.duelPlaceInfo(place);
    const pid = persById(n.personality).id;
    const line = RNG.pick(DUEL_WIN_LINE[pid] || DUEL_WIN_LINE.cold);
    const tag = (t, cls) => `<span class="dc-tag ${cls}">${t}</span>`;
    const killTags = !lawful ? tag('범죄 아님', 'ok') : selfDef ? tag('정당방위 · 감경', 'warn') : tag('중범죄 · 살인', 'bad');
    const robTags = !lawful ? tag('범죄 아님', 'ok') : selfDef ? tag('정당방위 · 신고 무력', 'warn') : tag('경범죄 · 강도', 'bad');
    const killNote = !lawful ? '목격자가 있으면 소문이 돈다' : selfDef ? '상대가 먼저 덤볐다. 그래도 악명이 남는다' : '수배·현상금·관리국 감찰';
    const robNote = !lawful ? '원한을 산다' : selfDef ? '신고해도 힘이 없다. 원한은 남는다' : '신고당하면 수배·벌금. 원한을 산다';
    const back = this.ctx && this.ctx.run ? 'gate' : 'world';
    this._duelChoiceBack = back;
    this.modal(`<div class="duel-choice">
      <div class="dc-head">${this.npcPortrait ? this.npcPortrait(n, 96) : ''}<div><div class="eyebrow">생사결 승리</div><h3>${n.name}</h3><div class="row small">${this.rankTag ? this.rankTag(n.rankIdx, n.stage) : ''} <span class="dim">${persById(n.personality).name}</span></div></div></div>
      <div class="dc-place ${P.cls}"><b>${P.label}</b><span>${P.note}</span></div>
      <p class="event-text">${n.name}이(가) 무릎을 꿇었다. 거친 숨 사이로 말한다. ${line}</p>
      <div class="cards">
        <button class="choice-btn" data-act="duel-after" data-v="spare"><span class="dc-row"><b>풀어준다</b>${tag('범죄 아님', 'ok')}</span><span class="small dim">은혜를 갚을 수도, 앙심을 품을 수도 있다</span></button>
        <button class="choice-btn" data-act="duel-after" data-v="rob"><span class="dc-row"><b>가진 것을 빼앗는다</b>${robTags}</span><span class="small dim">${robNote}</span></button>
        <button class="choice-btn danger" data-act="duel-after" data-v="kill"><span class="dc-row"><b>숨통을 끊는다</b>${killTags}</span><span class="small dim">${killNote}</span></button>
      </div></div>`, 'event-box');
  },
  // 졌을 때: 승자의 선택
  showDuelLost(q) {
    const n = G.npcById(q.npcId); if (!n) return this.processQueue();
    const pid = persById(n.personality).id;
    const head = q.choice === 'rob' ? '털렸다' : '살아남았다';
    const say = (DUEL_LOSE_LINE[q.choice] || DUEL_LOSE_LINE.spare)[pid] || '';
    this.modal(`<div class="duel-choice lost">
      <div class="dc-head">${this.npcPortrait ? this.npcPortrait(n, 96) : ''}<div><div class="eyebrow">생사결 패배</div><h3>${n.name}</h3><div class="row small"><span class="dim">${persById(n.personality).name}</span></div></div></div>
      <p class="event-text">시야가 흐려진다. 쓰러진 당신을 ${n.name}이(가) 내려다본다. 칼끝이 잠시 멈췄다가… ${say}</p>
      <div class="dc-result ${q.choice}"><b>${head}</b><span>${fixJosa(q.text || '')}</span></div>
      <div class="row end"><button class="primary" data-act="modal-close">일어난다</button></div></div>`, 'event-box');
  },
});

{
  // 졌을 때 NPC의 선택을 기억해 창으로 보여 준다 (죽음은 게임 오버 화면이 따로 나온다)
  const GP = Game.prototype;
  const baseLose = GP.duelLoseChoice;
  if (baseLose) GP.duelLoseChoice = function (n, base, hp, mp) {
    let pick = null;
    const baseNpc = this.duelNpcChoice;
    this.duelNpcChoice = function (...a) { pick = baseNpc.apply(this, a); return pick; };
    let text;
    try { text = baseLose.call(this, n, base, hp, mp); } finally { delete this.duelNpcChoice; }
    if (pick && pick !== 'kill' && !this.over) { this.queue.unshift({ type: 'duelLost', npcId: n.id, choice: pick, text }); return ''; }
    return text;
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'duelLost') { G.queue.shift(); return this.showDuelLost(q); }
    return baseQueue.call(this);
  };
  // 게이트 안에서 고른 뒤에는 층 지도로 돌아간다
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'duel-after' && this._duelChoiceBack === 'gate' && this.ctx && this.ctx.run) {
      this._duelChoiceBack = null;
      const msg = G.duelResolve(v); G.save();
      this.gateStub && this.gateStub();
      return this.renderGateMap(`<b>추격대장의 처분</b> · ${fixJosa(msg || '')}`);
    }
    if (act === 'duel-after') this._duelChoiceBack = null;
    // 길드 추격대를 이기면 추격대장(실제 길드원)에게 같은 선택 창
    if (act === 'gp-won' && this.ctx && this.ctx.run) {
      const c = this.ctx; const pu = c.run.pursuit; const ids = pu && pu.chase && pu.chase.ids;
      const lead = ids && ids.map((id) => G.npcById(id)).find((n) => n && n.alive);
      if (pu && pu.chase) c.run.lastChase = pu.chase; // 함께 쓰러진 추격대원은 목격자 (js/duel_witness.js)
      const r = baseHandle.call(this, act, v);
      if (lead && !G.over && this.ctx === c) {
        const p = G.player;
        G.world.duelPending = { id: lead.id, hp: p.hp, mp: p.mp, place: 'gate' };
        this.showDuelChoice(lead);
      }
      return r;
    }
    return baseHandle.call(this, act, v);
  };
}
