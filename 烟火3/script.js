const audio = document.querySelector("#song");
const playButtons = document.querySelectorAll("[data-play]");
const playerToggle = document.querySelector(".player-toggle");
const progress = document.querySelector("#progress");
const volume = document.querySelector("#volume");
const muteToggle = document.querySelector(".mute-toggle");
const timeLabel = document.querySelector("#time-label");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const messageList = document.querySelector("#message-list");
const shareButton = document.querySelector("#share-button");
const toast = document.querySelector("#toast");

let toastTimer;
let isSeeking = false;
let fireworkAudioContext;

function installEdgeFlowBorders() {
  const selectors = [
    ".media-tile",
    ".visual-card",
    ".album-photo",
    ".polaroid",
    ".season-panel",
    "blockquote",
    ".message-panel",
    ".music-actions",
    ".message-row button",
    ".music-actions button",
    ".music-actions a",
    "#message-list li",
    ".platforms span",
    ".player",
    ".primary-play"
  ];

  document.querySelectorAll(selectors.join(", ")).forEach((target, index) => {
    if (target.querySelector(":scope > .edge-flow-border")) return;
    target.classList.add("edge-flow-host");
    const border = document.createElement("span");
    border.className = "edge-flow-border";
    border.style.animationDelay = `${-(index % 10) * 0.17}s`;
    target.appendChild(border);
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function updatePlayState() {
  const symbol = audio.paused ? "▶" : "❚❚";
  playButtons.forEach((button) => {
    const symbolNode = button.querySelector(".play-symbol");
    if (symbolNode) {
      symbolNode.textContent = symbol;
    } else {
      button.textContent = symbol;
    }
  });
  if (playerToggle) playerToggle.textContent = symbol;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

async function togglePlay() {
  try {
    if (audio.paused) {
      await audio.play();
      showToast("烟火已经点亮，音乐开始了。");
    } else {
      audio.pause();
      showToast("音乐已暂停，烟火还在心里。");
    }
  } catch (error) {
    showToast("浏览器需要你再次点击后才能播放音乐。");
  }
  updatePlayState();
}

function syncTime() {
  if (!isSeeking && audio.duration) {
    progress.value = String((audio.currentTime / audio.duration) * 100);
  }
  timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
}

function createSpark(x, y) {
  const spark = document.createElement("span");
  spark.className = "spark";
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;
  document.body.appendChild(spark);
  window.setTimeout(() => spark.remove(), 820);
}

function getFireworkAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!fireworkAudioContext) fireworkAudioContext = new AudioContextClass();
  if (fireworkAudioContext.state === "suspended") fireworkAudioContext.resume();
  return fireworkAudioContext;
}

function playFireworkBoom() {
  const context = getFireworkAudioContext();
  if (!context) return;

  const now = context.currentTime;
  const duration = 0.62;
  const noiseBuffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + duration);

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.58, now + 0.018);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const boom = context.createOscillator();
  boom.type = "sine";
  boom.frequency.setValueAtTime(92, now);
  boom.frequency.exponentialRampToValueAtTime(38, now + 0.28);
  const boomGain = context.createGain();
  boomGain.gain.setValueAtTime(0.0001, now);
  boomGain.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
  boomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  noise.connect(filter).connect(noiseGain).connect(context.destination);
  boom.connect(boomGain).connect(context.destination);
  noise.start(now);
  noise.stop(now + duration);
  boom.start(now);
  boom.stop(now + 0.44);
}

function createFireworkBurst(x, y) {
  const burst = document.createElement("span");
  burst.className = "click-firework";
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;

  const particleCount = 34;
  const baseHue = Math.floor(Math.random() * 360);
  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement("i");
    const angle = (360 / particleCount) * i + Math.random() * 10;
    const distance = 4.2 + Math.random() * 4.8;
    particle.style.setProperty("--angle", `${angle}deg`);
    particle.style.setProperty("--distance", `${distance}rem`);
    particle.style.setProperty("--hue", `${(baseHue + i * 13) % 360}`);
    particle.style.setProperty("--delay", `${Math.random() * 80}ms`);
    burst.appendChild(particle);
  }

  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1300);
}

function createClickFireworks(x, y) {
  createFireworkBurst(x, y);
  window.setTimeout(() => createFireworkBurst(x + 54, y - 36), 120);
  window.setTimeout(() => createFireworkBurst(x - 46, y + 42), 210);
}

playButtons.forEach((button) => button.addEventListener("click", togglePlay));

audio.addEventListener("play", updatePlayState);
audio.addEventListener("pause", updatePlayState);
audio.addEventListener("loadedmetadata", syncTime);
audio.addEventListener("timeupdate", syncTime);
audio.addEventListener("ended", updatePlayState);

progress.addEventListener("input", () => {
  isSeeking = true;
  if (audio.duration) {
    timeLabel.textContent = `${formatTime((Number(progress.value) / 100) * audio.duration)} / ${formatTime(audio.duration)}`;
  }
});

progress.addEventListener("change", () => {
  if (audio.duration) {
    audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  }
  isSeeking = false;
});

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value);
  audio.muted = audio.volume === 0;
  muteToggle.textContent = audio.muted ? "×" : "♪";
});

muteToggle.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteToggle.textContent = audio.muted ? "×" : "♪";
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (target.closest("button, a, input, .player, .message-panel")) return;
  if (target.closest("#scene-1, #scene-5")) {
    createClickFireworks(event.clientX, event.clientY);
    playFireworkBoom();
  }
  createSpark(event.clientX, event.clientY);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) {
    showToast("先写下一句心愿，再点亮它。");
    return;
  }

  const item = document.createElement("li");
  item.textContent = text;
  messageList.prepend(item);
  installEdgeFlowBorders();
  messageInput.value = "";
  showToast("你的心愿烟火已经升空。");
});

shareButton.addEventListener("click", async () => {
  const text = "我在听《心似烟火》：我们的心像烟火，一朵连结着一朵。";
  try {
    await navigator.clipboard.writeText(text);
    showToast("分享文案已复制。");
  } catch (error) {
    showToast(text);
  }
});

audio.volume = Number(volume.value);
installEdgeFlowBorders();
syncTime();
updatePlayState();
