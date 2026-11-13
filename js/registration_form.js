// 프롤로그 직후, 시험 전 상태 확인을 승인된 종이 신청서 형식으로 표시한다.
// 정보 탭의 재열람과 기존 st-go·st-sk 동작은 그대로 사용한다.
// 제출 시: 서명란에 이름 서명 → 화면 페이드아웃 → 시험장 페이드인.
(() => {
  const base = UI.statusHtml;
  UI.statusHtml = function (forExam) {
    if (!forExam) return base.call(this, forExam);
    const p = G.player, k = classById(p.cls), g = CLASS_GROUPS[k.g], bg = BACKGROUNDS.find((x) => x.id === p.bg), E = ELEMENTS[p.element];
    const skills = p.skills.filter((id) => id !== 'strike');
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const row = (name, value) => `<div class="reg-field"><dt>${name}</dt><dd>${value}</dd></div>`;
    const section = (n, title, body) => `<section class="reg-section"><h3><span>${n}</span>${title}</h3>${body}</section>`;
    return `<div class="st-check registration"><div class="st-scroll reg-paper">
 <header class="reg-header"><div class="reg-agency">국가 각성자 관리국<span>신규 각성자 접수</span></div><div class="reg-heading"><div><div class="reg-kicker">신규 등록 · 실기 시험 전</div><h2>각성자 등록 신청서</h2></div><div class="reg-stamp">등급<br><b>측정 대기</b></div></div><p class="reg-intro">신청인의 인적 사항 및 각성 현황을 확인합니다.</p></header>
 ${section('01', '신청인 정보', `<div class="reg-applicant"><dl>${row('성명', `<strong>${esc(p.name)}</strong>`)}${row('나이 / 성별', `${G.ageYears()}세 / ${p.gender === 'F' ? '여성' : '남성'}`)}${row('거주 지역', esc(G.region().name))}${row('출신', esc(bg?.name || '미기재'))}</dl><figure class="reg-photo">${this.playerPortrait(180)}<figcaption>신청인 사진</figcaption></figure></div>`)}
 ${section('02', '각성 현황', `<dl class="reg-awakening">${row('각성 직업', `<strong>${esc(className(p.cls, p.clsAdv))}</strong><span>${esc(g.name)} · ${esc(CLASS_RARITY[k.r])} · ${esc(({ tank: '탱커', melee: '근접 딜러', assassin: '암살자', ranged: '원거리 딜러', caster: '마법 딜러', support: '지원', summoner: '소환사', esper: '이능력자' })[k.role] || k.role)}</span>`)}${row('각성 속성', `<strong>${esc(E.name)}</strong><span>${esc(elemVsText(p.element))}</span>`)}${row('등록 등급', '<span class="reg-pending">실기 시험 후 측정</span>')}</dl><p class="reg-class-desc">${esc(k.desc)}</p><p class="reg-advance">전직 경로　${[k.name, ...k.adv].map(esc).join(' → ')} (C·S급)</p>`)}
 ${section('03', '보유 기술', `<div class="st-sks">${skills.map((id) => this.statusSkillHtml(id)).join('') || '<p>등록된 기술 없음</p>'}</div><p class="reg-hint">기술을 누르면 상세 내용을 확인할 수 있습니다.</p>`)}
 ${section('04', '기초 능력', `<div class="reg-stats">${[['maxHp', '체력'], ['maxMp', '정신력'], ['atk', '공격'], ['def', '방어'], ['spd', '속도'], ['luck', '운']].map(([key, name]) => `<div><span>${name}</span><b>${Math.round(p[key] || 0)}</b></div>`).join('')}</div>`)}
 ${section('05', '선천 특성', `<div class="reg-traits">${p.traits.map((id) => { const t = traitById(id); return t ? `<div><b>${esc(t.name)}</b><p>${esc(t.desc)}</p></div>` : ''; }).join('') || '<p>특이 사항 없음</p>'}</div>`)}
 ${section('06', '소지품', `<div class="st-inv">${this.statusInvHtml()}</div>`)}
 <footer class="reg-sign"><p>위 기재 사항을 확인하고 각성자 등록을 신청합니다.</p><div class="reg-sign-row"><span>신청인</span><b class="reg-sig-name">${esc(p.name)}</b><span class="reg-sig-spot" aria-label="서명란"><small>(서명)</small><i class="reg-sig-ink" aria-hidden="true"></i></span></div></footer>
 </div><div class="st-foot reg-action"><button class="primary full" data-act="st-go">신청서 제출 · 시험장으로 <span aria-hidden="true">→</span></button></div></div>`;
  };

  const showStatus = UI.showStatusCheck;
  UI.showStatusCheck = function (forExam) {
    const result = showStatus.apply(this, arguments);
    if (forExam) document.getElementById('modal-box')?.classList.add('registration-modal');
    return result;
  };

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  UI.playRegSubmit = async function (done) {
    if (this._regSigning) return;
    this._regSigning = true;
    const form = document.querySelector('.registration-modal .registration');
    const btn = form?.querySelector('[data-act="st-go"]');
    if (btn) btn.disabled = true;
    const reduced = (typeof FX !== 'undefined' && FX.reduced) || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const mul = reduced ? 0.15 : 1;
    const paper = form?.querySelector('.reg-paper');
    const sign = form?.querySelector('.reg-sign');
    if (paper && sign) {
      try { sign.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' }); }
      catch (e) { paper.scrollTop = paper.scrollHeight; }
    }
    form?.classList.add('reg-signing');
    const ink = form?.querySelector('.reg-sig-ink');
    if (ink) {
      ink.textContent = G.player?.name || '';
      ink.classList.remove('on');
      void ink.offsetWidth;
      ink.classList.add('on');
    }
    if (typeof SFX !== 'undefined') { try { SFX.play('click'); SFX.buzz?.(20); } catch (e) { /* 무시 */ } }
    await wait(Math.round(980 * mul));

    let veil = document.getElementById('reg-veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.id = 'reg-veil';
      veil.className = 'reg-veil';
      veil.setAttribute('aria-hidden', 'true');
      document.body.appendChild(veil);
    }
    veil.classList.remove('out');
    void veil.offsetWidth;
    veil.classList.add('in');
    await wait(Math.round(480 * mul));

    try { await done(); } finally {
      this._regSigning = false;
      void veil.offsetWidth;
      veil.classList.remove('in');
      veil.classList.add('out');
      setTimeout(() => { if (veil.parentNode) veil.remove(); }, Math.round(520 * mul) + 40);
    }
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'st-go' && document.querySelector('.registration-modal .registration') && !this._regSigning) {
      this.playRegSubmit(() => baseHandle.call(this, 'st-go', v));
      return;
    }
    if (this._regSigning && (act === 'st-go' || act === 'modal-close')) return;
    return baseHandle.call(this, act, v);
  };
})();
