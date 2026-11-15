// ===== 게이트 크로니클: 선택의 후일담 (docs/종합_평가_v1.91.md 2순위 D·E) =====
// 자주 나오는 무작위 사건에서 고른 선택이 흔적(flags.echo)을 남기고, 몇 달~몇 년 뒤 짧은 후속 사건으로 돌아온다.
// 사건 속 이름 없던 사람은 후속 사건 때 실제 인물(NPC)이 되어 관계·기억이 생기고, 이후 세계에 남는다.
//
// ECHO 정의: [원래 사건 id, 선택 번호, 흔적 키, [최소, 최대] 개월]
// 후속 사건: id 'echo_' + 키, npc 'echo:' + 키 이면 그 흔적의 인물을 쓴다(때가 되면 만든다).

const ECHO_SRC = [
  ['base_injured_hunter', 0, 'healed', [6, 18]],
  ['base_injured_hunter', 1, 'bag', [4, 12]],
  ['base_kid_lost', 0, 'lostkid', [6, 20]],
  ['street_busker', 0, 'busker', [8, 20]],
  ['street_busker', 2, 'busker_lab', [12, 30]],
  ['society_awakening_kid', 0, 'firekid', [18, 40]],
  ['society_awakening_kid', 1, 'firekid_lab', [12, 30]],
  ['rel_betrayal', 2, 'betray', [6, 18]],
  ['field_crashed_truck', 1, 'truck', [6, 16]],
  ['street_pickpocket', 1, 'pickboy', [12, 36]],
  ['road_stray', 0, 'stray', [12, 36]],
  ['road_stray', 1, 'stray_mother', [2, 8]],
  ['field_refugees', 0, 'refugee', [24, 48]],
  ['street_old_hunter', 0, 'oldhunter', [24, 60]],
];

// 때가 되었을 때 만드는 인물. 없으면 원래 사건의 인물(c.npc)을 쓴다.
const ECHO_NPC = {
  healed: (g) => ({ rankIdx: Math.max(0, Math.min(6, g.player.rankIdx + RNG.int(-1, 0))) }),
  bag: (g) => ({ rankIdx: Math.max(0, Math.min(6, g.player.rankIdx + RNG.int(-1, 0))), personality: 'warlike', relation: -25 }),
  busker: () => ({ gender: 'F', rankIdx: 1, ageMonths: RNG.int(20, 23) * 12 }),
  firekid: () => ({ rankIdx: RNG.weighted([0, 1, 2], [30, 50, 20]), element: 'fire', ageMonths: RNG.int(18, 20) * 12 }),
  pickboy: () => ({ gender: 'M', rankIdx: RNG.weighted([0, 1], [40, 60]), ageMonths: RNG.int(18, 20) * 12 }),
  refugee: () => ({ rankIdx: 0, ageMonths: 18 * 12 + RNG.int(0, 11) }),
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const echoes = (g) => { g.flags.echo ??= {}; return g.flags.echo; };

  wrap('initSandbox', function (base, ...a) { const r = base.apply(this, a); if (this.flags) this.flags.echo ??= {}; return r; });

  GP.echoDue = function (key) { const e = this.flags && this.flags.echo && this.flags.echo[key]; return !!(e && !e.done && this.monthKey() >= e.due); };
  GP.echoNpcFor = function (key) {
    const e = this.flags.echo && this.flags.echo[key]; if (!e || e.done || this.monthKey() < e.due) return null;
    if (e.npc != null) { const n = this.npcById(e.npc); return n && n.alive && !n.child ? n : null; }
    const spec = ECHO_NPC[key]; if (!spec) return null;
    const n = this.makeNpc(true, 'human');
    Object.assign(n, { region: this.player.region, met: false, relation: 0, guild: null, links: n.links || {}, disciples: n.disciples || [], parents: n.parents || [] });
    const sp = spec(this); Object.assign(n, sp);
    if (sp.gender) n.name = RNG.pick(SURNAMES) + RNG.pick(sp.gender === 'M' ? GIVEN_M : GIVEN_F); // 성별을 바꿨으면 이름도 맞춘다
    this.npcs.push(n); e.npc = n.id;
    return n;
  };
  wrap('storyNpc', function (base, kind) {
    if (typeof kind === 'string' && kind.startsWith('echo:')) return this.echoNpcFor(kind.slice(5));
    return base.call(this, kind);
  });
  wrap('markSeen', function (base, id) {
    base.call(this, id);
    if (typeof id === 'string' && id.startsWith('echo_')) { const e = this.flags.echo && this.flags.echo[id.slice(5)]; if (e) e.done = this.monthKey(); }
  });

  // 원래 사건의 선택에 흔적 남기기
  for (const [id, idx, key, [lo, hi]] of ECHO_SRC) {
    const ev = STORY.find((e) => e.id === id); const ch = ev && ev.choices && ev.choices[idx]; if (!ch || !ch.do) continue;
    const base = ch.do;
    ch.do = function (g, c) {
      const E = echoes(g);
      if (!E[key]) E[key] = { at: g.monthKey(), due: g.monthKey() + RNG.int(lo, hi), npc: c && c.npc ? c.npc.id : null, region: g.player.region };
      return base.call(this, g, c);
    };
  }

  const due = (key) => (g) => g.echoDue(key);
  const remember = (g, c, why) => { if (c && c.npc && g.npcRemember) g.npcRemember(c.npc, why); };
  const E = (key, def) => S({ id: 'echo_' + key, once: true, weight: 4, when: due(key), ...def });

  // ---------- 후속 사건 ----------
  E('healed', { npc: 'echo:healed', text: '모르는 헌터가 협회 로비에서 당신을 부른다. "{name} 씨 맞죠? 그때 길가에 쓰러져 있던 사람이에요. 피 때문에 얼굴은 못 봤지만, 목소리는 기억해요."',
    choices: [
      { text: '"살았네요. 다행이다."', do: (g, c) => { remember(g, c, '길가에서 목숨을 구해 줬다'); return '{npc}이(가) 고개를 숙인다. "다음에 게이트 같이 가요. 그땐 제가 등 맡을게요."' + g.gain({ rel: 30 }, c); } },
      { text: '"그 가방, 무사히 찾았어요?"', do: (g, c) => { remember(g, c, '길가에서 목숨을 구해 줬다'); return '"가방도 그대로 있더라고요. 그래서 더 고마웠어요." {npc}이(가) 봉투 하나를 내민다. 사양해도 끝내 손에 쥐여 준다.' + g.gain({ rel: 20, money: 150 }, c); } },
    ] });
  E('bag', { npc: 'echo:bag', text: '협회 조사관이 서류를 내민다. "작년 장비 가방 분실 건입니다. 피해자가 의식을 잃기 직전, 지나가던 각성자 한 명을 봤다고 진술했습니다. 위치 기록이 당신과 겹치는데요." 복도 끝에서 {npc}이(가) 당신을 노려본다.',
    choices: [
      { text: '가방값을 물어 주고 사과한다', do: (g, c) => { remember(g, c, '쓰러졌을 때 가방을 가져갔다'); return '{npc}은(는) 돈을 받고도 끝내 고개를 돌렸다. 조사는 합의로 끝났다.' + g.gain({ money: -250, merit: -4, rel: 10 }, c); } },
      { text: '"처음 듣는 이야기입니다."', do: (g, c) => { remember(g, c, '쓰러졌을 때 가방을 가져갔다'); return g.roll(0.45) ? '증거가 부족해 조사가 멈췄다. {npc}은(는) 그날부터 당신을 원수로 여긴다.' + g.gain({ rel: -40 }, c) : '가방 속 장비 일련번호가 당신 거래 기록에서 나왔다. 징계와 함께 헌터넷에 실명이 돌았다.' + g.gain({ merit: -15, fame: -8, rel: -50 }, c); } },
    ] });
  E('lostkid', { text: '협회 지부 게시판에 크레파스 그림이 한 장 붙어 있다. 경보 속에서 어른 손을 잡고 걷는 아이. 아래에 삐뚤삐뚤한 글씨: "그때 안전 구역까지 데려다준 헌터님 고맙습니다."',
    choices: [
      { text: '그림 앞에서 한참 서 있다', do: (g) => '직원이 사진을 찍어 지부 누리집에 올렸다. 댓글이 오래 달렸다.' + g.gain({ fame: 3, rep: 3, hp: 0.3 }) },
      { text: '답장을 써서 붙여 둔다', do: (g) => '"경보가 울리면 어른 손을 꼭 잡아." 일주일 뒤 그 아래 그림이 한 장 더 붙었다.' + g.gain({ fame: 2, rep: 4 }) },
    ] });
  E('busker', { npc: 'echo:busker', text: '등록 창구 앞에서 누가 손을 흔든다. 광장에서 노래하던 그 소녀다. 가슴에 새 E급 배지. "저 기억하세요? 이름은 {npc}. 그때 명함 주신 거, 지갑에 아직 있어요. 다음 주가 첫 게이트예요."',
    choices: [
      { text: '첫 게이트에 따라가 준다', do: (g, c) => { remember(g, c, '등록을 권하고 첫 게이트를 함께해 줬다'); return '{npc}은(는) 괴수 앞에서 떨면서도 노래를 멈추지 않았다. 파티원 모두의 손떨림이 멎었다.' + g.gain({ rel: 30, fame: 3 }, c); } },
      { text: '"노래 계속해. 그게 네 무기야."', do: (g, c) => { remember(g, c, '등록을 권해 줬다'); return '{npc}이(가) 웃는다. "네. 그 말 들으려고 기다렸어요."' + g.gain({ rel: 15 }, c); } },
    ] });
  E('busker_lab', { text: '헌터넷 익명 게시판. "청룡 연구소 비공개 피험자 명단 유출". 사진 한 장에 낯익은 얼굴이 있다. 광장에서 노래하던 그 소녀. 비고란: "음파 계열, 정서 안정 효과 확인, 반복 측정 중".',
    choices: [
      { text: '글을 협회 감찰팀에 넘긴다', do: (g) => '일주일 뒤 연구소에 감찰이 들어갔다는 기사가 났다. 소녀의 이름은 어디에도 없었다.' + g.gain({ merit: 4, fame: -1 }) },
      { text: '창을 닫는다', do: () => '포상금은 이미 다 썼다. 그 노래가 가끔 귀에 맴돈다.' },
    ] });
  E('firekid', { npc: 'echo:firekid', text: '각성자 등록 시험장 앞. 앳된 얼굴의 응시자가 당신에게 달려온다. "기억하세요? 운동장에서 불 뿜던 애요. 제 이름은 {npc}. \'나도 처음엔 그랬어\' 그 말 듣고 헌터 하기로 했어요."',
    choices: [
      { text: '"그럼 이번엔 불 끄는 법도 배웠겠네?"', do: (g, c) => { remember(g, c, '처음 각성했을 때 진정시켜 줬다'); return '{npc}이(가) 손바닥 위에 작은 불꽃을 얌전히 띄워 보인다. 시험장 사람들이 박수를 친다.' + g.gain({ rel: 35, fame: 4 }, c); } },
      { text: '시험 끝날 때까지 기다려 준다', do: (g, c) => { remember(g, c, '시험장에서 기다려 줬다'); return '합격 문자를 받은 {npc}이(가) 제일 먼저 당신에게 화면을 내민다.' + g.gain({ rel: 25, rep: 3 }, c); } },
    ] });
  E('firekid_lab', { text: '뉴스 자막이 지나간다. "관리국, 청소년 각성자 이송 시설 실태 공개 거부". 화면 구석 자료 화면에 낯익은 학교 운동장이 잠깐 나온다. 마취총을 맞던 그 아이가 생각난다.',
    choices: [
      { text: '그 학교 이름으로 정보 공개를 청구한다', do: (g) => g.roll(0.5) ? '석 달 뒤 답이 왔다. "해당 청소년은 보호 과정을 마치고 가족에게 돌아갔음." 한 줄이었지만 충분했다.' + g.gain({ merit: 2, hp: 0.2 }) : '"국가 안보 사유로 공개 불가." 그 뒤로 관리국 창구 직원들이 당신 이름을 다시 본다.' + g.gain({ merit: -3 }) },
      { text: '채널을 돌린다', do: () => '그날은 진압팀을 기다린 게 옳았다고 생각했다. 지금은 잘 모르겠다.' },
    ] });
  E('betray', { npc: 'echo:betray', text: '{npc}이(가) 술집 구석 자리로 당신을 부른다. 봉투를 탁자에 올려놓는다. "그때 다른 길드에 판 정보값이야. …너 알고 있었지. 알면서 아무 말 안 한 거, 그게 더 힘들더라."',
    choices: [
      { text: '봉투를 밀어 돌려준다', do: (g, c) => { remember(g, c, '배신을 알고도 용서해 줬다'); return '{npc}의 어깨가 내려앉는다. 그날 처음으로 빚 이야기를 끝까지 털어놓았다.' + g.gain({ rel: 30 }, c); } },
      { text: '봉투를 받는다', do: (g, c) => { remember(g, c, '정보값을 돌려받았다'); return '"이걸로 끝이야." {npc}이(가) 고개를 끄덕인다. 둘 다 그 말이 무슨 뜻인지 정확히 몰랐다.' + g.gain({ money: 200, rel: 5 }, c); } },
    ] });
  E('truck', { text: '협회 수송 감사 공문이 왔다. "작년 전복 수송 차량에서 봉인 코어 일부가 사라졌습니다. 코어마다 일련번호가 새겨져 있으며, 유통 경로를 추적 중입니다. 자진 신고 시 감경합니다."',
    choices: [
      { text: '자진 신고한다', do: (g) => '감사관은 서류를 덮으며 말했다. "솔직하셔서 이번엔 경고로 끝냅니다."' + g.gain({ merit: -5, money: -150 }) },
      { text: '버틴다', do: (g) => g.roll(0.55) ? '코어는 이미 여러 손을 거쳐 녹아 버렸다. 추적은 거기서 끊겼다.' : '일련번호가 당신이 판 상점 장부에서 나왔다. 협회 징계, 헌터넷 실명 공개.' + g.gain({ merit: -20, fame: -10 }) },
    ] });
  E('pickboy', { npc: 'echo:pickboy', text: '신규 등록자 환영회. 한 청년이 쭈뼛거리며 다가와 봉투를 내민다. "그때 지갑… 모른 척 내주셨죠. 이름은 {npc}. 이제 등록했어요. 이거, 그때 돈이랑 이자요."',
    choices: [
      { text: '"이자는 됐고, 밥이나 사."', do: (g, c) => { remember(g, c, '소매치기 시절 지갑을 모른 척 내줬다'); return '{npc}이(가) 그날 처음으로 크게 웃었다. 국밥 두 그릇 값은 끝내 {npc}이(가) 냈다.' + g.gain({ rel: 35 }, c); } },
      { text: '봉투를 받고 어깨를 두드린다', do: (g, c) => { remember(g, c, '빚을 받아 줬다'); return '"빚진 게 있으니까 사람이 되더라고요." {npc}이(가) 쑥스럽게 웃는다.' + g.gain({ money: 80, rel: 20 }, c); } },
    ] });
  E('stray', { field: true, text: '길을 막고 선 커다란 괴수. 이를 드러내다가 콧김을 한 번 뿜고는 멈춘다. 뒷다리에 오래된 흉터가 있다. 당신이 치료해 준 자리다. 괴수는 천천히 길을 비켜 숲으로 들어간다.',
    choices: [
      { text: '뒷모습을 지켜본다', do: (g) => '그 뒤로 이 길에선 괴수 무리가 당신을 피해 다닌다는 소문이 돌았다.' + g.gain({ ether: 25, rep: 2 }) },
      { text: '"잘 컸네."', do: (g) => '괴수가 한 번 돌아본다. 대답 같았다.' + g.gain({ ether: 25, hp: 0.3 }) },
    ] });
  E('stray_mother', { field: true, text: '밤새 무언가가 뒤를 밟는다. 새벽녘, 덤불이 갈라지며 거대한 괴수가 모습을 드러낸다. 코를 킁킁거리며 당신 손을 노려본다. 새끼의 냄새를 맡은 것이다.',
    choices: [
      { text: '맞선다', do: (g) => { g.storyFight({ title: '새끼를 잃은 어미 괴수', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1 }, win: { text: '어미는 쓰러지면서도 새끼가 있던 쪽을 보고 있었다.', gain: { core: [1, 1], fame: 3 } }, lose: { text: '간신히 도망쳤다. 어미의 울음이 산을 넘어 따라왔다.', gain: { injure: 2 } } }); return '어미가 포효하며 달려든다.'; } },
      { text: '등을 보이지 않고 물러난다', do: (g) => g.roll(0.5) ? '한참 마주 보다가 어미가 먼저 고개를 돌렸다.' : '물러나는 사이 앞발이 스쳤다.' + g.gain({ hp: -0.3 }) },
    ] });
  E('refugee', { npc: 'echo:refugee', text: '협회 시험장 대기실. 한 응시자가 당신 앞에서 우뚝 선다. "고가도로 아래 천막… 기억하세요? 그때 기침하던 애가 저예요. {npc}. 사흘 동안 지켜 주셨잖아요. 그래서 여기 왔어요."',
    choices: [
      { text: '"기침은 다 나았어?"', do: (g, c) => { remember(g, c, '피난길에 사흘을 지켜 줬다'); return '"그때 받은 약 덕분에요." {npc}이(가) 웃는다. 그 얼굴에 그날 손 흔들던 아이가 겹친다.' + g.gain({ rel: 35, fame: 3 }, c); } },
      { text: '응시표 뒤에 연락처를 적어 준다', do: (g, c) => { remember(g, c, '시험 날 연락처를 줬다'); return '"합격하면 제일 먼저 연락할게요."' + g.gain({ rel: 25 }, c); } },
    ] });
  E('oldhunter', { text: '모르는 번호의 문자. "부고. 1세대 헌터 한 분이 별세하셨습니다. 지하철역에서 생전에 이야기를 나눠 주신 분께 꼭 알려 달라 하셨습니다." 그 계단의 한쪽 팔 없는 노인이다.',
    choices: [
      { text: '장례식에 간다', do: (g) => '빈소엔 낡은 협회 배지를 단 노인들뿐이었다. 다들 당신을 보고 고개를 끄덕였다. "그 양반이 말하던 젊은이구먼." 누군가 오래된 수첩 한 권을 건넸다. 게이트 초창기 공략 메모가 빼곡하다.' + g.gain({ ether: 40, fame: 2 }) },
      { text: '조화만 보낸다', do: (g) => '조화 리본에 이름을 적다가 한참 손이 멈췄다.' + g.gain({ hp: -0.05 }) },
    ] });
}
