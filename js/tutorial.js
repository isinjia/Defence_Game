// ===== 게이트 크로니클: 헌터 자격 시험 (튜토리얼) =====
// 프롤로그(또는 직접 생성)가 끝난 뒤, 협회 실기 시험에서 임시 파티로 첫 전투를 치르며 조작을 배운다.

const EXAM_ROLE_POOL = {
  tank: ['guardian', 'paladin'],
  heal: ['healer', 'priest', 'shaman'],
  melee: ['swordsman', 'lancer', 'monk', 'berserker'],
  ranged: ['archer', 'gunslinger', 'sniper'],
  caster: ['elementalist', 'telekinetic', 'taoist'],
  shadow: ['assassin', 'thief'],
};

Object.assign(UI, {
  // 플레이어 역할에 맞춰 빈 자리를 채우는 임시 파티 3명
  examRoles() {
    const role = (classById(G.player.cls) || {}).role;
    if (role === 'tank') return ['heal', 'melee', 'caster'];
    if (role === 'support') return ['tank', 'melee', 'caster'];
    if (role === 'caster' || role === 'esper' || role === 'summoner') return ['tank', 'heal', 'melee'];
    if (role === 'ranged') return ['tank', 'heal', 'shadow'];
    return ['tank', 'heal', 'ranged'];
  },
  makeExamParty() {
    const p = G.player; const used = new Set([p.cls]);
    const pers = ['kind', 'just', 'warlike', 'cold'].sort(() => RNG.next() - 0.5);
    return this.examRoles().map((role, i) => {
      const n = G.makeNpc(true, RNG.chance(0.75) ? 'human' : undefined);
      const pool = EXAM_ROLE_POOL[role].filter((id) => !used.has(id) && classById(id));
      n.cls = RNG.pick(pool.length ? pool : EXAM_ROLE_POOL[role]); used.add(n.cls);
      n.rankIdx = 0; n.stage = RNG.int(0, 1); n.region = p.region; n.met = true; n.relation = 30;
      n.ageMonths = p.ageMonths + RNG.int(-24, 30); n.guild = null; n.examMate = true;
      n.personality = pers[i % pers.length];
      G.npcs.push(n);
      return n.id;
    });
  },

  startExam() {
    const p = G.player;
    const ids = this.makeExamParty();
    this.exam = { ids };
    const mates = ids.map((id) => G.npcById(id));
    this.screen = 'game'; this.render();
    this.modal(`<div class="eyebrow">${G.dateStr()} · ${G.region().name} · 헌터 협회 시험장</div><h3>헌터 자격 시험</h3>
      <p class="event-text">각성자 등록을 마친 ${p.name}에게 협회가 실기 시험 통지서를 보냈다. 시험장 로비에는 오늘 처음 각성한 사람들이 긴장한 얼굴로 앉아 있다.</p>
      <p class="event-text">시험관: "실기는 임시 파티 단위로 본다. 훈련용 게이트 안의 괴수를 정리하면 합격이다. 서로 처음 보는 사이겠지만, 안에서는 등을 맡겨야 한다."</p>
      <div class="sec-title sec">배정된 임시 파티</div>
      <div class="cards">${mates.map((n) => `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${this.raceTag(n)}
        <div><span class="tag cls tiny" style="--c:${CLASS_GROUPS[classById(n.cls).g].color}">${className(n.cls)}</span> <span class="small dim">${persById(n.personality).name}한 성격</span></div></div></div>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="exam-skip">튜토리얼 건너뛰기</button><button class="primary" data-act="exam-go">시험장으로</button></div>`, 'event-box');
  },

  examEnemies() {
    const list = [G.makeMonster(0, true), G.makeMonster(0, false), G.makeMonster(0, false)];
    list[0].name = '[시험용] ' + list[0].name.replace(/^\[[^\]]*\] /, '');
    for (const e of list) { e.maxHp = e.hp = Math.round(e.hp * 1.5); }
    return list;
  },
  startExamFight() {
    const ex = this.exam; if (!ex) return;
    const allies = [G.playerUnit(), ...ex.ids.map((id) => G.npcUnit(G.npcById(id), 'ally'))];
    this.ctx = { kind: 'exam', tutorial: { acted: 0 }, elem: G.player.element, combat: new Combat(G, { allies, enemies: this.examEnemies(), canFlee: false, spar: true, title: '헌터 자격 시험 · 실기' }) };
    this.openCombat();
  },

  // 전투 화면 위에 띄우는 조작 안내
  coachHtml() {
    const c = this.ctx; if (!c || !c.tutorial || c.combat.result) return '';
    const cb = c.combat; const t = c.tutorial;
    let step, text;
    if (t.acted >= 3) return '';
    if (t.acted >= 1) {
      step = '조작 안내 3/3';
      text = '잘했습니다! <b>회복약</b>으로 체력을 채울 수 있고, <b>배속</b> 버튼으로 전투 속도를, <b>자동 전투</b>로 내 행동까지 AI에게 맡길 수 있습니다. 이제 자유롭게 싸워 보세요.';
    } else if (!cb.waiting) {
      step = '조작 안내 1/3';
      text = '각 캐릭터 아래의 <b>파란 게이지</b>가 속도에 따라 찹니다. 가득 차면 그 캐릭터가 행동합니다. 동료는 각자의 <b>성격대로 AI</b>가 싸웁니다. 내 게이지가 차기를 기다리세요.';
    } else if (!t.targeted) {
      step = '조작 안내 2/3';
      text = '<b>내 차례!</b> 시간이 멈췄습니다. 먼저 위쪽의 <b>적을 눌러</b> 공격할 대상을 고르세요.';
    } else {
      step = '조작 안내 2/3';
      text = '대상이 정해졌습니다. 아래 <b>스킬 버튼</b>을 눌러 행동하세요. 스킬마다 MP가 듭니다.';
    }
    return `<div class="coach"><span class="eyebrow">${step}</span><div>${text}</div></div>`;
  },

  finishExam() {
    const c = this.ctx; const cb = c.combat; const ex = this.exam;
    this.ctx = null; this.closeModal();
    const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    const win = cb.result === 'win';
    for (const n of mates) G.changeRel(n, win ? 22 : 12);
    G.player.hp = G.player.maxHp; G.player.mp = G.player.maxMp;
    G.lifeEvent(win ? '헌터 자격 시험에 합격해 F급 헌터 자격증을 받았다.' : '시험관의 개입으로 간신히 헌터 자격 시험을 통과했다.');
    ex.pick = new Set(ex.ids);
    ex.text = win
      ? '마지막 괴수가 쓰러지자 훈련용 게이트가 닫혔다. 시험관이 기록판에 무언가 적고는 고개를 끄덕였다. "전원 합격. 오늘부터 너희는 헌터다."'
      : '파티가 밀리자 시험관이 끼어들어 괴수를 베어 냈다. "…그래도 끝까지 버텼군. 합격은 합격이다. 대신 밖에서는 아무도 끼어들어 주지 않는다."';
    this.renderExamEnd();
  },
  renderExamEnd() {
    const ex = this.exam; const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    this.modal(`<div class="eyebrow">헌터 자격 시험 · 결과</div><h3>F급 헌터 자격증 발급</h3>
      <p class="event-text">${fixJosa(ex.text)}</p>
      <p class="event-text">시험장을 나서자 임시 파티원들이 당신을 바라본다. "…우리, 이대로 같이 다녀 볼래?"</p>
      <div class="sec-title sec">함께할 동료를 고르세요 <span class="small dim">(눌러서 선택·해제)</span></div>
      <div class="cards">${mates.map((n) => `<button class="item-row choice-btn ${ex.pick.has(n.id) ? 'on' : ''}" data-act="exam-pick" data-v="${n.id}">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b>
        <div><span class="tag cls tiny" style="--c:${CLASS_GROUPS[classById(n.cls).g].color}">${className(n.cls)}</span> <span class="small dim">${persById(n.personality).name}</span></div></div><b class="${ex.pick.has(n.id) ? 'amber' : 'dim'}">${ex.pick.has(n.id) ? '함께' : '각자'}</b></button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="exam-solo">혼자 시작한다</button><button class="primary" data-act="exam-party" ${ex.pick.size ? '' : 'disabled'}>${ex.pick.size === mates.length ? '이 파티로 시작한다' : `${ex.pick.size}명과 시작한다`}</button></div>`, 'event-box');
  },
  endExam(ids) {
    const p = G.player; const ex = this.exam || { ids: [] };
    const joined = [];
    for (const id of ex.ids) {
      const n = G.npcById(id); if (!n) continue;
      if (ids.includes(id) && G.party().length < 4) { n.isCompanion = true; (p.party ||= []).push(n.id); n.region = p.region; n.relation = Math.max(n.relation, 55); joined.push(n.name); }
    }
    this.exam = null;
    if (joined.length) G.lifeEvent(`시험 동기 ${joined.join(', ')}와(과) 파티를 결성했다.`);
    G.save();
    this.closeModal(); this.renderGame();
    const friend = G.npcs.find((n) => n.friendhood && n.alive);
    this.modal(`<div class="ending">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()} · ${G.region().name}</div><h2>헌터 ${p.name}</h2></div>
      <p>${className(p.cls)} · ${ELEMENTS[p.element].name} 속성 · F급. ${joined.length ? `${joined.join(', ')}와(과) 함께 첫발을 내딛는다.` : '당분간은 혼자다. 시험 동기들은 인물 창에서 다시 만날 수 있다.'}</p>
      <p class="dim">지도에서 빛나는 칸을 눌러 걸어 다니고, 도시에 들어가 의뢰를 받으며 살아가십시오. 정해진 길은 없습니다.${friend ? ` 소꿉친구 ${friend.name}은(는) ${(REGIONS.find((r) => r.id === friend.region) || G.region()).name}에 있습니다.` : ''}</p>
      <div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`);
  },
});

{
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    baseControls.call(this);
    const c = this.ctx; if (!c || !c.tutorial) return;
    const box = document.getElementById('cb-ctrl'); if (!box) return;
    const html = this.coachHtml();
    if (html) box.insertAdjacentHTML('afterbegin', fixJosa(html));
    const cb = c.combat; const t = c.tutorial;
    const foes = document.getElementById('foes'); if (foes) foes.classList.toggle('tut-glow', cb.waiting && !c.playing && !t.targeted && t.acted < 1);
    const sk = box.querySelector('.skill-btns'); if (sk) sk.classList.toggle('tut-glow', cb.waiting && !c.playing && !!t.targeted && t.acted < 1);
  };
  const baseFinish = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function () {
    if (this.ctx && this.ctx.kind === 'exam') return this.finishExam();
    return baseFinish.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      // 생성이 끝나면 곧바로 헌터 시험으로
      case 'c-start': case 'pro-begin': {
        const r = baseHandle.call(this, act, v);
        if (this.screen === 'game' && G.player && !G.player.examDone) { G.player.examDone = true; this.closeModal(); this.startExam(); }
        return r;
      }
      case 'exam-go': this.closeModal(); return this.startExamFight();
      case 'exam-skip': this.exam.pick = new Set(this.exam.ids); this.exam.text = '실기 시험은 무난히 끝났다. 시험관이 기록판에 합격 도장을 찍었다.'; G.lifeEvent('헌터 자격 시험에 합격해 F급 헌터 자격증을 받았다.'); return this.renderExamEnd();
      case 'exam-pick': { const ex = this.exam; const id = +v; if (ex.pick.has(id)) ex.pick.delete(id); else ex.pick.add(id); return this.renderExamEnd(); }
      case 'exam-party': return this.endExam([...this.exam.pick]);
      case 'exam-solo': return this.endExam([]);
      case 'c-target': {
        const r = baseHandle.call(this, act, v);
        if (c && c.tutorial && !c.tutorial.targeted) { c.tutorial.targeted = true; this.renderControls(); }
        return r;
      }
      case 'c-skill': case 'c-item':
        if (c && c.tutorial && !c.playing && c.combat.waiting) c.tutorial.acted++;
        return baseHandle.call(this, act, v);
      default: return baseHandle.call(this, act, v);
    }
  };
}
