// ===== 게이트 크로니클: 이야기 속도 조절 (영역 C) =====
// docs/NPC_사회_제안.md 층 5 "이야기 속도 조절". 스토리텔러식 긴장 수치.
// 큰 소식(중요도 높은 소문)이 쌓이면 긴장이 오르고, 매달 식는다.
// 긴장이 높으면 음모·브레이크·세력의 수를 늦추고, 너무 조용하면 앞당긴다.
// 플레이어가 약할 때 세계가 플레이어를 직접 노리는 일(틀린 소문의 범인으로 몰리기 등)은 줄인다.

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.tension ??= 5;
    this.world.quiet ??= 0;
  });

  // 0.6(숨 고르기) ~ 1.4(뭔가 터질 때)
  GP.storyPace = function () {
    const w = this.world; if (!w) return 1;
    const t = w.tension ?? 5;
    if (t >= 22) return 0.6;
    if (t >= 14) return 0.8;
    if (w.quiet >= 4 || t <= 2) return 1.4;
    if (t <= 5) return 1.15;
    return 1;
  };
  // 플레이어를 직접 노리는 일의 배율 (약할 때 줄임)
  GP.targetPace = function () { const r = this.player ? this.player.rankIdx : 0; return r <= 1 ? 0.3 : r <= 3 ? 0.7 : 1; };

  wrap('rumor', function (base, text, meta) {
    base.call(this, text, meta);
    const r = this.rumors && this.rumors[0];
    if (!r || !this.world) return;
    const s = r.score || 0;
    if (s >= 6) { this.world.tension = (this.world.tension || 0) + (s - 4); this.world.quiet = 0; }
  });

  wrap('worldMonthly', function (base) {
    base.call(this);
    const w = this.world;
    w.tension = Math.round((w.tension || 0) * 0.8 * 10) / 10;
    w.quiet = w.tension < 3 ? (w.quiet || 0) + 1 : 0;
    // 너무 오래 조용하면 판을 흔든다
    if (w.quiet >= 6 && RNG.chance(0.5)) {
      w.quiet = 3;
      if (this.plotStart && RNG.chance(0.5)) this.plotStart();
      else if (this.factionMonthly) this.factionMonthly();
    }
  });

  // 플레이어가 틀린 소문의 범인으로 몰리는 일: 약할 때 줄인다
  if (GP.factDistort) wrap('factDistort', function (base, f, vi, region) {
    const p = this.player;
    if (p.region === region && !RNG.chance(this.targetPace())) { const keep = p.region; p.region = '__away'; try { return base.call(this, f, vi, region); } finally { p.region = keep; } }
    return base.call(this, f, vi, region);
  });
}
