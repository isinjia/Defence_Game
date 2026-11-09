// ===== 게이트 크로니클: 도시 화면, 스토리 창, 대회, 돌파, 계승 =====

const FAC_ICON = {
  inn: '<path d="M3 20V9l9-5 9 5v11"/><path d="M7 20v-6h10v6M7 14h10"/>',
  merc: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.5-5 7-5s6 1.5 7 5M16 4l2 2 4-4M17 12h5"/>',
  market: '<path d="M3 9h18l-1.5 11h-15zM8 9V6a4 4 0 0 1 8 0v3"/>',
  board: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tavern: '<path d="M6 3h9v7a4.5 4.5 0 0 1-9 0zM15 5h2a2 2 0 0 1 0 4h-2M8 21h5M10.5 15v6"/>',
  workshop: '<path d="M14 6l4 4-9 9H5v-4zM16 4l4 4"/>',
  archive: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  transit: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>',
  auction: '<path d="M14 4l6 6-3 3-6-6zM11 7l-7 7 3 3 7-7M3 21h10"/>',
  guild: '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/>',
};
const facIcon = (id, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FAC_ICON[id] || ''}</svg>`;

Object.assign(UI, {
  // ---------- 도시 ----------
  citySkyline(reg) {
    const r = FX.rng(FX.hash(reg.id));
    const brk = G.cityBreak(reg.id);
    const gc = reg.guild ? GUILDS[reg.guild].color : '#46e0d0';
    let b = '';
    let x = 0;
    while (x < 400) {
      const w = 14 + r() * 30, h = 30 + r() * (BIG_CITIES.includes(reg.id) ? 110 : 70);
      b += `<rect x="${x.toFixed(0)}" y="${(150 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#0b111b"/>`;
      for (let wy = 150 - h + 6; wy < 146; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 6) if (r() < 0.3) b += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="2" height="3" fill="${r() < 0.2 ? '#ffb547' : '#9fd8ff'}" opacity=".7"/>`;
      x += w + 2;
    }
    const dome = reg.id === 'gangnam' ? '<path d="M60 150A140 120 0 0 1 340 150" fill="none" stroke="#46e0d0" stroke-width="1.5" opacity=".45" stroke-dasharray="6 4"/>' : '';
    return `<svg class="city-sky" viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sk-${reg.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${brk ? '#3a0a14' : '#0b1626'}"/><stop offset="1" stop-color="${brk ? '#a0203a' : gc}" stop-opacity="${brk ? 0.7 : 0.25}"/></linearGradient></defs>
      <rect width="400" height="150" fill="url(#sk-${reg.id})"/>${dome}
      ${brk ? '<ellipse cx="300" cy="40" rx="26" ry="38" fill="none" stroke="#ff4f6a" stroke-width="3" stroke-dasharray="8 5"/><ellipse cx="300" cy="40" rx="10" ry="20" fill="#ff4f6a" opacity=".6"/>' : ''}
      ${b}</svg>`;
  },
  openCity(fac) {
    const city = G.onCity(); if (!city) return;
    this.cityFac = fac || null;
    this.sheet = 'city';
    this.modal(this.cityHtml(), 'sheet city-box');
    this.sheet = 'city';
  },
  cityHtml() {
    const reg = G.onCity() || G.region(); const p = G.player;
    const facs = FACILITIES.filter((f) => (!f.big || BIG_CITIES.includes(reg.id)) && (!f.guildOnly || reg.guild) && (!f.only || f.only.includes(reg.id)));
    const brk = G.cityBreak(reg.id);
    const rep = G.rep(reg.id);
    const head = `<div class="city-hero">${this.citySkyline(reg)}
      <div class="city-title"><div class="eyebrow">${'◆'.repeat(reg.danger)} 위험도 · ${reg.guild ? GUILDS[reg.guild].name + ' 본부' : '독립 도시'}</div><h2>${reg.name}</h2>
        <div class="small">${G.repLabel(rep)} · 평판 <b class="num">${rep}</b> · 협회 공적 <b class="num">${p.merit}</b> · ${FX.icon('coin', 13)} <b class="num">${fmt(p.money)}</b></div></div>
      <button class="icon-btn city-close" data-act="modal-close" aria-label="도시에서 나가기">×</button></div>
      ${brk ? `<div class="break-banner"><b>게이트 브레이크 발생</b> · 괴수가 시내로 쏟아지고 있다. <button class="danger sm" data-act="break-fight">방어전 참가</button></div>` : ''}`;
    if (!this.cityFac) {
      const npcs = G.npcsHere().filter((n) => !n.isCompanion);
      return `${head}<div class="city-body">
        <div class="fac-grid">${facs.map((f) => `<button class="fac-tile" data-act="city-fac" data-v="${f.id}">${facIcon(f.id, 26)}<b>${f.id === 'guild' ? GUILDS[reg.guild].name : f.name}</b><span class="small dim">${f.desc}</span></button>`).join('')}</div>
        <div class="sec-title sec">이 도시의 각성자 · ${npcs.length}명</div>
        <div class="npc-strip">${npcs.map((n) => `<button class="npc-chip" data-act="sheet" data-v="npc:${n.id}">${this.npcAvatar(n, 40)}<span><b>${n.name}</b><span class="small dim">${RANKS[n.rankIdx].key}급 ${className(n.cls || 'swordsman')} · ${n.met ? relationLabel(n.relation) : '처음 봄'}</span></span></button>`).join('') || '<span class="dim">아무도 없다.</span>'}</div>
      </div>`;
    }
    const f = FACILITIES.find((x) => x.id === this.cityFac);
    return `${head}<div class="city-body"><div class="fac-head"><button class="sm ghost" data-act="city-fac" data-v="">← 시설 목록</button><h3>${facIcon(f.id)} ${f.id === 'guild' ? GUILDS[reg.guild].name : f.name}</h3></div>${this.facilityHtml(f.id, reg)}</div>`;
  },
  facilityHtml(id, reg) {
    const p = G.player; const pm = G.priceMul();
    const price = (v) => `<span class="num">${fmt(v)}</span>`;
    switch (id) {
      case 'inn': return `<div class="panel"><p>깨끗한 캡슐과 에테르 안정 수조. 하룻밤이면 몸이 새것 같다.</p>
        <div class="row"><button class="primary" data-act="inn">${FX.icon('rest')} 5일 숙박 · ${price(G.innCost())} 크레딧</button></div>
        <p class="small dim">체력과 정신력을 모두 회복하고, 부상 기간이 1개월 줄어든다.</p></div>`;
      case 'market': {
        const s = G.getShop();
        const coresOwned = Object.keys(p.mats).filter((k) => p.mats[k] > 0).map((k) => +k.slice(1)).sort((a, b) => a - b);
        return `<div class="cards">
          ${BIG_CITIES.includes(reg.id) ? `<div class="item-row hl"><span class="slot-ico" style="--c:var(--amber)">${facIcon('workshop', 20)}</span><div class="grow"><b>${RANKS[p.rankIdx].key}급 각성 촉매</b> <span class="small dim">보유 ${p.items[G.catalystKey()] || 0}</span><div class="small dim">돌파에 반드시 필요하다. 공방에서 직접 만들면 더 싸다.</div></div><button class="sm" data-act="buy-catalyst">${FX.icon('coin', 13)} ${price(G.catalystPrice() * pm)}</button></div>` : ''}
          ${CONSUMABLES.map((c) => `<div class="item-row"><div class="grow"><b>${c.name}</b> <span class="dim small">보유 ${p.items[c.id] || 0} · ${c.desc}</span></div><button class="sm" data-act="buy-item" data-v="${c.id}">${FX.icon('coin', 13)} ${price(c.price * pm)}</button></div>`).join('')}
          <div class="sec-title sec">장비 · 매달 입고</div>
          ${s.equips.map((it) => this.equipRow(it, `<button class="sm" data-act="buy-equip" data-v="${it.uid}">${FX.icon('coin', 13)} ${price(it.value * pm)}</button>`)).join('') || '<div class="dim">매진</div>'}
          <div class="sec-title sec">괴수 코어 매입</div>
          <div class="small dim">코어 시세는 매달 바뀐다. 브레이크가 터지면 공급이 늘어 떨어지고, 발전소 수요가 몰리면 뛴다.</div>
          ${coresOwned.map((t) => { const tr = G.coreTrend(t); const idx = Math.round(G.world.coreIdx[t] * 100); return `<div class="item-row"><div class="grow"><b>${coreName(t)}</b> ×${p.mats['c' + t]} <span class="small ${tr > 0 ? 'good' : tr < 0 ? 'bad' : 'dim'}">${tr > 0 ? '▲' : tr < 0 ? '▼' : '–'} 시세 ${idx}%</span><div class="small dim">개당 ${fmt(G.corePrice(t))}</div></div><button class="sm ghost" data-act="sell-cores" data-v="${t}">전부 판매 · ${price(G.corePrice(t) * p.mats['c' + t])}</button></div>`; }).join('') || '<div class="dim small">팔 코어가 없다.</div>'}
          <div class="sec-title sec">보유 장비 판매 · 40%</div>
          ${p.inventory.map((it) => this.equipRow(it, `<button class="sm ghost" data-act="sell" data-v="${it.uid}">${price(it.value * 0.4)} 판매</button>`)).join('') || '<div class="dim small">판매할 장비가 없다.</div>'}
        </div>`;
      }
      case 'board': {
        const list = G.board(reg.id);
        const mine = p.quests.filter((q) => q.kind === 'bounty');
        return `<p class="small dim">의뢰는 매달 바뀐다. 완료한 의뢰는 받은 도시의 의뢰소에 보고해야 보상을 받는다. 동시에 4개까지.</p>
          <div class="sec-title">이번 달 게시물</div><div class="cards">${list.map((q) => `<div class="item-row"><span class="slot-ico" style="--c:${RANKS[q.tier].color}">${facIcon('board', 20)}</span>
            <div class="grow"><b>${q.title}</b><div class="small dim">보상 ${fmt(q.money)} 크레딧 · 공적 +${q.merit} · 평판 +${q.repGain} · 기한 ${q.months}개월</div></div>
            ${q.taken ? '<span class="small dim">수락함</span>' : `<button class="sm" data-act="accept-bounty" data-v="${q.id}">수락</button>`}</div>`).join('')}</div>
          <div class="sec-title sec">진행 중인 의뢰</div><div class="cards">${mine.map((q) => `<div class="item-row ${q.status === 'done' || q.type === 'deliver' ? 'hl' : ''}"><div class="grow"><b>${q.title}</b><div class="small dim">${regionById(q.from).name} 의뢰소 · ${this.questStatus(q)}</div></div>
            ${(q.status === 'done' || q.type === 'deliver') && q.from === reg.id ? `<button class="sm primary" data-act="claim-bounty" data-v="${q.id}">보고</button>` : ''}</div>`).join('') || '<div class="dim small">없음</div>'}</div>`;
      }
      case 'tavern': {
        const used = p.tavern[reg.id] === G.monthKey();
        const buffs = p.buffs.filter((b) => b.until >= G.monthKey());
        return `<p>지글지글 꼼장어, 김 오르는 어묵탕. 헌터들의 웃음소리가 시끄럽다.</p>
          <div class="cards">${DRINKS.map((d) => `<div class="item-row"><div class="grow"><b>${d.name}</b><div class="small dim">${d.desc}</div></div>
            <button class="sm" data-act="drink" data-v="${d.id}" ${d.effect === 'social' && used ? 'disabled' : ''}>${FX.icon('coin', 13)} ${price(G.drinkPrice(d))}</button></div>`).join('')}</div>
          ${buffs.length ? `<div class="sec-title sec">지금 받는 기운</div>${buffs.map((b) => `<div class="small">${b.name} · ${G.monthKey() === b.until ? '이번 달까지' : `${b.until - G.monthKey() + 1}개월 남음`}</div>`).join('')}` : ''}
          <div class="sec-title sec">옆자리에서 들려오는 이야기</div><div class="logs">${G.rumors.slice(0, 4).map((r) => `<div class="l"><span class="d">${r.date}</span>${r.text}</div>`).join('') || '<div class="dim">조용한 밤이다.</div>'}</div>`;
      }
      case 'workshop': {
        const coreList = Object.keys(p.mats).filter((k) => p.mats[k] > 0).map((k) => `${coreName(+k.slice(1))} ${p.mats[k]}`).join(' · ') || '없음';
        return `<p class="small dim">보유 코어: ${coreList}. 높은 등급 코어는 낮은 등급 재료를 대신할 수 있다.</p>
          <div class="cards">${RECIPES.map((rc) => { const t = G.recipeTier(rc); return `<div class="item-row ${rc.out === 'catalyst' ? 'hl' : ''}"><div class="grow"><b>${rc.out === 'catalyst' ? `${RANKS[t].key}급 ` : ''}${rc.name}</b> ×${rc.n}
            <div class="small dim">${coreName(t)} ${rc.cores}개 + ${fmt(G.recipeCost(rc))} 크레딧${rc.out === 'catalyst' ? ' · 돌파에 반드시 필요' : ''}</div></div>
            <button class="sm" data-act="craft" data-v="${rc.id}">제작</button></div>`; }).join('')}</div>`;
      }
      case 'archive': {
        const sks = G.archiveSkills();
        return `<p class="small dim">스킬 데이터는 크레딧과 협회 공적으로 교환한다. 상위 스킬은 이 도시의 평판이 있어야 열람할 수 있다. 목록은 매년 바뀐다.</p>
          <div class="cards">${sks.map((id) => { const sk = skillById(id); const own = p.skills.includes(id); const rq = G.skillRepReq(sk); return `<div class="item-row"><span class="slot-ico" style="--c:${sk.elem ? elemColor(sk.elem) : '#9aa6b8'}">${FX.elemIcon(sk.elem, 20)}</span>
            <div class="grow"><b>${sk.name}</b> ${this.rankTag(sk.rankReq)} <span class="tag">${TYPE_NAME[sk.type]}</span><div class="small dim">${sk.desc} · 정신력 ${sk.mp}${rq ? ` · 평판 ${rq} 필요` : ''}</div></div>
            ${own ? '<span class="small dim">습득함</span>' : `<button class="sm" data-act="learn" data-v="${id}" ${sk.rankReq > p.rankIdx ? 'disabled' : ''}>${price(sk.price * pm * G.cityPriceMul(reg.id))} · 공적 ${G.skillMerit(sk)}</button>`}</div>`; }).join('')}</div>`;
      }
      case 'transit': {
        const dests = p.visited.filter((id) => id !== reg.id);
        return `<p class="small dim">한 번이라도 가 본 도시로 이틀 만에 이동한다.</p><div class="cards">${dests.map((id) => { const r = regionById(id); return `<div class="item-row"><div class="grow"><b>${r.name}</b> <span class="small dim">${'◆'.repeat(r.danger)}${G.cityBreak(id) ? ' · <span class="bad">게이트 브레이크</span>' : ''}</span></div>
            <button class="sm" data-act="transit" data-v="${id}" ${id === 'jeju' && !G.canJeju() ? 'disabled title="관리국 공인 S급만"' : ''}>${price(G.transitCost(id))} 크레딧</button></div>`; }).join('') || '<div class="dim">아직 가 본 다른 도시가 없다.</div>'}</div>`;
      }
      case 'auction': {
        if (!G.auctionOpen()) return `<p>정기 경매는 매년 ${SAGA.auctionMonth}월에 열린다. 유물과 전설 장비가 오른다.</p>`;
        return `<p class="small dim">입찰은 한 번뿐이다. 다른 입찰자의 최고가를 넘어야 낙찰된다.</p><div class="cards">${G.auctionLots().map((l) => `<div class="item-row ${l.done ? '' : 'hl'}"><div class="grow"><b>${l.kind === 'relic' ? `${RARITY[l.grade].name} 유물 [${relicById(l.id).name}]` : l.item.name}</b>
          <div class="small dim">${l.kind === 'relic' ? `돌파 때 바치면 ${relicById(l.id).desc} 영구 상승` : this.equipStats(l.item)} · 시작가 ${fmt(l.base)}</div></div>
          ${l.done ? '<span class="small dim">종료</span>' : `<span class="row">${[1, 1.3, 1.7].map((m) => `<button class="sm" data-act="bid" data-v="${l.uid}|${m}">${fmt(l.base * m)}</button>`).join('')}</span>`}</div>`).join('')}</div>`;
      }
      case 'guild': return this.guildHtml();
      case 'merc': {
        const list = G.mercsFor(reg.id);
        return `<p class="small dim">이번 달 계약 가능한 헌터들. 3개월 계약이며, 관계가 깊어지면 계약이 끝나도 남을 수 있다. 파티 ${G.partySize()}/5.</p>
          <div class="cards">${list.map((n, i) => `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${this.clsTag(n.cls, n.rankIdx >= 6 ? 2 : n.rankIdx >= 3 ? 1 : 0)} ${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)}
            <div class="small dim">${classById(n.cls).desc} · 성격 ${persById(n.personality).name}</div></div>
            ${n.hired ? '<span class="small dim">계약됨</span>' : `<button class="sm" data-act="hire" data-v="${i}" ${G.party().length >= 4 ? 'disabled' : ''}>${FX.icon('coin', 13)} ${price(G.mercFee(n))}</button>`}</div>`).join('')}</div>`;
      }
      default: return '';
    }
  },
  questStatus(q) {
    if (q.type === 'deliver') return `코어 ${Math.min(G.coreCount(q.tier), q.n)}/${q.n} 보유 · 의뢰소에서 바로 납품`;
    if (q.status === 'done') return '<span class="good">완료 · 보고 필요</span>';
    const left = q.deadline - G.monthKey();
    const prog = q.type === 'hunt' ? `${q.progress}/${q.n}` : q.type === 'courier' ? `${regionById(q.dest).name} 도착 시 완료` : '진행 중';
    return `${prog} · 남은 기한 ${left}개월`;
  },

  // ---------- 스토리 사건 ----------
  showStory(q) {
    const ev = G.storyById(q.id); if (!ev) return this.processQueue();
    const c = G.storyCtx(q);
    if (ev.npc && !c.npc && ev.trigger !== 'system') return this.processQueue();
    G.markSeen(ev.id);
    this.curStory = { ev, c, q };
    const text = G.storyFill(typeof ev.text === 'function' ? ev.text(G, c) : ev.text, c);
    const art = c.npc ? `<div class="story-portrait">${UI.npcPortrait(c.npc, 130)}<div><b>${c.npc.name}</b><div class="small">${this.rankTag(c.npc.rankIdx, c.npc.stage)} ${this.elemTag(c.npc.element)}</div><div class="small dim">${c.npc.met ? `관계 ${relationLabel(c.npc.relation)} (${c.npc.relation})` : '처음 보는 인물'}</div></div></div>` : FX.eventArt(ev.id.replace(/^base_/, ''));
    const choices = ev.choices.map((ch, i) => ({ ch, i })).filter(({ ch }) => !ch.when || ch.when(G, c));
    this.modal(`${art}<div class="eyebrow">${ev.chain ? '기연' : '사건'} · ${G.fullDate()} · ${G.region().name}</div>
      <p class="event-text">${text.replace(/\n/g, '<br>')}</p>
      <div class="cards">${choices.map(({ ch, i }) => `<button class="choice-btn" data-act="story-choice" data-v="${i}">${G.storyFill(ch.text, c)}</button>`).join('')}</div>`, 'event-box');
  },
  storyChoice(i) {
    const { ev, c } = this.curStory;
    const res = ev.choices[i].do(G, c);
    G.recalc(); G.player.fame = Math.max(0, G.player.fame); G.save();
    this.renderGame();
    this.modal(`${c.npc ? '' : FX.eventArt(ev.id.replace(/^base_/, ''))}<p class="event-text">${G.storyFill(res, c).replace(/\n/g, '<br>')}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },

  // ---------- NPC 부탁 ----------
  showRequest(q) {
    const rq = REQUESTS[q.kind]; const c = G.storyCtx(q);
    if (!rq || !c.npc || !c.npc.alive) return this.processQueue();
    this.curReq = { rq, c, q };
    const text = rq.text(G, c);
    this.modal(`<div class="story-portrait">${UI.npcPortrait(c.npc, 130)}<div><div class="eyebrow">메시지 · ${G.fullDate()}</div><b>${c.npc.name}</b><div class="small">${this.rankTag(c.npc.rankIdx, c.npc.stage)} · ${regionById(c.npc.region).name}</div><div class="small dim">관계 ${relationLabel(c.npc.relation)} (${c.npc.relation})</div></div></div>
      <p class="event-text">${fixJosa(text).replace(/\n/g, '<br>')}</p>
      <div class="cards"><button class="choice-btn" data-act="req" data-v="1">${rq.accept}</button><button class="choice-btn" data-act="req" data-v="0">${rq.decline || '거절한다'}</button></div>`, 'event-box');
  },
  answerRequest(yes) {
    const { rq, c } = this.curReq;
    const res = yes ? rq.onAccept(G, c) : rq.onDecline(G, c);
    G.save(); this.renderGame();
    this.modal(`<p class="event-text">${fixJosa(res)}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },

  // ---------- 스토리 전투 ----------
  storyEnemies(spec) {
    if (spec.mirror) {
      const u = G.playerUnit();
      return [{ ...u, id: 'mirror', name: '그림자', side: 'enemy', isPlayer: false, portrait: { seed: G.player.look, gender: G.player.gender, elem: G.player.element }, tier: G.player.rankIdx }];
    }
    const m = spec.mobs; const list = [];
    for (let k = 0; k < m.n; k++) {
      const mon = G.makeMonster(Math.max(0, Math.min(7, m.tier)), !!m.boss && k === 0, m.elem);
      if (m.shape) mon.shape = m.shape;
      if (m.elem) mon.elem = m.elem;
      if (m.human) {
        mon.name = k === 0 && m.name ? m.name : RNG.pick(['무장 헌터', '조직원', '신도', '청소부', '용병', '암살자']);
        mon.portrait = { seed: 'h' + Math.random(), gender: RNG.chance(0.6) ? 'M' : 'F', elem: mon.elem };
      } else if (k === 0 && m.name) mon.name = m.name;
      else if (m.shape) mon.name = spec.title;
      list.push(mon);
    }
    return list;
  },
  startStoryFight(spec) {
    const allies = this.allyUnits();
    if (spec.ally) {
      const u = G.npcUnit({ id: -77, name: spec.ally.name, rankIdx: spec.ally.rank, stage: 1, element: spec.ally.elem }, 'ally');
      delete u.npcId; u.portrait = { seed: 'ally' + spec.ally.name, gender: 'M', elem: spec.ally.elem }; allies.push(u);
    }
    this.ctx = { kind: 'story', spec, elem: (spec.mobs && spec.mobs.elem) || G.player.element, combat: new Combat(G, { allies, enemies: this.storyEnemies(spec), canFlee: !spec.lethal, spar: !!spec.spar, title: spec.title }) };
    this.openCombat();
  },
  finishStoryFight() {
    const c = this.ctx; const cb = c.combat; const spec = c.spec;
    const p = G.player;
    if (!spec.spar) { p.hp = Math.max(1, cb.player.hp); p.mp = cb.player.mp; }
    let text = '';
    if (cb.result === 'win') {
      const w = spec.win || {};
      text = (w.text || '승리했다.') + G.gain(w.gain || {});
      text += [...G.lootFromKills(cb.kills.filter((k) => !k.portrait), false)].map((l) => ` ${l}`).join('');
      p.record.kills += cb.kills.length;
      if (w.chain) G.chainNext(w.chain);
      if (w.chainEnd) G.chainEnd(w.chainEnd);
      if (w.life) G.lifeEvent(w.life);
      if (w.after) w.after(G);
    } else if (cb.result === 'lose' && spec.lethal) {
      this.ctx = null; this.closeModal();
      G.gameOver(`${spec.title}에서 쓰러져 다시 일어나지 못했다.`);
      this.renderGame(); return this.processQueue();
    } else {
      const l = spec.lose || {};
      text = (cb.result === 'flee' ? '물러났다. ' : '') + (l.text || '패배했다. 간신히 목숨은 건졌다.') + G.gain(l.gain || (cb.result === 'flee' ? {} : { injure: 2 }));
      if (l.chainEnd) G.chainEnd(l.chainEnd);
      if (l.after) l.after(G);
    }
    if (!spec.spar && cb.result !== 'flee') { const lost = G.partyCasualties(cb.units); if (lost.length) text += ` ${lost.join(', ')}이(가) 쓰러져 돌아오지 못했다…`; }
    this.ctx = null; G.save();
    this.closeModal(); this.renderGame();
    this.modal(`<div class="eyebrow">${spec.title}</div><p class="event-text">${fixJosa(text)}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },

  // ---------- 헌터 대회 ----------
  startTournament() {
    const p = G.player;
    const pool = G.adults().filter((n) => !n.isCompanion && Math.abs(n.rankIdx - p.rankIdx) <= 1).sort((a, b) => a.rankIdx - b.rankIdx || a.stage - b.stage);
    if (pool.length < 3) return this.processQueue();
    const picks = [pool[Math.floor(pool.length * 0.3)], pool[Math.floor(pool.length * 0.65)], pool[pool.length - 1]];
    this.tourney = { round: 0, foes: picks.map((n) => n.id) };
    this.modal(`${FX.eventArt('duel_challenge')}<div class="eyebrow">${G.year}년 전국 헌터 대회 · 강남 돔 아레나</div><h3>대진표가 나왔다</h3>
      <div class="cards">${picks.map((n, i) => `<div class="item-row">${this.npcAvatar(n, 36)}<div class="grow"><b>${['1회전', '준결승', '결승'][i]} · ${n.name}</b> <span class="small">${this.rankTag(n.rankIdx, n.stage)}</span></div></div>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="modal-close">기권한다</button><button class="primary" data-act="tourney-go">입장한다</button></div>`, 'event-box');
  },
  tourneyRound() {
    const t = this.tourney; const n = G.npcById(t.foes[t.round]);
    const u = G.npcUnit(n, 'enemy'); const me = G.playerUnit(); me.hp = me.maxHp; me.mp = me.maxMp;
    this.ctx = { kind: 'tourney', npcId: n.id, elem: n.element, combat: new Combat(G, { allies: [me], enemies: [u], canFlee: false, spar: true, title: `전국 헌터 대회 ${['1회전', '준결승', '결승'][t.round]} · ${n.name}` }) };
    this.openCombat();
  },
  finishTourney() {
    const t = this.tourney; const cb = this.ctx.combat; const n = G.npcById(t.foes[t.round]);
    n.met = true;
    this.ctx = null; this.closeModal();
    if (cb.result === 'win') {
      t.round++;
      if (t.round < 3) { G.player.fame += 5; this.renderGame(); return this.modal(`<p class="event-text">${n.name}을(를) 꺾었다! 관중석이 들끓는다. 다음 상대가 기다린다.</p><div class="row end"><button class="primary" data-act="tourney-go">다음 경기</button></div>`, 'event-box'); }
      const gain = G.gain({ money: 2500, fame: 35, relic: 2, merit: 20 });
      G.lifeEvent(`${G.year}년 전국 헌터 대회에서 우승했다.`);
      G.rumor(`${G.year}년 전국 헌터 대회 우승자는 ${G.player.name}! 결승에서 ${n.name}을(를) 꺾었다.`);
      G.save(); this.renderGame();
      return this.modal(`${UI.playerPortrait(150)}<div class="eyebrow">전국 헌터 대회</div><h2>우승</h2><p class="event-text">트로피가 손에 쥐어졌다. 플래시 세례가 쏟아진다.${gain}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
    }
    const gain = G.gain({ fame: 3 + t.round * 5, money: 200 * (t.round + 1) });
    G.save(); this.renderGame();
    this.modal(`<p class="event-text">${['1회전', '준결승', '결승'][t.round]}에서 ${n.name}에게 졌다. 그래도 이름을 알렸다.${gain}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },

  // ---------- 돌파 ----------
  openBreakthrough() {
    const p = G.player; this.btSel = this.btSel || [];
    const has = G.hasCatalyst(); const slots = G.relicSlots();
    const t = p.rankIdx; const need = RECIPES.find((r) => r.id === 'catalyst');
    let coreHave = 0; for (let k = t; k < 8; k++) coreHave += G.coreCount(k);
    this.modal(`<div class="eyebrow">경지 돌파</div><h3>${RANKS[t].key}급 → ${RANKS[t + 1].key}급</h3>
      <p>성공률 <b class="num">${G.btChance()}%</b>. 실패하면 에테르 절반을 잃고 한 달을 앓는다.</p>
      <div class="item-row ${has ? 'hl' : ''}"><div class="grow"><b>${RANKS[t].key}급 각성 촉매</b> <span class="small">${has ? '<span class="good">보유</span>' : '<span class="bad">없음</span>'}</span>
        <div class="small dim">필수 재료. 공방에서 ${coreName(t)} ${need.cores}개(보유 ${coreHave})와 크레딧으로 만들거나, 강남·부산·대구 마켓에서 산다.</div></div></div>
      <div class="sec-title sec">유물 바치기 · 최대 ${slots}개 · 성공하면 영구 능력치</div>
      <div class="cards">${p.relics.map((r) => { const R = relicById(r.id); const on = this.btSel.includes(r.uid); const v = G.relicValue(r); return `<button class="choice-btn ${on ? 'on' : ''}" data-act="bt-relic" data-v="${r.uid}"><b style="color:${RARITY[r.grade].color}">${R.name}</b> ${RARITY[r.grade].name} · ${R.desc} +${R.stat === 'life' ? Math.round(v) + '년' : Math.round(v * 100) + '%'}</button>`; }).join('') || '<div class="dim small">가진 유물이 없다. 게이트 보스, 경매, 사건에서 얻을 수 있다.</div>'}</div>
      <div class="row end"><button class="ghost" data-act="modal-close">나중에</button><button class="primary" data-act="bt-go" ${has ? '' : 'disabled'}>돌파한다</button></div>`);
  },

  // ---------- 계승 ----------
  heirs() { const p = G.player; return (p.children || []).map((id) => G.npcById(id)).filter((n) => n && n.alive && n.ageMonths >= 18 * 12); },
  succeed(id) {
    const old = G.player; const n = G.npcById(id);
    const p = G.player = {
      ...old, name: n.name, gender: n.gender, element: n.element, look: 'heir' + n.id + n.name,
      rankIdx: n.rankIdx, stage: n.stage, ether: 0, ageMonths: n.ageMonths, lifePenalty: 0, lifeBonus: 0,
      money: Math.round(old.money * 0.6), fame: Math.round(old.fame * 0.3), merit: Math.round(old.merit * 0.5),
      region: n.region, guild: null, guildRank: 0, contrib: 0, companion: null, injured: 0,
      partner: null, spouse: null, master: null, disciples: [], children: [], loans: [], quests: [], buffs: [],
      relicBonus: {}, lifeEvents: [], record: { gates: 0, kills: 0, npcKills: 0, breakthroughs: 0, fails: 0 },
      equip: { ...old.equip }, skills: ['strike', SKILLS.find((s) => s.elem === n.element && s.rankReq === 0).id], equipSkills: [SKILLS.find((s) => s.elem === n.element && s.rankReq === 0).id],
      license: `${G.year}-${String(RNG.int(1000, 9999))}`,
    };
    [p.x, p.y] = WORLD.cityPos[p.region];
    G.npcs = G.npcs.filter((x) => x !== n);
    for (const o of G.npcs) if (o.nemesis === 'player') o.nemesis = RNG.chance(0.5) ? 'player' : null;
    G.over = null; G.queue = [];
    G.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
    G.lifeEvent(`부모 ${old.name}의 뒤를 이었다.`);
    G.rumor(`故 ${old.name}의 자녀 ${p.name}이(가) 헌터로서 첫발을 내디뎠다.`);
    G.save();
    this.closeModal(); this.renderGame(); this.map.centerOn(p.x, p.y);
    this.modal(`${UI.playerPortrait(150)}<div class="eyebrow">${G.fullDate()}</div><h2>계승</h2><p class="event-text">${p.name}은(는) 부모가 남긴 장비와 유물, 그리고 원한과 인연을 함께 물려받았다.</p><div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`, 'event-box');
  },
});

// 큐 처리 확장
{
  const base = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (!q) return;
    const own = ['story', 'request', 'toast', 'storyfight', 'tournament', 'mobAmbush'];
    if (!own.includes(q.type)) return base.call(this);
    G.queue.shift();
    if (q.type === 'story') return this.showStory(q);
    if (q.type === 'request') return this.showRequest(q);
    if (q.type === 'toast') { this.toast(q.text); return this.processQueue(); }
    if (q.type === 'storyfight') return this.startStoryFight(q.spec);
    if (q.type === 'tournament') return this.startTournament();
    if (q.type === 'mobAmbush') {
      const mob = G.mobs.find((m) => m.id === q.mobId);
      if (!mob) return this.processQueue();
      return this.modal(`<div class="enc mob-enc"><div class="mob-portrait" style="--c:${elemColor(mob.elem)}">${FX.monster({ name: mob.name, elem: mob.elem, shape: mob.shape }, 130)}</div>
        <div><div class="eyebrow bad">기습 · ${G.fullDate()}</div><h3>${mob.name} 무리 ×${mob.count}</h3><div class="row">${this.rankTag(mob.tier)} ${this.elemTag(mob.elem)} <span class="small">난이도 ${this.gateRisk(mob.tier)}</span></div>
        <p class="dim">길을 가던 중 근처를 배회하던 무리가 냄새를 맡고 덮쳐 왔다.</p></div></div>
        <div class="row end"><button class="ghost" data-act="mob-flee" data-v="${mob.id}">달아난다</button><button class="danger" data-act="mob" data-v="${mob.id}">맞서 싸운다</button></div>`);
    }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'city': this.hideTip(); return this.openCity();
      case 'city-fac': this.cityFac = v || null; $box.innerHTML = fixJosa(this.cityHtml()); return;
      case 'inn': return this.afterCity(G.stayInn());
      case 'drink': return this.afterCity(G.drink(v));
      case 'craft': return this.afterCity(G.craft(v));
      case 'learn': return this.afterCity(G.learnFromArchive(v));
      case 'buy-catalyst': return this.afterCity(G.buyCatalyst());
      case 'sell-cores': return this.afterCity(G.sellCores(+v));
      case 'accept-bounty': return this.afterCity(G.acceptBounty(v));
      case 'claim-bounty': return this.afterCity(G.claimBounty(v));
      case 'transit': { const r = G.transit(v); this.closeModal(); this.renderGame(); this.map.centerOn(G.player.x, G.player.y); this.toast(r); if (G.onCity()) this.openCity(); return this.processQueue(); }
      case 'bid': { const [uid, m] = v.split('|'); return this.afterCity(G.bid(uid, +m)); }
      case 'break-fight': { const g = G.breakGate(G.region().id); if (!g) return; this.closeModal(); this.ctx = { kind: 'gate', gate: g, rooms: G.gateRooms(g), roomIdx: 0, loot: { money: 0, ether: 0, kills: 0, list: [] } }; return this.startRoom(); }
      case 'story-choice': return this.storyChoice(+v);
      case 'req': return this.answerRequest(v === '1');
      case 'tourney-go': return this.tourneyRound();
      case 'breakthrough': this.btSel = []; return this.openBreakthrough();
      case 'bt-relic': { const s = this.btSel; if (s.includes(v)) this.btSel = s.filter((x) => x !== v); else if (s.length < G.relicSlots()) s.push(v); return this.openBreakthrough(); }
      case 'bt-go': {
        const r = G.breakthroughWith(this.btSel || []); if (!r) return;
        this.closeModal(); this.renderGame();
        return FX.breakthrough(r.ok, G.player.rankIdx, () => {
          this.renderGame();
          this.modal(`<h3 class="${r.ok ? 'good' : 'bad'}">${r.ok ? '돌파 성공' : '돌파 실패'}</h3><p class="dim">성공률 ${r.chance}%</p><p>${r.msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
        });
      }
      case 'teach-disciple': return this.after(G.teachDisciple(+v));
      case 'succeed': return this.succeed(+v);
      case 'hire': return this.afterCity(G.hireMerc(G.region().id, +v));
      case 'mob-flee': {
        const mob = G.mobs.find((m) => m.id === +v); if (!mob) return this.closeModal();
        const chance = Math.max(0.2, Math.min(0.9, 0.55 + (G.player.spd - 9 * Math.sqrt(RANKS[mob.tier].mult)) / 40));
        if (RNG.chance(chance)) { this.closeModal(); this.toast('간신히 따돌렸다.'); return this.processQueue(); }
        this.toast('따돌리지 못했다!'); this.closeModal(); return this.startMob(mob.id);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
UI.afterCity = function (msg) {
  this.renderGame();
  if (this.modalOpen() && this.sheet === 'city') { $box.innerHTML = fixJosa(this.cityHtml()); this.sheet = 'city'; }
  if (msg) this.toast(msg);
  if (!this.modalOpen()) this.processQueue();
};
