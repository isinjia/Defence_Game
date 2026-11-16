// 필수 첫 공략 → 도시 복귀 → 메인 1장. 현재 파티 또는 한 차례 동행한 공략대로 진행한다.
// 이동·전투·전리품 분배는 기존 게이트/소속 파티 기능을 사용한다.
{
  const GP = Game.prototype;
  const pending = (g) => g.player && g.player.notebook && g.player.firstSortie?.status !== 'done' && g.nbTask()?.id === 'gate';
  const members = (g) => g.withCrew ? g.withCrew(() => g.party()) : g.party();
  const oldIntro = (id) => /^debut_(normal|bottom)_0$/.test(id || '');
  const skipIntro = (g) => {
    const d = g.player.debut;
    if (d && ['normal', 'bottom'].includes(d.tier) && d.step === 0) {
      g.debutNext();
      delete g.flags.story.mainLeaflet; // 고지서 사건을 생략했으므로 전단을 먼저 봤다는 대사도 생략한다.
    }
    g.queue = g.queue.filter((q) => !oldIntro(q.id));
  };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function () {
    const r = baseInit.call(this); const p = this.player;
    p.firstSortie ??= null;
    const M = this.mainState();
    if (!p.firstSortie && p.notebook && p.record.gates > p.notebook.base.gates && M.ch === 1 && !M.started[1]) {
      p.firstSortie = { status: 'done', returned: false, temporary: null };
    }
    return r;
  };

  GP.firstSortieOffer = function () {
    const p = this.player;
    let s = p.firstSortie;
    if (!s) s = p.firstSortie = { status: 'offer', gate: null, listing: null, temporary: null };
    if (s.status === 'done' || s.status === 'active') return s;
    let gate = this.mapGates.find((g) => g.id === s.gate && !g.cleared);
    if (!gate) {
      const dist = (g) => Math.max(Math.abs(g.x - p.x), Math.abs(g.y - p.y));
      gate = this.mapGates.filter((g) => g.region === p.region && !g.cleared && !g.final && !g.mission && !g.variant && g.tier <= p.rankIdx && this.ensureOwner(g) === 'kama')
        .sort((a, b) => dist(a) - dist(b))[0];
      if (!gate) {
        const pos = this.nearbyStarterGateTile ? this.nearbyStarterGateTile() : this.randomFreeTile(p.region);
        if (pos) {
          gate = { id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: p.region,
            tier: Math.min(6, p.rankIdx), theme: RNG.pick(GATE_THEMES), elem: pickElem(), born: this.monthKey() };
          this.mapGates.push(gate);
        }
      }
      s.gate = gate ? gate.id : null;
    }
    if (gate) this.reveal(gate.x, gate.y, 1);
    if (!this.crew() && !members(this).length && (!s.listing || !this.npcById(s.listing.leader)?.alive)) {
      const team = this.firstTeamBuild('free:mid');
      s.listing = { id: 'first-sortie-' + team.leader, name: team.name, leader: team.leader,
        members: team.members, style: 'steady', minRank: p.rankIdx, share: team.share, firstSortie: true };
    }
    return s;
  };

  const baseStart = GP.nbStart;
  GP.nbStart = function () {
    const r = baseStart.call(this);
    if (pending(this)) { skipIntro(this); this.firstSortieOffer(); }
    return r;
  };
  // 무소속 활동 안내는 협회가 담당한다. 친구를 과제 담당자로 삼지 않는다.
  NB_VOICE.free = { who: '협회 활동 지원 담당자', give: (t) => `다음 활동은 ${t}입니다.`,
    done: '활동 완료를 확인했습니다.', nag: '의뢰 창에서 다음 활동을 확인할 수 있습니다.', pers: null };
  const baseMentor = GP.nbMentor;
  GP.nbMentor = function () {
    const nb = this.player.notebook;
    if (nb && (nb.voice || this.nbVoiceKey()) === 'free') { nb.mentor = null; return null; }
    return baseMentor.call(this);
  };
  const end = G.storyById('nb_end');
  if (end) {
    const text = end.text;
    end.text = (g, c) => g.player.notebook.voice === 'free'
      ? '협회에서 활동 안내 완료 메시지가 왔다. 이후 의뢰는 의뢰소에서 직접 선택할 수 있다.' : text(g, c);
  }

  Object.assign(UI, {
    showFirstSortie() {
      if (!pending(G)) return this.processQueue();
      skipIntro(G);
      G.queue = G.queue.filter((q) => q.id !== 'nb_msg');
      const s = G.firstSortieOffer();
      const gate = G.mapGates.find((g) => g.id === s.gate && !g.cleared);
      if (!gate) return this.after('현재 신청할 수 있는 공략이 없습니다. 의뢰 창에서 다시 확인할 수 있습니다.');
      const crew = G.crew();
      const solo = !crew && !members(G).length;
      const L = crew ? G.crewLeader() : solo ? G.npcById(s.listing?.leader) : null;
      const rank = RANKS[G.player.rankIdx].key;
      const role = G.player.rankIdx === 0 ? '신입 전투원' : G.player.rankIdx === 1 ? '전투원' : '정식 전투원';
      const details = s.status === 'active' ? '신청한 공략입니다. 집결 후 게이트로 이동하세요.' : solo
        ? `${rank}급 ${role}을 모집합니다. 경험 있는 리더의 공략대에 이번 공략만 동행합니다. 정산 후에는 다시 솔로로 활동합니다.`
        : crew ? '소속 파티와 함께 첫 게이트 공략에 참여합니다.' : '현재 파티로 공략을 신청합니다. 기존 동료와 함께 출발합니다.';
      const terms = solo && s.listing?.share != null
        ? `전리품은 리더 몫을 제외한 뒤 내 배당 ${Math.round(s.listing.share * 100)}%로 정산됩니다. 첫 공략 입장료는 협회에서 지원합니다.`
        : '전리품은 현재 파티의 분배 규칙에 따라 정산됩니다. 첫 공략 입장료는 협회에서 지원합니다.';
      G.save();
      this.modal(`<div class="eyebrow">헌터 협회 · 첫 공략 안내</div><h3>${solo ? '공략대 모집' : '첫 공략 신청'}</h3>
        ${L ? `<div class="item-row">${this.npcAvatar(L, 48)}<div><b>${L.name}</b><div class="small dim">공략 리더 · ${RANKS[L.rankIdx].key}급</div></div></div>` : ''}
        <p class="event-text">${details}</p><div class="panel"><b>${G.gateName(gate)}</b><p class="small">${regionById(gate.region).name} · ${RANKS[gate.tier].key}급</p><p class="small dim">${terms}</p></div>
        <div class="cards"><button class="choice-btn primary" data-act="first-sortie-go">${s.status === 'active' ? '공략 계속하기' : '집결하고 출발하기'}</button></div>`, 'event-box first-sortie-required');
    },
    firstSortieGo() {
      if (!pending(G)) return;
      const s = G.firstSortieOffer();
      if (this.ctx || this.walking || this.dlg) return;
      if (this.crewMarch) { this.closeModal(); return this.crewMarchStep(); }
      const gate = G.mapGates.find((g) => g.id === s.gate && !g.cleared);
      if (!gate) { s.status = 'offer'; return this.showFirstSortie(); }
      if (!G.crew() && !members(G).length) {
        if (!s.listing || !G.npcById(s.listing.leader)?.alive) { s.status = 'offer'; return this.showFirstSortie(); }
        G.crewJoin(s.listing);
        s.temporary = G.crew().id;
        if (s.listing.share != null) G.crew().share = s.listing.share;
        // 첫 공략 참가자에게 정식 소속 파티의 다음 집결 기한을 부과하지 않는다.
        G.crew().due = null;
        G.queue = G.queue.filter((q) => q.type !== 'crewCall');
      }
      const lead = G.player.lead;
      if (!G.crew() && members(G).length && lead && lead.state !== 'on') {
        this.closeModal();
        if (lead.state !== 'called' && !G.onCity()) return this.travelRegion(this.nearestCity());
        if (lead.state === 'free') G.leadCall();
        const rally = G.player.lead;
        if (rally?.state === 'called') {
          if (G.player.region !== rally.at) return this.travelRegion(rally.at);
          const due = Math.max(rally.due, ...Object.values(rally.late || {}));
          G.advanceDays(Math.max(0, due - (G.monthKey() * 30 + G.day)));
          G.leadTick();
          if (G.over) return this.after();
        }
      }
      s.status = 'active';
      gate.paid = true;
      G.queue = G.queue.filter((q) => !(q.type === 'crewCall' && q.first));
      G.save();
      this.closeModal();
      if (G.crew()) return this.crewWork(gate.id);
      const p = G.player;
      if (p.x === gate.x && p.y === gate.y) return this.encounter(gate);
      return this.handle('travel-xy', `${gate.x},${gate.y}`);
    },
    firstSortieReturn() {
      const s = G.player.firstSortie;
      if (!s || s.status !== 'done' || s.returned) return;
      if (G.onCity()) {
        s.returned = true;
        G.mainCheck(); G.save();
        return this.processQueue();
      }
      this.modal(`<div class="eyebrow">첫 공략 완료</div><h3>도시로 복귀</h3><p class="event-text">공략을 마쳤다. 도시로 돌아가자.</p><button class="primary full" data-act="first-sortie-return">도시로 돌아가기</button>`, 'event-box first-sortie-required');
    },
  });

  const baseStory = UI.showStory;
  UI.showStory = function (q) {
    if (pending(G) && ((q.id === 'nb_msg') || oldIntro(q.id))) return this.showFirstSortie();
    // 기존 저장의 친구 메시지도 협회 안내로 바꾼다.
    if (['nb_msg', 'nb_end'].includes(q.id) && G.player.notebook?.voice === 'free') q = { ...q, npc: null };
    return baseStory.call(this, q);
  };
  const baseQuests = UI.questsHtml;
  UI.questsHtml = function () {
    const root = document.createElement('div'); root.innerHTML = baseQuests.call(this);
    const panels = [...root.querySelectorAll(':scope > .panel')];
    const notebook = panels.find(p => p.querySelector('h3')?.textContent === '첫 해 수첩');
    const accepted = panels.find(p => p.querySelector('h3')?.textContent === '진행 중인 일');
    const clues = panels.find(p => p.querySelector('h3')?.textContent === '기연 단서');
    const sub = document.createElement('section'); sub.className = 'panel quest-category';
    sub.innerHTML = '<h3>서브 퀘스트</h3>';
    // 내부 저장은 그대로 사용하고 화면에는 현재 진행할 활동만 보여 준다.
    if (notebook) {
      const current = notebook.querySelector('.item-row.hl');
      if (G.nbTask()?.id !== 'gate' && current) {
        current.querySelectorAll('[data-act="qr-track"]').forEach(b => b.remove());
        current.insertAdjacentHTML('beforeend', QuestRoute.button(`nb:${G.nbTask().id}`));
        sub.insertAdjacentHTML('beforeend', '<h4>활동 안내</h4>'); sub.append(current);
      }
      notebook.remove();
    }
    if (accepted) {
      if (G.player.quests.length) {
        sub.insertAdjacentHTML('beforeend', '<h4>의뢰·부탁</h4>');
        const cards = accepted.querySelector('.cards'); if (cards) sub.append(cards);
      }
      accepted.remove();
    }
    if (clues) {
      sub.insertAdjacentHTML('beforeend', '<h4>기연 단서</h4>');
      const cards = clues.querySelector('.cards'); if (cards) sub.append(cards);
      clues.remove();
    }
    if (!sub.querySelector('.item-row')) sub.insertAdjacentHTML('beforeend', '<p class="small dim">진행 중인 서브 퀘스트가 없습니다.</p>');
    const s = G.player.firstSortie;
    let main;
    if (pending(G) || (s?.status === 'done' && !s.returned)) {
      const returning = s?.status === 'done';
      main = `<b>${returning ? '도시 복귀' : '첫 게이트 공략'}</b><p class="small">${returning ? '공략을 마쳤다. 도시로 돌아가자.' : '집결 후 첫 게이트 공략에 참여한다.'}</p>
        <div class="row"><button class="primary" data-act="${returning ? 'first-sortie-return' : 'first-sortie-open'}">${returning ? '도시로 돌아가기' : '집결·공략 계속하기'}</button>${QuestRoute.button('first-sortie')}</div>`;
    } else {
      const goal = this.mainGoal();
      if (goal) {
        const esc = text => String(text || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        main = `<b>${goal.def.n}장 · ${esc(goal.def.title)}</b><p class="small">${esc(G.mainFill(goal.def.goal || ''))}</p>
          <div class="row"><button class="primary" data-act="main-go">${goal.wait ? G.mainWaitText() : goal.here ? '이야기 계속하기' : '목적지 확인'}</button>${QuestRoute.button('main')}</div>`;
      } else main = '<p class="small dim">다음 메인 퀘스트의 시작 조건을 기다리고 있습니다.</p>';
    }
    return `<section class="panel quest-category"><h3>메인 퀘스트</h3>${main}</section>${sub.outerHTML}${root.innerHTML}`;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'first-sortie-open') return this.showFirstSortie();
    if (act === 'first-sortie-go') return this.firstSortieGo();
    if (act === 'first-sortie-return') { this.closeModal(); return this.travelRegion(this.nearestCity()); }
    // 필수 안내의 외부 닫기 요청도 거절/보류로 처리하지 않는다.
    if (act === 'modal-close' && document.querySelector('#modal-box.first-sortie-required')) return;
    return baseHandle.call(this, act, v);
  };
  // 출발·입장 확인에서도 첫 공략을 보류하는 선택은 제공하지 않는다.
  const requireContinue = () => {
    const box = document.getElementById('modal-box');
    if (!box) return;
    box.querySelectorAll('[data-act="modal-close"]').forEach((b) => b.remove());
    box.classList.add('first-sortie-required');
  };
  const baseTravel = UI.travelConfirm;
  UI.travelConfirm = function (...a) {
    const r = baseTravel.apply(this, a);
    const s = G.player?.firstSortie;
    if (s && !s.returned && document.querySelector('#modal-box [data-act="travel-go"]')) requireContinue();
    return r;
  };
  const baseEncounter = UI.encounter;
  UI.encounter = function (obj) {
    const r = baseEncounter.call(this, obj);
    const s = G.player?.firstSortie;
    if (s?.status === 'active' && obj?.kind === 'gate' && obj.id === s.gate &&
      document.querySelector('#modal-box [data-act="gate"]:not(:disabled)')) requireContinue();
    return r;
  };
  const baseGate = UI.startGate;
  UI.startGate = function (...a) {
    const r = baseGate.apply(this, a);
    const s = G.player.firstSortie;
    if (s?.status === 'active' && this.ctx?.kind === 'gate') { s.gate = this.ctx.gate.id; G.save(); }
    return r;
  };
  const baseFinish = UI.finishGate;
  UI.finishGate = function (result) {
    const gateId = this.ctx?.gate?.id;
    const r = baseFinish.call(this, result);
    const s = G.player.firstSortie;
    if (s?.status === 'active' && s.gate === gateId) {
      if (s.temporary && G.crew()?.id === s.temporary) {
        G.crewLeave('first-sortie');
        G.queue = G.queue.filter((q) => !['crewCall', 'crewLate'].includes(q.type));
        G.lifeEvent('첫 공략 동행을 마치고 솔로 활동으로 돌아왔다.');
      }
      s.temporary = null;
      s.status = result === 'clear' ? 'done' : 'offer';
      if (result !== 'clear') { s.gate = null; s.listing = null; }
      G.save();
    }
    return r;
  };

  // 날짜 대신 첫 공략 완료·도시 복귀로 메인 1장을 연다. 이미 시작한 저장은 유지한다.
  const firstMain = (g) => {
    if (!g.player?.notebook) return false;
    if (!g.player.firstSortie && g.nbTask()?.id !== 'gate') return false;
    const M = g.mainState();
    return M.ch === 1 && !M.started[1] && !M.done[1];
  };
  const baseMainCheck = GP.mainCheck;
  GP.mainCheck = function () {
    if (firstMain(this)) {
      const s = this.player.firstSortie;
      if (!s?.returned) return;
      this.mainState().firstDay = this.mainToday();
    }
    return baseMainCheck.call(this);
  };
  const baseGoal = UI.mainGoal;
  UI.mainGoal = function () {
    if (firstMain(G) && !G.player.firstSortie?.returned) return null;
    return baseGoal.call(this);
  };
  const basePlay = UI.mainPlay;
  UI.mainPlay = function (...a) {
    if (firstMain(G) && !G.player.firstSortie?.returned) return;
    return basePlay.apply(this, a);
  };
  const baseVisit = GP.visitCity;
  GP.visitCity = function (...a) {
    const r = baseVisit.apply(this, a);
    const s = this.player.firstSortie;
    if (s?.status === 'done' && this.onCity()) { s.returned = true; this.mainCheck(); this.save(); }
    return r;
  };
  const opening = MAIN.chapters[1]?.scenes[0]?.lines[0];
  if (opening) {
    const original = opening.narr;
    opening.narr = (g, M) => g.player.firstSortie?.returned
      ? '첫 게이트 공략을 마치고 도시로 돌아왔다. 거리에는 사람들이 오가고 있다.'
      : typeof original === 'function' ? original(g, M) : original;
  }
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.screen !== 'game' || !G.player || G.over || this.ctx || this.dlg || this.walking || this.modalOpen()) return baseQueue.call(this);
    const s = G.player.firstSortie;
    if (s?.status === 'done' && !s.returned) return this.firstSortieReturn();
    if (firstMain(G) && s?.returned && G.onCity()) {
      G.mainCheck();
      if (this.mainGoal()) return this.mainStart();
    }
    if (pending(G)) {
      if (!s || s.status !== 'active') return this.showFirstSortie();
      if (!this.crewMarch && !G.queue.length) return this.firstSortieGo();
    }
    return baseQueue.call(this);
  };
}
