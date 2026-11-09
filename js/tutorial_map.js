// ===== 게이트 크로니클: 헌터 자격 시험 - 층 지도 따라가기 =====
// 시험 게이트를 실제 게이트처럼 층 지도로 보여 주고, 차례대로 가르친다.
//  ① 리더가 지도 읽는 법을 설명하고 첫 칸을 직접 고른다 → 파티 표식이 그 칸으로 이동 → 사건 선택지
//  ② 다음 줄은 플레이어가 고른다 (전투 두 갈래) → 이동 → 전투 (조작 안내)
//  ③ 보물 상자냐 에테르 샘이냐 플레이어가 고른다 → 이동 → 사건
//  ④ 보스 칸으로 이동 → 보스 전투

const EXAM_MAP = [
  [{ t: 'event', node: 'fork', x: 0.3, next: [0, 1] }, { t: 'treasure', node: null, x: 0.72, next: [1] }],
  [{ t: 'fight', x: 0.22, next: [0, 1] }, { t: 'fight', x: 0.7, next: [0, 1] }],
  [{ t: 'event', node: 'chest', x: 0.3, next: [0] }, { t: 'rest', node: 'spring', x: 0.72, next: [0] }],
  [{ t: 'boss', x: 0.5, next: [] }],
];

Object.assign(UI, {
  examMapLeadName() { const L = this.examLeader(); return L ? `선임 ${L.name} · 리더` : '리더'; },
  examMapSay(key) {
    const L = this.examLeader(); const pers = L ? L.personality : 'just';
    const T = {
      intro: { just: '게이트 안은 이렇게 층 지도로 보인다. 아래에서 위로 올라간다. 칸마다 전투, 사건, 휴식, 보물이 있고 맨 위 왕관이 보스다. 선으로 이어진 칸으로만 갈 수 있다. 처음 한 칸은 내가 고른다. 잘 봐 둬.', kind: '게이트 안은 이렇게 층 지도로 보여요. 아래에서 위로 올라가요. 칸마다 전투, 사건, 휴식, 보물이 있고, 맨 위 왕관이 보스예요. 선으로 이어진 칸으로만 갈 수 있어요. 첫 칸은 제가 고를게요. 잘 봐 두세요.', cold: '층 지도다. 아래에서 위로. 선 따라서만 간다. 맨 위가 보스. 첫 칸은 내가 고른다. 봐 둬.' },
      pick1: { just: '보물 칸은 탐나지만, 왼쪽 사건 칸을 거쳐야 다음 갈림길 둘 다 갈 수 있다. 길을 넓게 남기는 쪽을 고른다.', kind: '보물이 욕심나지만, 왼쪽 사건 칸으로 가면 다음 줄 두 곳 다 갈 수 있어요. 길을 넓게 남겨 두는 거예요.', cold: '왼쪽. 다음 길이 둘 다 열린다.' },
      arrive: { just: '사건 칸이다. 무슨 일이 생길지 모른다. 고른 행동이 다음 전투를 바꾼다.', kind: '사건 칸이에요. 고르는 것에 따라 다음 전투가 달라져요.', cold: '사건이다. 골라.' },
      your1: { just: '다음 줄은 둘 다 전투다. 이번엔 네가 골라라. 빛나는 칸만 갈 수 있다.', kind: '다음은 둘 다 전투예요. 이번엔 직접 골라 보세요. 빛나는 칸을 누르면 돼요.', cold: '둘 다 전투. 네가 골라. 빛나는 칸.' },
      your2: { just: '왼쪽은 녹슨 보급 상자, 오른쪽은 에테르 샘이다. 상자는 보상이 있지만 함정일 수도 있고, 샘은 확실히 회복된다. 체력을 보고 골라.', kind: '왼쪽은 상자, 오른쪽은 회복 샘이에요. 상자는 보상이 있지만 함정일 수도 있어요. 지금 체력을 보고 골라요.', cold: '상자냐 샘이냐. 체력 보고 골라.' },
      boss: { just: '이제 보스 칸이다. 보스 앞에선 돌아갈 수 없다. 준비됐으면 눌러.', kind: '이제 보스예요. 들어가면 돌아올 수 없어요. 준비되면 눌러요.', cold: '보스. 들어가면 못 돌아온다.' },
    };
    return (T[key] || {})[pers] || (T[key] || {}).just || '';
  },

  // 시험 지도 시작
  examMapStart() {
    const ex = this.exam;
    ex.map = { rows: EXAM_MAP, pos: null, done: [], step: 'intro' };
    this.ctx = this.examGateCtx(0);
    this.renderExamMap();
  },
  examReach() {
    const m = this.exam.map;
    if (!m.pos) return m.rows[0].map((_, i) => [0, i]);
    const [r, i] = m.pos; return r >= m.rows.length - 1 ? [] : m.rows[r][i].next.map((j) => [r + 1, j]);
  },

  // 지도 그리기. opts.leaderPick: 리더가 고른 칸 강조, opts.move: [from, to] 표식 이동
  renderExamMap(opts = {}) {
    const ex = this.exam; const m = ex.map; const p = G.player;
    const step = m.step;
    const playerTurn = step === 'your1' || step === 'your2' || step === 'boss';
    const reach = playerTurn ? this.examReach().map(([r, i]) => r + ':' + i) : [];
    const ROWH = 78, H = m.rows.length * ROWH + 30;
    const y = (r) => H - 30 - (r + 0.5) * ROWH;
    const pt = (pos) => (pos ? { x: m.rows[pos[0]][pos[1]].x * 100, y: y(pos[0]) } : { x: 50, y: H - 14 });
    const lines = [];
    m.rows.forEach((row, r) => row.forEach((nd, i) => nd.next.forEach((j) => {
      const on = m.done.includes(r + ':' + i) && m.done.includes(r + 1 + ':' + j);
      lines.push(`<line x1="${nd.x * 100}" y1="${y(r)}" x2="${m.rows[r + 1][j].x * 100}" y2="${y(r + 1)}" class="${on ? 'on' : ''}"/>`);
    })));
    // 출발점에서 첫 줄로
    m.rows[0].forEach((nd) => lines.push(`<line x1="50" y1="${H - 14}" x2="${nd.x * 100}" y2="${y(0)}" class="${m.done.includes('0:' + m.rows[0].indexOf(nd)) ? 'on' : ''}"/>`));
    const nodes = [];
    m.rows.forEach((row, r) => row.forEach((nd, i) => {
      const k = r + ':' + i; const N = GNODE[nd.t];
      const lp = opts.leaderPick === k;
      const st = m.done.includes(k) ? 'done' : reach.includes(k) ? 'can' : lp ? 'lead' : (m.pos && r <= m.pos[0]) ? 'past' : '';
      nodes.push(`<button class="gnode ${nd.t} ${st}" style="left:${nd.x * 100}%;top:${y(r)}px;--c:${N.color}" ${st === 'can' && !opts.move ? `data-act="exm-node" data-v="${k}"` : 'disabled'}>
        <svg viewBox="0 0 24 24" width="${nd.t === 'boss' ? 30 : 22}" height="${nd.t === 'boss' ? 30 : 22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${N.svg}</svg>
        ${st === 'can' || lp ? `<span class="gnode-name">${lp ? '리더 선택' : N.name}</span>` : ''}</button>`);
    }));
    const from = pt(opts.move ? opts.move[0] : m.pos);
    const token = `<div class="gtoken" id="gtoken" style="left:${from.x}%;top:${from.y}px">${this.playerAvatar(26)}</div>`;
    const legend = ['fight', 'event', 'rest', 'treasure', 'boss'].map((t) => `<span class="gl" style="--c:${GNODE[t].color}"><i></i>${GNODE[t].name}</span>`).join('');
    const say = opts.say || this.examMapSay(step === 'pick1' ? 'pick1' : step);
    const stepNo = { intro: 1, pick1: 1, your1: 2, your2: 3, boss: 4 }[step] || 1;
    this.modal(`<div class="cb-head"><h3>헌터 자격 시험 · 훈련용 게이트</h3><span class="tag">탐색 안내 ${stepNo}/4</span></div>
      <div class="coach lead-say"><span class="eyebrow">${this.examMapLeadName()}</span><div>${say}</div></div>
      <div class="gmap-stat row between small"><span>체력 <b class="num">${Math.round(p.hp)}/${p.maxHp}</b> · 정신력 <b class="num">${Math.round(p.mp)}/${p.maxMp}</b></span></div>
      <div class="gmap-legend">${legend}</div>
      <div class="gmap exam-gmap" style="height:${H}px"><svg class="gmap-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines.join('')}</svg>${nodes.join('')}${token}</div>
      ${step === 'intro' && !opts.leaderPick && !opts.move ? '<div class="row end"><button class="primary" data-act="exm-watch">리더를 따라간다</button></div>' : ''}
      ${playerTurn && !opts.move ? '<div class="small amber">빛나는 칸을 눌러 이동하세요.</div>' : ''}`, 'combat-box gmap-box');
    if (opts.move) {
      const to = pt(opts.move[1]);
      const tk = document.getElementById('gtoken');
      requestAnimationFrame(() => requestAnimationFrame(() => { if (tk) { tk.style.left = to.x + '%'; tk.style.top = to.y + 'px'; } }));
    }
    const box = document.querySelector('#modal .gmap'); if (box) box.scrollIntoView({ block: 'nearest' });
  },

  // 리더가 첫 칸을 고르는 장면 → 이동 → 사건
  examLeaderPick() {
    const m = this.exam.map; m.step = 'pick1';
    this.renderExamMap({ leaderPick: '0:0' });
    const ctx = this.ctx;
    this.examTimer(1600, ctx, () => this.examMove([0, 0]));
  },
  examTimer(ms, ctx, fn) {
    const fast = FX.reduced ? 0.5 : 1;
    setTimeout(() => { if (this.ctx === ctx && this.exam) fn(); }, ms * fast);
  },
  // 표식을 칸으로 옮긴 뒤 그 칸의 일을 연다
  examMove(to) {
    const m = this.exam.map; const from = m.pos;
    const k = to[0] + ':' + to[1];
    this.renderExamMap({ move: [from, to], say: '이동 중…', leaderPick: m.step === 'pick1' ? k : null });
    m.pos = to; m.done.push(k);
    const ctx = this.ctx;
    this.examTimer(1000, ctx, () => this.examOpen(to));
  },
  examOpen([r, i]) {
    const nd = this.exam.map.rows[r][i];
    const lead = this.examMapLeadName();
    if (nd.t === 'fight') return this.startExamFight(0);
    if (nd.t === 'boss') return this.startExamFight(1);
    const stage = r === 0 ? 0 : 1; // 첫 줄 사건은 첫 전투를, 셋째 줄은 보스 전투를 바꾼다
    this.ctx = this.examGateCtx(stage);
    const node = EXPLORE_NODES.find((n) => n.id === nd.node) || EXPLORE_NODES[0];
    const afterKey = r === 0 ? 'your1' : 'boss';
    this.showExplore(node, {
      lead: this.examMapSay('arrive'), leadName: lead,
      after: r === 0 ? this.leadSay('ex1after') : this.leadSay('ex2after'), goLabel: '지도로 돌아간다',
      then: () => { this.exam.map.step = afterKey; this.ctx = this.examGateCtx(stage); this.renderExamMap(); },
    });
  },
});

{
  // 기존 시험 흐름의 탐색 장면을 층 지도로 바꾼다
  const baseExplore = UI.examExplore;
  UI.examExplore = function (stage) {
    const ex = this.exam;
    if (!ex) return baseExplore.call(this, stage);
    if (stage === 0) return this.examMapStart();
    // 첫 전투가 끝났다 → 지도로 돌아와 상자/샘을 고른다
    if (ex.map) { ex.map.step = 'your2'; this.ctx = this.examGateCtx(1); return this.renderExamMap(); }
    return baseExplore.call(this, stage);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'exm-watch': return this.examLeaderPick();
      case 'exm-node': {
        const ex = this.exam; if (!ex || !ex.map) return;
        const [r, i] = v.split(':').map(Number);
        if (!this.examReach().some(([a, b]) => a === r && b === i)) return;
        return this.examMove([r, i]);
      }
    }
    return baseHandle.call(this, act, v);
  };
}
