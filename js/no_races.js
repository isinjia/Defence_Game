// ===== 이종족 없음 (사용자 요청): 오크·엘프·드워프·수인·용인이 나오지 않는다 =====
// - 새 NPC는 모두 인간. 옛 저장의 이종족 NPC는 불러올 때 인간으로 바꾸고 한국 이름을 준다.
// - 이종족 이야기 사건(공사장 오크·엘프 난민촌·드워프 공방)은 나오지 않는다.
// 괴수 '오크 약탈자' 등은 종족이 아니라 게이트 괴수라 그대로 둔다.
for (const k of Object.keys(RACES)) if (k !== 'human') RACES[k].w = 0;
if (typeof STORY !== 'undefined') for (let i = STORY.length - 1; i >= 0; i--) if (STORY[i] && /^race_/.test(STORY[i].id || '')) STORY.splice(i, 1);
{
  const GP = Game.prototype;
  const baseMake = GP.makeNpc;
  GP.makeNpc = function (child, race, ...rest) { return baseMake.call(this, child, 'human', ...rest); };
  const humanize = (g) => {
    const used = new Set((g.npcs || []).map((n) => n.name));
    for (const n of g.npcs || []) {
      if (!n.race || n.race === 'human') continue;
      n.race = 'human';
      for (let t = 0; t < 20; t++) { const nm = RNG.pick(SURNAMES) + RNG.pick(n.gender === 'F' ? GIVEN_F : GIVEN_M); if (!used.has(nm) || t === 19) { n.name = nm; used.add(nm); break; } }
    }
  };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) { const r = baseInit.apply(this, a); try { humanize(this); } catch (e) { /* 무시 */ } return r; };
}
