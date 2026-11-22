// 새 얼굴 추첨·기존 외형·직업복 경로 검사. 스모크 테스트가 아니다.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),c=vm.createContext({});
vm.runInContext(`const FX={hash(s){let h=2166136261;for(const x of s){h^=x.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}};const G={player:{look:'male',gender:'M'}},UI={pro:{look:'female',gender:'F'},create:null,handle(){}};class Game{newGame(){}initSandbox(){}}const PORTRAIT={card(...a){return JSON.stringify(a)},avatar(...a){return JSON.stringify(a)}};const Wardrobe={controls(){return ''},appearance(){return {}}};`,c);
const outfits=fs.readFileSync(path.join(root,'js/job_outfits.js'),'utf8');const aliases=outfits.match(/const aliases=(\{[^\n]+\});/)[1];const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/outfits/manifest.json'),'utf8')).classes;
vm.runInContext('const aliases='+aliases+';const catalog='+JSON.stringify(catalog)+';const byId=new Map(catalog.map(c=>[c.id,c]));const prefix="hunter:";'+outfits.match(/const idOf=[^\n]+/)[0]+'const HunterOutfits={get(outfit,gender){const id=idOf(outfit),c=byId.get(aliases[id]||id);return c?{familyId:c.id}:null}};',c);
for(const file of ['player_male_art','player_female_art','player_hero_faces'])vm.runInContext(fs.readFileSync(path.join(root,'js/'+file+'.js'),'utf8'),c);
for(const gender of ['M','F']){
 const seed=gender==='M'?'male':'female';
 const picks=vm.runInContext(`new Set(Array.from({length:1000},(_,i)=>PlayerHeroFaces.select('look:'+i,'${gender}'))).size`,c);assert.equal(picks,6);
 assert(vm.runInContext(`PlayerHeroFaces.select('saved','${gender}')===PlayerHeroFaces.select('saved','${gender}')`,c));
 for(let n=1;n<=5;n++){
  const html=vm.runInContext(`PORTRAIT.card('${seed}','${gender}',null,0,200,{heroFace:${n}})`,c);
  assert(html.includes('data-hero-face="'+n+'"'));assert(!/transform=|clip-path=/.test(html));assert.equal((html.match(/<image\b/g)||[]).length,1);
  const src=html.match(/<image href="([^"]+)"/)[1];assert(fs.existsSync(path.join(root,src)),src);
  assert(vm.runInContext(`PORTRAIT.avatar('${seed}','${gender}',null,0,56,{heroFace:${n}}).includes('height="56"')`,c));
 }
 const legacy=vm.runInContext(`PORTRAIT.card('${seed}','${gender}',null,0,200,{heroFace:0})`,c);assert(!legacy.includes('data-hero-face='));
 const args=['npc',gender,null,0,200,{}];assert.equal(vm.runInContext('PORTRAIT.card(...'+JSON.stringify(args)+')',c),JSON.stringify(args));
}
const classes=vm.runInContext('[...catalog.map(x=>x.id),...Object.keys(aliases)]',c);
for(const cls of classes){const html=vm.runInContext(`PORTRAIT.card('female','F',null,0,200,{heroFace:1,outfit:'hunter:${cls}'})`,c);assert(html.includes('/jobs/job-'));assert(!html.includes('data-hero-face='));}
assert(!vm.runInContext(`PORTRAIT.card('male','M',null,0,200,{maleFace:1})`,c).includes('data-hero-face='));
assert(!vm.runInContext(`PORTRAIT.card('female','F',null,0,200,{femaleVariant:0})`,c).includes('data-hero-face='));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/portraits/player-hero/manifest.json'),'utf8'));assert.equal(manifest.items.length,10);
for(const x of manifest.items)for(const key of ['portrait','head'])assert(fs.existsSync(path.join(root,'assets/portraits/player-hero',x[key])));
console.log('PASS: 10 new faces, stable seeded legacy/new pools, NPC passthrough, '+classes.length+' female job mappings preserved, 20 assets');
