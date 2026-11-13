// ===== 게이트 크로니클: 관계 깊이 (대화 주제 · 취향 선물 · 먼저 다가가기 · 추억) =====
// 관계를 "매달 말 걸고 돈 주기"에서 사람을 알아 가는 과정으로 바꾼다.
// - 대화: 주제 3개 중 하나. 사람마다 좋아하는 주제 2개·싫어하는 주제 1개. 몇 번 이야기하면 드러난다.
// - 선물: 크레딧 대신 물건. 사람마다 좋아하는 것 2개·싫어하는 것 1개. 한 달에 한 번.
// - 관계 60 이상이면 플레이어가 먼저 고백·청혼·사제 요청을 할 수 있다. 거절당하면 어색해진다.
// - 함께한 일이 인물 카드에 "추억"으로 남는다.

const TALK_TOPICS = {
  gate: { name: '게이트 이야기', like: ['"지난주 들어간 게이트, 보스 패턴이 진짜 이상했거든. 들어 볼래?" 한참을 신나게 떠들었다.', '"게이트 안 공기 냄새, 넌 기억나? 난 그게 이상하게 좋더라."', '둘이 지도 위에 손가락을 짚어 가며 공략 동선을 그렸다.'], meh: ['"게이트야 뭐, 일이지." 이야기가 금방 끊겼다.', '고개를 끄덕이며 들었지만 다른 생각을 하는 눈치였다.'], hate: ['"쉬는 날까지 게이트 얘기야?" 표정이 굳었다.', '"그 얘긴 그만하자. 요즘 꿈에도 나와."'] },
  worry: { name: '고민 상담', like: ['처음으로 속 이야기를 꺼냈다. 다 듣고 나서 "고마워, 들어 줘서"라고 했다.', '"사실 요즘 좀 힘들었어." 둘 사이에 긴 이야기가 오갔다.', '고민을 털어놓자 진지하게 들어 주고, 자기 이야기도 꺼냈다.'], meh: ['"음, 그렇구나." 성의는 있었지만 깊이 들어가진 않았다.', '이야기를 들어 주긴 했지만 조금 어색했다.'], hate: ['"그런 얘기 나한테 하지 마." 선을 그었다.', '"감정 얘기는 질색이야." 자리를 뜨려 했다.'] },
  joke: { name: '가벼운 농담', like: ['배를 잡고 웃었다. "너 이런 사람이었어?"', '시답잖은 농담에 둘이 한참을 웃었다. 오랜만에 가벼운 하루였다.', '"아, 그 얘기 또 해 줘." 눈물까지 닦았다.'], meh: ['피식 웃고 말았다.', '"…그래, 웃기네." 반응이 미지근했다.'], hate: ['"재미없어." 정색했다.', '"지금 장난칠 기분 아니야."'] },
  family: { name: '가족 이야기', like: ['휴대폰 사진첩을 넘기며 가족 이야기를 한참 했다. 표정이 부드러워졌다.', '"우리 엄마가 말이야…" 처음 듣는 이야기가 이어졌다.', '어릴 적 이야기를 주고받다 보니 시간 가는 줄 몰랐다.'], meh: ['"가족? 뭐, 다들 잘 지내." 짧게 끝났다.', '예의 바르게 들었지만 자기 이야기는 하지 않았다.'], hate: ['"그 얘긴 안 하고 싶어." 눈빛이 어두워졌다.', '대답 대신 말없이 술잔만 비웠다.'] },
  rumor: { name: '길드 소문', like: ['"그거 들었어? 그 길드 말이야…" 목소리를 낮추고 신나게 소문을 나눴다.', '서로 아는 소문을 맞춰 보다 보니 퍼즐이 맞춰지는 느낌이었다.', '"역시 너랑 얘기하면 정보가 돈다니까."'], meh: ['"소문은 소문일 뿐이지." 시큰둥했다.', '들어는 줬지만 별 관심 없어 보였다.'], hate: ['"남 얘기 하는 거 싫어해." 표정이 차가워졌다.', '"그런 데 쓸 시간에 수련이나 해."'] },
  training: { name: '수련법', like: ['에테르 순환법을 놓고 열띤 토론이 벌어졌다. 서로 하나씩 배웠다.', '"그 호흡법 어디서 배웠어? 나도 해 보자." 함께 자세를 잡아 봤다.', '수련 일지를 바꿔 보며 서로의 버릇을 짚어 줬다.'], meh: ['"그건 사람마다 다르지." 대화가 겉돌았다.', '고개는 끄덕였지만 듣는 둥 마는 둥이었다.'], hate: ['"가르치려 들지 마." 기분이 상한 듯했다.', '"내 방식이 있어."'] },
  money: { name: '돈 이야기', like: ['코어 시세, 장비 할부, 투자 이야기로 눈이 반짝였다.', '"너도 그 펀드 알아? 역시 말이 통하네."', '가계부 앱을 서로 보여 주며 웃었다.'], meh: ['"돈 얘기는 좀…" 어색하게 웃었다.', '건성으로 대답했다.'], hate: ['"결국 돈이야?" 실망한 눈치였다.', '"그런 얘기 하려고 불렀어?"'] },
  dream: { name: '꿈과 목표', like: ['"나중에 뭐 하고 싶어?" 서로의 꿈을 처음으로 털어놓았다.', '"언젠가 원초의 게이트를 닫는 거. 웃기지?" 웃지 않고 들어 줬다.', '은퇴하면 바닷가에 가게를 내겠다는 이야기에 둘 다 웃었다.'], meh: ['"꿈? 일단 살아남는 거지." 대화가 짧았다.', '조금 쑥스러워하며 화제를 돌렸다.'], hate: ['"꿈 같은 소리 하네." 냉소했다.', '"그런 거 생각할 여유 없어."'] },
};
const TOPIC_KEYS = Object.keys(TALK_TOPICS);
// 성격이 기울이는 주제 [좋아함, 좋아함, 싫어함]
const PERS_TOPIC = {
  kind: [['family', 'worry', 'joke', 'dream'], ['money', 'rumor']],
  warlike: [['gate', 'training', 'joke'], ['worry', 'family']],
  greedy: [['money', 'rumor', 'gate'], ['dream', 'worry']],
  just: [['dream', 'worry', 'training'], ['rumor', 'money']],
  cold: [['training', 'gate', 'money'], ['joke', 'family', 'worry']],
};
// 선물 분류
const GIFT_KINDS = {
  core: '괴수 코어', potion: '회복제', mana: '마나 앰플', crystal: '에테르 결정', equip: '장비', relic: '유물', drink: '포차 술 한 병',
};
const PERS_GIFT = {
  kind: [['potion', 'drink', 'mana'], ['equip']],
  warlike: [['equip', 'core', 'drink'], ['potion']],
  greedy: [['crystal', 'relic', 'core'], ['drink']],
  just: [['potion', 'equip', 'mana'], ['relic']],
  cold: [['relic', 'crystal', 'core'], ['drink']],
};
const GROUP_GIFT = { mage: 'mana', esper: 'crystal', summon: 'crystal', fighter: 'equip', guard: 'equip', shooter: 'equip', shadow: 'core', support: 'potion', east: 'drink' };
const SEASONS = ['겨울', '겨울', '봄', '봄', '봄', '여름', '여름', '여름', '가을', '가을', '가을', '겨울'];

Object.assign(Game.prototype, {
  // 사람마다 고정된 취향 (처음 볼 때 정해진다)
  npcTaste(n) {
    if (n.taste) return n.taste;
    const pt = PERS_TOPIC[n.personality] || PERS_TOPIC.kind; const pg = PERS_GIFT[n.personality] || PERS_GIFT.kind;
    const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = RNG.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const tLike = shuffle(pt[0]).slice(0, 2);
    const tHate = RNG.pick(pt[1].filter((k) => !tLike.includes(k)));
    const grp = classById(n.cls || 'swordsman').g;
    const gl = shuffle(pg[0]); const ex = GROUP_GIFT[grp];
    const gLike = ex ? [ex, ...gl.filter((k) => k !== ex)].slice(0, 2) : gl.slice(0, 2);
    const gHate = RNG.pick(pg[1].filter((k) => !gLike.includes(k)).concat(pg[1].some((k) => !gLike.includes(k)) ? [] : ['drink'].filter((k) => !gLike.includes(k)).concat(['relic'])));
    n.taste = { tLike, tHate, gLike, gHate, known: {} };
    return n.taste;
  },
  topicMood(n, k) { const t = this.npcTaste(n); return t.tLike.includes(k) ? 'like' : t.tHate === k ? 'hate' : 'meh'; },
  giftMood(n, k) { const t = this.npcTaste(n); return t.gLike.includes(k) ? 'like' : t.gHate === k ? 'hate' : 'meh'; },
  // 이번 달에 꺼낼 수 있는 주제 3개
  talkOptions(n) {
    const seed = (n.id * 31 + this.monthKey() * 7) >>> 0;
    const keys = [...TOPIC_KEYS]; const out = [];
    let s = seed; while (out.length < 3) { s = (s * 1103515245 + 12345) & 0x7fffffff; out.push(keys.splice(s % keys.length, 1)[0]); }
    return out;
  },
  talkTopic(id, k) {
    const n = this.npcById(id); const T = TALK_TOPICS[k]; if (!n || !n.alive || !T) return '';
    if (n.lastTalk === this.monthKey()) return `${n.name}은(는) 이미 이번 달에 충분히 이야기를 나눴다.`;
    n.lastTalk = this.monthKey(); n.met = true;
    const mood = this.topicMood(n, k); const t = this.npcTaste(n);
    const cnt = (t.known[k] = (t.known[k] || 0) + 1);
    let d = mood === 'like' ? this.relGain(n, RNG.int(8, 11)) : mood === 'meh' ? this.relGain(n, RNG.int(2, 5)) : -RNG.int(2, 4);
    this.changeRel(n, d, `${T.name}를 나눴다`);
    let line = `${n.name}: ${RNG.pick(T[mood])}`;
    if (mood === 'like' && cnt === 1 && k === 'worry') this.addMemory(n, '처음으로 속 이야기를 나눴다');
    if (mood === 'like' && cnt === 1 && k === 'dream') this.addMemory(n, '서로의 꿈을 이야기했다');
    if (cnt === 2 && mood !== 'meh') line += ` <span class="amber">(${n.name}은(는) ${T.name}${mood === 'like' ? '를 좋아한다' : '를 싫어한다'})</span>`;
    return `${line} (관계 ${d > 0 ? '+' : ''}${d})`;
  },
  // 줄 수 있는 물건 목록
  giftOptions(n) {
    const p = this.player; const out = [];
    for (let t = 7; t >= 0; t--) if (this.coreCount(t) > 0) { out.push({ key: 'core:' + t, kind: 'core', name: `${coreName(t)}`, val: t }); break; }
    for (const id of ['potion', 'mana', 'crystal']) if (p.items[id] > 0) out.push({ key: id, kind: id, name: CONSUMABLES.find((c) => c.id === id).name, val: 0 });
    const eq = [...p.inventory].sort((a, b) => (b.tier || 0) - (a.tier || 0))[0];
    if (eq) out.push({ key: 'equip:' + eq.uid, kind: 'equip', name: eq.name, val: eq.tier || 0 });
    if ((p.relics || []).length) { const r = p.relics[p.relics.length - 1]; out.push({ key: 'relic', kind: 'relic', name: relicById(r.id).name, val: r.grade + 2 }); }
    if (this.onCity()) out.push({ key: 'drink', kind: 'drink', name: `포차 술 한 병 (${fmt(this.drinkCost())} 크레딧)`, val: 0 });
    return out;
  },
  drinkCost() { return Math.round(40 * RANKS[this.player.rankIdx].mult ** 0.6); },
  giftItem(id, key) {
    const n = this.npcById(id); const p = this.player; if (!n || !n.alive) return '';
    if (n.lastGift === this.monthKey()) return `${n.name}에게는 이번 달에 이미 선물을 했다.`;
    const o = this.giftOptions(n).find((x) => x.key === key); if (!o) return '';
    // 물건 내주기
    if (o.kind === 'core') p.mats['c' + o.val] -= 1;
    else if (o.kind === 'equip') { const uid = key.slice(6); p.inventory = p.inventory.filter((it) => String(it.uid) !== uid); }
    else if (o.kind === 'relic') p.relics.pop();
    else if (o.kind === 'drink') { const c = this.drinkCost(); if (p.money < c) return '크레딧이 부족하다.'; p.money -= c; }
    else p.items[o.kind] -= 1;
    n.lastGift = this.monthKey(); n.met = true;
    const mood = this.giftMood(n, o.kind); const t = this.npcTaste(n);
    const bonus = o.val >= n.rankIdx ? 3 : 0;
    const d = mood === 'like' ? this.relGain(n, 14 + bonus) : mood === 'meh' ? this.relGain(n, 6 + Math.floor(bonus / 2)) : -2;
    this.changeRel(n, d, `${GIFT_KINDS[o.kind]}을(를) 선물받았다`);
    t.known['g_' + o.kind] = mood;
    const react = mood === 'like' ? RNG.pick(['"이거… 내가 갖고 싶던 거야. 어떻게 알았어?"', '눈이 커졌다. "진짜 줘도 돼?"', '"너 센스 있다." 몇 번이고 들여다봤다.'])
      : mood === 'meh' ? RNG.pick(['"고마워. 잘 쓸게."', '예의 바르게 받았다.']) : RNG.pick(['"…마음만 받을게." 곤란한 표정이었다.', '"이런 건 별로야." 받긴 했지만 서랍에 넣는 게 보였다.']);
    if (mood === 'like' && !t.firstLikedGift) { t.firstLikedGift = true; this.addMemory(n, `${GIFT_KINDS[o.kind]} 선물을 무척 좋아했다`); }
    return `${n.name}에게 ${o.name}을(를) 건넸다. ${react} (관계 ${d > 0 ? '+' : ''}${d})${mood !== 'meh' ? ` <span class="amber">(${GIFT_KINDS[o.kind]}${mood === 'like' ? '을(를) 좋아한다' : '은(는) 별로다'})</span>` : ''}`;
  },

  // ---------- 먼저 다가가기 ----------
  approachOptions(n) {
    const p = this.player; const out = [];
    if (!n || !n.alive || n.child || n.relation < 60 || n.merc || (n.awkward && this.monthKey() < n.awkward)) return out;
    const age = Math.abs(n.ageMonths / 12 - this.ageYears());
    const free = !n.partner && !n.spouse;
    if (!p.partner && !p.spouse && free && p.spouse !== n.id) out.push({ k: 'confess', name: '마음을 고백한다' });
    if (p.partner === n.id && !p.spouse && n.relation >= 75) out.push({ k: 'propose', name: '청혼한다' });
    if (!p.master && n.rankIdx >= p.rankIdx + 2) out.push({ k: 'master', name: '스승으로 모시고 싶다고 청한다' });
    if (p.rankIdx >= 2 && n.rankIdx < p.rankIdx && (p.disciples || []).length < 3 && !n.master && !(p.disciples || []).includes(n.id)) out.push({ k: 'disciple', name: '제자로 들이겠다고 제안한다' });
    return out.map((o) => ({ ...o, age }));
  },
  approachChance(n, k) {
    const pers = n.personality; const age = Math.abs(n.ageMonths / 12 - this.ageYears());
    let c = 0.3 + (n.relation - 60) / 40 * 0.55;
    if (pers === 'kind') c += 0.1; if (pers === 'cold') c -= 0.15;
    if ((k === 'confess' || k === 'propose') && age > 15) c -= 0.3;
    if (k === 'propose') c += 0.15;
    if (k === 'master' && n.rankIdx >= this.player.rankIdx + 4) c -= 0.15;
    return Math.max(0.05, Math.min(0.95, c));
  },
  approach(id, k) {
    const n = this.npcById(id); if (!n) return '';
    const opt = this.approachOptions(n).find((o) => o.k === k); if (!opt) return '';
    const ok = RNG.chance(this.approachChance(n, k));
    const c = { npc: n };
    if (!ok) {
      n.awkward = this.monthKey() + 3;
      this.changeRel(n, -6, k === 'confess' || k === 'propose' ? '고백을 거절했다' : '청을 거절했다');
      const no = { confess: `"…미안. 그런 쪽으로는 생각해 본 적이 없어." ${n.name}이(가) 눈을 피했다.`, propose: `"아직은… 조금만 더 시간을 줘." ${n.name}의 목소리가 떨렸다.`, master: `"난 사람을 가르칠 그릇이 못 돼." ${n.name}이(가) 고개를 저었다.`, disciple: `"고마운데, 난 내 방식대로 가 볼게." ${n.name}이(가) 웃으며 거절했다.` }[k];
      return `${no} (관계 -6, 석 달쯤은 서로 어색할 것이다)`;
    }
    const rq = { confess: REQUESTS.confess, propose: REQUESTS.propose, master: REQUESTS.master_offer, disciple: REQUESTS.disciple_ask }[k];
    const yes = { confess: `${n.name}이(가) 한참 말이 없다가 웃었다. "…나도. 먼저 말해 줘서 고마워."`, propose: `${n.name}이(가) 반지를 보고 울음을 터뜨렸다. "응. 응!"`, master: `"좋다. 대신 사부 소리는 들어야겠다." ${n.name}이(가) 술잔을 내밀었다.`, disciple: `${n.name}이(가) 무릎을 꿇었다. "잘 부탁드립니다, 사부님!"` }[k];
    this._approaching = true; let res; try { res = rq.onAccept(this, c); } finally { this._approaching = false; }
    if (k === 'master') this.addMemory(n, '내가 청해 스승으로 모셨다');
    if (k === 'disciple') this.addMemory(n, '내가 먼저 제자로 들였다');
    if (k === 'confess') this.addMemory(n, '내가 먼저 고백했고, 받아 주었다');
    if (k === 'propose') this.addMemory(n, '내 청혼을 받아 주었다');
    return `${yes} ${res}`;
  },

  // ---------- 추억 ----------
  addMemory(n, text) {
    if (!n) return;
    n.memories ??= [];
    const when = `${this.year}년 ${SEASONS[this.month - 1]}`;
    if (n.memories.some((m) => m.text === text)) return;
    n.memories.push({ when, text, where: this.region().name });
    if (n.memories.length > 8) n.memories.splice(1, 1); // 첫 추억은 남긴다
  },
});

// ---------- 연결 ----------
(() => {
  const P = Game.prototype;
  // 함께 게이트를 깼을 때 (첫 번째, 10번째, 50번째, 자기보다 높은 게이트)
  const baseFinishGate = P.finishGate;
  P.finishGate = function (gate, result, ...a) {
    const r = baseFinishGate.call(this, gate, result, ...a);
    if (result === 'clear') for (const n of this.party()) {
      n.togetherGates = (n.togetherGates || 0) + 1;
      const t = n.togetherGates; const where = `${regionById(gate.region).name} ${RANKS[gate.tier].key}급 게이트`;
      if (t === 1) this.addMemory(n, `${where}를 처음 함께 깼다`);
      else if (t === 10 || t === 50 || t === 100) this.addMemory(n, `함께 깬 게이트가 ${t}개가 됐다`);
      else if (gate.tier > this.player.rankIdx && !(n.memories || []).some((m) => m.text.includes('버거운'))) this.addMemory(n, `버거운 ${where}를 함께 넘었다`);
    }
    return r;
  };
  // 파티 합류, 결혼, 사제
  const baseRecruit = P.recruit;
  if (baseRecruit) P.recruit = function (id) { const r = baseRecruit.call(this, id); const n = this.npcById(id); if (n && n.isCompanion) this.addMemory(n, '파티에 합류했다'); return r; };
  const baseLife = P.lifeEvent;
  P.lifeEvent = function (text) {
    const r = baseLife.call(this, text);
    if (!this._approaching) for (const n of this.npcs) {
      if (!n.alive || !n.met || !text.includes(n.name)) continue;
      const m = /결혼했다/.test(text) ? '결혼했다' : /연인이 되었다/.test(text) ? '연인이 되었다' : /스승으로 모셨다/.test(text) ? '스승으로 모셨다' : /제자로 받아들였다/.test(text) ? '제자로 받아들였다' : /첫 파티를 꾸렸다|파티를 결성했다/.test(text) ? '첫 파티를 함께 꾸렸다' : null;
      if (m) this.addMemory(n, m);
    }
    return r;
  };
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); };
})();

// ---------- 화면 ----------
Object.assign(UI, {
  bondReturn() { const s = this.bondBack; this.bondBack = null; if (s) this.openSheet(s); else this.closeModal(); },
  showTalk(id) {
    const n = G.npcById(id); if (!n) return;
    if (n.lastTalk === G.monthKey()) return this.after(`${n.name}은(는) 이미 이번 달에 충분히 이야기를 나눴다.`);
    this.bondBack = this.sheet; const t = G.npcTaste(n);
    const opts = G.talkOptions(n);
    const hint = (k) => { const c = t.known[k] || 0; const m = G.topicMood(n, k); return c >= 2 && m !== 'meh' ? `<span class="small ${m === 'like' ? 'good' : 'bad'}">${m === 'like' ? '좋아함' : '싫어함'}</span>` : c ? '<span class="small dim">해 본 이야기</span>' : ''; };
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(n, 110)}<div><div class="eyebrow">대화 · ${G.fullDate()}</div><b>${n.name}</b><div class="small dim">관계 ${relationLabel(n.relation)} (${n.relation})</div></div></div>
      <p class="event-text">무슨 이야기를 꺼낼까?</p>
      <div class="cards">${opts.map((k) => `<button class="choice-btn" data-act="talk-topic" data-v="${id}:${k}">${TALK_TOPICS[k].name} ${hint(k)}</button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="bond-back">그만둔다</button></div>`), 'event-box');
  },
  showGift(id) {
    const n = G.npcById(id); if (!n) return;
    if (n.lastGift === G.monthKey()) return this.after(`${n.name}에게는 이번 달에 이미 선물을 했다.`);
    this.bondBack = this.sheet; const t = G.npcTaste(n);
    const opts = G.giftOptions(n);
    const hint = (k) => { const m = t.known['g_' + k]; return m === 'like' ? '<span class="small good">좋아함</span>' : m === 'hate' ? '<span class="small bad">별로</span>' : m ? '<span class="small dim">줘 본 것</span>' : ''; };
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(n, 110)}<div><div class="eyebrow">선물 · 한 달에 한 번</div><b>${n.name}</b><div class="small dim">관계 ${relationLabel(n.relation)} (${n.relation})</div></div></div>
      <p class="event-text">무엇을 건넬까? 사람마다 좋아하는 물건이 다르다.</p>
      <div class="cards">${opts.map((o) => `<button class="choice-btn" data-act="gift-item" data-v="${id}|${o.key}">${String(o.name).includes(GIFT_KINDS[o.kind]) ? o.name : `${GIFT_KINDS[o.kind]} · ${o.name}`} ${hint(o.kind)}</button>`).join('') || '<div class="dim">줄 만한 물건이 없다. 코어·회복제·장비·유물을 구하거나, 도시에서 술이라도 한 병 사 가자.</div>'}</div>
      <div class="row end"><button class="ghost" data-act="bond-back">그만둔다</button></div>`), 'event-box');
  },
  showApproach(id) {
    const n = G.npcById(id); if (!n) return;
    this.bondBack = this.sheet;
    const opts = G.approachOptions(n);
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(n, 110)}<div><div class="eyebrow">다가가기</div><b>${n.name}</b><div class="small dim">관계 ${relationLabel(n.relation)} (${n.relation})</div></div></div>
      <p class="event-text">오래 마음에 두었던 말을 꺼낸다. 받아 줄지는 ${n.name}의 마음이다. 거절당하면 한동안 어색해진다.</p>
      <div class="cards">${opts.map((o) => `<button class="choice-btn" data-act="approach" data-v="${id}:${o.k}">${o.name}</button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="bond-back">그만둔다</button></div>`), 'event-box');
  },
  bondResult(msg) {
    G.save(); this.renderGame();
    this.modal(`<p class="event-text">${fixJosa(msg)}</p><div class="row end"><button class="primary" data-act="bond-back">확인</button></div>`, 'event-box');
  },
});

(() => {
  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    let html = baseCard.call(this, n, here);
    if (!n) return html;
    // 선물 버튼: 크레딧 대신 물건
    if (here && n.alive && !n.child) html = html.replace(/<button class="sm" data-act="npc-gift" data-v="(\d+)">선물 <span class="num">[^<]*<\/span><\/button>/, (m, v) => `<button class="sm" data-act="gift-open" data-v="${v}" ${n.lastGift === G.monthKey() ? 'disabled' : ''}>선물</button>`);
    if (here && n.alive && !n.child) html = html.replace(/data-act="npc-talk" data-v="(\d+)"/, 'data-act="talk-open" data-v="$1"');
    // 먼저 다가가기
    if (here && G.approachOptions(n).length) html = html.replace('<div class="row npc-btns">', `<div class="row npc-btns"><button class="sm primary" data-act="approach-open" data-v="${n.id}">다가가기</button>`);
    // 알게 된 취향
    const t = n.taste; const know = [];
    if (t && n.met) {
      for (const k of TOPIC_KEYS) if ((t.known[k] || 0) >= 2) { const m = G.topicMood(n, k); if (m !== 'meh') know.push(`${TALK_TOPICS[k].name} ${m === 'like' ? '♥' : '✕'}`); }
      for (const k of Object.keys(GIFT_KINDS)) { const m = t.known['g_' + k]; if (m === 'like' || m === 'hate') know.push(`${GIFT_KINDS[k]} ${m === 'like' ? '♥' : '✕'}`); }
    }
    const mem = (n.memories || []).slice(-4).reverse();
    const extra = (know.length ? `<div class="small"><span class="dim">취향</span> ${know.join(' · ')}</div>` : '')
      + (mem.length ? `<div class="npc-mem"><div class="small dim">추억</div>${mem.map((m) => `<div class="small"><span class="dim">${m.when}</span> ${m.text}</div>`).join('')}</div>` : '');
    if (!extra) return html;
    const at = html.indexOf('<div class="rel-line">');
    return at >= 0 ? html.slice(0, at) + extra + html.slice(at) : html + extra;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'talk-open': return this.showTalk(+v);
      case 'gift-open': return this.showGift(+v);
      case 'approach-open': return this.showApproach(+v);
      case 'talk-topic': { const [id, k] = v.split(':'); return this.bondResult(G.talkTopic(+id, k)); }
      case 'gift-item': { const i = v.indexOf('|'); return this.bondResult(G.giftItem(+v.slice(0, i), v.slice(i + 1))); }
      case 'approach': { const [id, k] = v.split(':'); return this.bondResult(G.approach(+id, k)); }
      case 'bond-back': this.closeModal(); this.bondReturn(); return this.processQueue();
      default: return baseHandle.call(this, act, v);
    }
  };
})();
