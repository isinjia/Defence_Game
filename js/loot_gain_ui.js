// ===== 게이트 크로니클: 이야기·사건 획득 정산 (영역 B·E, 사용자 요청) =====
// 문장 끝에 붙은 "(유물…, E급 코어 2개…)" / "괴수 코어: …" 를 정산서 칩으로 바꿔
// 게임처럼 보이게 하고, 칩을 누르면 아이템 상세(item_pop)가 열린다.
{
  const chip = (kind, name, n) => (UI.itemChip ? UI.itemChip(kind, name, n || 1)
    : `<span class="ss-item">${name}${n > 1 ? ` ×${n}` : ''}</span>`);

  const takeQty = (s) => {
    const m = /^(.*?)\s*(?:×\s*|\s)?(\d+)\s*개?$/.exec(String(s).trim());
    return m ? { name: m[1].trim(), n: +m[2] } : { name: String(s).trim(), n: 1 };
  };

  const classifyToken = (raw) => {
    let t = String(raw || '').trim(); if (!t) return null;
    t = t.replace(/\s*\([^)]*챙김\)\s*$/, '').trim();
    // 스탯성
    let m;
    if ((m = /^크레딧\s*([+-]?\d[\d,]*)$/.exec(t))) return { kind: 'stat', key: 'money', v: +m[1].replace(/,/g, ''), label: `크레딧 ${m[1].startsWith('-') ? '' : '+'}${m[1]}` };
    if ((m = /^에테르\s*\+?(\d[\d,]*)$/.exec(t))) return { kind: 'stat', key: 'ether', v: +m[1].replace(/,/g, ''), label: `에테르 +${m[1]}` };
    if ((m = /^명성\s*([+-]?\d+)$/.exec(t))) return { kind: 'stat', key: 'fame', v: +m[1], label: `명성 ${m[1] > 0 ? '+' : ''}${m[1]}` };
    if ((m = /^협회 공적\s*([+-]?\d+)$/.exec(t))) return { kind: 'stat', key: 'merit', v: +m[1], label: `공적 ${m[1] > 0 ? '+' : ''}${m[1]}` };
    if ((m = /^도시 평판\s*([+-]?\d+)$/.exec(t))) return { kind: 'stat', key: 'rep', v: +m[1], label: `평판 ${m[1] > 0 ? '+' : ''}${m[1]}` };
    if (/^체력\s/.test(t) || /^부상\s/.test(t) || /^수명\s/.test(t) || /^재능\s/.test(t)) return { kind: 'stat', key: 'other', label: t };
    // 유물
    if (/유물/.test(t) || /^\[[^\]]+\]$/.test(t)) return { kind: '유물 발견', name: t, n: 1 };
    // 코어
    if ((m = /^(([FEDCBA]|SS?)급\s*코어)\s*(\d+)\s*개?$/.exec(t)) || (m = /^(([FEDCBA]|SS?)급\s*코어)$/.exec(t))) {
      return { kind: '괴수 코어', name: m[1].replace(/\s+/g, ' ').trim(), n: m[3] ? +m[3] : 1 };
    }
    // 부산물 · 촉매 · 소모품 · 장비 이름
    if ((m = /^(([FEDCBA]|SS?)급\s+.+?)\s+(\d+)\s*개?$/.exec(t))) {
      const name = m[1].trim();
      if (/각성 촉매/.test(name)) return { kind: 'cat', name, n: +m[3] };
      return { kind: '부산물', name, n: +m[3] };
    }
    if ((m = /^(응급 회복제|마나 앰플|에테르 결정|각성 촉매)\s+(\d+)\s*개?$/.exec(t))) {
      return { kind: '전리품', name: m[1], n: +m[2] };
    }
    if (/^스킬\s*\[/.test(t)) return { kind: 'stat', key: 'skill', label: t };
    return { kind: '전리품', name: t, n: 1 };
  };

  const parseLootText = (full) => {
    let body = String(full || '');
    const items = []; const stats = [];
    // "괴수 코어: …" / "부산물: …" / "유물 발견: …" 줄
    body = body.replace(/(?:^|\s)(괴수 코어|부산물|유물 발견|보스 드롭|장비 획득|전리품)\s*:\s*([^.(]+?)(?=(?:\s(?:괴수 코어|부산물|유물 발견|보스 드롭|장비 획득|전리품)\s*:)|$)/g, (_, kind, list) => {
      for (const part of list.split(/,\s*/)) {
        const q = takeQty(part); if (!q.name) continue;
        if (kind === '괴수 코어' && !/코어$/.test(q.name)) q.name = q.name.replace(/\s*$/, '') + ( /급$/.test(q.name) ? ' 코어' : '');
        items.push({ kind, name: q.name, n: q.n });
      }
      return ' ';
    });
    // 맨 끝 (…, …) 묶음 — gain() 요약
    body = body.replace(/\s*\(([^)]+)\)\s*$/, (_, inner) => {
      for (const part of inner.split(/,\s*/)) {
        const it = classifyToken(part);
        if (!it) continue;
        if (it.kind === 'stat') stats.push(it);
        else items.push({ kind: it.kind === 'cat' ? '전리품' : it.kind, name: it.name, n: it.n || 1 });
      }
      return '';
    });
    // 본문에 남은 짧은 토큰은 무시하고 서술만 정리
    const story = body.replace(/\s{2,}/g, ' ').trim();
    return { story, items, stats };
  };

  const sheetFrom = (parsed) => {
    if (!parsed.items.length && !parsed.stats.length) return '';
    const money = parsed.stats.find((s) => s.key === 'money');
    const ether = parsed.stats.find((s) => s.key === 'ether');
    const fame = parsed.stats.filter((s) => s.key === 'fame').reduce((a, s) => a + (s.v || 0), 0);
    const other = parsed.stats.filter((s) => s.key !== 'money' && s.key !== 'ether' && s.key !== 'fame');
    const top = (money || ether || fame)
      ? `<div class="ss-top lg-top">
          <div class="ss-main"><span class="ss-lab">획득</span>${money ? `<b class="ss-money"><span>${money.v >= 0 ? '+' : ''}${fmt(Math.abs(money.v))}</span><small> 크레딧</small></b>` : `<b class="ss-money" style="font-size:22px">전리품</b>`}</div>
          <div class="ss-side">${ether ? `<div><span class="ss-lab">에테르</span><b class="ether">+${fmt(ether.v)}</b></div>` : ''}${fame ? `<div><span class="ss-lab">명성</span><b class="amber">${fame > 0 ? '+' : ''}${fame}</b></div>` : ''}</div>
        </div>`
      : '';
    const items = parsed.items.length
      ? `<div class="ss-sec"><div class="ss-h"><span>얻은 물건</span><span class="dim">눌러 상세</span></div><div class="ss-items lg-items">${parsed.items.map((it) => chip(it.kind, it.name, it.n)).join('')}</div></div>`
      : '';
    const notes = other.length ? `<ul class="ss-notes">${other.map((s) => `<li>${fixJosa(s.label)}</li>`).join('')}</ul>` : '';
    return `<div class="settle-sheet loot-gain">${top}${items}${notes}</div>`;
  };

  UI.lootGainSheet = function () {
    const box = document.getElementById('modal-box'); if (!box) return false;
    if (box.querySelector('.loot-gain')) return true;
    const p = box.querySelector('p.event-text') || box.querySelector(':scope > p');
    if (!p) return false;
    const parsed = parseLootText(p.textContent);
    if (!parsed.items.length && !parsed.stats.length) return false;
    const sheet = sheetFrom(parsed); if (!sheet) return false;
    const wrap = document.createElement('div'); wrap.innerHTML = sheet;
    if (parsed.story) p.textContent = parsed.story; else p.remove();
    const anchor = box.querySelector('.row.end') || null;
    if (anchor) anchor.before(wrap.firstChild); else box.appendChild(wrap.firstChild);
    box.classList.add('settle-modal', 'loot-gain-box');
    // 제목 강조
    const eye = box.querySelector('.eyebrow');
    if (eye && !box.querySelector('h3.loot-gain-h')) {
      const h = document.createElement('h3'); h.className = 'loot-gain-h settle-title'; h.textContent = '획득';
      eye.after(h);
    }
    return true;
  };

  const afterModal = (fn) => {
    const base = UI[fn]; if (!base) return;
    UI[fn] = function (...a) {
      const r = base.apply(this, a);
      try { this.lootGainSheet(); } catch (e) { /* 무시 */ }
      return r;
    };
  };
  afterModal('finishStoryFight');
  afterModal('finishTourney');
  afterModal('finishPersonalCombat');

  // 사건 선택 결과 창(문장+gain)도 같은 방식으로
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const r = baseHandle.call(this, act, v);
    if (act === 'choice' || act === 'story-choice' || act === 'ev-choice') {
      try { setTimeout(() => { try { this.lootGainSheet(); } catch (e) { /* 무시 */ } }, 0); } catch (e) { /* 무시 */ }
    }
    return r;
  };
}
