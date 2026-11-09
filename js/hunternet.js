// ===== 게이트 크로니클: 헌터넷 커뮤니티 (영역 C) =====
// docs/구현_대기목록.md 4-14, docs/헌터넷_커뮤니티_제안.md.
// 큰일 뒤 "헌터넷 반응" 카드(인기 글 + 베스트 댓글 3) → 반응 유형 × 사건 댓글 생성(여론·이미지·등급·소속으로 비율)
// → 휴대폰 앱형 게시판(실시간 인기/헌터 갤러리/공략·정보/길드/사건사고) → NPC 글·음모 여론 조작·재난 실시간 글
// → 플레이어 글쓰기(해명·자랑·공략·모집·저격, 부계정)·공략 판매·고소.
// 저장: world.hnet = { posts: [...], seq }, p.hnet = { card, lastWrite, alt, sued: {}, heat(논란 0~100) }
// 방송·광고·예능은 넣지 않음(사용자 결정). 반응 비율은 여론·명성·등급·소속·헌터넷 논란으로.

const HNET_BOARDS = { hot: '실시간 인기', gall: '헌터 갤러리', guide: '공략·정보', guild: '길드', accident: '사건사고' };
const HNET_NICK_A = ['게이트', 'D급', 'F급', '백호', '현무', '주작', '청룡', '관리국', '코어', '포차', '야간', '무직', '은퇴', '서울', '부산', '강북', '한강', '탑'];
const HNET_NICK_B = ['청소부', '인생', '빠', '9급', '수집가', '단골', '헌터', '러', '고인물', '뉴비', '아재', '지박령', '눈팅족', '장인', '덕후'];
// 반응 유형별 댓글. {n}=주인공 이름, {r}=등급, {g}=소속
const HNET_REACT = {
  praise: ['ㄹㅇ 미쳤다', '{n} 이 사람 진짜 물건이네', '와 이걸 해내네', '레전드 갱신', '박수 치고 갑니다 👏', '이게 {r}급 실력이라고?'],
  doubt: ['주작 아님? 영상 원본 내놔', '측정 오류 아님?', '{r}급이 이걸? 뭔가 있음', '버스 탄 거 아니냐', '관리국 발표만 믿냐'],
  envy: ['운빨이지 뭐', 'F급 출신이 운 좋았네', '나도 장비빨이면 함', '어차피 길드가 다 해 준 거', '부럽다… 아니 안 부러움'],
  info: ['그 게이트 3층 함정 있음 참고', '저 등급대 보스는 속성 맞추면 쉬움', '정보: 공략팀 4인 구성이었음', '현장 있었는데 후반에 변이 조짐 있었음'],
  joke: ['이 정도면 게이트가 쫄아서 닫힌 듯', '괴수: 아 퇴근하고 싶다', '오늘도 평화로운 헌터넷', '{n} 숨만 쉬어도 레벨업함?', '짤 저장 완료'],
  fan: ['{n} 헌터님 결혼해 주세요', '팬카페 가입했습니다', '{n} 굿즈 언제 나와요', '오늘부터 1일 팬'],
  anti: ['또 {n} 얘기냐 지겹다', '언플 오지네', '{n} 인성 문제 있다던데', '거품 곧 꺼짐'],
  guildfan: ['{g} 형님들은 이 정도 기본임', '역시 {g}', '{g} 아니었으면 불가능', '{g} 신입 모집 언제함?'],
  govcrit: ['관리국은 뭐 했냐', '세금 받아서 이거 하나 못 막음?', '협회 대응 또 늦었네'],
  ajae: ['우리 땐 말이야, 이런 거 매일 했어', '요즘 애들 대단하네 허허', '대붕괴 때 생각나네'],
  question: ['이거 어디 게이트임?', '혹시 파티원 구함?', '보상 얼마 나왔는지 아는 사람?', '저 직업 뭐임?'],
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.hnet ??= { posts: [], seq: 1 };
    this.player.hnet ??= { card: true, lastWrite: -99, alt: false, sued: {}, sold: -99 };
  });

  GP.hnetNick = function () { return RNG.chance(0.15) ? `ㅇㅇ(${RNG.int(100, 223)}.${RNG.int(10, 99)})` : RNG.pick(HNET_NICK_A) + RNG.pick(HNET_NICK_B) + (RNG.chance(0.3) ? RNG.int(1, 99) : ''); };

  // 반응 비율: 여론·이미지·등급·소속
  GP.hnetWeights = function (aboutPlayer, kind) {
    const w = { praise: 3, doubt: 1.5, envy: 1.2, info: 1.2, joke: 2, fan: 0.6, anti: 0.6, guildfan: 0.5, govcrit: 0.5, ajae: 0.6, question: 1 };
    const op = this.world.opinion || 0;
    if (op < -20) { w.govcrit += 1.5; w.anti += 0.8; w.praise -= 0.8; }
    if (op > 20) { w.praise += 1; w.fan += 0.4; }
    if (/break|missing|named/.test(kind || '')) { w.govcrit += 2.5; w.info += 1; w.fan = 0.1; }
    if (aboutPlayer) {
      const p = this.player; const heat = (p.hnet && p.hnet.heat) || 0; const fame = Math.min(p.fame || 0, 600);
      w.fan += fame / 200; w.praise += fame / 300;
      w.anti += heat / 15; w.doubt += heat / 25;
      if ((p.official ?? p.rankIdx) <= 2) { w.doubt += 1.5; w.envy += 1.5; }
      if (p.rankIdx > (p.official ?? p.rankIdx)) w.doubt += 1; // 등록 등급보다 강하다
      if (p.guild) w.guildfan += 1.5;
      if ((p.wanted || 0) > 0) { w.anti += 2; w.fan *= 0.3; }
    }
    return w;
  };
  GP.hnetComments = function (n, aboutPlayer, kind, vars) {
    const w = this.hnetWeights(aboutPlayer, kind); const keys = Object.keys(w);
    const out = []; const used = new Set();
    for (let i = 0; i < n; i++) {
      const k = RNG.weighted(keys, keys.map((x) => Math.max(0.05, w[x])));
      let t = RNG.pick(HNET_REACT[k]); for (let j = 0; j < 6 && used.has(t); j++) t = RNG.pick(HNET_REACT[RNG.pick(keys)]); if (used.has(t)) continue; used.add(t);
      t = t.replace(/\{n\}/g, vars.n || '이 사람').replace(/\{r\}/g, vars.r || '?').replace(/\{g\}/g, vars.g || '우리 길드');
      const up = Math.max(0, Math.round(RNG.range(0, 1) ** 2 * 400 * (k === 'praise' || k === 'joke' ? 1.5 : 1)));
      const c = { nick: this.hnetNick(), t, up, k };
      if (RNG.chance(0.18) && out.length) { const tgt = RNG.pick(out); (tgt.re ??= []).push({ nick: this.hnetNick(), t: RNG.pick(['ㄴ 팩트: 아님', 'ㄴ 뇌피셜 ㄴㄴ', 'ㄴ 이건 맞말', 'ㄴ 너 그 길드 사람이지?', 'ㄴ ㅋㅋㅋㅋ']) }); }
      out.push(c);
    }
    return out;
  };

  GP.hnetPost = function ({ board, title, body, nick, kind, aboutPlayer, vars = {}, n = 7, me = false, extra }) {
    const H = this.world.hnet;
    const post = { id: H.seq++, mk: this.monthKey(), date: this.dateStr(), board, title, body: body || '', nick: nick || this.hnetNick(), kind: kind || '', me: !!me || !!aboutPlayer, up: RNG.int(5, 60), cmt: this.hnetComments(n, aboutPlayer, kind, vars), ...(extra || {}) };
    post.up += Math.round(post.cmt.reduce((s, c) => s + c.up, 0) / 4) + (aboutPlayer ? 300 : 0);
    H.posts.unshift(post);
    if (H.posts.length > 40) H.posts.length = 40;
    return post;
  };
  GP.hnetBest = function (post, k = 3) { return post.cmt.slice().sort((a, b) => b.up - a.up).slice(0, k); };
  GP.hnetVars = function () { const p = this.player; return { n: p.name, r: RANKS[p.official ?? p.rankIdx].key, g: p.guild ? GUILDS[p.guild].name : (p.myGuild ? p.myGuild.name : '') }; };

  // 소문 → 글 (중요한 것만)
  wrap('rumor', function (base, text, meta = {}) {
    base.call(this, text, meta);
    const r = this.rumors && this.rumors[0]; if (!r || !this.world || !this.world.hnet) return;
    const p = this.player; const about = p && p.name && r.text.includes(p.name);
    if (!about && (r.score || 0) < 5) return;
    const k = meta.kind || '';
    const board = /break|missing|named|recall/.test(k) ? 'accident' : /transfer|guild|faction|scandal|law/.test(k) ? 'guild' : about || /worldfirst|monster/.test(k) ? 'hot' : 'gall';
    const head = r.text.replace(/^속보:\s*/, '');
    const title = about ? RNG.pick([`와 ${p.name} 이거 실화냐`, `[속보] ${head.slice(0, 22)}…`, `${p.name} 또 일냈네`]) : /break/.test(k) ? `[실시간] ${head.slice(0, 24)}…` : `${head.slice(0, 26)}${head.length > 26 ? '…' : ''}`;
    this.hnetPost({ board, title, body: r.text, kind: k, aboutPlayer: about, vars: about ? this.hnetVars() : { n: '그 사람', r: '', g: '' } });
  });

  // ---------- 반응 카드 ----------
  GP.hnetReact = function (title, body, kind) {
    const p = this.player; if (!this.world.hnet) return;
    const post = this.hnetPost({ board: 'hot', title, body, kind, aboutPlayer: true, vars: this.hnetVars(), n: 9 });
    if (p.hnet && p.hnet.card) this.queue.push({ type: 'hnet', id: post.id });
  };
  wrap('breakthrough', function (base) {
    const r = base.call(this);
    if (r && r.ok && this.player.rankIdx >= 2) this.hnetReact(`${this.player.name}, ${RANKS[this.player.rankIdx].key}급 돌파했다는데`, `${this.player.name} 헌터가 ${RANKS[this.player.rankIdx].name}에 올랐다는 소식.`, 'rank');
    return r;
  });
  wrap('remeasure', function (base) {
    const before = this.player.official; const r = base.call(this);
    if (this.player.official - before >= 2) this.hnetReact(`[재측정 이변] ${RANKS[before].key}급이 ${RANKS[this.player.official].key}급으로`, '측정기가 터졌다는 목격담.', 'misrank');
    return r;
  });
  wrap('finishGate', function (base, gate, result, ...rest) {
    const lines = base.call(this, gate, result, ...rest);
    const p = this.player;
    if (result === 'clear' && gate && ((gate.realTier ?? gate.tier) > (p.official ?? p.rankIdx) || gate.variant === 'red' || gate.breakCity)) {
      const what = gate.breakCity ? `${regionById(gate.breakCity).name} 브레이크 막음` : gate.variant === 'red' ? '레드 게이트 깸' : `${RANKS[gate.realTier ?? gate.tier].key}급 게이트 단독 클리어`;
      this.hnetReact(`${p.name} ${what} ㄷㄷ`, `현장 목격담: ${p.name} 헌터가 ${this.gateName(gate)}을(를) 닫았다.`, gate.breakCity ? 'break' : 'gate');
    }
    return lines;
  });

  // ---------- NPC 글·음모·재난 ----------
  GP.hnetMonthly = function () {
    const p = this.player; const H = this.world.hnet;
    // NPC 글: 유형·성격 맞춤
    const writers = this.adults().filter((n) => !n.retired && (n.arch || n.met) && RNG.chance(0.04));
    for (const n of writers.slice(0, 2)) {
      let title, board = 'gall';
      if (n.arch === 'streamer') { title = `[홍보] 오늘 밤 ${RANKS[n.rankIdx].key}급 게이트 생방 갑니다`; }
      else if (n.arch === 'villain') { title = '관리국 개들아 나 잡아 봐라 ㅋㅋ'; board = 'accident'; }
      else if (n.arch === 'broker') { title = '다음 달 큰 거 하나 터짐. 아는 사람만 알 듯'; board = 'guide'; }
      else if (n.arch === 'rival' && p.examDone) { title = `${p.name} 거품이라고 생각하는 사람 나뿐임?`; board = 'hot'; }
      else if (n.guild && RNG.chance(0.5)) { title = `${GUILDS[n.guild].name} 신입 모집합니다 (${RANKS[Math.max(0, n.rankIdx - 1)].key}급 이상)`; board = 'guild'; }
      else { const line = this.personaLine ? this.personaLine(n, 'town') : '오늘 게이트 다녀옴'; title = line || '잡담'; }
      const post = this.hnetPost({ board, title, nick: n.hnetNick ??= this.hnetNick(), kind: 'npc', aboutPlayer: n.arch === 'rival' && board === 'hot', vars: this.hnetVars(), n: 5, extra: { author: n.id } });
      if (n.arch === 'rival' && board === 'hot' && n.met) this.log(`헌터넷에 ${n.name}이(가) 당신을 저격하는 글을 올렸다는 소문이다.`, 'bad');
      void post;
    }
    // 음모: 같은 말투 댓글이 몰리는 여론 조작 글
    if (this.activePlots && RNG.chance(0.3)) {
      const pl = this.activePlots()[0];
      if (pl && pl.owner) {
        const own = this.plotOwnerText(pl);
        const post = this.hnetPost({ board: 'guild', title: `${own} 요즘 너무 잘하는 듯`, kind: 'astroturf', n: 3, extra: { plot: pl.id } });
        const same = RNG.pick(['진짜 믿음직함 ㅎㅎ', '역시 최고 길드', '응원합니다!!']);
        for (let i = 0; i < 5; i++) post.cmt.push({ nick: this.hnetNick(), t: same, up: RNG.int(0, 3), k: 'astro' });
      }
    }
    // 재난 실시간 글
    for (const b of this.world.breaks || []) {
      if (b.hnetLive === this.monthKey()) continue; b.hnetLive = this.monthKey();
      const reg = regionById(b.city);
      const post = this.hnetPost({ board: 'accident', title: `[실시간] 지금 ${reg.name} 근처 사람 있음?`, body: '창밖으로 괴수 보임. 대피 방송 나오는 중.', kind: 'break', n: 6 });
      post.cmt.unshift({ nick: this.hnetNick(), t: `${reg.name} 동쪽 출구 막힘. 서쪽으로 가세요`, up: 520, k: 'info' });
    }
  };
  wrap('worldMonthly', function (base) { base.call(this); if (this.world.hnet) { this.hnetMonthly(); const h = this.player.hnet; if (h && h.heat) h.heat = Math.max(0, h.heat - 2); } });

  // 글을 열어 봤을 때: 여론 조작 글은 단서
  GP.hnetOpen = function (id) {
    const post = this.world.hnet.posts.find((x) => x.id === id); if (!post) return null;
    if (post.plot && !post.clued) {
      post.clued = true;
      const pl = (this.world.plots || []).find((x) => x.id === post.plot && x.status === 'active');
      if (pl && RNG.chance(0.5)) {
        const p = this.player; p.plotClues[pl.id] = (p.plotClues[pl.id] || 0) + 1;
        this.log(`단서: 헌터넷 댓글이 이상하다. 같은 말투가 한꺼번에 몰렸다. 누군가 ${this.plotOwnerText(pl)} 여론을 관리하고 있다.`, 'major');
        if (p.plotClues[pl.id] === 2) this.queue.push({ type: 'plot', id: pl.id });
      }
    }
    return post;
  };

  // ---------- 플레이어 글쓰기 ----------
  GP.hnetWrite = function (kind, alt) {
    const p = this.player; const H = p.hnet; const mk = this.monthKey(); H.heat ??= 0;
    const like = Math.max(0, Math.min(100, 50 + (this.world.opinion || 0) / 2 + Math.min(p.fame, 300) / 10 - H.heat)); const im = { like, get scandal() { return H.heat; }, set scandal(v) { H.heat = Math.max(0, Math.min(100, v)); } };
    if (H.lastWrite === mk) return '이번 달엔 이미 글을 썼다.';
    H.lastWrite = mk;
    const nick = alt ? this.hnetNick() : p.name;
    const vars = this.hnetVars(); let msg = '';
    const caught = alt && RNG.chance(0.12);
    if (kind === 'explain') {
      const ok = RNG.chance(0.45 + im.like / 200 - im.scandal / 300);
      im.scandal = im.scandal - (ok ? 15 : -5);
      this.hnetPost({ board: 'hot', title: alt ? `${p.name} 논란 정리해 봄 (장문)` : '[해명] 그 일에 대해 말씀드립니다', nick, aboutPlayer: true, vars, kind: 'explain', me: true });
      msg = ok ? '해명 글이 통했다. 여론이 돌아선다. (논란 −15)' : '해명이 오히려 불을 붙였다. "변명 잘 들었습니다" 댓글이 쏟아졌다.';
    } else if (kind === 'brag') {
      const ok = RNG.chance(0.5 + im.like / 200);
      p.fame += ok ? 4 : 1; if (!ok) im.scandal += 6;
      this.hnetPost({ board: 'gall', title: alt ? `${p.name} 헌터 실물 봤는데 아우라 미쳤음` : '오늘 게이트 하나 정리하고 왔습니다 (인증)', nick, aboutPlayer: true, vars, kind: 'brag', me: true });
      msg = ok ? '자랑 글이 인기 글에 올랐다. (명성 +4)' : '"자랑하려고 사냐" 댓글이 달렸다. (논란 +6)';
    } else if (kind === 'guide') {
      p.merit = (p.merit || 0) + 5; this.addOpinion && this.addOpinion(1); p.fame += 2;
      this.hnetPost({ board: 'guide', title: `[공략] ${RANKS[p.rankIdx].key}급 게이트 보스 패턴 정리`, nick, aboutPlayer: !alt, vars, kind: 'guide', me: true });
      msg = '무료 공략 글. "이분 천사냐" 댓글. (협회 공적 +5, 명성 +2)';
    } else if (kind === 'sell') {
      if (mk - H.sold < 3) return (H.lastWrite = -99, '유료 공략은 석 달에 한 번이 적당하다. 독자들이 지친다.');
      H.sold = mk;
      const views = Math.round(p.fame * RNG.range(2, 6) + 50);
      const money = views * Math.max(2, Math.round(5 * RANKS[p.rankIdx].mult));
      p.money += money;
      this.hnetPost({ board: 'guide', title: `[유료] ${RANKS[p.rankIdx].key}급 공략 완전판 (조회 ${views})`, nick, aboutPlayer: !alt, vars, kind: 'sell', me: true });
      if (RNG.chance(0.2)) { im.scandal += 5; msg = `유료 공략 수입 ${fmt(money)} 크레딧. "이걸 돈 받고 파냐" 논란도 조금.`; } else msg = `유료 공략 조회 ${views}회, 수입 ${fmt(money)} 크레딧.`;
    } else if (kind === 'recruit') {
      this.hnetPost({ board: 'guild', title: `${p.myGuild ? p.myGuild.name : '파티'} 같이 하실 분 구합니다`, nick, aboutPlayer: false, vars, kind: 'recruit', me: true });
      const n = RNG.pick(this.adults().filter((x) => x.region === p.region && !x.isCompanion && Math.abs(x.rankIdx - p.rankIdx) <= 1));
      if (n) { n.met = true; this.changeRel(n, 12, '헌터넷 모집 글을 보고 연락해 왔다'); msg = `${n.name}이(가) 모집 글을 보고 연락해 왔다. (관계 +12)`; } else msg = '모집 글에 조회수만 늘었다.';
    } else if (kind === 'snipe') {
      const r = this.rival ? this.rival() : null;
      const t = r || RNG.pick(this.adults().filter((x) => x.met && x.relation < 0));
      if (!t) return (H.lastWrite = -99, '저격할 상대가 없다.');
      p.fame += 3; im.scandal += alt ? 4 : 10;
      t.met = true; this.changeRel(t, -20, '헌터넷에서 당신에게 저격당했다');
      this.hnetPost({ board: 'hot', title: `${t.name} 실력 거품인 거 다들 알지?`, nick, aboutPlayer: !alt, vars, kind: 'snipe', me: true });
      msg = `${t.name}을(를) 저격했다. 판이 커졌다. (관계 −20${alt ? '' : ', 논란 +10'})`;
      if (!alt && RNG.chance(0.25)) { const fee = Math.round(500 * RANKS[t.rankIdx].mult); p.money = Math.max(0, p.money - fee); msg += ` ${t.name} 쪽에서 명예훼손 고소장이 날아왔다. 합의금 ${fmt(fee)} 크레딧.`; }
    } else return '';
    if (caught) {
      im.scandal += 30;
      this.rumor(`[단독] ${p.name}, 헌터넷 부계정으로 자작 글 쓰다 IP 걸려.`, { kind: 'scandal', score: 6 });
      msg += ' …그리고 부계정이 들통났다. 대형 논란.';
    }
    return msg;
  };

  // 고소: 나에 대한 악플이 많은 글
  GP.hnetCanSue = function (post) { const p = this.player; return post && post.me && !p.hnet.sued[post.id] && post.cmt.filter((c) => c.k === 'anti' || c.k === 'doubt' || c.k === 'envy').length >= 3; };
  GP.hnetSue = function (id) {
    const p = this.player; const post = this.world.hnet.posts.find((x) => x.id === id);
    if (!this.hnetCanSue(post)) return '';
    const cost = Math.round(300 * RANKS[p.rankIdx].mult);
    if (p.money < cost) return `소송 비용 ${fmt(cost)} 크레딧이 없다.`;
    p.money -= cost; p.hnet.sued[id] = true;
    p.hnet.heat ??= 0;
    if (RNG.chance(0.6)) {
      const got = cost * RNG.int(2, 4); p.money += got; p.hnet.heat = Math.max(0, p.hnet.heat - 5);
      post.cmt = post.cmt.filter((c) => c.k !== 'anti'); post.cmt.push({ nick: '운영자', t: '해당 댓글은 법적 요청으로 삭제되었습니다.', up: 0, k: 'sys' });
      this.rumor(`${p.name}, 악플러 상대 소송 승소. 합의금은 기부한다고.`, { kind: 'hnet', score: 2 });
      return `악플러들과 합의했다. 합의금 ${fmt(got)} 크레딧. 악플이 지워졌다.`;
    }
    p.hnet.heat = Math.min(100, p.hnet.heat + 8);
    return '소송이 기각됐다. "고소 남발" 기사가 났다. (논란 +8)';
  };
}

if (typeof UI !== 'undefined') {
  const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const cmtHtml = (c) => `<div class="hn-c"><span class="small dim">${esc(c.nick)}</span> ${esc(c.t)} <span class="small dim">▲${c.up}</span>${(c.re || []).map((r) => `<div class="small" style="margin-left:12px"><span class="dim">${esc(r.nick)}</span> ${esc(r.t)}</div>`).join('')}</div>`;

  // 반응 카드
  UI.showHnetCard = function (id) {
    const post = G.world.hnet.posts.find((x) => x.id === id); if (!post) return this.processQueue();
    const best = G.hnetBest(post, 3);
    this.modal(`<div class="eyebrow">헌터넷 반응 · ${HNET_BOARDS[post.board]}</div><h3>${esc(post.title)}</h3>
      <div class="small dim">${esc(post.nick)} · 추천 ${post.up} · 댓글 ${post.cmt.length}</div>
      <div class="sec-title sec">베스트 댓글</div><div class="cards">${best.map(cmtHtml).join('')}</div>
      <div class="row end"><button class="ghost sm" data-act="hnet-card-off">이 카드 그만 보기</button><button class="sm" data-act="hnet-open" data-v="${post.id}">헌터넷 열기</button><button class="primary" data-act="modal-close">닫기</button></div>`, 'event-box');
  };

  // 게시판
  UI.hnetTab = 'hot';
  UI.showHnet = function (postId) {
    const H = G.world.hnet; const tab = this.hnetTab;
    if (postId) {
      const post = G.hnetOpen(+postId); if (!post) return;
      const sue = G.hnetCanSue(post) ? `<button class="sm danger" data-act="hnet-sue" data-v="${post.id}">고소</button>` : '';
      this.modal(`<div class="eyebrow">헌터넷 · ${HNET_BOARDS[post.board]}</div><h3>${esc(post.title)}</h3>
        <div class="small dim">${esc(post.nick)} · ${post.date} · 추천 ${post.up}</div>${post.body ? `<p class="event-text">${esc(post.body)}</p>` : ''}
        <div class="sec-title sec">댓글 ${post.cmt.length}</div><div class="cards">${post.cmt.map(cmtHtml).join('')}</div>
        <div class="row end">${sue}<button class="sm" data-act="hnet-open">목록</button><button class="primary" data-act="modal-close">닫기</button></div>`, 'event-box');
      return;
    }
    const list = H.posts.filter((x) => (tab === 'hot' ? x.board === 'hot' || x.up >= 300 : x.board === tab)).sort((a, b) => (b.me - a.me) || (b.mk - a.mk) || (b.up - a.up)).slice(0, 15);
    const tabs = Object.entries(HNET_BOARDS).map(([k, v]) => `<button class="sm ${k === tab ? 'primary' : ''}" data-act="hnet-tab" data-v="${k}">${v}</button>`).join('');
    const rows = list.map((x) => `<button class="choice-btn" data-act="hnet-open" data-v="${x.id}">${x.me ? '<b class="good">[나]</b> ' : ''}${esc(x.title)} <span class="small dim">[${x.cmt.length}] · ${esc(x.nick)} · ▲${x.up}</span></button>`).join('') || '<div class="dim small">아직 글이 없다.</div>';
    const p = G.player; const can = p.hnet.lastWrite !== G.monthKey();
    const write = `<div class="sec-title sec">글쓰기 ${can ? '' : '<span class="small dim">(이번 달 완료)</span>'}</div><div class="row" style="flex-wrap:wrap">
      ${[['explain', '해명'], ['brag', '자랑'], ['guide', '공략 공개'], ['sell', '유료 공략'], ['recruit', '모집'], ['snipe', '저격']].map(([k, v]) => `<button class="sm" data-act="hnet-write" data-v="${k}" ${can ? '' : 'disabled'}>${v}</button>`).join('')}
      <label class="small"><input type="checkbox" data-act="hnet-alt" ${p.hnet.alt ? 'checked' : ''}> 부계정</label></div>`;
    this.modal(`<div class="eyebrow">헌터넷</div><h3>헌터넷 — 대한민국 헌터 커뮤니티</h3><div class="row" style="flex-wrap:wrap">${tabs}</div>
      <div class="cards sec">${rows}</div>${write}
      <div class="row end"><button class="ghost sm" data-act="hnet-card-toggle">반응 카드 ${p.hnet.card ? '끄기' : '켜기'}</button><button class="primary" data-act="modal-close">닫기</button></div>`, 'event-box');
  };

  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'hnet') { G.queue.shift(); G.queue = G.queue.filter((x) => x.type !== 'hnet'); return this.showHnetCard(q.id); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'hnet-open': this.closeModal(); return this.showHnet(v);
      case 'hnet-tab': this.hnetTab = v; this.closeModal(); return this.showHnet();
      case 'hnet-write': { const r = G.hnetWrite(v, G.player.hnet.alt); this.closeModal(); this.showHnet(); return this.toast(r); }
      case 'hnet-alt': G.player.hnet.alt = !G.player.hnet.alt; return;
      case 'hnet-sue': { const r = G.hnetSue(+v); this.closeModal(); this.showHnet(v); return this.toast(r); }
      case 'hnet-card-off': G.player.hnet.card = false; this.closeModal(); return this.after('헌터넷 반응 카드를 껐다. 헌터넷 화면에서 다시 켤 수 있다.');
      case 'hnet-card-toggle': G.player.hnet.card = !G.player.hnet.card; this.closeModal(); return this.showHnet();
      default: return baseHandle.call(this, act, v);
    }
  };
  // 연대기 화면 맨 위에 헌터넷 바로가기
  const baseRight = UI.rightHtml;
  UI.rightHtml = function () {
    const html = baseRight.call(this);
    const n = G.world.hnet ? G.world.hnet.posts.filter((x) => x.mk >= G.monthKey() - 1).length : 0;
    return `<div class="row"><button class="sm primary" data-act="hnet-open">📱 헌터넷 열기${n ? ` · 새 글 ${n}` : ''}</button></div>` + html;
  };
}
