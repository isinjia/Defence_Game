// ===== 게이트 크로니클: 전투 배치 고정 (영역 A, 사용자 요청) =====
// 1. 아군 초상화 둘레의 고리는 필살 게이지가 아니라 "턴(행동) 게이지". 필살은 초상화 뒤 오라(50%부터 빛, 100% 불꽃)로만 보인다.
//    상태·버프 줄은 비어 있어도 자리를 차지해, 버프가 붙었다 떨어져도 초상화가 움직이지 않는다.
// 2. 적은 보이지 않는 칸(4칸 × 2줄)에 선다. 소환·분열·쓰러짐이 있어도 다른 적의 자리와 정렬은 바뀌지 않는다.
//    큰 괴수(보스·골렘·용 등)는 두 칸을 쓴다. 새로 나오는 적은 빈 칸에 크기가 맞아야 나올 수 있고, 자리가 없으면 소환·분열이 되지 않는다.
// 3. 아군 소환 스킬에는 소환 최대 수가 있다(skill.summonMax). 넘게 부르면 가장 오래된 소환체가 사라지고 새로 나온다.
// 4. 스킬 버튼의 "오더" 표시는 스킬 이름 오른쪽에 붙는다.

const FOE_COLS = 4, FOE_ROWS = 2;
const FOE_ORDER = [1, 2, 0, 3]; // 가운데 칸부터 채운다
const FOE_ROW_ORDER = [1, 0];   // 아군과 가까운 아랫줄부터, 넘치면 윗줄
const ALLY_COLS = 5;

// ---------- 3. 소환 최대 수 ----------
for (const s of SKILLS) if (s.type === 'summon' && s.summonMax == null) s.summonMax = s.rankReq >= 5 ? 3 : s.rankReq >= 2 ? 2 : 1;

Object.assign(Combat.prototype, {
  // 적 한 마리가 쓰는 칸 수
  foeWidth(u) { let b = 1; try { b = UI.monBody ? UI.monBody(u) : 1; } catch (e) { b = 1; } return u.boss || b >= 1.25 ? 2 : 1; },
  // 지금 쓰이고 있는 칸 (살아 있는 적)
  foeGrid() {
    const g = Array.from({ length: FOE_ROWS }, () => Array(FOE_COLS).fill(null));
    for (const u of this.units) {
      if (u.side !== 'enemy' || !u.alive || u.fled || !u.slot) continue;
      for (let k = 0; k < u.slot.w; k++) if (g[u.slot.r] && u.slot.c + k < FOE_COLS) g[u.slot.r][u.slot.c + k] = u;
    }
    return g;
  },
  // w칸짜리가 들어갈 빈 자리 (near: 이 칸 가까이부터)
  foeFreeSlot(w, near) {
    const g = this.foeGrid(); const out = [];
    for (const r of FOE_ROW_ORDER) for (const c of FOE_ORDER) {
      if (c + w > FOE_COLS) continue;
      let ok = true; for (let k = 0; k < w; k++) if (g[r][c + k]) ok = false;
      if (ok) out.push({ r, c, w });
    }
    if (w === 2 && !out.length) return null;
    if (!out.length) return null;
    if (near) out.sort((a, b) => (Math.abs(a.r - near.r) * 3 + Math.abs(a.c - near.c)) - (Math.abs(b.r - near.r) * 3 + Math.abs(b.c - near.c)));
    return out[0];
  },
  foeAssign(u, near) {
    if (u.slot) return true;
    let w = this.foeWidth(u);
    let s = this.foeFreeSlot(w, near); if (!s && w === 2) { w = 1; s = this.foeFreeSlot(1, near); }
    if (!s) return false;
    u.slot = s;
    return true;
  },
  foeAssignAll() { for (const u of this.units) if (u.side === 'enemy' && u.alive && !u.slot) this.foeAssign(u); },
});

{
  const C = Combat.prototype;
  // 새 적은 빈 칸이 있어야 나온다. 없으면 소환·분열이 일어나지 않는다.
  const baseSpawn = C.monSpawn;
  if (baseSpawn) C.monSpawn = function (u, ...a) {
    this.foeAssignAll();
    const su = baseSpawn.call(this, u, ...a);
    if (su && su.side === 'enemy') {
      const near = u && u.slot ? u.slot : null;
      // 분열로 쓰러진 본체의 자리는 조각이 쓴다
      if (!this.foeAssign(su, near)) { const i = this.units.indexOf(su); if (i >= 0) this.units.splice(i, 1); su._noRoom = true; su.alive = false; }
    }
    return su;
  };
  // 자리가 없어 나오지 못한 것은 기록도 남기지 않는다
  const basePush = C.push;
  C.push = function (t, cls, ev) {
    if (ev && ev.k === 'summon' && ev.dst != null && !this.units.some((x) => x.id === ev.dst)) return;
    return basePush.call(this, t, cls, ev);
  };

  // 아군 소환: 최대 수를 넘으면 가장 오래된 소환체가 사라지고 새로 나온다
  const baseUse = C.useSkill;
  C.useSkill = function (u, skill, target) {
    if (!skill || skill.type !== 'summon' || !u || u.side !== 'ally') return baseUse.call(this, u, skill, target);
    const max = Math.max(1, skill.summonMax || 1);
    const mine = () => this.units.filter((f) => f.summonOf === u.id && f.alive);
    let own = mine();
    while (own.length >= max) {
      const old = own[0]; old.alive = false; old.hp = 0; old.vanished = true;
      this.push(`${old.name}이(가) 돌아가고 새 소환체가 나온다.`, '', { k: 'vanish', dst: old.id });
      own = mine();
    }
    // 기본 처리는 둘까지만 허용하므로, 셋째를 부를 때는 잠깐 가려 둔다
    const hide = own.slice(0, Math.max(0, own.length - 1)); for (const h of hide) h.summonOf = null;
    try { return baseUse.call(this, u, skill, target); } finally { for (const h of hide) h.summonOf = u.id; }
  };
}

// ---------- 화면 ----------
{
  // 2. 적 칸 배치
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const c = this.ctx; const cb = c && c.combat;
    if (cb && cb.units && cb.foeAssignAll) { try { cb.foeAssignAll(); } catch (e) { /* 무시 */ } }
    const r = baseRefresh.apply(this, a);
    try {
      const fz = document.getElementById('foes'); if (!fz || !cb || !cb.units) return r;
      fz.classList.add('foe-grid');
      for (const u of cb.units) {
        if (u.side !== 'enemy') continue;
        const el = document.getElementById('u-' + u.id); if (!el) continue;
        const s = u.slot;
        if (s) { const col = `${s.c + 1} / span ${s.w}`; if (el.style.gridColumn !== col) el.style.gridColumn = col; const row = String(s.r + 1); if (el.style.gridRow !== row) el.style.gridRow = row; el.dataset.w = s.w; }
        // 쓰러진 적의 그림은 그 칸에 새 적이 "화면에 등장한 뒤"에 치운다 (등장 전에는 쓰러지는 연출이 보여야 한다)
        const taken = s && (!u.alive || u.fled) && cb.units.some((x) => x !== u && x.side === 'enemy' && x.alive && !x._pendingSpawn && x.slot && x.slot.r === s.r && x.slot.c < s.c + s.w && s.c < x.slot.c + x.slot.w);
        el.classList.toggle('slot-freed', !!taken || (!s && !u.alive));
      }
      // 아군도 줄마다 보이지 않는 5칸: 소환체가 나오거나 사라져도 다른 사람의 자리는 그대로
      for (const row of document.querySelectorAll('#allies-front, #allies-back, #allies.allies')) {
        const els = [...row.children].filter((e) => e.classList.contains('ally'));
        if (!els.length) continue;
        row.classList.add('ally-grid');
        const unitOf = (e) => cb.units.find((x) => 'u-' + x.id === e.id);
        const members = els.filter((e) => { const u = unitOf(e); return u && !u.summon; });
        const used = new Set();
        // 사람은 가운데부터 차례로 (한 번 정한 자리는 바꾸지 않는다)
        const startCol = Math.max(0, Math.floor((ALLY_COLS - members.length) / 2));
        members.forEach((e, i) => { const u = unitOf(e); if (u.acol == null || u._arow !== row.id) { u.acol = Math.min(ALLY_COLS - 1, startCol + i); u._arow = row.id; } used.add(u.acol); });
        for (const e of els) {
          const u = unitOf(e); if (!u) continue;
          if (u.summon) {
            const gone = !u.alive;
            e.classList.toggle('slot-freed', gone && !e.classList.contains('vanishing'));
            if (gone) { u.acol = null; continue; }
            if (u.acol == null || u._arow !== row.id) {
              // 빈 칸 가운데 사람들과 가장 가까운 곳
              const free = [...Array(ALLY_COLS).keys()].filter((k) => !used.has(k) && !els.some((o) => { const x = unitOf(o); return x && x !== u && x.summon && x.alive && x._arow === row.id && x.acol === k; }));
              const mid = (ALLY_COLS - 1) / 2; free.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
              u.acol = free.length ? free[0] : ALLY_COLS - 1; u._arow = row.id;
            }
          }
          const col = String(u.acol + 1); if (e.style.gridColumn !== col) e.style.gridColumn = col;
          if (e.style.gridRow !== '1') e.style.gridRow = '1';
        }
      }
      // 상태·버프 줄은 늘 자리를 차지한다 (CSS). 고리는 턴 게이지 (아래 drawTurnRing)
      this.drawTurnRing();
    } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ }
    return r;
  };

  // 1. 고리 = 턴 게이지
  UI.drawTurnRing = function () {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.units) return;
    for (const u of cb.units) {
      if (u.side !== 'ally' || u.summon) continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const au = el.querySelector('.fx-host > .ult-aura'); if (!au) continue;
      const v = !u.alive ? 0 : cb.waiting && u.isPlayer ? 1 : Math.max(0, Math.min(1, (u.atb || 0) / 100));
      const k = Math.round(v * 200);
      if (au._tk !== k) { au._tk = k; au.style.setProperty('--atb', v.toFixed(3)); au.classList.toggle('turn-ready', v >= 1); }
    }
  };
  const baseGauges = UI.drawGauges;
  UI.drawGauges = function (...a) { const r = baseGauges.apply(this, a); try { this.drawTurnRing(); } catch (e) { /* 무시 */ } return r; };

  // 4. 스킬 버튼의 오더 표시는 이름 오른쪽에
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try {
      for (const b of document.querySelectorAll('#cb-ctrl .skill-btn.ordered')) {
        if (b.querySelector('.order-chip')) continue;
        const nm = b.querySelector('b'); if (nm) nm.insertAdjacentHTML('beforeend', ' <i class="order-chip">오더</i>');
      }
      for (const b of document.querySelectorAll('#cb-ctrl .cmd-main .cmd.ordered')) if (!b.querySelector('.order-chip')) b.insertAdjacentHTML('beforeend', ' <i class="order-chip">오더</i>');
    } catch (e) { /* 무시 */ }
    return r;
  };
}

// ---------- 헌터 ID 카드 발급: 시험 리더의 연락처 이야기는 발급 전에 대화로 (사용자 요청) ----------
{
  const baseNotice = UI.showNotice;
  if (baseNotice) UI.showNotice = function (...a) {
    // 카드 화면 아래에 이어 붙던 리더 문구는 뺀다
    if (this._judgeTail) this._judgeTail = this._judgeTail.replace(/<p[^>]*>[^<]*시험 리더였던[^<]*<\/p>/g, '');
    const L = G.npcs.filter((n) => n.examLeader && n.alive).pop();
    const f = G.flags || (G.flags = {});
    if (!L || f.leaderContact || !this.talk) return baseNotice.apply(this, a);
    f.leaderContact = true;
    const pers = L.personality;
    const line = pers === 'cold' ? '번호 줘. 쓸 만한 신입은 기억해 두는 편이야.' : pers === 'warlike' ? '야, 번호 찍어. 다음에 제대로 한번 붙어 보자고.' : pers === 'greedy' ? '연락처 하나 받아 둘까? 좋은 건 있으면 서로 돕는 거지.' : pers === 'just' ? '오늘 잘해 줬어. 무슨 일 있으면 연락해. 선임이 그러라고 있는 거니까.' : '고생했어. 연락처 교환하자. 곤란한 일 생기면 꼭 연락하고.';
    this.closeModal();
    this.talk([
      { narr: '통지서를 받으러 가는 길, 시험을 이끌었던 선임이 복도에서 불러 세운다.' },
      { who: L, text: line },
      { narr: `선임 ${L.name}의 연락처를 받았다. 인물 창에서 다시 만날 수 있다.` },
    ], () => baseNotice.apply(this, a));
  };
}

// ---------- 내 차례가 올 때 밀린 연출 먼저 재생 (사용자 제보: 커맨드를 누르니 적이 먼저 공격하는 것처럼 보임) ----------
// 내 차례가 시작될 때 생긴 기록(화상 피해, 리더의 오더 대사, 직전 행동의 남은 연출 등)이 재생되지 않고 남아 있다가,
// 내가 커맨드를 누른 뒤에야 내 행동보다 먼저 나왔다. 차례가 오면 밀린 기록을 바로 재생하고, 끝난 뒤에 입력을 받는다.
{
  const base = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = base.apply(this, a);
    try {
      const c = this.ctx; const cb = c && c.combat;
      if (cb && cb.units && cb.waiting && !cb.result && !c.playing && !cb.auto && cb.log.length > (c.played || 0) && !this._flushing) {
        this._flushing = true;
        try { this.play(); } finally { this._flushing = false; }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
