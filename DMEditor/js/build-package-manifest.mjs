import {createHash} from 'node:crypto';
import {readFile, readdir, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUTPUT='data/package-manifest.json';
const SKIP=new Set([OUTPUT.replaceAll('/',path.sep)]);

async function walk(dir=ROOT){
  const entries=await readdir(dir,{withFileTypes:true});
  const files=[];
  for(const entry of entries){
    if(entry.name==='node_modules' || entry.name==='.git') continue;
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

const absoluteFiles=(await walk()).filter(file=>!SKIP.has(path.relative(ROOT,file)));
const files=[];
let totalBytes=0;
for(const absolute of absoluteFiles.sort()){
  const relative=path.relative(ROOT,absolute).replaceAll(path.sep,'/');
  const info=await stat(absolute);
  const bytes=await readFile(absolute);
  totalBytes+=info.size;
  files.push({path:relative,bytes:info.size,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const htmlFiles=files.filter(file=>/\.html?$/i.test(file.path)).map(file=>file.path);
const manifest={
  schema:'belavados-dmeditor-package-manifest-v2',
  generatedAt:new Date().toISOString(),
  entryPoint:'index.html',
  htmlFileCount:htmlFiles.length,
  htmlFiles,
  fileCount:files.length,
  totalBytes,
  maxFileSizeKiB:24000,
  repositoryPath:'DMEditor',
  jsonRepositoryPath:'DMEditor/json',
  files
};
await writeFile(path.join(ROOT,OUTPUT),JSON.stringify(manifest,null,2)+'\n');
console.log(`Manifested ${files.length} files (${totalBytes} bytes); HTML files: ${htmlFiles.join(', ') || 'none'}.`);
