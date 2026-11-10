// ===== 교통·탈것 경제 (영역 E, 4-24의 가격·유지비 몫) =====
// 대중교통 요금표, 소유 탈것 가격·월 유지비·수리비, 월말 정산의 "교통비·차량 유지비" 줄.
// 화면·이동 처리는 F(4-24)가 이 함수들을 부른다. travel.js의 대여(vehiclePrice)와 이름이 겹치지 않게 own* 접두어를 쓴다.
// 수치: docs/E_수치.md "교통·탈것"
const FARE = {
  bus: { name: '고속버스', perHop: 20 },   // 구간(인접 지역 1칸)당
  ktx: { name: 'KTX', perHop: 60 },        // 광역 도시끼리만
  ship: { name: '배', flat: 150 },         // 제주 등 섬, 고정
  disc: { guild: 0.2, kama: 0.5 },         // 소속 할인
};
const OWN_VEHICLES = [
  { id: 'bicycle', name: '자전거', price: 150, upkeep: 0, repair: 20 },
  { id: 'usedbike', name: '중고 오토바이', price: 1200, upkeep: 30, repair: 150 },
  { id: 'car', name: '승용차', price: 6000, upkeep: 120, repair: 600, needLicense: true },
  { id: 'suv', name: '헌터용 SUV·장갑차', price: 30000, upkeep: 500, repair: 3000, minRank: 3 },
  { id: 'heli', name: '개인 헬기', price: 400000, upkeep: 6000, repair: 40000, minRank: 5 },
];
const OWN_RULE = { resale: 0.5, seizeAfter: 3 }; // 되팔기 비율, 유지비 이만큼 밀리면 압류
const ownVehicleById = (id) => OWN_VEHICLES.find((v) => v.id === id);
const josa = (t) => (typeof fixJosa === 'function' ? fixJosa(t) : t);
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const mk = (g) => g.monthKey();
  Object.assign(GP, {
    transportInit() { const p = this.player; if (!p) return; p.ownVehicle ??= null; p.pay ??= {}; p.pay.fare ??= 0; p.pay.upkeep ??= 0; },
    // ---------- 대중교통 ----------
    fareDiscount() {
      const k = this.payKind ? this.payKind(this.player.guild) : null;
      return k === 'kama' ? FARE.disc.kama : k ? FARE.disc.guild : 0;
    },
    // kind: 'bus'|'ktx'|'ship', from/to: 지역 id. duty: 관리국 공무 이동이면 true
    fareOf(kind, from, to, duty = false) {
      const F = FARE[kind]; if (!F) return null;
      const k = this.payKind ? this.payKind(this.player.guild) : null;
      if (duty && k === 'kama') return { cost: 0, base: 0, free: true, note: '관리국 공무 이동: 무료' };
      const hops = Math.max(1, (from && to && typeof regionDist === 'function') ? regionDist(from, to) : 1);
      const base = F.flat != null ? F.flat : F.perHop * hops;
      const d = this.fareDiscount(); const cost = Math.round(base * (1 - d));
      return { cost, base, free: false, hops, note: d ? `${k === 'kama' ? '관리국' : '길드'} 소속 할인 ${Math.round(d * 100)}%` : '' };
    },
    // 요금을 낸다. 모자라면 null. 낸 돈은 이번 달 교통비로 쌓인다
    payFare(kind, from, to, duty = false) {
      const f = this.fareOf(kind, from, to, duty); if (!f) return null;
      const p = this.player; if (p.money < f.cost) return null;
      p.money -= f.cost; this.transportInit(); p.pay.fare += f.cost;
      return f;
    },
    // ---------- 소유 탈것 ----------
    ownVehiclePrice(id) { const v = ownVehicleById(id); return v ? Math.round(v.price * (this.priceMul ? this.priceMul() : 1)) : 0; },
    ownVehicleUpkeep(id) { const v = ownVehicleById(id); return v ? v.upkeep : 0; },
    ownRepairCost(id) { const v = ownVehicleById(id); return v ? v.repair : 0; },
    ownVehicleResale(id) { return Math.round(this.ownVehiclePrice(id) * OWN_RULE.resale); },
    ownVehicleBlock(id) {
      const v = ownVehicleById(id); const p = this.player; if (!v) return '없는 탈것이다.';
      if (v.needLicense && !p.driveLicense) return '운전면허가 있어야 한다.';
      if (v.minRank && (p.official ?? p.rankIdx) < v.minRank) return `${RANKS[v.minRank].key}급 이상 헌터 장비 허가가 있어야 한다.`;
      return '';
    },
    // 지금 탈 수 있는가: 고장·유지비 밀림이면 못 탄다
    ownVehicleUsable() { const o = this.player.ownVehicle; return !!(o && !o.broken && !o.unpaid); },
    buyOwnVehicle(id) {
      const v = ownVehicleById(id); const p = this.player; const why = this.ownVehicleBlock(id); if (why) return why;
      const price = this.ownVehiclePrice(id); const trade = p.ownVehicle ? this.ownVehicleResale(p.ownVehicle.id) : 0;
      if (p.money + trade < price) return '크레딧이 부족하다.';
      const old = p.ownVehicle && ownVehicleById(p.ownVehicle.id);
      p.money += trade - price;
      p.ownVehicle = { id, since: mk(this), broken: false, unpaid: 0 };
      this.lifeEvent && this.lifeEvent(`${v.name}을(를) 샀다.`);
      return josa(`${v.name}을(를) 샀다. -${fmt(price)} 크레딧${old ? ` (타던 ${old.name}을(를) ${fmt(trade)}에 넘겼다)` : ''} · 월 유지비 ${fmt(v.upkeep)}`);
    },
    sellOwnVehicle() {
      const p = this.player; const o = p.ownVehicle; if (!o) return '팔 탈것이 없다.';
      const v = ownVehicleById(o.id); const val = Math.round(this.ownVehicleResale(o.id) * (o.broken ? 0.5 : 1));
      p.money += val; p.ownVehicle = null;
      return josa(`${v.name}을(를) ${fmt(val)} 크레딧에 팔았다.${o.broken ? ' (고장 난 채라 값이 반으로 깎였다)' : ''}`);
    },
    // 고장: F의 사건이 부른다. 수리비를 바로 내면 고치고, 못 내면 고장 상태로 둔다
    breakOwnVehicle(why = '') {
      const o = this.player.ownVehicle; if (!o) return ''; o.broken = true;
      const v = ownVehicleById(o.id); return josa(`${v.name}이(가) 고장 났다.${why ? ` (${why})` : ''} 수리비 ${fmt(v.repair)} 크레딧.`);
    },
    repairOwnVehicle() {
      const p = this.player; const o = p.ownVehicle; if (!o || !o.broken) return '고칠 것이 없다.';
      const c = this.ownRepairCost(o.id); if (p.money < c) return '크레딧이 부족하다.';
      p.money -= c; o.broken = false; this.transportInit(); p.pay.upkeep += c;
      return josa(`${ownVehicleById(o.id).name}을(를) 고쳤다. -${fmt(c)} 크레딧`);
    },
    // 월 유지비. 소속이 차량을 대 주는 경우(F가 p.vehicleIssued로 표시)는 없음
    transportMonthly() {
      const p = this.player; this.transportInit(); const o = p.ownVehicle; const lines = [];
      if (o) {
        const v = ownVehicleById(o.id); const c = v ? v.upkeep : 0;
        if (c > 0) {
          if (p.money >= c) { p.money -= c; p.pay.upkeep += c; if (o.unpaid) { o.unpaid = 0; lines.push(`밀린 ${v.name} 유지비를 정리했다.`); } }
          else {
            o.unpaid = (o.unpaid || 0) + 1;
            if (o.unpaid >= OWN_RULE.seizeAfter) { p.ownVehicle = null; lines.push(`${v.name} 유지비가 ${o.unpaid}개월 밀려 압류됐다.`); this.log(`${v.name}이(가) 압류됐다.`, 'bad'); }
            else lines.push(`${v.name} 유지비 ${fmt(c)}을(를) 못 내 이번 달은 세워 둔다. (밀림 ${o.unpaid}/${OWN_RULE.seizeAfter})`);
          }
        }
      }
      const fare = p.pay.fare, up = p.pay.upkeep;
      if (fare || up) lines.unshift(`교통비 ${fmt(fare)} · 차량 유지비 ${fmt(up)}`);
      if (lines.length) {
        this.log(josa(`월말 정산 · ${lines.join(' · ')}`), lines.some((t) => /압류|못 내/.test(t)) ? 'bad' : '');
        if (p.pay.last && p.pay.last.mk === mk(this) && Array.isArray(p.pay.last.extra)) p.pay.last.extra.push(...lines);
      }
      p.pay.lastTransport = { mk: mk(this), fare, upkeep: up };
      p.pay.fare = 0; p.pay.upkeep = 0;
    },
  });
  wrap('initSandbox', function (base) { base.call(this); this.transportInit(); });
  // payroll의 월말 정산(worldMonthly 안) 뒤에 붙는다
  wrap('worldMonthly', function (base) { base.call(this); try { this.transportMonthly(); } catch (e) { console.warn('transport', e); } });
}
