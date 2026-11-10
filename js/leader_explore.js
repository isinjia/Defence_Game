// ===== "리더가 이끈다" — 지도 탐사 지점 (영역 F 몫, 주도는 D의 js/leader_rule.js) =====
// 내가 파티 리더가 아니면(NPC 리더가 있으면) 지도 탐사 지점·폐허 뒤지기의 선택도 리더가 고른다.
// 나는 [따른다]/[반대한다]만. 가만히 있으면 따른다. 리더 품질(orders.js npcLead)이 낮으면 엉성하게 고른다.
// 게이트 층 사건·시험 탐색은 leader_rule.js 가, 판정 담당자 지정은 check.js(리더 지정 + 내 의견)가 맡는다.
if (typeof UI !== 'undefined') {
  const leader = () => (UI.councilLeader ? UI.councilLeader() : null);
  const ACTS = ['ck-site', 'site', 'ck-scav', 'ruin-scav'];
  const PREF = { greedy: /거래|챙긴|뒤진|흡수/, kind: /돕는|유족|쉬어/, warlike: /부순|뒤진|오른/, just: /돕는|유족|조사|오른/, cold: /조사|거래|지나/ };
  const SAY = {
    good: { cold: '이걸로 간다.', just: '이게 맞다. 가자.', kind: '이렇게 하는 게 좋겠어요.', warlike: '고민할 거 없어.', greedy: '남는 쪽으로.' },
    poor: { cold: '…대충 이걸로.', just: '음, 일단 이렇게 해 보자.', kind: '잘 모르겠지만… 이걸로 해 볼까요?', warlike: '아무거나! 이거!', greedy: '뭐라도 건지겠지.' },
  };
  const pctOf = (b) => { const m = b.textContent.match(/성공\s*(\d+)%/); return m ? +m[1] : null; };
  const decide = () => {
    const L = leader(); const box = document.getElementById('modal-box'); if (!L || !box || box.querySelector('.lead-dec') || (UI.ctx && UI.ctx.run)) return;
    const btns = [...box.querySelectorAll(ACTS.map((a) => `[data-act="${a}"]`).join(','))].filter((b) => !b.disabled);
    if (btns.length < 2) return;
    const q = typeof npcLead === 'function' ? npcLead(L) : 60;
    const hp = G.player.maxHp ? G.player.hp / G.player.maxHp : 1;
    let pick;
    if (q < 30 || (q < 50 && RNG.chance(0.5))) pick = RNG.pick(btns); // 엉성한 리더: 아무거나
    else {
      const rest = btns.find((b) => /쉬어/.test(b.textContent));
      const fav = PREF[L.personality] ? btns.filter((b) => PREF[L.personality].test(b.textContent)) : [];
      const safe = (b) => { const p = pctOf(b); return p == null || p >= (q >= 75 ? 60 : 45); };
      if (rest && hp < 0.45) pick = rest;
      else pick = fav.filter(safe)[0] || btns.filter(safe).sort((a, b) => (pctOf(b) || 0) - (pctOf(a) || 0))[0] || btns[btns.length - 1];
    }
    for (const b of btns) { b.disabled = true; b.classList.toggle('lead-pick', b === pick); }
    UI.leadSite = { act: pick.dataset.act, v: pick.dataset.v, L: L.id, btns };
    const label = (pick.childNodes[0] && pick.childNodes[0].textContent || pick.textContent).trim().split('\n')[0];
    const say = (q >= 50 ? SAY.good : SAY.poor)[L.personality] || '이렇게 하자.';
    const cards = pick.closest('.cards') || pick.parentElement;
    cards.insertAdjacentHTML('afterend', `<div class="cn-card lead-dec"><b>${L.name}(리더)의 결정</b> <span class="small">· ${label}</span>
      <p class="small">"${say}"</p><div class="cn-btns"><button class="primary" data-act="lsite-ok">따른다</button><button class="danger" data-act="lsite-no">반대한다</button></div></div>`);
    if (UI.autoFollow) UI.autoFollow(box.querySelector('[data-act="lsite-ok"]'), 6);
  };
  const after = (name) => { const base = UI[name]; if (!base) return; UI[name] = function (...a) { const r = base.apply(this, a); decide(); return r; }; };
  after('showSite'); after('processQueue');
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'lsite-ok' || act === 'lsite-no') {
      const d = this.leadSite; if (!d) return; this.leadSite = null;
      const L = G.npcById(d.L);
      if (act === 'lsite-ok') { if (L) G.changeRel(L, 1, '리더 결정을 따랐다'); return baseHandle.call(this, d.act, d.v); }
      const q = typeof npcLead === 'function' ? npcLead(L) : 60;
      const chance = 0.25 + (L.relation || 0) / 200 + (['kind', 'just'].includes(L.personality) ? 0.15 : L.personality === 'cold' ? -0.1 : 0) + (q >= 75 ? 0.05 : 0);
      if (RNG.chance(Math.max(0.05, Math.min(0.85, chance)))) {
        this.toast(`${L.name}: "…그래, 네 생각대로 해 보자."`);
        for (const b of d.btns) { b.disabled = false; b.classList.remove('lead-pick'); }
        const dec = document.querySelector('#modal-box .lead-dec'); if (dec) dec.remove();
        return;
      }
      if (L) G.changeRel(L, -1, '결정에 반대했다');
      this.toast(`${L.name}: "${L.personality === 'cold' ? '내가 정한다.' : '미안, 이번엔 내 판단대로 갈게.'}"`);
      return baseHandle.call(this, d.act, d.v);
    }
    return baseHandle.call(this, act, v);
  };
}
