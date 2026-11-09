// ===== 게이트 크로니클: 시작 방식 선택과 각성 전야 =====

const NAME_KEY = 'gate_chronicle_last_name';

Object.assign(UI, {
  lastName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } },
  saveName(n) { try { localStorage.setItem(NAME_KEY, n); } catch (e) { /* 저장 불가 */ } },
  randomName(gender) { return RNG.pick(SURNAMES) + RNG.pick(gender === 'F' ? GIVEN_F : GIVEN_M); },
  diceIcon() { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/></svg>'; },

  // ---------- 시작 방식 ----------
  renderMode() {
    $app.innerHTML = `<div class="create mode-screen">
      <div class="create-head"><div class="eyebrow">새로운 각성</div><h2>어떻게 시작할까요</h2></div>
      <div class="mode-grid">
        <button class="mode-card primary-card" data-act="mode-story">
          <span class="eyebrow">추천</span><b>이야기로 각성</b>
          <span>이름과 성별만 정하고 이야기를 따라갑니다. 출신은 운명에 맡기고, 각성의 순간에 내린 선택들이 속성·직업·재능·특성을 정합니다.</span>
          <span class="small dim">사연 50가지 · 각성 이야기 13갈래 · 3~5분</span></button>
        <button class="mode-card" data-act="mode-manual">
          <b>직접 설정</b>
          <span>출신, 속성, 직업 후보, 특성을 직접 고릅니다.</span>
          <span class="small dim">바로 시작</span></button>
      </div>
      <div class="row end"><button class="ghost" data-act="to-title">돌아가기</button></div>
    </div>`;
  },

  // ---------- 이야기 준비: 이름, 성별 ----------
  renderStorySetup() {
    const s = this.pro;
    $app.innerHTML = `<div class="create">
      <div class="create-head"><div class="eyebrow">각성 전야</div><h2>당신은 누구입니까</h2></div>
      <div class="create-grid">
        <div class="panel id-preview">${FX.portrait(s.look, s.gender, null, 0, 240)}<button class="ghost full" data-act="ps-look">외형 바꾸기</button></div>
        <div class="panel">
          <label class="sec-title" for="in-name">이름</label>
          <div class="name-row"><input id="in-name" type="text" maxlength="8" placeholder="이름을 입력" value="${s.name}"><button class="icon-btn dice" data-act="name-dice" aria-label="무작위 이름">${this.diceIcon()}</button></div>
          <div class="sec"><div class="sec-title">성별</div><div class="row">
            <button class="choice ${s.gender === 'M' ? 'sel' : ''}" data-act="ps-gender" data-v="M">남성</button>
            <button class="choice ${s.gender === 'F' ? 'sel' : ''}" data-act="ps-gender" data-v="F">여성</button></div></div>
          <p class="dim sec">출신은 정할 수 없습니다. 어떤 삶에서 시작할지는 이야기가 정합니다.</p>
          <div class="row end"><button class="ghost" data-act="new">뒤로</button><button class="primary" data-act="ps-start">이야기 시작</button></div>
        </div>
      </div></div>`;
    const inp = document.getElementById('in-name');
    inp.addEventListener('input', () => { s.name = inp.value; });
  },

  // ---------- 프롤로그 진행 ----------
  proLeadElem() { const e = this.pro.sc.e; let best = null, bv = 0; for (const k of ELEMENT_KEYS) if ((e[k] || 0) > bv) { bv = e[k]; best = k; } return best; },
  // {name} {friend} {friendJob} 치환과 앞 선택 기억 {?플래그:있을 때|없을 때} / {?!플래그:없을 때|있을 때}
  proFill(t) { return fixJosa(proText(String(t), this.pro.flags || {}).replace(/\{name\}/g, this.pro.name).replace(/\{friend\}/g, this.pro.friend.name).replace(/\{friendJob\}/g, this.pro.friend.job || '')); },
  renderPrologue() {
    const s = this.pro; const sc = PROLOGUE[s.id]; s.flags = s.flags || {};
    if (!document.getElementById('pro-cv')) {
      $app.innerHTML = `<div class="prologue"><canvas id="pro-cv" aria-hidden="true"></canvas><div class="pro-inner"><aside class="pro-side" id="pro-side"></aside><section class="pro-scene" id="pro-scene"></section></div></div>`;
      this.stopPro = FX.title(document.getElementById('pro-cv'));
    }
    const lead = this.proLeadElem();
    const bg = BACKGROUNDS.find((b) => b.id === s.bg);
    document.getElementById('pro-side').innerHTML = fixJosa(`${FX.portrait(s.look, s.gender, lead, 0, 200)}
      <div class="pro-name">${s.name}</div>
      <div class="small dim">${bg.name} · ${regionById(bg.region).name}</div>
      ${lead ? `<div class="small">${this.elemTag(lead)} 기운이 감돈다</div>` : '<div class="small dim">아직 아무것도 깨어나지 않았다</div>'}
      <div class="pro-steps">${Array.from({ length: 8 }, (_, i) => `<i class="${i < s.step ? 'on' : i === s.step ? 'now' : ''}"></i>`).join('')}</div>`);
    const el = document.getElementById('pro-scene');
    el.innerHTML = `<div class="eyebrow">${s.step === 0 ? `출신 · ${bg.name}` : `장면 ${s.step + 1}`}</div><h2>${this.proFill(sc.title)}</h2>
      ${s.step === 1 && s.introTitle ? `<p class="pro-gap dim small">— 「${s.introTitle}」 그 뒤 —${(() => { const ch = typeof PRO_HOOKS_CH !== 'undefined' && PRO_HOOKS_CH[s.introId + ':' + s.introPick]; const h = ch || (!/^(gb_|gate_break)/.test(s.id) && typeof PRO_HOOKS !== 'undefined' && PRO_HOOKS[s.introId]); return h ? `<br>${this.proFill(h)}` : ''; })()}</p>` : ''}
      <div class="pro-text">${this.proFill(proSceneText(sc, s.flags)).split('\n').map((l) => (l ? `<p>${l}</p>` : '')).join('')}</div>
      <div class="cards pro-choices">${this.proShown(s.id).map((i) => `<button class="choice-btn" data-act="pro-choice" data-v="${i}">${this.proFill(sc.choices[i].text)}</button>`).join('')}</div>`;
    el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in');
    el.scrollTop = 0;
  },
  // 선택지가 많은 장면은 그중 3개만 보여 준다 (무엇이 나올지도 운명)
  proShown(id) {
    const s = this.pro; s.shown = s.shown || {};
    if (!s.shown[id]) {
      const idx = PROLOGUE[id].choices.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      s.shown[id] = idx.slice(0, 3).sort((a, b) => a - b);
    }
    return s.shown[id];
  },
  proChoose(i) {
    const s = this.pro; const ch = PROLOGUE[s.id].choices[i]; s.flags = s.flags || {};
    proRemember(s.sc, s.flags, s.id, ch);
    for (const k of ['e', 'g', 'c', 't']) for (const [x, v] of Object.entries(ch[k] || {})) s.sc[k][x] = (s.sc[k][x] || 0) + v;
    s.sc.talent += ch.talent || 0; s.sc.luck += ch.luck || 0; s.friendBonus += ch.friend || 0;
    s.log.push(this.proFill(ch.text));
    if (s.step === 0) { s.introTitle = PROLOGUE[s.id].title; s.introId = s.id; s.introPick = i; }
    s.step++;
    // 마지막 선택이 끝나면 결과를 보여 주지 않고 바로 헌터 자격 시험으로 간다. 판정 결과는 시험이 끝난 뒤에 공개된다
    if (!ch.next) { s.result = resolvePrologue(s.sc); return this.handle('pro-begin'); }
    s.id = ch.next;
    this.renderPrologue();
  },

  // ---------- 각성 결과 ----------
  // 시험이 끝난 뒤 보여 주는 판정 결과 (재능·소꿉친구·선택 기록은 숨긴다)
  judgmentHtml() {
    const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const bg = BACKGROUNDS.find((b) => b.id === p.bg) || BACKGROUNDS[0];
    const R = RANKS[p.rankIdx]; const negIds = ['cursed', 'frail', 'slow_learner', 'reckless'];
    return `<div class="eyebrow">국가 각성자 관리국 · 판정 결과</div><h2>헌터 ${p.name}</h2>
      <div class="result-grid">
        <div class="res-item"><span class="sec-title">등급</span><b><span class="tag rank" style="--c:${R.color}">${R.key}급</span></b><span class="small dim">협회 실기 시험 후 측정</span></div>
        <div class="res-item"><span class="sec-title">출신</span><b>${bg.name}</b><span class="small dim">${bg.desc}</span></div>
        <div class="res-item"><span class="sec-title">속성</span><b>${this.elemTag(p.element)}</b><span class="small dim">${ELEMENTS[p.element].name} · ${elemVsText(p.element)}</span></div>
        <div class="res-item wide" style="border-color:${g.color}"><span class="sec-title">직업</span><b style="color:${g.color}">${k.name} <span class="tag rar r${k.r}">${CLASS_RARITY[k.r]}</span></b><span class="small" style="color:${g.color}">${g.name} · 전직 ${k.adv.join(' → ')}</span><span class="small dim">${k.desc}</span><span class="small">${k.skills.map((x) => x[0]).join(' · ')}</span></div>
      </div>
      <div class="sec-title sec">선천 특성</div><div class="cards traits">${p.traits.map((id) => { const t = traitById(id); return `<div class="trait ${negIds.includes(id) ? 'neg' : ''}"><b>${t.name}</b><span class="dim">${t.desc}</span></div>`; }).join('')}</div>`;
  },
  renderProResult() {
    const s = this.pro; const r = s.result;
    const k = classById(r.cls); const g = CLASS_GROUPS[k.g]; const bg = BACKGROUNDS.find((b) => b.id === s.bg);
    const negIds = ['cursed', 'frail', 'slow_learner', 'reckless'];
    const talent = Math.max(1, r.talent + (bg.talent || 0) + r.traits.reduce((a, t) => a + (traitById(t).mods.talent || 0), 0));
    document.getElementById('pro-side').innerHTML = fixJosa(`${FX.portrait(s.look, s.gender, r.element, 0, 200)}<div class="pro-name">${s.name}</div><div class="small dim">${bg.name}</div>`);
    const el = document.getElementById('pro-scene');
    el.innerHTML = fixJosa(`<div class="eyebrow">국가 각성자 관리국 · 판정 결과</div><h2>각성</h2>
      <div class="result-grid">
        <div class="res-item"><span class="sec-title">출신</span><b>${bg.name}</b><span class="small dim">${bg.desc}</span></div>
        <div class="res-item"><span class="sec-title">속성</span><b>${this.elemTag(r.element)}</b><span class="small dim">${ELEMENTS[r.element].name} · ${elemVsText(r.element)}</span></div>
        <div class="res-item wide" style="border-color:${g.color}"><span class="sec-title">직업</span><b style="color:${g.color}">${k.name} <span class="tag rar r${k.r}">${CLASS_RARITY[k.r]}</span></b><span class="small" style="color:${g.color}">${g.name} · 전직 ${k.adv.join(' → ')}</span><span class="small dim">${k.desc}</span><span class="small">${k.skills.map((x) => x[0]).join(' · ')}</span></div>
        <div class="res-item"><span class="sec-title">재능</span><div class="talent"><div class="pips">${Array.from({ length: 10 }, (_, i) => `<i class="${i < talent ? 'on' : ''}"></i>`).join('')}</div><b>${talent}</b></div></div>
        <div class="res-item"><span class="sec-title">소꿉친구</span><b>${s.friend.name}</b><span class="small dim">당신을 ${s.friendBonus >= 30 ? '누구보다 믿는다' : s.friendBonus >= 15 ? '걱정하고 응원한다' : '여전히 곁에 있다'}</span></div>
      </div>
      <div class="sec-title sec">선천 특성</div><div class="cards traits">${r.traits.map((id) => { const t = traitById(id); return `<div class="trait ${negIds.includes(id) ? 'neg' : ''}"><b>${t.name}</b><span class="dim">${t.desc}</span></div>`; }).join('')}</div>
      <div class="sec-title sec">당신이 내린 선택</div><div class="logs pro-log">${s.log.map((l, i) => `<div class="l"><span class="d">${i + 1}</span>${l}</div>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="pro-restart">처음부터 다시</button><button class="primary" data-act="pro-begin">이 운명으로 시작</button></div>`);
    el.classList.remove('fade-in'); void el.offsetWidth; el.classList.add('fade-in'); el.scrollTop = 0;
  },
  beginFromPrologue() {
    const s = this.pro; const r = s.result;
    G.newGame({ name: s.name, gender: s.gender, bg: s.bg, element: r.element, talent: r.talent, traits: r.traits, look: s.look, cls: r.cls, awakenRank: r.rank });
    // 소꿉친구가 실제 인물로 등장한다
    const p = G.player; const f = G.makeNpc(true);
    f.name = s.friend.name; f.gender = s.friend.gender; f.rankIdx = 0; f.stage = 0; f.ageMonths = p.ageMonths + RNG.int(-6, 6);
    f.region = p.region; f.met = true; f.relation = Math.min(90, 35 + s.friendBonus); f.personality = RNG.pick(['kind', 'just', 'kind']);
    // 프롤로그에서 친구에게 일어난 일이 이어진다
    const fl = s.flags || {};
    if (fl.friend_awakened) { f.rankIdx = 1; f.stage = 1; f.relation = Math.min(95, f.relation + 10); }
    if (fl.friend_hurt) f.relation = Math.min(95, f.relation + 5);
    f.job = s.friend.job;
    f.links = {}; f.disciples = []; f.parents = []; f.friendhood = true;
    G.npcs.push(f);
    G.lifeEvent(`각성했다. 소꿉친구 ${f.name}이(가) 곁에 있었다.`);
    G.save();
    this.saveName(s.name);
    if (this.stopPro) { this.stopPro(); this.stopPro = null; }
    this.screen = 'game'; this.render();
    this.modal(`<div class="ending">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()} · ${G.region().name}</div><h2>헌터 ${p.name}</h2></div>
      <p>${className(p.cls)} · ${ELEMENTS[p.element].name} 속성 · 등급 측정 전. 지도에서 빛나는 칸을 눌러 걸어 다니고, 도시에 들어가 의뢰를 받으며 살아가십시오. 정해진 길은 없습니다.</p>
      <p class="dim">소꿉친구 ${f.name}은(는) ${G.region().name}에 있습니다. 인물 창에서 만날 수 있습니다.</p>
      <div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`);
  },
});

// 화면 전환과 입력 처리 확장
{
  const baseRender = UI.render;
  UI.render = function () {
    if (!['prologue', 'pro-result'].includes(this.screen) && this.stopPro) { this.stopPro(); this.stopPro = null; }
    if (this.screen === 'pro-result') { if (!document.getElementById('pro-cv')) { this.screen = 'prologue'; const keep = this.pro.id; this.renderPrologue(); this.pro.id = keep; this.screen = 'pro-result'; } return this.renderProResult(); }
    return baseRender.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'mode-story': {
        const gender = 'M';
        this.pro = { name: this.lastName(), gender, look: Math.random().toString(36).slice(2), bg: null, friend: null, id: null, sc: null, step: 0, friendBonus: 0, log: [] };
        this.screen = 'story-setup'; return this.render();
      }
      case 'mode-manual': return this.startCreate();
      case 'name-dice': {
        const inp = document.getElementById('in-name');
        const target = this.screen === 'story-setup' ? this.pro : this.create;
        target.name = this.randomName(target.gender);
        if (inp) inp.value = target.name;
        const n = document.querySelector('.id-name'); if (n) n.textContent = target.name;
        return;
      }
      case 'ps-gender': this.pro.gender = v; return this.render();
      case 'ps-look': this.pro.look = Math.random().toString(36).slice(2); return this.render();
      case 'ps-start': {
        const s = this.pro; s.name = (s.name || '').trim();
        if (!s.name) return this.toast('이름을 입력하세요.');
        this.saveName(s.name);
        s.bg = proPickBg();
        const fg = RNG.chance(0.5) ? 'M' : 'F';
        s.friend = { name: this.randomName(fg), gender: fg, job: RNG.pick(PRO_FRIEND_JOBS) };
        s.id = RNG.pick(PROLOGUE_START[s.bg]); s.sc = { e: {}, g: {}, c: {}, t: {}, talent: 0, luck: 0 }; s.step = 0; s.friendBonus = 0; s.log = []; s.shown = {};
        this.screen = 'prologue'; return this.render();
      }
      case 'pro-choice': return this.proChoose(+v);
      case 'pro-restart': { const s = this.pro; s.bg = proPickBg(); s.id = RNG.pick(PROLOGUE_START[s.bg]); s.sc = { e: {}, g: {}, c: {}, t: {}, talent: 0, luck: 0 }; s.step = 0; s.friendBonus = 0; s.log = []; s.shown = {}; this.screen = 'prologue'; return this.renderPrologue(); }
      case 'pro-begin': return this.beginFromPrologue();
      default: return baseHandle.call(this, act, v);
    }
  };
}

// 꿈 갈래: 예지몽·수면 연구 길이면 신당(dream_2) 대신 그 길로
{
  const baseChoose = UI.proChoose;
  UI.proChoose = function (i) {
    const r = baseChoose.call(this, i);
    const s = this.pro;
    if (s && s.id === 'dream_2' && s.flags) {
      const alt = s.flags.dream_seer ? 'dseer_2' : s.flags.dream_sleep ? 'dsleep_2' : null;
      if (alt && PROLOGUE[alt]) { s.id = alt; this.renderPrologue(); }
    }
    return r;
  };
}

// ---------- 속성은 각성하는 순간에 (docs/프롤로그_점검.md 2) ----------
// 각성 장면(모든 선택지가 속성 3점 이상) 밖의 선택은 속성이 아니라 "성향(lean)"만 쌓는다.
// 각성 장면에서는 다섯 모습을 모두 보여 주고, 성향에 맞는 둘을 먼저 "끌린다"로 표시한다. 고른 모습이 속성이 된다.
const PRO_BODY = { fire: '손끝이 뜨겁다. 심장이 북처럼 뛴다.', bolt: '머리카락이 곤두서고 손끝에서 따닥 소리가 난다.', water: '숨결이 차고 맑아진다. 손끝에 물방울이 맺힌다.', wood: '살갗 아래가 단단하게 굳는다. 발이 뿌리처럼 땅에 박힌다.', holy: '가슴 안쪽이 따뜻하게 밝아진다.', dark: '귓가에 누군가의 숨소리가 겹쳐 들린다. 그림자가 짙어진다.' };
function proIsAwaken(id) { const sc = PROLOGUE[id]; return !!(sc && sc.choices.length && sc.choices.every((c) => c.e && Math.max(...Object.values(c.e)) >= 3)); }
{
  const baseShown = UI.proShown;
  UI.proShown = function (id) {
    if (!proIsAwaken(id)) return baseShown.call(this, id);
    const s = this.pro; const lean = (s.sc && s.sc.lean) || {};
    s.shownAw ||= {}; if (s.shownAw[id]) return s.shownAw[id];
    return (s.shownAw[id] = proAwakenPick(PROLOGUE[id].choices, lean));
  };
  const baseRender = UI.renderPrologue;
  UI.renderPrologue = function () {
    const r = baseRender.call(this);
    const s = this.pro;
    if (s && proIsAwaken(s.id)) {
      const lean = (s.sc && s.sc.lean) || {};
      const top = Object.entries(lean).sort((a, b) => b[1] - a[1]).filter(([, v]) => v > 0).slice(0, 2).map(([k]) => k);
      for (const b of document.querySelectorAll('#pro-scene [data-act="pro-choice"]')) {
        const c = PROLOGUE[s.id].choices[+b.dataset.v]; const el = Object.keys(c.e).sort((a, x) => c.e[x] - c.e[a])[0];
        if (top.includes(el)) b.insertAdjacentHTML('beforeend', ' <span class="small amber">· 몸이 끌린다</span>');
      }
    }
    if (s && s.bodyNote) { const t = document.querySelector('#pro-scene .pro-text'); if (t) t.insertAdjacentHTML('afterbegin', `<p class="small amber">${s.bodyNote}</p>`); s.bodyNote = null; }
    return r;
  };
  const baseChoose = UI.proChoose;
  UI.proChoose = function (i) {
    const s = this.pro; const id = s.id; const ch = PROLOGUE[id] && PROLOGUE[id].choices[i];
    const aw = proIsAwaken(id);
    if (ch && ch.e && !aw) {
      // 성향만: 기본 처리 뒤 속성 점수에서 빼고 성향으로 옮긴다
      s.sc.lean ||= {};
      for (const [x, v] of Object.entries(ch.e)) s.sc.lean[x] = (s.sc.lean[x] || 0) + v;
    }
    if (ch && aw) { const el = Object.keys(ch.e).sort((a, b) => ch.e[b] - ch.e[a])[0]; s.bodyNote = PRO_BODY[el] || null; }
    const before = ch && ch.e && !aw ? { ...s.sc.e } : null;
    const r = baseChoose.call(this, i);
    if (before && this.pro === s && s.sc) { for (const [x, v] of Object.entries(ch.e)) s.sc.e[x] = Math.max(0, (s.sc.e[x] || 0) - v); }
    return r;
  };
  // 옆 화면의 "기운"은 성향과 각성 결과를 함께 본다
  UI.proLeadElem = function () { const s = this.pro; const e = s.sc.e || {}; const l = s.sc.lean || {}; let best = null, bv = 0; for (const k of ELEMENT_KEYS) { const v = (e[k] || 0) * 3 + (l[k] || 0); if (v > bv) { bv = v; best = k; } } return best; };
}
