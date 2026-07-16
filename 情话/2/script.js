const audio = document.querySelector("#theme-audio");
const startButton = document.querySelector("#start-button");
const playToggle = document.querySelector("#play-toggle");
const miniPlayer = document.querySelector("#mini-player");
const progressBar = document.querySelector("#audio-progress");
const audioTime = document.querySelector("#audio-time");
const currentScene = document.querySelector("#current-scene");
const scenes = [...document.querySelectorAll(".scene")];
const dots = [...document.querySelectorAll(".progress-dot")];
const sceneMusicCues = [...document.querySelectorAll(".scene-music-cue")];
const typeLine = document.querySelector("#type-line");
const lyricTypeButton = document.querySelector("#lyric-type-button");
const confessionForm = document.querySelector("#confession-form");
const confessionInput = document.querySelector("#confession-input");
const confessionWall = document.querySelector("#confession-wall");
const cursorLayer = document.querySelector("#cursor-layer");
const swipeCard = document.querySelector("#swipe-card");
const swipeText = document.querySelector("#swipe-text");
const embraceScene = document.querySelector(".embrace-scene");
const embracePrev = document.querySelector("#embrace-prev");
const embraceNext = document.querySelector("#embrace-next");
const replayButton = document.querySelector("#replay-button");
const memoryButton = document.querySelector("#memory-button");
const memoryCard = document.querySelector("#memory-card");
const loopButton = document.querySelector("#loop-button");
const mirrorScene = document.querySelector(".mirror-scene");
const mirrorLyric = document.querySelector("#mirror-lyric");
const inkLyricPanel = document.querySelector("#ink-lyric-panel");
const inkLines = [...document.querySelectorAll(".ink-line")];
const rainScene = document.querySelector(".rain-scene");
const driftBottle = document.querySelector("#drift-bottle");
const bottleMessage = document.querySelector("#bottle-message");
const bottleBubbles = document.querySelector("#bottle-bubbles");
const recordPlayer = document.querySelector(".record-player");
const canvas = document.querySelector("#ambient-canvas");
const ctx = canvas.getContext("2d");

const typeSource = typeLine.textContent.trim();
const introTypeLines = [
  "痴情的人总是太傻，把一句情话反复写到发烫。",
  "每当你又想念着她，总会偷偷说情话。",
  "我不是她，没有美丽的长发，却也曾冲花了最美的年华。",
  "点一下歌词打字，让回忆一字一字亮起来。"
];
const swipeLines = [
  "当你又想念着他，不要把我抱紧好吗。",
  "你的温柔总是来迟，我却每一次都当成永远。",
  "如果拥抱也会错位，那我愿意站在回忆的背面。",
  "我把心跳调成静音，只怕吵醒你梦里的她。"
];
const bottleLines = [
  "我最卑微的愿望，是你回头时刚好看见我。",
  "雨停以后，我还是会把你的名字写进旧信纸。",
  "我以为沉默能体面，后来才知道那叫不舍得。",
  "如果她是你的月亮，那我就做一盏坏掉的路灯。"
];
const memoryLines = [
  "风中的花，抚慰着我的脸颊。",
  "不要害怕，满酒掩饰了虚假。",
  "我把散场写成卡片，留给不肯醒来的自己。",
  "最后一遍循环，不是为了等你，是为了和回忆告别。"
];

sceneMusicCues.forEach((cue) => {
  cue.dataset.defaultLabel = cue.textContent.trim();
});

let swipeIndex = 0;
let touchStartX = 0;
let particles = [];
let hasTyped = false;
let frame = 0;
let typeTimer = null;
let lyricTypeIndex = 0;
let bottleIndex = 0;
let memoryIndex = 0;
let inkLineIndex = 0;
let recordFxTimer = null;
let impactAudioContext = null;
let impactAudioUrl = null;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function setPlayingState() {
  const isPlaying = !audio.paused;
  document.body.classList.toggle("is-playing", isPlaying);
  playToggle.textContent = "M";
  startButton.innerHTML = isPlaying
    ? '<span class="button-spark">✦</span> 回忆正在播放'
    : '<span class="button-spark">✦</span> 开启回忆';
  sceneMusicCues.forEach((cue) => {
    cue.classList.toggle("is-cue-playing", isPlaying && cue.closest(".scene")?.classList.contains("is-active"));
    if (!isPlaying) cue.textContent = cue.dataset.defaultLabel || "播放本幕 · 情话";
  });
}

function typeText(text) {
  window.clearInterval(typeTimer);
  let index = 0;
  typeLine.textContent = "";
  typeLine.classList.add("is-typing");
  lyricTypeButton?.classList.add("is-active");
  typeTimer = window.setInterval(() => {
    typeLine.textContent = text.slice(0, index);
    index += 1;
    if (index > text.length) {
      window.clearInterval(typeTimer);
      typeTimer = window.setTimeout(() => {
        typeLine.classList.remove("is-typing");
        lyricTypeButton?.classList.remove("is-active");
      }, 620);
    }
  }, 46);
}

function playLyricTyping() {
  const line = introTypeLines[lyricTypeIndex];
  lyricTypeIndex = (lyricTypeIndex + 1) % introTypeLines.length;
  hasTyped = true;
  typeText(line);
}

function getNeedleImpactAudioUrl() {
  if (impactAudioUrl) return impactAudioUrl;
  const sampleRate = 11025;
  const duration = 0.52;
  const sampleCount = Math.floor(sampleRate * duration);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + sampleCount * 2);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    const boom = Math.sin(2 * Math.PI * (82 - 54 * t) * t) * envelope * 0.72;
    const scratch = (Math.random() * 2 - 1) * Math.max(0, 1 - t / 0.16) * 0.28;
    const click = Math.sin(2 * Math.PI * 680 * t) * Math.max(0, 1 - t / 0.045) * 0.2;
    const sample = Math.max(-1, Math.min(1, boom + scratch + click));
    view.setInt16(headerSize + i * 2, sample * 32767, true);
  }

  impactAudioUrl = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  return impactAudioUrl;
}

function playNeedleImpactFallback() {
  const player = new Audio(getNeedleImpactAudioUrl());
  player.volume = 0.38;
  player.play().catch(() => {});
}

function playNeedleImpactSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    playNeedleImpactFallback();
    return;
  }
  impactAudioContext ||= new AudioContextClass();
  if (impactAudioContext.state === "suspended") impactAudioContext.resume();
  const now = impactAudioContext.currentTime;
  const master = impactAudioContext.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
  master.connect(impactAudioContext.destination);

  const boom = impactAudioContext.createOscillator();
  boom.type = "sine";
  boom.frequency.setValueAtTime(86, now);
  boom.frequency.exponentialRampToValueAtTime(34, now + 0.34);
  boom.connect(master);
  boom.start(now);
  boom.stop(now + 0.48);

  const noiseBuffer = impactAudioContext.createBuffer(1, impactAudioContext.sampleRate * 0.12, impactAudioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i += 1) {
    noiseData[i] = (Math.random() * 2 - 1) * (1 - i / noiseData.length);
  }
  const scratch = impactAudioContext.createBufferSource();
  const scratchGain = impactAudioContext.createGain();
  scratchGain.gain.setValueAtTime(0.22, now);
  scratchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  scratch.buffer = noiseBuffer;
  scratch.connect(scratchGain);
  scratchGain.connect(master);
  scratch.start(now + 0.035);
}

function triggerRecordDrop() {
  if (!recordPlayer) return;
  window.clearTimeout(recordFxTimer);
  recordPlayer.classList.remove("is-needle-drop", "is-impact");
  void recordPlayer.offsetWidth;
  recordPlayer.classList.add("is-needle-drop", "is-impact");
  playNeedleImpactSound();
  recordFxTimer = window.setTimeout(() => {
    recordPlayer.classList.remove("is-needle-drop", "is-impact");
  }, 1120);
}

async function startMemory() {
  miniPlayer.classList.add("is-visible");
  triggerRecordDrop();
  if (!hasTyped) {
    typeText(typeSource);
    hasTyped = true;
  }

  try {
    await audio.play();
    setPlayingState();
  } catch {
    startButton.innerHTML = '<span class="button-spark">✦</span> 再点一次播放音乐';
  }
}

async function playSceneCue(cueButton) {
  const ratio = Number(cueButton.dataset.cueRatio || 0);
  const scene = cueButton.closest(".scene");
  miniPlayer.classList.add("is-visible");
  if (scene) activateScene(scene);
  if (scene?.id === "scene-1") triggerRecordDrop();
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = Math.max(0, Math.min(audio.duration - 0.25, audio.duration * ratio));
  }
  try {
    await audio.play();
    sceneMusicCues.forEach((cue) => {
      cue.textContent = cue.dataset.defaultLabel || "播放本幕 · 情话";
      cue.classList.remove("is-cue-playing");
    });
    cueButton.textContent = "本幕播放中";
    cueButton.classList.add("is-cue-playing");
    setPlayingState();
  } catch {
    cueButton.textContent = "再点一次播放";
  }
}

function updateAudioProgress() {
  const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressBar.style.width = `${Math.min(percent, 100)}%`;
  audioTime.textContent = formatTime(audio.currentTime);
  document.body.classList.toggle("near-ending", Boolean(audio.duration && audio.duration - audio.currentTime < 18));
}

function activateScene(scene) {
  const index = scenes.indexOf(scene);
  scenes.forEach((item) => item.classList.toggle("is-active", item === scene));
  dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  currentScene.textContent = "情话";
}

function updateActiveByScroll() {
  const middle = window.innerHeight / 2;
  const nearest = scenes
    .map((scene) => ({
      scene,
      distance: Math.abs(scene.getBoundingClientRect().top - middle)
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.scene;
  if (nearest) activateScene(nearest);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) activateScene(entry.target);
  });
}, { threshold: 0.55 });

scenes.forEach((scene) => observer.observe(scene));
window.addEventListener("scroll", () => requestAnimationFrame(updateActiveByScroll), { passive: true });
window.addEventListener("hashchange", () => requestAnimationFrame(updateActiveByScroll));

function addConfession(text) {
  const item = document.createElement("span");
  item.className = "floating-confession";
  item.textContent = text;
  item.style.left = `${8 + Math.random() * 45}%`;
  item.style.bottom = `${8 + Math.random() * 24}%`;
  item.style.animationDuration = `${6 + Math.random() * 4}s`;
  confessionWall.appendChild(item);
  window.setTimeout(() => item.remove(), 10000);
}

function createBubble(x = 50, y = 72) {
  const bubble = document.createElement("span");
  bubble.className = "bubble";
  bubble.style.left = `${x + (Math.random() * 18 - 9)}%`;
  bubble.style.top = `${y + (Math.random() * 8 - 4)}%`;
  bubble.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;
  bottleBubbles.appendChild(bubble);
  window.setTimeout(() => bubble.remove(), 3800);
}

function openBottle() {
  rainScene.classList.remove("has-bottle-note");
  void rainScene.offsetWidth;
  rainScene.classList.add("has-bottle-note");
  bottleMessage.textContent = bottleLines[bottleIndex];
  bottleIndex = (bottleIndex + 1) % bottleLines.length;
  for (let i = 0; i < 6; i += 1) createBubble(50, 72);
}

function generateMemoryCard() {
  const line = memoryLines[memoryIndex];
  memoryIndex = (memoryIndex + 1) % memoryLines.length;
  memoryCard.classList.remove("is-generated");
  void memoryCard.offsetWidth;
  memoryCard.innerHTML = `<span>回忆卡片 ${String(memoryIndex || memoryLines.length).padStart(2, "0")}</span><p>“${line}”</p>`;
  memoryCard.classList.add("is-generated");
}

function changeSwipeLine(direction) {
  embraceScene.classList.add("is-torn");
  swipeIndex = (swipeIndex + direction + swipeLines.length) % swipeLines.length;
  swipeText.animate([
    { opacity: 1, transform: "translateX(0)" },
    { opacity: 0, transform: `translateX(${direction * -18}px)` },
    { opacity: 0, transform: `translateX(${direction * 18}px)` },
    { opacity: 1, transform: "translateX(0)" }
  ], { duration: 360, easing: "ease-out" });
  window.setTimeout(() => {
    swipeText.textContent = swipeLines[swipeIndex];
  }, 170);
  window.setTimeout(() => embraceScene.classList.remove("is-torn"), 760);
}

function revealMirrorSecret() {
  mirrorScene.classList.add("has-secret");
  showRandomInkLine();
  mirrorLyric.classList.remove("is-touched");
  void mirrorLyric.offsetWidth;
  mirrorLyric.classList.add("is-touched");
  window.setTimeout(() => mirrorLyric.classList.remove("is-touched"), 640);
}

function showInkLine(index = inkLineIndex) {
  if (!inkLines.length || !inkLyricPanel) return;
  inkLineIndex = (index + inkLines.length) % inkLines.length;
  inkLyricPanel.style.setProperty("--ink-x", `${24 + Math.random() * 52}%`);
  inkLyricPanel.style.setProperty("--ink-y", `${20 + Math.random() * 58}%`);
  inkLines.forEach((line, lineIndex) => {
    const isCurrent = lineIndex === inkLineIndex;
    line.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      line.classList.remove("is-visible");
      void line.offsetWidth;
      line.classList.add("is-visible");
    }
  });
}

function showRandomInkLine() {
  if (!inkLines.length) return;
  if (inkLines.length === 1) {
    showInkLine(0);
    return;
  }
  let nextIndex = inkLineIndex;
  while (nextIndex === inkLineIndex) {
    nextIndex = Math.floor(Math.random() * inkLines.length);
  }
  showInkLine(nextIndex);
}

function updateInkLyricsByMusic() {
  if (!inkLines.length) return;
  const mirrorActive = mirrorScene.classList.contains("is-active");
  if (!mirrorActive && audio.paused) return;
  const nextIndex = Math.floor(audio.currentTime / 3.8) % inkLines.length;
  if (nextIndex !== inkLineIndex) showInkLine(nextIndex);
}

function spawnSpark(x, y) {
  const spark = document.createElement("span");
  spark.className = "spark";
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;
  cursorLayer.appendChild(spark);
  window.setTimeout(() => spark.remove(), 740);
}

function sizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  particles = Array.from({ length: Math.min(70, Math.floor(window.innerWidth / 7)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: 0.8 + Math.random() * 1.9,
    speed: 0.12 + Math.random() * 0.42,
    alpha: 0.18 + Math.random() * 0.38
  }));
}

function drawAmbient() {
  frame += 1;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  particles.forEach((particle) => {
    particle.y -= particle.speed * (audio.paused ? 0.6 : 1.45);
    particle.x += Math.sin((frame + particle.y) / 80) * 0.12;
    if (particle.y < -10) {
      particle.y = window.innerHeight + 10;
      particle.x = Math.random() * window.innerWidth;
    }
    ctx.beginPath();
    ctx.fillStyle = `rgba(244, 216, 232, ${particle.alpha})`;
    ctx.shadowColor = "rgba(159, 197, 218, 0.55)";
    ctx.shadowBlur = 12;
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();
  });
  requestAnimationFrame(drawAmbient);
}

startButton.addEventListener("click", startMemory);
lyricTypeButton?.addEventListener("click", playLyricTyping);
sceneMusicCues.forEach((cueButton) => {
  cueButton.addEventListener("click", () => playSceneCue(cueButton));
});
mirrorLyric.addEventListener("click", revealMirrorSecret);
mirrorLyric.addEventListener("pointerenter", revealMirrorSecret);
inkLyricPanel?.addEventListener("click", showRandomInkLine);
driftBottle.addEventListener("click", openBottle);

playToggle.addEventListener("click", async () => {
  miniPlayer.classList.add("is-visible");
  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      return;
    }
  } else {
    audio.pause();
  }
  setPlayingState();
});

audio.addEventListener("play", setPlayingState);
audio.addEventListener("pause", setPlayingState);
audio.addEventListener("timeupdate", updateAudioProgress);
audio.addEventListener("timeupdate", updateInkLyricsByMusic);
audio.addEventListener("loadedmetadata", updateAudioProgress);
audio.addEventListener("ended", setPlayingState);

confessionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = confessionInput.value.trim();
  if (!value) return;
  addConfession(value);
  bottleMessage.textContent = `“${value}” 已经沉进回忆里。`;
  rainScene.classList.add("has-bottle-note");
  for (let i = 0; i < 8; i += 1) createBubble(46 + i, 76);
  confessionInput.value = "";
});

swipeCard.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

swipeCard.addEventListener("touchend", (event) => {
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 42) changeSwipeLine(delta > 0 ? -1 : 1);
}, { passive: true });

swipeCard.addEventListener("click", () => changeSwipeLine(1));
embracePrev.addEventListener("click", (event) => {
  event.stopPropagation();
  changeSwipeLine(-1);
});
embraceNext.addEventListener("click", (event) => {
  event.stopPropagation();
  changeSwipeLine(1);
});

replayButton.addEventListener("click", async () => {
  audio.currentTime = 0;
  try {
    await audio.play();
  } catch {
    return;
  }
  setPlayingState();
});

memoryButton.addEventListener("click", generateMemoryCard);

loopButton.addEventListener("click", () => {
  audio.loop = !audio.loop;
  loopButton.setAttribute("aria-pressed", String(audio.loop));
  loopButton.textContent = audio.loop ? "已沉溺" : "沉溺模式";
});

window.addEventListener("pointermove", (event) => {
  if (frame % 3 === 0) spawnSpark(event.clientX, event.clientY);
}, { passive: true });

window.addEventListener("resize", sizeCanvas);

sizeCanvas();
drawAmbient();
setPlayingState();
showInkLine(0);
addConfession("我把这首歌，藏进没有你的夏天。");
