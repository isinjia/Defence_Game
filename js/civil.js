// ===== 게이트 크로니클: 관리국 공무원 경로 =====
// docs/헌터물_제안4_결합장르.md 2. 길드 대신 관리국(kama) 소속으로 사는 헌터.
// - 첫 해 소속 결정에서 관리국 연수·특채로 들어가면 그대로 이어진다.
// - 직급: 주무관 → 팀장 → 과장 → 국장. 인사 고과가 쌓이고 등급이 받쳐 주면 승진 심사.
// - 매달 업무 배정(조사·측정·단속·대응). [출근]하면 한 달이 흐르고 고과·공적이 오른다. 결근하면 고과가 깎인다.
// - 고정 월급과 연금(은퇴·사망 때 지급). 길드에 없는 권한: 관내 게이트의 등급 오판 내부 자료.
// - 겸업 제한(방송·후원자 계약)과 연 1회 감사. 비리 제안을 받으면 돈, 걸리면 징계.
// - 무법 성향 회귀자에게는 특별 채용 사건.

const CIVIL_GRADES = [
  { name: '주무관', eval: 0, rank: 0 },
  { name: '팀장', eval: 30, rank: 2 },
  { name: '과장', eval: 70, rank: 4 },
  { name: '국장', eval: 120, rank: 5 },
];
const CIVIL_DUTIES = {
  survey: { name: '현장 조사', desc: '새로 열린 게이트 주변 에테르를 재고 보고서를 쓴다.' },
  measure: { name: '등급 측정', desc: '의뢰소 측정실에서 신규 각성자를 측정한다.' },
  raid: { name: '빌런 단속', desc: '무등록 각성자·불법 포획 업자를 단속한다.' },
  response: { name: '브레이크 초동 대응', desc: '경보가 울리면 가장 먼저 현장에 간다.' },
};

Object.assign(Game.prototype, {
  isCivil() { const p = this.player; return !!(p && p.guild === 'kama' && p.civil); },
  civilInit() {
    const p = this.player; if (p.civil || p.guild !== 'kama') return;
    const mk = this.monthKey();
    p.civil = { grade: p.guildRank >= 1 ? 1 : 0, eval: 0, since: mk, duty: null, dutyMk: -1, worked: -1, pension: 0, audit: mk + 12, side: 0, bribes: 0, warned: 0, boss: null, peer: null };
    const mk2 = (rank, rel, pers) => { const n = this.makeNpc(false, 'human'); Object.assign(n, { rankIdx: Math.max(0, Math.min(7, rank)), stage: 1, region: 'incheon', met: true, relation: rel, guild: 'kama', personality: pers, links: {}, disciples: [], parents: [] }); n.ageMonths = Math.max(n.ageMonths, (24 + n.rankIdx * 3) * 12); this.npcs.push(n); return n; };
    p.civil.boss = mk2(p.rankIdx + 2, 15, RNG.pick(['cold', 'just', 'greedy'])).id;
    p.civil.peer = mk2(p.rankIdx, 30, RNG.pick(['kind', 'warlike', 'just'])).id;
    this.lifeEvent(`관리국 ${CIVIL_GRADES[p.civil.grade].name}(으)로 임용되었다.`);
  },
  civilBoss() { const c = this.player.civil; return c && this.npcById(c.boss); },
  civilPeer() { const c = this.player.civil; return c && this.npcById(c.peer); },
  civilSalary() { const c = this.player.civil; return Math.round(70 * RANKS[this.player.rankIdx].mult ** 0.7 * (1 + c.grade * 0.6)); },
  civilDuty() {
    const c = this.player.civil; const mk = this.monthKey();
    if (c.dutyMk !== mk) { c.duty = RNG.pick(Object.keys(CIVIL_DUTIES)); c.dutyMk = mk; }
    return c.duty;
  },
  // 출근: 한 달 동안 배정 업무
  civilWork() {
    const p = this.player; const c = p.civil; if (!this.isCivil() || !this.canAct()) return '';
    if (c.worked === this.monthKey()) return '이번 달 업무는 이미 마쳤다.';
    const duty = this.civilDuty(); c.worked = this.monthKey();
    const boss = this.civilBoss(); const peer = this.civilPeer();
    let ev = 5 + RNG.int(0, 4); let text = '';
    if (duty === 'survey') { text = '게이트 주변을 돌며 에테르 수치를 쟀다. 보고서는 열네 장이었다.'; this.addEther(Math.round(this.trainGain(0.6))); }
    if (duty === 'measure') { text = RNG.pick(['신규 각성자 마흔 명을 측정했다. 그중 하나가 D급이 나와 측정실이 술렁였다.', '하루 종일 "제 등급 다시 재 주세요"라는 민원을 들었다.', '측정기를 붙잡고 우는 F급 신입에게 휴지를 건넸다.']); ev += 1; }
    if (duty === 'raid') {
      text = '무등록 각성자 조직의 거점을 덮쳤다.';
      this.storyFight({ title: '관리국 단속', mobs: { tier: p.rankIdx, n: 2, human: true }, win: { text: '전원 체포. 단속 실적이 결재판에 올랐다.', gain: { merit: 8 }, after: (G) => { G.player.civil.eval += 6; } }, lose: { text: '놓쳤다. 상사에게 불려 가 한 소리 들었다.', gain: { injure: 1 }, after: (G) => { G.player.civil.eval -= 3; } } });
    }
    if (duty === 'response') {
      text = '새벽 3시 브레이크 경보. 가장 먼저 현장에 도착했다.';
      this.storyFight({ title: '브레이크 초동 대응', mobs: { tier: Math.min(7, p.rankIdx), n: 3 }, win: { text: '진압팀이 오기 전에 저지선을 지켰다. 시민 피해 0명.', gain: { merit: 10, rep: 6 }, after: (G) => { G.player.civil.eval += 8; } }, lose: { text: '저지선이 밀렸지만 대피는 끝냈다.', gain: { injure: 1, rep: 2 } } });
    }
    c.eval += ev; p.merit += 3 + c.grade * 2;
    if (peer && RNG.chance(0.4)) { this.changeRel(peer, 3, '같이 야근했다'); text += ` 동기 ${peer.name}와(과) 야근 뒤 국밥을 먹었다.`; }
    if (boss && RNG.chance(0.3)) { this.changeRel(boss, 2, '결재를 받았다'); text += ` ${boss.name} ${CIVIL_GRADES[Math.min(3, c.grade + 1)].name}이(가) 말없이 결재 도장을 찍었다.`; }
    this.log(`관리국 업무(${CIVIL_DUTIES[duty].name})를 마쳤다. 인사 고과 +${ev}`, 'good');
    this.advanceMonth(1, { eventChance: 0.1 });
    return `${CIVIL_DUTIES[duty].name}: ${text} (인사 고과 +${ev}, 협회 공적 +${3 + c.grade * 2})`;
  },
  civilCanPromote() { const p = this.player; const c = p.civil; const nx = CIVIL_GRADES[c.grade + 1]; return !!nx && c.eval >= nx.eval && p.rankIdx >= nx.rank; },
  civilMonthly() {
    const p = this.player;
    if (p.guild === 'kama' && !p.civil) this.civilInit();
    if (!this.isCivil()) return;
    const c = p.civil; const mk = this.monthKey();
    // 지난달 결근
    if (c.worked < mk - 1 && mk - c.since > 1) c.eval = Math.max(0, c.eval - 2);
    const sal = this.civilSalary(); p.money += sal; c.pension += Math.round(sal * 0.2);
    // 관내 게이트 내부 자료: 등급 오판을 미리 안다
    for (const g of this.mapGates) if (g.variant === 'misrank' && !g.revealedMis && g.region === p.region) { g.revealedMis = true; g.civilIntel = true; this.log(`관리국 내부 자료: ${this.gateName ? this.gateName(g) : '관내 게이트'}의 실제 등급은 ${RANKS[g.realTier].key}급이다.`); }
    // 승진 심사
    if (this.civilCanPromote() && !this.queue.some((q) => q.id === 'civil_promo')) this.queue.push({ type: 'story', id: 'civil_promo', npc: c.boss });
    // 비리 제안
    else if (c.grade >= 1 && RNG.chance(0.05) && !this.queue.some((q) => q.type === 'story')) this.queue.push({ type: 'story', id: 'civil_bribe' });
    // 감사
    if (mk >= c.audit) { c.audit = mk + 12; this.queue.push({ type: 'story', id: 'civil_audit' }); }
  },
  civilLeave(why) {
    const p = this.player; if (!p.civil) return;
    const pen = p.civil.pension;
    p.civil = null; if (p.guild === 'kama') { p.guild = null; p.guildRank = 0; p.contrib = 0; }
    if (pen) { p.money += Math.round(pen * 0.5); }
    this.lifeEvent(`관리국을 떠났다. (${why})`);
    return pen ? ` 연금 적립금 절반 ${fmt(Math.round(pen * 0.5))} 크레딧을 일시금으로 받았다.` : '';
  },
});

// ---------- 사건 ----------
S({ id: 'civil_promo', trigger: 'system', npc: 'here', text: (g, c) => { const cv = g.player.civil; const nx = CIVIL_GRADES[cv.grade + 1]; return `인사과에서 승진 심사 통지가 왔다. ${nx.name} 승진 후보.\n\n면접장에 앉은 ${c.npc ? c.npc.name : '상사'}이(가) 서류를 넘기며 묻는다. "현장에서 제일 중요한 게 뭐라고 생각합니까?"`; },
  choices: [
    { text: '"사람이 안 다치는 겁니다."', do: (g) => { const cv = g.player.civil; cv.grade++; g.lifeEvent(`관리국 ${CIVIL_GRADES[cv.grade].name}(으)로 승진했다.`); return `${CIVIL_GRADES[cv.grade].name} 발령. 책상이 한 칸 창가로 옮겨졌다.` + g.gain({ fame: 3, merit: 10 }); } },
    { text: '"절차입니다. 절차가 사람을 지킵니다."', do: (g, c) => { const cv = g.player.civil; cv.grade++; if (c.npc) g.changeRel(c.npc, 8); g.lifeEvent(`관리국 ${CIVIL_GRADES[cv.grade].name}(으)로 승진했다.`); return `심사관이 처음으로 고개를 끄덕였다. ${CIVIL_GRADES[cv.grade].name} 발령.` + g.gain({ merit: 15 }); } },
    { text: '"솔직히 실적이죠."', do: (g) => { const cv = g.player.civil; if (g.roll(0.5)) { cv.grade++; g.lifeEvent(`관리국 ${CIVIL_GRADES[cv.grade].name}(으)로 승진했다.`); return '심사관이 웃었다. "솔직해서 좋네요." 승진.' + g.gain({ merit: 5 }); } cv.eval -= 10; return '"다음 심사 때 봅시다." 탈락이다.'; } },
  ] });
S({ id: 'civil_bribe', trigger: 'system', text: '퇴근길 주차장. 낯선 남자가 쇼핑백을 내민다. "공략권 심사, 저희 길드 쪽으로 조금만 신경 써 주시면 됩니다. 아무도 모릅니다."\n\n쇼핑백 안에 현금 다발이 보인다.',
  choices: [
    { text: '받는다', do: (g) => { const cv = g.player.civil; cv.bribes++; g.addLaw && g.addLaw(-10, '뇌물을 받았다'); return '심장이 빨리 뛰었다. 아무도 보지 않았다. …아마도.' + g.gain({ money: 1500 }); } },
    { text: '돌려보낸다', do: (g) => { g.player.civil.eval += 3; return '"후회하실 텐데." 남자가 사라졌다.'; } },
    { text: '감찰실에 신고한다', do: (g) => { const cv = g.player.civil; cv.eval += 8; g.addLaw && g.addLaw(6, '뇌물을 신고했다'); g.rumor('관리국 내부 신고로 공략권 심사 비리가 드러났다.'); return '감찰실이 움직였다. 그 길드의 공략권이 정지됐다.' + g.gain({ merit: 12 }); } },
  ] });
S({ id: 'civil_audit', trigger: 'system', text: (g) => { const cv = g.player.civil; return `연례 감사 기간. 감사관이 1년 치 업무 일지와 통장 내역을 요구한다.${cv.side ? ' 겸업 금지 규정 조항에 형광펜이 그어져 있다.' : ''}`; },
  choices: [
    { text: '성실히 응한다', do: (g) => {
      const p = g.player; const cv = p.civil;
      const risk = Math.min(0.9, cv.bribes * 0.35 + cv.side * 0.08);
      const caught = cv.bribes + cv.side > 0 && RNG.chance(risk);
      const sum = cv.bribes; cv.side = 0;
      if (!caught) { cv.eval += 2; return '감사는 무사히 끝났다.' + (sum ? ' 식은땀이 났다.' : ''); }
      cv.warned++; cv.bribes = 0;
      if (cv.warned >= 2) { const r = g.civilLeave('감사에서 두 번째로 적발되어 파면'); g.rumor(`관리국 ${p.name}, 비위로 파면.`); return '두 번째 적발. 파면 통지서가 나왔다.' + r + g.gain({ fame: -10, merit: -30 }); }
      cv.eval = Math.max(0, cv.eval - 30); if (cv.grade > 0 && sum) cv.grade--;
      return `감사에서 적발됐다. ${sum ? '강등과 ' : ''}감봉 징계. 다음에 또 걸리면 파면이다.` + g.gain({ merit: -15, money: -500 });
    } },
  ] });
S({ id: 'civil_special_hire', once: true, when: (g) => g.player.regress && (g.player.law || 0) <= -30 && !g.player.guild, minRank: 2, weight: 3,
  text: '관리국 감찰실장이 직접 찾아왔다. 서류철 맨 위에 당신의 무법 행적이 정리돼 있다.\n\n"체포할 수도 있습니다. 그런데 국장님 생각은 다르더군요. 어둠을 아는 사람이 어둠을 잡는다고. 특별 채용입니다. 거절하시면… 서류는 검찰로 갑니다."',
  choices: [
    { text: '임용을 받아들인다', do: (g) => { g.affJoin('kama', 1); g.civilInit(); g.addLaw && g.addLaw(30, '관리국에 특별 채용되었다'); return '관리국 신분증이 손에 쥐어졌다. 지난 삶의 기억이 쓴웃음을 지었다.' + g.gain({ merit: 10 }); } },
    { text: '거절한다', do: (g) => (g.addLaw && g.addLaw(-5, '관리국의 손을 뿌리쳤다'), '감찰실장이 서류철을 덮었다. "후회하실 겁니다."') + g.gain({ merit: -20 }) },
  ] });

// ---------- 연결 ----------
(() => {
  const P = Game.prototype;
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () { baseMonthly.call(this); this.civilMonthly(); };
  // 관리국에 들어가면 바로 임용
  const baseJoin = P.affJoin;
  if (baseJoin) P.affJoin = function (id, rank) { const r = baseJoin.call(this, id, rank); if (id === 'kama') this.civilInit(); return r; };
  // 다른 길드로 옮기면 공무원 신분 종료
  const baseLeave = P.leaveGuild;
  if (baseLeave) P.leaveGuild = function () { const was = this.isCivil(); const r = baseLeave.call(this); if (was) { const x = this.civilLeave('사직'); return r + (x || ''); } return r; };
  // 겸업: 방송·후원 계약은 감사 대상
  const baseStream = P.streamResult;
  if (baseStream) P.streamResult = function (gate, result) { const r = baseStream.call(this, gate, result); if (this.isCivil()) { this.player.civil.side++; r.push('(관리국 겸업 금지 규정 위반 소지. 감사 때 문제가 될 수 있다.)'); } return r; };
  const baseSponsor = P.takeSponsor;
  if (baseSponsor) P.takeSponsor = function (id) { const r = baseSponsor.call(this, id); if (this.isCivil()) this.player.civil.side += 3; return r; };
  // 연금: 은퇴하면 받고, 죽으면 유족에게 절반
  const basePay = P.insPayout;
  if (basePay) P.insPayout = function () { const c = this.player.civil; return basePay.call(this) + (c && c.pension ? Math.round(c.pension * (this.over && this.over.retired ? 1 : 0.5)) : 0); };
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); this.player.civil ??= null; };
})();

(() => {
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const html = baseGuild.call(this);
    if (!G.isCivil()) return html;
    const p = G.player; const c = p.civil; const duty = G.civilDuty();
    const nx = CIVIL_GRADES[c.grade + 1]; const boss = G.civilBoss(); const peer = G.civilPeer();
    const worked = c.worked === G.monthKey();
    return `<div class="panel"><h3>관리국 · ${CIVIL_GRADES[c.grade].name}</h3>
      <p class="dim small">길드 대신 관리국에서 사는 헌터. 월급은 적지만 고정이고 연금이 쌓인다. 방송·후원자 계약은 겸업 금지 규정에 걸려 감사 때 문제가 된다.</p>
      <div class="cards">
        <div class="item-row ${worked ? '' : 'hl'}"><div class="grow"><b>이번 달 업무 · ${CIVIL_DUTIES[duty].name}</b><div class="small dim">${CIVIL_DUTIES[duty].desc}${worked ? ' · 완료' : ' · 출근하지 않으면 고과가 깎인다'}</div></div><button class="sm primary" data-act="civil-work" ${worked ? 'disabled' : ''}>출근 · 1개월</button></div>
        <div class="item-row"><div class="grow"><b>인사 고과 ${c.eval}</b><div class="small dim">${nx ? `${nx.name} 승진: 고과 ${nx.eval} · ${RANKS[nx.rank].key}급 이상` : '최고 직급'}</div></div></div>
        <div class="item-row"><div class="grow"><b>월급 ${fmt(G.civilSalary())} · 연금 적립 ${fmt(c.pension)}</b><div class="small dim">다음 감사까지 ${Math.max(0, c.audit - G.monthKey())}개월${c.warned ? ` · <span class="bad">징계 ${c.warned}회</span>` : ''}</div></div></div>
        ${boss ? `<div class="item-row">${this.npcAvatar(boss, 32)}<div class="grow"><b>${boss.name}</b> <span class="small dim">상사 · ${relationLabel(boss.relation)}</span></div></div>` : ''}
        ${peer ? `<div class="item-row">${this.npcAvatar(peer, 32)}<div class="grow"><b>${peer.name}</b> <span class="small dim">동기 · ${relationLabel(peer.relation)}</span></div></div>` : ''}
      </div></div>` + html;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'civil-work') return this.after(G.civilWork());
    return baseHandle.call(this, act, v);
  };
})();
