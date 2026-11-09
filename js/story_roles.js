// ===== 게이트 크로니클: 역할 칸 사건 · 등급대별 사건 =====
// - 역할 칸: 사건 틀에 "친구·제자·스승·같은 길드·경쟁자·배우자·시험 동기·사수" 칸을 두고 지금 세계의 실제 인물을 넣는다.
//   같은 틀이라도 사람이 달라 반복이 덜 느껴진다.
// - 등급대: 등급마다 사회적 위치가 다르다. F~E는 생계, D~C는 스카우트·질투·사기, B~A는 언론·정치·후배, S~SS는 국가·암살·은퇴.
//   초반 사건에는 최대 등급을 붙여 S급이 "신입이라 무시당하는" 일을 막는다.

const ROLE_NM = (c) => (c && c.npc ? c.npc.name : '그 사람');

// ---------- 역할 칸 ----------
(() => {
  const P = Game.prototype;
  const baseNpc = P.storyNpc;
  P.storyNpc = function (kind) {
    const p = this.player;
    const met = this.adults().filter((n) => n.met && n.alive && !n.isCompanion);
    const pick = (a) => (a.length ? RNG.pick(a) : null);
    switch (kind) {
      case 'spouse': { const n = p.spouse && this.npcById(p.spouse); return n && n.alive ? n : null; }
      case 'master': { const n = p.master && this.npcById(p.master); return n && n.alive ? n : null; }
      case 'disciple': return pick((p.disciples || []).map((id) => this.npcById(id)).filter((n) => n && n.alive));
      case 'guildmate': return p.guild ? pick(met.filter((n) => n.guild === p.guild && n.relation >= 0)) : null;
      case 'rivalRank': return pick(met.filter((n) => (n.rival || n.relation <= -20) && Math.abs(n.rankIdx - p.rankIdx) <= 1));
      case 'examMate': return pick(this.npcs.filter((n) => n.examMate && n.alive && n.met));
      case 'mentor': { const id = p.notebook && p.notebook.mentor; const n = id != null && this.npcById(id); return n && n.alive && n.mentorOf ? n : null; }
      case 'closeFriend': return pick(met.filter((n) => n.relation >= 50 && n.id !== p.spouse && n.id !== p.partner));
      case 'companion': return pick(this.party());
      default: return baseNpc.call(this, kind);
    }
  };
})();

S({ id: 'role_friend_guarantee', npc: 'closeFriend', minRank: 1, text: '{npc}이(가) 한참 머뭇거리다 서류 한 장을 내민다. "장비 대출 보증인이 필요해. 길드에서는 신용이 안 된대. …너밖에 부탁할 데가 없어."',
  choices: [
    { text: '보증을 서 준다', do: (g, c) => g.roll(0.65) ? '1년 뒤, 대출은 무사히 갚아졌다. {npc}은(는) 그 일을 평생 잊지 않겠다고 했다.' + g.gain({ rel: 25 }, c) : '석 달 뒤 독촉장이 당신 앞으로 날아왔다. {npc}은(는) 연락이 끊겼다가, 반년 뒤에야 울면서 나타났다.' + g.gain({ money: -500, rel: 10 }, c) },
    { text: '돈은 빌려줘도 보증은 안 된다고 말한다', do: (g, c) => '"…그래, 네 말이 맞아." 서운한 기색은 감추지 못했다.' + g.gain({ rel: -5 }, c) },
  ] });
S({ id: 'role_disciple_offer', npc: 'disciple', text: '제자 {npc}이(가) 고개를 숙인 채 말한다. "사부님, 대형 길드에서 정식 계약 제안이 왔습니다. 그런데… 가면 사부님 곁을 떠나야 해서요."',
  choices: [
    { text: '"가라. 더 넓은 데서 커라."', do: (g, c) => { if (c.npc) g.addMemory && g.addMemory(c.npc, '큰 길드로 떠나는 등을 밀어 주었다'); return '{npc}이(가) 큰절을 올렸다. 몇 년 뒤 그 길드 정예가 된 {npc}의 인터뷰에 당신 이름이 나왔다.' + g.gain({ fame: 8, rel: 15 }, c); } },
    { text: '"아직 배울 게 남았다."', do: (g, c) => '{npc}은(는) 계약을 거절했다. 수련장에서의 눈빛이 전보다 단단해졌다.' + g.gain({ rel: 6 }, c) },
  ] });
S({ id: 'role_master_ill', npc: 'master', minAge: 25, text: '스승 {npc}이(가) 병원에 있다는 연락이 왔다. 오래된 게이트 후유증이다. 병실 침대 위에서 {npc}이(가) 웃는다. "왔냐. 마침 잘 왔다. 마지막으로 하나 더 가르칠 게 있거든."',
  choices: [
    { text: '병상 곁에서 가르침을 받는다', do: (g, c) => { g.advanceDays(10, { noSave: true }); if (c.npc) g.addMemory && g.addMemory(c.npc, '병상에서 마지막 가르침을 받았다'); return '열흘 동안, 말 대신 손끝으로 에테르의 흐름을 전해 받았다.' + g.gain({ ether: 80, talent: 1, rel: 15 }, c); } },
    { text: '좋은 치유사를 수소문한다', do: (g, c) => g.roll(0.5) ? '전주에서 이름난 치유사를 모셔 왔다. {npc}이(가) 다시 일어섰다. "쓸데없는 짓을…" 목소리가 떨렸다.' + g.gain({ money: -400, rel: 25 }, c) : '치유사도 고개를 저었다. 그래도 {npc}은(는) 고맙다고 했다.' + g.gain({ money: -400, rel: 15 }, c) },
  ] });
S({ id: 'role_guild_credit', npc: 'guildmate', minRank: 1, text: '길드 보고서를 보다 손이 멈춘다. 지난번 공략의 보스 처치 공로가 {npc}의 이름으로 올라가 있다. 막타를 친 건 분명 당신이었다.',
  choices: [
    { text: '{npc}에게 직접 따진다', do: (g, c) => g.roll(0.5) ? '"…미안. 승급 심사가 코앞이라 그만." {npc}이(가) 보고서를 정정했다.' + g.gain({ fame: 2, rel: -3 }, c) : '"증거 있어?" 언성이 높아졌다. 길드 안에 편이 갈렸다.' + g.gain({ rel: -15 }, c) },
    { text: '이번엔 넘어간다', do: (g, c) => '공로는 잃었지만 {npc}은(는) 그 뒤로 당신에게 묘하게 잘해 줬다.' + g.gain({ rel: 8 }, c) },
    { text: '길드장에게 보고한다', do: (g, c) => '길드장이 영상 기록을 확인했다. 공로는 바로잡혔고, {npc}은(는) 당신을 피하기 시작했다.' + g.gain({ merit: 4, fame: 3, rel: -20 }, c) },
  ] });
S({ id: 'role_rival_public', npc: 'rivalRank', text: '{npc}이(가) 방송 인터뷰에서 당신 이름을 꺼냈다. "솔직히 과대평가죠. 같은 게이트 들어가 보면 압니다." 영상 조회수가 빠르게 오른다.',
  choices: [
    { text: '공개 합동 공략을 제안한다', do: (g, c) => { g.storyFight({ title: '라이벌과의 공략 대결', spar: true, mobs: { tier: g.player.rankIdx, n: 3 }, win: { text: fixJosa(`공략 속도도, 처치 수도 당신이 앞섰다. ${ROLE_NM(c)}은(는) 다음 인터뷰에서 말을 아꼈다.`), gain: { fame: 10 } }, lose: { text: fixJosa(`${ROLE_NM(c)}이(가) 한발 빨랐다. 댓글창이 시끄러웠다.`), gain: { fame: -4, ether: 30 } } }); return '카메라 여섯 대가 게이트 앞에 섰다.'; } },
    { text: '무시하고 실적으로 답한다', do: (g, c) => '한 달 뒤, 당신의 공략 기록이 협회 게시판 맨 위에 올랐다. 말이 필요 없었다.' + g.gain({ ether: 20, fame: 2 }) },
  ] });
S({ id: 'role_exam_reunion', npc: 'examMate', minRank: 1, text: '시험 동기 {npc}에게서 연락이 왔다. "우리 기수 동기 모임 한다! 너도 와." 단톡방엔 벌써 누가 어디 길드 갔고, 누가 은퇴했는지 소식이 쏟아진다.',
  choices: [
    { text: '모임에 나간다', do: (g, c) => { const mates = g.npcs.filter((n) => n.examMate && n.alive); for (const n of mates) g.changeRel(n, 5); return `${mates.length}명이 모였다. 누군가는 벌써 한 등급 위였고, 누군가는 헌터를 그만두고 치킨집을 차렸다. 다들 그날 시험장 얘기로 웃었다.` + g.gain({ hp: 0.3 }); } },
    { text: '바쁘다며 축하 메시지만 남긴다', do: (g, c) => '"다음엔 꼭 와!" 단체 사진 속 빈자리가 조금 쓸쓸해 보였다.' + g.gain({ rel: -2 }, c) },
  ] });
S({ id: 'role_mentor_favor', npc: 'mentor', text: '사수 {npc}이(가) 드물게 부탁을 한다. "다음 주 내 공략에 사람이 하나 빠졌어. 네 등급엔 좀 버겁겠지만… 와 줄래? 보는 것만으로도 공부 될 거다."',
  choices: [
    { text: '따라간다', do: (g, c) => { g.storyFight({ title: '사수의 공략', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2 }, ally: { name: c.npc ? c.npc.name : '사수', rank: Math.min(7, g.player.rankIdx + 2), elem: c.npc ? c.npc.element : 'wood' }, win: { text: fixJosa(`${ROLE_NM(c)}이(가) 처음으로 "잘했다"고 했다.`), gain: { ether: 60, money: 300 }, after: (G) => c.npc && G.changeRel(c.npc, 12) }, lose: { text: fixJosa(`${ROLE_NM(c)}이(가) 당신을 들쳐 업고 나왔다. "괜찮아, 다음엔 버틴다."`), gain: { injure: 1, ether: 30 } } }); return '게이트 입구에서 {npc}이(가) 장갑을 고쳐 끼었다.'; } },
    { text: '아직은 무리라고 말한다', do: (g, c) => '"그래, 자기 그릇 아는 것도 실력이지." 서운한 기색은 없었다.' + g.gain({ rel: 2 }, c) },
  ] });
S({ id: 'role_friend_hurt', npc: 'closeFriend', text: '새벽 3시, 모르는 번호로 전화가 온다. 응급실이다. "{npc} 씨 보호자분이세요? 연락처에 당신 번호가 제일 위에 있어서요."',
  choices: [
    { text: '바로 달려간다', do: (g, c) => { if (c.npc) { c.npc.injured = 3; g.addMemory && g.addMemory(c.npc, '응급실에 제일 먼저 달려와 주었다'); } return '수술실 앞에서 밤을 새웠다. 마취에서 깬 {npc}이(가) 당신을 보고 울었다. "왜 네가 여기 있어."' + g.gain({ rel: 20, hp: -0.1 }, c); } },
    { text: '아는 치유사를 대신 보낸다', do: (g, c) => '치유사 덕에 {npc}은(는) 금방 회복했다. 고맙다는 문자 끝에 "보고 싶었는데"가 붙어 있었다.' + g.gain({ money: -150, rel: 8 }, c) },
  ] });
S({ id: 'role_spouse_home', npc: 'spouse', text: '{npc}이(가) 부동산 전단을 펼쳐 놓는다. "게이트 경보 없는 동네로 이사 가자. 아니면… 적어도 집에 방공 결계라도 달자. 매일 밤 네가 못 돌아올까 봐 무서워."',
  choices: [
    { text: '결계 공사를 한다', do: (g, c) => '공사비가 만만치 않았다. 그날 밤 {npc}은(는) 오랜만에 푹 잤다.' + g.gain({ money: -600, rel: 15 }, c) },
    { text: '"내가 지킬게"라고 안아 준다', do: (g, c) => g.roll(0.6) ? '{npc}이(가) 웃었다. "그 말 믿는다."' + g.gain({ rel: 8 }, c) : '"말로만…" {npc}이(가) 등을 돌렸다.' + g.gain({ rel: -6 }, c) },
  ] });
S({ id: 'role_companion_doubt', npc: 'companion', minRank: 1, text: '야영지 모닥불 앞, 파티원 {npc}이(가) 불쑥 묻는다. "나 이 파티에 도움이 되긴 해? 다들 나 때문에 느려지는 것 같아서."',
  choices: [
    { text: '지난 공략에서 {npc}이(가) 한 일을 하나하나 짚어 준다', do: (g, c) => '{npc}이(가) 고개를 숙였다. 다음 날 아침, 누구보다 먼저 장비를 챙기고 있었다.' + g.gain({ rel: 12 }, c) },
    { text: '"그럼 더 강해져."', do: (g, c) => g.roll(0.5) ? '{npc}의 눈에 불이 붙었다.' + g.gain({ rel: 4 }, c) : '{npc}은(는) 그날 밤 말이 없었다.' + g.gain({ rel: -6 }, c) },
  ] });
S({ id: 'role_friend_move', npc: 'closeFriend', text: '{npc}이(가) 이삿짐 박스를 테이프로 감으며 말한다. "다른 도시 길드에서 자리가 났어. 여기선 더 못 크겠더라. …가끔 연락할 거지?"',
  choices: [
    { text: '이삿짐을 같이 나른다', do: (g, c) => { if (c.npc) { c.npc.region = RNG.pick(REGIONS.filter((r) => r.id !== g.player.region && r.id !== 'jeju')).id; g.addMemory && g.addMemory(c.npc, '떠나는 날 이삿짐을 같이 날랐다'); } return '마지막 박스를 트럭에 실었다. 멀어지는 차창 밖으로 {npc}이(가) 오래 손을 흔들었다.' + g.gain({ rel: 10 }, c); } },
    { text: '"가지 마." 말해 본다', do: (g, c) => g.roll(0.3) ? '{npc}이(가) 한참 웃다가 박스를 내려놓았다. "…그럼 여기서 한 번 더 버텨 볼까."' + g.gain({ rel: 15 }, c) : '"그 말 들으니까 더 가야겠다. 나중에 더 멋있게 보자." {npc}은(는) 떠났다.' + (c.npc ? ((c.npc.region = RNG.pick(REGIONS.filter((r) => r.id !== g.player.region && r.id !== 'jeju')).id), '') : '') + g.gain({ rel: 5 }, c) },
  ] });
S({ id: 'role_rival_teamup', npc: 'rivalRank', minRank: 2, text: '라이벌 {npc}이(가) 의뢰소에서 당신을 기다리고 있다. "이번 게이트, 혼자는 무리야. 너도 그렇고. 딱 한 번만 같이 가자. 보상은 반반."',
  choices: [
    { text: '손을 잡는다', do: (g, c) => { g.storyFight({ title: '라이벌과의 합동 공략', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2, boss: true }, ally: { name: c.npc ? c.npc.name : '라이벌', rank: c.npc ? c.npc.rankIdx : g.player.rankIdx, elem: c.npc ? c.npc.element : 'fire' }, win: { text: fixJosa(`등을 맞대고 싸워 보니 손발이 이상하게 잘 맞았다. "…다음엔 다시 적이다." ${ROLE_NM(c)}이(가) 웃었다.`), gain: { money: 500, ether: 50 }, after: (G) => c.npc && G.changeRel(c.npc, 25) }, lose: { text: '둘 다 너덜너덜해져서 나왔다. 서로 탓하다가 결국 같이 웃었다.', gain: { injure: 1 }, after: (G) => c.npc && G.changeRel(c.npc, 10) } }); return '게이트 앞에서 {npc}이(가) 주먹을 내밀었다.'; } },
    { text: '"너랑은 안 해."', do: (g, c) => '"그래, 그럴 줄 알았어." {npc}은(는) 다른 사람을 찾아 떠났다.' + g.gain({ rel: -4 }, c) },
  ] });

// ---------- 등급대별 사건 ----------
// F~E: 생계와 무시
S({ id: 'band_fe_porter', maxRank: 1, text: '의뢰소 구석 게시판. "C급 파티 포터 구함 · 일당 12만 · 짐 30kg · 사망 시 책임 없음." 밑에 누가 볼펜으로 적어 놨다. "지난주 포터 아직 안 나옴."',
  choices: [
    { text: '포터로 따라간다', do: (g) => g.roll(0.7) ? '짐을 지고 C급 게이트 깊숙이 들어갔다. 선배들의 움직임을 코앞에서 봤다.' + g.gain({ money: 120, ether: 35 }) : '괴수가 짐꾼부터 노렸다. 겨우 살아 나왔다.' + g.gain({ money: 120, injure: 2 }) },
    { text: '목숨값이 너무 싸다', do: () => '게시판 앞을 떠났다. 그 공고는 다음 날 사라져 있었다.' },
  ] });
S({ id: 'band_fe_rent', maxRank: 1, minAge: 19, text: '집주인 할머니가 문을 두드린다. "헌터 양반, 월세가 두 달 밀렸어. 내가 이러고 싶진 않은데, 요즘 관리비가…"',
  choices: [
    { text: '있는 돈을 털어 낸다', do: (g) => '통장이 텅 비었다. 할머니가 김치 한 통을 놓고 갔다.' + g.gain({ money: -150, hp: 0.2 }) },
    { text: '옥상 방수 공사를 대신 해 드리겠다고 한다', do: (g) => { g.advanceDays(5, { noSave: true }); return '에테르로 무거운 자재를 옮기고 하루 만에 끝냈다. 할머니가 한 달 치를 깎아 줬다.' + g.gain({ rep: 3, money: 30 }); } },
  ] });
S({ id: 'band_fe_scam_party', maxRank: 1, text: '"F급도 OK! 선입금 5만 원만 내면 E급 게이트 공략 파티에 넣어 드립니다." 단톡방 공지에 사람들이 줄줄이 입금 인증을 올린다.',
  choices: [
    { text: '입금한다', do: (g) => g.roll(0.25) ? '놀랍게도 진짜 파티였다.' + g.gain({ money: -50, ether: 30 }) : '방장이 단톡방을 터뜨리고 사라졌다.' + g.gain({ money: -50 }) },
    { text: '협회 사기 신고 센터에 제보한다', do: (g) => '일주일 뒤 사기단이 잡혔다는 뉴스가 떴다. 제보자 명단 맨 위에 당신 이름이 있었다.' + g.gain({ merit: 4, rep: 2 }) },
  ] });
S({ id: 'band_fe_night_job', maxRank: 1, text: '편의점 야간 알바 공고가 눈에 들어온다. "각성자 우대 · 강도 대응 수당 별도." 헌터 일만으로는 이번 달을 버티기 어렵다.',
  choices: [
    { text: '한 달만 한다', do: (g) => { g.advanceDays(20, { noSave: true }); return '밤마다 컵라면을 정리하고, 취객 둘을 조용히 내보냈다. 점장이 보너스를 줬다.' + g.gain({ money: 260 }); } },
    { text: '수련 시간을 지킨다', do: (g) => '배는 고팠지만 에테르는 쌓였다.' + g.gain({ ether: 20 }) },
  ] });
// D~C: 스카우트, 첫 제자, 질투, 사기 계약
S({ id: 'band_dc_first_fan', minRank: 2, maxRank: 3, text: '중학생 하나가 의뢰소 앞에서 당신을 기다리고 있다. 각성 판정서를 꼭 쥐고 있다. "F급인데요… 저 같은 것도 헌터 할 수 있어요? 가르쳐 주세요!"',
  choices: [
    { text: '주말마다 기초를 봐 주겠다고 한다', do: (g) => '아이는 매주 토요일 아침 여섯 시에 나타났다. 한 번도 늦지 않았다.' + g.gain({ fame: 3, ether: 10, rep: 4 }) },
    { text: '"학교부터 졸업해."', do: (g) => '아이는 시무룩했지만, 3년 뒤 졸업장을 들고 다시 찾아왔다.' + g.gain({ fame: 1 }) },
  ] });
S({ id: 'band_dc_contract', minRank: 2, maxRank: 3, text: '중소 기획사에서 "헌터 매니지먼트 계약"을 들고 왔다. 광고·방송·스폰서를 다 잡아 주겠단다. 계약서 14페이지, 아주 작은 글씨로 "수익의 70%"가 적혀 있다.',
  choices: [
    { text: '끝까지 읽고 조항을 고친다', do: (g) => g.roll(0.5) ? '기획사가 의외로 수정에 응했다. 첫 광고가 들어왔다.' + g.gain({ money: 700, fame: 6 }) : '"그럼 없던 일로 하시죠." 문이 닫혔다.' + g.gain({ ether: 5 }) },
    { text: '그대로 서명한다', do: (g) => '돈은 들어왔지만 대부분 기획사 몫이었다. 위약금 때문에 2년을 묶였다.' + g.gain({ money: 250, fame: 10 }) },
    { text: '거절한다', do: () => '"후회하실 텐데요." 명함은 휴지통으로 갔다.' },
  ] });
S({ id: 'band_dc_jealous', minRank: 2, maxRank: 3, npc: 'examMate', text: '같이 시작한 {npc}이(가) 술자리에서 말이 꼬인다. "넌 좋겠다. 벌써 거기까지 갔잖아. 난 아직도 여기서… 아니다, 내가 취했나 봐."',
  choices: [
    { text: '집까지 데려다준다', do: (g, c) => '{npc}이(가) 현관 앞에서 중얼거렸다. "…축하해. 진짜로."' + g.gain({ rel: 10 }, c) },
    { text: '같이 다음 게이트에 가자고 한다', do: (g, c) => '{npc}이(가) 놀란 얼굴로 당신을 봤다. "진짜? 나 데려가도 돼?"' + g.gain({ rel: 14, fame: 1 }, c) },
  ] });
S({ id: 'band_dc_sponsor', minRank: 3, maxRank: 3, text: '장비 회사에서 협찬 제안이 왔다. 신형 장비를 공짜로 주는 대신, 게이트 영상에 로고가 나와야 한다. 문제는 그 장비가 아직 검증이 덜 됐다는 소문이다.',
  choices: [
    { text: '받는다', do: (g) => g.roll(0.65) ? '장비는 소문보다 훨씬 좋았다.' + g.gain({ equip: true, fame: 3 }) : '세 번째 공략에서 장비가 터졌다. 리콜 뉴스에 당신 얼굴이 나왔다.' + g.gain({ injure: 1, money: 300, fame: -3 }) },
    { text: '검증 자료부터 보내 달라고 한다', do: (g) => '회사는 답이 없었다. 반년 뒤 그 장비는 정말 리콜됐다.' + g.gain({ fame: 2 }) },
  ] });
// B~A: 언론, 정치, 길드 줄다리기, 후배의 도전
S({ id: 'band_ba_politics', minRank: 4, maxRank: 5, text: '국회의원 보좌관이 찾아왔다. "의원님께서 각성자 처우 개선 법안을 준비 중이십니다. 공청회에 증인으로 서 주시면… 차기 관리국 자문위원 자리도 이야기가 될 겁니다."',
  choices: [
    { text: '증인으로 선다', do: (g) => g.roll(0.6) ? '당신 증언이 뉴스 첫머리에 나왔다. 법안은 통과됐다.' + g.gain({ fame: 15, merit: 15 }) : '증언 중 의원 측 비리가 터졌다. 당신도 사진에 찍혀 있었다.' + g.gain({ fame: -10, merit: 5 }) },
    { text: '정치는 사양한다', do: () => '"아쉽군요." 보좌관이 명함을 두고 갔다.' },
  ] });
S({ id: 'band_ba_tug', minRank: 4, maxRank: 5, text: '두 길드가 동시에 당신에게 대형 레이드 지휘를 맡기고 싶어 한다. 날짜가 같다. 어느 쪽을 고르든 다른 쪽과는 척을 지게 된다.',
  choices: [
    { text: '더 위험한 쪽 게이트를 맡는다', do: (g) => '위험한 쪽을 고른 이유를 묻자 "거기 사람이 더 많이 살아서요"라고 답했다. 그 말이 기사 제목이 됐다.' + g.gain({ fame: 12, rep: 6, merit: 6 }) },
    { text: '보수가 높은 쪽을 맡는다', do: (g) => '레이드는 성공했다. 다른 길드는 한동안 당신 이름을 꺼내지 않았다.' + g.gain({ money: 1800, fame: 3 }) },
    { text: '두 길드를 합동 작전으로 묶자고 제안한다', do: (g) => g.roll(0.4) ? '아무도 안 될 거라던 합동 작전이 성사됐다. 두 길드장이 처음으로 악수했다.' + g.gain({ fame: 20, merit: 10 }) : '양쪽 모두 화를 냈다. "누구 편이야?"' + g.gain({ fame: -6 }) },
  ] });
S({ id: 'band_ba_junior', minRank: 4, maxRank: 5, text: '이제 막 C급에 오른 신인이 공개 대련을 신청해 왔다. "선배님을 보고 헌터가 됐습니다. 제가 어디까지 왔는지 확인하고 싶습니다." 카메라가 몰려 있다.',
  choices: [
    { text: '전력으로 상대해 준다', do: (g) => { g.storyFight({ title: '후배의 도전', spar: true, mobs: { tier: Math.max(0, g.player.rankIdx - 1), n: 1, boss: true, human: true, name: '[신인] 도전자' }, win: { text: '쓰러진 후배에게 손을 내밀었다. "좋았어. 3년 뒤엔 나도 모르겠다."', gain: { fame: 8 } }, lose: { text: '방심했다. 신인의 검이 목 앞에서 멈췄다. 다음 날 모든 채널이 그 장면을 틀었다.', gain: { fame: -8, ether: 60 } } }); return '대련장 조명이 켜졌다.'; } },
    { text: '비공개로 지도해 주겠다고 한다', do: (g) => '카메라 없는 수련장에서 반나절을 함께했다. 후배는 몇 번이고 고개를 숙였다.' + g.gain({ rep: 6, merit: 4 }) },
  ] });
S({ id: 'band_ba_interview', minRank: 4, maxRank: 6, text: '시사 프로그램에서 단독 인터뷰를 청해 왔다. 질문지 마지막 줄: "헌터의 수입이 지나치게 많다는 비판에 대해 어떻게 생각하십니까?"',
  choices: [
    { text: '솔직하게 답한다', do: (g) => g.roll(0.55) ? '"우리 동료 셋이 지난달 죽었습니다. 그 값이 많습니까?" 방송 뒤 여론이 돌아섰다.' + g.gain({ fame: 12 }) : '말이 날카롭게 편집됐다. 하루 종일 실시간 검색어에 올랐다.' + g.gain({ fame: -8 }) },
    { text: '기부 계획을 발표한다', do: (g) => '각성 피해 아동 장학금. 발표 다음 날 후원 문의가 줄을 이었다.' + g.gain({ money: -800, fame: 15, rep: 8 }) },
  ] });
// S~SS: 국가, 해외 견제, 암살, 은퇴 압박, 후계자
S({ id: 'band_s_assassin', minRank: 6, text: '호텔 방 창문에 레이저 점 하나가 맺힌다. 저격이다. 몸이 먼저 움직였다. 유리창이 터지고, 맞은편 빌딩 옥상에서 그림자 셋이 흩어진다.',
  choices: [
    { text: '쫓아간다', do: (g) => { g.storyFight({ title: '해외 암살조', mobs: { tier: Math.min(7, g.player.rankIdx), n: 3, human: true, elem: 'dark' }, lethal: false, win: { text: '셋 중 하나를 생포했다. 품에서 외국 정보기관 표식이 나왔다. 관리국이 발칵 뒤집혔다.', gain: { merit: 40, fame: 15 } }, lose: { text: '놓쳤다. 옆구리에서 피가 흘렀다.', gain: { injure: 2 } } }); return '옥상을 건너뛰었다.'; } },
    { text: '관리국 경호를 요청한다', do: (g) => '관리국이 24시간 경호를 붙였다. 편하진 않았지만 안전했다.' + g.gain({ merit: 5 }) },
  ] });
S({ id: 'band_s_retire_push', minRank: 6, minAge: 45, text: '관리국 고위 관계자가 조용히 식사를 청한다. "이제 후배들에게 길을 터 줄 때도 됐지요. 명예직 자리를 하나 마련해 뒀습니다. 국가에 대한 마지막 봉사라고 생각하시고."',
  choices: [
    { text: '"아직 끝나지 않았습니다."', do: (g) => '관계자가 쓴웃음을 지었다. 그 뒤로 관리국 소집 명단에서 당신 이름이 자주 빠졌다.' + g.gain({ merit: -15, ether: 40 }) },
    { text: '명예직은 받되 현역은 계속한다', do: (g) => '자문위원 명패가 책상에 놓였다. 회의는 지루했지만 정보가 들어왔다.' + g.gain({ merit: 25, fame: 5 }) },
  ] });
S({ id: 'band_s_heir', minRank: 6, minAge: 35, text: '기자가 묻는다. "당신이 은퇴하면, 당신의 기술은 누가 잇습니까?" 생각해 본 적 없는 질문이었다. 그날 밤, 관리국에서 "후계자 육성 프로그램" 공문이 왔다.',
  choices: [
    { text: '제자를 더 받기로 한다', do: (g) => { const n = g.makeNpc(true, 'human'); n.rankIdx = 1; n.region = g.player.region; n.met = true; n.relation = 60; n.ageMonths = 19 * 12; n.links = {}; n.disciples = []; n.parents = []; g.npcs.push(n); if ((g.player.disciples || []).length < 3) { g.player.disciples.push(n.id); n.master = -1; } return `관리국이 추천한 유망주 ${n.name}이(가) 찾아왔다. 눈빛이 예전의 당신과 닮았다.` + g.gain({ fame: 5 }); } },
    { text: '기록으로 남긴다', do: (g) => '반년에 걸쳐 전투 기록과 에테르 순환법을 책으로 엮었다. 협회 도서관에 영구 보존됐다.' + g.gain({ fame: 10, merit: 15 }) },
  ] });
S({ id: 'band_s_foreign', minRank: 6, text: '해외 게이트 연합에서 "국제 공동 대응팀" 합류를 요청해 왔다. 한국 관리국은 내심 반대한다. 핵심 전력이 해외로 빠지는 걸 원치 않는다.',
  choices: [
    { text: '자문만 하겠다고 절충한다', do: (g) => '화상 회의 몇 번으로 두 나라 모두 체면을 지켰다.' + g.gain({ fame: 10, merit: 10 }) },
    { text: '관리국 뜻을 따른다', do: (g) => '"역시 국가대표군." 국장이 어깨를 두드렸다.' + g.gain({ merit: 20 }) },
  ] });
S({ id: 'band_ss_legend', minRank: 7, once: true, text: '지하철에서 초등학생 둘이 다툰다. "SS급 {name}이 제일 세다니까!" "아니거든, 우리 아빠가 그러는데…" 당신이 바로 앞에 서 있다는 걸 둘 다 모른다.',
  choices: [
    { text: '모자를 더 깊이 눌러쓴다', do: (g) => '내릴 역까지 두 아이의 논쟁을 들었다. 당신 편이 이겼다.' + g.gain({ hp: 1 }) },
    { text: '살짝 사인을 해 준다', do: (g) => '두 아이의 비명에 객차 전체가 돌아봤다. 그날 SNS는 그 영상으로 도배됐다.' + g.gain({ fame: 5, rep: 5 }) },
  ] });

// 초반 사건에 최대 등급
for (const [id, mx] of [['rank_f_mocked', 1], ['rank_e_first_party', 2], ['street_drone_ads', 3], ['street_pickpocket', 4]]) { const ev = STORY.find((e) => e.id === id); if (ev && ev.maxRank == null) ev.maxRank = mx; }
