// ===== 메인 시나리오 종장: 39장 문 · 40장 그 뒤 · 엔딩 5종 화면 (영역 D) =====
// js/main_part6.js의 MAIN_ENDING·ENDINGS·ALLY_N 등을 쓴다(같은 묶음).
// ---------- 39장 문 ----------
MAIN.ch(39, {
  part: 6, title: '문', rank: 6, after: 0, where: 'jeju',
  goal: '문 안쪽',
  scenes: [
    { id: 'c39_in', lines: [
      { narr: '문 안쪽. 소리가 없다. 한쪽은 검은 바다, 한쪽은 회색 강바닥. 그 사이에 당신이 서 있다.' },
      { who: 'arin', text: '여기가 문 한가운데야. 여기서 정하면 그대로 돼.' },
      { narr: (g, M) => { const e = MAIN_ENDING(g, M); return M.flags.gateChoice === 'bridge' && e !== 'bridge' ? '원을 맞대 본다. 다리가 놓이려다 흔들린다. 북쪽 줄이 없거나, 버텨 줄 사람이 모자라다. 다리는 버티지 못한다. 남은 길은 하나.' : ''; }, when: (g, M) => M.flags.gateChoice === 'bridge' && MAIN_ENDING(g, M) !== 'bridge' },
    ], choices: [
      { text: '문에 손을 댄다', next: 'c39_end' },
    ] },
    { id: 'c39_end', lines: [
      { narr: (g, M) => { M.ending = MAIN_ENDING(g, M); return ({
        seal: '문이 천천히 닫힌다. 아린이 저편 쪽에서 손을 흔든다. 웃는다. 끝까지 웃는다. 마지막 틈으로 초록 바람이 한 번 불어온다.',
        bridge: '원이 문틀에 맞물린다. 문이 닫히지도 열리지도 않는다. 통로가 된다. 회색 강바닥에 처음으로 물이 흐른다. 아린이 울면서 웃는다. 누군가는 이 자리에 남아야 한다. 당신이 남는다.',
        open: '문이 끝까지 열린다. 초록 바람이 섬을 넘어 바다를 넘어 반도 전체로 분다. 모든 사람이 숨을 들이쉰다. 그리고 절반이 내쉬지 못한다.',
        sacrifice: '혼자 문 안쪽으로 한 걸음 더 들어간다. 등 뒤에서 문을 민다. 안쪽에서. 아린이 옆에 와서 같이 민다. 문이 닫힌다. 이쪽 세상에 당신은 없다.',
      })[M.ending]; } },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const e = M.ending || MAIN_ENDING(g, M); M.ending = e;
    g.flags.won = true; g.mapGates = g.mapGates.filter((x) => !x.final);
    if (e === 'open') g.rumor('한반도 전역에서 비각성자가 일제히 각성했다. 사망자 집계는 아직 끝나지 않았다.');
    else if (e === 'bridge') g.rumor(`원초의 게이트가 "다리"가 됐다. 문 앞에 ${g.player.name}이(가) 남았다.`);
    else if (e === 'sacrifice') g.rumor(`${g.player.name}이(가) 원초의 게이트 안쪽에서 문을 닫았다. 돌아오지 않았다.`);
    else g.rumor(`${g.player.name}이(가) 원초의 게이트를 닫았다. 전설이 탄생했다.`);
    g.lifeEvent(`원초의 게이트 — ${ENDINGS[e].title}.`);
    g.player.fame += 500;
    g.queue.push({ type: 'victory' });
  },
});

// ---------- 40장 그 뒤 ----------
MAIN.ch(40, {
  part: 6, title: '그 뒤', rank: 6, after: 0, where: 'any',
  goal: '몇 년 뒤',
  scenes: [
    { id: 'c40_years', lines: [
      { narr: (g, M) => ({ seal: '삼 년 뒤. 게이트 발생 건수가 해마다 줄어든다. 협회는 헌터 신규 등록을 중단했다. 아이들이 "각성"이라는 말을 모르기 시작한다.', bridge: '삼 년 뒤. 한라산 정상에 초록 강이 흐른다. 저편 사람들이 강을 따라 내려와 장사를 시작했다. 문지기에게 인사하는 게 관광 코스가 됐다.', open: '삼 년 뒤. 모두가 각성자다. 경보는 울리지 않는다. 대신 추모 공원이 도시마다 하나씩 생겼다.', sacrifice: '삼 년 뒤. 한라산 아래 추모비. 꽃이 마르지 않는다. 가끔 비 오는 날 추모비 앞 웅덩이가 초록색으로 빛난다.' })[M.ending] || '삼 년 뒤.' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyun, text: (g, M) => (SEO_ON5(M) ? '관리국은 해체됐어요. 저는 영점 세대 상담소를 열었어요. 꿈 얘기 들어 주는 곳이요.' : '감시 보고서 마지막 장을 썼어요. "대상, 임무 완수." 그걸로 끝이에요.') },
      { who: 'friend', when: (g, M) => FRIEND_ALIVE(g, M), text: (g, M) => (F2_AWAKE(g) ? '지우가 협회 직원 됐어. 대피 담당. 경보 울리면 제일 먼저 뛰어. 너 닮았대.' : '놀이터 다시 생겼다. 미끄럼틀 초록색이야. 와서 봐.') },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: '컵라면은 내가 샀다. 약속 지켰다. 너는 언제 오냐.' },
      { who: 'leader', when: (g, M) => M.flags.leaderFate === 'retire' || M.flags.leaderFate === 'hurt', text: (g, M) => g.mainReg({ haera: '분식집 이름 아직 "전단지"다. 손님이 물으면 네 얘기 한다.', haeyo: '가게 이름 아직 "전단지"예요. 손님이 물으면 그쪽 얘기 해요.', short: '가게 이름 아직 전단지다.' }, g.mainWho('leader')) },
      { narr: (g, M) => (M.flags.madoState === 'jailed' ? '마도현은 옥중에서 회고록을 냈다. 제목은 "관측하라". 첫 장에 이름 수백 개. 그날 돌아오지 못한 사람들.' : M.flags.madoState === 'ally' ? '마도현은 사임했다. 제주 해안에서 초록 물고기를 세며 산다는 말이 있다.' : '마도현은 끝까지 국장 자리에 있었다. 퇴임식에서 한 말은 한 줄. "관측을 마칩니다."') },
      { narr: (g, M) => ({ with: '진서해는 문 앞에서 숨을 거뒀다. 마지막 말은 "미안해"가 아니었다. "고마워."', jailed: '진서해는 법정에서 모든 걸 말했다. 판결 전날 감방에서 숨을 거뒀다. 폐가 바다로 가득 찼다고 한다.', sacrifice: '해협이 닫힌 자리에 흰 부표 하나가 떠 있다. 아무도 치우지 않는다.', slain: '해협에서 숨진 진서해의 무덤은 없다. 대신 부산 폐부두 7번 창고에 의자 수백 개가 그대로 놓여 있다.', gone: '진서해의 행방은 아무도 모른다.' })[M.flags.jinFate || 'gone'] },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '도윤은 헌터 학교에 들어갔다. 바다를 아직도 초록색으로 그린다.' : M.flags.goJae === 'alive' ? '고재석 노인은 한라산 중턱 옛집을 다시 지었다. 문패는 조개껍데기.' : '강릉 방벽 틈의 조개껍데기 문패는 아직 거기 있다.') },
    ], choices: [
      { text: '계속 살아간다', set: { epilogue: 'live' } },
      { text: '여기서 이야기를 끝낸다 (은퇴)', set: { epilogue: 'retire' } },
    ] },
    { id: 'c40_end', lines: [
      { sys: (g, M) => `원초의 문 — ${ENDINGS[M.ending || 'seal'].title}. 메인 이야기 끝.` },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.part6 = { land: M.flags.c35 || 'missed', choice: M.flags.gateChoice, ending: M.ending, allies: ALLY_N(M) };
    if (M.flags.epilogue === 'retire') g.gameOver(`원초의 문 「${ENDINGS[M.ending || 'seal'].title}」 뒤, 스스로 이야기를 내려놓았다.`);
  },
});

// 6부를 끝내 미루면(부 시계): 다른 사람이 문을 닫는다
MAIN.partEnd = MAIN.partEnd || {};
MAIN.partEnd[6] = (g, M) => {
  if (M.ending) return;
  const r = g.mainWho('rival'); M.ending = 'other'; M.otherHero = r && r.alive !== false && M.flags.rivalEnd === 'with' ? r.name : M.flags.seoyun ? '한서윤' : '이름 모를 헌터';
  g.flags.won = true; g.mapGates = g.mapGates.filter((x) => !x.final);
  g.rumor(`${M.otherHero}이(가) 원초의 게이트를 닫았다. 전설이 탄생했다.`);
  g.lifeEvent(`원초의 문은 ${M.otherHero}이(가) 닫았다. 나는 그 이야기의 조연으로 남았다.`);
};

// ---------- 엔딩 화면 · 남의 이야기 ----------
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  // 메인을 끝내지 않은 채 수명이 다하거나 은퇴하면: 남의 이야기
  const baseGO = GP.gameOver;
  GP.gameOver = function (reason) {
    const M = this.flags && this.flags.main;
    if (M && !M.ending && (M.ch || 1) > 1 && (M.ch || 1) < 40 && /수명|은퇴|현역|내려놓/.test(String(reason))) {
      M.ending = 'other';
      const r = this.mainWho && this.mainWho('rival'); const s = M.flags && M.flags.seoyun;
      M.otherHero = r && r.alive !== false ? r.name : s ? '한서윤' : '이름 모를 헌터';
      this.lifeEvent(`메인 이야기는 ${M.ch}장에서 멈췄다. 원초의 문은 ${M.otherHero}이(가) 닫았다.`);
    }
    return baseGO.call(this, reason);
  };
}
if (typeof UI !== 'undefined') {
  UI.mainEndingHtml = function () {
    const M = G.flags.main; if (!M || !M.ending) return '';
    const e = ENDINGS[M.ending]; if (!e) return '';
    const who = M.ending === 'other' ? `<p>원초의 문을 닫은 사람: <b>${M.otherHero || '이름 모를 헌터'}</b></p>` : '';
    return `<div class="main-ending"><div class="eyebrow">원초의 문 · 엔딩</div><h2>${e.title}</h2><p>${e.text}</p>${who}</div>`;
  };
  const baseV = UI.showVictory;
  UI.showVictory = function () {
    const M = G.flags.main; if (!M || !M.ending || M.ending === 'other') return baseV.call(this);
    this.modal(`<div class="ending win-end">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()}</div>${this.mainEndingHtml()}</div>${this.lifeSummary()}
      <p class="dim">남은 수명 동안 계속 살아갈 수 있습니다.</p>
      <div class="row end"><button class="primary" data-act="modal-close">계속하기</button></div>`);
  };
  const baseGOS = UI.showGameOver;
  UI.showGameOver = function () {
    const r = baseGOS.call(this);
    const M = G.flags && G.flags.main; if (M && M.ending) { const box = document.querySelector('#modal .ending, .modal .ending'); if (box && !box.querySelector('.main-ending')) box.insertAdjacentHTML('beforeend', this.mainEndingHtml()); }
    return r;
  };
}
