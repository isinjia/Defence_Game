// 오더 반응 (사용자 요청)
// 1. 오더를 낸 리더가, 받은 사람이 따랐는지 무시했는지에 성격대로 반응한다.
//    - 플레이어가 NPC 리더의 오더를 따르거나 무시하면 리더가 늘 한마디 한다(내 행동에 대한 피드백).
//    - NPC 동료가 따르거나 무시하면 가끔(따름 35% · 무시 70%) 한마디.
// 2. 플레이어가 리더로 오더를 내리면 받은 동료가 성격대로 대답한다(따를 때도 늘 대답. 전에는 30%만).
// 3. 같은 사람이 같은 순간에 두 번 말하지 않게 바로 앞 말과 겹치면 한 번만.
// 4. 능글맞은 성격(smooth)의 "에이, 형님 왜 그러세요~"는 누구에게 하는 말인지 없이 아무 때나 나와(선임·리더가 말해도) 어색했다 → 상황 없는 말로.
{
  const V2 = (plain, polite) => ({ plain, polite });
  const LEAD = {
    obey: {
      kind: V2(['좋아, {n}! 고마워.', '그렇지, 잘했어.'], ['잘했어요, {n} 씨!', '고마워요, 딱 좋아요.']),
      just: V2(['좋다, 그대로 가.', '정확하다.'], ['좋습니다. 그대로 가십시오.', '정확합니다.']),
      cold: V2(['…됐다.', '그거면 된다.'], ['…됐습니다.', '그거면 됩니다.']),
      warlike: V2(['그거지! 밀어붙여!', '좋아, 계속 가!'], ['그거예요! 밀어붙여요!', '좋아요, 계속 가요!']),
      greedy: V2(['좋아, 그래야 남는 게 있지.', '깔끔하네.'], ['좋아요, 그래야 남는 게 있죠.', '깔끔하네요.']),
    },
    ignore: {
      kind: V2(['괜찮아, 다음엔 맞춰 줘.', '{n}, 내 말도 좀 들어 줘.'], ['괜찮아요, 다음엔 맞춰 줘요.', '{n} 씨, 제 말도 좀 들어 줘요.']),
      just: V2(['{n}! 오더를 들어.', '멋대로 움직이지 마.'], ['{n} 씨, 오더를 따르십시오.', '멋대로 움직이지 마십시오.']),
      cold: V2(['…기억해 두지.', '오더를 무시했군.'], ['…기억해 두겠습니다.', '오더를 무시했군요.']),
      warlike: V2(['야, {n}! 내 말 안 들려?!', '마음대로 할 거면 빠져!'], ['{n} 씨! 제 말 안 들려요?!', '마음대로 할 거면 빠져요!']),
      greedy: V2(['그러다 손해 보면 네 몫에서 깐다.', '말 안 듣네.'], ['그러다 손해 보면 몫에서 뺄게요.', '말을 안 듣네요.']),
    },
  };
  // 동료가 내(플레이어) 오더를 따를 때 기본 대답 (성격 줄이 없을 때)
  const OK = { kind: ['네, 맡겨 주세요!', '알겠어요!'], just: ['알겠다!', '그대로 하지.'], cold: ['…알았다.', '합리적이군.'], warlike: ['좋아, 간다!', '맡겨!'], greedy: ['좋아요, 대신 몫은 챙겨 줘요.', '오케이~'] };
  const POLITE = ['haeyo', 'hapsyo'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const regOf = (n) => { try { return (n && G.personaRegister && G.personaRegister(n)) || 'haera'; } catch (e) { return 'haera'; } };

  const C = Combat.prototype;
  // 3. 같은 사람이 바로 이어서 두 번 말하지 않게
  const basePush = C.push;
  C.push = function (t, cls, ev) {
    try {
      if (ev && ev.k === 'say' && ev.src != null) {
        const last = this.log[this.log.length - 1];
        if (last && last.ev && last.ev.k === 'say' && last.ev.src === ev.src && this._sayAt === this.actions) return;
        this._sayAt = this.actions;
      }
    } catch (e) { /* 무시 */ }
    return basePush.call(this, t, cls, ev);
  };
  const say = (cb, u, text) => { if (!u || !text) return; cb.push(`${u.name}: "${text}"`, '', { k: 'say', src: u.id, text }); };

  if (C.noteOrder) {
    const baseNote = C.noteOrder;
    C.noteOrder = function (kind, u, o) {
      const r = baseNote.call(this, kind, u, o);
      try {
        if (!o || !u || (kind !== 'obey' && kind !== 'ignore')) return r;
        // 2. 내가 내린 오더 → 받은 동료의 대답
        if (o.by === 'player') {
          if (kind === 'obey' && !u.isPlayer) {
            const last = this.log[this.log.length - 1];
            if (!(last && last.ev && last.ev.k === 'say' && last.ev.src === u.id)) {
              const n = u.npcId != null && G.npcById(u.npcId);
              const line = (n && G.personaOrderLine && G.personaOrderLine(n, true)) || pick(OK[u.pers] || OK.kind);
              say(this, u, line);
            }
          }
          return r;
        }
        // 1. NPC 리더가 낸 오더 → 리더의 반응
        const L = this.units.find((x) => x.id === o.by && x.alive && !x.isPlayer);
        if (!L || L === u) return r;
        const chance = u.isPlayer ? 1 : kind === 'obey' ? 0.35 : 0.7;
        if (Math.random() > chance) return r;
        const set = (LEAD[kind][L.pers] || LEAD[kind].kind);
        const n = L.npcId != null && G.npcById(L.npcId);
        const line = pick(POLITE.includes(regOf(n)) ? set.polite : set.plain).replace(/\{n\}/g, u.isPlayer ? G.player.name : this.shortName ? this.shortName(u) : u.name);
        // 시험 튜토리얼에서는 안내 말풍선이 같은 말을 하므로 전투 기록에는 남기지 않는다
        const c = typeof UI !== 'undefined' ? UI.ctx : null;
        if (u.isPlayer && c && c.kind === 'exam' && c.tutorial && !c.tutorial.boss && (c.tutorial.acted || 0) < 3) return r;
        say(this, L, line);
      } catch (e) { /* 무시 */ }
      return r;
    };
  }

  // 4. 능글맞음: 상황 없는 "형님" 말 바꾸기
  try {
    if (typeof PERSONAS !== 'undefined' && PERSONAS.smooth) {
      const S = PERSONAS.smooth;
      const fix = (arr) => (Array.isArray(arr) ? arr.map((s) => s.replace('에이, 형님 왜 그러세요~ 저 큰 놈은 같이 가야죠.', '에이~ 저 큰 놈은 다 같이 가야죠.').replace('에이, 형님 왜 그러세요~', '에이~ 다들 얼굴 좀 풀어요~')) : arr);
      for (const k of Object.keys(S)) S[k] = fix(S[k]);
    }
    if (typeof PERSONA_COUNCIL !== 'undefined' && PERSONA_COUNCIL.smooth) PERSONA_COUNCIL.smooth = PERSONA_COUNCIL.smooth.map((s) => s.replace('에이, 형님~ 거긴 좀 아니지 않아요?', '에이~ 거긴 좀 아니지 않아요?'));
  } catch (e) { /* 무시 */ }
}
