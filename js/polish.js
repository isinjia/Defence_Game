// 완성도 다듬기 (영역 B): 화면 겹침·가림 같은 작은 문제를 감싸기로 고친다. 스타일은 css/polish.css.
{
  // 알림 띠: 창이 열려 있으면 창 머리(제목·닫기 단추)를 덮지 않게 아래쪽에 띄운다
  const baseToast = UI.toast;
  UI.toast = function (msg) {
    const r = baseToast.call(this, msg);
    try { const t = document.getElementById('toast'); if (t) t.classList.toggle('low', !!(this.modalOpen && this.modalOpen())); } catch (e) { /* 무시 */ }
    return r;
  };

  // 전투 말풍선: 말하는 인물을 잠깐 맨 위로 올려, 옆 사람 초상에 글자가 가리지 않게 한다
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const r = baseApply.call(this, l);
    try {
      const ev = l && l.ev;
      if (ev && ev.k === 'say') {
        const el = document.getElementById('u-' + ev.src);
        if (el) { el.classList.add('saying'); clearTimeout(el._sayT); el._sayT = setTimeout(() => el.classList.remove('saying'), 1800); }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
