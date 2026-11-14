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
      const sk0 = skillById(id); if (!sk0) return '';
      let sk = sk0; try { sk = (G.skillEff && G.skillEff(sk0)) || sk0; } catch (e) { sk = sk0; } // 전투에서 보이는 이름·소모와 같게(접사 반영)
      const p = G.player; const e = sk.elem === 'self' ? p.element : sk.elem;
      return `<button class="st-sk" data-act="st-sk" data-v="${id}">${e && ELEMENTS[e] ? FX.elemIcon(e, 14) : `<svg class="st-phys" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9d3e3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 17 7l2-4 2 2-4 2L5 19zM4 16l4 4M3 21l2-2"/></svg>`}<b>${sk.name}</b><span class="tag">${TYPE_NAME[sk.type] || '특수'}</span><span class="small dim">MP ${sk.mp}</span><span class="st-more">›</span></button>`;
    },
    statusInvHtml() {
      const p = G.player;
      const gear = Object.keys(p.equip || {}).map((sl) => p.equip[sl]).filter(Boolean).map((it) => `<div class="small"><span class="dim">${this.slotName ? this.slotName(it.slot) : ''}</span> ${it.name}</div>`).join('');
      const cons = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).filter((c) => p.items[c.id]).map((c) => `<div class="small"><span class="dim">소모품</span> ${c.name} ×${p.items[c.id]}</div>`).join('');
      return `<div class="small"><span class="dim">돈</span> <b class="num">${fmt(p.money)}</b> 크레딧</div>` + gear + cons;
    },
    statusPop(html) {
      if (this.hideSkillHold) this.hideSkillHold();
      document.body.insertAdjacentHTML('beforeend', `<div class="skill-hold-wrap" id="skill-hold">${fixJosa(html)}</div>`);
    },
    statusSituation() {
      const p = G.player; const bg = BACKGROUNDS.find((b) => b.id === p.bg);
      const friend = G.npcs.find((n) => n.friendhood && n.alive !== false);
      const log = p.proLog || []; const last = log.length ? log[log.length - 1] : null;
      return `<div class="small">${G.ageYears()}세 · ${G.region().name}</div>
        <div class="small dim">${bg ? `${bg.name}(으)로 살다 얼마 전 각성했다. ` : ''}${last ? `${last} ` : ''}게이트에 들어가려면 협회 자격 시험부터 통과해야 한다.${friend ? ` 소꿉친구 ${friend.name}도 이 도시에 있다.` : ''}</div>`;
    },
    statusHtml(forExam) {
      const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const E = ELEMENTS[p.element];
      const skills = p.skills.filter((id) => id !== 'strike');
      return `<div class="st-check">
        <div class="st-scroll">
        <div class="st-hero">${this.playerPortrait(320)}
          <div class="st-hero-name"><div><b class="st-name">${p.name}</b><span class="st-age">${G.ageYears()}세</span></div><div class="st-nameline">${this.clsTag(p.cls, p.clsAdv)}${this.elemTag(p.element)}</div></div></div>
        <div class="st-box" style="border-left-color:${g.color}"><b>${className(p.cls, p.clsAdv)}</b> <span class="small" style="color:${g.color}">${g.name} · ${CLASS_RARITY[k.r]} · ${ROLE_TXT[k.role] || k.role}</span>
          <div class="small dim">${k.desc}<br>전직: ${[k.name, ...k.adv].map((n, i) => (i === p.clsAdv ? `<b class="amber">${n}</b>` : n)).join('→')} (C·S급)</div></div>
        <div class="st-t">기술 · 누르면 자세히</div><div class="st-sks">${skills.map((id) => this.statusSkillHtml(id)).join('')}</div>
        <div class="st-t">능력치</div>
        <div class="st-stats">${STAT.map(([key, nm]) => `<span><i>${nm}</i><b class="num">${Math.round(p[key] || 0)}</b></span>`).join('')}</div>
        <div class="st-t">특성</div><div class="st-traits">${p.traits.map((id) => { const t = traitById(id); return t ? `<div class="st-tr"><b>${t.name}</b> <span class="small dim">${t.desc}</span></div>` : ''; }).join('')}${(p.ltraits || []).map((id) => { const t = typeof ltraitById === 'function' && ltraitById(id); return t ? `<div class="st-tr"><b class="${t.neg ? 'bad' : ''}">${t.name}</b> <span class="small dim">${typeof modsText === 'function' ? modsText(t.mods) + ' · ' : ''}${t.how}</span></div>` : ''; }).join('')}</div>
        <div class="st-t">소지품</div><div class="st-inv">${this.statusInvHtml()}</div>
        </div>
        <div class="st-foot">${forExam ? '<button class="primary full" data-act="st-go">시험 보러 가기</button>' : '<button class="primary full" data-act="st-back">닫기</button>'}</div></div>`;
    },
    showStatusCheck(forExam) {
      if (forExam) { this.screen = 'game'; this.render(); }
      this.modal(this.statusHtml(forExam), 'st-modal');
      document.body.classList.add('st-open'); // 소지품에 돈이 나오니 위쪽 크레딧 표시(hud_money)는 숨긴다
      const box = document.getElementById('modal-box'); if (box) box.scrollTop = 0;
    },
  });

  const baseModal = UI.modal, baseCloseM = UI.closeModal;
  UI.modal = function (html, cls = '') { if (!String(cls).includes('st-modal')) document.body.classList.remove('st-open'); return baseModal.apply(this, arguments); };
  UI.closeModal = function () { document.body.classList.remove('st-open'); return baseCloseM.apply(this, arguments); };

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
    // 사용자 요청: '내 상태 한눈에' 단추와 직업 칸 삭제(직업은 위 태그로 보인다)
    return html; // 칸 지우기는 js/char_trim.js(빌드 맨 뒤)에서
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'st-go') {
      this._stPending = false; if (G.player) { G.player.statusSeen = true; G.save(); }
      this.closeModal(); this._stGo = true;
      try { return this.startExam(); } finally { this._stGo = false; }
    }
    if (act === 'st-sk') { const sk = skillById(v); if (sk) this.statusPop(this.skillHoldHtml(sk, { elem: G.player.element, name: '', mp: G.player.mp })); return; }
    if (act === 'st-tr') { const t = traitById(v); if (t) this.statusPop(`<div class="skill-hold"><div class="sh-head"><b>${t.name}</b><span class="small dim">특성</span></div><p class="small">${t.desc}</p><div class="small dim sh-tip">아무 곳이나 누르면 닫힙니다.</div></div>`); return; }
    if (act === 'st-view') { this._stFrom = this.sheet; return this.showStatusCheck(false); }
    if (act === 'st-back') { const s = this._stFrom; this._stFrom = null; if (s && this.openSheet) return this.openSheet(s); this.closeModal(); return; }
    // 상태 확인 화면이 떠 있는 동안 '닫기'로 빠져나가면 시험이 사라지지 않게 다시 띄운다
    if (act === 'modal-close' && this._stPending && document.querySelector('#modal-box [data-act="st-go"]')) return this.showStatusCheck(true);
    return baseHandle.call(this, act, v);
  };
}
