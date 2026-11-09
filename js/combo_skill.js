// ===== 게이트 크로니클: 유대 합동기 (영역 A-γ, docs/전투_제안.md 5) =====
// 파티에 관계 80 이상인 배우자·연인·스승·제자·의형제가 있으면 둘이 함께 펼치는 합동기가 열린다.
// - 효과는 두 사람의 직업 역할로 정한다: 방어형이 끼면 방벽 돌격, 지원형이 끼면 공명 일격, 둘 다 공격형이면 쌍룡 연격.
// - 관계가 깊을수록 강하다(관계 80 → 100에서 위력 +0~20%).
// - 내 차례에 동료의 게이지가 절반 이상 찼을 때만 쓸 수 있다. 둘 다 정신력 10%를 쓰고, 동료의 게이지는 비워진다.
// - 전투마다 한 쌍에 한 번. 쓰면 관계가 오르고, 처음 쓰면 추억이 남는다.
// 화면: B의 명령 메뉴(공격·스킬·아이템·방어)를 감싸 "스킬" 목록 맨 위에 넣는다. 쓸 수 있으면 스킬 버튼에 "합" 표시.

const COMBO_BOND = { spouse: '부부', partner: '연인', master: '사제', disciple: '사제', sworn: '의형제' };
const COMBO_PREFIX = { spouse: '연리', partner: '연리', master: '사제', disciple: '사제', sworn: '결의' };
const COMBO_KIND = {
  wall: { name: '방벽 돌격', desc: '대상에 큰 피해 + 파티 방어 상승 3턴' },
  reso: { name: '공명 일격', desc: '대상에 피해 + 파티 체력 20% 회복' },
  twin: { name: '쌍룡 연격', desc: '둘이 번갈아 네 번 베는 연속 공격' },
};
const COMBO_SHOUT = {
  spouse: ['지금이야, 여보!', '맞춰!', '같이 가자!'], partner: ['지금이야!', '호흡 맞춰!', '같이 가자!'],
  master: ['배운 대로 해라!', '따라와라!'], disciple: ['사부님, 지금입니다!', '보여 드릴게요!'],
  sworn: ['형제여, 간다!', '등은 맡긴다!'],
};
const COMBO_REL = 80;
const COMBO_ATB = 50;
const COMBO_MP = 0.1;

// 플레이어와 그 NPC의 유대 종류
function comboBondKind(g, n) {
  const p = g && g.player; if (!p || !n) return null;
  if (p.spouse === n.id) return 'spouse';
  if (p.partner === n.id) return 'partner';
  if (p.master === n.id) return 'master';
  if ((p.disciples || []).includes(n.id)) return 'disciple';
  if ((p.sworn || []).includes(n.id)) return 'sworn';
  return null;
}
function comboKindOf(a, b) {
  const r = (u) => (classById(u.cls) || {}).role;
  if (r(a) === 'tank' || r(b) === 'tank') return 'wall';
  if (r(a) === 'support' || r(b) === 'support') return 'reso';
  return 'twin';
}

Object.assign(Combat.prototype, {
  // 이 전투에서 열린 합동기 목록 (시작할 때 한 번 정한다)
  comboPairs() {
    if (this._combo) return this._combo;
    const out = []; const g = this.game; const p = this.player;
    if (p && !this.spar && g && g.npcById) {
      for (const u of this.units) {
        if (u.side !== 'ally' || u.isPlayer || u.summon || u.npcId == null) continue;
        const n = g.npcById(u.npcId); if (!n || (n.relation || 0) < COMBO_REL) continue;
        const bond = comboBondKind(g, n); if (!bond) continue;
        const kind = comboKindOf(p, u);
        out.push({ id: u.id, npcId: n.id, bond, kind, rel: n.relation, name: `${COMBO_PREFIX[bond]} · ${COMBO_KIND[kind].name}` });
      }
    }
    return (this._combo = out);
  },
  // 쓸 수 없으면 이유, 쓸 수 있으면 ''
  comboBlock(pair) {
    const p = this.player; const u = this.units.find((x) => x.id === pair.id);
    if ((this.comboUsed || {})[pair.id]) return '이번 전투에서 이미 썼다';
    if (!u || !u.alive || u.fled) return '동료가 쓰러졌다';
    if (u.stun > 0) return '동료가 기절했다';
    if (u.atb < COMBO_ATB) return `동료 게이지 ${Math.floor(u.atb)}% / ${COMBO_ATB}%`;
    if (p.mp < p.maxMp * COMBO_MP || u.mp < u.maxMp * COMBO_MP) return '정신력 부족';
    if (!this.enemies().length) return '대상이 없다';
    return '';
  },
  comboReady() { return this.comboPairs().filter((x) => !this.comboBlock(x)); },
  // 합동기 발동 (내 차례에만)
  playerCombo(pid, targetId) {
    if (!this.waiting || this.result) return false;
    const pair = this.comboPairs().find((x) => x.id === pid); if (!pair || this.comboBlock(pair)) return false;
    const p = this.player; const u = this.units.find((x) => x.id === pid);
    (this.comboUsed ||= {})[pid] = true;
    p.mp -= Math.round(p.maxMp * COMBO_MP); u.mp -= Math.round(u.maxMp * COMBO_MP);
    const picked = targetId != null ? this.units.find((x) => x.id === targetId && x.alive && x.side === 'enemy') : null;
    let t = picked || (this.target && this.target.alive ? this.target : this.enemies()[0]);
    const mul = 1 + Math.max(0, Math.min(20, (pair.rel || COMBO_REL) - COMBO_REL)) / 100;
    const sk = (who, power, extra = {}) => ({ id: 'combo', name: pair.name, type: 'dmg', power: power * mul, elem: who.elem, mp: 0, ...extra });
    const shout = RNG.pick(COMBO_SHOUT[pair.bond] || ['지금이야!']);
    this.push(`${u.name}: "${shout}"`, '', { k: 'say', src: u.id, text: shout });
    this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: p.id, mp: p.mp, elem: p.elem, side: 'ally', name: pair.name } });
    this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: u.elem, side: 'ally', name: '' } });
    this.push(`${COMBO_BOND[pair.bond]} 합동기 — ${pair.name}!`, 'hit', { k: 'aoe', src: p.id, side: 'ally', elem: p.elem, combo: true });
    if (pair.kind === 'wall') {
      this.dealDamage(p, t, sk(p, 1.4), { pierce: true });
      if (t.alive) this.dealDamage(u, t, sk(u, 1.4));
      for (const f of this.allies()) { f.buffs.def = Math.max(f.buffs.def, 0.4); f.buffs.defT = Math.max(f.buffs.defT, 3); }
      const tank = (classById(u.cls) || {}).role === 'tank' ? u : p; tank.tauntT = Math.max(tank.tauntT, 2);
      this.buffEvent(tank, '방벽 돌격 · 파티 방어 상승, 적의 시선이 쏠린다');
    } else if (pair.kind === 'reso') {
      this.dealDamage(p, t, sk(p, 1.3));
      if (t.alive) this.dealDamage(u, t, sk(u, 1.3));
      for (const f of this.allies()) if (!f.summon) this.healUnit(f, f.maxHp * 0.2 * mul, null);
    } else {
      for (let i = 0; i < 4; i++) {
        if (!t || !t.alive) t = this.enemies()[0]; if (!t) break;
        const who = i % 2 ? u : p;
        this.dealDamage(who, t, sk(who, 0.85), { crit: 0.15, pierce: i === 3 });
      }
    }
    u.atb = 0;
    // 관계: 전투마다 한 번 오르고, 처음 쓰면 추억이 남는다
    const n = this.game.npcById(pair.npcId);
    if (n) {
      this.game.changeRel(n, 2, '함께 합동기를 펼쳤다');
      if (this.game.addMemory && !(n.memories || []).some((m) => m.text && m.text.includes('합동기'))) this.game.addMemory(n, `처음으로 함께 합동기 [${pair.name}]를 펼쳤다`);
      const gp = this.game.player; if (gp) gp.comboCount = (gp.comboCount || 0) + 1;
    }
    this.endPlayerTurn();
    return true;
  },
});

{
  // 자동 전투: 쓸 수 있으면 가끔 합동기를 쓴다
  const baseAuto = Combat.prototype.autoStep;
  Combat.prototype.autoStep = function () {
    if (this.waiting && !this.result) {
      const r = this.comboReady();
      if (r.length && Math.random() < 0.5) { if (this.playerCombo(r[0].id, null)) return; }
    }
    return baseAuto.call(this);
  };
}

Object.assign(UI, {
  // 스킬 목록 맨 위에 들어갈 합동기 버튼들
  comboBtns() {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.comboPairs) return '';
    const ready = cb.waiting && !c.playing && !cb.auto;
    return cb.comboPairs().map((x) => {
      const why = cb.comboBlock(x); const u = cb.units.find((y) => y.id === x.id);
      const who = u ? u.name.replace(/\(.*\)$/, '') : '';
      return `<button class="skill-btn combo-btn ${why ? '' : 'go'}" data-act="c-combo" data-v="${x.id}" ${why || !ready ? 'disabled' : ''} title="${COMBO_KIND[x.kind].desc}">
        <span class="combo-ic">合</span><span><b>${x.name}</b><span class="small dim">${who} · ${why || COMBO_KIND[x.kind].desc}</span></span></button>`;
    }).join('');
  },
});

{
  // B의 명령 메뉴를 감싼다: 스킬 목록에 합동기를 넣고, 쓸 수 있으면 스킬 버튼에 표시
  const baseMenu = UI.commandMenu;
  if (baseMenu) UI.commandMenu = function (...a) {
    const c = this.ctx; const cb = c && c.combat;
    const sb = document.querySelector('#cb-ctrl > .skill-btns');
    if (cb && !cb.result && sb && cb.comboPairs && cb.comboPairs().length) sb.insertAdjacentHTML('afterbegin', this.comboBtns());
    const r = baseMenu.apply(this, a);
    if (cb && !cb.result && cb.comboPairs) {
      const on = cb.waiting && !c.playing && !cb.auto && cb.comboReady().length > 0;
      const b = document.querySelector('#cb-ctrl .cmd-main [data-v=skill]'); if (b) b.classList.toggle('combo-on', on);
    }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'c-combo') {
      const c = this.ctx; if (!c || !c.combat || c.playing) return;
      c.cmd = null; c.sel = null;
      return this.combatAction((x) => x.playerCombo(v, x.target ? x.target.id : null));
    }
    return baseHandle.call(this, act, v);
  };
  // 합동기 연출: 전장이 번쩍이고 두 사람이 빛난다
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const w = baseApply.call(this, l);
    const ev = l && l.ev;
    if (ev && ev.combo) { const st = document.getElementById('stage'); if (st) FX.pulse(st, 'quake', 420); return Math.max(w, 420); }
    return w;
  };
}
