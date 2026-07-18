import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context={globalThis:{}};vm.createContext(context);vm.runInContext(await readFile(new URL('../js/map-domain.js',import.meta.url),'utf8'),context);
const domain=context.globalThis.BelavadosMapDomain;

test('territories always normalize to six anchors and calculate both areas',()=>{
  const t=domain.updateTerritoryArea({anchors:[{x:10,y:10},{x:50,y:10},{x:50,y:40},{x:10,y:40}]});
  assert.equal(t.anchors.length,6); assert.equal(t.anchorCount,6); assert.ok(t.squareMiles>0); assert.ok(t.squareKilometers>t.squareMiles);
  const before=t.squareMiles;t.anchors[0].x+=25;domain.updateTerritoryArea(t);assert.notEqual(t.squareMiles,before);
});
test('province ownership follows the polygon containing a point',()=>{
  const provinces=[{name:'A',anchors:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]},{name:'B',anchors:[{x:200,y:0},{x:300,y:0},{x:300,y:100},{x:200,y:100}]}];
  assert.equal(domain.findProvinceAt({x:250,y:50},provinces).name,'B'); assert.equal(domain.findProvinceAt({x:150,y:50},provinces),null);
});
test('placement changes biomes, resources, and transport',()=>{
  const s=domain.applyPlacement({type:'Capital City'},'reef',[]);
  assert.ok(s.biomes.includes('Underwater with reefs')); assert.ok(s.resourcesAndServicesProvided.includes('Coral')); assert.ok(s.publicTransit.includes('Submarine')); assert.ok(s.publicTransit.includes('Portal'));
  assert.ok(!s.publicTransit.includes('Skyship'));
});
test('routes rebuild from current settlement coordinates',()=>{
  const province={name:'A',settlements:[{name:'One',settlementId:'one',x:0,y:0,publicTransit:['Train']},{name:'Two',settlementId:'two',x:10,y:0,publicTransit:['Train']},{name:'Three',settlementId:'three',x:20,y:0,publicTransit:['Train']}]};
  const routes=domain.rebuildRoutes([province]);
  assert.ok(routes.length>=2); assert.ok(routes.every(r=>r.modes.includes('Train')));
  province.settlements[1].x=80;const moved=domain.rebuildRoutes([province]);assert.notDeepEqual(moved.map(r=>r.points),routes.map(r=>r.points));
});
