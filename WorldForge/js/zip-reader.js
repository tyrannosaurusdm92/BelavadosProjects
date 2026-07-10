const textDecoder = new TextDecoder('utf-8');

function findEOCD(bytes) {
  const min=Math.max(0,bytes.length-65557);
  for(let i=bytes.length-22;i>=min;i--) if(bytes[i]===0x50&&bytes[i+1]===0x4b&&bytes[i+2]===0x05&&bytes[i+3]===0x06) return i;
  return -1;
}
async function inflateRaw(data){
  if(typeof DecompressionStream==='undefined') throw new Error('This browser cannot decompress ZIP deflate streams.');
  const stream=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
export async function readZip(arrayBuffer){
  const bytes=new Uint8Array(arrayBuffer), view=new DataView(arrayBuffer), eocd=findEOCD(bytes);
  if(eocd<0) throw new Error('ZIP central directory not found.');
  const entryCount=view.getUint16(eocd+10,true), centralOffset=view.getUint32(eocd+16,true);
  const entries=[]; let p=centralOffset;
  for(let i=0;i<entryCount;i++){
    if(view.getUint32(p,true)!==0x02014b50) throw new Error(`Invalid ZIP central entry at ${p}.`);
    const method=view.getUint16(p+10,true), compressedSize=view.getUint32(p+20,true), uncompressedSize=view.getUint32(p+24,true);
    const nameLen=view.getUint16(p+28,true), extraLen=view.getUint16(p+30,true), commentLen=view.getUint16(p+32,true), localOffset=view.getUint32(p+42,true);
    const name=textDecoder.decode(bytes.slice(p+46,p+46+nameLen));
    p+=46+nameLen+extraLen+commentLen;
    if(name.endsWith('/')) continue;
    if(view.getUint32(localOffset,true)!==0x04034b50) continue;
    const localNameLen=view.getUint16(localOffset+26,true), localExtraLen=view.getUint16(localOffset+28,true);
    const start=localOffset+30+localNameLen+localExtraLen;
    const compressed=bytes.slice(start,start+compressedSize);
    let data;
    if(method===0) data=compressed;
    else if(method===8) data=await inflateRaw(compressed);
    else continue;
    entries.push({name,method,compressedSize,uncompressedSize,data});
  }
  return entries;
}
export function entryText(entry){ return textDecoder.decode(entry.data); }
export function entryBlob(entry){
  const ext=entry.name.split('.').pop().toLowerCase();
  const mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',json:'application/json',geojson:'application/geo+json',xml:'application/xml'}[ext]||'application/octet-stream';
  return new Blob([entry.data],{type:mime});
}
export async function extractDocx(arrayBuffer){
  const entries=await readZip(arrayBuffer);
  const document=entries.find(e=>e.name==='word/document.xml');
  const media=entries.filter(e=>e.name.startsWith('word/media/'));
  let text='';
  if(document){
    text=entryText(document)
      .replace(/<w:tab\/?\s*>/g,'\t')
      .replace(/<w:br\/?\s*>/g,'\n')
      .replace(/<\/w:p>/g,'\n')
      .replace(/<[^>]+>/g,'')
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/\n{3,}/g,'\n\n').trim();
  }
  return {text,media,entries};
}
