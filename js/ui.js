// ===== 게이트 크로니클: 화면 =====

const G = new Game();
const $app = document.getElementById('app');
const $modal = document.getElementById('modal');
const $box = document.getElementById('modal-box');
const $toast = document.getElementById('toast');

const TYPE_NAME = { dmg: '단일', aoe: '전체', heal: '회복', buff: '강화', shield: '방어', crit: '치명', pierce: '관통', multi: '연타', dot: '중독', stun: '기절', drain: '흡혈', debuff: '약화', taunt: '도발', shield_all: '파티 방어', buff_all: '파티 강화', heal_ally: '아군 치유', heal_all: '전체 치유', revive: '부활', summon: '소환', evade: '회피' };

// 스킬 대상 방식: 적 하나를 고름 / 아군 하나를 고름 / 대상 없이 바로 사용
const SKILL_AIM = { dmg: 'enemy', crit: 'enemy', pierce: 'enemy', dot: 'enemy', stun: 'enemy', drain: 'enemy', heal_ally: 'ally' };
const SKILL_EFFECT = {
  dmg: '적 하나에게 피해', crit: '적 하나에게 피해, 치명타 확률이 높다', pierce: '적 하나에게 방어를 무시하는 피해', multi: '무작위 적에게 3번 연속 공격',
  dot: '적 하나에게 피해를 주고 3턴간 중독', stun: '적 하나에게 피해를 주고 확률로 기절', drain: '적 하나에게 피해, 준 피해의 절반을 회복', aoe: '적 전체에게 피해',
  debuff: '적 전체의 방어를 3턴간 낮춘다', taunt: '2턴간 적의 공격을 끌어들이고 방어 상승', shield_all: '파티 전체 방어 3턴 상승', buff_all: '파티 전체 공격 3턴 상승',
  heal_ally: '아군 하나의 체력 회복', heal_all: '파티 전체 체력 회복', heal: '자신의 체력 회복', revive: '쓰러진 동료 하나를 일으킨다', summon: '소환수를 불러낸다 (최대 2)',
  evade: '2턴간 공격을 높은 확률로 피한다', buff: '자신의 공격 3턴 상승', shield: '자신의 방어 3턴 크게 상승',
};
const UI = {
  screen: 'title',
  create: null,
  ctx: null, // 전투 문맥
  stopTitle: null,

  // ---------- 공통 ----------
  toast(msg) {
    if (!msg) return;
    $toast.textContent = fixJosa(msg);
    $toast.classList.remove('hidden');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => $toast.classList.add('hidden'), 2600);
  },
  modal(html, cls = '') {
    if (!cls.includes('sheet')) this.sheet = null;
    $box.className = 'modal-box ' + cls;
    $box.innerHTML = fixJosa(html);
    $modal.classList.remove('hidden');
  },
  closeModal() { this.sheet = null; $modal.classList.add('hidden'); $box.innerHTML = ''; },
  modalOpen() { return !$modal.classList.contains('hidden'); },
  bar(cls, v, max) { const w = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0; return `<div class="bar ${cls}"><i style="width:${w}%"></i></div>`; },
  elemTag(e) { if (!e) return '<span class="tag">무속성</span>'; const E = ELEMENTS[e]; return `<span class="tag el" style="--c:${E.color}">${FX.elemIcon(e, 12)} ${E.name}</span>`; },
  clsTag(cls, adv = 0) { const c = classById(cls); const g = CLASS_GROUPS[c.g]; return `<span class="tag cls" style="--c:${g.color}">${className(cls, adv)}</span>`; },
  rankTag(r, s) { const R = RANKS[r]; return `<span class="tag rank" style="--c:${R.color}">${s == null ? R.key + '급' : rankLabel(r, s)}</span>`; },
  rift(tier) { return `<span class="rift" style="--c:${RANKS[tier].color}" aria-hidden="true"><i></i></span>`; },
  slotIcon(slot, color) {
    const P = {
      weapon: '<path d="M5 19 17 7l2-4 2 2-4 2L5 19zM4 16l4 4M3 21l2-2" />',
      armor: '<path d="M7 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-3-3-5 2z"/><path d="M12 5v15"/>',
      acc: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="10" y="10" width="4" height="4"/>',
    };
    return `<span class="slot-ico" style="--c:${color}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[slot]}</svg></span>`;
  },
  npcLook(n) { return { age: Math.floor(n.ageMonths / 12), race: n.race || 'human' }; },
  npcAvatar(n, size) { return FX.avatar('npc' + n.id + n.name, n.gender, n.element, n.rankIdx, size, this.npcLook(n)); },
  npcPortrait(n, w) { return FX.portrait('npc' + n.id + n.name, n.gender, n.element, n.rankIdx, w, this.npcLook(n)); },
  playerAvatar(size) { const p = G.player; return FX.avatar(p.look, p.gender, p.element, p.rankIdx, size, { age: G.ageYears(), race: p.race || 'human' }); },
  playerPortrait(w) { const p = G.player; return FX.portrait(p.look, p.gender, p.element, p.rankIdx, w, { age: G.ageYears(), race: p.race || 'human' }); },
  raceTag(n) { const r = n.race || 'human'; return r === 'human' ? '' : `<span class="tag race">${RACES[r].name}</span>`; },

  render() {
    if (this.screen !== 'title' && this.stopTitle) { this.stopTitle(); this.stopTitle = null; }
    if (this.screen !== 'game' && this.map) { this.map.destroy(); this.map = null; }
    if (this.screen === 'title') return this.renderTitle();
    if (this.screen === 'create') return this.renderCreate();
    if (this.screen === 'mode') return this.renderMode ? this.renderMode() : this.startCreate();
    if (this.screen === 'story-setup') return this.renderStorySetup();
    if (this.screen === 'prologue') return this.renderPrologue();
    if (this.screen === 'pro-result') return this.renderProResult();
    this.renderGame();
  },

  // ---------- 타이틀 ----------
  renderTitle() {
    if (this.stopTitle) { this.stopTitle(); this.stopTitle = null; }
    $app.innerHTML = `
      <div class="title-screen">
        <canvas id="title-cv" aria-hidden="true"></canvas>
        <div class="title-inner">
          <div class="logo-en">GATE CHRONICLE</div>
          <h1 class="logo">게이트 크로니클</h1>
          <div class="logo-sub">각성 연대기</div>
          <div class="title-ver">v${GAME_VERSION}</div>
          <p class="sub">2087년, 대붕괴로부터 20년.<br>한반도 곳곳에 열린 게이트, 그리고 각성자들.<br>한정된 수명 안에서 얼마나 높이 오를 수 있는가.</p>
          <div class="btns">
            <button class="primary big" data-act="new">새로운 각성</button>
            ${Game.hasSave() ? '<button class="big" data-act="continue">이어하기</button>' : ''}
            <button class="ghost" data-act="help">게임 안내</button>
          </div>
        </div>
      </div>`;
    this.stopTitle = FX.title(document.getElementById('title-cv'));
  },

  helpHtml() {
    return `<h3>게임 안내</h3>
      <p>귀곡팔황식 자유 성장 헌터 RPG입니다. 모든 행동은 시간을 소모하고, 세계는 당신과 무관하게 흘러갑니다.</p>
      <ul class="help">
        <li><b>각성 등급</b>: F → E → D → C → B → A → S → SS. 각 등급은 초기·중기·후기로 나뉩니다.</li>
        <li><b>에테르</b>: 수련·게이트·가르침으로 쌓고, 후기를 채우면 <b>돌파</b>를 시도합니다. 실패하면 내상을 입습니다.</li>
        <li><b>수명</b>: 에테르 오염으로 평균 수명은 60세. 등급이 오를수록 수명이 늘어나며, 수명이 다하면 게임이 끝납니다.</li>
        <li><b>속성 상성</b>: 염 → 빙 → 뇌 → 강 → 영 → 염. 상성이면 피해 1.5배, 역상성이면 0.7배입니다.</li>
        <li><b>인물</b>: 다른 각성자들도 수련하고, 돌파하고, 늙고, 죽습니다. 친해지면 가르침을 받거나 동료로 삼을 수 있습니다.</li>
        <li><b>대련</b>은 체력 소모 없이 겨루는 친선전이고, <b>생사결</b>은 지면 죽습니다.</li>
        <li><b>길드</b>: 명성이 쌓이면 지역 길드에 가입해 월급과 임무를 받을 수 있습니다.</li>
        <li><b>최종 목표</b>: S급이 되어 제주 격리 섬의 <b>원초의 게이트</b>를 닫으십시오.</li>
      </ul>
      <div class="row end"><button data-act="modal-close">닫기</button></div>`;
  },

  // ---------- 캐릭터 생성 ----------
  rollCreate() {
    const c = this.create;
    const pool = TRAITS.slice();
    const clash = { genius: 'slow_learner', slow_learner: 'genius', lucky: 'cursed', cursed: 'lucky', charisma: 'loner', loner: 'charisma' };
    c.traits = [];
    while (c.traits.length < 3) {
      const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (clash[t.id] && c.traits.includes(clash[t.id])) continue;
      c.traits.push(t.id);
    }
    c.talent = RNG.int(2, 8);
    c.rolls--;
    const seen = new Set(); c.classes = [];
    while (c.classes.length < 3) { const id = rollClass(); if (!seen.has(id)) { seen.add(id); c.classes.push(id); } }
    c.cls = c.classes[0];
  },
  startCreate() {
    this.create = { name: this.lastName(), gender: 'M', bg: 'student', element: 'fire', rolls: 6, look: Math.random().toString(36).slice(2) };
    this.rollCreate();
    this.screen = 'create';
    this.render();
  },
  renderCreate() {
    const c = this.create;
    const negIds = ['cursed', 'frail', 'slow_learner', 'reckless'];
    $app.innerHTML = `
    <div class="create">
      <div class="create-head">
        <div class="eyebrow">국가 각성자 관리국 · 신규 등록</div>
        <h2>각성자 등록서</h2>
      </div>
      <div class="create-grid">
        <div class="panel id-preview">
          <div class="id-card">
            <div class="id-top"><span>KAMA</span><span>각성자 등록증</span></div>
            <div class="id-body">
              <div class="id-photo">${FX.portrait(c.look, c.gender, c.element, 0, 110)}</div>
              <div class="id-info">
                <div class="id-name">${c.name || '이름 미기재'}</div>
                <div class="dim">${BACKGROUNDS.find((b) => b.id === c.bg).name}</div>
                <div>${this.elemTag(c.element)} ${this.clsTag(c.cls)}</div>
                <div class="id-rank" style="--c:${RANKS[0].color}">F</div>
              </div>
            </div>
          </div>
          <button class="ghost full" data-act="c-look">외형 바꾸기</button>
        </div>
        <div class="panel">
          <div class="row">
            <div class="grow"><label class="sec-title" for="in-name">이름</label><div class="name-row"><input id="in-name" type="text" maxlength="8" placeholder="이름을 입력" value="${c.name}"><button class="icon-btn dice" data-act="name-dice" aria-label="무작위 이름">${this.diceIcon()}</button></div></div>
            <div><div class="sec-title">성별</div>
              <div class="row">
                <button class="choice ${c.gender === 'M' ? 'sel' : ''}" data-act="c-gender" data-v="M">남성</button>
                <button class="choice ${c.gender === 'F' ? 'sel' : ''}" data-act="c-gender" data-v="F">여성</button>
              </div></div>
          </div>
          <div class="sec"><div class="sec-title">출신</div>
            <div class="choice-grid">${BACKGROUNDS.map((b) => `
              <button class="choice ${c.bg === b.id ? 'sel' : ''}" data-act="c-bg" data-v="${b.id}"><b>${b.name}</b><span class="dim">${b.desc}</span><span class="dim small">시작: ${regionById(b.region).name}</span></button>`).join('')}
            </div></div>
          <div class="sec"><div class="sec-title">에테르 속성 · 같은 속성 스킬 위력 +20%</div>
            <div class="choice-grid elems">${ELEMENT_KEYS.map((k) => { const E = ELEMENTS[k]; const sk = SKILLS.find((s) => s.elem === k && s.rankReq === 0); return `
              <button class="choice elem-choice ${c.element === k ? 'sel' : ''}" style="--c:${E.color}" data-act="c-elem" data-v="${k}">${FX.elemIcon(k, 26)}<b>${E.name}</b><span class="dim small">${sk.name}<br>${ELEMENTS[E.counter].name}에 강함</span></button>`; }).join('')}
            </div></div>
          <div class="sec"><div class="row between"><div class="sec-title">각성 판정 · 직업 후보</div><span class="small dim">다시 측정하면 직업 후보도 바뀐다</span></div>
            <div class="choice-grid cls-grid">${c.classes.map((id) => { const k = classById(id); const g = CLASS_GROUPS[k.g]; return `
              <button class="choice cls-choice ${c.cls === id ? 'sel' : ''}" style="--c:${g.color}" data-act="c-cls" data-v="${id}">
                <span class="row between"><b>${k.name}</b><span class="tag rar r${k.r}">${CLASS_RARITY[k.r]}</span></span>
                <span class="small" style="color:${g.color}">${g.name} · 전직 ${k.adv.join(' → ')}</span>
                <span class="dim small">${k.desc}</span>
                <span class="small">${k.skills.map((x) => x[0]).join(' · ')}</span></button>`; }).join('')}</div></div>
          <div class="sec"><div class="row between"><div class="sec-title">선천 자질</div><button class="ghost" data-act="c-roll" ${c.rolls <= 0 ? 'disabled' : ''}>다시 측정 · ${c.rolls}회</button></div>
            <div class="talent">재능 <div class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < c.talent ? 'on' : ''}"></i>`).join('')}</div><b class="${c.talent >= 7 ? 'good' : c.talent <= 3 ? 'bad' : ''}">${c.talent}</b></div>
            <div class="cards traits">${c.traits.map((id) => { const t = traitById(id); return `<div class="trait ${negIds.includes(id) ? 'neg' : ''}"><b>${t.name}</b><span class="dim">${t.desc}</span></div>`; }).join('')}</div>
          </div>
          <div class="row end sec">
            <button class="ghost" data-act="to-title">돌아가기</button>
            <button class="primary" data-act="c-start">각성 시작</button>
          </div>
        </div>
      </div>
    </div>`;
    const inp = document.getElementById('in-name');
    inp.addEventListener('input', () => { c.name = inp.value; const n = document.querySelector('.id-name'); if (n) n.textContent = c.name || '이름 미기재'; });
  },

  // ---------- 게임 화면 (월드맵 + HUD) ----------
  renderGame() {
    const p = G.player;
    if (!document.getElementById('world')) {
      if (this.map) this.map.destroy();
      $app.innerHTML = `
        <div class="world" id="world">
          <canvas id="map-cv" aria-label="월드맵. 빛나는 칸을 눌러 이동합니다."></canvas>
          <nav class="hud hud-tl" id="hud-tl"></nav>
          <aside class="hud hud-tr" id="hud-tr"></aside>
          <div class="hud hud-zoom">
            <button class="icon-btn" data-act="zoom-in" aria-label="확대">+</button>
            <button class="icon-btn" data-act="zoom-out" aria-label="축소">−</button>
            <button class="icon-btn" data-act="zoom-me" aria-label="내 위치">${FX.icon('pin', 16)}</button>
          </div>
          <div class="hud hud-bottom">
            <section class="hud-card" id="hud-card"></section>
            <section class="hud-actions" id="hud-actions"></section>
            <div class="hud-mini"><canvas id="mini" width="144" height="232" aria-label="미니맵"></canvas></div>
          </div>
          <div class="hud hud-tip hidden" id="hud-tip"></div>
        </div>`;
      this.map = new MapView(document.getElementById('map-cv'), document.getElementById('mini'), { onTap: (x, y) => this.onTap(x, y) });
      this.map.centerOn(p.x, p.y);
    }
    document.getElementById('hud-tl').innerHTML = this.hudMenu();
    document.getElementById('hud-tr').innerHTML = fixJosa(this.hudObjective());
    document.getElementById('hud-card').innerHTML = fixJosa(this.hudCard());
    document.getElementById('hud-actions').innerHTML = fixJosa(this.hudActions());
    this.map.setPlayerImage(PORTRAIT.imageFor(p.look, p.gender) || this.playerAvatar(128));
    this.map.refresh();
  },

  hudMenu() {
    const city = G.onCity();
    const item = (k, label, icon, dis) => `<button class="menu-btn" data-act="sheet" data-v="${k}" ${dis ? 'disabled' : ''}>${icon}<span>${label}</span></button>`;
    const ic = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    return [
      item('char', '정보', ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>')),
      item('skills', '스킬', ic('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>')),
      item('party', '파티', ic('<circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><circle cx="12" cy="6" r="3"/><path d="M2 20c.8-3 2.6-4.5 5-4.5M22 20c-.8-3-2.6-4.5-5-4.5M7 20c.8-3.5 2.6-5 5-5s4.2 1.5 5 5"/>')),
      item('people', '인물', ic('<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c1-3.5 3.5-5 7-5s6 1.5 7 5M15 15c3 0 5 1.5 6 4"/>')),
      item('guild', '길드', ic('<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/>')),
      item('quest', '의뢰', ic('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>')),
      item('hunter', '헌터', ic('<path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.3 6.2 19.8l1.6-6.6L2.6 8.8l6.8-.5z"/>')),
      item('log', '연대기', ic('<path d="M4 5c2.5-1.3 5.5-1.3 8 0v15c-2.5-1.3-5.5-1.3-8 0z"/><path d="M12 5c2.5-1.3 5.5-1.3 8 0v15c-2.5-1.3-5.5-1.3-8 0"/>')),
    ].join('');
  },

  goalText() {
    const p = G.player;
    let hint = '';
    if (p.rankIdx >= 7 && p.stage === 2) hint = '정점에 올랐다. 이제 무엇을 할지는 당신의 몫이다.';
    else if (p.stage === 2 && p.ether >= stageReq(p.rankIdx, 2)) {
      if (!G.hasCatalyst()) { let have = 0; for (let t = p.rankIdx; t < 8; t++) have += G.coreCount(t); hint = `돌파 준비: 공방에서 ${RANKS[p.rankIdx].key}급 각성 촉매 제작 (코어 ${Math.min(have, 5)}/5)`; }
      else hint = `${RANKS[p.rankIdx + 1].key}급 돌파 준비 완료`;
    } else {
      const pct = p.stage < 2 ? Math.round((p.stage / 3) * 100 + (p.ether / stageReq(p.rankIdx, p.stage)) * 33) : Math.round(66 + (p.ether / stageReq(p.rankIdx, 2)) * 34);
      hint = `${RANKS[Math.min(7, p.rankIdx + 1)].key}급까지 ${Math.min(99, pct)}%`;
    }
    return `<span class="amb">${rankLabel(p.rankIdx, p.stage)} · ${className(p.cls, p.clsAdv)}</span><div class="obj-sub">${hint}</div>`;
  },
  hudObjective() {
    const p = G.player;
    const dist = (o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y));
    const gates = G.mapGates.filter((g) => G.revealed(g.x, g.y) && (g.final || g.tier <= p.rankIdx + 1)).sort((a, b) => dist(a) - dist(b));
    const mobs = G.mobs.filter((m) => G.revealed(m.x, m.y) && m.tier <= p.rankIdx).sort((a, b) => dist(a) - dist(b));
    const last = G.logs[0];
    return `<div class="obj">
        <div class="obj-title">현재 상황</div>
        <div class="obj-goal">${this.goalText()}</div>
        ${gates[0] ? `<button class="obj-link" data-act="focus" data-v="${gates[0].x},${gates[0].y}">${this.rift(gates[0].tier)} 가까운 게이트 · ${G.gateName(gates[0])} · ${dist(gates[0])}칸</button>` : '<div class="obj-sub">탐색하면 게이트를 찾을 수 있다.</div>'}
        ${p.quests.slice(0, 2).map((q) => `<button class="obj-link" data-act="sheet" data-v="quest">${q.status === 'done' ? '✔' : '▸'} ${q.title}</button>`).join('')}
        ${mobs[0] ? `<button class="obj-link" data-act="focus" data-v="${mobs[0].x},${mobs[0].y}"><span class="mob-dot" style="--c:${ELEMENTS[mobs[0].elem].color}"></span> 토벌 대상 · ${mobs[0].name} · ${dist(mobs[0])}칸</button>` : ''}
      </div>
      ${last ? `<div class="obj news ${last.type}"><span class="dim">${last.date}</span> ${last.text}</div>` : ''}`;
  },

  hudCard() {
    const p = G.player;
    const req = stageReq(p.rankIdx, p.stage);
    const R = RANKS[p.rankIdx];
    const left = G.maxLife() - G.ageYears();
    return `<div class="card-portrait" style="--rc:${R.color}">${this.playerAvatar(78)}<span class="card-rank" style="--c:${R.color}"><b>${R.key}</b></span></div>
      <div class="card-body">
        <div class="card-name"><b>${p.name}</b> <span class="small dim">${rankLabel(p.rankIdx, p.stage)} · ${className(p.cls, p.clsAdv)}</span> ${FX.elemIcon(p.element, 13)}</div>
        <div class="card-date num">${G.fullDate()} · <span class="${left <= 5 ? 'bad' : ''}">${G.ageYears()}세 / ${G.maxLife()}</span></div>
        <div class="card-bars">
          <div class="cb"><span>체력</span>${this.bar('hp', p.hp, p.maxHp)}<span class="num">${fmt(p.hp)}/${fmt(p.maxHp)}</span></div>
          <div class="cb"><span>정신</span>${this.bar('mp', p.mp, p.maxMp)}<span class="num">${fmt(p.mp)}/${fmt(p.maxMp)}</span></div>
          <div class="cb"><span>에테르</span>${this.bar('ether', p.ether, req)}<span class="num">${fmt(p.ether)}/${fmt(req)}</span></div>
        </div>
        <div class="card-res num"><span class="amber">${FX.icon('coin', 13)} ${fmt(p.money)}</span><span>${FX.icon('star', 13)} ${fmt(p.fame)}</span>${p.injured > 0 ? `<span class="bad">부상 ${p.injured}개월</span>` : ''}</div>
        ${G.party().length ? `<button class="party-row" data-act="sheet" data-v="party">${G.party().map((n) => `<span class="pm" title="${n.name} · ${className(n.cls)}">${this.npcAvatar(n, 26)}</span>`).join('')}<span class="small dim">파티 ${G.partySize()}/5</span></button>` : ''}
      </div>`;
  },

  hudActions() {
    const p = G.player; const reg = G.region(); const city = G.onCity();
    const terrain = WORLD.T_NAME[WORLD.type(p.x, p.y)];
    const est = Math.floor(15 * RANKS[p.rankIdx].mult * reg.ether * (1 + p.talent * 0.08) * (1 + G.mod('train')) * (p.guild === 'cheongryong' ? 1.15 : 1) * (p.injured > 0 ? 0.5 : 1) * (G.onEther() ? 1.4 : 1));
    const obj = G.objAt(p.x, p.y);
    const maxed = p.rankIdx === RANKS.length - 1 && p.stage === 2;
    return `<div class="act-where"><b>${city ? city.name : reg.name}</b> <span class="dim small">${city ? '도시' : terrain} · 위험 ${'◆'.repeat(reg.danger)}${G.onEther() ? ' · 수련 효율 +40%' : ''}</span></div>
      <div class="act-btns">
        ${obj ? (obj.kind === 'gate' ? `<button class="danger" data-act="gate-info" data-v="${obj.id}">${FX.icon('gate')} 게이트 진입</button>` : `<button class="danger" data-act="mob" data-v="${obj.id}">토벌</button>`) : ''}
        ${city ? `<button class="primary" data-act="city">${FX.icon('pin')} ${city.name} 들어가기</button>` : ''}
        ${!maxed && G.canBreakthrough() ? `<button class="${G.hasCatalyst() ? 'primary' : ''} bt-btn" data-act="breakthrough">${RANKS[p.rankIdx + 1].key}급 돌파 ${G.hasCatalyst() ? `<span class="num">${G.btChance()}%</span>` : '<span class="dim-in">촉매 필요</span>'}</button>` : ''}
        <button data-act="train">${FX.icon('train')} 수련 <span class="dim-in">1개월 +${fmt(est)}</span></button>
        <button data-act="rest">${FX.icon('rest')} 휴식 <span class="dim-in">1개월</span></button>

      </div>
      <div class="act-hint small dim">빛나는 칸을 눌러 이동 · 한 칸 ${WORLD.DAYS_PER_COST}일 · 이동력 ${G.moveRange()}</div>`;
  },

  // NPC의 지도 위치 (매달 도시 근처에서 바뀜)
  npcPos(n) {
    const key = `${n.id}:${G.monthKey()}:${n.region}`;
    this._np = this._np || {};
    const c = this._np[n.id];
    if (c && c.key === key) return c.pos;
    this._near = this._near || {};
    if (!this._near[n.region]) {
      const [cx, cy] = WORLD.cityPos[n.region];
      this._near[n.region] = (WORLD.regionTiles[n.region] || []).filter((i) => { const [x, y] = WORLD.xy(i); return Math.abs(x - cx) <= 4 && Math.abs(y - cy) <= 4; });
    }
    const pool = this._near[n.region].length ? this._near[n.region] : WORLD.regionTiles[n.region];
    const pos = WORLD.xy(pool[FX.hash(key) % pool.length]);
    this._np[n.id] = { key, pos };
    return pos;
  },
  npcsAt(x, y) { return G.npcs.filter((n) => n.alive && !n.isCompanion && (([a, b]) => a === x && b === y)(this.npcPos(n))); },

  // ---------- 지도 입력 ----------
  hideTip() { const t = document.getElementById('hud-tip'); if (t) t.classList.add('hidden'); },
  showTip(x, y) {
    const tip = document.getElementById('hud-tip'); if (!tip) return;
    const p = G.player; const known = G.revealed(x, y);
    const ty = WORLD.type(x, y); const reg = WORLD.regionAt(x, y); const city = WORLD.cityAt(x, y);
    const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y));
    let body = '';
    if (!known) body = '<div class="dim">신호가 닿지 않는 미탐색 지역이다. 가까이 가면 드러난다.</div>';
    else {
      const obj = G.objAt(x, y);
      if (obj && obj.kind === 'gate') body += `<div class="tip-obj">${this.rift(obj.tier)}<div><b>${G.gateName(obj)}</b><div class="small">${this.rankTag(obj.tier)} ${this.elemTag(obj.elem)} 난이도 ${this.gateRisk(obj.tier)}</div></div></div>`;
      if (obj && obj.kind === 'mob') body += `<div class="tip-obj"><span class="mob-dot big" style="--c:${elemColor(obj.elem)}"></span><div><b>${obj.name} 무리 ×${obj.count}</b><div class="small">${this.rankTag(obj.tier)} ${this.elemTag(obj.elem)} 난이도 ${this.gateRisk(obj.tier)}</div></div></div>`;
      const ns = this.npcsAt(x, y);
      for (const n of ns) body += `<div class="tip-obj">${this.npcAvatar(n, 34)}<div class="grow"><b>${n.name}</b> <span class="small dim">${n.met ? relationLabel(n.relation) : '처음 보는 각성자'}</span><div class="small">${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)}</div></div>
        ${n.region === p.region ? `<button class="sm" data-act="sheet" data-v="npc:${n.id}">교류</button>` : ''}</div>`;
      if (x === p.x && y === p.y && !body) body = '<div class="dim small">현재 위치</div>';
    }
    const title = city ? city.name : reg ? `${reg.name} · ${WORLD.T_NAME[ty]}` : WORLD.T_NAME[ty];
    tip.innerHTML = fixJosa(`<div class="row between"><b>${known ? title : '미탐색 지역'}</b><button class="icon-btn sm" data-act="tip-close" aria-label="닫기">×</button></div>
      ${d ? `<div class="small dim">현재 위치에서 ${d}칸${ty === WORLD.T.SEA || ty === WORLD.T.NORTH ? ' · 진입 불가' : !G.canJeju() && reg && reg.id === 'jeju' ? ' · 관리국 공인 S급만 출입 가능' : ''}</div>` : ''}${body}`);
    tip.classList.remove('hidden');
  },

  onTap(x, y) {
    // 걷는 중에 누르면 다음 칸에서 멈춘다
    if (this.walking) { this.walking.stop = true; this.toast('다음 칸에서 멈춘다.'); return; }
    if (this.ctx || this.modalOpen() || !this.map || this.map.moving || G.over) return;
    const rd = this.map.reachData; const i = WORLD.idx(x, y);
    this.hideTip();
    if (rd && rd.dist.has(i) && i !== rd.start) return this.walk(WORLD.pathTo(rd, i).slice(1));
    this.showTip(x, y);
  },

  // 한 칸씩 걸으며 시간이 흐르고, 길 위에서 일이 생기면 멈춘다
  walk(steps) {
    const w = this.walking = { steps, i: 0, stop: false, days: 0 };
    this.map.walkPath = steps.slice();
    const next = () => {
      if (this.walking !== w) return;
      if (w.stop || w.i >= w.steps.length || G.over) return this.endWalk();
      const p = G.player;
      const from = [p.x, p.y]; const to = WORLD.xy(w.steps[w.i++]);
      const diag = from[0] !== to[0] && from[1] !== to[1];
      const ms = (WORLD.type(to[0], to[1]) === WORLD.T.MOUNTAIN ? 330 : 210) * (diag ? 1.25 : 1) * (FX.reduced ? 0.5 : 1);
      this.map.walkPath = w.steps.slice(w.i);
      this.map.tween(from, to, ms, () => {
        if (this.walking !== w) return;
        const res = G.walkStep(to[0], to[1], diag);
        w.days += res.days;
        let stop = res.stop;
        // 길에서 다른 각성자와 마주침
        if (!stop) {
          const ns = this.npcsAt(to[0], to[1]).filter((n) => n.region === G.player.region);
          if (ns.length && RNG.chance(0.45)) {
            const n = ns[0];
            G.queue.push(n.nemesis === 'player' || (n.relation <= -30 && RNG.chance(0.6)) ? { type: 'ambush', npcId: n.id } : { type: 'story', id: 'road_meet', npc: n.id });
            stop = true;
          }
        }
        this.renderHud();
        if (stop) w.stop = true;
        next();
      });
    };
    next();
  },
  endWalk() {
    const w = this.walking; this.walking = null;
    this.map.walkPath = null; this.map.token = null; this.map.moving = false;
    const p = G.player;
    G.save();
    this.renderGame();
    if (w && w.days) this.toast(`${w.days}일 동안 걸었다.${w.i < w.steps.length && !G.over ? ' 걸음을 멈췄다.' : ''}`);
    if (G.over || G.queue.length) return this.processQueue();
    const obj = G.objAt(p.x, p.y);
    if (obj) return this.encounter(obj);
    if (G.onCity()) {
      if (RNG.chance(0.35)) { const ev = G.pickStory('city'); if (ev) { G.queue.push(ev); return this.processQueue(); } }
      return this.openCity();
    }
    if (this.npcsAt(p.x, p.y).length) this.showTip(p.x, p.y);
  },
  // 걷는 동안 가벼운 HUD 갱신 (지도는 그대로)
  renderHud() {
    const el = (id) => document.getElementById(id);
    if (!el('hud-card')) return;
    el('hud-card').innerHTML = fixJosa(this.hudCard());
    el('hud-tr').innerHTML = fixJosa(this.hudObjective());
    this.map.drawMini();
  },

  encounter(obj) {
    if (obj.kind === 'gate') {
      return this.modal(`<div class="enc">${FX.eventArt('gate_surge')}<div class="eyebrow">게이트 감지 · ${G.fullDate()}</div><h3>${G.gateName(obj)}</h3>
        <div class="row">${this.rankTag(obj.tier)} ${this.elemTag(obj.elem)} ${obj.mission ? '<span class="tag amber">길드 임무</span>' : ''}${obj.bid ? '<span class="tag amber">길드 낙찰</span>' : ''}${obj.variant === 'red' ? '<span class="tag bad">레드 게이트</span>' : ''} <span class="small">난이도 ${this.gateRisk(obj.tier)}</span></div>
        <p class="dim">${obj.final ? '4개 구역. 도주할 수 없다.' : obj.variant === 'red' ? '<span class="bad">붉게 물든 게이트. 들어가면 공략 전까지 나올 수 없다. 4개 구역, 철수·도주 불가. 패배하면 구조대도 들어올 수 없다.</span> 대신 보상이 크다.' : '3개 구역 · 공략에 약 10일 소요. 구역 사이에 철수할 수 있다.'}</p>
        <p class="small dim">중계하며 들어가면 성공 시 구독자와 후원금이 늘지만, 철수나 패배도 그대로 송출된다.</p></div>
        <div class="row end"><button class="ghost" data-act="modal-close">나중에</button><button data-act="gate" data-v="${obj.id}|live">${FX.icon('star', 14)} 중계하며 진입</button><button class="${obj.variant === 'red' ? 'danger' : 'primary'}" data-act="gate" data-v="${obj.id}">진입한다</button></div>`);
    }
    const sample = { name: obj.name, elem: obj.elem, shape: obj.shape };
    return this.modal(`<div class="enc mob-enc"><div class="mob-portrait" style="--c:${elemColor(obj.elem)}">${FX.monster(sample, 130)}</div>
      <div><div class="eyebrow bad">괴수 조우</div><h3>${obj.name} 무리 ×${obj.count}</h3><div class="row">${this.rankTag(obj.tier)} ${this.elemTag(obj.elem)} <span class="small">난이도 ${this.gateRisk(obj.tier)}</span></div></div></div>
      <div class="row end"><button class="ghost" data-act="modal-close">물러난다</button><button class="danger" data-act="mob" data-v="${obj.id}">토벌한다</button></div>`);
  },

  // ---------- 메뉴 창 ----------
  openSheet(name) {
    this.sheet = name;
    this.modal(this.sheetHtml(), 'sheet');
    this.sheet = name;
  },
  sheetHtml() {
    const name = this.sheet || 'char';
    if (name.startsWith('npc:')) {
      const n = G.npcById(+name.slice(4));
      return `<div class="sheet-head"><h3>교류</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>${n ? `<div class="npc-sheet">${UI.npcPortrait(n, 180)}${this.npcCard(n, n.alive && n.region === G.player.region)}</div>` : ''}`;
    }
    const tabs = [['char', '정보'], ['skills', '스킬'], ['party', '파티'], ['people', '인물'], ['quest', '의뢰'], ['guild', '길드'], ['hunter', '헌터'], ['log', '연대기']];
    let body = '';
    switch (name) {
      case 'quest': body = this.questsHtml(); break;
      case 'party': body = this.partyHtml(); break;
      case 'people': body = this.peopleHtml(); break;
      case 'skills': body = this.skillsHtml(); break;
      case 'guild': body = this.guildHtml(); break;
      case 'hunter': body = this.hunterHtml(); break;
      case 'log': body = `<div class="panel">${this.rightHtml()}</div>`; break;
      default: body = this.charHtml();
    }
    return `<div class="sheet-head"><nav class="tabs">${tabs.map(([k, n]) => `<button class="${name === k ? 'on' : ''}" data-act="sheet" data-v="${k}">${n}</button>`).join('')}</nav>
      <button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div><div class="sheet-body">${body}</div>`;
  },

  partyHtml() {
    const p = G.player; const mem = G.party();
    const card = (name, cls, adv, rank, stage, av, extra, right) => `<div class="item-row">${av}<div class="grow"><b>${name}</b> ${this.clsTag(cls, adv)} ${this.rankTag(rank, stage)}<div class="small dim">${classById(cls).desc}${extra ? ' · ' + extra : ''}</div></div>${right || ''}</div>`;
    return `<div class="panel"><h3>파티 · ${G.partySize()}/5</h3>
      <p class="dim small">관계 50 이상인 인물에게 파티 합류를 청하거나, 도시의 용병 사무소에서 고용할 수 있습니다. 전투에서 동료는 직업과 성격대로 스스로 싸웁니다. 혼자서도 충분히 강하다면 파티는 필수가 아닙니다. 적의 규모는 파티 인원에 맞춰 커집니다.</p>
      <div class="cards">${card(p.name, p.cls, p.clsAdv, p.rankIdx, p.stage, this.playerAvatar(40), '나')}
      ${mem.map((n) => card(n.name, n.cls, n.rankIdx >= 6 ? 2 : n.rankIdx >= 3 ? 1 : 0, n.rankIdx, n.stage, this.npcAvatar(n, 40), `성격 ${persById(n.personality).name} · ${n.merc ? `용병 계약 ${n.merc.until - G.monthKey()}개월 남음` : `관계 ${relationLabel(n.relation)}`}`, `<button class="sm ghost" data-act="party-out" data-v="${n.id}">내보내기</button>`)).join('')}
      ${Array.from({ length: 4 - mem.length }, () => '<div class="item-row empty-slot"><div class="grow dim small">빈 자리</div></div>').join('')}</div></div>`;
  },

  questsHtml() {
    const p = G.player;
    const row = (q) => `<div class="item-row ${q.status === 'done' ? 'hl' : ''}"><div class="grow"><b>${q.title}</b><div class="small dim">${q.kind === 'npc' ? `${(G.npcById(q.npc) || { name: '?' }).name}의 부탁 · 남은 기한 ${q.deadline - G.monthKey()}개월` : `${regionById(q.from).name} 협회 의뢰 · ${this.questStatus(q)}`}</div></div></div>`;
    return `<div class="panel"><h3>진행 중인 일</h3><p class="dim small">협회 의뢰는 각 도시의 의뢰소에서 받고 보고합니다. 아는 사람들의 부탁은 메시지로 찾아옵니다.</p>
      <div class="cards">${p.quests.map(row).join('') || '<div class="dim">맡은 일이 없다. 도시의 협회 의뢰소를 찾아가 보자.</div>'}</div></div>`;
  },

  rightHtml() {
    const logs = G.logs.slice(0, 50).map((l) => `<div class="l ${l.type}"><span class="d">${l.date}</span>${l.text}</div>`).join('');
    const rum = G.rumors.slice(0, 30).map((l) => `<div class="l"><span class="d">${l.date}</span>${l.text}</div>`).join('') || '<div class="dim">아직 들려오는 소문이 없다.</div>';
    return `<div class="log-cols"><div><div class="sec-title">연대기</div><div class="logs">${logs}</div></div>
      <div><div class="sec-title">헌터 커뮤니티 소문</div><div class="logs rumors">${rum}</div></div></div>`;
  },

  gateRisk(tier) {
    const d = tier - G.player.rankIdx;
    if (d <= -2) return '<span class="risk r0">여유</span>';
    if (d === -1) return '<span class="risk r1">쉬움</span>';
    if (d === 0) return '<span class="risk r2">적정</span>';
    if (d === 1) return '<span class="risk r3">위험</span>';
    return '<span class="risk r4">자살 행위</span>';
  },

  equipStats(it) {
    const parts = [];
    if (it.atk) parts.push(`공격 +${it.atk}`); if (it.def) parts.push(`방어 +${it.def}`); if (it.hp) parts.push(`체력 +${it.hp}`);
    if (it.mp) parts.push(`정신력 +${it.mp}`); if (it.spd) parts.push(`속도 +${it.spd}`); if (it.luck) parts.push(`운 +${it.luck}`);
    return parts.join(' · ');
  },
  equipName(it) { return `<b style="color:${RARITY[it.rarity].color}">${it.name}</b> <span class="tag">${RARITY[it.rarity].name}</span>`; },
  slotName(s) { return { weapon: '무기', armor: '방어구', acc: '장신구' }[s]; },
  equipRow(it, right, extra = '') {
    return `<div class="item-row">${this.slotIcon(it.slot, RARITY[it.rarity].color)}<div class="grow">${this.equipName(it)} <span class="dim small">${this.slotName(it.slot)}</span><div class="small dim">${this.equipStats(it)}${extra}</div></div>${right}</div>`;
  },

  shopHtml() {
    const s = G.getShop(); const p = G.player; const pm = G.priceMul();
    const price = (v) => `<span class="num">${fmt(v)}</span>`;
    return `<div class="panel">
      <h3>${G.region().name} 상점가</h3>
      <p class="dim">상품은 매달 바뀝니다.${pm < 1 ? ` 할인 적용 중 ×${pm.toFixed(2)}.` : ''}${G.region().id === 'busan' ? ' 암시장이라 가격이 들쭉날쭉하다.' : ''}</p>
      <div class="sec"><div class="sec-title">소모품</div><div class="cards">${CONSUMABLES.map((c) => `
        <div class="item-row"><span class="slot-ico" style="--c:var(--ether)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 3h6M10 3v5L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3"/><path d="M7 15h10"/></svg></span>
        <div class="grow"><b>${c.name}</b> <span class="dim small">보유 ${p.items[c.id] || 0}</span><div class="small dim">${c.desc}</div></div>
        <button class="sm" data-act="buy-item" data-v="${c.id}">${FX.icon('coin', 13)} ${price(c.price * pm)}</button></div>`).join('')}</div></div>
      <div class="sec"><div class="sec-title">장비</div><div class="cards">${s.equips.map((it) => this.equipRow(it, `<button class="sm" data-act="buy-equip" data-v="${it.uid}">${FX.icon('coin', 13)} ${price(it.value * pm)}</button>`)).join('') || '<div class="dim">매진</div>'}</div></div>
      <div class="sec"><div class="sec-title">스킬 데이터</div><div class="cards">${s.skills.map((id) => { const sk = skillById(id); const own = p.skills.includes(id); return `
        <div class="item-row"><span class="slot-ico" style="--c:${sk.elem ? elemColor(sk.elem) : '#9aa6b8'}">${FX.elemIcon(sk.elem, 20)}</span>
        <div class="grow"><b>${sk.name}</b> ${this.rankTag(sk.rankReq)} <span class="tag">${TYPE_NAME[sk.type]}</span><div class="small dim">${sk.desc} · 정신력 ${sk.mp}</div></div>
        ${own ? '<span class="dim small">습득함</span>' : `<button class="sm" data-act="buy-skill" data-v="${id}" ${sk.rankReq > p.rankIdx ? 'disabled' : ''}>${FX.icon('coin', 13)} ${price(sk.price * pm)}</button>`}</div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">보유 장비 판매 · 40%</div><div class="cards">${p.inventory.map((it) => this.equipRow(it, `<button class="sm ghost" data-act="sell" data-v="${it.uid}">${price(it.value * 0.4)} 판매</button>`)).join('') || '<div class="dim">판매할 장비가 없다.</div>'}</div></div>
    </div>`;
  },

  npcCard(n, here) {
    const pers = persById(n.personality);
    const rel = n.relation;
    const mk = G.monthKey();
    let btns = '';
    if (here && n.alive && n.child) {
      btns = `<div class="row npc-btns">
        <button class="sm" data-act="npc-talk" data-v="${n.id}" ${n.lastTalk === mk ? 'disabled' : ''}>${ageStage(Math.floor(n.ageMonths / 12)) === 'baby' ? '어르기' : '말 걸기'}</button>
        <button class="sm" data-act="npc-gift" data-v="${n.id}">선물 <span class="num">${fmt(G.giftCost(n))}</span></button>
      </div>`;
    } else if (here && n.alive) {
      btns = `<div class="row npc-btns">
        <button class="sm" data-act="npc-talk" data-v="${n.id}" ${n.lastTalk === mk ? 'disabled' : ''}>대화</button>
        <button class="sm" data-act="npc-gift" data-v="${n.id}">선물 <span class="num">${fmt(G.giftCost(n))}</span></button>
        <button class="sm" data-act="npc-spar" data-v="${n.id}" ${n.lastSpar === mk || n.isCompanion ? 'disabled' : ''}>대련</button>
        ${G.canTeach(n) ? `<button class="sm" data-act="npc-teach" data-v="${n.id}">가르침 · 1개월</button>` : ''}
        ${(G.player.disciples || []).includes(n.id) ? `<button class="sm" data-act="teach-disciple" data-v="${n.id}">제자 지도 · 1개월</button>` : ''}
        ${G.canRecruit(n) ? `<button class="sm primary" data-act="npc-recruit" data-v="${n.id}">파티 초대</button>` : ''}
        ${n.isCompanion ? `<button class="sm ghost" data-act="party-out" data-v="${n.id}">파티에서 빼기</button>` : `<button class="sm danger" data-act="npc-duel" data-v="${n.id}">생사결</button>`}
      </div>`;
    }
    return `<div class="npc-card ${n.alive ? '' : 'dead'}">
      <div class="npc-top">
        ${this.npcAvatar(n, 52)}
        <div class="grow">
          <div class="row between"><b>${n.name}</b><span>${this.bondTag(n)}${n.isCompanion ? '<span class="tag good">동료</span>' : ''}</span></div>
          <div class="small dim">${n.gender === 'M' ? '남' : '여'} · ${Math.floor(n.ageMonths / 12)}세${n.child ? ` · ${AGE_NAME[ageStage(Math.floor(n.ageMonths / 12))]}` : ''} · ${pers.name}${n.child ? '' : ` · ${n.guild ? GUILDS[n.guild].name : '무소속'}`} ${this.raceTag(n)}</div>
          <div class="row small">${n.child ? '<span class="tag">비각성</span>' : `${this.rankTag(n.rankIdx, n.stage)} ${this.clsTag(n.cls || 'swordsman', n.rankIdx >= 6 ? 2 : n.rankIdx >= 3 ? 1 : 0)} ${this.elemTag(n.element)}`}</div>
        </div>
      </div>
      ${!here ? `<div class="small dim">${n.alive ? regionById(n.region).name : `사망 · ${n.death.date} · ${n.death.cause}`}</div>` : ''}
      <div class="rel-line"><span class="small">관계 <b class="${rel < 0 ? 'bad' : rel >= 30 ? 'good' : ''}">${relationLabel(rel)}</b> <span class="num dim">${rel}</span></span>${G.canTeach(n) ? '<span class="small good">스승 가능</span>' : ''}</div>
      <div class="rel-bar"><i class="${rel < 0 ? 'neg' : ''}" style="${rel < 0 ? `right:50%;width:${-rel / 2}%` : `left:50%;width:${rel / 2}%`}"></i></div>
      ${btns}</div>`;
  },

  bondTag(n) {
    const p = G.player; const t = [];
    if (p.spouse === n.id) t.push('배우자'); if (p.partner === n.id) t.push('연인'); if (p.master === n.id) t.push('스승');
    if ((p.disciples || []).includes(n.id)) t.push('제자'); if (n.family) t.push('혈육'); if (n.nemesis === 'player') t.push('원수');
    const sp = n.spouse && n.spouse !== -1 ? G.npcById(n.spouse) : null; const pt = n.partner && n.partner !== -1 ? G.npcById(n.partner) : null;
    const extra = sp ? `<span class="small dim">${sp.name}의 배우자 </span>` : pt ? `<span class="small dim">${pt.name}의 연인 </span>` : '';
    return extra + t.map((x) => `<span class="tag ${x === '원수' ? 'bad' : 'amber'}">${x}</span>`).join('');
  },

  peopleHtml() {
    const here = [...G.npcsHere(), ...G.npcs.filter((n) => n.alive && n.child && n.region === G.player.region)].sort((a, b) => b.isCompanion - a.isCompanion || a.child - b.child || b.relation - a.relation || b.rankIdx - a.rankIdx);
    const known = G.npcs.filter((n) => n.met && (n.region !== G.player.region || !n.alive)).sort((a, b) => b.alive - a.alive || b.relation - a.relation);
    return `<div class="panel"><h3>${G.region().name}의 각성자들</h3>
      <p class="dim">대화와 선물로 관계를 쌓으세요. 관계 40 이상이면 상위 등급자에게 가르침을, 50 이상이면 파티 초대를 할 수 있습니다. 관계가 -30 이하면 기습당할 수 있습니다.</p>
      <div class="npc-grid">${here.map((n) => this.npcCard(n, true)).join('') || '<div class="dim">이 지역엔 아무도 없다.</div>'}</div>
      <div class="sec"><div class="sec-title">알고 지낸 인물</div>
      <div class="npc-grid">${known.map((n) => this.npcCard(n, false)).join('') || '<div class="dim">다른 지역의 지인이 없다.</div>'}</div></div></div>`;
  },

  charHtml() {
    const p = G.player; const bg = BACKGROUNDS.find((b) => b.id === p.bg);
    return `<div class="panel">
      <div class="char-head">${UI.playerPortrait(150)}<div><h3>${p.name}</h3><div class="dim">${p.gender === 'M' ? '남' : '여'} · ${G.ageYears()}세 · ${bg.name}</div><div class="row">${this.rankTag(p.rankIdx, p.stage)} ${this.clsTag(p.cls, p.clsAdv)} ${this.elemTag(p.element)}</div></div></div>
      <div class="sec"><div class="sec-title">직업</div>${(() => { const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; return `<div class="trait" style="border-left-color:${g.color}"><b>${className(p.cls, p.clsAdv)} <span class="small" style="color:${g.color}">${g.name} · ${CLASS_RARITY[k.r]}</span></b><span class="dim">${k.desc}</span><span class="small">전직 단계: ${[k.name, ...k.adv].map((n, i) => (i === p.clsAdv ? `<b class="amber">${n}</b>` : n)).join(' → ')} (C급, S급에서 전직 시험)</span><span class="small dim">직업 스킬: ${k.skills.map((x, i) => `${x[0]}(${RANKS[[0, 2, 5][i]].key}급)`).join(' · ')}</span></div>`; })()}</div>
      <div class="sec"><div class="sec-title">선천 특성</div><div class="cards traits">${p.traits.map((id) => { const t = traitById(id); return `<div class="trait"><b>${t.name}</b><span class="dim">${t.desc}</span></div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">장착 장비</div><div class="cards">${['weapon', 'armor', 'acc'].map((s) => { const it = p.equip[s]; return it
        ? this.equipRow(it, `<button class="sm ghost" data-act="unequip" data-v="${s}">해제</button>`)
        : `<div class="item-row">${this.slotIcon(s, '#3a4560')}<div class="grow dim">${this.slotName(s)} 없음</div></div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">가방</div><div class="cards">${p.inventory.map((it) => { const cur = p.equip[it.slot]; return this.equipRow(it, `<button class="sm" data-act="equip" data-v="${it.uid}">장착</button>`, cur ? `<br>현재: ${this.equipStats(cur)}` : ''); }).join('') || '<div class="dim">비어 있다.</div>'}</div></div>
      <div class="sec"><div class="sec-title">소모품</div><div class="cards">${CONSUMABLES.filter((c) => p.items[c.id]).map((c) => `
        <div class="item-row"><div class="grow"><b>${c.name}</b> <span class="num">×${p.items[c.id]}</span> <span class="dim small">${c.desc}</span></div><button class="sm" data-act="use-item" data-v="${c.id}">사용</button></div>`).join('') || '<div class="dim">없음</div>'}</div></div>
      <div class="sec"><div class="sec-title">인연</div><div class="npc-strip">${this.bondsHtml()}</div></div>
      <div class="sec"><div class="sec-title">유물 · 각성 촉매 · 코어</div><div class="cards">
        ${p.relics.map((r) => { const R = relicById(r.id); return `<div class="item-row"><div class="grow"><b style="color:${RARITY[r.grade].color}">${R.name}</b> <span class="tag">${RARITY[r.grade].name}</span><div class="small dim">돌파 때 바치면 ${R.desc} 영구 상승</div></div></div>`; }).join('')}
        ${Object.keys(p.items).filter((k) => k.startsWith('cat') && p.items[k] > 0).map((k) => `<div class="item-row hl"><div class="grow"><b>${RANKS[+k.slice(3)].key}급 각성 촉매</b> ×${p.items[k]}</div></div>`).join('')}
        <div class="small dim">${Object.keys(p.mats).filter((k) => p.mats[k] > 0).map((k) => `${coreName(+k.slice(1))} ${p.mats[k]}`).join(' · ') || '코어 없음'} · 협회 공적 ${p.merit}</div>
        ${Object.keys(p.relicBonus || {}).length ? `<div class="small">유물 누적 효과: ${Object.entries(p.relicBonus).map(([k, v]) => `${{ hp: '체력', atk: '공격', def: '방어', spd: '속도', mp: '정신력', luck: '운', train: '수련', life: '수명' }[k]} +${k === 'life' ? Math.round(v) + '년' : Math.round(v * 100) + '%'}`).join(', ')}</div>` : ''}
      </div></div>
      <div class="sec"><div class="sec-title">인생 기록</div><div class="logs">${p.lifeEvents.slice().reverse().map((e) => `<div class="l major"><span class="d">${e.date} · ${e.age}세</span>${e.text}</div>`).join('')}</div></div>
      <div class="sec"><div class="sec-title">생애 통계</div><div class="stat-grid">
        <div><span class="dim">공략 게이트</span><b class="num">${p.record.gates}</b></div><div><span class="dim">처치 괴수</span><b class="num">${p.record.kills}</b></div>
        <div><span class="dim">돌파 성공</span><b class="num">${p.record.breakthroughs}</b></div><div><span class="dim">돌파 실패</span><b class="num">${p.record.fails}</b></div>
        <div><span class="dim">생사결 승리</span><b class="num">${p.record.npcKills}</b></div><div><span class="dim">수명 손상</span><b class="num">${p.lifePenalty}년</b></div>
      </div></div></div>`;
  },

  bondsHtml() {
    const p = G.player;
    const list = [];
    const add = (id, label) => { const n = id != null && G.npcById(id); if (n) list.push([n, label]); };
    add(p.spouse, '배우자'); add(p.partner, '연인'); add(p.master, '스승');
    (p.disciples || []).forEach((id) => add(id, '제자'));
    (p.children || []).forEach((id) => add(id, '자녀'));
    G.npcs.filter((n) => n.family).forEach((n) => list.push([n, '혈육']));
    G.adults().filter((n) => n.nemesis === 'player').forEach((n) => list.push([n, '원수']));
    return list.map(([n, label]) => `<button class="npc-chip ${n.alive ? '' : 'dead'}" data-act="sheet" data-v="npc:${n.id}">${this.npcAvatar(n, 40)}<span><b>${n.name}</b><span class="small ${label === '원수' ? 'bad' : 'dim'}">${label}${n.alive ? (n.child ? ` · ${Math.floor(n.ageMonths / 12)}세` : ` · ${RANKS[n.rankIdx].key}급`) : ' · 故'}</span></span></button>`).join('') || '<span class="dim small">아직 깊은 인연이 없다.</span>';
  },

  skillsHtml() {
    const p = G.player;
    return `<div class="panel"><h3>스킬</h3><p class="dim">전투에 가져갈 스킬을 최대 5개까지 장착합니다. 직업 스킬은 등급이 오르면 자동으로 익힙니다. 같은 속성 스킬은 위력 +20%.</p>
      <div class="cards">${p.skills.map((id) => { const sk = skillById(id); const on = p.equipSkills.includes(id); return `
        <div class="item-row ${on ? 'equipped' : ''}"><span class="slot-ico" style="--c:${ELEMENTS[sk.elem === 'self' ? p.element : sk.elem] ? elemColor(sk.elem === 'self' ? p.element : sk.elem) : '#9aa6b8'}">${FX.elemIcon(sk.elem === 'self' ? p.element : sk.elem, 20)}</span>
          <div class="grow"><b>${sk.name}</b> <span class="tag">${TYPE_NAME[sk.type] || '특수'}</span>${sk.cls ? ` ${this.clsTag(sk.cls)}` : ''}<div class="small dim">${sk.desc} · 위력 ${sk.power} · 정신력 ${sk.mp}</div></div>
          ${id === 'strike' ? '<span class="dim small">기본</span>' : `<button class="sm ${on ? 'primary' : ''}" data-act="toggle-skill" data-v="${id}" ${!on && p.equipSkills.length >= 5 ? 'disabled' : ''}>${on ? '장착 중' : '장착'}</button>`}</div>`; }).join('')}</div></div>`;
  },

  guildHtml() {
    const p = G.player; const reg = G.region();
    let cur = '';
    if (p.guild) {
      const g = GUILDS[p.guild]; const next = GUILD_RANKS[p.guildRank + 1];
      const home = REGIONS.find((r) => r.guild === p.guild);
      cur = `<div class="guild-card" style="--c:${g.color}"><div class="guild-crest">${FX.elemIcon(g.elem, 34)}</div><div class="grow"><h3>${g.name}</h3><p class="dim">${g.desc}</p>
        <div>직위 <b>${GUILD_RANKS[p.guildRank].name}</b> · 공헌도 <span class="num">${p.contrib}${next ? ` / ${next.req}` : ''}</span>${next ? ` <span class="dim">다음: ${next.name}</span>` : ''}</div>
        ${next ? this.bar('ether', p.contrib, next.req) : ''}
        <div class="dim small">월급 ${fmt(40 * RANKS[p.official].mult * (1 + p.guildRank))} 크레딧 (공식 등급 기준) · 본부(${home.name}) 상점 20% 할인 · 본부에서 길드 임무 게이트가 열립니다.${p.guild === 'cheongryong' ? ' · 수련 효율 +15%' : ''}</div>
        <div class="row sec"><button class="danger sm" data-act="guild-leave">탈퇴</button></div></div></div>`;
    } else if (reg.guild) {
      const g = GUILDS[reg.guild];
      cur = `<div class="guild-card" style="--c:${g.color}"><div class="guild-crest">${FX.elemIcon(g.elem, 34)}</div><div class="grow"><h3>${g.name}</h3><p class="dim">${g.desc}</p>
        <div>가입 조건: 명성 <span class="num">${g.fameReq}</span> · 현재 <span class="num">${p.fame}</span></div>
        <div class="row sec"><button class="primary" data-act="guild-join" ${p.fame < g.fameReq ? 'disabled' : ''}>가입 신청</button></div></div></div>`;
    } else cur = '<p class="dim">이 지역엔 길드 본부가 없다.</p>';
    return `<div class="panel"><h3>길드</h3>${cur}
      <div class="sec"><div class="sec-title">5대 세력</div><div class="cards">${Object.entries(GUILDS).map(([id, g]) => { const home = REGIONS.find((r) => r.guild === id); return `
        <div class="item-row"><span class="slot-ico" style="--c:${g.color}">${FX.elemIcon(g.elem, 20)}</span><div class="grow"><b style="color:${g.color}">${g.name}</b> <span class="dim small">본부 ${home.name} · 명성 ${g.fameReq} 필요</span><div class="small dim">${g.desc}</div></div></div>`; }).join('')}</div></div></div>`;
  },

  // ---------- 큐 처리 (이벤트, 기습, 게임오버) ----------
  processQueue() {
    if (this.modalOpen()) return;
    const q = G.queue.shift();
    if (!q) return;
    if (q.type === 'gameover') return this.showGameOver();
    if (q.type === 'victory') return this.showVictory();
    if (q.type === 'event') return this.showEvent(EVENTS.find((e) => e.id === q.id));
    if (q.type === 'ambush') {
      const n = G.npcById(q.npcId);
      if (!n || !n.alive) return this.processQueue();
      this.modal(`<div class="ambush">${UI.npcPortrait(n, 120)}<div><div class="eyebrow bad">기습</div><h3>${n.name}</h3><div class="row small">${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)}</div></div></div>
        <p>${n.name}이(가) 살기를 띠고 덤벼든다. "여기서 끝장을 내주마!"</p>
        <div class="row end"><button class="danger" data-act="ambush-fight" data-v="${n.id}">맞서 싸운다</button></div>`);
      return;
    }
    if (q.type === 'spar') { const n = G.npcById(q.npcId); if (n && n.alive) this.startSpar(n); else this.processQueue(); }
  },

  showEvent(ev) {
    this.curEvent = ev;
    this.modal(`${FX.eventArt(ev.id)}<div class="eyebrow">사건 · ${G.dateStr()} · ${G.region().name}</div><p class="event-text">${ev.text}</p>
      <div class="cards">${ev.choices.map((c, i) => `<button class="choice-btn" data-act="ev-choice" data-v="${i}">${c.text}</button>`).join('')}</div>`, 'event-box');
  },

  lifeSummary() {
    const p = G.player;
    return `<div class="stat-grid sec">
      <div><span class="dim">최종 등급</span><b>${rankLabel(p.rankIdx, p.stage)}</b></div><div><span class="dim">나이</span><b class="num">${G.ageYears()}세</b></div>
      <div><span class="dim">공략 게이트</span><b class="num">${p.record.gates}</b></div><div><span class="dim">처치 괴수</span><b class="num">${p.record.kills}</b></div>
      <div><span class="dim">명성</span><b class="num">${fmt(p.fame)}</b></div><div><span class="dim">재산</span><b class="num">${fmt(p.money)}</b></div>
    </div>`;
  },
  showGameOver() {
    this.modal(`<div class="ending dead-end">${UI.playerPortrait(160)}<div class="eyebrow">${G.over.date}</div><h2>각성자 ${G.player.name}, 잠들다</h2><p>${G.over.reason}</p></div>${this.lifeSummary()}
      <div class="sec-title sec">인생 기록</div><div class="logs life-log">${G.player.lifeEvents.map((e) => `<div class="l"><span class="d">${e.age}세</span>${e.text}</div>`).join('')}</div>
      <p class="dim">당신의 이름은 헌터 커뮤니티의 추모 게시판에 오래 남았다.</p>
      ${this.heirs().length ? `<div class="sec-title sec">뒤를 이을 사람</div><div class="cards">${this.heirs().map((n) => `<button class="choice-btn" data-act="succeed" data-v="${n.id}">${this.npcAvatar(n, 32)} ${n.name} · ${RANKS[n.rankIdx].key}급 · ${Math.floor(n.ageMonths / 12)}세로 이어 간다</button>`).join('')}</div>` : ''}
      <div class="row end"><button class="${this.heirs().length ? 'ghost' : 'primary'}" data-act="to-title">타이틀로</button></div>`);
  },
  showVictory() {
    this.modal(`<div class="ending win-end">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()}</div><h2>원초의 게이트 봉인</h2>
      <p>심연의 군주가 쓰러지고, 20년간 한반도를 뒤덮었던 에테르 폭풍이 잦아들었다. 사람들은 ${G.player.name}의 이름을 영웅으로 기억할 것이다.</p></div>${this.lifeSummary()}
      <p class="dim">남은 수명 동안 계속 살아갈 수 있습니다.</p>
      <div class="row end"><button class="primary" data-act="modal-close">계속하기</button></div>`);
  },

  // ---------- 전투 ----------
  allyUnits() { return [G.playerUnit(), ...G.party().map((n) => G.npcUnit(n, 'ally'))]; },

  startGate(id) {
    const [gid, mode] = String(id).split('|');
    const gate = G.mapGates.find((g) => g.id === +gid);
    if (!gate || gate.cleared) return;
    this.hideTip();
    const wasMis = gate.variant === 'misrank' && !gate.revealedMis;
    this.ctx = { kind: 'gate', gate, rooms: G.gateRooms(gate), roomIdx: 0, loot: { money: 0, ether: 0, kills: 0, live: mode === 'live' }, hidden: gate.variant === 'double' && RNG.chance(0.7) };
    this.startRoom();
    if (wasMis) this.toast(`공지보다 훨씬 짙은 에테르! 등급 오판 게이트다. 실제 ${RANKS[gate.realTier].key}급.`);
  },
  startRoom() {
    const c = this.ctx;
    const last = c.roomIdx === c.rooms.length - 1;
    c.combat = new Combat(G, {
      allies: this.allyUnits(), enemies: c.rooms[c.roomIdx], canFlee: !c.gate.final && c.gate.variant !== 'red',
      title: `${G.gateName(c.gate)} · ${last ? '보스 구역' : `구역 ${c.roomIdx + 1}`}`,
    });
    c.elem = c.gate.elem;
    this.openCombat();
  },
  startMob(id) {
    const mob = G.mobs.find((m) => m.id === +id); if (!mob) return;
    this.hideTip();
    this.ctx = { kind: 'mob', mob, elem: mob.elem, combat: new Combat(G, { allies: this.allyUnits(), enemies: G.mobRoom(mob), canFlee: true, title: `${mob.name} 무리 토벌` }) };
    this.openCombat();
  },
  startSpar(n) {
    const u = G.npcUnit(n, 'enemy');
    const me = G.playerUnit(); me.hp = me.maxHp; me.mp = me.maxMp; // 대련은 서로 최상의 상태로
    this.ctx = { kind: 'spar', npcId: n.id, elem: n.element, combat: new Combat(G, { allies: [me], enemies: [u], canFlee: false, spar: true, title: `${n.name}와(과)의 대련` }) };
    this.openCombat();
  },
  startDuel(n, ambush) {
    const u = G.npcUnit(n, 'enemy');
    this.ctx = { kind: 'duel', npcId: n.id, elem: n.element, combat: new Combat(G, { allies: this.allyUnits(), enemies: [u], canFlee: true, title: `${ambush ? '기습 · ' : ''}${n.name}와(과)의 생사결` }) };
    this.openCombat();
  },

  unitSprite(u, size) {
    if (u.isPlayer) return this.playerAvatar(size);
    if (u.portrait) return FX.avatar(u.portrait.seed, u.portrait.gender, u.portrait.elem, u.tier || 0, size);
    if (u.npcId) { const n = G.npcById(u.npcId); return this.npcAvatar(n, size); }
    return FX.monster(u, size);
  },

  unitEl(u) {
    const c = this.ctx; const foes = c.combat.units.filter((x) => x.side === 'enemy' && !x.summon);
    const foeSize = foes.length >= 4 ? 78 : foes.length >= 3 ? 92 : 120;
    const cls = u.cls ? `<span class="tag cls tiny" style="--c:${groupColor(classById(u.cls).g)}">${className(u.cls, u.clsAdv || 0)}${u.pers ? ' · ' + persById(u.pers).name : ''}</span>` : '';
    if (u.side === 'enemy') return `<div class="foe ${u.boss ? 'boss' : ''} ${u.summon ? 'summoned' : ''}" id="u-${u.id}" data-act="c-target" data-v="${u.id}">
        <div class="fx-host"><div class="sprite">${this.unitSprite(u, u.summon ? 70 : u.boss ? Math.round(foeSize * 1.35) : foeSize)}</div><div class="reticle"></div></div>
        <div class="foe-name">${u.name} ${FX.elemIcon(u.elem, 12)}</div>
        <div class="bar hp"><i></i></div><div class="bar atb mini"><i></i></div><div class="foe-hp num small"></div><div class="status small"></div></div>`;
    // 아군도 괴수처럼 전장 위의 인물로 (전열·후열)
    const bars = `<div class="bar-row"><div class="bar hp"><i></i></div><span class="hp-t num"></span></div>${u.summon ? '' : '<div class="bar-row"><div class="bar mp"><i></i></div><span class="mp-t num"></span></div>'}<div class="bar atb mini"><i></i></div>`;
    if (u.summon) return `<div class="ally fig summon" id="u-${u.id}"><div class="fx-host"><div class="sprite">${FX.monster({ name: u.name, elem: u.elem, shape: u.shape }, 52)}</div></div>
        <div class="fig-name"><b>${u.name}</b></div>${bars}<div class="status small"></div></div>`;
    return `<div class="ally fig ${u.isPlayer ? 'me' : ''}" id="u-${u.id}" data-act="c-ally" data-v="${u.id}">
        <div class="fx-host"><div class="sprite">${this.unitSprite(u, 58)}</div><div class="reticle"></div></div>
        <div class="fig-name"><b>${u.name}</b></div>${cls}${bars}<div class="status small"></div></div>`;
  },

  openCombat() {
    const c = this.ctx; const cb = c.combat;
    c.disp = JSON.parse(JSON.stringify(cb.initial));
    c.played = 0; c.playing = false;
    const ec = ELEMENTS[c.elem] ? elemColor(c.elem) : '#46e0d0';
    const rooms = c.kind === 'gate' ? `<div class="room-dots">${c.rooms.map((_, i) => `<i class="${i < c.roomIdx ? 'done' : i === c.roomIdx ? 'now' : ''} ${i === c.rooms.length - 1 ? 'boss' : ''}"></i>`).join('')}</div>` : '';
    this.modal(`<div class="cb-head"><h3>${cb.title}</h3>${rooms}<span class="dim small num" id="cb-round"></span></div>
      <div class="stage" id="stage" style="--ec:${ec}">
        <div class="foes" id="foes"></div>
        <div class="allies" id="allies"></div>
      </div>
      <div id="cb-ctrl"></div>`, 'combat-box');
    c.speed = this.combatSpeed || 1;
    this.refreshUnits();
    this.renderControls();
    this.combatLoop();
  },

  refreshUnits() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    for (const u of cb.units) {
      let el = document.getElementById('u-' + u.id);
      if (!el) {
        const host = document.getElementById(u.side === 'enemy' ? 'foes' : 'allies'); if (!host) continue;
        host.insertAdjacentHTML('beforeend', fixJosa(this.unitEl(u)));
        el = document.getElementById('u-' + u.id);
        if (!c.disp[u.id]) c.disp[u.id] = { hp: u.hp, mp: u.mp };
      }
      const d = c.disp[u.id] || { hp: u.hp, mp: u.mp };
      const hb = el.querySelector('.bar.hp > i'), mb = el.querySelector('.bar.mp > i');
      if (hb) hb.style.width = Math.max(0, Math.min(100, (d.hp / u.maxHp) * 100)) + '%';
      if (mb) mb.style.width = Math.max(0, Math.min(100, (d.mp / u.maxMp) * 100)) + '%';
      const hpT = el.querySelector('.hp-t'); if (hpT) hpT.textContent = `${Math.max(0, Math.round(d.hp))}/${u.maxHp}`;
      const mpT = el.querySelector('.mp-t'); if (mpT) mpT.textContent = `${Math.round(d.mp)}/${u.maxMp}`;
      const fh = el.querySelector('.foe-hp'); if (fh) fh.textContent = `${Math.max(0, Math.round(d.hp))} / ${u.maxHp}`;
      const st = el.querySelector('.status');
      if (st) st.innerHTML = [u.fled ? '<span class="tag tiny bad">도주</span>' : '', u.tauntT ? '<span class="tag tiny amber">도발</span>' : '', u.stun ? '<span class="tag tiny bad">기절</span>' : '', u.poison ? '<span class="tag tiny" style="color:#9be36b">중독</span>' : '', u.evadeT ? '<span class="tag tiny">회피</span>' : '', u.buffs.atkT ? '<span class="tag tiny good">공↑</span>' : '', u.buffs.defT && u.buffs.def > 0 ? '<span class="tag tiny good">방↑</span>' : '', u.buffs.def < 0 ? '<span class="tag tiny bad">방↓</span>' : ''].join('');
      el.classList.toggle('dead', (d.hp <= 0 && !u.alive) || !!u.fled);
      el.classList.toggle('target', cb.target === u && u.alive);
    }
    const r = document.getElementById('cb-round'); if (r) r.textContent = `${cb.actions}번째 행동`;
    this.drawGauges();
  },

  appendLog(l) {
    if (!l.t) return;
    const box = document.getElementById('clog'); if (!box) return;
    const d = document.createElement('div'); d.className = l.cls; d.textContent = l.t;
    box.appendChild(d);
    while (box.children.length > 40) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  },

  // 전투 이벤트 하나를 화면에 연출하고 다음까지 기다릴 시간(ms)을 돌려준다
  applyEvent(l) {
    const c = this.ctx; const ev = l.ev;
    this.appendLog(l);
    if (!ev) return l.t ? 260 : 0;
    const el = (id) => document.getElementById('u-' + id);
    const color = (e) => (e && ELEMENTS[e] ? elemColor(e) : '#e3e8f1');
    switch (ev.k) {
      case 'cast': {
        if (c.disp[ev.src]) c.disp[ev.src].mp = ev.mp;
        const s = el(ev.src); if (s) { FX.pulse(s, ev.side === 'ally' ? 'lunge-up' : 'lunge-down', 320); if (ev.name) FX.floatText(s.querySelector('.fx-host'), ev.name, 'skill'); }
        this.refreshUnits();
        return 150;
      }
      case 'dmg': {
        c.disp[ev.dst].hp = ev.hp;
        const t = el(ev.dst);
        if (t) {
          const host = t.querySelector('.fx-host');
          t.style.setProperty('--hc', color(ev.elem));
          FX.pulse(t, 'hit', 420);
          FX.floatText(host, (ev.crit ? '치명 ' : '') + ev.amt, (ev.crit ? 'crit ' : '') + (ev.eff ? 'eff' : '') + (t.classList.contains('ally') ? ' hurt' : ''));
          FX.burst(host, color(ev.elem), ev.crit ? 16 : 9);
          if (ev.crit) { const st = document.getElementById('stage'); if (st) FX.pulse(st, 'quake', 380); }
        }
        this.refreshUnits();
        return 430;
      }
      case 'down': { const t = el(ev.dst); if (t) t.classList.add('dead'); this.refreshUnits(); return 300; }
      case 'miss': { const t = el(ev.dst); if (t) FX.floatText(t.querySelector('.fx-host'), '회피', 'heal'); return 260; }
      case 'note': this.refreshUnits(); return 220;
      case 'say': { const t = el(ev.src); if (t) FX.floatText(t.querySelector('.fx-host'), ev.text, 'say'); return 360; }
      case 'cover': { const t = el(ev.src); if (t) { FX.pulse(t, 'glow', 600); FX.floatText(t.querySelector('.fx-host'), '엄호!', 'skill'); } return 300; }
      case 'flee': { const t = el(ev.src); if (t) t.classList.add('dead'); this.refreshUnits(); return 360; }
      case 'summon': { this.refreshUnits(); const t = el(ev.dst); if (t) { FX.pulse(t, 'glow', 600); FX.burst(t.querySelector('.fx-host'), '#c58cff', 12); } return 380; }
      case 'aoe': {
        const st = document.getElementById('stage');
        if (st) { st.style.setProperty('--fc', color(ev.elem)); FX.pulse(st, 'flash', 500); }
        return 260;
      }
      case 'heal': case 'mp': case 'buff': {
        if (ev.hp != null && c.disp[ev.dst]) c.disp[ev.dst].hp = ev.hp;
        if (ev.revive) { const t = el(ev.dst); if (t) t.classList.remove('dead'); }
        if (ev.mp != null && c.disp[ev.dst]) c.disp[ev.dst].mp = ev.mp;
        const t = el(ev.dst);
        if (t) { FX.pulse(t, 'glow', 600); FX.floatText(t.querySelector('.fx-host'), ev.k === 'heal' ? `+${ev.amt}` : ev.k === 'mp' ? 'MP' : '강화', 'heal'); }
        this.refreshUnits();
        return 360;
      }
      default: return 200;
    }
  },

  play() {
    const c = this.ctx; if (!c || c.playing) return;
    const cb = c.combat;
    const evs = cb.log.slice(c.played);
    c.played = cb.log.length;
    if (!evs.length) return this.afterPlay();
    c.playing = true;
    this.renderControls();
    let i = 0;
    const speed = cb.auto ? 0.55 : 1;
    const step = () => {
      if (this.ctx !== c) return;
      if (i >= evs.length) { c.playing = false; return this.afterPlay(); }
      let wait = 200;
      try { wait = this.applyEvent(evs[i++]); } catch (e) { i++; if (window.console) console.error('연출 오류', e); }
      setTimeout(step, wait * speed * (FX.reduced ? 0.6 : 1));
    };
    step();
  },

  afterPlay() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    for (const u of cb.units) c.disp[u.id] = { hp: u.hp, mp: u.mp };
    this.refreshUnits();
    this.renderControls();
  },

  // ATB 루프: 연출 중이거나 내 차례면 시간이 멈춘다
  combatLoop() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    let last = performance.now();
    const frame = (now) => {
      if (this.ctx !== c || !document.getElementById('stage')) return;
      const dt = Math.min(0.1, (now - last) / 1000) * (c.speed || 1); last = now;
      if (!c.playing && !cb.result) try {
        if (cb.waiting) {
          if (cb.auto) { cb.autoStep(); this.play(); }
        } else {
          const ready = cb.tick(dt);
          this.drawGauges();
          if (ready) {
            const r = cb.takeTurn(ready);
            this.drawGauges();
            if (r === 'wait') this.renderControls();
            else this.play();
          }
        }
      } catch (e) { if (window.console) console.error('전투 진행 오류', e); c.playing = false; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  },
  drawGauges() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    for (const u of cb.units) {
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const g = el.querySelector('.atb > i'); if (g) g.style.width = Math.min(100, u.atb) + '%';
      el.classList.toggle('ready', !!(u.isPlayer && cb.waiting));
      el.classList.toggle('acting', !!(cb.active === u && c.playing));
    }
  },

  renderControls() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    const box = document.getElementById('cb-ctrl'); if (!box) return;
    if (cb.result && !c.playing) { box.innerHTML = fixJosa(this.combatResultHtml()); this.aimGlow(); return; }
    const p = cb.player;
    const ready = cb.waiting && !c.playing && !cb.auto;
    const lock = !ready;
    const eff = (id) => (G.skillEff ? G.skillEff(skillById(id)) : skillById(id));
    const sel = c.sel && p.skills.includes(c.sel) ? eff(c.sel) : null;
    if (!sel) c.sel = null;
    const aim = sel ? (SKILL_AIM[sel.type] || 'none') : null;
    let hint;
    if (cb.auto) hint = '자동 전투 중';
    else if (sel && sel.mp > p.mp) hint = '<b class="bad">MP가 부족합니다.</b>';
    else if (sel && ready) hint = aim === 'enemy' ? '<b class="amber">대상 적을 누르면 발동합니다.</b>' : aim === 'ally' ? '<b class="amber">회복할 아군을 누르면 발동합니다.</b>' : '<b class="amber">[사용]을 누르면 발동합니다.</b>';
    else if (sel) hint = '내 차례가 오면 대상을 눌러 발동합니다.';
    else hint = ready ? '<b class="amber">내 차례!</b> 시간이 멈췄다. 스킬을 고르고 대상을 누르세요.' : '게이지가 차는 중… 미리 스킬을 눌러 설명을 볼 수 있습니다.';
    const info = sel ? `<div class="skill-info" style="--c:${sel.elem ? elemColor(sel.elem) : '#9aa6b8'}">
        <div class="row between"><b>${FX.elemIcon(sel.elem, 16)} ${sel.name}</b><span class="row"><span class="small num ${sel.mp > p.mp ? 'bad' : 'dim'}">MP ${sel.mp} / ${Math.round(p.mp)}</span><button class="sm ghost" data-act="c-cancel">취소</button></span></div>
        <div class="small"><span class="tag tiny">${TYPE_NAME[sel.type] || sel.type}</span> ${SKILL_EFFECT[sel.type] || ''}${sel.power && !['taunt', 'evade', 'summon'].includes(sel.type) ? ` · 위력 ${Math.round(sel.power * 100)}%` : ''}${sel.elem && ELEMENTS[sel.elem] ? ` · ${ELEMENTS[sel.elem].name} 속성` : ''}</div>
        ${sel.desc ? `<div class="small dim">${sel.desc}</div>` : ''}
        ${aim === 'none' ? `<button class="primary use-btn" data-act="c-use" ${lock || sel.mp > p.mp ? 'disabled' : ''}>사용</button>` : ''}</div>` : '';
    box.innerHTML = fixJosa(`${info}<div class="skill-btns">${p.skills.map((id) => { const sk = eff(id); return `<button class="skill-btn ${c.sel === id ? 'sel' : ''} ${sk.mp > p.mp ? 'nomp' : ''}" style="--c:${sk.elem ? elemColor(sk.elem) : '#9aa6b8'}" data-act="c-skill" data-v="${id}" ${cb.auto || c.playing ? 'disabled' : ''}>
        ${FX.elemIcon(sk.elem, 18)}<span><b>${sk.name}</b><span class="small dim">MP ${sk.mp} · ${TYPE_NAME[sk.type]}</span></span></button>`; }).join('')}</div>
      <div class="row ctrl-row">
        ${['potion', 'mana'].map((id) => `<button class="sm" data-act="c-item" data-v="${id}" ${!G.player.items[id] || lock ? 'disabled' : ''}>${CONSUMABLES.find((x) => x.id === id).name} <span class="num">×${G.player.items[id] || 0}</span></button>`).join('')}
        <span class="grow"></span>
        <button class="sm" data-act="c-speed">${(c.speed || 1) === 1 ? '1배속' : '2배속'}</button>
        <button class="sm ${cb.auto ? 'primary' : ''}" data-act="c-auto">${cb.auto ? '자동 중지' : '자동 전투'}</button>
        ${cb.canFlee ? `<button class="sm danger" data-act="c-flee" ${lock ? 'disabled' : ''}>도주</button>` : ''}
      </div>
      <div class="small dim cb-hint">${hint}</div>`);
    this.aimGlow();
  },
  // 고른 스킬의 대상 쪽을 깜빡여 알려 준다
  aimGlow() {
    const c = this.ctx; if (!c) return; const cb = c.combat;
    const sel = c.sel && !cb.result ? (G.skillEff ? G.skillEff(skillById(c.sel)) : skillById(c.sel)) : null;
    const on = sel && cb.waiting && !c.playing && !cb.auto && sel.mp <= cb.player.mp;
    const aim = sel ? (SKILL_AIM[sel.type] || 'none') : null;
    const foes = document.getElementById('foes'), allies = document.getElementById('allies');
    if (foes) foes.classList.toggle('aim', !!(on && aim === 'enemy'));
    if (allies) allies.classList.toggle('aim', !!(on && aim === 'ally'));
  },
  // 스킬 발동 (대상이 정해졌을 때)
  fireSkill(targetId) {
    const c = this.ctx; if (!c || c.playing) return;
    const cb = c.combat; const id = c.sel; if (!id || !cb.waiting || cb.auto) return;
    if ((G.skillEff ? G.skillEff(skillById(id)) : skillById(id)).mp > cb.player.mp) return this.renderControls();
    c.sel = null;
    if (c.tutorial) c.tutorial.acted++;
    this.combatAction((x) => x.playerSkill(id, targetId));
  },

  combatResultHtml() {
    const c = this.ctx; const cb = c.combat;
    if (c.kind === 'gate') {
      if (cb.result === 'win') {
        if (!c.counted) {
          c.counted = true;
          for (const k of cb.kills) { const r = G.monsterReward(k); c.loot.money += r.money; c.loot.ether += r.ether; c.loot.kills++; (c.loot.list ||= []).push(k); }
        }
        const last = c.roomIdx === c.rooms.length - 1;
        const hiddenNow = last && c.hidden && !c.inHidden;
        return `<div class="result win"><b>구역 제압</b> <span class="small">누적 보상 <span class="num">${fmt(c.loot.money)}</span> 크레딧 · 에테르 <span class="num">${fmt(c.loot.ether)}</span></span></div>
          ${hiddenNow ? '<p class="small amber">보스가 쓰러진 자리 뒤로 숨겨진 통로가 열렸다. 이중 던전이다. 더 강한 기척이 느껴진다.</p>' : ''}
          <div class="row end">${last ? `<button class="${hiddenNow ? 'ghost' : 'primary'}" data-act="g-finish" data-v="clear">게이트 클리어</button>${hiddenNow ? '<button class="primary" data-act="g-hidden">숨겨진 구역으로</button>' : ''}`
            : `${c.gate.final || c.gate.variant === 'red' ? '' : '<button class="ghost" data-act="g-finish" data-v="retreat">철수 · 보상 챙기기</button>'}<button class="primary" data-act="g-next">다음 구역으로</button>`}</div>`;
      }
      if (cb.result === 'flee') return '<div class="row end"><button data-act="g-finish" data-v="retreat">게이트 밖으로</button></div>';
      return '<div class="result lose"><b>쓰러졌다</b></div><div class="row end"><button class="danger" data-act="g-finish" data-v="lose">의식이 멀어진다…</button></div>';
    }
    const label = cb.result === 'win' ? '<div class="result win"><b>승리</b></div>' : cb.result === 'flee' ? '<div class="result"><b>이탈</b></div>' : '<div class="result lose"><b>패배</b></div>';
    return `${label}<div class="row end"><button class="primary" data-act="c-done">확인</button></div>`;
  },

  combatAction(fn) {
    const c = this.ctx; if (!c || c.playing) return;
    fn(c.combat);
    this.refreshUnits();
    this.play();
  },

  finishGate(result) {
    const c = this.ctx; const cb = c.combat;
    const lost = result === 'lose' ? [] : G.partyCasualties(cb.units);
    const lines = G.finishGate(c.gate, result, c.loot, cb.player.hp, cb.player.mp);
    if (lost.length) lines.push(`<span class="bad">${lost.join(', ')}이(가) 쓰러져 돌아오지 못했다…</span>`);
    this.ctx = null;
    this.renderGame();
    this.modal(`<div class="eyebrow">${G.gateName(c.gate)}</div><h3>${result === 'clear' ? '게이트 공략 완료' : result === 'retreat' ? '철수' : '패배'}</h3>${lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
  },

  finishPersonalCombat() {
    const c = this.ctx; const cb = c.combat;
    if (c.kind === 'story') return this.finishStoryFight();
    if (c.kind === 'tourney') return this.finishTourney();
    const n = G.npcById(c.npcId);
    let msg = '';
    if (c.kind === 'mob') {
      const lost = G.partyCasualties(cb.units);
      const lines = G.finishMob(c.mob, cb.result, cb.kills, cb.player.hp, cb.player.mp);
      if (lost.length) lines.push(`<span class="bad">${lost.join(', ')}이(가) 쓰러져 돌아오지 못했다…</span>`);
      this.ctx = null;
      this.closeModal(); this.renderGame();
      if (G.over) return this.processQueue();
      return this.modal(`<div class="eyebrow">${c.mob.name} 무리</div><h3>${cb.result === 'win' ? '토벌 완료' : cb.result === 'flee' ? '이탈' : '패배'}</h3>${lines.map((l) => `<p>${l}</p>`).join('')}<div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
    }
    if (c.kind === 'spar') msg = G.finishSpar(n, cb.result === 'win');
    else if (cb.result === 'flee') { G.player.hp = Math.max(1, cb.player.hp); G.player.mp = cb.player.mp; G.changeRel(n, -5); msg = '간신히 도망쳤다.'; }
    else msg = G.finishDuel(n, cb.result === 'win', cb.player.hp, cb.player.mp);
    this.ctx = null;
    G.save();
    this.closeModal();
    this.renderGame();
    if (G.over) return this.processQueue();
    this.toast(msg);
    this.processQueue();
  },

  // ---------- 행동 처리 ----------
  after(msg) {
    if (this.screen === 'game') this.renderGame();
    if (this.sheet && this.modalOpen()) { const keep = this.sheet; $box.innerHTML = fixJosa(this.sheetHtml()); this.sheet = keep; }
    if (msg) this.toast(msg);
    this.processQueue();
  },

  handle(act, v) {
    const c = this.create;
    switch (act) {
      case 'new': this.screen = 'mode'; return this.render();
      case 'continue':
        if (!G.load()) { this.toast('저장 데이터를 불러오지 못했다.'); return this.render(); }
        this.screen = 'game'; this.render(); return;
      case 'help': return this.modal(this.helpHtml());
      case 'to-title': this.closeModal(); this.screen = 'title'; this.ctx = null; return this.render();
      case 'to-title-confirm':
        return this.modal('<h3>타이틀로 돌아갈까요?</h3><p class="dim">진행 상황은 매달 자동 저장됩니다.</p><div class="row end"><button class="ghost" data-act="modal-close">취소</button><button class="primary" data-act="to-title">타이틀로</button></div>');
      case 'modal-close': this.closeModal(); return this.after();
      // 생성
      case 'c-gender': c.gender = v; return this.render();
      case 'c-bg': c.bg = v; return this.render();
      case 'c-elem': c.element = v; return this.render();
      case 'c-cls': c.cls = v; return this.render();
      case 'c-look': c.look = Math.random().toString(36).slice(2); return this.render();
      case 'c-roll': if (c.rolls > 0) this.rollCreate(); return this.render();
      case 'c-start': {
        const name = (c.name || '').trim();
        if (!name) return this.toast('이름을 입력하세요.');
        G.newGame({ name, gender: c.gender, bg: c.bg, element: c.element, talent: c.talent, traits: c.traits, look: c.look, cls: c.cls });
        this.saveName(name);
        G.save();
        this.screen = 'game';
        this.render();
        return this.modal(`<div class="ending">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()} · ${G.region().name}</div><h2>각성</h2></div>
          <p>평범했던 ${name}의 몸에 처음으로 에테르가 흘렀다. 관리국의 측정 결과는 <b>F급</b>. 가장 낮은 등급이지만, 당신에겐 아직 ${G.maxLife() - G.ageYears()}년의 수명이 남아 있다.</p>
          <p class="dim">정해진 길은 없다. 도시에 들어가 의뢰를 받고, 사람을 만나고, 게이트에서 코어를 모아 각성 촉매를 만들어라. 어떻게 살지는 당신이 정한다.</p><div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`);
      }
      // 게임
      case 'sheet': return this.openSheet(v);
      case 'tip-close': return this.hideTip();
      case 'zoom-in': this.map && this.map.zoom(1.2); return this.map && this.map.drawMini();
      case 'zoom-out': this.map && this.map.zoom(1 / 1.2); return this.map && this.map.drawMini();
      case 'zoom-me': this.map && this.map.centerOn(G.player.x, G.player.y); return this.map && this.map.drawMini();
      case 'focus': { const [fx, fy] = v.split(',').map(Number); this.map.centerOn(fx, fy); this.map.drawMini(); return this.showTip(fx, fy); }
      case 'mob': this.closeModal(); return this.startMob(v);
      case 'train': G.train(); return this.after();
      case 'rest': G.rest(); return this.after();
      case 'breakthrough': {
        const r = G.breakthrough(); if (!r) return;
        this.renderGame();
        return FX.breakthrough(r.ok, G.player.rankIdx, () => {
          this.renderGame();
          this.modal(`<h3 class="${r.ok ? 'good' : 'bad'}">${r.ok ? '돌파 성공' : '돌파 실패'}</h3><p class="dim">성공률 ${r.chance}%</p><p>${r.msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
        });
      }
      case 'gate': this.closeModal(); return this.startGate(v);
      case 'buy-item': return this.after(G.buyItem(v));
      case 'buy-equip': return this.after(G.buyEquip(v));
      case 'buy-skill': return this.after(G.buySkill(v));
      case 'sell': return this.after(G.sellEquip(v));
      case 'equip': G.equipItem(v); return this.after('장착했다.');
      case 'unequip': G.unequip(v); return this.after();
      case 'use-item': return this.after(G.useItem(v));
      case 'toggle-skill': G.toggleSkill(v); return this.after();
      case 'guild-join': return this.after(G.joinGuild());
      case 'guild-leave': return this.after(G.leaveGuild());
      case 'npc-talk': return this.after(G.talk(+v));
      case 'npc-gift': return this.after(G.gift(+v));
      case 'npc-teach': return this.after(G.teach(+v));
      case 'npc-recruit': return this.after(G.recruit(+v));
      case 'npc-dismiss': return this.after(G.dismiss());
      case 'party-out': return this.after(G.dismiss(+v));
      case 'npc-spar': { const n = G.npcById(+v); if (n) this.startSpar(n); return; }
      case 'npc-duel': {
        const n = G.npcById(+v);
        return this.modal(`<div class="ambush">${UI.npcPortrait(n, 120)}<div><div class="eyebrow bad">생사결</div><h3>${n.name}</h3><div class="row small">${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)}</div></div></div>
          <p>목숨을 건 결투를 신청합니다. 패배하면 <b>죽습니다</b>. 선량한 인물을 해치면 명성이 크게 떨어집니다.</p>
          <div class="row end"><button class="ghost" data-act="modal-close">취소</button><button class="danger" data-act="duel-go" data-v="${n.id}">결투한다</button></div>`);
      }
      case 'duel-go': { const n = G.npcById(+v); G.changeRel(n, -40); n.met = true; return this.startDuel(n, false); }
      case 'ambush-fight': { const n = G.npcById(+v); return this.startDuel(n, true); }
      case 'ev-choice': {
        const ch = this.curEvent.choices[+v];
        const res = ch.effect(G);
        G.recalc(); G.player.fame = Math.max(0, G.player.fame); G.save();
        this.renderGame();
        return this.modal(`${FX.eventArt(this.curEvent.id)}<p class="event-text">${res}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
      }
      // 전투
      case 'c-skill': {
        const cx = this.ctx; if (!cx || cx.playing || cx.combat.result) return;
        cx.sel = cx.sel === v && !cx.combat.waiting ? null : v;
        return this.renderControls();
      }
      case 'c-cancel': { const cx = this.ctx; if (cx) cx.sel = null; return this.renderControls(); }
      case 'c-use': return this.fireSkill(null);
      case 'c-item': { const cx = this.ctx; if (cx) cx.sel = null; return this.combatAction((cb) => cb.playerItem(v)); }
      case 'c-flee': { const cx = this.ctx; if (cx) cx.sel = null; return this.combatAction((cb) => cb.playerFlee()); }
      case 'c-target': {
        const cx = this.ctx; if (!cx || cx.combat.result) return;
        const sk = cx.sel && skillById(cx.sel);
        if (sk && (SKILL_AIM[sk.type] || 'none') === 'enemy' && cx.combat.waiting && !cx.playing) return this.fireSkill(v);
        cx.combat.setTarget(v); this.refreshUnits(); return this.renderControls();
      }
      case 'c-ally': {
        const cx = this.ctx; if (!cx || cx.combat.result) return;
        const sk = cx.sel && skillById(cx.sel);
        if (sk && SKILL_AIM[sk.type] === 'ally' && cx.combat.waiting && !cx.playing) return this.fireSkill(v);
        return;
      }
      case 'c-auto': {
        const cx = this.ctx; if (!cx) return;
        cx.combat.toggleAuto();
        this.renderControls();
        return;
      }
      case 'c-speed': {
        const cx = this.ctx; if (!cx) return;
        cx.speed = this.combatSpeed = (cx.speed || 1) === 1 ? 2 : 1;
        return this.renderControls();
      }
      case 'c-done': return this.finishPersonalCombat();
      case 'g-next': {
        const c2 = this.ctx; const cb = c2.combat;
        G.player.hp = cb.player.hp; G.player.mp = cb.player.mp;
        G.player.hp = Math.min(G.player.maxHp, G.player.hp + Math.floor(G.player.maxHp * 0.1));
        c2.roomIdx++; c2.counted = false;
        return this.startRoom();
      }
      case 'g-finish': return this.finishGate(v);
    }
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  UI.handle(el.dataset.act, el.dataset.v);
});
// 지도 노드는 키보드로도 선택
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest && e.target.closest('g[data-act]');
  if (!el) return;
  e.preventDefault();
  UI.handle(el.dataset.act, el.dataset.v);
});

// 버전 표시
{
  const v = document.createElement('div');
  v.className = 'ver'; v.textContent = 'v' + GAME_VERSION; v.setAttribute('aria-label', '게임 버전 ' + GAME_VERSION);
  document.body.appendChild(v);
}

UI.render();
