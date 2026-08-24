import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  drift: number;
};

type Bead = { x: number; y: number; radius: number; alpha: number };
type ClearPoint = { x: number; y: number; radius: number };

export function RainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clearedRef = useRef<ClearPoint[]>([]);
  const drawingRef = useRef(false);
  const lastInteractionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dropCount = window.innerWidth < 720 ? 72 : 138;
    const drops: Drop[] = Array.from({ length: dropCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.0012 + Math.random() * 0.0038,
      length: 22 + Math.random() * 82,
      width: 0.55 + Math.random() * 1.25,
      alpha: 0.2 + Math.random() * 0.52,
      drift: 3 + Math.random() * 7,
    }));
    const beads: Bead[] = Array.from({ length: window.innerWidth < 720 ? 44 : 86 }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: 0.8 + Math.random() * 3.2,
      alpha: 0.08 + Math.random() * 0.2,
    }));

    let lastPoint: { x: number; y: number } | null = null;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      clearedRef.current = [];
    };

    const pushClearPoint = (x: number, y: number) => {
      clearedRef.current.push({ x, y, radius: window.innerWidth < 720 ? 66 : 92 });
      if (clearedRef.current.length > 110) clearedRef.current.shift();
    };

    const addClear = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (lastPoint) {
        const distance = Math.hypot(next.x - lastPoint.x, next.y - lastPoint.y);
        const steps = Math.max(1, Math.ceil(distance / 24));
        for (let step = 1; step <= steps; step += 1) {
          const ratio = step / steps;
          pushClearPoint(
            lastPoint.x + (next.x - lastPoint.x) * ratio,
            lastPoint.y + (next.y - lastPoint.y) * ratio,
          );
        }
      } else {
        pushClearPoint(next.x, next.y);
      }
      lastPoint = next;
      lastInteractionRef.current = performance.now();
      document.body.dataset.rainRevealed = "true";
    };

    const pointerDown = (event: PointerEvent) => {
      drawingRef.current = true;
      lastPoint = null;
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add("is-wiping");
      addClear(event);
    };
    const pointerMove = (event: PointerEvent) => {
      if (drawingRef.current) addClear(event);
    };
    const pointerUp = (event: PointerEvent) => {
      drawingRef.current = false;
      lastPoint = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      canvas.classList.remove("is-wiping");
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);

    let frame = 0;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);

      const fog = context.createLinearGradient(0, 0, width, height);
      fog.addColorStop(0, "rgba(208, 224, 232, 0.46)");
      fog.addColorStop(0.48, "rgba(93, 122, 144, 0.4)");
      fog.addColorStop(1, "rgba(17, 34, 53, 0.58)");
      context.fillStyle = fog;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "destination-out";
      const idleTime = lastInteractionRef.current ? now - lastInteractionRef.current : Number.POSITIVE_INFINITY;
      const revealOpacity = idleTime <= 5000 ? 1 : Math.max(0, 1 - (idleTime - 5000) / 1800);
      clearedRef.current.forEach((point) => {
        const radius = point.radius * (0.72 + revealOpacity * 0.28);
        const gradient = context.createRadialGradient(point.x, point.y, radius * 0.12, point.x, point.y, radius);
        gradient.addColorStop(0, `rgba(0,0,0,${0.98 * revealOpacity})`);
        gradient.addColorStop(0.62, `rgba(0,0,0,${0.86 * revealOpacity})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
      if (idleTime > 6900) clearedRef.current = [];

      beads.forEach((bead) => {
        const x = bead.x * width;
        const y = bead.y * height;
        const beadGradient = context.createRadialGradient(x - bead.radius * 0.35, y - bead.radius * 0.4, 0, x, y, bead.radius);
        beadGradient.addColorStop(0, `rgba(255,255,255,${bead.alpha + 0.12})`);
        beadGradient.addColorStop(0.35, `rgba(204,228,240,${bead.alpha})`);
        beadGradient.addColorStop(1, "rgba(63,91,112,0.04)");
        context.fillStyle = beadGradient;
        context.beginPath();
        context.arc(x, y, bead.radius, 0, Math.PI * 2);
        context.fill();
      });

      drops.forEach((drop) => {
        drop.y += drop.speed;
        if (drop.y > 1.12) {
          drop.y = -0.12;
          drop.x = Math.random();
        }
        const x = drop.x * width;
        const y = drop.y * height;
        const rainGradient = context.createLinearGradient(x, y, x + drop.drift, y + drop.length);
        rainGradient.addColorStop(0, "rgba(235,248,255,0)");
        rainGradient.addColorStop(0.45, `rgba(224,241,250,${drop.alpha})`);
        rainGradient.addColorStop(1, "rgba(180,215,232,0.02)");
        context.strokeStyle = rainGradient;
        context.lineWidth = drop.width;
        context.beginPath();
        context.moveTo(x, y);
        context.quadraticCurveTo(x + drop.drift * 0.4, y + drop.length * 0.55, x + drop.drift, y + drop.length);
        context.stroke();
      });
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  return <canvas className="rain-canvas" ref={canvasRef} aria-label="可擦拭的雨雾玻璃" />;
}
