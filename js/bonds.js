// ===== 스킬 무작위 옵션 · 의형제(결의) · 부부 공명 수련 =====
// 설계: docs/귀곡팔황_대조.md 3장 "그 밖에"
//  - 스킬 옵션: 익힌 스킬마다 접사가 하나 붙는다(위력·정신력 소모가 조금씩 다르다). 재능 8 이상이거나 스킬이 각성(Lv5)하면 숨은 접사가 열린다.
//  - 의형제: 관계 90 이상인 사람과 결의한다(최대 2명). 같은 지역에 있으면 30% 확률로 싸움에 달려온다. 그쪽이 위기면 도움을 청한다.
//  - 부부 공명: 배우자와 같은 지역에서 수련하면 효율 +20%, 배우자도 함께 성장한다.

const SKILL_AFFIX = [
  { id: 'sharp', name: '예리한', power: 1.1, mp: 1 },
  { id: 'heavy', name: '묵직한', power: 1.16, mp: 1.15 },
  { id: 'thrifty', name: '절약의', power: 1, mp: 0.8 },
  { id: 'swift', name: '간결한', power: 1.04, mp: 0.9 },
  { id: 'wild', name: '거친', power: 1.2, mp: 1.25 },
  { id: 'dull', name: '무딘', power: 0.95, mp: 0.85 },
  { id: 'plain', name: '', power: 1, mp: 1 },
];
const HIDDEN_AFFIX = [
  { id: 'h_awake', name: '깨달은', power: 1.12, mp: 1 },
  { id: 'h_reso', name: '공명하는', power: 1, mp: 0.75 },
  { id: 'h_storm', name: '폭풍 같은', power: 1.08, mp: 0.92 },
];
const affixById = (id) => SKILL_AFFIX.find((a) => a.id === id) || HIDDEN_AFFIX.find((a) => a.id === id);
const SWORN_MAX = 2;

Object.assign(Game.prototype, {
  bondsInit() { const p = this.player; if (!p) return; p.skillAffix ??= {}; p.sworn ??= []; },
  rollAffix(id) {
    const p = this.player; if (!p || !id || id === 'strike') return null;
    let a = p.skillAffix[id];
    if (!a) {
      a = p.skillAffix[id] = { a: RNG.weighted(SKILL_AFFIX.map((x) => x.id), [5, 3, 4, 4, 2, 2, 6]) };
      if (p.talent >= 8 && RNG.chance(0.5)) a.h = RNG.pick(HIDDEN_AFFIX).id;
    }
    if (!a.h && this.skillLv && this.skillLv(id) >= 5) {
      a.h = RNG.pick(HIDDEN_AFFIX).id;
      this.log(`스킬 [${skillById(id).name}]의 숨은 접사가 열렸다: ${affixById(a.h).name}`, 'good');
    }
    return a;
  },
  affixLabel(id) { const a = this.player.skillAffix && this.player.skillAffix[id]; if (!a) return ''; return [a.h && affixById(a.h).name, affixById(a.a) && affixById(a.a).name].filter(Boolean).join(' '); },

  // ---------- 의형제 ----------
  canSwear(n) {
    const p = this.player;
    return n && n.alive && !n.child && n.met && n.relation >= 90 && !p.sworn.includes(n.id) && p.sworn.length < SWORN_MAX && p.spouse !== n.id && p.partner !== n.id;
  },
  swear(id) {
    const n = this.npcById(id); if (!this.canSwear(n)) return '';
    this.player.sworn.push(n.id); n.sworn = true; this.changeRel(n, 10);
    this.lifeEvent(`${n.name}과(와) 의형제를 맺었다. "태어난 날은 달라도, 죽는 날은 같기를."`);
    this.rumor(`${this.player.name}과(와) ${n.name}이(가) 결의를 맺었다고 한다.`);
    return `${n.name}과(와) 의형제를 맺었다.`;
  },
  swornHere() { const p = this.player; return (p.sworn || []).map((id) => this.npcById(id)).filter((n) => n && n.alive && n.region === p.region && !n.isCompanion); },
  swornMonthly() {
    const p = this.player;
    p.sworn = (p.sworn || []).filter((id) => { const n = this.npcById(id); return n && n.alive; });
    if (!p.sworn.length || !RNG.chance(0.03)) return;
    const n = this.npcById(RNG.pick(p.sworn));
    this.queue.push({ type: 'swornCall', npc: n.id });
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.bondsInit(); });
  wrap('worldMonthly', function (base) { base.call(this); this.swornMonthly(); });
  // 접사 반영
  wrap('skillEff', function (base, sk) {
    const r = base.call(this, sk);
    if (!r || r.id === 'strike' || r._aff || !this.player || !this.player.skillAffix) return r;
    const a = this.rollAffix(r.id); if (!a) return r;
    const A = affixById(a.a); const H = a.h && affixById(a.h);
    const pw = (A ? A.power : 1) * (H ? H.power : 1); const mp = (A ? A.mp : 1) * (H ? H.mp : 1);
    if (pw === 1 && mp === 1) return r;
    const label = this.affixLabel(r.id);
    return { ...r, _aff: true, power: Math.round(r.power * pw * 1000) / 1000, mp: Math.max(0, Math.round(r.mp * mp)), name: label ? `${label} ${r.name}` : r.name };
  });
  // 부부 공명 수련
  const spouseHere = (g) => { const p = g.player; const s = p && p.spouse != null && g.npcById(p.spouse); return s && s.alive && s.region === p.region ? s : null; };
  wrap('trainGain', function (base, mult = 1) { return base.call(this, mult * (spouseHere(this) ? 1.2 : 1)); });
  wrap('train', function (base) {
    const s = spouseHere(this);
    const r = base.call(this);
    if (s && s.alive) { s.progress = (s.progress || 0) + 0.25; this.changeRel(s, 1); this.log(`${s.name}과(와) 함께 수련했다. 서로의 에테르가 공명한다. (수련 +20%)`); }
    return r;
  });
}

// ---------- 화면 ----------
{
  // 의형제는 같은 지역에 있으면 싸움에 달려온다
  const baseAllies = UI.allyUnits;
  UI.allyUnits = function () {
    const list = baseAllies.call(this);
    const c = this.ctx;
    if (c && c.swornJoin === undefined) {
      const here = G.swornHere();
      c.swornJoin = here.length && list.length < 5 && RNG.chance(0.3) ? RNG.pick(here).id : null;
      if (c.swornJoin != null) { const n = G.npcById(c.swornJoin); setTimeout(() => this.toast(`의형제 ${n.name}이(가) 소식을 듣고 달려왔다!`), 50); }
    }
    if (c && c.swornJoin != null) { const n = G.npcById(c.swornJoin); if (n && n.alive && !list.some((u) => u.npcId === n.id)) list.push(G.npcUnit(n, 'ally')); }
    return list;
  };
  // 인물 카드: 결의 버튼
  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    let html = baseCard.call(this, n, here);
    if (here && G.canSwear(n)) html = html.replace('<div class="row npc-btns">', `<div class="row npc-btns"><button class="sm primary" data-act="swear" data-v="${n.id}">의형제 결의</button>`);
    if ((G.player.sworn || []).includes(n.id)) html = html.replace(`<b>${n.name}</b>`, `<b>${n.name}</b> <span class="tag amber">의형제</span>`);
    return html;
  };
  // 스킬 창: 접사 표시
  const baseSkills = UI.skillsHtml;
  UI.skillsHtml = function () {
    let html = baseSkills.call(this);
    for (const id of G.player.skills) {
      if (id === 'strike') continue;
      G.rollAffix(id);
      const lb = G.affixLabel(id); if (!lb) continue;
      const sk = skillById(id); const a = G.player.skillAffix[id];
      const A = affixById(a.a); const H = a.h && affixById(a.h);
      const pw = Math.round(((A ? A.power : 1) * (H ? H.power : 1) - 1) * 100); const mp = Math.round(((A ? A.mp : 1) * (H ? H.mp : 1) - 1) * 100);
      const tip = [pw ? `위력 ${pw > 0 ? '+' : ''}${pw}%` : '', mp ? `소모 ${mp > 0 ? '+' : ''}${mp}%` : ''].filter(Boolean).join(' ');
      html = html.replace(`<b>${sk.name}</b>`, `<b>${sk.name}</b> <span class="tag ${a.h ? 'amber' : ''}" title="${tip}">${lb}</span> <span class="small dim">${tip}</span>`);
    }
    return html;
  };
  UI.showSwornCall = function (q) {
    const n = G.npcById(q.npc); if (!n || !n.alive) return this.processQueue();
    this.swornQ = q;
    this.modal(`<div class="ambush">${this.npcPortrait(n, 96)}<div><div class="eyebrow">의형제의 부름</div><h3>${n.name}</h3><div class="small dim">${regionById(n.region).name}</div></div></div>
      <p class="event-text">"미안하다. 혼자서는 안 되겠어. 와 줄 수 있겠나?" ${n.name}의 파티가 ${regionById(n.region).name}에서 괴수 무리에 포위됐다.</p>
      <div class="cards"><button class="choice-btn" data-act="sworn-go" data-v="1">당장 달려간다</button><button class="choice-btn" data-act="sworn-go" data-v="0">지금은 갈 수 없다</button></div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'swornCall') { G.queue.shift(); return this.showSwornCall(q); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'swear': return this.after(G.swear(+v));
      case 'sworn-go': {
        const q = this.swornQ; this.swornQ = null; this.closeModal(); if (!q) return;
        const n = G.npcById(q.npc); if (!n || !n.alive) return this.processQueue();
        if (v !== '1') { G.changeRel(n, -20); if (n.relation < 70) { G.player.sworn = G.player.sworn.filter((x) => x !== n.id); n.sworn = false; G.lifeEvent(`${n.name}의 부름을 외면했다. 결의는 깨졌다.`); return this.after(`${n.name}과(와)의 결의가 깨졌다.`); } return this.after(`${n.name}이(가) 실망한 목소리로 전화를 끊었다.`); }
        G.advanceDays(5, { eventChance: 0 });
        G.storyFight({ title: `${n.name} 구출`, mobs: { tier: Math.min(7, Math.max(n.rankIdx, G.player.rankIdx)), n: 3 }, ally: { name: n.name, rank: n.rankIdx, elem: n.element },
          win: { text: `${n.name}을(를) 구해 냈다. "역시 너밖에 없다."`, gain: { fame: 5 }, after: (g) => { g.changeRel(n, 10); } },
          lose: { text: `둘 다 간신히 빠져나왔다. ${n.name}은(는) 그래도 와 준 것을 고마워한다.`, gain: { injure: 2 }, after: (g) => g.changeRel(n, 5) } });
        return this.processQueue();
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
