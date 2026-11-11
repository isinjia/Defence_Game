// 외형 선택 → 출신 생활복 → 각성 직업복 → 장착 방어구.
// 외형 시드는 얼굴·머리만 고정하고 복장은 인물의 삶과 장비를 따른다.
const Wardrobe = (() => {
  const bodies = { thin: '매우 마름', normal: '보통', strong: '근육질', heavy: '통통' };
  const tones = { natural: ['기본', '#dec1ad'], fair: ['밝은', '#f6dac8'], medium: ['중간', '#dcb496'], tan: ['구릿빛', '#b6855f'], deep: ['짙은', '#855841'] };
  const appearance = s => ({ bodyType: bodies[s.bodyType] ? s.bodyType : 'normal', skinTone: tones[s.skinTone] ? s.skinTone : 'natural' });
  function controls(s) {
    const a = appearance(s);
    return `<div class="sec"><div class="sec-title">체형</div><div class="appearance-choices">${Object.entries(bodies).map(([id, label]) => `<button class="choice ${a.bodyType === id ? 'sel' : ''}" data-act="appearance-body" data-v="${id}" aria-pressed="${a.bodyType === id}">${label}</button>`).join('')}</div></div><div class="sec"><div class="sec-title">피부색</div><div class="appearance-choices skin-choices">${Object.entries(tones).map(([id, [label, color]]) => `<button class="choice ${a.skinTone === id ? 'sel' : ''}" data-act="appearance-skin" data-v="${id}" aria-pressed="${a.skinTone === id}"><i class="skin-swatch" style="background:${color}" aria-hidden="true"></i>${label}</button>`).join('')}</div></div>`;
  }
  const handle = UI.handle;
  UI.handle = function (act, value) {
    if (act === 'appearance-body' || act === 'appearance-skin') {
      const s = this.screen === 'story-setup' ? this.pro : this.screen === 'create' ? this.create : null;
      if (!s) return;
      if (act === 'appearance-body' && bodies[value]) s.bodyType = value;
      if (act === 'appearance-skin' && tones[value]) s.skinTone = value;
      return this.render();
    }
    return handle.call(this, act, value);
  };
  const outfits = ['coat', 'hanbok', 'mandarin', 'tactical', 'casual', 'overcoat'];
  const background = bg => ({ chaebol: 'coat', orphan: 'casual', soldier: 'tactical', subject: 'casual', student: 'casual' }[bg] || 'casual');
  function profession(cls, bg) {
    const c = cls && classById(cls);
    return c ? ({ fighter: 'tactical', guard: 'tactical', shadow: 'coat', shooter: 'tactical', mage: 'mandarin', summon: 'mandarin', support: 'mandarin', esper: 'overcoat', east: 'hanbok', hidden: 'overcoat' }[c.g] || background(bg)) : background(bg);
  }
  function equipment(item) {
    if (!item) return null;
    if (outfits.includes(item.appearanceOutfit)) return item.appearanceOutfit;
    const name = item.name || '';
    if (/도포|한복/.test(name)) return 'hanbok';
    if (/망토|외투/.test(name)) return 'overcoat';
    if (/코트/.test(name)) return 'coat';
    if (/수트|섬유|장막/.test(name)) return 'mandarin';
    return 'tactical';
  }
  function playerLook() {
    const p = G.player, armor = p.equip && p.equip.armor;
    const outfit = armor && !armor.appearanceByClass ? equipment(armor) : profession(p.cls, p.bg);
    return { age: G.ageYears(), race: p.race || 'human', outfit, ...appearance(p) };
  }
  const prologueLook = s => ({ age: 19, ...appearance(s), outfit: UI.screen === 'pro-result' && s.result ? profession(s.result.cls, s.bg) : background(s.bg) });

  // 시작 지급품은 직업에 맞춰 입고, 이후 교체한 방어구는 그 물건의 외형을 쓴다.
  const newGame = Game.prototype.newGame;
  Game.prototype.newGame = function (...args) {
    const result = newGame.apply(this, args);
    Object.assign(this.player, appearance(args[0] || {}));
    const armor = this.player && this.player.equip && this.player.equip.armor;
    if (armor) armor.appearanceByClass = true;
    return result;
  };
  const init = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function (...args) {
    const result = init.apply(this, args);
    if (this.player) { this.player.bodyType ??= 'normal'; this.player.skinTone ??= 'natural'; }
    const armor = this.player && this.player.equip && this.player.equip.armor;
    if (armor) armor.appearanceByClass ??= true;
    return result;
  };
  const make = Game.prototype.makeEquipment;
  Game.prototype.makeEquipment = function (...args) {
    const item = make.apply(this, args);
    if (item && item.slot === 'armor') item.appearanceByClass = false;
    return item;
  };
  UI.playerPortrait = function (size) { const p = G.player; return FX.portrait(p.look, p.gender, p.element, p.rankIdx, size, playerLook()); };
  UI.playerAvatar = function (size) { const p = G.player; return FX.avatar(p.look, p.gender, p.element, p.rankIdx, size, playerLook()); };
  const npcLook = UI.npcLook;
  UI.npcLook = function (n) {
    const a = appearance(n);
    if (!n.bodyType) a.bodyType = ['normal','normal','normal','normal','normal','normal','thin','strong','strong','heavy'][FX.hash('body|' + n.id + '|' + n.name) % 10];
    return { ...npcLook.call(this,n), ...a };
  };
  return { background, profession, equipment, playerLook, prologueLook, appearance, controls, bodies, tones };
})();
