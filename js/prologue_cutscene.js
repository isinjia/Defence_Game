// 각 장면의 배경·핵심 사물·조명을 명시한다. 서술은 실제 분기 문장에서 가져온다.
// 컷씬을 감상해도 선택 점수·표시할 선택지·난수·친구 관계를 변경하지 않는다.
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

  const moods = { quiet: '#b7cab9', lonely: '#9bb6c9', tense: '#d7ae87', rain: '#8dbaca', mystery: '#b2a2e4', danger: '#ef8d7d', awakening: '#b2e6d9' };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const person = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="3" rx="19" ry="5" fill="#02071188"/><path d="m-12-43-3 43h10l5-29 5 29h10l-3-43Z" fill="#121e2c"/><path d="M-13-75q13-9 26 0l7 35h-40Z" fill="#283c4c" stroke="#6c849466"/><path d="m-14-70-10 32 6 2 11-28M14-70l10 32-6 2-11-28" fill="#1b2c3c"/><circle cy="-91" r="11" fill="#101b2b" stroke="#7d92a266"/></g>`;
  const skyline = (seed, lit = true) => Array.from({ length: 16 }, (_, i) => {
    const h = 32 + ((i * 37 + seed) % 72), x = i * 43 - 10;
    return `${rect(x, 227 - h, 32, h, '#172d40')}${rect(x + 3, 229 - h, 29, 1, '#607f8e44')}${lit ? Array.from({ length: 8 }, (_, k) => rect(x + 5 + k % 3 * 8, 235 - h + Math.floor(k / 3) * 11, 3, 4, k % 3 ? '#b8cca14a' : '#e4bc7c66')).join('') : ''}`;
  });
  const background = (place, seed) => {
    const outside = ['street', 'alley', 'apartment', 'courtyard', 'stadium', 'festival', 'rooftop', 'checkpoint', 'airport', 'river', 'yacht', 'sea', 'sky', 'forest', 'mountain', 'garden', 'dream', 'cave', 'gatehall', 'market', 'school', 'memorial'];
    if (['forest', 'mountain', 'garden', 'dream', 'cave'].includes(place)) {
      const rock = '<path d="M0 247 103 112 179 176 285 71 376 169 491 91 640 220v140H0Z" fill="#263c4a"/><path d="m103 112 43 92-43-31-52 59ZM285 71l72 139-72-54-62 57ZM491 91l65 126-65-47-52 48Z" fill="#365361"/>';
      const trees = Array.from({ length: 12 }, (_, i) => { const x = i * 61 - 15, h = 65 + (i * 37 + seed) % 68; return `<path d="M${x} 280v-${h}" stroke="#142b32" stroke-width="9"/><path d="m${x - 33} 238 33-${h} 33 ${h}Z" fill="${i % 2 ? '#1c3b3d' : '#254c46'}"/>`; }).join('');
      if (place === 'cave') return `<path d="M0 0h640v125l-69-36-56 45-37-68-89 27-52-42-79 23-48-21-71 63L0 90Z" fill="#111e2a"/><path d="m0 360 31-188 44-54 29 71-12 171M640 360l-23-184-51-47-24 88 16 143" fill="#1b2d38"/><path d="M130 265q202-119 386 0v95H130Z" fill="#132b32"/>`;
      if (place === 'dream') return `<ellipse class="pc-aura" cx="343" cy="127" rx="83" ry="87" fill="#b4a4df0c" stroke="#b6a4dc55"/><path d="M0 247q162-31 328-1t312-17v131H0Z" fill="#203248"/><path d="M0 258q153-18 325 3t315-15" fill="none" stroke="#a7a2c644"/><path d="M330 250 343 126 356 250Z" fill="#1b1c35"/>`;
      return rock + (place === 'mountain' ? '' : trees) + '<path d="M0 285q154-55 307-8t333-20v103H0Z" fill="#1c353b"/><path d="m244 360 70-101 27-1 25 102" fill="#58655d44"/>';
    }
    if (outside.includes(place)) {
      if (place === 'sea') return '<path d="M0 0h640v360H0Z" fill="#102d40"/><path d="m96 0 121 310-49 31L54 0m359 0-39 315 53 16L462 0" fill="#7dafb914"/><path d="M0 302q155-39 315-7t325-15v80H0Z" fill="#183740"/><g fill="none" stroke="#8eb7c255"><circle cx="216" cy="97" r="5"/><circle cx="227" cy="131" r="3"/><circle cx="439" cy="147" r="6"/><circle cx="429" cy="189" r="3"/></g>';
      let art = `<g class="pc-far">${skyline(seed).join('')}</g><path d="M0 237h640v123H0Z" fill="#172735"/><path d="m0 315 640-6M0 286l640-4M206 360l99-123M478 360 365 237" stroke="#73878b22" stroke-width="2"/>`;
      if (['river', 'yacht', 'sea'].includes(place)) art = `${skyline(seed).join('')}<path d="M0 234h640v126H0Z" fill="#173749"/><path d="M24 268h91m42 26h173m87-27h129M70 334h153m120 9h213" stroke="#b3cfbd33"/><path d="M0 229h640" stroke="#afc3b477"/>`;
      if (place === 'sky') return '<path d="M0 218q133-53 278-12t362-12v166H0Z" fill="#5e7f8a55"/><path d="M0 264q161-50 321-7t319-13v116H0Z" fill="#a0b4b333"/>';
      if (place === 'rooftop') art += '<path d="M0 264h640v31H0Z" fill="#354b59"/><path d="M0 266h640" stroke="#7f99a1" stroke-width="3"/>';
      if (['apartment', 'courtyard', 'school'].includes(place)) art += rect(16, 64, 113, 202, '#263d50') + rect(514, 34, 126, 232, '#20374b') + Array.from({ length: 12 }, (_, i) => rect(30 + i % 3 * 29, 82 + Math.floor(i / 3) * 44, 15, 22, i % 4 ? '#162c3c' : '#b9c29177')).join('');
      if (place === 'festival') art += '<path d="m69 84 510 15M69 84v187M579 99v180" fill="none" stroke="#596b79" stroke-width="8"/>' + Array.from({ length: 9 }, (_, i) => rect(96 + i * 53, 95 + i * 1.5, 10, 8, ['#9fdac9', '#d5aa81', '#b6a3db'][i % 3])).join('');
      if (place === 'checkpoint') art += '<path d="M67 258V98m504 160V98M67 115h504M67 150h504M67 186h504M67 221h504" stroke="#637e8855" stroke-width="3"/><path d="M76 94h484v24H76Z" fill="#728077"/>';
      if (place === 'market') art += '<path d="m42 204 55-104h127l37 104m135 0 36-104h123l46 104" fill="#806a63" stroke="#b3ac8866"/><path d="M58 205v77m181-77v77m178-77v77m161-77v77" stroke="#6b8388" stroke-width="6"/>';
      if (place === 'airport') art += '<path d="M0 138h640v103H0Z" fill="#253e50"/><path d="M0 156h640M0 210h640M106 138v103m107-103v103m107-103v103m107-103v103m107-103v103" stroke="#758f9a66" stroke-width="3"/>';
      if (place === 'stadium') art += '<path d="M0 299q325-94 640 0M0 319q325-92 640 0M0 342q325-95 640 0" fill="none" stroke="#c0b59355" stroke-width="3"/>';
      if (place === 'memorial') art += '<path d="M232 277V78h190v199Z" fill="#121d28" stroke="#596a74"/><path d="M260 102h134M260 121h134M260 140h134M260 159h134M260 178h134M260 197h134" stroke="#99a7a077" stroke-width="2" stroke-dasharray="2 5"/>';
      return art;
    }
    const clinical = ['hospital', 'laboratory', 'training', 'gatehall'].includes(place);
    let art = `<path d="M0 0h640v249H0Z" fill="${clinical ? '#2c4351' : '#263847'}"/><path d="m0 0 95 49v200L0 310m640-310-91 49v200l91 61" fill="#172a3c"/><path d="M95 249h454M95 49h454" stroke="#809aa54d" stroke-width="2"/>`;
    art += clinical ? rect(119, 71, 166, 107, '#1b3547', 'stroke="#819fa8"') + rect(133, 85, 138, 77, '#83c1c125') : rect(117, 70, 177, 122, '#132c40', 'stroke="#5c7888"') + '<path d="M204 71v121M118 131h175" stroke="#698694" stroke-width="4"/>';
    art += '<path d="M0 310 95 249h454l91 61v50H0Z" fill="#1a2a3a"/><path d="M61 329h518M203 360l60-111M448 360l-68-111" stroke="#76878d22"/>';
    if (['bedroom', 'hospital'].includes(place)) art += '<path d="M343 241v-53h146v53l-11 22H329Z" fill="#566d79"/><path d="m329 241 14-29h146v29Z" fill="#a4b5ad"/><path d="M344 209v-40h10v40m127 0v-40h9v40" stroke="#7e98a3" stroke-width="4"/>';
    if (['store', 'workshop', 'study', 'studio'].includes(place)) art += Array.from({ length: 4 }, (_, i) => `<path d="M355 ${88 + i * 38}h156v5H355Z" fill="#678184"/>${Array.from({ length: 7 }, (_, j) => rect(364 + j * 20, 69 + i * 38, 12, 19, ['#607f70', '#b1a17d', '#5c7792'][j % 3])).join('')}`).join('');
    if (['cafe', 'restaurant', 'penthouse', 'office', 'kitchen'].includes(place)) art += '<path d="m159 237 52-22h261l39 22v16H159Z" fill="#5f6d6c"/><path d="M185 253v32m296-32v32" stroke="#344e5b" stroke-width="9"/>';
    if (place === 'subway') art = '<path d="M0 0h640v360H0Z" fill="#1d3344"/><path d="M0 62h640v181H0Z" fill="#38515c"/>' + [34, 223, 414].map((x) => rect(x, 92, 158, 104, '#0d2237', 'rx="16" stroke="#718c95" stroke-width="4"')).join('') + '<path d="M0 265h640v30H0Z" fill="#607279"/><path d="M0 306h640" stroke="#afbaaa55"/>';
    if (['church', 'temple', 'shrine'].includes(place)) art += '<path d="M331 227V91a39 39 0 0 1 78 0v136Z" fill="#172d3c" stroke="#9b9b8388" stroke-width="3"/><path d="M320 230h100v23H320Z" fill="#626c63"/>';
    if (place === 'church') art += '<path d="M368 97v82m-25-55h50" stroke="#c8c09c" stroke-width="5"/>';
    if (place === 'club') art += '<path d="M76 41 203 255 147 255ZM442 41 538 255 438 255Z" fill="#ac87d514"/><path d="M0 251h640" stroke="#ad7cab66"/>';
    if (place === 'bathhouse') art += '<path d="M117 215h388v66H117Z" fill="#496c77" stroke="#95c1c3"/><ellipse cx="312" cy="225" rx="181" ry="25" fill="#6f9f9b55"/>';
    if (place === 'bank') art += '<path d="M130 195h389v59H130Z" fill="#5b706f"/><path d="M160 84v111m91-111v111m91-111v111m91-111v111" stroke="#89a6a455" stroke-width="5"/>';
    if (place === 'pcbang') art += [139, 283, 426].map((x) => `${rect(x, 99, 111, 76, '#12293e', 'stroke="#7e9da9" stroke-width="3"')}${rect(x + 8, 107, 95, 59, '#537f9577')}<path d="M${x + 55} 175v23m-40 0h80" stroke="#6b8c9c" stroke-width="4"/>`).join('') + '<path d="M104 201h451v12H104Z" fill="#577480"/>';
    return art;
  };

  const props = {
    wine: '<path d="M281 135h39v30a19 19 0 0 1-39 0Zm19 49v44m-19 0h38" fill="none" stroke="#c8d0bc" stroke-width="2"/><path d="M283 151h35v14a17 17 0 0 1-35 0Z" fill="#a15b6f"/><path d="M354 119h16v27l9 14v68h-34v-68l9-14Z" fill="#38564c" stroke="#829b7a"/>',
    suitcase: '<rect x="283" y="150" width="85" height="98" rx="9" fill="#3c5362" stroke="#8ea3a5" stroke-width="2"/><path d="M305 150v-19h40v19M304 164v68m43-68v68" stroke="#a3b6ac" stroke-width="3" fill="none"/><circle cx="300" cy="253" r="5" fill="#9eaea9"/><circle cx="354" cy="253" r="5" fill="#9eaea9"/>',
    papers: '<path d="m265 150 113-9 13 107-114 8Z" fill="#bac3ad"/><path d="m282 170 74-6m-71 22 78-6m-76 21 63-5m-60 20 73-5" stroke="#5e797b" stroke-width="3"/><path d="m360 243 29-50" stroke="#c1a87c" stroke-width="5"/>',
    phone: '<g transform="rotate(-10 325 194)"><rect x="297" y="135" width="58" height="109" rx="8" fill="#12253b" stroke="#8ca5b2" stroke-width="2"/><path d="M303 151h46v72h-46Z" fill="#53858f"/><path d="M309 166h30m-30 12h24m-24 12h29" stroke="#bfded0" stroke-width="3"/><circle cx="326" cy="234" r="3" fill="#aec8c0"/></g>',
    sword: '<path d="m301 231 29-126 12-17 4 23-28 124Z" fill="#afc6c8" stroke="#dae6d3"/><path d="m287 228 46 11m-31-1-8 28" stroke="#a18b66" stroke-width="7"/>',
    shield: '<path d="m280 148 46-18 48 18-10 80-38 26-37-26Z" fill="#4b6875" stroke="#a3b8b7" stroke-width="3"/><path d="M326 137v108m-34-84 67 2" stroke="#a0b4a2" stroke-width="4"/>',
    bell: '<path d="M322 131v20m-25 48q-2-48 29-48t29 48l10 18h-77Z" fill="#a79963" stroke="#e1d1a0" stroke-width="2"/><circle cx="327" cy="219" r="7" fill="#c2ae72"/><path d="M324 226q-20 19-3 34" stroke="#cc6c68" fill="none" stroke-width="5"/>',
    bed: '<path d="M253 204h143v43H253Z" fill="#a9bab6" stroke="#668998"/><path d="M253 207v-36h10v36m123 0v-36h10v36" stroke="#7f9eab" stroke-width="5"/><rect x="267" y="189" width="42" height="16" rx="6" fill="#d7dfcb"/><path d="M314 196h71v41h-71Z" fill="#6a9c9b"/>',
    monitor: '<rect x="267" y="118" width="129" height="87" rx="5" fill="#11263b" stroke="#91a9b0" stroke-width="3"/><path d="M275 127h112v68H275Z" fill="#346479"/><path d="M285 140h39m-39 14h85m-85 14h63m-63 14h77" stroke="#91b9b0" stroke-width="2"/><path d="M329 205v23m-30 0h63" stroke="#8ea7ac" stroke-width="5"/>',
    keyboard: '<path d="m258 214 124-7 22 39-153 8Z" fill="#4d6375" stroke="#a4b8bb"/><path d="m264 225 115-6m-114 16 120-5" stroke="#9bb1b2" stroke-width="3" stroke-dasharray="5 4"/><path d="m414 218 8 10-4 18-17-1-8-12 6-14Z" fill="#748e97"/><path d="m408 219-2 13" stroke="#d3b2a0"/>',
    bowl: '<ellipse cx="326" cy="194" rx="54" ry="18" fill="#e2d6b6"/><path d="M272 194q8 55 54 55t54-55" fill="#869fa2"/><ellipse cx="326" cy="194" rx="44" ry="12" fill="#967d55"/><path d="M306 166q-9-13 0-26m26 26q9-13 0-26m22 26q9-13 0-26" fill="none" stroke="#c3d2bf66" stroke-width="2"/>',
    teacup: '<path d="M294 180h64v43q-32 30-64 0Z" fill="#a2b4a5"/><path d="M358 187h13q17 22-13 29" fill="none" stroke="#c6d5bd" stroke-width="5"/><ellipse cx="326" cy="180" rx="32" ry="9" fill="#71877c"/><path d="M315 163q-9-13 0-26m22 26q9-13 0-26" fill="none" stroke="#c3d2bf66" stroke-width="2"/>',
    book: '<path d="M252 164q39-14 75 0 35-14 75 0v82q-40-15-75 0-36-15-75 0Z" fill="#c3c7b0" stroke="#7b9390" stroke-width="2"/><path d="M327 164v82m-60-64 45 2m-45 13 45 2m-45 13 45 2m29-30 45-2m-45 17 45-2m-45 17 45-2" stroke="#6d8783" stroke-width="2"/>',
    camera: '<rect x="274" y="159" width="104" height="70" rx="7" fill="#314d60" stroke="#a7bbc1" stroke-width="2"/><path d="m292 159 7-14h33l9 14" fill="#4c6b7b"/><circle cx="324" cy="194" r="24" fill="#10283b" stroke="#7b9aa9" stroke-width="5"/><circle cx="324" cy="194" r="12" fill="#365f78"/><rect x="352" y="168" width="15" height="9" fill="#c1caba"/>',
    core: '<ellipse class="pc-aura" cx="326" cy="190" rx="91" ry="67" fill="#df8d9822"/><path d="m326 117 36 40-10 72-27 24-27-28-11-70Z" fill="#bd8aa7" stroke="#efb7d0" stroke-width="2"/><path d="m326 117-3 111 39-71m-39 71-25-3" fill="none" stroke="#edd4d5"/>',
    gate: '<ellipse class="pc-aura" cx="338" cy="168" rx="67" ry="97" fill="#a77dda22" stroke="#bc9cdd" stroke-width="3"/><ellipse cx="338" cy="168" rx="47" ry="79" fill="#17203b"/><path d="m338 84-21 50 31 25-28 35 17 49" fill="none" stroke="#b8ced5" stroke-width="3"/><path d="m269 99-11 42m149 35 13 39" stroke="#bb97e6" stroke-width="2"/>',
    eye: '<path d="M249 178q77-73 154 0-77 66-154 0Z" fill="#35425e" stroke="#b8a1d2" stroke-width="2"/><ellipse class="pc-aura" cx="326" cy="176" rx="25" ry="33" fill="#b9a2df"/><ellipse cx="326" cy="176" rx="7" ry="27" fill="#152239"/>',
    hands: '<ellipse class="pc-aura" cx="326" cy="183" rx="82" ry="68" fill="currentColor" opacity=".13"/><path d="m267 253 21-61-5-37 9-3 13 40 9-59 10 1-1 58 12-61 10 3-6 58 16-45 9 4-12 64 15-20 10 6-29 49-45 25Z" fill="#9aa8a4" stroke="#cfddd0" stroke-width="2"/><path d="m306 231 18-32 25 15" fill="none" stroke="currentColor" stroke-width="3"/>',
    monster: '<path d="m263 248-12-55 23-73 35 24 21-32 26 35 40-7 26 63-28 55-18-50-15 9-13 49-25-42-27 18-20 24-3-57Z" fill="#263445" stroke="#7294a4" stroke-width="2"/><path d="m291 165 15 3m43-3 15-3" stroke="#dca290" stroke-width="4"/><path d="m316 190 13 5 14-7" stroke="#aeb5aa" stroke-width="2"/>',
    wings: '<path d="m326 229-31-42-87 17-53-61 112-5 60 38 50-45 121-6-53 72-88-6Z" fill="#33424f" stroke="#8c9eaa" stroke-width="2"/><path d="m159 144 136 43m31-11v53m51-98-20 60 138-66" fill="none" stroke="#6c7b8c" stroke-width="2"/>',
    stag: '<path d="m285 248 9-57 15-38h30l21 39 10 56h-13l-14-40-12 46-18-47-15 41Z" fill="#364e4c" stroke="#7b9891" stroke-width="2"/><path d="m316 154-14-29-28-20 1-28m28 48 10-39m20 68 18-32 30-20 3-31m-33 51-8-38" fill="none" stroke="#bbc3a0" stroke-width="5"/><path d="m312 168 6 1m17-1 6-2" stroke="#d7c68e" stroke-width="3"/>',
    tree: '<path d="m318 254 7-119h14l8 119Z" fill="#62745f"/><path d="m256 182 41-53-7-32 44-33 55 28-3 39 30 51-56 17-25-13-31 12Z" fill="#446a58" stroke="#81a781"/><path d="m331 186-27-31m29-3 30-30" stroke="#9dab7d" stroke-width="3"/>',
    medical: '<rect x="279" y="159" width="98" height="80" rx="7" fill="#8eaca8" stroke="#c3d1bd"/><path d="M305 159v-17h45v17" fill="none" stroke="#acc2b6" stroke-width="5"/><path d="M319 175h17v18h17v17h-17v18h-17v-18h-17v-17h17Z" fill="#4a777a"/>',
    measurement: '<path d="M275 250V120a51 51 0 0 1 102 0v130Z" fill="#2c4c5d" stroke="#a4c8c5" stroke-width="3"/><path d="M291 242V126a35 35 0 0 1 70 0v116Z" fill="#142b42"/><path d="M302 157h47m-47 16h47m-47 16h47m-47 16h47" stroke="#8dc9bd55"/><path d="m302 195 11-14 11 19 13-28 12 13" fill="none" stroke="#a7e3c8" stroke-width="3"/>',
    capsule: '<path d="M276 250V112a50 50 0 0 1 100 0v138Z" fill="#2a4c5f" stroke="#95c8ca" stroke-width="3"/><path d="M291 239V118a35 35 0 0 1 70 0v121Z" fill="#4c959a55"/><path d="M286 147h80m-80 47h80" stroke="#b5d8ca66"/><path d="M326 242V89" stroke="#c6e8da44"/>',
    helicopter: '<path d="m244 164 81-30 54 15 26 30-25 19h-80l-40-27-52-2-12-19Z" fill="#566f78" stroke="#a3b7b6"/><path d="M324 135v-24m-100 0h198m-121 91-11 17h104m-24-17 12 17" fill="none" stroke="#b7c5b5" stroke-width="4"/><path d="m336 145 33 11 17 21h-50Z" fill="#253d50"/>',
    lightning: '<path class="pc-flash" d="m347 53-64 113 40-6-29 94 79-135-43 9Z" fill="#d2e6df"/><ellipse class="pc-aura" cx="326" cy="157" rx="89" ry="102" fill="#b2d7dc0d"/>',
    pills: '<g transform="rotate(-25 326 183)"><rect x="283" y="165" width="90" height="37" rx="18" fill="#487fbb" stroke="#afc9dc" stroke-width="2"/><path d="M328 166v35" stroke="#d1e3da" stroke-width="2"/><path d="M286 183a16 16 0 0 1 17-13h23v27h-23a16 16 0 0 1-17-14Z" fill="#96b5cc"/></g>',
    cat: '<path d="m296 222 5-45-2-34 20 13 20-13-2 34 16 45Z" fill="#8ca6a5" stroke="#b5c4b7"/><path d="M350 224q50-12 19-42" fill="none" stroke="#8ca6a5" stroke-width="8"/><path d="m308 173 6 1m11-1 6-1" stroke="#d9d7a2" stroke-width="3"/>',
    flowers: '<path d="m298 243 22-53m9 59 9-63m3 62 24-47" stroke="#71947a" stroke-width="4"/><g fill="#d1d8c5"><circle cx="320" cy="187" r="13"/><circle cx="338" cy="177" r="14"/><circle cx="364" cy="197" r="12"/></g><g fill="#bdb17f"><circle cx="320" cy="187" r="4"/><circle cx="338" cy="177" r="4"/><circle cx="364" cy="197" r="4"/></g>',
    portrait: '<path d="M286 132h81v102h-81Z" fill="#17283b" stroke="#91978a" stroke-width="7"/><circle cx="326" cy="168" r="16" fill="#99aca4"/><path d="M301 214q0-32 25-32t25 32Z" fill="#65858a"/><path d="m286 132 24 26m57-26-24 26" stroke="#44545a" stroke-width="8"/>',
    gun: '<path d="m275 162 101 3 16 16-42 6-8 26-21-1-7-25-39-2Z" fill="#607986" stroke="#a4bbc1" stroke-width="2"/><path d="m319 188 25-1m-52-17h59" stroke="#273e50" stroke-width="4"/>',
    umbrella: '<path d="M259 165a68 68 0 0 1 136 0q-17-15-34 0-17-15-34 0-17-15-34 0-17-15-34 0Z" fill="#6f8d9b" stroke="#abc5c6" stroke-width="2"/><path d="M327 103v126q0 26-17 15" fill="none" stroke="#c6cdb3" stroke-width="3"/>',
    tape: '<path d="m229 175 196 18m-196 30 196-18" stroke="#d1bc74" stroke-width="12"/><path d="m240 172 14 8m23-5 14 8m23-5 14 8m23-5 14 8m23-5 14 8m-150 28 12-9m25 7 12-9m25 7 12-9m25 7 12-9" stroke="#344452" stroke-width="5"/>',
    window: '<path d="M269 114h113v132H269Z" fill="#193c52" stroke="#92a9aa" stroke-width="5"/><path d="M326 114v132m-57-62h113" stroke="#9aafad" stroke-width="4"/><path d="m261 106 26 6-5 137-28 9m136-152-24 6 6 137 28 9" fill="#637e8b"/>',
    clock: '<circle cx="327" cy="183" r="57" fill="#b6c7b5" stroke="#5c7b8a" stroke-width="7"/><path d="M327 144v39l30 17" fill="none" stroke="#28485b" stroke-width="5"/><path d="M327 135v9m0 78v9m-48-48h9m78 0h9" stroke="#5e7d83" stroke-width="3"/>',
    backpack: '<path d="M292 158q35-53 71 0" fill="none" stroke="#99ac94" stroke-width="7"/><rect x="283" y="155" width="89" height="95" rx="14" fill="#4b675e" stroke="#9bae94" stroke-width="2"/><path d="M300 160v82m54-82v82" stroke="#233e3d" stroke-width="7"/><rect x="303" y="207" width="48" height="31" rx="4" fill="#324e4b"/>',
    motorbike: '<circle cx="277" cy="232" r="25" fill="#172b3d" stroke="#9aaead" stroke-width="5"/><circle cx="383" cy="232" r="25" fill="#172b3d" stroke="#9aaead" stroke-width="5"/><path d="m277 232 37-40 45 37-82 3m37-40h43l26 40m-32-46 15-32 15-1" fill="none" stroke="#8eabb1" stroke-width="6"/><rect x="297" y="161" width="41" height="29" fill="#b6ad81"/>',
    guitar: '<path d="m333 172 31-65 10 5-26 67q29 25 8 57-28 26-55 3-16-27 8-45l-2-22Z" fill="#a98b62" stroke="#d9c3a0" stroke-width="2"/><circle cx="331" cy="205" r="12" fill="#2a3f4c"/><path d="m325 223 41-105" stroke="#d4d7b9" stroke-width="2"/>',
    microphone: '<g transform="rotate(18 326 183)"><rect x="313" y="125" width="28" height="65" rx="14" fill="#92adb4" stroke="#d1dcce"/><path d="M304 164v12a23 23 0 0 0 46 0v-12M327 201v43m-24 0h48" fill="none" stroke="#a1b7b7" stroke-width="4"/></g>',
    shoes: '<path d="m278 193 20 2 12 25 37 6 4 17h-78l-6-13Zm72-22 19 2 12 25 35 7 3 17h-76l-6-13Z" fill="#698f98" stroke="#bed3c6" stroke-width="2"/><path d="m289 207 19 1m51-22 19 1" stroke="#d9d9b9" stroke-width="3"/>',
    weights: '<path d="M264 188h126" stroke="#b2c3bd" stroke-width="8"/><path d="M279 164v48m-13-42v36m111-42v48m13-42v36" stroke="#5b7c8b" stroke-width="12"/>',
  };
  // 핵심 사물은 원래 장면에 등장하는 물건으로 구성한다.
  props.letter = props.papers; props.bill = props.papers; props.notice = props.papers; props.notebook = props.book; props.diary = props.book;
  props.newspaper = props.papers; props.checklist = props.papers; props.ticket = props.papers;
  props.bead = props.core.replace(/#bd8aa7/g, '#88b8ad').replace(/#efb7d0/g, '#c0dfcc');
  props.herbs = props.tree; props.horizon = '<path d="m326 125-18 116h37Z" fill="#0d1c2e" stroke="#8e90b266"/>';
  props.lamp = '<path d="M326 100v156m-14-156h30l8 18h-46Z" stroke="#7c9cac" stroke-width="5" fill="#d8d0a0"/><ellipse class="pc-aura" cx="328" cy="132" rx="59" ry="65" fill="#ddd4a017"/>';
  props.campfire = '<path d="m278 247 94-9m-86-9 77 25" stroke="#6a6456" stroke-width="12"/><path class="pc-aura" d="M294 232q-12-30 24-57-8 28 7 32 18-14 10-47 44 45 16 72Z" fill="#d6a579"/>';
  props.keycard = '<path d="m278 165 87-15 12 67-87 16Z" fill="#c1cdb6" stroke="#708e96"/><path d="m283 180 85-15" stroke="#425f72" stroke-width="10"/><circle cx="304" cy="205" r="8" fill="#758f8d"/>';
  props.dogtag = '<path d="M299 172q-24-87 34-75t9 74" fill="none" stroke="#aabbb9" stroke-width="2"/><rect x="295" y="169" width="36" height="58" rx="9" fill="#a3b4a9" transform="rotate(-12 313 198)"/><rect x="331" y="174" width="36" height="58" rx="9" fill="#809ba3" transform="rotate(14 349 203)"/>';
  props.thermometer = '<path d="M321 137a9 9 0 0 1 18 0v71a19 19 0 1 1-18 0Z" fill="#bbcfc5" stroke="#5c8b9b" stroke-width="3"/><path d="M330 163v60" stroke="#c4777b" stroke-width="5"/><circle cx="330" cy="223" r="9" fill="#c4777b"/>';
  props.lunchbox = '<rect x="279" y="170" width="100" height="69" rx="9" fill="#819a88" stroke="#c7d1b4" stroke-width="2"/><path d="M279 190h100m-52-20v69" stroke="#c3cbb4" stroke-width="4"/>';
  props.toy = '<circle cx="326" cy="182" r="24" fill="#bbac88"/><circle cx="303" cy="162" r="11" fill="#bbac88"/><circle cx="349" cy="162" r="11" fill="#bbac88"/><ellipse cx="326" cy="225" rx="29" ry="30" fill="#9e9178"/><path d="m317 183 3 1m14-1-3 1" stroke="#344653" stroke-width="3"/>';
  props.parcel = '<path d="m275 164 68-16 39 23v69l-69 17-38-23Z" fill="#8a8467" stroke="#b8b497"/><path d="m275 164 38 21 69-14m-69 14v72m-11-86 68-16" fill="none" stroke="#d0c6a0" stroke-width="5"/>';
  props.tiles = '<path d="m276 177 89-6 20 26-103 9Zm2 15 89-6 20 26-103 9Zm2 15 89-6 20 26-103 9Z" fill="#88928b" stroke="#c0c6ae"/>';
  props.wok = '<path d="M268 188q58 87 116 0Z" fill="#384f5e" stroke="#98afb3" stroke-width="3"/><path d="m383 194 43-21" stroke="#9caa9d" stroke-width="9"/><path d="M300 182q-14-20 1-37m26 37q-14-20 1-37m26 37q-14-20 1-37" fill="none" stroke="#c5d0b855" stroke-width="3"/>';
  props.apron = '<path d="M307 144h39l8 35 25 9-12 67h-80l-13-67 25-9Z" fill="#758f85" stroke="#b6c8b0"/><path d="M307 144v-18h39v18m-37 69h38v22h-38Z" fill="none" stroke="#c8cbb3" stroke-width="3"/>';
  props.bread = '<path d="M276 220v-30q-8-23 19-25 8-24 31-12 27-13 36 9 29 2 18 28v31Z" fill="#b9a171" stroke="#dec79a" stroke-width="2"/><path d="m287 185 75-1m-61-18-2 43m26-52v53m24-44 2 44" stroke="#d4bb8b" stroke-width="4"/>';
  props.amulet = '<path d="m302 138 52 7-13 105-53-7Z" fill="#c4b888" stroke="#e1d1a0"/><path d="m317 159 15 8-18 14 18 15-20 17 14 15" fill="none" stroke="#a06c68" stroke-width="4"/>';
  props.incense = '<path d="M285 217h85l-9 31h-66Z" fill="#708c89" stroke="#b4c2ad"/><path d="M313 219v-54m21 54v-66m15 66v-50" stroke="#b9a278" stroke-width="3"/><path class="pc-mist" d="M315 158q-24-22 2-45m20 30q22-19-2-44" fill="none" stroke="#b8c9b377" stroke-width="2"/>';
  props.canvas = '<path d="m284 261 46-149 45 149m-86-70h75" stroke="#8f8d74" stroke-width="5"/><path d="M276 117h101v108H276Z" fill="#b4beaa" stroke="#6f8c8b" stroke-width="4"/><path d="M283 214v-31l20-14 23 18 18-35 26 27v35Z" fill="#61888d"/>';
  props.stopwatch = props.clock; props.scope = props.gun; props.console = props.keyboard;
  props.generator = props.core + '<path d="M263 252h130v15H263Z" fill="#546e7a"/><path d="M273 217v35m109-35v35" stroke="#8ca7b0" stroke-width="4"/>';
  props.scanner = props.capsule; props.towel = '<path d="m286 159 85 4-12 81-85-5Z" fill="#b1c6bc" stroke="#d8dfc9"/><path d="m283 221 78 4" stroke="#7e9c9b" stroke-width="5"/>';
  props.parachute = '<path d="M249 115a80 80 0 0 1 160 0Z" fill="#89a393" stroke="#c3c9aa" stroke-width="2"/><path d="m249 115 71 109m89-109-71 109m-48-109 30 109m49-109-31 109" stroke="#bdcaba" fill="none"/>' + person(329, 263, .45);
  props.door = '<path d="M283 254V117h93v137Z" fill="#152d42" stroke="#8a9fa6" stroke-width="5"/><circle cx="358" cy="190" r="4" fill="#d2c69d"/>';
  props.shutter = '<path d="M268 111h121v143H268Z" fill="#4e6876" stroke="#96aeb3"/>' + Array.from({ length: 11 }, (_, i) => `<path d="M269 ${120 + i * 12}h119" stroke="#273f52" stroke-width="3"/>`).join('');
  props.vault = '<path d="M268 112h121v140H268Z" fill="#667b80" stroke="#b0c1b9" stroke-width="5"/><circle cx="329" cy="182" r="32" fill="#344f61" stroke="#aabfb7" stroke-width="4"/><path d="M329 155v54m-27-27h54" stroke="#b7c8bc" stroke-width="5"/><path class="pc-aura" d="M270 130v95l14 22" stroke="#e6a27f" fill="none" stroke-width="6"/>';
  props.fence = '<path d="M246 257V153m162 104V153M246 169h162M246 219h162" stroke="#7c969b" stroke-width="5"/><path d="m250 166 64 91m-20-91 64 91m-20-91 64 91m-97-91-55 77m98-77-62 88m106-88-62 88" stroke="#617e8966"/>';
  props.crowd = person(275, 255, .85) + person(382, 255, .9) + person(328, 268, 1.1);
  props.bridge = '<path d="m208 215 94-30 30 9-23 20 28 17 85-18 15 22-107 24-36-20-71 17Z" fill="#607b82" stroke="#b0bdb0"/><path d="m225 192 68-24m45 4 78 12" stroke="#8ea5a7" stroke-width="5"/>';
  props.path = '<path d="m260 267 50-97 31-33 23 11-36 34 11 85Z" fill="#b8b79666"/><path d="m302 219 23 2m-14-20 20 1m-11-18 12 1" stroke="#c3c8a188" stroke-width="3"/>';
  props.riceball = '<path d="M292 224q-9-8-3-19l30-51q8-12 17 0l31 51q7 12-4 19Z" fill="#c6cfb7" stroke="#8ea6a6" stroke-width="2"/><path d="M313 196h29v29h-29Z" fill="#344e48"/>';

  let serial = 0;
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
  const art = (id, state, step = 0) => {
    const shot = config(id, state); if (!shot) return '';
    const n = `pc${++serial}`, seed = Array.from(id).reduce((v, ch) => (Math.imul(v, 31) + ch.charCodeAt(0)) >>> 0, 0);
    const lead = UI.proLeadElem(), color = shot.mood === 'awakening' && lead && ELEMENTS[lead] ? ELEMENTS[lead].color : moods[shot.mood];
    const rain = shot.mood === 'rain' ? `<g class="pc-rain" stroke="#b0d5dd44">${Array.from({ length: 26 }, (_, i) => `<path d="m${(i * 43) % 640} ${(i * 79) % 290} -8 24"/>`).join('')}</g>` : '';
    const danger = shot.mood === 'danger' ? '<path class="pc-aura" d="M0 275h640v85H0Z" fill="#b47d6722"/>' : '';
    const focus = id === 'friend_3' ? `<g transform="translate(-26 0)">${props.hands}</g><g transform="translate(680 0) scale(-1 1)">${props.hands}</g>` : props[shot.object] || '';
    const camera = `translate(${seed % 17 - 8} ${seed % 9 - 4})`;
    return `<svg class="ec-art pc-art pc-shot-${step}" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(PROLOGUE[id].title)}"><defs><radialGradient id="${n}"><stop stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="#0b192a"/></radialGradient></defs><rect width="640" height="360" fill="#0c1b2d"/><rect width="640" height="360" fill="url(#${n})"/><g class="pc-background">${background(shot.place, seed)}</g><path d="M0 0h640v360H0Z" fill="url(#${n})" opacity=".35"/><g transform="${camera}"><g class="pc-object" style="color:${color}">${focus}</g></g>${rain}${danger}<g class="pc-foreground">${['hands', 'crowd', 'horizon', 'portrait'].includes(shot.object) ? '' : person(154, 296, .77)}<path d="M0 330q150-30 310 0t330-10v40H0Z" fill="#071422" opacity=".55"/></g><g class="pc-mist" fill="${color}" opacity=".13"><circle cx="211" cy="87" r="1.2"/><circle cx="411" cy="112" r="1"/><circle cx="472" cy="209" r="1.6"/><circle cx="265" cy="237" r="1"/></g></svg>`;
  };
  const captions = (text) => {
    const paragraphs = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    let lines = paragraphs.length > 1 ? paragraphs : (text.match(/[^.!?]+(?:[.!?]+["”]?|$)/g) || [text]).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 3) lines = [lines[0], lines[Math.floor(lines.length / 2)], lines[lines.length - 1]];
    return lines.map((line) => {
      if (line.length > 100) {
        const short = line.slice(0, 98); const stop = Math.max(short.lastIndexOf('.'), short.lastIndexOf('!'), short.lastIndexOf('?'));
        line = stop > 35 ? short.slice(0, stop + 1) : short.slice(0, Math.max(65, short.lastIndexOf(' '))) + '…';
      }
      return esc(line);
    });
  };
  const prepare = (state) => {
    const id = state.id, sc = PROLOGUE[id]; if (!sc || !config(id, state)) return null;
    const key = `prologue_${id}`, lines = captions(UI.proFill(proSceneText(sc, state.flags || {})));
    const shot = config(id, state);
    ExploreCinema.scenes[key] = {
      title: esc(UI.proFill(sc.title)), prologue: true, color: moods[shot.mood], lines,
      beatLabels: lines.map((_, i) => i === 0 ? '이야기의 시작' : i === lines.length - 1 ? '선택의 순간' : '이어지는 이야기'),
      render: (step) => art(id, state, step),
    };
    return key;
  };
  const seen = new WeakMap();
  const mount = (state) => {
    const key = prepare(state); if (!key) return;
    const box = document.getElementById('pro-scene'); if (!box) return;
    box.querySelectorAll('.pro-cinema').forEach((el) => el.remove());
    const preview = document.createElement('div'); preview.className = 'pro-cinema';
    preview.innerHTML = `${art(state.id, state)}<button type="button" data-act="pro-cinema" data-v="${state.id}">컷씬 다시 보기 ↗</button>`;
    box.insertBefore(preview, box.querySelector('.pro-text'));
    let read = seen.get(state); if (!read) { read = new Set(); seen.set(state, read); }
    if (!read.has(state.id)) {
      read.add(state.id);
      if (!window.TUT_AUTO_TAP) ExploreCinema.show(key, true);
    }
  };
  return { shots, config, art, prepare, mount, reset: (state) => seen.delete(state) };
})();

{
  const basePrologue = UI.renderPrologue;
  UI.renderPrologue = function (...args) {
    const key = this.pro && `prologue_${this.pro.id}`;
    if (ExploreCinema.active && ExploreCinema.active.id !== key) ExploreCinema.finish(false);
    const r = basePrologue.apply(this, args);
    if (this.pro && this.screen === 'prologue') PrologueCinema.mount(this.pro);
    return r;
  };
  const baseRender = UI.render;
  UI.render = function (...args) {
    if (this.screen !== 'prologue' && ExploreCinema.active && ExploreCinema.active.id.startsWith('prologue_')) ExploreCinema.finish(false);
    return baseRender.apply(this, args);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v, ...args) {
    if (act === 'pro-restart' && this.pro) PrologueCinema.reset(this.pro);
    if (act === 'pro-cinema' && this.pro && this.pro.id === v && this.screen === 'prologue') {
      const key = PrologueCinema.prepare(this.pro); if (key) return ExploreCinema.show(key, true);
    }
    return baseHandle.call(this, act, v, ...args);
  };
}
