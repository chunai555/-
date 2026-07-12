const audio = document.querySelector("#loveSong");
const ambientVideo = document.querySelector(".ambient-video");
const playGate = document.querySelector("#playGate");
const playToggle = document.querySelector("#playToggle");
const progressBar = document.querySelector("#progressBar");
const nowLyric = document.querySelector("#nowLyric");
const toast = document.querySelector("#toast");
const gesturePad = document.querySelector("#gesturePad");
const gestureText = document.querySelector("#gestureText");
const fateValue = document.querySelector("#fateValue");
const fateBar = document.querySelector("#fateBar");
const resetFate = document.querySelector("#resetFate");
const weatherCanvas = document.querySelector("#weatherCanvas");
const weatherCtx = weatherCanvas.getContext("2d");
const profileCanvas = document.querySelector("#profileCanvas");
const profileCtx = profileCanvas.getContext("2d");
const loveWords = document.querySelector("#loveWords");
const makeRipple = document.querySelector("#makeRipple");
const chorusBoost = document.querySelector("#chorusBoost");
const wishlist = document.querySelector("#wishlist");
const screenThree = document.querySelector("#screenThree");
const promiseButton = document.querySelector("#promiseButton");
const promiseText = document.querySelector("#promiseText");
const vowShape = document.querySelector("#vowShape");
const declareButton = document.querySelector("#declareButton");
const yourName = document.querySelector("#yourName");
const theirName = document.querySelector("#theirName");
const cardText = document.querySelector("#cardText");
const certificateNo = document.querySelector("#certificateNo");
const sealButton = document.querySelector("#sealButton");
const replayButton = document.querySelector("#replayButton");
const resetButton = document.querySelector("#resetButton");
const dots = [...document.querySelectorAll(".dots a")];
const screens = [...document.querySelectorAll(".screen")];

const soundLines = [
  "\u6c99\u6c99\u96e8\u58f0\u3001\u6797\u95f4\u9e1f\u9e23\uff0c\u7b49\u4e00\u6b21\u76ee\u5149\u76f8\u9047\u3002",
  "\u96e8\u843d\u5728\u9999\u6a1f\u53f6\u80cc\u9762\uff0c\u50cf\u5f88\u8f7b\u7684\u5fc3\u8df3\u3002",
  "\u5929\u6865\u8f6c\u89d2\u8d8a\u6765\u8d8a\u8fd1\uff0c\u7f18\u5206\u6b63\u5728\u7d2f\u79ef\u3002",
  "\u4f60\u5199\u4e0b\u7684\u60c5\u8bdd\uff0c\u6b63\u5728\u53d8\u6210\u4fa7\u8138\u8f6e\u5ed3\u3002",
  "\u4e3b\u6b4c\u6d8c\u8d77\uff0c\u7f51\u7ad9\u7684\u547c\u5438\u5f00\u59cb\u8ddf\u7740\u5fc3\u52a8\u660e\u6697\u4ea4\u66ff\u3002",
  "\u5929\u7a7a\u90fd\u53d8\u900f\u660e\uff0c\u542c\u5230\u4f60\u7684\u4eb2\u53e3\u5141\u8bb8\u3002",
  "\u5bf9\u5168\u4e16\u754c\u5ba3\u5e03\u7231\u4f60\uff0c\u6211\u53ea\u60f3\u548c\u4f60\u5728\u4e00\u8d77\u3002",
  "\u5929\u5d29\u5730\u88c2\u4e5f\u8981\u5728\u4e00\u8d77\uff0c\u5fc3\u8df3\u66ff\u6211\u62b5\u8fbe\u4f60\u3002"
];

const lyricTimeline = [
  { time: 0, text: soundLines[0], screen: 0 },
  { time: 18, text: soundLines[3], screen: 1 },
  { time: 42, text: soundLines[5], screen: 2 },
  { time: 66, text: soundLines[6], screen: 3 },
  { time: 94, text: soundLines[7], screen: 4 }
];

let fate = 0;
let touching = false;
let lastTrailAt = 0;
let toastTimer = 0;
let audioContext;
let rainNode;
let rainGain;
let ambienceTimer = 0;
let weatherParticles = [];
let profileParticles = [];
let width = 0;
let height = 0;
let dpr = 1;
let activeScreen = 0;
let profileRotation = 0;
let promiseTimer = 0;
let promiseBeatTimer = 0;
let promisePointerId = null;
let promiseStartedAt = 0;
let profileFocus = { x: window.innerWidth * 0.62, y: window.innerHeight * 0.42, pulse: 0 };
let speechRecognition = null;
let speechActive = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}

function setFate(value) {
  const previous = fate;
  fate = Math.max(0, Math.min(100, value));
  fateValue.textContent = `${Math.round(fate)}%`;
  fateBar.style.width = `${fate}%`;
  document.body.classList.toggle("fate-near", fate >= 34);
  document.body.classList.toggle("fate-met", fate >= 88);
  gestureText.textContent = fate >= 88
    ? "\u64e6\u80a9\u5b8c\u6210\uff0c\u5fc3\u52a8\u5df2\u62b5\u8fbe"
    : "\u7ee7\u7eed\u6309\u4f4f\u6216\u6ed1\u52a8";
  nowLyric.textContent = soundLines[Math.min(3, Math.floor(fate / 28))];
  if (previous < 34 && fate >= 34) {
    showToast("\u9999\u6a1f\u6811\u5f71\u91cc\uff0c\u7f18\u5206\u5f00\u59cb\u9760\u8fd1\u3002");
    heartThump(0.06);
  }
  if (previous < 88 && fate >= 88) {
    nowLyric.textContent = "\u64e6\u80a9\u5b8c\u6210\uff0c\u5168\u4e16\u754c\u90fd\u542c\u89c1\u6211\u7231\u4f60\u3002";
  }
}

function addFate(amount) {
  const before = fate;
  setFate(fate + amount);
  if (before < 88 && fate >= 88) {
    pluck(720, 0.18);
    setTimeout(() => pluck(960, 0.12), 120);
    heartThump(0.1);
    showToast("\u7f18\u5206\u5df2\u7ecf\u64e6\u80a9\u800c\u8fc7\u3002");
  }
}

function pointerPoint(event) {
  return { x: event.clientX, y: event.clientY };
}

function makeFloat(x, y, text, className) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = text;
  node.style.fontSize = `${17 + Math.random() * 17}px`;
  document.body.appendChild(node);
  const rect = node.getBoundingClientRect();
  const isFallTrail = className.includes("fall-trail");
  const padding = isFallTrail ? 28 : 18;
  const bottomLift = isFallTrail ? rect.height * 1.45 : rect.height / 2;
  const safeX = Math.min(
    window.innerWidth - rect.width * 0.75 - padding,
    Math.max(rect.width * 0.75 + padding, x)
  );
  const safeY = Math.min(
    window.innerHeight - bottomLift - padding,
    Math.max(rect.height * 2.15 + padding, y)
  );
  node.style.left = `${safeX}px`;
  node.style.top = `${safeY}px`;
  node.addEventListener("animationend", () => node.remove());
}

function handleTrace(event) {
  const now = performance.now();
  if (now - lastTrailAt < 70) return;
  lastTrailAt = now;
  const { x, y } = pointerPoint(event);
  if (activeScreen === 1) {
    profileFocus = { x, y, pulse: 1 };
    makeFloat(x, y, "\u53ea\u559c\u6b22\u4f60", "fall-trail");
    createRipple(x, y, event.buttons ? 0.68 : 0.42);
    warmPluck();
  } else if (activeScreen === 2) {
    createRipple(x, y, 0.42);
    heartThump(0.025);
  } else {
    makeFloat(x, y, fate >= 88 ? "\u5168\u4e16\u754c\u5ba3\u5e03\u6211\u7231\u4f60" : "\u2661", "trail-heart");
    addFate(touching ? 2.4 : 1.2);
    pluck(420 + fate * 5, 0.055);
  }
}

function beginGesture(event) {
  touching = true;
  document.body.classList.add("is-touching");
  gesturePad.setPointerCapture?.(event.pointerId);
  handleTrace(event);
}

function endGesture() {
  touching = false;
  document.body.classList.remove("is-touching");
  if (fate < 88) gestureText.textContent = "\u6309\u4f4f\u9f20\u6807\u6216\u957f\u6309\u5c4f\u5e55";
}

gesturePad.addEventListener("pointerdown", beginGesture);
gesturePad.addEventListener("pointermove", event => {
  if (touching) handleTrace(event);
});
gesturePad.addEventListener("pointerup", endGesture);
gesturePad.addEventListener("pointercancel", endGesture);
gesturePad.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addFate(12);
    const rect = gesturePad.getBoundingClientRect();
    makeFloat(rect.left + rect.width / 2, rect.top + rect.height / 2, "\u2661", "trail-heart");
  }
});

document.addEventListener("pointermove", event => {
  const tracingFall = activeScreen === 1 && event.pointerType === "mouse";
  if (!event.target.closest("button, input") && (event.buttons === 1 || tracingFall)) {
    handleTrace(event);
  }
});

document.addEventListener("click", event => {
  if (activeScreen === 1 && !event.target.closest("button, input")) {
    primeSecondScreenAudio();
    createRipple(event.clientX, event.clientY, 1);
    profileFocus = { x: event.clientX, y: event.clientY, pulse: 1.5 };
    showToast("\u4e00\u5708\u6d6a\u6f2b\u6d9f\u6f2a\u5df2\u6563\u5f00\u3002");
  }
});

resetFate.addEventListener("click", () => {
  setFate(0);
  showToast("\u96e8\u58f0\u56de\u5230\u8d77\u70b9\uff0c\u518d\u7b49\u4e00\u6b21\u76f8\u9047\u3002");
});

function createRipple(x, y, scale = 1, extraClass = "") {
  const ripple = document.createElement("span");
  ripple.className = extraClass ? `ripple ${extraClass}` : "ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${18 * scale}px`;
  ripple.style.height = `${18 * scale}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

async function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    createRainBed();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}

function primeSecondScreenAudio() {
  if (audioContext || activeScreen !== 1) return;
  try {
    startSound().catch(() => {});
  } catch (error) {
    ensureAudioContext().catch(() => {});
  }
}

function createRainBed() {
  const bufferSize = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.42;
  }

  rainNode = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  rainGain = audioContext.createGain();
  rainNode.buffer = buffer;
  rainNode.loop = true;
  filter.type = "highpass";
  filter.frequency.value = 900;
  rainGain.gain.value = 0.018;
  rainNode.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(audioContext.destination);
  rainNode.start();
}

function pluck(frequency = 520, volume = 0.08) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.42);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + 0.44);
}

function warmPluck() {
  pluck(560 + Math.random() * 220, 0.035);
}

function heartThump(volume = 0.08) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  osc.type = "sine";
  osc.frequency.setValueAtTime(74, now);
  osc.frequency.exponentialRampToValueAtTime(47, now + 0.16);
  filter.type = "lowpass";
  filter.frequency.value = 180;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + 0.22);

  setTimeout(() => {
    if (!audioContext) return;
    const second = audioContext.createOscillator();
    const secondGain = audioContext.createGain();
    second.type = "sine";
    second.frequency.setValueAtTime(62, audioContext.currentTime);
    secondGain.gain.setValueAtTime(volume * 0.68, audioContext.currentTime);
    secondGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    second.connect(secondGain);
    secondGain.connect(audioContext.destination);
    second.start();
    second.stop(audioContext.currentTime + 0.18);
  }, 170);
}

function promiseChord() {
  [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
    setTimeout(() => pluck(frequency, 0.075 - index * 0.008), index * 82);
  });
}

function burstPromiseSky(x = window.innerWidth / 2, y = window.innerHeight * 0.5) {
  document.body.classList.remove("promise-bursting");
  void document.body.offsetWidth;
  document.body.classList.add("promise-bursting");
  createRipple(x, y, 3.8);
  setTimeout(() => document.body.classList.remove("promise-bursting"), 2100);
}

function startPromiseSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || speechActive || document.body.classList.contains("promised")) return;
  try {
    speechRecognition = speechRecognition || new SpeechRecognition();
    speechRecognition.lang = "zh-CN";
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.onsoundstart = () => {
      const rect = promiseButton.getBoundingClientRect();
      acceptPromise(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };
    speechRecognition.onresult = () => {
      const rect = promiseButton.getBoundingClientRect();
      acceptPromise(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };
    speechRecognition.onend = () => { speechActive = false; };
    speechRecognition.onerror = () => { speechActive = false; };
    speechActive = true;
    speechRecognition.start();
    promiseText.textContent = "\u9ea6\u514b\u98ce\u6b63\u5728\u542c\uff0c\u8bf4\u51fa\u90a3\u4e00\u53e5\u5141\u8bb8\u3002";
  } catch (error) {
    speechActive = false;
  }
}

function clearPromiseListen() {
  clearTimeout(promiseTimer);
  clearInterval(promiseBeatTimer);
  promiseTimer = 0;
  promiseBeatTimer = 0;
  document.body.classList.remove("promise-listening");
  if (speechActive && speechRecognition) {
    try { speechRecognition.stop(); } catch (error) {}
    speechActive = false;
  }
}

function acceptPromise(x = window.innerWidth / 2, y = window.innerHeight * 0.52) {
  clearPromiseListen();
  document.body.classList.add("promised");
  promiseText.textContent = "\u6211\u613f\u610f\u3002\u4e8e\u662f\u5929\u7a7a\u90fd\u4eae\u4e86\u3002";
  nowLyric.textContent = soundLines[5];
  showToast("\u542c\u89c1\u4e86\uff0c\u4f60\u7684\u4eb2\u53e3\u5141\u8bb8\u843d\u5728\u5929\u7a7a\u91cc\u3002");
  burstPromiseSky(x, y);
  heartThump(0.13);
  promiseChord();
}

async function beginPromiseListen(event) {
  if (document.body.classList.contains("promised")) {
    acceptPromise(event?.clientX, event?.clientY);
    return;
  }
  await ensureAudioContext();
  clearPromiseListen();
  promiseStartedAt = performance.now();
  promisePointerId = event?.pointerId ?? null;
  document.body.classList.add("promise-listening");
  promiseText.textContent = "\u5929\u7a7a\u6b63\u5728\u542c\u3002";
  nowLyric.textContent = soundLines[5];
  startPromiseSpeech();
  heartThump(0.09);
  promiseBeatTimer = setInterval(() => heartThump(0.07), 780);
  promiseTimer = setTimeout(() => {
    const rect = vowShape.getBoundingClientRect();
    acceptPromise(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, 3000);
}

function endPromiseListen(event) {
  if (!document.body.classList.contains("promise-listening")) return;
  const heldLongEnough = performance.now() - promiseStartedAt > 980;
  const isSamePointer = promisePointerId === null || promisePointerId === event?.pointerId;
  if (heldLongEnough && isSamePointer) {
    acceptPromise(event?.clientX, event?.clientY);
    return;
  }
  clearPromiseListen();
  promiseText.textContent = "\u5929\u7a7a\u8fd8\u5728\u7b49\u90a3\u4e00\u53e5\u5141\u8bb8\u3002";
  heartThump(0.035);
}

function birdCall() {
  if (!audioContext) return;
  const base = 980 + Math.random() * 260;
  pluck(base, 0.035);
  setTimeout(() => pluck(base * 1.24, 0.025), 120);
}

function scheduleAmbience() {
  clearInterval(ambienceTimer);
  ambienceTimer = setInterval(() => {
    if (!audio.paused) {
      activeScreen === 1 ? warmPluck() : birdCall();
    }
  }, 2200 + Math.random() * 1400);
}

async function startSound() {
  try {
    await ensureAudioContext();
    await audio.play();
    ambientVideo?.play().catch(() => {});
    document.body.classList.add("is-playing");
    playToggle.textContent = "\u2161";
    showToast("\u58f0\u573a\u5df2\u5f00\u542f\u3002");
    pluck(540, 0.1);
    scheduleAmbience();
  } catch (error) {
    showToast("\u8bf7\u518d\u70b9\u4e00\u6b21\u64ad\u653e\uff0c\u6d4f\u89c8\u5668\u9700\u8981\u4f60\u7684\u624b\u52bf\u6765\u5f00\u542f\u58f0\u97f3\u3002");
  }
}

function pauseSound() {
  audio.pause();
  document.body.classList.remove("is-playing");
  playToggle.textContent = "\u25b6";
  clearInterval(ambienceTimer);
}

playGate.addEventListener("click", startSound);
playToggle.addEventListener("click", () => {
  audio.paused ? startSound() : pauseSound();
});

audio.addEventListener("timeupdate", () => {
  const duration = audio.duration || 1;
  progressBar.style.width = `${Math.min(100, (audio.currentTime / duration) * 100)}%`;
  const current = lyricTimeline.reduce((latest, item) => {
    return audio.currentTime >= item.time ? item : latest;
  }, lyricTimeline[0]);
  nowLyric.textContent = current.text;
});

audio.addEventListener("ended", () => {
  pauseSound();
  setFate(100);
  screens[4]?.scrollIntoView({ behavior: "smooth", block: "start" });
});

makeRipple.addEventListener("click", event => {
  const button = event.currentTarget;
  primeSecondScreenAudio();
  const rect = button.getBoundingClientRect();
  createRipple(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.3);
  document.body.classList.add("fall-chorus");
  button.classList.add("is-wishing");
  setTimeout(() => button.classList.remove("is-wishing"), 650);
  nowLyric.textContent = "\u6d6a\u6f2b\u544a\u767d\u5df2\u4ece\u8f6e\u5ed3\u4e2d\u6d6e\u73b0\u3002";
  showToast("\u8f6e\u5ed3\u91cc\u7684\u60c5\u8bdd\u88ab\u70b9\u4eae\u4e86\u3002");
  pluck(660, 0.15);
  setTimeout(() => pluck(880, 0.1), 140);
});

chorusBoost.addEventListener("click", () => {
  primeSecondScreenAudio();
  document.body.classList.toggle("fall-chorus");
  nowLyric.textContent = soundLines[4];
  showToast("\u547c\u5438\u706f\u6b63\u8ddf\u7740 BPM \u660e\u6697\u4ea4\u66ff\u3002");
  if (audioContext && rainGain) {
    rainGain.gain.setTargetAtTime(document.body.classList.contains("fall-chorus") ? 0.032 : 0.018, audioContext.currentTime, 0.2);
  }
});

wishlist.addEventListener("click", event => {
  const button = event.currentTarget;
  primeSecondScreenAudio();
  const wishes = [
    "\u4e00\u8d77\u770b\u6d77",
    "\u4e00\u8d77\u6563\u6b65",
    "\u4e00\u8d77\u5192\u9669",
    "\u4e00\u8d77\u628a\u4eca\u5929\u6536\u85cf"
  ];
  const rect = button.getBoundingClientRect();
  button.classList.add("is-wishing");
  setTimeout(() => button.classList.remove("is-wishing"), 720);
  const x = rect.left + rect.width / 2;
  const y = rect.top + 8;
  makeFloat(x, y, wishes[Math.floor(Math.random() * wishes.length)], "wish-note");
  createRipple(x, y + rect.height / 2, 1.15);
  profileFocus = { x, y, pulse: 1.3 };
  showToast("\u5fc3\u613f\u5df2\u6536\u8fdb\u53f3\u4e0b\u89d2\u3002");
  warmPluck();
});

promiseButton.addEventListener("pointerdown", event => {
  event.currentTarget.setPointerCapture?.(event.pointerId);
  beginPromiseListen(event);
});

promiseButton.addEventListener("pointerup", endPromiseListen);
promiseButton.addEventListener("pointercancel", endPromiseListen);

promiseButton.addEventListener("click", event => {
  if (!document.body.classList.contains("promised")) {
    acceptPromise(event.clientX, event.clientY);
  }
});

promiseButton.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    acceptPromise(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
});

screenThree.addEventListener("pointerdown", event => {
  if (event.target.closest("button, input")) return;
  beginPromiseListen(event);
});

screenThree.addEventListener("pointerup", event => {
  if (event.target.closest("button, input")) return;
  endPromiseListen(event);
});

screenThree.addEventListener("pointercancel", endPromiseListen);

screenThree.addEventListener("dblclick", event => {
  if (event.target.closest("button, input")) return;
  acceptPromise(event.clientX, event.clientY);
});

declareButton.addEventListener("click", () => {
  const notes = [
    "\u6211\u7231\u4f60",
    "\u53ea\u60f3\u548c\u4f60\u5728\u4e00\u8d77",
    "\u5168\u4e16\u754c\u90fd\u542c\u89c1",
    "\u5fc3\u8df3\u4f5c\u8bc1",
    "\u6765\u81ea\u5730\u7403\u7684\u544a\u767d",
    "\u6211\u53ea\u60f3\u548c\u4f60\u5728\u4e00\u8d77"
  ];
  document.body.classList.add("declare-burst");
  nowLyric.textContent = "\u5bf9\u5168\u4e16\u754c\u5ba3\u5e03\u7231\u4f60\uff0c\u6211\u53ea\u60f3\u548c\u4f60\u5728\u4e00\u8d77\u3002";
  for (let i = 0; i < 20; i += 1) {
    setTimeout(() => {
      const fromRight = i % 2 === 0;
      makeFloat(
        fromRight ? window.innerWidth * (0.62 + Math.random() * 0.32) : window.innerWidth * (0.08 + Math.random() * 0.34),
        window.innerHeight * (0.18 + Math.random() * 0.56),
        notes[Math.floor(Math.random() * notes.length)],
        "declare-note"
      );
      createRipple(window.innerWidth / 2, window.innerHeight * 0.52, 0.38 + Math.random() * 0.58, "declare-ripple");
      pluck(520 + Math.random() * 460, 0.045);
    }, i * 70);
  }
  setTimeout(() => document.body.classList.remove("declare-burst"), 2400);
  showToast("\u544a\u767d\u5df2\u53d1\u9001\u7ed9\u5168\u4e16\u754c\u3002");
});

function updateCard() {
  const from = yourName.value.trim() || "\u6211";
  const to = theirName.value.trim() || "\u4f60";
  cardText.textContent = `${from}\u7231${to}`;
  const seed = `${from}${to}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 520);
  certificateNo.textContent = `\u7b2c ${5200000 + seed} \u53f7\u6c38\u6052\u89c1\u8bc1`;
  document.body.classList.remove("final-sealed");
}

yourName.addEventListener("input", updateCard);
theirName.addEventListener("input", updateCard);

resetButton.addEventListener("click", () => {
  yourName.value = "";
  theirName.value = "";
  updateCard();
  showToast("\u540d\u5b57\u5df2\u91cd\u7f6e\u3002");
});

sealButton.addEventListener("click", () => {
  const from = yourName.value.trim() || "\u6211";
  const to = theirName.value.trim() || "\u4f60";
  document.body.classList.add("final-sealed");
  nowLyric.textContent = "\u5929\u5d29\u5730\u88c2\uff0c\u6211\u4eec\u4f9d\u7136\u5728\u4e00\u8d77\u3002";
  showToast("\u6c38\u6052\u89c1\u8bc1\u5df2\u751f\u6210\u3002");
  for (let i = 0; i < 10; i += 1) {
    setTimeout(() => {
      makeFloat(
        window.innerWidth * (0.18 + Math.random() * 0.64),
        window.innerHeight * (0.28 + Math.random() * 0.42),
        i % 2 ? `${from}\u7231${to}` : "\u5929\u5d29\u5730\u88c2\u4e5f\u8981\u5728\u4e00\u8d77",
        "wish-note"
      );
      pluck(620 + i * 36, 0.04);
    }, i * 90);
  }
  promiseChord();
});

replayButton.addEventListener("click", () => {
  audio.currentTime = 0;
  screens[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
  startSound();
});

loveWords.addEventListener("input", buildProfileParticles);

const observer = new IntersectionObserver(entries => {
  const visible = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  activeScreen = screens.indexOf(visible.target);
  dots.forEach((dot, index) => dot.classList.toggle("is-active", index === activeScreen));
  if (activeScreen === 1) nowLyric.textContent = soundLines[3];
  if (activeScreen === 2) nowLyric.textContent = soundLines[5];
  if (activeScreen === 3) nowLyric.textContent = soundLines[6];
  if (activeScreen === 4) nowLyric.textContent = soundLines[7];
}, { threshold: [0.48, 0.7] });

screens.forEach(screen => observer.observe(screen));

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  for (const item of [[weatherCanvas, weatherCtx], [profileCanvas, profileCtx]]) {
    const [canvas, ctx] = item;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  seedWeather();
  buildProfileParticles();
}

function seedWeather() {
  const count = Math.round(Math.min(150, Math.max(80, width / 10)));
  weatherParticles = Array.from({ length: count }, (_, index) => ({
    kind: index % 5 === 0 ? "leaf" : "rain",
    x: Math.random() * width,
    y: Math.random() * height,
    speed: 1.2 + Math.random() * 2.8,
    drift: -0.6 + Math.random() * 1.2,
    size: 2 + Math.random() * 8,
    alpha: 0.2 + Math.random() * 0.52,
    spin: Math.random() * Math.PI
  }));
}

function buildProfileParticles() {
  const words = (loveWords.value.trim() || "\u559c\u6b22\u4f60").split("");
  const isWide = width > 760;
  const cx = width * (isWide ? 0.66 : 0.5);
  const cy = height * (isWide ? 0.43 : 0.405);
  const size = Math.min(width, height) * (isWide ? 0.48 : 0.36);
  const points = [];
  const addPoint = (x, y, i, sizeScale = 1, alphaBoost = 0) => points.push({
      x: Math.min(width - 42, Math.max(42, x)),
      y: Math.min(height - 118, Math.max(72, y)),
      text: words[i % words.length],
      alpha: Math.min(0.98, 0.44 + Math.random() * 0.42 + alphaBoost),
      size: (isWide ? 10 + Math.random() * 8 : 8 + Math.random() * 6) * sizeScale,
      offset: Math.random() * Math.PI * 2
    });

  for (let i = 0; i < 230; i += 1) {
    const t = i / 229;
    let x;
    let y;
    if (t < 0.22) {
      const q = t / 0.22;
      x = cx - size * 0.1 + Math.sin(q * Math.PI * 0.85) * size * 0.21;
      y = cy - size * 0.58 + q * size * 0.34;
    } else if (t < 0.48) {
      const q = (t - 0.22) / 0.26;
      x = cx + size * 0.13 + q * size * 0.21;
      y = cy - size * 0.25 + Math.sin(q * Math.PI) * size * 0.04;
    } else if (t < 0.72) {
      const q = (t - 0.48) / 0.24;
      x = cx + size * 0.34 - q * size * 0.2;
      y = cy - size * 0.2 + q * size * 0.38;
    } else {
      const q = (t - 0.72) / 0.28;
      x = cx + size * 0.14 - q * size * 0.42;
      y = cy + size * 0.18 + q * size * 0.36;
    }
    x += Math.sin(t * Math.PI * 8) * size * 0.018;
    y += Math.cos(t * Math.PI * 7) * size * 0.014;
    addPoint(x, y, i, t > 0.18 && t < 0.6 ? 1.08 : 1, 0.08);
  }

  for (let i = 0; i < 42; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = size * (0.22 + Math.random() * 0.28);
    addPoint(cx - size * 0.05 + Math.cos(angle) * radius * 0.62, cy + Math.sin(angle) * radius, i + 231, 0.75, -0.04);
  }
  profileParticles = points;
}

function drawWeather() {
  weatherCtx.clearRect(0, 0, width, height);
  for (const p of weatherParticles) {
    p.y += p.speed;
    p.x += p.drift + Math.sin((p.y + p.spin * 40) * 0.012) * 0.25;
    if (p.y > height + 24) {
      p.y = -24;
      p.x = Math.random() * width;
    }
    if (p.x < -24) p.x = width + 24;
    if (p.x > width + 24) p.x = -24;

    weatherCtx.save();
    weatherCtx.globalAlpha = p.alpha;
    if (p.kind === "rain") {
      weatherCtx.strokeStyle = "#dfeee8";
      weatherCtx.lineWidth = 1;
      weatherCtx.beginPath();
      weatherCtx.moveTo(p.x, p.y);
      weatherCtx.lineTo(p.x - 8, p.y + 18);
      weatherCtx.stroke();
    } else {
      weatherCtx.translate(p.x, p.y);
      weatherCtx.rotate(Math.sin(p.y * 0.018 + p.spin) * 0.8);
      weatherCtx.fillStyle = "#4d7f58";
      weatherCtx.beginPath();
      weatherCtx.ellipse(0, 0, p.size * 0.62, p.size, 0.8, 0, Math.PI * 2);
      weatherCtx.fill();
    }
    weatherCtx.restore();
  }
}

function drawProfile() {
  profileRotation += 0.0045;
  profileFocus.pulse *= 0.94;
  profileCtx.clearRect(0, 0, width, height);
  profileCtx.save();
  profileCtx.shadowColor = "rgba(173, 30, 24, 0.36)";
  profileCtx.shadowBlur = document.body.classList.contains("fall-chorus") ? 18 : 8;
  profileCtx.textAlign = "center";
  profileCtx.textBaseline = "middle";
  for (const p of profileParticles) {
    const dx = profileFocus.x - p.x;
    const dy = profileFocus.y - p.y;
    const distance = Math.hypot(dx, dy) || 1;
    const pull = Math.max(0, 1 - distance / 260) * profileFocus.pulse * 12;
    const sway = Math.sin(profileRotation + p.offset) * 7;
    const lift = Math.cos(profileRotation * 1.3 + p.offset) * 4;
    profileCtx.globalAlpha = Math.min(1, p.alpha + profileFocus.pulse * 0.18 * Math.max(0, 1 - distance / 220));
    profileCtx.font = `700 ${p.size + profileFocus.pulse * 1.6 * Math.max(0, 1 - distance / 180)}px "Microsoft YaHei", sans-serif`;
    profileCtx.fillStyle = "#ad1e18";
    profileCtx.fillText(p.text, p.x + sway + (dx / distance) * pull, p.y + lift + (dy / distance) * pull);
  }
  profileCtx.restore();
}

function animate() {
  drawWeather();
  drawProfile();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
animate();
setFate(0);
updateCard();
