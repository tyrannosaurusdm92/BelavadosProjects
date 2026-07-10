(function (global) {
  'use strict';

  const U = {};
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smoothstep = (a, b, x) => {
    const t = U.clamp((x - a) / (b - a || 1), 0, 1);
    return t * t * (3 - 2 * t);
  };
  U.degToRad = d => d * Math.PI / 180;
  U.radToDeg = r => r * 180 / Math.PI;
  U.wrapLon = lon => ((lon + 540) % 360) - 180;
  U.mod = (n, m) => ((n % m) + m) % m;
  U.hash = (x, y = 0, z = 0) => {
    let h = Math.imul((x | 0) ^ 0x9e3779b9, 0x85ebca6b);
    h ^= Math.imul((y | 0) ^ 0xc2b2ae35, 0x27d4eb2d);
    h ^= Math.imul((z | 0) ^ 0x165667b1, 0x9e3779b1);
    h ^= h >>> 15;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    return (h >>> 0) / 4294967295;
  };
  U.noise2 = (x, y, seed = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    const a = U.hash(xi, yi, seed), b = U.hash(xi + 1, yi, seed);
    const c = U.hash(xi, yi + 1, seed), d = U.hash(xi + 1, yi + 1, seed);
    return U.lerp(U.lerp(a, b, sx), U.lerp(c, d, sx), sy);
  };
  U.fbm = (x, y, seed = 0, octaves = 5) => {
    let value = 0, amp = 0.5, freq = 1, sum = 0;
    for (let i = 0; i < octaves; i++) {
      value += U.noise2(x * freq, y * freq, seed + i * 101) * amp;
      sum += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return value / sum;
  };

  U.latLonToIndex = (lat, lon, width, height) => {
    const x = Math.floor(U.mod((lon + 180) / 360, 1) * width) % width;
    const y = U.clamp(Math.floor((90 - lat) / 180 * height), 0, height - 1);
    return y * width + x;
  };
  U.indexToLatLon = (idx, width, height) => {
    const y = Math.floor(idx / width), x = idx % width;
    return {
      lat: 90 - (y + 0.5) / height * 180,
      lon: (x + 0.5) / width * 360 - 180
    };
  };
  U.latLonToXYZ = (lat, lon, r = 1) => {
    const p = U.degToRad(lat), l = U.degToRad(lon);
    const cp = Math.cos(p);
    return [r * cp * Math.cos(l), r * Math.sin(p), r * cp * Math.sin(l)];
  };
  U.xyzToLatLon = (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1;
    return { lat: U.radToDeg(Math.asin(y / r)), lon: U.wrapLon(U.radToDeg(Math.atan2(z, x))) };
  };

  U.hexToRgb = hex => {
    const h = String(hex).replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.mixRgb = (a, b, t) => [
    Math.round(U.lerp(a[0], b[0], t)),
    Math.round(U.lerp(a[1], b[1], t)),
    Math.round(U.lerp(a[2], b[2], t))
  ];
  U.colorRamp = (stops, t) => {
    t = U.clamp(t, 0, 1);
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        return U.mixRgb(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1));
      }
    }
    return stops[stops.length - 1][1].slice();
  };

  U.downloadBlob = (name, blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  U.downloadJSON = (name, value) => U.downloadBlob(name, new Blob([JSON.stringify(value, null, 2)], {type: 'application/json'}));
  U.readFileText = file => new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsText(file);
  });
  U.readFileDataURL = file => new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file);
  });
  U.loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });
  U.formatNumber = (n, digits = 1) => Number(n).toLocaleString(undefined, {maximumFractionDigits: digits});
  U.formatDate = d => new Intl.DateTimeFormat(undefined, {year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}).format(d);
  U.escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  U.uid = () => Math.random().toString(36).slice(2, 9);

  // Minimal matrix helpers (column-major, WebGL convention)
  U.mat4Identity = () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  U.mat4Multiply = (a,b) => {
    const o = new Float32Array(16);
    for (let c=0;c<4;c++) for(let r=0;r<4;r++) {
      o[c*4+r] = a[0*4+r]*b[c*4+0] + a[1*4+r]*b[c*4+1] + a[2*4+r]*b[c*4+2] + a[3*4+r]*b[c*4+3];
    }
    return o;
  };
  U.mat4Perspective = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy/2), nf = 1/(near-far);
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]);
  };
  U.mat4Translate = (x,y,z) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
  U.mat4RotX = a => { const c=Math.cos(a),s=Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); };
  U.mat4RotY = a => { const c=Math.cos(a),s=Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); };
  U.rotateInvXY = (v, pitch, yaw) => {
    // inverse R_x(pitch) * R_y(yaw)
    let [x,y,z] = v;
    const cp=Math.cos(-pitch), sp=Math.sin(-pitch);
    let y1=y*cp-z*sp, z1=y*sp+z*cp;
    const cy=Math.cos(-yaw), sy=Math.sin(-yaw);
    return [x*cy+z1*sy, y1, -x*sy+z1*cy];
  };
  U.normalize3 = v => { const n=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/n,v[1]/n,v[2]/n]; };
  U.cross3 = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  U.add3 = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
  U.scale3 = (a,s) => [a[0]*s,a[1]*s,a[2]*s];

  global.WeatherCreatorUtils = U;
})(window);
