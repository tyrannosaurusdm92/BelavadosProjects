import {readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','json');
async function walk(dir=root,prefix=''){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name==='index.json')continue;const rel=path.posix.join(prefix,entry.name),abs=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(abs,rel));else if(/\.(json|geojson)$/i.test(entry.name)){const info=await stat(abs);out.push({name:rel,path:rel,size:info.size,modifiedAt:info.mtime.toISOString()});}}return out;}
const files=(await walk()).sort((a,b)=>a.name.localeCompare(b.name));
await writeFile(path.join(root,'index.json'),JSON.stringify({schema:'belavados-json-folder-index-v1',generatedAt:new Date().toISOString(),files},null,2));
console.log(`Indexed ${files.length} JSON files.`);
