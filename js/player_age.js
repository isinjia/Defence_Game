// 플레이어 나이 (사용자 요청)
// 1. 시작 나이: 전에는 누구나 19세로 고정이라, 프롤로그에서 "서른둘에 첫 각성이요?"라고 해 놓고 등록 신청서·인물 창에는 19세로 나왔다.
//    이제 출신을 고르는 순간(프롤로그 시작) 출신·첫 장면에 맞는 범위에서 나이를 정하고, 프롤로그 글의 숫자 나이도 그 나이로 바꾼다.
// 2. 나이 구간별 능력치 규칙: 어릴수록 빨리 크지만 몸이 덜 여물었고, 나이가 들수록 단단하고 노련하지만 성장이 더디다.
// 3. 나이가 많으면 소꿉친구가 이미 오래전에 각성한 베테랑 헌터일 수 있다. 일반인 친구의 직업도 나이에 맞춘다.
// 4. 시험 동기는 대부분 스무 살 안팎. 늦깎이면 시험장에서 한 줄 반응. 아저씨 말투 동료의 "젊은 친구"는 내가 더 어릴 때만.
const AGE_BANDS = [
  // to: 이 나이까지(포함). mods 는 Game.mod 에 더해지는 비율(0.1 = +10%). train = 수련·성장 속도
  { to: 19, name: '소년기', d: '빨리 크지만 몸이 아직 덜 여물었다', mods: { train: 0.15, spd: 0.05, hp: -0.06, atk: -0.05 } },
  { to: 24, name: '청년기', d: '성장이 빠르고 몸놀림이 가볍다', mods: { train: 0.08, spd: 0.03 } },
  { to: 30, name: '전성기', d: '몸과 경험이 가장 고르게 맞물린 때', mods: { hp: 0.03, atk: 0.03 } },
  { to: 35, name: '장년기', d: '단단하고 노련하지만 성장은 조금 더디다', mods: { hp: 0.06, def: 0.06, mp: 0.05, train: -0.06, spd: -0.03 } },
  { to: 45, name: '중년기', d: '버티는 힘과 에테르 운용은 깊지만 몸이 무거워진다', mods: { def: 0.08, mp: 0.1, train: -0.12, spd: -0.06, atk: -0.03 } },
  { to: 999, name: '노년기', d: '에테르는 깊지만 몸이 따라 주지 않는다', mods: { mp: 0.12, train: -0.2, spd: -0.12, hp: -0.08, atk: -0.06 } },
];
const ageBand = (years) => AGE_BANDS.find((b) => years <= b.to) || AGE_BANDS[AGE_BANDS.length - 1];
const AGE_MOD_NAME = { train: '성장', hp: '체력', mp: '마나', atk: '공격', def: '방어', spd: '속도' };
const ageBandText = (b) => Object.entries(b.mods).map(([k, v]) => `${AGE_MOD_NAME[k] || k} ${v > 0 ? '+' : ''}${Math.round(v * 100)}%`).join(' · ');
// 우리말 나이: 32 → '서른둘', 20 → '스물'. unit=true 면 '살' 앞 꼴(스무·한·두·세·네)
function ageKo(n, unit) {
  const T = ['', '열', '스물', '서른', '마흔', '쉰', '예순'], U = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
  const UU = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
  const t = Math.floor(n / 10), u = n % 10;
  if (unit && u === 0 && t === 2) return '스무';
  return (T[t] || '') + (unit ? UU[u] : U[u]);
}

{
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const jong = (w) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; };
  // 출신별 나이 범위
  const BG_RANGE = { student: [19, 25], soldier: [21, 30], orphan: [18, 21], chaebol: [20, 30] };
  const DEFAULT = [17, 35];
  // 첫 장면이 나이를 좁히는 경우 [최소, 최대]
  const SCENE_RANGE = {
    orphan_4: [19, 19],   // "열아홉 살. 보육원을 떠나는 날"
    orphan_8: [18, 19],   // 아직 보육원에 있다
    student_3: [21, 25],  // 졸업 전시
    student_5: [22, 25],  // 복학생
    idle_1: [24, 35],     // 취준 3년 차
    idle_3: [20, 35],     // 공시생
    idle_4: [23, 35],     // 퇴사 첫 주
    idle_8: [28, 35],     // 고등학교 동창회(반장은 C급 헌터)
  };
  // 갈래에 들어서면 나이를 끌어올리는 경우 (늦깎이 각성)
  const ARC_MIN = [[/^bloom_/, 26]];

  const pickAge = (bg, sceneId) => {
    let [lo, hi] = BG_RANGE[bg] || DEFAULT;
    const r = SCENE_RANGE[sceneId]; if (r) { lo = Math.max(lo, r[0]); hi = Math.min(hi, r[1]); if (lo > hi) [lo, hi] = r; }
    return rint(lo, hi);
  };

  // ----- 소꿉친구: 베테랑 헌터일 수도 / 직업은 나이에 맞게 -----
  const RANK_KEY = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
  const vetRank = (years) => (years >= 13 ? 4 : years >= 8 ? 3 : years >= 4 ? 2 : 1); // 1~3년 E · 4~7 D · 8~12 C · 13+ B
  const OLD_JOB = { '간호학과 학생': '종합병원 간호사', '공무원 준비생': '구청 공무원', '게임 회사 QA': '게임 회사 팀장', '배달 라이더': '배달 대행 사장', '편의점 점장 대행': '편의점 점장' };
  const setupFriend = (s) => {
    const f = s.friend; if (!f) return;
    f.civJob ??= f.job;
    if (s.age >= 27 && OLD_JOB[f.civJob]) f.civJob = OLD_JOB[f.civJob];
    f.job = f.civJob; f.vet = null;
    const awakenAt = rint(16, 20); const years = s.age - awakenAt;
    if (years >= 1 && Math.random() < Math.min(0.55, years * 0.07)) {
      const rank = vetRank(years);
      f.vet = { years, rank };
      f.job = `${years}년 차 ${RANK_KEY[rank]}급 헌터`;
    }
  };
  // 친구가 아직 일반인이어야 하는 갈래(먼저 각성하는 친구, 각성 약에 혹하는 친구)에 들어서면 베테랑 설정을 거둔다
  const CIVIL_ARCS = /^(friend|drug)_/;

  const fixScene = (s) => {
    if (!s || !s.bg) return;
    s.age = pickAge(s.bg, s.id);
    setupFriend(s);
  };
  if (typeof UI !== 'undefined') {
    const baseHandle = UI.handle;
    UI.handle = function (act, v) {
      const r = baseHandle.call(this, act, v);
      try { if ((act === 'ps-start' || act === 'pro-restart') && this.pro && this.pro.bg) { fixScene(this.pro); if (act === 'pro-restart') this.renderPrologue(); else this.render(); } } catch (e) { /* 무시 */ }
      return r;
    };
    // 지나간 장면 기록 + 갈래에 따른 나이·친구 보정
    const baseChoose = UI.proChoose;
    UI.proChoose = function (i) {
      const s = this.pro; if (s) { s.visited ||= []; if (s.id && !s.visited.includes(s.id)) s.visited.push(s.id); }
      try {
        const nx = s && PROLOGUE[s.id] && PROLOGUE[s.id].choices[i] && PROLOGUE[s.id].choices[i].next;
        if (nx && s.friend && s.friend.vet && CIVIL_ARCS.test(nx)) { s.friend.vet = null; s.friend.job = s.friend.civJob; }
        if (nx && s.age != null) for (const [re, min] of ARC_MIN) if (re.test(nx) && s.age < min) s.age = rint(min, Math.max(min, 35));
      } catch (e) { /* 무시 */ }
      const r = baseChoose.call(this, i);
      try { const s2 = this.pro; if (s2 && s2.id && !s2.visited.includes(s2.id)) s2.visited.push(s2.id); } catch (e) { /* 무시 */ }
      return r;
    };
    // 프롤로그 글의 숫자 나이를 실제 나이로
    const baseFill = UI.proFill;
    UI.proFill = function (t) {
      const s = this.pro; let x = String(t ?? '');
      try {
        if (s && s.age != null) {
          const a = s.age; const w = ageKo(a);
          if (s.friend && s.friend.vet) x = x.replace(/\{friendJob\} 유니폼/g, '헌터 전투복');
          x = x.replace(/서른둘/g, w)
            .replace(/열아홉 살/g, `${ageKo(a, true)} 살`)
            .replace(/만 스물다섯/g, `만 ${w}`)
            .replace(/서른이 넘은 어느/g, `${w}${jong(w) ? '이' : '가'} 된 어느`)
            .replace(/"학생도 이번에 등록했지\?/g, a >= 24 ? '"그쪽도 이번에 등록했지?' : '"학생도 이번에 등록했지?');
        }
      } catch (e) { /* 무시 */ }
      return baseFill.call(this, x);
    };
  }

  const GP = Game.prototype;
  // 새 게임: 프롤로그에서 정한 나이(없으면 무작위)
  const baseNew = GP.newGame;
  GP.newGame = function (...a) {
    const r = baseNew.apply(this, a);
    try {
      const p = this.player; if (!p) return r;
      const pr = typeof UI !== 'undefined' ? UI.pro : null;
      const s = pr && pr.result && pr.name === p.name && pr.bg === p.bg ? pr : null;
      const old = Math.floor(p.ageMonths / 12);
      const extra = p.bg === 'returnee' ? 84 : 0; // 귀환자는 이계에서 보낸 7년이 더해진다 (js/origin.js)
      const years = s && s.age != null ? s.age : pickAge(p.bg, null);
      p.ageMonths = years * 12 + rint(0, 11) + extra;
      p.startAge = this.ageYears();
      for (const e of p.lifeEvents || []) if (e.age === old) e.age = this.ageYears(); // 이미 적힌 시작 기록 나이도 맞춘다
      this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 프롤로그 끝: 베테랑 친구 반영
  if (typeof UI !== 'undefined' && UI.beginFromPrologue) {
    const baseBegin = UI.beginFromPrologue;
    UI.beginFromPrologue = function (...a) {
      const s = this.pro; const fr = s && s.friend; const vet = fr && fr.vet && !(s.flags || {}).friend_awakened ? fr.vet : null;
      const r = baseBegin.apply(this, a);
      try {
        const f = fr && G.npcs.find((n) => n.friendhood && n.name === fr.name);
        if (f && vet) {
          f.rankIdx = vet.rank; f.stage = rint(0, 2); f.job = fr.job; f.vetYears = vet.years;
          f.relation = Math.min(95, f.relation + 5);
          const L = G.player.lifeEvents; const last = L && L[L.length - 1];
          if (last && last.text.includes(f.name)) last.text = `각성했다. ${vet.years}년 차 ${RANK_KEY[vet.rank]}급 헌터인 소꿉친구 ${f.name}이(가) 곁에 있었다.`;
          const dim = [...document.querySelectorAll('#modal-box .dim')].find((e) => e.textContent.includes(f.name));
          if (dim) dim.innerHTML = fixJosa(`소꿉친구 ${f.name}은(는) ${vet.years}년 차 ${RANK_KEY[vet.rank]}급 헌터입니다. ${G.region().name}에 있고, 인물 창에서 만날 수 있습니다.`);
          G.save();
        }
      } catch (e) { /* 무시 */ }
      return r;
    };
  }

  // 시험 동기는 대부분 스무 살 안팎
  if (typeof UI !== 'undefined' && UI.makeExamParty) {
    const baseParty = UI.makeExamParty;
    UI.makeExamParty = function (...a) {
      const ids = baseParty.apply(this, a);
      try { for (const id of ids || []) { const n = G.npcById(id); if (n) n.ageMonths = rint(18, 24) * 12 + rint(0, 11); } } catch (e) { /* 무시 */ }
      return ids;
    };
  }
  // 시험장 첫 줄: 늦깎이면 한 줄 반응
  if (typeof UI !== 'undefined' && UI.talk) {
    const baseTalk = UI.talk;
    UI.talk = function (lines, ...a) {
      try {
        const y = G.player && G.ageYears();
        const l0 = Array.isArray(lines) && lines[0];
        if (y >= 26 && l0 && typeof l0.narr === 'string' && l0.narr.includes('오늘 처음 각성한 사람들') && !l0.narr.includes('스무 살 안팎')) {
          lines = [{ ...l0, narr: `${l0.narr} 대부분 스무 살 안팎인 대기실에서, ${ageKo(y, true)} 살은 혼자다. 몇몇이 힐끔 돌아본다.` }, ...lines.slice(1)];
        }
      } catch (e) { /* 무시 */ }
      return baseTalk.call(this, lines, ...a);
    };
  }
  // 아저씨 말투 동료의 "젊은 친구"·"젊은 피"는 내가 그 사람보다 어릴 때만
  if (GP.personaLine) {
    const baseLine = GP.personaLine;
    GP.personaLine = function (n, ...a) {
      let s = baseLine.call(this, n, ...a);
      try {
        if (typeof s === 'string' && n && n.ageMonths != null && this.player && this.player.ageMonths >= n.ageMonths - 36) {
          s = s.replace(/젊은 친구, /g, '').replace(/젊은 피가 들어왔네/g, '새 식구가 들어왔네');
        }
      } catch (e) { /* 무시 */ }
      return s;
    };
  }

  // 나이 구간 능력치
  const baseMod = GP.mod;
  GP.mod = function (key) {
    let v = baseMod.call(this, key);
    try { const p = this.player; if (p && p.ageMonths != null) v += ageBand(Math.floor(p.ageMonths / 12)).mods[key] || 0; } catch (e) { /* 무시 */ }
    return v;
  };
  // 생일로 구간이 바뀌면 능력치를 다시 계산한다
  if (GP.advanceMonth) {
    const baseAdv = GP.advanceMonth;
    GP.advanceMonth = function (...a) {
      const p = this.player; const before = p ? ageBand(Math.floor(p.ageMonths / 12)) : null;
      const r = baseAdv.apply(this, a);
      try { if (p && this.player === p && ageBand(Math.floor(p.ageMonths / 12)) !== before) { this.recalc(); this.log(`${this.ageYears()}세, ${ageBand(this.ageYears()).name}에 들어섰다. ${ageBandText(ageBand(this.ageYears()))}`, 'info'); } } catch (e) { /* 무시 */ }
      return r;
    };
  }

  // 인물 창: 나이 옆에 구간과 효과
  if (typeof UI !== 'undefined' && UI.charHtml) {
    const baseChar = UI.charHtml;
    UI.charHtml = function (...a) {
      let h = baseChar.apply(this, a);
      try {
        const y = G.ageYears(); const b = ageBand(y);
        h = h.replace(`${y}세 · `, `${y}세(${b.name}) · `);
        h = h.replace('</h3>', `</h3><div class="small dim age-band" title="${b.d}">나이 · ${b.name}: ${ageBandText(b)}</div>`);
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
}
