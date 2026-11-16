// ===== 스킬 이름·직업 → 이펙트 연출 고르기 + 전투 연결 (사용자 요청) =====
// 고르는 순서: ① 스킬 이름의 낱말(화살·검기·권·창·탄·부적·저주·용·유성…) → ② 스킬이 속한 직업의 기본 모양 → ③ 괴수는 생김새 → ④ 마법구.
// 색만 바꾸는 꾸밈: 피·혈 → 붉은 피, 빙·서리 → 얼음, 독·산 → 독.
// 전투 연결: 전투 기록의 cast·dmg·aoe·heal·buff·summon 사건을 받아 js/fx_forms.js 의 연출을 튼다.
// 옛 입자 효과(js/fx3d.js)는 새 연출이 켜져 있으면 쉬게 한다(설정의 높음·낮음·끄기는 그대로 쓴다).
const FXMAP = (() => {
  // 이름 규칙: [정규식, 모양, {덧붙임}] — 위에서부터 먼저 맞는 것. keep: 이 직업 기본 모양이면 규칙을 건너뛴다
  const NAME = [
    [/방패/, 'shield'],
    [/(의 검|저주의 검|검$)/, 'slash', { keep: ['fist', 'thrust', 'stab', 'claw', 'cleave'] }],
    [/송곳/, 'ground'],
    [/(화살|삼시|천궁|일제사격)/, 'arrow'],
    [/(저격|헤드샷|일격필살|조준|철갑탄|레일)/, 'bullet', { type: 'crit' }],
    [/(사격|난사|연사|드로우|데스페라도|도탄|[가-힣]탄$|탄 )/, 'bullet', { keep: ['orb', 'spirit', 'bomb', 'shield'] }],
    [/(플라스크|포션|영약|엘릭서|진액)/, 'bomb', { flask: true }],
    [/(폭탄|폭약|수류탄|장약|투척|폭발|폭렬|자폭)/, 'bomb', { keep: ['psychic', 'talisman'] }],
    [/(폭격|유성|운석|낙하|강하|화산탄)/, 'meteor'],
    [/(만검|검우|검의 비)/, 'swords'],
    [/(화룡|흑룡|청룡|용의|드래곤)/, 'dragon'],
    [/(불새|쌍익|날개|깃털)/, 'bird'],
    [/(뼈|해골|시체)/, 'bone'],
    [/(시간|회귀|가속|잔상|인과)/, 'clock'],
    [/(손아귀|천수|촉수)/, 'hands'],
    [/(독무|안개|연막|늪|포자|산독|분사|장막)/, 'cloud'],
    [/(균열|차원|공간|단층|절단|도약|점멸|위상|문틈|문 닫)/, 'rift'],
    [/(부적|[가-힣]부$|오행|오뢰|팔괘)/, 'talisman'],
    [/(저주|낙인|악담|고독|매듭|인형|쇠약|역병|각인|성흔|사슬|속박|봉인|결박|살 날리기)/, 'curse'],
    [/(염동|정신|환청|교란|악몽|공포|중력|비틀기|압착|파동|공명|펄스|사고)/, 'psychic'],
    [/(발톱|찢기|할퀴|협공|무리 사냥)/, 'claw'],
    [/(물어뜯|이빨|송곳니|독니|포식|삼키)/, 'bite'],
    [/(광선|열선|시선|응시|백열|꿰기|투시)/, 'beam'],
    [/(심판|단죄|천벌|빛기둥|세례|낙뢰|천뢰|벼락|신내림|강림|성광)/, 'smite'],
    [/(지진|대지|분화|용암|뿌리|가시|넝쿨|덩굴|융기|거목|발걸음|진각)/, 'ground'],
    [/(노래|선율|교향|화음|합창|협주|서사시|독경|일갈|포효)/, 'note'],
    [/(정령|원귀|망령|망자|백귀|영혼|분신|군세|군단|드론|괴수 호출|짐승)/, 'spirit'],
    [/(내려찍|분쇄|육참|도끼)/, 'cleave'],
    [/(권$|권 |주먹|철산고|연타|장풍|강타|일격$|박치기|나한)/, 'fist', { keep: ['shield', 'slash'] }],
    [/(창$|창 |찌르기|투창)/, 'thrust', { keep: ['stab'] }],
    [/(단검|암살|기습|습격|급소|목줄|처형|연살)/, 'stab'],
    [/(베기|참$|검기|검강|발도|일섬|섬광|쌍월|교차|일검|검무|난무)/, 'slash', { keep: ['fist', 'thrust', 'stab', 'claw', 'whirl', 'cleave'] }],
    [/(선풍|회전|회선|화륜|폭풍|회오리|소용돌이|스텝|군무)/, 'whirl'],
  ];
  const PAL = [[/(피의|혈|출혈)/, 'blood'], [/(빙|얼음|서리|한기|냉기|눈보라|동결)/, 'ice'], [/(독|산성|부식)/, 'poison']];
  // 직업 기본 모양 (직업 이름 기준)
  const CLS = { '검사': 'slash', '광전사': 'cleave', '창술사': 'thrust', '무도가': 'fist', '쌍검사': 'slash', '수도사': 'fist', '방패 기사': 'shield', '성기사': 'slash', '거인화 능력자': 'fist', '암흑기사': 'slash', '수목 수호자': 'ground', '용암 방패': 'shield', '암살자': 'stab', '도적': 'stab', '독술사': 'stab', '그림자술사': 'rift', '궁수': 'arrow', '저격수': 'bullet', '총잡이': 'bullet', '폭파술사': 'bomb', '원소술사': 'orb', '흑마법사': 'orb', '결계사': 'orb', '시공술사': 'clock', '퇴마사': 'talisman', '저주술사': 'curse', '화염술사': 'orb', '소환사': 'spirit', '사령술사': 'bone', '테이머': 'claw', '정령사': 'spirit', '불새 소환사': 'bird', '치유사': 'smite', '사제': 'smite', '음유시인': 'note', '연금술사': 'bomb', '승려': 'fist', '성녀': 'smite', '암흑사제': 'curse', '드루이드': 'claw', '불꽃 무희': 'whirl', '염동력자': 'psychic', '정신 감응자': 'psychic', '순간이동자': 'rift', '예지자': 'psychic', '발화능력자': 'beam', '무당': 'spirit', '도사': 'talisman', '검무사': 'slash', '주술사': 'curse', '레인저': 'arrow', '로그': 'stab', '감지 능력자': 'psychic', '투시 능력자': 'beam', '패스파인더': 'orb', '흑염검사': 'slash', '심연의 사도': 'rift', '기계 교감자': 'bullet', '문지기': 'shield', '대붕괴의 아이': 'psychic' };
  const SHAPE = { beast: 'claw', dragon: 'bite', slime: 'orb', swarm: 'stab', golem: 'fist', ghost: 'spirit', eye: 'beam', drone: 'bullet', spider: 'stab', flyer: 'claw', humanoid: 'slash', mimic: 'bite', core: 'beam' };
  const skillByName = {}; let indexed = false;
  const index = () => { if (indexed || typeof SKILLS === 'undefined') return; indexed = true; for (const s of SKILLS) if (s.name && !skillByName[s.name]) skillByName[s.name] = s; };
  const clsName = (id) => { try { const c = id && typeof classById === 'function' && classById(id); return c ? c.name : ''; } catch (e) { return ''; } };
  // 스킬 이름 + 시전 유닛 → { form, pal, type, flask }
  function recipe(name, unit) {
    index(); const sk = name ? skillByName[name] : null;
    const cn = clsName(sk && sk.cls && sk.cls !== 'monster' ? sk.cls : unit && unit.cls);
    const base = CLS[cn] || (unit && unit.side === 'enemy' && SHAPE[unit.shape]) || (unit && unit.shape && SHAPE[unit.shape]) || null;
    const out = { form: base || 'orb', type: sk ? sk.type : 'dmg', flask: cn === '연금술사', src: CLS[cn] ? 'class' : base ? 'shape' : 'fallback' };
    if (name) { for (const [re, form, x] of NAME) { if (!re.test(name)) continue; if (x && x.keep && base && x.keep.includes(base)) continue; out.form = form; out.src = 'name'; if (x && x.type && out.type === 'dmg') out.type = x.type; if (x && x.flask) out.flask = true; break; } for (const [re, pal] of PAL) if (re.test(name)) { out.pal = pal; break; } }
    return out;
  }

  // ---------- 전투 연결 ----------
  const mode = () => { try { return typeof FX3D !== 'undefined' && FX3D.opt ? FX3D.opt.mode : (JSON.parse(localStorage.getItem('gc_fx3d_v1') || '{}').mode || 'high'); } catch (e) { return 'high'; } };
  const active = () => mode() !== 'off' && typeof FXF !== 'undefined' && FXF.ready();
  function setup() {
    if (typeof FXG === 'undefined' || typeof UI === 'undefined' || !UI.applyEvent) return;
    const reduced = () => typeof FX !== 'undefined' && FX.reduced;
    FXG.S.quality = () => (mode() === 'low' ? 0.55 : 1) * (reduced() ? 0.5 : 1);
    FXG.S.bloom = () => mode() !== 'low';
    FXG.S.speed = () => { const c = UI.ctx; return c && c.combat ? ((c.speed || 1) > 1 ? 1.8 : 1) * (c.combat.auto ? 1.5 : 1) : 1; };
    const at = (el) => { if (!el) return null; const h = el.querySelector ? (el.querySelector('.fx-host') || el) : el; const r = h.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height } : null; };
    const unitEl = (id) => document.getElementById('u-' + id);
    const sideArea = (side) => at(document.getElementById(side === 'enemy' ? 'foes' : 'allies'));
    // 그로기 표시 상태에 기존 기절용 별 연출을 동기화한다.
    const baseBreaks = UI.drawBreaks;
    if (baseBreaks) UI.drawBreaks = function (...args) {
      const r = baseBreaks.apply(this, args); const c = this.ctx;
      if (!c || !c.combat) return r;
      for (const u of c.combat.units) {
        const el = unitEl(u.id); if (!el) continue;
        const visible = () => this.ctx === c && el.isConnected && u.alive &&
          el.classList.contains('groggy') && mode() !== 'off';
        if (!visible()) {
          if (el._groggyStars) el._groggyStars.life = 0;
          el._groggyStars = null;
          continue;
        }
        if ((!el._groggyStars || el._groggyStars.life === 0) && active()) {
          const pos = at(el);
          if (pos) el._groggyStars = FXF.stars(pos, () => visible() ? at(el) : null);
        }
      }
      return r;
    };
    const hushOld = () => { if (typeof FX3D !== 'undefined' && !FX3D._hushed) { FX3D._hushed = true; const on = FX3D.on; FX3D.on = function () { return active() ? false : on.call(this); }; } if (FXG.S.cv && FXG.S.cv.style.zIndex !== '26') FXG.S.cv.style.zIndex = '26'; };
    const vt = (t) => (t === 'crit' || t === 'pierce' || t === 'multi' || t === 'stun' ? t : 'dmg');
    const base = UI.applyEvent;
    // 고등급 연출은 맞는 순간이 늦다(A 0.35초·S 0.45초·SS 0.65초쯤). 피해 숫자가 먼저 뜨지 않게 첫 피해 표시를 그만큼 늦추고,
    // 전투 재생(UI.play)이 다음 사건을 그만큼 기다리게 대기 시간을 돌려준다.
    const hitMs = (tier) => (tier >= 7 ? 650 : tier >= 6 ? 450 : 350) / Math.max(0.5, FXG.S.speed());
    const playMul = () => { const c = this.ctx || UI.ctx; return (c && c.combat && c.combat.auto ? 0.55 : 1) * (typeof FX !== 'undefined' && FX.reduced ? 0.6 : 1); };
    UI.applyEvent = function (l) {
      const ev0 = l && l.ev, c0 = this.ctx, cast0 = this._fxf;
      if (ev0 && ev0.k === 'dmg' && c0 && c0.combat && cast0 && cast0.sig && !cast0.aoe && !cast0.shots && (ev0.src == null || ev0.src === cast0.src) && active()) {
        // 연출은 지금 시작하고, 피해 표시(기본 처리)는 맞는 순간에
        const ms = hitMs(cast0.tier); let done = false;
        const to = at(unitEl(ev0.dst)), from = at(unitEl(cast0.src));
        if (to) { cast0.shots = 1; hushOld(); FXS.run(cast0.sig, 'hit', { f: from, t: to, e: ev0.elem || cast0.elem || 'none', tier: cast0.tier }); }
        setTimeout(() => { if (done || this.ctx !== c0) return; done = true; try { base.call(this, l); } catch (e) { /* 무시 */ } }, ms);
        return Math.round(ms / playMul()) + 430;
      }
      const r = base.call(this, l);
      const ev = l && l.ev, c = this.ctx;
      if (!ev || !c || !c.combat) return r;
      try {
        if (!active()) return r; hushOld();
        const unit = (id) => c.combat.units.find((u) => u.id === id);
        if (ev.k === 'cast') {
          const rec = recipe(ev.name, unit(ev.src)); index(); const sk = ev.name ? skillByName[ev.name] : null;
          // A급 이상 스킬은 고유 연출(js/fx_sig.js), S·SS 는 시전자 발밑 등급 연출도 붙는다
          const sig = typeof FXS !== 'undefined' && ev.name && FXS.has(ev.name) ? ev.name : null, tier = sk ? sk.rankReq || 0 : 0;
          this._fxf = { src: ev.src, elem: ev.elem, side: ev.side, rec, type: rec.type, shots: 0, aoe: false, sig, tier, sups: 0 };
          if (sig && tier >= 6 && tier < 90) { const f = at(unitEl(ev.src)); if (f) FXS.K.tier(tier, f, FXG.el(ev.elem || 'none')); }
          return r;
        }
        const cast = this._fxf || {}; const e = ev.elem || cast.elem || 'none';
        if (ev.k === 'aoe') {
          const tside = ev.side === 'ally' ? 'enemy' : 'ally'; const pts = c.combat.units.filter((u) => u.side === tside && u.alive).map((u) => at(unitEl(u.id))).filter(Boolean);
          if (cast.sig && FXS.run(cast.sig, 'aoe', { f: at(unitEl(cast.src)), a: sideArea(tside), s: pts, e, tier: cast.tier })) { cast.aoe = true; return r + Math.round(hitMs(cast.tier) / playMul()); } // 피해 숫자는 연출이 떨어진 뒤에
          const rec = cast.rec || { form: 'orb' }; FXF.playAoe(rec.form, at(unitEl(cast.src)), sideArea(tside), pts, { el: e, pal: rec.pal, type: 'aoe', flask: rec.flask }); cast.aoe = true; return r;
        }
        if (ev.k === 'dmg') {
          const src = ev.src != null ? ev.src : cast.src; const to = at(unitEl(ev.dst)), from = at(unitEl(src)); if (!to) return r;
          if (cast.aoe && cast.src === src) return r; // 전체 공격은 이미 대상마다 터뜨렸다
          const mine = cast.src === src, rec = mine && cast.rec ? cast.rec : recipe('', unit(src)), t = mine ? cast.type : 'dmg';
          const dst = unit(ev.dst), edge = dst && UI.elemEdge ? UI.elemEdge(ev.elem, dst.elem) : 0;
          if (mine && cast.sig) { // 고유 연출: 첫 타에만 전체 연출, 이어지는 타는 작은 속성 타격
            if (cast.shots++) { FXF.accent(rec.pal || e, to.x + (Math.random() - 0.5) * 16, to.y + (Math.random() - 0.5) * 16, 0.45); return r; }
            if (FXS.run(cast.sig, 'hit', { f: from, t: to, e, tier: cast.tier })) return r;
          }
          if (t === 'multi' && cast.shots++) { FXF.accent(rec.pal || e, to.x + (Math.random() - 0.5) * 16, to.y + (Math.random() - 0.5) * 16, 0.45); return r; }
          FXF.play(rec.form, from || { x: to.x, y: to.y + 240 }, to, { el: e, pal: rec.pal, type: vt(t), big: !!ev.crit, flask: rec.flask });
          if (ev.crit) FXG.at(0.2, () => FXG.shake(4, 180));
          if (edge > 0) FXG.at(0.25, () => { FXG.p('ring', to.x, to.y, { s: [40, 170], c: ['#fff6c8', '#ffd166'], life: 0.35, pop: true }); FXG.burst('star4', to.x, to.y, 5, { v: [120, 260], sz: [18, 30, 4], c: ['#fff6c8', '#ffd166'], life: [0.3, 0.5] }); });
          if (edge < 0) FXG.at(0.2, () => FXG.burst('spark', to.x, to.y, 8, { v: [200, 420], sz: [12, 20, 2], asp: 0.3, face: true, c: ['#dbe6f5', '#7f8ea6'], life: [0.2, 0.35] }));
          if (t === 'drain') setTimeout(() => FXF.drain(to, from, e), 260);
          if (t === 'dot' || t === 'debuff') setTimeout(() => { FXF.support('linger', to, rec.pal || e); if (t === 'debuff') FXF.support('debuff', to, e); }, 300);
          if (t === 'stun' && rec.form !== 'fist') setTimeout(() => FXF.stars(to), 300);
          return r;
        }
        const p = at(unitEl(ev.dst)); if (!p) return r; const t = cast.type;
        if (cast.sig && ev.k !== 'mp' && FXS.run(cast.sig, 'sup', { f: at(unitEl(cast.src)), t: p, e: cast.elem || 'none', i: cast.sups++ })) return r;
        if (ev.k === 'heal') FXF.support(ev.revive ? 'revive' : 'heal', p, cast.elem);
        else if (ev.k === 'mp') FXF.support('mp', p);
        else if (ev.k === 'buff') FXF.support(t === 'taunt' ? 'taunt' : t === 'evade' ? 'evade' : /shield/.test(t || '') ? 'shield' : /debuff/.test(t || '') ? 'debuff' : 'buff', p, cast.elem, { all: /_all/.test(t || '') });
        else if (ev.k === 'summon') FXF.support('summon', p, cast.elem);
      } catch (err) { /* 연출 실패는 전투에 영향을 주지 않는다 */ }
      return r;
    };
    // 설정의 '이펙트 미리 보기'도 새 연출로
    const baseModal = UI.modal;
    UI.modal = function (...a) { const r = baseModal.apply(this, a); try { if (typeof FX3D !== 'undefined' && UI.fxPreviewPlay && !UI._fxfPv) { UI._fxfPv = true; const old = UI.fxPreviewPlay; UI.fxPreviewPlay = function (t, e) { if (!active()) return old.call(this, t, e); hushOld(); const foes = [...document.querySelectorAll('#fxpv-foes i')], me = document.querySelector('#fxpv-me i'); const to = at(foes[1]), from = at(me), area = at(document.getElementById('fxpv-foes')); const forms = { fire: 'orb', bolt: 'thrust', water: 'arrow', wood: 'claw', holy: 'slash', dark: 'curse' }; if (t === 'dmg') FXF.play(forms[e] || 'orb', from, to, { el: e }); else if (t === 'aoe') FXF.playAoe('orb', from, area, foes.map(at).filter(Boolean), { el: e }); else if (t === 'drain') { FXF.play('slash', from, to, { el: e }); setTimeout(() => FXF.drain(to, from, e), 260); } else if (t === 'dot') { FXF.play('orb', from, to, { el: e }); setTimeout(() => FXF.support('linger', to, e), 300); } else if (t === 'heal') FXF.support('heal', from, e); else FXF.support('shield', from, e); }; } } catch (e) { /* 무시 */ } return r; };
  }
  setup();
  return { recipe, NAME, CLS, SHAPE };
})();
