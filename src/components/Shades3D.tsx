"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";

export type Shade = { name: string; hex: string; note: string; href: string };

/**
 * Three lengths of cloth, one per colour, hanging from gold rods and moving in
 * a light breeze — real 3D (WebGL). The cloth is pinned along the top and
 * swings more toward the hem. The rack turns a little toward the mouse, and
 * hovering a colour brings its cloth forward. Each colour is a link.
 */

const PANEL_W = 2.2;
const PANEL_H = 3.4;
const GAP = 2.9; // centre-to-centre spacing

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  varying float vW;

  // offset of a point on the cloth; w = 0 at the rod, 1 at the hem
  vec3 wind(vec3 p) {
    float w = clamp(-p.y / ${PANEL_H.toFixed(1)}, 0.0, 1.0);
    float k = pow(w, 1.35);
    float t = uTime;
    float z = 0.32 * sin(p.x * 1.9 + t * 1.5 + uPhase)
            + 0.16 * sin(p.y * 2.4 - t * 2.0 + uPhase * 2.0)
            + 0.06 * sin(p.x * 5.0 + p.y * 3.0 + t * 2.6);
    z = z * k + uHover * 0.35 * k;
    float x = 0.07 * k * sin(t * 0.9 + uPhase);
    return vec3(x, 0.0, z);
  }

  void main() {
    vUv = uv;
    vec3 p = position + wind(position);
    float e = 0.03;
    vec3 px = position + vec3(e, 0.0, 0.0); px += wind(px);
    vec3 py = position + vec3(0.0, e, 0.0); py += wind(py);
    vec3 n = normalize(cross(px - p, py - p));
    vNormal = normalize(normalMatrix * n);
    vW = clamp(-position.y / ${PANEL_H.toFixed(1)}, 0.0, 1.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  varying float vW;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(-vViewPos);
    if (dot(n, v) < 0.0) n = -n; // both sides of the cloth are lit
    vec3 l = normalize(vec3(-0.4, 0.7, 0.8));
    vec3 base = uColor * 2.0 + 0.03;

    float diffuse = max(dot(n, l), 0.0);
    vec3 r = reflect(-l, n);
    float spec = pow(max(dot(r, v), 0.0), 16.0);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.0);

    vec3 col = base * (0.28 + 1.05 * diffuse);
    col += vec3(1.0, 0.93, 0.8) * spec * (0.6 + uHover * 0.4);
    col += base * fres * 0.35;
    col *= 1.0 - 0.18 * vW;                 // the hem sits a little in shadow
    col *= smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x); // soft side edges
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Shades3D({ shades }: { shades: Shade[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const hovered = useRef(-1);
  // where each cloth sits across the canvas (0..1), so the links line up with it
  const [centers, setCenters] = useState<number[]>(shades.map((_, i) => (i + 0.5) / shades.length));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL: the colour links below still work
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const rack = new THREE.Group();
    scene.add(rack);

    const rodMat = new THREE.MeshBasicMaterial({ color: 0xb79a6c });
    const rodGeo = new THREE.CylinderGeometry(0.035, 0.035, PANEL_W + 0.35, 12);
    const clothGeo = new THREE.PlaneGeometry(PANEL_W, PANEL_H, small ? 28 : 44, small ? 40 : 64);
    clothGeo.translate(0, -PANEL_H / 2, 0); // hang from the top edge

    const panels = shades.map((s, i) => {
      const uniforms = {
        uTime: { value: 0 },
        uPhase: { value: i * 1.7 },
        uHover: { value: 0 },
        uColor: { value: new THREE.Color(s.hex) },
      };
      const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, side: THREE.DoubleSide });
      const cloth = new THREE.Mesh(clothGeo, mat);
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.rotation.z = Math.PI / 2;
      const holder = new THREE.Group();
      holder.add(cloth, rod);
      holder.position.set((i - (shades.length - 1) / 2) * GAP, PANEL_H / 2 + 0.15, 0);
      rack.add(holder);
      return { holder, uniforms, mat };
    });

    // fit the whole rack in view whatever the canvas shape
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfW = ((shades.length - 1) * GAP + PANEL_W) / 2 + 0.6;
      const halfH = PANEL_H / 2 + 0.6;
      const d = Math.max(halfW / (t * camera.aspect), halfH / t);
      camera.position.set(0, 0, d);
      camera.updateProjectionMatrix();
      const visibleHalfW = d * t * camera.aspect;
      setCenters(panels.map((p) => 0.5 + p.holder.position.x / (2 * visibleHalfW)));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let mx = 0;
    let my = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      my = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);

    const clock = new THREE.Clock();
    let raf = 0;
    let time = 3;
    const frame = () => {
      raf = 0;
      time += Math.min(clock.getDelta(), 0.05);
      rack.rotation.y += (Math.max(-1, Math.min(1, mx)) * 0.32 - rack.rotation.y) * 0.05;
      rack.rotation.x += (Math.max(-1, Math.min(1, my)) * 0.08 - rack.rotation.x) * 0.05;
      panels.forEach((p, i) => {
        const on = hovered.current === i ? 1 : 0;
        p.uniforms.uTime.value = time;
        p.uniforms.uHover.value += (on - p.uniforms.uHover.value) * 0.08;
        p.holder.position.z = p.uniforms.uHover.value * 0.9;
      });
      renderer.render(scene, camera);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    function start() {
      if (!raf) {
        clock.getDelta();
        raf = requestAnimationFrame(frame);
      }
    }
    renderer.render(scene, camera); // a first still frame right away
    setReady(true);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      clothGeo.dispose();
      rodGeo.dispose();
      rodMat.dispose();
      panels.forEach((p) => p.mat.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // shades are fixed for the life of the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // only the canvas fades in, so the colour links stay visible even without WebGL
    <div ref={hostRef} className={`relative h-full w-full [&>canvas]:transition-opacity [&>canvas]:duration-1000 ${ready ? "" : "[&>canvas]:opacity-0"}`}>
      {/* one link per cloth, lined up under it; hovering or focusing one brings its cloth forward */}
      {shades.map((s, i) => (
        <Link
          key={s.name}
          href={s.href}
          onPointerEnter={() => (hovered.current = i)}
          onPointerLeave={() => (hovered.current = -1)}
          onFocus={() => (hovered.current = i)}
          onBlur={() => (hovered.current = -1)}
          style={{ left: `${centers[i] * 100}%` }}
          className="group absolute bottom-0 top-0 w-[30%] -translate-x-1/2 outline-none md:w-[24%]"
          aria-label={`Shop ${s.name}`}
        >
          {/* anchored from the top so every name sits on the same line */}
          <span className="absolute inset-x-0 top-[calc(100%-4rem)] text-center md:top-[calc(100%-4.75rem)]">
            <span className="block font-serif text-[22px] font-light transition group-hover:text-accent group-focus-visible:text-accent md:text-[30px]">{s.name}</span>
            <span className="mt-0.5 block truncate text-[10px] text-muted md:text-[12px]">{s.note}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
