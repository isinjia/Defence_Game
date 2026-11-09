// 선택지 옆 ⓘ 정보 버튼 (영역 B, 사용자 요청)
// 선택지가 길드·인물·지역·괴수·아이템을 가리키면 답변 오른쪽에 ⓘ. 누르면 선택을 확정하지 않고 정보 카드가 뜨고,
// 닫으면 원래 선택 창 그대로다. 공개 정보와 내가 알게 된 정보만 보여 주고, 모르는 것은 '알 수 없음'.
//
// ▶ 다른 영역이 붙이는 법 (공통 필드)
//   - 대화 선택지(UI.talk 의 choices): { text, go, info: { type: 'guild', id: 'baekho' } }
//   - 그 밖의 선택 버튼: 버튼에 data-info="guild:baekho" 속성. 여러 개면 "guild:baekho|npc:12".
//   - type: guild · npc · region · monster · item. 정보를 만드는 함수는 UI.INFO[type](id) — 새 대상 종류(예: 중소 길드)는
//     UI.INFO 에 함수를 더하거나 UI.infoGuildExtra(id) 를 정의하면 된다.
//   - 필드가 없으면 버튼 글에서 길드·지역·아는 인물·괴수 이름을 찾아 자동으로 붙인다.
{
  const CHOICE_SEL = '.dlg-choice, .choice-btn, [data-act="ev-choice"], [data-act="story-choice"], [data-act="g-ev"], [data-act="ex-choice"], [data-act="pro-choice"]';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const row = (k, v) => `<div class="ic-row"><span>${k}</span><b>${v == null || v === '' ? '<i class="unk">알 수 없음</i>' : v}</b></div>`;

  const GUILD_TIER_GIANT = (id) => typeof GUILD_TIER !== 'undefined' && GUILD_TIER[id] === 'giant';
  // ---------- 대상별 정보 ----------
  UI.INFO = {
    guild(id) {
      const g = GUILDS[id] || (UI.infoGuildExtra && UI.infoGuildExtra(id)); if (!g) return null;
      const p = G.player; const w = G.world || {};
      const pres = w.guildPrestige && w.guildPrestige[id];
      const members = G.npcs ? G.npcs.filter((n) => n.alive && n.guild === id) : [];
      const known = members.filter((n) => n.met);
      const tier = typeof guildTierName === 'function' ? guildTierName(id) : (g.minor ? '중소 길드' : '거대 길드');
      const home = typeof guildHome === 'function' ? guildHome(id) : (g.home ? regionById(g.home) : null);
      const off = p.official ?? p.rankIdx;
      const join = g.minor
        ? `공식 ${RANKS[g.minRank || 0].key}급 이상${g.fameReq ? `, 명성 ${g.fameReq}` : ''} <span class="small dim">(나: ${RANKS[off].key}급 · 명성 ${fmt(p.fame)})</span>`
        : g.fameReq != null ? `명성 ${g.fameReq} 이상${GUILD_TIER_GIANT(id) ? ' · 보통 C급 이상만 스카우트' : ''} <span class="small dim">(나: 명성 ${fmt(p.fame)})</span>` : null;
      return { title: g.name, sub: tier, color: g.color,
        body: [g.desc ? `<p>${g.desc}</p>` : '',
          row('본거지', home ? home.name : null),
          g.minor ? row('규모', g.size ? `약 ${g.size}명` : null) : '',
          g.minor ? row('성향', g.style || null) : '',
          g.minor ? row('특기', g.spec || null) : '',
          g.minor ? row('평판', g.rep != null ? `${g.rep >= 60 ? '좋음' : g.rep >= 45 ? '보통' : '호불호'} (${g.rep})` : null) : '',
          row('속성 성향', g.elem && ELEMENTS[g.elem] ? `${FX.elemIcon(g.elem, 12)} ${ELEMENTS[g.elem].name}` : null),
          row('가입 조건', join),
          row('위상', pres != null ? `${Math.round(pres)}` : null),
          row('소속 헌터', members.length ? `${members.length}명${known.length ? ` · 아는 사람 ${known.slice(0, 3).map((n) => n.name).join(', ')}${known.length > 3 ? ' 외' : ''}` : ''}` : null),
          row('나와의 관계', p.guild === id ? '<span class="good">소속 중</span>' : p.guild ? '다른 길드 소속' : '무소속'),
        ].join('') };
    },
    npc(id) {
      const n = G.npcById(+id); if (!n) return null;
      if (!n.met) return { title: n.name, sub: '인물', body: `<p class="dim">아직 만나 본 적 없는 사람이다.</p>${row('등급', n.fame >= 30 ? `${RANKS[n.rankIdx].key}급 (소문)` : null)}${row('소속', null)}${row('성격', null)}` };
      const g = n.guild && GUILDS[n.guild];
      return { title: n.name, sub: '인물', color: n.element && ELEMENTS[n.element] ? elemColor(n.element) : null, face: UI.npcAvatar ? UI.npcAvatar(n, 56) : '',
        body: [row('등급', rankLabel(n.rankIdx, n.stage)), row('속성', n.element && ELEMENTS[n.element] ? `${FX.elemIcon(n.element, 12)} ${ELEMENTS[n.element].name}` : null),
          row('직업', n.cls ? className(n.cls, n.clsAdv || 0) : null), row('소속', g ? g.name : '무소속'),
          row('성격', n.personality && typeof persById === 'function' && persById(n.personality) ? persById(n.personality).name : null),
          row('관계', `${relationLabel(n.relation)} (${n.relation})`), row('나이', `${Math.floor(n.ageMonths / 12)}세`),
          n.alive ? '' : '<p class="bad">이미 세상을 떠났다.</p>'].join('') };
    },
    region(id) {
      const r = regionById(id); if (!r) return null; const p = G.player;
      return { title: r.name, sub: '지역', body: [r.desc ? `<p>${r.desc}</p>` : '', row('위험도', '◆'.repeat(r.danger || 0)), row('에테르 농도', r.ether != null ? `×${r.ether}` : null),
        row('주둔 길드', r.guild && GUILDS[r.guild] ? GUILDS[r.guild].name : '없음'), row('내 평판', p.rep && p.rep[id] != null ? `${p.rep[id]}` : '0'),
        row('거리', p.region === id ? '지금 여기' : typeof regionDist === 'function' ? `${regionDist(p.region, id)}칸 떨어진 지역` : null)].join('') };
    },
    monster(id) {
      const m = (typeof MONSTERS !== 'undefined' ? MONSTERS : []).find((x) => x.name === id || x.id === id); if (!m) return null;
      const dex = (G.player.dex || {})[m.name] || {}; const k = dex.kills || 0;
      return { title: k || dex.seen ? m.name : '정체를 알 수 없는 괴수', sub: '괴수 · 도감', color: m.elem && ELEMENTS[m.elem] ? elemColor(m.elem) : null,
        body: [row('처치 수', `${k}마리`), row('속성', k >= 1 && m.elem && ELEMENTS[m.elem] ? `${FX.elemIcon(m.elem, 12)} ${ELEMENTS[m.elem].name}` : null),
          row('등급대', k >= 1 && m.tier != null ? `${RANKS[Math.min(7, m.tier)].key}급 무렵` : null),
          row('약점', k >= 3 && m.elem ? (ELEMENT_KEYS.filter((e) => (typeof elemEdge === 'function' ? elemEdge(e, m.elem) : 0) > 0).map((e) => ELEMENTS[e].name).join(', ') || '없음') : null),
          '<p class="small dim">더 쓰러뜨리면 도감에 정보가 열린다.</p>'].join('') };
    },
    item(id) {
      const c = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).find((x) => x.id === id || x.name === id);
      if (!c) return null;
      return { title: c.name, sub: '아이템', body: [c.desc ? `<p>${c.desc}</p>` : '', row('가지고 있는 수', `${(G.player.items || {})[c.id] || 0}개`), row('값', c.price != null ? `${fmt(c.price)} 크레딧` : null)].join('') };
    },
  };

  // ---------- 글에서 대상 찾기 (필드가 없을 때) ----------
  UI.infoGuess = function (text) {
    const t = String(text || ''); const out = [];
    for (const [id, g] of Object.entries(GUILDS)) if (g.name && t.includes(g.name)) out.push('guild:' + id);
    for (const r of REGIONS) { const short = r.name.split(' ')[0]; if (t.includes(r.name) || (short.length >= 2 && new RegExp(short + '(?=[^가-힣]|으로|로|에|의|을|를|까지|$)').test(t))) out.push('region:' + r.id); }
    if (G.npcs) for (const n of G.npcs) if (n.met && n.name && n.name.length >= 2 && t.includes(n.name)) out.push('npc:' + n.id);
    if (typeof MONSTERS !== 'undefined') for (const m of MONSTERS) if (m.name && m.name.length >= 2 && t.includes(m.name)) out.push('monster:' + m.name);
    return [...new Set(out)].slice(0, 2);
  };

  // ---------- 버튼 붙이기 ----------
  UI.decorateChoices = function (root) {
    if (!root || !G.player) return;
    for (const b of root.querySelectorAll(CHOICE_SEL)) {
      if (b.dataset.infoDone) continue; b.dataset.infoDone = '1';
      let keys = b.dataset.info ? b.dataset.info.split('|') : [];
      if (!keys.length && b.dataset.act === 'dlg-choice' && this.dlg) {
        const line = this.dlg.lines[this.dlg.i]; const c = line && line.choices && line.choices[+b.dataset.v];
        if (c && c.info) keys = [].concat(c.info).map((x) => `${x.type}:${x.id}`);
      }
      if (!keys.length) keys = this.infoGuess(b.textContent);
      keys = keys.filter((k) => { const [ty, id] = k.split(':'); try { return this.INFO[ty] && this.INFO[ty](id); } catch (e) { return false; } });
      if (!keys.length) continue;
      const wrap = document.createElement('div'); wrap.className = 'choice-info-wrap';
      b.parentNode.insertBefore(wrap, b); wrap.appendChild(b);
      for (const k of keys) {
        const [ty, id] = k.split(':'); const info = this.INFO[ty](id);
        const ib = document.createElement('button'); ib.className = 'info-btn'; ib.type = 'button';
        ib.dataset.act = 'info-card'; ib.dataset.v = k; ib.setAttribute('aria-label', `${info.title} 정보 보기`); ib.title = info.title;
        ib.innerHTML = '<span aria-hidden="true">i</span>';
        wrap.appendChild(ib);
      }
    }
  };

  // ---------- 정보 카드 (선택 창 위에 겹쳐 뜨고, 닫으면 그대로 돌아온다) ----------
  UI.infoCard = function (k) {
    const [ty, id] = String(k).split(':'); const info = this.INFO[ty] && this.INFO[ty](id); if (!info) return;
    let el = document.getElementById('info-card');
    if (!el) { el = document.createElement('div'); el.id = 'info-card'; document.body.appendChild(el); }
    el.innerHTML = `<div class="ic-box" role="dialog" aria-label="${esc(info.title)} 정보" style="${info.color ? `--ic:${info.color}` : ''}">
      <div class="ic-head">${info.face || ''}<div><div class="eyebrow">${info.sub}</div><h3>${info.title}</h3></div></div>
      <div class="ic-body">${info.body}</div>
      <div class="row end"><button class="primary" data-act="info-close">닫기</button></div></div>`;
    el.classList.add('on');
  };
  UI.infoClose = function () { const el = document.getElementById('info-card'); if (el) el.classList.remove('on'); };

  // 정보 버튼은 다른 클릭 처리(튜토리얼 잠금, 대화 다음 넘기기 등)보다 먼저 받는다
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-act="info-card"], [data-act="info-close"], #info-card');
    if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (t.dataset.act === 'info-card') UI.infoCard(t.dataset.v);
    else if (t.dataset.act === 'info-close' || e.target.id === 'info-card') UI.infoClose();
  }, true);

  // 창이 바뀔 때마다 선택지에 버튼 붙이기
  // (전투 중에는 화면이 매 프레임 바뀌므로 건너뛰고, 바뀜이 몰리면 한 번만)
  let pend = 0;
  const run = () => { pend = 0; try { if (UI.ctx && UI.ctx.combat && !UI.ctx.combat.result) return; UI.decorateChoices(document.getElementById('modal-box')); UI.decorateChoices(document.getElementById('dlg')); UI.decorateChoices(document.getElementById('app')); } catch (e) { /* 무시 */ } };
  const obs = new MutationObserver(() => { if (!pend) pend = setTimeout(run, 60); });
  const start = () => obs.observe(document.body, { childList: true, subtree: true });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}
