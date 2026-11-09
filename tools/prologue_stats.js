// 프롤로그 통계: 갈래 비율, 직업 계열 × 속성 표, 무작위 플레이 속성 분포
// 기준(docs/프롤로그_점검.md): 갈래 최대 비율 ≤ 10%, 계열별로 한 속성이 50%를 넘지 않음.
// 속성 규칙: 각성 장면(모든 선택지가 속성 3점 이상)의 선택만 속성 점수, 나머지 선택의 속성은 성향(표시용)만.
// 사용법: node tools/prologue_stats.js [횟수]   (기준을 못 넘으면 종료 코드 1)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const files = ['js/data.js', 'js/game.js', 'js/data_classes.js', 'js/class_elem.js', 'js/prologue.js', 'js/pro_arcs_a.js', 'js/pro_arcs_b.js', 'js/pro_arcs_c.js', 'js/pro_hooks.js', 'js/pro_life.js'];
const src = files.filter((f) => fs.existsSync(path.join(root, f))).map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const { CE, P, PS, R, remember, CLASSES, pickBg } = new Function(`${src}; return { CE: typeof classElem === 'function' ? classElem : null, P: PROLOGUE, PS: PROLOGUE_START, R: resolvePrologue, remember: proRemember, CLASSES, pickBg: typeof proPickBg === 'function' ? proPickBg : null };`)();
const LIFE = ['nap', 'cvs', 'game', 'bloom', 'quest', 'late'];
const N = +process.argv[2] || 20000;
const isAwaken = (id) => P[id].choices.length && P[id].choices.every((c) => c.e && Math.max(...Object.values(c.e)) >= 3);
const arcOf = (n) => (/^(gb_|gate_break)/.test(n) ? n : n.replace(/_\d+$/, ''));
const arcs = {}, grpEl = {}, el = {}, ce = {};
for (let i = 0; i < N; i++) {
  const bg = pickBg ? pickBg() : Object.keys(PS)[i % 5];
  const sc = { e: {}, g: {}, c: {}, t: {}, talent: 0, luck: 0, lean: {} }; const flags = {};
  let id = PS[bg][Math.floor(Math.random() * PS[bg].length)], st = 0;
  while (id) {
    const scene = P[id]; const aw = isAwaken(id);
    // 화면과 같게: 선택지가 많으면 3개만 보인다 (각성 장면은 전부)
    let idx = scene.choices.map((_, k) => k); if (!aw && idx.length > 3) idx = idx.sort(() => Math.random() - 0.5).slice(0, 3);
    const ch = scene.choices[idx[Math.floor(Math.random() * idx.length)]];
    remember(sc, flags, id, ch);
    for (const k of ['g', 'c', 't']) for (const [x, v] of Object.entries(ch[k] || {})) sc[k][x] = (sc[k][x] || 0) + v;
    for (const [x, v] of Object.entries(ch.e || {})) (aw ? sc.e : sc.lean)[x] = ((aw ? sc.e : sc.lean)[x] || 0) + v;
    sc.talent += ch.talent || 0; sc.luck += ch.luck || 0;
    if (st === 0 && ch.next) { const a = arcOf(ch.next); arcs[a] = (arcs[a] || 0) + 1; }
    id = ch.next;
    if (id === 'dream_2' && flags.dream_seer) id = 'dseer_2';
    if (id === 'dream_2' && flags.dream_sleep) id = 'dsleep_2';
    st++;
  }
  const r = R(sc); const g = CLASSES.find((c) => c.id === r.cls).g;
  el[r.element] = (el[r.element] || 0) + 1;
  if (CE) { const k = CE(r.cls, r.element) || '없음'; ce[k] = (ce[k] || 0) + 1; if (process.env.CLS) (ce['@' + k + ':' + r.cls] = (ce['@' + k + ':' + r.cls] || 0) + 1); }
  (grpEl[g] ||= {})[r.element] = (grpEl[g][r.element] || 0) + 1;
}
const pct = (a, b) => Math.round((a / b) * 1000) / 10;
let fail = 0;
console.log(`무작위 플레이 ${N}회`);
const arcRows = Object.entries(arcs).sort((a, b) => b[1] - a[1]);
console.log('갈래 비율:', arcRows.map(([k, v]) => `${k} ${pct(v, N)}%`).join(' · '));
if (pct(arcRows[0][1], N) > 10) { fail++; console.log(`  ✗ 가장 많은 갈래 ${arcRows[0][0]} ${pct(arcRows[0][1], N)}% > 10%`); }
const life = Object.entries(arcs).filter(([k]) => LIFE.includes(k)).reduce((a, [, v]) => a + v, 0);
console.log(`생활형 각성 비율 ${pct(life, N)}% (목표 30~40%)`);
if (pct(life, N) < 30 || pct(life, N) > 40) { fail++; console.log('  ✗ 생활형 비율이 목표 밖'); }
console.log('속성:', Object.entries(el).map(([k, v]) => `${k} ${pct(v, N)}%`).join(' · '));
if (CE) {
  console.log('직업 친화 속성(4-10):', Object.entries(ce).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, N)}%`).join(' · '));
  for (const k of ['holy', 'dark']) if (pct(ce[k] || 0, N) < 10 || pct(ce[k] || 0, N) > 15) console.log(`  ! ${k} 친화 직업 ${pct(ce[k] || 0, N)}% (목표 10~15%)`);
}
console.log('계열 × 속성:');
for (const [g, m] of Object.entries(grpEl)) {
  const tot = Object.values(m).reduce((a, b) => a + b, 0); const top = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
  const bad = pct(top[1], tot) > 50; if (bad) fail++;
  console.log(`  ${bad ? '✗' : '·'} ${g.padEnd(8)} n=${tot} ${Object.entries(m).map(([k, v]) => `${k} ${pct(v, tot)}%`).join(' ')}`);
}
console.log(fail ? `기준 미달 ${fail}건` : '기준 통과');
process.exit(fail ? 1 : 0);
