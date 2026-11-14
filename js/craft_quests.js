// ===== 장비·제작 관련 의뢰·장인 부탁·사건 =====
// 협회 의뢰소에 부산물·테마 세트·강화 검사 의뢰를 섞고,
// 도시 장인이 직접 부탁을 보내며, 공방 도시에서 제작 사건이 난다.

const CRAFT_BOARD_TYPES = ['parts', 'theme', 'enhance_job'];

Object.assign(Game.prototype, {
  isCraftBoard(type) { return CRAFT_BOARD_TYPES.includes(type); },
  makeCraftBounty(regionId, id) {
    const reg = regionById(regionId);
    const pr = this.player.official ?? this.player.rankIdx;
    const [lo, hi] = GATE_RANGES[reg.danger];
    const tier = Math.max(0, Math.min(7, RNG.int(Math.max(lo, pr - 1), Math.max(lo, Math.min(hi, pr + 1)))));
    const type = RNG.pick(CRAFT_BOARD_TYPES);
    const q = { id, type, region: regionId, tier, from: regionId, months: RNG.int(3, 6), craft: true };
    if (type === 'parts') {
      const partIds = Object.keys(PARTS).filter((k) => k !== 'essence');
      q.part = RNG.pick(partIds);
      q.n = RNG.int(2, 4);
      q.title = `${reg.name} 공방 납품: ${this.partLabel(q.part, tier)} ${q.n}개`;
    } else if (type === 'theme') {
      const themes = (typeof this.craftableThemes === 'function' && this.craftableThemes(regionId)) || THEME_SETS;
      const T = RNG.pick(themes.length ? themes : THEME_SETS);
      q.theme = T.id; q.n = 1;
      q.title = `테마 장비 〈${T.name}〉 1점 납품 (${reg.name} 의뢰소)`;
    } else {
      q.plus = Math.min(6, 2 + Math.floor(pr / 2) + RNG.int(0, 1));
      q.n = 1;
      q.title = `장비 검사: +${q.plus} 이상 강화품 제시 (반환)`;
    }
    const m = RANKS[tier].mult;
    const base = { parts: 55, theme: 110, enhance_job: 70 }[type] * (q.n || 1) ** 0.6;
    q.money = Math.round(base * m * RNG.range(0.9, 1.25));
    q.merit = Math.round({ parts: 5, theme: 10, enhance_job: 7 }[type] * (1 + tier * 0.45));
    q.repGain = { parts: 5, theme: 8, enhance_job: 6 }[type];
    return q;
  },
  countThemePieces(themeId, includeEquip) {
    const p = this.player; let n = 0;
    for (const it of p.inventory) if (it && it.theme === themeId) n++;
    if (includeEquip) for (const it of Object.values(p.equip || {})) if (it && it.theme === themeId) n++;
    return n;
  },
  takeThemePiece(themeId) {
    const p = this.player;
    const i = p.inventory.findIndex((e) => e && e.theme === themeId);
    if (i < 0) return null;
    return p.inventory.splice(i, 1)[0];
  },
  bestPlusGear() {
    const all = [...Object.values(this.player.equip || {}).filter(Boolean), ...this.player.inventory];
    let best = null;
    for (const it of all) if (it && (it.plus || 0) > 0 && (!best || (it.plus || 0) > (best.plus || 0))) best = it;
    return best;
  },
  craftQuestReady(q) {
    if (!q) return false;
    if (q.type === 'parts') return this.partCount(q.part, q.tier) >= q.n;
    if (q.type === 'theme' || q.type === 'craft_theme') return this.countThemePieces(q.theme, false) >= (q.n || 1);
    if (q.type === 'enhance_job' || q.type === 'craft_enhance') {
      const b = this.bestPlusGear();
      return !!(b && (b.plus || 0) >= (q.plus || 1));
    }
    if (q.type === 'craft_parts') return this.partCount(q.part, q.tier) >= q.n;
    return q.status === 'done';
  },
  // 장인 부탁 후보
  pickCraftRequest() {
    const p = this.player;
    if ((p.quests || []).some((q) => q.kind === 'craft' && q.status !== 'claimed')) return null;
    const rid = p.region;
    const crafters = (typeof this.cityCrafters === 'function' && this.cityCrafters(rid)) || [];
    if (!crafters.length) return null;
    const c = RNG.pick(crafters);
    const kind = RNG.pick(['craft_parts', 'craft_theme', 'craft_enhance']);
    return { type: 'craft_req', kind, crafterId: c.id, region: rid };
  },
  findCrafter(cid) {
    const w = this.world && this.world.crafters;
    if (!w) return null;
    for (const list of Object.values(w)) {
      const c = list.find((x) => x.id === cid);
      if (c) return c;
    }
    return null;
  },
  acceptCraftRequest(q) {
    const c = this.findCrafter(q.crafterId); if (!c) return '장인을 찾을 수 없다.';
    const role = CRAFT_ROLES[c.role];
    const tier = this.player.rankIdx;
    let data;
    if (q.kind === 'craft_parts') {
      const part = RNG.pick(Object.keys(PARTS).filter((k) => k !== 'essence'));
      const n = RNG.int(2, 3);
      data = {
        type: 'craft_parts', part, tier, n,
        title: `${c.name} ${role.name}의 부탁: ${this.partLabel(part, tier)} ${n}개`,
        money: 100, months: 4,
      };
    } else if (q.kind === 'craft_theme') {
      const themes = this.craftableThemes(q.region || this.player.region);
      const T = RNG.pick(themes.length ? themes : THEME_SETS);
      const pieceIdx = RNG.int(0, T.pieces.length - 1);
      data = {
        type: 'craft_theme', theme: T.id, pieceIdx, n: 1, tier,
        title: `${c.name}의 주문: 〈${T.name}〉 ${T.pieces[pieceIdx].name} 제작`,
        money: 160, months: 5,
      };
    } else {
      const plus = Math.min(5, 2 + Math.floor(tier / 2));
      data = {
        type: 'craft_enhance', plus, n: 1, tier,
        title: `${c.name}의 시험: +${plus} 이상 장비 보여 주기`,
        money: 120, months: 4,
      };
    }
    const quest = {
      id: 'cq' + Date.now() + RNG.int(0, 999),
      kind: 'craft',
      crafterId: c.id,
      crafterName: c.name,
      region: q.region || this.player.region,
      status: 'active',
      deadline: this.monthKey() + data.months,
      ...data,
    };
    this.player.quests.push(quest);
    this.addCraftRel(c.id, 2);
    return fixJosa(`"${c.name}: 고맙네. 기한 안에만 맞춰 주게." 부탁을 수락했다: ${quest.title}`);
  },
  finishCraftQuest(qid) {
    const p = this.player;
    const q = p.quests.find((x) => x.id === qid);
    if (!q || q.kind !== 'craft') return '';
    if (!this.craftQuestReady(q)) return '아직 조건을 채우지 못했다.';
    if (q.region && q.region !== this.region().id) return `${regionById(q.region).name}의 장인에게 전해야 한다.`;
    if (!this.onCity()) return '도시 안에서만 전달할 수 있다.';

    if (q.type === 'craft_parts') {
      p.parts[`${q.part}:${q.tier}`] -= q.n;
    } else if (q.type === 'craft_theme') {
      const it = this.takeThemePiece(q.theme);
      if (!it) return '테마 장비가 없다.';
    }

    const c = this.findCrafter(q.crafterId);
    const money = Math.round((q.money || 120) * RANKS[p.rankIdx].mult);
    p.money += money; p.fame += 2;
    p.quests = p.quests.filter((x) => x !== q);
    if (c) this.addCraftRel(c.id, 8);
    const name = (c && c.name) || q.crafterName || '장인';
    this.log(`${name}의 제작 부탁을 마쳤다.`, 'good');
    return fixJosa(`${name}이(가) 만족하며 고개를 끄덕였다. (+${fmt(money)} 크레딧, 장인 관계 상승)`);
  },
});

// ---------- 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const p = this.player; if (!p) return;
    p.quests ??= [];
  });

  // 협회 의뢰에 제작 의뢰 섞기
  wrap('makeBounties', function (base, regionId) {
    const out = base.call(this, regionId);
    if (!out.length || typeof PARTS === 'undefined') return out;
    const craftCity = !!(typeof CRAFT_CITY_SEED !== 'undefined' && CRAFT_CITY_SEED[regionId])
      || Object.values(typeof CRAFT_MINOR_GUILDS !== 'undefined' ? CRAFT_MINOR_GUILDS : {}).some((m) => m.home === regionId)
      || regionId === 'incheon' || regionId === 'suwon' || regionId === 'ulsan' || regionId === 'daejeon';
    if (craftCity || RNG.chance(0.45)) {
      const i = RNG.int(0, out.length - 1);
      out[i] = this.makeCraftBounty(regionId, out[i].id);
    }
    return out;
  });

  wrap('acceptBounty', function (base, qid) {
    const r = base.call(this, qid);
    const q = this.player.quests.find((x) => x.id === qid);
    if (q && this.isCraftBoard(q.type)) q.status = 'turnin';
    return r;
  });

  wrap('claimBounty', function (base, qid) {
    const p = this.player; const q = p.quests.find((x) => x.id === qid);
    if (!q || !this.isCraftBoard(q.type)) return base.call(this, qid);
    if (q.from !== this.region().id || !this.onCity()) return `${regionById(q.from).name} 의뢰소에 보고해야 한다.`;
    if (q.type === 'parts') {
      if (this.partCount(q.part, q.tier) < q.n) return `${this.partLabel(q.part, q.tier)}이(가) ${q.n}개 필요하다.`;
      p.parts[`${q.part}:${q.tier}`] -= q.n;
      return this.payBounty(q);
    }
    if (q.type === 'theme') {
      if (this.countThemePieces(q.theme, false) < 1) return '해당 테마 장비가 가방에 없다. (장착 중이면 먼저 해제)';
      this.takeThemePiece(q.theme);
      return this.payBounty(q);
    }
    if (q.type === 'enhance_job') {
      const b = this.bestPlusGear();
      if (!b || (b.plus || 0) < q.plus) return `+${q.plus} 이상 강화 장비가 필요하다.`;
      const msg = this.payBounty(q);
      return `${b.name} +${b.plus} 검사를 통과했다. 장비는 돌려받았다. ${msg}`;
    }
    return base.call(this, qid);
  });

  // 제작·강화 시 장인 퀘스트 자동 갱신
  wrap('craftThemePiece', function (base, setId, pieceIdx) {
    const r = base.call(this, setId, pieceIdx);
    if (r && !/필요|부족|아니다|도시/.test(r)) {
      for (const q of this.player.quests || []) {
        if (q.kind === 'craft' && q.type === 'craft_theme' && q.theme === setId && q.status === 'active') {
          if (q.pieceIdx == null || q.pieceIdx === pieceIdx) q.status = 'done';
        }
      }
    }
    return r;
  });
  if (GP.enhance) wrap('enhance', function (base, uid) {
    const r = base.call(this, uid);
    if (r && /성공/.test(String(r))) {
      for (const q of this.player.quests || []) {
        if (q.kind === 'craft' && q.type === 'craft_enhance' && q.status === 'active' && this.craftQuestReady(q)) q.status = 'done';
      }
    }
    return r;
  });
  if (GP.addPart) wrap('addPart', function (base, id, tier, n) {
    const r = base.call(this, id, tier, n);
    for (const q of this.player.quests || []) {
      if (q.kind === 'craft' && q.type === 'craft_parts' && q.part === id && q.tier === tier && this.craftQuestReady(q)) q.status = 'done';
    }
    return r;
  });

  wrap('checkDeliveries', function (base) {
    base.call(this);
    for (const q of this.player.quests || []) {
      if (q.kind !== 'craft' || q.status !== 'active') continue;
      if (this.craftQuestReady(q)) q.status = 'done';
    }
  });

  wrap('expireQuests', function (base) {
    const p = this.player; const mk = this.monthKey();
    for (const q of [...(p.quests || [])]) {
      if (q.kind === 'craft' && q.deadline && mk > q.deadline && q.status !== 'done') {
        p.quests = p.quests.filter((x) => x !== q);
        const c = this.findCrafter(q.crafterId);
        if (c) this.addCraftRel(c.id, -10);
        this.log(`${q.crafterName || '장인'}의 제작 부탁 기한이 지났다.`, 'bad');
      }
    }
    return base.call(this);
  });

  wrap('storyMonthly', function (base) {
    base.call(this);
    if (RNG.chance(0.3)) {
      const r = this.pickCraftRequest();
      if (r && !this.queue.some((x) => x.type === 'craft_req')) this.queue.push(r);
    }
  });
}

// NPC 부탁: 장비·제작 관련
if (typeof REQUESTS !== 'undefined') {
  REQUESTS.need_parts = {
    weight: 1.1,
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 12 && !g.player.quests.some((q) => q.npc === n.id || (q.kind === 'craft' && q.status !== 'claimed'))),
    text: (g, c) => {
      const part = RNG.pick(Object.keys(PARTS).filter((k) => k !== 'essence'));
      const t = Math.max(0, Math.min(7, c.npc.rankIdx));
      c.extra = { part, t, n: 2 };
      return `${c.npc.name}에게서 연락이 왔다.\n\n"장비가 찌그러져서… ${g.partLabel(part, t)} 2개만 구해 줄 수 있어? 공방 대기열이 너무 길어."`;
    },
    accept: '구해 주겠다고 한다',
    onAccept: (g, c) => {
      const { part, t, n } = c.extra;
      g.addNpcQuest(c.npc, 'npc_parts', {
        part, tier: t, n,
        title: `${c.npc.name}에게 ${g.partLabel(part, t)} ${n}개 전달`,
        money: 100, relReward: 12, months: 4,
      });
      return '"신세 크게 질게!"';
    },
    onDecline: (g, c) => { g.changeRel(c.npc, -2); return '"알겠어. 다른 데 알아볼게."'; },
  };
  REQUESTS.want_theme = {
    weight: 0.9,
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 25 && n.rankIdx >= 1 && !g.player.quests.some((q) => q.npc === n.id)),
    text: (g, c) => {
      const T = RNG.pick(THEME_SETS);
      c.extra = { theme: T.id };
      return `${c.npc.name}이(가) 사진을 보내 왔다.\n\n"〈${T.name}〉 세트 조각 하나라도 있으면 사고 싶은데… 마켓엔 가짜만 돌아. 진짜 있으면 연락해 줘."`;
    },
    accept: '구해 보겠다고 한다',
    onAccept: (g, c) => {
      const T = themeById(c.extra.theme);
      g.addNpcQuest(c.npc, 'npc_theme', {
        theme: T.id, n: 1,
        title: `${c.npc.name}에게 〈${T.name}〉 장비 1점 전달`,
        money: 180, relReward: 16, months: 5,
      });
      return '"사례는 섭섭지 않게 할게!"';
    },
    onDecline: (g, c) => { g.changeRel(c.npc, -1); return '"바빠 보이네. 다음에."'; },
  };
  REQUESTS.smith_intro = {
    weight: 0.7,
    who: (g) => {
      if (g.player.craftIntro) return [];
      return g.adults().filter((n) => n.met && n.relation >= 10 && n.region === g.player.region
        && (typeof CRAFT_CITY_SEED !== 'undefined' && CRAFT_CITY_SEED[n.region]));
    },
    text: (g, c) => `${c.npc.name}이(가) 공방 쪽으로 턱짓한다.\n\n"이 동네 장인들, 관계 쌓으면 강화도 잘 되고 세트도 맞춰 준다더라. 한 번 얼굴 익혀 둬. 나 소개로 가면 조금 풀려."`,
    accept: '소개를 부탁한다',
    onAccept: (g, c) => {
      g.player.craftIntro = true;
      const list = g.cityCrafters(c.npc.region) || [];
      for (const cr of list) g.addCraftRel(cr.id, 6);
      g.changeRel(c.npc, 4);
      return list.length
        ? `공방에서 ${list.map((x) => x.name).join(', ')}을(를) 소개받았다. (장인 관계 +6)`
        : '공방에 가 보라는 말만 남겨 두고 떠났다.';
    },
    onDecline: (g, c) => { g.changeRel(c.npc, -1); return '"그래, 나중에라도."'; },
  };
}

// NPC 부산물·테마 전달 자동 완료
{
  const GP = Game.prototype;
  const baseCheck = GP.checkDeliveries;
  GP.checkDeliveries = function () {
    baseCheck.call(this);
    const p = this.player;
    for (const q of [...p.quests]) {
      if (q.kind !== 'npc') continue;
      const n = this.npcById(q.npc);
      if (!n || n.region !== p.region) continue;
      if (q.type === 'npc_parts' && this.partCount(q.part, q.tier) >= q.n) {
        p.parts[`${q.part}:${q.tier}`] -= q.n; q.status = 'done'; this.finishNpcQuest(q);
      }
      if (q.type === 'npc_theme' && this.countThemePieces(q.theme, false) >= 1) {
        this.takeThemePiece(q.theme); q.status = 'done'; this.finishNpcQuest(q);
      }
    }
  };
}

// ---------- 단발 사건 (공방·제작 길드 도시) ----------
if (typeof S === 'function') {
  S({
    id: 'craft_rush_order', city: true, region: ['suwon', 'ulsan', 'daejeon', 'incheon', 'gangnam'],
    text: '공방 앞에서 장인이 헐레벌떡 뛰어나온다. "납기 놓치면 길드 계약이 날아가! 코어만 있으면 내가 밤새 두드리겠네. 도와주게!"',
    choices: [
      {
        text: '코어 2개를 내준다',
        when: (g) => g.coreCount(g.player.rankIdx) >= 2,
        do: (g) => {
          g.player.mats['c' + g.player.rankIdx] -= 2;
          const list = g.cityCrafters(g.region().id) || [];
          if (list[0]) g.addCraftRel(list[0].id, 10);
          return '밤새 망치 소리가 울렸다. 장인이 허리를 숙여 감사했다.' + g.gain({ money: 80, fame: 1 }) + (list[0] ? ` (${list[0].name} 관계 +10)` : '');
        },
      },
      {
        text: '대신 부산물을 구해 오겠다고 한다',
        do: (g) => {
          const part = RNG.pick(Object.keys(PARTS).filter((k) => k !== 'essence'));
          const t = g.player.rankIdx;
          const c = (g.cityCrafters(g.region().id) || [])[0];
          if (c && !(g.player.quests || []).some((q) => q.kind === 'craft')) {
            g.player.quests.push({
              id: 'cqrush' + Date.now(), kind: 'craft', type: 'craft_parts', crafterId: c.id, crafterName: c.name,
              region: g.region().id, part, tier: t, n: 2, status: 'active',
              title: `${c.name}의 긴급 주문: ${g.partLabel(part, t)} 2개`,
              money: 140, deadline: g.monthKey() + 3,
            });
            return `"그럼 ${g.partLabel(part, t)} 두 개만! 사흘… 아니, 석 달 안에는 부탁하네." 긴급 부탁이 퀘스트로 남았다.`;
          }
          return '장인은 이미 다른 조수에게 부탁을 돌린 뒤였다.' + g.gain({ rep: 1 });
        },
      },
      { text: '바빠서 지나간다', do: () => '장인의 한숨이 등 뒤에서 들렸다.' },
    ],
  });
  S({
    id: 'craft_fake_set', city: true,
    text: '헌터 마켓 골목. "진짜 〈도심 경비대〉 세트요!"라며 상인이 판금 조각을 내민다. 각인이 조금 흔들린다.',
    choices: [
      {
        text: '감정·치료소에 감정 맡긴다',
        when: (g) => g.player.money >= 80,
        do: (g) => {
          g.player.money -= 80;
          if (RNG.chance(0.55)) {
            const it = g.makeThemePiece('city_guard', RNG.int(0, 2), g.player.rankIdx, 1);
            g.player.inventory.push(it);
            return '진품이었다. 상인은 도망가고, 장비만 남았다.' + ` ${it.name}`;
          }
          return '가짜였다. 감정비만 날아갔다. (−80 크레딧)';
        },
      },
      {
        text: '싸게 산다',
        when: (g) => g.player.money >= 200,
        do: (g) => {
          g.player.money -= 200;
          if (RNG.chance(0.35)) {
            const it = g.makeThemePiece('city_guard', 1, Math.max(0, g.player.rankIdx - 1), 0);
            g.player.inventory.push(it);
            return '운 좋게 진품이었다. ' + it.name;
          }
          g.addTaint && g.addTaint(4, '가짜 각인');
          return '싸구려 도금이었다. 손에 에테르 잔향만 남았다.' + g.gain({ fame: -1 });
        },
      },
      { text: '신고하고 지나친다', do: (g) => '관리국 순찰이 골목을 훑었다. 상인은 이미 사라졌다.' + g.gain({ merit: 2 }) },
    ],
  });
  S({
    id: 'craft_guild_scout', city: true, region: ['suwon', 'ulsan', 'daejeon'],
    text: '제작 길드 수습이 명함을 내민다. "전투 길드만 답이 아니에요. 우리 쪽에 오면 장비 맞추는 일부터 배워요. 관심 있으세요?"',
    choices: [
      {
        text: '제작 길드 가입을 알아본다',
        when: (g) => !g.player.guild,
        do: (g) => {
          const home = g.region().id;
          const id = Object.entries(CRAFT_MINOR_GUILDS).find(([, m]) => m.home === home)?.[0];
          if (id && typeof g.joinMinorGuild === 'function') {
            const msg = g.joinMinorGuild(id);
            return msg || `${GUILDS[id].name} 쪽으로 발길을 돌렸다.`;
          }
          if (id) return `길드 화면에서 ${GUILDS[id].name} 가입을 알아보면 된다.`;
          return '수습은 명함만 남기고 바삐 떠났다.';
        },
      },
      {
        text: '소속은 유지하고 외주만 맡긴다',
        do: (g) => {
          const list = g.cityCrafters(g.region().id) || [];
          if (list[0]) g.addCraftRel(list[0].id, 4);
          return '외주 단골 자리를 하나 만들었다.' + (list[0] ? ` (${list[0].name} 관계 +4)` : '');
        },
      },
      { text: '관심 없다고 한다', do: () => '수습은 아쉽다는 듯 고개를 숙였다.' },
    ],
  });
}

// ---------- 화면 ----------
{
  // 의뢰 상태 문구
  const baseStatus = UI.questStatus;
  UI.questStatus = function (q) {
    if (q.type === 'parts') {
      const have = G.partCount(q.part, q.tier);
      return `${G.partLabel(q.part, q.tier)} ${Math.min(have, q.n)}/${q.n} · 의뢰소 납품`;
    }
    if (q.type === 'theme') {
      const have = G.countThemePieces(q.theme, false);
      return `테마 장비 ${have}/${q.n} (가방) · 의뢰소 납품`;
    }
    if (q.type === 'enhance_job') {
      const b = G.bestPlusGear();
      const cur = b ? (b.plus || 0) : 0;
      return `최고 강화 +${cur}/+${q.plus} · 검사 후 반환`;
    }
    return baseStatus.call(this, q);
  };

  // 의뢰소: 제작 의뢰도 바로 보고 가능
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    if (id === 'board') {
      const p = G.player;
      const list = G.board(reg.id);
      const mine = p.quests.filter((q) => q.kind === 'bounty');
      const canClaim = (q) => {
        if (q.from !== reg.id) return false;
        if (q.type === 'deliver' || q.status === 'done') return true;
        if (G.isCraftBoard(q.type)) return G.craftQuestReady(q);
        return false;
      };
      const hl = (q) => canClaim(q) || q.status === 'done' || q.type === 'deliver';
      html = `<p class="small dim">의뢰는 매달 바뀐다. 완료한 의뢰는 받은 도시의 의뢰소에 보고해야 보상을 받는다. 동시에 4개까지. 제작·강화 관련 의뢰도 섞여 나온다.</p>
        <div class="sec-title">이번 달 게시물</div><div class="cards">${list.map((q) => `<div class="item-row"><span class="slot-ico" style="--c:${RANKS[q.tier].color}">${facIcon('board', 20)}</span>
          <div class="grow"><b>${q.title}</b>${q.craft ? ' <span class="tag">제작</span>' : ''}<div class="small dim">보상 ${fmt(q.money)} 크레딧 · 공적 +${q.merit} · 평판 +${q.repGain} · 기한 ${q.months}개월</div></div>
          ${q.taken ? '<span class="small dim">수락함</span>' : `<button class="sm" data-act="accept-bounty" data-v="${q.id}">수락</button>`}</div>`).join('')}</div>
        <div class="sec-title sec">진행 중인 의뢰</div><div class="cards">${mine.map((q) => `<div class="item-row ${hl(q) ? 'hl' : ''}"><div class="grow"><b>${q.title}</b><div class="small dim">${regionById(q.from).name} 의뢰소 · ${this.questStatus(q)}</div></div>
          ${canClaim(q) ? `<button class="sm primary" data-act="claim-bounty" data-v="${q.id}">보고</button>` : ''}</div>`).join('') || '<div class="dim small">없음</div>'}</div>`;
    }
    if (id === 'workshop') {
      const p = G.player;
      const craftQs = (p.quests || []).filter((q) => q.kind === 'craft');
      const offer = (G.queue || []).find((x) => x.type === 'craft_req' && x.region === reg.id);
      html += `<div class="sec-title sec">장인 부탁</div>`;
      if (offer) {
        const c = G.findCrafter(offer.crafterId);
        html += `<div class="item-row hl"><div class="grow"><b>${c ? c.name : '장인'}의 연락</b><div class="small dim">공방 일손이 부족하다. 부탁을 들어줄 수 있다.</div></div>
          <button class="sm primary" data-act="craft-req-open">내용 보기</button></div>`;
      }
      html += `<div class="cards">${craftQs.map((q) => {
        const ready = G.craftQuestReady(q) || q.status === 'done';
        return `<div class="item-row ${ready ? 'hl' : ''}"><div class="grow"><b>${q.title}</b>
          <div class="small dim">${q.crafterName || '장인'} · 기한 ${q.deadline - G.monthKey()}개월${ready ? ' · <span class="good">전달 가능</span>' : ''}</div></div>
          ${ready ? `<button class="sm primary" data-act="craft-quest-turnin" data-v="${q.id}">전달</button>` : ''}</div>`;
      }).join('') || '<div class="small dim">진행 중인 장인 부탁이 없다. 시간이 지나면 장인이 연락한다.</div>'}</div>`;
    }
    return html;
  };

  // processQueue: 장인 연락
  const basePQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'craft_req') {
      G.queue.shift();
      return this.showCraftRequest(q);
    }
    return basePQ.call(this);
  };

  UI.showCraftRequest = function (q) {
    const c = G.findCrafter(q.crafterId);
    if (!c) return this.processQueue();
    const role = CRAFT_ROLES[c.role];
    this.curCraftReq = q;
    const blurb = {
      craft_parts: '재료가 바닥났어. 부산물 좀 구해 주게.',
      craft_theme: '길드 주문인데 손이 모자라. 테마 장비 하나 맞춰 줄 수 있나?',
      craft_enhance: '내 눈높이에 맞는 강화품을 보여 주게. 시험이야.',
    }[q.kind] || '일손 좀 빌려 주게.';
    this.modal(`<div class="eyebrow">장인 연락 · ${G.fullDate()} · ${regionById(q.region).name}</div>
      <p class="event-text"><b>${c.name}</b> ${role.name} (관계 ${G.craftRelOf(c.id)})<br><br>"${blurb}"</p>
      <div class="cards"><button class="choice-btn" data-act="craft-req" data-v="1">맡아 준다</button>
      <button class="choice-btn" data-act="craft-req" data-v="0">지금은 어렵다</button></div>`, 'event-box');
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'sheet' && v === 'quest') {
      const r = baseHandle.call(this, act, v);
      const box = document.getElementById('modal-box');
      if (box) {
        const craftQs = (G.player.quests || []).filter((q) => q.kind === 'craft');
        if (craftQs.length) {
          box.insertAdjacentHTML('beforeend', `<div class="sec"><div class="sec-title">장인 부탁</div><div class="cards">${craftQs.map((q) => {
            const ready = G.craftQuestReady(q) || q.status === 'done';
            return `<div class="item-row ${ready ? 'hl' : ''}"><div class="grow"><b>${q.title}</b>
              <div class="small dim">${q.crafterName || '장인'} · ${regionById(q.region).name} · 기한 ${q.deadline - G.monthKey()}개월</div></div></div>`;
          }).join('')}</div></div>`);
        }
      }
      return r;
    }
    switch (act) {
      case 'craft-req-open': {
        const offer = (G.queue || []).find((x) => x.type === 'craft_req');
        if (!offer) return this.toast('이미 처리된 연락이다.');
        G.queue = G.queue.filter((x) => x !== offer);
        return this.showCraftRequest(offer);
      }
      case 'craft-req': {
        const q = this.curCraftReq; if (!q) return;
        if (+v) {
          const msg = G.acceptCraftRequest(q);
          G.save();
          return this.modal(`<p class="event-text">${msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
        }
        const c = G.findCrafter(q.crafterId);
        if (c) G.addCraftRel(c.id, -2);
        G.save();
        return this.modal(`<p class="event-text">${c ? c.name : '장인'}: "다음에 기회가 있겠지."</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
      }
      case 'craft-quest-turnin': {
        const r = G.finishCraftQuest(v);
        G.save();
        return this.afterCity(r);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
