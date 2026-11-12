// ===== 성장형 무기 · 포식형 각성 =====
// 설계: docs/헌터물_제안3.md 5·9
//  - 성장형 무기: 히든 피스로 얻는 단 하나의 무기. 처치·코어 먹이기로 자라고, 먹은 괴수의 속성에 따라 진화 방향이 갈린다.
//    자아가 있어 싸움 뒤에 말을 걸고, 석 달 넘게 쓰지 않으면 삐친다(공격 −15%). 강화·판매는 거부한다.
//  - 포식형 각성: 히든 피스나 운명 카드로 얻는다. 보스를 쓰러뜨리면 확률로 그 괴수의 기술을 빼앗는다.
//    포식 스킬은 위력 +25%지만 쓸 때마다 에테르 오염이 쌓인다. 칸은 등급에 따라 2~4칸.

const SOUL_XP = [0, 30, 90, 200, 400];
const SOUL_EVO = {
  fire: { name: '염화', stat: 'atk', mul: 1.15, say: '"더 태워. 더 뜨겁게."' },
  water: { name: '해류', stat: 'hp', mul: 1, add: { hp: 1.2 }, say: '"서두르지 마. 물은 천천히 바위를 이긴다."' },
  bolt: { name: '뇌명', stat: 'spd', mul: 1, add: { spd: 1.6 }, say: '"느려. 너무 느려."' },
  wood: { name: '거목', stat: 'def', mul: 1, add: { def: 0.8 }, say: '"뿌리가 버티면 진 게 아니야."' },
  holy: { name: '성광', stat: 'mp', mul: 1, add: { mp: 1.2, luck: 1 }, say: '"저 괴수들도 언젠간 쉬게 해 주자."' },
  dark: { name: '암영', stat: 'atk', mul: 1.08, add: { luck: 1 }, say: '"저 괴수들 안에서 누가 울고 있어."' },
};
const SOUL_TALK = {
  happy: ['"좋아, 이 맛이야."', '"오늘은 꽤 쓸 만했어, 주인."', '"다음엔 더 큰 놈으로 부탁해."', '"너랑 있으면 심심하지 않아."'],
  sulk: ['"…이제 와서?"', '"다른 칼이 그렇게 좋았어?"', '"흥."'],
  lvup: ['"느껴져? 내가 깨어나고 있어."', '"이름을 기억해 둬. 곧 모두가 부를 테니까."', '"우린 아직 멀었어. 그래서 좋아."'],
};
const DEVOUR_SLOTS = (rankIdx) => 2 + Math.floor(rankIdx / 3);

// 운명 카드에 '포식 회로'를 더한다 (ascend.js)
if (typeof FATES !== 'undefined') FATES.push({ id: 'devour', name: '포식 회로', mods: { hp: 0.04 }, bad: '보스의 기술을 빼앗는다. 포식 스킬은 강하지만 오염을 쌓는다', rare: true, when: (g, p) => !p.devour });

Object.assign(Game.prototype, {
  soulInit() { const p = this.player; if (!p) return; p.devour ??= null; },
  soulWeapon() { const p = this.player; const all = [p.equip.weapon, ...p.inventory]; return all.find((e) => e && e.soul) || null; },
  soulWeaponGrant() {
    const p = this.player;
    if (this.soulWeapon()) { this.etherGift(150); return '이미 자아를 가진 칼이 있다. 바위 속 칼은 조용히 잠들었다. 대신 에테르가 차올랐다.'; }
    const it = this.makeEquipment('weapon', p.rankIdx, 2);
    it.soul = { xp: 0, lv: 1, feed: {}, last: this.monthKey(), evo: null, sulk: false };
    it.name = '「이름 없는 검」';
    this.soulUpdate(it);
    p.inventory.push(it); this.equipItem(it.uid);
    return '바위에서 뽑아낸 칼이 말을 건다. "드디어 왔네. 오래 기다렸어." 성장형 무기 「이름 없는 검」을 얻었다.';
  },
  soulLv(xp) { let lv = 1; for (let i = 0; i < SOUL_XP.length; i++) if (xp >= SOUL_XP[i]) lv = i + 1; return lv; },
  soulDominant(it) { const f = it.soul.feed; let k = Object.keys(f).sort((a, b) => f[b] - f[a])[0]; k = elemFix(k); return k && SOUL_EVO[k] ? k : 'wood'; },
  soulUpdate(it) {
    const p = this.player; const s = it.soul;
    const tier = p.rankIdx; it.tier = tier;
    it.rarity = s.lv >= 4 ? 3 : 2;
    const m = RANKS[tier].mult * RARITY[it.rarity].mult;
    const grow = 1 + 0.12 * (s.lv - 1);
    const evo = s.evo && SOUL_EVO[s.evo];
    for (const k of ['atk', 'def', 'hp', 'mp', 'spd', 'luck']) delete it[k];
    it.atk = Math.round(8 * m * grow * (evo ? evo.mul : 1) * (s.sulk ? 0.85 : 1));
    if (evo && evo.add) for (const [k, v] of Object.entries(evo.add)) it[k] = Math.round({ hp: 30, mp: 20, def: 5, spd: 2, luck: 3 }[k] * m * v * (s.lv >= 5 ? 1.3 : 1));
    it.value = Math.round(150 * RANKS[tier].mult ** 2 * 3);
    const base = s.evo ? `${SOUL_EVO[s.evo].name}${s.lv >= 5 ? '·각성' : ''}의 검` : '이름 없는 검';
    it.name = `「${base}」`;
  },
  soulGain(xp, kills) {
    const it = this.soulWeapon(); const p = this.player;
    if (!it || p.equip.weapon !== it) return [];
    const s = it.soul; const lines = [];
    for (const k of kills || []) if (k.elem) s.feed[k.elem] = (s.feed[k.elem] || 0) + 1;
    s.last = this.monthKey();
    if (s.sulk) { s.sulk = false; lines.push(`${it.name}: "…다시 날 쓰는구나. 이번만 봐준다."`); }
    const before = s.lv; s.xp += xp; s.lv = this.soulLv(s.xp);
    if (s.lv > before) {
      if (s.lv >= 3 && !s.evo) { s.evo = this.soulDominant(it); lines.push(`${it.name}이(가) 진화한다! 먹은 괴수의 기운을 따라 [${SOUL_EVO[s.evo].name}]의 길로. ${SOUL_EVO[s.evo].say}`); }
      this.soulUpdate(it); this.recalc();
      lines.push(`${it.name} 성장: Lv${s.lv}. ${RNG.pick(SOUL_TALK.lvup)}`);
      if (s.lv === 5) this.lifeEvent(`성장형 무기가 완전히 깨어났다: ${it.name}`);
    } else if (RNG.chance(0.2)) lines.push(`${it.name}: ${RNG.pick(SOUL_TALK.happy)}`);
    this.soulUpdate(it); this.recalc();
    return lines;
  },
  soulFeed(tier) {
    const it = this.soulWeapon(); const p = this.player;
    if (!it) return '';
    if (this.coreCount(tier) < 5) return `${coreName(tier)}가 5개 필요하다.`;
    p.mats['c' + tier] -= 5;
    const was = it.soul.lv; const eq = p.equip.weapon === it;
    if (!eq) return '장착해야 먹일 수 있다. 칼이 고개를 돌린다.';
    const lines = this.soulGain(5 * (tier + 1), []);
    return `${coreName(tier)} 5개를 먹였다. (경험 +${5 * (tier + 1)}, ${it.soul.xp}/${SOUL_XP[Math.min(4, it.soul.lv)] || '최대'})${it.soul.lv > was ? ` ${lines.join(' ')}` : ''}`;
  },
  soulMonthly() {
    const it = this.soulWeapon(); if (!it) return;
    const s = it.soul;
    if (!s.sulk && this.monthKey() - s.last >= 3) { s.sulk = true; this.log(`${it.name}이(가) 삐쳤다. 석 달이나 쓰지 않았다. (공격 −15%, 다시 싸우면 풀린다)`, 'bad'); }
    this.soulUpdate(it); this.recalc();
  },

  // ---------- 포식 ----------
  devourGrant() {
    const p = this.player;
    if (p.devour) { p.devour.bonus = (p.devour.bonus || 0) + 1; return '포식 본능이 더 날카로워졌다. 포식 칸 +1'; }
    p.devour = { skills: [], bonus: 0 };
    this.lifeEvent('포식형 각성: 쓰러뜨린 보스의 기술을 빼앗을 수 있게 되었다.');
    return `포식형 각성. 보스를 쓰러뜨리면 그 기술을 빼앗는다. (칸 ${this.devourSlots()}개)`;
  },
  devourSlots() { const p = this.player; return DEVOUR_SLOTS(p.rankIdx) + ((p.devour && p.devour.bonus) || 0); },
  isDevoured(id) { const d = this.player && this.player.devour; return !!(d && d.skills.includes(id)); },
  devourPick(boss) {
    const p = this.player;
    let ids = (boss.skills || []).filter((id) => id !== 'strike' && !p.skills.includes(id) && skillById(id) && !skillById(id).cls);
    if (!ids.length) ids = SKILLS.filter((s) => s.elem === boss.elem && !s.cls && (s.type === 'dmg' || s.type === 'aoe') && s.rankReq <= p.rankIdx + 1 && !p.skills.includes(s.id)).map((s) => s.id);
    return ids.length ? RNG.pick(ids) : null;
  },
  devourLearn(id, drop) {
    const p = this.player; const d = p.devour; if (!d || !id) return '';
    if (drop) { d.skills = d.skills.filter((x) => x !== drop); p.skills = p.skills.filter((x) => x !== drop); p.equipSkills = p.equipSkills.filter((x) => x !== drop); }
    if (d.skills.length >= this.devourSlots()) return '';
    d.skills.push(id); if (!p.skills.includes(id)) p.skills.push(id);
    if (p.equipSkills.length < 5) p.equipSkills.push(id);
    return `포식: [${skillById(id).name}]을(를) 집어삼켰다.`;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.soulInit(); });
  wrap('lootFromKills', function (base, kills, boss) {
    const lines = base.call(this, kills, boss);
    const p = this.player; if (!p) return lines;
    const list = (kills || []).filter((k) => !k.portrait && !k.summon);
    if (list.length) lines.push(...this.soulGain(list.reduce((a, k) => a + (k.tier || 0) + 1, 0), list));
    if (p.devour) for (const k of list) {
      if (!k.boss || !RNG.chance(0.4)) continue;
      const id = this.devourPick(k); if (!id) continue;
      if (p.devour.skills.length < this.devourSlots()) lines.push(this.devourLearn(id));
      else this.queue.push({ type: 'devour', id, from: k.name });
      break;
    }
    return lines;
  });
  wrap('worldMonthly', function (base) { base.call(this); this.soulMonthly(); });
  if (GP.takeFate) wrap('takeFate', function (base, id) { const r = base.call(this, id); if (id === 'devour' && !this.player.devour) this.devourGrant(); return r; });
  wrap('skillEff', function (base, sk) {
    const r = base.call(this, sk);
    if (r && this.isDevoured(r.id) && !r._dev) return { ...r, _dev: true, power: Math.round(r.power * 1.25 * 1000) / 1000, name: `${r.name}·포식` };
    return r;
  });
  // 자아가 있는 칼은 망치와 상인을 거부한다
  if (GP.enhance) wrap('enhance', function (base, uid) { const it = this.findGear(uid); if (it && it.soul) return `${it.name}: "망치 따위로 날 바꾸려고? 먹이나 줘."`; return base.call(this, uid); });
  wrap('sellEquip', function (base, uid) { const it = this.player.inventory.find((e) => e.uid === uid); if (it && it.soul) return `${it.name}: "날 팔겠다고?!" 칼이 손에서 떨어지지 않는다.`; return base.call(this, uid); });
  // 포식 스킬은 쓸 때마다 오염
  const CP = Combat.prototype; const baseUse = CP.useSkill;
  CP.useSkill = function (u, skill, target) {
    if (u.isPlayer && skill && this.game.isDevoured && this.game.isDevoured(skill.id)) this.taintGain = (this.taintGain || 0) + 2;
    return baseUse.call(this, u, skill, target);
  };
}

// ---------- 화면 ----------
{
  UI.showDevour = function (q) {
    const p = G.player; const sk = skillById(q.id);
    this.devourNew = q.id;
    this.modal(`<div class="eyebrow">포식</div><h3>${q.from}의 [${sk.name}]</h3>
      <p class="event-text">쓰러진 보스의 기술이 손끝에서 꿈틀댄다. 하지만 포식 칸이 가득 찼다. 무엇을 뱉어 낼까?</p>
      <div class="cards">${p.devour.skills.map((id) => `<button class="choice-btn" data-act="dev-swap" data-v="${id}">[${skillById(id).name}] 뱉어 내기</button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="dev-skip">삼키지 않는다</button></div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'devour') { G.queue.shift(); if (!G.player.devour || G.player.skills.includes(q.id)) return this.processQueue(); return this.showDevour(q); }
    return baseQueue.call(this);
  };
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    const it = G.soulWeapon();
    if (id === 'workshop' && it) {
      const p = G.player; const s = it.soul; const next = SOUL_XP[s.lv] ;
      const tiers = Object.keys(p.mats).filter((k) => /^c[0-7]$/.test(k) && p.mats[k] >= 5).map((k) => +k.slice(1)).sort((a, b) => b - a).slice(0, 3);
      html = `<div class="sec-title">${it.name} 먹이기</div><div class="small dim">Lv${s.lv} · 경험 ${s.xp}${next ? `/${next}` : ' (최대)'}${s.evo ? ` · ${SOUL_EVO[s.evo].name}의 길` : ` · 지금 기운: ${SOUL_EVO[G.soulDominant(it)].name}`}${s.sulk ? ' · <span class="bad">삐침</span>' : ''}</div>
        <div class="row">${tiers.map((t) => `<button class="sm" data-act="soul-feed" data-v="${t}">${coreName(t)} 5개</button>`).join('') || '<span class="small dim">코어 5개 이상이 필요하다.</span>'}</div>` + html;
    }
    return html;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player; const it = G.soulWeapon(); let add = '';
    if (it) { const s = it.soul; add += `<div class="sec"><div class="sec-title">성장형 무기 ${it.name}</div><div class="small">Lv${s.lv} · 경험 ${s.xp}${SOUL_XP[s.lv] ? `/${SOUL_XP[s.lv]}` : ''} · ${s.evo ? `${SOUL_EVO[s.evo].name}의 길` : `기운: ${Object.entries(s.feed).map(([k, n]) => `${ELEMENTS[k] ? ELEMENTS[k].name : k} ${n}`).join(' · ') || '없음'}`}${s.sulk ? ' · <span class="bad">삐침</span>' : ''}</div></div>`; }
    if (p.devour) add += `<div class="sec"><div class="sec-title">포식 · ${p.devour.skills.length}/${G.devourSlots()}칸</div><div class="small">${p.devour.skills.map((id) => `[${skillById(id).name}]`).join(' ') || '<span class="dim">아직 삼킨 기술이 없다. 보스를 쓰러뜨리면 40% 확률로 빼앗는다.</span>'}</div><div class="small dim">포식 스킬은 위력 +25%, 쓸 때마다 오염 +2.</div></div>`;
    if (!add) return html;
    const at = html.indexOf('<div class="sec"><div class="sec-title">선천 특성</div>');
    return at < 0 ? html + add : html.slice(0, at) + add + html.slice(at);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'soul-feed': { const r = G.soulFeed(+v); G.save(); return this.afterCity(r); }
      case 'dev-swap': { const r = G.devourLearn(this.devourNew, v); this.devourNew = null; this.closeModal(); return this.after(r); }
      case 'dev-skip': this.devourNew = null; this.closeModal(); return this.after('기술을 삼키지 않았다.');
      default: return baseHandle.call(this, act, v);
    }
  };
}
// 계승: 포식 본능은 본인의 것, 자아 있는 칼은 물려줄 수 있다
{ const baseSucceed = UI.succeed; UI.succeed = function (id) { baseSucceed.call(this, id); G.player.devour = null; G.save(); }; }
