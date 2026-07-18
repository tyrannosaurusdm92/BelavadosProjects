import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
async function walk(dir=ROOT){const out=[];for(const name of await readdir(dir)){const p=path.join(dir,name),info=await stat(p);if(info.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const rel=p=>path.relative(ROOT,p).replaceAll(path.sep,'/');

test('package contains exactly one HTML file',async()=>{
  const html=(await walk()).filter(p=>/\.html?$/i.test(p));
  assert.deepEqual(html.map(rel),['index.html']);
});

test('backend and repository paths are fixed to DMEditor',async()=>{
  const lock=await readFile(path.join(ROOT,'js/backend-lock.js'),'utf8');
  assert.match(lock,/BelavadosProjects\/DMEditor\//);
  assert.match(lock,/jsonRepositoryPath:\s*'DMEditor\/json'/);
  assert.match(lock,/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/);
  assert.match(lock,/1v06thwdjlv-j82hqHibJF3_gik7i8p9fFfK9nj0EOfi8VHhwT11jK5Eb/);
});

test('invalid replacement backend and world_map.html are absent',async()=>{
  const files=(await walk()).map(rel);
  assert.ok(!files.includes('backend/Code.gs'));
  assert.ok(!files.includes('world_map.html'));
  const exportList=JSON.parse(await readFile(path.join(ROOT,'data/export-file-list.json'),'utf8'));
  assert.ok(exportList.files.every(x=>!x.toLowerCase().endsWith('.html')));
});

test('editor restores visible editing defaults and old import controls',async()=>{
  const html=await readFile(path.join(ROOT,'index.html'),'utf8');
  for(const id of ['borderOverlayToggle','provinceBorderOverlayToggle','showProvinceCenterPin','showSettlementPins','provinceEditorMode']){
    assert.match(html,new RegExp(`checked="" id="${id}"`));
  }
  for(const id of ['importProvinceJson','importSettlementJson','uploadWorldMap','exportEditorHtml']) assert.match(html,new RegExp(`id="${id}"`));
  const enhancements=await readFile(path.join(ROOT,'js/editor-enhancements.js'),'utf8');
  assert.match(enhancements,/setEditableDefaults\(\)/);
  assert.doesNotMatch(enhancements,/updateRouteStatus\(\);setEverythingHidden\(\)/);
});

test('shared backend uses authenticated real actions',async()=>{
  const client=await readFile(path.join(ROOT,'js/backend-client.js'),'utf8');
  for(const action of ['auth.login','auth.signup','files.upload','files.list','records.create','records.update','records.list']) assert.match(client,new RegExp(action.replace('.','\\.')));
  assert.doesNotMatch(client,/action:\s*'save'/);
  assert.doesNotMatch(client,/action:\s*'read'/);
  assert.doesNotMatch(client,/action:\s*'list'/);
});

test('interactive export generates one index.html from a non-HTML template',async()=>{
  const enhancements=await readFile(path.join(ROOT,'js/editor-enhancements.js'),'utf8');
  assert.match(enhancements,/world_map_template\.txt/);
  assert.match(enhancements,/root\.file\('index\.html', template\)/);
  const template=await readFile(path.join(ROOT,'data/world_map_template.txt'),'utf8');
  assert.match(template,/<!DOCTYPE html>/i);
});

test('no file exceeds 24,000 KiB',async()=>{
  const limit=24000*1024;
  const offenders=[];
  for(const file of await walk()){const info=await stat(file);if(info.size>limit)offenders.push({file:rel(file),size:info.size});}
  assert.deepEqual(offenders,[]);
});

test('manifests identify index.html as the only HTML entry',async()=>{
  const packageManifest=JSON.parse(await readFile(path.join(ROOT,'data/package-manifest.json'),'utf8'));
  const sourceManifest=JSON.parse(await readFile(path.join(ROOT,'data/source-editor-manifest.json'),'utf8'));
  const worldManifest=JSON.parse(await readFile(path.join(ROOT,'data/corrected-world-map-manifest.json'),'utf8'));
  assert.equal(packageManifest.htmlFileCount,1);
  assert.deepEqual(packageManifest.htmlFiles,['index.html']);
  assert.equal(sourceManifest.entryFile,'index.html');
  assert.equal(worldManifest.entryPoint,'index.html');
  const combined=JSON.stringify({packageManifest,sourceManifest,worldManifest});
  assert.doesNotMatch(combined,/world_map\.html|source_file_uploader_reference\.html|backend\/Code\.gs/);
});

test('updated index export enforces the 24,000 KiB limit',async()=>{
  const enhancements=await readFile(path.join(ROOT,'js/editor-enhancements.js'),'utf8');
  assert.match(enhancements,/exportBytes>24000\*1024/);
});
