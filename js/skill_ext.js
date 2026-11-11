// ===== 게이트 크로니클: 직업 스킬 확장 — 성향·깨달음·돈오·신 (영역 A, 사용자 확정 기획 · docs/스킬_깨달음_신_기획.md) =====
// 직업당 18개 = 등급 액티브 8 · 빛의 깨달음 2 · 어둠의 깨달음 2 · 직업 패시브 4(돈오) · 신의 가호 2
//  - 등급 액티브: 기존 F·D·A + 새 E·C·B·S·SS. 승급하면 자동으로 익힌다.
//  - 빛·어둠 깨달음: 내가 한 일(16가지 행적)로 깨닫는다. 첫째 E급, 둘째 C급부터. 한쪽 둘을 다 얻으면 반대쪽은 닫힌다.
//  - 성향(선·중립·악): 행적으로 움직인다. 수치는 숨기고 기색으로만 보인다.
//  - 돈오: 심득이 보이지 않게 쌓이고, 고요한 순간에 오성(재능)만큼의 확률로 깨닫는다. 화두 두 갈래 중 하나를 골라 직업 패시브가 된다. 폐관수련.
//  - 신(js/skill_gods.js): 행적과 특별한 일이 겹칠 때 드물게 신이 나를 고른다. 선은 빛의 신, 악은 어둠의 신, 중립은 양쪽. 평생 하나.
//  - 패시브(돈오·신의 가호)는 장착해야 효과가 있고, 액티브와 같은 칸을 쓴다.
const EXT_RANK = [1, 3, 4, 6, 7];      // E C B S SS
const EXT_LEARN_RANK = [1, 3];          // 깨달음 첫째 E급, 둘째 C급
const EXT_RANK_POW = 0.88;              // 새 등급 기술 위력 보정: 밸런스 시뮬에서 플레이어 성장이 빨라져 12% 낮춘다(공격 기술만)
const DONO_NEED = [40, 120, 260, 480];  // 돈오 단계별 필요한 심득
const DONO = {};                         // DONO[cls][tier] = { scene, a: { text, id }, b: { text, id } }

// 16가지 행적: 빛 8 · 어둠 8. align = 성향이 움직이는 양
const DEED = {
  guard: { side: 'light', name: '수호', hint: '한 전투에서 동료를 여러 번 지켜 내고 이길 때', need: 1, align: 4, line: '등 뒤의 동료들이 무사하다. 지키는 손이 무엇을 할 수 있는지 알았다.' },
  neardeath: { side: 'light', name: '불굴', hint: '체력 15% 이하로 버텨 이길 때', need: 1, align: 2, line: '쓰러지기 직전, 무릎이 꺾이지 않았다. 그 순간 몸이 길을 기억했다.' },
  mercy: { side: 'light', name: '자비', hint: '생사결에서 이긴 상대를 두 번 풀어줄 때', need: 2, align: 8, line: '칼을 거둔 손이 오히려 무거워졌다. 베지 않는 힘이 거기 있었다.' },
  explore: { side: 'light', name: '개척', hint: '탐사 지점 열 곳을 밟을 때', need: 10, align: 1, line: '지도에 없던 길을 걸어왔다. 아무도 가지 않은 곳에서 무언가를 보았다.' },
  mastery: { side: 'light', name: '극의', hint: '직업 기술 하나를 각성(Lv5)시킬 때', need: 1, align: 1, line: '수없이 반복한 동작이 어느 날 저절로 흘러나왔다. 그 너머가 보인다.' },
  duty: { side: 'light', name: '사명', hint: '게이트 다섯 곳을 공략할 때', need: 5, align: 2, line: '닫힌 게이트들의 침묵이 쌓였다. 누군가는 해야 하는 일이고, 그게 나였다.' },
  savior: { side: 'light', name: '구원', hint: '게이트 브레이크에서 도시를 지켜 낼 때', need: 1, align: 10, line: '무너지던 거리에서 사람들이 고개를 들었다. 그 눈빛이 손끝에 남았다.' },
  loyalty: { side: 'light', name: '의리', hint: '동료가 쓰러진 싸움을 끝내 이겨 살려 낼 때', need: 1, align: 6, line: '쓰러진 동료를 두고 물러서지 않았다. 함께 돌아가는 길이 힘이 되었다.' },
  execute: { side: 'dark', name: '처형', hint: '생사결에서 누군가의 숨통을 끊을 때', need: 1, align: -12, line: '숨이 끊어지는 순간, 칼끝에서 무언가를 배웠다. 되돌릴 수 없는 것이었다.' },
  plunder: { side: 'dark', name: '약탈', hint: '생사결에서 두 번 빼앗을 때', need: 2, align: -8, line: '남의 것이 손에 들어오는 감촉. 힘은 그렇게 쓰는 것이라고 무언가가 속삭였다.' },
  taboo: { side: 'dark', name: '금기', hint: '균열교 제단의 금지된 문양을 해독할 때', need: 2, align: -10, line: '문양이 눈 안쪽에 새겨졌다. 알아서는 안 되는 것을 알아 버렸다.' },
  bloodlust: { side: 'dark', name: '피의 굶주림', hint: '흡혈 기술로 적 열을 마무리할 때', need: 10, align: -1, line: '피가 혀끝에 닿을 때마다 몸이 가벼워진다. 더, 더 원한다.' },
  betray: { side: 'dark', name: '배신', hint: '아는 사이를 생사결에서 해치거나 털어갈 때', need: 1, align: -15, line: '믿던 얼굴이 일그러지는 것을 보았다. 그 뒤로 무엇도 아프지 않았다.' },
  infamy: { side: 'dark', name: '악명', hint: '죄를 거듭 지어 악명이 높아질 때', need: 4, align: -5, line: '사람들이 이름을 낮춰 부른다. 두려움도 힘이 된다는 것을 알았다.' },
  hunt: { side: 'dark', name: '사냥', hint: '나보다 낮은 등급 헌터를 생사결에서 세 번 꺾을 때', need: 3, align: -6, line: '약한 것이 무릎 꿇는 소리. 사냥꾼의 눈이 떠졌다.' },
  abandon: { side: 'dark', name: '유기', hint: '동료가 쓰러진 싸움에서 혼자 달아나 살아남을 때', need: 1, align: -8, line: '등 뒤에서 이름을 부르는 소리를 듣지 않기로 했다. 살아남은 것은 나였다.' },
};
const EXT_TRIG = DEED; // 옛 이름 호환

// ---------- 1. 등록 ----------
{
  const add = (o) => { if (!SKILLS.some((k) => k.id === o.id)) SKILLS.push(o); };
  const act = (e, id, cls, extra) => {
    const x = e[6] || {};
    return { id, name: e[0], type: e[1], power: e[2], mp: e[3], desc: e[4], elem: e[5] || null, price: 0, cls, ...extra, ...(x.trig ? { trig: x.trig } : {}) };
  };
  for (const x of SKILL_EXT) {
    const c = x.cls; if (!CLASSES.some((k) => k.id === c)) continue;
    const ATK = ['dmg', 'crit', 'pierce', 'multi', 'dot', 'stun', 'drain', 'aoe'];
    (x.rank || []).forEach((e, i) => { const o = act(e, `cls_${c}_r${i}`, c, { rankReq: EXT_RANK[i] }); if (ATK.includes(o.type)) o.power = Math.round(o.power * EXT_RANK_POW * 100) / 100; add(o); });
    (x.light || []).forEach((e, i) => add(act(e, `cls_${c}_L${i}`, c, { rankReq: 99, learn: 'light', learnIdx: i, minRank: EXT_LEARN_RANK[i] })));
    (x.dark || []).forEach((e, i) => add(act(e, `cls_${c}_D${i}`, c, { rankReq: 99, learn: 'dark', learnIdx: i, minRank: EXT_LEARN_RANK[i], hpCost: (e[6] && e[6].hpCost) || 0.08 })));
    (x.dono || []).forEach((d, t) => {
      DONO[c] ??= [];
      const one = (br) => { const v = d[br]; if (!v) return null; const id = `cls_${c}_n${t}${br}`; add({ id, name: v[1], type: 'passive', pv: v[2] || {}, power: 0, mp: 0, desc: v[3], elem: null, price: 0, cls: c, rankReq: 99, learn: 'dono', tier: t, branch: br }); return { text: v[0], id }; };
      DONO[c][t] = { scene: d.scene, a: one('a'), b: one('b') };
    });
  }
  if (typeof TYPE_NAME !== 'undefined') TYPE_NAME.passive = '패시브';
}
const isPassive = (id) => { const s = typeof id === 'string' ? skillById(id) : id; return !!(s && s.type === 'passive'); };

// ---------- 2. 성향·행적·깨달음 ----------
{
  const GP = Game.prototype;
  const ALIGN_LINE = {
    light: ['손이 조금 더 따뜻해진 것 같다.', '누군가를 지킨 밤은 잠이 깊다.'],
    dark: ['손에 묻은 피가 예전만큼 무겁지 않다.', '거울 속 눈빛이 낯설다.'],
  };
  GP.alignKind = function () { const a = (this.player && this.player.align) || 0; return a >= 30 ? 'good' : a <= -30 ? 'evil' : 'neutral'; };
  GP.alignText = function () {
    const a = (this.player && this.player.align) || 0;
    if (a >= 70) return '빛이 깊다. 등 뒤를 맡기고 싶은 사람이라는 말을 듣는다.';
    if (a >= 30) return '선에 기울었다.';
    if (a <= -70) return '어둠이 짙다. 사람들이 눈을 피한다.';
    if (a <= -30) return '어둠에 기울었다.';
    return '어느 쪽에도 서지 않았다.';
  };
  GP.alignMove = function (d) {
    const p = this.player; if (!p || !d) return;
    const before = this.alignKind(); p.align = Math.max(-100, Math.min(100, (p.align || 0) + d)); const after = this.alignKind();
    if (before !== after) { const side = d > 0 ? 'light' : 'dark'; this.queue.push({ type: 'toast', text: `${RNG.pick(ALIGN_LINE[side])} (${this.alignText()})` }); }
  };
  // 행적 하나: 기록·성향·깨달음 판정·신의 시선(ctx: 그 일의 무게)
  GP.deed = function (k, n = 1, ctx = {}) {
    const p = this.player; const D = DEED[k]; if (!p || !D || this.over) return;
    p.deeds ??= {}; p.deeds[k] = (p.deeds[k] || 0) + n;
    this.alignMove(D.align * n);
    try { this.extCheck(); } catch (e) { /* 무시 */ }
    try { if (this.godNotice) this.godNotice(k, ctx); } catch (e) { /* 무시 */ }
  };
  GP.deedAdd = function (k, n) { return this.deed(k, n); }; // 옛 이름
  GP.trigMet = function (t) {
    const p = this.player; const d = p.deeds || {}; const T = DEED[t]; if (!T) return false;
    if (t === 'mastery') return SKILLS.some((s) => s.cls === p.cls && p.skills.includes(s.id) && this.skillLv && this.skillLv(s.id) >= 5);
    if (t === 'taboo') return Math.max(d.taboo || 0, p.cultFavor || 0) >= T.need;
    if (t === 'infamy') return Math.max(d.infamy || 0, p.sins || 0) >= T.need;
    if (t === 'explore') return Math.max(d.explore || 0, (this.sites ? this.sites().filter((s) => s.used || s.visited).length : 0)) >= T.need;
    return (d[t] || 0) >= T.need;
  };
  GP.extLocked = function (sk) { const c = this.player.creed; return !!(c && (sk.learn === 'light' || sk.learn === 'dark') && sk.learn !== c); };
  GP.extCheck = function () {
    const p = this.player; if (!p || !p.cls || this.over) return [];
    const got = [];
    for (const sk of SKILLS) {
      if (sk.cls !== p.cls || (sk.learn !== 'light' && sk.learn !== 'dark') || p.skills.includes(sk.id) || this.extLocked(sk)) continue;
      if (p.rankIdx < (sk.minRank || 0) || !this.trigMet(sk.trig)) continue;
      if (sk.learnIdx === 1 && !p.skills.includes(`cls_${p.cls}_${sk.learn === 'light' ? 'L' : 'D'}0`)) continue;
      p.skills.push(sk.id); got.push(sk.id);
      if (sk.learn === 'dark' && this.addSin) this.addSin(1, '어둠의 깨달음');
      if (this.lifeEvent) this.lifeEvent(`${sk.learn === 'light' ? '빛' : '어둠'}의 깨달음 — [${sk.name}]`);
    }
    for (const side of ['light', 'dark']) {
      const k = side === 'light' ? 'L' : 'D';
      if (!p.creed && p.skills.includes(`cls_${p.cls}_${k}0`) && p.skills.includes(`cls_${p.cls}_${k}1`)) { p.creed = side; got.lockedOther = side; }
    }
    for (const id of got) if (!this.queue.some((q) => q.type === 'epiphany' && q.id === id)) this.queue.push({ type: 'epiphany', id, lock: got.lockedOther || null });
    return got;
  };

  // --- 행적의 계기 ---
  const baseResolve = GP.duelResolve;
  if (baseResolve) GP.duelResolve = function (choice, ...a) {
    const d = this.world && this.world.duelPending; const n = d && this.npcById(d.id); const p = this.player;
    const r = baseResolve.call(this, choice, ...a);
    try {
      const ctx = { foe: n, strong: n && n.rankIdx > p.rankIdx, witnesses: d && d.witnesses ? d.witnesses.length : 0 };
      if (choice === 'spare') this.deed('mercy', 1, ctx);
      if (choice === 'kill') this.deed('execute', 1, ctx);
      if (choice === 'rob') this.deed('plunder', 1, ctx);
      if (n && (n.relation || 0) >= 30 && choice !== 'spare') this.deed('betray', 1, ctx);
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseFinishDuel = GP.finishDuel;
  if (baseFinishDuel) GP.finishDuel = function (n, won, ...a) {
    const r = baseFinishDuel.call(this, n, won, ...a);
    try { if (won && n && (n.rankIdx || 0) < this.player.rankIdx) this.deed('hunt', 1, { foe: n }); } catch (e) { /* 무시 */ }
    return r;
  };
  const baseGate = GP.finishGate;
  GP.finishGate = function (gate, result, ...a) {
    const r = baseGate.call(this, gate, result, ...a);
    try { if (result === 'clear') { if (gate && gate.breakCity) this.deed('savior', 1, { big: true, boss: true }); this.deed('duty', 1, { boss: true, strong: gate && gate.tier > this.player.rankIdx }); } } catch (e) { /* 무시 */ }
    return r;
  };
  const baseSin = GP.addSin;
  if (baseSin) GP.addSin = function (n, why, ...a) { const r = baseSin.call(this, n, why, ...a); try { if (why !== '어둠의 깨달음') { this.player.deeds ??= {}; this.player.deeds.infamy = (this.player.deeds.infamy || 0) + n; if (this.godNotice) this.godNotice('infamy', {}); this.extCheck(); } } catch (e) { /* 무시 */ } return r; };
  const baseSite = GP.siteAct;
  if (baseSite) GP.siteAct = function (id, ...a) {
    const s = this.siteById && this.siteById(id); const was = s && (s.used || s.visited); const cult = this.player.cultFavor || 0;
    const r = baseSite.call(this, id, ...a);
    try {
      if (s && !was && (s.used || s.visited)) this.deed('explore', 1, {});
      if ((this.player.cultFavor || 0) > cult) this.deed('taboo', 1, { big: s && s.kind === 'altar' });
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 승급: 등급 기술은 자동, 패시브는 장착하지 않는다. 옛 저장은 처음 열 때 채운다.
  const baseGrant = GP.grantClassSkills;
  GP.grantClassSkills = function (...a) {
    const before = new Set(this.player.equipSkills);
    const r = baseGrant.apply(this, a);
    const p = this.player; p.equipSkills = p.equipSkills.filter((id) => before.has(id) || !isPassive(id));
    try { this.extCheck(); } catch (e) { /* 무시 */ }
    return r;
  };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) {
    const r = baseInit.apply(this, a);
    try { const p = this.player; if (p) { p.deeds ??= {}; p.align ??= 0; p.dono ??= { heart: 0, got: [] }; if (p.cls) this.grantClassSkills(); } } catch (e) { /* 무시 */ }
    return r;
  };
  // 전투 유닛: 패시브는 명령 목록에서 빼고 효과로만 쓴다
  const basePU = GP.playerUnit;
  GP.playerUnit = function (...a) {
    const u = basePU.apply(this, a);
    u.passives = (u.skills || []).filter(isPassive); u.skills = (u.skills || []).filter((id) => !isPassive(id));
    return u;
  };
  // NPC: 등급만큼 직업 기술 · 등급과 재능만큼 돈오 패시브(갈래는 성격) · C급 이상은 성격에 따라 깨달음 하나 둘
  const DARKISH = ['warlike', 'greedy', 'cold'];
  const hash = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const baseNU = GP.npcUnit;
  GP.npcUnit = function (n, side) {
    const u = baseNU.call(this, n, side); if (!n) return u;
    const cls = n.cls || 'swordsman'; const rk = n.rankIdx || 0;
    u.skills = (u.skills || []).filter((id) => !isPassive(id) && !(skillById(id) || {}).learn);
    const nDono = Math.max(0, Math.min(4, Math.floor(rk * 0.45 + (n.talent || 3) * 0.12)));
    const tiers = DONO[cls] || [];
    u.passives = [];
    for (let t = 0; t < Math.min(nDono, tiers.length); t++) { const br = (hash(n.id + ':' + t) + (DARKISH.includes(n.personality) ? 1 : 0)) % 2 ? 'b' : 'a'; const x = tiers[t] && (tiers[t][br] || tiers[t].a); if (x) u.passives.push(x.id); }
    if (rk >= 3) {
      const k = DARKISH.includes(n.personality) ? 'D' : 'L';
      for (let i = 0; i < (rk >= 5 ? 2 : 1); i++) { const id = `cls_${cls}_${k}${i}`; if (SKILLS.some((s) => s.id === id)) u.skills.push(id); }
    }
    if (this.godPassivesOf) u.passives.push(...this.godPassivesOf(n));
    return u;
  };
}

// ---------- 3. 돈오 · 폐관수련 ----------
{
  const GP = Game.prototype;
  const talentF = (g) => 0.6 + Math.max(1, g.player.talent || 3) * 0.1; // 오성: 재능 1 → 0.7배, 9 → 1.5배
  GP.donoState = function () { return (this.player.dono ??= { heart: 0, got: [] }); };
  GP.donoTier = function () { return this.donoState().got.length; };
  GP.heartAdd = function (v) {
    const p = this.player; if (!p || !p.cls) return;
    const S = this.donoState(); if (S.got.length >= 4) return;
    S.heart = Math.round((S.heart + v * talentF(this)) * 10) / 10;
  };
  GP.donoReady = function () { const S = this.donoState(); const t = S.got.length; return t < 4 && !!(DONO[this.player.cls] || [])[t] && S.heart >= DONO_NEED[t]; };
  // 고요한 순간: 수련·휴식·대련 패배 뒤·고비 뒤. bonus: 특수 수련지 등
  GP.donoMoment = function (bonus = 0) {
    if (!this.donoReady() || this.queue.some((q) => q.type === 'dono')) return false;
    const p = this.player; const chance = Math.min(0.95, 0.25 + Math.max(1, p.talent || 3) * 0.05 + bonus);
    if (!RNG.chance(chance)) return false;
    this.queue.push({ type: 'dono', tier: this.donoTier() }); return true;
  };
  GP.donoPick = function (br) {
    const p = this.player; const S = this.donoState(); const t = S.got.length; const D = (DONO[p.cls] || [])[t];
    if (!D || !D[br] || S.heart < DONO_NEED[t]) return '';
    S.heart -= DONO_NEED[t]; S.got.push(D[br].id); if (!p.skills.includes(D[br].id)) p.skills.push(D[br].id);
    const sk = skillById(D[br].id); if (this.lifeEvent) this.lifeEvent(`돈오 — [${sk.name}]`);
    this.save(); return sk.name;
  };
  // 심득의 계기
  const C = Combat.prototype;
  const baseEnd = C.checkEnd;
  C.checkEnd = function (...a) {
    const had = this.result; const r = baseEnd.apply(this, a);
    try {
      if (!had && this.result && typeof G !== 'undefined' && G.player && this.player) {
        const p = this.player; const g = G.player;
        const foes = this.units.filter((x) => x.side === 'enemy' && !x.summon);
        const strong = foes.some((f) => f.boss || (f.tier != null && f.tier > g.rankIdx) || (f.npcId != null && (G.npcById(f.npcId) || {}).rankIdx > g.rankIdx));
        const allies = this.units.filter((x) => x.side === 'ally' && !x.summon && !x.isPlayer);
        const elder = allies.some((x) => x.npcId != null && (G.npcById(x.npcId) || {}).rankIdx > g.rankIdx);
        const downAlly = allies.some((x) => !x.alive);
        if (this.result === 'win') {
          if (p.alive && p.hp <= p.maxHp * 0.15) { G.deed('neardeath', 1, { strong, boss: foes.some((f) => f.boss), solo: !allies.length }); G.heartAdd(10); G._afterCrisis = true; }
          if ((this._guardUses || 0) >= 3 && allies.length) G.deed('guard', 1, { strong, boss: foes.some((f) => f.boss) });
          if (downAlly) G.deed('loyalty', 1, { strong, boss: foes.some((f) => f.boss) });
          if (strong) G.heartAdd(6);
          if (elder) G.heartAdd(3);
        }
        if (this.result === 'lose' && strong) { G.heartAdd(12); G._afterCrisis = true; }
        if (this.result === 'flee' && downAlly) G.deed('abandon', 1, { strong });
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 직업 기술을 쓸 때
  const baseUse = GP.skillUse;
  if (baseUse) GP.skillUse = function (id) { const r = baseUse.call(this, id); try { const s = skillById(id); if (s && s.cls === this.player.cls) this.heartAdd(1); } catch (e) { /* 무시 */ } return r; };
  // 대련에서 고수에게 지면
  const baseDuel = GP.finishDuel;
  if (baseDuel) GP.finishDuel = function (n, won, ...a) {
    const r = baseDuel.call(this, n, won, ...a);
    try { if (n && n.rankIdx > this.player.rankIdx) { this.heartAdd(won ? 8 : 14); if (!won) this.donoMoment(0.15); } } catch (e) { /* 무시 */ }
    return r;
  };
  // 수련·휴식: 고요한 순간
  const quiet = (name, heart, bonusFn) => {
    const base = GP[name]; if (!base) return;
    GP[name] = function (...a) {
      const spot = this.trainSpotHere ? this.trainSpotHere() : null;
      const r = base.apply(this, a);
      try {
        this.heartAdd(heart + (spot ? 8 : 0));
        const bonus = (spot ? 0.2 : 0) + (this._afterCrisis ? 0.15 : 0) + (bonusFn ? bonusFn.call(this) : 0);
        this._afterCrisis = false;
        this.donoMoment(bonus);
      } catch (e) { /* 무시 */ }
      return r;
    };
  };
  quiet('train', 3); quiet('rest', 1); quiet('trainAt', 4); quiet('restAt', 1);
  // 폐관수련: 수련 지점에서 1~3개월 들어앉는다
  // 경고·차단 판정은 D 영역 함수(메인 장·팀 일정)를 쓴다
  GP.seclusionBlock = function () {
    const p = this.player;
    if (p.crew && p.crew.on === true) return '팀 일이 진행 중이다. 일이 끝난 뒤에 들어앉을 수 있다.';
    if (p.lead && (p.lead.state === 'called' || p.lead.state === 'on')) return '팀을 이끌고 있는 중이다. 팀에 자유 시간을 준 뒤에 들어앉을 수 있다.';
    return null;
  };
  GP.seclusionWarn = function (months) {
    const p = this.player; const out = [];
    const now = this.monthKey() * 30 + this.day; const end = now + months * 30;
    if (p.crew && typeof p.crew.due === 'number' && p.crew.due < end) out.push('팀 합류 기한을 넘기게 된다. 지각 불이익을 받는다.');
    try {
      const def = this.mainChapter && this.mainChapter();
      const left = def && this.mainLeft ? this.mainLeft(def) : null;
      if (left != null && left <= months) out.push(`메인 ${def.n}장 「${def.title}」이(가) 그사이 지나가 버릴 수 있다.`);
      const pl = this.mainPartLeft ? this.mainPartLeft() : null;
      if (pl != null && pl <= months && !(left != null && left <= months)) out.push('메인 이야기의 마감이 그사이 지나갈 수 있다.');
    } catch (e) { /* 무시 */ }
    if (p.injured > 0) out.push('다친 몸으로는 심득이 덜 쌓인다.');
    return out;
  };
  GP.seclusion = function (months) {
    const p = this.player; if (!this.canAct()) return '';
    const spot = this.trainSpotHere ? this.trainSpotHere() : null; if (!spot) return '폐관수련은 수련 지점에서만 할 수 있다.';
    const blk = this.seclusionBlock(); if (blk) return blk;
    months = Math.max(1, Math.min(3, months | 0));
    let ether = 0;
    for (let i = 0; i < months && !this.over; i++) {
      const g = this.trainGain(1.2); this.addEther(g); ether += g;
      this.heartAdd(45 * (p.injured > 0 ? 0.6 : 1));
      this.advanceMonth(1, { eventChance: 0.05 });
    }
    this.log(`${months}개월간 폐관수련을 했다. 에테르 +${fmt(ether)}`);
    const hit = this.donoMoment(0.25 + months * 0.12);
    this.save();
    return `${months}개월 동안 바깥과 연을 끊고 수련했다. 에테르 +${fmt(ether)}.${hit ? '' : this.donoReady() ? ' 무언가 손에 잡힐 듯하다가 흩어졌다.' : ' 가슴속에 무언가 맺혀 간다.'}`;
  };
}

// ---------- 4. 패시브 효과 ----------
{
  const C = Combat.prototype;
  const pv = (u) => {
    if (!u) return null; if (u._pv !== undefined) return u._pv;
    const o = {};
    for (const id of u.passives || []) {
      const v = typeof G !== 'undefined' && G.godPv && String(id).startsWith('god_') ? G.godPv(id, u) : (skillById(id) || {}).pv;
      if (v) for (const [k, x] of Object.entries(v)) o[k] = (o[k] || 0) + x;
    }
    u._pv = Object.keys(o).length ? o : null; return u._pv;
  };
  C.pvOf = pv;
  const basePrep = C.prep;
  C.prep = function (u) {
    const r = basePrep.call(this, u); const o = pv(r);
    if (o) {
      const up = (k, f) => { if (o[f]) r[k] = Math.max(1, Math.round(r[k] * (1 + o[f]))); };
      up('atk', 'atk'); up('def', 'def'); up('spd', 'spd'); up('luck', 'luck');
      if (o.hp) { const m = Math.max(0.3, 1 + o.hp); r.maxHp = Math.round(r.maxHp * m); r.hp = Math.min(r.maxHp, Math.round(r.hp * m)); }
      if (o.mp) { const m = 1 + o.mp; r.maxMp = Math.round(r.maxMp * m); r.mp = Math.round(r.mp * m); }
      if (o.startAtk) { r.buffs.atk = Math.max(r.buffs.atk, o.startAtk); r.buffs.atkT = 3; }
      if (o.startDef) { r.buffs.def = Math.max(r.buffs.def, o.startDef); r.buffs.defT = 3; }
    }
    return r;
  };
  const auraOnce = (cb) => {
    if (cb._auraDone) return; cb._auraDone = true;
    for (const side of ['ally', 'enemy']) {
      const us = cb.units.filter((x) => x.side === side);
      let a = 0, d = 0, foeDef = 0; for (const x of us) { const o = pv(x); if (o) { a += o.partyAtk || 0; d += o.partyDef || 0; foeDef += o.foeDefDown || 0; } }
      for (const x of us) { x._auraAtk = Math.min(0.3, a); x._auraDef = Math.min(0.3, d); }
      if (foeDef) for (const x of cb.units.filter((y) => y.side !== side)) x._auraBrk = Math.min(0.3, (x._auraBrk || 0) + foeDef);
    }
  };
  const baseCalc = C.calcDamage;
  C.calcDamage = function (att, def, skill, opt = {}) {
    auraOnce(this);
    const oa = pv(att) || {}; const od = pv(def) || {};
    if (oa.crit) opt = { ...opt, crit: (opt.crit || 0) + oa.crit };
    const r = baseCalc.call(this, att, def, skill, opt);
    let m = 1;
    if (att._auraAtk && !oa.noAura) m *= 1 + att._auraAtk;
    if (def._auraDef) m *= 1 - def._auraDef * 0.8;
    if (def._auraBrk) m *= 1 + def._auraBrk;
    if (oa.firstHit && !att._hitOnce) m *= 1 + oa.firstHit;
    if (oa.vsHealthy && def.hp >= def.maxHp * 0.5) m *= 1 + oa.vsHealthy;
    if (oa.vsWeak && def.hp < def.maxHp * 0.5) m *= 1 + oa.vsWeak;
    if (oa.vsStrong && (def.boss || def.atk > att.atk)) m *= 1 + oa.vsStrong;
    if (oa.lowHpAtk && att.hp <= att.maxHp * 0.3) m *= 1 + oa.lowHpAtk;
    if (oa.elemUp && r.elem) m *= 1 + oa.elemUp;
    if (oa.skillUp && skill && skill.id !== 'strike') m *= 1 + oa.skillUp;
    if (oa.strikeUp && skill && skill.id === 'strike') m *= 1 + oa.strikeUp;
    if (oa.critDmg && r.note.includes('치명타')) m *= 1 + oa.critDmg / 1.6;
    if (oa.soloAtk && this.units.filter((x) => x.side === att.side && x.alive && !x.summon).length <= 1) m *= 1 + oa.soloAtk;
    if (oa.pairAtk && this.units.filter((x) => x.side === att.side && x.alive && !x.summon).length >= 3) m *= 1 + oa.pairAtk;
    if (att._killStack) m *= 1 + att._killStack;
    if (od.dmgCut) m *= 1 - Math.min(0.5, od.dmgCut);
    if (od.dmgTaken) m *= 1 + od.dmgTaken;
    if (od.lowHpDef && def.hp <= def.maxHp * 0.3) m *= 1 - Math.min(0.6, od.lowHpDef);
    r.dmg = Math.max(1, Math.round(r.dmg * m));
    if (od.guts && !def._gutsUsed && def.hp - r.dmg <= 0 && def.hp > 1) { def._gutsUsed = true; r.dmg = def.hp - 1; r.note += ' 버텼다!'; }
    return r;
  };
  const baseDeal = C.dealDamage;
  C.dealDamage = function (att, def, skill, opt = {}) {
    const od = pv(def);
    if (od && od.evade && def.alive && Math.random() < od.evade) { this.push(`${def.name}이(가) ${skill.name}을(를) 흘려 냈다!`, '', { k: 'miss', dst: def.id }); return 0; }
    const d = baseDeal.call(this, att, def, skill, opt);
    try {
      if (d > 0) att._hitOnce = true;
      const oa = pv(att);
      if (d > 0 && oa && oa.lifesteal && att.alive) { const h = Math.max(1, Math.round(d * oa.lifesteal)); att.hp = Math.min(att.maxHp, att.hp + h); }
      if (d > 0 && od && od.counter && def.alive && att.alive && att.side !== def.side && !this._countering && Math.random() < od.counter) {
        this._countering = true; this.push(`${def.name}의 반격!`, def.side === 'ally' ? 'hit' : 'hurt');
        try { baseDeal.call(this, def, att, skillById('strike')); } finally { this._countering = false; }
      }
    } catch (e) { /* 무시 */ }
    return d;
  };
  const baseDown = C.down;
  C.down = function (u) {
    const k = u && u.lastHitBy != null ? this.units.find((x) => x.id === u.lastHitBy) : null;
    const r = baseDown.call(this, u);
    try {
      const o = pv(k); if (k && o && o.killStack) k._killStack = Math.min(o.killStack * 3, (k._killStack || 0) + o.killStack);
      if (k && o && o.killHeal && k.alive) k.hp = Math.min(k.maxHp, k.hp + Math.round(k.maxHp * o.killHeal));
      if (k && k.isPlayer && u.side !== k.side && k._lastType === 'drain' && typeof G !== 'undefined') G.deed('bloodlust', 1, {});
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseTurn = C.takeTurn;
  C.takeTurn = function (u) {
    const o = pv(u);
    if (o && u.alive) {
      if (o.hpRegen && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + Math.max(1, Math.round(u.maxHp * o.hpRegen)));
      if (o.hpDrain && u.hp > 1) u.hp = Math.max(1, u.hp - Math.max(1, Math.round(u.maxHp * o.hpDrain)));
      if (o.mpRegen && u.mp < u.maxMp) u.mp = Math.min(u.maxMp, u.mp + Math.max(1, Math.round(u.maxMp * o.mpRegen)));
    }
    return baseTurn.call(this, u);
  };
  const baseUse = C.useSkill;
  C.useSkill = function (u, skill, target) {
    const o = pv(u) || {};
    if (skill && o.mpCut && skill.mp) skill = { ...skill, mp: Math.max(0, Math.round(skill.mp * (1 - Math.min(0.5, o.mpCut)))) };
    if (u) u._lastType = skill && skill.type;
    if (skill && skill.hpCost && u && u.alive) {
      const cost = Math.max(1, Math.round(u.maxHp * skill.hpCost * (1 - Math.min(0.8, o.hpCostCut || 0))));
      u.hp = Math.max(1, u.hp - cost);
      this.push(`${u.name}이(가) 제 피를 대가로 바쳤다. (체력 −${cost})`, 'hurt', { k: 'note', dst: u.id });
    }
    if (u && u.isPlayer && skill && ['taunt', 'shield_all', 'heal_ally', 'heal_all', 'revive', 'shield'].includes(skill.type)) this._guardUses = (this._guardUses || 0) + 1;
    const before = this.units.length;
    this._healer = u;
    let r;
    try { r = baseUse.call(this, u, skill, target); } finally { this._healer = null; }
    try {
      if (o.dotUp && skill && skill.type === 'dot' && target && target.poison) target.poison.dmg = Math.round(target.poison.dmg * (1 + o.dotUp));
      if (o.stunUp && skill && skill.type === 'stun' && target && target.alive && !target.stun && Math.random() < o.stunUp * (target.boss ? 0.5 : 1)) { target.stun = 1; this.push(`${target.name}이(가) 기절했다!`, 'hit', { k: 'note', dst: target.id }); }
      if (o.summonUp && this.units.length > before) for (const s of this.units.slice(before)) if (s.summon && s.summonOf === u.id) { s.maxHp = Math.round(s.maxHp * (1 + o.summonUp)); s.hp = s.maxHp; s.atk = Math.round(s.atk * (1 + o.summonUp)); }
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseHeal = C.healUnit;
  C.healUnit = function (u, v, by) {
    const o = pv(this._healer); const ou = pv(u);
    let m = 1; if (o && o.healUp) m *= 1 + o.healUp; if (ou && ou.healTaken) m *= 1 + ou.healTaken;
    return baseHeal.call(this, u, v * m, by);
  };
}

// ---------- 5. 화면 ----------
if (typeof UI !== 'undefined') {
  const PV_NAME = { atk: '공격', def: '방어', hp: '체력', mp: '정신력', spd: '속도', luck: '운', crit: '치명 확률', critDmg: '치명 피해', firstHit: '첫 공격 피해', vsHealthy: '체력 많은 적에게 피해', vsWeak: '체력 적은 적에게 피해', vsStrong: '강한 적에게 피해', lowHpAtk: '위기 때 피해', lowHpDef: '위기 때 받는 피해 감소', dmgCut: '받는 피해 감소', dmgTaken: '받는 피해', elemUp: '속성 피해', skillUp: '기술 피해', strikeUp: '기본 공격 피해', lifesteal: '흡혈', killStack: '처치마다 공격', killHeal: '처치마다 체력 회복', hpRegen: '차례마다 체력 회복', hpDrain: '차례마다 체력 잃음', mpRegen: '차례마다 정신력 회복', healUp: '치유량', healTaken: '받는 치유', evade: '회피', counter: '반격', startAtk: '시작 공격', startDef: '시작 방어', partyAtk: '아군 공격', partyDef: '아군 방어', foeDefDown: '적 방어 하락', summonUp: '소환수', dotUp: '중독 피해', stunUp: '기절 확률', mpCut: '정신력 소모 감소', hpCostCut: '어둠 대가 감소', soloAtk: '홀로일 때 피해', pairAtk: '동료와 함께일 때 피해', noAura: '아군 공격 오라 못 받음', guts: '한 번 버티기' };
  UI.pvText = function (o) { return Object.entries(o || {}).map(([k, v]) => (k === 'guts' || k === 'noAura' ? PV_NAME[k] : `${PV_NAME[k] || k} ${v < 0 ? '−' : '+'}${Math.round(Math.abs(v) * 100)}%`)).join(' · '); };
  UI.passiveText = function (sk) { return this.pvText(sk.pv); };
  // 깨달음(빛·어둠)
  UI.epiphanyShow = function (q) {
    const sk = skillById(q.id); if (!sk) return this.processQueue();
    const light = sk.learn === 'light'; const T = sk.trig && DEED[sk.trig];
    this.modal(`<div class="epiphany ${light ? 'light' : 'dark'}"><div class="eyebrow">${light ? '빛의 깨달음' : '어둠의 깨달음'}${T ? ` · ${T.name}` : ''}</div>
      <h3>${sk.name}</h3>${T ? `<p class="event-text">${T.line}</p>` : ''}
      <div class="ep-card"><b>액티브 · ${TYPE_NAME[sk.type] || ''}</b><span>${sk.desc}</span><span class="small dim">위력 ${sk.power} · 정신력 ${sk.mp}${sk.hpCost ? ` · 쓸 때 체력 ${Math.round(sk.hpCost * 100)}%` : ''}</span></div>
      ${q.lock ? `<p class="small ${light ? 'ok' : 'bad'}">${light ? '빛' : '어둠'}의 길을 끝까지 걸었다. 이제 ${light ? '어둠' : '빛'}의 깨달음은 영영 닫혔다.</p>` : ''}
      <p class="small dim">스킬 화면에서 장착할 수 있다.</p>
      <div class="row end"><button class="primary" data-act="modal-close">받아들인다</button></div></div>`, 'event-box');
  };
  // 돈오: 화두
  UI.donoShow = function () {
    const p = G.player; const t = G.donoTier(); const D = (DONO[p.cls] || [])[t]; if (!D || !G.donoReady()) return this.processQueue();
    const opt = (br) => { const x = D[br]; const sk = x && skillById(x.id); if (!sk) return ''; return `<button class="choice-btn dono-opt" data-act="dono-pick" data-v="${br}"><span class="dono-say">${x.text}</span><span class="dono-res"><b>${sk.name}</b> <span class="small dim">${sk.desc}</span></span><span class="small">${UI.passiveText(sk)}</span></button>`; };
    this.modal(`<div class="dono"><div class="eyebrow">돈오 · ${['첫째', '둘째', '셋째', '넷째'][t]} 깨달음</div>
      <p class="event-text dono-scene">${D.scene}</p><p class="small dim">무엇을 보았는가.</p>
      <div class="cards">${opt('a')}${opt('b')}</div></div>`, 'event-box');
  };
  UI.seclusionShow = function () {
    const spot = G.trainSpotHere ? G.trainSpotHere() : null; if (!spot) return this.toast('폐관수련은 수련 지점에서만 할 수 있다.');
    const blk = G.seclusionBlock(); if (blk) return this.toast(blk);
    const row = (m) => { const w = G.seclusionWarn(m); return `<button class="choice-btn" data-act="seclude" data-v="${m}"><b>${m}개월</b><span class="small dim">그동안 다른 일은 할 수 없다. 세상은 혼자 흘러간다.</span>${w.length ? `<span class="small bad">${w.join(' ')}</span>` : ''}</button>`; };
    this.modal(`<div class="eyebrow">폐관수련</div><h3>${spot.name || '수련 지점'}</h3>
      <p class="event-text">바깥과 연을 끊고 들어앉는다. 오래 머물수록 깊이 쌓이고, 끝날 때 깨달음이 찾아올 수 있다.</p>
      <p class="small dim">${G.donoTier() >= 4 ? '이미 네 번의 깨달음을 얻었다. 수련 효과만 남는다.' : '가슴속의 심득이 깊어진다.'}</p>
      <div class="cards">${[1, 2, 3].map(row).join('')}</div><div class="row end"><button class="ghost" data-act="modal-close">그만둔다</button></div>`, 'event-box');
  };
  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return baseQ.call(this);
    const q = G.queue && G.queue[0];
    if (q && (q.type === 'epiphany' || q.type === 'dono')) {
      if (this.ctx && this.ctx.combat && !this.ctx.combat.result) return;
      G.queue.shift(); return q.type === 'dono' ? this.donoShow() : this.epiphanyShow(q);
    }
    return baseQ.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'dono-pick') { const nm = G.donoPick(v); this.closeModal(); if (nm) this.toast(`깨달음 — [${nm}]. 스킬 화면에서 장착할 수 있다.`); return this.processQueue(); }
    if (act === 'seclusion') return this.seclusionShow();
    if (act === 'seclude') { this.closeModal(); const m = G.seclusion(+v); this.renderGame(); if (m) this.toast(m); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
  // 수련 지점 행동에 폐관수련
  const baseActs = UI.hudActions;
  UI.hudActions = function (...a) {
    const html = baseActs.apply(this, a);
    try { if (G.trainSpotHere && G.trainSpotHere() && html.includes('class="act-btns">')) return html.replace('class="act-btns">', 'class="act-btns"><button data-act="seclusion">폐관수련 <span class="dim-in">1~3개월</span></button>'); } catch (e) { /* 무시 */ }
    return html;
  };
  // 내 정보: 성향 기색
  const baseChar = UI.charHtml;
  UI.charHtml = function (...a) {
    const html = baseChar.apply(this, a);
    try { return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `<div class="small align-line">${G.alignText()}</div><div class="sec"><div class="sec-title">선천 특성</div>`); } catch (e) { return html; }
  };
  // 스킬 화면: 패시브 표시 · 깨달음 · 돈오
  const baseSk = UI.skillsHtml;
  UI.skillsHtml = function (...a) {
    const html = baseSk.apply(this, a);
    try {
      const p = G.player; const d = document.createElement('div'); d.innerHTML = html;
      for (const id of p.skills) {
        const sk = skillById(id); if (!sk || sk.type !== 'passive') continue;
        const btn = d.querySelector(`[data-act=toggle-skill][data-v="${id}"]`); const row = btn && btn.closest('.item-row'); if (!row) continue;
        row.classList.add('is-passive');
        const sm = row.querySelector('.grow .small.dim'); if (sm) sm.textContent = `${sk.desc} · ${G.godPv && id.startsWith('god_') ? UI.pvText(G.godPv(id, null)) : UI.passiveText(sk)}`;
      }
      const panel = d.querySelector('.panel'); if (!panel) return html;
      const ep = SKILLS.filter((s) => s.cls === p.cls && (s.learn === 'light' || s.learn === 'dark')).sort((a, b) => (a.learn > b.learn ? -1 : 1) || a.learnIdx - b.learnIdx);
      if (ep.length) {
        const item = (s) => {
          const own = p.skills.includes(s.id); const locked = G.extLocked(s); const light = s.learn === 'light'; const T = s.trig && DEED[s.trig];
          const hint = own ? `${T ? T.name : ''}의 깨달음` : locked ? '닫힌 길' : `${T ? T.hint : ''}${s.minRank ? ` · ${RANKS[s.minRank].key}급부터` : ''}`;
          return `<div class="ep-row ${light ? 'light' : 'dark'} ${own ? 'own' : ''} ${locked ? 'locked' : ''}"><b>${own ? s.name : locked ? '———' : '???'}</b><span class="tag">${light ? '빛' : '어둠'}</span><span class="small dim">${hint}</span></div>`;
        };
        const creed = p.creed ? ` <span class="small ${p.creed === 'light' ? 'ok' : 'bad'}">${p.creed === 'light' ? '빛' : '어둠'}의 길</span>` : '';
        panel.insertAdjacentHTML('beforeend', `<div class="ep-list"><div class="sec-title sec">깨달음${creed}</div>${ep.map(item).join('')}</div>`);
      }
      const tiers = DONO[p.cls] || [];
      if (tiers.length) {
        const S = G.donoState(); const t = S.got.length;
        const heart = t >= 4 ? '네 번의 깨달음을 모두 얻었다.' : S.heart >= DONO_NEED[t] ? '무언가 손에 잡힐 듯하다. 고요한 순간을 기다린다.' : S.heart >= DONO_NEED[t] * 0.5 ? '가슴속에 무언가 맺혀 간다.' : '아직 아무것도 맺히지 않았다.';
        const rows = [0, 1, 2, 3].map((i) => { const id = S.got[i]; const sk = id && skillById(id); return `<div class="ep-row dono ${sk ? 'own' : ''}"><b>${sk ? sk.name : '???'}</b><span class="tag">${['첫째', '둘째', '셋째', '넷째'][i]}</span><span class="small dim">${sk ? UI.passiveText(sk) : i === t ? heart : ''}</span></div>`; }).join('');
        panel.insertAdjacentHTML('beforeend', `<div class="ep-list"><div class="sec-title sec">돈오</div>${rows}</div>`);
      }
      if (G.godPanelHtml) panel.insertAdjacentHTML('beforeend', G.godPanelHtml());
      return d.innerHTML;
    } catch (e) { return html; }
  };
}
