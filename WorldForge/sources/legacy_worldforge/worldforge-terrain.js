(function(){
  const WF = window.WorldForge = window.WorldForge || {}, U = WF.utils, G = WF.geometry;
  function classifyProfile(biome, waterClass){
    const b = String(biome || '').toLowerCase(), w = String(waterClass || '').toLowerCase();
    return {
      underwater: b.includes('underwater') || w.includes('underwater') || w.includes('deep'),
      coastal: b.includes('coastal') || b.includes('beach') || b.includes('ocean') || w.includes('water') || b.includes('reef'),
      cavern: b.includes('cavern'), forest: b.includes('forest') || b.includes('rainforest') || b.includes('treetop'),
      marsh: b.includes('marsh') || b.includes('swamp'), mountain: b.includes('mountain') || b.includes('valley'), farm: b.includes('farm') || b.includes('prairie') || b.includes('grass') || b.includes('valley'),
      reef: b.includes('reef'), treetop: b.includes('tree')
    };
  }
  function buildMap(config, context){
    const rng = U.rngFromSeed(`${context.id}|${config.seed}|terrain`);
    const W=config.width, H=config.height, M=config.margin;
    const profile = classifyProfile(context.biome, context.waterClass);
    const center={x:W/2,y:H/2};
    const boundary = G.makeBlob(center.x, center.y+18, W*.42, H*.36, 26, rng, profile.cavern?.28:.15);
    const water=[];
    if(profile.underwater){ water.push({id:'water-deep-basin', type:'deepWater', name:'Deep pressure basin', polygon:G.makeBlob(center.x, center.y, W*.48, H*.40, 32, rng, .08)}); }
    else if(profile.coastal){
      const side = rng()<.5?'left':'bottom';
      if(side==='left') water.push({id:'water-coast', type:'water', name:'Coast / harbor water', polygon:[{x:0,y:0},{x:W*.23+rng()*40,y:0},{x:W*.18+rng()*60,y:H*.34},{x:W*.23+rng()*70,y:H*.72},{x:W*.18+rng()*60,y:H},{x:0,y:H}]});
      else water.push({id:'water-coast', type:'water', name:'Coast / harbor water', polygon:[{x:0,y:H*.78},{x:W*.3,y:H*.72+rng()*30},{x:W*.6,y:H*.76+rng()*30},{x:W,y:H*.69+rng()*40},{x:W,y:H},{x:0,y:H}]});
    }
    if(profile.marsh || (!profile.underwater && rng()<.55)){
      const river=[]; const sx=U.lerp(M,W-M,rng()), ex=U.lerp(M,W-M,rng());
      for(let i=0;i<8;i++){ const t=i/7; river.push({x:U.lerp(sx,ex,t)+Math.sin(t*6+rng()*2)*45,y:U.lerp(M,H-M,t)}); }
      water.push({id:'water-river-canal', type:profile.marsh?'marsh':'water', name:profile.marsh?'Marsh channel':'River / canal', line:river, width:profile.marsh?58:34});
    }
    if(profile.reef){
      for(let i=0;i<10;i++){ const p=G.sampleInPolygon(water[0]?.polygon || boundary, rng); water.push({id:`reef-${i}`, type:'reef', name:'Reef shelf', polygon:G.makeBlob(p.x,p.y,22+rng()*28,10+rng()*16,9,rng,.35)}); }
    }
    const districtSeeds = [
      ['civic', center.x, center.y-35, .9], ['market', center.x+W*.12, center.y+10, .75], ['residential', center.x-W*.13, center.y+15, .95],
      ['industrial', center.x+W*.21, center.y+H*.09, .65], ['religious', center.x-W*.2, center.y-H*.12, .58], ['nature', center.x-W*.22, center.y+H*.15, .7],
      ['agriculture', center.x+W*.17, center.y+H*.18, profile.farm?1:.45], ['harbor', profile.coastal?W*.23:center.x+W*.25, profile.coastal?H*.63:center.y+H*.2, profile.coastal||profile.underwater?1:.2],
      ['noble', center.x+W*.04, center.y-H*.23, .42], ['restricted', center.x-W*.02, center.y+H*.27, .35], ['transit', center.x+W*.27, center.y-H*.13, .65]
    ];
    const districts=[];
    for(const [role,x,y,weight] of districtSeeds){ if(rng() < weight){ const rx=(role==='residential'?145:role==='agriculture'?170:role==='harbor'?110:92)*(0.82+rng()*0.36); const ry=(role==='residential'?108:role==='agriculture'?98:role==='harbor'?70:72)*(0.82+rng()*0.36); districts.push({id:`district-${role}`, role, terrain:roleToTerrain(role), polygon:G.makeBlob(x+(rng()*2-1)*40,y+(rng()*2-1)*30,rx,ry,14,rng,.22), center:{x,y}}); } }
    const gates=[{id:'gate-west',x:M,y:center.y},{id:'gate-east',x:W-M,y:center.y+30},{id:'gate-north',x:center.x-30,y:M},{id:'gate-south',x:center.x+70,y:H-M}];
    const roads=[];
    for(const gate of gates){ roads.push(makeRoad(gate, center, rng, `road-${gate.id}`)); }
    districts.forEach(d=>{ roads.push(makeRoad(center, d.center, rng, `road-to-${d.role}`)); });
    const buildings = makeBuildings(districts, roads, boundary, water, profile, rng);
    const terrainPatches = makeTerrainPatches(W,H,boundary,profile,rng);
    const routeHooks = makeRouteHooks(context, profile, W, H, rng);
    const grid = makeMaskGrid(W,H,boundary,water,districts,buildings,roads);
    return { schema:'belavados.worldforge.map_plan.v1', width:W, height:H, boundary, profile, terrainPatches, water, districts, roads, buildings, gates, routeHooks, grid };
  }
  function roleToTerrain(role){ return ({civic:'civic',market:'market',residential:'residential',industrial:'industrial',religious:'religious',nature:'forest',agriculture:'farm',harbor:'harbor',noble:'residential',restricted:'restricted',transit:'road'}[role]||'open'); }
  function makeRoad(a,b,rng,id){ const pts=[a]; const n=2+Math.floor(rng()*2); for(let i=1;i<=n;i++){ const t=i/(n+1); pts.push({x:U.lerp(a.x,b.x,t)+(rng()*2-1)*38,y:U.lerp(a.y,b.y,t)+(rng()*2-1)*28}); } pts.push(b); return {id,type:'road',terrain:'road',points:pts,width:14+rng()*8}; }
  function makeBuildings(districts, roads, boundary, water, profile, rng){
    const buildings=[], boxes=[]; const max=profile.underwater?95:profile.treetop?120:150;
    for(const d of districts){
      const count = Math.floor(({residential:34,market:18,civic:12,industrial:16,religious:8,agriculture:10,harbor:12,noble:6,restricted:7,transit:10,nature:5}[d.role]||8) * (0.7+rng()*0.7));
      for(let i=0;i<count && buildings.length<max;i++){
        const p=G.sampleInPolygon(d.polygon,rng); if(!G.pointInPoly(p,boundary)) continue;
        if(water.some(w=> w.polygon && G.pointInPoly(p,w.polygon))) continue;
        const nearest=roads.reduce((best,r)=>Math.min(best,G.pointToPolylineDistance(p,r.points)),999);
        if(nearest>95 && !['agriculture','nature','restricted'].includes(d.role)) continue;
        const w=14+rng()*34, h=12+rng()*28; const poly=G.rectPoly(p.x-w/2,p.y-h/2,w,h,profile.cavern?5:2,rng); const bb=G.bbox(poly);
        if(boxes.some(b=>G.intersectsBbox(b,bb,5))) continue; boxes.push(bb);
        buildings.push({id:`building-${buildings.length+1}`, districtId:d.id, role:d.role, terrain:'building', polygon:poly, height: 1+Math.floor(rng()*4), roof: roofColor(d.role)});
      }
    }
    return buildings;
  }
  function roofColor(role){ return ({civic:'#6d768a',market:'#8a5a33',residential:'#744a35',industrial:'#4d5358',religious:'#77622e',agriculture:'#6e7338',harbor:'#3f5e70',noble:'#55416e',restricted:'#2d2438',transit:'#53596a',nature:'#334f31'}[role]||'#704f3b'); }
  function makeTerrainPatches(W,H,boundary,profile,rng){
    const patches=[];
    const types = profile.cavern?['cavern','cliff','stone'] : profile.forest?['forest','deepForest','open'] : profile.marsh?['marsh','forest','open'] : profile.farm?['farm','field','open'] : ['open','forest','farm'];
    for(let i=0;i<24;i++){ const p=G.sampleInPolygon(boundary,rng); const type=U.pick(types,rng); patches.push({id:`terrain-${type}-${i}`, type, terrain:type, name:type, polygon:G.makeBlob(p.x,p.y,40+rng()*110,24+rng()*70,12,rng,.36)}); }
    return patches;
  }
  function makeRouteHooks(context, profile, W, H, rng){
    const modes=(context.transportation||[]).map(x=>String(x).toLowerCase()); const hooks=[];
    const add=(mode,x,y)=>hooks.push({id:`route-hook-${mode}`, mode, terrain:mode.includes('ferry')||mode.includes('submarine')?'harbor':'road', x,y});
    if(modes.some(m=>m.includes('train')||m.includes('rail'))) add('train', W*.78, H*.23);
    if(modes.some(m=>m.includes('caravan'))) add('caravan', W*.08, H*.52);
    if(modes.some(m=>m.includes('ferry'))) add('ferry', W*.2, H*.68);
    if(modes.some(m=>m.includes('steamship'))) add('steamship', W*.18, H*.75);
    if(modes.some(m=>m.includes('submarine')) || profile.underwater) add('submarine', W*.28, H*.72);
    if(modes.some(m=>m.includes('skyship'))) add('skyship', W*.75, H*.16);
    if(modes.some(m=>m.includes('portal'))) add('portal', W*.54, H*.45);
    if(!hooks.length){ add('caravan',W*.08,H*.52); add('train',W*.78,H*.23); }
    return hooks;
  }
  function makeMaskGrid(W,H,boundary,water,districts,buildings,roads){
    const cells=[], step=40;
    for(let y=step/2;y<H;y+=step){ for(let x=step/2;x<W;x+=step){
      const p={x,y}; let terrain='void';
      if(G.pointInPoly(p,boundary)) terrain='open';
      for(const w of water){ if(w.polygon && G.pointInPoly(p,w.polygon)) terrain=w.type; if(w.line && G.pointToPolylineDistance(p,w.line)<(w.width||20)/2) terrain=w.type; }
      for(const d of districts){ if(G.pointInPoly(p,d.polygon)) terrain=d.terrain; }
      for(const r of roads){ if(G.pointToPolylineDistance(p,r.points)<(r.width||12)/2) terrain='road'; }
      for(const b of buildings){ if(G.pointInPoly(p,b.polygon)) terrain='building'; }
      cells.push({x,y,terrain,walkable:!['void','water','deepWater'].includes(terrain)});
    }}
    return {step,cells};
  }
  WF.terrain = { buildMap, classifyProfile };
})();
