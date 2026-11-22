// 여성 직업복 연결 검사. 스모크 테스트가 아니다.
const fs=require('fs'),vm=require('vm'),assert=require('assert');const path=require('path');const root=path.resolve(__dirname,'..')+'/';
const test=fs.readFileSync(root+'tools/player_female_art_test.js','utf8');const env=test.match(/vm.runInContext\(`([\s\S]*?)`,c\);/)[1];const c=vm.createContext({});vm.runInContext(env,c);
const source=fs.readFileSync(root+'js/job_outfits.js','utf8');const aliases=source.match(/const aliases=(\{[^\n]+\});/)[1];const catalog=JSON.parse(fs.readFileSync(root+'assets/portraits/outfits/manifest.json','utf8')).classes;
vm.runInContext('const aliases='+aliases+';const catalog='+JSON.stringify(catalog)+';const byId=new Map(catalog.map(c=>[c.id,c]));const prefix="hunter:";'+source.match(/const idOf=[^\n]+/)[0]+'const HunterOutfits={get(outfit,gender){const id=idOf(outfit),c=byId.get(aliases[id]||id);return c?{...c.variants[gender==="F"?"f":"m"],classId:id,familyId:c.id,name:c.name}:null}};',c);
vm.runInContext(fs.readFileSync(root+'js/player_female_art.js','utf8'),c);
const cases=vm.runInContext(`[...catalog.map(x=>x.id),...Object.keys(aliases)].map(id=>({id,family:(HunterOutfits.get('hunter:'+id,'F')||{}).familyId,html:PORTRAIT.card('player','F',null,1,200,{outfit:'hunter:'+id})}))`,c);
for(const x of cases){assert(x.html.includes('/jobs/job-'+x.family+'.webp'));assert(fs.existsSync(root+'assets/portraits/player-female/jobs/job-'+x.family+'.webp'));assert(!/transform=|filter=|clip-path=/.test(x.html));}
for(const g of ['M','F']){const a=['npc',g,null,1,200,{outfit:'hunter:swordsman'}];assert.equal(vm.runInContext('PORTRAIT.card(...'+JSON.stringify(a)+')',c),JSON.stringify(a));}
const ordinary=vm.runInContext(`PORTRAIT.card('player','F',null,1,200,{outfit:'casual'})`,c);assert(!ordinary.includes('/jobs/'));console.log('PASS female job outfit integration: '+cases.length+' class/alias mappings, 37 files, female player only, ordinary art fallback, no geometry transforms');
