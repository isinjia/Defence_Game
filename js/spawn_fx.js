// ===== 게이트 크로니클: 소환·분열 등장 연출과 전투 종료 규칙 (영역 A, 사용자 제보) =====
// 1. 전투 종료: 본체(소환물이 아닌 적, 분열 조각 포함)가 모두 쓰러지면 남은 적 소환물은 흩어지고 바로 승리.
//    전에는 "전투 승리" 도장(fx_feel.js)은 소환물을 빼고 판정하고 실제 종료(checkEnd)는 소환물까지 세서,
//    도장은 떴는데 전투가 안 끝나고 소환물을 잡을 때마다 도장이 또 떴다. 도장은 실제로 이겼을 때 한 번만 뜨게 고쳤다(fx_feel.js).
// 2. 등장 연출: 전투 계산은 연출보다 먼저 끝나 있어서, 새로 생긴 적(분열 조각·소환물)이 맞는 연출보다 먼저 화면에 나타났다.
//    이제 '등장' 기록이 재생될 때까지 숨겨 두고, 그때 본체 자리에서 튀어나와 제자리로 미끄러진다. 기존 적들도 부드럽게 비켜난다(FLIP).
//    분열은 본체가 출렁이며 찢어지는 연출("분열!") 뒤에 조각이 나온다. 다른 등장(증원·부활)도 UI.spawnIn 으로 같은 연출을 쓸 수 있다.
// 3. 오더 표식: 전장 배치가 끝난 다음에 다시 계산하고, 대상이 등장하는 동안에는 숨긴다. 크기·배치가 바뀌면 다시 그린다.

// ---------- 1. 전투 종료 규칙 ----------
{
  const C = Combat.prototype;
  const isCore = (u) => u.side === 'enemy' && u.alive && !u.fled && (!u.summon || u.splitChild);
  let vg = 0;
  const baseEnd = C.checkEnd;
  C.checkEnd = function () {
    if (!this.result && !this.units.some(isCore)) {
      const left = this.units.filter((u) => u.side === 'enemy' && u.alive && !u.fled && u.summon && !u.splitChild);
      if (left.length) {
        const g = 'v' + (++vg);
        for (const s of left) {
          s.alive = false; s.hp = 0; s.vanished = true; // 쓰러뜨린 것이 아니라 흩어진 것: 처치 수·보상·도감에 넣지 않는다
          this.push('', '', { k: 'vanish', dst: s.id });
          const l = this.log[this.log.length - 1]; if (l) l.grp = g;
        }
        this.push('본체가 쓰러지자 남은 소환물이 흩어졌다.', 'good'); const l = this.log[this.log.length - 1]; if (l) l.grp = g;
      }
    }
    return baseEnd.call(this);
  };
}

// ---------- 2. 등장 연출 ----------
{
  const C = Combat.prototype;
  // 등장 기록이 재생되기 전까지는 화면에 내놓지 않는다
  const basePush = C.push;
  C.push = function (t, cls, ev) {
    if (ev && ev.k === 'summon' && ev.dst != null) {
      const su = this.units.find((u) => u.id === ev.dst);
      if (su && su.side === 'enemy') {
        su._pendingSpawn = true;
        if (su.splitChild && ev.src != null) { su.splitFrom = ev.src; const par = this.units.find((u) => u.id === ev.src); if (par) par._splitting = true; }
      }
    }
    return basePush.call(this, t, cls, ev);
  };
}

Object.assign(UI, {
  spawnMs() { const c = this.ctx; return Math.round(460 * (c && c.combat && c.combat.auto ? 0.6 : 1) * (FX.reduced ? 0.4 : 1)); },
  // 지금 화면에 있는 유닛 그림들의 자리 (FLIP의 "처음")
  spawnSnap() {
    const out = {};
    for (const el of document.querySelectorAll('#stage .foe, #stage .ally')) { const q = el.getBoundingClientRect(); if (q.width) out[el.id] = q; }
    return out;
  },
  // 새로 들어온 유닛(ids)을 srcId 자리에서 튀어나오게 하고, 나머지는 옛 자리(before)에서 새 자리로 미끄러지게 한다
  spawnIn(ids, srcOf, before) {
    const ms = this.spawnMs(); const stage = document.getElementById('stage'); if (!stage) return;
    const moved = [];
    for (const el of document.querySelectorAll('#stage .foe, #stage .ally')) {
      const now = el.getBoundingClientRect(); if (!now.width) continue;
      const uid = el.id.slice(2); const fresh = ids.includes(uid);
      let from = before[el.id];
      if (fresh) { const s = before['u-' + srcOf[uid]]; from = s ? { left: s.left + s.width / 2 - now.width / 2, top: s.top + s.height / 2 - now.height / 2, width: now.width } : null; }
      if (!from) { if (fresh) { el.style.transform = 'scale(.2)'; el.style.opacity = '0'; moved.push(el); } continue; }
      const dx = from.left - now.left, dy = from.top - now.top;
      if (!fresh && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)${fresh ? ' scale(.15)' : ''}`;
      if (fresh) el.style.opacity = '0';
      el.classList.add('spawn-move'); if (fresh) el.classList.add('spawn-new');
      moved.push(el);
    }
    if (!moved.length) return;
    void stage.offsetWidth; // 옛 자리를 먼저 그리게 한 뒤 풀어 준다
    for (const el of moved) {
      el.style.transition = `transform ${ms}ms cubic-bezier(.2, 1.2, .4, 1), opacity ${Math.round(ms * 0.5)}ms ease-out`;
      el.style.transform = ''; el.style.opacity = '';
    }
    // 표식은 움직이는 동안 숨겼다가 다 자리 잡으면 다시 그린다
    this.hideOrderMarks(); this._spawning = (this._spawning || 0) + 1;
    setTimeout(() => {
      for (const el of moved) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; el.classList.remove('spawn-move', 'spawn-new'); }
      this._spawning = Math.max(0, (this._spawning || 1) - 1);
      if (!this._spawning) { try { this.drawOrderMarks(); } catch (e) { /* 무시 */ } }
    }, ms + 40);
  },
  hideOrderMarks() {
    const stage = document.getElementById('stage'); if (!stage) return;
    const svg = stage.querySelector('svg.order-lines'); if (svg) svg.remove();
    stage.querySelectorAll('.order-end').forEach((e) => e.remove());
  },
  // 배치가 끝난 다음 프레임에 오더 표식을 다시 계산한다
  orderMarksLater() {
    if (this._omRaf) return;
    this._omRaf = requestAnimationFrame(() => requestAnimationFrame(() => { this._omRaf = 0; if (this.ctx && this.ctx.combat && !this._spawning) { try { this.drawOrderMarks(); } catch (e) { /* 무시 */ } } }));
  },
});

{
  // 아직 등장하지 않은 유닛은 그리지 않는다 (가장 바깥에서 걸러, 안쪽의 모든 그리기 함수가 같은 목록을 보게 한다)
  const hideWrap = (name) => {
    const base = UI[name]; if (!base) return;
    UI[name] = function (...a) {
      const cb = this.ctx && this.ctx.combat; const all = cb && cb.units;
      if (!all || !all.some((u) => u._pendingSpawn)) return base.apply(this, a);
      cb.units = all.filter((u) => !u._pendingSpawn);
      try { return base.apply(this, a); } finally { cb.units = all; }
    };
  };
  hideWrap('refreshUnits'); hideWrap('drawGauges'); hideWrap('drawOrderMarks');

  // 오더 표식: 등장 연출 중에는 그리지 않고, 그 밖에는 배치가 끝난 다음 프레임에 한 번 더 계산한다
  const baseMarks = UI.drawOrderMarks;
  UI.drawOrderMarks = function (...a) { if (this._spawning) return this.hideOrderMarks(); return baseMarks.apply(this, a); };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) { const r = baseRefresh.apply(this, a); this.orderMarksLater(); return r; };
  const baseFit = UI.combatFit;
  if (baseFit) UI.combatFit = function (...a) { const r = baseFit.apply(this, a); this.orderMarksLater(); return r; };
  window.addEventListener('resize', () => UI.orderMarksLater());
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => UI.orderMarksLater());
    const baseOpen = UI.openCombat;
    UI.openCombat = function (...a) { const r = baseOpen.apply(this, a); try { const st = document.getElementById('stage'); if (st && st !== UI._roStage) { ro.disconnect(); ro.observe(st); UI._roStage = st; } } catch (e) { /* 무시 */ } return r; };
  }

  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev; const c = this.ctx; const cb = c && c.combat;
    if (!ev || !cb) return baseApply.call(this, l);
    const unit = (id) => cb.units.find((u) => u.id === id);
    // 소환물이 흩어진다
    if (ev.k === 'vanish') {
      if (this.appendLog) this.appendLog(l);
      const el = document.getElementById('u-' + ev.dst);
      if (c.disp[ev.dst]) c.disp[ev.dst].hp = 0;
      if (el) { const host = el.querySelector('.fx-host') || el; if (FX.burst) FX.burst(host, '#c58cff', 10); el.classList.add('vanishing'); setTimeout(() => { el.classList.remove('vanishing'); el.classList.add('dead'); }, 380); }
      return 300;
    }
    // 분열하는 본체: 쓰러지는 대신 출렁이며 찢어진다
    if (ev.k === 'down') {
      const u = unit(ev.dst);
      if (u && u._splitting && u.side === 'enemy') {
        if (this.appendLog) this.appendLog(l);
        if (c.disp[u.id]) c.disp[u.id].hp = 0;
        const el = document.getElementById('u-' + u.id); const ms = this.spawnMs() + 60;
        if (el) {
          const host = el.querySelector('.fx-host') || el;
          FX.floatText(host, '분열!', 'skill');
          el.style.setProperty('--split-ms', ms + 'ms'); el.classList.add('splitting');
          if (typeof SFX !== 'undefined' && SFX.play) try { SFX.play('weak'); } catch (e) { /* 무시 */ }
        }
        return ms;
      }
    }
    if (ev.k === 'summon') {
      const su = unit(ev.dst);
      if (su && su._pendingSpawn) {
        // 같은 박자에 들어오는 조각들을 모아 한 번에 등장시킨다
        const first = !this._spawnBatch;
        if (first) this._spawnBatch = { before: this.spawnSnap(), ids: [], srcOf: {} };
        const B = this._spawnBatch;
        su._pendingSpawn = false; B.ids.push(String(su.id)); B.srcOf[su.id] = ev.src;
        // 찢어진 본체는 자리를 비운다 (조각이 그 자리에서 나온다)
        const par = su.splitFrom != null ? document.getElementById('u-' + su.splitFrom) : null;
        if (par) { par.classList.remove('splitting'); par.classList.add('split-gone'); }
        const r = baseApply.call(this, l); // 그림을 만들고 소리·3D 이펙트를 낸다
        if (first) Promise.resolve().then(() => { const b = this._spawnBatch; this._spawnBatch = null; if (b && this.ctx === c) { this.refreshUnits(); this.spawnIn(b.ids, b.srcOf, b.before); } });
        return Math.max(r || 0, this.spawnMs() + 40);
      }
    }
    return baseApply.call(this, l);
  };

  // 같은 본체에서 나온 조각들은 한 박자에 (js/aoe_burst.js 의 묶음 재생을 쓴다)
  const C = Combat.prototype;
  const baseDown = C.down;
  let sg = 0;
  C.down = function (u) {
    const from = this.log.length;
    const r = baseDown.call(this, u);
    const g = 's' + (++sg);
    for (let i = from; i < this.log.length; i++) { const l = this.log[i]; if (l && l.ev && l.ev.k === 'summon' && !l.grp) l.grp = g; }
    return r;
  };
}
