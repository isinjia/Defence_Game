// 탐색 컷씬: 결과를 미리 정하지 않고, 선택 직전의 발견만 세 장면으로 보여 준다.
// 기존 사건·판정·보상은 그대로 실행하며 컷씬은 게임 상태나 난수를 바꾸지 않는다.
const ExploreCinema = (() => {
  const scenes = {};
  const add = (id, title, color, art, lines) => { scenes[id] = { title, color, art, lines }; };
  const crystal = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0-65 22-32 15 8-12 18-24-18Z" fill="#71e4ee" fill-opacity=".55" stroke="#bafaff"/><path d="M0-65 0 5 22-32M0 5-12 18M0-65-24-18 0 5" fill="none" stroke="#e0ffff" opacity=".5"/></g>`;
  const person = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="6" rx="31" ry="8" fill="#000" opacity=".5"/><path d="m-16-52-6 49h16l6-30L7-3h16L16-52Z" fill="#15232c" stroke="#405362"/><path d="M-19-84Q0-103 19-84L25-45H-24Z" fill="#243540" stroke="#657780"/><path d="m-24-76-13 32 8 5 17-26M22-76l14 32-9 6-17-27" fill="#1b2a34"/><circle cy="-106" r="14" fill="#101b23" stroke="#6d7d83"/><path d="M-13-111Q0-127 13-111" fill="#1f303c"/><path d="m-15-78 30 16M-18-48h37" stroke="#91a79d" stroke-width="3"/><rect x="9" y="-74" width="5" height="7" fill="#a5f4dc"/></g>`;
  const pack = `<path d="M332 185q-28-48-57-3M319 182q18-38 40-3" fill="none" stroke="#566350" stroke-width="8"/><path d="m279 175 74-5 16 89-99 3Z" fill="#35483d" stroke="#81917a" stroke-width="2"/><path d="M279 189h76v25h-76Z" fill="#4c5d49"/><path d="M297 173v72M340 172v73" stroke="#182c25" stroke-width="6"/><path d="m296 243 48-2 3 22h-51Z" fill="#26392e"/><path d="m305 217 13-3 2 18-13 3Z" fill="#c0c9bf"/>`;
  const pool = `<ellipse class="ec-glow" cx="328" cy="238" rx="140" ry="43" fill="#46dccb" opacity=".22"/><path d="M184 236q54-49 135-31t137 31q-126 61-272 0Z" fill="#123d49" stroke="#77dcd7"/><g class="ec-ripple" fill="none" stroke="#affff5"><ellipse cx="323" cy="236" rx="79" ry="17"/><ellipse cx="323" cy="236" rx="43" ry="9"/></g><path d="M333 147q-25 33-8 54t-7 25" fill="none" stroke="#92f5e9" opacity=".5"/>`;
  add('pack', '쓰러진 헌터의 배낭', '#c7b48a', pack, ['발길이 멎는다. 바위틈에 낡은 배낭이 걸려 있다.', '끊어진 어깨끈. 흙에 반쯤 묻힌 인식표. 주인은 보이지 않는다.', '잠긴 지퍼 안에서, 무언가 바스락거린다.']);
  add('pool', '에테르 웅덩이', '#60e5e1', pool, ['어둠 속에서 푸른빛이 번진다.', '바람도 없는데 수면이 일렁인다. 짙은 에테르가 피부를 간질인다.', '손을 가까이 대자, 물 아래의 빛이 맥박처럼 뛴다.']);
  add('survivor', '갇힌 생존자', '#e3b38a', `${person(350, 260, .72)}<path d="m201 139 38-20 184 117-32 36Z" fill="#384552" stroke="#6b7380"/><path d="m216 142 174 112M258 156l9 30 29-4" fill="none" stroke="#151f2b" stroke-width="3"/><path d="m371 248 33 13-28 8" fill="#712f3b"/>`, ['무너진 기둥 아래서 낮은 신음이 새어 나온다.', '잔해 사이로 손 하나가 보인다. 아직 살아 있다.', '하지만 통로 저편에서도, 돌을 긁는 소리가 들린다.']);
  add('altar', '수상한 제단', '#ff667f', `<path d="m222 268 22-30h158l22 30Z" fill="#33303e"/><path d="m249 239 12-58h125l12 58Z" fill="#302735" stroke="#78616e"/><path d="M249 183h151v15H249Z" fill="#5a4250"/><g stroke="#c5b7a7" stroke-width="7" stroke-linecap="round"><path d="m262 175 118-17M274 155l104 24M268 201l112 24M274 226l107-22"/></g><g class="ec-glow" style="color:#ff5577">${crystal(325, 167, .65).replace(/#71e4ee/g, '#ff5577').replace(/#bafaff/g, '#ffc0cd')}</g><path d="m290 238 8-19 13 12 14-26 13 26 17-12 6 19" fill="none" stroke="#da4a66" stroke-width="2"/>`, ['뼈를 밟는 소리가 유난히 크게 울린다.', '괴수의 뼈로 쌓은 제단. 중앙에 붉은 결정이 박혀 있다.', '다가서자, 차갑던 결정이 천천히 빛을 머금는다.']);
  add('wall', '갈라진 벽', '#9fc9e8', `<path d="M210 66h220v220H210Z" fill="#253443" stroke="#4b6275"/><path d="m326 66-19 59 23 29-31 49 16 26-20 57" fill="none" stroke="#bcefff" stroke-width="5"/><path d="M210 128h97M330 128h100M210 203h89M315 229h115M261 66v62M384 128v101" stroke="#101d2c" stroke-width="5"/><path class="ec-drift" d="m309 164-65 4M310 184l-95 13M310 217l-61 12" stroke="#a1e7f5" fill="none" opacity=".35"/>`, ['막다른 벽 앞에서 찬바람이 뺨을 스친다.', '돌 사이로 가느다란 빛이 새어 나온다. 벽 너머에 공간이 있다.', '금이 간 돌 하나가, 손끝 아래서 조금 흔들린다.']);
  add('trail', '다른 파티의 흔적', '#d5bf90', `<g fill="#8d8b76" opacity=".6"><ellipse cx="284" cy="260" rx="8" ry="16" transform="rotate(-24 284 260)"/><ellipse cx="332" cy="231" rx="7" ry="13" transform="rotate(-24 332 231)"/><ellipse cx="302" cy="206" rx="6" ry="11"/><ellipse cx="337" cy="182" rx="5" ry="9"/><ellipse cx="319" cy="163" rx="4" ry="7"/></g><g fill="#d7ad68" stroke="#675432"><path d="m380 249 20-8 4 7-20 8Z"/><path d="m225 239 16 5-2 6-16-5Z"/><path d="m365 206 14-5 2 5-14 5Z"/></g><path d="M343 158 369 115" stroke="#879591" stroke-width="2" stroke-dasharray="4 8"/>`, ['발밑에서 빈 탄피 하나가 굴러간다.', '겹친 발자국들이 같은 방향으로 이어진다. 다른 파티가 먼저 지나갔다.', '흔적은 안쪽으로 이어진다. 돌아온 발자국은 보이지 않는다.']);
  add('echo', '메아리', '#b8a0ff', `<path d="M261 251V132a65 65 0 0 1 130 0v119Z" fill="#050a16" stroke="#354055" stroke-width="10"/><g class="ec-ripple" fill="none" stroke="#ae93e9" opacity=".5"><path d="M270 128q-51 48 0 98M249 104q-77 74 0 146M381 128q51 48 0 98M402 104q77 74 0 146"/></g><ellipse class="ec-glow" cx="325" cy="178" rx="18" ry="39" fill="#a998de" opacity=".12"/>`, ['통로 끝에서 누군가 당신의 이름을 부른다.', '익숙한 목소리. 여기 있을 리 없는 사람의 목소리다.', '한 걸음 멈추자, 메아리도 함께 멎는다.']);
  add('crystal', '거대한 결정 기둥', '#7ce8f2', `${crystal(325, 230, 2.1)}${crystal(247, 252, .9)}${crystal(405, 254, .65)}<ellipse class="ec-glow" cx="326" cy="251" rx="133" ry="29" fill="#6ce8f2" opacity=".13"/>`, ['천장에 닿을 만큼 거대한 결정이 어둠을 밝힌다.', '표면 아래로 에테르가 흐른다. 작은 조각만으로도 값어치가 있을 것이다.', '곡괭이를 고쳐 쥔다. 이 고요 속에서, 첫 타격은 멀리 울릴 것이다.']);
  add('fork', '갈림길', '#88bccd', `<path d="m298 289 17-94-92-88M335 290l-7-95 96-88" fill="none" stroke="#46505b" stroke-width="28"/><path d="m315 193-92-86M328 195l96-88" stroke="#8b9295" stroke-width="2"/><path d="m313 129 14-38 18 42-13 44Z" fill="#16222e"/><g fill="#679fa9" opacity=".5"><ellipse cx="262" cy="158" rx="7" ry="3"/><ellipse cx="278" cy="176" rx="6" ry="3"/></g>`, ['통로가 두 갈래로 나뉜다.', '왼쪽에는 젖은 발자국. 오른쪽에는 소리조차 없는 어둠.', '어느 길을 고를지, 먼저 확인하고 갈지 결정해야 한다.']);
  add('spring', '에테르 샘', '#87efbe', `${pool}<path class="ec-drift" d="M328 221q-21-35 1-79t-5-49" fill="none" stroke="#a5f8de" stroke-width="3"/>`, ['바위틈에서 맑은 물소리가 들린다.', '푸른 물이 고인 자리에는 괴수의 기척도 옅다.', '잠시 숨을 고를 수 있을 것 같다.']);
  add('chest', '녹슨 상자', '#e5c38b', `<path d="m242 195 27-40h125l29 40v68H242Z" fill="#303e40" stroke="#8b8e73" stroke-width="2"/><path d="M242 195h181M275 156v106M388 156v106" fill="none" stroke="#a6956b" stroke-width="5"/><path d="M317 185h27v32h-27Z" fill="#adac8d"/><path d="M319 167h23M330 159v22" stroke="#718b86" stroke-width="4"/><path class="ec-glow" d="M247 198h170" stroke="#cfad71" opacity=".65"/>`, ['구석에 오래된 보급 상자가 놓여 있다.', '녹슨 뚜껑에 남아 있는 헌터 협회의 표식.', '상자 틈에서 들린 소리는 바람일까, 숨소리일까.']);
  add('trap', '갈라진 바닥', '#c0b2de', `<path d="m150 220 116-20 41 15-39 24 36 19-32 43H140ZM492 197l-134 13-25 22 43 27-31 40h161Z" fill="#3b4151" stroke="#7b7a90"/><path d="m306 214 28 85h-61l32-40-36-20Z" fill="#030610"/><path d="m366 202 4-30m-10 9 17-5" stroke="#c4c9c6" stroke-width="4"/><path d="M362 177q-68-20-98 28" fill="none" stroke="#bcb69b" stroke-width="2"/>`, ['앞길이 끊겨 있다. 두 걸음 너비의 깊은 틈.', '아래를 비춰도 빛은 바닥에 닿지 않는다.', '건너편 벽에 누군가 박아 놓은 앵커가 보인다.']);
  add('hunter', '먼저 온 헌터', '#dbac9a', `${person(348, 267, 1.1)}<path d="m346 246 21 4-4 11-21-5Z" fill="#d9c8b5"/><path d="m353 249 6 2-2 7-6-2Z" fill="#9d4149"/><path d="m387 176 32-5-9 96h-12Z" fill="#4a515d"/>`, ['벽에 기대 앉은 헌터가 거친 숨을 몰아쉰다.', '다리의 붕대가 피로 젖었다. 떨어진 무기는 손이 닿지 않는 곳에 있다.', '낯선 발소리를 듣자, 그가 힘겹게 고개를 든다.']);
  add('nest', '알 무더기', '#b6c887', `<path d="M207 224q35-138 222-98l-15 132H226Z" fill="#27352e" opacity=".6"/><g fill="#647d50" stroke="#b6c185" stroke-width="1.5">${Array.from({ length: 13 }, (_, i) => `<ellipse class="ec-egg" style="animation-delay:${i * .23}s" cx="${247 + (i % 5) * 37}" cy="${159 + Math.floor(i / 5) * 39}" rx="15" ry="21"/>`).join('')}</g><path d="m319 143-5 16 9 9-6 10" stroke="#222d21" fill="none" stroke-width="3"/>`, ['빛을 들자, 벽 전체가 작은 그림자로 뒤덮인다.', '끈적한 막에 싸인 알들. 몇 개는 안에서부터 꿈틀거린다.', '가장 가까운 껍데기에 가느다란 금이 간다.']);
  add('mural', '벽화', '#e2bc7d', `<path d="M200 84h249v186H200Z" fill="#343635" stroke="#666a61"/><g fill="none" stroke="#b6a57b" stroke-width="3" opacity=".8"><path d="M300 236V141a26 26 0 0 1 52 0v95ZM288 242h76M224 182l27 17 25-17M376 182l25 17 27-17M251 199v40m-12 0 12-20 12 20M401 199v40m-12 0 12-20 12 20"/><circle cx="251" cy="168" r="9"/><circle cx="401" cy="168" r="9"/><path d="m313 158 13-10 13 10-13 11Z"/></g><path d="m221 86 21 35-9 14M409 220l-15 16 10 34" stroke="#181f24" fill="none" stroke-width="4"/>`, ['매끈한 벽 위에 오래된 그림이 남아 있다.', '사람을 닮은 형체들이 문 하나를 둘러싸고 있다.', '그림 속 통로가, 방금 지나온 길과 닮아 있다.']);
  add('camp', '버려진 야영지', '#e6aa75', `<ellipse cx="313" cy="256" rx="42" ry="12" fill="#2e2425" stroke="#55505a"/><path d="m286 252 49-8m-40-3 35 16" stroke="#62493c" stroke-width="9"/><g class="ec-glow" fill="#c67749"><circle cx="308" cy="251" r="3"/><circle cx="323" cy="248" r="2"/></g><path d="m384 223 44 6 7 37-58-6Z" fill="#4a5152"/><path d="m208 220 53 4 11 36-75-2Z" fill="#354348"/><path d="M240 119h164v65H240Z" fill="#424744"/><path d="m255 137 43 3m-32 12 68-3m-49 17 54-3m15-28 25 5m-21 14 30-5" stroke="#bbc2ac" stroke-width="3"/>`, ['모닥불은 꺼졌고, 재에는 아직 온기가 남아 있다.', '찢어진 침낭과 반쯤 남은 통조림. 누군가 서둘러 떠났다.', '벽에 남긴 경고가 눈에 들어온다. “안쪽 방 조심. 둘이 한꺼번에 온다.”']);
  add('boss_door', '보스 구역 앞', '#ce8eec', `<path d="M223 283V111a102 102 0 0 1 204 0v172Z" fill="#242439" stroke="#5c4c72" stroke-width="8"/><path d="M247 283V117a78 78 0 0 1 156 0v166Z" fill="#100e20" stroke="#89709a" stroke-width="3"/><path class="ec-glow" d="M325 45v238" stroke="#d9a3f0" stroke-width="4"/><g fill="none" stroke="#765b88" stroke-width="2"><path d="m262 139 42 26-42 24 42 27-42 25M388 139l-42 26 42 24-42 27 42 25"/><circle cx="325" cy="115" r="23"/></g>`, ['공기가 달라졌다. 숨을 들이킬 때마다 가슴이 무겁다.', '문 너머에서 거대한 무언가의 숨소리가 벽을 타고 울린다.', '여기서 장비를 점검할지, 작전을 맞출지 정해야 한다.']);
  add('ruin', '폐허 탐사', '#8abbd2', `<path d="M197 271V126l61-24v169M275 271V83l54 18v170M362 271V126l67-13v158" fill="#2b3a49" stroke="#62717d" stroke-width="2"/><path d="m281 85 15 48-13 26 20 33-10 77M407 115l-13 40 16 31" fill="none" stroke="#0c1927" stroke-width="5"/><path d="m207 271 40-29 31 30 56-28 27 29 43-20 38 25" fill="#46515a"/><path d="M308 214h20v15h-20Z" fill="#83d7e7" opacity=".7"/>`, ['도시가 있었던 자리에 건물의 뼈대만 남아 있다.', '부서진 유리 아래로 희미한 빛이 비친다.', '잔해 안에 무엇이 남았는지는 직접 확인해야 한다.']);
  add('outpost', '버려진 관리국 초소', '#8fb8db', `<path d="M220 258V146h204v112Z" fill="#2d3c47" stroke="#6f8290"/><path d="m207 147 34-37h163l35 37Z" fill="#465460"/><path d="M246 167h56v43h-56ZM354 167h44v43h-44Z" fill="#0b1724" stroke="#657986"/><path d="M315 258v-78h29v78" fill="#121f2b"/><path d="M393 112V50m0 0 36 14-36 13" fill="#687c86" stroke="#78878e"/><path d="m255 172 42 31m-42 0 42-31" stroke="#445561" stroke-width="3"/>`, ['산바람 속에 낡은 초소가 서 있다.', '깨진 창문 너머로 먼지 쌓인 책상과 보급함이 보인다.', '대붕괴 직후 이곳을 지켰던 사람들은 어디로 갔을까.']);
  add('village', '생존자 마을', '#e6c187', `<path d="M192 258v-65h89v65M355 255v-89h95v89" fill="#414948" stroke="#7e8176"/><path d="m178 194 57-51 60 51m47-27 59-50 62 50" fill="#4c5653" stroke="#7d8c80"/><path d="M215 214h24v23h-24ZM375 187h24v27h-24Z" fill="#d2a86d"/><path d="M309 262v-44m-22 8h45" stroke="#7a6551" stroke-width="5"/><path d="M192 265h260" stroke="#888875" stroke-width="3"/>`, ['도시의 불빛이 닿지 않는 길 끝에 작은 마을이 나타난다.', '고쳐 쓴 지붕 아래로 저녁 불빛이 새어 나온다.', '이곳에도 지켜야 할 일상과, 도움이 필요한 사람들이 있다.']);
  add('merchant', '떠돌이 상인', '#e6bc77', `<path d="M233 239V138h192v101Z" fill="#384647"/><path d="m218 144 26-45h168l27 45Z" fill="#687260" stroke="#a4ac84"/><path d="M241 144h172M279 101l-10 41M359 100l10 42" stroke="#b2b58c" stroke-width="4"/><circle cx="259" cy="244" r="23" fill="#1c2933" stroke="#8a927d" stroke-width="5"/><circle cx="401" cy="244" r="23" fill="#1c2933" stroke="#8a927d" stroke-width="5"/><path d="M280 229v-38h34v38m14 0v-49h39v49" fill="#755e42" stroke="#a29471"/>`, ['길목에서 낡은 바퀴 구르는 소리가 들린다.', '짐수레 위에 병과 장비, 정체 모를 물건들이 흔들린다.', '상인은 천을 걷으며 손짓한다. 물건의 가치는 직접 판단할 몫이다.']);
  add('tower', '감시탑', '#a0ded7', `<path d="m275 281 22-183h62l23 183M287 226h82M296 154h64M287 226l73-72m-63 0 72 72m-82 0 95 55m-13-55-94 55" fill="none" stroke="#738995" stroke-width="6"/><path d="M284 99V65h89v34Z" fill="#344c59" stroke="#819ca4"/><path d="M328 65V25m-27 15 54 5m-42-16 30 22" stroke="#9ab7ba" stroke-width="3"/><circle class="ec-glow" cx="328" cy="27" r="5" fill="#a6f5e6"/>`, ['산등성이 위로 낡은 통신탑이 모습을 드러낸다.', '부식된 철골 사이로 사방의 지형이 보인다.', '위까지 오를 수 있다면, 다음 길을 더 멀리 내다볼 수 있을 것이다.']);

  scenes.vein = { ...scenes.crystal, title: '코어 광맥', lines: ['천장에 고드름처럼 돋아난 결정들이 빛난다.', '괴수 코어가 굳어 생긴 광맥이다. 발치에도 작은 조각들이 흩어져 있다.', '캐는 소리는 멀리 울릴 것이다. 얼마나 가져갈지 정해야 한다.'] };
  const siteMap = { spring: 'spring', remains: 'pack', altar: 'altar', ruin: 'ruin', outpost: 'outpost', village: 'village', merchant: 'merchant', tower: 'tower', oldcity: 'ruin', truth: 'mural', hermit: 'camp', leyline: 'crystal' };
  let serial = 0;
  const art = (id, step = 0) => {
    const s = scenes[id]; if (!s) return '';
    if (s.render) return s.render(step);
    // 승인한 사건·탐색 원화. 기존 장면 문장·선택·판정·다시 보기 흐름은 유지한다.
    if (["pack", "pool", "survivor", "altar", "wall", "trail", "echo", "crystal", "fork", "spring", "chest", "trap", "hunter", "nest", "mural", "camp", "boss_door", "ruin", "outpost", "village", "merchant", "tower", "vein"].includes(id)) return `<img class="ec-art ec-shot-${step}" src="assets/explore/${id}.webp?v=webtoon-1" width="1280" height="720" alt="${s.title}" decoding="async" draggable="false" style="object-fit:cover">`;
    const n = `ec${++serial}`;
    return `<svg class="ec-art ec-shot-${step}" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${s.title}"><defs><radialGradient id="${n}light"><stop stop-color="${s.color}" stop-opacity=".24"/><stop offset="1" stop-color="#07101c"/></radialGradient><linearGradient id="${n}floor" x2="0" y2="1"><stop stop-color="#253142"/><stop offset="1" stop-color="#080e19"/></linearGradient></defs><rect width="640" height="360" fill="#07101c"/><rect width="640" height="360" fill="url(#${n}light)"/><g class="ec-far"><path d="M0 0h640v72L544 53l-57 69-31-72-88 5-40-35-89 49-47-25-65 68L58 66 0 121Z" fill="#0b1422"/><path d="M0 251 135 214 247 234 361 220 502 211 640 258v102H0Z" fill="url(#${n}floor)"/><path d="m32 320 201-57m183 0 194 64M95 286l445 5M173 252l312 1" stroke="#344352" stroke-opacity=".35"/></g><g class="ec-subject">${s.art}</g><g class="ec-mist"><ellipse cx="240" cy="282" rx="280" ry="18" fill="${s.color}" opacity=".045"/><ellipse cx="520" cy="266" rx="190" ry="14" fill="${s.color}" opacity=".06"/></g><g class="ec-dust" fill="${s.color}">${Array.from({ length: 18 }, (_, i) => `<circle cx="${63 + (i * 107) % 520}" cy="${45 + (i * 43) % 240}" r="${i % 3 ? 1 : 1.6}" opacity="${.15 + (i % 4) * .1}"/>`).join('')}</g><g class="ec-near"><path d="M0 0h43l34 61-23 65 36 91-25 143H0ZM640 0h-41l-34 80 19 75-28 95 34 110h50Z" fill="#050c16"/><path d="m0 331 86-32 57 32 44-12 41 41H0Zm640-20-68-24-45 41-49-7-29 39h191Z" fill="#060c16"/>${person(130, 326, .64)}<path d="m133 267 103-61-83 83Z" fill="#d1ebd8" opacity=".035"/></g></svg>`;
  };
  let active = null;
  let owner = null;
  let seen = new Set();
  const finish = (restore = true) => {
    if (!active) return;
    const a = active; active = null;
    a.el.remove(); document.removeEventListener('keydown', a.key, true);
    a.hidden.forEach(([el, inert, aria]) => {
      if (!inert) el.removeAttribute('inert');
      if (aria == null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', aria);
    });
    document.body.classList.remove('ec-playing');
    if (restore) {
      const target = a.focus && a.focus.isConnected && a.focus !== document.body ? a.focus : document.querySelector('#pro-scene [data-act="pro-choice"], #dlg button, #modal-box [data-act]');
      if (target) target.focus();
    }
  };
  const show = (id, replay = false) => {
    const s = scenes[id]; if (!s) return;
    if (!replay && window.TUT_AUTO_TAP) return;
    if (owner !== G.player) { owner = G.player; seen = new Set(); }
    if (!replay && seen.has(id)) return;
    finish(false); seen.add(id);
    const el = document.createElement('section');
    el.className = 'ec-screen' + (s.prologue ? ' pc-screen' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `${s.title} · ${s.prologue ? '프롤로그' : '탐색'} 컷씬`);
    el.style.setProperty('--ec-color', s.color);
    const focus = document.activeElement;
    const hidden = ['app', 'modal', 'dlg', 'coach-pop', 'party-chatter'].map((key) => document.getElementById(key)).filter(Boolean).map((node) => {
      const state = [node, node.hasAttribute('inert'), node.getAttribute('aria-hidden')]; node.setAttribute('inert', ''); node.setAttribute('aria-hidden', 'true'); return state;
    });
    const paint = () => {
      const a = active; if (!a) return;
      const last = s.lines.length - 1;
      el.innerHTML = `<header class="ec-header"><span>게이트 크로니클 <i>／</i> ${s.prologue ? '각성 전야' : '탐색 기록'}</span><button type="button" class="ec-skip">건너뛰기</button></header><div class="ec-stage">${art(id, a.step)}<div class="ec-shade"></div><div class="ec-caption"><span class="ec-kicker">${(s.beatLabels || ['발견', '단서', '결정의 순간'])[a.step]}</span><h2>${s.title}</h2><p aria-live="polite">${s.lines[a.step]}</p></div></div><footer class="ec-footer"><div class="ec-progress" aria-label="${a.step + 1} / ${s.lines.length} 장면">${s.lines.map((_, i) => `<i class="${i <= a.step ? 'on' : ''}"></i>`).join('')}<span>${a.step + 1} / ${s.lines.length}</span></div><button type="button" class="ec-next">${a.step === last ? '행동 선택하기' : '다음 장면'} <span aria-hidden="true">→</span></button></footer>`;
      el.querySelector('.ec-skip').onclick = () => finish();
      el.querySelector('.ec-next').onclick = () => { if (active.step === last) finish(); else { active.step++; paint(); } };
      el.querySelector('.ec-next').focus();
    };
    const key = (ev) => {
      if (!active) return;
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); finish(); }
      else if (ev.key === 'Tab') {
        ev.preventDefault();
        const buttons = [...el.querySelectorAll('button')]; const i = buttons.indexOf(document.activeElement);
        buttons[(i + (ev.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      } else if ((ev.key === 'Enter' || ev.key === ' ') && !ev.repeat) {
        ev.preventDefault(); ev.stopImmediatePropagation();
        (el.contains(document.activeElement) ? document.activeElement : el.querySelector('.ec-next')).click();
      } else ev.stopImmediatePropagation();
    };
    active = { el, id, step: 0, focus, hidden, key };
    document.body.appendChild(el); document.body.classList.add('ec-playing'); document.addEventListener('keydown', key, true); paint();
  };
  const decorate = (id) => {
    const box = document.getElementById('modal-box');
    if (!scenes[id] || !box || box.querySelector('.ec-preview')) return;
    const preview = document.createElement('div'); preview.className = 'ec-preview'; preview.style.setProperty('--ec-color', scenes[id].color);
    preview.innerHTML = `${art(id)}<button type="button" data-act="ec-replay" data-v="${id}">컷씬 다시 보기 <span aria-hidden="true">↗</span></button>`;
    box.insertBefore(preview, box.firstChild);
  };
  return { scenes, siteMap, art, show, finish, decorate, get active() { return active; } };
})();

{
  // 가장 마지막에 감싸서 리더 결정·주사위 판정 등 기존 탐색 흐름과 함께 작동한다.
  const baseModal = UI.modal;
  UI.modal = function (...args) { ExploreCinema.finish(false); return baseModal.apply(this, args); };
  const baseClose = UI.closeModal;
  UI.closeModal = function (...args) { ExploreCinema.finish(false); return baseClose.apply(this, args); };
  const baseHeld = UI.tutHeld;
  UI.tutHeld = function (...args) { return !!ExploreCinema.active || baseHeld.apply(this, args); };
  const baseGate = UI.gateEvent;
  UI.gateEvent = function (...args) {
    const r = baseGate.apply(this, args); const ev = this.ctx && this.ctx.run && this.ctx.run.ev;
    if (ev) { ExploreCinema.decorate(ev.id); ExploreCinema.show(ev.id); } return r;
  };
  const baseExplore = UI.showExplore;
  UI.showExplore = function (node, ...args) {
    const r = baseExplore.call(this, node, ...args);
    // 리더 대화는 별도 대화창이므로 컷씬을 마치면 그 대화창으로 돌아간다.
    if (!this.dlg) ExploreCinema.decorate(node.id);
    ExploreCinema.show(node.id); return r;
  };
  const baseSite = UI.showSite;
  UI.showSite = function (id, ...args) {
    const r = baseSite.call(this, id, ...args); const site = G.siteById(id);
    if (site) { const scene = ExploreCinema.siteMap[site.kind]; ExploreCinema.decorate(scene); ExploreCinema.show(scene); } return r;
  };
  const baseRest = UI.gateRest;
  UI.gateRest = function (...args) { const r = baseRest.apply(this, args); ExploreCinema.decorate('spring'); ExploreCinema.show('spring'); return r; };
  const baseChoice = UI.ckGateEventHtml;
  UI.ckGateEventHtml = function (ev) { return `${ExploreCinema.scenes[ev.id] ? `<div class="ec-preview" style="--ec-color:${ExploreCinema.scenes[ev.id].color}">${ExploreCinema.art(ev.id)}<button type="button" data-act="ec-replay" data-v="${ev.id}">컷씬 다시 보기 ↗</button></div>` : ''}${baseChoice.call(this, ev)}`; };
  const baseHandle = UI.handle;
  UI.handle = function (act, v, ...args) {
    if (act === 'ec-replay') return ExploreCinema.show(v, true);
    if (ExploreCinema.active) return; // 컷씬 뒤의 선택지가 먼저 실행되지 않게 한다.
    return baseHandle.call(this, act, v, ...args);
  };
}
