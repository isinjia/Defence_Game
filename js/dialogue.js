// ===== 게이트 크로니클: 대화창 =====
// 상황을 팝업 한 장으로 설명하지 않고, 인물이 한 줄씩 말하는 대화창으로 진행한다.
// UI.talk(lines, onDone)
//   lines: [{ who, text } | { narr: '서술' } | { sys: '결과·조작 안내(이야기 밖의 글)' } | { choices: [{ text, go: () => {} }] }]
//   who: 'player' | NPC 객체 | { name, sub, seed, gender, elem } | 문자열(이름만)
// 말하는 사람의 상반신이 대사 상자 위에 서고(플레이어는 오른쪽), 이름표는 그 사람의 속성 색이다.
// 화면을 누르면 다음 줄로 넘어간다. 글자가 다 나오기 전에 누르면 한 번에 다 보여 준다.

Object.assign(UI, {
  talk(lines, onDone) {
    this.dlg = { lines: lines.filter(Boolean), i: 0, onDone, typing: null, lastKey: null };
    this.dlgShow();
  },
  dlgSpeaker(who) {
    if (!who) return null;
    const ec = (e) => (e && ELEMENTS[e] ? ELEMENTS[e].color : '#9fb3c8');
    const pw = window.innerWidth < 520 ? 74 : 92;
    if (who === 'player') { const p = G.player; return { key: 'player', name: p ? p.name : '나', art: p ? this.playerPortrait(pw) : '', color: ec(p && p.element), me: true }; }
    if (typeof who === 'string') return { key: who, name: who, art: '', color: '#9fb3c8' };
    if (who.id != null && who.personality) return { key: 'n' + who.id, name: who.name, art: this.npcPortrait(who, pw), color: ec(who.element), sub: who.examLeader ? (G.crewLeader && G.crewLeader() === who ? '선임 · 리더' : '시험 때 선임') : who.examMate ? '시험 동기' : '' };
    // 이름 있는 단역 (시험관, 측정관 등): 이름으로 얼굴을 정해 매번 같은 사람으로 보이게
    const art = who.seed === false ? '' : FX.portrait('extra' + (who.seed || who.name), who.gender || (FX.hash(who.name) % 2 ? 'F' : 'M'), who.elem || 'wood', who.rank ?? 2, pw);
    return { key: 'x' + who.name, name: who.name, art, color: who.color || ec(who.elem) || '#9fb3c8', sub: who.sub || '' };
  },
  dlgShow() {
    const d = this.dlg; if (!d) return;
    let el = document.getElementById('dlg');
    if (!el) { el = document.createElement('div'); el.id = 'dlg'; document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on')); }
    const line = d.lines[d.i];
    if (!line) return this.dlgEnd();
    // 여러 사람이 한 화면에서 차례로 한마디씩 (동기 소개 등): { group: [{ who, text }], narr? }
    if (line.group) {
      d.lastKey = null; clearInterval(d.typing); d.typing = null;
      el.innerHTML = `<div class="dlg-box narr done dlg-group" data-act="dlg-next"><div class="dlg-body">${line.narr ? `<div class="dlg-text">${fixJosa(line.narr)}</div>` : ''}
        ${line.group.map((g, k) => { const sp = this.dlgSpeaker(g.who); const face = g.who && g.who.id != null && this.npcAvatar ? this.npcAvatar(g.who, 40) : ''; return `<div class="dlg-gl" style="--d:${k * 140}ms;--ac:${sp ? sp.color : '#9fb3c8'}">${face}<div><b>${sp ? sp.name : ''}</b>${sp && sp.sub ? ` <span class="small dim">${sp.sub}</span>` : ''}<div>${fixJosa(g.text)}</div></div></div>`; }).join('')}</div></div>`;
      return;
    }
    // 선택지는 직전 대사를 그대로 둔 채 그 위에 띄운다
    if (line.choices) {
      const prev = d.lines[d.i - 1]; const sp = prev && !prev.narr && !prev.sys && !prev.choices ? this.dlgSpeaker(prev.who) : null;
      el.innerHTML = `<div class="dlg-choices">${line.choices.map((c, k) => `<button class="dlg-choice" style="--d:${k * 60}ms" data-act="dlg-choice" data-v="${k}"><span class="dlg-ck">${k + 1}</span><span>${fixJosa(c.text)}</span></button>`).join('')}</div>
        ${prev && !prev.choices ? this.dlgBoxHtml(prev, sp, true) : ''}`;
      return;
    }
    const sp = line.narr || line.sys ? null : this.dlgSpeaker(line.who);
    const fresh = !sp || sp.key !== d.lastKey; d.lastKey = sp ? sp.key : null;
    el.innerHTML = this.dlgBoxHtml(line, sp, false, fresh);
    // 한 글자씩
    const txt = el.querySelector('.dlg-text'); const full = fixJosa(line.narr || line.sys || line.text || '');
    clearInterval(d.typing); d.full = full; d.typing = null;
    if (FX.reduced || full.length < 2) { txt.textContent = full; el.querySelector('.dlg-box').classList.add('done'); return; }
    let n = 0; txt.textContent = '';
    d.typing = setInterval(() => {
      n += 2; txt.textContent = full.slice(0, n);
      if (n >= full.length) { clearInterval(d.typing); d.typing = null; const b = el.querySelector('.dlg-box'); if (b) b.classList.add('done'); }
    }, 24);
  },
  // 대사 상자 위에 서는 상반신
  dlgStageHtml(sp, fresh) {
    if (!sp || !sp.art) return '';
    return `<div class="dlg-stage ${sp.me ? 'right' : 'left'} ${fresh ? 'enter' : ''}" style="--ac:${sp.color}">${sp.art}</div>`;
  },
  dlgBoxHtml(line, sp, still, fresh) {
    const text = fixJosa(line.narr || line.sys || line.text || '');
    const kind = line.sys ? 'sys' : line.narr ? 'narr' : 'talk';
    return `<div class="dlg-box ${kind} ${sp && sp.me ? 'me' : ''} ${sp && sp.art ? 'has-face' : ''} ${still ? 'done still' : ''}" style="--ac:${sp ? sp.color : '#7f8ea3'}" ${still ? '' : 'data-act="dlg-next"'}>
      ${sp && sp.art ? `<div class="dlg-face ${fresh ? 'enter' : ''}">${sp.art}</div>` : ''}
      <div class="dlg-body">${sp ? `<div class="dlg-plate"><b>${sp.name}</b>${sp.sub ? `<span>${sp.sub}</span>` : ''}</div>` : ''}
      <div class="dlg-text">${still ? text : ''}</div></div>
      ${still ? '' : '<div class="dlg-more" aria-hidden="true"><svg viewBox="0 0 12 8" width="12" height="8"><path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'}</div>`;
  },
  dlgNext() {
    const d = this.dlg; if (!d) return;
    if (d.typing) {
      clearInterval(d.typing); d.typing = null;
      const t = document.querySelector('#dlg .dlg-text'); if (t) t.textContent = d.full;
      const b = document.querySelector('#dlg .dlg-box'); if (b) b.classList.add('done');
      return;
    }
    d.i++; this.dlgShow();
  },
  dlgEnd(go) {
    const d = this.dlg; this.dlg = null;
    if (d) clearInterval(d.typing);
    const el = document.getElementById('dlg'); if (el) el.remove();
    if (go) return go();
    if (d && d.onDone) d.onDone();
  },
  dlgOpen() { return !!this.dlg; },
});

{
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'dlg-next') return this.dlgNext();
    if (act === 'dlg-choice') { const d = this.dlg; const line = d && d.lines[d.i]; const c = line && line.choices[+v]; if (!c) return; return this.dlgEnd(c.go || (() => d.onDone && d.onDone())); }
    return baseHandle.call(this, act, v);
  };
}

// 대화창이 떠 있으면 화면 어디를 눌러도 다음 대사로 (대사 상자만 누를 필요 없음). 선택지가 떠 있을 때는 선택지만.
document.addEventListener('click', (e) => {
  const d = UI.dlg; const el = document.getElementById('dlg');
  if (!d || !el || !el.contains(e.target)) return;
  if (e.target.closest('[data-act]')) return; // 대사 상자·선택지는 원래 처리
  const line = d.lines[d.i]; if (line && line.choices) return;
  UI.dlgNext();
});
document.addEventListener('keydown', (e) => {
  if (!UI.dlg || (e.key !== 'Enter' && e.key !== ' ')) return;
  const line = UI.dlg.lines[UI.dlg.i]; if (line && line.choices) return;
  e.preventDefault(); UI.dlgNext();
});
