import * as THREE from 'three';
import { cabbage, carrot, egg, scallion, shoppingCart, strawberry, tomato } from './ingredients';

const stillMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// x, y는 area 안 가운데 위치(%), size는 넓은 화면 기준 크기(px), depth는 마우스를 따라오는 정도
const LAYOUT = [
  { make: tomato, x: 14, y: 34, size: 150, depth: 1.4 },
  { make: egg, x: 37, y: 23, size: 100, depth: 0.8 },
  { make: scallion, x: 54, y: 35, size: 140, depth: 1.1 },
  { make: strawberry, x: 76, y: 53, size: 115, depth: 2.2 },
  { make: carrot, x: 29, y: 75, size: 145, depth: 2.6 },
  { make: cabbage, x: 62, y: 78, size: 160, depth: 1.8 },
];
const CART = { x: 46, y: 54, size: 300 };

// 로딩 화면 3D: area 위에 재료 6개와 카트를 띄움. collect()로 재료가 차례로 카트에 담기고, 다 차면 카트가 출동함
// 출동 중에는 onFlash({x, y}, 처음인지)를 매 프레임 불러서 빛이 카트를 따라가게 함
// paused()가 true인 동안은 그리지 않음. 다 쓰면 dispose()로 WebGL을 정리해야 함 (브라우저가 띄울 수 있는 개수가 정해져 있음)
export function mountIntroScene({ area, host, paused = () => false, onFlash = () => {} }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);
  // three 0.155부터 빛 세기 기준이 π배 달라져서 시안(r128)과 같게 맞춤. 위쪽 주 조명은 줄이고 정면 보조광을 조금 올림
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe8c9a8, 0.5 * Math.PI));
  [
    [0xffffff, 0.8, [-4, 7, 6]],
    [0xfff1e0, 0.5, [5, 3, -4]],
    [0xffffff, 0.45, [0, 2, 10]],
  ].forEach(([color, power, pos]) => {
    const light = new THREE.DirectionalLight(color, power * Math.PI);
    light.position.set(...pos);
    scene.add(light);
  });

  const items = LAYOUT.map((f, i) => {
    const holder = new THREE.Group();
    holder.add(f.make());
    holder.userData = { ...f, seed: i * 1.7, state: 'home', home: new THREE.Vector3(), base: 1 };
    scene.add(holder);
    return holder;
  });
  const basket = new THREE.Group();
  basket.add(shoppingCart());
  basket.userData = { ...CART, home: new THREE.Vector3(), base: 1, bump: 0 };
  scene.add(basket);

  // 화면 px ↔ 3D 좌표 (카메라 정면 z=0 평면 기준)
  let W = 1;
  let H = 1;
  let unit = 1;
  const toWorld = (px, py, out = new THREE.Vector3()) => out.set((px - W / 2) * unit, -(py - H / 2) * unit, 0);
  function resize() {
    W = area.clientWidth;
    H = area.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    unit = (2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / H;
    const shrink = Math.min(1, Math.max(0.55, W / 1100));
    [...items, basket].forEach((o) => {
      const d = o.userData;
      toWorld((d.x / 100) * W, (d.y / 100) * H, d.home);
      d.base = (d.size * shrink * unit) / (o === basket ? 3.2 : 2.2);
      if (d.state === 'home' || o === basket) {
        o.position.copy(d.home);
        o.scale.setScalar(d.base);
      }
    });
  }
  resize();
  addEventListener('resize', resize);

  // 마우스 위치: area 가운데 기준 -0.5 ~ 0.5
  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;
  const onMove = (e) => {
    const r = area.getBoundingClientRect();
    mx = (e.clientX - r.left) / W - 0.5;
    my = (e.clientY - r.top) / H - 0.5;
  };
  const onLeave = () => {
    mx = 0;
    my = 0;
  };
  area.addEventListener('pointermove', onMove);
  area.addEventListener('pointerleave', onLeave);

  // 재료를 하나씩 카트 안 자리(카트 기준 좌표)로 날려 보냄
  let started = false;
  let landed = 0;
  const timers = [];
  function collect() {
    if (started || paused()) {
      return;
    }
    started = true;
    items.forEach((o, i) => {
      timers.push(
        setTimeout(() => {
          const d = o.userData;
          const slot = new THREE.Vector3(((i % 3) - 1) * 0.6, 0.2 + Math.floor(i / 3) * 0.3, (Math.floor(i / 3) - 0.5) * 0.45);
          d.state = 'flying';
          d.flyFrom = o.position.clone();
          d.flyTo = basket.children[0].localToWorld(slot);
          d.flyScale = d.base * 0.5;
          d.flyStart = performance.now();
        }, i * 170),
      );
    });
  }

  // 출동할 때 바퀴 뒤로 날리는 먼지
  const puffs = [];
  const puffMat = new THREE.MeshBasicMaterial({ color: 0xf3e6d0, transparent: true });
  function kickDust() {
    const width = basket.userData.base * 3.2;
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), puffMat.clone());
      p.position.set(basket.position.x - width * (0.2 + Math.random() * 0.25), basket.position.y - width * (0.3 + Math.random() * 0.06), 0.5);
      p.userData = { born: performance.now(), size: width * (0.015 + Math.random() * 0.02), drift: -width * (0.05 + Math.random() * 0.15) };
      scene.add(p);
      puffs.push(p);
    }
  }

  // 처음 상태로: 카트에 담긴 재료를 꺼내 제자리로
  function reset() {
    timers.splice(0).forEach(clearTimeout);
    items.forEach((o) => {
      const d = o.userData;
      scene.attach(o);
      d.state = 'home';
      o.position.copy(d.home);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(d.base);
    });
    started = false;
    landed = 0;
    basket.userData.bump = 0;
    basket.userData.departStart = 0;
    puffs.splice(0).forEach((p) => scene.remove(p));
  }

  // 카트의 화면 위치(px, 화면 기준)
  function cartScreen() {
    const v = basket.position.clone().project(camera);
    const r = area.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * W, y: r.top + ((1 - v.y) / 2) * H };
  }

  let frame = 0;
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (paused()) {
      return;
    }
    const t = time / 1000;
    cx += (mx - cx) * 0.07;
    cy += (my - cy) * 0.07;

    const b = basket.userData;
    b.bump *= 0.88;
    basket.scale.setScalar(b.base * (1 + b.bump * 0.12));
    basket.rotation.y = cx * 0.3;
    basket.rotation.z = b.bump * 0.08 * Math.sin(t * 30);
    basket.position.y = b.home.y + (stillMotion ? 0 : Math.sin(t * 0.9) * 4 * unit);
    basket.position.x = b.home.x;
    if (b.departStart) {
      // 출동: 살짝 뒤로 물러나며 앞을 들었다가, 앞으로 숙이고 오른쪽으로 쌩
      const sec = (performance.now() - b.departStart) / 1000;
      const width = b.base * 3.2;
      if (sec < 0.28) {
        const k = Math.sin(((sec / 0.28) * Math.PI) / 2);
        basket.position.x -= width * 0.12 * k;
        basket.rotation.z = 0.14 * k;
      } else {
        if (!b.dusted) {
          b.dusted = true;
          kickDust();
        }
        const k = Math.min(1, (sec - 0.28) / 0.9);
        basket.position.x += width * (-0.12 + 4 * k * k);
        basket.rotation.z = 0.14 - 0.26 * Math.min(1, k * 3);
        basket.position.y += Math.abs(Math.sin(k * 18)) * width * 0.02;
        // 빛은 달려 나가는 중에 시작해서, 커지는 동안 카트를 따라감 (화면 밖으로는 안 나가게)
        if (k > 0.25) {
          const p = cartScreen();
          p.x = Math.min(p.x, innerWidth * 0.82);
          onFlash(p, !b.flashed);
          b.flashed = true;
        }
      }
    }
    puffs.forEach((p) => {
      const k = Math.min(1, (performance.now() - p.userData.born) / 600);
      p.scale.setScalar(p.userData.size * (1 + k * 1.5));
      p.position.x += p.userData.drift * 0.02;
      p.material.opacity = 0.7 * (1 - k);
    });

    items.forEach((o) => {
      const d = o.userData;
      if (d.state === 'in') {
        return;
      }
      if (d.state === 'flying') {
        // 포물선을 그리며 카트 안으로. 도착하면 카트에 붙여서 같이 움직임
        const k = Math.min(1, (performance.now() - d.flyStart) / 520);
        const e = 1 - (1 - k) ** 2;
        o.position.lerpVectors(d.flyFrom, d.flyTo, e);
        o.position.y += Math.sin(k * Math.PI) * 1.4;
        o.scale.setScalar(d.base + (d.flyScale - d.base) * e);
        o.rotation.z += 0.18 * (1 - k);
        if (k >= 1) {
          d.state = 'in';
          basket.children[0].attach(o);
          b.bump = 1;
          landed += 1;
          if (landed === items.length) {
            timers.push(setTimeout(() => Object.assign(b, { departStart: performance.now(), flashed: false, dusted: false }), 300));
          }
        }
        return;
      }
      const idle = stillMotion ? 0 : Math.sin(t * 0.9 + d.seed) * 8;
      const target = d.home.clone().add(new THREE.Vector3(cx * d.depth * 70 * unit, -(cy * d.depth * 70 + idle) * unit, 0));
      o.position.lerp(target, 0.12);
      o.scale.setScalar(d.base);
      o.rotation.y = (stillMotion ? 0 : Math.sin(t * 0.6 + d.seed) * 0.5) + cx * d.depth * 0.4;
      o.rotation.x = cy * d.depth * 0.25;
    });
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(tick);

  function dispose() {
    cancelAnimationFrame(frame);
    timers.splice(0).forEach(clearTimeout);
    removeEventListener('resize', resize);
    area.removeEventListener('pointermove', onMove);
    area.removeEventListener('pointerleave', onLeave);
    scene.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return { collect, reset, dispose };
}
