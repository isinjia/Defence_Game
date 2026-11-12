// ===== 메인 시나리오 종장: 39장 문 · 40장 그 뒤 · 엔딩 5종 화면 (영역 D) =====
// js/main_part6.js의 MAIN_ENDING·ENDINGS·ALLY_N 등을 쓴다(같은 묶음).
// ---------- 39장 문 ----------
MAIN.ch(39, {
  part: 6, title: '문', rank: 6, after: 0, where: 'jeju',
  goal: '문 안쪽',
  scenes: [
    { id: 'c39_voices', lines: [
      { narr: '문턱을 넘는 순간 목소리들이 들린다. 지금까지 만난 사람들의 목소리. 문이 기억을 비춰 보고 있다.' },
      { narr: (g, M) => (M.flags.c1_kid ? '"전단지 아저씨(언니), 그거 안 버렸어요?" 첫 해의 아이 목소리.' : '"등록 번호 불러 드릴게요." 협회 창구 직원 목소리.') },
      { narr: (g, M) => (M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '"밥은 먹고 다녀." 연희 목소리.' : '"…" 불탄 급식소 앞의 침묵.') },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '"{hyung}, 바다 이제 안 봐도 돼?" 도윤 목소리.' : M.flags.doyun === 'lab' ? '"{hyung}…" 강바닥 끝에서 들리던 도윤 목소리.' : '"{hyung}!" 경계선 마을 아이 목소리.') },
      { narr: (g, M) => (M.flags.yoonGone ? '관측소 무전기 잡음. 그 사이로 아무 목소리도 들리지 않는다.' : '"관측하라." 윤해람 목소리. 처음으로 웃고 있다.') },
      { narr: '그리고 마지막. 당신 자신의 목소리. 각성하던 날의 숨소리.' },
    ] },
    { id: 'c39_in', lines: [
      { narr: '문 안쪽. 소리가 없다. 한쪽은 검은 바다, 한쪽은 회색 강바닥. 그 사이에 당신이 서 있다.' },
      { who: 'arin', text: '여기가 문 한가운데야. 여기서 정하면 그대로 돼.' },
      { narr: (g, M) => { const e = MAIN_ENDING(g, M); if (M.flags.gateChoice !== 'bridge' || e === 'bridge') return ''; const why = [M.flags.circuitCut ? '북쪽 줄은 관측소에서 끊었다' : '', !(M.flags.jinFate === 'with' || M.flags.jinFate === 'jailed') ? '다리를 함께 버텨 줄 진서해가 없다' : '', !FRIEND_ALIVE(g, M) ? '돌아갈 놀이터에서 기다리는 친구가 없다' : ''].filter(Boolean); return `${why.join('. ')}. ${ALLY_N(M) ? '등 뒤의 동료들이 문틀을 붙잡는다. 그래도 모자라다.' : '혼자 붙잡은 문틀이 손안에서 미끄러진다.'}`; }, when: (g, M) => M.flags.gateChoice === 'bridge' && MAIN_ENDING(g, M) !== 'bridge' },
      { narr: (g, M) => { const e = MAIN_ENDING(g, M); return M.flags.gateChoice === 'bridge' && e !== 'bridge' ? '원을 맞대 본다. 다리가 놓이려다 흔들린다. 북쪽 줄이 없거나, 버텨 줄 사람이 모자라다. 다리는 버티지 못한다. 남은 길은 하나.' : ''; }, when: (g, M) => M.flags.gateChoice === 'bridge' && MAIN_ENDING(g, M) !== 'bridge' },
      { sys: (g, M) => `문 한가운데. 손을 대면 「${ENDINGS[MAIN_ENDING(g, M)].title}」(으)로 정해진다. 되돌릴 수 없다.` },
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
    ] },
    { id: 'c39_arin', lines: [
      { who: 'arin', text: (g, M) => ({ seal: '고마워. 진짜로. 우리 강이 마르기 전에 누가 우리를 봐 줬다는 거. 그거면 됐어. …잘 가.', bridge: '여기 남는다고? 바보. …고마워. 이제 나 혼자 문 안 붙잡아도 되네. 같이 지키자.', open: '숨이 가. 우리 마지막 숨이 너희한테. 잘 써 줘. 나는… 이제 좀 잘게. 이십 년 만에.', sacrifice: '왜 혼자 왔어. 왜 여기까지 들어왔어. …바보. 그래도, 이제 나 혼자 아니네.' })[M.ending] },
      { narr: (g, M) => (M.ending === 'seal' ? '아린의 손이 문틈 사이로 마지막으로 닿는다. 차갑지도 따뜻하지도 않다. 그냥 손이다. 처음 저편에서 잡았던 그 손.' : M.ending === 'bridge' ? '맞물린 원이 문틀에서 천천히 돈다. 한 바퀴. 두 바퀴. 아린이 당신 옆에 나란히 선다. 문지기 둘.' : M.ending === 'open' ? '아린의 모습이 바람에 흩어진다. 초록빛 가루가 되어 반도 쪽으로 날아간다.' : '문 안쪽은 어둡지 않다. 회색 강바닥에 아주 가는 물줄기가 흐르기 시작한다. 당신이 넘어온 자리에서부터.') },
    ] },
    { id: 'c39_promise', lines: [
      { narr: (g, M) => (({ close: ['seal', 'sacrifice'], bridge: ['bridge'], open: ['open'] })[M.flags.arinAsk] || []).includes(M.ending) ? '아린과 한 약속을 지켰다. 저편에서 처음 손을 잡던 날 한 약속.' : M.flags.promiseKept ? '아린이 부탁한 길을 골랐다. 하지만 문은 그 길로 가 주지 않았다. 아린은 "고르려고 한 걸로 됐어"라고 했다.' : '아린과 한 약속과 다른 문이 됐다. 아린은 끝까지 그걸 탓하지 않았다. 그래서 더 오래 남는다.', when: (g, M) => !!M.flags.arinPromise && !!M.flags.arinAsk },
      { narr: (g, M) => (({ close: 'seal', bridge: 'bridge', open: 'open' })[M.flags.endSeed] === M.ending || (M.flags.endSeed === 'close' && M.ending === 'sacrifice') ? `친구 옥상에서 "${({ close: '닫겠다', open: '열 수도 있다', bridge: '잇는 길을 찾겠다' })[M.flags.endSeed]}"고 했다. 그 말대로 됐다.` : `친구 옥상에서 "${({ close: '닫겠다', open: '열 수도 있다', bridge: '잇는 길을 찾겠다' })[M.flags.endSeed]}"고 했다. 그 말대로 되지 않았다. 내려가면 친구에게 뭐라고 할지 아직 모르겠다.`), when: (g, M) => !!M.flags.endSeed && M.flags.endSeed !== 'none' },
    ] },
    { id: 'c39_out', lines: [
      { narr: (g, M) => (M.ending === 'sacrifice' ? '문 바깥. 능선. 아무도 없다. 바람이 분다. 누군가 남겨 둔 컵라면 하나가 식어 간다.' : M.ending === 'bridge' ? '문 바깥에서 동료들이 당신을 부른다. 당신은 문턱에 앉아 손을 흔든다. 내려가지 않는다. 대신 그들이 올라올 것이다. 자주.' : '문 바깥. 능선. 해가 뜬다. 동해 쪽에서. 이십 년 만에 제주에서 보는 해다.') },
      { narr: '문지기의 갑옷이 문틀 빛에 녹아든다. 처음부터 이 자리에 맞춰 만든 것처럼. 첫 문의 잔해가 마지막 조각을 찾았다.', when: (g, M) => M.ending === 'bridge' && g.player.cls === 'gatekeeper' },
      { narr: '사도의 표식이 문 안쪽 빛에 반응해 타오른다. 균열교가 꿈꾼 손이 여기까지 왔다. 무엇을 열고 무엇을 닫았는지는 이 손만 안다.', when: (g) => g.player.cls === 'apostle' },
      { narr: '문 안쪽에서 닫는 손이 하나 더 있다. 문지기의 손이 문틀을 기억한다. 문이 평소보다 조용히 닫힌다.', when: (g, M) => (M.ending === 'seal' || M.ending === 'sacrifice') && g.player.cls === 'gatekeeper' },
      { who: 'friend', when: (g, M) => FRIEND_ALIVE(g, M) && M.ending !== 'sacrifice', text: (g, M) => (HAS_ALLY(M, 'friend') ? '…왔다. 왔어. 손 줘. 미끄럼틀처럼.' : '(전화) 뉴스 봤어. 봤어. …내려와. 놀이터에서 기다려.') },
      { who: 'friend', when: (g, M) => FRIEND_ALIVE(g, M) && M.ending === 'sacrifice', text: '(아무도 받지 않는 전화에 남긴 음성.) …놀이터에서 기다릴게. 계속.' },
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
      { narr: (g, M) => ({ seal: '협회 건물 일 층이 헌터 박물관이 됐다. 입구에 첫 각성자 세대의 이름이 새겨진 벽. 그중 하나가 당신 이름이다.', bridge: '제주 봉쇄선이 풀렸다. 정기선이 하루 두 번 뜬다. 배 이름은 "반쪽 원".', open: '도시는 조용하다. 다들 할 수 있는 게 많아졌는데, 하고 싶은 게 줄었다고들 한다.', sacrifice: '협회는 당신 등록 번호를 영구 결번으로 했다.' })[M.ending] || '' },
    ] },
    { id: 'c40_people', lines: [
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyun, text: (g, M) => (SEO_ON5(M) ? '관리국은 해체됐어요. 저는 영점 세대 상담소를 열었어요. 꿈 얘기 들어 주는 곳이요.' : '감시 보고서 마지막 장을 썼어요. "대상, 임무 완수." 그걸로 끝이에요.') },
      { who: 'friend', when: (g, M) => FRIEND_ALIVE(g, M), text: (g, M) => (F2_AWAKE(g) ? '지우가 협회 직원 됐어. 대피 담당. 경보 울리면 제일 먼저 뛰어. 너 닮았대.' : '놀이터 다시 생겼다. 미끄럼틀 초록색이야. 와서 봐.') },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: '컵라면은 내가 샀다. 약속 지켰다. 너는 언제 오냐.' },
      { who: 'leader', when: (g, M) => M.flags.leaderFate === 'retire' || M.flags.leaderFate === 'hurt', text: (g, M) => g.mainReg({ haera: '분식집 이름 아직 "전단지"다. 손님이 물으면 네 얘기 한다.', haeyo: '가게 이름 아직 "전단지"예요. 손님이 물으면 그쪽 얘기 해요.', short: '가게 이름 아직 전단지다.' }, g.mainWho('leader')) },
      { narr: '첫 팀 거점 벽의 사진은 아직 그대로다. 붕대 롤이 해마다 하나씩 늘어난다.', when: (g, M) => M.flags.leaderFate === 'dead' },
    ] },
    { id: 'c40_world', lines: [
      { narr: (g, M) => (M.flags.madoState === 'jailed' ? '마도현은 옥중에서 회고록을 냈다. 제목은 "관측하라". 첫 장에 이름 수백 개. 그날 돌아오지 못한 사람들.' : M.flags.madoState === 'ally' ? '마도현은 사임했다. 제주 해안에서 초록 물고기를 세며 산다는 말이 있다.' : '마도현은 끝까지 국장 자리에 있었다. 퇴임식에서 한 말은 한 줄. "관측을 마칩니다."') },
      { narr: (g, M) => ({ with: '진서해는 문 앞에서 숨을 거뒀다. 마지막 말은 "미안해"가 아니었다. "고마워."', jailed: '진서해는 법정에서 모든 걸 말했다. 판결 전날 감방에서 숨을 거뒀다. 폐가 바다로 가득 찼다고 한다.', sacrifice: '해협이 닫힌 자리에 흰 부표 하나가 떠 있다. 아무도 치우지 않는다.', slain: '해협에서 숨진 진서해의 무덤은 없다. 대신 부산 폐부두 7번 창고에 의자 수백 개가 그대로 놓여 있다.', gone: '진서해의 행방은 아무도 모른다.' })[M.flags.jinFate || 'gone'] },
      { narr: (g, M) => (M.flags.yoonGone ? '북방 관측소는 무너졌다. 누군가 그 자리에 돌 하나를 세웠다. "관측 종료."' : '북방 관측소 무전은 아직 켜져 있다. 매일 같은 시각, 짧은 신호 하나. "이상 없음."') },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '도윤은 헌터 학교에 들어갔다. 바다를 아직도 초록색으로 그린다.' : M.flags.goJae === 'alive' ? '고재석 노인은 한라산 중턱 옛집을 다시 지었다. 문패는 조개껍데기.' : '강릉 방벽 틈의 조개껍데기 문패는 아직 거기 있다.') },
      { narr: (g, M) => (M.flags.kwon === 'alive' ? '권만석은 지팡이를 짚고 하은의 졸업식에 갔다. 하은은 협회 대피 요원이 됐다.' : M.flags.kwon === 'dead' ? '하은은 아버지 영정을 집에 걸었다. 그 옆에 강북 폐역 사진. 반쪽 문이 닫힌 날.' : '') , when: (g, M) => !!M.flags.kwon },
    ] },
    { id: 'c40_cut', lines: [
      { narr: (g, M) => ({ seal: '서울 강남 돔. 성벽이 철거되는 날. 마지막 패널이 내려가자 성벽 밖 동네 아이들이 처음으로 돔 안 공원으로 뛰어 들어온다.', bridge: '한라산 정상 문 앞. 저편에서 온 아이가 문지기 옆에 앉아 처음 보는 귤을 까먹는다. 껍질을 문틀에 올려 둔다. 선물이라고.', open: '부산 폐부두 7번 창고. 의자 수백 개는 그대로다. 매달 보름, 사람들이 와서 앉는다. 누구를 기다리는지 아무도 말하지 않는다.', sacrifice: '강릉 방벽 틈. 조개껍데기 문패 옆에 새 문패 하나. 당신 이름. 누가 걸었는지 모른다. 비 오는 날이면 둘 다 초록빛으로 빛난다.' })[M.ending] || '' },
      { narr: (g, M) => (({ close: 'seal', bridge: 'bridge', open: 'open' })[M.flags.endSeed] !== M.ending && M.flags.endSeed && M.flags.endSeed !== 'none' ? '가끔 옥상 생각을 한다. 그날 밤 한 말과 다른 결말. 친구는 한 번도 그걸 묻지 않았다.' : '가끔 옥상 생각을 한다. 그날 밤 한 말. 지켰다.'), when: (g, M) => !!M.flags.endSeed && M.flags.endSeed !== 'none' },
    ] },
    { id: 'c40_walk', lines: [
      { narr: (g, M) => (M.ending === 'sacrifice' ? '어느 봄날. 강북 폐역 앞에 누가 전단지를 붙인다. 균열교 전단지가 아니다. 추모식 안내다. 맨 아래 당신 이름.' : '어느 봄날. 강북 폐구를 걷는다. 폐역 자리는 공원이 됐다. 벤치에 앉아 있으면 아이가 전단지를 내민다. 이번엔 동네 축제 전단지다. 받는다. 버리지 않는다.') },
      { narr: (g, M) => (M.ending === 'bridge' ? '…라고 동료들이 편지에 적어 보냈다. 당신은 문 앞에서 그 편지를 읽는다. 저편 아이들이 어깨 너머로 같이 읽는다.' : '주머니 속 반쪽 원, 아니면 그 원이 있던 자리. 손이 기억한다.') },
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
    return `<div class="main-ending"><div class="eyebrow">${e.eyebrow || '원초의 문 · 엔딩'}</div><h2>${e.title}</h2>${e.sub ? `<p class="dim">${e.sub}</p>` : ''}<p>${e.text}</p>${(e.more || []).map((t) => `<p>${t}</p>`).join('')}${who}</div>`;
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
