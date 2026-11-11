// 외형 선택 → 출신 생활복 → 각성 직업복 → 장착 방어구.
// 외형 시드는 얼굴·머리만 고정하고 복장은 인물의 삶과 장비를 따른다.
const Wardrobe = (() => {
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
    return { age: G.ageYears(), race: p.race || 'human', outfit };
  }
  const prologueLook = s => ({ age: 19, outfit: UI.screen === 'pro-result' && s.result ? profession(s.result.cls, s.bg) : background(s.bg) });

  // 시작 지급품은 직업에 맞춰 입고, 이후 교체한 방어구는 그 물건의 외형을 쓴다.
  const newGame = Game.prototype.newGame;
  Game.prototype.newGame = function (...args) {
    const result = newGame.apply(this, args);
    const armor = this.player && this.player.equip && this.player.equip.armor;
    if (armor) armor.appearanceByClass = true;
    return result;
  };
  const init = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function (...args) {
    const result = init.apply(this, args);
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
  return { background, profession, equipment, playerLook, prologueLook };
})();
