// ===== 게이트 크로니클: 관계 변화 이유 기록 (영역 C) =====
// docs/NPC_사회_제안.md 층 5 "사건의 이유를 보여 주기". 관계가 움직일 때마다 이유를 n.mem에 남기고
// NPC 카드에 "최근 기억" 세 줄로 보여 준다. 예: "3월: 선물을 받았다 (+6)".

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  // 기억 남기기: 같은 달 같은 이유는 합친다
  GP.npcRemember = function (n, why, d = 0) {
    if (!n || !why) return;
    n.mem ??= [];
    const mk = this.monthKey();
    const last = n.mem[n.mem.length - 1];
    if (last && last.mk === mk && last.why === why) { last.d += d; return; }
    n.mem.push({ mk, date: `${this.year}.${this.month}`, why, d });
    if (n.mem.length > 6) n.mem.shift();
  };

  wrap('changeRel', function (base, n, d, why) {
    const before = n ? n.relation : 0;
    base.call(this, n, d);
    if (!n || this._relDiff) return;
    const real = n.relation - before;
    if (!real) return;
    const reason = why || this._relWhy;
    if (reason) this.npcRemember(n, reason, real);
    else if (Math.abs(real) >= 5) this.npcRemember(n, real > 0 ? '좋은 일이 있었다' : '서운한 일이 있었다', real);
  });

  // 행동별 이유
  const WHY = {
    talk: '대화를 나눴다', gift: '선물을 받았다', teach: '가르침을 청했다', teachDisciple: '지도를 받았다',
    recruit: '파티에 초대받았다', dismiss: '파티에서 빠지게 됐다', finishSpar: '대련을 했다', finishGate: '함께 게이트를 다녀왔다',
    finishMob: '함께 괴수를 토벌했다', drink: '포차에서 한잔했다', finishNpcQuest: '부탁을 들어줬다', hireMerc: '용병 계약을 맺었다',
    crewJoin: '같은 파티에 들어왔다', crewLeave: '파티를 떠났다',
  };
  for (const [fn, why] of Object.entries(WHY)) wrap(fn, function (base, ...a) {
    const prev = this._relWhy; this._relWhy = prev || why;
    try { return base.apply(this, a); } finally { this._relWhy = prev; }
  });

  // 관계를 직접 바꾸는 코드까지 잡기: 이유가 분명한 구간에서 전후 비교
  GP.relDiffRun = function (why, fn) {
    const snap = new Map(this.npcs.map((n) => [n.id, n.relation]));
    const prev = this._relDiff; this._relDiff = true;
    try { return fn(); } finally {
      this._relDiff = prev;
      for (const n of this.npcs) {
        const b = snap.get(n.id);
        if (b != null && n.relation !== b && (n.met || Math.abs(n.relation - b) >= 10)) this.npcRemember(n, why, n.relation - b);
      }
    }
  };
  wrap('finishDuel', function (base, n, won, ...a) { return this.relDiffRun(won ? `당신이 ${n.name}을(를) 베었다` : '생사결에서 이겼다', () => base.call(this, n, won, ...a)); });
}

if (typeof UI !== 'undefined') {
  const cut = (s, n = 24) => { const t = String(s).replace(/<[^>]+>/g, ''); return t.length > n ? t.slice(0, n) + '…' : t; };
  // 사건 선택지: 고른 선택지가 이유
  const baseChoice = UI.storyChoice;
  if (baseChoice) UI.storyChoice = function (i) {
    const cs = this.curStory; const ch = cs && cs.ev.choices[i];
    const why = ch ? `${cut(G.storyFill(ch.text, cs.c))}` : '사건';
    return G.relDiffRun(why, () => baseChoice.call(this, i));
  };
  // 부탁 응답, 파티 작전 회의
  for (const [k, why] of [['answerRequest', '부탁에 답했다'], ['answerCrewPlan', '파티 작전 회의']]) {
    const base = UI[k]; if (!base) continue;
    UI[k] = function (...a) { return G.relDiffRun(why, () => base.apply(this, a)); };
  }

  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    const html = baseCard.call(this, n, here);
    if (!n || !n.mem || !n.mem.length || !n.met) return html;
    const rows = n.mem.slice(-3).reverse().map((m) => `<div class="small"><span class="dim">${m.date}</span> ${m.why}${m.d ? ` <span class="${m.d > 0 ? 'good' : 'bad'}">(${m.d > 0 ? '+' : ''}${m.d})</span>` : ''}</div>`).join('');
    const box = `<div class="npc-mem"><div class="small dim">최근 기억</div>${rows}</div>`;
    const at = html.indexOf('<div class="rel-line">');
    return at >= 0 ? html.slice(0, at) + box + html.slice(at) : html;
  };
}
