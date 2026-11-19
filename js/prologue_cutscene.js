// 분기별 장소·사물·사건에 맞춘 완성 삽화를 본문·선택지와 함께 표시한다.
// 그림 선택은 선택 점수·표시할 선택지·난수·친구 관계를 변경하지 않는다.
const PrologueCinema = (() => {
  const shots = {};
  const put = (id, place, object, mood = 'quiet') => { shots[id] = { place, object, mood }; };
  const group = (prefix, entries) => entries.forEach(([place, object, mood], i) => put(`${prefix}_${i + 1}`, place, object, mood));
  group('chaebol', [
    ['penthouse', 'wine'], ['airport', 'suitcase'], ['auction', 'core', 'mystery'], ['yacht', 'wine'], ['office', 'papers', 'tense'],
    ['hospital', 'toy'], ['training', 'sword'], ['restaurant', 'teacup'], ['penthouse', 'notice', 'lonely'], ['hospital', 'amulet', 'lonely'],
  ]);
  group('orphan', [
    ['courtyard', 'lunchbox'], ['street', 'motorbike', 'rain'], ['workshop', 'shield'], ['bedroom', 'suitcase', 'lonely'], ['market', 'bell', 'mystery'],
    ['hospital', 'phone', 'lonely'], ['training', 'tiles'], ['hospital', 'bill', 'tense'], ['alley', 'camera', 'tense'], ['memorial', 'portrait', 'lonely'],
  ]);
  group('soldier', [
    ['checkpoint', 'dogtag', 'lonely'], ['sea', 'eye', 'mystery'], ['sky', 'parachute', 'tense'], ['hospital', 'medical'], ['subway', 'gun', 'tense'],
    ['courtyard', 'parcel'], ['mountain', 'helicopter'], ['kitchen', 'wok'], ['mountain', 'scope'], ['checkpoint', 'gate', 'tense'],
  ]);
  group('subject', [
    ['laboratory', 'capsule', 'mystery'], ['laboratory', 'keycard', 'danger'], ['bedroom', 'bread', 'lonely'], ['hospital', 'medical'], ['bedroom', 'window'],
    ['restaurant', 'notebook', 'tense'], ['festival', 'gate', 'mystery'], ['bedroom', 'diary', 'mystery'], ['laboratory', 'scanner', 'mystery'], ['auditorium', 'microphone', 'tense'],
  ]);
  group('student', [
    ['store', 'phone'], ['stadium', 'stopwatch'], ['studio', 'canvas'], ['laboratory', 'generator', 'mystery'], ['subway', 'bill', 'lonely'],
    ['cafe', 'teacup'], ['hospital', 'medical'], ['apartment', 'window', 'mystery'], ['festival', 'guitar'], ['training', 'weights'],
  ]);
  group('idle', [
    ['bedroom', 'phone'], ['store', 'riceball'], ['study', 'book'], ['bedroom', 'letter', 'lonely'], ['bedroom', 'keyboard'], ['kitchen', 'wok'],
    ['bedroom', 'weights'], ['restaurant', 'wine'], ['church', 'bowl'], ['temple', 'incense'], ['memorial', 'portrait', 'lonely'],
    ['hospital', 'camera', 'mystery'], ['garden', 'herbs'], ['mountain', 'tree'],
  ]);
  put('gate_break', 'street', 'gate', 'danger');
  ['subway', 'school', 'market', 'hospital', 'festival', 'apartment'].forEach((place) => put(`gb_${place}`, place, 'gate', 'danger'));
  put('gear', 'street', 'shield', 'danger'); put('voice', 'dream', 'eye', 'mystery'); put('awaken', 'street', 'hands', 'awakening');
  put('first_fight', 'street', 'monster', 'danger'); put('night_dream', 'dream', 'horizon', 'mystery'); put('rooftop', 'rooftop', 'hands', 'awakening');
  put('verdict', 'laboratory', 'measurement'); put('verdict_guild', 'office', 'papers'); put('verdict_street', 'street', 'ticket', 'tense');
  group('ill', [['hospital', 'thermometer', 'tense'], ['hospital', 'bed', 'lonely'], ['hospital', 'hands', 'awakening'], ['hospital', 'bed', 'awakening'], ['hospital', 'flowers']]);
  group('relic', [['market', 'bead', 'mystery'], ['bedroom', 'bead', 'mystery'], ['bedroom', 'hands', 'awakening'], ['apartment', 'door', 'tense'], ['dream', 'bead', 'mystery']]);
  group('dream', [['dream', 'horizon', 'mystery'], ['bedroom', 'incense', 'mystery'], ['shrine', 'bell', 'awakening'], ['shrine', 'teacup'], ['river', 'letter', 'lonely']]);
  put('dseer_2', 'street', 'clock', 'mystery'); put('dseer_3', 'street', 'phone', 'awakening');
  put('dsleep_2', 'hospital', 'bed', 'mystery'); put('dsleep_3', 'dream', 'horizon', 'awakening');
  group('storm', [['street', 'umbrella', 'rain'], ['street', 'lamp', 'rain'], ['rooftop', 'lightning', 'awakening'], ['street', 'bridge', 'danger'], ['river', 'newspaper']]);
  group('crime', [['bank', 'ticket'], ['bank', 'shutter', 'tense'], ['bank', 'vault', 'awakening'], ['bank', 'gun', 'danger'], ['street', 'newspaper']]);
  group('drug', [['bedroom', 'pills', 'mystery'], ['club', 'pills', 'tense'], ['club', 'hands', 'awakening'], ['club', 'door', 'danger'], ['hospital', 'medical', 'lonely']]);
  group('duel', [['alley', 'bill', 'tense'], ['alley', 'fence', 'tense'], ['alley', 'hands', 'awakening'], ['alley', 'crowd', 'danger'], ['street', 'phone']]);
  group('wild', [['mountain', 'backpack'], ['forest', 'campfire', 'mystery'], ['forest', 'tree', 'awakening'], ['mountain', 'path'], ['street', 'newspaper']]);
  group('tour', [['gatehall', 'ticket'], ['forest', 'gate', 'tense'], ['forest', 'stag', 'awakening'], ['forest', 'stag', 'danger'], ['forest', 'helicopter']]);
  group('friend', [['bedroom', 'phone'], ['apartment', 'tape', 'tense'], ['bedroom', 'hands', 'awakening'], ['apartment', 'gun', 'danger'], ['office', 'papers']]);
  group('late', [['hospital', 'ticket'], ['office', 'papers'], ['laboratory', 'capsule', 'awakening'], ['training', 'weights', 'danger'], ['office', 'papers']]);
  group('nest', [['street', 'backpack'], ['cave', 'wings', 'danger'], ['cave', 'wings', 'awakening'], ['cave', 'monster', 'danger'], ['street', 'helicopter']]);
  [['nap', 'bedroom', 'window'], ['cvs', 'store', 'measurement'], ['game', 'bedroom', 'keyboard'], ['bloom', 'street', 'lamp'], ['quest', 'garden', 'checklist']].forEach(([id, place, object]) => {
    put(`${id}_1`, place, object, 'awakening'); put(`${id}_odd`, place, 'hands', 'mystery'); put(`${id}_2`, id === 'cvs' ? 'store' : 'office', 'papers');
  });
  Object.entries({
    net: ['bedroom', 'monitor'], shop: ['workshop', 'sword'], dinner: ['restaurant', 'bowl'], line: ['street', 'tape', 'tense'],
    bath: ['bathhouse', 'towel'], pcbang: ['pcbang', 'keyboard'], checkup: ['hospital', 'medical'], rooftop: ['mountain', 'hands', 'awakening'],
    lastshift: ['kitchen', 'apron'], karaoke: ['club', 'microphone'], fortune: ['shrine', 'bell', 'mystery'], subway: ['subway', 'lamp', 'mystery'],
    loan: ['bank', 'papers'], cat: ['alley', 'cat'], teacher: ['bedroom', 'phone'], run: ['river', 'shoes'], secondhand: ['subway', 'console'], memorial: ['memorial', 'flowers', 'lonely'],
  }).forEach(([id, [place, object, mood]]) => put(`eve_${id}`, place, object, mood));

  // 출신·장소별 완성 삽화. 사람 대신 빈 공간과 핵심 사물로 사건을 표현한다.
  // 장소가 바뀌는 게이트 브레이크는 config의 분기 장소를 그대로 따른다.
  shots.life_odd = { place: 'bedroom', object: 'window', mood: 'mystery' };
  const sceneImages = {
    gate_break: 'gate-break', voice: 'dream', night_dream: 'dream',
    relic_2: 'relic', relic_3: 'relic', relic_5: 'dream',
    dream_2: 'shrine', dream_4: 'bedroom', dream_5: 'dream',
    storm_1: 'cafe', storm_3: 'rooftop', storm_4: 'bridge',
    dseer_2: 'bridge', dseer_3: 'bridge',
    wild_2: 'tiger', wild_3: 'tiger', wild_5: 'mountain',
    tour_3: 'stag', tour_4: 'stag',
    friend_3: 'friend-surge', friend_4: 'friend-surge',
    idle_5: 'pcbang', game_1: 'pcbang', game_odd: 'pcbang', game_2: 'pcbang',
    eve_net: 'pcbang', eve_line: 'gate-break', eve_loan: 'office',
    eve_cat: 'cat-alley', student_8: 'cat-alley', eve_karaoke: 'karaoke',
    eve_memorial: 'monument', idle_12: 'abandoned-hospital',
    nest_1: 'rest-stop', nest_5: 'rest-stop',
    nap_2: 'bedroom', student_10: 'laboratory',
  };
  // 2026-11-19 사용자 승인: 장소별 공용 그림을 장면별 제작본으로 연결한다.
  Object.assign(sceneImages, {
    "ill_1": "scene-ill_1",
    "ill_2": "scene-ill_2",
    "ill_3": "scene-ill_3",
    "ill_4": "scene-ill_4",
    "ill_5": "scene-ill_5",
    "subject_1": "scene-subject_1",
    "subject_2": "scene-subject_2",
    "subject_3": "scene-subject_3",
    "subject_8": "scene-subject_8",
    "student_10": "scene-student_10",
    "idle_1": "scene-idle_1",
    "idle_4": "scene-idle_4",
    "nap_1": "scene-nap_1",
    "game_1": "scene-game_1",
    "game_odd": "scene-game_odd",
    "crime_1": "scene-crime_1",
    "crime_2": "scene-crime_2",
    "crime_3": "scene-crime_3",
    "crime_4": "scene-crime_4",
    "dream_4": "scene-dream_4",
    "chaebol_6": "scene-chaebol_6",
    "chaebol_10": "scene-chaebol_10",
    "orphan_6": "scene-orphan_6",
    "orphan_8": "scene-orphan_8",
    "soldier_4": "scene-soldier_4",
    "subject_4": "scene-subject_4",
    "student_7": "scene-student_7",
    "dsleep_2": "scene-dsleep_2",
    "drug_5": "scene-drug_5",
    "late_1": "scene-late_1",
    "eve_checkup": "scene-eve_checkup",
    "subject_5": "scene-subject_5",
    "drug_1": "scene-drug_1",
    "friend_1": "scene-friend_1",
    "idle_7": "scene-idle_7",
    "nap_2": "scene-nap_2",
    "nap_odd": "scene-nap_odd",
    "eve_teacher": "scene-eve_teacher",
    "late_2": "scene-late_2",
    "late_5": "scene-late_5",
    "chaebol_5": "scene-chaebol_5",
    "friend_5": "scene-friend_5",
    "bloom_2": "scene-bloom_2",
    "quest_2": "scene-quest_2",
    "eve_loan": "scene-eve_loan",
    "subject_9": "scene-subject_9",
    "student_4": "scene-student_4",
    "orphan_2": "scene-orphan_2",
    "storm_2": "scene-storm_2",
    "soldier_9": "scene-soldier_9",
    "wild_1": "scene-wild_1",
    "wild_4": "scene-wild_4",
    "wild_5": "scene-wild_5",
    "idle_14": "scene-idle_14",
    "eve_rooftop": "scene-eve_rooftop",
    "late_3": "scene-late_3",
    "idle_2": "scene-idle_2",
    "cvs_1": "scene-cvs_1",
    "cvs_2": "scene-cvs_2",
    "student_9": "scene-student_9",
    "friend_2": "scene-friend_2",
    "dsleep_3": "scene-dsleep_3",
    "dream_1": "scene-dream_1",
    "chaebol_9": "scene-chaebol_9",
    "soldier_6": "scene-soldier_6",
    "soldier_10": "scene-soldier_10",
    "student_5": "scene-student_5",
    "relic_1": "scene-relic_1",
    "idle_6": "scene-idle_6",
    "eve_dinner": "scene-eve_dinner",
    "eve_shop": "scene-eve_shop",
    "eve_line": "scene-eve_line",
    "orphan_7": "scene-orphan_7",
    "late_4": "scene-late_4",
    "idle_8": "scene-idle_8",
    "dream_3": "scene-dream_3",
    "eve_fortune": "scene-eve_fortune",
    "dseer_2": "scene-dseer_2",
    "subject_6": "scene-subject_6",
    "wild_3": "scene-wild_3",
    "tour_4": "scene-tour_4",
    "tour_5": "scene-tour_5",
    "nest_3": "scene-nest_3",
    "nest_4": "scene-nest_4",
    "nest_5": "scene-nest_5",
    "eve_subway": "scene-eve_subway",
    "eve_cat": "scene-eve_cat",
    "duel_1": "scene-duel_1",
    "idle_11": "scene-idle_11",
    "idle_13": "scene-idle_13",
    "eve_lastshift": "scene-eve_lastshift",
    "eve_run": "scene-eve_run",
    "eve_secondhand": "scene-eve_secondhand",
    "storm_1": "scene-storm_1",
    "eve_pcbang": "scene-eve_pcbang",
    "night_dream": "scene-night_dream",
    "dream_5": "scene-dream_5",
    "relic_3": "scene-relic_3",
    "storm_3": "scene-storm_3",
    "crime_5": "scene-crime_5",
    "friend_4": "scene-friend_4",
    "eve_net": "scene-eve_net",
    "game_2": "scene-game_2",
    "duel_2": "scene-duel_2",
    "duel_5": "scene-duel_5",
    "drug_3": "scene-drug_3",
    "drug_4": "scene-drug_4",
    "bloom_1": "scene-bloom_1",
    "cvs_odd": "scene-cvs_odd",
    "bloom_odd": "scene-bloom_odd",
    "quest_odd": "scene-quest_odd",
    "relic_5": "scene-relic_5",
    "duel_3": "scene-duel_3",
    "duel_4": "scene-duel_4",
    "dseer_3": "scene-dseer_3"
});
  const escapeAttribute = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const config = (id, state) => {
    let shot = shots[id];
    if (/^vg2?_/.test(id)) shot = { place: /cheongryong/.test(id) ? 'laboratory' : 'office', object: 'papers', mood: 'quiet' };
    if (!shot) return null;
    shot = { ...shot };
    if (['gear', 'awaken', 'first_fight'].includes(id)) {
      for (const place of ['subway', 'school', 'market', 'hospital', 'festival', 'apartment']) if ((state.flags || {})[`gb_${place}`]) { shot.place = place; break; }
    }
    if (id === 'bloom_1' && (state.flags || {}).idle_8_go) { shot.place = 'club'; shot.object = 'microphone'; }
    return shot;
  };
  const imageFor = (id, state) => {
    const shot = config(id, state); if (!shot) return null;
    if (/^gb_/.test(id)) return `gate-${shot.place}`;
    if (['gear', 'awaken', 'first_fight'].includes(id) && shot.place !== 'street') return `gate-${shot.place}`;
    if (id === 'gear' && shot.place === 'street') return 'fallen-gear';
    if (id === 'awaken' && shot.place === 'street') return 'awakening';
    if (id === 'first_fight' && shot.place === 'street') return 'first-fight';
    if (id === 'bloom_1' && (state.flags || {}).idle_8_go) return 'scene-bloom_1__karaoke';
    return sceneImages[id] || shot.place;
  };
  const art = (id, state, step = 0) => {
    const image = imageFor(id, state); if (!image) return '';
    const title = PROLOGUE[id] ? PROLOGUE[id].title : '';
    return `<img class="ec-art pc-art pc-shot-${step}" src="assets/prologue/${image}.webp${image === 'scene-duel_4' ? '?v=pipe-1' : ''}" width="1536" height="1024" alt="${escapeAttribute(title)} 장면" decoding="async" fetchpriority="high" draggable="false">`;
  };
  // 그림은 본문·선택지와 함께 한 화면에 정지 이미지로만 보인다 (사용자 요청: 화면을 가리고 눌러 넘기는 컷씬식 연출은 없앰)
  const mount = (state) => {
    if (!config(state.id, state)) return;
    const box = document.getElementById('pro-scene'); if (!box) return;
    box.querySelectorAll('.pro-cinema').forEach((el) => el.remove());
    const preview = document.createElement('div'); preview.className = 'pro-cinema';
    preview.innerHTML = art(state.id, state);
    box.insertBefore(preview, box.querySelector('.pro-text'));
  };
  return { shots, config, imageFor, art, mount };
})();

{
  const basePrologue = UI.renderPrologue;
  UI.renderPrologue = function (...args) {
    const r = basePrologue.apply(this, args);
    if (this.pro && this.screen === 'prologue') PrologueCinema.mount(this.pro);
    return r;
  };
}
