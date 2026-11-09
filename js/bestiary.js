// ===== 게이트 크로니클: 괴수 도감 (영역 A-13, docs/헌터물_제안4_결합장르.md 3) =====
// 처음 만나면 그림자, 처치할수록 정보가 하나씩 열린다:
//   1마리: 모습·속성·행동 유형 / 3: 약점 속성(피해 +3%) / 6: 기술 / 10: 서식지(피해 +6%) / 20: 완전 기록(피해 +10%)
// 게이트 주제(서식지)·속성·등급대마다 모든 괴수의 약점을 열면 완성 보상(크레딧·에테르), 속성 완성은 칭호.
// 네임드 괴수(js/named.js)는 별도 칸. 저장: player.dex = { 괴수 이름: { seen, kills } }, player.dexDone = { 세트 id: 1 }

const DEX_STEPS = [
  { at: 1, name: '모습·속성·유형' },
  { at: 3, name: '약점', bonus: 0.03 },
  { at: 6, name: '기술' },
  { at: 10, name: '서식지', bonus: 0.06 },
  { at: 20, name: '완전 기록', bonus: 0.1 },
];
const DEX_TIER_BANDS = [[0, 1, '하급(F~E)'], [2, 3, '중급(D~C)'], [4, 5, '상급(B~A)'], [6, 7, '최상급(S~SS)']];
const DEX_ELEM_TITLE = { fire: ['염수 연구가', { atk: 0.03 }], bolt: ['뇌수 연구가', { spd: 0.03 }], water: ['수생 괴수 연구가', { hp: 0.04 }], wood: ['수림 괴수 연구가', { def: 0.03 }], holy: ['성역 괴수 연구가', { heal: 0.05 }], dark: ['심연 괴수 연구가', { mp: 0.05 }] };

const dexList = () => [...MONSTERS, ...(typeof MON_TREASURE !== 'undefined' ? [MON_TREASURE] : [])];
function dexSets() {
  const sets = [];
  for (const th of Object.keys(typeof THEME_MONSTERS !== 'undefined' ? THEME_MONSTERS : {})) sets.push({ id: 'th:' + th, kind: '서식지', name: th, list: THEME_MONSTERS[th].filter((n) => MONSTERS.some((m) => m.name === n)) });
  for (const e of ELEMENT_KEYS) { const list = MONSTERS.filter((m) => m.elem === e).map((m) => m.name); if (list.length) sets.push({ id: 'el:' + e, kind: '속성', name: ELEMENTS[e].name, elem: e, list }); }
  for (const [lo, hi, nm] of DEX_TIER_BANDS) sets.push({ id: 'tb:' + lo, kind: '등급', name: nm, tier: hi, list: MONSTERS.filter((m) => m.tier >= lo && m.tier <= hi).map((m) => m.name) });
  return sets;
}

// 속성 완성 칭호
if (typeof TITLES !== 'undefined') {
  for (const e of Object.keys(DEX_ELEM_TITLE)) {
    if (!ELEMENTS[e] || TITLES.some((t) => t.id === 'dex_' + e)) continue;
    const [name, mods] = DEX_ELEM_TITLE[e];
    TITLES.push({ id: 'dex_' + e, name, how: `도감: ${ELEMENTS[e].name} 속성 괴수 약점 모두 열기`, mods, cond: (g, p) => !!(p.dexDone && p.dexDone['el:' + e]) });
  }
  if (!TITLES.some((t) => t.id === 'dex_scholar')) {
    TITLES.push({ id: 'dex_field', name: '현장 조사관', how: '도감: 서식지 3곳 완성', mods: { luck: 0.05 }, cond: (g, p) => Object.keys(p.dexDone || {}).filter((k) => k.startsWith('th:')).length >= 3 });
    TITLES.push({ id: 'dex_scholar', name: '괴수 박물학자', how: '도감: 모든 괴수 완전 기록', mods: { atk: 0.05, def: 0.05 }, cond: (g, p) => MONSTERS.every((m) => ((p.dex || {})[m.name] || {}).kills >= 20) });
  }
}

Object.assign(Game.prototype, {
  dexEntry(name) { const p = this.player; p.dex ??= {}; return (p.dex[name] ??= { seen: 0, kills: 0 }); },
  dexKills(name) { const e = this.player && this.player.dex && this.player.dex[name]; return e ? e.kills : 0; },
  dexStep(name) { const k = this.dexKills(name); let s = -1; DEX_STEPS.forEach((st, i) => { if (k >= st.at) s = i; }); return s; },
  dexBonus(name) { const k = this.dexKills(name); let b = 0; for (const st of DEX_STEPS) if (st.bonus && k >= st.at) b = st.bonus; return b; },
  dexSeen(name) { if (!name || !this.player) return; this.dexEntry(name).seen++; },
  dexKill(name) {
    if (!name || !this.player || !dexList().some((m) => m.name === name)) return;
    const e = this.dexEntry(name); const before = this.dexStep(name);
    e.kills++; if (!e.seen) e.seen = 1;
    const after = this.dexStep(name);
    if (after > before && after >= 1) this.queue.push({ type: 'toast', text: `도감 · ${name}: ${DEX_STEPS[after].name} 열림${DEX_STEPS[after].bonus ? ` (피해 +${Math.round(DEX_STEPS[after].bonus * 100)}%)` : ''}` });
    if (after >= 1 && before < 1) this.dexCheckSets();
  },
  // 완성 세트 보상 (한 번만)
  dexCheckSets() {
    const p = this.player; p.dexDone ??= {};
    for (const s of dexSets()) {
      if (p.dexDone[s.id] || !s.list.length) continue;
      if (!s.list.every((n) => this.dexKills(n) >= 3)) continue;
      p.dexDone[s.id] = 1;
      const tier = s.tier ?? Math.max(...s.list.map((n) => (MONSTERS.find((m) => m.name === n) || { tier: 0 }).tier));
      const mul = RANKS[Math.min(7, tier)].mult;
      const money = Math.round(800 * mul), ether = Math.round(20 * mul ** 1.1);
      p.money += money; p.ether = (p.ether || 0) + ether;
      this.lifeEvent && this.lifeEvent(`괴수 도감 「${s.kind}: ${s.name}」을(를) 완성했다.`);
      this.queue.push({ type: 'toast', text: `도감 완성 · ${s.kind} ${s.name} (+${fmt(money)} 크레딧, 에테르 +${ether})` });
    }
  },
});

{
  const GP = Game.prototype;
  const base = GP.initSandbox;
  GP.initSandbox = function (...a) { const r = base.apply(this, a); const p = this.player; if (p) { p.dex ??= {}; p.dexDone ??= {}; } return r; };
}

// ---------- 전투 연결 ----------
{
  const CP = Combat.prototype;
  const dexName = (u) => u._tpl || String(u.name || '').replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, '');
  // 처치 기록: 주인공이 있는 실제 전투만
  const baseDown = CP.down;
  CP.down = function (u) {
    const r = baseDown.call(this, u);
    try { if (u.side === 'enemy' && !u.summon && !this.spar && this.player && this.game && this.game.dexKill) this.game.dexKill(dexName(u)); } catch (e) { /* 기록 실패는 전투를 막지 않는다 */ }
    return r;
  };
  // 열린 괴수에게 피해 보너스 (아군 모두)
  const baseCalc = CP.calcDamage;
  CP.calcDamage = function (att, def, skill, opt) {
    const r = baseCalc.call(this, att, def, skill, opt);
    if (att.side === 'ally' && def.side === 'enemy' && this.player && this.game && this.game.dexBonus) {
      const b = this.game.dexBonus(dexName(def));
      if (b) r.dmg = Math.max(1, Math.round(r.dmg * (1 + b)));
    }
    return r;
  };
}

// ---------- 화면 ----------
if (typeof UI !== 'undefined') {
  // 만남 기록: 전투 화면이 열릴 때
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) {
    try { const cb = this.ctx && this.ctx.combat; if (cb && !cb.spar) for (const u of cb.units) if (u.side === 'enemy' && !u.summon) G.dexSeen(u._tpl || String(u.name).replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, '')); } catch (e) { /* 무시 */ }
    return baseOpen.apply(this, a);
  };

  Object.assign(UI, {
    dexTab: 'all',
    dexHtml() {
      const p = G.player; p.dex ??= {};
      const all = dexList();
      const met = all.filter((m) => (p.dex[m.name] || {}).seen || (p.dex[m.name] || {}).kills).length;
      const open = all.filter((m) => G.dexStep(m.name) >= 1).length;
      const tabs = [['all', '괴수'], ['sets', '완성'], ['named', '네임드']];
      let body = '';
      if (this.dexTab === 'sets') body = this.dexSetsHtml();
      else if (this.dexTab === 'named') body = this.dexNamedHtml();
      else {
        for (const [lo, hi, nm] of DEX_TIER_BANDS) {
          const list = all.filter((m) => m.tier >= lo && m.tier <= hi && m.type !== 'treasure');
          body += `<div class="sec-title">${nm}</div><div class="dex-grid">${list.map((m) => this.dexCard(m)).join('')}</div>`;
        }
        body += `<div class="sec-title">특수</div><div class="dex-grid">${all.filter((m) => m.type === 'treasure').map((m) => this.dexCard(m)).join('')}</div>`;
      }
      return `<div class="panel dex"><h3>괴수 도감 <span class="small dim">만남 ${met} · 기록 ${open} / ${all.length}</span></h3>
        <p class="small dim">처치할수록 정보가 열린다. 약점 3 · 기술 6 · 서식지 10 · 완전 기록 20마리. 약점이 열린 괴수에게 피해 +3%, 서식지 +6%, 완전 기록 +10%.</p>
        <nav class="tabs dex-tabs">${tabs.map(([k, n]) => `<button class="${this.dexTab === k ? 'on' : ''}" data-act="dex-tab" data-v="${k}">${n}</button>`).join('')}</nav>${body}</div>`;
    },
    dexCard(m) {
      const e = G.player.dex[m.name] || {}; const st = G.dexStep(m.name);
      const art = st >= 0 ? FX.monster(m, 52) : `<span class="dex-shadow">${FX.monster(m, 52)}</span>`;
      const name = e.seen || e.kills ? m.name : '???';
      const next = DEX_STEPS[st + 1];
      return `<button class="dex-card ${st >= 4 ? 'full' : ''}" data-act="dex-mon" data-v="${m.name}">${art}<b>${name}</b><span class="small dim">${e.kills ? `${e.kills}마리` : e.seen ? '만남' : '미발견'}${next && e.kills ? ` · ${next.at - e.kills} 더` : ''}</span></button>`;
    },
    dexDetail(name) {
      const m = dexList().find((x) => x.name === name); if (!m) return '';
      const e = G.player.dex[name] || {}; const st = G.dexStep(name); const T = (typeof MON_TYPES !== 'undefined' && MON_TYPES[m.type]) || null;
      const lock = (i) => `<div class="small dim">🔒 ${DEX_STEPS[i].at}마리 처치 시 열림 (${e.kills || 0}/${DEX_STEPS[i].at})</div>`;
      let h = `<div class="dex-head">${st >= 0 ? FX.monster(m, 96) : `<span class="dex-shadow">${FX.monster(m, 96)}</span>`}<div class="grow"><h3>${e.seen || e.kills ? m.name : '???'}</h3>
        <div class="small dim">${RANKS[m.tier].key}급 무렵 · 만남 ${e.seen || 0} · 처치 ${e.kills || 0}</div>${G.dexBonus(name) ? `<div class="small good">이 괴수에게 피해 +${Math.round(G.dexBonus(name) * 100)}%</div>` : ''}</div></div>`;
      h += `<div class="sec-title">모습·속성·유형</div>` + (st >= 0 ? `<div>${UI.elemTag(m.elem)} ${T ? `<span class="tag" style="--c:${T.color};color:${T.color}">${T.name}</span>` : ''}</div>${T ? `<div class="small">${T.desc}</div>` : ''}${m.hab && m.type === 'treasure' ? `<div class="small dim">${m.hab}</div>` : ''}` : lock(0));
      h += `<div class="sec-title">약점</div>`;
      if (st >= 1) {
        const strong = ELEMENT_KEYS.filter((k) => elemEdge(k, m.elem) > 0), weak = ELEMENT_KEYS.filter((k) => elemEdge(k, m.elem) < 0);
        h += `<div class="small">잘 듣는 속성 ▲ ${strong.map((k) => UI.elemTag(k)).join(' ') || '없음'}</div><div class="small">저항하는 속성 ▼ ${weak.map((k) => UI.elemTag(k)).join(' ') || '없음'}</div>`;
      } else h += lock(1);
      h += `<div class="sec-title">기술</div>`;
      if (st >= 2) {
        const ts = typeof TYPE_SKILL !== 'undefined' && TYPE_SKILL[m.type] && skillById(TYPE_SKILL[m.type]);
        const el = SKILLS.filter((s) => s.elem === m.elem && !s.cls && (s.type === 'dmg' || s.type === 'aoe') && s.rankReq <= Math.floor(m.tier / 1.5)).slice(-2);
        const sig = typeof BOSS_SIG !== 'undefined' && BOSS_SIG[m.shape] && skillById(BOSS_SIG[m.shape]);
        const row = (s, tag) => `<div class="small"><b>${s.name}</b>${tag ? ` <span class="tag tiny">${tag}</span>` : ''} <span class="dim">${s.desc || ''}</span></div>`;
        h += row(skillById('strike')) + el.map((s) => row(s)).join('') + (ts ? row(ts, '유형') : '') + (sig ? row(sig, '보스일 때') : '');
        if (m.minion) h += `<div class="small dim">부르는 졸개: ${m.minion}</div>`;
      } else h += lock(2);
      h += `<div class="sec-title">서식지</div>`;
      if (st >= 3) {
        const hab = typeof monHabitats === 'function' ? monHabitats(name) : [];
        h += `<div class="small">${hab.length ? hab.map((x) => `<span class="tag">${x}</span>`).join(' ') : '어느 게이트에서나 드물게'}</div>${m.hab ? `<div class="small dim">${m.hab}</div>` : ''}<div class="small dim">${RANKS[Math.max(0, m.tier - 1)].key}~${RANKS[Math.min(7, m.tier + 1)].key}급 게이트</div>`;
      } else h += lock(3);
      h += `<div class="sec-title">완전 기록</div>` + (st >= 4 ? '<div class="small good">모든 기록을 마쳤다. 피해 +10%</div>' : lock(4));
      return `<div class="panel dex">${h}<div class="row"><button class="ghost" data-act="dex-tab" data-v="${this.dexTab}">← 도감</button></div></div>`;
    },
    dexSetsHtml() {
      const p = G.player; p.dexDone ??= {};
      const groups = {};
      for (const s of dexSets()) (groups[s.kind] ??= []).push(s);
      let h = '<p class="small dim">한 묶음의 모든 괴수 약점(3마리 처치)을 열면 완성. 완성 보상은 크레딧·에테르, 속성 완성은 칭호.</p>';
      for (const [kind, list] of Object.entries(groups)) {
        h += `<div class="sec-title">${kind}</div><div class="cards">` + list.map((s) => {
          const n = s.list.filter((x) => G.dexKills(x) >= 3).length; const done = !!p.dexDone[s.id];
          const title = s.elem && DEX_ELEM_TITLE[s.elem] ? ` · 칭호 「${DEX_ELEM_TITLE[s.elem][0]}」(${modsText(DEX_ELEM_TITLE[s.elem][1])})` : '';
          return `<div class="item-row ${done ? 'hl' : ''}"><div class="grow"><b>${s.elem ? FX.elemIcon(s.elem, 12) + ' ' : ''}${s.name}</b> <span class="small dim">${n}/${s.list.length}${done ? ' · 완성' : ''}${title}</span>${this.bar('hp', n, s.list.length)}</div></div>`;
        }).join('') + '</div>';
      }
      return h;
    },
    dexNamedHtml() {
      const list = (G.world && G.world.named) || [];
      if (!list.length) return '<p class="small dim">아직 이름 붙은 괴수가 없다. 놓친 보스는 사람을 먹고 자라 이름을 얻는다.</p>';
      const stat = { dead: '처치됨', active: '출몰 중', lurking: '잠적' };
      return '<div class="cards">' + list.map((nm) => `<div class="item-row"><span>${FX.monster({ name: nm.base, elem: nm.elem, shape: nm.shape }, 44)}</span><div class="grow"><b>${nm.name}</b> ${UI.elemTag(nm.elem)}<div class="small dim">${RANKS[nm.tier].key}급 · ${stat[nm.status] || nm.status}${nm.region && nm.status !== 'dead' ? ' · ' + regionById(nm.region).name : ''} · 희생 ${(nm.victims || []).length}${nm.slayer ? ' · 처치 ' + (nm.slayer === 'player' ? '나' : nm.slayer) : ''}</div></div></div>`).join('') + '</div>';
    },
  });

  // 정보창에 '도감' 탭
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function () {
    if (this.sheet === 'dex' || (this.sheet || '').startsWith('dex:')) {
      const html = baseSheet.call(Object.assign(Object.create(this), { sheet: 'char', charHtml: () => '' }));
      const nm = (this.sheet || '').startsWith('dex:') ? this.sheet.slice(4) : null;
      const body = nm ? this.dexDetail(nm) : this.dexHtml();
      const at = html.indexOf('<div class="sheet-body">');
      return html.slice(0, at).replace('class="on" data-act="sheet" data-v="char"', 'class="" data-act="sheet" data-v="char"') + `<div class="sheet-body">${body}</div>`;
    }
    return baseSheet.call(this);
  };
  // 탭 줄에 끼워 넣기
  const baseSheet2 = UI.sheetHtml;
  UI.sheetHtml = function () {
    const html = baseSheet2.call(this);
    const head = html.slice(0, Math.max(0, html.indexOf('sheet-body')));
    if (head.includes('data-v="dex"') || !head.includes('data-v="log"')) return html;
    const on = this.sheet === 'dex' || (this.sheet || '').startsWith('dex:');
    return html.replace(/(<button class="[^"]*" data-act="sheet" data-v="log">[^<]*<\/button>)/, `$1<button class="${on ? 'on' : ''}" data-act="sheet" data-v="dex">도감</button>`);
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'dex-tab') { this.dexTab = v || 'all'; this.sheet = 'dex'; this.modal(this.sheetHtml(), 'sheet'); this.sheet = 'dex'; return; }
    if (act === 'dex-mon') { this.sheet = 'dex:' + v; this.modal(this.sheetHtml(), 'sheet'); this.sheet = 'dex:' + v; const b = document.querySelector('.sheet-body'); if (b) b.scrollTop = 0; return; }
    return baseHandle.call(this, act, v);
  };

  // 정보 탭에 짧은 요약
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player; if (!p || !p.dex) return html;
    const all = dexList(); const open = all.filter((m) => G.dexStep(m.name) >= 1).length; if (!open && !Object.keys(p.dex).length) return html;
    const box = `<div class="sec"><div class="sec-title">괴수 도감</div><div class="item-row"><div class="grow">약점 기록 ${open} / ${all.length} · 완성 ${Object.keys(p.dexDone || {}).length}</div><button class="sm ghost" data-act="sheet" data-v="dex">도감 보기</button></div></div>`;
    const at = html.lastIndexOf('<div class="sec"><div class="sec-title">인생 기록');
    return at >= 0 ? html.slice(0, at) + box + html.slice(at) : html + box;
  };
}

if (typeof document !== 'undefined' && !document.getElementById('dex-css')) {
  const st = document.createElement('style'); st.id = 'dex-css';
  st.textContent = `.dex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px;margin:4px 0 10px}
.dex-card{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;min-height:44px;border-radius:6px;text-align:center;font-size:12px;line-height:1.25}
.dex-card b{font-size:12px;word-break:keep-all}.dex-card.full{border-color:var(--amber,#f0b35b)}
.dex-shadow svg{filter:brightness(0) opacity(.55)}
.dex-head{display:flex;gap:10px;align-items:center}.dex-head h3{margin:0 0 2px}
.dex .sec-title{margin-top:10px}.dex-tabs{margin:6px 0}`;
  (document.head || document.documentElement).appendChild(st);
}
