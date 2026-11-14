// 개인 보험 미가입 입장이 누적 5회면 이후 신규 가입을 제한한다.
// 기존 두 보험(협회 유족 보험/무소속 구조·치료 보험)의 효과·보험료는 유지한다.
{
  const GP = Game.prototype;
  GP.gateInsuranceState = function () {
    return this.player.gateInsurance ??= { uninsuredEntries: 0 };
  };
  GP.hasGateInsurance = function () { return !!(this.player.insurance?.on || this.player.risk?.insured); };
  GP.canEnrollInsurance = function () { return this.gateInsuranceState().uninsuredEntries < 5; };
  const denied = '무보험 게이트 입장이 누적 5회 이상이어서 더 이상 보험에 가입할 수 없습니다.';
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) { const r = baseInit.apply(this, a); this.gateInsuranceState(); return r; };
  const baseToggle = GP.insToggle;
  GP.insToggle = function () {
    if (!this.player.insurance?.on && !this.canEnrollInsurance()) return denied;
    return baseToggle.call(this);
  };

  const entryNote = () => {
    if (G.hasGateInsurance()) return '';
    const count = G.gateInsuranceState().uninsuredEntries;
    const text = count >= 5 ? denied : count === 4
      ? '보험 미가입 상태입니다. 이번에 무보험으로 입장하면 누적 5회가 되어 이후 보험 가입이 불가능합니다.'
      : `보험 미가입 상태입니다. 무보험 입장 ${count}/5회. 누적 5회부터 보험에 가입할 수 없습니다.`;
    return `<div class="panel insurance-entry-note"><b class="bad">보험 미가입</b><p class="small">${text}</p>
      ${count < 5 ? `<p class="small dim">협회 보험 · 월 ${fmt(G.insPremium())} 크레딧 · 사망·은퇴 시 유족 지급</p><button class="sm" data-act="gate-insurance-info">내 정보에서 보험 가입</button>` : ''}</div>`;
  };
  // 게이트 진입 및 필수 첫 공략 확인에서 가입 기회를 먼저 제공한다.
  const baseModal = UI.modal;
  UI.modal = function (html, cls, ...args) {
    if (G.player && typeof html === 'string') {
      const root = document.createElement('template'); root.innerHTML = html;
      const first = root.content.querySelector('[data-act="first-sortie-go"]');
      const gate = root.content.querySelector('[data-act="gate"]');
      if ((first || gate) && !root.content.querySelector('.insurance-entry-note')) {
        this._insuranceEntry = first ? { first: true } : { gate: gate.dataset.v };
        const note = entryNote();
        if (note) {
          const button = first || gate;
          const controls = button.closest('.cards, .row.end') || button;
          controls.insertAdjacentHTML('beforebegin', note);
          html = root.innerHTML;
        }
      }
    }
    return baseModal.call(this, html, cls, ...args);
  };
  const baseStart = UI.startGate;
  UI.startGate = function (...args) {
    const before = this.ctx;
    const insured = G.hasGateInsurance();
    const r = baseStart.apply(this, args);
    const c = this.ctx;
    if (!c || c === before || c.kind !== 'gate' || c.gate?.exam || c.gate?.tutorial || c._insuranceEntryRecorded) return r;
    c._insuranceEntryRecorded = true;
    if (!insured) {
      const s = G.gateInsuranceState(); s.uninsuredEntries++;
      const text = s.uninsuredEntries >= 5
        ? `보험 미가입으로 입장했습니다. 누적 ${s.uninsuredEntries}회로 이후 보험 가입이 불가능합니다.`
        : `보험 미가입으로 입장했습니다. 무보험 입장 ${s.uninsuredEntries}/5회.`;
      G.log(text, 'bad'); G.save(); this.toast(text);
    }
    return r;
  };
  // 개인 보험은 내 정보에서 관리한다.
  const baseChar = UI.charHtml;
  UI.charHtml = function (...args) {
    const html = baseChar.apply(this, args);
    const ins = G.player.insurance; const risk = G.player.risk;
    const blocked = !G.canEnrollInsurance();
    const guild = !!G.payKind(G.player.guild);
    const row = (name, on, text, act, unavailable) => `<div class="item-row"><div class="grow"><b>${name}</b><div class="small">${on ? '가입 중' : unavailable ? '가입 불가' : '미가입'}</div><div class="small dim">${text}</div></div>
      <button class="sm ${on ? 'ghost' : 'primary'}" data-act="${act}" ${!on && unavailable ? 'disabled' : ''}>${on ? '해지' : '가입'}</button></div>`;
    return html + `<div class="panel"><h3>보험</h3><p class="small dim">무보험 게이트 입장 ${G.gateInsuranceState().uninsuredEntries}회 · 누적 5회부터 신규 가입 불가</p>
      ${blocked ? `<p class="small bad">${denied}</p>` : ''}
      ${row('협회 헌터 보험', ins?.on, `월 ${fmt(G.insPremium())} 크레딧 · 사망·은퇴 시 유족 지급 · 납입 ${fmt(ins?.paid || 0)} · 예상 지급 ${fmt(G.insPayout())}`, 'ins-toggle', blocked)}
      ${row('무소속 구조·치료 보험', risk?.insured, guild ? '소속의 보호를 받는 동안에는 가입할 수 없습니다.' : `월 ${fmt(G.insurePremium())} 크레딧 · 구조 확률 +${Math.round(RISK.insure.rescue * 100)}% · 병원비 ${Math.round(RISK.insure.self * 100)}% 본인 부담 · 레드 게이트 면책`, 'insure', blocked || guild)}</div>`;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, ...args) {
    if (act === 'insure' && !G.player.risk?.insured && !G.canEnrollInsurance()) return this.toast(denied);
    if (act === 'gate-insurance-info') {
      this._insuranceInfoReturn = this._insuranceEntry;
      return this.openSheet('char');
    }
    if (['ins-toggle', 'insure'].includes(act) && this.sheet === 'char') {
      let text;
      if (act === 'ins-toggle') text = G.insToggle();
      else {
        const r = G.player.risk;
        if (!r.insured && G.payKind(G.player.guild)) return this.toast('소속의 보호를 받는 동안에는 가입할 수 없습니다.');
        r.insured = !r.insured;
        text = r.insured ? '무소속 구조·치료 보험에 가입했습니다.' : '보험을 해지했습니다.';
      }
      G.save(); this.openSheet('char'); this.toast(text); return;
    }
    if (act === 'modal-close' && this.sheet === 'char' && this._insuranceInfoReturn) {
      const destination = this._insuranceInfoReturn; this._insuranceInfoReturn = null;
      this.closeModal();
      if (destination.first) return this.showFirstSortie();
      const gate = G.mapGates.find(g => g.id === +String(destination.gate).split('|')[0]);
      if (gate) return this.encounter(gate);
      return this.after();
    }
    return baseHandle.call(this, act, ...args);
  };
}
