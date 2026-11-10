// ===== 시험 직전 '내 상태 확인' (영역 D) =====
// 프롤로그(각성)가 끝나고 헌터 자격 시험에 들어가기 전에 직업·기술·속성·능력치·지금 상황을 한 번 보여 준다.
// 이후에도 정보 탭의 '내 상태 한눈에' 버튼으로 다시 볼 수 있다.
// 로드 순서: tutorial.js 뒤, resume_guard.js 앞 (resume_guard 가 이 감싸기를 다시 감싸 시험 단계 표시·저장을 맡는다)
if (typeof Game !== 'undefined') {
  const baseInit = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function () {
    const r = baseInit.apply(this, arguments);
    const p = this.player;
    if (p) { p.statusSeen ??= !!p.examDone && p.onboard !== 'exam'; p.proLog ??= null; }
    return r;
  };
}

if (typeof UI !== 'undefined') {
  const ROLE_TXT = { tank: '탱커 · 앞에서 맞아 준다', melee: '근접 딜러 · 앞줄에서 벤다', assassin: '암살자 · 빠르게 급소를 노린다', ranged: '원거리 딜러 · 뒷줄에서 쏜다', caster: '마법 딜러 · 뒷줄에서 큰 기술을 쓴다', support: '지원 · 치유와 보조', summoner: '소환사 · 소환수를 부린다', esper: '이능력자 · 정신으로 싸운다' };
  const STAT = [['maxHp', '체력'], ['maxMp', '정신력'], ['atk', '공격'], ['def', '방어'], ['spd', '속도'], ['luck', '운']];

  // 프롤로그 선택 기록을 플레이어에 남겨 둔다 (상황 요약용)
  const baseBegin = UI.beginFromPrologue;
  if (baseBegin) UI.beginFromPrologue = function () {
    const log = this.pro && this.pro.log ? this.pro.log.slice() : null;
    const r = baseBegin.apply(this, arguments);
    if (G.player && log) G.player.proLog = log;
    return r;
  };

  Object.assign(UI, {
    statusSkillHtml(id) {
      const sk = skillById(id); if (!sk) return '';
      const p = G.player;
      if (this.skillHoldHtml) return `<div class="st-skill">${this.skillHoldHtml(sk, { elem: p.element, name: '', mp: p.maxMp }).replace(/<div class="small dim sh-tip">.*?<\/div>/, '').replace(/ <span class="(?:dim|bad)">\(남은 [^)]*\)<\/span>/, '')}</div>`;
      return `<div class="trait"><b>${sk.name}</b><span class="dim">${sk.desc || ''} · MP ${sk.mp}</span></div>`;
    },
    statusSituation() {
      const p = G.player; const bg = BACKGROUNDS.find((b) => b.id === p.bg);
      const reg = G.region();
      const friend = G.npcs.find((n) => n.friendhood && n.alive !== false);
      const log = p.proLog || [];
      const last = log.length ? log[log.length - 1] : null;
      const gear = ['weapon', 'armor', 'acc'].map((s) => p.equip[s]).filter(Boolean).map((it) => it.name).join(', ');
      const items = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).filter((c) => p.items[c.id]).map((c) => `${c.name} ×${p.items[c.id]}`).join(', ');
      const lines = [
        `${G.ageYears()}세. ${bg ? `${bg.name}(으)로 살아오다 ` : ''}얼마 전 각성했다.`,
        last ? `지난 일: ${last}` : null,
        `지금 ${reg.name}에 있다. 각성자는 협회 자격 시험을 통과해야 게이트에 들어갈 수 있다. 그래서 오늘 시험장으로 간다.`,
        friend ? `소꿉친구 ${friend.name}이(가) 같은 도시에 있다.` : null,
        `가진 돈 <b class="num">${fmt(p.money)}</b> 크레딧${gear ? ` · 장비 ${gear}` : ''}${items ? ` · ${items}` : ''}`,
        `각성 등급은 아직 측정 전이다. 시험이 끝나면 협회가 알려 준다.`,
      ].filter(Boolean);
      return lines.map((l) => `<p class="small">${l}</p>`).join('');
    },
    statusHtml(forExam) {
      const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const E = ELEMENTS[p.element];
      const skills = p.skills.filter((id) => id !== 'strike');
      return `<div class="st-check">
        <div class="char-head">${this.playerPortrait(110)}<div><div class="eyebrow">${forExam ? '시험 전에 · 내 상태 확인' : '내 상태 한눈에'}</div><h3>${p.name}</h3><div class="row">${this.clsTag(p.cls, p.clsAdv)} ${this.elemTag(p.element)}</div></div></div>
        <div class="sec"><div class="sec-title">직업</div><div class="trait" style="border-left-color:${g.color}"><b>${className(p.cls, p.clsAdv)} <span class="small" style="color:${g.color}">${g.name} · ${CLASS_RARITY[k.r]}</span></b>
          <span class="small">역할: ${ROLE_TXT[k.role] || k.role}</span><span class="dim">${k.desc}</span>
          <span class="small">전직 경로: ${[k.name, ...k.adv].map((n, i) => (i === p.clsAdv ? `<b class="amber">${n}</b>` : n)).join(' → ')} <span class="dim">(C급·S급에서 전직 시험)</span></span></div></div>
        <div class="sec"><div class="sec-title">가진 기술 (${skills.length + 1})</div><div class="cards st-skills">${skills.map((id) => this.statusSkillHtml(id)).join('')}${this.statusSkillHtml('strike')}</div></div>
        <div class="sec"><div class="sec-title">속성과 상성</div><div class="trait" style="border-left-color:${E.color}"><b>${FX.elemIcon(p.element, 14)} ${E.name}</b><span class="small">${elemVsText(p.element)}</span><span class="small dim">같은 속성 기술은 위력 +20%. 강한 속성으로 치면 더 아프고, 약한 속성에게 맞으면 더 아프다.</span></div></div>
        <div class="sec"><div class="sec-title">능력치 · 재능</div><div class="stat-grid">${STAT.map(([key, nm]) => `<div><span class="dim">${nm}</span><b class="num">${Math.round(p[key] || 0)}</b></div>`).join('')}<div><span class="dim">재능</span><b class="num">${p.talent} / 10</b></div></div></div>
        <div class="sec"><div class="sec-title">선천 특성</div><div class="cards traits">${p.traits.map((id) => { const t = traitById(id); return t ? `<div class="trait"><b>${t.name}</b><span class="dim">${t.desc}</span></div>` : ''; }).join('')}</div></div>
        <div class="sec"><div class="sec-title">지금 상황</div>${this.statusSituation()}</div>
        <div class="row end sec">${forExam ? '<button class="primary" data-act="st-go">시험 보러 가기</button>' : '<button class="primary" data-act="st-back">닫기</button>'}</div></div>`;
    },
    showStatusCheck(forExam) {
      if (forExam) { this.screen = 'game'; this.render(); }
      this.modal(this.statusHtml(forExam), 'st-modal');
      const box = document.getElementById('modal-box'); if (box) box.scrollTop = 0;
    },
  });

  // 시험 시작 전에 한 번 끼워 넣는다
  const baseStart = UI.startExam;
  UI.startExam = function () {
    const p = G.player;
    if (p && !p.statusSeen && !this._stGo) { this._stPending = true; return this.showStatusCheck(true); }
    return baseStart.apply(this, arguments);
  };

  // 정보 탭에 다시 보기 버튼
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.apply(this, arguments);
    return html.replace('<div class="sec"><div class="sec-title">직업</div>', '<div class="sec"><button class="full" data-act="st-view">내 상태 한눈에 (직업·기술·상성·상황)</button></div><div class="sec"><div class="sec-title">직업</div>');
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'st-go') {
      this._stPending = false; if (G.player) { G.player.statusSeen = true; G.save(); }
      this.closeModal(); this._stGo = true;
      try { return this.startExam(); } finally { this._stGo = false; }
    }
    if (act === 'st-view') { this._stFrom = this.sheet; return this.showStatusCheck(false); }
    if (act === 'st-back') { const s = this._stFrom; this._stFrom = null; if (s && this.openSheet) return this.openSheet(s); this.closeModal(); return; }
    // 상태 확인 화면이 떠 있는 동안 '닫기'로 빠져나가면 시험이 사라지지 않게 다시 띄운다
    if (act === 'modal-close' && this._stPending && document.querySelector('#modal-box [data-act="st-go"]')) return this.showStatusCheck(true);
    return baseHandle.call(this, act, v);
  };
}
