// ===== 게이트 크로니클: 지도 탐험 =====
// 지역 탐사율, 지도 위 탐사 지점(볼거리), 지형의 의미.
// 저장: G.world.explore = { sites: [...], nextId, done: {regionId: true} }

const SITE_KINDS = {
  ruin:     { name: '폐허 탐사',            icon: '▥', color: '#ff9a5c', desc: '무너진 건물 더미. 무언가 묻혀 있을지도 모른다.' },
  spring:   { name: '에테르 샘',            icon: '✦', color: '#c578ff', desc: '에테르가 솟아나는 샘. 한 번에 크게 흡수할 수 있지만 몸이 버틸지 모른다.' },
  outpost:  { name: '버려진 관리국 초소',   icon: '⌂', color: '#7fb6ff', desc: '대붕괴 직후 세워졌다 버려진 초소. 옛 기록과 보급품이 남아 있을지도.' },
  village:  { name: '생존자 마을',          icon: '⌂', color: '#6bdc8b', desc: '도시의 보호 밖에서 버티는 사람들의 마을.' },
  remains:  { name: '쓰러진 헌터의 흔적',   icon: '✝', color: '#c9ced6', desc: '부서진 장비와 인식표. 누군가 여기서 돌아가지 못했다.' },
  altar:    { name: '균열교 제단',          icon: '◬', color: '#ff4f6a', desc: '게이트를 신으로 섬기는 균열교의 제단. 아직 온기가 남아 있다.' },
  merchant: { name: '떠돌이 상인',          icon: '◈', color: '#ffb547', desc: '길목을 떠도는 행상. 물건은 진짜일 수도, 아닐 수도.' },
  tower:    { name: '감시탑',               icon: '▲', color: '#46e0d0', desc: '산꼭대기의 낡은 통신 감시탑. 올라가면 주변이 넓게 보인다.' },
};
const SITE_PLAN = { ruin: 6, spring: 3, outpost: 3, village: 3, remains: 3, altar: 2, merchant: 1, tower: 4 };

const EXPLORE = (() => {
  const T = WORLD.T;
  const N = WORLD.COLS * WORLD.ROWS;
  // 지역별 땅 칸 (탐사율 분모)
  const regionLand = {};
  for (let i = 0; i < N; i++) {
    const r = WORLD.region[i]; if (r < 0) continue;
    const t = WORLD.tiles[i]; if (t === T.SEA || t === T.NORTH) continue;
    (regionLand[REGIONS[r].id] ||= []).push(i);
  }
  const around = (i, r, fn) => {
    const [x, y] = WORLD.xy(i); let c = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (!dx && !dy) continue; if (WORLD.inb(x + dx, y + dy) && fn(WORLD.tiles[WORLD.idx(x + dx, y + dy)])) c++; }
    return c;
  };
  const cityDist = (i) => {
    const [x, y] = WORLD.xy(i);
    return Math.min(...REGIONS.map((r) => { const [cx, cy] = WORLD.cityPos[r.id]; return Math.max(Math.abs(cx - x), Math.abs(cy - y)); }));
  };
  // 지점 종류별 후보 칸과 선호 점수
  const land = [];
  for (let i = 0; i < N; i++) { const t = WORLD.tiles[i]; if (WORLD.region[i] >= 0 && t !== T.SEA && t !== T.NORTH && t !== T.CITY && t !== T.BRIDGE) land.push(i); }
  const cand = {
    ruin: () => land.filter((i) => WORLD.tiles[i] === T.RUIN).map((i) => [i, 1]),
    spring: () => land.filter((i) => WORLD.tiles[i] === T.ETHER).map((i) => [i, 1 + around(i, 1, (t) => t === T.ETHER) * 2]),
    outpost: () => land.filter((i) => WORLD.tiles[i] === T.MOUNTAIN && around(i, 1, (t) => t === T.PLAIN) >= 2).map((i) => [i, 1]),
    village: () => land.filter((i) => WORLD.tiles[i] === T.PLAIN && cityDist(i) >= 5).map((i) => [i, cityDist(i)]),
    remains: () => land.filter((i) => WORLD.tiles[i] === T.PLAIN || WORLD.tiles[i] === T.RUIN).map((i) => [i, 1]),
    altar: () => land.filter((i) => cityDist(i) >= 6).map((i) => [i, cityDist(i) ** 2]),
    merchant: () => land.filter((i) => WORLD.tiles[i] === T.PLAIN && cityDist(i) >= 2 && cityDist(i) <= 5).map((i) => [i, 1]),
    tower: () => land.filter((i) => WORLD.tiles[i] === T.MOUNTAIN).map((i) => [i, 1 + around(i, 2, (t) => t === T.MOUNTAIN) ** 1.5]),
  };
  return { regionLand, cand, land, cityDist };
})();

Object.assign(Game.prototype, {
  exploreState() { return this.world && this.world.explore; },
  sites() { const e = this.exploreState(); return e ? e.sites : []; },
  siteAt(x, y) { return this.sites().find((s) => s.x === x && s.y === y) || null; },
  siteById(id) { return this.sites().find((s) => s.id === id) || null; },

  // 판마다 한 번, 지도 위에 탐사 지점을 깐다
  genSites() {
    const sites = []; let id = 1;
    const taken = (i) => { const [x, y] = WORLD.xy(i); return sites.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < 3); };
    for (const [kind, n] of Object.entries(SITE_PLAN)) {
      const pool = EXPLORE.cand[kind]();
      for (let k = 0; k < n; k++) {
        const free = pool.filter(([i]) => !taken(i));
        if (!free.length) break;
        const i = RNG.weighted(free.map((f) => f[0]), free.map((f) => f[1]));
        const [x, y] = WORLD.xy(i);
        sites.push({ id: id++, kind, x, y, region: REGIONS[WORLD.region[i]].id, known: false, visited: false, used: 0 });
      }
    }
    // 빈 곳 메우기: 지점이 하나도 없는 지역에 폐허·흔적을 하나씩
    for (const r of REGIONS) {
      if (sites.some((s) => s.region === r.id)) continue;
      const pool = (WORLD.regionTiles[r.id] || []).filter((i) => !taken(i));
      if (!pool.length) continue;
      const i = RNG.pick(pool); const [x, y] = WORLD.xy(i);
      sites.push({ id: id++, kind: WORLD.tiles[i] === WORLD.T.RUIN ? 'ruin' : 'remains', x, y, region: r.id, known: false, visited: false, used: 0 });
    }
    return { sites, nextId: id, done: {} };
  },
  exploreInit() {
    this.world.explore ??= this.genSites();
    const e = this.world.explore; e.done ??= {};
    for (const s of e.sites) { s.used ??= 0; s.known ??= false; }
  },

  // ---------- 탐사율 ----------
  regionExplore(regionId) {
    const tiles = EXPLORE.regionLand[regionId] || [];
    const seen = tiles.reduce((a, i) => a + (this.fog[i] ? 1 : 0), 0);
    const ss = this.sites().filter((s) => s.region === regionId && s.kind !== 'merchant' && !s.north);
    const found = ss.filter((s) => s.visited).length;
    const tilePct = tiles.length ? seen / tiles.length : 1;
    const pct = Math.floor((tilePct * 0.6 + (ss.length ? found / ss.length : 1) * 0.4) * 100);
    return { seen, tiles: tiles.length, found, sites: ss.length, tilePct, pct, complete: tilePct >= 0.97 && found >= ss.length };
  },
  exploreCompleteCount() { const e = this.exploreState(); return e ? Object.keys(e.done).length : 0; },
  checkExplore() {
    const e = this.exploreState(); if (!e) return;
    for (const r of REGIONS) {
      if (e.done[r.id]) continue;
      if (!this.regionExplore(r.id).complete) continue;
      e.done[r.id] = this.monthKey();
      this.addRep(r.id, 20);
      const p = this.player; p.fame += 8 + r.danger * 4;
      const money = 300 * r.danger * (1 + p.rankIdx);
      p.money += money;
      this.lifeEvent(`${r.name} 일대를 남김없이 걸어 지도를 완성했다.`);
      this.log(`${r.name} 탐사 완료. 협회에 측량 기록을 넘기고 ${fmt(money)} 크레딧과 지역 평판을 받았다.`, 'good');
      this.queue.push({ type: 'toast', text: `${r.name} 탐사 100% · 평판 +20, 명성 +${8 + r.danger * 4}, ${fmt(money)} 크레딧` });
    }
  },

  // ---------- 지점 발견 ----------
  // 밝혀진 칸의 지점은 실루엣(?)으로 보이고, 들르면 정체가 드러난다
  siteSeen(s) { return s.known || s.visited || this.revealed(s.x, s.y); },
  revealSitesNear(x, y, r) {
    let n = 0;
    for (const s of this.sites()) if (!s.known && Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) <= r) { s.known = true; n++; }
    return n;
  },
  siteActive(s) {
    const key = this.monthKey();
    switch (s.kind) {
      case 'ruin': case 'outpost': case 'remains': case 'tower': return !s.used;
      case 'spring': return !s.used || key - s.used >= 12;
      case 'altar': return !s.used;
      case 'village': case 'merchant': return s.used !== key;
      default: return false;
    }
  },
  // 떠돌이 상인은 매달 자리를 옮긴다
  moveMerchants() {
    for (const s of this.sites()) {
      if (s.kind !== 'merchant') continue;
      const pool = EXPLORE.cand.merchant().map((c) => c[0]).filter((i) => { const [x, y] = WORLD.xy(i); return !this.siteAt(x, y) && !this.objAt(x, y); });
      if (!pool.length) continue;
      const [x, y] = WORLD.xy(RNG.pick(pool));
      s.x = x; s.y = y; s.region = WORLD.regionAt(x, y).id; s.known = false; s.stock = null;
    }
  },

  // ---------- 지점 행동 ----------
  // 돌려주는 값: 화면에 보일 결과 문장
  siteAct(id, choice) {
    const s = this.siteById(id); if (!s) return '';
    const p = this.player; const key = this.monthKey();
    const pr = p.rankIdx; const tierNear = Math.max(0, Math.min(7, pr + RNG.int(-1, 0)));
    // 판정(js/check.js): this._ck = true(성공)/false(실패)/undefined(판정 없음), 결과 목록은 gain/loss 로 모은다
    const ck = this._ck; const who = this._ckNpc || null;
    const gain = (t) => { if (this._ckOut) this._ckOut.gains.push(t); };
    const loss = (t) => { if (this._ckOut) this._ckOut.losses.push(t); };
    const hurt = (f) => {
      if (who) { loss(`${who.name} 부상 (체력 -${Math.round(f * 100)}%)`); return 0; }
      const d = Math.max(1, Math.round(p.maxHp * f)); p.hp = Math.max(1, p.hp - d); loss(`체력 -${fmt(d)}`); return d;
    };
    const ok = ck == null ? RNG.chance(0.6) : ck;
    s.visited = true; s.known = true;
    let out = '';
    switch (s.kind) {
      case 'ruin': {
        if (choice !== 'search') return '폐허를 지나쳤다.';
        s.used = key; this.advanceDays(2, { noSave: true });
        loss('2일 소요');
        const r = ok ? RNG.weighted(['relic', 'core', 'cache'], [22 + p.luck / 10, 50, 28]) : RNG.weighted(['trap', 'beast', 'none'], [40, 35, 25]);
        if (r === 'relic') { const t = this.addRelic(); gain(t); out = `무너진 잔해를 조심스럽게 들어내자 그 밑에 ${t}이(가) 묻혀 있었다.`; }
        else if (r === 'core') { const n = RNG.int(2, 3); this.addCore(tierNear, n); gain(`${coreName(tierNear)} ${n}개`); out = `괴수 사체 더미를 헤집어 쓸 만한 코어를 골라냈다.`; }
        else if (r === 'cache') { const m = Math.round(70 * RANKS[pr].mult * RNG.range(0.8, 1.3)); p.money += m; p.items.potion = (p.items.potion || 0) + 1; gain(`크레딧 +${fmt(m)}`); gain('응급 회복제 1개'); out = '무너진 약국 창고에서 아직 멀쩡한 물자를 찾아냈다.'; }
        else if (r === 'trap') { hurt(0.25); out = '발밑이 꺼지며 무너지는 천장에 깔렸다. 간신히 빠져나왔다.'; }
        else if (r === 'beast') {
          const near = MONSTERS.filter((m) => Math.abs(m.tier - tierNear) <= 1); const tpl = RNG.pick(near.length ? near : MONSTERS);
          const mob = { id: this.nextObjId++, kind: 'mob', x: s.x, y: s.y, region: s.region, tier: tierNear, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(1, 2), born: key };
          this.mobs.push(mob); this.queue.push({ type: 'mobAmbush', mobId: mob.id });
          loss(`${tpl.name} 무리의 습격`);
          out = `잔해를 건드린 소리에 안에 잠들어 있던 ${tpl.name}이(가) 눈을 떴다!`;
        } else out = '한참을 뒤졌지만 이미 누가 다 털어 간 뒤였다.';
        break;
      }
      case 'spring': {
        if (choice !== 'absorb') return '샘을 그대로 두고 떠났다.';
        s.used = key; this.advanceDays(3, { noSave: true }); loss('3일 소요');
        if (ok) { const v = this.etherGift(RNG.int(100, 150)); gain(`에테르 +${fmt(v)}`); out = '호흡을 고르며 샘의 에테르를 천천히 받아들였다. 흐름이 몸 구석구석에 고르게 스민다.'; }
        else {
          const v = this.etherGift(RNG.int(35, 60)); gain(`에테르 +${fmt(v)}`);
          hurt(0.2); out = '에테르가 한꺼번에 밀려들었다. 혈관이 타는 듯해 중간에 손을 뗐다.';
          if (!who && RNG.chance(0.4)) { p.injured = Math.max(p.injured || 0, 1); loss('부상 1개월'); }
        }
        break;
      }
      case 'outpost': {
        s.used = key; this.advanceDays(1, { noSave: true }); loss('1일 소요');
        const pot = ok ? RNG.int(2, 3) : RNG.int(0, 1), man = ok ? RNG.int(1, 2) : 0;
        p.items.potion = (p.items.potion || 0) + pot; if (man) p.items.mana = (p.items.mana || 0) + man;
        const lore = RNG.pick([
          '"대붕괴 3일째. 북쪽 통신 두절. 제주 방향에서 에테르 수치가 계속 오른다."',
          '"본부는 원초의 게이트를 봉쇄 대상으로 분류했다. 우리는 그 이름을 입에 올리지 말라는 명령을 받았다."',
          '"균열교 신도들이 초소 주변을 맴돈다. 밤마다 노래가 들린다."',
          '"북부 봉쇄선 너머로 정찰조 셋이 들어갔다. 아무도 돌아오지 않았다."',
          '"게이트는 무작위가 아니다. 사람이 많은 곳을 따라 열린다. 상부는 이 보고를 묻었다."',
        ]);
        const n = ok ? this.revealSitesNear(s.x, s.y, 7) : 0;
        if (pot) gain(`응급 회복제 ${pot}개`); if (man) gain(`마나 앰플 ${man}개`); if (n) gain(`주변 지점 ${n}곳 위치`);
        if (!ok) hurt(0.08);
        out = ok ? `잠긴 서랍을 따고 초소 일지를 찾아냈다. ${lore} 벽에 붙은 작전 지도도 고스란히 남아 있었다.` : `녹슨 문을 억지로 열다 손을 다쳤다. 일지는 물에 젖어 한 줄만 읽혔다. ${lore}`;
        this.rumor(`버려진 초소의 기록: ${lore}`);
        break;
      }
      case 'village': {
        s.used = key;
        if (choice === 'help') {
          this.advanceDays(3, { noSave: true }); loss('3일 소요');
          if (ok) {
            const money = Math.round(90 * RANKS[pr].mult * RNG.range(0.8, 1.2));
            p.money += money; this.addRep(s.region, 5); p.fame += 1;
            gain(`크레딧 +${fmt(money)}`); gain('지역 평판 +5'); gain('명성 +1');
            out = '무너진 방벽을 다시 쌓고, 밤마다 마을을 넘보던 괴수 무리를 쫓아냈다. 촌장이 마을 사람들이 모은 돈을 내밀었다.';
          } else {
            const money = Math.round(30 * RANKS[pr].mult); p.money += money; this.addRep(s.region, 1);
            gain(`크레딧 +${fmt(money)}`); gain('지역 평판 +1'); hurt(0.12);
            out = '방벽을 쌓다 무너지는 돌무더기에 휘말렸다. 일은 반쯤밖에 못 했지만, 마을 사람들은 고맙다며 조금이라도 쥐여 줬다.';
          }
        } else if (choice === 'trade') {
          const herb = p.mats.herb || 0;
          if (herb > 0) { const v = herb * 60; p.mats.herb = 0; p.money += v; out = `약초 ${herb}다발을 넘기고 ${fmt(v)} 크레딧을 받았다.`; }
          const cost = 80;
          if (p.money >= cost) { p.money -= cost; p.items.potion = (p.items.potion || 0) + 1; out += ` 직접 달인 회복제 하나를 ${cost} 크레딧에 샀다.`; }
          out = out.trim() || '팔 것도 살 돈도 없다.';
        } else {
          this.advanceDays(2, { noSave: true });
          p.hp = p.maxHp; p.mp = p.maxMp;
          out = `마을 사람들이 내준 방에서 푹 쉬었다. 체력과 정신이 회복됐다. ${RNG.pick(['"작년 브레이크 때 아들을 잃었어요. 협회 차는 사흘 뒤에야 왔죠."', '"도시요? 거긴 등급 없는 사람한테 방 한 칸 안 내줍니다."', '"밤에 북쪽 산에서 불빛이 보여요. 균열교 놈들이 뭘 하는지."'])}`;
        }
        break;
      }
      case 'remains': {
        s.used = key;
        if (choice === 'take') {
          const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), tierNear);
          p.inventory.push(it);
          out = `유품 가방에서 ${it.name}을(를) 챙겼다.`;
        } else {
          this.addRep(s.region, 6); p.fame += 3; const m = Math.round(60 * RANKS[pr].mult);
          p.money += m;
          out = `인식표를 협회에 보내 유족에게 닿게 했다. 협회가 감사의 뜻으로 ${fmt(m)} 크레딧을 보냈다. 지역 평판과 명성이 올랐다.`;
          this.lifeEvent('들판에 쓰러진 헌터의 인식표를 유족에게 돌려보냈다.');
        }
        break;
      }
      case 'altar': {
        s.used = key;
        if (choice === 'destroy') {
          p.cultGrudge = (p.cultGrudge || 0) + 1; loss('균열교의 원한');
          if (ok) { p.fame += 6; this.addRep(s.region, 8); gain('명성 +6'); gain('지역 평판 +8'); out = '단숨에 제단을 박살 냈다. 근처 마을이 안도했다. 하지만 어디선가 누군가 이 일을 지켜보고 있었다.'; }
          else { p.fame += 2; this.addRep(s.region, 3); gain('명성 +2'); gain('지역 평판 +3'); hurt(0.15); out = '제단에 손을 대자 붉은 에테르가 터져 나왔다. 간신히 부수긴 했지만 대가를 치렀다.'; }
          this.lifeEvent('균열교의 제단을 부쉈다.');
          this.rumor(`누군가 ${regionById(s.region).name} 외곽의 균열교 제단을 박살 냈다고 한다.`);
        } else {
          p.cultFavor = (p.cultFavor || 0) + 1;
          if (ok) { const v = this.etherGift(RNG.int(45, 75)); gain(`에테르 +${fmt(v)}`); out = '제단에 새겨진 문양을 해독했다. 게이트의 맥동을 읽는 법이 어렴풋이 보인다.'; }
          else { const v = this.etherGift(RNG.int(10, 20)); gain(`에테르 +${fmt(v)}`); if (who) loss(`${who.name} 정신 피로`); else { const d = Math.round(p.maxMp * 0.3); p.mp = Math.max(0, p.mp - d); loss(`정신력 -${fmt(d)}`); } out = '문양을 오래 들여다보자 머릿속에 낯선 속삭임이 차올랐다. 서둘러 눈을 돌렸다.'; }
        }
        break;
      }
      case 'merchant': {
        s.stock ??= this.merchantStock();
        const it = s.stock[+choice]; if (!it || it.sold) return '';
        if (p.money < it.price) return '돈이 모자란다.';
        p.money -= it.price; it.sold = true;
        if (it.kind === 'relic') {
          if (it.fake) { this.player.relics.push({ id: it.id, grade: 0, uid: Math.random().toString(36).slice(2, 9) }); out = `[${relicById(it.id).name}]... 감정해 보니 흔한 모조품이다. 상인은 이미 떠난 뒤였다.`; }
          else { this.player.relics.push({ id: it.id, grade: it.grade, uid: Math.random().toString(36).slice(2, 9) }); out = `${RARITY[it.grade].name} 유물 [${relicById(it.id).name}]을(를) 손에 넣었다.`; }
        } else if (it.kind === 'core') { this.addCore(it.tier, it.n); out = `${coreName(it.tier)} ${it.n}개를 샀다.`; }
        else { p.items[it.id] = (p.items[it.id] || 0) + it.n; out = `${it.name} ${it.n}개를 샀다.`; }
        if (s.stock.every((x) => x.sold)) s.used = key;
        break;
      }
      case 'tower': {
        s.used = key; this.advanceDays(1, { noSave: true }); loss('1일 소요');
        this.reveal(s.x, s.y, ok ? 8 : 5);
        const n = this.revealSitesNear(s.x, s.y, ok ? 10 : 5);
        gain(`주변 지형 공개 (반경 ${ok ? 8 : 5}칸)`); if (n) gain(`볼 만한 지점 ${n}곳 표시`);
        if (!ok) hurt(0.1);
        out = ok ? '녹슨 사다리를 단숨에 올라 망원 장비를 켰다. 주변 지형이 넓게 드러났다.' : '중간에 사다리 칸이 부러져 미끄러졌다. 반쯤 올라간 곳에서 보이는 만큼만 지도에 옮겼다.';
        break;
      }
    }
    this.checkExplore();
    this.save();
    return out;
  },
  merchantStock() {
    const p = this.player; const pr = p.rankIdx; const pm = this.priceMul ? this.priceMul() : 1;
    const relic = RNG.pick(RELICS); const grade = RNG.weighted([1, 2, 3], [60, 30, 10]);
    const list = [
      { kind: 'relic', id: relic.id, grade, fake: RNG.chance(0.3), name: `${RARITY[grade].name} 유물 [${relic.name}]`, price: Math.round(relic.val * RARITY[grade].mult * 0.9 * pm / 10) * 10 },
      { kind: 'core', tier: Math.min(7, pr + 1), n: 1, name: `${coreName(Math.min(7, pr + 1))} 1개`, price: Math.round(220 * RANKS[Math.min(7, pr + 1)].mult ** 2 * pm / 10) * 10 },
      { kind: 'item', id: 'potion', n: 3, name: '응급 회복제 3개', price: Math.round(300 * pm / 10) * 10 },
    ];
    return list;
  },

  // ---------- 지형의 의미 ----------
  terrainStep(x, y, res) {
    const p = this.player; const t = WORLD.type(x, y); const T = WORLD.T;
    const out = [];
    // 산악: 괴수 기습이 절반으로 줄고, 가끔 약초를 캔다
    if (t === T.MOUNTAIN) {
      const q = this.queue[this.queue.length - 1];
      if (res.stop && q && q.type === 'mobAmbush' && RNG.chance(0.5)) { this.queue.pop(); res.stop = !!res.city || !!this.objAt(x, y) || this.queue.some((e) => e.type !== 'toast'); out.push('험한 산길 덕에 배회하던 괴수 무리를 피했다.'); }
      if (RNG.chance(0.05)) { p.mats.herb = (p.mats.herb || 0) + 1; out.push('바위틈에서 에테르를 머금은 약초를 캤다.'); }
    }
    // 폐허: 지점이 없는 폐허 칸에서도 가끔 뒤질 거리가 보인다
    if (t === T.RUIN && !res.stop && !this.siteAt(x, y) && RNG.chance(0.06)) { this.queue.push({ type: 'ruinScav' }); res.stop = true; }
    // 해상 연결로: 관리국 검문소. 수배 중이거나 무법 성향이 높으면 통행료를 뜯긴다
    if (t === T.BRIDGE && ((p.wanted || 0) > 0 || (p.outlaw || 0) >= 50)) {
      const toll = Math.min(p.money, Math.round(200 * RANKS[p.rankIdx].mult));
      if (toll > 0 && !this._bridgeTollKey) { p.money -= toll; out.push(`해상 검문소에서 신원 조회에 걸렸다. 눈감아 주는 값으로 ${fmt(toll)} 크레딧을 냈다.`); }
      this._bridgeTollKey = true;
    } else if (t !== T.BRIDGE) this._bridgeTollKey = false;
    for (const o of out) this.queue.push({ type: 'toast', text: o });
  },
  ruinScavenge(search) {
    if (!search) return '그냥 지나쳤다.';
    const p = this.player; this.advanceDays(1, { noSave: true });
    const ok = this._ck == null ? RNG.chance(0.6) : this._ck; const who = this._ckNpc || null;
    const gain = (t) => { if (this._ckOut) this._ckOut.gains.push(t); };
    const loss = (t) => { if (this._ckOut) this._ckOut.losses.push(t); };
    loss('1일 소요');
    let out;
    const r = ok ? RNG.weighted(['core', 'money'], [50, 50]) : RNG.weighted(['hurt', 'none'], [55, 45]);
    if (r === 'core') { const t = Math.max(0, p.rankIdx - 1); this.addCore(t); gain(`${coreName(t)} 1개`); out = '셔터 안쪽 진열장 밑에서 괴수 코어 하나를 주웠다.'; }
    else if (r === 'money') { const m = Math.round(40 * RANKS[p.rankIdx].mult * RNG.range(0.8, 1.4)); p.money += m; gain(`크레딧 +${fmt(m)}`); out = '계산대 밑 버려진 금고를 열어 냈다.'; }
    else if (r === 'hurt') {
      if (who) loss(`${who.name} 부상 (체력 -10%)`); else { const d = Math.max(1, Math.round(p.maxHp * 0.1)); p.hp = Math.max(1, p.hp - d); loss(`체력 -${fmt(d)}`); }
      out = '어둠 속에서 녹슨 철근에 베였다.';
    } else out = '쓸 만한 건 다 털려 있었다.';
    this.save();
    return out;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.exploreInit(); });
  wrap('spawnMonthly', function (base) { base.call(this); if (this.exploreState()) this.moveMerchants(); });
  // 게이트·괴수가 탐사 지점 위에 생기지 않게
  wrap('randomFreeTile', function (base, regionId) {
    for (let k = 0; k < 6; k++) { const pos = base.call(this, regionId); if (!pos || !this.siteAt(pos[0], pos[1])) return pos; }
    return null;
  });
  wrap('walkStep', function (base, x, y, diag) {
    const res = base.call(this, x, y, diag);
    if (this.over || !this.exploreState()) return res;
    this.terrainStep(x, y, res);
    const s = this.siteAt(x, y);
    if (s && !res.city && this.siteActive(s) && !this.queue.some((q) => q.type === 'site')) {
      s.known = true; this.queue.push({ type: 'site', id: s.id }); res.stop = true;
    } else if (s) { s.visited = true; s.known = true; }
    this.checkExplore();
    return res;
  });
  wrap('moveAlong', function (base, path, cost) { const d = base.call(this, path, cost); if (this.exploreState()) this.checkExplore(); return d; });

  if (typeof TITLES !== 'undefined') {
    TITLES.push(
      { id: 'pathfinder', name: '길잡이', how: '지역 3곳 탐사 100%', mods: { spd: 0.03 }, cond: (g) => g.exploreCompleteCount() >= 3 },
      { id: 'surveyor', name: '한반도 측량사', how: '모든 지역 탐사 100%', mods: { luck: 0.15, train: 0.04 }, cond: (g) => g.exploreCompleteCount() >= REGIONS.length },
    );
  }
}

// ---------- 화면 ----------
Object.assign(UI, {
  siteIcon(s, size = 14) {
    const K = SITE_KINDS[s.kind];
    return `<span class="site-ico" style="--c:${K.color};font-size:${size}px">${K.icon}</span>`;
  },
  showSite(id) {
    const s = G.siteById(id); if (!s) return this.processQueue();
    const K = SITE_KINDS[s.kind]; s.visited = true; s.known = true;
    const btn = (v, label, cls = '') => `<button class="choice-btn ${cls}" data-act="site" data-v="${s.id}|${v}">${label}</button>`;
    let choices = '';
    switch (s.kind) {
      case 'ruin': choices = btn('search', '잔해를 뒤진다 <span class="dim-in">2일 · 유물·코어 또는 함정·괴수</span>') + btn('pass', '지나간다'); break;
      case 'spring': choices = btn('absorb', '샘의 에테르를 흡수한다 <span class="dim-in">3일 · 에테르 크게 증가, 몸에 무리</span>') + btn('pass', '그냥 둔다'); break;
      case 'outpost': choices = btn('search', '초소를 뒤진다 <span class="dim-in">1일 · 기록·보급품</span>'); break;
      case 'village': choices = btn('help', '마을 일을 돕는다 <span class="dim-in">3일 · 돈·지역 평판</span>') + btn('trade', `물자를 거래한다 <span class="dim-in">약초 판매${G.player.mats.herb ? ` ${G.player.mats.herb}다발` : ''} · 회복제 80</span>`) + btn('rest', '쉬어 간다 <span class="dim-in">2일 · 완전 회복</span>'); break;
      case 'remains': choices = btn('take', '유품을 챙긴다 <span class="dim-in">장비 하나</span>') + btn('return', '인식표를 유족에게 보낸다 <span class="dim-in">평판·명성</span>'); break;
      case 'altar': choices = btn('destroy', '제단을 부순다 <span class="dim-in">명성·평판, 균열교의 원한</span>') + btn('study', '문양을 조사한다 <span class="dim-in">에테르</span>'); break;
      case 'merchant': {
        s.stock ??= G.merchantStock();
        choices = s.stock.map((it, i) => it.sold ? '' : btn(i, `${it.name} <span class="dim-in">${fmt(it.price)} 크레딧</span>`)).join('');
        choices += '<p class="small dim">"진품 보증? 그런 건 도시 경매장에서나 찾으쇼."</p>';
        break;
      }
      case 'tower': choices = btn('climb', '감시탑에 오른다 <span class="dim-in">1일 · 주변 지형과 지점 공개</span>'); break;
    }
    this.modal(`<div class="eyebrow">탐사 지점 · ${G.fullDate()} · ${regionById(s.region).name}</div>
      <h3>${this.siteIcon(s, 18)} ${K.name}</h3><p class="event-text">${K.desc}</p>
      <div class="cards">${choices}</div>
      <div class="row end"><button class="ghost" data-act="modal-close">떠난다</button></div>`, 'event-box');
  },
  exploreHtml() {
    const rows = REGIONS.map((r) => {
      const e = G.regionExplore(r.id); const done = G.exploreState().done[r.id];
      return `<div class="item-row ${done ? 'hl' : ''}"><div class="grow"><b>${r.name}</b> <span class="small ${done ? 'good' : 'dim'}">${done ? '탐사 완료' : `${e.pct}%`}</span>
        <div class="small dim">지형 ${Math.floor(e.tilePct * 100)}% · 지점 ${e.found}/${e.sites}</div>${this.bar('ether', e.pct, 100)}</div></div>`;
    }).join('');
    const known = G.sites().filter((s) => s.visited);
    return `<div class="sheet-head"><h3>탐사 기록</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
      <div class="sheet-body"><p class="small dim">지형을 밝히고 탐사 지점을 직접 들러야 탐사율이 오른다. 100%가 되면 협회가 측량 기록을 사들이고 지역 평판이 오른다. 감시탑에 오르면 주변 지점이 지도에 표시된다.</p>
      <div class="cards">${rows}</div>
      ${known.length ? `<div class="sec-title sec">들른 지점</div><div class="small">${known.map((s) => `${this.siteIcon(s, 12)} ${SITE_KINDS[s.kind].name}(${regionById(s.region).name})`).join(' · ')}</div>` : ''}
      <div class="row end"><button class="primary" data-act="modal-close">닫기</button></div></div>`;
  },
});
{
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'site') { G.queue.shift(); return this.showSite(q.id); }
    if (q && q.type === 'ruinScav') {
      G.queue.shift();
      return this.modal(`<div class="eyebrow">폐허 · ${G.fullDate()}</div><p class="event-text">무너진 상가 건물. 셔터 하나가 반쯤 열려 있다.</p>
        <div class="cards"><button class="choice-btn" data-act="ruin-scav" data-v="1">들어가 본다 <span class="dim-in">1일</span></button><button class="choice-btn" data-act="ruin-scav" data-v="0">지나간다</button></div>`, 'event-box');
    }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'site': {
        const [id, ch] = String(v).split('|'); const s = G.siteById(+id);
        const msg = G.siteAct(+id, ch);
        if (s && s.kind === 'merchant' && s.stock && s.stock.some((x) => !x.sold) && msg && !msg.includes('모자란다')) { this.renderGame(); this.toast(msg); return this.showSite(s.id); }
        this.closeModal();
        if (msg) this.modal(`<p class="event-text">${msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
        return this.after();
      }
      case 'ruin-scav': this.closeModal(); return this.after(G.ruinScavenge(v === '1'));
      case 'site-open': { const s = G.siteAt(G.player.x, G.player.y); if (s) return this.showSite(s.id); return; }
      case 'explore-book': return this.modal(this.exploreHtml(), 'sheet');
      default: return baseHandle.call(this, act, v);
    }
  };
  const baseActions = UI.hudActions;
  UI.hudActions = function () {
    let html = baseActions.call(this);
    const p = G.player; if (!G.exploreState()) return html;
    const e = G.regionExplore(p.region);
    html = html.replace('<div class="act-where">', `<div class="act-where"><button class="explore-chip" data-act="explore-book" aria-label="탐사 기록">탐사 ${e.pct}%</button>`);
    const s = G.siteAt(p.x, p.y);
    if (s && G.siteActive(s)) html = html.replace('<div class="act-btns">', `<div class="act-btns"><button class="primary" data-act="site-open">${this.siteIcon(s)} ${SITE_KINDS[s.kind].name}</button>`);
    return html;
  };
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip || !G.exploreState()) return;
    const s = G.siteAt(x, y); const reg = WORLD.regionAt(x, y);
    let add = '';
    if (s && G.siteSeen(s)) {
      if (s.visited || s.known) add += `<div class="tip-obj">${this.siteIcon(s, 22)}<div><b>${SITE_KINDS[s.kind].name}</b><div class="small dim">${G.siteActive(s) ? SITE_KINDS[s.kind].desc : '이미 들른 곳이다.'}</div></div></div>`;
      else add += '<div class="tip-obj"><span class="site-ico" style="--c:#c9ced6;font-size:22px">?</span><div><b>정체 모를 지점</b><div class="small dim">가까이 가야 무엇인지 알 수 있다.</div></div></div>';
    }
    if (reg && G.revealed(x, y)) add += `<div class="small dim">${reg.name} 탐사 ${G.regionExplore(reg.id).pct}%</div>`;
    if (add) tip.insertAdjacentHTML('beforeend', fixJosa(add));
  };
}

// ---------- 지도 그리기 ----------
{
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    if (G.exploreState()) this.drawSites();
    baseObjs.call(this);
  };
  MP.drawSites = function () {
    const c = this.ctx, s = this.tile, t = this.t;
    for (const st of G.sites()) {
      // 밝혀진 칸이거나, 안개 가장자리(이웃 칸이 밝혀짐)면 실루엣이 보인다
      const edge = !G.revealed(st.x, st.y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => WORLD.inb(st.x + dx, st.y + dy) && G.revealed(st.x + dx, st.y + dy));
      if (!G.siteSeen(st) && !edge) continue;
      if (G.objAt(st.x, st.y)) continue;
      const [px, py] = this.toScreen(st.x + 0.5, st.y + 0.5);
      if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
      const K = SITE_KINDS[st.kind];
      const ident = st.visited || st.known;
      const active = G.siteActive(st);
      const col = ident ? K.color : '#c9ced6';
      const bob = Math.sin(t / 22 + st.id) * 1.2;
      c.globalAlpha = ident && !active ? 0.4 : 1;
      c.fillStyle = 'rgba(5,8,13,.82)'; c.beginPath(); c.arc(px, py + bob, s * 0.24, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.6; c.setLineDash(ident ? [] : [3, 3]); c.stroke(); c.setLineDash([]);
      c.fillStyle = col; c.font = `700 ${Math.round(s * 0.3)}px "IBM Plex Sans KR", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ident ? K.icon : '?', px, py + bob + 0.5);
      c.globalAlpha = 1;
    }
  };
  const baseMini = MP.drawMini;
  MP.drawMini = function () {
    baseMini.call(this);
    const m = this.mctx; if (!m || !G.player || !G.exploreState()) return;
    const sx = this.mini.width / WORLD.COLS, sy = this.mini.height / WORLD.ROWS;
    for (const st of G.sites()) {
      if (!(st.visited || st.known)) continue;
      m.fillStyle = G.siteActive(st) ? SITE_KINDS[st.kind].color : 'rgba(201,206,214,.35)';
      m.fillRect(st.x * sx, st.y * sy, Math.max(2, sx), Math.max(2, sy));
    }
  };
}
