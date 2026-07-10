(function(global){
  'use strict';

  const encoder = new TextEncoder();
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n]=c>>>0;
    }
    return table;
  })();

  function crc32(bytes){
    let c = 0xffffffff;
    for(let i=0;i<bytes.length;i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function dosDateTime(date){
    date = date || new Date();
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds()/2);
    const d = ((date.getFullYear()-1980) << 9) | ((date.getMonth()+1) << 5) | date.getDate();
    return { time, date:d };
  }

  function strBytes(s){ return encoder.encode(s.replace(/^\/+/, '')); }

  class ZipWriter{
    constructor(){ this.files=[]; }
    addText(path, text){ this.addBytes(path, encoder.encode(String(text))); }
    addJSON(path, obj){ this.addText(path, JSON.stringify(obj, null, 2)); }
    addBytes(path, bytes){
      if(bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
      if(bytes instanceof Blob) throw new Error('Use addBlob for Blob values.');
      this.files.push({ path:path.replace(/^\/+/, ''), bytes:new Uint8Array(bytes), date:new Date() });
    }
    async addBlob(path, blob){ this.addBytes(path, new Uint8Array(await blob.arrayBuffer())); }
    async blob(){
      const chunks = [];
      const central = [];
      let offset = 0;
      for(const file of this.files){
        const name = strBytes(file.path);
        const c = crc32(file.bytes);
        const dt = dosDateTime(file.date);
        const local = new Uint8Array(30 + name.length);
        const v = new DataView(local.buffer);
        v.setUint32(0, 0x04034b50, true);
        v.setUint16(4, 20, true);
        v.setUint16(6, 0, true);
        v.setUint16(8, 0, true); // stored, no compression
        v.setUint16(10, dt.time, true); v.setUint16(12, dt.date, true);
        v.setUint32(14, c, true);
        v.setUint32(18, file.bytes.length, true); v.setUint32(22, file.bytes.length, true);
        v.setUint16(26, name.length, true); v.setUint16(28, 0, true);
        local.set(name, 30);
        chunks.push(local, file.bytes);
        const cd = new Uint8Array(46 + name.length);
        const cv = new DataView(cd.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
        cv.setUint16(8, 0, true); cv.setUint16(10, 0, true);
        cv.setUint16(12, dt.time, true); cv.setUint16(14, dt.date, true);
        cv.setUint32(16, c, true);
        cv.setUint32(20, file.bytes.length, true); cv.setUint32(24, file.bytes.length, true);
        cv.setUint16(28, name.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true); cv.setUint32(42, offset, true);
        cd.set(name, 46);
        central.push(cd);
        offset += local.length + file.bytes.length;
      }
      const cdStart = offset;
      for(const c of central){ chunks.push(c); offset += c.length; }
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, this.files.length, true); ev.setUint16(10, this.files.length, true);
      ev.setUint32(12, offset - cdStart, true); ev.setUint32(16, cdStart, true);
      chunks.push(eocd);
      return new Blob(chunks, { type:'application/zip' });
    }
  }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.ZipWriter = ZipWriter;
})(window);
