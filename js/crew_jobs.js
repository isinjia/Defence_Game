// 소속 파티: 리더가 일 후보를 보여 주고 고른다 (사용자 요청 "파티 시스템 완성도", 2-①)
// 전에는 거점에서 리더에게 말을 걸면 리더가 일 하나를 골라 바로 출발했고, 나는 게이트마다 한 번 "제안"만 할 수 있었다.
// 같은 이름의 게이트가 위치 구분 없이 두 번 나오기도 했다.
// 이제:
//  - 리더가 후보 2~3개(게이트·토벌·호위·훈련)를 보여 준다. 각 후보에 장소·이동 시간·등급·보상과 팀원 의견(찬성·반대, 한마디).
//  - 리더 추천(방침에 맞는 것)이 표시된다. 추천대로 가면 바로 출발.
//  - 다른 후보를 고르면 "제안"이 된다. 받아들일 확률(리더와의 관계·신뢰·찬성한 팀원 수)을 미리 보여 주고,
//    거절되면 리더 추천대로 간다(리더 관계 −1). 리더 등급보다 높은 게이트는 후보에 넣지 않는다.
{
  const GP = Game.prototype;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  // 후보 만들기
  GP.crewJobCands = function () {
    const c = npcLed(this); const L = c && this.npcById(c.leader); if (!c || !L) return [];
    const p = this.player; const t = this.crewTier(); const ride = this.crewRide();
    const reach = (rid) => rid !== 'jeju' || p.rankIdx >= 6;
    const days = (x, y) => { try { const d = UI.travelPlan ? UI.travelPlan(x, y).days : null; return ride.days(d ?? 99); } catch (e) { return 99; } };
    const out = [];
    const gates = this.mapGates.filter((g) => !g.final && !g.mission && !g.cleared && reach(g.region) && g.tier <= L.rankIdx && g.tier >= t - 1)
      .map((g) => ({ g, d: days(g.x, g.y) })).filter((x) => x.d <= 8).sort((a, b) => a.d - b.d);
    for (const { g, d } of gates.slice(0, 2)) out.push({ kind: 'gate', id: g.id, tier: g.tier, region: g.region, days: d, title: this.gateName(g) });
    const mob = this.mobs.filter((m) => reach(m.region) && m.tier >= t - 1 && m.tier <= Math.min(t + 1, L.rankIdx))
      .map((m) => ({ m, d: days(m.x, m.y) })).filter((x) => x.d <= 6).sort((a, b) => a.d - b.d)[0];
    if (mob) out.push({ kind: 'hunt', id: mob.m.id, tier: mob.m.tier, region: mob.m.region, days: mob.d, title: `${mob.m.name} 무리 토벌` });
    if (out.length < 3) {
      let pay = Math.round(260 * RANKS[t].mult ** 1.3);
      if (c.fame && typeof TEAM !== 'undefined') pay = Math.round(pay * (1 + Math.min(TEAM.escortMax, c.fame * TEAM.escortPerFame)));
      out.push({ kind: 'escort', tier: t, pay, region: c.base, days: 0, title: '운송 차량 호위 의뢰' });
    }
    if (out.length < 3) out.push({ kind: 'train', tier: t, region: c.base, days: 0, title: '합동 훈련 (한 달)' });
    // 리더 추천: 방침 가중치가 가장 큰 종류, 같은 종류면 가까운 것
    const st = CREW_STYLES[c.style] || CREW_STYLES.steady;
    let best = 0; out.forEach((x, i) => { if ((st[x.kind] || 0) > (st[out[best].kind] || 0)) best = i; });
    out[best].rec = true;
    // 팀원 의견
    const mates = this.withCrew(() => this.party()).filter((n) => n !== L && n.crewOf === c.id);
    for (const x of out) {
      x.yes = []; x.no = [];
      for (const n of mates) {
        const pr = n.personality;
        const like = pr === 'warlike' ? (x.kind === 'gate' || x.kind === 'hunt') && x.tier >= t
          : pr === 'kind' ? x.kind === 'train' || x.kind === 'escort' || x.tier < t
          : pr === 'greedy' ? x.kind === 'escort' || x.kind === 'gate'
          : pr === 'just' ? x.kind === 'gate' || x.kind === 'hunt' || x.kind === 'escort'
          : !!x.rec; // 냉정: 리더 판단을 따른다
        (like ? x.yes : x.no).push(n);
      }
    }
    return out;
  };
  // 제안이 받아들여질 확률
  GP.crewProposeChance = function (x) {
    const c = npcLed(this); const L = c && this.npcById(c.leader); if (!c || !L) return 0;
    const stage = this.crewStageBonus ? this.crewStageBonus('propose') : 0;
    return Math.max(0.15, Math.min(0.95, 0.3 + (L.relation || 0) / 150 + (c.trust - 50) / 250 + x.yes.length * 0.08 - x.no.length * 0.05 + stage));
  };

  // 정해진 후보로 일을 시작하게 crewMakePlan 을 잠깐 바꾼다
  const baseMake = GP.crewMakePlan;
  GP.crewMakePlan = function (...a) {
    const f = this._forcePlan; if (f) { this._forcePlan = null; return f; }
    return baseMake.apply(this, a);
  };
  const toPlan = (x) => (x.kind === 'gate' ? { kind: 'gate', gateId: x.id } : x.kind === 'hunt' ? { kind: 'hunt', mobId: x.id } : x.kind === 'escort' ? { kind: 'escort', tier: x.tier, pay: x.pay } : { kind: 'train' });

  if (typeof UI !== 'undefined' && UI.crewTalk) {
    const baseTalk = UI.crewTalk;
    const KIND_NAME = { gate: '게이트', hunt: '토벌', escort: '호위', train: '훈련' };
    UI.crewTalk = function (...a) {
      const c = npcLed(G); const L = G.crewLeader();
      if (!c || !L || !G.crewAtBase() || (G.player.rankIdx >= L.rankIdx + 2 && !c.offeredLead)) return baseTalk.apply(this, a);
      const cands = G.crewJobCands(); this._crewCands = cands;
      if (!cands.length) return baseTalk.apply(this, a);
      const k = col(L);
      const T = { just: '왔군. 이번에 갈 만한 일은 이 정도다. 난 이걸 보고 있다.', kind: '왔어요? 이번에 할 만한 일은 이 정도예요. 저는 이게 좋아 보여요.', cold: '왔나. 일은 이것들. 난 이거.' };
      const share = Math.round((G.crewShareRate ? G.crewShareRate() : 0.75) * 100);
      const card = (x, i) => {
        const where = `${regionById(x.region).name}${x.days ? ` · ${WORLD.formatTravelTime(x.days)}` : ' · 거점'}`;
        const reward = x.kind === 'gate' ? `게이트 전리품의 ${share}%` : x.kind === 'hunt' ? `토벌 보상의 ${share}%` : x.kind === 'escort' ? `보수 약 ${fmt(G.crewPay ? G.crewPay(x.pay) : x.pay)} 크레딧` : '에테르·팀원 관계 · 보수 없음';
        const op = x.yes.length || x.no.length ? `<span class="small"><span class="good">찬성 ${x.yes.length}</span> · <span class="bad">반대 ${x.no.length}</span>${x.yes[0] ? ` · ${esc(x.yes[0].name)} "${x.kind === 'train' ? '손발 맞추는 것도 필요하지.' : x.kind === 'escort' ? '돈 되는 일이면 좋지.' : '가자, 몸이 근질근질했어.'}"` : x.no[0] ? ` · ${esc(x.no[0].name)} "${x.kind === 'train' ? '훈련보다 실전이지.' : '이건 좀 별로인데.'}"` : ''}</span>` : '';
        const chance = x.rec ? '' : Math.round(G.crewProposeChance(x) * 100);
        return `<div class="cn-card crew-job ${x.rec ? 'rec' : ''}">
          <div class="row between"><b>${esc(x.title)}</b><span class="tag tiny">${KIND_NAME[x.kind]}${x.kind !== 'train' ? ` · ${RANKS[x.tier].key}급` : ''}</span></div>
          <div class="small dim">${esc(where)} · ${reward}</div>${op}
          <button class="choice-btn ${x.rec ? 'primary' : ''}" data-act="crew-job" data-v="${i}">${x.rec ? '리더 추천대로 간다' : `이걸로 하자고 제안한다 <span class="small dim">받아들일 확률 약 ${chance}%</span>`}</button></div>`;
      };
      this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(L, 96)}<div><div class="eyebrow">${esc(c.name)} · 거점 ${esc(G.crewBaseName())}</div><b>${esc(L.name)}</b> <span class="small dim">리더</span>
        <p class="event-text">"${T[k] || T.just}"</p><p class="small dim">리더 추천대로 가면 바로 출발한다. 다른 일을 고르면 제안이 되고, 거절되면 리더 추천대로 간다.</p></div></div>
        <div class="cards crew-jobs">${cands.map(card).join('')}<button class="choice-btn" data-act="modal-close">나중에</button></div>`), 'event-box');
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'crew-job') {
        const cands = this._crewCands || []; const x = cands[+v]; if (!x) return;
        const c = npcLed(G); const L = G.crewLeader(); const k = col(L);
        this.closeModal();
        const go = (y) => { if (!y) return this.crewWork(null); if (y.kind === 'gate') return this.crewWork(y.id); G._forcePlan = toPlan(y); return this.crewWork(null); };
        if (x.rec) return go(x);
        const ok = Math.random() < G.crewProposeChance(x);
        const rec = cands.find((y) => y.rec);
        if (ok) {
          const T = { just: '좋다. 그걸로 간다.', kind: '좋아요, 그걸로 가요!', cold: '…그래. 그걸로.' };
          this.toast(`${L.name}: "${T[k] || T.just}"`);
          return go(x);
        }
        G.changeRel(L, -1, '리더가 고른 일 대신 다른 일을 하자고 했다');
        const T = { just: '이번엔 내 판단대로 간다. 다음엔 들어 주지.', kind: '이번엔 제 생각대로 갈게요. 다음엔 꼭 들어 줄게요.', cold: '아니. 내 걸로 간다.' };
        this.toast(`${L.name}: "${T[k] || T.just}" (리더 관계 −1)`);
        return go(rec);
      }
      return baseH.call(this, act, v);
    };
  }
}
