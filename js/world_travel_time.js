// 월드맵 한 칸 약 2km: 각성자 도보 평지 15분, 국도 7.5분. 이동 시간은 dayFrac에 누적한다.
(() => {
  const BASE = 15 / 1440;
  const SPEED = { bicycle: 2 / 3, usedbike: 1 / 3, bike: 1 / 3, car: .5, suv: .5, truck: .5, heli: .1 };
  WORLD.formatTravelTime = days => {
    const minutes = Math.max(0, Math.ceil(days * 1440 - 1e-7));
    if (!minutes) return '0분';
    const d = Math.floor(minutes / 1440), h = Math.floor(minutes % 1440 / 60), m = minutes % 60;
    return [d ? `${d}일` : '', h ? `${h}시간` : '', m ? `${m}분` : ''].filter(Boolean).join(' ');
  };
  WORLD.daysFor = cost => Math.max(0, cost * WORLD.DAYS_PER_COST);
  const GP = Game.prototype, baseTerrain = GP.applyTerrain;
  GP.applyTerrain = function (...args) {
    const result = baseTerrain.apply(this, args);
    const rented = this.player?.vehicle, owned = this.player && this.ownVehicle?.();
    const factor = Math.min(1, SPEED[rented?.id] ?? 1, SPEED[owned?.id] ?? 1);
    WORLD.DAYS_PER_COST = BASE * factor;
    return result;
  };
  GP.travelCostDays = function (cost, road = false) {
    const own = this.ownVehicle?.();
    const roadFactor = road && own?.road ? own.road : 1;
    const partyFactor = typeof UI !== 'undefined' && UI.crewMarch?.ride === 'truck' ? .5 : 1;
    return Math.max(0, cost * WORLD.DAYS_PER_COST * roadFactor * partyFactor);
  };
  GP.travelStepDays = function (x, y, diag = false) {
    return this.travelCostDays(WORLD.stepCostAt(x, y) * (diag ? 1.4 : 1), WORLD.isRoad(x, y));
  };
  GP.travelPathDays = function (steps) {
    let x = this.player.x, y = this.player.y, days = 0;
    for (const tile of steps) { const [nx, ny] = WORLD.xy(tile); days += this.travelStepDays(nx, ny, nx !== x && ny !== y); x = nx; y = ny; }
    return days;
  };
  GP.advanceTravel = function (days, opts = {}) {
    const sum = (this.player.dayFrac || 0) + days;
    const whole = Math.floor(sum + 1e-9);
    this.player.dayFrac = Math.max(0, sum - whole);
    this.advanceDays(whole, opts);
    return whole;
  };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...args) { const result = baseInit.apply(this, args); this.player.dayFrac ??= 0; this.applyTerrain(); return result; };
})();
