import { useEffect, useRef } from "react";
import * as THREE from "three";

type ThreeVariant = "stars" | "moon" | "galaxy";

export function ThreeScene({ variant }: { variant: ThreeVariant }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(62, host.clientWidth / host.clientHeight, 0.1, 1200);
    camera.position.z = variant === "moon" ? 4.4 : variant === "galaxy" ? 7.4 : 5.2;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.4 : 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    if (variant === "moon") {
      const textureCanvas = document.createElement("canvas");
      textureCanvas.width = 768;
      textureCanvas.height = 384;
      const textureContext = textureCanvas.getContext("2d");
      if (textureContext) {
        const base = textureContext.createLinearGradient(0, 0, 768, 384);
        base.addColorStop(0, "#6d7890");
        base.addColorStop(0.48, "#c6cfda");
        base.addColorStop(1, "#78849a");
        textureContext.fillStyle = base;
        textureContext.fillRect(0, 0, 768, 384);
        for (let index = 0; index < 920; index += 1) {
          const lightness = 108 + Math.random() * 82;
          textureContext.fillStyle = `rgba(${lightness},${lightness + 5},${lightness + 12},${0.025 + Math.random() * 0.08})`;
          textureContext.beginPath();
          textureContext.arc(Math.random() * 768, Math.random() * 384, 0.6 + Math.random() * 5, 0, Math.PI * 2);
          textureContext.fill();
        }
        for (let index = 0; index < 78; index += 1) {
          const x = Math.random() * 768;
          const y = Math.random() * 384;
          const radius = 4 + Math.random() * 22;
          const crater = textureContext.createRadialGradient(x - radius * 0.25, y - radius * 0.28, radius * 0.08, x, y, radius);
          crater.addColorStop(0, "rgba(236,241,247,0.38)");
          crater.addColorStop(0.32, "rgba(89,99,120,0.4)");
          crater.addColorStop(0.75, "rgba(55,63,81,0.18)");
          crater.addColorStop(1, "rgba(218,225,235,0.08)");
          textureContext.fillStyle = crater;
          textureContext.beginPath();
          textureContext.arc(x, y, radius, 0, Math.PI * 2);
          textureContext.fill();
        }
      }
      const moonTexture = new THREE.CanvasTexture(textureCanvas);
      moonTexture.colorSpace = THREE.SRGBColorSpace;
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(1.48, 96, 96),
        new THREE.MeshStandardMaterial({
          color: "#dce5ef",
          map: moonTexture,
          bumpMap: moonTexture,
          bumpScale: 0.055,
          roughness: 0.94,
          metalness: 0.01,
        }),
      );
      moon.rotation.z = -0.12;
      const craters = new THREE.Points(
        new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.Float32BufferAttribute(Array.from({ length: 300 }, () => {
            const a = Math.random() * Math.PI * 2;
            const b = Math.acos(Math.random() * 2 - 1);
            return [Math.sin(b) * Math.cos(a) * 1.49, Math.sin(b) * Math.sin(a) * 1.49, Math.cos(b) * 1.49];
          }).flat(), 3),
        ),
        new THREE.PointsMaterial({ color: "#738198", size: 0.012, transparent: true, opacity: 0.38 }),
      );
      group.add(moon, craters);
      const moonStars = Array.from({ length: window.innerWidth < 720 ? 420 : 880 }, () => [
        (Math.random() - 0.5) * 13,
        (Math.random() - 0.5) * 8,
        -1.5 - Math.random() * 7,
      ]).flat();
      const moonStarGeometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(moonStars, 3));
      scene.add(new THREE.Points(moonStarGeometry, new THREE.PointsMaterial({ color: "#dcecff", size: 0.018, transparent: true, opacity: 0.72 })));
      scene.add(new THREE.AmbientLight("#4a587d", 0.68));
      const light = new THREE.PointLight("#fff0d2", 4.4, 24);
      light.position.set(3.8, 2.5, 4.8);
      scene.add(light);
      const rimLight = new THREE.PointLight("#89b8e8", 1.4, 18);
      rimLight.position.set(-3.8, -1.5, 1.4);
      scene.add(rimLight);
    } else if (variant === "galaxy") {
      const starCount = window.innerWidth < 720 ? 1300 : 3200;
      const positions: number[] = [];
      const colors: number[] = [];
      const palette = ["#ffe8aa", "#f7bd80", "#dc8b88", "#9ed7ed", "#fff8dc"];
      for (let index = 0; index < starCount; index += 1) {
        const arm = index % 5;
        const radius = 0.12 + Math.pow(Math.random(), 0.72) * 5.9;
        const scatter = (Math.random() - 0.5) * (0.25 + radius * 0.055);
        const angle = (arm / 5) * Math.PI * 2 + radius * 1.28 + scatter;
        const depth = (Math.random() - 0.5) * (0.46 + (1 - radius / 6) * 0.8);
        positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, depth);
        const color = new THREE.Color(palette[(index + arm) % palette.length]);
        const intensity = 0.72 + Math.random() * 0.28;
        colors.push(color.r * intensity, color.g * intensity, color.b * intensity);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: window.innerWidth < 720 ? 0.035 : 0.028,
        transparent: true,
        opacity: 0.95,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Points(geometry, material));

      const coreCanvas = document.createElement("canvas");
      coreCanvas.width = 256;
      coreCanvas.height = 256;
      const coreContext = coreCanvas.getContext("2d");
      if (coreContext) {
        const glow = coreContext.createRadialGradient(128, 128, 0, 128, 128, 128);
        glow.addColorStop(0, "rgba(255,250,220,1)");
        glow.addColorStop(0.14, "rgba(255,218,142,0.92)");
        glow.addColorStop(0.42, "rgba(223,145,118,0.38)");
        glow.addColorStop(1, "rgba(93,70,150,0)");
        coreContext.fillStyle = glow;
        coreContext.fillRect(0, 0, 256, 256);
      }
      const core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(coreCanvas),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      core.scale.set(2.8, 2.8, 1);
      group.add(core);
    } else {
      const starCount = window.innerWidth < 720 ? 800 : 1600;
      const positions = Array.from({ length: starCount }, () => {
        const radius = 2 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 8;
        return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
      }).flat();
      const geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({ color: "#d9efff", size: 0.018, transparent: true, opacity: 0.92 });
      group.add(new THREE.Points(geometry, material));
    }

    renderer.domElement.setAttribute("data-three-ready", variant);

    let pointerX = 0;
    let pointerY = 0;
    let dragYaw = 0;
    let dragPitch = 0;
    let smoothYaw = 0;
    let smoothPitch = 0;
    let autoAngle = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    const onMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.42;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 0.24;
      if (variant === "stars" && isDragging) {
        dragYaw += (event.clientX - lastPointerX) * 0.006;
        dragPitch = THREE.MathUtils.clamp(dragPitch + (event.clientY - lastPointerY) * 0.004, -0.7, 0.7);
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (variant !== "stars") return;
      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.classList.add("is-grabbing");
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
      host.classList.remove("is-grabbing");
    };
    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", onResize);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      autoAngle += variant === "galaxy" ? 0.0012 : 0.0008;
      smoothYaw += (dragYaw + pointerX - smoothYaw) * 0.035;
      smoothPitch += (dragPitch + pointerY - smoothPitch) * 0.035;
      if (variant === "galaxy") {
        group.rotation.z = autoAngle;
        group.rotation.x = smoothPitch * 0.32;
        group.rotation.y = smoothYaw * 0.32;
      } else {
        group.rotation.y = autoAngle + smoothYaw;
        group.rotation.x = smoothPitch;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, [variant]);

  return <div className={`three-scene three-scene--${variant}`} ref={hostRef} aria-hidden="true" />;
}
