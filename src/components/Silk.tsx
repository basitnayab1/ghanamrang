"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * A sheet of silk rendered in real 3D (WebGL): a finely divided plane whose
 * vertices ripple in layered waves, lit with a soft key light, a glossy
 * highlight and a fresnel sheen. The cloth bulges toward the mouse, and its
 * colour eases to whatever `color` is passed in.
 *
 * Pauses when off screen or in a background tab, renders one still frame for
 * people who prefer reduced motion, and renders nothing if WebGL is missing.
 */

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;      // mouse in plane coordinates
  uniform float uPull;      // 0..1 how strongly the cloth reaches for the mouse
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  varying float vH;

  float height(vec2 p) {
    float t = uTime;
    // a few long, slow folds — fine ripples read as glitter, not silk
    float h = 0.7 * sin(p.x * 0.55 + t * 0.28 + sin(p.y * 0.4 + t * 0.18) * 1.4);
    h += 0.32 * sin(p.y * 0.95 - t * 0.36 + p.x * 0.35);
    h += 0.08 * sin((p.x * 0.8 + p.y) * 1.7 + t * 0.5);
    float d = distance(p, uMouse);
    h += uPull * 0.6 * exp(-d * d * 0.45);
    return h;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float e = 0.04;
    float h = height(pos.xy);
    float hx = height(pos.xy + vec2(e, 0.0));
    float hy = height(pos.xy + vec2(0.0, e));
    pos.z += h;
    vH = h;
    vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 1.0));
    vNormal = normalize(normalMatrix * n);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSheen;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;
  varying float vH;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(-vViewPos);
    vec3 l = normalize(vec3(-0.45, 0.75, 0.6));

    // the product swatches are very dark; lift them so the cloth reads clearly
    vec3 base = uColor * 1.9 + 0.025;

    float diffuse = max(dot(n, l), 0.0);
    vec3 r = reflect(-l, n);
    float spec = pow(max(dot(r, v), 0.0), 14.0);       // crisp satin highlight
    float glow = pow(max(dot(r, v), 0.0), 3.5);        // broad soft sheen around it
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.2);

    vec3 col = base * (0.3 + 1.1 * diffuse);
    col += uSheen * (spec * 0.75 + glow * 0.12);
    col += mix(base, uSheen, 0.45) * fres * 0.4;
    col *= 0.62 + 0.5 * smoothstep(-0.7, 0.9, vH);    // deeper folds, brighter crests

    // fade into the black page at the edges (gentler than before, so more cloth shows)
    vec2 c = vUv - 0.5;
    float vig = smoothstep(0.8, 0.22, length(c * vec2(1.0, 1.2)));
    gl_FragColor = vec4(col * vig, 1.0);
  }
`;

export default function Silk({ color, className = "" }: { color: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef(new THREE.Color(color));

  // the latest requested colour; the render loop eases toward it
  useEffect(() => {
    colorRef.current.set(color);
  }, [color]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the page keeps its plain background
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 700;

    // sharp on desktop, lighter on phones (the cloth is soft, so 1.25x is plenty there)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    // the folds are long and smooth, so this many vertices is enough to look perfectly round
    const geometry = new THREE.PlaneGeometry(16, 10, small ? 90 : 180, small ? 56 : 110);
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPull: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uSheen: { value: new THREE.Color("#e9d9bf") },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -0.62; // lie back like draped cloth
    mesh.rotation.z = 0.12;
    mesh.position.y = -0.4;
    scene.add(mesh);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // mouse → point on the cloth (approximate, in the plane's own coordinates)
    const mouseTarget = new THREE.Vector2(0, 0);
    let pullTarget = 0;
    let camTargetX = 0;
    let camTargetY = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      mouseTarget.set(nx * 7, ny * 6);
      pullTarget = Math.abs(nx) <= 1 && Math.abs(ny) <= 1 ? 1 : 0;
      camTargetX = nx * 0.6;
      camTargetY = ny * 0.35;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // only animate while visible
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    const onVisibility = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVisibility);

    const clock = new THREE.Clock();
    let raf = 0;
    let scroll = 0; // smoothed 0..1 of how far the silk has scrolled up
    const frame = () => {
      raf = 0;
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt;
      uniforms.uMouse.value.lerp(mouseTarget, 0.06);
      uniforms.uPull.value += (pullTarget - uniforms.uPull.value) * 0.04;
      uniforms.uColor.value.lerp(colorRef.current, 0.035);
      camera.position.x += (camTargetX - camera.position.x) * 0.04;
      camera.position.y += (camTargetY - camera.position.y) * 0.04;
      // scrolling away dollies the camera down into the cloth and tips it up
      const r = host.getBoundingClientRect();
      const scrolled = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      scroll += (scrolled - scroll) * 0.08;
      camera.position.z = 9 - scroll * 4.5;
      mesh.rotation.x = -0.62 - scroll * 0.45;
      camera.lookAt(0, -0.4 - scroll * 0.8, 0);
      renderer.render(scene, camera);
      if (!reduce && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    function start() {
      if (!raf) {
        clock.getDelta(); // don't jump after a pause
        raf = requestAnimationFrame(frame);
      }
    }

    if (reduce) {
      // one still frame, redrawn only when the colour changes
      uniforms.uTime.value = 4;
      uniforms.uColor.value.copy(colorRef.current);
      renderer.render(scene, camera);
      const iv = setInterval(() => {
        if (!uniforms.uColor.value.equals(colorRef.current)) {
          uniforms.uColor.value.copy(colorRef.current);
          renderer.render(scene, camera);
        }
      }, 300);
      return () => {
        clearInterval(iv);
        cleanup();
      };
    }
    start();

    function cleanup() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
    return cleanup;
    // the colour is read through colorRef so the scene isn't rebuilt on every change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} aria-hidden className={className} />;
}
