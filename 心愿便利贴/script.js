const audio = document.querySelector("#mainAudio");
const playButton = document.querySelector("#playButton");
const playText = document.querySelector("#playText");
const currentTimeEl = document.querySelector("#currentTime");
const durationTimeEl = document.querySelector("#durationTime");
const progressFill = document.querySelector("#progressFill");
const deliveryForm = document.querySelector("#deliveryForm");
const deliveryInput = document.querySelector("#deliveryInput");
const deliveryNotes = document.querySelector("#deliveryNotes");
const wallForm = document.querySelector("#wallForm");
const wallInput = document.querySelector("#wallInput");
const wishWall = document.querySelector("#wishWall");
const memoryList = document.querySelector("#memoryList");
const replayButton = document.querySelector("#replayButton");
const wandButton = document.querySelector("#wandButton");
const starryScene = document.querySelector("#starry");
let meteorBoostUntil = 0;

const wishKey = "wishNotes";
const favoriteKey = "favoriteWishes";

const defaultWishes = [
  "把每一天都过成双向奔赴",
  "今晚流星雨替我说喜欢",
  "一起听完这首歌",
  "明天也要甜甜地见面",
  "把小烦恼折成星星",
  "愿所有心愿都有回音",
  "在你眼里看见整片星空",
  "收藏今天的心跳",
];

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateAudioState() {
  const isPlaying = !audio.paused;
  playButton.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "暂停音乐" : "播放音乐");
  playText.textContent = isPlaying ? "暂停" : "播放";
}

playButton.addEventListener("click", async () => {
  try {
    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
    updateAudioState();
  } catch {
    playText.textContent = "再试";
  }
});

audio.addEventListener("loadedmetadata", () => {
  durationTimeEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  currentTimeEl.textContent = formatTime(audio.currentTime);
  const ratio = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressFill.style.width = `${ratio}%`;
});

audio.addEventListener("play", updateAudioState);
audio.addEventListener("pause", updateAudioState);
audio.addEventListener("ended", updateAudioState);

function userNotes() {
  return readJson(wishKey, []);
}

function favorites() {
  return readJson(favoriteKey, []);
}

function saveUserNotes(notes) {
  writeJson(wishKey, notes);
}

function saveFavorites(ids) {
  writeJson(favoriteKey, ids);
}

function createWish(text, source = "delivery") {
  return {
    id: `wish-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: text.trim(),
    source,
    createdAt: new Date().toISOString(),
  };
}

function addWish(text, source) {
  if (!text.trim()) return;
  const notes = [createWish(text, source), ...userNotes()].slice(0, 36);
  saveUserNotes(notes);
  renderAll();
}

function deliveryPosition(index) {
  const positions = [
    ["2%", "10%", "-7deg"],
    ["24%", "38%", "5deg"],
    ["48%", "16%", "-3deg"],
    ["70%", "42%", "8deg"],
    ["13%", "66%", "4deg"],
    ["57%", "70%", "-6deg"],
  ];
  return positions[index % positions.length];
}

function renderDeliveryNotes(notes) {
  deliveryNotes.innerHTML = "";
  const visible = notes.slice(0, 6);
  visible.forEach((note, index) => {
    const item = document.createElement("article");
    item.className = "note";
    item.textContent = note.text;
    const [left, top, rotate] = deliveryPosition(index);
    item.style.left = left;
    item.style.top = top;
    item.style.rotate = rotate;
    item.style.animationDelay = `${index * -0.65}s`;
    deliveryNotes.append(item);
  });
}

function allWallNotes(notes) {
  const starter = defaultWishes.map((text, index) => ({
    id: `default-${index}`,
    text,
    source: "default",
  }));
  return [...notes, ...starter].slice(0, 24);
}

function renderWall(notes) {
  const favoriteIds = favorites();
  wishWall.innerHTML = "";
  allWallNotes(notes).forEach((note, index) => {
    const item = document.createElement("article");
    item.className = "wall-note";
    item.style.setProperty("--tilt", `${((index % 5) - 2) * 1.6}deg`);
    item.classList.toggle("is-favorite", favoriteIds.includes(note.id));
    item.tabIndex = 0;

    const text = document.createElement("span");
    text.textContent = note.text;

    const heart = document.createElement("button");
    heart.type = "button";
    heart.setAttribute("aria-label", "收藏这张心愿便利贴");
    heart.textContent = favoriteIds.includes(note.id) ? "♥" : "♡";

    const toggle = () => toggleFavorite(note.id);
    heart.addEventListener("click", toggle);
    item.addEventListener("dblclick", toggle);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter") toggle();
    });

    item.append(text, heart);
    wishWall.append(item);
  });
}

function renderMemory(notes) {
  const favoriteIds = favorites();
  const favoriteNotes = allWallNotes(notes).filter((note) => favoriteIds.includes(note.id)).slice(0, 5);
  const items = favoriteNotes.length
    ? favoriteNotes
    : [
        { text: "还没有收藏的心愿，双击心愿墙上的便利贴试试看。" },
        { text: "音乐响起时，今天就是值得保存的一页。" },
      ];

  memoryList.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "memory-item";
    row.textContent = item.text;
    memoryList.append(row);
  });
}

function toggleFavorite(id) {
  const current = favorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current].slice(0, 16);
  saveFavorites(next);
  renderAll();
  sparkleAt(window.innerWidth * 0.5, window.innerHeight * 0.35, 10);
}

function renderAll() {
  const notes = userNotes();
  renderDeliveryNotes(notes.length ? notes : defaultWishes.slice(0, 6).map((text, index) => ({ id: `preview-${index}`, text })));
  renderWall(notes);
  renderMemory(notes);
}

deliveryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addWish(deliveryInput.value, "delivery");
  deliveryInput.value = "";
  sparkleAt(window.innerWidth * 0.5, window.innerHeight * 0.55, 12);
});

wallForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addWish(wallInput.value, "wall");
  wallInput.value = "";
  document.querySelector("#wall").scrollIntoView({ behavior: "smooth" });
});

replayButton.addEventListener("click", () => {
  document.querySelector("#cover").scrollIntoView({ behavior: "smooth" });
  sparkleAt(window.innerWidth * 0.5, window.innerHeight * 0.48, 18);
});

wandButton.addEventListener("click", () => igniteWand());

function igniteWand() {
  const rect = wandButton.getBoundingClientRect();
  const sparkRect = wandButton.querySelector(".wand-spark").getBoundingClientRect();
  const tipX = sparkRect.left + sparkRect.width * 0.5;
  const tipY = sparkRect.top + sparkRect.height * 0.5;

  wandButton.classList.add("is-lit");
  starryScene.classList.add("is-lit");
  wandButton.setAttribute("aria-pressed", "true");
  meteorBoostUntil = Date.now() + 3800;
  sparkleAt(tipX, tipY, 16);
  launchWandParticles(tipX, tipY);
  launchFireworks();

  clearTimeout(igniteWand.timer);
  igniteWand.timer = setTimeout(() => {
    wandButton.classList.remove("is-lit");
    starryScene.classList.remove("is-lit");
    wandButton.setAttribute("aria-pressed", "false");
  }, 3600);
}

function launchWandParticles(tipX, tipY) {
  const sceneRect = starryScene.getBoundingClientRect();
  for (let i = 0; i < 58; i += 1) {
    const particle = document.createElement("span");
    const angle = -Math.PI * 0.9 + Math.random() * Math.PI * 1.55;
    const distance = 70 + Math.random() * 190;
    const drift = Math.random() * 70;
    const size = 4 + Math.random() * 8;

    particle.className = "wand-particle";
    particle.style.left = `${tipX - sceneRect.left}px`;
    particle.style.top = `${tipY - sceneRect.top}px`;
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--hue", `${42 + Math.random() * 170}`);
    particle.style.setProperty("--life", `${900 + Math.random() * 1050}ms`);
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance + drift}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance + Math.random() * 110}px`);
    particle.style.animationDelay = `${Math.random() * 180}ms`;
    starryScene.append(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

function launchFireworks() {
  const positions = [
    [0.74, 0.18],
    [0.46, 0.28],
    [0.82, 0.42],
    [0.34, 0.53],
    [0.62, 0.64],
  ];

  positions.forEach(([x, y], index) => {
    setTimeout(() => createFirework(x, y, index), index * 330);
  });
}

function createFirework(xRatio, yRatio, index) {
  const burst = document.createElement("span");
  burst.className = "firework-burst";
  burst.style.left = `${xRatio * 100}%`;
  burst.style.top = `${yRatio * 100}%`;

  const sparkCount = 22 + index * 2;
  for (let i = 0; i < sparkCount; i += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.18;
    const distance = 44 + Math.random() * 82 + index * 7;
    const hueOptions = [8, 42, 56, 138, 190, 226, 286, 332];

    spark.className = "firework-spark";
    spark.style.setProperty("--size", `${2 + Math.random() * 2}px`);
    spark.style.setProperty("--length", `${14 + Math.random() * 18}px`);
    spark.style.setProperty("--hue", `${hueOptions[(i + index) % hueOptions.length]}`);
    spark.style.setProperty("--life", `${780 + Math.random() * 620}ms`);
    spark.style.setProperty("--angle", `${angle + Math.PI / 2}rad`);
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance + 22}px`);
    burst.append(spark);
  }

  starryScene.append(burst);
  setTimeout(() => burst.remove(), 1800);
}

function sparkleAt(x, y, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 35 + Math.random() * 75;
    dot.className = "sparkle";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    dot.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    document.body.append(dot);
    dot.addEventListener("animationend", () => dot.remove());
  }
}

let lastSparkle = 0;
window.addEventListener("pointermove", (event) => {
  const now = Date.now();
  if (now - lastSparkle > 260 && event.pointerType !== "touch") {
    lastSparkle = now;
    sparkleAt(event.clientX, event.clientY, 1);
  }
});

function setupMeteorCanvas() {
  const canvas = document.querySelector("#meteorCanvas");
  const ctx = canvas.getContext("2d");
  const state = {
    width: 0,
    height: 0,
    stars: [],
    meteors: [],
  };

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = state.width * ratio;
    canvas.height = state.height * ratio;
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    state.stars = Array.from({ length: Math.min(150, Math.floor(state.width / 7)) }, () => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      radius: Math.random() * 1.45 + 0.35,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.012 + 0.004,
    }));
  }

  function spawnMeteor() {
    state.meteors.push({
      x: state.width * (0.72 + Math.random() * 0.38),
      y: state.height * (0.05 + Math.random() * 0.42),
      length: 120 + Math.random() * 150,
      speed: 8 + Math.random() * 5,
      alpha: 0.95,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);

    state.stars.forEach((star) => {
      star.alpha += star.speed * (Math.random() > 0.5 ? 1 : -1);
      star.alpha = Math.max(0.18, Math.min(1, star.alpha));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 248, 255, ${star.alpha})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    const boosted = Date.now() < meteorBoostUntil;
    const meteorChance = boosted ? 0.12 : 0.035;
    if (Math.random() < meteorChance) spawnMeteor();

    state.meteors.forEach((meteor) => {
      const gradient = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x + meteor.length, meteor.y - meteor.length * 0.45);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.alpha})`);
      gradient.addColorStop(0.45, `rgba(255, 143, 180, ${meteor.alpha * 0.72})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(meteor.x + meteor.length, meteor.y - meteor.length * 0.45);
      ctx.stroke();
      meteor.x -= meteor.speed;
      meteor.y += meteor.speed * 0.36;
      meteor.alpha -= 0.012;
    });

    state.meteors = state.meteors.filter((meteor) => meteor.alpha > 0 && meteor.x > -meteor.length && meteor.y < state.height + meteor.length);
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}

setupMeteorCanvas();
renderAll();
