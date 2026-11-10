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
    // 전체 기술: 종류가 전체 계열이거나, 괴수 전용 전체기(자폭·숨결·진동 등 intent 'aoe')
    const wide = skill && (AOE_TYPES.includes(skill.type) || skill.aoe || skill.intent === 'aoe' || /aoe|blast|_all$/.test(skill.type || ''));
    if (!wide || this._grp) return baseUse.call(this, u, skill, target);
    this._grp = ++grpN; const from = this.log.length; const g = this._grp;
    try { return baseUse.call(this, u, skill, target); } finally {
      this._grp = 0;
      // push를 거치지 않고 기록에 바로 넣은 것(게이지·시전 표시 등)도 같은 묶음으로: 중간에 빠진 기록이 있으면 묶음이 둘로 쪼개져 차례로 맞는 것처럼 보인다
      for (let i = from; i < this.log.length; i++) { const l = this.log[i]; if (l && !l.grp && !(l.ev && l.ev.k === 'cast')) l.grp = g; }
    }
  };
  const basePush = C.push;
  C.push = function (t, cls, ev) {
    const r = basePush.call(this, t, cls, ev);
    const l = this.log[this.log.length - 1];
    if (l) { l.act = this._actN || 0; if (this._grp && !(l.ev && l.ev.k === 'cast')) l.grp = this._grp; }
    return r;
  };
  // 행동 번호: 한 사람의 한 차례에서 나온 기록은 같은 번호 (합동기·필살기·섬광탄처럼 useSkill을 거치지 않는 전체기를 묶는 데 쓴다)
  const baseTurn = C.takeTurn;
  C.takeTurn = function (u) { this._actN = (this._actN || 0) + 1; return baseTurn.call(this, u); };
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
    // 묶음: 전체 기술에서 나온 기록(피해·쓰러짐·상태 이상·반응)을 한 박자에 모두 적용한다.
    //  - useSkill 전체기: 같은 grp
    //  - 그 밖에 '전체' 알림(k: 'aoe')으로 시작하는 것(합동기·필살기·섬광탄 등): 같은 행동 번호의 나머지
    const burstStart = l.grp || (l.ev && l.ev.k === 'aoe' && l.act != null);
    if (burstStart) {
      const same = (x) => (l.grp ? x.grp === l.grp : (x.act === l.act || x.act == null) && !x.grp && !(x.ev && (x.ev.k === 'cast' || x.ev.k === 'aoe')));
      const st = document.getElementById('stage');
      if (st && FX.pulse) FX.pulse(st, 'quake', 260);
      let n = 0;
      while (i < evs.length && same(evs[i])) { wait = Math.max(wait, apply(evs[i++])); n++; }
      if (n) wait = Math.max(wait, 520);
    }
    setTimeout(step, wait * speed * (FX.reduced ? 0.6 : 1));
  };
  step();
};
