// ===== 게이트 크로니클: 거대 길드와 지역 중소 길드 (영역 C) =====
// 사용자 요청: 주작·현무·청룡·백호 = 거대 길드. 그 아래 지역마다 중소 길드 여러 곳(이름·본거지·성향·규모·특기·평판·가입 조건).
// 중소 길드는 GUILDS에 함께 들어가 기존 길드 코드(소속·월급·공략권·세력·이적)를 그대로 쓴다. minor: true, home: 본거지.
// - NPC: 낮은 등급(C 이하)은 거대 길드보다 지역 중소 길드에 주로 들어간다.
// - 신규 등록 문자(debut_rising_0): 등급에 맞는 길드 두 곳이 실제로 연락하고, 본문 이름과 선택지가 일치한다.
// - 선택지 정보: ch.info(g) → 길드 소개 문자열(B의 선택지 정보 버튼이 띄운다). 길드 화면에 지역 중소 길드 목록·가입.

const GUILD_TIER = { baekho: 'giant', cheongryong: 'giant', hyeonmu: 'giant', jujak: 'giant', kama: 'gov' };
// size: 인원, rep: 평판(0~100), minRank: 가입 최소 공식 등급, fameReq, style: 성향, spec: 특기
const MINOR_GUILDS = {
  hangang:   { name: '한강 수호대', home: 'gangnam', elem: 'water', color: '#7fc8e8', size: 38, rep: 62, minRank: 1, fameReq: 5, style: '규율·공공', spec: '도심 게이트 신속 대응', desc: '강남 돔 외곽 하천변 게이트를 맡아 온 노포 길드. 관리국 하청을 많이 받아 일감이 꾸준하다.' },
  nightowl:  { name: '부엉이 야간조', home: 'gangbuk', elem: 'dark', color: '#8a7ab8', size: 21, rep: 48, minRank: 1, fameReq: 0, style: '실속·야간 전문', spec: '야간 게이트, 수당 1.5배', desc: '아무도 안 가는 밤 시간대 게이트만 골라 도는 길드. 수당은 짭짤하지만 생활 리듬은 포기해야 한다.' },
  ironbridge:{ name: '철교 공방', home: 'incheon', elem: 'holy', color: '#d6c38a', size: 26, rep: 55, minRank: 0, fameReq: 0, style: '장인·생산', spec: '장비 정비·코어 가공', desc: '인천 항만의 대장장이 출신들이 세운 길드. 전투보다 장비와 코어 가공으로 먹고산다. 신입에게 장비를 싸게 맞춰 준다.' },
  seawall:   { name: '방파제 경비단', home: 'incheon', elem: 'water', color: '#5fa8d6', size: 44, rep: 58, minRank: 1, fameReq: 5, style: '방어·해상', spec: '해상 게이트 봉쇄', desc: '해상 게이트 감시를 맡는 경비 길드. 방어 직업을 우대한다.' },
  greenlamp: { name: '초록등 연구회', home: 'daejeon', elem: 'wood', color: '#8fd47a', size: 15, rep: 50, minRank: 0, fameReq: 0, style: '학구·실험', spec: '스킬 연구, 수련 보조', desc: '청룡 연구소에서 독립한 연구원들의 소모임 같은 길드. 돈은 적지만 수련 자료가 많다.' },
  hanbat:    { name: '한밭 상단', home: 'daejeon', elem: 'holy', color: '#e6c86a', size: 33, rep: 46, minRank: 1, fameReq: 10, style: '상업·실리', spec: '코어 유통', desc: '공략보다 유통이 본업인 길드. 코어 시세에 밝고 정산이 빠르다.' },
  bluesteel: { name: '청강 조합', home: 'ulsan', elem: 'bolt', color: '#9ab8d8', size: 52, rep: 57, minRank: 1, fameReq: 5, style: '노동·연대', spec: '산업 지대 게이트', desc: '울산 공장 노동자 출신 각성자들의 조합형 길드. 수익을 똑같이 나눈다.' },
  mudang:    { name: '신당 결사', home: 'gwangju', elem: 'dark', color: '#b07ac0', size: 12, rep: 41, minRank: 0, fameReq: 0, style: '토속·영매', spec: '원귀·저주 게이트', desc: '무당 계열 각성자들이 모인 작은 결사. 원귀형 괴수와 저주 유물 처리에 독보적이다.' },
  geumnam:   { name: '금남로 의용대', home: 'gwangju', elem: 'fire', color: '#f09060', size: 29, rep: 66, minRank: 0, fameReq: 0, style: '의협·시민', spec: '브레이크 시민 대피', desc: '브레이크 때 시민을 먼저 빼내는 의용대에서 출발했다. 시민 평판이 좋다.' },
  harbor:    { name: '부산 항구파', home: 'busan', elem: 'water', color: '#4f90c0', size: 47, rep: 38, minRank: 1, fameReq: 0, style: '거침·현장', spec: '해상 대형 괴수', desc: '거칠기로 유명한 부둣가 길드. 실력만 있으면 출신은 안 묻는다. 암시장과 선이 닿아 있다는 소문도.' },
  haeundae:  { name: '해운대 서핑클럽', home: 'busan', elem: 'wood', color: '#6fd0b0', size: 18, rep: 52, minRank: 0, fameReq: 5, style: '자유·청년', spec: '해안 소형 게이트', desc: '이름은 동호회 같지만 해안 소형 게이트 공략 실적은 꾸준하다. 분위기가 젊고 가볍다.' },
  dalgubeol: { name: '달구벌 수비대', home: 'daegu', elem: 'fire', color: '#e07a5a', size: 40, rep: 60, minRank: 1, fameReq: 5, style: '보수·방어', spec: '분지 요새 방어', desc: '대구 분지 요새 외곽을 지키는 오래된 수비 길드. 위계가 엄격하다.' },
  coalmine:  { name: '탄광 개척단', home: 'gangneung', elem: 'holy', color: '#c0b080', size: 23, rep: 47, minRank: 1, fameReq: 0, style: '개척·탐사', spec: '산악 게이트, 탐사', desc: '폐광 지대 게이트를 개척해 온 탐사 길드. 지도에 없는 길을 잘 안다.' },
  eastsea:   { name: '동해 등대단', home: 'gangneung', elem: 'bolt', color: '#7ab0e0', size: 20, rep: 54, minRank: 0, fameReq: 0, style: '감시·정보', spec: '해안 전선 감시, 정보', desc: '해안 전선의 등대를 거점으로 삼은 감시 길드. 게이트 징후 정보를 판다.' },
  hanok:     { name: '한옥마을 보존회', home: 'jeonju', elem: 'wood', color: '#a8c878', size: 14, rep: 63, minRank: 0, fameReq: 0, style: '전통·수호', spec: '보존 구역 정화', desc: '보존 구역의 오래된 건물을 지키며 게이트를 정화하는 길드. 작지만 동네 사람들이 끔찍이 아낀다.' },
  suwonfort: { name: '화성 성곽대', home: 'suwon', elem: 'holy', color: '#d8c090', size: 31, rep: 56, minRank: 1, fameReq: 5, style: '방어·질서', spec: '산업 벨트 경비', desc: '수원 성곽을 본거지로 한 경비 길드. 산업 벨트 기업들과 경비 계약을 맺고 있다.' },
};

// GUILDS에 합친다 (지역이 실제로 있는 것만)
for (const [id, m] of Object.entries(MINOR_GUILDS)) {
  if (typeof REGIONS !== 'undefined' && !REGIONS.some((r) => r.id === m.home)) { delete MINOR_GUILDS[id]; continue; }
  GUILDS[id] = { ...m, minor: true };
  GUILD_TIER[id] = 'minor';
}
for (const [id, t] of Object.entries(GUILD_TIER)) if (GUILDS[id]) GUILDS[id].tier = t;

// 본거지: 거대 길드는 지역 표기(region.guild), 중소 길드는 home
function guildHome(id) { return REGIONS.find((r) => r.guild === id) || (GUILDS[id] && GUILDS[id].home ? regionById(GUILDS[id].home) : null) || REGIONS[0]; }
function guildTierName(id) { const t = GUILDS[id] && GUILDS[id].tier; return t === 'giant' ? '거대 길드' : t === 'gov' ? '정부 기관' : '중소 길드'; }
// 선택지 정보 버튼에 띄울 길드 소개 (B의 공통 UI가 ch.info(g)를 부른다)
function guildInfo(id) {
  const g = GUILDS[id]; if (!g) return '';
  const home = guildHome(id);
  const lines = [`${g.name} · ${guildTierName(id)}`, `본거지: ${home ? home.name : '-'}`];
  if (g.minor) {
    lines.push(`규모: 약 ${g.size}명 · 성향: ${g.style}`, `특기: ${g.spec}`, `평판: ${g.rep >= 60 ? '좋음' : g.rep >= 45 ? '보통' : '호불호'} (${g.rep})`, `가입 조건: 공식 ${RANKS[g.minRank].key}급 이상${g.fameReq ? `, 명성 ${g.fameReq}` : ''}`);
  } else lines.push(`가입 조건: 명성 ${g.fameReq}${g.tier === 'giant' ? ' · 보통 C급 이상만 스카우트' : ''}`);
  lines.push(g.desc);
  return lines.join('\n');
}

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  // 가까운 순(같은 도시 먼저), 같은 거리면 평판 순
  GP.minorGuildsNear = function (regionId, d = 1) {
    const dist = (id) => (GUILDS[id].home === regionId ? 0 : regionDist(GUILDS[id].home, regionId));
    return Object.keys(MINOR_GUILDS).filter((id) => GUILDS[id] && dist(id) <= d).sort((a, b) => dist(a) - dist(b) || GUILDS[b].rep - GUILDS[a].rep);
  };

  wrap('initSandbox', function (base) {
    base.call(this);
    const w = this.world;
    w.guildPrestige ??= {};
    for (const [id, m] of Object.entries(MINOR_GUILDS)) w.guildPrestige[id] ??= Math.round(m.size / 3 + m.rep / 10);
    // 옛 저장: 낮은 등급 NPC 일부를 지역 중소 길드로
    if (!w.minorSeeded) {
      w.minorSeeded = true;
      for (const n of this.adults()) {
        if (n.isCompanion || n.examMate || n.met) continue;
        const near = this.minorGuildsNear(n.region);
        if (!near.length) continue;
        if (n.rankIdx <= 3 && (n.guild && GUILD_TIER[n.guild] === 'giant' ? RNG.chance(0.6) : !n.guild && RNG.chance(0.3))) n.guild = RNG.pick(near);
      }
    }
  });

  // 새 NPC: 낮은 등급은 지역 중소 길드 위주
  const minorFor = (g, n) => {
    if (!n || n.child || !n.guild || GUILD_TIER[n.guild] !== 'giant' || n.rankIdx > 3) return;
    if (!RNG.chance(0.7)) return;
    const near = g.minorGuildsNear(n.region); if (near.length) n.guild = RNG.pick(near);
  };
  wrap('makeNpc', function (base, young, race) { const n = base.call(this, young, race); minorFor(this, n); return n; });
  wrap('simulateNpcs', function (base) {
    const before = new Map(this.npcs.map((n) => [n.id, n.guild]));
    base.call(this);
    for (const n of this.npcs) if (n.alive && n.guild && before.get(n.id) !== n.guild && !n.isCompanion) minorFor(this, n);
    // 성장한 중소 길드원은 거대 길드의 스카우트를 받기도 한다
    if (RNG.chance(0.15)) {
      const n = RNG.pick(this.adults().filter((x) => x.guild && GUILD_TIER[x.guild] === 'minor' && x.rankIdx >= 4 && !x.isCompanion));
      if (n) { const from = n.guild; const to = RNG.pick(['baekho', 'cheongryong', 'hyeonmu', 'jujak']); n.guild = to; if (n.rankIdx >= 5 || n.met) this.rumor(`${GUILDS[from].name}의 ${RANKS[n.rankIdx].key}급 ${n.name}, ${GUILDS[to].name}에 스카우트. 중소 길드 출신 성공 사례.`, { kind: 'transfer', score: 1 }); }
    }
  });

  // 중소 길드 가입
  GP.canJoinMinor = function (id) {
    const g = GUILDS[id]; const p = this.player;
    if (!g || !g.minor) return '그런 길드는 없다.';
    if (p.guild) return '이미 소속된 길드가 있다.';
    if ((p.official ?? 0) < g.minRank) return `공식 ${RANKS[g.minRank].key}급 이상만 받는다.`;
    if (p.fame < g.fameReq) return `명성 ${g.fameReq} 이상이 필요하다.`;
    if ((p.wanted || 0) >= 1) return '수배 중인 사람은 받지 않는다.';
    return '';
  };
  GP.joinMinorGuild = function (id, bonus = 0) {
    const why = this.canJoinMinor(id); if (why) return why;
    const p = this.player; const g = GUILDS[id];
    if (p.crew && this.crewLeave) this.crewLeave('quit');
    p.guild = id; p.guildRank = 0; p.contrib = 0;
    if (bonus) p.money += bonus;
    this.lifeEvent(`${g.name}(${guildTierName(id)})에 들어갔다.`);
    this.log(`${g.name}에 수습으로 들어갔다.`, 'major');
    return `${g.name}에 수습으로 들어갔다.${bonus ? ` 입단 지원금 ${fmt(bonus)} 크레딧.` : ''}`;
  };

  // 신규 등록 문자를 보낼 두 곳: 등급에 맞춰
  GP.debutGuildOffers = function () {
    const p = this.player; const off = p.official ?? p.rankIdx;
    const f = this.flags.story;
    if (f.debutOffers && f.debutOffers.mk === this.monthKey()) return f.debutOffers.ids;
    const near = this.minorGuildsNear(p.region, 1).filter((id) => GUILDS[id].minRank <= off);
    const far = Object.keys(MINOR_GUILDS).filter((id) => GUILDS[id] && GUILDS[id].minRank <= off && !near.includes(id));
    // 같은 도시 길드가 먼저 연락하고, 나머지는 이웃 도시에서 무작위
    const home = near.filter((id) => GUILDS[id].home === p.region); const nb = near.filter((id) => GUILDS[id].home !== p.region).sort(() => RNG.next() - 0.5);
    const pool = [...home.sort(() => RNG.next() - 0.5), ...nb, ...far.sort(() => RNG.next() - 0.5)];
    let ids = pool.slice(0, 2);
    // 거대 길드는 공식 C급 이상이거나 특출할 때만
    if (off >= 3 || p.talent >= 9) ids = [RNG.pick(['baekho', 'cheongryong', 'hyeonmu', 'jujak']), ids[0]];
    f.debutOffers = { mk: this.monthKey(), ids };
    return ids;
  };
}

// ---------- 신규 등록 문자 이벤트 (debut_rising_0) ----------
if (typeof STORY !== 'undefined') {
  const ev = STORY.find((e) => e.id === 'debut_rising_0');
  if (ev) {
    const offerLine = (g, id) => { const x = GUILDS[id]; return x.minor ? `${x.name}(${guildHome(id).name}, ${x.size}명 규모)` : `${x.name}(거대 길드)`; };
    ev.text = (g) => {
      const [a, b] = g.debutGuildOffers();
      const head = `지역 뉴스 끝자락에 한 줄이 실렸다. "${regionById(g.player.region).name}, 올해 첫 ${RANKS[g.player.rankIdx].key}급 신규 등록."`;
      if (!b) return `${head} 오후에 ${offerLine(g, a)}에서 문자가 왔다.\n\n"수습 3개월, 숙소 제공." 거창하진 않지만 현실적인 조건이다.`;
      const big = GUILD_TIER[a] === 'giant';
      return `${head} 오후에 ${big ? '' : '길드 두 곳에서 '}문자가 왔다.\n\n${offerLine(g, a)}: ${big ? '"인재 확보팀입니다. 면담 한번 하시죠."' : `"${GUILDS[a].spec} 위주로 일합니다. 수습 3개월, 숙소 제공."`}\n${offerLine(g, b)}: "${GUILDS[b].spec}. 수습 3개월부터, 사람이 좋아요."`;
    };
    const joinChoice = (k) => {
      const ch = {
        when: (g) => !g.player.guild && !!g.debutGuildOffers()[k],
        do: (g) => {
          const id = g.debutGuildOffers()[k]; if (typeof dn === 'function') dn(g);
          if (GUILD_TIER[id] === 'giant') { const r = g.debutJoinGuild ? g.debutJoinGuild(id, 600) : ''; return `${GUILDS[id].name} 면담실. 계약서가 두꺼웠다.` + r; }
          const p = g.player; const prev = p.official; p.official = Math.max(p.official ?? 0, GUILDS[id].minRank); const r = g.joinMinorGuild(id, 300); p.official = prev;
          return `${GUILDS[id].name} 사무실은 생각보다 작았지만, 다들 이름을 먼저 물어봤다. ` + r;
        },
      };
      Object.defineProperty(ch, 'text', { get: () => { const id = G.debutGuildOffers()[k]; return id ? `${GUILDS[id].name}에 수습으로 들어간다` : '…'; }, enumerable: true });
      ch.info = (g) => guildInfo(g.debutGuildOffers()[k]);
      return ch;
    };
    const keep = ev.choices.filter((c) => !/주작 프리랜서 연합 수습/.test(c.text));
    ev.choices = [joinChoice(0), joinChoice(1), ...keep];
  }
  // 측정 뒤 소속 갈림길(아무 데서도 연락 없음)에 지역 중소 길드 선택지
  const aff = STORY.find((e) => e.id === 'aff_guild_normal');
  if (aff && aff.choices && !aff.choices.some((c) => c._minor)) {
    const ch = {
      _minor: true,
      when: (g) => !g.player.guild && g.minorGuildsNear(g.player.region, 1).length > 0,
      do: (g) => {
        const id = g.minorGuildsNear(g.player.region, 1)[0];
        const p = g.player; const prev = p.official; p.official = Math.max(p.official ?? 0, GUILDS[id].minRank);
        const r = g.joinMinorGuild(id, 100); p.official = prev;
        if (p.origin) p.origin.aff = 'guild';
        if (typeof afterAff === 'function') afterAff(g);
        return `동네 ${GUILDS[id].name}에 전화를 걸었다. "내일부터 나와요." 그게 다였다. ` + r;
      },
    };
    Object.defineProperty(ch, 'text', { get: () => { const id = G.minorGuildsNear(G.player.region, 1)[0]; return id ? `지역 중소 길드 ${GUILDS[id].name}에 연락한다` : '지역 중소 길드에 연락한다'; }, enumerable: true });
    ch.info = (g) => { const id = g.minorGuildsNear(g.player.region, 1)[0]; return id ? guildInfo(id) : ''; };
    aff.choices.splice(aff.choices.length - 1, 0, ch);
  }
  // 거대 길드 선택지에도 정보
  for (const e of STORY) for (const c of e.choices || []) {
    if (c.info) continue;
    const m = Object.keys(GUILDS).find((id) => typeof c.text === 'string' && GUILDS[id].name && c.text.includes(GUILDS[id].name.split(' ')[0]) && /들어간|계약|가입|수습/.test(c.text));
    if (m) c.info = () => guildInfo(m);
  }
}

// ---------- 길드 화면: 지역 중소 길드 ----------
if (typeof UI !== 'undefined' && UI.guildHtml) {
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const html = baseGuild.call(this);
    const p = G.player; const near = G.minorGuildsNear(G.region().id, 1);
    if (!near.length) return html;
    const rows = near.map((id) => {
      const g = GUILDS[id]; const why = G.canJoinMinor(id);
      return `<div class="item-row ${p.guild === id ? 'hl' : ''}"><span class="slot-ico" style="--c:${g.color}">${FX.elemIcon(g.elem, 20)}</span><div class="grow"><b style="color:${g.color}">${g.name}</b> <span class="small dim">${guildHome(id).name} · ${g.size}명 · ${g.style}</span>
        <div class="small dim">특기: ${g.spec} · 평판 ${g.rep} · 공식 ${RANKS[g.minRank].key}급↑${g.fameReq ? ` · 명성 ${g.fameReq}` : ''}</div><div class="small dim">${g.desc}</div></div>
        ${p.guild === id ? '<span class="tag good">소속</span>' : p.guild ? '' : `<button class="sm" data-act="minor-join" data-v="${id}" ${why ? 'disabled' : ''}>가입</button>`}</div>`;
    }).join('');
    return html + `<div class="panel sec"><h3>이 지역 중소 길드</h3><p class="small dim">거대 길드(백호·청룡·현무·주작)는 보통 C급 이상만 스카우트한다. 낮은 등급 헌터 대부분은 지역 중소 길드에서 시작한다.</p><div class="cards">${rows}</div></div>`;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'minor-join') return this.after(G.joinMinorGuild(v));
    return baseHandle.call(this, act, v);
  };
}
