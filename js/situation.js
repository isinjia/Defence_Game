// ===== 게이트 크로니클: 사건이 일어나는 상황 =====
// 지금 플레이어가 어디서 무엇을 하다 왔는지에 따라 터질 수 있는 사건을 거른다.
// 상황: 'gate' 게이트·토벌을 막 끝내고 나온 직후, 'city' 도시 안, 'field' 도시 밖 길이나 들판.
// 사건에 at 이 없으면 어디서나 (전화, 문자, 택배, 소식처럼 장소와 무관한 사건).

const STORY_AT = {
  // 도시 안에서만
  base_black_market: ['city'], base_duel_challenge: ['city'], base_reporter: ['city'], odd_time_loop: ['city'],
  odd_memory: ['city'], rel_secret: ['city'], age_mortality: ['city'], rel_anniversary: ['city'],
  // 도시 밖에서만
  base_injured_hunter: ['field'], base_ruins: ['field'], base_gate_surge: ['field', 'gate'],
  // 도시든 길이든 (게이트 직후는 아님)
  base_kid_lost: ['city', 'field'], base_mentor: ['city', 'field'], rel_master_lesson: ['city', 'field'],
  society_documentary: ['city', 'field'], age_birthday: ['city', 'field'],
  // 게이트 직후에만
  gate_survivor: ['gate'], gate_double: ['gate'], gate_loot_fight: ['gate'], gate_red: ['gate', 'field'],
  // 잠들거나 밤을 보내야 하는 사건, 집으로 오는 우편
  odd_shadow: ['city', 'field'], voice_0: ['city', 'field'], fam_0: ['city'],
  // 다친 몸을 보는 사건
  rel_partner_worry: ['gate', 'city'],
};
for (const ev of STORY) if (STORY_AT[ev.id] && !ev.at) ev.at = STORY_AT[ev.id];
// 게이트를 막 나온 직후에 올 수 있는 연락·소식 (그 밖의 사건은 게이트 직후에 일어나지 않는다)
const STORY_GATE_OK = new Set(['rank_c_scout', 'rank_b_variety', 'rank_a_nation', 'rank_s_offer', 'rel_rival_challenge', 'media_viral', 'media_tax', 'class_advance_retry', 'sub_0']);
// 다친 데가 없으면 '붕대 감은 팔' 사건은 일어나지 않는다
{ const ev = STORY.find((e) => e.id === 'rel_partner_worry'); if (ev) { const w = ev.when; ev.when = (g, c) => (g.player.injured > 0 || g.situation() === 'gate') && (!w || w(g, c)); } }

{
  const GP = Game.prototype;
  GP.situation = function () { return this.afterGate ? 'gate' : this.onCity() ? 'city' : 'field'; };
  const baseEligible = GP.storyEligible;
  GP.storyEligible = function (ev, c) {
    if (ev.at && !ev.at.includes(this.situation())) return false;
    // 게이트 직후에는 게이트 사건과 연락·소식만
    if (this.afterGate && !(ev.at && ev.at.includes('gate')) && !STORY_GATE_OK.has(ev.id)) return false;
    return baseEligible.call(this, ev, c);
  };
  // 게이트·토벌을 마친 직후 표시. 다음 행동(이동, 수련, 휴식, 도시)에서 풀린다
  const mark = (name) => { const base = GP[name]; GP[name] = function (...a) { this.afterGate = true; try { return base.apply(this, a); } finally { this.afterGate = false; this.lastGateExit = this.monthKey(); } }; };
  mark('finishGate'); mark('finishMob');
  // odd_memory 처럼 어디론가 끌려가는 사건은 게이트 직후 한 달 안에는 일어나지 않는다
  const ev = STORY.find((e) => e.id === 'odd_memory');
  if (ev) { const w = ev.when; ev.when = (g, c) => (g.lastGateExit == null || g.monthKey() - g.lastGateExit >= 1) && (!w || w(g, c)); }
}
