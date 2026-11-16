// 지역 전체를 도시 근처 4칸에 몰아넣던 배치를 생활권·야외로 분산한다.
{
  const oldPos = UI.npcPos;
  const pools = new Map();
  const regionPools = region => {
    if (pools.has(region)) return pools.get(region);
    const city = [], near = [], field = [];
    const centers = [
      ...(WORLD.cityPos[region] ? [{ x: WORLD.cityPos[region][0], y: WORLD.cityPos[region][1], r: ['gangnam','busan','daegu'].includes(region) ? Math.max(2,Math.round(WORLD.K*.9)) : Math.max(1,Math.round(WORLD.K*.45)) }] : []),
      ...WORLD.towns.filter(t=>t.region===region).map(t=>({x:t.x,y:t.y,r:Math.max(1,Math.round(WORLD.K*(t.tier===2?.4:.22)))})),
    ];
    for (let i=0;i<WORLD.COLS*WORLD.ROWS;i++) {
      const [x,y]=WORLD.xy(i);
      if (WORLD.regionAt(x,y)?.id!==region) continue;
      if (WORLD.type(x,y)===WORLD.T.CITY) city.push(i);
    }
    for (const i of WORLD.regionTiles[region] || []) {
      const [x,y]=WORLD.xy(i);
      const d=Math.min(...centers.map(t=>Math.max(0,Math.hypot(x-t.x,y-t.y)-t.r)));
      (d<=4?near:field).push(i);
    }
    const result={city,near,field}; pools.set(region,result); return result;
  };
  const positions = new Map();
  UI.npcPos = function (n) {
    if (!WORLD.regionTiles[n.region]?.length || n.isCompanion) return oldPos.call(this,n);
    const key=`spread1:${n.id}:${G.monthKey()}:${n.region}`;
    const cached=positions.get(n.id); if(cached?.key===key)return cached.pos;
    const p=regionPools(n.region), h=FX.hash(key)>>>0;
    // 약 20%는 도시·마을 안, 15%는 근교, 나머지는 지역 야외에 머문다.
    const roll=(FX.hash('place:'+key)>>>0)%100;
    let pool=roll<20?p.city:roll<35?p.near:p.field;
    if(!pool.length)pool=p.field.length?p.field:p.near.length?p.near:p.city;
    if(!pool.length)return oldPos.call(this,n);
    let pos=null;
    // 게이트·괴수 표식 위에 겹치지 않는 칸을 결정적으로 고른다. 게임 RNG는 소비하지 않는다.
    for(let k=0;k<Math.min(32,pool.length);k++) {
      const next=WORLD.xy(pool[(h+k*37)%pool.length]);
      if(!G.objAt(next[0],next[1])){pos=next;break;}
    }
    pos ||= WORLD.xy(pool[h%pool.length]);
    positions.set(n.id,{key,pos});return pos;
  };
  UI.settlementNpcs = function () {
    const p=G.player, town=WORLD.townAt(p.x,p.y);
    const city=WORLD.cityAt(p.x,p.y);
    if(!town&&!city)return [];
    return G.npcsHere().filter(n=>{
      if(n.isCompanion)return false;
      const [x,y]=this.npcPos(n), nt=WORLD.townAt(x,y);
      return town ? nt?.id===town.id : !nt&&WORLD.cityAt(x,y)?.id===city.id;
    });
  };
}
