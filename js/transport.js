// ===== 게이트 크로니클: 도시 간 대중교통 · 도착 예정 =====
// docs/이동_교통_점검.md, 구현_대기목록 4-24.
// 광역 12곳과 중도시(WORLD.towns tier 2)의 역·터미널에서 KTX·고속버스·여객선을 탄다.
// 빠르지만 길 위의 게이트·탐사 지점·괴수는 만나지 못한다(걸어야 생긴다).
// 요금표는 TRANSPORT_FARE, 계산은 G.transportFare(mode, dist) — 가격 균형은 영역 E가 이 둘을 고친다.
// 저장: 없음(이동 즉시 반영).

const TRANSPORT_FARE = {
  ktx: { name: 'KTX', base: 120, perTile: 6 },
  bus: { name: '고속버스', base: 40, perTile: 2.5 },
  ferry: { name: '여객선', base: 300, perTile: 0 },
};
const FERRY_PORTS = ['busan', 'gwangju']; // 제주 배편이 닿는 항구
const BUS_ONE_DAY = 32; // 이 칸 수까지는 하루, 넘으면 이틀

Object.assign(Game.prototype, {
  // 역·터미널 목록. key: 'r:지역' 또는 't:중도시'
  stations() {
    if (this._stations) return this._stations;
    const out = [];
    for (const r of REGIONS) { const c = WORLD.cityPos[r.id]; if (c) out.push({ key: `r:${r.id}`, name: r.name, x: c[0], y: c[1], region: r.id, major: true }); }
    for (const t of WORLD.towns || []) if (t.tier === 2) out.push({ key: `t:${t.id}`, name: `${t.name} 중도시`, x: t.x, y: t.y, region: t.region, major: false });
    return (this._stations = out);
  },
  stationHere() { const p = this.player; return this.stations().find((s) => s.x === p.x && s.y === p.y) || null; },
  // 소속 할인: 관리국 공무원은 공무 이동 무료, 관리국 소속 절반, 길드 소속 15% 할인
  transportDiscount() {
    const p = this.player;
    if (this.isCivil && this.isCivil()) return { mul: 0, note: '관리국 공무 이동 · 무료' };
    if (p.guild === 'kama') return { mul: 0.5, note: '관리국 소속 50% 할인' };
    if (p.guild && typeof GUILDS !== 'undefined' && GUILDS[p.guild]) return { mul: 0.85, note: `${GUILDS[p.guild].name} 소속 15% 할인` };
    return { mul: 1, note: '' };
  },
  transportFare(mode, dist) {
    const f = TRANSPORT_FARE[mode];
    return Math.round((f.base + f.perTile * dist) * this.transportDiscount().mul / 10) * 10;
  },
  // 운행 중단 사유 (게이트 브레이크·재앙 지역은 열차와 버스가 서지 않는다)
  transportBlock(st) {
    if (st.region === 'jeju' && !this.canJeju()) return '관리국 공인 S급만';
    if (this.cityBreak && this.cityBreak(st.region)) return '게이트 브레이크 · 운행 중단';
    const cg = this.calGate && this.calGate();
    if (cg && cg.region === st.region) return '재앙 게이트 · 운행 중단';
    return '';
  },
  // 지금 역에서 갈 수 있는 곳과 수단
  transportOptions() {
    const from = this.stationHere(); if (!from) return [];
    const here = this.transportBlock(from);
    const out = [];
    for (const st of this.stations()) {
      if (st === from) continue;
      const dist = Math.round(Math.hypot(st.x - from.x, st.y - from.y));
      const jeju = st.region === 'jeju' || from.region === 'jeju';
      const modes = [];
      if (jeju) {
        const other = st.region === 'jeju' ? from : st;
        if (st.region !== from.region && other.major && FERRY_PORTS.includes(other.region)) modes.push({ mode: 'ferry', days: 1 });
      } else {
        if (st.major && from.major && dist >= 12) modes.push({ mode: 'ktx', days: 1 });
        modes.push({ mode: 'bus', days: dist <= BUS_ONE_DAY ? 1 : 2 });
      }
      if (!modes.length) continue;
      for (const m of modes) m.fare = this.transportFare(m.mode, dist);
      out.push({ st, dist, modes, block: here || this.transportBlock(st) });
    }
    return out.sort((a, b) => a.dist - b.dist);
  },
  // 도착 예정: { text, days } — 그 사이 지나가는 월 정산·계약 분기 마감을 알려 준다
  etaInfo(days) {
    const p = this.player;
    days = Math.max(0, Math.round(days));
    let d = this.day + days; let m = this.month; let y = this.year; let months = 0;
    while (d > 30) { d -= 30; m++; months++; if (m > 12) { m = 1; y++; } }
    const notes = [];
    if (months) notes.push(months > 1 ? `월 정산 ${months}번(월급·유지비)` : '월 정산(월급·유지비)');
    const c = p.contract;
    if (c && c.duty && c.qStart != null && this.monthKey() + months - c.qStart >= 3 && (c.qDone || 0) < c.duty) notes.push(`계약 분기 마감(의무 게이트 ${c.qDone || 0}/${c.duty})`);
    const text = `도착 예정 ${y !== this.year ? `${y}년 ` : ''}${m}월 ${d}일 · ${days ? `${days}일 걸림` : '하루 안에'}${notes.length ? ` · 그 사이 ${notes.join(', ')} 지남` : ''}`;
    return { text, days, months, warn: notes.length > 0 };
  },
  transportRide(key, mode) {
    const p = this.player;
    const opt = this.transportOptions().find((o) => o.st.key === key); if (!opt) return '지금은 갈 수 없는 곳이다.';
    const m = opt.modes.find((x) => x.mode === mode); if (!m) return '그 노선은 없다.';
    if (opt.block) return `${opt.st.name} 노선은 탈 수 없다. (${opt.block})`;
    if (p.money < m.fare) return '크레딧이 모자란다.';
    const F = TRANSPORT_FARE[mode];
    // 수배 중이면 역 검문에 걸릴 수 있다
    const lv = p.wanted || 0;
    if (lv > 0 && RNG.chance(Math.min(0.7, 0.2 * lv))) {
      const fine = Math.min(p.money, Math.round(250 * lv * RANKS[p.rankIdx].mult));
      p.money -= fine;
      this.log(`역 검문에서 수배 사실이 드러났다. ${fmt(fine)} 크레딧을 쥐여 주고 빠져나왔지만 표는 끊지 못했다.`, 'bad');
      this.advanceDays(1, { eventChance: 0 });
      return `검문에 걸렸다. ${fmt(fine)} 크레딧을 쓰고 하루를 날렸다.`;
    }
    p.money -= m.fare;
    const before = p.region; let days = m.days; const extra = [];
    // 드문 사건
    if (RNG.chance(0.06)) {
      if (mode === 'ferry' || RNG.chance(0.5)) { days += 1; extra.push(mode === 'ferry' ? '파도가 높아 배가 하루 늦게 닿았다.' : '선로 위에 게이트가 열려 하루 동안 멈춰 섰다.'); }
      else {
        const luck = this.checkChance ? this.checkChance(this.checkMembers()[0], 'luck', 0.55, 0).chance / 100 : 0.5;
        if (RNG.chance(luck)) { const g = Math.round(60 * RANKS[p.rankIdx].mult); p.money += g; p.fame += 1; extra.push(`객실에서 소매치기 각성자의 손목을 잡았다. 사례금 ${fmt(g)} 크레딧, 명성 +1.`); }
        else { const l = Math.min(p.money, Math.round(p.money * 0.06)); p.money -= l; if (l) extra.push(`내리고 보니 지갑이 가벼웠다. 소매치기에게 ${fmt(l)} 크레딧을 털렸다.`); }
      }
    }
    p.x = opt.st.x; p.y = opt.st.y; p.region = opt.st.region; p.dayFrac = 0;
    this.reveal(p.x, p.y, 5);
    this.syncParty();
    if (opt.st.major) { this.visitCity(opt.st.region); this.questEvent('arrive', { region: opt.st.region }); }
    else if (before !== p.region && this.clueArrive) this.clueArrive();
    this.advanceDays(days, { eventChance: 0.05 });
    for (const e of extra) this.log(e);
    return `${F.name}로 ${opt.st.name}에 도착했다. ${days}일 걸렸다.${extra.length ? ` ${extra.join(' ')}` : ''}`;
  },
});

// ---------- 화면 ----------
Object.assign(UI, {
  transportHtml() {
    const opts = G.transportOptions(); const p = G.player;
    const disc = G.transportDiscount();
    if (!G.stationHere()) return '<p class="dim">이곳에는 역이나 터미널이 없다.</p>';
    const rows = opts.map((o) => {
      const btns = o.modes.map((m) => `<button class="sm tp-btn" data-act="tp-ride" data-v="${o.st.key}|${m.mode}" ${o.block || p.money < m.fare ? 'disabled' : ''}><b>${TRANSPORT_FARE[m.mode].name}</b><span class="small">${m.days}일 · ${m.fare ? fmt(m.fare) : '무료'}</span></button>`).join('');
      const eta = G.etaInfo(Math.min(...o.modes.map((m) => m.days)));
      return `<div class="item-row tp-row"><div class="grow"><b>${o.st.name}</b> <span class="small dim">${o.dist}칸</span>
        <div class="small ${o.block ? 'bad' : eta.warn ? 'amber' : 'dim'}">${o.block || eta.text}</div></div><div class="tp-btns">${btns}</div></div>`;
    }).join('');
    return `<p class="small dim">KTX는 광역 도시끼리, 고속버스는 중도시까지, 제주는 부산·광주에서 배로 간다. 빠르지만 길 위의 게이트·탐사 지점·괴수는 만나지 못한다.${disc.note ? ` <b class="good">${disc.note}</b>` : ''}${(p.wanted || 0) > 0 ? ' <b class="bad">수배 중 · 역 검문에 걸릴 수 있다.</b>' : ''}</p>
      <div class="cards">${rows || '<div class="dim">운행하는 노선이 없다.</div>'}</div>`;
  },
});
{
  if (typeof FACILITIES !== 'undefined') { const f = FACILITIES.find((x) => x.id === 'transit'); if (f) { f.name = '역·터미널'; f.desc = 'KTX·고속버스·여객선으로 다른 도시에 간다.'; } }
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) { return id === 'transit' ? this.transportHtml() : baseFac.call(this, id, reg); };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'tp-ride') {
      const [key, mode] = String(v).split('|');
      const r = G.transportRide(key, mode);
      this.closeModal(); this.renderGame(); if (this.map) this.map.centerOn(G.player.x, G.player.y);
      this.toast(r); if (G.onCity()) this.openCity();
      return this.processQueue();
    }
    if (act === 'walk-go') { const st = this._walkPlan; this._walkPlan = null; this.hideTip(); return st ? this.walk(st) : undefined; }
    return baseHandle.call(this, act, v);
  };
  // 걷기: 먼 길(4일 이상이거나 달이 넘어가는 길)은 도착 예정을 먼저 보여 주고 출발한다
  const baseTap = UI.onTap;
  UI.onTap = function (x, y) {
    if (!this.walking && !this.ctx && !this.modalOpen() && this.map && !this.map.moving && !G.over) {
      const rd = this.map.reachData; const i = WORLD.idx(x, y);
      if (rd && rd.dist.has(i) && i !== rd.start) {
        const eta = G.etaInfo((G.player.dayFrac || 0) + rd.dist.get(i) * WORLD.DAYS_PER_COST);
        if (eta.days >= 4 || eta.months) {
          this.showTip(x, y);
          const tip = document.getElementById('hud-tip');
          if (tip) {
            this._walkPlan = WORLD.pathTo(rd, i).slice(1);
            tip.insertAdjacentHTML('beforeend', `<div class="small ${eta.warn ? 'amber' : 'dim'} tp-eta">${eta.text}</div><div class="row end"><button class="primary sm" data-act="walk-go">출발</button></div>`);
            return;
          }
        }
      }
    }
    return baseTap.call(this, x, y);
  };
}
