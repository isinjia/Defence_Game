// 플레이어 나이 (사용자 요청)
// 1. 시작 나이: 전에는 누구나 19세로 고정이라, 프롤로그에서 "서른둘에 첫 각성이요?"라고 해 놓고
//    등록 신청서·인물 창에는 19세로 나왔다. 이제 17~35세에서 무작위로 정하되, 프롤로그 갈래가 나이를 못 박으면 그 나이로.
// 2. 나이 구간별 능력치 규칙: 어릴수록 빨리 크지만 몸이 덜 여물었고, 나이가 들수록 단단하고 노련하지만 성장이 더디다.
//    지금 나이로 계산하므로 게임 안에서 해가 지나면 구간이 바뀐다.
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

{
  const MIN = 17, MAX = 35;
  // 프롤로그 장면·첫 장면 선택(hook)이 나이를 못 박는 경우
  const SCENE_AGE = [
    [/^bloom_/, 32],        // 늦깎이 각성: "서른둘에 첫 각성이요?"
    [/^idle_8$/, 32],       // 서른둘의 동창회
    [/^orphan_4$/, 19],     // "열아홉 살. 보육원을 퇴소하는 날"
  ];
  const HOOK_AGE = { 'soldier_8:1': 31, 'chaebol_1:1': 25 }; // "서른이 넘은 어느 정기 검진 날", "만 스물다섯, 정기 검진"
  const BG_MIN = { soldier: 21 }; // 전역한 군인은 스물하나 아래일 수 없다

  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const decide = (s) => {
    let age = null;
    const seen = (s && s.visited) || [];
    for (const [re, y] of SCENE_AGE) if (seen.some((id) => re.test(id))) age = Math.max(age || 0, y);
    const hook = s && s.introId != null ? HOOK_AGE[`${s.introId}:${s.introPick}`] : null;
    if (hook) age = Math.max(age || 0, hook);
    if (age == null) age = rint(Math.max(MIN, BG_MIN[s && s.bg] || 0), MAX);
    return age;
  };

  // 지나간 프롤로그 장면 기록
  if (typeof UI !== 'undefined' && UI.proChoose) {
    const baseChoose = UI.proChoose;
    UI.proChoose = function (i) {
      const s = this.pro; if (s) { s.visited ||= []; if (s.id && !s.visited.includes(s.id)) s.visited.push(s.id); }
      const r = baseChoose.call(this, i);
      try { const s2 = this.pro; if (s2 && s2.id && !s2.visited.includes(s2.id)) s2.visited.push(s2.id); } catch (e) { /* 무시 */ }
      return r;
    };
  }

  const GP = Game.prototype;
  // 새 게임을 만들 때 바로 정한다 (그래야 소꿉친구·시험 동기 나이도 이 나이에 맞춰진다)
  const baseNew = GP.newGame;
  GP.newGame = function (...a) {
    const r = baseNew.apply(this, a);
    try {
      const p = this.player; if (!p) return r;
      const pr = typeof UI !== 'undefined' ? UI.pro : null;
      const s = pr && pr.result && pr.name === p.name && pr.bg === p.bg ? pr : { bg: p.bg };
      const old = Math.floor(p.ageMonths / 12);
      const extra = p.bg === 'returnee' ? 84 : 0; // 귀환자는 이계에서 보낸 7년이 더해진다 (js/origin.js)
      p.ageMonths = decide(s) * 12 + rint(0, 11) + extra;
      p.startAge = this.ageYears();
      for (const e of p.lifeEvents || []) if (e.age === old) e.age = this.ageYears(); // 이미 적힌 시작 기록 나이도 맞춘다
      this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
    } catch (e) { /* 무시 */ }
    return r;
  };

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
