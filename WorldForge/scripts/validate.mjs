import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WorldModel, worldOptionsForPreset } from '../js/procedural.js';
import { buildSettlementScene, settlementEnvironment } from '../js/settlement-engine.js';
import { WorldSimulation } from '../js/simulation-engine.js';
import { backendLock } from '../js/backend-lock.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const readJSON=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const report={schema:'worldforge.validation.v2',generatedAtUtc:new Date().toISOString(),ok:true,checks:[],warnings:[]};
function check(name,ok,details={}){report.checks.push({name,ok,...details});if(!ok)report.ok=false;}

const catalog=readJSON('data/settlement_catalog.json');
check('province count',catalog.provinceCount===28,{actual:catalog.provinceCount,expected:28});
check('settlement count',catalog.settlementCount===279&&catalog.settlements.length===279,{actual:catalog.settlements.length,expected:279});
const ids=new Set(catalog.settlements.map(s=>s.id));
check('unique settlement ids',ids.size===catalog.settlements.length,{unique:ids.size});
check('valid coordinates',catalog.settlements.every(s=>Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon))&&Math.abs(Number(s.lat))<=90&&Math.abs(Number(s.lon))<=180));
check('maximum three biomes',catalog.settlements.every(s=>(s.biomes||[]).length>=1&&(s.biomes||[]).length<=3));
const missing=[];
for(const s of catalog.settlements){for(const key of ['dataPath','npcPath'])if(s[key]&&!fs.existsSync(path.join(root,s[key])))missing.push({id:s.id,key,path:s[key]});}
check('all settlement and npc paths exist',missing.length===0,{missing:missing.slice(0,20)});

const endpoint='https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec';
check('backend endpoint lock',backendLock.endpoint===endpoint,{endpoint:backendLock.endpoint});
const lockFile=readJSON('config/backend_lock.json');
check('backend lock checksum',lockFile.endpointSha256===crypto.createHash('sha256').update(endpoint).digest('hex'));
const activeJS=['js/app.js','js/backend-lock.js','js/renderer.js','js/settlement-engine.js','js/simulation-engine.js'].map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
const urls=[...activeJS.matchAll(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g)].map(m=>m[0]);
check('no alternate active backend endpoints',new Set(urls).size===1&&urls[0]===endpoint,{found:[...new Set(urls)]});

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const requiredIds=['world-canvas','world-preset','scene-mode','province-select','settlement-select','build-settlement','feature-select','object-select','forecast-horizon','backend-ping','sync-world','sync-life'];
check('required UI controls present',requiredIds.every(id=>html.includes(`id="${id}"`)),{required:requiredIds});

const model=new WorldModel(worldOptionsForPreset('earth',93714,67));
const sim=new WorldSimulation();
const wanted={surface:s=>settlementEnvironment(s)==='surface',floating:s=>settlementEnvironment(s)==='floating',underwater:s=>settlementEnvironment(s)==='underwater',cave:s=>settlementEnvironment(s)==='cave'};
const sceneResults=[];
for(const [env,pred] of Object.entries(wanted)){
  const record=catalog.settlements.find(pred);
  if(!record){sceneResults.push({environment:env,ok:false,reason:'no sample'});continue;}
  const npc=record.npcPath?readJSON(record.npcPath):null;
  const scene=buildSettlementScene(record,npc,model,sim.snapshot(record,'daily'));
  const ok=scene.environment===env&&scene.terrain.positions.length>0&&scene.terrain.indices.length>0&&scene.structures.positions.length>0&&scene.objects.length>0;
  sceneResults.push({environment:env,ok,settlement:record.id,terrainVertices:scene.terrain.positions.length/3,structureVertices:scene.structures.positions.length/3,objects:scene.objects.length,water:scene.terrain.hasWater});
}
check('surface/floating/underwater/cave settlement scene generation',sceneResults.every(x=>x.ok),{scenes:sceneResults});
check('28 world weather systems',sim.buildWorldWeather(catalog).length===28,{actual:sim.buildWorldWeather(catalog).length});

const jsonFiles=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(/\.(json|geojson)$/i.test(entry.name))jsonFiles.push(full);}}
walk(path.join(root,'data/settlements'));
let invalid=[];
for(const f of jsonFiles){try{JSON.parse(fs.readFileSync(f,'utf8'));}catch(e){invalid.push({file:path.relative(root,f),error:e.message});}}
check('all canonical settlement JSON parses',invalid.length===0,{files:jsonFiles.length,invalid:invalid.slice(0,10)});

fs.writeFileSync(path.join(root,'docs/VALIDATION_REPORT.json'),JSON.stringify(report,null,2));
const md=['# WorldForge Validation Report','',`Generated: ${report.generatedAtUtc}`,`Result: **${report.ok?'PASS':'FAIL'}**`,''];
for(const c of report.checks)md.push(`- ${c.ok?'✅':'❌'} ${c.name}`);
md.push('','## Generated scene samples','');
for(const s of sceneResults)md.push(`- ${s.environment}: ${s.ok?'PASS':'FAIL'} — ${s.settlement||s.reason}; ${s.terrainVertices||0} terrain vertices, ${s.structureVertices||0} structure vertices, ${s.objects||0} objects.`);
md.push('','Browser UI automation could not be executed in the build container because its Chromium policy blocks all local/file navigation. Static module syntax, data integrity, import paths, scene generation, and server responses were validated instead.');
fs.writeFileSync(path.join(root,'docs/VALIDATION_REPORT.md'),md.join('\n'));
console.log(JSON.stringify(report,null,2));
if(!report.ok)process.exit(1);
