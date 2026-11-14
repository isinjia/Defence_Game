// ===== 게이트 크로니클: 연계 기연 단서 · 목적지 자동 이동 =====
// 연계 기연의 한 단계가 끝나면 다음 단계의 장소·조건이 의뢰 창 "기연 단서"에 남는다.
// 조건이 맞는 상태로 그 장소에 들어가면 확률 없이 다음 단계가 열린다.
// 조건이 갖춰진 뒤 3년 안에 찾아가지 않으면 단서는 사라지고 갈래는 닫힌다.
// 단서·의뢰·목표 줄의 [이동]을 누르면 목적지까지 알아서 걷는다(길 위 사건은 그대로 일어난다).

const CLUE_YEARS = 3;
// 다음 단계 단서 문구 (갈래 → 단계 → 문구)
const CHAIN_CLUES = {
  cult: { 1: '전단의 주소는 어느 도시 안의 폐업한 예식장 지하다. 도시에 들어가면 찾아갈 수 있다.', 2: '균열교가 다음 보름에 스스로 문을 열겠다고 했다. 날이 다가온다.', 3: '사라진 교주 무명이 아직 어딘가에서 당신을 지켜보고 있다.' },
  family: { 1: '사진 뒷면의 제보: 강릉 해안 전선에서 이 사람을 봤다.', 2: '기억을 잃은 헌터가 부산 암시장으로 넘겨졌다고 한다.', 3: '되찾은 혈육 곁을 지키며 기억이 돌아오기를 기다린다.' },
  voice: { 1: '대전 청룡 연구소 지하 기록 보관소에 대붕괴 직전의 기록이 있다고 한다.', 2: '실험 기록은 인천 관리국 본청 기밀 서버로 이어진다.', 3: '대붕괴를 겪은 누군가가 당신을 찾고 있다.', 4: '꿈속의 목소리가 한라산 정상, 원초의 게이트로 부른다.' },
  subject: { 1: '7번과 만나기로 했다. 약속한 날이 다가온다.', 2: '청소부의 쪽지에 울산 해안 폐조선소 좌표가 적혀 있었다.', 3: '연구소 쪽에서 곧 연락이 올 것 같다.' },
  pocha: { 1: '단골 포차 사장님에게 사연이 있는 듯하다. 도시에 들르면 만날 수 있다.', 2: '사장님의 지난 싸움이 아직 끝나지 않은 것 같다.', 3: '포차가 다시 문을 열 날을 기다린다. 도시에 들르면 소식을 들을 수 있다.' },
  nuri: { 1: '드론을 살리려면 도시의 공방 기술자에게 보여야 한다. 코어 3개가 필요하다.', 2: '누리가 조금씩 말을 배우고 있다.', 3: '누리의 기억이 돌아오고 있다.' },
  smuggle: { 1: '부산 3번 부두에서 오징어가 다음 일을 기다리고 있다.', 2: '부산 앞바다 요트에서 \'최회장\'이 직접 보자고 한다.', 3: '부산 암시장의 주인 자리가 비었다.' },
  baekho: { 1: '강남에서 백호 가문 후계자의 경호를 맡고 있다.', 2: '암살의 배후가 백호 가문 안에 있다. 강남으로 돌아가야 한다.' },
};

Object.assign(Game.prototype, {
  chainStepEv(ch, step) { return STORY.find((e) => e.chain === ch && e.step === step); },
  // 다음 단계가 장소에 묶여 있는지 (지역·도시 안·도시 도착)
  clueWhere(ev) {
    if (!ev) return null;
    if (ev.region) return { region: Array.isArray(ev.region) ? ev.region[0] : ev.region };
    if (ev.city || ev.trigger === 'city') return { city: true };
    if (ev.field) return { field: true };
    return null;
  },
  clueSet(ch) {
    const f = this.flags; f.clues ??= {};
    const st = f.chains[ch] || 0;
    const ev = st > 0 && st < 99 ? this.chainStepEv(ch, st) : null;
    if (!ev) { delete f.clues[ch]; return; }
    f.clues[ch] = { step: st, at: this.monthKey(), since: null };
  },
  // 위치를 뺀 조건(등급·나이·간격·특수 조건)이 갖춰졌는가
  clueReadyBut(ev) {
    const p = this.player;
    if (ev.minRank != null && p.rankIdx < ev.minRank) return false;
    if (ev.minAge != null && this.ageYears() < ev.minAge) return false;
    if (this.monthKey() - (this.flags.chainAt[ev.chain] || 0) < (ev.gap ?? 2)) return false;
    return true;
  },
  clueQueued(ev) { return this.queue.some((q) => q.type === 'story' && q.id === ev.id); },
  clueFire(ev) {
    if (this.clueQueued(ev)) return true;
    const c = {}; if (ev.npc) c.npc = this.storyNpc(ev.npc);
    if (!this.storyEligible(ev, c)) return false;
    this.queue.push({ type: 'story', id: ev.id, npc: c.npc ? c.npc.id : null });
    return true;
  },
  // 도시에 들어섰을 때: 장소에 묶인 다음 단계를 확률 없이 연다 (한 번에 하나)
  clueArrive() {
    const cl = this.flags.clues; if (!cl || !this.onCity()) return;
    for (const ch of Object.keys(cl)) {
      const ev = this.chainStepEv(ch, cl[ch].step); const w = this.clueWhere(ev);
      if (!w || w.field) continue;
      if (w.region && w.region !== this.player.region) continue;
      if (this.clueFire(ev)) return;
    }
  },
  // 매달: 기한 계산, 장소 없는 단계는 간격이 차면 보장, 지금 그 지역에 머무는 중이면 보장
  clueMonthly() {
    const f = this.flags; const cl = f.clues; if (!cl) return;
    const mk = this.monthKey(); let fired = false;
    for (const ch of Object.keys(cl)) {
      const k = cl[ch];
      if ((f.chains[ch] || 0) !== k.step) { this.clueSet(ch); continue; }
      const ev = this.chainStepEv(ch, k.step);
      if (!ev) { delete cl[ch]; continue; }
      if (k.since == null && this.clueReadyBut(ev)) k.since = mk;
      if (k.since != null && mk - k.since > CLUE_YEARS * 12) {
        delete cl[ch]; this.chainEnd(ch);
        this.log(`기연 [${CHAIN_NAMES[ch] || ch}]의 단서가 끊겼다. 이야기는 당신 없이 흘러갔다.`, 'bad');
        continue;
      }
      if (fired || k.since == null) continue;
      const w = this.clueWhere(ev);
      if (!w) { if (mk - (f.chainAt[ch] || 0) >= (ev.gap ?? 2) + 2) fired = this.clueFire(ev); }
      else if (w.region && w.region === this.player.region && this.onCity()) fired = this.clueFire(ev);
    }
  },
  // 의뢰 창 표시용
  clueList() {
    const cl = this.flags.clues || {}; const out = [];
    for (const ch of Object.keys(cl)) {
      const k = cl[ch]; const ev = this.chainStepEv(ch, k.step); if (!ev) continue;
      const w = this.clueWhere(ev); const cond = [];
      if (w && w.region) cond.push(regionById(w.region).name);
      else if (w && w.city) cond.push('아무 도시 안');
      else if (w && w.field) cond.push('도시 밖');
      else cond.push('때가 되면 찾아온다');
      if (ev.minRank != null && this.player.rankIdx < ev.minRank) cond.push(`${RANKS[ev.minRank].key}급 이상 필요`);
      const left = k.since != null ? CLUE_YEARS * 12 - (this.monthKey() - k.since) : null;
      out.push({ ch, name: CHAIN_NAMES[ch] || ch, text: (CHAIN_CLUES[ch] || {})[k.step] || '이야기는 아직 끝나지 않았다.', cond: cond.join(' · '), left, region: w && w.region });
    }
    return out;
  },
});

// 단계가 바뀌면 단서 갱신
(() => {
  const P = Game.prototype;
  const baseNext = P.chainNext, baseSet = P.chainSet, baseEnd = P.chainEnd;
  P.chainNext = function (id) { baseNext.call(this, id); this.clueSet(id); };
  P.chainSet = function (id, step) { baseSet.call(this, id, step); this.clueSet(id); };
  P.chainEnd = function (id) { baseEnd.call(this, id); if (this.flags.clues) delete this.flags.clues[id]; };
  // 옛 저장: 진행 중인 갈래에 단서를 채운다
  const baseInit = P.initSandbox;
  P.initSandbox = function () {
    baseInit.call(this);
    if (!this.flags.clues) {
      this.flags.clues = {};
      for (const ch of Object.keys(this.flags.chains)) { const st = this.flags.chains[ch]; if (st > 0 && st < 99) this.clueSet(ch); }
    }
  };
  // 도시 도착
  const baseQE = P.questEvent;
  P.questEvent = function (kind, data) { baseQE.call(this, kind, data); if (kind === 'arrive') this.clueArrive(); };
  const baseTransit = P.transit;
  P.transit = function (regionId) { const before = this.player.region; const r = baseTransit.call(this, regionId); if (this.player.region === regionId && before !== regionId) this.clueArrive(); return r; };
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () { baseMonthly.call(this); this.clueMonthly(); };
  // 이미 대기 중인 사건은 다시 뽑지 않는다
  const basePick = P.pickStory;
  P.pickStory = function (trigger) {
    const r = basePick.call(this, trigger);
    if (r && this.queue.some((q) => q.type === 'story' && q.id === r.id)) return null;
    return r;
  };
})();

// ---------- 자동 이동 ----------
Object.assign(UI, {
  // 목적지까지 경로와 예상 일수
  travelPlan(x, y) {
    const p = G.player;
    if (!WORLD.inb(x, y)) return { err: '갈 수 없는 곳이다.' };
    const reg = WORLD.regionAt(x, y);
    if (reg && reg.id === 'jeju' && !G.canJeju()) return { err: '제주는 관리국 공인 S급만 출입할 수 있다.' };
    const rd = WORLD.reach(p.x, p.y, 1e6, G.canJeju());
    const path = WORLD.pathTo(rd, WORLD.idx(x, y));
    if (!path) return { err: '육로로 닿을 수 없는 곳이다.' };
    const steps = path.slice(1);
    let days = 0; let px = p.x, py = p.y; const regs = new Set(); let mobs = 0;
    for (const i of steps) {
      const [sx, sy] = WORLD.xy(i); const diag = sx !== px && sy !== py;
      days += G.travelStepDays(sx, sy, diag);
      const r = WORLD.regionAt(sx, sy); if (r) regs.add(r.id);
      px = sx; py = sy;
    }
    const near = new Set();
    for (const m of G.mobs) for (const i of steps) { const [sx, sy] = WORLD.xy(i); if (Math.max(Math.abs(m.x - sx), Math.abs(m.y - sy)) <= 1) { near.add(m); break; } }
    for (const m of near) if (m.tier > p.rankIdx) mobs++;
    const danger = [...regs].map(regionById).filter((r) => r && r.danger > p.rankIdx + 2);
    return { steps, days, regs: [...regs], near: near.size, strongMobs: mobs, danger };
  },
  travelConfirm(x, y, label) {
    const plan = this.travelPlan(x, y);
    if (plan.err) return this.toast(plan.err);
    if (!plan.steps.length) return this.toast('이미 도착해 있다.');
    const p = G.player; const dest = WORLD.cityAt(x, y);
    const canTransit = dest && G.onCity() && p.visited.includes(dest.id) && dest.id !== p.region;
    const warn = [];
    if (plan.danger.length) warn.push(`<span class="bad">위험 지역을 지난다: ${plan.danger.map((r) => r.name).join(', ')}</span>`);
    if (plan.strongMobs) warn.push(`<span class="bad">경로 근처에 나보다 강한 괴수 무리 ${plan.strongMobs}개</span>`);
    else if (plan.near) warn.push(`경로 근처 괴수 무리 ${plan.near}개`);
    this.modal(`<h3>${label}(으)로 이동</h3>
      <p>이동 예상 <b>${WORLD.formatTravelTime(plan.days)}</b> · ${plan.steps.length}칸</p>
      <p class="small dim">지나는 지역: ${plan.regs.map((id) => regionById(id).name).join(' → ')}</p>
      ${warn.length ? `<p class="small">${warn.join('<br>')}</p>` : ''}
      <p class="small dim">걷는 동안에도 날짜가 흐르고, 길 위 사건·기습·만남이 생기면 멈춘다. 멈추면 지도 위 [이어서 이동]으로 계속 갈 수 있다.</p>
      <div class="row end"><button class="ghost" data-act="modal-close">그만둔다</button>
      ${canTransit ? `<button data-act="transit" data-v="${dest.id}">고속 이동망 · ${fmt(G.transitCost(dest.id))} 크레딧 · 2일</button>` : ''}
      <button class="primary" data-act="travel-go" data-v="${x},${y},${encodeURIComponent(label)}">출발한다</button></div>`);
  },
  travelStart(x, y, label) {
    if (!this.map || this.walking || G.over || !G.canAct()) return;
    const plan = this.travelPlan(x, y);
    if (plan.err) { this.travel = null; return this.toast(plan.err); }
    if (!plan.steps.length) { this.travel = null; return this.toast('도착했다.'); }
    this.travel = { x, y, label };
    this.closeModal();
    if (this.screen !== 'game') return;
    // 먼 길은 빠르게 걷는다
    const m = this.map;
    if (!m._baseTween) m._baseTween = m.tween;
    const k = FX.reduced ? 0.15 : plan.steps.length > 12 ? 0.4 : 0.7;
    m.tween = function (from, to, ms, done) { return m._baseTween.call(this, from, to, ms * k, done); };
    this.walk(plan.steps);
  },
  travelDaysLeft() {
    const t = this.travel; if (!t) return 0;
    const plan = this.travelPlan(t.x, t.y);
    return plan.err ? 0 : plan.days;
  },
  // 지역 이름으로 목적지 (그 지역의 도시)
  travelRegion(id) { const [x, y] = WORLD.cityPos[id]; return this.travelConfirm(x, y, regionById(id).name); },
  questTarget(q) {
    if (q.status === 'done' && q.kind === 'bounty') return q.from;
    if (q.type === 'courier') return q.dest;
    if (q.region) return q.region;
    if (q.target != null) { const n = G.npcById(q.target); return n && n.alive ? n.region : null; }
    if (q.npc != null) { const n = G.npcById(q.npc); return n && n.alive ? n.region : null; }
    return q.from || null;
  },
  goBtn(region) {
    if (!region || (region === G.player.region && G.onCity())) return '';
    if (region === 'jeju' && !G.canJeju()) return '<button class="sm ghost" disabled title="관리국 공인 S급만 출입">제주 불가</button>';
    return `<button class="sm" data-act="travel-region" data-v="${region}">이동</button>`;
  },
});

(() => {
  const baseQuests = UI.questsHtml;
  UI.questsHtml = function () {
    const html = baseQuests.call(this);
    const list = G.clueList();
    // 진행 중인 일 줄마다 [이동] 버튼
    const p = G.player;
    let i = 0;
    const withGo = html.replace(/<div class="item-row([^"]*)"><div class="grow"><b>([\s\S]*?)<\/div><\/div><\/div>/g, (m) => {
      const q = p.quests[i++]; if (!q) return m;
      const btn = this.goBtn(this.questTarget(q));
      return btn ? m.slice(0, -6) + btn + '</div>' : m;
    });
    if (!list.length) return withGo;
    const rows = list.map((c) => `<div class="item-row"><div class="grow"><b>${c.name}</b><div class="small">${c.text}</div><div class="small dim">${c.cond}${c.left != null ? ` · 단서 기한 ${Math.max(0, c.left)}개월` : ''}</div></div>${this.goBtn(c.region)}</div>`).join('');
    return `<div class="panel"><h3>기연 단서</h3><p class="dim small">이어지는 이야기의 실마리. 조건을 갖추고 그 장소에 들어가면 다음 이야기가 바로 열린다. 조건을 갖춘 뒤 ${CLUE_YEARS}년이 지나면 단서는 사라진다.</p><div class="cards">${rows}</div></div>` + withGo;
  };

  // 목표 줄: 이어서 이동 칩, 게이트·괴수에 [이동]
  const baseObj = UI.hudObjective;
  UI.hudObjective = function () {
    let html = baseObj.call(this);
    const t = this.travel;
    if (t && !this.walking) {
      const d = this.travelDaysLeft();
      if (d) html = html.replace('<div class="obj-goal">', `<button class="obj-link travel-chip" data-act="travel-resume">▶ 이어서 이동 · ${t.label}까지 ${WORLD.formatTravelTime(d)}</button><div class="obj-goal">`);
    }
    return html.replace(/<button class="obj-link" data-act="focus" data-v="(\d+),(\d+)">[\s\S]*?<\/button>/g, (m, x, y) => `<div class="obj-row">${m}<button class="obj-go" data-act="travel-xy" data-v="${x},${y}">이동</button></div>`);
  };

  const baseEnd = UI.endWalk;
  UI.endWalk = function () {
    if (this.map && this.map._baseTween) { this.map.tween = this.map._baseTween; delete this.map._baseTween; }
    const t = this.travel; const p = G.player;
    if (t && p.x === t.x && p.y === t.y) this.travel = null;
    return baseEnd.call(this);
  };
  // 지도에서 다른 곳을 누르면 목적지를 지운다 (걷는 중 누르면 멈추기만)
  const baseTap = UI.onTap;
  UI.onTap = function (x, y) {
    if (!this.walking && this.travel && !this.modalOpen() && !this.ctx) { this.travel = null; this.renderHud && this.renderHud(); }
    return baseTap.call(this, x, y);
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'travel-region': return this.travelRegion(v);
      case 'travel-xy': { const [x, y] = v.split(',').map(Number); const o = G.objAt(x, y); return this.travelConfirm(x, y, o ? (o.kind === 'gate' ? G.gateName(o) : `${o.name} 무리`) : '목적지'); }
      case 'travel-go': { const [x, y, l] = v.split(','); return this.travelStart(+x, +y, decodeURIComponent(l || '목적지')); }
      case 'travel-resume': { const t = this.travel; if (t) return this.travelStart(t.x, t.y, t.label); return; }
      default: return baseHandle.call(this, act, v);
    }
  };
})();
