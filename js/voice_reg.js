// ===== 말투 맞추기: 한 인물은 장면 내내 한 말투 (영역 D) =====
// 말투의 기준은 C의 성격별 말투표 하나뿐이다 (persona_voice.js: G.personaRegister(n) → haera·banmal·short·haeyo·hapsyo·hao·hage).
// 튜토리얼 리더 대사(leadSay·examMapSay)는 C의 G.personaVoice가 맡는다. 여기는 D의 나머지 대사 틀
// (첫 칸 상의·첫 팀 제안·집결·소속 권유 등, 열: just/kind/cold/warlike/greedy)이 그 말투표를 따르게 잇는 다리다.
//  voiceKey(n) → 'just' | 'kind' | 'cold' | 'warlike' | 'greedy' | 'hao' | 'hapsyo'   (hao·hapsyo 줄을 따로 쓴 틀에서 사용)
//  voiceCol(n) → 위에서 hao·hapsyo 줄이 없는 틀용: hapsyo → kind(존댓말), hao → just
function voiceKey(n) {
  if (!n) return 'just';
  const pers = n.personality || 'just';
  const reg = typeof G !== 'undefined' && G && G.personaRegister ? G.personaRegister(n) : null;
  if (!reg) return pers;
  if (reg === 'haeyo') return 'kind';
  if (reg === 'hapsyo') return 'hapsyo';
  if (reg === 'hao' || reg === 'hage') return 'hao';
  if (reg === 'short') return 'cold';
  return pers === 'warlike' || pers === 'greedy' ? pers : 'just'; // haera · banmal
}
function voiceCol(n) { const k = voiceKey(n); return k === 'hapsyo' ? 'kind' : k === 'hao' ? 'just' : k; }
// 기질 틀 표 T에서 그 사람 말투의 줄. extra = { hao, hapsyo } 줄이 있으면 먼저 쓴다
function voicePick(T, n, extra) {
  const k = voiceKey(n);
  if (extra && extra[k]) return extra[k];
  return (T && (T[k] ?? T[voiceCol(n)] ?? T.just)) || '';
}

// 하오체·합쇼체 줄 (D의 틀 가운데 튜토리얼과 같은 장면에 나오는 것)
const VOICE_EXTRA = {
  go: { hao: '인사는 이쯤 하고 들어갑시다. 내 뒤를 따르시오.', hapsyo: '인사는 여기까지 하겠습니다. 들어갑니다. 제 뒤를 따라 주십시오.' },
  propose: {
    hao: (nm) => `첫 칸은 저 ${nm}이오. 내가 앞장서겠소. 의견이 있으면 지금 말하시오.`,
    hapsyo: (nm) => `첫 칸은 저 ${nm}입니다. 제가 앞장서겠습니다. 의견이 있으면 지금 말씀해 주십시오.`,
  },
  reply: {
    hao: { ok: '좋소. 갑시다. 내 뒤를 따르시오.', force: '반대는 들었소. 그래도 가오. 첫 칸은 훈련용이고, 책임은 내가 지겠소.', persuade: '걱정은 아오. 첫 칸은 훈련용이고, 내가 맨 앞에 서겠소. 함께 갑시다.', say: '고맙소. 뒤는 그대에게 맡기겠소.' },
    hapsyo: { ok: '좋습니다. 출발합니다. 제 뒤를 따라 주십시오.', force: '반대 의견은 들었습니다. 그래도 갑니다. 첫 칸은 훈련용이고, 책임은 제가 집니다.', persuade: '걱정은 압니다. 첫 칸은 훈련용이고, 제가 맨 앞에 서겠습니다. 함께 가시죠.', say: '감사합니다. 뒤를 맡기겠습니다.' },
  },
  ask: {
    hao: (L, slot, t) => `${t.name}의 리더를 맡고 있소. 이름은 ${L.name}. ${slot} 한 자리가 비어 있소. 함께하겠소? 처음 한 해는 내 곁에서 배우시오.`,
    hapsyo: (L, slot, t) => `${t.name} 리더 ${L.name}입니다. ${slot} 한 자리가 비어 있습니다. 함께해 주시겠습니까? 처음 1년은 제 옆에서 배우게 됩니다.`,
  },
  decide: { hao: '이 길로 가겠소. 이유는 나중에 설명하리다.', hapsyo: '이쪽으로 가겠습니다. 이유는 나중에 설명드리겠습니다.' },
  kama: { hao: '자리 하나 내어 줄 수 있소.', hapsyo: '자리 하나 내어 드릴 수 있습니다.' },
};
