import http from 'node:http';
import {readFile, writeFile, readdir, stat, mkdir, rename} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const JSON_ROOT = path.join(ROOT, 'json');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8'};

function json(res, status, body) {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(JSON.stringify(body));}
function safeJsonPath(filename) {
  const cleaned = String(filename || '').replace(/\\/g, '/').replace(/^json\//, '');
  if (!cleaned || cleaned.includes('..') || path.isAbsolute(cleaned) || !/\.(json|geojson)$/i.test(cleaned)) throw new Error('Only safe .json or .geojson paths inside /json are allowed.');
  const resolved = path.resolve(JSON_ROOT, cleaned); if (!resolved.startsWith(path.resolve(JSON_ROOT) + path.sep)) throw new Error('JSON path escaped the json folder.');
  return {resolved, cleaned};
}
async function walk(dir = JSON_ROOT, prefix = '') {
  const output = [];
  for (const entry of await readdir(dir, {withFileTypes:true})) {
    if (entry.name === 'index.json') continue;
    const relative = path.posix.join(prefix, entry.name), absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute, relative));
    else if (/\.(json|geojson)$/i.test(entry.name)) {const info = await stat(absolute); output.push({name:relative,path:relative,size:info.size,modifiedAt:info.mtime.toISOString()});}
  }
  return output.sort((a,b)=>a.name.localeCompare(b.name));
}
async function writeIndex() {
  const files = await walk(); const payload = {schema:'belavados-json-folder-index-v1',generatedAt:new Date().toISOString(),files};
  await writeFile(path.join(JSON_ROOT,'index.json'), JSON.stringify(payload,null,2)); return payload;
}
async function body(req) {const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>80*1024*1024)throw new Error('Request exceeds 80 MB');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}
async function saveFile(payload) {
  const target = safeJsonPath(payload.filename); await mkdir(path.dirname(target.resolved),{recursive:true});
  let value = payload.data; if (typeof value === 'string') value = JSON.parse(value);
  const text = JSON.stringify(value,null,2), temp = `${target.resolved}.tmp-${process.pid}`;
  await writeFile(temp,text); await rename(temp,target.resolved);
  let snapshot = null;
  if (payload.createSnapshot) {
    const stamp = new Date().toISOString().replace(/[:.]/g,'-'), stem = target.cleaned.replace(/\.(json|geojson)$/i,'');
    const snapshotName = `snapshots/${stem}_${stamp}.json`, snapshotTarget = safeJsonPath(snapshotName);
    await mkdir(path.dirname(snapshotTarget.resolved),{recursive:true}); await writeFile(snapshotTarget.resolved,text); snapshot=snapshotName;
  }
  await writeIndex(); return {filename:target.cleaned,snapshot,bytes:Buffer.byteLength(text)};
}
async function staticFile(req,res,url) {
  let pathname = decodeURIComponent(url.pathname); if(pathname==='/')pathname='/index.html';
  const absolute = path.resolve(ROOT, `.${pathname}`); if(absolute!==ROOT && !absolute.startsWith(ROOT+path.sep))return json(res,403,{ok:false,error:'Forbidden'});
  try {const info=await stat(absolute);if(!info.isFile())throw new Error('Not a file');res.writeHead(200,{'Content-Type':MIME[path.extname(absolute).toLowerCase()]||'application/octet-stream','Content-Length':info.size,'Cache-Control':/\.(json|geojson)$/i.test(absolute)?'no-store':'public, max-age=60'});createReadStream(absolute).pipe(res);} catch {json(res,404,{ok:false,error:'Not found'});}
}

await mkdir(JSON_ROOT,{recursive:true}); await writeIndex();
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  try{
    if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});return res.end();}
    if(url.pathname==='/api/health')return json(res,200,{ok:true,service:'belavados-map-backend',jsonRoot:'json'});
    if(url.pathname==='/api/json/list')return json(res,200,{ok:true,files:(await writeIndex()).files});
    if(url.pathname==='/api/json/read'){const target=safeJsonPath(url.searchParams.get('file'));return json(res,200,{ok:true,filename:target.cleaned,data:JSON.parse(await readFile(target.resolved,'utf8'))});}
    if(url.pathname==='/api/json/save'&&req.method==='POST'){const saved=await saveFile(await body(req));return json(res,200,{ok:true,...saved});}
    return staticFile(req,res,url);
  }catch(error){return json(res,400,{ok:false,error:error.message});}
});
server.listen(PORT,HOST,()=>console.log(`Belavados editor: http://${HOST}:${PORT}`));
