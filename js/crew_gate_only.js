// NPC 팀장의 활동 제안은 게이트 공략만. 집결은 연락일로부터 최소 한 달 뒤.
{
  const GP = Game.prototype;
  const led = g => {
    const c = g.player && g.player.crew;
    return c && g.npcById(c.leader)?.alive ? c : null;
  };
  const today = g => g.monthKey() * 30 + g.day;
  const baseDue = GP.crewSetDue;
  GP.crewSetDue = function (...args) {
    const result = baseDue.apply(this, args), c = led(this);
    if (c) {
      c.due = Math.max(c.due || 0, today(this) + 30);
      c.dueMixed = false;
      c.gateCallPending = true;
    }
    return result;
  };
  const init = GP.initSandbox;
  GP.initSandbox = function (...args) {
    const result = init.apply(this, args), c = led(this);
    if (c) {
      c.gateOnlyNoticeVersion ??= 0;
      c.gateCallPending ??= false;
      if (!c.gateOnlyNoticeVersion) {
        if (!c.on && c.due) {
          c.due = Math.max(c.due, today(this) + 30);
          c.dueWarned = false;
          c.dueMixed = false;
          c.gateCallPending = true;
          if (!this.queue.some(q => q.type === 'crewCall')) this.queue.push({ type: 'crewCall', first: false });
        }
        if (c.plan && !['gate', 'handover'].includes(c.plan.kind)) c.plan = null;
        c.gateOnlyNoticeVersion = 1;
      }
    }
    return result;
  };
  const candidates = GP.crewJobCands;
  GP.crewJobCands = function (...args) {
    const all = candidates.apply(this, args);
    if (!led(this)) return all;
    const gates = all.filter(x => x.kind === 'gate');
    if (gates.length && !gates.some(x => x.rec)) gates[0].rec = true;
    return gates;
  };
  const make = GP.crewMakePlan;
  GP.crewMakePlan = function (...args) {
    const c = led(this);
    if (!c) return make.apply(this, args);
    const forced = this._forcePlan;
    this._forcePlan = null;
    if (forced?.kind === 'gate') return forced;
    const L = this.npcById(c.leader);
    if (this.player.rankIdx >= L.rankIdx + 2 && !c.offeredLead) {
      c.offeredLead = true;
      return { kind: 'handover' };
    }
    const gates = this.crewJobCands(), pick = gates.find(x => x.rec) || gates[0];
    return pick ? { kind: 'gate', gateId: pick.id } : null;
  };
  const call = UI.crewCall;
  UI.crewCall = function (...args) {
    const c = led(G);
    if (!c) return call.apply(this, args);
    if (c.gateCallPending || !c.gateOnlyNoticeVersion) {
      c.due = Math.max(c.due || 0, today(G) + 30);
      c.dueMixed = false;
      c.gateCallPending = false;
      c.gateOnlyNoticeVersion = 1;
      G.save();
    }
    const talk = this.talk;
    this.talk = function (lines, done) {
      const updated = lines.map(line => line.text ? { ...line, text: line.text.replace(/일하러/g, '게이트 공략하러').replace(/다음 일/g, '다음 게이트 공략') } : line);
      return talk.call(this, updated, done);
    };
    try { return call.apply(this, args); } finally { this.talk = talk; }
  };
  const work = UI.crewWork;
  UI.crewWork = function (gateId) {
    if (!led(G)) return work.call(this, gateId);
    const gates = G.crewJobCands();
    const L = G.crewLeader();
    const target = gateId != null && G.mapGates.find(g => g.id === gateId && !g.cleared && !g.final && !g.mission && g.tier <= L.rankIdx);
    const pick = gateId != null ? (target ? { id: target.id } : null) : gates.find(x => x.rec) || gates[0];
    if (!pick) return this.after('현재 공략할 수 있는 게이트가 없습니다. 다른 게이트 정보를 확인한 뒤 리더에게 다시 말 걸어 주세요.');
    G._forcePlan = null;
    return work.call(this, pick.id);
  };
  // 옛 저장이나 이미 열려 있던 활동창에서도 훈련·호위·토벌로 출발하지 않는다.
  const depart = UI.crewDepart;
  UI.crewDepart = function (plan, ...args) {
    if (led(G) && plan?.kind !== 'gate') return this.crewWork(null);
    return depart.call(this, plan, ...args);
  };
}
