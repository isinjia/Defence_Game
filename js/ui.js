// ===== 게이트 크로니클: 화면 =====

const G = new Game();
const $app = document.getElementById('app');
const $modal = document.getElementById('modal');
const $box = document.getElementById('modal-box');
const $toast = document.getElementById('toast');

const UI = {
  screen: 'title',
  tab: 'region',
  selRegion: null,
  create: null,
  ctx: null, // 전투 문맥

  // ---------- 공통 ----------
  toast(msg) {
    if (!msg) return;
    $toast.textContent = fixJosa(msg);
    $toast.classList.remove('hidden');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => $toast.classList.add('hidden'), 2600);
  },
  modal(html, wide) {
    $box.className = 'modal-box' + (wide ? ' wide' : '');
    $box.innerHTML = fixJosa(html);
    $modal.classList.remove('hidden');
  },
  closeModal() { $modal.classList.add('hidden'); $box.innerHTML = ''; },
  modalOpen() { return !$modal.classList.contains('hidden'); },
  bar(cls, v, max) { const w = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0; return `<div class="bar ${cls}"><i style="width:${w}%"></i></div>`; },
  elemTag(e) { if (!e) return '<span class="tag">무속성</span>'; const E = ELEMENTS[e]; return `<span class="tag" style="color:${E.color};border-color:${E.color}55">${E.icon} ${E.name}</span>`; },
  rankTag(r, s) { const R = RANKS[r]; return `<span class="tag" style="color:${R.color};border-color:${R.color}66">${s == null ? R.key + '급' : rankLabel(r, s)}</span>`; },

  render() {
    if (this.screen === 'title') return this.renderTitle();
    if (this.screen === 'create') return this.renderCreate();
    this.renderGame();
  },

  // ---------- 타이틀 ----------
  renderTitle() {
    $app.innerHTML = `
      <div class="title-screen"><div>
        <div class="logo">GATE CHRONICLE</div>
        <h2>게이트 크로니클 : 각성 연대기</h2>
        <p class="sub">2087년, 대붕괴로부터 20년.<br>한반도 곳곳에 열린 게이트, 그리고 각성자들.<br>한정된 수명 안에서 얼마나 높이 오를 수 있는가.</p>
        <div class="btns">
          <button class="primary" data-act="new">새로운 각성</button>
          ${Game.hasSave() ? '<button data-act="continue">이어하기</button>' : ''}
          <button data-act="help">게임 안내</button>
        </div>
      </div></div>`;
  },

  helpHtml() {
    return `<h3>게임 안내</h3>
      <p>귀곡팔황식 자유 성장 헌터 RPG입니다. 모든 행동은 시간을 소모하고, 세계는 당신과 무관하게 흘러갑니다.</p>
      <ul style="line-height:1.8">
        <li><b>각성 등급</b>: F → E → D → C → B → A → S → SS. 각 등급은 초기·중기·후기로 나뉩니다.</li>
        <li><b>에테르</b>: 수련·게이트·가르침으로 쌓고, 후기를 채우면 <b>돌파</b>를 시도합니다. 실패하면 내상을 입습니다.</li>
        <li><b>수명</b>: 에테르 오염으로 평균 수명은 60세. 등급이 오를수록 수명이 늘어나며, 수명이 다하면 게임이 끝납니다.</li>
        <li><b>속성 상성</b>: 염 → 빙 → 뇌 → 강 → 영 → 염. 상성이면 피해 1.5배, 역상성이면 0.7배입니다.</li>
        <li><b>인물</b>: 다른 각성자들도 수련하고, 돌파하고, 늙고, 죽습니다. 친해지면 가르침을 받거나 동료로 삼을 수 있습니다.</li>
        <li><b>길드</b>: 명성이 쌓이면 지역 길드에 가입해 월급과 임무를 받을 수 있습니다.</li>
        <li><b>대련</b>은 체력 소모 없이 겨루는 친선전이고, <b>생사결</b>은 지면 죽습니다.</li>
        <li><b>최종 목표</b>: S급이 되어 제주 격리 섬의 <b>원초의 게이트</b>를 닫으십시오.</li>
      </ul>
      <div class="row" style="justify-content:flex-end"><button data-act="modal-close">닫기</button></div>`;
  },

  // ---------- 캐릭터 생성 ----------
  rollCreate() {
    const c = this.create;
    const pool = TRAITS.slice();
    c.traits = [];
    while (c.traits.length < 3) {
      const t = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      if (t.id === 'genius' && c.traits.includes('slow_learner')) continue;
      if (t.id === 'slow_learner' && c.traits.includes('genius')) continue;
      if (t.id === 'lucky' && c.traits.includes('cursed')) continue;
      if (t.id === 'cursed' && c.traits.includes('lucky')) continue;
      if (t.id === 'charisma' && c.traits.includes('loner')) continue;
      if (t.id === 'loner' && c.traits.includes('charisma')) continue;
      c.traits.push(t.id);
    }
    c.talent = RNG.int(2, 8);
    c.rolls--;
  },
  startCreate() {
    this.create = { name: '', gender: 'M', bg: 'student', element: 'fire', rolls: 6 };
    this.rollCreate();
    this.screen = 'create';
    this.render();
  },
  renderCreate() {
    const c = this.create;
    const negIds = ['cursed', 'frail', 'slow_learner', 'reckless'];
    $app.innerHTML = `
    <div class="create">
      <h2>각성자 등록</h2>
      <p class="dim">국가 각성자 관리국(KAMA)에 신규 각성자로 등록합니다.</p>
      <div class="panel">
        <div class="row">
          <div class="grow"><div class="sec-title">이름</div><input id="in-name" type="text" maxlength="8" placeholder="이름을 입력" value="${c.name}"></div>
          <div><div class="sec-title">성별</div>
            <div class="row">
              <button class="choice ${c.gender === 'M' ? 'sel' : ''}" data-act="c-gender" data-v="M">남성</button>
              <button class="choice ${c.gender === 'F' ? 'sel' : ''}" data-act="c-gender" data-v="F">여성</button>
            </div></div>
        </div>
        <div class="sec"><div class="sec-title">출신</div>
          <div class="choice-grid">${BACKGROUNDS.map((b) => `
            <button class="choice ${c.bg === b.id ? 'sel' : ''}" data-act="c-bg" data-v="${b.id}"><b>${b.name}</b><br><span class="dim">${b.desc}</span><br><span class="dim">시작: ${regionById(b.region).name}</span></button>`).join('')}
          </div></div>
        <div class="sec"><div class="sec-title">에테르 속성 (해당 속성 스킬 위력 +20%)</div>
          <div class="choice-grid">${ELEMENT_KEYS.map((k) => { const E = ELEMENTS[k]; const sk = SKILLS.find((s) => s.elem === k && s.rankReq === 0); return `
            <button class="choice ${c.element === k ? 'sel' : ''}" data-act="c-elem" data-v="${k}"><b style="color:${E.color}">${E.icon} ${E.name}</b><br><span class="dim">시작 스킬: ${sk.name}<br>${E.name} → ${ELEMENTS[E.counter].name}에 강함</span></button>`; }).join('')}
          </div></div>
        <div class="sec"><div class="row between"><div class="sec-title">선천 자질</div><button data-act="c-roll" ${c.rolls <= 0 ? 'disabled' : ''}>다시 측정 (${c.rolls}회 남음)</button></div>
          <div class="row" style="margin-bottom:8px">재능: <b class="${c.talent >= 7 ? 'good' : c.talent <= 3 ? 'bad' : ''}">${c.talent}</b> / 10 <span class="dim">(수련 효율과 돌파에 영향)</span></div>
          <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${c.traits.map((id) => { const t = traitById(id); return `<div class="trait ${negIds.includes(id) ? 'neg' : ''}"><b>${t.name}</b><br><span class="dim">${t.desc}</span></div>`; }).join('')}</div>
        </div>
        <div class="row sec" style="justify-content:flex-end">
          <button data-act="to-title">돌아가기</button>
          <button class="primary" data-act="c-start">각성 시작</button>
        </div>
      </div>
    </div>`;
    const inp = document.getElementById('in-name');
    inp.addEventListener('input', () => { c.name = inp.value; });
  },

  // ---------- 게임 화면 ----------
  renderGame() {
    const p = G.player;
    const reg = G.region();
    $app.innerHTML = fixJosa(`
      <div class="topbar">
        <span class="brand">GATE CHRONICLE</span>
        <span class="stat">📅 ${G.dateStr()}</span>
        <span class="stat">📍 ${reg.name}</span>
        <span class="stat">🎂 ${G.ageYears()}세 / 수명 ${G.maxLife()}</span>
        <span class="stat">💰 ${fmt(p.money)}</span>
        <span class="stat">⭐ 명성 ${fmt(p.fame)}</span>
        <span class="grow"></span>
        <button class="sm" data-act="help">안내</button>
        <button class="sm" data-act="to-title-confirm">타이틀</button>
      </div>
      <div class="layout">
        <aside class="side left panel">${this.leftHtml()}</aside>
        <main>
          <div class="tabs">${[['region', '지역'], ['shop', '상점'], ['people', '인물'], ['char', '캐릭터'], ['skills', '스킬'], ['guild', '길드']].map(([k, n]) => `<button class="${this.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${n}</button>`).join('')}</div>
          <div class="panel">${this.tabHtml()}</div>
        </main>
        <aside class="side right panel">${this.rightHtml()}</aside>
      </div>`);
  },

  leftHtml() {
    const p = G.player;
    const req = stageReq(p.rankIdx, p.stage);
    const comp = G.companion();
    const maxed = p.rankIdx === RANKS.length - 1 && p.stage === 2;
    return `
      <div class="row between"><h3 style="margin:0">${p.name}</h3>${this.elemTag(p.element)}</div>
      <div style="margin:6px 0 10px">${this.rankTag(p.rankIdx, p.stage)} <span class="dim">${RANKS[p.rankIdx].name}</span></div>
      <div class="row between dim" style="font-size:12px"><span>에테르</span><span>${fmt(p.ether)} / ${fmt(req)}</span></div>${this.bar('ether', p.ether, req)}
      <div class="row between dim" style="font-size:12px;margin-top:6px"><span>체력</span><span>${fmt(p.hp)} / ${fmt(p.maxHp)}</span></div>${this.bar('hp', p.hp, p.maxHp)}
      <div class="row between dim" style="font-size:12px;margin-top:6px"><span>정신력</span><span>${fmt(p.mp)} / ${fmt(p.maxMp)}</span></div>${this.bar('mp', p.mp, p.maxMp)}
      ${p.injured > 0 ? `<p class="bad" style="font-size:12px">부상 중 (${p.injured}개월): 능력치·수련 감소</p>` : ''}
      <div class="sec">
        ${maxed ? '<div class="good">이미 정점에 올랐다.</div>' : G.canBreakthrough()
          ? `<button class="primary" style="width:100%" data-act="breakthrough">⚡ ${RANKS[p.rankIdx + 1].key}급 돌파 시도 (성공률 ${G.btChance()}%)</button>`
          : `<div class="dim" style="font-size:12px">${p.stage < 2 ? `에테르를 채우면 ${STAGE_NAMES[p.stage + 1]}로 오른다.` : '에테르를 가득 채우면 돌파할 수 있다.'}${p.btBonus ? ` (돌파 보너스 +${p.btBonus}%)` : ''}</div>`}
      </div>
      <div class="sec stat-grid">
        <div><span class="dim">공격</span><b>${p.atk}</b></div><div><span class="dim">방어</span><b>${p.def}</b></div>
        <div><span class="dim">속도</span><b>${p.spd}</b></div><div><span class="dim">운</span><b>${p.luck}</b></div>
        <div><span class="dim">재능</span><b>${p.talent}</b></div><div><span class="dim">게이트</span><b>${p.record.gates}</b></div>
      </div>
      <div class="sec"><div class="sec-title">소속</div>${p.guild ? `<span style="color:${GUILDS[p.guild].color}">${GUILDS[p.guild].name}</span> · ${GUILD_RANKS[p.guildRank].name}` : '<span class="dim">무소속</span>'}</div>
      <div class="sec"><div class="sec-title">동료</div>${comp ? `${comp.name} ${this.rankTag(comp.rankIdx, comp.stage)}` : '<span class="dim">없음</span>'}</div>`;
  },

  rightHtml() {
    const logs = G.logs.slice(0, 40).map((l) => `<div class="l ${l.type}"><span class="d">${l.date}</span>${l.text}</div>`).join('');
    const rum = G.rumors.slice(0, 25).map((l) => `<div class="l"><span class="d">${l.date}</span>${l.text}</div>`).join('') || '<div class="dim">아직 들려오는 소문이 없다.</div>';
    return `<div class="sec-title">연대기</div><div class="logs">${logs}</div>
      <div class="sec sec-title">헌터 커뮤니티 소문</div><div class="logs">${rum}</div>`;
  },

  tabHtml() {
    switch (this.tab) {
      case 'shop': return this.shopHtml();
      case 'people': return this.peopleHtml();
      case 'char': return this.charHtml();
      case 'skills': return this.skillsHtml();
      case 'guild': return this.guildHtml();
      default: return this.regionHtml();
    }
  },

  gateRisk(tier) {
    const d = tier - G.player.rankIdx;
    if (d <= -2) return '<span class="dim">여유</span>';
    if (d === -1) return '<span class="good">쉬움</span>';
    if (d === 0) return '<span class="warn">적정</span>';
    if (d === 1) return '<span class="bad">위험</span>';
    return '<span class="bad"><b>자살 행위</b></span>';
  },

  regionHtml() {
    const reg = G.region();
    const p = G.player;
    const gates = G.getGates();
    const sel = this.selRegion ? regionById(this.selRegion) : null;
    const estGain = Math.floor(15 * RANKS[p.rankIdx].mult * reg.ether * (1 + p.talent * 0.08) * (1 + G.mod('train')) * (p.guild === 'cheongryong' ? 1.15 : 1) * (p.injured > 0 ? 0.5 : 1));
    return `
      <div class="row between"><h2 style="margin:0">${reg.name}</h2><span>위험도 <span class="danger">${'★'.repeat(reg.danger)}${'☆'.repeat(5 - reg.danger)}</span> · 에테르 농도 ×${reg.ether}</span></div>
      <p class="dim">${reg.desc}</p>
      <div class="row">
        <button class="primary" data-act="train">🧘 수련 (1개월 · 에테르 약 +${fmt(estGain)})</button>
        <button data-act="rest">🛌 휴식 (1개월 · 완전 회복)</button>
      </div>
      <div class="sec"><div class="sec-title">이번 달 감지된 게이트</div>
        <div class="cards">${gates.map((g) => `
          <div class="card row between">
            <div>${this.rankTag(g.tier)} <b>${G.gateName(g)}</b> ${this.elemTag(g.elem)} ${g.mission ? '<span class="tag warn">길드 임무</span>' : ''} ${g.final ? '<span class="tag bad">최종</span>' : ''}<br>
              <span class="dim" style="font-size:12px">${g.final ? '4개 구역' : '3개 구역'} · 난이도 ${this.gateRisk(g.tier)}</span></div>
            ${g.cleared ? '<span class="dim">공략 완료</span>' : `<button data-act="gate" data-v="${g.id}">진입 (1개월)</button>`}
          </div>`).join('')}</div>
      </div>
      <div class="sec"><div class="sec-title">한반도 지도 · 지역을 눌러 이동</div>
        <div class="map">${REGIONS.slice().sort((a, b) => a.y - b.y || a.x - b.x).map((r) => {
          const here = r.id === p.region; const cnt = G.npcs.filter((n) => n.alive && n.region === r.id).length;
          return `<button class="map-cell ${here ? 'here' : ''} ${this.selRegion === r.id ? 'sel' : ''}" data-act="sel-region" data-v="${r.id}">
            <div class="nm">${r.name}</div><div class="danger">${'★'.repeat(r.danger)}</div>
            <div class="dim">${r.guild ? GUILDS[r.guild].name : ''}</div><div class="dim">각성자 ${cnt}명${here ? ' · 현재 위치' : ''}</div></button>`;
        }).join('')}</div>
        ${sel && sel.id !== p.region ? `<div class="card sec row between"><div><b>${sel.name}</b> <span class="danger">${'★'.repeat(sel.danger)}</span><br><span class="dim">${sel.desc}</span></div>
          <button class="primary" data-act="travel" data-v="${sel.id}">이동 (${regionDist(p.region, sel.id)}개월)</button></div>` : ''}
      </div>`;
  },

  equipStats(it) {
    const parts = [];
    if (it.atk) parts.push(`공격 +${it.atk}`); if (it.def) parts.push(`방어 +${it.def}`); if (it.hp) parts.push(`체력 +${it.hp}`);
    if (it.mp) parts.push(`정신력 +${it.mp}`); if (it.spd) parts.push(`속도 +${it.spd}`); if (it.luck) parts.push(`운 +${it.luck}`);
    return parts.join(' · ');
  },
  equipName(it) { return `<b style="color:${RARITY[it.rarity].color}">${it.name}</b> <span class="tag">${RARITY[it.rarity].name}</span>`; },
  slotName(s) { return { weapon: '무기', armor: '방어구', acc: '장신구' }[s]; },

  shopHtml() {
    const s = G.getShop(); const p = G.player; const pm = G.priceMul();
    return `
      <h3>${G.region().name} 상점가</h3>
      <p class="dim">상품은 매달 바뀝니다.${pm < 1 ? ` 할인 적용 중 (×${pm.toFixed(2)})` : ''}${G.region().id === 'busan' ? ' 암시장이라 가격이 들쭉날쭉하다.' : ''}</p>
      <div class="sec"><div class="sec-title">소모품</div><div class="cards">${CONSUMABLES.map((c) => `
        <div class="card row between"><div><b>${c.name}</b> <span class="dim">· ${c.desc} · 보유 ${p.items[c.id] || 0}</span></div>
        <button data-act="buy-item" data-v="${c.id}">${fmt(c.price * pm)} 💰</button></div>`).join('')}</div></div>
      <div class="sec"><div class="sec-title">장비</div><div class="cards">${s.equips.map((it) => `
        <div class="card row between"><div>${this.equipName(it)} <span class="dim">${this.slotName(it.slot)}</span><br><span class="dim" style="font-size:12px">${this.equipStats(it)}</span></div>
        <button data-act="buy-equip" data-v="${it.uid}">${fmt(it.value * pm)} 💰</button></div>`).join('') || '<div class="dim">매진</div>'}</div></div>
      <div class="sec"><div class="sec-title">스킬 데이터</div><div class="cards">${s.skills.map((id) => { const sk = skillById(id); const own = p.skills.includes(id); return `
        <div class="card row between"><div><b>${sk.name}</b> ${this.elemTag(sk.elem)} ${this.rankTag(sk.rankReq)}<br><span class="dim" style="font-size:12px">${sk.desc} · 정신력 ${sk.mp}</span></div>
        ${own ? '<span class="dim">습득함</span>' : `<button data-act="buy-skill" data-v="${id}" ${sk.rankReq > p.rankIdx ? 'disabled' : ''}>${fmt(sk.price * pm)} 💰</button>`}</div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">보유 장비 판매 (40%)</div><div class="cards">${p.inventory.map((it) => `
        <div class="card row between"><div>${this.equipName(it)} <span class="dim">${this.slotName(it.slot)} · ${this.equipStats(it)}</span></div>
        <button class="sm" data-act="sell" data-v="${it.uid}">${fmt(it.value * 0.4)} 💰 판매</button></div>`).join('') || '<div class="dim">판매할 장비가 없다.</div>'}</div></div>`;
  },

  npcCard(n, here) {
    const pers = persById(n.personality);
    const rel = n.relation;
    const mk = G.monthKey();
    const relBar = `<div class="bar rel ${rel < 0 ? 'neg' : ''}" style="margin:6px 0"><i style="width:${Math.abs(rel)}%"></i></div>`;
    let btns = '';
    if (here && n.alive) {
      btns = `<div class="row">
        <button class="sm" data-act="npc-talk" data-v="${n.id}" ${n.lastTalk === mk ? 'disabled' : ''}>대화</button>
        <button class="sm" data-act="npc-gift" data-v="${n.id}">선물 (${fmt(G.giftCost(n))})</button>
        <button class="sm" data-act="npc-spar" data-v="${n.id}" ${n.lastSpar === mk || n.isCompanion ? 'disabled' : ''}>대련</button>
        ${G.canTeach(n) ? `<button class="sm" data-act="npc-teach" data-v="${n.id}">가르침 (1개월)</button>` : ''}
        ${G.canRecruit(n) ? `<button class="sm primary" data-act="npc-recruit" data-v="${n.id}">동료 제의</button>` : ''}
        ${n.isCompanion ? `<button class="sm" data-act="npc-dismiss">헤어지기</button>` : `<button class="sm danger" data-act="npc-duel" data-v="${n.id}">생사결</button>`}
      </div>`;
    }
    return `<div class="card">
      <div class="row between"><div><b>${n.name}</b> <span class="dim">${n.gender === 'M' ? '남' : '여'} · ${Math.floor(n.ageMonths / 12)}세</span> ${n.isCompanion ? '<span class="tag good">동료</span>' : ''}</div>
      <div>${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)}</div></div>
      <div class="dim" style="font-size:12px;margin-top:4px">성격: ${pers.name} · ${n.guild ? GUILDS[n.guild].name : '무소속'}${!here ? ` · ${n.alive ? regionById(n.region).name : `사망 (${n.death.date}, ${n.death.cause})`}` : ''}</div>
      <div class="row between" style="font-size:12px;margin-top:4px"><span>관계: <b class="${rel < 0 ? 'bad' : rel >= 30 ? 'good' : ''}">${relationLabel(rel)}</b> (${rel})</span>${G.canTeach(n) ? '<span class="good">스승 가능</span>' : ''}</div>
      ${relBar}${btns}</div>`;
  },

  peopleHtml() {
    const here = G.npcsHere().sort((a, b) => b.isCompanion - a.isCompanion || b.relation - a.relation || b.rankIdx - a.rankIdx);
    const known = G.npcs.filter((n) => n.met && (n.region !== G.player.region || !n.alive)).sort((a, b) => b.alive - a.alive || b.relation - a.relation);
    return `<h3>${G.region().name}의 각성자들</h3>
      <p class="dim">대화와 선물로 관계를 쌓으세요. 관계 40 이상이면 상위 등급자에게 가르침을, 60 이상이면 동료 제의를 할 수 있습니다. 관계가 -30 이하면 기습당할 수 있습니다.</p>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${here.map((n) => this.npcCard(n, true)).join('') || '<div class="dim">이 지역엔 아무도 없다.</div>'}</div>
      <div class="sec"><div class="sec-title">알고 지낸 인물</div>
      <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${known.map((n) => this.npcCard(n, false)).join('') || '<div class="dim">다른 지역의 지인이 없다.</div>'}</div></div>`;
  },

  charHtml() {
    const p = G.player; const bg = BACKGROUNDS.find((b) => b.id === p.bg);
    return `<h3>${p.name} <span class="dim" style="font-size:14px">${p.gender === 'M' ? '남' : '여'} · ${G.ageYears()}세 · ${bg.name}</span></h3>
      <div class="sec"><div class="sec-title">선천 특성</div><div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${p.traits.map((id) => { const t = traitById(id); return `<div class="trait"><b>${t.name}</b><br><span class="dim">${t.desc}</span></div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">장착 장비</div><div class="cards">${['weapon', 'armor', 'acc'].map((s) => { const it = p.equip[s]; return `
        <div class="card row between"><div><span class="dim">${this.slotName(s)}</span> ${it ? `${this.equipName(it)}<br><span class="dim" style="font-size:12px">${this.equipStats(it)}</span>` : '<span class="dim">없음</span>'}</div>
        ${it ? `<button class="sm" data-act="unequip" data-v="${s}">해제</button>` : ''}</div>`; }).join('')}</div></div>
      <div class="sec"><div class="sec-title">가방</div><div class="cards">${p.inventory.map((it) => { const cur = p.equip[it.slot]; return `
        <div class="card row between"><div>${this.equipName(it)} <span class="dim">${this.slotName(it.slot)}</span><br><span class="dim" style="font-size:12px">${this.equipStats(it)}${cur ? ` <br>현재: ${this.equipStats(cur)}` : ''}</span></div>
        <button class="sm" data-act="equip" data-v="${it.uid}">장착</button></div>`; }).join('') || '<div class="dim">비어 있다.</div>'}</div></div>
      <div class="sec"><div class="sec-title">소모품</div><div class="cards">${CONSUMABLES.filter((c) => p.items[c.id]).map((c) => `
        <div class="card row between"><div><b>${c.name}</b> ×${p.items[c.id]} <span class="dim">· ${c.desc}</span></div><button class="sm" data-act="use-item" data-v="${c.id}">사용</button></div>`).join('') || '<div class="dim">없음</div>'}</div></div>
      <div class="sec"><div class="sec-title">생애 기록</div><div class="stat-grid">
        <div><span class="dim">공략 게이트</span><b>${p.record.gates}</b></div><div><span class="dim">처치 괴수</span><b>${p.record.kills}</b></div>
        <div><span class="dim">돌파 성공</span><b>${p.record.breakthroughs}</b></div><div><span class="dim">돌파 실패</span><b>${p.record.fails}</b></div>
        <div><span class="dim">생사결 승리</span><b>${p.record.npcKills}</b></div><div><span class="dim">수명 손상</span><b>${p.lifePenalty}년</b></div>
      </div></div>`;
  },

  skillsHtml() {
    const p = G.player;
    return `<h3>스킬</h3><p class="dim">전투에 가져갈 스킬을 최대 4개까지 장착합니다. 기본 타격은 항상 사용 가능합니다. 같은 속성 스킬은 위력 +20%.</p>
      <div class="cards">${p.skills.map((id) => { const sk = skillById(id); const on = p.equipSkills.includes(id); const typ = { dmg: '단일 공격', aoe: '전체 공격', heal: '회복', buff: '공격 강화', shield: '방어 강화' }[sk.type]; return `
        <div class="card row between"><div><b>${sk.name}</b> ${this.elemTag(sk.elem)} <span class="tag">${typ}</span><br>
          <span class="dim" style="font-size:12px">${sk.desc} · 위력 ${sk.power} · 정신력 ${sk.mp}</span></div>
          ${id === 'strike' ? '<span class="dim">기본</span>' : `<button class="sm ${on ? 'primary' : ''}" data-act="toggle-skill" data-v="${id}" ${!on && p.equipSkills.length >= 4 ? 'disabled' : ''}>${on ? '장착 중' : '장착'}</button>`}</div>`; }).join('')}</div>`;
  },

  guildHtml() {
    const p = G.player; const reg = G.region();
    let cur = '';
    if (p.guild) {
      const g = GUILDS[p.guild]; const next = GUILD_RANKS[p.guildRank + 1];
      const home = REGIONS.find((r) => r.guild === p.guild);
      cur = `<div class="card"><h3 style="color:${g.color}">${g.name}</h3><p class="dim">${g.desc}</p>
        <div>직위: <b>${GUILD_RANKS[p.guildRank].name}</b> · 공헌도 ${p.contrib}${next ? ` / ${next.req} (다음: ${next.name})` : ''}</div>
        <div class="dim" style="font-size:12px;margin-top:6px">월급: ${fmt(40 * RANKS[p.rankIdx].mult * (1 + p.guildRank))} 크레딧 · 본부(${home.name})의 상점 20% 할인 · 본부에서 길드 임무 게이트가 열립니다.${p.guild === 'cheongryong' ? ' · 수련 효율 +15%' : ''}</div>
        <div class="row sec"><button class="danger" data-act="guild-leave">탈퇴</button></div></div>`;
    } else if (reg.guild) {
      const g = GUILDS[reg.guild];
      cur = `<div class="card"><h3 style="color:${g.color}">${g.name}</h3><p class="dim">${g.desc}</p>
        <div>가입 조건: 명성 ${g.fameReq} (현재 ${p.fame})</div>
        <div class="row sec"><button class="primary" data-act="guild-join" ${p.fame < g.fameReq ? 'disabled' : ''}>가입 신청</button></div></div>`;
    } else cur = '<p class="dim">이 지역엔 길드 본부가 없다.</p>';
    return `<h3>길드</h3>${cur}
      <div class="sec"><div class="sec-title">5대 세력</div><div class="cards">${Object.entries(GUILDS).map(([id, g]) => { const home = REGIONS.find((r) => r.guild === id); return `
        <div class="card"><b style="color:${g.color}">${g.name}</b> ${this.elemTag(g.elem)} <span class="dim">· 본부 ${home.name} · 명성 ${g.fameReq} 필요</span><br><span class="dim" style="font-size:12px">${g.desc}</span></div>`; }).join('')}</div></div>`;
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
      this.modal(`<h3 class="bad">기습!</h3><p>${n.name}(${G.npcRankLabel(n)})이(가) 살기를 띠고 덤벼든다. "여기서 끝장을 내주마!"</p>
        <div class="row" style="justify-content:flex-end"><button class="danger" data-act="ambush-fight" data-v="${n.id}">맞서 싸운다</button></div>`);
      return;
    }
    if (q.type === 'spar') { const n = G.npcById(q.npcId); if (n && n.alive) this.startSpar(n); else this.processQueue(); }
  },

  showEvent(ev) {
    this.curEvent = ev;
    this.modal(`<h3>사건</h3><p>${ev.text}</p><div class="cards">${ev.choices.map((c, i) => `<button data-act="ev-choice" data-v="${i}" style="text-align:left">${c.text}</button>`).join('')}</div>`);
  },

  lifeSummary() {
    const p = G.player;
    return `<div class="stat-grid sec">
      <div><span class="dim">최종 등급</span><b>${rankLabel(p.rankIdx, p.stage)}</b></div><div><span class="dim">향년</span><b>${G.ageYears()}세</b></div>
      <div><span class="dim">공략 게이트</span><b>${p.record.gates}</b></div><div><span class="dim">처치 괴수</span><b>${p.record.kills}</b></div>
      <div><span class="dim">명성</span><b>${fmt(p.fame)}</b></div><div><span class="dim">재산</span><b>${fmt(p.money)}</b></div>
    </div>`;
  },
  showGameOver() {
    this.modal(`<h2 class="bad">각성자 ${G.player.name}, 잠들다</h2><p>${G.over.date}. ${G.over.reason}</p>${this.lifeSummary()}
      <p class="dim">당신의 이름은 헌터 커뮤니티의 추모 게시판에 오래 남았다.</p>
      <div class="row" style="justify-content:flex-end"><button class="primary" data-act="to-title">타이틀로</button></div>`);
  },
  showVictory() {
    this.modal(`<h2 class="warn">원초의 게이트 봉인</h2><p>심연의 군주가 쓰러지고, 20년간 한반도를 뒤덮었던 에테르 폭풍이 잦아들었다. 사람들은 ${G.player.name}의 이름을 영웅으로 기억할 것이다.</p>${this.lifeSummary()}
      <p class="dim">남은 수명 동안 계속 살아갈 수 있습니다.</p>
      <div class="row" style="justify-content:flex-end"><button class="primary" data-act="modal-close">계속하기</button></div>`);
  },

  // ---------- 전투 ----------
  allyUnits() {
    const units = [G.playerUnit()];
    const c = G.companion();
    if (c) units.push(G.npcUnit(c, 'ally'));
    return units;
  },

  startGate(id) {
    const gate = G.getGates().find((g) => g.id === id);
    if (!gate || gate.cleared) return;
    this.ctx = { kind: 'gate', gate, rooms: G.gateRooms(gate), roomIdx: 0, loot: { money: 0, ether: 0, kills: 0 } };
    this.startRoom();
  },
  startRoom() {
    const c = this.ctx;
    const last = c.roomIdx === c.rooms.length - 1;
    c.combat = new Combat(G, {
      allies: this.allyUnits(), enemies: c.rooms[c.roomIdx], canFlee: !c.gate.final,
      title: `${G.gateName(c.gate)} — ${last ? '보스 구역' : `구역 ${c.roomIdx + 1}`} (${c.roomIdx + 1}/${c.rooms.length})`,
    });
    this.renderCombat();
  },
  startSpar(n) {
    const u = G.npcUnit(n, 'enemy');
    const me = G.playerUnit(); me.hp = me.maxHp; me.mp = me.maxMp; // 대련은 서로 최상의 상태로
    this.ctx = { kind: 'spar', npcId: n.id, combat: new Combat(G, { allies: [me], enemies: [u], canFlee: false, spar: true, title: `${n.name}와(과)의 대련` }) };
    this.renderCombat();
  },
  startDuel(n, ambush) {
    const u = G.npcUnit(n, 'enemy');
    this.ctx = { kind: 'duel', npcId: n.id, combat: new Combat(G, { allies: this.allyUnits(), enemies: [u], canFlee: true, title: `${ambush ? '기습 — ' : ''}${n.name}와(과)의 생사결` }) };
    this.renderCombat();
  },

  renderCombat() {
    const cb = this.ctx.combat;
    const cur = cb.current();
    const unitHtml = (u) => `<div class="unit ${u.side} ${!u.alive ? 'dead' : ''} ${cb.target === u ? 'target' : ''} ${cur === u && !cb.result ? 'turn' : ''}" ${u.side === 'enemy' && u.alive ? `data-act="c-target" data-v="${u.id}"` : ''}>
        <div class="nm"><span>${u.name}</span><span>${this.elemTag(u.elem)}</span></div>
        <div class="row between dim" style="font-size:11px"><span>HP ${Math.max(0, u.hp)} / ${u.maxHp}</span><span>MP ${u.mp}</span></div>
        ${this.bar('hp', u.hp, u.maxHp)}${u.buffs.atkT ? '<span class="tag good">공↑</span>' : ''}${u.buffs.defT ? '<span class="tag good">방↑</span>' : ''}</div>`;
    const allies = cb.units.filter((u) => u.side === 'ally');
    const enemies = cb.units.filter((u) => u.side === 'enemy');
    const p = cb.player;
    let actions = '';
    if (!cb.result) {
      actions = `<div class="skill-btns">${p.skills.map((id) => { const sk = skillById(id); return `<button data-act="c-skill" data-v="${id}" ${sk.mp > p.mp ? 'disabled' : ''}><b>${sk.name}</b><br><span class="dim" style="font-size:11px">${sk.elem ? ELEMENTS[sk.elem].icon : ''} MP ${sk.mp} · ${{ dmg: '단일', aoe: '전체', heal: '회복', buff: '강화', shield: '방어' }[sk.type]}</span></button>`; }).join('')}</div>
        <div class="row sec">
          ${['potion', 'mana'].map((id) => `<button class="sm" data-act="c-item" data-v="${id}" ${!G.player.items[id] ? 'disabled' : ''}>${CONSUMABLES.find((c) => c.id === id).name} ×${G.player.items[id] || 0}</button>`).join('')}
          <span class="grow"></span>
          <button class="sm" data-act="c-auto">${cb.auto ? '자동 중지' : '자동 전투'}</button>
          ${cb.canFlee ? '<button class="sm danger" data-act="c-flee">도주</button>' : ''}
        </div>`;
    } else actions = this.combatResultHtml();
    this.modal(`<div class="row between"><h3 style="margin:0">${cb.title}</h3><span class="dim">${cb.round}라운드</span></div>
      <p class="dim" style="font-size:12px;margin:4px 0 10px">적을 눌러 공격 대상을 지정합니다.</p>
      <div class="combat-field"><div>${allies.map(unitHtml).join('')}</div><div>${enemies.map(unitHtml).join('')}</div></div>
      <div class="clog" id="clog">${cb.log.map((l) => `<div class="${l.cls}">${l.t}</div>`).join('')}</div>
      ${actions}`, true);
    const cl = document.getElementById('clog'); if (cl) cl.scrollTop = cl.scrollHeight;
  },

  combatResultHtml() {
    const c = this.ctx; const cb = c.combat;
    if (c.kind === 'gate') {
      if (cb.result === 'win') {
        if (!c.counted) {
          c.counted = true;
          for (const k of cb.kills) { const r = G.monsterReward(k); c.loot.money += r.money; c.loot.ether += r.ether; c.loot.kills++; }
        }
        const last = c.roomIdx === c.rooms.length - 1;
        return `<div class="card"><b class="good">구역 제압.</b> 누적 보상: ${fmt(c.loot.money)} 크레딧 · 에테르 ${fmt(c.loot.ether)}</div>
          <div class="row sec" style="justify-content:flex-end">${last ? '<button class="primary" data-act="g-finish" data-v="clear">게이트 클리어</button>'
            : `${c.gate.final ? '' : '<button data-act="g-finish" data-v="retreat">철수 (보상 챙기기)</button>'}<button class="primary" data-act="g-next">다음 구역으로</button>`}</div>`;
      }
      if (cb.result === 'flee') return '<div class="row sec" style="justify-content:flex-end"><button data-act="g-finish" data-v="retreat">게이트 밖으로</button></div>';
      return '<div class="row sec" style="justify-content:flex-end"><button class="danger" data-act="g-finish" data-v="lose">의식이 멀어진다...</button></div>';
    }
    return `<div class="row sec" style="justify-content:flex-end"><button class="primary" data-act="c-done">확인</button></div>`;
  },

  combatAction(fn) {
    fn(this.ctx.combat);
    this.renderCombat();
  },

  finishGate(result) {
    const c = this.ctx; const cb = c.combat;
    const lines = G.finishGate(c.gate, result, c.loot, cb.player.hp, cb.player.mp);
    this.ctx = null;
    this.modal(`<h3>${result === 'clear' ? '게이트 공략 완료' : result === 'retreat' ? '철수' : '패배'}</h3>${lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="row" style="justify-content:flex-end"><button class="primary" data-act="modal-close">확인</button></div>`);
    this.renderGame();
  },

  finishPersonalCombat() {
    const c = this.ctx; const cb = c.combat; const n = G.npcById(c.npcId);
    let msg = '';
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
    if (msg) this.toast(msg);
    this.processQueue();
  },

  handle(act, v, el) {
    const c = this.create;
    switch (act) {
      case 'new': return this.startCreate();
      case 'continue': G.load(); this.screen = 'game'; this.tab = 'region'; this.render(); return;
      case 'help': return this.modal(this.helpHtml());
      case 'to-title': this.closeModal(); this.screen = 'title'; this.ctx = null; return this.render();
      case 'to-title-confirm':
        return this.modal(`<h3>타이틀로 돌아갈까요?</h3><p class="dim">진행 상황은 매달 자동 저장됩니다.</p><div class="row" style="justify-content:flex-end"><button data-act="modal-close">취소</button><button class="primary" data-act="to-title">타이틀로</button></div>`);
      case 'modal-close': this.closeModal(); return this.after();
      // 생성
      case 'c-gender': c.gender = v; return this.render();
      case 'c-bg': c.bg = v; return this.render();
      case 'c-elem': c.element = v; return this.render();
      case 'c-roll': if (c.rolls > 0) this.rollCreate(); return this.render();
      case 'c-start': {
        const name = (c.name || '').trim();
        if (!name) return this.toast('이름을 입력하세요.');
        G.newGame({ name, gender: c.gender, bg: c.bg, element: c.element, talent: c.talent, traits: c.traits });
        G.save();
        this.screen = 'game'; this.tab = 'region'; this.selRegion = null;
        this.render();
        return this.modal(`<h3>각성</h3><p>${G.dateStr()}. 평범했던 ${name}의 몸에 처음으로 에테르가 흘렀다.</p><p>관리국의 측정 결과는 <b>F급</b>. 가장 낮은 등급이지만, 당신의 수명은 아직 ${G.maxLife() - G.ageYears()}년이 남아 있다.</p><p class="dim">수련으로 에테르를 모으고, 게이트에서 실전을 쌓으십시오.</p><div class="row" style="justify-content:flex-end"><button class="primary" data-act="modal-close">시작</button></div>`);
      }
      // 게임
      case 'tab': this.tab = v; return this.renderGame();
      case 'sel-region': this.selRegion = v === G.player.region ? null : v; return this.renderGame();
      case 'travel': this.selRegion = null; G.travel(v); return this.after();
      case 'train': G.train(); return this.after();
      case 'rest': G.rest(); return this.after();
      case 'breakthrough': {
        const r = G.breakthrough(); if (!r) return;
        this.renderGame();
        return this.modal(`<h3 class="${r.ok ? 'good' : 'bad'}">${r.ok ? '돌파 성공' : '돌파 실패'}</h3><p>성공률 ${r.chance}%</p><p>${r.msg}</p><div class="row" style="justify-content:flex-end"><button class="primary" data-act="modal-close">확인</button></div>`);
      }
      case 'gate': return this.startGate(v);
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
      case 'npc-spar': { const n = G.npcById(+v); if (n) this.startSpar(n); return; }
      case 'npc-duel': {
        const n = G.npcById(+v);
        return this.modal(`<h3 class="bad">생사결</h3><p>${n.name}(${G.npcRankLabel(n)})에게 목숨을 건 결투를 신청합니다. 패배하면 <b>죽습니다</b>. 선량한 인물을 해치면 명성이 크게 떨어집니다.</p>
          <div class="row" style="justify-content:flex-end"><button data-act="modal-close">취소</button><button class="danger" data-act="duel-go" data-v="${n.id}">결투한다</button></div>`);
      }
      case 'duel-go': { const n = G.npcById(+v); G.changeRel(n, -40); n.met = true; return this.startDuel(n, false); }
      case 'ambush-fight': { const n = G.npcById(+v); return this.startDuel(n, true); }
      case 'ev-choice': {
        const ch = this.curEvent.choices[+v];
        const res = ch.effect(G);
        G.recalc(); G.player.fame = Math.max(0, G.player.fame); G.save();
        this.renderGame();
        // 대련 등 새 큐가 생기면 바로 진행
        return this.modal(`<h3>사건</h3><p>${res}</p><div class="row" style="justify-content:flex-end"><button class="primary" data-act="modal-close">확인</button></div>`);
      }
      // 전투
      case 'c-skill': return this.combatAction((cb) => cb.playerSkill(v));
      case 'c-item': return this.combatAction((cb) => cb.playerItem(v));
      case 'c-flee': return this.combatAction((cb) => cb.playerFlee());
      case 'c-auto': return this.combatAction((cb) => cb.toggleAuto());
      case 'c-target': return this.combatAction((cb) => cb.setTarget(v));
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
  UI.handle(el.dataset.act, el.dataset.v, el);
});

UI.render();
