// ===== 게이트 크로니클: 정산서 (영역 A, 사용자 제보: "정산 UI가 소설처럼 나열돼 내 몫이 안 보인다") =====
// 토벌·게이트를 끝낸 뒤의 결과 창을 문장 나열 대신 정산서로 다시 그린다.
//  1) 맨 위: 내가 실제로 받은 크레딧(크게, 숫자가 올라간다)·에테르·명성
//  2) 나눴다면 분배 막대: 전체 보상 중 리더 몫 / 내 몫 / 팀원·공용 경비(또는 동료 이름별)를 색 막대와 금액표로
//  3) 얻은 물건: 코어·부산물·유물을 칩으로
//  4) 그 밖의 소식은 작은 글씨 목록으로
// 결과 줄은 여러 영역이 문장으로 만든다. 여기서는 아는 형식만 골라 읽고, 모르는 줄은 그대로 아래 목록에 남긴다.
{
  const num = (s) => +String(s || '0').replace(/[^0-9.-]/g, '') || 0;
  const MONEY_RE = [
    /^토벌 보상:\s*([0-9,]+)\s*크레딧,\s*에테르\s*([0-9,]+)/,
    /^획득:\s*([0-9,]+)\s*크레딧,\s*에테르\s*([0-9,]+)/,
  ];
  const ITEM_RE = /^(괴수 코어|부산물|유물 발견|보스 드롭|장비 획득|전리품)\s*:\s*(.+)$/;

  const parse = (texts) => {
    const S = { gross: null, ether: null, mine: null, fame: 0, split: null, items: [], notes: [], warn: [] };
    for (const raw of texts) {
      const t = raw.replace(/\s+/g, ' ').trim(); if (!t) continue;
      let m;
      if (S.gross == null && (m = MONEY_RE.find((r) => r.test(t)))) { const x = m.exec(t); S.gross = num(x[1]); S.ether = num(x[2]); S.grossKind = /^토벌/.test(t) ? 'mob' : 'gate'; continue; }
      if ((m = ITEM_RE.exec(t))) {
        const kind = m[1]; const body = m[2].replace(/\s*\([^)]*챙김\)\s*$/, '');
        for (const part of body.split(/,\s*/)) { const q = /^(.*?)\s*(?:×\s*|\s)(\d+)(개)?$/.exec(part.trim()); S.items.push({ kind, name: q ? q[1] : part.trim(), n: q ? +q[2] : 1 }); }
        continue;
      }
      if ((m = /^파티 분배: 토벌 보상 ([0-9,]+) 크레딧 중 내 몫 (\d+)% \(([0-9,]+) 크레딧\)/.exec(t))) {
        const total = num(m[1]); const mine = num(m[3]); const lead = Math.round(total * (typeof LEADER_CUT === 'number' ? LEADER_CUT : 0.1));
        S.split = { total, rows: [{ who: '리더 몫', amt: lead, cls: 'lead' }, { who: '내 몫', amt: mine, cls: 'me' }, { who: '팀원 몫 · 공용 경비', amt: Math.max(0, total - lead - mine), cls: 'rest' }] };
        S.mine = mine; const late = /집결에 (\d+)일 늦어/.exec(t); if (late) S.warn.push(`집결에 ${late[1]}일 늦어 배당이 깎였다.`);
        continue;
      }
      if ((m = /^팀 배당: 전리품 ([0-9,]+) 크레딧에서 리더 몫 (\d+)%.*?내 배당 (\d+)% → ([0-9,]+) 크레딧/.exec(t))) {
        const total = num(m[1]); const mine = num(m[4]); const lead = Math.round(total * num(m[2]) / 100);
        S.split = { total, rows: [{ who: '리더 몫', amt: lead, cls: 'lead' }, { who: '내 몫', amt: mine, cls: 'me' }, { who: '팀원 몫 · 공용 경비', amt: Math.max(0, total - lead - mine), cls: 'rest' }] };
        S.mine = mine; continue;
      }
      if ((m = /^무소속 파티 분배: (리더 몫 (\d+)%를 챙기고 )?.*?내 몫 (\d+)% \(([0-9,]+) 크레딧\)(?: · (.+))?$/.exec(t))) {
        const mine = num(m[4]); const rows = [{ who: m[1] ? '내 몫 (리더 몫 포함)' : '내 몫', amt: mine, cls: 'me' }];
        for (const part of (m[5] || '').split(/,\s*/)) { const q = /^(.+?) (\d+)% \(([0-9,]+)\)$/.exec(part.trim()); if (q) rows.push({ who: q[1], amt: num(q[3]), cls: 'mate' }); }
        S.split = { total: rows.reduce((a, r) => a + r.amt, 0), rows, note: '능력에 비례해 나눔' }; S.mine = mine; continue;
      }
      if ((m = /명성 \+(\d+)/.exec(t))) { S.fame += num(m[1]); if (/^게이트 클리어! 명성 \+\d+$/.test(t)) continue; }
      if (/^소속 규정:/.test(t)) { S.pooled = t.replace(/^소속 규정:\s*/, ''); continue; }
      if (/^홀로 공략한 덕에/.test(t)) { S.solo = true; continue; }
      if (/쓰러져 돌아오지 못했다|잃었|부상|수명/.test(t)) S.warn.push(t); else S.notes.push(t);
    }
    if (S.gross != null && S.mine == null) S.mine = S.grossKind === 'mob' && S.split ? S.split.rows.find((r) => r.cls === 'me').amt : S.gross;
    if (S.pooled && S.grossKind === 'gate') S.mineLabel = '소속에 귀속';
    return S;
  };

  const ITEM_ICON = { '괴수 코어': '◆', '부산물': '⬢', '유물 발견': '✦', '보스 드롭': '★', '장비 획득': '⚔', '전리품': '•' };
  const sheetHtml = (S) => {
    const big = `<div class="ss-top">
      <div class="ss-main"><span class="ss-lab">${S.mineLabel || '내가 받은 크레딧'}</span><b class="ss-money"><span class="ss-count" data-to="${S.mine || 0}">${fmt(S.mine || 0)}</span><small> 크레딧</small></b></div>
      <div class="ss-side">${S.ether != null ? `<div><span class="ss-lab">에테르</span><b class="ether">+${fmt(S.ether)}</b></div>` : ''}${S.fame ? `<div><span class="ss-lab">명성</span><b class="amber">+${fmt(S.fame)}</b></div>` : ''}</div>
    </div>`;
    let split = '';
    if (S.split && S.split.total > 0) {
      const T = S.split.total; const pct = (a) => Math.max(0, Math.round(a / T * 100));
      split = `<div class="ss-sec"><div class="ss-h"><span>분배</span><span class="dim">전체 보상 ${fmt(T)} 크레딧${S.split.note ? ` · ${S.split.note}` : ''}</span></div>
        <div class="ss-bar">${S.split.rows.map((r) => `<i class="${r.cls}" style="flex:${Math.max(r.amt, T * 0.015)}"></i>`).join('')}</div>
        <div class="ss-rows">${S.split.rows.map((r) => `<div class="ss-row ${r.cls}"><span><i></i>${r.who}</span><span class="dim">${pct(r.amt)}%</span><b>${fmt(r.amt)}</b></div>`).join('')}</div></div>`;
    } else if (S.solo) split = `<div class="ss-sec"><div class="ss-h"><span>분배</span><span class="dim">혼자 공략 · 전부 내 몫 (크레딧 +10%, 에테르 +15%)</span></div></div>`;
    const pooled = S.pooled ? `<div class="ss-sec"><div class="ss-h"><span>소속 정산</span></div><div class="small">${fixJosa(S.pooled)}</div></div>` : '';
    const items = S.items.length ? `<div class="ss-sec"><div class="ss-h"><span>얻은 물건</span></div><div class="ss-items">${S.items.map((it) => `<span class="ss-item k-${it.kind.replace(/\s/g, '')}"><em>${ITEM_ICON[it.kind] || '•'}</em>${it.name}${it.n > 1 ? `<b>×${it.n}</b>` : ''}</span>`).join('')}</div></div>` : '';
    const warn = S.warn.length ? `<div class="ss-warn">${S.warn.map((w) => `<div>${fixJosa(w)}</div>`).join('')}</div>` : '';
    const notes = S.notes.length ? `<ul class="ss-notes">${S.notes.map((n) => `<li>${fixJosa(n)}</li>`).join('')}</ul>` : '';
    return `<div class="settle-sheet">${big}${split}${pooled}${items}${warn}${notes}</div>`;
  };

  const countUp = (root) => {
    const el = root.querySelector('.ss-count'); if (!el) return;
    const to = +el.dataset.to || 0; if (!to || (typeof FX !== 'undefined' && FX.reduced)) return;
    const t0 = performance.now(); const dur = 700;
    const tick = (now) => { if (!el.isConnected) return; const k = Math.min(1, (now - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
    el.textContent = '0'; requestAnimationFrame(tick);
  };

  // 결과 창의 문장 줄(<p>)을 정산서로 바꾼다
  UI.settleSheet = function () {
    const box = document.getElementById('modal-box'); if (!box || box.querySelector('.settle-sheet')) return;
    const ps = [...box.querySelectorAll(':scope > p')]; if (!ps.length) return;
    const S = parse(ps.map((p) => p.textContent));
    if (S.gross == null && !S.items.length) return; // 정산할 것이 없는 창(패배·이탈)은 그대로
    const wrap = document.createElement('div'); wrap.innerHTML = sheetHtml(S);
    ps[0].before(wrap.firstChild); ps.forEach((p) => p.remove());
    box.classList.add('settle-modal');
    countUp(box);
  };

  const baseP = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function (...a) { const r = baseP.apply(this, a); try { this.settleSheet(); } catch (e) { /* 실패하면 문장 그대로 */ } return r; };
  const baseG = UI.finishGate;
  UI.finishGate = function (...a) { const r = baseG.apply(this, a); try { this.settleSheet(); } catch (e) { /* 무시 */ } return r; };
  // 보상 줄 하나씩 나오기 연출(fx_feel.js)은 숫자를 0부터 올리려고 글자를 바꿔 버린다. 그보다 먼저 정산서로 바꾸고, 바꿨으면 그 연출은 건너뛴다
  const baseReveal = UI.revealRewards;
  if (baseReveal) UI.revealRewards = function (...a) {
    try { this.settleSheet(); } catch (e) { /* 무시 */ }
    if (document.querySelector('#modal-box .settle-sheet')) return;
    return baseReveal.apply(this, a);
  };
  UI._settleParse = parse;
}
