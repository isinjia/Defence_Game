// 주인공 파츠 조합 회귀 검사. 게임 실행/스모크 테스트가 아니다.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const repo=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(repo+'/assets/portraits/outfits/manifest.json')).classes;
const code=fs.readFileSync(repo+'/js/job_outfits.js','utf8');
const aliases=vm.runInNewContext('('+code.match(/const aliases=(\{[^\n]+\});/)[1]+')');
const setup=`
const catalog=${JSON.stringify(catalog)}, aliases=${JSON.stringify(aliases)};
const FX={hash(str){let h=2166136261;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}};
const HunterOutfits={get(outfit,gender){if(typeof outfit!=='string'||!outfit.startsWith('hunter:'))return null;const id=outfit.slice(7),c=catalog.find(c=>c.id===(aliases[id]||id));return c?{...c.variants[gender==='F'?'f':'m'],classId:id,familyId:c.id,name:c.name}:null}};
const G={player:{look:'player',gender:'M'}},UI={pro:{look:'setup',gender:'F'},create:null,handle(){}};
class Game{newGame(){}initSandbox(){}}
const Wardrobe={appearance(s){return {...s}},controls(){return 'original controls'}};
const PORTRAIT={card(...args){return 'npc-card:'+JSON.stringify(args)},avatar(...args){return 'npc-avatar:'+JSON.stringify(args)}};
`;
const context=vm.createContext({});
vm.runInContext(setup,context);
for(const f of ['player_male_art','player_female_art','player_hero_faces'])vm.runInContext(fs.readFileSync(repo+'/js/'+f+'.js','utf8'),context);
vm.runInContext(fs.readFileSync(repo+'/js/player_modular_art.js','utf8'),context);
const result=vm.runInContext(`(()=>{
 const htmls=[], coverage={};let checked=0;
 for(const gender of ['M','F']){
  const key=gender==='M'?'male':'female', hairCount=gender==='M'?25:20;
  const set=new Set();for(let i=0;i<30000;i++){const s=PlayerModularArt.select('sample:'+i,gender);set.add([s.face,s.hair,s.outfit].join(':'))}coverage[gender]=set.size;
  for(let face=1;face<=25;face++)for(let hair=1;hair<=hairCount;hair++){
   const opts={[key+'Face']:face,[key+'Hair']:hair,[key+'Outfit']:1,['player'+(gender==='M'?'Male':'Female')+'Art']:true};
   const selection=PlayerModularArt.select('seed',gender,opts);
   if(selection.face!==face||selection.hair!==hair)throw Error('explicit part choice ignored');
   const base=PlayerModularArt.render('seed',gender,200,opts);
   const layer=(html,part)=>{const tag=[...html.matchAll(/<image\\b[^>]+>/g)].map(m=>m[0]).find(s=>s.includes(part));return tag&&tag.replace(/filter="[^"]*"/g,'')};
   const headTag=layer(base,gender==='M'?(face<=3?'headneck':face<=8?'male-head':'/m-face-'):(face<=8?'female-head':'/f-face-'));
   const hairTag=layer(base,gender==='M'?(hair<=8?'/hair-':'-front.webp'):(hair<=3?'female-hair-front':'-front.webp'));
   for(const outfit of [1,2,3,...catalog.map(c=>'hunter:'+c.id)]){
    const options=typeof outfit==='number'?{...opts,[key+'Outfit']:outfit}:{...opts,outfit};
    const html=PORTRAIT.card('seed',gender,null,1,200,options);
    if(!html.includes('data-portrait-parts="player-modular-v2"'))throw Error('flattened wrapper still handles player');
    if(layer(html,gender==='M'?(face<=3?'headneck':face<=8?'male-head':'/m-face-'):(face<=8?'female-head':'/f-face-'))!==headTag)throw Error('clothing moved head');
    if(layer(html,gender==='M'?(hair<=8?'/hair-':'-front.webp'):(hair<=3?'female-hair-front':'-front.webp'))!==hairTag)throw Error('clothing moved hair');
    if(/portrait-[mf]-|player-female\\/jobs|player-female\\/default/.test(html))throw Error('flattened portrait used');
    htmls.push(html);checked++;
   }
  }
  const skin=PlayerModularArt.render('seed',gender,200,{...{[key+'Face']:4,[key+'Hair']:1,[key+'Outfit']:1},skinTone:'deep'});
  if([...skin.matchAll(/<image\\b[^>]+>/g)].some(m=>!m[0].includes('head')&&!m[0].includes('-face-')&&m[0].includes('filter=')))throw Error('skin tint touched clothes/hair');
 }
 for(const gender of ['M','F'])for(const id of Object.keys(aliases)){
   const a=PlayerModularArt.select('alias',gender),b=PlayerModularArt.select('alias',gender,{outfit:'hunter:'+id});
   if(a.face!==b.face||a.hair!==b.hair||!b.job)throw Error('job changes identity or alias missing');
 }
 const npc=PORTRAIT.card('other-npc','M',null,1,200,{bodyType:'strong'});
 const femaleNpc=PORTRAIT.avatar('other-female-npc','F',null,1,56,{});
 return {coverage,checked,htmls,npc,femaleNpc};
})()`,context);
assert.deepEqual(JSON.parse(JSON.stringify(result.coverage)),{M:1875,F:1500},'random selection must reach all independent combinations');
assert.equal(result.checked,45000);
assert(result.npc.startsWith('npc-card:'));assert(result.femaleNpc.startsWith('npc-avatar:'));
const sources=new Set();
for(const html of result.htmls)for(const m of html.matchAll(/<image href="([^"]+)"/g))sources.add(m[1]);
for(const src of sources){const clean=src.split('?')[0];assert(fs.existsSync(path.join(repo,clean)),src)}
console.log('PASS: 45,000 combinations; fixed head/hair registration across 74 job outfits; 3,375 random basic combinations reachable; original wrappers bypassed; NPC passthrough; skin-only tint; '+sources.size+' separate source images exist.');
