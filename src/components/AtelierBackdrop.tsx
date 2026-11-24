"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// The opening is cut out of the lower edge so the three portals share a floor.
function arch(radius: number, crown: number) {
  const spring = 0.15;
  const shape = new THREE.Shape();
  shape.moveTo(-12, -6);
  shape.lineTo(-radius, -6);
  shape.lineTo(-radius, spring);
  shape.absellipse(0, spring, radius, crown - spring, Math.PI, 0, true, 0);
  shape.lineTo(radius, -6);
  shape.lineTo(12, -6);
  shape.lineTo(12, 8);
  shape.lineTo(-12, 8);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.24, bevelEnabled: true, bevelThickness: 0.065,
    bevelSize: 0.055, bevelSegments: 4, curveSegments: 48, steps: 1,
  });
}

type Props = { color: string; subdued: boolean; className?: string };

export default function AtelierBackdrop({ color, subdued, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const tint = useRef(new THREE.Color(color));
  const exposure = useRef(1);
  const repaint = useRef<(() => void) | null>(null);
  useEffect(() => {
    tint.current.set(color);
    exposure.current = subdued ? 0.68 : 1;
    repaint.current?.();
  }, [color, subdued]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    } catch { return; }
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.z = 9;
    const set = new THREE.Group();
    scene.add(set);
    const surfaces: { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; value: number }[] = [];
    function surface(geometry: THREE.BufferGeometry, z: number, value: number) {
      const material = new THREE.MeshStandardMaterial({ roughness: 0.83, metalness: 0.06 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = z;
      set.add(mesh);
      surfaces.push({ mesh, value });
      return mesh;
    }
    surface(new THREE.PlaneGeometry(38, 22), -3.4, 0.88);
    surface(arch(1.60, 2.40), -1.85, 0.83);
    surface(arch(1.91, 2.66), -0.92, 0.69);
    surface(arch(2.22, 2.94), 0, 0.57);
    const floor = surface(new THREE.PlaneGeometry(40, 20), 0, 0.64);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.15;
    scene.add(new THREE.HemisphereLight(0xffefd9, 0x4e4351, 0.56));
    const key = new THREE.PointLight(0xffead0, 58, 24);
    key.position.set(-3.1, 3.3, 2.1);
    scene.add(key);
    const fill = new THREE.PointLight(0xe6edff, 24, 15);
    fill.position.set(2.7, -0.45, -1.15);
    scene.add(fill);
    const pool = new THREE.PointLight(0xffe4c0, 12, 12);
    pool.position.set(-0.8, 0.8, -2.35);
    scene.add(pool);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = new THREE.Vector2();
    const current = tint.current.clone();
    const plaster = new THREE.Color("#807571");
    let level = exposure.current, frame = 0, last = 0, visible = false;
    function render(now: number) {
      frame = 0;
      if (!visible || document.hidden) { last = 0; return; }
      const dt = last ? Math.min((now - last) / 1000, 0.06) : 1 / 60;
      last = now;
      const k = reduce.matches ? 1 : 1 - Math.exp(-5 * dt);
      current.lerp(tint.current, k);
      level += (exposure.current - level) * k;
      const x = reduce.matches ? 0 : pointer.x * 0.16;
      const y = reduce.matches ? 0 : pointer.y * 0.065;
      camera.position.x += (x - camera.position.x) * k;
      camera.position.y += (y - camera.position.y) * k;
      camera.lookAt(0, 0, -1.5);
      for (const { mesh, value } of surfaces) {
        mesh.material.color.copy(current).lerp(plaster, 0.30).multiplyScalar(value * level);
      }
      renderer.render(scene, camera);
      const delta = Math.abs(current.r - tint.current.r) + Math.abs(current.g - tint.current.g)
        + Math.abs(current.b - tint.current.b) + Math.abs(level - exposure.current)
        + Math.abs(camera.position.x - x) + Math.abs(camera.position.y - y);
      if (delta > 0.0008) schedule();
      else last = 0;
    }
    function schedule() {
      if (visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
    }
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      set.scale.x = camera.aspect;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(w, h, false);
      schedule();
    };
    const section = el.parentElement;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduce.matches) return;
      const r = el.getBoundingClientRect();
      pointer.set(2 * (e.clientX - r.left) / r.width - 1, 1 - 2 * (e.clientY - r.top) / r.height);
      schedule();
    };
    const leave = () => { pointer.set(0, 0); schedule(); };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    const ro = new ResizeObserver(resize);
    io.observe(el);
    ro.observe(el);
    resize();
    repaint.current = schedule;
    section?.addEventListener("pointermove", move, { passive: true });
    section?.addEventListener("pointerleave", leave);
    reduce.addEventListener("change", leave);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      repaint.current = null;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      section?.removeEventListener("pointermove", move);
      section?.removeEventListener("pointerleave", leave);
      reduce.removeEventListener("change", leave);
      document.removeEventListener("visibilitychange", schedule);
      for (const { mesh } of surfaces) { mesh.geometry.dispose(); mesh.material.dispose(); }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} aria-hidden="true" className={className}
    style={{ background: `radial-gradient(ellipse at 43% 35%, color-mix(in srgb, ${color} 65%, #776c61), #141211 80%)` }} />;
}
