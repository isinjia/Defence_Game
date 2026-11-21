// 기본 여성 주인공과 NPC/남성 렌더 경로 분리 검사. 스모크 테스트가 아니다.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const c = vm.createContext({});
vm.runInContext(`const G={player:{gender:'F',look:'player'}}, UI={pro:{gender:'F',look:'pro'},create:{gender:'F',look:'create'}};const PORTRAIT={card(...a){return JSON.stringify(a)},avatar(...a){return JSON.stringify(a)}};const Wardrobe={controls(){return 'legacy'}};`,c);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../js/player_female_art.js'),'utf8'),c);
for(const seed of ['player','pro','create']) {
  const html=vm.runInContext(`PORTRAIT.card('${seed}','F',null,0,200,{bodyType:'heavy',age:60,outfit:'coat'})`,c);
  assert(html.includes('data-player-female="1"'));
  assert(!/transform=|filter=|clip-path=/.test(html));
  assert.equal((html.match(/<image\b/g)||[]).length,1);
}
for(const args of [['npc','F',null,1,200,{}],['player','M',null,1,200,{}]]) {
  assert.equal(vm.runInContext(`PORTRAIT.card(...${JSON.stringify(args)})`,c),JSON.stringify(args));
}
assert(vm.runInContext(`PORTRAIT.avatar('player','F').includes('width="56"')`,c));
assert.equal(vm.runInContext(`Wardrobe.controls({gender:'F',look:'npc'})`,c),'legacy');
assert(vm.runInContext(`Wardrobe.controls(UI.pro).includes('기본 외형')`,c));
console.log('PASS: female player/create/prologue, single unmodified portrait, avatar size, NPC/male passthrough');
