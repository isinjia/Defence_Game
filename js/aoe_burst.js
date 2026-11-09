// ===== 게이트 크로니클: 전체 기술은 한꺼번에 (영역 A, 사용자 요청) =====
// 이전: 전체 공격·전체 회복이 대상마다 0.4초씩 차례로 맞아 "한 명씩 쓰는" 것처럼 보였다.
// 지금: 한 번의 전체 기술에서 나온 연출(피해 숫자·이펙트·쓰러짐·상태 이상·반응)을 한 박자에 모두 뿌린다.
//       기술 이름(시전) 연출만 먼저, 나머지는 동시에. 전장 전체에 한 번 크게 번쩍인다.

const AOE_TYPES = ['aoe', 'debuff', 'heal_all', 'shield_all', 'buff_all'];

{
  const C = Combat.prototype;
  let grpN = 0;
  const baseUse = C.useSkill;
  C.useSkill = function (u, skill, target) {
    if (!skill || !(AOE_TYPES.includes(skill.type) || skill.aoe) || this._grp) return baseUse.call(this, u, skill, target);
    this._grp = ++grpN;
    try { return baseUse.call(this, u, skill, target); } finally { this._grp = 0; }
  };
  const basePush = C.push;
  C.push = function (t, cls, ev) {
    const r = basePush.call(this, t, cls, ev);
    if (this._grp) { const l = this.log[this.log.length - 1]; if (l && !(l.ev && l.ev.k === 'cast')) l.grp = this._grp; }
    return r;
  };
}

// 재생: 같은 묶음은 한 박자에
UI.play = function () {
  const c = this.ctx; if (!c || c.playing) return;
  const cb = c.combat;
  const evs = cb.log.slice(c.played);
  c.played = cb.log.length;
  if (!evs.length) return this.afterPlay();
  c.playing = true;
  this.renderControls();
  let i = 0;
  const speed = cb.auto ? 0.55 : 1;
  const apply = (l) => { try { return this.applyEvent(l) || 0; } catch (e) { if (window.console) console.error('연출 오류', e); return 200; } };
  const step = () => {
    if (this.ctx !== c) return;
    if (i >= evs.length) { c.playing = false; return this.afterPlay(); }
    const l = evs[i++];
    let wait = apply(l);
    if (l.grp) {
      // 묶음 시작: 전장 전체 번쩍임 한 번, 나머지는 동시에
      const st = document.getElementById('stage');
      if (st && FX.pulse) FX.pulse(st, 'quake', 260);
      let n = 0;
      while (i < evs.length && evs[i].grp === l.grp) { wait = Math.max(wait, apply(evs[i++])); n++; }
      if (n) wait = Math.max(wait, 520);
    }
    setTimeout(step, wait * speed * (FX.reduced ? 0.6 : 1));
  };
  step();
};
