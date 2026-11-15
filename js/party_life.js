// 내 동료·파티 생활 다듬기 (사용자 요청: 파티 시스템 넓은 점검 뒤 "진행")
// 1) 원한으로 동료가 아니게 된 사람은 파티 목록에서도 뺀다(전에는 원수가 된 사람이 계속 같이 다녔다).
// 2) 함께 다니던 동료가 죽으면 인생 기록·알림·짧은 애도 장면.
// 3) 동료 부상: 게이트에서 지거나 철수하면 동료가 다친다(7~14일). 다친 동료는 전투력이 줄고(공격·방어 −20%, 체력 −15%) 시간이 지나면 낫는다.
//    소속 파티 리더 부상 사건(js/crew_events.js)도 이 부상으로 이어진다.
// 4) 동료를 들이는 순간 '함께 움직이는 중'으로 정한다(파티 화면을 열기 전까지 비어 있었다).
// 5) 소속 파티에 있으면서 길드에 처음 들어갈 때, 파티를 나와야 한다고 묻는다.
// 6) 지도 위 다른 파티와 거래: 리더 성격·관계에 따라 파는 물건과 값이 다르다.
// 7) 동료도 함께 성장: 함께 공략한 게이트(등급만큼)·토벌로 수련 진척이 쌓인다. 동료가 등급을 올리면 알려 준다.
// 8) 관계: 함께 게이트를 깨면 +2, 토벌에 이기면 +1, 게이트에서 지면 −1.
// 9) 내 파티 팀 사건: 다툼, 동료의 부탁, 불만 끝에 떠나기(관계 낮을 때).
// 10) 영입 조건: 파티 초대를 누르면 그 사람이 성격대로 조건을 말한다(욕심 많은 사람은 계약금). 받아들이면 합류.
const PARTY_LIFE = { hurtMin: 7, hurtMax: 14, hurtAtk: 0.8, hurtHp: 0.85, gateProg: 0.12, mobProg: 0.05, relClear: 2, relMob: 1, relLose: -1, evChance: 0.3 };
{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const mine = (g) => (g.player && !g.player.crew ? g.party() : []);

  // 1) 원한 뒤 파티 목록 정리
  const baseAvenge = GP.avenge;
  if (baseAvenge) GP.avenge = function (...a) {
    const r = baseAvenge.apply(this, a);
    try { const p = this.player; if (p) p.party = (p.party || []).filter((id) => { const n = this.npcById(id); return n && n.alive && n.isCompanion; }); } catch (e) { /* 무시 */ }
    return r;
  };

  // 2) 동료의 죽음
  const baseKill = GP.killNpc;
  GP.killNpc = function (n, cause, ...a) {
    const was = !!(n && this.player && (this.player.party || []).includes(n.id) && n.isCompanion);
    const r = baseKill.call(this, n, cause, ...a);
    try {
      if (was) {
        this.lifeEvent(`함께 다니던 동료 ${n.name}을(를) 잃었다.${cause ? ` (${cause})` : ''}`);
        this.log(`동료 ${n.name}이(가) 세상을 떠났다.`, 'bad');
        this.queue.push({ type: 'mateDeath', id: n.id, name: n.name, cause: cause || '' });
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 3) 부상
  GP.npcHurt = function (n) { return !!(n && n.hurtUntil && n.hurtUntil > absDay(this)); };
  GP.npcHurtDays = function (n) { return n && n.hurtUntil ? Math.max(0, n.hurtUntil - absDay(this)) : 0; };
  GP.hurtNpc = function (n, days) { if (!n) return; n.hurtUntil = Math.max(n.hurtUntil || 0, absDay(this) + (days || rint(PARTY_LIFE.hurtMin, PARTY_LIFE.hurtMax))); };
  const baseUnit = GP.npcUnit;
  GP.npcUnit = function (n, side, ...a) {
    const u = baseUnit.call(this, n, side, ...a);
    try {
      if (u && n && this.npcHurt(n)) {
        u.atk = Math.round(u.atk * PARTY_LIFE.hurtAtk); u.def = Math.round(u.def * PARTY_LIFE.hurtAtk);
        u.maxHp = Math.round(u.maxHp * PARTY_LIFE.hurtHp); u.hp = Math.min(u.hp, u.maxHp); u.hurt = true;
      }
    } catch (e) { /* 무시 */ }
    return u;
  };

  // 4) 영입하는 순간 함께 움직이는 상태로
  const baseRec = GP.recruit;
  GP.recruit = function (id, ...a) {
    const r = baseRec.call(this, id, ...a);
    try { const p = this.player; const n = this.npcById(id); if (n && n.isCompanion && !p.crew && (!p.lead || p.lead.state === 'free' && this.party().length === 1)) p.lead = { state: 'on', base: p.region }; } catch (e) { /* 무시 */ }
    return r;
  };

  // 7)·8) 게이트·토벌 뒤: 동료 성장·관계·부상
  const baseFinish = GP.finishGate;
  if (baseFinish) GP.finishGate = function (gate, result, ...a) {
    const mates = this.withCrew ? this.withCrew(() => this.party()) : this.party();
    const r = baseFinish.call(this, gate, result, ...a);
    try {
      const tier = gate ? (gate.realTier ?? gate.tier ?? 0) : 0;
      for (const n of mates) {
        if (!n || !n.alive) continue;
        if (result === 'clear') { n.progress = (n.progress || 0) + PARTY_LIFE.gateProg * (1 + tier * 0.5) / (1 + n.rankIdx * 0.5); this.changeRel(n, PARTY_LIFE.relClear, '함께 게이트를 공략했다'); }
        if (result === 'lose' || result === 'retreat') { this.hurtNpc(n); if (result === 'lose') this.changeRel(n, PARTY_LIFE.relLose, '함께 게이트에서 졌다'); }
      }
      if (result === 'lose' || result === 'retreat') { const hurt = mates.filter((n) => n && n.alive); if (hurt.length && Array.isArray(r)) r.push(`동료 ${hurt.map((n) => n.name).join(', ')}이(가) 다쳤다. 낫는 동안(7~14일) 전투력이 줄어든다.`); }
      if (result === 'clear' && !this.player.crew && mine(this).length >= 2) this.queue.push({ type: 'mateEvent' });
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseMob = GP.finishMob;
  if (baseMob) GP.finishMob = function (mob, result, ...a) {
    const mates = this.withCrew ? this.withCrew(() => this.party()) : this.party();
    const r = baseMob.call(this, mob, result, ...a);
    try { if (result === 'win') for (const n of mates) if (n && n.alive) { n.progress = (n.progress || 0) + PARTY_LIFE.mobProg; this.changeRel(n, PARTY_LIFE.relMob); } } catch (e) { /* 무시 */ }
    return r;
  };
  // 동료가 등급을 올리면 알려 준다
  const baseMonth = GP.advanceMonth;
  GP.advanceMonth = function (...a) {
    const mates = (this.player && (this.withCrew ? this.withCrew(() => this.party()) : this.party())) || [];
    const before = new Map(mates.map((n) => [n.id, n.rankIdx]));
    const r = baseMonth.apply(this, a);
    try { for (const n of mates) if (n.alive && before.has(n.id) && n.rankIdx > before.get(n.id)) { this.log(`동료 ${n.name}이(가) ${RANKS[n.rankIdx].name}이(가) 되었다.`, 'good'); this.queue.push({ type: 'toast', text: `동료 ${n.name}이(가) ${RANKS[n.rankIdx].key}급이 되었다! 함께 싸운 경험이 쌓였다.` }); } } catch (e) { /* 무시 */ }
    return r;
  };

  // 5) 길드 처음 가입 때 소속 파티
  const baseJoin = GP.affJoin;
  if (baseJoin) GP.affJoin = function (id, ...a) {
    const p = this.player;
    if (p && p.crew && !p.guild && this.crewLeave) {
      const name = p.crew.name; this.crewLeave('join');
      this.lifeEvent(`길드에 들어가며 ${name}을(를) 정리했다.`);
      this.queue.push({ type: 'toast', text: `길드 소속이 되면서 ${name}을(를) 나왔다. (관계 불이익 없음 · 길드 전리품은 길드에 귀속된다)` });
    }
    return baseJoin.call(this, id, ...a);
  };

  // 6) 지도 위 다른 파티와 거래
  if (!GP.partyMeetResult) GP.partyMeetResult = function (pt, action) {
    if (action !== 'trade' || !pt || !pt.leader) return null;
    const L = pt.leader; const p = this.player; const mul = this.priceMul ? this.priceMul() : 1;
    const pr = L.personality; const rel = L.relation || 0;
    const disc = pr === 'kind' ? 0.75 : pr === 'greedy' ? 1.35 : 1;
    const relMul = Math.max(0.7, 1 - Math.max(0, rel) / 300);
    const offers = [
      { id: 'potion', n: 2, base: 180, name: '응급 회복제 두 병' },
      { id: 'mana', n: 2, base: 200, name: '마나 앰플 두 병' },
      { id: 'potion', n: 4, base: 340, name: '응급 회복제 네 병' },
    ];
    const o = pr === 'cold' ? offers[0] : pr === 'greedy' ? offers[2] : offers[Math.floor(Math.random() * 2)];
    const cost = Math.round(o.base * mul * disc * relMul / 10) * 10;
    if (p.money < cost) return { handled: true, text: `${L.name}이(가) ${o.name}에 ${fmt(cost)} 크레딧을 부른다. 돈이 모자란다.` };
    p.money -= cost; p.items[o.id] = (p.items[o.id] || 0) + o.n; L.met = true; this.changeRel(L, 1, '길에서 물자를 나눴다');
    const said = pr === 'kind' ? '"싸게 줄게요. 몸조심해요."' : pr === 'greedy' ? '"길 위에선 이 값이지. 싫으면 말고."' : pr === 'cold' ? '"…이것뿐이다."' : '"필요하면 가져가."';
    return { handled: true, text: fixJosa(`${L.name}: ${said} ${o.name}을(를) ${fmt(cost)} 크레딧에 샀다.`) };
  };

  if (typeof UI === 'undefined') { /* 화면 없음 */ } else {
    const col = (n) => { try { return typeof voiceCol === 'function' ? voiceCol(n) : 'just'; } catch (e) { return 'just'; } };
    // 2) 애도 장면, 9) 내 파티 팀 사건
    const baseQ = UI.processQueue;
    UI.processQueue = function (...a) {
      if (this.modalOpen && this.modalOpen()) return;
      const q = G.queue && G.queue[0];
      if (q && q.type === 'mateDeath' && !this.ctx && !this.dlg) {
        G.queue.shift();
        const left = G.party();
        return this.talk([{ narr: `${q.name}의 장례. 함께 게이트를 오가던 날들이 짧게 스쳐 간다.` }, left[0] ? { who: left[0], text: `…${q.name}, 먼저 가서 기다려.` } : null, { sys: `동료 ${q.name}을(를) 잃었다${q.cause ? ` · ${q.cause}` : ''}` }].filter(Boolean), () => this.processQueue());
      }
      if (q && q.type === 'mateEvent' && !this.ctx && !this.dlg) {
        G.queue.shift();
        if (Math.random() < PARTY_LIFE.evChance && this.mateEvent()) return;
        return this.processQueue();
      }
      return baseQ.apply(this, a);
    };
    UI.mateEvent = function () {
      const ms = mine(G).filter((n) => n.alive); if (ms.length < 2) return false;
      const sour = ms.slice().sort((a, b) => (a.relation || 0) - (b.relation || 0))[0];
      const kind = (sour.relation || 0) < 25 ? 'leave' : Math.random() < 0.5 ? 'quarrel' : 'ask';
      this._mateEv = { kind };
      if (kind === 'leave') {
        this._mateEv.n = sour.id; const keep = Math.round(Math.max(0.1, Math.min(0.9, 0.15 + (sour.relation || 0) / 60)) * 100);
        this.modal(fixJosa(`<div class="eyebrow">파티 · 동료의 불만</div><h3>${sour.name}이(가) 할 말이 있다고 한다</h3>
          <p class="event-text">"솔직히 말할게. 요즘 너랑 다니는 게 별로야. 몫도, 방향도. …여기서 갈라서는 게 서로 좋을 것 같아."</p>
          <div class="cards"><button class="choice-btn" data-act="mate-ev" data-v="keep">붙잡는다 <span class="dim-in">받아들일 확률 약 ${keep}%</span></button>
          <button class="choice-btn" data-act="mate-ev" data-v="go">보내 준다</button></div>`), 'event-box fit-box');
        return true;
      }
      if (kind === 'quarrel') {
        const [a, b] = ms.sort(() => Math.random() - 0.5); this._mateEv.a = a.id; this._mateEv.b = b.id;
        this.modal(fixJosa(`<div class="eyebrow">파티 · 동료 사이</div><h3>야영지의 말다툼</h3>
          <p class="event-text">${a.name}와(과) ${b.name}이(가) 전리품 나눈 일로 다툰다. "네가 한 게 뭐가 있다고 그만큼 가져가?" 둘 다 나를 쳐다본다. 리더는 나다.</p>
          <div class="cards"><button class="choice-btn" data-act="mate-ev" data-v="a">${a.name} 편을 든다 <span class="dim-in">${a.name} +4 · ${b.name} −4</span></button>
          <button class="choice-btn" data-act="mate-ev" data-v="b">${b.name} 편을 든다 <span class="dim-in">${b.name} +4 · ${a.name} −4</span></button>
          <button class="choice-btn" data-act="mate-ev" data-v="calm">내 몫에서 조금 떼어 둘 다 달랜다 <span class="dim-in">크레딧 −${fmt(100)} · 둘 다 +2</span></button></div>`), 'event-box fit-box');
        return true;
      }
      const n = ms[Math.floor(Math.random() * ms.length)]; this._mateEv.n = n.id;
      const cost = Math.round(150 * RANKS[Math.max(0, n.rankIdx)].mult / 10) * 10;
      const ask = { kind: '고향에 계신 어머니가 편찮으셔서… 며칠만 다녀와도 될까?', just: '무기 날이 다 나갔어. 정비 비용 좀 보태 줄 수 있어?', cold: '…장비 교체가 필요하다. 팀 경비로.', warlike: '다음엔 내가 선봉 서게 해 줘. 그리고 장비 좀 바꾸자.', greedy: '이번 몫 조금만 더 줄 수 있어? 갚을 데가 있어서.' }[n.personality] || '장비 정비 비용 좀 보태 줄 수 있어?';
      this.modal(fixJosa(`<div class="eyebrow">파티 · 동료의 부탁</div><h3>${n.name}의 부탁</h3><p class="event-text">"${ask}"</p>
        <div class="cards"><button class="choice-btn" data-act="mate-ev" data-v="yes">들어준다 <span class="dim-in">크레딧 −${fmt(cost)} · 관계 +5</span></button>
        <button class="choice-btn" data-act="mate-ev" data-v="no">미안하지만 거절한다 <span class="dim-in">관계 −3</span></button></div>`), 'event-box fit-box');
      this._mateEv.cost = cost;
      return true;
    };
    // 10) 영입 조건
    const condOf = (n) => {
      const gap = Math.max(0, n.rankIdx - G.player.rankIdx);
      const fee = n.personality === 'greedy' ? Math.round(250 * RANKS[n.rankIdx].mult * (1 + gap * 0.5) / 10) * 10 : 0;
      const T = {
        kind: '같이 다니면 좋죠! 대신 위험할 땐 서로 챙기기로 해요.',
        just: '좋다. 대신 약한 사람을 버리는 일은 없기로 하자.',
        cold: '몫만 공정하면 된다.',
        warlike: '좋아. 대신 센 놈 나오면 내가 먼저 붙는다.',
        greedy: `좋아요. 대신 계약금 ${fmt(fee)} 크레딧. 실력값이에요.`,
      };
      return { fee, text: T[n.personality] || T.kind };
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'npc-recruit') {
        const n = G.npcById(+v); if (!n || !G.canRecruit(n)) return baseH.call(this, act, v);
        const c = condOf(n); this._recruitCond = { id: n.id, fee: c.fee };
        return this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(n, 96)}<div><div class="eyebrow">파티 초대</div><b>${n.name}</b> <span class="small dim">${className(n.cls)} · ${RANKS[n.rankIdx].key}급</span>
          <p class="event-text">"${c.text}"</p></div></div>
          <div class="cards"><button class="choice-btn primary" data-act="recruit-ok" ${c.fee > G.player.money ? 'disabled' : ''}>조건을 받아들인다${c.fee ? ` <span class="dim-in">크레딧 −${fmt(c.fee)}</span>` : ''}</button>
          <button class="choice-btn" data-act="modal-close">다음에 하자</button></div>`), 'event-box fit-box');
      }
      if (act === 'recruit-ok') {
        const rc = this._recruitCond; this._recruitCond = null; this.closeModal(); if (!rc) return;
        const before = G.party().length; const msg = G.recruit(rc.id);
        if (G.party().length > before && rc.fee) G.player.money -= rc.fee;
        return this.after(msg);
      }
      if (act === 'mate-ev') {
        const e = this._mateEv; this._mateEv = null; this.closeModal(); if (!e) return this.after();
        if (e.kind === 'leave') {
          const n = G.npcById(e.n); if (!n) return this.after();
          const keep = Math.max(0.1, Math.min(0.9, 0.15 + (n.relation || 0) / 60));
          if (v === 'keep' && Math.random() < keep) { G.changeRel(n, 6, '떠나려는 걸 붙잡아 줬다'); return this.after(`${n.name}: "…알았어. 한 번만 더 믿어 볼게."`); }
          const t = G.dismiss(n.id); G.lifeEvent(`${n.name}이(가) 불만 끝에 파티를 떠났다.`);
          return this.after(`${n.name}: "${v === 'keep' ? '미안. 이미 정했어.' : '…고마워. 잘 지내.'}" ${t}`);
        }
        if (e.kind === 'quarrel') {
          const a = G.npcById(e.a), b = G.npcById(e.b);
          if (v === 'a') { G.changeRel(a, 4); G.changeRel(b, -4, '다툼에서 상대 편을 들었다'); return this.after(`${a.name}이(가) 고개를 끄덕인다. ${b.name}은(는) 등을 돌렸다.`); }
          if (v === 'b') { G.changeRel(b, 4); G.changeRel(a, -4, '다툼에서 상대 편을 들었다'); return this.after(`${b.name}이(가) 고개를 끄덕인다. ${a.name}은(는) 등을 돌렸다.`); }
          if (G.player.money >= 100) { G.player.money -= 100; G.changeRel(a, 2); G.changeRel(b, 2); return this.after('내 몫에서 조금씩 떼어 줬다. 둘 다 머쓱하게 웃었다.'); }
          return this.after('떼어 줄 돈이 없었다. 둘은 씩씩대며 각자 자리로 돌아갔다.');
        }
        const n = G.npcById(e.n); if (!n) return this.after();
        if (v === 'yes' && G.player.money >= e.cost) { G.player.money -= e.cost; G.changeRel(n, 5, '부탁을 들어줬다'); return this.after(`${n.name}: "고마워. 이건 안 잊을게."`); }
        G.changeRel(n, -3, '부탁을 거절했다'); return this.after(`${n.name}: "…그래, 알았어."`);
      }
      return baseH.call(this, act, v);
    };
    // 파티 화면: 다친 동료 표시
    const basePH = UI.partyHtml;
    if (basePH) UI.partyHtml = function (...a) {
      let h = basePH.apply(this, a);
      try {
        const hurt = (G.withCrew ? G.withCrew(() => G.party()) : G.party()).filter((n) => G.npcHurt(n));
        if (hurt.length) h = h.replace('</h3>', `</h3><p class="small bad">부상 중: ${hurt.map((n) => `${n.name}(${G.npcHurtDays(n)}일)`).join(', ')} · 공격·방어 −20%, 체력 −15%</p>`);
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
}
