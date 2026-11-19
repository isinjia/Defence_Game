// 남성 주인공 조합·NPC 분리 회귀 검사. 게임 실행/스모크 테스트가 아니다.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const context=vm.createContext({});
vm.runInContext(`const FX={hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}};const G={player:{look:'player',gender:'M'}}, UI={screen:'story-setup',pro:{look:'setup',gender:'M'},create:null,handle(a,v){return v}};class Game{newGame(){this.player={gender:'M',bodyType:'heavy'}}initSandbox(){this.player={gender:'M',bodyType:'thin'}}}const PORTRAIT={card(...a){return JSON.stringify(a)},avatar(...a){return JSON.stringify(a)}};const Wardrobe={appearance(s){return {bodyType:s.bodyType||'normal',skinTone:s.skinTone||'natural'}},controls(){return '<button data-act="appearance-body" data-v="thin">thin</button><button data-act="appearance-body" data-v="normal">normal</button>'}};`,context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/player_male_art.js'),'utf8'),context);
const r=vm.runInContext(`(()=>{const combos=new Set();for(let i=0;i<30000;i++){const s=PlayerMaleArt.select('look6:'+i);combos.add([s.face,s.hair,s.outfit].join(':'));}const a=PlayerMaleArt.select('fixed'),b=PlayerMaleArt.select('fixed');const npc=PORTRAIT.card('npc','M',null,1,200,{bodyType:'heavy'});const female=PORTRAIT.card('player','F',null,1,200,{});const controls=Wardrobe.controls(UI.pro);const game=new Game();game.newGame();const bodyNew=game.player.bodyType;game.initSandbox();return {combos:combos.size,stable:JSON.stringify(a)===JSON.stringify(b),npc,female,controls,bodyNew,bodyLoad:game.player.bodyType,bodyClick:UI.handle('appearance-body','heavy'),male:PORTRAIT.card('player','M',null,1,200,{}).includes('data-player-male="1"')};})()`,context);
assert.equal(r.combos,72);assert(r.stable);assert.equal(r.npc,JSON.stringify(['npc','M',null,1,200,{bodyType:'heavy'}]));assert.equal(r.female,JSON.stringify(['player','F',null,1,200,{}]));assert(!r.controls.includes('thin'));assert.equal(r.bodyNew,'normal');assert.equal(r.bodyLoad,'normal');assert.equal(r.bodyClick,'normal');assert(r.male);console.log('PASS: 72 combinations, stable seeds, NPC/female passthrough, one male body on create/load/input');
// 같은 얼굴·헤어가 의상/출신 의상 옵션 때문에 다시 이동하거나 잘리지 않아야 한다.
const registrationChecks = vm.runInContext(`(() => {
  const image = (html, part) => (html.match(new RegExp('<image\\\\b[^>]*'+part+'-[^>]*>')) || [])[0];
  let checked = 0;
  for (let face=1; face<=3; face++) for (let hair=1; hair<=8; hair++) {
    const base = PlayerMaleArt.render('fixed',200,{maleFace:face,maleHair:hair,maleOutfit:1});
    if (/clip-path=|transform=/.test(base)) throw Error('geometry mask/transform returned');
    for (let outfit=1; outfit<=3; outfit++) {
      const html = PlayerMaleArt.render('fixed',200,{maleFace:face,maleHair:hair,maleOutfit:outfit});
      if (image(base,'headneck') !== image(html,'headneck')) throw Error('outfit moved head/neck');
      if (image(base,'hair') !== image(html,'hair')) throw Error('outfit moved hair');
      if (!image(html,'headneck') || !image(html,'clothes') || !image(html,'hair')) throw Error('layer missing');
      checked++;
    }
  }
  const base=JSON.stringify(PlayerMaleArt.select('fixed'));
  for(const outfit of ['underwear','casual','tactical','coat','hunter:swordsman'])
    if(JSON.stringify(PlayerMaleArt.select('fixed',{outfit}))!==base)throw Error('implicit wardrobe override returned');
  const dark=PlayerMaleArt.render('fixed',200,{skinTone:'deep'});
  if (/filter=/.test(image(dark,'clothes'))) throw Error('skin filter recolored clothing');
  return checked;
})()`,context);
assert.equal(registrationChecks,72);
console.log('PASS: 72 fixed registrations, no jaw/neck masks, no implicit wardrobe override, clothing color preserved');
