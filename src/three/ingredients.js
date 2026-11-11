import * as THREE from "three";

// 로딩 화면에 띄우는 3D 재료와 장바구니 모델
// 색은 r128 시안과 같게 보이도록 선형 값으로 그대로 씀
const lin = c => new THREE.Color().setHex(c, THREE.LinearSRGBColorSpace);
const mat = (c, r = 0.45) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: r });
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const leafM = mat(0x5cc22a, 0.42), leafD = mat(0x3f9a1c, 0.45);
function shape(g, f) {
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); f(v); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  return g;
}
function sepals(n, len, y, parent, tilt) {
  for (let i = 0; i < n; i++) {
    const piv = new THREE.Group();
    piv.position.y = y;
    piv.rotation.y = i * Math.PI * 2 / n + 0.3;
    const s = mesh(new THREE.SphereGeometry(1, 32, 16), leafM);
    s.scale.set(len, 0.11, 0.2);
    s.position.x = len * 0.8;
    s.rotation.z = -tilt;
    piv.add(s);
    parent.add(piv);
  }
}
export function tomato() {
  const g = new THREE.Group();
  const body = shape(new THREE.SphereGeometry(1, 128, 96), v => {
    const n = v.clone().normalize(), phi = Math.acos(n.y), th = Math.atan2(n.z, n.x);
    const k = 1 + 0.03 * Math.cos(5 * th) * Math.sin(phi) ** 2 - 0.16 * Math.exp(-((phi / 0.34) ** 2)) - 0.06 * Math.exp(-(((Math.PI - phi) / 0.45) ** 2));
    v.copy(n).multiplyScalar(k);
    v.y *= 0.86;
  });
  g.add(mesh(body, mat(0xe8331c, 0.38)));
  sepals(6, 0.5, 0.72, g, 0.22);
  const st = mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.4, 20), leafD);
  st.position.set(0.03, 0.88, 0);
  st.rotation.z = -0.3;
  g.add(st);
  g.position.y = -0.21;
  return g;
}
export function egg() {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const a = i / 48 * Math.PI;
    pts.push(new THREE.Vector2(Math.max(Math.sin(a) * 0.72 * (1 + 0.13 * Math.cos(a)), 0.0001), -Math.cos(a)));
  }
  const g = new THREE.Group();
  g.add(mesh(new THREE.LatheGeometry(pts, 96), mat(0xe2b289, 0.55)));
  g.scale.setScalar(0.8);
  g.rotation.z = 0.18;
  g.position.y = -0.2;
  return g;
}
function lathe(points) {
  const c = new THREE.SplineCurve(points.map(p => new THREE.Vector2(p[0], p[1])));
  return new THREE.LatheGeometry(c.getPoints(60).map(p => new THREE.Vector2(Math.max(p.x, 0.0001), p.y)), 64);
}
export function carrot() {
  // 통통한 몸통에 가로 홈 3줄
  const body = shape(lathe([[0, 1], [0.3, 0.98], [0.44, 0.9], [0.48, 0.74], [0.46, 0.4], [0.38, 0], [0.28, -0.45], [0.16, -0.85], [0.06, -1.12], [0, -1.18]]), v => {
    const groove = [0.5, 0.05, -0.42].reduce((k, y) => k - 0.07 * Math.exp(-(((v.y - y) / 0.035) ** 2)), 1);
    v.x *= groove;
    v.z *= groove;
  });
  const g = new THREE.Group();
  g.add(mesh(body, mat(0xff7417, 0.4)));
  // 잎은 부채꼴로 5장
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.32;
    const l = mesh(new THREE.SphereGeometry(1, 32, 16), i % 2 ? leafD : leafM);
    l.scale.set(0.13, 0.55, 0.2);
    l.position.set(Math.sin(a) * 0.5, 1.0 + Math.cos(a) * 0.5, (i % 2 ? -0.08 : 0.08));
    l.rotation.z = -a;
    g.add(l);
  }
  g.scale.setScalar(0.85);
  g.rotation.z = -1.15;
  g.position.y = -0.58;
  return g;
}
export function strawberry() {
  // 위는 둥글고 넓게, 아래로 갈수록 좁아지다 끝은 뭉툭하게
  const deform = v => {
    v.y *= 1.25;
    const t = Math.max(0, (0.35 - v.y) / 1.6);
    const k = 1 - 0.52 * t ** 2;
    v.x *= k * 1.02;
    v.z *= k * 1.02;
    if (v.y > 0.95) {
      v.y = 0.95 + (v.y - 0.95) * 0.35;
    }
    return v;
  };
  const body = shape(new THREE.SphereGeometry(1, 96, 72), deform);
  const g = new THREE.Group();
  g.add(mesh(body, mat(0xbf1410, 0.3)));
  // 씨: 엇갈린 줄로 박고, 씨마다 살짝 파인 자국(진한 빨강)을 깔아 줌
  const at = (th, ph) => deform(new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)));
  const pitM = mat(0x7e0b08, 0.45), seedM = mat(0xffc93a, 0.35);
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const th = Math.PI * (0.3 + 0.6 * r / (rows - 1));
    const count = Math.max(5, Math.round(15 * Math.sin(th) * (1 - 0.45 * r / rows)));
    for (let c = 0; c < count; c++) {
      const ph = (c + (r % 2) * 0.5) / count * Math.PI * 2;
      const e = 0.01;
      const p0 = at(th, ph);
      const n = new THREE.Vector3().crossVectors(at(th, ph + e).sub(p0), at(th + e, ph).sub(p0)).normalize();
      const pit = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), pitM);
      pit.scale.set(1, 1.25, 0.18);
      pit.position.copy(p0);
      pit.lookAt(p0.clone().add(n));
      g.add(pit);
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), seedM);
      seed.scale.set(1, 1.5, 0.7);
      seed.position.copy(p0).addScaledVector(n, 0.012);
      seed.lookAt(p0.clone().add(n));
      g.add(seed);
    }
  }
  // 꼭지: 크고 통통한 꽃받침이 위를 덮고, 굵은 줄기가 휘어 올라감
  sepals(7, 0.52, 1.0, g, 0.42);
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.98, 0), new THREE.Vector3(0.05, 1.35, 0), new THREE.Vector3(0.25, 1.5, 0));
  g.add(mesh(new THREE.TubeGeometry(curve, 24, 0.09, 14), leafM));
  const cap = mesh(new THREE.SphereGeometry(0.09, 14, 10), leafM);
  cap.position.set(0.25, 1.5, 0);
  g.add(cap);
  g.scale.setScalar(0.72);
  g.rotation.z = -0.3;
  g.position.y = -0.05;
  return g;
}
export function cabbage() {
  // 연두 속통 위로 속잎이 겹친 선이 보이고, 진한 바깥 잎 5장이 아래쪽을 감싸며 윗가장자리가 바깥으로 젖혀짐
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(1, 64, 48), mat(0x8fcf63, 0.5)));
  const seamM = mat(0x6cb446, 0.5);
  const onSphere = (r, th, ph) => new THREE.Vector3(-r * Math.cos(ph) * Math.sin(th), r * Math.cos(th), r * Math.sin(ph) * Math.sin(th));
  // 속잎 겹친 선: 위쪽을 비스듬히 가로지르는 호 3개
  [0.2, 1.4, 2.6].forEach((ph0, i) => {
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push(onSphere(1.01, Math.PI * (0.42 - 0.3 * Math.sin(t * Math.PI)), ph0 + t * 1.9 + i * 0.2));
    }
    g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.022, 6), seamM));
  });
  const greens = [0x4f9e2f, 0x5fae3a];
  const veinM = mat(0xd5edb5, 0.5);
  const top = 0.4, len = 0.58;
  for (let i = 0; i < 5; i++) {
    const R = 1.03 + (i % 2) * 0.02;
    // 윗가장자리 근처일수록 바깥으로 젖혀짐
    const flare = th => R * (1 + 0.16 * Math.max(0, 1 - (th / Math.PI - top) / 0.22) ** 2);
    const leafMat = new THREE.MeshStandardMaterial({ color: lin(greens[i % 2]), roughness: 0.5, side: THREE.DoubleSide });
    const span = Math.PI * 0.62;
    const leaf = mesh(shape(new THREE.SphereGeometry(R, 48, 32, 0, span, Math.PI * top, Math.PI * len), v => {
      const th = Math.acos(Math.min(1, Math.max(-1, v.y / v.length())));
      const ph = Math.atan2(v.z, -v.x);
      // 잎 윗선을 가운데가 솟은 아치로: 양옆으로 갈수록 윗가장자리를 아래로 내림
      const arch = 1 - Math.sin(Math.min(1, Math.max(0, ph / span)) * Math.PI);
      const t = Math.max(0, 1 - (th / Math.PI - top) / len);
      v.copy(onSphere(1, th + arch * t ** 1.5 * Math.PI * 0.16, ph)).setLength(flare(th));
    }), leafMat);
    const holder = new THREE.Group();
    holder.rotation.y = i * Math.PI * 2 / 5;
    // 가운데 굵은 잎맥과, 중간에서 양옆 위로 갈라지는 가는 잎맥
    const mid = Math.PI * 0.31;
    const vein = (from, to, ph0, ph1, r) => {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10, th = Math.PI * (from + (to - from) * t);
        pts.push(onSphere(flare(th) + 0.012, th, ph0 + (ph1 - ph0) * t));
      }
      leaf.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, r, 6), veinM));
    };
    vein(0.96, top + 0.03, mid, mid, 0.028);
    vein(0.74, top + 0.13, mid, mid - 0.45, 0.016);
    vein(0.74, top + 0.13, mid, mid + 0.45, 0.016);
    holder.add(leaf);
    g.add(holder);
  }
  g.scale.set(0.8, 0.74, 0.8);
  g.position.y = -0.2;
  return g;
}
export function scallion() {
  // 흰 대 + 연두 이음새 + 초록 잎 3갈래 + 잔뿌리
  const g = new THREE.Group();
  const white = mat(0xf7f3e4, 0.45);
  const stalk = mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.0, 24), white);
  stalk.position.y = -0.6;
  g.add(stalk);
  const bottom = mesh(new THREE.SphereGeometry(0.26, 24, 16), white);
  bottom.position.y = -1.1;
  bottom.scale.y = 0.6;
  g.add(bottom);
  const neck = mesh(new THREE.CylinderGeometry(0.21, 0.24, 0.45, 24), mat(0xd3ec9a, 0.45));
  neck.position.y = 0.12;
  g.add(neck);
  [[-0.35, 1.35], [0.05, 1.5], [0.4, 1.3]].forEach(([dx, top]) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(dx * 0.3, 0.9, 0), new THREE.Vector3(dx, top, 0));
    g.add(mesh(new THREE.TubeGeometry(curve, 32, 0.12, 12), leafM));
    const end = mesh(new THREE.SphereGeometry(0.12, 12, 8), leafM);
    end.position.set(dx, top, 0);
    g.add(end);
  });
  const rootM = mat(0xe8dcc0, 0.6);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.35;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.sin(a) * 0.1, -1.18, 0), new THREE.Vector3(Math.sin(a) * 0.2, -1.3, 0.05), new THREE.Vector3(Math.sin(a) * 0.32, -1.38, 0));
    g.add(mesh(new THREE.TubeGeometry(curve, 8, 0.022, 6), rootM));
  }
  g.scale.setScalar(0.95);
  g.rotation.z = -1.1;
  g.position.y = -0.55;
  return g;
}

// 철망 장바구니. 앞(+x)이 넓게 열리고 뒤(-x)에 손잡이, 아래에 바퀴 4개
export function shoppingCart() {
  const g = new THREE.Group();
  const wire = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x046a38), metalness: 0.35, roughness: 0.3 });
  const grip = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x02391e), roughness: 0.5 });
  const rubber = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x1f1b16), roughness: 0.6 });
  const up = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rod = (a, b, r = 0.026, m = wire) => {
    const dir = b.clone().sub(a);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 8), m);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(up, dir.normalize());
    g.add(c);
  };
  const lerp = (a, b, t) => a.clone().lerp(b, t);
  // 바구니 위·아래 테두리 (뒤, 앞, 앞, 뒤 / 왼쪽 z-, 오른쪽 z+)
  const top = [V(-1.15, 0.55, -0.7), V(1.25, 0.55, -0.7), V(1.25, 0.55, 0.7), V(-1.15, 0.55, 0.7)];
  const bottom = [V(-1.0, -0.35, -0.58), V(0.95, -0.35, -0.58), V(0.95, -0.35, 0.58), V(-1.0, -0.35, 0.58)];
  for (let i = 0; i < 4; i++) {
    rod(top[i], top[(i + 1) % 4], 0.045);
    rod(bottom[i], bottom[(i + 1) % 4], 0.035);
    rod(top[i], bottom[i], 0.035);
  }
  // 옆면 세로 철사와 가운데 가로 테
  [[0, 1], [3, 2]].forEach(([a, b]) => {
    for (let k = 1; k < 10; k++) {
      rod(lerp(top[a], top[b], k / 10), lerp(bottom[a], bottom[b], k / 10));
    }
  });
  [[1, 2], [0, 3]].forEach(([a, b]) => {
    for (let k = 1; k < 6; k++) {
      rod(lerp(top[a], top[b], k / 6), lerp(bottom[a], bottom[b], k / 6));
    }
  });
  for (let i = 0; i < 4; i++) {
    rod(lerp(top[i], bottom[i], 0.5), lerp(top[(i + 1) % 4], bottom[(i + 1) % 4], 0.5));
  }
  // 바닥 철망
  for (let k = 1; k < 6; k++) {
    rod(lerp(bottom[0], bottom[3], k / 6), lerp(bottom[1], bottom[2], k / 6), 0.02);
  }
  // 손잡이
  [-0.7, 0.7].forEach(z => rod(V(-1.15, 0.55, z), V(-1.55, 1.15, z), 0.04));
  rod(V(-1.55, 1.15, -0.8), V(-1.55, 1.15, 0.8), 0.075, grip);
  // 받침대와 바퀴
  [-0.5, 0.5].forEach(z => {
    const s = Math.sign(z);
    rod(V(-1.0, -0.35, 0.58 * s), V(-0.9, -0.95, z), 0.035);
    rod(V(0.95, -0.35, 0.58 * s), V(0.85, -0.95, z), 0.035);
    rod(V(-0.9, -0.95, z), V(0.85, -0.95, z), 0.035);
    [-0.9, 0.85].forEach(x => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 20), rubber);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, -1.08, z);
      g.add(wheel);
      rod(V(x, -0.95, z), V(x, -1.04, z), 0.03);
    });
  });
  // 사진처럼 앞쪽 비스듬히 보이게
  g.rotation.set(0.18, -0.55, 0);
  return g;
}
