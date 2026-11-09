// ===== 게이트 크로니클: 사건 간격 조절 · 한국 달력 사건 =====
// 조용한 달이 길어지면 사건이 잦아지고, 직전 달에 사건이 있었으면 뜸해진다.
// 한국의 명절·행사 사건이 그 달에 가끔 찾아온다(같은 사건은 2년에 한 번까지. 설, 추석, 장마, 수능, 연말 시상식 등).

const STORY_QUIET_MAX = 8; // 이 개월 수 이상 조용하면 사건 하나를 보장

Object.assign(Game.prototype, {
  storyQuiet() {
    const f = this.flags; const mk = this.monthKey();
    if (f.lastStory == null) f.lastStory = mk;
    return mk - f.lastStory;
  },
  // 사건 확률 배수
  storyPace() {
    const q = this.storyQuiet();
    if (q <= 1) return 0.5;
    if (q >= 6) return 2;
    if (q >= 4) return 1.4;
    return 1;
  },
  inDebut() { const d = this.player.debut; return !!(d && !d.done); },
  storyCalendar() {
    const f = this.flags; f.calYear ??= {};
    if (this.inDebut()) return false;
    const cands = STORY.filter((ev) => ev.trigger === 'calendar' && ev.cal.includes(this.month) && (f.calYear[ev.id] == null || this.year - f.calYear[ev.id] >= 2) && this.storyEligible(ev, {}));
    if (!cands.length || !RNG.chance(0.2)) return false;
    const ev = RNG.pick(cands);
    f.calYear[ev.id] = this.year;
    this.queue.push({ type: 'story', id: ev.id, npc: null });
    return true;
  },
});

(() => {
  const P = Game.prototype;
  const baseDebut = P.debutStart;
  if (baseDebut) P.debutStart = function () { baseDebut.call(this); const d = this.player.debut; if (d && d.start == null) d.start = this.monthKey(); };
  const baseMonth = P.advanceMonth;
  P.advanceMonth = function (n = 1, opts = {}) {
    if (opts.eventChance && this.flags) opts = { ...opts, eventChance: Math.min(0.9, opts.eventChance * this.storyPace()) };
    return baseMonth.call(this, n, opts);
  };
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () {
    baseMonthly.call(this);
    // 첫 해: 최소 두 달에 한 번은 무언가 일어난다 (데뷔 사건 포함)
    const d = this.player.debut;
    if (d && d.start != null && this.monthKey() - d.start < 12 && this.monthKey() - (this.flags.lastAny ?? d.start) >= 2 && !this.queue.some((q) => q.type === 'story' || q.type === 'request')) {
      const ev = this.pickStory('month');
      if (ev) { this.queue.push(ev); return; }
      if (this.pickRequest) { const r = this.pickRequest(); if (r) { this.queue.push(r); this.flags.lastAny = this.monthKey(); return; } }
    }
    if (this.storyCalendar()) return;
    // 너무 오래 조용하면 하나는 일어난다
    if (!this.inDebut() && this.storyQuiet() >= STORY_QUIET_MAX && !this.queue.some((q) => q.type === 'story')) {
      const ev = this.pickStory('month');
      if (ev) this.queue.push(ev);
    }
  };
})();

// ---------- 달력 사건 ----------
const CAL = (ev) => S({ trigger: 'calendar', repeat: true, ...ev });

CAL({ id: 'cal_seollal', cal: [1, 2], text: '설 연휴. 협회 게시판도 반쯤 비었다. 고향 쪽에서 문자가 온다. "올해는 내려오니? 떡국 끓여 놨다. 요즘 마을 뒷산에 작은 게이트가 자꾸 열린다더라."',
  choices: [
    { text: '고향에 내려가 뒷산 게이트까지 정리한다', do: (g) => { g.advanceDays(5, { noSave: true }); return '떡국 한 그릇을 비우고 뒷산에 올랐다. 작은 게이트 세 개를 닫고 내려오자 동네 어르신들이 세뱃돈을 쥐여 줬다. "우리 동네 헌터 왔네."' + g.gain({ hp: 1, rep: 4, money: 60, fame: 1 }); } },
    { text: '연휴 특근 게이트를 맡는다 (수당 두 배)', do: (g) => '빈 도시를 지키는 연휴 특근. 텅 빈 거리에서 혼자 먹는 편의점 떡국도 나쁘지 않았다.' + g.gain({ money: 220, merit: 5 }) },
    { text: '전화로 안부만 전한다', do: (g) => '"그래, 몸조심하고." 끊긴 전화 너머로 텔레비전 소리가 오래 남았다.' + g.gain({ hp: 0.3 }) },
  ] });

CAL({ id: 'cal_daeboreum', cal: [2], text: '정월대보름. 한강 둔치에서 쥐불놀이 대신 "에테르 불꽃놀이" 행사가 열린다. 화염 계열 각성자들이 하늘에 불꽃을 그린다. 주최 측이 당신에게도 참가를 청한다.',
  choices: [
    { text: '무대에 올라 실력을 보여 준다', do: (g) => g.player.element === 'fire' ? '하늘 가득 커다란 보름달을 그렸다. 환호성이 강을 건너 퍼졌다.' + g.gain({ fame: 4, rep: 4 }) : '불꽃은 아니지만 당신만의 빛을 그렸다. 박수가 조금 늦게, 그러나 길게 이어졌다.' + g.gain({ fame: 2, rep: 2 }) },
    { text: '부럼을 깨며 구경한다', do: (g) => '호두를 깨물자 딱 소리가 났다. 올 한 해 부스럼은 없겠지.' + g.gain({ hp: 0.4 }) },
  ] });

CAL({ id: 'cal_newcomer', cal: [3], text: '3월, 협회 신규 각성자 등록 시즌. 접수창구 앞에 갓 각성한 신입들이 긴 줄을 섰다. 그중 하나가 당신을 알아보고 머뭇거리며 다가온다. "저… 처음엔 다들 뭐부터 하셨어요?"',
  choices: [
    { text: '아는 걸 하나하나 알려 준다', do: (g) => '신입은 수첩에 받아 적었다. "게이트 등급표는 외우는 게 아니라 몸으로 아는 거야." 자기가 한 말에 스스로 놀랐다.' + g.gain({ rep: 3, fame: 1, ether: 5 }) },
    { text: '"살아남는 게 먼저야"라고만 말한다', do: (g) => '신입은 고개를 끄덕였다. 몇 년 뒤, 그 말을 기억한다며 인사하러 올지도 모른다.' + g.gain({ fame: 1 }) },
  ] });

CAL({ id: 'cal_cherry', cal: [4], text: '벚꽃 철. 꽃잎이 흩날리는 강변 산책로 한복판에 분홍빛 게이트가 열렸다. 꽃잎을 닮은 괴수들이 사람들 사이로 떠다닌다. 아름다운데, 닿으면 살이 벤다.',
  choices: [
    { text: '산책객을 대피시키고 게이트를 닫는다', do: (g) => { g.storyFight({ title: '벚꽃 게이트', mobs: { tier: g.player.rankIdx, n: 3, elem: 'spirit' }, win: { text: '마지막 꽃잎 괴수가 흩어지자 진짜 벚꽃만 남았다. 누군가 그 장면을 찍어 올렸다.', gain: { fame: 3, rep: 5 } } }); return '꽃잎 사이로 뛰어들었다.'; } },
    { text: '관리국에 신고만 한다', do: (g) => '진압팀이 오기까지 한 시간. 그 사이 산책로는 텅 비었다.' + g.gain({ merit: 2 }) },
  ] });

CAL({ id: 'cal_children', cal: [5], text: '어린이날. 협회가 "헌터 체험의 날" 행사에 현역 헌터를 모집한다. 아이들에게 장비를 보여 주고, 안전 수칙을 알려 주는 자리다.',
  choices: [
    { text: '참가한다', do: (g) => '아이 하나가 당신 무기를 들어 보려다 낑낑댔다. 다른 아이는 "헌터님도 무서운 적 있어요?"라고 물었다. 있다고 대답했다.' + g.gain({ fame: 3, rep: 5, hp: 0.3 }) },
    { text: '그날도 게이트에 들어간다', do: (g) => '돌아오는 길, 풍선을 든 아이들과 스쳤다. 그 아이들이 무사히 자라는 세상이면 됐다.' + g.gain({ money: 80 }) },
  ] });

CAL({ id: 'cal_memorial', cal: [6], text: '현충일. 대붕괴와 그 뒤의 게이트에서 쓰러진 헌터들의 이름이 새겨진 추모벽 앞. 해마다 이름이 한 줄씩 늘어난다. 묵념 사이렌이 울린다.',
  choices: [
    { text: '아는 이름을 찾아 꽃을 놓는다', do: (g) => { const dead = g.npcs.filter((n) => !n.alive && n.met && n.relation >= 20); return (dead.length ? `${RNG.pick(dead).name}의 이름 앞에 꽃을 놓았다. "다음엔 더 잘할게."` : '아는 이름은 아직 없었다. 그 사실에 조용히 감사했다.') + g.gain({ ether: 10, fame: 1 }); } },
    { text: '추모벽을 지키는 경계 근무를 선다', do: (g) => '하루 종일 서 있었다. 저녁 무렵 노인 하나가 따뜻한 보리차를 건넸다. "우리 아들도 헌터였어요."' + g.gain({ merit: 4, rep: 3 }) },
  ] });

CAL({ id: 'cal_monsoon', cal: [7], text: '장마. 사흘째 폭우가 쏟아지고, 침수된 지하 주차장에 게이트가 열렸다. 물속에서 무언가가 움직인다. 차 안에 갇힌 사람이 있다는 신고가 들어왔다.',
  choices: [
    { text: '물속으로 뛰어든다', do: (g) => { g.storyFight({ title: '침수 게이트', mobs: { tier: g.player.rankIdx, n: 2, elem: 'ice' }, win: { text: '흙탕물 속에서 차 문을 뜯어냈다. 운전석의 남자가 기침을 하며 숨을 몰아쉬었다.', gain: { fame: 3, rep: 6, merit: 4 } }, lose: { text: '물살에 밀려 나왔다. 사람은 뒤늦게 온 구조대가 꺼냈다.', gain: { injure: 1 } } }); return '차가운 물이 목까지 차올랐다.'; } },
    { text: '양수 작업을 돕고 진압팀을 기다린다', do: (g) => '모래주머니를 나르며 밤을 새웠다. 진압팀은 새벽에야 왔다.' + g.gain({ rep: 3, hp: -0.2 }) },
  ] });

CAL({ id: 'cal_summer', cal: [8], text: '한여름. 해수욕장 앞바다에 소형 게이트 경보가 떴다. 피서객으로 붐비는 백사장, 구조대는 각성자 한 명의 지원을 요청한다.',
  choices: [
    { text: '해변 경계를 선다', do: (g) => '파도 사이로 올라오는 작은 괴수 몇 마리를 조용히 처리했다. 아이들은 끝까지 아무것도 몰랐다. 그게 제일 좋은 결과다.' + g.gain({ money: 120, rep: 4 }) },
    { text: '휴가를 낸다', do: (g) => '모래 위에 누워 아무것도 하지 않았다. 각성 이후 처음 있는 일이다.' + g.gain({ hp: 1, ether: 8 }) },
  ] });

CAL({ id: 'cal_chuseok', cal: [9], text: '추석. 고속도로는 귀성 차량으로 꽉 막혔고, 휴게소마다 헌터 경계 근무가 배치됐다. 송편 한 상자가 택배로 도착했다. 보낸 사람 칸에 낯익은 글씨.',
  choices: [
    { text: '고향에 내려간다', do: (g) => { g.advanceDays(4, { noSave: true }); return '차례를 지내고 성묘를 했다. 할머니가 "우리 손주가 헌터라니" 하며 몇 번이고 손을 쓰다듬었다.' + g.gain({ hp: 1, fame: 1, ether: 6 }); } },
    { text: '휴게소 경계 근무를 선다', do: (g) => '명절 수당이 두둑하다. 지나가는 가족들이 송편과 식혜를 건넸다.' + g.gain({ money: 200, merit: 4, rep: 2 }) },
    { text: '송편을 동료들과 나눈다', do: (g) => { const f = g.adults().filter((n) => n.met && n.relation >= 20 && n.region === g.player.region); for (const n of f.slice(0, 3)) g.changeRel(n, 4); return (f.length ? `${f.slice(0, 3).map((n) => n.name).join(', ')}와(과) 송편을 나눠 먹었다.` : '혼자 먹기엔 많아서 이웃들과 나눴다.') + g.gain({ rep: 2 }); } },
  ] });

CAL({ id: 'cal_awaken_day', cal: [10], text: '"각성자의 날". 대붕괴로 첫 게이트가 열리고 첫 각성자가 나타난 날을 기리는 기념일이다. 광장에서 기념식이 열리고, 관리국장이 연설한다. "우리는 재앙 속에서 다시 일어섰습니다."',
  choices: [
    { text: '기념식에 참석한다', do: (g) => '연설 내내 박수가 이어졌다. 단상 뒤 커다란 화면에 20년 전 그날의 하늘이 비쳤다. 보랏빛이었다.' + g.gain({ merit: 4, fame: 1 }) },
    { text: '조용히 수련한다', do: (g) => '각성한 날을 떠올리며 에테르를 돌렸다. 그날보다는 조금 강해졌다.' + g.gain({ ether: 15 }) },
    { text: '비각성자 추모 집회에 간다', do: (g) => '"그날 각성하지 못하고 죽은 사람들도 기억해 주세요." 집회의 목소리는 작았지만 또렷했다.' + g.gain({ rep: 4, merit: -1 }) },
  ] });

CAL({ id: 'cal_suneung', cal: [11], text: '수능 날. 협회가 "수험생 호위" 긴급 의뢰를 냈다. 시험장 근처에 게이트 징후가 있어, 시험이 끝날 때까지 주변을 지켜야 한다. 듣기 평가 시간엔 비행 괴수 한 마리도 날아선 안 된다.',
  choices: [
    { text: '의뢰를 맡는다', do: (g) => { if (g.roll(0.6 + g.player.rankIdx * 0.05)) return '듣기 평가 내내 숨죽여 지켰다. 시험이 끝나고 교문을 나서는 수험생들이 당신을 보고 꾸벅 인사했다.' + g.gain({ money: 160, merit: 6, rep: 5 }); g.storyFight({ title: '시험장 근처 게이트', mobs: { tier: g.player.rankIdx, n: 2, elem: 'bolt' }, win: { text: '소리 없이 처리했다. 시험장 안에서는 아무도 몰랐다.', gain: { money: 200, merit: 8, rep: 6 } } }); return '3교시 직전, 게이트가 열렸다.'; } },
    { text: '교문 앞에서 응원만 한다', do: (g) => '"찍은 거 다 맞아라!" 핫팩을 나눠 줬다.' + g.gain({ rep: 2 }) },
  ] });

CAL({ id: 'cal_awards', cal: [12], minRank: 1, text: '연말 "헌터 대상" 시상식. 올해의 신인상, 최다 게이트 공략상, 시민이 뽑은 헌터상… 레드카펫 위로 플래시가 터진다. 당신에게도 초대장이 왔다.',
  choices: [
    { text: '참석한다', do: (g) => { const p = g.player; const won = p.fame >= 30 + p.rankIdx * 15 && g.roll(0.5); if (won) { g.lifeEvent(`${g.year}년 헌터 대상 시상식에서 상을 받았다.`); return '이름이 불렸다. 무대에 올라 트로피를 받았다. 무슨 말을 했는지는 기억나지 않는다.' + g.gain({ fame: 8, money: 300 }); } return '수상자 명단에 이름은 없었다. 그래도 뒤풀이에서 좋은 사람을 여럿 만났다.' + g.gain({ fame: 1, relAll: 3 }); } },
    { text: '그 시간에 게이트에 들어간다', do: (g) => '시상식 생중계를 라디오로 들으며 마지막 괴수를 베었다. 한 해의 마무리로는 이쪽이 더 어울렸다.' + g.gain({ ether: 12, money: 60 }) },
  ] });
