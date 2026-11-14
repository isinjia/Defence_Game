// 초상 그림 조각 다시 받기 (사용자 제보: 대화 인물이 가끔 머리·목만 나오고 옷·몸이 없음)
// 원인: 직업복 그림 한 장이 받아지지 못하면(모바일 통신 끊김 등) 옷이 빠지고, 옷 아래로 숨기게 되어 있는 몸도 함께 사라진다.
// 초상 준비(portrait_parts.js prepareElement)는 조각 하나가 실패해도 그대로 보여 주므로, 준비가 끝난 초상에서
// 아직 받지 못한 조각(data: 가 아닌 주소)을 찾아 몇 번 더 받아 본다. 받아지면 그 주소로 바꿔 끼워 바로 보인다.
{
  const tried = new WeakMap(); // 조각 → 시도 횟수
  const DELAYS = [400, 1500, 4000];
  const load = (url) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(url); im.onerror = no; im.src = url; });
  const retry = (node, href) => {
    const n = tried.get(node) || 0; if (n >= DELAYS.length) return;
    tried.set(node, n + 1);
    setTimeout(() => {
      if (!node.isConnected) return;
      const url = href + (href.includes('?') ? '&' : '?') + 'r=' + (n + 1);
      load(url).then((u) => {
        node.setAttribute('href', u); node.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', u);
        node.dataset.retried = '1';
      }).catch(() => retry(node, href));
    }, DELAYS[n]);
  };
  // 준비가 끝난 초상의 조각 중, 실제로 그려지지 않은 것만 다시 받는다
  const scan = () => {
    for (const svg of document.querySelectorAll('svg[data-portrait-parts][data-parts-ready="1"]')) {
      for (const node of svg.querySelectorAll('image')) {
        if (tried.has(node) || node.dataset.retried) continue;
        const href = node.getAttribute('href') || node.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        if (!href || href.startsWith('data:')) continue;
        // 받아지는 그림인지 먼저 확인(캐시에 있으면 바로 성공) — 실패한 것만 다시 받기
        tried.set(node, 0);
        // 그림 자체가 받아지면, 앞서 실패했을 수도 있는 조각이 다시 그려지도록 주소를 한 번 새로 끼운다(실패한 조각은 같은 주소로는 다시 그리지 않는다)
        load(href).then(() => {
          tried.set(node, DELAYS.length);
          const u = href + (href.includes('?') ? '&' : '?') + 'r=0';
          node.setAttribute('href', u); node.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', u); node.dataset.retried = '1';
        }).catch(() => { tried.set(node, 0); retry(node, href); });
      }
    }
  };
  setInterval(() => { try { scan(); } catch (e) { /* 무시 */ } }, 700);
}
