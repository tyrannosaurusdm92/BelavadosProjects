function strToBytes(str){ return new TextEncoder().encode(String(str)); }
function u16(n){ return [n & 255, (n>>>8)&255]; }
function u32(n){ return [n & 255, (n>>>8)&255, (n>>>16)&255, (n>>>24)&255]; }
function dosTime(date=new Date()){
  const year=Math.max(1980,date.getFullYear());
  const time=(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2);
  const day=((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();
  return {time,day};
}
const CRC_TABLE = (()=>{ const t=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); t[n]=c>>>0; } return t; })();
function crc32(bytes){ let c=0xffffffff; for(let i=0;i<bytes.length;i++) c=CRC_TABLE[(c^bytes[i])&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function concat(chunks){ const total=chunks.reduce((n,c)=>n+c.length,0); const out=new Uint8Array(total); let off=0; for(const c of chunks){ out.set(c,off); off+=c.length; } return out; }
async function toBytes(content){
  if(content instanceof Uint8Array) return content;
  if(content instanceof ArrayBuffer) return new Uint8Array(content);
  if(content instanceof Blob) return new Uint8Array(await content.arrayBuffer());
  return strToBytes(content);
}
export async function createZipBlob(entries){
  const localChunks=[]; const centralChunks=[]; let offset=0; const now=dosTime(new Date());
  for(const entry of entries){
    const nameBytes=strToBytes(entry.name.replace(/^\/+/,''));
    const data=await toBytes(entry.content);
    const crc=crc32(data); const size=data.length;
    const local=concat([new Uint8Array([0x50,0x4b,0x03,0x04]), new Uint8Array(u16(20)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(now.time)), new Uint8Array(u16(now.day)), new Uint8Array(u32(crc)), new Uint8Array(u32(size)), new Uint8Array(u32(size)), new Uint8Array(u16(nameBytes.length)), new Uint8Array(u16(0)), nameBytes, data]);
    localChunks.push(local);
    const central=concat([new Uint8Array([0x50,0x4b,0x01,0x02]), new Uint8Array(u16(20)), new Uint8Array(u16(20)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(now.time)), new Uint8Array(u16(now.day)), new Uint8Array(u32(crc)), new Uint8Array(u32(size)), new Uint8Array(u32(size)), new Uint8Array(u16(nameBytes.length)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u32(0)), new Uint8Array(u32(offset)), nameBytes]);
    centralChunks.push(central);
    offset += local.length;
  }
  const centralStart=offset; const central=concat(centralChunks); const centralSize=central.length;
  const end=concat([new Uint8Array([0x50,0x4b,0x05,0x06]), new Uint8Array(u16(0)), new Uint8Array(u16(0)), new Uint8Array(u16(entries.length)), new Uint8Array(u16(entries.length)), new Uint8Array(u32(centralSize)), new Uint8Array(u32(centralStart)), new Uint8Array(u16(0))]);
  return new Blob([concat([...localChunks, central, end])], {type:'application/zip'});
}
export function safeFilePart(value, fallback='voice'){
  return String(value || fallback).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,80) || fallback;
}
