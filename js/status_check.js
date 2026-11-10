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
  const ROLE_TXT = { tank: '탱커', melee: '근접 딜러', assassin: '암살자', ranged: '원거리 딜러', caster: '마법 딜러', support: '지원', summoner: '소환사', esper: '이능력자' };
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
      const p = G.player; const e = sk.elem === 'self' ? p.element : sk.elem;
      return `<button class="st-sk" data-act="st-sk" data-v="${id}">${e && ELEMENTS[e] ? FX.elemIcon(e, 14) : '<i class="st-dot"></i>'}<b>${sk.name}</b><span class="tag">${TYPE_NAME[sk.type] || '특수'}</span><span class="small dim">MP ${sk.mp}</span><span class="st-more">›</span></button>`;
    },
    statusPop(html) {
      if (this.hideSkillHold) this.hideSkillHold();
      document.body.insertAdjacentHTML('beforeend', `<div class="skill-hold-wrap" id="skill-hold">${fixJosa(html)}</div>`);
    },
    statusSituation() {
      const p = G.player; const bg = BACKGROUNDS.find((b) => b.id === p.bg);
      const friend = G.npcs.find((n) => n.friendhood && n.alive !== false);
      const log = p.proLog || []; const last = log.length ? log[log.length - 1] : null;
      const items = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).filter((c) => p.items[c.id]).map((c) => `${c.name} ${p.items[c.id]}`).join(' · ');
      return `<div class="small">${G.ageYears()}세 · ${G.region().name} · <b class="num">${fmt(p.money)}</b> 크레딧${items ? ` · ${items}` : ''}</div>
        <div class="small dim">${bg ? `${bg.name}(으)로 살다 얼마 전 각성했다. ` : ''}${last ? `${last} ` : ''}게이트에 들어가려면 협회 자격 시험부터 통과해야 한다.${friend ? ` 소꿉친구 ${friend.name}도 이 도시에 있다.` : ''}</div>`;
    },
    statusHtml(forExam) {
      const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const E = ELEMENTS[p.element];
      const skills = p.skills.filter((id) => id !== 'strike');
      return `<div class="st-check">
        <div class="st-scroll">
        <div class="st-head">${this.playerPortrait(56)}<div><div class="eyebrow">${forExam ? '내 상태 확인' : '내 상태 한눈에'}</div><b class="st-name">${p.name}</b> ${this.clsTag(p.cls, p.clsAdv)} ${this.elemTag(p.element)}</div></div>
        <div class="st-box" style="border-left-color:${g.color}"><b>${className(p.cls, p.clsAdv)}</b> <span class="small" style="color:${g.color}">${g.name} · ${CLASS_RARITY[k.r]} · ${ROLE_TXT[k.role] || k.role}</span>
          <div class="small dim">${k.desc}<br>전직: ${[k.name, ...k.adv].map((n, i) => (i === p.clsAdv ? `<b class="amber">${n}</b>` : n)).join('→')} (C·S급)</div></div>
        <div class="st-sit">${this.statusSituation()}</div>
        <div class="st-t">기술 · 누르면 자세히</div><div class="st-sks">${skills.map((id) => this.statusSkillHtml(id)).join('')}</div>
        <div class="st-t">능력치</div>
        <div class="st-stats">${STAT.map(([key, nm]) => `<span><i>${nm}</i><b class="num">${Math.round(p[key] || 0)}</b></span>`).join('')}<span><i>재능</i><b class="num">${p.talent}/10</b></span></div>
        <div class="st-t">선천 특성</div><div class="st-traits">${p.traits.map((id) => { const t = traitById(id); return t ? `<button class="tag st-tr" data-act="st-tr" data-v="${id}"><b>${t.name}</b> ›</button>` : ''; }).join('')}</div>
        </div>
        <div class="st-foot">${forExam ? '<button class="primary full" data-act="st-go">시험 보러 가기</button>' : '<button class="primary full" data-act="st-back">닫기</button>'}</div></div>`;
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
    if (act === 'st-sk') { const sk = skillById(v); if (sk) this.statusPop(this.skillHoldHtml(sk, { elem: G.player.element, name: '', mp: G.player.mp })); return; }
    if (act === 'st-tr') { const t = traitById(v); if (t) this.statusPop(`<div class="skill-hold"><div class="sh-head"><b>${t.name}</b><span class="small dim">선천 특성</span></div><p class="small">${t.desc}</p><div class="small dim sh-tip">아무 곳이나 누르면 닫힙니다.</div></div>`); return; }
    if (act === 'st-view') { this._stFrom = this.sheet; return this.showStatusCheck(false); }
    if (act === 'st-back') { const s = this._stFrom; this._stFrom = null; if (s && this.openSheet) return this.openSheet(s); this.closeModal(); return; }
    // 상태 확인 화면이 떠 있는 동안 '닫기'로 빠져나가면 시험이 사라지지 않게 다시 띄운다
    if (act === 'modal-close' && this._stPending && document.querySelector('#modal-box [data-act="st-go"]')) return this.showStatusCheck(true);
    return baseHandle.call(this, act, v);
  };
}
