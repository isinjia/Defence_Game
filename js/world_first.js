// ===== 게이트 크로니클: 월드 퍼스트 공지 (영역 C) =====
// docs/헌터물_제안3.md 1. 세계 "최초" 목록. 플레이어든 NPC든 먼저 해낸 사람이 이름을 남긴다.
// 플레이어가 따면 전체 공지 창에서 이름 공개/익명을 고른다. 공개하면 명성·랭킹·영입 제안이 몰리지만 표적도 된다.
// 저장: world.firsts = { id: { who: 'player'|npcId|'anon', name, mk, date } }

const WORLD_FIRSTS = [
  { id: 'gen_s', name: '신세대 최초 S급', desc: '대붕괴 2세대 각성자 중 처음으로 S급에 올랐다', title: { name: '새 시대의 S', mods: { atk: 0.05, social: 0.1 } } },
  { id: 'ss', name: '국내 최초 SS급', desc: '이 나라에서 처음으로 SS급에 올랐다', title: { name: '전인미답', mods: { atk: 0.06, def: 0.06, hp: 0.06 } } },
  { id: 'red', name: '최초의 레드 게이트 공략', desc: '닫히지 않는 붉은 문을 처음으로 깨뜨렸다', title: { name: '붉은 문을 연 자', mods: { def: 0.06 } } },
  { id: 'solo_s', name: 'S급 게이트 최초 단독 공략', desc: '혼자서 S급 게이트를 닫았다', title: { name: '고독한 정점', mods: { atk: 0.07 } } },
  { id: 'tower10', name: '시련의 탑 최초 10층', desc: '시련의 탑 10층에 처음으로 올랐다', title: { name: '탑의 첫 발자국', mods: { spd: 0.04 } } },
  { id: 'tower20', name: '시련의 탑 최초 20층', desc: '시련의 탑 20층에 처음으로 올랐다', title: { name: '탑의 중턱', mods: { spd: 0.05, luck: 0.1 } } },
  { id: 'tower30', name: '시련의 탑 최초 30층', desc: '시련의 탑 30층에 처음으로 올랐다', title: { name: '탑의 정상', mods: { atk: 0.05, spd: 0.05 } } },
  { id: 'calamity', name: '지역 재앙 최초 저지', desc: '재앙급 게이트를 처음으로 막아 냈다', title: { name: '재앙을 꺾은 자', mods: { hp: 0.06, def: 0.04 } } },
  { id: 'named', name: '네임드 괴수 최초 토벌', desc: '이름 붙은 괴수를 처음으로 쓰러뜨렸다', title: { name: '이름을 지운 자', mods: { atk: 0.05, luck: 0.1 } } },
  { id: 'primordial', name: '원초의 게이트 최초 진입', desc: '한라산의 원초의 게이트에 처음으로 발을 들였다', title: { name: '원초를 본 자', mods: { mp: 0.08, train: 0.05 } } },
];
const firstById = (id) => WORLD_FIRSTS.find((f) => f.id === id);

// 유일 칭호 (플레이어가 공개·익명 상관없이 땄을 때만)
if (typeof TITLES !== 'undefined') for (const f of WORLD_FIRSTS) {
  TITLES.push({ id: 'wf_' + f.id, name: f.title.name, how: `월드 퍼스트: ${f.name}`, mods: f.title.mods, cond: (g) => !!(g.world && g.world.firsts && g.world.firsts[f.id] && (g.world.firsts[f.id].who === 'player' || g.world.firsts[f.id].who === 'anon')) });
}

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.firsts ??= {};
    this.world.startMk ??= this.monthKey();
    this.world.npcTower ??= 0;
    for (const r of Object.values(this.world.firsts)) if (r.who === 'pending') r.who = 'anon'; // 고르기 전에 저장·종료된 경우
  });

  GP.firstTaken = function (id) { return !!(this.world.firsts && this.world.firsts[id]); };

  // 플레이어 달성 → 공지 창 (이름 공개 선택)
  GP.claimFirst = function (id) {
    if (this.firstTaken(id)) return false;
    const f = firstById(id); const p = this.player;
    this.world.firsts[id] = { who: 'pending', name: p.name, mk: this.monthKey(), date: this.dateStr() };
    this.queue.unshift({ type: 'worldfirst', id });
    this.lifeEvent(`월드 퍼스트: ${f.name}`);
    return true;
  };
  GP.firstReveal = function (id, open) {
    const rec = this.world.firsts[id]; const f = firstById(id); const p = this.player;
    if (!rec || rec.who !== 'pending') return '';
    const lines = [];
    if (open) {
      rec.who = 'player';
      p.fame += 40; p.merit = (p.merit || 0) + 20;
      if (this.addRelic) lines.push(`독점 보상: ${this.addRelic(null, 3)}`);
      this.rumor(`[월드 퍼스트] ${f.name} — ${p.name}. ${f.desc}.`, { kind: 'worldfirst', score: 10, thread: 'wf:' + id });
      if (this.world) this.world.breaking = { text: `[월드 퍼스트] ${f.name} — ${p.name}`, mk: this.monthKey() };
      // 영입 제안과 시기
      for (const n of this.adults().filter((x) => x.arch === 'rival' || (x.personality === 'warlike' && x.rankIdx >= p.rankIdx - 1)).slice(0, 3)) { if (this.npcRemember) this.npcRemember(n, `당신의 월드 퍼스트 소식을 들었다`, 0); if (n.arch === 'rival') this.changeRel(n, -5, '월드 퍼스트를 빼앗겼다'); }
      p.wfTarget = (p.wfTarget || 0) + 1; // 음모·기습의 표적이 되기 쉽다
      lines.push('이름이 세상에 알려졌다. 명성 +40, 협회 공적 +20. 영입 제안과 함께 시기 어린 눈길도 몰려올 것이다.');
    } else {
      rec.who = 'anon'; rec.name = '익명의 헌터';
      if (this.addRelic) lines.push(`독점 보상: ${this.addRelic(null, 3)}`);
      this.rumor(`[월드 퍼스트] ${f.name} — 달성자는 이름을 밝히지 않았다. 업계가 정체를 추측하느라 들썩인다.`, { kind: 'worldfirst', score: 8, thread: 'wf:' + id });
      lines.push('이름을 숨겼다. 보상만 챙긴다.');
    }
    this.checkTitles && this.checkTitles();
    this.save && this.save();
    return lines.join(' ');
  };

  // NPC 달성
  GP.npcFirst = function (id, n) {
    if (this.firstTaken(id) || !n) return;
    const f = firstById(id);
    this.world.firsts[id] = { who: n.id, name: n.name, mk: this.monthKey(), date: this.dateStr() };
    n.renown = (n.renown || 0) + 60;
    const rival = n.arch === 'rival';
    this.rumor(`[월드 퍼스트] ${f.name} — ${RANKS[n.rankIdx].key}급 ${n.name}.${rival ? ` ${this.player.name}의 동기다.` : ''}`, { kind: 'worldfirst', score: 9, thread: 'wf:' + id });
    this.world.breaking = { text: `[월드 퍼스트] ${f.name} — ${n.name}`, mk: this.monthKey() };
    if (n.met || rival) this.log(`${n.name}이(가) 먼저 해냈다: ${f.name}.`, 'major');
  };

  // ---------- 플레이어 쪽 확인 ----------
  GP.checkFirstsPlayer = function () {
    const p = this.player; if (!p || !this.world || !this.world.firsts) return;
    if (p.rankIdx >= 6) this.claimFirst('gen_s');
    if (p.rankIdx >= 7) this.claimFirst('ss');
    if ((p.record.red || 0) >= 1) this.claimFirst('red');
    const best = p.tower ? p.tower.best || 0 : 0;
    if (best >= 10) this.claimFirst('tower10');
    if (best >= 20) this.claimFirst('tower20');
    if (best >= 30) this.claimFirst('tower30');
    const cal = this.world.calamity;
    if (cal && cal.done && Object.values(cal.done).includes('player')) this.claimFirst('calamity');
  };
  wrap('checkTitles', function (base) { this.checkFirstsPlayer(); return base.call(this); });

  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const solo = !this.party().length;
    if (gate && gate.final) this.claimFirst('primordial');
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (result === 'clear' && gate && (gate.realTier ?? gate.tier) >= 6 && solo) this.claimFirst('solo_s');
    this.checkFirstsPlayer();
    return lines;
  });

  // ---------- NPC 쪽 확인 (매달) ----------
  GP.checkFirstsNpc = function () {
    const w = this.world; if (!w.firsts) return;
    const ad = this.adults();
    if (!this.firstTaken('ss')) { const n = ad.find((x) => x.rankIdx >= 7); if (n) this.npcFirst('ss', n); }
    if (!this.firstTaken('gen_s')) { const n = ad.find((x) => x.rankIdx >= 6 && (x.bornMk ?? -1) >= w.startMk); if (n) this.npcFirst('gen_s', n); }
    // NPC 탑 등반: 최상위 NPC들이 조금씩 오른다
    const top = ad.filter((x) => x.rankIdx >= 5 && !x.retired).sort((a, b) => b.rankIdx - a.rankIdx)[0];
    if (top && RNG.chance(0.04 + (top.rankIdx - 5) * 0.03)) {
      w.npcTower += 1;
      for (const [k, fl] of [['tower10', 10], ['tower20', 20], ['tower30', 30]]) if (w.npcTower >= fl) this.npcFirst(k, top);
    }
    const cal = w.calamity;
    if (cal && cal.done && Object.values(cal.done).includes('npc') && !this.firstTaken('calamity')) {
      const hero = ad.filter((x) => !x.retired).sort((a, b) => (b.renown || 0) - (a.renown || 0))[0];
      if (hero) this.npcFirst('calamity', hero);
    }
  };
  wrap('simulateNpcs', function (base) { base.call(this); this.checkFirstsNpc(); });

  // NPC 레드 게이트 공략
  if (GP.ecoResolve) wrap('ecoResolve', function (base, g) {
    const red = g.variant === 'red'; const ids = g.raid ? g.raid.ids.slice() : [];
    base.call(this, g);
    if (red && !this.mapGates.includes(g) && !this.firstTaken('red')) { const n = ids.map((id) => this.npcById(id)).filter((x) => x && x.alive).sort((a, b) => b.rankIdx - a.rankIdx)[0]; if (n) this.npcFirst('red', n); }
  });

  // 신세대 표시
  wrap('makeNpc', function (base, young, race) {
    const n = base.call(this, young, race);
    if (n && this.world && this.world.startMk != null && young) n.bornMk = this.monthKey();
    return n;
  });
}

if (typeof UI !== 'undefined') {
  UI.showWorldFirst = function (id) {
    const f = firstById(id); const rec = G.world.firsts[id];
    if (!f || !rec || rec.who !== 'pending') return this.processQueue();
    this.modal(`<div class="eyebrow good">월드 퍼스트</div><h3>${f.name}</h3>
      <p class="event-text">세계 어디에도 기록이 없는 일이다. ${f.desc}.<br>관리국 시스템에 달성자 기록이 올라가기 직전이다. 이름을 밝힐까?</p>
      <div class="small dim">유일 칭호 「${f.title.name}」 · 독점 유물</div>
      <div class="cards">
        <button class="choice-btn" data-act="wf-open" data-v="${id}">이름을 밝힌다 <span class="small dim">명성·공적·영입 제안, 시기와 표적</span></button>
        <button class="choice-btn" data-act="wf-anon" data-v="${id}">익명으로 남긴다 <span class="small dim">보상만</span></button>
      </div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'worldfirst') { G.queue.shift(); return this.showWorldFirst(q.id); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'wf-open' || act === 'wf-anon') { this.closeModal(); return this.after(G.firstReveal(v, act === 'wf-open')); }
    return baseHandle.call(this, act, v);
  };
  // 연대기 화면: 월드 퍼스트 목록
  const baseRight = UI.rightHtml;
  UI.rightHtml = function () {
    const html = baseRight.call(this);
    const F = G.world.firsts || {};
    const rows = WORLD_FIRSTS.map((f) => { const r = F[f.id]; const who = !r ? '<span class="dim">아직 없음</span>' : r.who === 'player' ? `<b class="good">${G.player.name}</b>` : r.who === 'anon' || r.who === 'pending' ? '<span class="dim">익명</span>' : `<b>${r.name}</b>`; return `<div class="small">${f.name} · ${who}${r ? ` <span class="dim">${r.date}</span>` : ''}</div>`; }).join('');
    return html + `<div class="sec-title sec">월드 퍼스트</div><div class="cards">${rows}</div>`;
  };
}
