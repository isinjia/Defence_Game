// 버프·약화가 걸릴 때 받는 쪽 각자에게 이펙트와 글자 (영역 B, 사용자 요청 — 조사 세션 경유)
//  - 파티 전체 강화·보호(buff_all·shield_all), 적 전체 약화(debuff), 중독(dot)·기절, 자기 강화·도발·회피:
//    스킬을 쓰기 전후의 상태를 비교해, 바뀐 사람마다 "공격 ▲ 30%", "방어 ▼ 40%", "중독" 같은 글자를 띄운다.
//  - 강화는 기존 'buff' 이벤트로 내보내 속성 색 고리(fx3d)·빛남이 대상마다 나오고, 약화는 붉은 글자와 잔류 효과.
//  - 한 사람씩 짧은 시차(130ms)로, 글자 높이도 엇갈려 겹치지 않게. 상태 표시 칸이 반짝인다.
//  - 회복 글자는 "+85" → "회복 +85".
// 전투 규칙은 건드리지 않는다(이벤트만 덧붙임). 대상: Combat.useSkill 을 거치는 스킬.
{
  const pct = (v) => Math.round(Math.abs(v) * 100);
  const snap = (u) => ({ atk: u.buffs.atk, atkT: u.buffs.atkT, def: u.buffs.def, defT: u.buffs.defT, poison: !!u.poison, stun: u.stun || 0, evade: u.evadeT || 0, taunt: u.tauntT || 0 });
  const diff = (u, a) => {
    const b = snap(u); const out = [];
    if (b.atk && (b.atk !== a.atk || b.atkT > a.atkT)) out.push(b.atk > 0 ? { text: `공격 ▲ ${pct(b.atk)}%`, up: true } : { text: `공격 ▼ ${pct(b.atk)}%`, up: false });
    if (b.def && (b.def !== a.def || b.defT > a.defT)) out.push(b.def > 0 ? { text: `방어 ▲ ${pct(b.def)}%`, up: true } : { text: `방어 ▼ ${pct(b.def)}%`, up: false });
    if (b.taunt > a.taunt) out.push({ text: '도발', up: true });
    if (b.evade > a.evade) out.push({ text: '회피 ▲', up: true });
    if (b.poison && !a.poison) out.push({ text: '중독', up: false });
    if (b.stun > a.stun) out.push({ text: '기절', up: false });
    return out;
  };

  const baseUse = Combat.prototype.useSkill;
  Combat.prototype.useSkill = function (u, skill, target) {
    let before = null, n0 = this.log.length;
    try { before = new Map(this.units.filter((x) => x.buffs).map((x) => [x, snap(x)])); } catch (e) { before = null; }
    const r = baseUse.call(this, u, skill, target);
    if (before) try {
      const elem = skill.elem === 'self' ? u.elem : skill.elem;
      const mine = this.log.slice(n0).find((l) => l.ev && l.ev.k === 'buff' && l.ev.dst === u.id); // 시전자 쪽 기존 이벤트
      for (const [x, a] of before) {
        if (!x.alive) continue;
        for (const d of diff(x, a)) {
          if (d.up && x === u && mine && !mine.ev.bfx) { mine.ev.bfx = d; continue; } // 시전자는 기존 이벤트에 글자만 얹는다
          this.log.push({ t: '', cls: '', ev: d.up ? { k: 'buff', dst: x.id, bfx: d, elem } : { k: 'bfxd', dst: x.id, bfx: d, elem } });
        }
      }
    } catch (e) { /* 연출용 이벤트 실패는 전투를 막지 않는다 */ }
    return r;
  };

  let turn = 0;
  const stagger = (f) => { const k = turn++ % 3; f.classList.add('bfx'); f.style.marginTop = (k - 1) * 15 + 'px'; };
  const flash = (t) => { const st = t && t.querySelector('.status'); if (st) FX.pulse(st, 'st-flash', 700); };
  // 시전 연출 가르기 (사용자 제보): 버프·회복처럼 적을 때리지 않는 시전에는 돌진·타격 모션을 쓰지 않는다.
  //  이 시전 뒤에 (다음 시전 전까지) 피해·광역 이벤트가 따라오면 공격계, 없으면 지원계로 본다 → 스킬·아이템·괴수 기술·오더 모두 같은 규칙.
  const isSupportCast = (ui, l) => {
    const cb = ui.ctx && ui.ctx.combat; if (!cb) return false;
    const i = cb.log.indexOf(l); if (i < 0) return false;
    let any = false;
    for (let j = i + 1; j < cb.log.length; j++) {
      const e = cb.log[j].ev; if (!e) continue;
      if (e.k === 'cast') break;
      if (e.k === 'dmg' || e.k === 'aoe' || e.k === 'miss') return false;
      any = true;
    }
    return any;
  };
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && ev.k === 'cast' && isSupportCast(this, l)) {
      const r = baseApply.call(this, l);
      try {
        const s = document.getElementById('u-' + ev.src);
        if (s) {
          s.classList.remove('lunge-up', 'lunge-down'); // 돌진 대신 제자리 시전 자세
          s.style.setProperty('--hc', ev.elem && ELEMENTS[ev.elem] ? elemColor(ev.elem) : '#8dffb0');
          FX.pulse(s, 'cast-pose', 560);
        }
        const st = document.getElementById('stage'); if (st) FX.pulse(st, 'cast-support', 900); // 적 조준 표시는 잠깐 숨긴다
      } catch (e) { /* 무시 */ }
      return r;
    }
    if (ev && ev.k === 'bfxd') { // 약화: 받는 적(또는 아군)마다 붉은 글자
      const t = document.getElementById('u-' + ev.dst);
      if (t) {
        const host = t.querySelector('.fx-host') || t;
        const col = ev.elem && ELEMENTS[ev.elem] ? elemColor(ev.elem) : '#ff6b6b';
        t.style.setProperty('--hc', col); FX.pulse(t, 'bfx-dim', 600);
        FX.floatText(host, ev.bfx.text, 'bfx down'); stagger(host.lastElementChild);
        FX.burst(host, col, 6);
        try { if (window.FX3D && FX3D.on && FX3D.on()) FX3D.linger(FX3D.at(t), ev.elem || 'dark'); } catch (e) { /* 무시 */ }
      }
      this.refreshUnits(); flash(t);
      return 130;
    }
    const r = baseApply.call(this, l);
    if (!ev) return r;
    try {
      const t = document.getElementById('u-' + ev.dst); const host = t && (t.querySelector('.fx-host') || t);
      if (ev.k === 'buff' && ev.bfx && host) {
        const f = [...host.querySelectorAll('.float-num.heal')].reverse().find((x) => x.textContent === '강화');
        if (f) { f.textContent = ev.bfx.text; f.classList.add('up'); stagger(f); }
        flash(t);
        return l.t ? r : 130; // 덧붙인 대상은 짧은 시차로 이어진다
      }
      if (ev.k === 'heal' && host && ev.amt != null) {
        const f = [...host.querySelectorAll('.float-num.heal')].reverse().find((x) => x.textContent === `+${ev.amt}`);
        if (f) { f.textContent = `회복 +${ev.amt}`; stagger(f); }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 대상 고르기: 아군 대상·대상 없는 스킬을 골랐으면 적 조준 표시를 숨기고, 아군 대상이면 적을 흐리게 한다
  const baseGlow = UI.aimGlow;
  if (baseGlow) UI.aimGlow = function (...a) {
    const r = baseGlow.apply(this, a);
    try {
      const c = this.ctx; const cb = c && c.combat; const st = document.getElementById('stage');
      if (st && cb) {
        const sel = c.sel && !cb.result ? (G.skillEff ? G.skillEff(skillById(c.sel)) : skillById(c.sel)) : null;
        const aim = sel ? (SKILL_AIM[sel.type] || 'none') : null;
        const on = !!(sel && cb.waiting && !c.playing && !cb.auto);
        st.classList.toggle('aim-ally', on && aim === 'ally');
        st.classList.toggle('aim-self', on && aim === 'none' && !['aoe', 'debuff', 'multi'].includes(sel.type));
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
