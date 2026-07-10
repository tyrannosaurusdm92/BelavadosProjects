(function(global){
  'use strict';

  const td = new TextDecoder('utf-8');

  function u16(view, off){ return view.getUint16(off, true); }
  function u32(view, off){ return view.getUint32(off, true); }

  function decodeName(bytes){
    try { return td.decode(bytes); } catch (_) { return Array.from(bytes).map(b => String.fromCharCode(b)).join(''); }
  }

  function findEndOfCentralDirectory(view){
    const sig = 0x06054b50;
    const max = Math.max(0, view.byteLength - 0xFFFF - 22);
    for(let i = view.byteLength - 22; i >= max; i--){
      if(u32(view, i) === sig) return i;
    }
    throw new Error('ZIP central directory not found. The archive may be corrupt or unsupported.');
  }

  async function inflateRaw(bytes){
    if(typeof DecompressionStream === 'undefined'){
      throw new Error('This browser cannot inflate ZIP deflate entries. Use Chrome/Edge 80+ or upload uncompressed ZIP entries.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).arrayBuffer();
  }

  async function read(arrayBuffer, parentPath){
    const view = new DataView(arrayBuffer);
    const eocd = findEndOfCentralDirectory(view);
    const total = u16(view, eocd + 10);
    const cdOffset = u32(view, eocd + 16);
    const entries = [];
    let ptr = cdOffset;
    for(let i=0; i<total; i++){
      if(u32(view, ptr) !== 0x02014b50) throw new Error('Bad ZIP central directory entry at ' + ptr);
      const method = u16(view, ptr + 10);
      const crc = u32(view, ptr + 16);
      const compressedSize = u32(view, ptr + 20);
      const uncompressedSize = u32(view, ptr + 24);
      const nameLen = u16(view, ptr + 28);
      const extraLen = u16(view, ptr + 30);
      const commentLen = u16(view, ptr + 32);
      const localOffset = u32(view, ptr + 42);
      const name = decodeName(new Uint8Array(arrayBuffer, ptr + 46, nameLen));
      ptr += 46 + nameLen + extraLen + commentLen;
      if(name.endsWith('/')) continue;
      if(name.includes('__MACOSX/') || name.endsWith('.DS_Store')) continue;
      const safeName = name.replace(/^\/+/, '').replace(/\.\./g, '_');
      const localSig = u32(view, localOffset);
      if(localSig !== 0x04034b50) continue;
      const lfNameLen = u16(view, localOffset + 26);
      const lfExtraLen = u16(view, localOffset + 28);
      const dataStart = localOffset + 30 + lfNameLen + lfExtraLen;
      const compressed = new Uint8Array(arrayBuffer, dataStart, compressedSize);
      let content;
      if(method === 0){
        content = compressed.slice().buffer;
      } else if(method === 8){
        content = await inflateRaw(compressed);
      } else {
        entries.push({ name: safeName, path: joinPath(parentPath, safeName), unsupported: true, method, size: uncompressedSize, crc });
        continue;
      }
      entries.push({ name: safeName.split('/').pop(), path: joinPath(parentPath, safeName), arrayBuffer: content, size: uncompressedSize, crc, method });
    }
    return entries;
  }

  function joinPath(a,b){
    if(!a) return b;
    return String(a).replace(/\/$/,'') + '/' + String(b).replace(/^\//,'');
  }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.ZipReader = { read };
})(window);
