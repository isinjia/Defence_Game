// ===== 게이트 크로니클: 괴수 크기는 괴수 자신의 크기로 (영역 A, 사용자 요청) =====
// 이전: 전장에 남는 자리만큼 그림을 키웠다가(120px부터) 넘치면 줄여서, 등장 연출 때와 전투 중 크기가 달랐고
//       작은 슬라임도 자리가 남으면 거대해졌다.
// 지금: 크기 = 기준 크기(고정) × 괴수 몸집(모양·등급·정예·보스).
//       기준 크기는 전투를 열 때 한 번 정하고 전투 내내 그대로 둔다. 넘칠 때만 한 단계씩 줄이고(키우지 않음),
//       소환·분열로 적이 늘어 넘칠 때만 다시 줄인다.

const MON_BODY = {
  swarm: 0.8, drone: 0.75, slime: 0.8, eye: 0.85, flyer: 0.85, core: 0.9, ghost: 0.95, spider: 0.95,
  beast: 1.0, humanoid: 1.0, mimic: 0.9, choir: 1.05, golem: 1.25, dragon: 1.4, lord: 1.5,
};
const MON_BASE = [72, 64, 56, 48, 42];

Object.assign(UI, {
  // 괴수 몸집 배율
  monBody(u) {
    let s = MON_BODY[u.shape] ?? 1;
    s *= 1 + Math.min(4, u.tier || 0) * 0.04;      // 높은 등급일수록 조금 크다
    if (u.elite) s *= 1.12;
    if (u.boss) s *= 1.3;
    if (u.summon) s *= u.splitChild ? 0.8 : 0.85;  // 분열체·소환체는 작게
    return Math.round(Math.min(2.1, Math.max(0.6, s)) * 100) / 100;
  },
  monSizeMark() {
    const c = this.ctx; if (!c || !c.combat) return;
    for (const u of c.combat.units) {
      if (u.side !== 'enemy') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const v = String(this.monBody(u));
      if (el.style.getPropertyValue('--ms') !== v) el.style.setProperty('--ms', v);
    }
  },
});

{
  const baseFit = UI.combatFit;
  UI.combatFit = function () {
    const box = document.getElementById('modal-box'); const st = document.getElementById('stage');
    if (!box || !st || !box.classList.contains('combat-box')) return baseFit && baseFit.call(this);
    const c = this.ctx; if (!c || !c.combat) return;
    box.classList.add('fit', 'msize');
    this.monSizeMark();
    const fz = document.getElementById('foes');
    // 등장 연출(transform)에 속지 않게 배치 위치(offset)로 잰다
    const spill = (host) => {
      if (!host) return false;
      for (const ch of host.children) {
        if (!ch.offsetHeight) continue;
        const bt = ch.offsetParent === host ? 0 : host.offsetTop, bl = ch.offsetParent === host ? 0 : host.offsetLeft;
        const t = ch.offsetTop - bt, l = ch.offsetLeft - bl;
        if (t < -1 || t + ch.offsetHeight > host.clientHeight + 1 || l < -1 || l + ch.offsetWidth > host.clientWidth + 1) return true;
      }
      return false;
    };
    // 전장 자체의 scrollHeight 는 바닥 장식 때문에 늘 넘쳐 보여 쓰지 않는다. 적 줄·아군 줄과 전투 상자만 본다.
    const al = document.getElementById('allies');
    const over = () => box.scrollHeight > box.clientHeight + 1 || spill(fz) || spill(al);
    const apply = (k) => {
      box.style.setProperty('--fs', MON_BASE[Math.min(k, MON_BASE.length - 1)] + 'px');
      box.classList.toggle('fit-tight', k >= MON_BASE.length);
      box.classList.toggle('fit-tiny', k >= MON_BASE.length + 1);
    };
    // 이 전투에서 정한 단계 (한 번 정하면 키우지 않는다)
    // 화면을 연 직후 잠깐은 배치가 덜 잡혀 넘쳐 보이므로, 처음 0.5초는 매번 처음부터 다시 잰다
    const now = performance.now();
    const lock = c.monFit && c.monFit.cb === c.combat ? c.monFit : (c.monFit = { cb: c.combat, lv: 0, t: now });
    let lv = now - lock.t < 500 ? 0 : lock.lv; apply(lv);
    while (over() && lv < MON_BASE.length + 1) apply(++lv);
    lock.lv = lv; c.fitLv = lv;
  };
}
{
  // 연 뒤 배치가 잡히면 한 번 더 잰다 (등장 연출이 끝나기 전에 크기가 정해진다)
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) {
    const r = baseOpen.apply(this, a);
    const c = this.ctx; const again = () => { if (this.ctx === c && c && c.combat) try { this.combatFit(); } catch (e) { /* 무시 */ } };
    requestAnimationFrame(again); setTimeout(again, 250);
    return r;
  };
}
