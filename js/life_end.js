// ===== 게이트 크로니클: 월간 과제 · 협회 보험 · 은퇴 =====
// - 월간 과제: 매달 짧은 목표 3개. 회귀자·후원자 계약자에게는 "상태창"으로, 나머지에게는 "협회 월간 목표" 알림으로 온다.
//   완수하면 보상, 석 달 내리 하나도 안 하면 패널티(비치명 전투). 첫 해 수첩을 쓰는 동안에는 나오지 않는다.
// - 협회 보험: 매달 보험료를 내면 죽거나 은퇴할 때 쌓인 보험금이 자녀(계승자)에게 간다.
// - 은퇴: 50세 이상 또는 명성 300 이상. 교관·길드 고문·가게 주인·관리국 간부 중 하나를 골라 스스로 마침표를 찍는다.

const SYS_TASKS = [
  { id: 'train', name: (g) => '수련 1회', need: () => 1, cnt: 'train' },
  { id: 'kills', name: (g, n) => `괴수 ${n}마리 처치`, need: (g) => 6 + g.player.rankIdx * 2, rec: 'kills' },
  { id: 'gate', name: () => '게이트 1곳 공략', need: () => 1, rec: 'gates' },
  { id: 'bounty', name: () => '협회 의뢰 1건 완료', need: () => 1, cnt: 'bounty' },
  { id: 'talk', name: (g, n) => `아는 사람과 대화 ${n}번`, need: () => 2, cnt: 'talk' },
  { id: 'walk', name: (g, n) => `지도 위를 ${n}칸 걷기`, need: () => 15, cnt: 'walk' },
  { id: 'craft', name: () => '공방에서 무엇이든 1개 제작', need: () => 1, cnt: 'craft' },
  { id: 'city', name: () => '다른 도시 1곳 들르기', need: () => 1, cnt: 'city' },
];
const RETIRE_JOBS = [
  { id: 'instructor', name: '협회 교관', desc: '신입들의 실기 시험 리더가 된다. 언젠가 당신이 가르친 아이가 S급이 될지도 모른다.', ok: () => true },
  { id: 'advisor', name: '길드 고문', desc: '길드의 큰 결정마다 당신에게 먼저 묻는다.', ok: (g) => !!g.player.guild && g.player.guild !== 'kama' },
  { id: 'shop', name: '가게 주인', desc: '포차든 공방이든, 게이트 이야기를 듣고 싶은 헌터들이 모여든다.', ok: (g) => g.player.money >= 3000 * RANKS[g.player.rankIdx].mult ** 0.5 },
  { id: 'official', name: '관리국 간부', desc: '책상에 앉아 현장의 헌터들을 지킨다. 서류가 칼보다 무겁다.', ok: (g) => g.player.merit >= 150 || g.player.guild === 'kama' },
];

Object.assign(Game.prototype, {
  sysVoice() { const p = this.player; return p.regress || p.sponsor ? 'status' : 'kama'; },
  sysCount(k, d = 1) { const p = this.player; if (!p) return; p.sysCnt ??= {}; p.sysCnt[k] = (p.sysCnt[k] || 0) + d; },
  sysVal(t) { const p = this.player; return t.rec ? (p.record[t.rec] || 0) : ((p.sysCnt || {})[t.cnt] || 0); },
  sysActive() { const p = this.player; const nb = p.notebook; return !(nb && nb.i < NB_TASKS.length) && !!p.rankRevealed; },
  sysNewMonth() {
    const p = this.player; const mk = this.monthKey();
    const prev = p.sysTask;
    if (prev && prev.mk !== mk) {
      const done = prev.tasks.filter((t) => t.done).length;
      p.sysIgnored = done ? 0 : (p.sysIgnored || 0) + 1;
      if (p.sysIgnored >= 3) { p.sysIgnored = 0; this.queue.push({ type: 'story', id: this.sysVoice() === 'status' ? 'sys_penalty' : 'sys_penalty_kama' }); }
    }
    if (!this.sysActive()) { p.sysTask = null; return; }
    if (prev && prev.mk === mk) return;
    const pool = [...SYS_TASKS]; const tasks = [];
    while (tasks.length < 3 && pool.length) {
      const t = pool.splice(RNG.int(0, pool.length - 1), 1)[0];
      if (t.id === 'craft' && !this.player.visited.length) continue;
      const need = t.need(this);
      tasks.push({ id: t.id, need, base: this.sysVal(t), done: false });
    }
    p.sysTask = { mk, tasks, bonus: false };
  },
  sysCheck() {
    const p = this.player; const st = p && p.sysTask; if (!st || this.over) return;
    const status = this.sysVoice() === 'status';
    for (const t of st.tasks) {
      if (t.done) continue;
      const def = SYS_TASKS.find((x) => x.id === t.id); if (!def) continue;
      if (this.sysVal(def) - t.base >= t.need) {
        t.done = true;
        const r = this.gain({ ether: 15 + p.rankIdx * 6 });
        this.queue.push({ type: 'toast', text: fixJosa(`${status ? '[상태창] 과제 완료' : '협회 월간 목표 달성'}: ${def.name(this, t.need)}${r}`) });
      }
    }
    if (!st.bonus && st.tasks.every((t) => t.done)) {
      st.bonus = true;
      p.items.potion = (p.items.potion || 0) + 1;
      const r = this.gain(status ? { ether: 30 + p.rankIdx * 10 } : { merit: 6, money: 100 });
      this.queue.push({ type: 'toast', text: fixJosa(`${status ? '[상태창] 이달의 과제 전부 완료. 추가 보상' : '협회: 이달의 목표를 모두 달성했습니다'}${r} (응급 회복제 1개)`) });
      this.log(status ? '[상태창] 이달의 과제를 모두 끝냈다.' : '협회 월간 목표를 모두 달성했다.', 'good');
    }
  },

  // ---------- 보험 ----------
  insPremium() { return Math.round(25 * RANKS[this.player.rankIdx].mult ** 0.8); },
  insToggle() {
    const p = this.player; p.insurance ??= { on: false, paid: 0, months: 0 };
    p.insurance.on = !p.insurance.on;
    return p.insurance.on ? `협회 헌터 보험에 가입했다. 매달 ${fmt(this.insPremium())} 크레딧이 빠져나간다.` : '보험 납입을 멈췄다. 지금까지 쌓인 보험금은 남는다.';
  },
  insMonthly() {
    const p = this.player; const ins = p.insurance; if (!ins || !ins.on) return;
    const c = this.insPremium();
    if (p.money < c) { ins.on = false; this.log('보험료를 내지 못해 협회 보험이 정지됐다.', 'bad'); return; }
    p.money -= c; ins.paid += c; ins.months++;
  },
  insPayout() { const ins = this.player.insurance; if (!ins || !ins.paid) return 0; return Math.round(ins.paid * (1.5 + Math.min(1, ins.months / 120))); },

  // ---------- 은퇴 ----------
  canRetire() { const p = this.player; return !this.over && (this.ageYears() >= 50 || p.fame >= 300); },
  retire(jobId) {
    const job = RETIRE_JOBS.find((j) => j.id === jobId); if (!job || !this.canRetire() || !job.ok(this)) return '';
    const p = this.player;
    this.lifeEvent(`${this.ageYears()}세에 현역에서 물러나 ${job.name}이(가) 되었다.`);
    this.rumor(`${RANKS[p.rankIdx].key}급 ${p.name}, 은퇴 선언. "이제 ${job.name}(으)로 살겠다."`);
    this.gameOver(`${this.ageYears()}세, 스스로 현역을 내려놓고 ${job.name}의 길을 택했다.`);
    if (this.over) this.over.retired = job.id;
    return '';
  },
});

// ---------- 패널티 사건 ----------
S({ id: 'sys_penalty', trigger: 'system', text: '[경고] 과제 미수행 3회 누적.\n[패널티 구역으로 이동합니다.]\n\n눈앞이 하얘졌다가 돌아온다. 끝없는 모래 평원. 모래 속에서 무언가가 기어 나온다. 상태창이 깜빡인다. [생존하십시오.]',
  choices: [{ text: '버틴다', do: (g) => { g.storyFight({ title: '패널티 구역', mobs: { tier: g.player.rankIdx, n: 3, elem: 'spirit' }, win: { text: '[패널티 종료.] 원래 자리로 돌아왔다. 손이 떨렸다. 다음 달엔 과제를 하자.', gain: { ether: 20 } }, lose: { text: '[패널티 종료.] 정신을 차려 보니 원래 자리다. 온몸이 쑤신다.', gain: { injure: 1 } } }); return '모래가 발목을 붙잡았다.'; } }] });
S({ id: 'sys_penalty_kama', trigger: 'system', text: '협회에서 등기 우편이 왔다. "귀하는 최근 3개월간 활동 실적이 없어 \'실전 감각 재교육\' 대상자로 지정되었습니다. 불참 시 등급 재심사가 있을 수 있습니다."',
  choices: [
    { text: '재교육에 간다', do: (g) => { g.storyFight({ title: '협회 재교육 실습', spar: true, mobs: { tier: g.player.rankIdx, n: 2, human: true, name: '[교관] 협회 실습 교관' }, win: { text: '교관이 기록판에 통과 도장을 찍었다. "감은 살아 있네요."', gain: { merit: 3 } }, lose: { text: '"한 달 뒤 재실습입니다." 교관이 무표정하게 말했다.', gain: { merit: -3 } } }); return '협회 훈련장에 들어섰다.'; } },
    { text: '무시한다', do: (g) => '협회 기록에 경고가 한 줄 남았다.' + g.gain({ merit: -8, fame: -2 }) },
  ] });

// ---------- 연결 ----------
(() => {
  const P = Game.prototype;
  const cnt = (fn, key, ok) => { const base = P[fn]; if (!base) return; P[fn] = function (...a) { const r = base.apply(this, a); if (!ok || ok(r, this)) this.sysCount(key); return r; }; };
  cnt('train', 'train');
  cnt('payBounty', 'bounty');
  cnt('talkTopic', 'talk', (r) => typeof r === 'string' && /관계/.test(r));
  cnt('craft', 'craft', (r) => typeof r === 'string' && /만들었다/.test(r));
  cnt('walkStep', 'walk');
  const baseVisit = P.visitCity;
  P.visitCity = function (id) { const before = this.player.lastCity; const r = baseVisit.call(this, id); if (before && before !== id) this.sysCount('city'); this.player.lastCity = id; return r; };
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () { baseMonthly.call(this); this.insMonthly(); this.sysNewMonth(); };
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); const p = this.player; p.sysCnt ??= {}; p.sysTask ??= null; p.insurance ??= { on: false, paid: 0, months: 0 }; };
})();

(() => {
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (!this.modalOpen() && G.player && !G.over) { if (!G.player.sysTask && G.sysActive()) G.sysNewMonth(); G.sysCheck(); }
    return baseQueue.call(this);
  };
  // 의뢰 창: 이달의 과제, 보험
  const baseQuests = UI.questsHtml;
  UI.questsHtml = function () {
    const html = baseQuests.call(this);
    const p = G.player; const st = p.sysTask; let top = '';
    if (st) {
      const status = G.sysVoice() === 'status';
      const rows = st.tasks.map((t) => { const def = SYS_TASKS.find((x) => x.id === t.id); const v = Math.min(t.need, G.sysVal(def) - t.base); return `<div class="item-row ${t.done ? 'hl' : ''}"><div class="grow"><b>${t.done ? '✔' : '▸'} ${def.name(G, t.need)}</b> <span class="small dim num">${v}/${t.need}</span></div></div>`; }).join('');
      top = `<div class="panel"><h3>${status ? '상태창 · 이달의 과제' : '협회 월간 목표'}</h3><p class="dim small">${status ? '당신에게만 보이는 창. 다 하면 추가 보상, 석 달 내리 무시하면 패널티 구역으로 끌려간다.' : '협회 앱 알림. 다 하면 공적, 석 달 내리 실적이 없으면 재교육 대상이 된다.'}${p.sysIgnored ? ` <span class="bad">(연속 미수행 ${p.sysIgnored}개월)</span>` : ''}</p><div class="cards">${rows}</div></div>`;
    }
    const ins = p.insurance || { on: false, paid: 0 };
    const insHtml = `<div class="panel"><h3>협회 헌터 보험</h3><p class="dim small">매달 보험료를 내면, 죽거나 은퇴할 때 쌓인 보험금이 뒤를 잇는 자녀에게 지급된다. 오래 낼수록 더 많이 나온다.</p>
      <div class="item-row"><div class="grow"><b>${ins.on ? '가입 중' : '미가입'}</b><div class="small dim">월 ${fmt(G.insPremium())} 크레딧 · 낸 돈 ${fmt(ins.paid || 0)} · 예상 지급 ${fmt(G.insPayout())}</div></div><button class="sm ${ins.on ? 'ghost' : ''}" data-act="ins-toggle">${ins.on ? '납입 중지' : '가입'}</button></div></div>`;
    return top + html + insHtml;
  };
  // 헌터 탭: 은퇴
  const baseHunter = UI.hunterHtml;
  UI.hunterHtml = function () {
    const html = baseHunter.call(this);
    if (!G.canRetire()) return html + `<div class="panel"><h3>은퇴</h3><p class="dim small">50세가 넘거나 명성이 300을 넘으면 스스로 은퇴를 택할 수 있다.</p></div>`;
    return html + `<div class="panel"><h3>은퇴</h3><p class="dim small">수명이 다할 때까지 싸울 필요는 없다. 스스로 마침표를 찍고, 다음 삶(계승·회귀)으로 넘어간다.</p>
      <div class="cards">${RETIRE_JOBS.map((j) => `<div class="item-row"><div class="grow"><b>${j.name}</b><div class="small dim">${j.desc}</div></div><button class="sm" data-act="retire" data-v="${j.id}" ${j.ok(G) ? '' : 'disabled'}>은퇴</button></div>`).join('')}</div></div>`;
  };
  // 은퇴 엔딩 화면
  const baseOver = UI.showGameOver;
  UI.showGameOver = function () {
    baseOver.call(this);
    const o = G.over; const pay = G.insPayout();
    const h2 = $box.querySelector('h2');
    if (o && o.retired && h2) {
      const job = RETIRE_JOBS.find((j) => j.id === o.retired);
      h2.textContent = `헌터 ${G.player.name}, 은퇴하다`;
      const end = $box.querySelector('.ending'); if (end) end.classList.remove('dead-end');
      const p = $box.querySelector('.ending p'); if (p && job) p.insertAdjacentHTML('afterend', `<p class="small">${job.desc}</p>`);
    }
    if (pay) { const life = $box.querySelector('.sec-title'); if (life) life.insertAdjacentHTML('beforebegin', `<p class="small good">협회 보험금 ${fmt(pay)} 크레딧이 유족에게 지급된다. 뒤를 잇는 자녀가 있으면 그 자녀가 받는다.</p>`); }
  };
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) {
    const pay = G.insPayout();
    baseSucceed.call(this, id);
    const p = G.player;
    p.insurance = { on: false, paid: 0, months: 0 }; p.sysTask = null; p.sysIgnored = 0; p.sysCnt = {};
    if (pay) { p.money += pay; G.lifeEvent(`부모의 협회 보험금 ${fmt(pay)} 크레딧을 받았다.`); G.save(); }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'ins-toggle': return this.after(G.insToggle());
      case 'retire': { const j = RETIRE_JOBS.find((x) => x.id === v); if (!j) return; return this.modal(`<h3>${j.name}(으)로 은퇴</h3><p>${j.desc}</p><p class="small bad">은퇴하면 이 삶은 끝난다. 자녀가 있으면 뒤를 이을 수 있고, 회귀할 수도 있다.</p><div class="row end"><button class="ghost" data-act="modal-close">아직은</button><button class="danger" data-act="retire-go" data-v="${j.id}">은퇴한다</button></div>`); }
      case 'retire-go': { this.closeModal(); G.retire(v); this.renderGame(); return this.processQueue(); }
      default: return baseHandle.call(this, act, v);
    }
  };
})();
