const audio = document.querySelector("#audio");
const playBtn = document.querySelector("#playBtn");
const heroPlay = document.querySelector("#heroPlay");
const butterflySecret = document.querySelector("#butterflySecret");
const lightBurst = document.querySelector("#lightBurst");
const goldenTrail = document.querySelector("#goldenTrail");
const muteBtn = document.querySelector("#muteBtn");
const progress = document.querySelector("#progress");
const timeText = document.querySelector("#timeText");
const loveForm = document.querySelector("#loveForm");
const loveInput = document.querySelector("#loveInput");
const loveNotes = document.querySelector("#loveNotes");
const heartBroadcaster = document.querySelector("#heartBroadcaster");
const liveConfessionText = document.querySelector("#liveConfessionText");
const confessionCount = document.querySelector("#confessionCount");
const potionDrops = document.querySelector("#potionDrops");
const dateInput = document.querySelector("#dateInput");
const constellationText = document.querySelector("#constellationText");
const generatedStars = document.querySelector("#generatedStars");
const constellationPath = document.querySelector("#constellationPath");
const chorusLine = document.querySelector("#chorusLine");
const singFinale = document.querySelector("#singFinale");
const promiseStage = document.querySelector("#promiseStage");
const courageRange = document.querySelector("#courageRange");
const courageValue = document.querySelector("#courageValue");
const courageText = document.querySelector("#courageText");
const flowerItems = [...document.querySelectorAll(".flower-item")];
const flowerPoem = document.querySelector("#flowerPoem");
const pickedRow = document.querySelector("#pickedRow");
const composeLetter = document.querySelector("#composeLetter");
const floatingLetter = document.querySelector("#floatingLetter");
const navLinks = [...document.querySelectorAll(".chapter-nav a")];
const sections = [...document.querySelectorAll(".screen")];
const debateCards = [...document.querySelectorAll(".philosopher-card")];
const debateChips = [...document.querySelectorAll(".debate-chip")];
const debateLyric = document.querySelector("#debateLyric");

let activeTone = "soft";
let seeking = false;
const fallbackDuration = 175;
let audioContext;
let audioSource;
let pannerNode;
let filterNode;
let gainNode;
let debateMood = "distance";
let lockedDebateMood = "distance";
let confessionTotal = 4;
const pickedFlowers = new Set();

const toneColors = {
  soft: ["#ffe4e1", "#f4d068", "#ffffff"],
  glass: ["#b82d48", "#9fd9e8", "#ffffff"],
  hot: ["#ffffff", "#ffd4dd", "#f4d068"],
  dawn: ["#b82d48", "#4d8f72", "#f4d068"],
  garden: ["#b82d48", "#4d8f72", "#fff8f4"],
  night: ["#fff4c9", "#ffd4dd", "#9fd9e8"],
};

const debateLyrics = {
  distance: "“孔子说爱情，距离产生问题。”",
  timing: "“孟子说爱情，讲究天时地利。”",
  center: "“圣人随便哄哄你，不必死守规矩。”",
};

const flowerPoems = {
  redbean: {
    name: "红豆",
    poem: "红豆不问计谋，只把相思藏进春天：我念你，胜过三十六计。",
  },
  reed: {
    name: "蒹葭",
    poem: "蒹葭苍苍，白露未晞。所谓爱人，不在水一方，就在我心上。",
  },
  peach: {
    name: "桃夭",
    poem: "桃之夭夭，灼灼其华。愿与你并肩，把寻常日子开成花。",
  },
  orchid: {
    name: "兰草",
    poem: "兰有清香，不争春色。爱你这件事，纯粹、自然、相爱。",
  },
};

function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

async function togglePlayback() {
  if (audio.paused) {
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    await audio.play();
  } else {
    audio.pause();
  }
}

async function unlockButterflySecret() {
  document.body.classList.add("secret-opened");
  createLightBurst();
  const rect = butterflySecret.getBoundingClientRect();
  addGoldenTrail(rect.left + rect.width / 2, rect.top + rect.height / 2, 28);

  window.setTimeout(() => {
    const heroBottom = document.querySelector("#prologue").getBoundingClientRect().bottom;
    if (heroBottom > window.innerHeight * 0.72) {
      document.querySelector("#saint").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 1650);

  if (audio.paused) {
    try {
      ensureAudioGraph();
      if (audioContext?.state === "suspended") await audioContext.resume();
      audio.play().catch((error) => {
        console.warn("Audio playback needs another user gesture.", error);
      });
    } catch (error) {
      console.warn("Audio playback needs another user gesture.", error);
    }
  }
}

function createLightBurst() {
  lightBurst.replaceChildren();
  const colors = ["#ffffff", "#ffe4e1", "#f4d068", "#ffd4dd"];

  for (let index = 0; index < 72; index += 1) {
    const spark = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 430;
    const downwardPull = Math.random() > 0.58 ? 280 + Math.random() * 260 : 0;

    spark.className = "burst-spark";
    spark.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--y", `${Math.sin(angle) * distance + downwardPull}px`);
    spark.style.setProperty("--s", `${4 + Math.random() * 10}px`);
    spark.style.setProperty("--c", colors[Math.floor(Math.random() * colors.length)]);
    spark.style.animationDelay = `${Math.random() * 0.22}s`;
    lightBurst.append(spark);
  }
}

function addGoldenTrail(clientX, clientY, amount = 6) {
  const rect = goldenTrail.getBoundingClientRect();

  for (let index = 0; index < amount; index += 1) {
    const spark = document.createElement("span");
    spark.className = "trail-spark";
    spark.style.left = `${clientX - rect.left + (Math.random() - 0.5) * 34}px`;
    spark.style.top = `${clientY - rect.top + (Math.random() - 0.5) * 34}px`;
    spark.style.setProperty("--s", `${4 + Math.random() * 8}px`);
    spark.style.setProperty("--dx", `${-28 + Math.random() * 56}px`);
    spark.style.setProperty("--dy", `${28 + Math.random() * 72}px`);
    goldenTrail.append(spark);
    window.setTimeout(() => spark.remove(), 1300);
  }
}

function ensureAudioGraph() {
  if (audioContext || !window.AudioContext && !window.webkitAudioContext) return;

  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  audioContext = new AudioEngine();
  audioSource = audioContext.createMediaElementSource(audio);
  filterNode = audioContext.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value = 16000;
  gainNode = audioContext.createGain();
  gainNode.gain.value = 1;

  if (audioContext.createStereoPanner) {
    pannerNode = audioContext.createStereoPanner();
    audioSource.connect(filterNode).connect(gainNode).connect(pannerNode).connect(audioContext.destination);
  } else {
    pannerNode = null;
    audioSource.connect(filterNode).connect(gainNode).connect(audioContext.destination);
  }
}

function setDebateMood(mood, shouldLock = false) {
  debateMood = mood;
  if (shouldLock) lockedDebateMood = mood;

  document.body.dataset.debateMood = mood;
  debateCards.forEach((card) => {
    const isActive = card.dataset.mood === mood;
    card.classList.toggle("active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
  debateChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.mood === mood));

  if (debateLyric) {
    debateLyric.textContent = debateLyrics[mood] || debateLyrics.center;
    debateLyric.classList.remove("is-changing");
    void debateLyric.offsetWidth;
    debateLyric.classList.add("is-changing");
  }

  ensureAudioGraph();
  if (audioContext?.state === "suspended" && shouldLock) {
    audioContext.resume();
  }
}

function updateDebateSound() {
  if (audioContext && gainNode && filterNode) {
    const now = audioContext.currentTime;
    const shimmer = Math.sin(performance.now() / 420) * 0.26;
    const distancePulse = (Math.sin(performance.now() / 520) + 1) / 2;
    let pan = 0;
    let gain = 1;
    let frequency = 16000;

    if (debateMood === "distance") {
      pan = -0.66 + distancePulse * 0.42;
      gain = 0.72 + distancePulse * 0.28;
      frequency = 3600 + distancePulse * 9500;
    } else if (debateMood === "timing") {
      pan = 0.45 + shimmer;
      gain = 0.92;
      frequency = 12000 + Math.abs(shimmer) * 2400;
    }

    if (pannerNode) pannerNode.pan.setTargetAtTime(pan, now, 0.12);
    gainNode.gain.setTargetAtTime(gain, now, 0.12);
    filterNode.frequency.setTargetAtTime(frequency, now, 0.12);
  }

  requestAnimationFrame(updateDebateSound);
}

function updatePlaybackState() {
  document.body.classList.toggle("is-playing", !audio.paused);
}

function updateTime() {
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDuration;
  if (!seeking && duration > 0) {
    progress.value = Math.round((audio.currentTime / duration) * Number(progress.max));
  }
  timeText.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
}

playBtn.addEventListener("click", togglePlayback);
heroPlay.addEventListener("click", togglePlayback);
butterflySecret.addEventListener("click", unlockButterflySecret);
butterflySecret.addEventListener("pointermove", (event) => {
  if (Math.random() > 0.45) addGoldenTrail(event.clientX, event.clientY, 3);
});
butterflySecret.addEventListener("pointerenter", (event) => addGoldenTrail(event.clientX, event.clientY, 16));
debateCards.forEach((card) => {
  card.addEventListener("pointerenter", () => setDebateMood(card.dataset.mood));
  card.addEventListener("pointerleave", () => setDebateMood(lockedDebateMood));
  card.addEventListener("click", async () => {
    setDebateMood(card.dataset.mood, true);
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.paused) audio.play().catch(() => {});
  });
});
debateChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    setDebateMood(chip.dataset.mood, true);
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.paused) audio.play().catch(() => {});
  });
});
audio.addEventListener("play", updatePlaybackState);
audio.addEventListener("pause", updatePlaybackState);
audio.addEventListener("loadedmetadata", updateTime);
audio.addEventListener("timeupdate", updateTime);

progress.addEventListener("input", () => {
  seeking = true;
});

progress.addEventListener("change", () => {
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDuration;
  if (duration > 0) {
    audio.currentTime = (Number(progress.value) / Number(progress.max)) * duration;
  }
  seeking = false;
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("is-muted", audio.muted);
});

const seedNotes = ["Love love", "只要是你", "靠近一点", "玫瑰在听"];

function addLoveNote(text) {
  const note = document.createElement("span");
  note.className = "love-note";
  note.textContent = text;
  note.style.setProperty("--x", `${8 + Math.random() * 76}%`);
  note.style.setProperty("--y", `${10 + Math.random() * 70}%`);
  note.style.animationDelay = `${Math.random() * -4}s`;
  loveNotes.append(note);
  if (loveNotes.children.length > 10) loveNotes.firstElementChild.remove();
}

function addPotionDrop(text) {
  const drop = document.createElement("span");
  drop.className = "potion-drop";
  drop.textContent = text.length > 8 ? "爱情药方" : text;
  drop.style.setProperty("--dx", `${-160 + Math.random() * 320}px`);
  drop.style.setProperty("--dy", `${-190 - Math.random() * 140}px`);
  potionDrops.append(drop);
  window.setTimeout(() => drop.remove(), 2800);
}

function pulseHeart(text = "Love Love") {
  liveConfessionText.textContent = text;
  heartBroadcaster.classList.remove("is-bursting");
  void heartBroadcaster.offsetWidth;
  heartBroadcaster.classList.add("is-bursting");
  window.setTimeout(() => heartBroadcaster.classList.remove("is-bursting"), 1900);
}

function submitConfession(value) {
  const confession = value.trim();
  if (!confession) return;

  addLoveNote(confession);
  addPotionDrop(confession);
  pulseHeart(confession);
  confessionTotal += 1;
  confessionCount.textContent = String(confessionTotal);
}

seedNotes.forEach((note) => addLoveNote(note));

loveInput.addEventListener("input", () => {
  liveConfessionText.textContent = loveInput.value.trim() || "Love Love";
});

heartBroadcaster.addEventListener("click", async () => {
  pulseHeart(loveInput.value.trim() || "Love Love");
  addPotionDrop("Love");
  try {
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.paused) audio.play().catch(() => {});
  } catch (error) {
    console.warn("Audio playback needs another user gesture.", error);
  }
});

loveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = loveInput.value.trim();
  if (!value) return;
  submitConfession(value);
  loveInput.value = "";
  liveConfessionText.textContent = "Love Love";

  try {
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.paused) audio.play().catch(() => {});
  } catch (error) {
    console.warn("Audio playback needs another user gesture.", error);
  }
});

function updateCourage(value) {
  const courage = Number(value);
  promiseStage.style.setProperty("--courage", courage);
  document.querySelector("#promise").style.setProperty("--courage", courage);
  courageValue.textContent = `${courage}%`;

  if (courage < 34) {
    courageText.textContent = "梦境还很轻，粉色泡泡正在云海里漂浮。";
  } else if (courage < 68) {
    courageText.textContent = "青龙偃月刀正在化成温柔的光波。";
  } else if (courage < 90) {
    courageText.textContent = "火焰升起，勇气把迷雾照成金色。";
  } else {
    courageText.textContent = "笃定达成：牵起手，谎话也会输给奔赴。";
  }

  if (courage >= 88 && audio.paused) {
    togglePlayback().catch(() => {});
  }
}

courageRange.addEventListener("input", () => updateCourage(courageRange.value));

function pickFlower(type) {
  const flower = flowerPoems[type];
  if (!flower) return;

  pickedFlowers.add(type);
  flowerItems.forEach((item) => item.classList.toggle("is-picked", pickedFlowers.has(item.dataset.flower)));

  flowerPoem.textContent = flower.poem;
  flowerPoem.classList.remove("is-writing");
  void flowerPoem.offsetWidth;
  flowerPoem.classList.add("is-writing");

  pickedRow.replaceChildren(
    ...[...pickedFlowers].map((key) => {
      const tag = document.createElement("span");
      tag.textContent = flowerPoems[key].name;
      return tag;
    })
  );
}

function showComposedLetter() {
  const names = [...pickedFlowers].map((key) => flowerPoems[key].name);
  const summary = names.length
    ? `${names.join("、")}都替你说：我爱你。`
    : "春天替你把爱写好。";

  floatingLetter.querySelector("p").textContent = summary;
  floatingLetter.classList.remove("is-visible");
  void floatingLetter.offsetWidth;
  floatingLetter.classList.add("is-visible");

  if (names.length) {
    addLoveNote(summary);
  }
}

flowerItems.forEach((item) => {
  item.addEventListener("click", () => pickFlower(item.dataset.flower));
});

composeLetter.addEventListener("click", showComposedLetter);

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function generateConstellation(value) {
  if (!value) return;

  const date = new Date(`${value}T00:00:00`);
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const random = seededRandom(seed);
  const names = ["玫瑰星", "蝴蝶星", "回声星", "春风星", "执手星", "远山星"];
  const name = names[(date.getDate() + date.getMonth()) % names.length];
  const points = [];

  generatedStars.replaceChildren();
  for (let index = 0; index < 18; index += 1) {
    const x = 12 + random() * 76;
    const y = 14 + random() * 68;
    const star = document.createElement("span");
    star.className = "generated-star";
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.setProperty("--size", `${4 + random() * 8}px`);
    star.style.setProperty("--color", random() > 0.5 ? "#fff4c9" : "#ffe4e1");
    star.style.animationDelay = `${random() * -2}s`;
    generatedStars.append(star);
    if (index < 6) points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  constellationPath.setAttribute("points", points.join(" "));
  constellationPath.style.animation = "none";
  void constellationPath.getBoundingClientRect();
  constellationPath.style.animation = "";
  constellationText.textContent = `${value} · ${name}正在发光`;
  chorusLine.textContent = `Love love love... ${name}`;
}

dateInput.addEventListener("change", () => generateConstellation(dateInput.value));

singFinale.addEventListener("click", async () => {
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  generateConstellation(dateInput.value);
  chorusLine.textContent = "Love love love love... 终点是你";
  try {
    ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
    if (audio.paused) audio.play().catch(() => {});
  } catch (error) {
    console.warn("Audio playback needs another user gesture.", error);
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      activeTone = entry.target.dataset.tone || "soft";
      navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
    });
  },
  { threshold: 0.55 }
);

sections.forEach((section) => observer.observe(section));

const canvas = document.querySelector("#sky");
const ctx = canvas.getContext("2d");
const particles = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function makeParticle(x = Math.random() * width, y = Math.random() * height) {
  const palette = toneColors[activeTone] || toneColors.soft;
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.38,
    vy: -0.15 - Math.random() * 0.45,
    size: 3 + Math.random() * 10,
    alpha: 0.18 + Math.random() * 0.48,
    spin: Math.random() * Math.PI,
    color: palette[Math.floor(Math.random() * palette.length)],
    life: 260 + Math.random() * 260,
  };
}

function drawHeart(x, y, size, color, alpha, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size / 18, size / 18);
  ctx.beginPath();
  for (let t = 0; t <= Math.PI * 2; t += 0.16) {
    const px = 16 * Math.sin(t) ** 3;
    const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    if (t === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  while (particles.length < 64) particles.push(makeParticle());

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.spin += 0.008;
    particle.life -= 1;
    drawHeart(particle.x, particle.y, particle.size, particle.color, particle.alpha, particle.spin);

    if (particle.y < -40 || particle.life <= 0 || particle.x < -50 || particle.x > width + 50) {
      particles[index] = makeParticle(Math.random() * width, height + 30);
    }
  });

  requestAnimationFrame(animateParticles);
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
setDebateMood("distance", true);
updateCourage(courageRange.value);
animateParticles();
updateDebateSound();
updateTime();
