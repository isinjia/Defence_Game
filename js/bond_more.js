// ===== 게이트 크로니클: 관계 깊이 2 (식고 틀어짐 · 단계 장면 · 관계도) — 함께하기는 사용자 결정으로 삭제 =====
// - 가까운 사이도 6개월 넘게 연락이 없으면 조금씩 식는다. "연락"으로 늦출 수 있다. 약속을 어기면 앙금이 남고, 사과로 푼다.
// - 관계 10·30·50·70에서 그 사람의 장면이 열린다. 장면을 보기 전엔 문턱을 넘지 못한다. 50·70 장면에서 관계의 방향이 갈린다.
// - 교류 창에서 그 사람 주변의 인연(배우자·연인·스승·제자·원수·친한 사람)이 보인다.

const BOND_T = [10, 30, 50, 70];

Object.assign(Game.prototype, {
  bondSeen(n) { if (n) n.lastSeen = this.monthKey(); },
  // ---------- 연락 (멀리 있어도) ----------
  canContact(n) { return n && n.alive && n.met && !n.child && n.relation >= 30 && n.region !== this.player.region && n.lastContact !== this.monthKey(); },
  contact(id) {
    const n = this.npcById(id); if (!this.canContact(n)) return '';
    n.lastContact = this.monthKey();
    n.lastSeen = Math.max(n.lastSeen || 0, this.monthKey() - 3);
    this.changeRel(n, 1, '연락을 주고받았다');
    return `${n.name}에게 안부 메시지를 보냈다. ${RNG.pick(['"오 살아 있었네! 조만간 밥 한번 먹자."', '답장으로 사진 한 장이 왔다. 그쪽 동네 노을이었다.', '"요즘 바빠? 몸 조심해." 짧지만 반가운 답이 왔다.', '한참 뒤에 이모티콘 하나가 왔다. 그 사람다웠다.'])}`;
  },
  // ---------- 식어 감 ----------
  bondMonthly() {
    const p = this.player; const mk = this.monthKey();
    if (!this.queue.some((q) => q.type === 'story' && /^bond_/.test(q.id))) {
      const w = this.npcs.find((n) => n.bondPending === 'wait' && n.alive);
      if (w) { w.bondPending = true; this.queue.push({ type: 'story', id: this.bondSceneId(w), npc: w.id }); }
    }
    for (const n of this.npcs) {
      if (!n.alive || !n.met || n.child) continue;
      if (n.isCompanion || p.spouse === n.id) { n.lastSeen = mk; continue; }
      n.lastSeen ??= mk;
      if (n.relation >= 50 && !n.family && mk - n.lastSeen > 6 && RNG.chance(0.7)) {
        const before = n.relation;
        n.relation = Math.max(45, n.relation - 1);
        if (before !== n.relation && !n.coolNote) { n.coolNote = true; this.npcRemember && this.npcRemember(n, '오래 연락이 없었다', -1); this.log(`${n.name}와(과) 연락이 뜸해졌다. 가끔 안부라도 전하자.`); }
      } else if (mk - n.lastSeen <= 6) n.coolNote = false;
    }
  },
  // ---------- 사과 ----------
  apologize(id) {
    const n = this.npcById(id); if (!n || !n.grudge) return '';
    const c = { kind: 0.8, just: 0.6, warlike: 0.5, greedy: 0.5, cold: 0.4 }[n.personality] ?? 0.5;
    if (RNG.chance(c + Math.max(0, n.relation) / 300)) {
      const why = n.grudge; n.grudge = null;
      this.changeRel(n, 8, '사과를 받아 주었다');
      return `"…${why === '부탁을 저버렸다' ? '그때 정말 서운했어' : '이제 됐어'}. 그래도 사과해 줘서 고마워." ${n.name}의 표정이 풀렸다. (관계 +8)`;
    }
    n.awkward = this.monthKey() + 2;
    return `${n.name}은(는) 대답 없이 돌아섰다. 아직은 때가 아닌 것 같다.`;
  },

  // ---------- 단계 장면 ----------
  bondSceneId(n) { const pers = PERS_BOND[n.personality] ? n.personality : 'kind'; return `bond_${pers}_${n.bondStage}`; },
  bondAdvance(n, path) {
    n.bondStage = Math.min(4, (n.bondStage || 0) + 1); n.bondPending = false;
    if (path) n.bondPath = path;
    this.bondSeen(n);
  },
});

// 성격별 단계 장면 [10, 30, 50, 70]
const PERS_BOND = {
  kind: [
    '{npc}이(가) 의뢰소 앞에서 당신을 불러 세운다. 손에 김밥 두 줄이 들려 있다. "아까 보니까 점심 못 먹은 것 같아서. 하나 남았거든."',
    '{npc}이(가) 동네 보육원 봉사를 같이 가자고 한다. 아이들이 각성자 언니·형을 보고 우르르 몰려든다. {npc}은(는) 아이들 이름을 하나하나 다 알고 있었다.',
    '밤늦게 {npc}에게서 전화가 온다. 목소리가 떨린다. "오늘 게이트에서… 구하지 못한 사람이 있었어. 나 이 일 계속해도 되는 걸까?"',
    '{npc}이(가) 낡은 수첩을 건넨다. 지금까지 만난 사람들의 이름과 생일이 빼곡하다. 마지막 장에 당신 이름이 있다. "너는 내가 꼭 지키고 싶은 사람 목록 맨 위야."',
  ],
  warlike: [
    '{npc}이(가) 당신 무기를 힐끔 본다. "그거 날 관리 엉망이네. 이리 줘 봐." 투덜대면서도 한참을 손질해 돌려준다.',
    '{npc}이(가) 새벽 훈련장에 당신을 끌고 간다. "내가 매일 하는 거. 따라올 수 있으면 따라와 봐." 해가 뜰 때쯤 둘 다 바닥에 뻗어 있었다.',
    '{npc}의 얼굴에 새 흉터가 있다. "B급 놈한테 졌어. 다들 위로하는데, 그딴 거 필요 없어." 잠시 침묵. "…너라면 어떻게 이겼을 것 같아?"',
    '{npc}이(가) 처음으로 진지한 얼굴로 말한다. "난 평생 싸울 상대만 찾았어. 근데 너랑은 싸우는 것보다 등을 맡기는 게 더 좋더라. 웃기지?"',
  ],
  greedy: [
    '{npc}이(가) 귓속말을 한다. "다음 주 코어 시세 오른다. 너만 알고 있어. 대신 나중에 하나 갚아."',
    '{npc}이(가) 장부를 보여 준다. 빚이 꽤 많다. "가족 병원비야. 그래서 돈돈 하는 거고. …이거 아무한테도 말한 적 없어."',
    '{npc}이(가) 큰 계약을 앞두고 망설인다. "상대가 수상해. 근데 돈이 너무 커. 너라면 어떡할래? 네 말대로 할게."',
    '{npc}이(가) 봉투를 내민다. 그동안 당신이 빌려준 돈, 밥값, 술값이 이자까지 정확히 들어 있다. "계산은 끝. 이제부터는 계산 없이 가자."',
  ],
  just: [
    '{npc}이(가) 길에서 불법 포획 업자를 붙잡고 있다. 당신을 보고 고개를 끄덕인다. "같이 협회까지 데려가 줄래? 혼자선 셋이 버거워서."',
    '{npc}이(가) 관리국 앞 1인 시위 중이다. 팻말: "비각성자 피해 보상 현실화". 지나가던 사람들이 수군댄다. "…같이 서 줄 필요는 없어. 그냥 봐 줘서 고마워."',
    '{npc}이(가) 고발장 초안을 보여 준다. 큰 길드의 비리다. "이걸 내면 나는 이 바닥에서 끝날 수도 있어. 그래도 내야겠지?"',
    '{npc}이(가) 칼을 거꾸로 쥐어 손잡이를 당신에게 내민다. 오래된 맹세의 몸짓이다. "네가 옳지 않은 길로 가면, 내가 막을게. 내가 그러면, 네가 막아 줘."',
  ],
  cold: [
    '{npc}이(가) 말없이 캔커피를 하나 놓고 간다. 뚜껑은 따여 있다. 나름의 배려인 것 같다.',
    '{npc}의 집 앞을 지나다 창문 너머로 그림을 그리는 모습을 본다. 다음 날 {npc}이(가) 먼저 말을 건다. "…봤어? 아무한테도 말하지 마."',
    '{npc}이(가) 처음으로 술에 취했다. "난 사람한테 기대면 그 사람이 죽더라. 그래서 혼자 다닌 거야." 그러고는 당신 어깨에 기대 잠들었다.',
    '{npc}이(가) 휴대폰을 내민다. 단축번호 1번에 당신 이름이 저장돼 있다. "…위급할 때 누구 부르냐고 물어보길래." 귀가 빨갰다.',
  ],
};
const BOND_PATHS = [
  { k: 'friend', text: '"무슨 일이 있어도 네 편이야. 친구로서."', res: '오래갈 우정이 시작됐다.' },
  { k: 'love', text: '말 대신 그 손을 잡아 준다', res: '둘 사이의 공기가 달라졌다.' },
  { k: 'mentor', text: '"같이 답을 찾아보자. 서로 배우면서."', res: '서로를 이끌어 주는 사이가 되었다.' },
  { k: 'rival', text: '"네 판단을 믿어. 그래도 너한테 지진 않을 거야."', res: '가장 가까운 경쟁자가 되었다.' },
];
for (const [pers, lines] of Object.entries(PERS_BOND)) {
  lines.forEach((text, st) => {
    const choices = st < 2
      ? [{ text: '고맙다고 웃는다', do: (g, c) => { if (c.npc) { g.bondAdvance(c.npc); g.addMemory(c.npc, ['처음으로 마음을 열어 주었다', '자기 일상에 나를 불러 주었다'][st]); } return '조금 더 가까워졌다.'; } },
        { text: '어색하게 고개만 끄덕인다', do: (g, c) => { if (c.npc) g.bondAdvance(c.npc); return '그래도 무언가 전해진 것 같았다.'; } }]
      : BOND_PATHS.map((b) => ({ text: b.text, when: (g, c) => b.k !== 'love' || (c.npc && !c.npc.spouse && !c.npc.partner && !g.player.spouse), do: (g, c) => {
        if (c.npc) { g.bondAdvance(c.npc, b.k); g.addMemory(c.npc, st === 2 ? '가장 힘든 이야기를 나에게 했다' : '평생의 약속을 나눴다'); if (b.k === 'rival') c.npc.rival = true; }
        return b.res; } }));
    S({ id: `bond_${pers}_${st}`, trigger: 'system', npc: 'here', text, choices });
  });
}

// ---------- 연결 ----------
(() => {
  const P = Game.prototype;
  // 단계 문턱: 장면을 보기 전엔 넘지 못한다
  const baseRel = P.changeRel;
  P.changeRel = function (n, d, why) {
    const before = n ? n.relation : 0;
    const r = baseRel.call(this, n, d, why);
    if (!n || d <= 0 || n.child || !n.met || !n.alive) return r;
    if (n.bondStage == null) n.bondStage = BOND_T.filter((t) => before >= t).length;
    const st = n.bondStage; if (st >= 4) return r;
    const cap = BOND_T[st];
    if (n.relation >= cap) {
      n.relation = Math.min(n.relation, cap);
      if (!n.bondPending) {
        // 한 번에 한 사람씩: 다른 인연 장면이 기다리고 있으면 다음 달로 미룬다
        if (this.queue.some((q) => q.type === 'story' && /^bond_/.test(q.id))) n.bondPending = 'wait';
        else { n.bondPending = true; this.queue.push({ type: 'story', id: this.bondSceneId(n), npc: n.id }); }
      }
    }
    return r;
  };
  // 만남 기록
  for (const fn of ['talkTopic', 'giftItem', 'approach', 'teach', 'recruit']) {
    const base = P[fn]; if (!base) continue;
    P[fn] = function (id, ...a) { const r = base.call(this, id, ...a); this.bondSeen(this.npcById(id)); return r; };
  }
  // 사랑의 길을 걸은 사이는 고백이 잘 받아들여진다
  const baseChance = P.approachChance;
  P.approachChance = function (n, k) { let c = baseChance.call(this, n, k); if ((k === 'confess' || k === 'propose') && n.bondPath === 'love') c += 0.2; if (k === 'master' && n.bondPath === 'mentor') c += 0.2; return Math.min(0.95, c); };
  // 사과는 관계와 상관없이
  const baseOpts = P.approachOptions;
  P.approachOptions = function (n) {
    const out = n && n.grudge && n.alive && !(n.awkward && this.monthKey() < n.awkward) ? [{ k: 'apologize', name: '그때 일을 사과한다' }] : [];
    return out.concat(baseOpts.call(this, n));
  };
  const baseApproach = P.approach;
  P.approach = function (id, k) { return k === 'apologize' ? this.apologize(id) : baseApproach.call(this, id, k); };
  // 약속을 어기면 앙금
  const baseExpire = P.expireQuests;
  if (baseExpire) P.expireQuests = function () {
    const before = (this.player.quests || []).filter((q) => q.kind === 'npc');
    const r = baseExpire.call(this);
    for (const q of before) if (!this.player.quests.includes(q) && q.status !== 'done') { const n = this.npcById(q.npc); if (n && n.alive) n.grudge = '부탁을 저버렸다'; }
    return r;
  };
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () { baseMonthly.call(this); this.bondMonthly(); };
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); const mk = this.monthKey(); for (const n of this.npcs) if (n.met) n.lastSeen ??= mk; };
})();

Object.assign(UI, {
  // 그 사람 주변의 인연 (아는 사람 위주)
  bondMapHtml(n) {
    const rows = []; const add = (id, label, cls) => { const m = typeof id === 'number' && id >= 0 ? G.npcById(id) : null; if (m) rows.push({ m, label, cls }); };
    const P = G.player;
    if (n.spouse === -1 || P.spouse === n.id) rows.push({ me: true, label: '배우자' });
    else if (n.partner === -1 || P.partner === n.id) rows.push({ me: true, label: '연인' });
    add(n.spouse, '배우자'); add(n.partner, '연인'); add(typeof n.master === 'number' ? n.master : null, '스승');
    for (const d of n.disciples || []) add(d, '제자');
    if (typeof n.nemesis === 'number') add(n.nemesis, '원수', 'bad');
    for (const pid of n.parents || []) add(pid, '부모');
    const links = Object.entries(n.links || {}).map(([id, v]) => [+id, v]).filter(([id, v]) => Math.abs(v) >= 40).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    for (const [id, v] of links.slice(0, 4)) { const m = G.npcById(id); if (m && m.met && !rows.some((r) => r.m === m)) rows.push({ m, label: v > 0 ? '친한 사이' : '사이 나쁨', cls: v > 0 ? '' : 'bad' }); }
    if (!rows.length) return '';
    return `<div class="panel sec"><div class="sec-title">${n.name}의 주변</div><div class="cards">${rows.map((r) => r.me ? `<div class="item-row">${this.playerAvatar(32)}<div class="grow"><b>나</b> <span class="tag amber">${r.label}</span></div></div>`
      : `<div class="item-row">${this.npcAvatar(r.m, 32)}<div class="grow"><b>${r.m.name}</b> <span class="tag ${r.cls || ''}">${r.label}</span><div class="small dim">${r.m.alive ? `${RANKS[r.m.rankIdx].key}급 · ${regionById(r.m.region).name}${r.m.met ? ` · 나와 ${relationLabel(r.m.relation)}` : ' · 소문으로 들은 사람'}` : '세상을 떠났다'}</div></div></div>`).join('')}</div></div>`;
  },
});

(() => {
  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    let html = baseCard.call(this, n, here);
    if (!n || !n.alive || n.child) return html;
    const btns = [];
    if (!here && G.canContact(n)) btns.push(`<button class="sm ghost" data-act="contact" data-v="${n.id}">연락</button>`);
    if (!here && n.grudge) btns.push(`<span class="small bad">앙금: ${n.grudge}</span>`);
    if (btns.length) {
      if (html.includes('<div class="row npc-btns">')) html = html.replace('<div class="row npc-btns">', `<div class="row npc-btns">${btns.join('')}`);
      else html = html.replace(/<\/div>\s*$/, `<div class="row npc-btns">${btns.join('')}</div></div>`);
    }
    // 단계 표시
    if (n.met && n.bondStage != null) {
      const path = { friend: '우정', love: '연정', mentor: '사제의 길', rival: '경쟁' }[n.bondPath] || '';
      const st = `<span class="small dim">인연 ${'●'.repeat(n.bondStage)}${'○'.repeat(4 - n.bondStage)}${path ? ` · ${path}` : ''}${n.bondPending ? ' · <span class="amber">이야기가 기다린다</span>' : ''}</span>`;
      html = html.replace('<div class="rel-line">', `<div class="rel-line">${st} `);
    }
    return html;
  };
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function () {
    const html = baseSheet.call(this);
    const name = this.sheet || '';
    if (!name.startsWith('npc:')) return html;
    const n = G.npcById(+name.slice(4)); if (!n) return html;
    return html + this.bondMapHtml(n);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'contact': return this.after(G.contact(+v));
      default: return baseHandle.call(this, act, v);
    }
  };
})();
