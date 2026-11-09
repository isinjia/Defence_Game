// 프롤로그 무작위 진행 시뮬레이션: 연결 오류, 선택 수, 직업·속성 분포, 운명(마지막 계시) 일치율
// 사용법: node tools/sim_prologue.js [횟수]
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['js/data.js', 'js/game.js', 'js/data_classes.js', 'js/prologue.js', 'js/pro_arcs_a.js', 'js/pro_arcs_b.js', 'js/pro_arcs_c.js', 'js/pro_hooks.js', 'js/pro_life.js'];
const src = files.filter((f) => fs.existsSync(path.join(root, f))).map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const out = new Function(`${src}; return { P: PROLOGUE, PS: PROLOGUE_START, R: resolvePrologue, remember: proRemember, text: proText, sceneText: proSceneText, CLASSES, H: typeof PRO_HOOKS !== 'undefined' ? PRO_HOOKS : {} };`)();
const { P, PS, R, remember, text, sceneText, CLASSES, H } = out;
const N = +process.argv[2] || 5000;

let bad = 0;
for (const id in P) for (const c of P[id].choices) if (c.next && !P[c.next]) { bad++; console.log('연결 오류', id, '→', c.next); }
const cls = {}, el = {}, arcs = {};
let maxSteps = 0, fateN = 0, fateHit = 0, leftover = 0;
for (let i = 0; i < N; i++) {
  const bg = Object.keys(PS)[i % 5];
  const sc = { e: {}, g: {}, c: {}, t: {}, talent: 0, luck: 0 };
  const flags = {};
  let id = PS[bg][Math.floor(Math.random() * PS[bg].length)], st = 0;
  while (id) {
    const scene = P[id];
    // 문장 치환이 남지 않는지 확인
    const shown = text(sceneText(scene, flags), flags);
    if (/\{\?|\{!|\|\}/.test(shown)) leftover++;
    const ch = scene.choices[Math.floor(Math.random() * scene.choices.length)];
    if (/\{\?/.test(text(ch.text, flags))) leftover++;
    remember(sc, flags, id, ch);
    for (const k of ['e', 'g', 'c', 't']) for (const [x, v] of Object.entries(ch[k] || {})) sc[k][x] = (sc[k][x] || 0) + v;
    sc.talent += ch.talent || 0; sc.luck += ch.luck || 0;
    if (st === 0) { const n = ch.next || ''; const a = /^(gb_|gate_break)/.test(n) ? 'gb' : n.replace(/_\d+$/, ''); arcs[a] = (arcs[a] || 0) + 1; }
    id = ch.next; st++;
  }
  maxSteps = Math.max(maxSteps, st);
  const r = R(sc);
  cls[r.cls] = (cls[r.cls] || 0) + 1; el[r.element] = (el[r.element] || 0) + 1;
  if (sc.fate) { fateN++; if (r.cls === sc.fate) fateHit++; }
}
const regular = CLASSES.filter((c) => c.r < 3).length;
console.log(`연결 오류 ${bad} · 최대 선택 수 ${maxSteps} · 직업 ${Object.keys(cls).length}/${regular} · 남은 치환 ${leftover}`);
console.log('속성', JSON.stringify(el));
console.log(`운명 일치 ${(fateHit / Math.max(1, fateN) * 100).toFixed(1)}% (${fateHit}/${fateN})`);
console.log('갈래 진입', JSON.stringify(arcs));
console.log('도입 회수 문장', Object.keys(H).length, '/ 50');
