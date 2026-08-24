import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Download, MoveHorizontal, Pause, Play, Quote, RotateCcw, Send, Share2, Sparkles, Telescope, Volume2, X } from "lucide-react";
import { RainCanvas } from "./components/RainCanvas";
import { ThreeScene } from "./components/ThreeScene";
import { regretMessages, scenes, strangerWhispers } from "./data/scenes";
import { useAmbientAudio } from "./hooks/useAmbientAudio";
import trackPhoto from "../4.png";
import islandPhoto from "../5.png";
import memoryPhoto from "../6.png";
import shadowPhoto from "../7.png";
import heroinePhoto from "../女主.png";

gsap.registerPlugin(ScrollTrigger);

type Photo = { id: number; title: string; date: string; kind: string; image: string; x: number; y: number; rotation: number; collected: boolean };
type Firework = { id: number; x: number; y: number; color: string; size: number };
type StarTrail = { id: number; x: number; y: number; size: number; delay: number };
type WishFlight = { id: number; text: string };
type MeteorWhisper = { id: number; text: string };
type CosmicCardMeta = { coordinate: string; createdAt: string; timezone: string; identity: string };

const photoMemories = [
  { title: "路灯下的影子", date: "北纬 66° · 冬", kind: "glacier", image: shadowPhoto, x: 6, y: 42, rotation: -8 },
  { title: "未说出的话", date: "南方海岸 · 盛夏", kind: "island", image: islandPhoto, x: 27, y: 58, rotation: 6 },
  { title: "上课的模样", date: "无名路口 · 23:17", kind: "hands", image: memoryPhoto, x: 51, y: 40, rotation: -4 },
  { title: "走廊的阳光", date: "Memory 0724", kind: "track", image: trackPhoto, x: 65, y: 58, rotation: 8 },
];
const cosmicCoordinates = [
  { code: "RA 19h 50m", label: "晚风", echo: "那一句没有说完的话，还在路口等风。" },
  { code: "Dec +08°52′", label: "星河", echo: "我们走散以后，星光替你陪我梦游。" },
  { code: "MEMORY 0724", label: "梦游", echo: "影子会消失，温柔却有自己的坐标。" },
];
const fireworkColors = ["#ffd38a", "#ff91ae", "#84dcff", "#c7a5ff", "#efffd8"];

function App() {
  const { isPlaying, volume, toggle, setVolume } = useAmbientAudio();
  const [activeScene, setActiveScene] = useState(0);
  const [split, setSplit] = useState(50);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const [selectedRegret, setSelectedRegret] = useState(0);
  const [selectedCoordinate, setSelectedCoordinate] = useState(0);
  const [starTrails, setStarTrails] = useState<StarTrail[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [draggingPhoto, setDraggingPhoto] = useState<number | null>(null);
  const [fragmentCertificateUrl, setFragmentCertificateUrl] = useState("");
  const [wish, setWish] = useState("");
  const [wishFlight, setWishFlight] = useState<WishFlight | null>(null);
  const [wishArchiveCount, setWishArchiveCount] = useState(0);
  const [meteorWhisper, setMeteorWhisper] = useState<MeteorWhisper | null>(null);
  const [fireworks, setFireworks] = useState<Firework[]>([]);
  const [selectedFireworkColor, setSelectedFireworkColor] = useState(fireworkColors[0]);
  const [names, setNames] = useState({ me: "", you: "" });
  const [anonymousCard, setAnonymousCard] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [cardMeta, setCardMeta] = useState<CosmicCardMeta | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 });
  const [shutterBurst, setShutterBurst] = useState(false);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const fragmentRef = useRef<HTMLElement | null>(null);
  const draggingSplitRef = useRef(false);
  const lastTrailAtRef = useRef(0);
  const trailIdRef = useRef(0);
  const fireworkAudioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = gsap.utils.toArray<HTMLElement>(".story-section");
    sections.forEach((section, index) => {
      gsap.fromTo(
        section.querySelectorAll(".reveal"),
        { y: 42, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.09,
          ease: "power2.out",
          scrollTrigger: { trigger: section, start: "top 72%" },
        },
      );
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onEnter: () => setActiveScene(index),
        onEnterBack: () => setActiveScene(index),
      });
    });
    const cosmicSection = document.querySelector<HTMLElement>(".cosmic-section");
    if (cosmicSection) {
      gsap.fromTo(
        cosmicSection,
        { "--void-progress": 0 },
        {
          "--void-progress": 1,
          ease: "none",
          scrollTrigger: {
            trigger: cosmicSection,
            start: "top 65%",
            end: "bottom 42%",
            scrub: 0.45,
          },
        },
      );
    }
    const seasonsSection = document.querySelector<HTMLElement>(".seasons-section");
    if (seasonsSection) {
      const layers = seasonsSection.querySelectorAll<HTMLElement>(".season-film");
      const finale = seasonsSection.querySelector<HTMLElement>(".season-finale");
      const seasonTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: seasonsSection,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.35,
          onUpdate: (self) => {
            seasonsSection.classList.toggle("night-lit", self.progress >= 0.82);
          },
        },
      });
      seasonsSection.classList.remove("night-lit");
      seasonTimeline.set(layers, { opacity: 0 }).set(layers[0], { opacity: 1 });
      for (let index = 0; index < layers.length - 1; index += 1) {
        seasonTimeline
          .to(layers[index], { opacity: 0, scale: 1.035, duration: 0.75, ease: "none" })
          .to(layers[index + 1], { opacity: 1, duration: 0.75, ease: "none" }, "<0.18");
      }
      seasonTimeline.to(layers[layers.length - 1], { opacity: 0, scale: 1.025, duration: 0.8, ease: "none" });
      if (finale) seasonTimeline.to(finale, { opacity: 1, duration: 0.7, ease: "none" }, "<0.2");
      }
      return () => {
        seasonsSection?.classList.remove("night-lit");
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
  }, []);

  useEffect(() => () => {
    if (fireworkAudioRef.current && fireworkAudioRef.current.state !== "closed") {
      void fireworkAudioRef.current.close();
    }
  }, []);

  const collectedCount = useMemo(() => photos.filter((photo) => photo.collected).length, [photos]);

  const startJourney = async () => {
    setShutterBurst(true);
    if (!isPlaying) await toggle();
    window.setTimeout(() => setShutterBurst(false), 900);
  };

  const moveHero = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHeroMouse({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  const onSplitPointer = (event: React.PointerEvent) => {
    const rect = splitRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSplit(Math.min(78, Math.max(22, ((event.clientX - rect.left) / rect.width) * 100)));
  };

  const leaveStarTrail = (event: React.PointerEvent<HTMLElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const now = performance.now();
    if (now - lastTrailAtRef.current < 46) return;
    lastTrailAtRef.current = now;
    const rect = event.currentTarget.querySelector<HTMLElement>(".cosmic-stage")?.getBoundingClientRect();
    if (!rect) return;
    const id = trailIdRef.current += 1;
    const trail = {
      id,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 0.16,
    };
    setStarTrails((items) => [...items.slice(-16), trail]);
    window.setTimeout(() => setStarTrails((items) => items.filter((item) => item.id !== id)), 1300);
  };

  const releasePhotos = () => {
    if (photos.length) return;
    document.body.dataset.photosReleased = "true";
    setPhotos(photoMemories.map((memory, index) => ({
      id: index,
      ...memory,
      collected: false,
    })));
  };

  const collectPhoto = (id: number) => {
    setPhotos((items) => items.map((photo) => photo.id === id ? { ...photo, collected: true } : photo));
    document.body.dataset.photoCollected = "true";
  };

  const dragPhoto = (id: number, event: React.PointerEvent) => {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startY = event.clientY;
    const current = photos.find((photo) => photo.id === id);
    const sectionRect = fragmentRef.current?.getBoundingClientRect();
    if (!current || !sectionRect) return;
    const maxX = Math.max(3, 99 - (target.offsetWidth / sectionRect.width) * 100);
    const maxY = Math.max(22, 97 - (target.offsetHeight / sectionRect.height) * 100);
    setDraggingPhoto(id);
    const onMove = (moveEvent: PointerEvent) => {
      setPhotos((items) => items.map((photo) => photo.id === id ? {
        ...photo,
        x: Math.min(maxX, Math.max(3, current.x + ((moveEvent.clientX - startX) / sectionRect.width) * 100)),
        y: Math.min(maxY, Math.max(22, current.y + ((moveEvent.clientY - startY) / sectionRect.height) * 100)),
      } : photo));
    };
    const onUp = (upEvent: PointerEvent) => {
      const box = document.querySelector(".collection-box")?.getBoundingClientRect();
      if (box && upEvent.clientX > box.left && upEvent.clientX < box.right && upEvent.clientY > box.top && upEvent.clientY < box.bottom) {
        collectPhoto(id);
      }
      setDraggingPhoto(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const generateFragmentCertificate = () => {
    if (collectedCount !== photoMemories.length) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 760;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1200, 760);
    gradient.addColorStop(0, "#080d21");
    gradient.addColorStop(0.55, "#17264a");
    gradient.addColorStop(1, "#3b3156");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 760);
    for (let index = 0; index < 260; index += 1) {
      ctx.fillStyle = `rgba(220, 238, 255, ${0.2 + Math.random() * 0.7})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 1200, Math.random() * 760, 0.5 + Math.random() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(230, 194, 128, 0.72)";
    ctx.lineWidth = 3;
    ctx.strokeRect(58, 58, 1084, 644);
    ctx.strokeStyle = "rgba(157, 210, 234, 0.34)";
    ctx.strokeRect(76, 76, 1048, 608);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f7e7c9";
    ctx.font = "600 58px 'Microsoft YaHei', sans-serif";
    ctx.fillText("宇宙碎片收藏认证", 600, 208);
    ctx.fillStyle = "#a9d7eb";
    ctx.font = "30px 'Microsoft YaHei', sans-serif";
    ctx.fillText("THE ARCHIVE OF TENDER MEMORIES", 600, 268);
    ctx.fillStyle = "#fff7e9";
    ctx.font = "36px 'Microsoft YaHei', sans-serif";
    ctx.fillText("冰川 · 海岛 · 牵手背影 · 旧操场", 600, 402);
    ctx.fillStyle = "#d9c8b5";
    ctx.font = "28px 'Microsoft YaHei', sans-serif";
    ctx.fillText("已确认：这些认真爱过的时刻，曾真实存在于宇宙。", 600, 480);
    ctx.fillStyle = "#d9b878";
    ctx.font = "24px ui-monospace, monospace";
    ctx.fillText(`CERTIFICATE · MEMORY-${Date.now().toString().slice(-8)}`, 600, 610);
    setFragmentCertificateUrl(canvas.toDataURL("image/png"));
    document.body.dataset.fragmentCertificate = "true";
  };

  const sendWish = () => {
    if (!wish.trim()) return;
    const id = Date.now();
    setWishFlight({ id, text: wish.trim() });
    setWishArchiveCount((count) => count + 1);
    setWish("");
    document.body.dataset.wishSent = "true";
    window.setTimeout(() => setWishFlight((current) => current?.id === id ? null : current), 4300);
  };

  const catchMeteor = () => {
    const id = Date.now();
    const text = strangerWhispers[Math.floor(Math.random() * strangerWhispers.length)];
    setMeteorWhisper({ id, text });
    document.body.dataset.meteorCaught = "true";
    window.setTimeout(() => setMeteorWhisper((current) => current?.id === id ? null : current), 4600);
  };

  const addFirework = (event: React.MouseEvent<HTMLElement>) => {
    if (!document.querySelector(".seasons-section")?.classList.contains("night-lit")) return;
    const rect = event.currentTarget.querySelector<HTMLElement>(".seasons-stage")?.getBoundingClientRect();
    if (!rect) return;
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    const id = Date.now() + Math.random();
    const firework = {
      id,
      x: Math.min(rect.width - 44, Math.max(44, centerX)),
      y: Math.min(rect.height - 96, Math.max(76, centerY)),
      color: selectedFireworkColor,
      size: 96 + Math.random() * 34,
    };
    setFireworks((items) => [...items, firework]);
    playFireworkSound();
    document.body.dataset.firework = "true";
    window.setTimeout(() => setFireworks((items) => items.filter((item) => item.id !== id)), 1900);
  };

  const playFireworkSound = () => {
    const audioContext = fireworkAudioRef.current ?? new AudioContext();
    fireworkAudioRef.current = audioContext;
    if (audioContext.state === "suspended") void audioContext.resume();
    const now = audioContext.currentTime;

    const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 1.15), audioContext.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noise.length; index += 1) {
      const decay = Math.pow(1 - index / noise.length, 2.4);
      noise[index] = (Math.random() * 2 - 1) * decay;
    }
    const noiseSource = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(1450, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(180, now + 1.1);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.2, now + 0.018);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    noiseSource.connect(noiseFilter).connect(noiseGain).connect(audioContext.destination);

    const boom = audioContext.createOscillator();
    const boomGain = audioContext.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(118, now);
    boom.frequency.exponentialRampToValueAtTime(42, now + 0.72);
    boomGain.gain.setValueAtTime(0.16, now);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
    boom.connect(boomGain).connect(audioContext.destination);

    noiseSource.start(now);
    boom.start(now);
    noiseSource.stop(now + 1.16);
    boom.stop(now + 0.84);
  };

  const generateCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const createdAt = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local Time";
    const identity = anonymousCard ? "匿名星球 × 远方星光" : `${names.me.trim() || "未命名星球"} × ${names.you.trim() || "远方星光"}`;
    const source = `${identity}|${createdAt.toISOString()}|${timezone}`;
    let seed = 2166136261;
    for (const character of source) seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const raHour = seed % 24;
    const raMinute = Math.floor(seed / 24) % 60;
    const decValue = (Math.floor(seed / 1440) % 180) - 90;
    const decLabel = `${decValue >= 0 ? "+" : "-"}${String(Math.abs(decValue)).padStart(2, "0")}°`;
    const coordinate = `RA ${String(raHour).padStart(2, "0")}h ${String(raMinute).padStart(2, "0")}m / Dec ${decLabel}`;
    const fitCanvasText = (text: string, maxWidth: number, initialSize: number, minimumSize: number) => {
      let size = initialSize;
      ctx.font = `${size}px 'Microsoft YaHei', sans-serif`;
      while (size > minimumSize && ctx.measureText(text).width > maxWidth) {
        size -= 2;
        ctx.font = `${size}px 'Microsoft YaHei', sans-serif`;
      }
    };

    const gradient = ctx.createRadialGradient(600, 610, 50, 600, 720, 980);
    gradient.addColorStop(0, "#60404f");
    gradient.addColorStop(0.34, "#28264f");
    gradient.addColorStop(0.72, "#10172f");
    gradient.addColorStop(1, "#070a16");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 1600);
    for (let index = 0; index < 820; index += 1) {
      const arm = index % 5;
      const radius = 24 + Math.pow(random(), 0.72) * 480;
      const angle = (arm / 5) * Math.PI * 2 + radius * 0.012 + (random() - 0.5) * 0.28;
      const x = 600 + Math.cos(angle) * radius;
      const y = 630 + Math.sin(angle) * radius * 0.56;
      ctx.fillStyle = `rgba(255, ${185 + random() * 65}, ${125 + random() * 95}, ${0.25 + random() * 0.68})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.6 + random() * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    const coreGlow = ctx.createRadialGradient(600, 630, 0, 600, 630, 180);
    coreGlow.addColorStop(0, "rgba(255,249,214,0.95)");
    coreGlow.addColorStop(0.22, "rgba(255,201,126,0.58)");
    coreGlow.addColorStop(1, "rgba(255,177,120,0)");
    ctx.fillStyle = coreGlow;
    ctx.fillRect(380, 410, 440, 440);
    ctx.strokeStyle = "rgba(232, 197, 133, 0.74)";
    ctx.lineWidth = 3;
    ctx.strokeRect(72, 72, 1056, 1456);
    ctx.strokeStyle = "rgba(166, 212, 234, 0.28)";
    ctx.strokeRect(92, 92, 1016, 1416);
    ctx.fillStyle = "#fff2d6";
    ctx.textAlign = "center";
    ctx.font = "600 64px 'Microsoft YaHei', serif";
    ctx.fillText("宇宙专属温柔坐标卡", 600, 220);
    ctx.fillStyle = "rgba(191,220,238,0.8)";
    ctx.font = "25px ui-monospace, monospace";
    ctx.fillText("A TENDER CONNECTION TO THE UNIVERSE", 600, 274);
    ctx.fillStyle = "#fff7e8";
    fitCanvasText(identity, 940, 38, 25);
    ctx.fillText(identity, 600, 930);
    ctx.fillStyle = "#f1cc8d";
    ctx.font = "31px ui-monospace, monospace";
    ctx.fillText(coordinate, 600, 1030);
    ctx.fillStyle = "rgba(235,226,220,0.88)";
    ctx.font = "34px 'Microsoft YaHei', sans-serif";
    ctx.fillText("我们虽然不再见", 600, 1184);
    ctx.fillText("但已被宇宙认真爱过", 600, 1244);
    ctx.fillStyle = "rgba(177,202,221,0.68)";
    ctx.font = "24px 'Microsoft YaHei', sans-serif";
    ctx.fillText(createdAt.toLocaleString("zh-CN", { hour12: false }), 600, 1400);
    ctx.fillText(timezone, 600, 1446);
    const url = canvas.toDataURL("image/png");
    setCardUrl(url);
    setCardMeta({
      coordinate,
      createdAt: createdAt.toLocaleString("zh-CN", { hour12: false }),
      timezone,
      identity,
    });
    document.body.dataset.cardGenerated = "true";
  };

  const shareJourney = async () => {
    const shareData = {
      title: "和宇宙的温柔关联",
      text: cardMeta ? `${cardMeta.identity} · ${cardMeta.coordinate}` : "我们虽然不再见，但已被宇宙认真爱过。",
      url: location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus("已打开系统分享");
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareStatus("链接与坐标已复制");
      }
    } catch {
      setShareStatus("分享已取消");
    }
    window.setTimeout(() => setShareStatus(""), 2600);
  };

  return (
    <div className="site-shell">
      <AudioDock isPlaying={isPlaying} volume={volume} activeScene={activeScene} onToggle={toggle} onVolume={setVolume} />
      <nav className="scene-nav" aria-label="章节导航">
        {scenes.map((scene, index) => (
          <button key={scene.id} className={activeScene === index ? "active" : ""} onClick={() => document.getElementById(scene.id)?.scrollIntoView({ behavior: "smooth" })}>
            {scene.index}
          </button>
        ))}
      </nav>

      <section
        id="sunset"
        className={`story-section sunset-section ${shutterBurst ? "shutter-on" : ""}`}
        onPointerMove={moveHero}
        style={{
          "--mx": heroMouse.x,
          "--my": heroMouse.y,
        } as React.CSSProperties}
      >
        <div className="sunset-sky" aria-hidden="true">
          <span className="sun-core" />
          <span className="cloud cloud-a" />
          <span className="cloud cloud-b" />
          <span className="cloud cloud-c" />
        </div>
        <div className="sunset-field" aria-hidden="true">
          <span className="track-lane lane-a" />
          <span className="track-lane lane-b" />
          <span className="track-lane lane-c" />
          <span className="grass-haze" />
        </div>
        <div className="memory-silhouettes" aria-hidden="true">
          <span className="person person-a" />
          <span className="person person-b" />
        </div>
        <div className="film-fragments" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="shutter-flash" aria-hidden="true" />
        <div className="section-copy hero-copy">
          <p className="eyebrow reveal">{scenes[0].eyebrow}</p>
          <h1 className="reveal">和宇宙的温柔关联</h1>
          <p className="lead reveal">黄昏把操场染成金粉色，旧照片在风里发光，等你按下那声快门。</p>
        </div>
        <button className="polaroid reveal" data-testid="start-journey" onClick={startJourney} aria-label="点击旧照片播放音乐前奏">
          <span className="photo-glow" />
          <span className="photo-stage">
            <img className="heroine-photo" src={heroinePhoto} alt="女主在阳光下读书的照片" />
            <span className="photo-caption">Hey, 那逝去的青春</span>
          </span>
          <strong>旧照片锁上那天</strong>
          <small>{isPlaying ? "前奏正在晚风里播放" : "点击听见胶片快门与前奏"}</small>
        </button>
        <button className="scroll-cue reveal" onClick={() => document.getElementById("glacier")?.scrollIntoView({ behavior: "smooth" })}>滑动开启回忆</button>
      </section>

      <section id="glacier" className={`story-section split-section ${isSplitDragging ? "is-comparing" : ""}`}>
        <div className="split-aurora" aria-hidden="true" />
        <Header scene={scenes[1]} />
        <div
          className="split-view"
          ref={splitRef}
          role="slider"
          tabIndex={0}
          aria-label="日落往事与冰川现在的画面对比"
          aria-valuemin={22}
          aria-valuemax={78}
          aria-valuenow={Math.round(split)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setSplit((value) => Math.max(22, value - 3));
            if (event.key === "ArrowRight") setSplit((value) => Math.min(78, value + 3));
          }}
          onPointerDown={(event) => {
            draggingSplitRef.current = true;
            setIsSplitDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
            onSplitPointer(event);
          }}
          onPointerMove={(event) => draggingSplitRef.current && onSplitPointer(event)}
          onPointerUp={() => {
            draggingSplitRef.current = false;
            setIsSplitDragging(false);
          }}
          onPointerCancel={() => {
            draggingSplitRef.current = false;
            setIsSplitDragging(false);
          }}
        >
          <div className="split-side sunset-side">
            <div className="sunset-disc" aria-hidden="true" />
            <div className="memory-island" aria-hidden="true" />
            <div className="sea-shimmer" aria-hidden="true" />
            <div className="memory-pair" aria-hidden="true"><i /><i /></div>
            <div className="split-scene-label"><small>2018 · 夏末</small><strong>日落的过往</strong></div>
          </div>
          <div className="split-side glacier-side" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
            <div className="glacier-range" aria-hidden="true"><i /><i /><i /></div>
            <div className="ice-reflection" aria-hidden="true" />
            <div className="snow-drift" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <div className="lone-traveler" aria-hidden="true" />
            <div className="split-scene-label"><small>现在 · 北纬 66°</small><strong>冰川的现在</strong></div>
          </div>
          <div className="split-vignette" aria-hidden="true" />
          <div className="split-handle" data-testid="split-handle" style={{ left: `${split}%` }}>
            <span><MoveHorizontal size={20} /></span>
          </div>
          <div className="split-balance" aria-hidden="true">
            <span style={{ width: `${split}%` }}>过往 {Math.round(split)}</span>
            <span style={{ width: `${100 - split}%` }}>{Math.round(100 - split)} 现在</span>
          </div>
        </div>
        <div className="regret-panel reveal">
          <div className="regret-note" key={selectedRegret}>
            <Quote size={22} aria-hidden="true" />
            <p>{regretMessages[selectedRegret]}</p>
            <small>来自匿名星球 · 未寄出的第 {String(selectedRegret + 1).padStart(2, "0")} 封信</small>
          </div>
          <div className="message-river" aria-label="匿名遗憾留言">
            {regretMessages.map((message, index) => (
              <button
                key={message}
                className={selectedRegret === index ? "active" : ""}
                aria-label={`查看第 ${index + 1} 封匿名留言`}
                aria-pressed={selectedRegret === index}
                onClick={() => setSelectedRegret(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {message}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="crossroad" className="story-section cosmic-section" onPointerMove={leaveStarTrail}>
        <div className="cosmic-stage">
          <ThreeScene variant="stars" />
          <div className="cosmic-horizon" aria-hidden="true" />
          <div className="crossroad" aria-hidden="true">
            <div className="road-plane"><span className="road-axis road-east" /><span className="road-axis road-north" /></div>
            <span className="streetlamp lamp-a" /><span className="streetlamp lamp-b" /><span className="streetlamp lamp-c" />
            <span className="road-shadow shadow-a" /><span className="road-shadow shadow-b" />
            <span className="crossing-light" />
          </div>
          <div className="star-trail-layer" aria-hidden="true">
            {starTrails.map((trail) => (
              <i key={trail.id} style={{ left: `${trail.x}%`, top: `${trail.y}%`, width: trail.size, height: trail.size, animationDelay: `${trail.delay}s` }} />
            ))}
          </div>
          <div className="cosmic-copy-wrap">
            <Header scene={scenes[2]} />
            <div className="crossroad-time reveal"><i />23:17 · 无名路口</div>
          </div>
          <div className="coordinate-orbit reveal" data-testid="coordinate-orbit">
            {cosmicCoordinates.map((coordinate, index) => (
              <button
                key={coordinate.code}
                className={selectedCoordinate === index ? "active" : ""}
                aria-pressed={selectedCoordinate === index}
                onClick={() => setSelectedCoordinate(index)}
              >
                <small>{coordinate.label}</small>
                <strong>{coordinate.code}</strong>
              </button>
            ))}
            <div className="coordinate-readout" key={selectedCoordinate}>
              <span>宇宙坐标回声</span>
              <p>{cosmicCoordinates[selectedCoordinate].echo}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="fragment" className={`story-section fragment-section ${photos.length ? "memories-released" : ""}`} ref={fragmentRef}>
        <div className="fragment-nebula" aria-hidden="true"><i /><i /><i /></div>
        <div className="fragment-orbits" aria-hidden="true"><i /><i /></div>
        <Header scene={scenes[3]} />
        <button
          className={`star-fragment ${photos.length ? "burst" : ""}`}
          data-testid="star-fragment"
          onClick={releasePhotos}
          disabled={photos.length > 0}
          aria-label={photos.length ? "星星碎片已经打开" : "打开星星碎片"}
        >
          <span className="crystal-star" aria-hidden="true"><i /><i /><i /><i /></span>
          <strong>{photos.length ? "记忆正在漂流" : "轻触星星"}</strong>
          <small>{photos.length ? "四段旧时光已经苏醒" : "里面藏着没有遗失的从前"}</small>
        </button>
        <div className="fragment-shards" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</div>
        <div className="photo-layer">
          {photos.map((photo) => !photo.collected && (
            <button
              key={photo.id}
              className={`memory-photo ${draggingPhoto === photo.id ? "is-dragging" : ""}`}
              style={{ left: `${photo.x}%`, top: `${photo.y}%`, "--photo-rotation": `${photo.rotation}deg`, "--photo-delay": `${photo.id * 0.1 + 0.18}s` } as React.CSSProperties}
              aria-label={`${photo.title}，拖入宇宙收藏盒，双击也可收藏`}
              onDoubleClick={() => collectPhoto(photo.id)}
              onPointerDown={(event) => dragPhoto(photo.id, event)}
            >
              <span className={`photo-visual photo-${photo.kind}`}>
                <img src={photo.image} alt="" />
              </span>
              <strong>{photo.title}</strong>
              <small>{photo.date}</small>
            </button>
          ))}
        </div>
        <div className={`collection-box ${collectedCount === photoMemories.length ? "is-complete" : ""}`} data-testid="collection-box">
          <div className="collection-heading"><Sparkles size={18} /><span>宇宙收藏盒</span><strong>{collectedCount}/4</strong></div>
          <div className="collection-slots" aria-hidden="true">
            {photoMemories.map((memory, index) => <i key={memory.title} className={index < collectedCount ? "filled" : ""} />)}
          </div>
          <p>{collectedCount === 4 ? "四段回忆已经重新发光" : "把仍舍不得遗失的时刻放进来"}</p>
          <button onClick={generateFragmentCertificate} disabled={collectedCount !== 4}><Download size={16} />生成认证证书</button>
        </div>
        {fragmentCertificateUrl && (
          <div className="fragment-certificate" role="dialog" aria-label="宇宙碎片收藏认证证书">
            <button className="certificate-close" aria-label="关闭证书" onClick={() => setFragmentCertificateUrl("")}><X size={18} /></button>
            <img src={fragmentCertificateUrl} alt="宇宙碎片收藏认证证书" />
            <a href={fragmentCertificateUrl} download="宇宙碎片收藏认证.png"><Download size={17} />下载认证证书</a>
          </div>
        )}
      </section>

      <section id="rain" className="story-section rain-section">
        <div className="church-memory" aria-hidden="true">
          <div className="rain-moon" />
          <div className="distant-hills"><i /><i /><i /></div>
          <div className="church-building">
            <span className="church-tower"><i /></span>
            <span className="church-nave"><i /><i /><i /></span>
            <span className="church-cross" />
          </div>
          <div className="wet-road" />
          <div className="hand-in-hand"><i /><i /><b /></div>
          <div className="distant-lights"><i /><i /><i /><i /><i /></div>
        </div>
        <Header scene={scenes[4]} />
        <div className="rain-time reveal"><span>夏日晚雨</span><strong>钟声 · 第 12 响</strong></div>
        <RainCanvas />
        <div className="window-frame" aria-hidden="true"><i /><i /></div>
      </section>

      <section id="moon" className="story-section moon-section">
        <div className="moon-nebula" aria-hidden="true"><i /><i /></div>
        <ThreeScene variant="moon" />
        <div className="lunar-halo" aria-hidden="true"><i /><i /><i /></div>
        <Header scene={scenes[5]} />
        <div className="moon-coordinate reveal"><span>LUNAR ARCHIVE</span><strong>暗面编号 · 0724</strong></div>
        <div className="meteor-rain" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <button className="meteor-catcher" key={meteorWhisper?.id ?? "idle"} data-testid="catch-meteor" onClick={catchMeteor}>
          <span aria-hidden="true" />
          <Telescope size={17} />仰望流星
        </button>
        <div className="wish-panel reveal">
          <div className="wish-input-wrap">
            <input
              value={wish}
              maxLength={40}
              onChange={(event) => setWish(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && sendWish()}
              placeholder="写下你当年没说完的话"
            />
            <small>{wish.length}/40</small>
          </div>
          <button data-testid="send-wish" onClick={sendWish} disabled={!wish.trim()}><Send size={17} />送入月色</button>
          <span className="wish-archive-count">已藏入暗面 {String(wishArchiveCount).padStart(2, "0")}</span>
        </div>
        {wishFlight && (
          <div className="wish-flight" key={wishFlight.id}>
            <span>{wishFlight.text}</span>
            <i /><i /><i /><i /><i />
          </div>
        )}
        {meteorWhisper && (
          <div className="meteor-whisper" key={meteorWhisper.id}>
            <Telescope size={18} />
            <span>来自陌生星球的真心话</span>
            <p>{meteorWhisper.text}</p>
            <div aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          </div>
        )}
      </section>

      <section id="seasons" className="story-section seasons-section" onClick={addFirework}>
        <div className="seasons-stage">
          <div className="season-films" aria-hidden="true">
            <div className="season-film season-spring">
              <div className="spring-branches"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="season-landscape" />
              <span className="season-mark"><small>01</small>春 · 花开</span>
            </div>
            <div className="season-film season-summer">
              <div className="summer-leaves"><i /><i /><i /><i /><i /><i /></div>
              <div className="season-landscape" />
              <span className="season-mark"><small>02</small>夏 · 盛绿</span>
            </div>
            <div className="season-film season-autumn">
              <div className="autumn-forest"><i /><i /><i /><i /><i /><i /><i /></div>
              <div className="season-landscape" />
              <span className="season-mark"><small>03</small>秋 · 叶落</span>
            </div>
            <div className="season-film season-winter">
              <div className="winter-forest"><i /><i /><i /><i /><i /><i /></div>
              <div className="season-snow"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              <span className="season-mark"><small>04</small>冬 · 静雪</span>
            </div>
          </div>
          <div className="season-finale" aria-hidden="true">
            <div className="finale-horizon" />
            {Array.from({ length: 5 }, (_, fireworkIndex) => (
              <span className={`finale-firework finale-firework-${fireworkIndex + 1}`} key={fireworkIndex}>
                {Array.from({ length: 26 }, (_, particleIndex) => <i key={particleIndex} style={{ "--particle": particleIndex } as React.CSSProperties} />)}
              </span>
            ))}
          </div>
          <div className="seasons-copy"><Header scene={scenes[6]} /></div>
          <div className="season-timeline reveal" aria-hidden="true"><span>春</span><i /><span>夏</span><i /><span>秋</span><i /><span>冬</span><i /><span>烟火</span></div>
          <div className="firework-palette five-color-key reveal" onClick={(event) => event.stopPropagation()}>
            <Sparkles size={17} /><span>五色烟火</span>
            {fireworkColors.map((color, index) => (
              <button
                key={color}
                type="button"
                className={selectedFireworkColor === color ? "active" : ""}
                style={{ "--swatch": color } as React.CSSProperties}
                aria-label={`选择${["金色", "粉色", "蓝色", "紫色", "白绿色"][index]}烟花`}
                aria-pressed={selectedFireworkColor === color}
                onClick={() => setSelectedFireworkColor(color)}
              />
            ))}
          </div>
          {fireworks.map((item) => (
            <span key={item.id} className="custom-firework" style={{ left: item.x, top: item.y, color: item.color, "--firework-size": `${item.size}px` } as React.CSSProperties}>
              {Array.from({ length: 22 }, (_, particleIndex) => (
                <i key={particleIndex} style={{ "--angle": `${(360 / 22) * particleIndex}deg`, "--distance": `${item.size * (0.72 + (particleIndex % 4) * 0.09)}px`, "--delay": `${(particleIndex % 3) * 0.035}s` } as React.CSSProperties} />
              ))}
            </span>
          ))}
        </div>
      </section>

      <section id="final" className="story-section final-section">
        <ThreeScene variant="galaxy" />
        <div className="final-cosmos" aria-hidden="true">
          <div className="galaxy-ring"><i /><i /><i /></div>
          <div className="memory-stars"><i /><i /><i /><i /><i /></div>
        </div>
        <div className="final-copy"><Header scene={scenes[7]} /></div>
        <div className="final-interface reveal">
          <div className="card-generator">
            <div className="generator-heading">
              <span>宇宙坐标生成器</span>
              <small>TIME × MEMORY × STARLIGHT</small>
            </div>
            <div className="name-fields">
              <label>
                <span>你的名字</span>
                <span className="edge-input"><input value={names.me} maxLength={16} disabled={anonymousCard} onChange={(event) => setNames({ ...names, me: event.target.value })} placeholder="未命名星球" /></span>
              </label>
              <label>
                <span>对方的名字</span>
                <span className="edge-input"><input value={names.you} maxLength={16} disabled={anonymousCard} onChange={(event) => setNames({ ...names, you: event.target.value })} placeholder="远方星光（可不填）" /></span>
              </label>
            </div>
            <label className="anonymous-toggle">
              <input type="checkbox" checked={anonymousCard} onChange={(event) => setAnonymousCard(event.target.checked)} />
              <i aria-hidden="true" />
              <span>匿名写入坐标卡</span>
            </label>
            <div className="final-actions">
              <button data-testid="generate-card" onClick={generateCard}><Sparkles size={17} />生成纪念卡片</button>
              <button onClick={() => document.getElementById("sunset")?.scrollIntoView({ behavior: "smooth" })}><RotateCcw size={17} />重温旅程</button>
              <button onClick={() => void shareJourney()}><Share2 size={17} />分享音乐</button>
            </div>
            {shareStatus && <p className="share-status" role="status">{shareStatus}</p>}
          </div>
          <div className={`cosmic-card-result ${cardUrl ? "has-card" : ""}`}>
            {cardUrl ? (
              <>
                <img className="card-preview" src={cardUrl} alt="生成的宇宙专属温柔坐标卡" />
                <div className="card-result-meta">
                  <strong>{cardMeta?.coordinate}</strong>
                  <span>{cardMeta?.createdAt} · {cardMeta?.timezone}</span>
                  <a href={cardUrl} download="宇宙专属温柔坐标卡.png"><Download size={17} />保存卡片</a>
                </div>
              </>
            ) : (
              <div className="cosmic-card-placeholder" aria-hidden="true">
                <span><i /></span>
                <strong>等待一组温柔坐标</strong>
                <small>RA --h --m / Dec --°</small>
              </div>
            )}
          </div>
        </div>
        <p className="final-signature">所有认真爱过的时刻，都不会从宇宙中消失。</p>
      </section>
    </div>
  );
}

function Header({ scene }: { scene: (typeof scenes)[number] }) {
  return (
    <div className="section-copy">
      <p className="eyebrow reveal">{scene.eyebrow}</p>
      <h2 className="reveal">{scene.title}</h2>
      <p className="subtitle reveal">{scene.subtitle}</p>
      <div className="lyrics reveal">
        {scene.lyrics.map((line) => <span key={line}>{line}</span>)}
      </div>
    </div>
  );
}

function AudioDock({ isPlaying, volume, activeScene, onToggle, onVolume }: {
  isPlaying: boolean;
  volume: number;
  activeScene: number;
  onToggle: () => void;
  onVolume: (value: number) => void;
}) {
  return (
    <aside className="audio-dock">
      <button aria-label={isPlaying ? "暂停" : "播放"} onClick={onToggle}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
      <Volume2 size={16} />
      <input aria-label="音量" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => onVolume(Number(event.target.value))} />
          <span>{String(activeScene + 1).padStart(2, "0")}/08</span>
    </aside>
  );
}

export default App;
