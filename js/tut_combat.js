// 자격 시험(튜토리얼) 전투 다듬기 (사용자 요청)
// 1. 리더의 "회복약!" 오더는 한 번만. 전에는 둘째 안내 단계가 끝나지 않으면 차례마다 같은 오더가 고정으로 다시 붙었다.
//    또 플레이어 차례가 끝나면 남은 오더는 지운다(방어 등 오더 처리가 없는 행동 뒤에 오더가 남던 문제).
// 2. 지금 눌러야 할 단추·대상에 반짝이는 테두리(.tut-glow).
// 3. 보스전에서 상성을 설명하므로, 보스를 플레이어 속성에 약한 속성으로 바꾼다.
// 4. 보스에 '보스' 꼬리표(css/polish.css).
// 5. 리더가 오더 대상을 이름으로 콕 집고, 오더를 따르면/안 따르면 어떻게 되는지 안내.
{
  const exam = () => { const c = typeof UI !== 'undefined' ? UI.ctx : null; return c && c.kind === 'exam' && c.tutorial ? c : null; };

  // ---------- 1. 회복약 오더는 한 번만 ----------
  const baseTurn = Combat.prototype.takeTurn;
  Combat.prototype.takeTurn = function (u) {
    // 회복약으로 동료(나)를 눌러 쓰는 길에서는 안내 단계(acted)가 오르지 않아, 둘째 안내와 회복약 오더가 차례마다 되풀이됐다.
    // 내 차례가 새로 올 때마다 '지난 차례 수'만큼은 단계가 올라가 있게 맞춘다.
    try {
      const c0 = exam(); const t0 = c0 && c0.combat === this && c0.tutorial;
      if (t0 && u && u.isPlayer && !this.auto) { t0.starts = (t0.starts || 0) + 1; t0.acted = Math.max(t0.acted || 0, t0.starts - 1); }
    } catch (e) { /* 무시 */ }
    const r = baseTurn.call(this, u);
    try {
      const c = exam(); const t = c && c.combat === this && c.tutorial;
      // 첫 차례에는 리더가 반드시 '스킬 + 적 한 놈'을 콕 집어 오더한다 (오더를 따르는 법을 배우는 차례)
      if (r === 'wait' && t && !t.boss && t.starts === 1 && u.isPlayer) {
        const L = this.leader && this.leader(); const cur = u.order;
        const ok = cur && !cur.vague && cur.skill && cur.target && this.units.some((x) => x.id === cur.target && x.side === 'enemy');
        if (L && !L.isPlayer && !ok) {
          let o = this.smartOrder ? this.smartOrder(u) : null;
          if (!o || !o.target || !this.units.some((x) => x.id === o.target && x.side === 'enemy')) {
            const foes = this.units.filter((x) => x.side === 'enemy' && x.alive);
            const tg = foes.reduce((a, b) => (b.hp < a.hp ? b : a), foes[0]); o = tg ? { skill: 'strike', target: tg.id } : null;
          }
          if (o) {
            for (let i = this.log.length - 1; i >= 0 && i >= this.log.length - 6; i--) { const l = this.log[i]; if (l && l.ev && l.ev.k === 'say' && l.ev.src === L.id) { this.log.splice(i, 1); break; } }
            const sk = skillById(o.skill); const tg = this.units.find((x) => x.id === o.target);
            const say = `${sk.name}! ${tg.name}!`;
            u.order = { ...o, by: L.id, rate: this.rateOrder ? this.rateOrder(u, sk, tg) : 1, say };
            this.push(`${L.name}: "${u.name}, ${say}"`, '', { k: 'say', src: L.id, text: `${u.name}, ${say}` });
          }
        }
      }
      const o = u && u.isPlayer && u.order;
      if (t && o && o.act === 'item' && o.item === 'potion' && o.say === '회복약!') {
        if (t.potionOrdered) {
          u.order = null;
          for (let i = this.log.length - 1; i >= 0 && i >= this.log.length - 6; i--) { const l = this.log[i]; if (l && l.ev && l.ev.k === 'say' && /회복약!$/.test(l.ev.text || '')) { this.log.splice(i, 1); break; } }
        } else t.potionOrdered = true;
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseEnd = Combat.prototype.endPlayerTurn;
  if (baseEnd) Combat.prototype.endPlayerTurn = function (...a) { try { if (this.player) this.player.order = null; } catch (e) { /* 무시 */ } return baseEnd.apply(this, a); };

  // ---------- 3. 보스는 플레이어 속성에 약하게 ----------
  // 속성만 바꾸면 이름(냉각수 슬라임 등)과 어긋나므로, 약한 속성의 보스를 새로 만들어 바꿔 넣는다
  const baseFight = UI.startExamFight;
  if (baseFight) UI.startExamFight = function (stage = 0, ...a) {
    try {
      const ex = this.exam; const me = G.player && G.player.element;
      if (stage === 1 && ex && ex.rooms && ex.rooms[1] && me && typeof elemEdge === 'function' && typeof ELEMENT_KEYS !== 'undefined') {
        const weak = ELEMENT_KEYS.find((e) => elemEdge(me, e) > 0);
        const room = ex.rooms[1]; const k = room.findIndex((u) => u.boss);
        if (weak && k >= 0 && room[k].elem !== weak) {
          const old = room[k]; let b = null;
          for (let i = 0; i < 12 && !(b && b.elem === weak); i++) b = G.makeMonster(0, true, weak);
          if (b && b.elem === weak) {
            b.name = b.name.replace(/^\[[^\]]*\] /, ''); // '보스' 꼬리표가 붙으므로 [시험용] 머리말은 뺀다(이름이 잘려 보였다)
            b.maxHp = b.hp = Math.round(b.hp * 1.5);
            room[k] = b;
          } else old.elem = weak;
        }
        for (const u of room) if (u.boss) u.name = String(u.name).replace(/^\[[^\]]*\] /, '');
      }
    } catch (e) { /* 무시 */ }
    return baseFight.call(this, stage, ...a);
  };

  // ---------- 5. 리더 오더를 콕 집어 말하고, 따르면/안 따르면 어떻게 되는지 알려 준다 ----------
  const jong = (w) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; };
  const ro = (w) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 !== 0 && c % 28 !== 8 ? '으로' : '로'); };
  const ida = (w) => w + (jong(w) ? '이다' : '다');
  const strip = (n) => String(n || '').replace(/^\[[^\]]*\] /, '');
  const reg = (L) => { try { return (G.personaRegister && G.personaRegister(L)) || 'haera'; } catch (e) { return 'haera'; } };
  const orderInfo = () => {
    const c = exam(); if (!c || !c.combat) return null;
    const cb = c.combat; const o = cb.player && cb.player.order;
    if (!o || o.vague || !o.skill || !o.target) return null;
    const tg = cb.units.find((u) => u.id === o.target); if (!tg || tg.side !== 'enemy') return null;
    const sk = skillById(o.skill);
    return { tg: strip(tg.name), sk: sk ? (sk.id === 'strike' ? '공격' : sk.name) : '공격', name: G.player.name };
  };
  // 깐깐한 리더(냉정·호전·정의)는 오더를 무시하면 사이가 나빠진다 (js/orders.js applyOrderRelations)
  const strict = (L) => L && ['cold', 'warlike', 'just'].includes(L.personality);
  const LINES = {
    turn: {
      haera: (x) => `${x.name}, ${ro(x.sk)} ${x.tg}부터 쳐라. 내가 지목한 놈이다.`,
      banmal: (x) => `${x.name}, ${ro(x.sk)} ${x.tg}부터 쳐. 내가 찍은 놈이야.`,
      short: (x) => `${x.sk}. ${x.tg}부터.`,
      haeyo: (x) => `${x.name} 씨, ${ro(x.sk)} ${x.tg}부터 쳐요. 제가 지목한 적이에요.`,
      hapsyo: (x) => `${x.name} 씨, ${ro(x.sk)} ${x.tg}부터 공격하십시오. 제가 지목한 적입니다.`,
      hao: (x) => `${x.name}, ${ro(x.sk)} ${x.tg}부터 치시오. 내가 지목한 놈이오.`,
      hage: (x) => `${x.name}, ${ro(x.sk)} ${x.tg}부터 치게. 내가 지목한 놈일세.`,
    },
    aimEnemy: {
      haera: (x) => `${ida(x.tg)}. 오더 표시가 붙은 놈을 눌러라.`,
      banmal: (x) => `${x.tg}! 오더 표시 붙은 애 눌러.`,
      short: (x) => `${x.tg}.`,
      haeyo: (x) => `${x.tg}요. 오더 표시가 붙은 적을 눌러요.`,
      hapsyo: (x) => `${x.tg}입니다. 오더 표시가 붙은 적을 누르십시오.`,
      hao: (x) => `${x.tg}요. 오더 표시가 붙은 놈을 누르시오.`,
      hage: (x) => `${x.tg}일세. 오더 표시가 붙은 놈을 누르게.`,
    },
    // 오더를 따른 뒤 / 따르지 않은 뒤 (안내 3/3의 리더 말 앞에 붙인다)
    obey: { haera: '오더대로다. 좋아.', banmal: '오더대로네. 좋아!', short: '좋다.', haeyo: '오더대로 잘했어요.', hapsyo: '오더대로 잘 수행했습니다.', hao: '오더대로 잘했소.', hage: '오더대로 잘했네.' },
    ignore: { haera: '오더와 다르군. 다음엔 따라라.', banmal: '오더랑 다르잖아. 다음엔 따라 줘.', short: '오더와 다르다.', haeyo: '오더랑 달랐어요. 다음엔 따라 줘요.', hapsyo: '오더와 다릅니다. 다음엔 따르십시오.', hao: '오더와 다르오. 다음엔 따르시오.', hage: '오더와 다르군. 다음엔 따르게.' },
  };
  // 플레이어가 리더 오더를 어떻게 했는지 (마지막 기록)
  const lastPlayerOrder = (cb) => {
    const log = cb.orderLog || []; const pid = cb.player && cb.player.id;
    for (let i = log.length - 1; i >= 0; i--) if (log[i].unit === pid && log[i].by !== 'player') return log[i].kind;
    return null;
  };
  const baseLead = UI.leadSay;
  UI.leadSay = function (key) {
    try {
      const c = exam(); const L = this.examLeader && this.examLeader();
      if (c && !c.tutorial.boss && L) {
        const x = orderInfo();
        if (x && LINES[key]) { const f = LINES[key][reg(L)] || LINES[key].haera; return f(x); }
        if (key === 'done') { const k = lastPlayerOrder(c.combat); if (k === 'obey' || k === 'ignore') { let rest = baseLead.call(this, key); rest = rest.replace(/^[^.!?]*[.!?]\s*/, ''); return `${LINES[k][reg(L)] || LINES[k].haera} ${rest}`; } }
      }
    } catch (e) { /* 무시 */ }
    return baseLead.call(this, key);
  };
  // 조작 설명 줄: 오더가 있으면 대상을 지정하라고, 그리고 따르면/안 따르면 어떻게 되는지
  const baseCoach = UI.coachHtml;
  UI.coachHtml = function (...a) {
    let h = baseCoach.apply(this, a);
    try {
      const c = exam(); if (!h || !c) return h;
      if (c.tutorial.boss) {
        // 보스전: 보스가 내 속성에 약하다는 것을 콕 집어 준다
        const b = c.combat.units.find((u) => u.boss && u.alive); const me = G.player.element;
        if (b && me && ELEMENTS[me] && ELEMENTS[b.elem] && elemEdge(me, b.elem) > 0) {
          const bn = strip(b.name);
          h = h.replace(/<\/div><\/div>$/, `<div class="small coach-sys coach-ord">상성 · 보스 <b>${bn}</b>${jong(bn) ? '은' : '는'} ${ELEMENTS[b.elem].name} 속성이라 내 <b>${ELEMENTS[me].name}</b> 속성에 약합니다. ${ELEMENTS[me].name} 속성 스킬로 치면 피해가 크게 들어갑니다.</div></div></div>`);
        }
        return h;
      }
      const L = this.examLeader && this.examLeader(); const t = c.tutorial; const x = orderInfo();
      let add = '';
      if (x && (t.key === 'turn' || t.key === 'aimEnemy')) {
        if (t.key === 'aimEnemy') h = h.replace('적을 눌러 타겟을 설정합니다.', `리더가 지목한 적(<b>${x.tg}</b>, 오더 표시)을 눌러 타겟을 설정합니다.`);
        add = `<b>오더</b> · 따르면 리더와 사이가 좋아집니다. 따르지 않아도 되지만${strict(L) ? ', 이 리더는 깐깐해서 사이가 나빠집니다' : ' 리더가 기억합니다'}.`;
      } else if (t.key === 'done') {
        const k = lastPlayerOrder(c.combat);
        if (k === 'obey') add = '오더를 따랐습니다 · 전투가 끝나면 리더와의 관계가 오릅니다.';
        else if (k === 'ignore') add = strict(L) ? '오더를 따르지 않았습니다 · 깐깐한 리더라 전투가 끝나면 관계가 떨어집니다.' : '오더를 따르지 않았습니다 · 이번 리더는 너그러워 관계는 그대로입니다. 깐깐한 리더(냉정·호전·정의)는 관계가 떨어집니다.';
      }
      if (add) h = h.replace(/<\/div><\/div>$/, `<div class="small coach-sys coach-ord">${add}</div></div></div>`);
    } catch (e) { /* 무시 */ }
    return h;
  };

  // ---------- 2. 눌러야 할 것에 반짝임 ----------
  const want = () => {
    const c = exam(); if (!c || !c.combat || c.combat.result) return [];
    const cb = c.combat; const t = c.tutorial;
    if (t.lead === 'on') return null; // 지휘 연습 단계는 아래 블록이 반짝임을 맡는다
    if (!cb.waiting || c.playing) return [];
    const p = cb.player; const o = p && p.order;
    // 리더 오더가 있으면 오더대로 누를 것만 반짝인다
    if (o && !o.vague && o.act === 'item') {
      if (c.itemSel) return [`#u-${p.id}`];
      if (c.cmd === 'item') return [`#cb-ctrl .cmd-pop [data-act="c-item"][data-v="${o.item}"]`];
      return ['#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="item"]'];
    }
    if (o && !o.vague && o.skill && !t.boss) {
      if (c.sel === o.skill && o.target) return [`#u-${o.target}`];
      if (c.sel) return [];
      const main = o.skill === 'strike' ? '#cb-ctrl .cmd-main [data-act="c-skill"][data-v="strike"]' : '#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="skill"]';
      if (c.cmd === 'skill') return [`#cb-ctrl .cmd-pop [data-act="c-skill"][data-v="${o.skill}"]`];
      return [main];
    }
    if (t.boss) {
      if (c.sel) return ['#foes .foe.boss:not(.dead)'];
      if (o && !o.vague && o.skill && c.cmd === 'skill') return [`#cb-ctrl .cmd-pop [data-act="c-skill"][data-v="${o.skill}"]`];
      if (c.cmd === 'skill') return ['#cb-ctrl .cmd-pop [data-act="c-skill"]'];
      return ['#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="skill"]'];
    }
    const key = t.key;
    if (key === 'turn') {
      if (c.cmd === 'skill') return ['#cb-ctrl .cmd-pop [data-act="c-skill"]'];
      if (c.cmd === 'item') return ['#cb-ctrl .cmd-pop [data-act]:not(.ghost):not([data-act="c-cmd"])'];
      return ['#cb-ctrl .cmd-main [data-act="c-skill"]', '#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="skill"]'];
    }
    if (key === 'aimEnemy') return ['#foes .foe:not(.dead)'];
    if (key === 'aimAlly') return ['.stage .ally.fig'];
    if (key === 'aimNone') return ['#cb-ctrl .use-btn, #cb-ctrl [data-act="c-use"]'];
    if (key === 'done') return ['#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="item"]', '#cb-ctrl .cmd-main [data-act="c-defend"]'];
    if (key === 'tools') return ['.cb-tools [data-act="c-speed"]', '.cb-tools [data-act="c-auto"]'];
    return [];
  };
  setInterval(() => {
    try {
      const sel = want(); if (sel === null) return; const on = new Set(sel.length ? [...document.querySelectorAll(sel.join(','))] : []);
      for (const el of document.querySelectorAll('.tut-glow')) if (!on.has(el)) el.classList.remove('tut-glow');
      for (const el of on) el.classList.add('tut-glow');
    } catch (e) { /* 무시 */ }
  }, 200);
}

// 자격 시험 첫 전투 튜토리얼 보강 (사용자 요청: "왜 나 혼자 조종하고 팀원은 오토인지 정확히 알려 주고, 내가 리더가 되어 오더도 내려 보게")
// - 1단계(게이지): 직접 조종하는 건 나 하나, 동료는 각자 판단으로 자동, 리더는 오더로 동료를 움직인다는 것을 시스템 문구로.
// - 셋째 내 차례: 선임이 이번 차례 지휘를 나에게 넘긴다 → 동료 누르기 → 행동 고르기 → 대상 누르기 → 오더 전달.
//   오더를 다 내리면 따르는/무시하는 규칙을 알려 주고 내 행동을 고르게 한다. 내 차례가 끝나면 지휘는 선임에게 돌아간다.
// - 연습이 끝나기 전에 마지막 적이 쓰러지지 않게(체력 1로 버팀) 한다.
// - 게이트 탐색에서 전투 전에 나오던 "이제 진짜 전투다. 동료들은 알아서 싸운다" 말은 이동 말로 바꾸고, 설명은 전투 안으로 옮겼다.
{
  const exam0 = () => { const c = typeof UI !== 'undefined' ? UI.ctx : null; return c && c.kind === 'exam' && c.tutorial && !c.tutorial.boss ? c : null; };
  const reg = (L) => { try { return (G.personaRegister && G.personaRegister(L)) || 'haera'; } catch (e) { return 'haera'; } };
  const V = (h, b, s, y, p, o, g) => ({ haera: h, banmal: b, short: s, haeyo: y, hapsyo: p, hao: o, hage: g });
  const SAY = {
    ex1after: V('좋아. 간다. 내 뒤에 붙어.', '좋아, 가자. 내 뒤에 붙어.', '간다.', '좋아요, 가요. 제 뒤로 붙어요.', '좋습니다. 이동합니다. 뒤를 따라오십시오.', '좋소. 갑시다. 내 뒤를 따르시오.', '좋네. 가세. 내 뒤에 붙게.'),
    leadPick: V('이번 차례는 네가 지휘해 봐. 동료 하나를 골라 오더를 내려.', '이번엔 네가 지휘해 봐. 동료 하나 골라서 오더 내려.', '이번엔 네가 지휘. 오더 내려.',
      '이번 차례는 {name} 씨가 지휘해 봐요. 동료 한 명을 골라 오더를 내려요.', '이번 차례는 직접 지휘해 보십시오. 동료 한 명을 골라 오더를 내리십시오.',
      '이번 차례는 그대가 지휘해 보시오. 동료 하나를 골라 오더를 내리시오.', '이번 차례는 자네가 지휘해 보게. 동료 하나를 골라 오더를 내리게.'),
    leadCmd: V('그 녀석이 뭘 할지 골라.', '뭘 시킬지 골라.', '뭘 시킬지.', '뭘 시킬지 골라요.', '무엇을 시킬지 고르십시오.', '무엇을 시킬지 고르시오.', '무엇을 시킬지 고르게.'),
    leadAim: V('누구한테 할지 찍어 줘.', '누구한테 할지 찍어 줘.', '대상.', '누구한테 할지 찍어 줘요.', '대상을 지정하십시오.', '대상을 찍어 주시오.', '대상을 찍어 주게.'),
    leadDone: V('좋아. 오더는 그렇게 내리는 거다. 이제 네 행동을 골라.', '좋아, 그렇게 내리는 거야. 이제 네 거 골라.', '됐다. 네 행동.',
      '잘했어요. 오더는 그렇게 내리는 거예요. 이제 자기 행동을 골라요.', '좋습니다. 오더는 그렇게 내립니다. 이제 본인 행동을 고르십시오.',
      '좋소. 오더는 그렇게 내리는 것이오. 이제 그대 행동을 고르시오.', '좋네. 오더는 그렇게 내리는 걸세. 이제 자네 행동을 고르게.'),
    leadBack: V('지휘는 다시 내가 맡는다.', '지휘는 다시 내가 할게.', '지휘, 다시 내가.', '지휘는 다시 제가 맡을게요.', '지휘는 다시 제가 맡겠습니다.', '지휘는 다시 내가 맡겠소.', '지휘는 다시 내가 맡겠네.'),
  };
  const say = (L, k) => { const m = SAY[k]; return String((L && m[reg(L)]) || m.haera).replace(/\{name\}/g, G.player ? G.player.name : ''); };
  const SYS = {
    why: '파티 전투에서 직접 조종하는 건 나 한 명입니다. 동료는 각자 성격과 판단으로 자동으로 싸웁니다. 대신 파티 <b>리더</b>는 <b>오더</b>(지시)로 동료에게 무엇을 할지 시킬 수 있습니다.',
    leadPick: '지금은 내가 리더입니다(초상에 <b>리더</b> 표시). <b>동료를 누르면</b> 그 동료에게 내릴 오더 창이 열리고, 그동안 시간이 멈춥니다.',
    leadCmd: '아래에서 그 동료가 할 행동(공격·스킬·아이템·방어)을 고르세요.',
    leadAim: '대상(적 또는 아군)을 누르면 오더가 전달됩니다.',
    leadDone: '동료는 성격과 나와의 관계에 따라 오더를 <b>따르거나 무시</b>합니다. 상황에 맞는 오더를 따르게 하면 믿음이 쌓이고, 엉터리 오더는 신뢰를 깎습니다. 한 차례에 여러 동료에게 오더를 내릴 수 있습니다. 다 내렸으면 아래에서 <b>내 행동</b>을 고르세요. 오른쪽 위 단추: 배속(전투 속도) · 자동(자동 전투).',
  };
  const playerOrdered = (cb) => cb.units.some((u) => u.side === 'ally' && !u.isPlayer && u.order && u.order.by === 'player');

  // 이동 중 말: 전투 설명은 전투 안으로
  if (typeof PERSONA_VOICE !== 'undefined') PERSONA_VOICE.ex1after = SAY.ex1after;
  if (typeof PERSONA_VOICE_ALT !== 'undefined') delete PERSONA_VOICE_ALT.ex1after;
  const baseLead2 = UI.leadSay;
  UI.leadSay = function (key) {
    if (key === 'ex1after') { const L = this.examLeader && this.examLeader(); return say(L, 'ex1after'); }
    return baseLead2.call(this, key);
  };

  // 셋째 내 차례에 지휘를 넘긴다
  const baseTurn2 = Combat.prototype.takeTurn;
  Combat.prototype.takeTurn = function (u) {
    const r = baseTurn2.call(this, u);
    try {
      const c = exam0(); const t = c && c.combat === this && c.tutorial;
      if (t && r === 'wait' && u.isPlayer && !t.lead && t.acted >= 2) {
        const L = this.leader && this.leader();
        if (L && !L.isPlayer) {
          t.lead = 'on'; t.npcLeader = L.id; this.leaderId = u.id; u.order = null;
          for (let i = this.log.length - 1; i >= 0 && i >= this.log.length - 6; i--) { const l = this.log[i]; if (l && l.ev && l.ev.k === 'say' && l.ev.src === L.id) { this.log.splice(i, 1); break; } }
          const s = say(UI.examLeader && UI.examLeader(), 'leadPick');
          this.push(`${L.name}: "${s}"`, '', { k: 'say', src: L.id, text: s });
        }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 내 차례가 끝나면 지휘는 선임에게
  const baseEnd2 = Combat.prototype.endPlayerTurn;
  Combat.prototype.endPlayerTurn = function (...a) {
    try {
      const c = exam0(); const t = c && c.combat === this && c.tutorial;
      if (t && t.lead === 'on' && t.npcLeader) {
        const L = this.units.find((x) => x.id === t.npcLeader && x.alive);
        t.lead = 'over'; t.leadDone = true;
        if (L) { this.leaderId = L.id; const s = say(UI.examLeader && UI.examLeader(), 'leadBack'); this.push(`${L.name}: "${s}"`, '', { k: 'say', src: L.id, text: s }); }
      }
    } catch (e) { /* 무시 */ }
    return baseEnd2.apply(this, a);
  };
  // 연습이 끝나기 전에는 마지막 적이 쓰러지지 않는다
  const baseDown = Combat.prototype.down;
  Combat.prototype.down = function (u, ...a) {
    try {
      const c = exam0(); const t = c && c.combat === this && c.tutorial;
      if (t && !t.leadDone && u && u.side === 'enemy' && !u.summon && this.units.filter((x) => x.side === 'enemy' && x.alive && !x.summon).length <= 1) { u.hp = Math.max(1, u.hp); u.alive = true; return; }
    } catch (e) { /* 무시 */ }
    return baseDown.call(this, u, ...a);
  };

  // 안내 문구
  const leadKey = (c) => {
    const t = c.tutorial; if (t.lead !== 'on') return null;
    if (playerOrdered(c.combat) && !c.orderFor) return 'leadDone';
    if (!c.orderFor) return 'leadPick';
    if (c.orderDone) return 'leadDone';
    if (c.orderSel || c.orderItem) return 'leadAim';
    return 'leadCmd';
  };
  const baseCoach2 = UI.coachHtml;
  UI.coachHtml = function (...a) {
    const c = exam0();
    try {
      if (c && !c.combat.result) {
        const k = leadKey(c);
        if (k) {
          c.tutorial.key = k;
          const L = this.examLeader && this.examLeader(); const who = L ? `선임 ${L.name}` : '리더';
          return `<div class="coach"><span class="eyebrow">${who} · 지휘 연습</span><div>"${say(L, k)}"<div class="small dim coach-sys">조작 · ${SYS[k]}</div></div></div>`;
        }
      }
    } catch (e) { /* 무시 */ }
    let h = baseCoach2.apply(this, a);
    try {
      if (h && c && c.tutorial.key === 'gauge') h = h.replace(/<\/div><\/div>$/, `<div class="small coach-sys coach-ord">${SYS.why}</div></div></div>`);
      if (h && c && c.tutorial.leadDone && c.tutorial.key === 'tools') h = ''; // 배속·자동은 지휘 연습 끝 안내에 넣었다
    } catch (e) { /* 무시 */ }
    return h;
  };
  // 말풍선이 가리킬 곳
  const baseTarget = UI.coachTarget;
  UI.coachTarget = function (label) {
    const c = exam0(); const k = c && c.tutorial.key;
    if (k === 'leadPick') return document.getElementById('allies');
    if (k === 'leadCmd') return document.querySelector('#cb-ctrl .order-cmd') || document.getElementById('cb-ctrl');
    if (k === 'leadAim') return document.getElementById(this.orderAim && this.orderAim() === 'ally' ? 'allies' : 'foes');
    if (k === 'leadDone') return document.querySelector('#cb-ctrl .cmd-main') || document.getElementById('cb-ctrl');
    return baseTarget ? baseTarget.call(this, label) : null;
  };
  // 지휘 연습 중에는 오더부터 (오더를 내리기 전에는 내 행동을 막는다)
  const baseRule = UI.tutRule;
  if (baseRule) UI.tutRule = function () {
    const c = exam0();
    if (c && c.tutorial.lead === 'on' && c.combat.waiting && !c.playing && !playerOrdered(c.combat)) {
      const ok = ['c-ally', 'c-target', 'o-cmd', 'o-skill', 'o-item', 'o-cancel', 'o-clear', 'c-speed', 'modal-close'];
      return { allow: (act) => ok.includes(act), msg: '먼저 동료를 눌러 오더를 내려 보자.' };
    }
    return baseRule.call(this);
  };
  // 반짝임: 지휘 연습 단계 (위 want() 보다 먼저)
  setInterval(() => {
    try {
      const c = exam0(); if (!c || !c.combat || c.combat.result || c.tutorial.lead !== 'on' || !c.combat.waiting || c.playing) return;
      const k = leadKey(c); let sel = [];
      if (k === 'leadPick') sel = ['#allies .ally.fig:not(.me):not(.summon)'];
      else if (k === 'leadCmd') sel = c.orderCmd === 'skill' ? ['#cb-ctrl .cmd-pop [data-act="o-skill"]'] : c.orderCmd === 'item' ? ['#cb-ctrl .cmd-pop [data-act="o-item"]:not([disabled])'] : ['#cb-ctrl .order-cmd .cmd-main [data-act="o-cmd"][data-v="attack"]'];
      else if (k === 'leadAim') sel = [UI.orderAim && UI.orderAim() === 'ally' ? '#allies .ally.fig' : '#foes .foe:not(.dead)'];
      else if (k === 'leadDone') sel = c.sel ? ['#foes .foe:not(.dead)'] : c.cmd === 'skill' ? ['#cb-ctrl .cmd-pop [data-act="c-skill"]'] : ['#cb-ctrl .cmd-main [data-act="c-skill"][data-v="strike"]', '#cb-ctrl .cmd-main [data-act="c-cmd"][data-v="skill"]'];
      const on = new Set(sel.length ? [...document.querySelectorAll(sel.join(','))] : []);
      for (const el of document.querySelectorAll('.tut-glow')) if (!on.has(el)) el.classList.remove('tut-glow');
      for (const el of on) el.classList.add('tut-glow');
    } catch (e) { /* 무시 */ }
  }, 150);
}
