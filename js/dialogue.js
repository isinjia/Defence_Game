// ===== 게이트 크로니클: 대화창 =====
// 상황을 팝업 한 장으로 설명하지 않고, 인물이 한 줄씩 말하는 대화창으로 진행한다.
// UI.talk(lines, onDone)
//   lines: [{ who, text } | { narr: '서술' } | { sys: '결과·조작 안내(이야기 밖의 글)' } | { choices: [{ text, go: () => {} }] }]
//   who: 'player' | NPC 객체 | { name, face } (face 는 아바타 HTML) | 문자열(이름만)
// 화면을 누르면 다음 줄로 넘어간다. 글자가 다 나오기 전에 누르면 한 번에 다 보여 준다.

Object.assign(UI, {
  talk(lines, onDone) {
    this.dlg = { lines: lines.filter(Boolean), i: 0, onDone, typing: null };
    this.dlgShow();
  },
  dlgSpeaker(who) {
    if (!who) return null;
    if (who === 'player') return { name: G.player ? G.player.name : '나', face: this.playerAvatar(58), me: true };
    if (typeof who === 'string') return { name: who, face: '' };
    if (who.id != null && who.personality) return { name: who.name, face: this.npcAvatar(who, 58), sub: who.examLeader ? '선임 · 리더' : '' };
    return { name: who.name, face: who.face || '', sub: who.sub || '' };
  },
  dlgShow() {
    const d = this.dlg; if (!d) return;
    let el = document.getElementById('dlg');
    if (!el) { el = document.createElement('div'); el.id = 'dlg'; document.body.appendChild(el); }
    const line = d.lines[d.i];
    if (!line) return this.dlgEnd();
    if (line.choices) {
      const prev = d.lines[d.i - 1]; const sp = prev && !prev.narr && !prev.sys && !prev.choices ? this.dlgSpeaker(prev.who) : null;
      el.className = 'dlg';
      el.innerHTML = `<div class="dlg-choices">${line.choices.map((c, k) => `<button class="dlg-choice" data-act="dlg-choice" data-v="${k}">${fixJosa(c.text)}</button>`).join('')}</div>
        ${prev && !prev.choices ? this.dlgBoxHtml(prev, sp, true) : ''}`;
      return;
    }
    const sp = line.narr || line.sys ? null : this.dlgSpeaker(line.who);
    el.className = 'dlg';
    el.innerHTML = this.dlgBoxHtml(line, sp, false);
    // 한 글자씩
    const txt = el.querySelector('.dlg-text'); const full = fixJosa(line.narr || line.sys || line.text || '');
    clearInterval(d.typing);
    if (FX.reduced || full.length < 2) { txt.textContent = full; return; }
    let n = 0; txt.textContent = '';
    d.typing = setInterval(() => { n += 2; txt.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(d.typing); d.typing = null; } }, 22);
    d.full = full;
  },
  dlgBoxHtml(line, sp, still) {
    const text = fixJosa(line.narr || line.sys || line.text || '');
    return `<div class="dlg-box ${line.narr ? 'narr' : ''} ${line.sys ? 'narr sys' : ''} ${sp && sp.me ? 'me' : ''}" ${still ? '' : 'data-act="dlg-next"'}>
      ${sp && sp.face ? `<div class="dlg-face">${sp.face}</div>` : ''}
      <div class="dlg-body">${sp ? `<div class="dlg-name">${sp.name}${sp.sub ? ` <span class="dlg-sub">${sp.sub}</span>` : ''}</div>` : ''}
        <div class="dlg-text">${still ? text : ''}</div>${still ? '' : '<div class="dlg-more" aria-hidden="true">▼</div>'}</div></div>`;
  },
  dlgNext() {
    const d = this.dlg; if (!d) return;
    if (d.typing) { clearInterval(d.typing); d.typing = null; const t = document.querySelector('#dlg .dlg-text'); if (t) t.textContent = d.full; return; }
    d.i++; this.dlgShow();
  },
  dlgEnd(go) {
    const d = this.dlg; this.dlg = null;
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
