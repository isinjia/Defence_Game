// ===== 프롤로그 끝: 길드 면접 대신 "등록 전후의 하루" (영역 D, 사용자 요청) =====
// 길드는 시험 뒤 판정 등급을 보고 권유가 온다(aff_flow.js). 그래서 프롤로그 끝의 네 길드 면접(이름만 다르고 선택지가 같았다)은
// 서로 전혀 다른 하루 넷 중 하나로 바꾼다. 선택은 특성·친구·희망(hope_*)만 남기고, 실제 소속은 시험 뒤에 정해진다.
Object.assign(PROLOGUE, {
  eve_net: { title: '헌터넷 첫 로그인', text: '관리국 등록을 마친 날 밤. 등록 문자에 딸려 온 링크로 헌터넷에 가입했다. 닉네임 칸에서 한참 망설이다 아무거나 쳤다.\n\n신규 게시판 맨 위 글: [F급 3년 차입니다. 궁금한 거 물어보세요]. 댓글이 사백 개다.',
    choices: [
      { text: '익명으로 질문을 단다. "F급도 먹고살 만한가요?"', t: { lucky: 1, charisma: 1 }, flag: 'hope_free', next: null },
      { text: '공략 게시판 정리글을 새벽까지 전부 읽는다', talent: 1, t: { genius: 1, mana_sense: 1 }, flag: 'hope_kama', next: null },
      { text: '각성하던 날 찍힌 영상을 올린다. 조회수가 미친 듯이 오른다', luck: 1, t: { charisma: 1, reckless: 1 }, flag: 'hope_guild', next: null },
      { text: '노트북을 덮고 운동화 끈을 묶는다. 글로 배울 건 없다', t: { iron_body: 1, loner: 1 }, flag: 'hope_free', next: null },
    ] },
  eve_shop: { title: '장비점 "대장간 김씨"', text: '시험 전에 뭐라도 하나 손에 쥐고 싶었다. 재래시장 골목 끝 장비점. 간판은 대장간인데 안에는 중고 장비가 빼곡하다. 주인 아저씨가 돋보기 너머로 본다. "예산은?"\n\n지갑에 30만 원.',
    choices: [
      { text: '손에 착 붙는 중고 단검을 고른다. "이거요."', t: { quick: 1 }, luck: 1, flag: 'hope_free', next: null },
      { text: '가게에서 제일 무거운 방패를 들어 본다. 내려놓기 싫다', t: { iron_body: 1, harden: 1 }, flag: 'hope_kama', next: null },
      { text: '아무것도 안 사고, 아저씨의 옛날 게이트 이야기를 두 시간 듣는다', talent: 1, t: { mana_sense: 1 }, luck: 1, next: null },
      { text: '"이걸로 할게요." {friend}이(가) 몰래 계산해 둔 장갑을 받는다', t: { charisma: 1 }, friend: 15, next: null },
    ] },
  eve_dinner: { title: '등록 전날 저녁', text: '{friend}네 집 저녁 식탁. {friend}의 어머니가 반찬을 자꾸 이쪽으로 민다. "헌터 된다며? 밥이라도 든든히 먹어야지."\n\nTV에서는 게이트 사고 뉴스가 나오고, 아무도 채널을 돌리지 않는다.',
    choices: [
      { text: '"헌터 되면 어머니 가게부터 지켜 드릴게요."', t: { charisma: 1 }, friend: 10, flag: 'hope_kama', next: null },
      { text: '대답 대신 밥을 두 공기 먹는다. 어머니가 웃는다', t: { iron_body: 1, glutton: 1 }, friend: 10, next: null },
      { text: '설거지를 하며 {friend}에게만 말한다. "사실 좀 무서워."', friend: 25, t: { lucky: 1 }, flag: 'hope_free', next: null },
      { text: '"돈 많이 벌어서 이 신세 꼭 갚을게요."', t: { merchant: 1 }, luck: 1, flag: 'hope_guild', next: null },
    ] },
  eve_line: { title: '봉쇄선 앞', text: '관리국에서 집에 가는 길. 사거리 하나가 노란 테이프로 막혀 있다. 소형 게이트. 구경꾼들이 휴대폰을 들고 웅성거린다.\n\n장비를 갖춘 헌터 넷이 테이프를 넘는다. 그중 하나가 지나가며 당신을 힐끔 본다. 같은 냄새를 맡은 표정이다.',
    choices: [
      { text: '헌터들이 나올 때까지 테이프 앞에서 끝까지 지켜본다', talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama', next: null },
      { text: '힐끔 본 헌터에게 말을 건다. "무섭지 않아요?"', t: { charisma: 1 }, flag: 'hope_guild', next: null },
      { text: '경찰이 한눈판 사이, 테이프 아래로 한 발 들인다', t: { reckless: 1, berserk: 1 }, luck: 1, flag: 'hope_free', next: null },
      { text: '구경꾼들 사이에서 조용히 빠져나온다. 내 차례는 곧 온다', t: { loner: 1, quick: 1 }, next: null },
    ] },
});
const PRO_EVE = ['eve_net', 'eve_shop', 'eve_dinner', 'eve_line'];

if (typeof UI !== 'undefined') {
  // affiliation.js가 verdict_guild → vg_<길드>(면접)로 바꿔 끼운 직후, 하루 장면 하나로 다시 바꾼다. 희망 길드(hopeGuild)는 그대로 둔다(C급 이상 길드 권유 때 우선)
  const baseChoose = UI.proChoose;
  UI.proChoose = function (i) {
    const r = baseChoose.call(this, i);
    const s = this.pro;
    if (s && typeof s.id === 'string' && /^vg2?_/.test(s.id)) { s.id = PRO_EVE[Math.floor(Math.random() * PRO_EVE.length)]; this.renderPrologue(); }
    return r;
  };
}
