const bgm = document.querySelector("#bgm");
const entryGate = document.querySelector("#entryGate");
const enterButton = document.querySelector("#enterButton");
const prologue = document.querySelector("#prologue");
const ignitionZone = document.querySelector("#ignitionZone");
const album = document.querySelector("#album");
const bigSticker = document.querySelector("#bigSticker");
const lyricNotes = [...document.querySelectorAll(".lyric-note")];
const commentPop = document.querySelector("#commentPop");
const albumErrorBackdrop = document.querySelector("#albumErrorBackdrop");
const albumErrorClose = document.querySelector("#albumErrorClose");
const albumErrorOk = document.querySelector("#albumErrorOk");
const street = document.querySelector("#street");
const streetAfterglow = document.querySelector("#streetAfterglow");
const rewind = document.querySelector("#rewind");
const rewindButtonLabel = document.querySelector(".rewind-button-label");
const trueEndingLine = document.querySelector("#trueEndingLine");
const musicPlayer = document.querySelector("#musicPlayer");
const playToggle = document.querySelector("#playToggle");
const seekBar = document.querySelector("#seekBar");
const volumeBar = document.querySelector("#volumeBar");
const timeText = document.querySelector("#timeText");
const playerStatus = document.querySelector("#playerStatus");
const peephole = document.querySelector("#peephole");
const streetVisual = document.querySelector(".street-visual");
const rewindButton = document.querySelector("#rewindButton");
const savedMessage = document.querySelector("#savedMessage");
const sections = [...document.querySelectorAll("[data-section]")];
const navLinks = [...document.querySelectorAll(".old-nav a")];

let audioContext;
let sourceNode;
let filterNode;
let gainNode;
let audioGraphReady = false;
let isSeeking = false;
let prologueLit = false;
let streetSwallowTimer;
let rewindTimer;
let backspaceDown = false;

bgm.volume = Number(volumeBar.value);

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const updatePlayButton = () => {
  playToggle.textContent = bgm.paused ? "▶" : "Ⅱ";
  playToggle.setAttribute("aria-label", bgm.paused ? "播放" : "暂停");
};

const setPlayerStatus = (message) => {
  playerStatus.textContent = message;
};

const updateTime = () => {
  const duration = bgm.duration || 0;
  const current = bgm.currentTime || 0;

  timeText.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

  if (!isSeeking && duration > 0) {
    seekBar.value = String((current / duration) * 100);
  }
};

const setupAudioGraph = () => {
  if (audioGraphReady || !window.AudioContext) {
    return;
  }

  audioContext = new AudioContext();
  sourceNode = audioContext.createMediaElementSource(bgm);
  filterNode = audioContext.createBiquadFilter();
  gainNode = audioContext.createGain();

  filterNode.type = "lowpass";
  filterNode.frequency.value = 18000;
  gainNode.gain.value = bgm.volume;

  sourceNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);
  audioGraphReady = true;
};

const playMusic = async () => {
  setPlayerStatus("正在连接旧耳机…");

  try {
    await Promise.race([
      bgm.play(),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("PLAY_TIMEOUT")), 1600);
      }),
    ]);

    try {
      setupAudioGraph();

      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }
    } catch (audioEffectError) {
      console.warn("音频滤镜未启用，音乐仍可正常播放。", audioEffectError);
    }

    setPlayerStatus("正在播放 / 访问记录 +1");
  } catch (error) {
    setPlayerStatus("浏览器拦截了自动播放，请点 ▶");
    console.info("音乐播放未自动启动，可通过播放器再次点击播放。", error);
  } finally {
    updatePlayButton();
  }
};

const fadeVolume = (target, duration = 650) => {
  const start = bgm.volume;
  const startedAt = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const nextValue = start + (target - start) * eased;

    bgm.volume = Math.max(0, Math.min(1, nextValue));

    if (gainNode) {
      gainNode.gain.value = bgm.volume;
    }

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      volumeBar.value = String(target);
    }
  };

  requestAnimationFrame(tick);
};

const markPrologueIdle = () => {
  prologue.classList.add("prologue-idle");
  prologue.classList.remove("prologue-hovering", "prologue-lit", "just-lit");
};

const lightPrologue = async () => {
  prologueLit = true;
  prologue.classList.remove("prologue-idle", "prologue-hovering");
  prologue.classList.add("prologue-lit", "just-lit");
  musicPlayer.classList.add("is-visible");
  setPlayerStatus("访问记录 +1，正在连接旧耳机…");

  window.setTimeout(() => {
    prologue.classList.remove("just-lit");
  }, 850);

  await playMusic();
};

enterButton.addEventListener("click", () => {
  entryGate.classList.add("is-hidden");
  markPrologueIdle();
  setPlayerStatus("等待点燃香烟");
  document.querySelector("#prologue")?.scrollIntoView({ behavior: "smooth" });
});

ignitionZone.addEventListener("pointerenter", () => {
  if (prologueLit) {
    return;
  }

  prologue.classList.add("prologue-hovering");
});

ignitionZone.addEventListener("pointerleave", () => {
  prologue.classList.remove("prologue-hovering");
});

ignitionZone.addEventListener("focus", () => {
  if (!prologueLit) {
    prologue.classList.add("prologue-hovering");
  }
});

ignitionZone.addEventListener("blur", () => {
  prologue.classList.remove("prologue-hovering");
});

ignitionZone.addEventListener("click", async () => {
  if (prologueLit) {
    await playMusic();
    return;
  }

  await lightPrologue();
});

playToggle.addEventListener("click", async () => {
  if (bgm.paused) {
    await playMusic();
  } else {
    bgm.pause();
    setPlayerStatus("已暂停，回忆还在缓存里");
    updatePlayButton();
  }
});

bgm.addEventListener("loadedmetadata", updateTime);
bgm.addEventListener("timeupdate", updateTime);
bgm.addEventListener("play", () => {
  setPlayerStatus("正在播放 / 访问记录 +1");
  updatePlayButton();
});
bgm.addEventListener("pause", updatePlayButton);

seekBar.addEventListener("pointerdown", () => {
  isSeeking = true;
});

seekBar.addEventListener("input", () => {
  const duration = bgm.duration || 0;

  if (duration > 0) {
    timeText.textContent = `${formatTime((Number(seekBar.value) / 100) * duration)} / ${formatTime(duration)}`;
  }
});

seekBar.addEventListener("change", () => {
  const duration = bgm.duration || 0;

  if (duration > 0) {
    bgm.currentTime = (Number(seekBar.value) / 100) * duration;
  }

  isSeeking = false;
});

volumeBar.addEventListener("input", () => {
  const value = Number(volumeBar.value);
  bgm.volume = value;

  if (gainNode) {
    gainNode.gain.value = value;
  }
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const section = entry.target;
      section.classList.add("is-active");

      if (section.id === "album") {
        section.classList.add("album-entered");
      }

      if (section.id === "street") {
        section.classList.add("street-entered");
      }

      if (section.id === "rewind") {
        section.classList.add("rewind-entered");
      }

      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${section.id}`;
        link.classList.toggle("is-active", isActive);
      });
    });
  },
  {
    threshold: 0.48,
  },
);

sections.forEach((section) => observer.observe(section));

const showLyricComment = (note) => {
  commentPop.textContent = note.dataset.comment || "匿名访客：别等了。";
  commentPop.classList.add("is-visible");
};

const hideLyricComment = () => {
  commentPop.classList.remove("is-visible");
};

lyricNotes.forEach((note) => {
  note.addEventListener("pointerenter", () => showLyricComment(note));
  note.addEventListener("focus", () => showLyricComment(note));
  note.addEventListener("pointerleave", hideLyricComment);
  note.addEventListener("blur", hideLyricComment);
});

const showAlbumError = () => {
  albumErrorBackdrop.classList.add("is-visible");
  albumErrorBackdrop.setAttribute("aria-hidden", "false");
};

const hideAlbumError = () => {
  albumErrorBackdrop.classList.remove("is-visible");
  albumErrorBackdrop.setAttribute("aria-hidden", "true");
  album.classList.add("album-flash-on");
  window.setTimeout(() => {
    album.classList.remove("album-flash-on");
  }, 680);
};

album.addEventListener("dblclick", (event) => {
  if (event.target.closest(".big-sticker, .lyric-note, a, button, input")) {
    return;
  }

  showAlbumError();
});

albumErrorClose.addEventListener("click", hideAlbumError);
albumErrorOk.addEventListener("click", hideAlbumError);
albumErrorBackdrop.addEventListener("click", (event) => {
  if (event.target === albumErrorBackdrop) {
    hideAlbumError();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Backspace") {
    if (!event.target.closest?.("input, textarea, [contenteditable='true']")) {
      event.preventDefault();
    }

    backspaceDown = true;
  }

  if (event.key === "Escape" && albumErrorBackdrop.classList.contains("is-visible")) {
    hideAlbumError();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Backspace") {
    backspaceDown = false;
  }
});

const updatePrologueScrollState = () => {
  const prologueBottom = prologue.offsetTop + prologue.offsetHeight;
  const inPrologueRange = window.scrollY < prologueBottom - window.innerHeight * 0.22;
  const shouldShowLeaving = prologueLit && inPrologueRange && window.scrollY > 90;
  prologue.classList.toggle("is-leaving", shouldShowLeaving);
};

window.addEventListener("scroll", updatePrologueScrollState, { passive: true });

const startPeephole = () => {
  streetVisual.classList.add("is-peeking");
  street.classList.add("is-peeking");
  streetAfterglow.classList.remove("is-visible");

  if (filterNode) {
    filterNode.frequency.setTargetAtTime(850, audioContext.currentTime, 0.06);
  }
};

const stopPeephole = ({ force = false } = {}) => {
  if (street.classList.contains("street-swallowed") && !force) {
    return;
  }

  streetVisual.classList.remove("is-peeking");
  street.classList.remove("is-peeking");

  if (filterNode) {
    filterNode.frequency.setTargetAtTime(18000, audioContext.currentTime, 0.12);
  }
};

peephole.addEventListener("pointerenter", startPeephole);
peephole.addEventListener("pointerleave", stopPeephole);
peephole.addEventListener("focus", startPeephole);
peephole.addEventListener("blur", stopPeephole);
peephole.addEventListener("click", async () => {
  await playMusic();
  startPeephole();
  window.clearTimeout(streetSwallowTimer);
  street.classList.add("street-swallowed");
  streetAfterglow.classList.remove("is-visible");

  streetSwallowTimer = window.setTimeout(() => {
    street.classList.remove("street-swallowed");
    stopPeephole({ force: true });
    streetAfterglow.classList.add("is-visible");
  }, 3000);
});

rewindButton.addEventListener("click", (event) => {
  const trueEnding = backspaceDown || event.getModifierState?.("Backspace");
  window.clearTimeout(rewindTimer);
  document.body.classList.add("is-rewinding");
  rewind.classList.add("rewind-active");
  rewind.classList.toggle("true-ending", trueEnding);
  savedMessage.classList.remove("is-visible");
  trueEndingLine.setAttribute("aria-hidden", trueEnding ? "false" : "true");

  const previousVolume = bgm.volume;
  fadeVolume(Math.max(previousVolume * 0.28, 0.08), 360);

  window.setTimeout(() => {
    if (bgm.currentTime > 8) {
      bgm.currentTime = Math.max(0, bgm.currentTime - 8);
    }
  }, 720);

  rewindTimer = window.setTimeout(() => {
    fadeVolume(previousVolume, 920);
    savedMessage.textContent = trueEnding
      ? "系统提示：回忆无法删除，只能失去访问权限。"
      : "留言已保存：青春没有删除，只是换了一个文件夹。";
    savedMessage.classList.add("is-visible");
    rewindButtonLabel.textContent = "再倒流一次";
    document.body.classList.remove("is-rewinding");
    rewind.classList.remove("rewind-active");

    if (trueEnding) {
      window.setTimeout(() => {
        rewind.classList.remove("true-ending");
        trueEndingLine.setAttribute("aria-hidden", "true");
      }, 1800);
    }
  }, 3600);
});

updateTime();
updatePlayButton();
markPrologueIdle();
updatePrologueScrollState();
