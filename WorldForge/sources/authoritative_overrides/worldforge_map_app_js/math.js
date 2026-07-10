export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a || 1), 0, 1);
  return t * t * (3 - 2 * t);
};
export const degToRad = d => d * Math.PI / 180;
export const radToDeg = r => r * 180 / Math.PI;

export const v3 = (x = 0, y = 0, z = 0) => new Float32Array([x, y, z]);
export const vec3 = {
  add(a, b, out = v3()) { out[0] = a[0] + b[0]; out[1] = a[1] + b[1]; out[2] = a[2] + b[2]; return out; },
  sub(a, b, out = v3()) { out[0] = a[0] - b[0]; out[1] = a[1] - b[1]; out[2] = a[2] - b[2]; return out; },
  scale(a, s, out = v3()) { out[0] = a[0] * s; out[1] = a[1] * s; out[2] = a[2] * s; return out; },
  dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
  cross(a, b, out = v3()) {
    const ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by; out[1] = az * bx - ax * bz; out[2] = ax * by - ay * bx; return out;
  },
  length(a) { return Math.hypot(a[0], a[1], a[2]); },
  normalize(a, out = v3()) { const l = Math.hypot(a[0], a[1], a[2]) || 1; out[0] = a[0]/l; out[1] = a[1]/l; out[2] = a[2]/l; return out; },
  copy(a, out = v3()) { out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; return out; },
  distance(a, b) { return Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]); }
};

export function mat4Identity() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
}
export function mat4Multiply(a, b, out = new Float32Array(16)) {
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c*4+r] = a[0*4+r]*b[c*4+0] + a[1*4+r]*b[c*4+1] + a[2*4+r]*b[c*4+2] + a[3*4+r]*b[c*4+3];
    }
  }
  return out;
}
export function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([
    f/aspect,0,0,0,
    0,f,0,0,
    0,0,(far+near)*nf,-1,
    0,0,(2*far*near)*nf,0
  ]);
}
export function mat4LookAt(eye, target, up = v3(0,1,0)) {
  const z = vec3.normalize(vec3.sub(eye, target));
  const x = vec3.normalize(vec3.cross(up, z));
  const y = vec3.cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -vec3.dot(x,eye), -vec3.dot(y,eye), -vec3.dot(z,eye), 1
  ]);
}
export function transformPoint(m, p, out = new Float32Array(4)) {
  const x=p[0], y=p[1], z=p[2], w=p[3] ?? 1;
  out[0]=m[0]*x+m[4]*y+m[8]*z+m[12]*w;
  out[1]=m[1]*x+m[5]*y+m[9]*z+m[13]*w;
  out[2]=m[2]*x+m[6]*y+m[10]*z+m[14]*w;
  out[3]=m[3]*x+m[7]*y+m[11]*z+m[15]*w;
  return out;
}
export function latLonToUnit(latDeg, lonDeg, out = v3()) {
  const lat=degToRad(latDeg), lon=degToRad(lonDeg), c=Math.cos(lat);
  out[0] = c * Math.cos(lon);
  out[1] = Math.sin(lat);
  out[2] = c * Math.sin(lon);
  return out;
}
export function unitToLatLon(p) {
  const n=vec3.normalize(p);
  return { lat: radToDeg(Math.asin(n[1])), lon: radToDeg(Math.atan2(n[2], n[0])) };
}
export function seededRandom(seed = 1) {
  let s = (Number(seed) || 1) >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t=s;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
export function raySphere(origin, dir, radius = 1) {
  const b = 2 * vec3.dot(origin, dir);
  const c = vec3.dot(origin, origin) - radius * radius;
  const d = b*b - 4*c;
  if (d < 0) return null;
  const s = Math.sqrt(d), t0=(-b-s)/2, t1=(-b+s)/2;
  const t = t0 > 0 ? t0 : t1 > 0 ? t1 : null;
  if (t == null) return null;
  return vec3.add(origin, vec3.scale(dir, t));
}
