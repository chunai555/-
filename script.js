const audio = document.querySelector("#song");
const encounterAudio = document.querySelector("#encounter-song");
const vowVoice = document.querySelector("#vow-voice");
const ambientVideos = document.querySelectorAll(".hero-video, .visual-video");
const toggleButtons = document.querySelectorAll("[data-audio-toggle]");
const labels = document.querySelectorAll("[data-audio-label]");
const icons = document.querySelectorAll(".action-icon");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const glowCards = document.querySelectorAll(".border-glow-card");
const galaxyCanvases = document.querySelectorAll(".galaxy-bg");
const openingLayer = document.querySelector(".opening");
const fireflyTrigger = document.querySelector(".firefly-trigger");
const dualPlayer = document.querySelector(".dual-player");
const versionButtons = document.querySelectorAll("[data-version-button]");
const versionTitle = document.querySelector("[data-version-title]");
const versionCopy = document.querySelector("[data-version-copy]");
const lyricWords = document.querySelectorAll(".lyric-line span");
const reunionSection = document.querySelector(".destiny-section");
const paintingCards = document.querySelectorAll(".painting-card, .reunion-ending[data-video-src]");
const paintingDialog = document.querySelector(".painting-dialog");
const dialogTitle = document.querySelector("[data-dialog-title]");
const dialogCopy = document.querySelector(".painting-dialog [data-dialog-copy]");
const dialogClose = document.querySelector("[data-dialog-close]");
const dialogArt = document.querySelector(".dialog-art");
const dialogVideo = document.querySelector("[data-dialog-video]");

function playDialogVideo() {
  if (!dialogVideo) return;
  dialogVideo.play().catch(() => {
    dialogVideo.muted = true;
    dialogVideo.play().catch(() => {});
  });
}

ambientVideos.forEach((video) => {
  video.muted = true;
  video.play().catch(() => {});
});

function setupBorderGlow() {
  glowCards.forEach((card, index) => {
    card.style.setProperty("--flow-delay", `${index * -1.35}s`);

    const updateGlow = (clientX, clientY) => {
      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const kx = dx === 0 ? Infinity : cx / Math.abs(dx);
      const ky = dy === 0 ? Infinity : cy / Math.abs(dy);
      const edge = Math.min(Math.max(100 * (1 - Math.min(kx, ky)), 0), 100);
      const boostedEdge = Math.min(100, edge * 1.55 + 18);
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      card.style.setProperty("--edge-proximity", boostedEdge.toFixed(3));
      card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    };

    card.addEventListener("pointermove", (event) => updateGlow(event.clientX, event.clientY));
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--edge-proximity", "28");
      window.setTimeout(() => card.style.setProperty("--edge-proximity", "0"), 260);
    });

    window.setTimeout(() => {
      card.classList.add("is-sweeping");
      card.style.setProperty("--edge-proximity", "100");
      card.style.setProperty("--cursor-angle", "20deg");
      window.setTimeout(() => card.style.setProperty("--cursor-angle", "135deg"), 220);
      window.setTimeout(() => card.style.setProperty("--cursor-angle", "270deg"), 720);
      window.setTimeout(() => card.style.setProperty("--cursor-angle", "430deg"), 1250);
      window.setTimeout(() => {
        card.style.setProperty("--edge-proximity", "0");
        card.classList.remove("is-sweeping");
      }, 1900);
    }, 700 + index * 180);
  });
}

setupBorderGlow();

function setupVideoTilt() {
  const cards = document.querySelectorAll(".listen-section .track-art.video-glow-card");
  if (!cards.length || reduceMotion) return;

  cards.forEach((card) => {
    let frame = 0;
    let lastEvent = null;

    const reset = () => {
      card.style.setProperty("--video-tilt-x", "0deg");
      card.style.setProperty("--video-tilt-y", "0deg");
      card.style.setProperty("--video-shift-x", "0px");
      card.style.setProperty("--video-shift-y", "0px");
      card.style.setProperty("--video-scale", "1");
      card.style.setProperty("--video-glare-opacity", "0");
    };

    const update = () => {
      frame = 0;
      if (!lastEvent) return;

      const rect = card.getBoundingClientRect();
      const x = (lastEvent.clientX - rect.left) / rect.width;
      const y = (lastEvent.clientY - rect.top) / rect.height;
      const dx = x - 0.5;
      const dy = y - 0.5;
      const rotateY = dx * 14;
      const rotateX = dy * -12;
      const shiftX = dx * 9;
      const shiftY = dy * 7;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      card.style.setProperty("--video-tilt-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--video-tilt-y", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--video-shift-x", `${shiftX.toFixed(2)}px`);
      card.style.setProperty("--video-shift-y", `${shiftY.toFixed(2)}px`);
      card.style.setProperty("--video-scale", "1.025");
      card.style.setProperty("--video-glare-x", `${(x * 100).toFixed(2)}%`);
      card.style.setProperty("--video-glare-y", `${(y * 100).toFixed(2)}%`);
      card.style.setProperty("--video-glare-opacity", "1");
      card.style.setProperty("--cursor-angle", `${angle.toFixed(2)}deg`);
    };

    card.addEventListener("pointermove", (event) => {
      card.classList.add("is-tilting");
      lastEvent = event;
      if (!frame) frame = window.requestAnimationFrame(update);
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      lastEvent = null;
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      reset();
    });
  });
}

setupVideoTilt();

function setupGalaxyBackgrounds() {
  if (!galaxyCanvases.length) return;

  const galaxies = Array.from(galaxyCanvases).map((canvas, index) => {
    const ctx = canvas.getContext("2d");
    const state = {
      canvas,
      ctx,
      index,
      width: 0,
      height: 0,
      dpr: 1,
      stars: [],
      mouse: { x: 0.5, y: 0.5, active: false },
      time: Math.random() * 100,
    };

    const section = canvas.parentElement;
    section?.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      state.mouse.x = (event.clientX - rect.left) / Math.max(rect.width, 1);
      state.mouse.y = (event.clientY - rect.top) / Math.max(rect.height, 1);
      state.mouse.active = true;
    });
    section?.addEventListener("pointerleave", () => {
      state.mouse.active = false;
    });

    return state;
  });

  function resizeGalaxy(state) {
    const rect = state.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width === state.width && height === state.height && dpr === state.dpr) return;

    state.width = width;
    state.height = height;
    state.dpr = dpr;
    state.canvas.width = Math.floor(width * dpr);
    state.canvas.height = Math.floor(height * dpr);
    state.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const area = width * height;
    const count = Math.min(150, Math.max(56, Math.floor(area / 8500)));
    state.stars = Array.from({ length: count }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.55 + 0.35,
      alpha: Math.random() * 0.55 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.16 + 0.04,
      drift: (Math.random() - 0.5) * 0.00018,
      arm: i % 4,
    }));
  }

  function drawGalaxy(state) {
    const { ctx, width, height, stars, mouse } = state;
    if (!width || !height) return;

    state.time += 0.008;
    ctx.clearRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.5, height * 0.24, 0, width * 0.5, height * 0.24, Math.max(width, height) * 0.72);
    glow.addColorStop(0, "rgba(255,255,255,0.16)");
    glow.addColorStop(0.28, "rgba(162,175,196,0.11)");
    glow.addColorStop(0.58, "rgba(228,200,208,0.07)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const focalX = width * (0.48 + Math.sin(state.time * 0.18 + state.index) * 0.035);
    const focalY = height * (0.42 + Math.cos(state.time * 0.14 + state.index) * 0.03);

    stars.forEach((star) => {
      star.x = (star.x + star.drift + 1) % 1;
      const px = star.x * width;
      const py = ((star.y + Math.sin(state.time * star.speed + star.phase) * 0.012 + 1) % 1) * height;
      let ox = 0;
      let oy = 0;

      if (mouse.active) {
        const dx = px - mouse.x * width;
        const dy = py - mouse.y * height;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const push = Math.max(0, 1 - dist / 190) * 18;
        ox = (dx / dist) * push;
        oy = (dy / dist) * push;
      }

      const twinkle = 0.55 + Math.sin(state.time * 1.8 + star.phase) * 0.45;
      const armFade = 1 - Math.min(1, Math.hypot(px - focalX, py - focalY) / Math.max(width, height));
      const alpha = Math.min(1, star.alpha * (0.62 + twinkle * 0.62) + armFade * 0.24);
      const radius = star.r * (1 + twinkle * 0.28);

      ctx.beginPath();
      ctx.fillStyle = `rgba(248,246,242,${alpha})`;
      ctx.shadowColor = "rgba(248,246,242,0.72)";
      ctx.shadowBlur = radius * 4.5;
      ctx.arc(px + ox, py + oy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  function frame() {
    galaxies.forEach((galaxy) => {
      resizeGalaxy(galaxy);
      drawGalaxy(galaxy);
    });
    if (!reduceMotion) requestAnimationFrame(frame);
  }

  frame();
  window.addEventListener("resize", () => galaxies.forEach(resizeGalaxy));
}

setupGalaxyBackgrounds();

lyricWords.forEach((word, index) => {
  word.style.setProperty("--lyric-index", index);
});

const versionContent = {
  past: {
    label: "前世",
    title: "前世版 · 暖调民乐主奏",
    copy: "暖金色流萤占据光球左侧，人声更柔，像人间初遇时被风托起的一盏灯。",
    progress: 105,
  },
  present: {
    label: "今生",
    title: "今生版 · 冷调合成与吟唱",
    copy: "冷银色光线变强，空间更空灵，像深海等待里仍没有熄灭的回声。",
    progress: 220,
  },
  reunion: {
    label: "重逢",
    title: "重逢版 · 双声部融合",
    copy: "原版完整混音的视觉呈现，金银两色流萤同时点亮，承接全站最饱满的情绪。",
    progress: 310,
  },
};

function setVersion(version) {
  const content = versionContent[version] || versionContent.reunion;
  dualPlayer?.setAttribute("data-version", version);
  document.querySelector(".orb-label")?.replaceChildren(document.createTextNode(content.label));
  const stageHint = document.querySelector("[data-stage-hint]");
  if (stageHint) stageHint.textContent = "点击光球播放 / 暂停，按住拖动调节进度与音量。";
  if (versionTitle) versionTitle.textContent = content.title;
  if (versionCopy) versionCopy.textContent = content.copy;
  document.querySelector(".fate-orb")?.style.setProperty("--orb-progress", `${content.progress}deg`);
  versionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.versionButton === version);
  });
}

versionButtons.forEach((button) => {
  button.addEventListener("click", () => setVersion(button.dataset.versionButton));
});

setVersion("reunion");
updateOrbFromAudio();

function updateOrbFromAudio() {
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const degrees = Math.max(8, Math.min(360, (audio.currentTime / audio.duration) * 360));
  document.querySelector(".fate-orb")?.style.setProperty("--orb-progress", `${degrees}deg`);
}

document.querySelector("[data-orb-control]")?.addEventListener("click", async () => {
  if (!audio) return;
  if (audio.paused) {
    try {
      await audio.play();
      setPlayingState(true);
    } catch {
      setPlayingState(false);
    }
    return;
  }
  audio.pause();
  setPlayingState(false);
});

document.querySelector("[data-orb-control]")?.addEventListener("pointermove", (event) => {
  if (!audio || event.buttons !== 1) return;
  const orbControl = event.currentTarget;
  const rect = orbControl.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = audio.duration * x;
  }
  audio.volume = Math.min(1, Math.max(0, 1 - y));
  updateOrbFromAudio();
});

audio?.addEventListener("timeupdate", updateOrbFromAudio);


paintingCards.forEach((card) => {
  card.addEventListener("click", async () => {
    if (card.dataset.requiresUnlock === "true" && !card.closest(".destiny-section")?.classList.contains("is-ending-unlocked")) {
      return;
    }

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const cardVideo = card.querySelector(".painting-card-media");
    const videoSrc = card.dataset.videoSrc || cardVideo?.currentSrc || cardVideo?.getAttribute("src");
    if (dialogTitle) dialogTitle.textContent = card.dataset.painting || "双世对照";
    if (dialogCopy && card.dataset.dialogCopy) dialogCopy.textContent = card.dataset.dialogCopy;
    if (dialogVideo && videoSrc) {
      audio?.pause();
      encounterAudio?.pause();
      dialogVideo.pause();
      dialogVideo.src = videoSrc;
      dialogVideo.poster = cardVideo?.poster || card.dataset.videoPoster || "";
      dialogVideo.muted = false;
      dialogVideo.autoplay = true;
      dialogVideo.load();
      dialogVideo.hidden = false;
      dialogArt?.classList.add("is-video");
    } else if (dialogVideo) {
      dialogVideo.pause();
      dialogVideo.removeAttribute("src");
      dialogVideo.removeAttribute("poster");
      dialogVideo.hidden = true;
      dialogArt?.classList.remove("is-video");
    }
    if (!videoSrc && audio?.paused) {
      try {
        await audio.play();
        setPlayingState(true);
      } catch {
        setPlayingState(false);
      }
    }
    if (paintingDialog) {
      paintingDialog.setAttribute("open", "");
      paintingDialog.focus({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    }
    if (dialogVideo && videoSrc) {
      dialogVideo.addEventListener("canplay", playDialogVideo, { once: true });
      playDialogVideo();
    }
  });
});

function stopDialogVideo() {
  if (!dialogVideo) return;
  dialogVideo.pause();
  try {
    dialogVideo.currentTime = 0;
  } catch {}
}

dialogClose?.addEventListener("click", () => paintingDialog?.close());
paintingDialog?.addEventListener("close", stopDialogVideo);

function setupReunionFireflies() {
  const section = document.querySelector(".destiny-section");
  const canvas = document.querySelector(".reunion-firefly-canvas");
  const countLabel = document.querySelector("[data-firefly-count]");
  if (!section || !canvas) return;

  const unlockTarget = 520;
  const ctx = canvas.getContext("2d");
  const particles = [];
  let width = 1;
  let height = 1;
  let dpr = 1;
  let count = 0;
  let lastMove = 0;
  let unlocked = false;

  const resize = () => {
    const rect = section.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const addCount = (amount) => {
    count += amount;
    if (countLabel) countLabel.textContent = String(count);
    if (!unlocked && count >= unlockTarget) {
      unlocked = true;
      section.classList.add("is-ending-unlocked");
      const reunionEnding = section.querySelector(".reunion-ending");
      reunionEnding?.setAttribute("aria-hidden", "false");
      reunionEnding?.setAttribute("aria-disabled", "false");
      reunionEnding?.querySelector("p")?.replaceChildren(document.createTextNode("重逢结局已解锁"));
    }
  };

  const pushParticle = (particle) => {
    particles.push(particle);
    if (particles.length > 1050) particles.splice(0, particles.length - 1050);
  };

  const spawnTrail = (x, y, amount = 5) => {
    for (let i = 0; i < amount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 1.2;
      const gold = Math.random() > 0.22;
      pushParticle({
        x: x + (Math.random() - 0.5) * 34,
        y: y + (Math.random() - 0.5) * 28,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.15,
        r: 0.65 + Math.random() * 1.45,
        life: 84 + Math.random() * 42,
        maxLife: 126,
        color: gold ? "255,224,122" : "226,235,246",
        bloom: false,
      });
    }
    addCount(amount);
  };

  const spawnBloom = (x, y) => {
    const amount = 150 + Math.floor(Math.random() * 36);
    for (let i = 0; i < amount; i += 1) {
      const fullScreen = i > amount * 0.18;
      const baseX = fullScreen ? Math.random() * width : x + (Math.random() - 0.5) * width * 0.28;
      const baseY = fullScreen ? Math.random() * height : y + (Math.random() - 0.5) * height * 0.22;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6;
      const speed = 0.42 + Math.random() * 1.65;
      pushParticle({
        x: baseX,
        y: baseY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 0.75,
        r: 0.6 + Math.random() * 1.55,
        life: 180 + Math.random() * 90,
        maxLife: 270,
        color: Math.random() > 0.2 ? "255,224,122" : "226,235,246",
        bloom: true,
      });
    }
    addCount(amount);
  };

  section.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const now = performance.now();
    if (now - lastMove < 30) return;
    lastMove = now;
    const rect = section.getBoundingClientRect();
    spawnTrail(event.clientX - rect.left, event.clientY - rect.top, 4);
  });

  section.addEventListener("click", (event) => {
    if (event.target.closest("button, dialog")) return;
    const rect = section.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    section.style.setProperty("--bloom-x", `${(x / Math.max(rect.width, 1)) * 100}%`);
    section.style.setProperty("--bloom-y", `${(y / Math.max(rect.height, 1)) * 100}%`);
    section.classList.add("is-blooming");
    spawnBloom(x, y);
    playFireflySound();
    window.setTimeout(() => section.classList.remove("is-blooming"), 1800);
  });

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.992;
      particle.vy = particle.vy * 0.992 - 0.004;
      particle.life -= 1;

      const alpha = Math.max(0, particle.life / particle.maxLife);
      const pulse = 0.74 + Math.sin((particle.maxLife - particle.life) * 0.14) * 0.26;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${particle.color},${Math.min(1, alpha * pulse * (particle.bloom ? 1.25 : 1))})`;
      ctx.shadowColor = `rgba(${particle.color},${alpha})`;
      ctx.shadowBlur = (particle.bloom ? 26 : 18) * alpha;
      ctx.arc(particle.x, particle.y, particle.r * (1 + pulse * 0.45), 0, Math.PI * 2);
      ctx.fill();

      if (particle.bloom) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${particle.color},${alpha * 0.16})`;
        ctx.lineWidth = 0.45;
        ctx.arc(particle.x, particle.y, particle.r * 5.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      if (particle.life <= 0) particles.splice(index, 1);
    });

    if (!reduceMotion) requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  if (!reduceMotion) draw();
}

setupReunionFireflies();

document.body.classList.add("is-loading");

window.setTimeout(() => {
  if (!window.gsap && openingLayer) {
    document.body.classList.remove("is-loading");
    document.querySelector(".opening")?.remove();
  }
}, 9000);

function playFireflySound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const now = context.currentTime;
  const output = context.createGain();
  const wing = context.createOscillator();
  const wingGain = context.createGain();
  const wind = context.createBufferSource();
  const windGain = context.createGain();
  const filter = context.createBiquadFilter();
  const buffer = context.createBuffer(1, context.sampleRate * 1.8, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }

  output.gain.setValueAtTime(0.0001, now);
  output.gain.exponentialRampToValueAtTime(0.08, now + 0.08);
  output.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  output.connect(context.destination);

  wing.type = "sine";
  wing.frequency.setValueAtTime(74, now);
  wing.frequency.exponentialRampToValueAtTime(118, now + 0.5);
  wing.frequency.exponentialRampToValueAtTime(56, now + 1.3);
  wingGain.gain.setValueAtTime(0.0001, now);
  wingGain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
  wingGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  wing.connect(wingGain);
  wingGain.connect(output);

  wind.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(720, now);
  filter.frequency.exponentialRampToValueAtTime(1450, now + 0.55);
  windGain.gain.setValueAtTime(0.0001, now);
  windGain.gain.exponentialRampToValueAtTime(0.06, now + 0.22);
  windGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
  wind.connect(filter);
  filter.connect(windGain);
  windGain.connect(output);

  wing.start(now);
  wing.stop(now + 1.35);
  wind.start(now);
  wind.stop(now + 1.8);

  window.setTimeout(() => context.close().catch(() => {}), 2200);
}

function initMotion() {
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    document.body.classList.remove("is-loading");
    document.querySelector(".opening")?.remove();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power4.out", duration: 1.25 });

  gsap.set(".site-header", { y: -28, autoAlpha: 0 });
  gsap.set(".hero-video", { scale: 1.22, filter: "brightness(0.62) saturate(0.82)" });
  gsap.set(".hero-content", { x: -42, scaleX: 0.86, transformOrigin: "left bottom" });
  gsap.set(".js-mask-line > span", { yPercent: 118, rotate: 3, skewY: 3 });
  gsap.set(".hero-actions", { y: 36, autoAlpha: 0 });
  gsap.set(".scroll-cue", { autoAlpha: 0, y: 18 });

  const revealHero = () => {
    const opening = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove("is-loading");
        openingLayer?.remove();
      },
    });

    opening
      .add(() => openingLayer?.classList.add("is-bursting"))
      .to(".firefly-trigger", { scale: 8.6, autoAlpha: 0, filter: "brightness(2.4)", duration: 1.15, ease: "expo.inOut" })
      .to(".opening-veil", { autoAlpha: 0, scale: 1.28, duration: 1.15, ease: "expo.inOut" }, "<")
      .to(".opening", { autoAlpha: 0, duration: 0.92, ease: "power3.inOut" }, "-=0.32")
      .to(".hero-video", { scale: 1.02, filter: "brightness(1) saturate(1)", duration: 2.1, ease: "expo.out" }, "-=0.7")
      .to(".hero-content", { x: 0, scaleX: 1, duration: 1.45, ease: "expo.out" }, "-=1.58")
      .to(".js-mask-line > span", { yPercent: 0, rotate: 0, skewY: 0, stagger: 0.14, duration: 1.25, ease: "expo.out" }, "-=1.24")
      .to(".hero-actions", { y: 0, autoAlpha: 1, duration: 1.0 }, "-=0.75")
      .to(".site-header", { y: 0, autoAlpha: 1, duration: 1.1 }, "-=0.88")
      .to(".scroll-cue", { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.65");
  };

  if (openingLayer && fireflyTrigger) {
    gsap.set(".firefly-trigger", { scale: 0.16, autoAlpha: 0, filter: "blur(8px) brightness(0.2)" });
    gsap.set(".firefly-wings", { scaleX: 0.1, autoAlpha: 0 });
    gsap.set(".opening-prompt", { y: 18, autoAlpha: 0 });

    const fireflyIntro = gsap.timeline({
      delay: 0.18,
      onComplete: () => openingLayer.classList.add("is-ready"),
    });

    fireflyIntro
      .to(".firefly-trigger", { autoAlpha: 1, scale: 0.34, filter: "blur(4px) brightness(0.8)", duration: 1.0, ease: "power2.out" }, 0.2)
      .to(".firefly-trigger", { scale: 1, filter: "blur(0px) brightness(1)", duration: 2.05, ease: "expo.out" }, 0.95)
      .to(".firefly-wings", { autoAlpha: 1, scaleX: 1, duration: 1.1, ease: "expo.out" }, 1.8)
      .to(".opening-prompt", { y: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out" }, 2.72);

    const moveFirefly = (event) => {
      if (!openingLayer.classList.contains("is-ready")) return;
      const rect = openingLayer.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(".firefly-trigger", {
        x: x * 24,
        y: y * 18,
        rotate: x * 5,
        duration: 0.75,
        ease: "power3.out",
      });
    };

    openingLayer.addEventListener("pointermove", moveFirefly);
    fireflyTrigger.addEventListener(
      "click",
      () => {
        if (openingLayer.classList.contains("is-bursting")) return;
        playFireflySound();
        revealHero();
      },
      { once: true }
    );
  } else {
    revealHero();
  }

  gsap.to(".hero-video", {
    yPercent: 9,
    scale: 1.09,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.1,
    },
  });

  document.querySelectorAll(".section-display").forEach((title) => {
    gsap.from(title, {
      xPercent: -28,
      scaleX: 0.72,
      autoAlpha: 0,
      duration: 1.45,
      ease: "expo.out",
      scrollTrigger: {
        trigger: title,
        start: "top 86%",
        toggleActions: "play none none reverse",
      },
    });
  });

  gsap.from(".intro-grid > *", {
    y: 82,
    autoAlpha: 0,
    stagger: 0.18,
    duration: 1.25,
    scrollTrigger: {
      trigger: ".intro-section",
      start: "top 68%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".intro-copy p", {
    y: 42,
    autoAlpha: 0,
    stagger: 0.13,
    duration: 1.05,
    scrollTrigger: {
      trigger: ".intro-copy",
      start: "top 78%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".present-heading > *", {
    y: 70,
    autoAlpha: 0,
    stagger: 0.12,
    duration: 1.15,
    scrollTrigger: {
      trigger: ".present-section",
      start: "top 72%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".present-grid .sea-card", {
    y: 96,
    scale: 0.96,
    autoAlpha: 0,
    stagger: 0.12,
    duration: 1.2,
    scrollTrigger: {
      trigger: ".present-grid",
      start: "top 74%",
      toggleActions: "play none none reverse",
    },
  });

  ScrollTrigger.create({
    trigger: ".lyric-scroll-scene",
    start: "top 72%",
    end: "bottom 40%",
    toggleClass: { targets: ".lyric-scroll-scene", className: "is-lyrics-visible" },
  });

  gsap.to(".sea-transition span", {
    y: 150,
    opacity: 0.1,
    stagger: 0.08,
    ease: "none",
    scrollTrigger: {
      trigger: ".present-section",
      start: "top bottom",
      end: "top 20%",
      scrub: 1.1,
    },
  });

  gsap.to(".dragon-palace-silhouette", {
    yPercent: 10,
    scale: 1.08,
    ease: "none",
    scrollTrigger: {
      trigger: ".present-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.4,
    },
  });

  const listenTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".listen-section",
      start: "top 66%",
      toggleActions: "play none none reverse",
    },
  });

  listenTl
    .from(".listen-section .track-panel", { y: 94, scale: 0.94, autoAlpha: 0, duration: 1.25, ease: "expo.out" })
    .from(".listen-section .track-video", { scale: 1.12, filter: "brightness(0.68) saturate(0.82)", duration: 1.35, ease: "expo.out" }, "-=0.78")
    .from(".dual-player", { y: 72, scale: 0.94, autoAlpha: 0, duration: 1.15, ease: "expo.out" }, "-=0.72")
    .from(".lyric-panel > *", { y: 28, autoAlpha: 0, stagger: 0.08, duration: 0.8 }, "-=0.66");

  ScrollTrigger.create({
    trigger: ".listen-section",
    start: "top 58%",
    end: "bottom 46%",
    toggleClass: { targets: ".listen-section", className: "is-surfacing" },
  });

  gsap.from(".destiny-section .reunion-intro > *", {
    y: 92,
    scaleX: 0.88,
    autoAlpha: 0,
    transformOrigin: "left center",
    stagger: 0.12,
    duration: 1.25,
    scrollTrigger: {
      trigger: ".destiny-section",
      start: "top 72%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".scroll-painting .reunion-ending, .scroll-painting .painting-card", {
    y: 96,
    rotateX: -8,
    autoAlpha: 0,
    transformOrigin: "top center",
    stagger: 0,
    duration: 1.15,
    scrollTrigger: {
      trigger: ".scroll-painting",
      start: "top 62%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.to(".destiny-section .moon-orb", {
    yPercent: -18,
    scale: 1.12,
    ease: "none",
    scrollTrigger: {
      trigger: ".destiny-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1.2,
    },
  });

  gsap.from(".epilogue-heading > *", {
    x: -72,
    scaleX: 0.86,
    autoAlpha: 0,
    stagger: 0.12,
    duration: 1.18,
    transformOrigin: "left center",
    scrollTrigger: {
      trigger: ".epilogue-section",
      start: "top 68%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".epilogue-grid > *", {
    y: 84,
    autoAlpha: 0,
    stagger: 0.16,
    duration: 1.18,
    scrollTrigger: {
      trigger: ".epilogue-grid",
      start: "top 76%",
      toggleActions: "play none none reverse",
    },
  });

  gsap.from(".afterlife-easter > *", {
    y: 26,
    autoAlpha: 0,
    stagger: 0.18,
    duration: 1.05,
    scrollTrigger: {
      trigger: ".afterlife-easter",
      start: "top 82%",
      toggleActions: "play none none reverse",
    },
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMotion);
} else {
  initMotion();
}

function setPlayingState(isPlaying) {
  document.body.classList.toggle("is-playing", isPlaying);
  labels.forEach((label) => {
    label.textContent = isPlaying ? "穿越时空" : "停下看看";
  });
  icons.forEach((icon) => {
    icon.textContent = isPlaying ? "Ⅱ" : "▶";
  });
}

toggleButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const targetAudio = encounterAudio || audio;
    if (!targetAudio) {
      return;
    }

    if (targetAudio.paused) {
      try {
        if (targetAudio === encounterAudio) audio?.pause();
        else encounterAudio?.pause();
        await targetAudio.play();
        setPlayingState(true);
      } catch {
        setPlayingState(false);
      }
      return;
    }

    targetAudio.pause();
    setPlayingState(false);
  });
});

if (audio) {
  audio.addEventListener("ended", () => setPlayingState(false));
  audio.addEventListener("pause", () => setPlayingState(false));
}

if (encounterAudio) {
  encounterAudio.addEventListener("ended", () => setPlayingState(false));
  encounterAudio.addEventListener("pause", () => {
    if (audio?.paused !== false) setPlayingState(false);
  });
}

const pastLife = document.querySelector("[data-past-life]");
const lampFirefly = document.querySelector("[data-lamp-firefly]");
const storyCard = document.querySelector("[data-story-card]");
const vowTree = document.querySelector("[data-vow-tree]");
const vowFirefly = document.querySelector("[data-vow-firefly]");
const vowLine = document.querySelector("[data-vow-line]");
const holdMeter = document.querySelector("[data-hold-meter]");
const fallingPetals = document.querySelector("[data-falling-petals]");
const instrumentButtons = document.querySelectorAll("[data-instrument]");
const instrumentStatus = document.querySelector("[data-instrument-status]");
const folkToggle = document.querySelector("[data-folk-toggle]");
const atlasToggle = document.querySelector("[data-atlas-toggle]");
const atlasPanel = document.querySelector("[data-atlas-panel]");
const atlasEmpty = document.querySelector("[data-atlas-empty]");
const atlasList = document.querySelector("[data-atlas-list]");
const presentLife = document.querySelector("[data-present-life]");
const palaceScene = document.querySelector(".palace-scene");
const palaceFirefly = document.querySelector("[data-palace-firefly]");
const seaMonologue = document.querySelector("[data-sea-monologue]");
const rippleLayer = document.querySelector("[data-ripple-layer]");
const timelineNodes = document.querySelectorAll("[data-timeline-node]");
const timelineCopy = document.querySelector("[data-timeline-copy]");
const lyricLines = document.querySelectorAll("[data-lyric-line]");
const lyricNote = document.querySelector("[data-lyric-note]");
const lyricScrollScene = document.querySelector(".lyric-scroll-scene");
const FIREFLY_WALL_API_URL = "";
const epilogueSection = document.querySelector("[data-epilogue]");
const messageSky = document.querySelector("[data-message-sky]");
const messagePopover = document.querySelector("[data-message-popover]");
const wishOpen = document.querySelector("[data-wish-open]");
const wishForm = document.querySelector("[data-wish-form]");
const wishInput = document.querySelector("[data-wish-input]");
const wishStatus = document.querySelector("[data-wish-status]");
const bookTabs = document.querySelectorAll("[data-book-tab]");
const bookKicker = document.querySelector("[data-book-kicker]");
const bookTitle = document.querySelector("[data-book-title]");
const bookBody = document.querySelector("[data-book-body]");
const bookPage = document.querySelector("[data-book-page]");
const pagePrev = document.querySelector("[data-page-prev]");
const pageNext = document.querySelector("[data-page-next]");
const afterlifeFirefly = document.querySelector("[data-afterlife-firefly]");
const afterlifeLine = document.querySelector("[data-afterlife-line]");
const collectedMemories = new Map();
const activeInstruments = new Set();
const epilogueMessages = [
  { id: "seed-1", text: "愿每一次错过，都能在下一次月色里被温柔接住。", x: 18, y: 36 },
  { id: "seed-2", text: "谢谢这束流萤，让深夜也有可以抵达的地方。", x: 52, y: 24 },
  { id: "seed-3", text: "若还有来生，愿仍在桃林第一眼认出你。", x: 76, y: 48 },
  { id: "seed-4", text: "千年太长，那就把今天也算作一次重逢。", x: 36, y: 68 },
];
const bookPages = {
  music: [
    ["乐篇", "旋律从一束微光开始", "歌曲以主歌的细雨和副歌的深海回声相互照应，编曲从民乐纹理慢慢推向重逢时的开阔声场。"],
    ["乐篇", "人声与器乐的距离", "主歌保留呼吸感，副歌加深混响，尾奏再把声音收回近处，像流萤重新停回掌心。"],
  ],
  visual: [
    ["画篇", "桃粉与黛蓝的两世", "前世用桃粉、灯火和雨丝写人间烟火；今生用黛蓝、冷银和水纹写龙宫孤寂。"],
    ["画篇", "角色只留下剪影", "人物不被画得太满，是为了让每位听者把自己的遗憾与等待投进去。"],
  ],
  story: [
    ["念篇", "一诺千年的骨架", "前世是初遇与承诺，今生是独守与执念，重逢篇让两条时间线在流萤里合拢。"],
    ["念篇", "尾声不是结束", "最后一屏把叙事交给用户留言，让故事从作品内部延伸到每个抵达的人。"],
  ],
};
let activeBook = "music";
let activeBookPage = 0;
let rainAudioContext = null;
let rainSource = null;
let holdTimer = 0;
let holdStartedAt = 0;
let vowUnlocked = false;

function playSongSegment(startAt) {
  const segmentAudio = encounterAudio || audio;
  if (!segmentAudio) return;
  if (segmentAudio !== audio) {
    audio?.pause();
  }
  if (!Number.isFinite(segmentAudio.duration) || segmentAudio.duration > startAt) {
    try {
      segmentAudio.currentTime = startAt;
    } catch {}
  }
  segmentAudio.volume = Math.max(segmentAudio.volume, 0.62);
  segmentAudio.play().then(() => setPlayingState(true)).catch(() => {});
}

function startRainAmbience() {
  if (rainAudioContext || !window.AudioContext && !window.webkitAudioContext) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  rainAudioContext = new AudioCtor();
  const bufferSize = rainAudioContext.sampleRate * 2;
  const buffer = rainAudioContext.createBuffer(1, bufferSize, rainAudioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.18;
  }
  rainSource = rainAudioContext.createBufferSource();
  const filter = rainAudioContext.createBiquadFilter();
  const gain = rainAudioContext.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  gain.gain.value = 0.035;
  rainSource.buffer = buffer;
  rainSource.loop = true;
  rainSource.connect(filter).connect(gain).connect(rainAudioContext.destination);
  rainSource.start();
}

function addMemory(title, text) {
  if (collectedMemories.has(title)) return;
  collectedMemories.set(title, text);
  if (atlasEmpty) atlasEmpty.hidden = true;
  const item = document.createElement("li");
  item.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  atlasList?.append(item);
}

pastLife?.addEventListener("pointermove", (event) => {
  const scene = event.target.closest(".peach-meet-scene");
  if (!scene) return;
  const rect = scene.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 22;
  const y = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 14;
  scene.style.setProperty("--scene-drift-x", `${x.toFixed(2)}px`);
  scene.style.setProperty("--scene-drift-y", `${y.toFixed(2)}px`);
});

lampFirefly?.addEventListener("click", () => {
  storyCard.hidden = false;
  playSongSegment(0);
  startRainAmbience();
  addMemory("桃林初见", "那年上元，他化凡人形，于桃林下拾得一只受伤的流萤。");
});

vowFirefly?.addEventListener("click", () => {
  const line = "既然你叫流萤，不如我就赠你漫天流萤";
  if (vowLine) vowLine.textContent = `“${line}”`;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  audio?.pause();
  encounterAudio?.pause();
  if (vowVoice) {
    vowVoice.currentTime = 0;
    vowVoice.volume = 0.86;
    vowVoice.play().catch(() => {});
  }
  addMemory("树下一诺", line);
});

function unlockVowIllustration() {
  if (vowUnlocked) return;
  vowUnlocked = true;
  fallingPetals?.closest(".vow-scene")?.classList.add("is-petal-rain");
  addMemory("前世剧情插画", "老桃树下，一男一女的淡金剪影立在花雨里，一诺千年。");
}

function stopTreeHold() {
  window.clearInterval(holdTimer);
  holdTimer = 0;
  holdMeter?.style.setProperty("--hold-progress", "0%");
}

function startTreeHold(event) {
  event.preventDefault();
  holdStartedAt = performance.now();
  stopTreeHold();
  holdTimer = window.setInterval(() => {
    const progress = Math.min(1, (performance.now() - holdStartedAt) / 3000);
    holdMeter?.style.setProperty("--hold-progress", `${(progress * 100).toFixed(1)}%`);
    if (progress >= 1) {
      stopTreeHold();
      unlockVowIllustration();
    }
  }, 80);
}

vowTree?.addEventListener("pointerdown", startTreeHold);
vowTree?.addEventListener("pointerup", stopTreeHold);
vowTree?.addEventListener("pointerleave", stopTreeHold);
vowTree?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") startTreeHold(event);
});
vowTree?.addEventListener("keyup", stopTreeHold);

instrumentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.instrument;
    activeInstruments.add(name);
    button.classList.add("is-active");
    playSongSegment(44 + activeInstruments.size * 6);
    if (instrumentStatus) {
      instrumentStatus.textContent = `已突出${name}声部。继续点亮其余乐器，收集完整前世编曲层。`;
    }
    addMemory(`乐坊・${name}`, `已听见${name}在主歌里的声部细节。`);
    if (activeInstruments.size === instrumentButtons.length && folkToggle) {
      folkToggle.disabled = false;
      folkToggle.classList.add("is-unlocked");
      folkToggle.textContent = "切换前世纯民乐版";
      addMemory("前世纯民乐版", "四件乐器全部点亮，完整民乐版已解锁。");
    }
  });
});

folkToggle?.addEventListener("click", () => {
  if (folkToggle.disabled) return;
  playSongSegment(44);
  folkToggle.textContent = "前世纯民乐版播放中";
});

atlasToggle?.addEventListener("click", () => {
  const expanded = atlasPanel?.hidden;
  if (!atlasPanel) return;
  atlasPanel.hidden = !expanded;
  atlasToggle.setAttribute("aria-expanded", String(Boolean(expanded)));
});

palaceScene?.addEventListener("pointermove", (event) => {
  const rect = palaceScene.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
  const y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
  rippleLayer?.style.setProperty("--ripple-x", `${x.toFixed(2)}%`);
  rippleLayer?.style.setProperty("--ripple-y", `${y.toFixed(2)}%`);
  rippleLayer?.style.setProperty("--ripple-opacity", "1");
  window.clearTimeout(palaceScene._rippleTimer);
  palaceScene._rippleTimer = window.setTimeout(() => {
    rippleLayer?.style.setProperty("--ripple-opacity", "0");
  }, 360);
});

palaceFirefly?.addEventListener("click", () => {
  if (seaMonologue) seaMonologue.hidden = false;
  playSongSegment(58);
  addMemory("龙宫独守", "千年光阴，四海寂寂，不过等一个归期。");
});

timelineNodes.forEach((node) => {
  node.addEventListener("click", () => {
    timelineNodes.forEach((item) => item.classList.toggle("is-active", item === node));
    const year = node.dataset.year || "千年";
    const copy = node.dataset.copy || "";
    if (timelineCopy) timelineCopy.textContent = `${year}：${copy}`;
    playSongSegment(Number(node.dataset.start || 76));
    addMemory(`深海・${year}`, copy);
  });
});

lyricLines.forEach((line) => {
  line.addEventListener("click", () => {
    lyricLines.forEach((item) => item.classList.toggle("is-active", item === line));
    const note = line.dataset.note || "";
    if (lyricNote) lyricNote.textContent = note;
    playSongSegment(Number(line.dataset.start || 102));
    addMemory("深海歌词手札", `${line.textContent.trim()}：${note}`);
  });
});

function getStoredMessages() {
  try {
    return JSON.parse(window.localStorage.getItem("epilogue-firefly-messages") || "[]");
  } catch {
    return [];
  }
}

function storeMessage(message) {
  const stored = getStoredMessages();
  stored.push(message);
  window.localStorage.setItem("epilogue-firefly-messages", JSON.stringify(stored));
}

function renderMessages(messages) {
  if (!messageSky) return;
  messageSky.replaceChildren();
  messages.forEach((message, index) => {
    const firefly = document.createElement("button");
    firefly.className = "wall-firefly";
    firefly.type = "button";
    firefly.style.left = `${Math.max(6, Math.min(90, Number(message.x) || 20 + index * 11))}%`;
    firefly.style.top = `${Math.max(8, Math.min(82, Number(message.y) || 30 + index * 7))}%`;
    firefly.style.animationDelay = `${index * -0.42}s`;
    firefly.setAttribute("aria-label", "查看萤火留言");
    firefly.addEventListener("click", () => {
      if (!messagePopover) return;
      messagePopover.hidden = false;
      messagePopover.textContent = message.text;
    });
    messageSky.append(firefly);
  });
}

async function loadFireflyMessages() {
  const fallback = [...epilogueMessages, ...getStoredMessages()];
  if (!FIREFLY_WALL_API_URL) {
    renderMessages(fallback);
    return;
  }

  try {
    const response = await fetch(`${FIREFLY_WALL_API_URL.replace(/\/$/, "")}/firefly-messages`);
    if (!response.ok) throw new Error("message api unavailable");
    const messages = await response.json();
    renderMessages(Array.isArray(messages) && messages.length ? messages : fallback);
  } catch {
    renderMessages(fallback);
    if (wishStatus) wishStatus.textContent = "共享接口暂未连接，留言会先暂存在当前浏览器。";
  }
}

function makeMessage(text) {
  return {
    id: `local-${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
    x: 12 + Math.random() * 76,
    y: 16 + Math.random() * 62,
  };
}

wishOpen?.addEventListener("click", () => {
  if (!wishForm) return;
  wishForm.hidden = !wishForm.hidden;
  wishInput?.focus();
});

wishForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = wishInput?.value.trim() || "";
  if (text.length < 2 || text.length > 80) {
    if (wishStatus) wishStatus.textContent = "请写下 2-80 个字的心愿。";
    return;
  }

  let message = makeMessage(text);
  if (FIREFLY_WALL_API_URL) {
    try {
      const response = await fetch(`${FIREFLY_WALL_API_URL.replace(/\/$/, "")}/firefly-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) throw new Error("message api unavailable");
      message = await response.json();
      if (wishStatus) wishStatus.textContent = "心愿已化作一只共享流萤。";
    } catch {
      storeMessage(message);
      if (wishStatus) wishStatus.textContent = "共享接口暂未连接，已先暂存在当前浏览器。";
    }
  } else {
    storeMessage(message);
    if (wishStatus) wishStatus.textContent = "共享接口暂未连接，已先暂存在当前浏览器。";
  }

  wishInput.value = "";
  wishForm.hidden = true;
  renderMessages([...epilogueMessages, ...getStoredMessages(), message].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index));
});

function playPaperSound() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(420, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(180, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
}

function renderBookPage() {
  const pages = bookPages[activeBook];
  const page = pages[activeBookPage];
  if (!page) return;
  if (bookKicker) bookKicker.textContent = page[0];
  if (bookTitle) bookTitle.textContent = page[1];
  if (bookBody) bookBody.textContent = page[2];
  bookTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.bookTab === activeBook));
  bookPage?.classList.toggle("is-visual-volume", activeBook === "visual");
  bookPage?.classList.toggle("is-story-volume", activeBook === "story");
}

bookTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeBook = tab.dataset.bookTab || "music";
    activeBookPage = 0;
    playPaperSound();
    renderBookPage();
  });
});

pagePrev?.addEventListener("click", () => {
  const pages = bookPages[activeBook];
  activeBookPage = (activeBookPage - 1 + pages.length) % pages.length;
  playPaperSound();
  renderBookPage();
});

pageNext?.addEventListener("click", () => {
  const pages = bookPages[activeBook];
  activeBookPage = (activeBookPage + 1) % pages.length;
  playPaperSound();
  renderBookPage();
});

function playAfterlifeMelody() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  const context = new AudioCtor();
  const notes = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392, 493.88, 659.25, 587.33, 523.25];
  notes.forEach((freq, index) => {
    const start = context.currentTime + index * 1.18;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.05);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 1.12);
  });
}

afterlifeFirefly?.addEventListener("click", () => {
  epilogueSection?.classList.add("is-fading");
  playAfterlifeMelody();
  window.setTimeout(() => {
    if (afterlifeLine) afterlifeLine.hidden = false;
  }, 11800);
});

renderBookPage();
loadFireflyMessages();


