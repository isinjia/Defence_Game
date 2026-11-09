// ===== 부업 가게 경영 =====
// 설계: docs/헌터물_제안4_결합장르.md 4 (사용자 승인)
//  - 도시 하나에 가게(포차·식당·장비점·카페)를 차린다. 매달 매출은 도시 크기·평판, 가게 단계, 점장, 괴수 요리 재고, 내가 있는지, 브레이크로 정해진다.
//  - 괴수 부산물을 납품하면 괴수 요리가 메뉴에 오른다(매출 +30%). 한 그릇은 내 몫으로 챙길 수 있다(한 달 버프).
//  - 장비점은 가방의 장비를 55%에 위탁 판매한다. 먹을 것을 파는 가게엔 그 도시 각성자들이 단골이 된다.
//  - 가게에서 사건이 생긴다: 손님 싸움, 정보 거래, 수상한 모임, 유명인 방문, 먹튀.

const BIZ_TYPES = {
  pocha: { name: '포차', cost: 2500, base: 150, desc: '싸고 시끄럽다. 단골이 빨리 는다.' },
  diner: { name: '괴수 요리 식당', cost: 4000, base: 220, desc: '괴수 요리 재고가 있으면 매출이 크게 뛴다.' },
  gearshop: { name: '장비점', cost: 4500, base: 170, desc: '가방의 장비를 55%에 위탁 판매한다.' },
  cafe: { name: '헌터 카페', cost: 3500, base: 190, desc: '정보가 오가는 곳. 사건이 자주 생긴다.' },
};
const BIZ_MAX_LV = 3;
FACILITIES.push({ id: 'biz', name: '내 가게', desc: '포차·식당·장비점·카페를 차려 부업으로 꾸린다.' });
FAC_ICON.biz = '<path d="M4 10h16l-1-5H5zM5 10v9h14v-9M9 19v-5h6v5"/>';

Object.assign(Game.prototype, {
  bizInit() { const p = this.player; if (!p) return; p.biz ??= null; },
  bizBuy(type) {
    const p = this.player; const T = BIZ_TYPES[type]; if (!T || !this.onCity()) return '';
    if (p.biz) return '가게는 하나만 꾸릴 수 있다.';
    const c = Math.round(T.cost * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c;
    p.biz = { type, region: this.region().id, lv: 1, stock: 0, manager: 0, sales: [], name: `${p.name}의 ${T.name}`, regulars: [] };
    this.lifeEvent(`${this.region().name}에 ${T.name}을(를) 차렸다.`);
    return `${this.region().name}에 ${T.name}을(를) 열었다. (−${fmt(c)} 크레딧)`;
  },
  bizSell() {
    const p = this.player; const b = p.biz; if (!b || !this.onCity() || b.region !== this.region().id) return '';
    const v = Math.round(BIZ_TYPES[b.type].cost * (0.4 + 0.3 * (b.lv - 1)));
    p.money += v; p.biz = null;
    this.lifeEvent(`가게를 정리했다.`);
    return `가게를 넘겼다. +${fmt(v)} 크레딧`;
  },
  bizUpCost() { const b = this.player.biz; return Math.round(3000 * b.lv ** 1.5); },
  bizUpgrade() {
    const p = this.player; const b = p.biz; if (!b || b.lv >= BIZ_MAX_LV) return '';
    const c = Math.round(this.bizUpCost() * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; b.lv++;
    return `가게를 넓혔다. ${b.lv}단계 (−${fmt(c)} 크레딧)`;
  },
  bizHire() {
    const p = this.player; const b = p.biz; if (!b || b.manager >= 2) return '';
    b.manager++;
    return b.manager === 1 ? '점장을 뽑았다. 내가 자리를 비워도 가게가 돈다. (월급 나감)' : '숙련 점장으로 바꿨다. 매출이 더 오른다.';
  },
  bizDeliver() {
    const p = this.player; const b = p.biz; if (!b || !p.parts) return '';
    let n = 0;
    for (const k of Object.keys(p.parts)) { if (k.startsWith('essence')) continue; n += p.parts[k]; p.parts[k] = 0; }
    if (!n) return '납품할 괴수 부산물이 없다.';
    b.stock += n * 3;
    return `괴수 부산물 ${n}개를 주방에 넘겼다. 괴수 요리 ${n * 3}그릇 분량.`;
  },
  bizMeal() {
    const p = this.player; const b = p.biz; if (!b || b.stock < 5) return '요리 재고가 모자라다(5그릇).';
    b.stock -= 5;
    const stat = RNG.pick(['atk', 'def', 'hp', 'spd']);
    p.buffs.push({ stat, val: 0.08, until: this.monthKey(), name: '괴수 요리' });
    this.recalc();
    return `특제 괴수 요리를 먹었다. 이번 달 ${MOD_NAME[stat]} +8%`;
  },
  bizMonthly() {
    const p = this.player; const b = p.biz; if (!b) return;
    const T = BIZ_TYPES[b.type]; const reg = regionById(b.region);
    const brk = this.cityBreak(b.region);
    let sale = 0;
    if (brk) {
      if (RNG.chance(0.25) && b.lv > 1) { b.lv--; this.log(`${reg.name} 브레이크로 가게가 부서졌다. (${b.lv}단계)`, 'bad'); }
      else this.log(`${reg.name} 브레이크로 이번 달은 장사를 못 했다.`, 'bad');
    } else {
      const present = p.region === b.region;
      sale = T.base * b.lv ** 1.2 * (BIG_CITIES.includes(b.region) ? 1.3 : 1) * (1 + Math.max(-50, this.rep(b.region)) / 300)
        * (b.manager ? 1 + 0.15 * b.manager : present ? 1 : 0.7) * RNG.range(0.8, 1.2);
      if (b.stock > 0) { const used = Math.min(b.stock, 6 * b.lv); b.stock -= used; sale *= 1 + (b.type === 'diner' ? 0.5 : 0.3) * (used / (6 * b.lv)); }
      sale -= T.base * 0.25 + 120 * b.manager;
      sale = Math.round(sale);
      p.money = Math.max(0, p.money + sale);
      // 단골
      if (b.type !== 'gearshop') {
        const here = this.npcs.filter((n) => n.alive && !n.child && n.region === b.region);
        for (let k = 0; k < (b.type === 'pocha' ? 3 : 2) && here.length; k++) { const n = RNG.pick(here); n.met = true; this.changeRel(n, 1); if (!b.regulars.includes(n.id) && n.relation >= 30) b.regulars.push(n.id); }
        b.regulars = b.regulars.filter((id) => { const n = this.npcById(id); return n && n.alive; }).slice(-8);
      }
      // 장비점 위탁 판매: 가방 장비 중 가장 싼 것 둘
      if (b.type === 'gearshop') {
        const sell = p.inventory.filter((e) => !e.soul && !e.uniq && !e.cursed).sort((x, y) => x.value - y.value).slice(0, 1 + b.lv);
        let v = 0; for (const e of sell) { v += Math.round(e.value * 0.55); p.inventory = p.inventory.filter((x) => x !== e); }
        if (v) { p.money += v; sale += v; this.log(`장비점에서 위탁 장비 ${sell.length}점이 팔렸다. +${fmt(v)} 크레딧`); }
      }
    }
    b.sales.push(sale); if (b.sales.length > 6) b.sales.shift();
    if (sale) this.log(`${b.name} 이번 달 ${sale >= 0 ? '순이익' : '적자'} ${fmt(Math.abs(sale))} 크레딧`, sale >= 0 ? '' : 'bad');
    if (!brk && RNG.chance(b.type === 'cafe' ? 0.22 : 0.12)) this.queue.push({ type: 'bizEvent', kind: RNG.pick(['fight', 'info', 'secret', 'celeb', 'dine']) });
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.bizInit(); });
  wrap('worldMonthly', function (base) { base.call(this); this.bizMonthly(); });
}

// ---------- 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id !== 'biz') return baseFac.call(this, id, reg);
    const p = G.player; const b = p.biz; const pm = G.priceMul();
    const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(Math.round(v))}</span>`;
    if (!b) return `<p>헌터 일만이 인생은 아니다. 약할 때도, 은퇴한 뒤에도 꾸릴 수 있는 가게.</p><div class="cards">${Object.entries(BIZ_TYPES).map(([k, T]) => `<div class="item-row"><div class="grow"><b>${T.name}</b><div class="small dim">${T.desc}</div></div><button class="sm" data-act="biz-buy" data-v="${k}">${coin(T.cost * pm)}</button></div>`).join('')}</div>`;
    if (b.region !== reg.id) return `<p>내 가게 <b>${b.name}</b>는 ${regionById(b.region).name}에 있다. 가게 일은 그곳에서 본다.</p><div class="small dim">최근 이익: ${b.sales.map((s) => fmt(s)).join(' · ') || '없음'}</div>`;
    const T = BIZ_TYPES[b.type];
    const regs = b.regulars.map((id) => G.npcById(id)).filter(Boolean);
    return `<p><b>${b.name}</b> · ${b.lv}단계 · 점장 ${['없음', '있음', '숙련'][b.manager]}</p>
      <div class="small dim">${T.desc} 최근 이익: ${b.sales.map((s) => fmt(s)).join(' · ') || '아직 없음'}. 괴수 요리 재고 ${b.stock}그릇.</div>
      ${regs.length ? `<div class="small">단골: ${regs.map((n) => n.name).join(', ')}</div>` : ''}
      <div class="cards">
        <div class="item-row"><div class="grow"><b>괴수 부산물 납품</b><div class="small dim">부산물 1개 = 요리 3그릇. 재고가 있으면 매출이 오른다.</div></div><button class="sm" data-act="biz-deliver">납품</button></div>
        <div class="item-row"><div class="grow"><b>특제 괴수 요리 먹기</b><div class="small dim">재고 5그릇 · 이번 달 능력치 하나 +8%</div></div><button class="sm" data-act="biz-meal" ${b.stock >= 5 ? '' : 'disabled'}>먹는다</button></div>
        ${b.lv < BIZ_MAX_LV ? `<div class="item-row"><div class="grow"><b>가게 넓히기</b></div><button class="sm" data-act="biz-up">${coin(G.bizUpCost() * pm)}</button></div>` : ''}
        ${b.manager < 2 ? `<div class="item-row"><div class="grow"><b>${b.manager ? '숙련 점장으로 교체' : '점장 고용'}</b><div class="small dim">월급 120 크레딧씩. 자리를 비워도 매출 유지·상승</div></div><button class="sm" data-act="biz-hire">고용</button></div>` : ''}
        <div class="row end"><button class="sm ghost" data-act="biz-sell">가게 정리</button></div>
      </div>`;
  };
  UI.showBizEvent = function (q) {
    const b = G.player.biz; if (!b) return this.processQueue();
    this.bizQ = q;
    const here = G.npcs.filter((n) => n.alive && !n.child && n.region === b.region);
    const a = RNG.pick(here) || { name: '손님', id: -1 }; const c = RNG.pick(here.filter((x) => x !== a)) || { name: '다른 손님', id: -1 };
    q.a = a.id; q.c = c.id;
    const T = {
      fight: [`${a.name}과(와) ${c.name}이(가) 술잔을 집어 던지며 싸우기 시작했다. 가게가 엉망이 되기 직전이다.`, ['말린다', '둘 다 내쫓는다']],
      info: [`단골 하나가 목소리를 낮춘다. "사장님, 좋은 정보가 있는데. 한 잔 값이면 돼요."`, ['한 잔 낸다', '사양한다']],
      secret: ['구석 방을 빌린 손님들이 수상하다. 흰 로브가 언뜻 보였다.', ['관리국에 신고한다', '모른 척 방값을 받는다']],
      celeb: [`유명 헌터 방송인이 가게를 찾았다! 촬영을 해도 되냐고 묻는다.`, ['좋다고 한다', '조용히 드시게 한다']],
      dine: ['계산할 때가 되자 손님 하나가 슬그머니 문으로 향한다.', ['쫓아간다', '그냥 둔다']],
    }[q.kind];
    this.modal(`<div class="eyebrow">가게 사건 · ${b.name}</div><p class="event-text">${T[0]}</p><div class="cards">${T[1].map((t, i) => `<button class="choice-btn" data-act="biz-ev" data-v="${i}">${t}</button>`).join('')}</div>`, 'event-box');
  };
  UI.bizEvent = function (i) {
    const q = this.bizQ; this.bizQ = null; this.closeModal(); if (!q) return;
    const p = G.player; const b = p.biz; if (!b) return this.processQueue();
    const a = G.npcById(q.a); const c = G.npcById(q.c);
    let msg = '';
    switch (q.kind) {
      case 'fight': if (i === 0) { if (a) G.changeRel(a, 4); if (c) G.changeRel(c, 4); msg = '둘을 뜯어말렸다. 결국 같이 한 잔 더 하고 갔다.'; } else { G.addRep(b.region, 2); if (a) G.changeRel(a, -6); if (c) G.changeRel(c, -6); msg = '둘을 내쫓았다. 다른 손님들이 박수를 쳤다.'; } break;
      case 'info': if (i === 0) { const cl = G.randomClue ? G.randomClue('가게 단골') : ''; p.money = Math.max(0, p.money - 50); msg = cl ? `"…그러니까, ${cl}." 귀가 번쩍 뜨인다.` : '별 쓸모없는 이야기였다.'; } else msg = '정보는 사양했다.'; break;
      case 'secret': if (i === 0) { p.merit += 4; if (G.addLaw) G.addLaw(4, '수상한 모임 신고'); msg = '관리국이 출동했다. 균열교 연락책이 잡혔다는 소식. (공적 +4)'; } else { const v = Math.round(300 * b.lv); p.money += v; if (G.addLaw) G.addLaw(-4); msg = `방값으로 ${fmt(v)} 크레딧을 받았다. 무엇을 의논했는지는 모른다.`; } break;
      case 'celeb': if (i === 0) { p.fame += 4; p.money += Math.round(200 * b.lv); msg = '방송이 나간 뒤 손님이 몰렸다. (명성 +4)'; } else { if (a) G.changeRel(a, 3); msg = '방송인은 고마워하며 조용히 먹고 갔다.'; } break;
      case 'dine': if (i === 0) { msg = RNG.chance(0.6) ? '잡았다. 사정을 들어 보니 굶은 신입 헌터였다. 밥값 대신 접시를 닦고 갔다.' : '놓쳤다. 각성자 다리는 빠르다.'; } else { p.money = Math.max(0, p.money - 30); msg = '그냥 보냈다. 언젠가 갚으러 오겠지.'; } break;
      default: break;
    }
    G.save(); return this.after(msg);
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'bizEvent') { G.queue.shift(); return this.showBizEvent(q); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const city = (r) => { G.save(); return this.afterCity(r); };
    switch (act) {
      case 'biz-buy': return city(G.bizBuy(v));
      case 'biz-sell': return city(G.bizSell());
      case 'biz-up': return city(G.bizUpgrade());
      case 'biz-hire': return city(G.bizHire());
      case 'biz-deliver': return city(G.bizDeliver());
      case 'biz-meal': return city(G.bizMeal());
      case 'biz-ev': return this.bizEvent(+v);
      default: return baseHandle.call(this, act, v);
    }
  };
}
