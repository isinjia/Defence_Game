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
    if (id === 'bloom_1' && (state.flags || {}).idle_8_go) return 'karaoke';
    return sceneImages[id] || shot.place;
  };
  const art = (id, state, step = 0) => {
    const image = imageFor(id, state); if (!image) return '';
    const title = PROLOGUE[id] ? PROLOGUE[id].title : '';
    return `<img class="ec-art pc-art pc-shot-${step}" src="assets/prologue/${image}.webp" width="1536" height="1024" alt="${escapeAttribute(title)} 장면" decoding="async" fetchpriority="high" draggable="false">`;
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
