"use strict";
(() => {
  // src/audio.ts
  var SoundDirector = class {
    music = new Audio("media/houhuiwuci.mp3");
    audioContext = null;
    constructor() {
      this.music.loop = true;
      this.music.volume = 0.72;
      this.music.preload = "auto";
    }
    async startMusic() {
      try {
        await this.music.play();
      } catch {
      }
    }
    fadeMusicTo(volume, durationMs = 1200) {
      const from = this.music.volume;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / durationMs);
        this.music.volume = from + (volume - from) * t;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    stopMusic() {
      this.fadeMusicTo(0, 1600);
      window.setTimeout(() => this.music.pause(), 1700);
    }
    playOnlineCue() {
      this.playSequence([
        [880, 86, 0.1],
        [1174, 90, 0.12],
        [988, 86, 0.1],
        [1320, 160, 0.12]
      ]);
    }
    playFailCue() {
      this.playSequence([
        [246, 140, 0.12],
        [196, 180, 0.1]
      ]);
    }
    playBoostCue() {
      this.playSweep(120, 620, 520, 0.08, "sawtooth");
    }
    playPerfectCue() {
      this.playSequence([
        [523, 70, 0.08],
        [784, 90, 0.1],
        [1046, 180, 0.12]
      ]);
    }
    playOfflineCue() {
      this.playSequence([
        [392, 150, 0.11],
        [330, 190, 0.09],
        [247, 260, 0.08]
      ]);
    }
    getContext() {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }
      return this.audioContext;
    }
    playSequence(steps) {
      const ctx = this.getContext();
      let offset = 0;
      steps.forEach(([frequency, durationMs, gain = 0.08]) => {
        const osc = ctx.createOscillator();
        const envelope = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        envelope.gain.setValueAtTime(1e-3, ctx.currentTime + offset);
        envelope.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + offset + 0.012);
        envelope.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + offset + durationMs / 1e3);
        osc.connect(envelope);
        envelope.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + durationMs / 1e3 + 0.04);
        offset += durationMs / 1e3 + 0.045;
      });
    }
    playSweep(from, to, durationMs, gain, type) {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const envelope = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + durationMs / 1e3);
      envelope.gain.setValueAtTime(gain, ctx.currentTime);
      envelope.gain.exponentialRampToValueAtTime(1e-3, ctx.currentTime + durationMs / 1e3);
      osc.connect(envelope);
      envelope.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1e3 + 0.05);
    }
  };

  // src/scenes.ts
  var scenes = [
    {
      id: "intro",
      index: "01",
      kicker: "\u5E8F\u5E55 \xB7 \u9752\u6625\u7684\u901A\u884C\u8BC1",
      title: "\u4F60\u82E5\u79BB\u53BB\uFF0C\u540E\u4F1A\u65E0\u671F",
      lyric: "\u4F60\u82E5\u79BB\u53BB\uFF0C\u540E\u4F1A\u65E0\u671F",
      hint: "\u70B9\u51FB\u767B\u5165\u8BB0\u5FC6"
    },
    {
      id: "farm",
      index: "02",
      kicker: "\u843D\u5BDE\u519C\u573A \xB7 \u7B49\u4E0D\u5230\u7684\u4E30\u6536",
      title: "\u7B49\u4E0D\u5230\u98CE\u4E2D\u4F60\u7684\u8138\u988A",
      lyric: "\u7B49\u4E0D\u5230\uFF0C\u63A9\u9970\u7684\u96E8\u843D\u4E0B / \u6211\u7684\u773C\u6CEA\u88AB\u4F60\u89C9\u5BDF",
      hint: "\u70B9\u51FB\u67AF\u840E\u4F5C\u7269"
    },
    {
      id: "race",
      index: "03",
      kicker: "\u72C2\u98D9\u98DE\u8F66 \xB7 \u7231\u7684\u65F6\u5DEE\u4E0E\u5C3E\u706F",
      title: "\u6211\u4EEC\u7684\u7231\u4E5F\u6709\u65F6\u5DEE",
      lyric: "\u7B49\u4E0D\u5230\uFF0C\u4E0D\u7ECF\u610F\u7684\u7275\u6302 / \u5374\u6CA1\u51FA\u606F\u7684\u653E\u4E0D\u4E0B",
      hint: "\u957F\u6309 \u2191 \u6216 W \u52A0\u901F"
    },
    {
      id: "dance",
      index: "04",
      kicker: "\u70AB\u821E\u6597\u79C0\u573A \xB7 \u9519\u5F00\u7684\u821E\u6B65",
      title: "\u9519\u7684\u5E76\u4E0D\u662F\u4F60\uFF0C\u800C\u662F\u5168\u4E16\u754C",
      lyric: "\u4F60\u8BF4\u966A\u6211\u5230\u67D0\u5E74\u67D0\u6708\u67D0\u5929 / \u5374\u628A\u6211\u4E22\u5728\u67D0\u65E5\u67D0\u591C\u67D0\u8857",
      hint: "\u8DDF\u968F\u65B9\u5411\u952E\uFF0C\u518D\u6309\u7A7A\u683C"
    },
    {
      id: "memory",
      index: "05",
      kicker: "\u8BB0\u5FC6\u7FFB\u7BC7 \xB7 \u9057\u5FD8\u7684\u9ED1\u591C\u4E0E\u767D\u96EA",
      title: "\u6211\u628A\u8BB0\u5FC6\u90FD\u7FFB\u904D",
      lyric: "\u5374\u6CA1\u6709\u53D1\u73B0\u6211\u4EEC\u7EA6\u597D\u7684\u660E\u5929 / \u4F60\u7559\u7ED9\u6628\u5929",
      hint: "\u79FB\u52A8\u9F20\u6807\uFF0C\u62B9\u53BB\u843D\u96EA"
    },
    {
      id: "finale",
      index: "06",
      kicker: "\u7EC8\u7AE0 \xB7 \u8774\u8776\u53D1\u5361\u4E0E\u8C22\u5E55",
      title: "\u60A8\u7684\u9752\u6625\u5DF2\u4E0B\u7EBF",
      lyric: "\u6211\u4EEC\u7EA6\u597D\u7684\u660E\u5929 / \u4F60\u7559\u7ED9\u6628\u5929",
      hint: "\u6700\u540E\u4E00\u6B21\uFF0C\u6536\u8D77\u53D1\u5361"
    }
  ];
  var dancePattern = ["\u2190", "\u2191", "\u2193", "\u2192", "\u2191", "\u2190", "\u2192", "\u2193", "\u2190", "\u2191", "\u2192", "\u2193"];
  var danceChart = Array.from({ length: 80 }, (_, index) => {
    const phase = index < 20 ? "warmup" : index < 44 ? "build" : index < 68 ? "dense" : "finale";
    const interval = index < 20 ? 900 : index < 44 ? 760 : index < 68 ? 650 : 560;
    return {
      key: dancePattern[index % dancePattern.length],
      interval,
      phase
    };
  });
  var memoryNotes = [
    "\u8D71\u535F\u8A58\u306E\u51FB\u8388\uFF0C\u5A9E\u4F31\u7D66\u306E\u8A8B\u61B6",
    "2010.08.17 \u6674\uFF0C\u4ECA\u5929\u5077\u5230\u4F60\u7684\u73AB\u7470\u4E86",
    "[em]e100[/em] \u540E\u4F1A\u65E0\u671F",
    "\u60C5\u4FA3\u7A7A\u95F4\u5DF2\u5230\u671F\uFF0C\u662F\u5426\u7EED\u8D39\u6628\u5929\uFF1F",
    "\u4E0A\u7EBF\u63D0\u9192\uFF1A\u7279\u522B\u5173\u5FC3 23:59",
    "\u628A\u660E\u5929\u7559\u7ED9\u7559\u8A00\u677F\uFF0C\u628A\u6628\u5929\u7559\u7ED9\u4F60"
  ];

  // src/farm-data.ts
  var cropDefinitions = {
    wheat: {
      kind: "wheat",
      name: "\u5C0F\u9EA6",
      seedPrice: 8,
      sellPrice: 24,
      yield: 3,
      stageDurations: [8e3, 12e3, 16e3, 2e4],
      color: "#d8f0ab"
    },
    rose: {
      kind: "rose",
      name: "\u73AB\u7470",
      seedPrice: 14,
      sellPrice: 42,
      yield: 3,
      stageDurations: [12e3, 18e3, 24e3, 3e4],
      color: "#ff697d"
    },
    pumpkin: {
      kind: "pumpkin",
      name: "\u5357\u74DC",
      seedPrice: 20,
      sellPrice: 68,
      yield: 4,
      stageDurations: [16e3, 22e3, 3e4, 38e3],
      color: "#ffbd66"
    }
  };
  var farmFriends = [
    { id: "xiaoyu", name: "\u5C0F\u96E8", online: true, status: "2\u5757\u5730\u6210\u719F\uFF0C\u53EF\u5E2E\u5FD9\u6D47\u6C34" },
    { id: "ajie", name: "\u963F\u6770", online: false, status: "\u73AB\u7470\u6B63\u5728\u5F00\u82B1" },
    { id: "tutu", name: "\u5154\u5154", online: true, status: "\u5357\u74DC\u6210\u719F\uFF0C\u7B49\u4F60\u6765\u5077\u83DC" },
    { id: "old-time", name: "\u65E7\u65F6\u5149", online: false, status: "\u519C\u573A\u6682\u65F6\u65E0\u4EBA\u6253\u7406" }
  ];

  // src/main.ts
  var app = document.querySelector("#app");
  if (!app) {
    throw new Error("App root not found");
  }
  var sound = new SoundDirector();
  var sceneIds = scenes.map((scene) => scene.id);
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var savedLoginAccount = localStorage.getItem("houhuiwuci:account") ?? "";
  var farmStorageKey = "houhuiwuci:farm:v1";
  var farmStageNames = ["\u79CD\u5B50", "\u53D1\u82BD", "\u751F\u957F", "\u5F00\u82B1", "\u6210\u719F"];
  function createDefaultFarmSave() {
    return {
      coins: 100,
      experience: 0,
      level: 1,
      plots: Array.from({ length: 12 }, (_, id) => ({
        id,
        unlocked: id < 4,
        status: "\u8352\u5E9F",
        stolenRatio: 0
      })),
      inventory: {
        wheatSeed: 3,
        roseSeed: 1,
        pumpkinSeed: 0,
        wheat: 0,
        rose: 0,
        pumpkin: 0,
        fertilizer: 2,
        pesticide: 2
      },
      friends: farmFriends.map((friend, index) => ({
        ...friend,
        mature: index === 2,
        needsHelp: index === 0,
        stolenRatio: index === 2 ? 0.2 : 0
      })),
      updatedAt: Date.now()
    };
  }
  function loadFarmSave() {
    try {
      const saved = JSON.parse(localStorage.getItem(farmStorageKey) ?? "null");
      if (saved?.plots?.length && saved.inventory && saved.friends) {
        return saved;
      }
    } catch {
    }
    return createDefaultFarmSave();
  }
  var farmSave = loadFarmSave();
  var farmSelectedPlot = 0;
  var farmPanel = "tools";
  var state = {
    activeScene: "intro",
    unlocked: false,
    loginAccount: savedLoginAccount,
    loginPassword: "",
    rememberAccount: true,
    farmClicks: 0,
    raceHolding: false,
    raceSpeed: 0,
    raceDistance: 0,
    raceFinished: false,
    danceIndex: 0,
    danceFinished: false,
    danceHits: 0,
    danceRating: "",
    danceShowTime: false,
    danceScore: 0,
    danceLastJudgement: "",
    memoryHits: 0,
    memoryFinished: false,
    finaleOpen: false
  };
  app.innerHTML = `
  <div class="site-shell">
    <header class="hud">
      <div class="hud__brand">
        <span class="hud__badge">\u540E\u4F1A\u65E0\u671F</span>
        <div>
          <p class="hud__eyebrow">\u9752\u6625\u81F4\u656C\u97F3\u4E50\u7AD9</p>
          <h1>\u91CD\u8FD4\u90A3\u5E74\uFF0C\u540E\u4F1A\u65E0\u671F</h1>
        </div>
      </div>
      <nav class="hud__nav" aria-label="\u7AE0\u8282\u5BFC\u822A">
        ${scenes.map(
    (scene) => `
              <button class="hud__nav-item" type="button" data-jump="${scene.id}">
                <span>${scene.index}</span>
                <small>${scene.kicker}</small>
              </button>
            `
  ).join("")}
      </nav>
    </header>
    <div class="progress" aria-hidden="true">
      ${sceneIds.map(
    (id) => `
            <span class="progress__dot" data-progress-dot="${id}"></span>
          `
  ).join("")}
    </div>
    <main class="story" id="story">
      ${renderIntro()}
      ${renderFarm()}
      ${renderRace()}
      ${renderDance()}
      ${renderMemory()}
      ${renderFinale()}
    </main>
    <div class="toast" id="toast" aria-live="polite"></div>
  </div>
`;
  var toast = document.querySelector("#toast");
  var storyElement = document.querySelector("#story");
  var sections = /* @__PURE__ */ new Map();
  scenes.forEach((scene) => {
    const el = document.querySelector(`[data-scene="${scene.id}"]`);
    if (el) sections.set(scene.id, el);
  });
  var loginForm = document.querySelector("[data-login-form]");
  var introLoginButton = document.querySelector("[data-action='login']");
  var accountInput = document.querySelector("[name='account']");
  var passwordInput = document.querySelector("[name='password']");
  var rememberInput = document.querySelector("[name='remember']");
  var loginStatus = document.querySelector("[data-login-status]");
  var introReveal = document.querySelector("[data-intro-reveal]");
  var farmGrid = document.querySelector("[data-farm-grid]");
  var farmHud = document.querySelector("[data-farm-hud]");
  var farmPanelContent = document.querySelector("[data-farm-panel-content]");
  var farmStatus = document.querySelector("[data-farm-status]");
  var farmLeaveButton = document.querySelector("[data-farm-leave]");
  var farmRain = document.querySelector("[data-rain]");
  var raceCar = document.querySelector("[data-race-car]");
  var raceTail = document.querySelector("[data-race-tail]");
  var raceStage = document.querySelector("[data-race-track]");
  var raceMeter = document.querySelector("[data-race-meter]");
  var raceHint = document.querySelector("[data-race-hint]");
  var raceAccelerator = document.querySelector("[data-race-accelerator]");
  var danceBoard = document.querySelector("[data-dance-board]");
  var danceNotes = document.querySelector("[data-dance-notes]");
  var dancePrompt = document.querySelector("[data-dance-prompt]");
  var danceRail = document.querySelector("[data-dance-rail]");
  var danceStage = document.querySelector("[data-dance-stage]");
  var danceFeedback = document.querySelector("[data-dance-feedback]");
  var memoryCanvas = document.querySelector("[data-memory-canvas]");
  var memoryScratch = document.querySelector("[data-memory-scratch]");
  var memoryHint = document.querySelector("[data-memory-hint]");
  var finaleHairpin = document.querySelector("[data-finale-hairpin]");
  var finaleGlowMessage = document.querySelector("[data-finale-glow-message]");
  var finaleActions = document.querySelector("[data-finale-actions]");
  var finaleMessage = document.querySelector("[data-finale-message]");
  var shareButton = document.querySelector("[data-share]");
  var replayButton = document.querySelector("[data-replay]");
  var memoryBrushes = [];
  var animationFrame = 0;
  var raceNextAutoAdvance = 0;
  var raceCueCooldown = 0;
  var raceBoostUntil = 0;
  var raceStarted = false;
  var danceSessionStart = 0;
  var danceCombo = 0;
  var danceNotesState = [];
  var danceScrollAdvanceAt = 0;
  var danceHeldKey = "";
  var danceGestureStart = null;
  var memoryAdvanceTimer = 0;
  var instructionTimer = 0;
  function renderIntro() {
    return `
    <section class="scene scene--intro" data-scene="intro">
      <div class="scene__backdrop scene__backdrop--farm"></div>
      <div class="scene__overlay scene__overlay--scanlines"></div>
      <div class="scene__content scene__content--intro">
        <div class="login-window">
          <div class="window__topbar">
            <span>QQ \u767B\u5F55</span>
            <div class="window__traffic">
              <i></i><i></i><i></i>
            </div>
          </div>
          <form class="window__body" data-login-form>
            <div class="avatar-stack">
              <div class="avatar-ring"></div>
              <div class="avatar-core"></div>
              <div class="intro-reveal" data-intro-reveal>
                <span>\u6B22\u8FCE\u56DE\u6765</span>
              </div>
            </div>
            <div class="login-copy">
              <p class="scene__kicker">${scenes[0].kicker}</p>
            </div>
            <label class="field">
              <span>QQ \u53F7\u7801 / \u90AE\u7BB1 / \u624B\u673A\u53F7</span>
              <input name="account" type="text" autocomplete="username" placeholder="\u8BF7\u8F93\u5165\u8D26\u53F7" value="${state.loginAccount}" />
            </label>
            <label class="field">
              <span>\u5BC6\u7801</span>
              <input name="password" type="password" autocomplete="current-password" placeholder="\u8BF7\u8F93\u5165\u5BC6\u7801" />
            </label>
            <label class="login-options">
              <input name="remember" type="checkbox" checked />
              <span>\u8BB0\u4F4F\u8D26\u53F7</span>
            </label>
            <button class="action-button action-button--primary" data-action="login" type="submit">
              \u5B89\u5168\u767B\u5F55 / \u767B\u5165\u8BB0\u5FC6
            </button>
            <p class="login-status" data-login-status>\u8BF7\u8F93\u5165\u8D26\u53F7\u548C\u5BC6\u7801\u540E\u767B\u5F55</p>
            <p class="scene__hint">${scenes[0].hint}</p>
          </form>
        </div>
      </div>
    </section>
  `;
  }
  function renderFarm() {
    return `
    <section class="scene scene--farm" data-scene="farm">
      <div class="scene__backdrop scene__backdrop--farm"></div>
      <div class="rain" data-rain></div>
      <div class="scene__content scene__content--farm">
        <div class="scene-head">
          <p class="scene__kicker">${scenes[1].kicker}</p>
          <h2>${scenes[1].title}</h2>
          <p class="scene__lyric">${scenes[1].lyric}</p>
        </div>
        <div class="farm-hud" data-farm-hud></div>
        <div class="farm-layout">
          <div class="farm-grid farm-grid--management" data-farm-grid></div>
          <aside class="farm-side">
            <div class="farm-tabs" role="tablist" aria-label="\u519C\u573A\u7BA1\u7406">
              <button class="farm-tab is-active" type="button" data-farm-panel="tools">\u5DE5\u5177</button>
              <button class="farm-tab" type="button" data-farm-panel="shop">\u5546\u5E97</button>
              <button class="farm-tab" type="button" data-farm-panel="storage">\u4ED3\u5E93</button>
              <button class="farm-tab" type="button" data-farm-panel="friends">\u597D\u53CB</button>
            </div>
            <div class="farm-panel" data-farm-panel-content></div>
          </aside>
        </div>
        <div class="scene-foot scene-foot--farm">
          <div class="status-chip" data-farm-status>\u9009\u62E9\u4E00\u5757\u571F\u5730\u5F00\u59CB\u7ECF\u8425\u3002</div>
          <button class="action-button action-button--primary" type="button" data-farm-leave>\u79BB\u5F00\u519C\u573A \u2192</button>
        </div>
      </div>
    </section>
  `;
  }
  function renderRace() {
    return `
    <section class="scene scene--race" data-scene="race">
      <div class="scene__backdrop scene__backdrop--race"></div>
      <div class="scene__content scene__content--race">
        <div class="scene-head scene-head--race">
          <p class="scene__kicker">${scenes[2].kicker}</p>
          <h2>${scenes[2].title}</h2>
          <p class="scene__lyric">${scenes[2].lyric}</p>
        </div>
        <div class="race-stage" data-race-track>
          <div class="billboard billboard--left">\u7B49\u4E0D\u5230\u4F60\u7684\u96EA\u6708\u98CE\u82B1</div>
          <div class="billboard billboard--right">\u6211\u4EEC\u7684\u7231\u4E5F\u6709\u65F6\u5DEE</div>
          <div class="race-track">
            <span class="race-track__line"></span>
            <span class="race-track__line"></span>
            <span class="race-track__line"></span>
          </div>
          <div class="race-tail" data-race-tail></div>
          <div class="race-car" data-race-car style="background-image:url('media/race-car.png')">
            <span class="race-car__body"></span>
            <span class="race-car__roof"></span>
            <span class="race-car__glow"></span>
          </div>
        </div>
        <div class="race-ui">
          <div class="meter">
            <div class="meter__label">\u65F6\u5DEE\u52A0\u901F</div>
            <div class="meter__bar"><i data-race-meter></i></div>
          </div>
          <button class="race-accelerator" type="button" data-race-accelerator>
            \u6309\u4F4F\u52A0\u901F
          </button>
          <div class="finale-glow-message" aria-live="polite">886\uFF0C\u6211\u4EEC\u6700\u7F8E\u7684\u9752\u6625\u3002</div>
          <div class="scene-foot scene-foot--race">
            <div class="status-chip" data-race-hint>\u7535\u8111\u957F\u6309 <strong>\u2191 / W</strong>\uFF0C\u624B\u673A\u957F\u6309\u201C\u6309\u4F4F\u52A0\u901F\u201D\u6216\u8D5B\u9053\u5373\u53EF\u52A0\u901F</div>
          </div>
        </div>
      </div>
    </section>
  `;
  }
  function renderDance() {
    return `
    <section class="scene scene--dance" data-scene="dance">
      <div class="scene__content scene__content--dance">
        <div class="scene-head scene-head--dance">
          <p class="scene__kicker">${scenes[3].kicker}</p>
          <h2>${scenes[3].title}</h2>
          <p class="scene__lyric">${scenes[3].lyric}</p>
        </div>
        <div class="dance-stage" data-dance-stage>
          <video class="dance-video" src="media/qqxuanwu.mp4" autoplay muted loop playsinline preload="auto"></video>
          <div class="dance-video__veil"></div>
          <div class="dance-board" data-dance-board>
            <div class="dance-lanes">
              <span class="dance-lane dance-lane--left"></span>
              <span class="dance-lane dance-lane--up"></span>
              <span class="dance-lane dance-lane--down"></span>
              <span class="dance-lane dance-lane--right"></span>
            </div>
            <div class="dance-judge"></div>
            <div class="dance-notes" data-dance-notes></div>
            <div class="dance-feedback" data-dance-feedback aria-live="polite"></div>
          </div>
        </div>
        <div class="dance-panel">
          <div class="dance-guide" aria-label="\u97F3\u7B26\u64CD\u4F5C\u63D0\u793A">
            <span><b class="dance-guide__icon dance-guide__icon--tap">\u70B9</b>\u5355\u70B9\uFF1A\u624B\u673A\u70B9\u97F3\u7B26\u6216\u65B9\u5411\u952E\uFF0C\u7535\u8111\u6309\u65B9\u5411\u952E</span>
            <span><b class="dance-guide__icon dance-guide__icon--hold">\u957F</b>\u957F\u6309\uFF1A\u624B\u673A\u6309\u4F4F\u97F3\u7B26/\u6309\u94AE\u5230\u5C3E\u7AEF\uFF0C\u7535\u8111\u6309\u4F4F\u65B9\u5411\u952E</span>
            <span><b class="dance-guide__icon dance-guide__icon--slide">\u6ED1</b>\u6ED1\u52A8\uFF1A\u624B\u673A\u987A\u7BAD\u5934\u5212\uFF0C\u7535\u8111\u70B9\u4E0B\u843D\u97F3\u7B26\u6216\u6309\u65B9\u5411\u952E</span>
          </div>
          <div class="dance-prompt" data-dance-prompt></div>
          <div class="dance-rail" data-dance-rail>
            <button class="dance-pad dance-pad--left" type="button" data-dance-hit="\u2190">\u2190</button>
            <button class="dance-pad dance-pad--up" type="button" data-dance-hit="\u2191">\u2191</button>
            <button class="dance-pad dance-pad--down" type="button" data-dance-hit="\u2193">\u2193</button>
            <button class="dance-pad dance-pad--right" type="button" data-dance-hit="\u2192">\u2192</button>
            <button class="dance-pad dance-pad--space" type="button" data-dance-hit="Space">Space</button>
          </div>
          <div class="scene-foot scene-foot--dance">
            <div class="status-chip">\u8DDF\u7740\u89C6\u9891\u91CC\u7684\u5224\u5B9A\u6761\u6309\u65B9\u5411\u952E\uFF0C\u6700\u540E\u518D\u6309 <strong>Space</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;
  }
  function renderMemory() {
    const cards = memoryNotes.map(
      (note, index) => `
        <article class="memory-card memory-card--${index % 3}" style="--x:${14 + index * 11}%; --y:${10 + index % 3 * 24}%; --rot:${-8 + index * 3}deg">
          <div class="memory-card__paper"></div>
          <div class="memory-card__content">
            <p class="memory-card__title">QQ \u7A7A\u95F4\u7559\u8A00 ${index + 1}</p>
            <p class="memory-card__note">${note}</p>
          </div>
        </article>
      `
    ).join("");
    return `
    <section class="scene scene--memory" data-scene="memory">
      <div class="scene__backdrop scene__backdrop--memory"></div>
      <div class="scene__content scene__content--memory">
        <div class="scene-head scene-head--memory">
          <p class="scene__kicker">${scenes[4].kicker}</p>
          <h2>${scenes[4].title}</h2>
          <p class="scene__lyric">${scenes[4].lyric}</p>
        </div>
        <div class="memory-stage">
          ${cards}
          <div class="snow" aria-hidden="true"></div>
          <canvas class="memory-canvas" data-memory-canvas></canvas>
          <canvas class="memory-scratch" data-memory-scratch></canvas>
        </div>
        <div class="scene-foot">
          <div class="status-chip" data-memory-hint>\u79FB\u52A8\u9F20\u6807\uFF0C\u62B9\u53BB\u843D\u96EA\uFF0C\u7FFB\u627E\u8BB0\u5FC6</div>
        </div>
      </div>
    </section>
  `;
  }
  function renderFinale() {
    return `
    <section class="scene scene--finale" data-scene="finale">
      <div class="scene__media scene__media--video scene__media--finale">
        <video class="memory-video" src="media/wechat-memory.mp4" autoplay muted loop playsinline></video>
      </div>
      <div class="scene__backdrop scene__backdrop--finale"></div>
      <div class="scene__content scene__content--finale">
        <div class="spotlight">
          <button class="butterfly" type="button" data-finale-hairpin aria-label="\u6536\u8D77\u8774\u8776\u53D1\u5361">
            <img src="media/hairpin.png" alt="" />
          </button>
          <div class="finale-glow-message" data-finale-glow-message aria-live="polite">886\uFF0C\u6211\u4EEC\u6700\u7F8E\u7684\u9752\u6625\u3002</div>
        </div>
        <div class="finale-copy">
          <p class="scene__kicker">${scenes[5].kicker}</p>
          <h2>${scenes[5].title}</h2>
          <p class="scene__lyric">${scenes[5].lyric}</p>
          <p class="finale-message" data-finale-message>\u6700\u540E\u4E00\u6B21\uFF0C\u6536\u8D77\u53D1\u5361</p>
          <div class="finale-actions" data-finale-actions hidden>
            <button class="action-button action-button--primary" type="button" data-replay>\u91CD\u65B0\u56DE\u5473</button>
            <button class="action-button" type="button" data-share>\u6253\u5305\u56DE\u5FC6</button>
          </div>
        </div>
      </div>
    </section>
  `;
  }
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast--show");
    window.clearTimeout(showToastTimer);
    showToastTimer = window.setTimeout(() => {
      toast.classList.remove("toast--show");
    }, 2200);
  }
  function saveFarm() {
    farmSave.updatedAt = Date.now();
    localStorage.setItem(farmStorageKey, JSON.stringify(farmSave));
  }
  function gainFarmExperience(amount) {
    farmSave.experience += amount;
    farmSave.level = Math.max(1, Math.floor(farmSave.experience / 50) + 1);
  }
  function syncFarmPlot(plot, now = Date.now()) {
    if (!plot.crop || !plot.plantedAt) return;
    const crop = cropDefinitions[plot.crop];
    const elapsed = now - plot.plantedAt;
    let passed = 0;
    let stageIndex = 0;
    for (let index = 0; index < crop.stageDurations.length; index += 1) {
      passed += crop.stageDurations[index];
      if (elapsed >= passed) {
        stageIndex = index + 1;
      } else {
        break;
      }
    }
    plot.stage = farmStageNames[Math.min(stageIndex, farmStageNames.length - 1)];
    if (plot.stage === "\u6210\u719F") {
      plot.status = "\u5DF2\u6210\u719F";
      return;
    }
    if (plot.status === "\u67AF\u840E") return;
    if (plot.nextEventAt && now >= plot.nextEventAt && plot.status === "\u5DF2\u64AD\u79CD") {
      plot.status = Math.random() > 0.5 ? "\u5E72\u71E5" : "\u751F\u866B";
      plot.nextEventAt = now + 24e3;
    }
    if (plot.status !== "\u5E72\u71E5" && plot.status !== "\u751F\u866B") {
      plot.status = "\u5DF2\u64AD\u79CD";
    }
  }
  function farmPlotActionLabel(plot) {
    if (!plot.unlocked) return "\u89E3\u9501\u571F\u5730";
    if (plot.status === "\u8352\u5E9F" || plot.status === "\u67AF\u840E") return plot.status === "\u67AF\u840E" ? "\u6E05\u7406\u67AF\u840E" : "\u7FFB\u571F";
    if (plot.status === "\u5DF2\u7FFB\u571F") return "\u7B49\u5F85\u64AD\u79CD";
    if (plot.status === "\u5E72\u71E5") return "\u9700\u8981\u6D47\u6C34";
    if (plot.status === "\u751F\u866B") return "\u9700\u8981\u9664\u866B";
    if (plot.status === "\u5DF2\u6210\u719F") return "\u53EF\u4EE5\u6536\u83B7";
    return `${plot.stage ?? "\u79CD\u5B50"} \u751F\u957F\u4E2D`;
  }
  function renderFarmGrid() {
    if (!farmGrid) return;
    farmSave.plots.forEach((plot) => syncFarmPlot(plot));
    farmGrid.innerHTML = farmSave.plots.map((plot) => {
      const crop = plot.crop ? cropDefinitions[plot.crop] : void 0;
      const selected = plot.id === farmSelectedPlot ? "is-selected" : "";
      const locked = plot.unlocked ? "" : "is-locked";
      const statusClass = plot.status.replace(/[^\u4e00-\u9fa5a-z]/g, "");
      const plantClass = crop ? `farm-plant--${plot.crop}` : "";
      return `
        <button class="farm-plot ${selected} ${locked} farm-plot--${statusClass}" type="button" data-farm-plot="${plot.id}">
          <span class="farm-plot__soil"></span>
          ${plot.unlocked ? `<span class="farm-plant ${plantClass}" style="--crop-color:${crop?.color ?? "transparent"}"></span>` : `<span class="farm-plot__lock">\u{1F512}</span>`}
          <span class="farm-plot__crop">${crop?.name ?? (plot.unlocked ? "\u7A7A\u571F\u5730" : "\u5F85\u89E3\u9501")}</span>
          <span class="farm-plot__stage">${farmPlotActionLabel(plot)}</span>
          ${plot.status === "\u751F\u866B" ? `<span class="farm-plot__alert">\u866B</span>` : ""}
          ${plot.status === "\u5E72\u71E5" ? `<span class="farm-plot__alert">\u65F1</span>` : ""}
        </button>
      `;
    }).join("");
  }
  function renderFarmHud() {
    if (!farmHud) return;
    const seedCount = (farmSave.inventory.wheatSeed ?? 0) + (farmSave.inventory.roseSeed ?? 0) + (farmSave.inventory.pumpkinSeed ?? 0);
    farmHud.innerHTML = `
    <div class="farm-stat"><span>\u91D1\u5E01</span><strong>\u{1FA99} ${farmSave.coins}</strong></div>
    <div class="farm-stat"><span>\u7ECF\u9A8C</span><strong>Lv.${farmSave.level} \xB7 ${farmSave.experience} XP</strong></div>
    <div class="farm-stat"><span>\u79CD\u5B50</span><strong>${seedCount}</strong></div>
    <div class="farm-stat"><span>\u571F\u5730</span><strong>${farmSave.plots.filter((plot) => plot.unlocked).length}/${farmSave.plots.length}</strong></div>
  `;
  }
  function renderFarmTools() {
    const plot = farmSave.plots[farmSelectedPlot];
    if (!plot) return "";
    const actionButtons = [];
    if (!plot.unlocked) {
      actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="unlock">\u{1FA99} \u89E3\u9501\u571F\u5730\uFF08${60 + plot.id * 20}\uFF09</button>`);
    } else if (plot.status === "\u8352\u5E9F" || plot.status === "\u67AF\u840E") {
      actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="${plot.status === "\u67AF\u840E" ? "clear" : "till"}">${plot.status === "\u67AF\u840E" ? "\u{1F9F9} \u6E05\u7406\u67AF\u840E" : "\u26CF \u7FFB\u571F"}</button>`);
    } else if (plot.status === "\u5DF2\u7FFB\u571F") {
      actionButtons.push(...["wheat", "rose", "pumpkin"].map((kind) => {
        const crop = cropDefinitions[kind];
        const count = farmSave.inventory[`${kind}Seed`] ?? 0;
        return `<button class="farm-action" data-farm-action="plant" data-crop="${kind}" ${count < 1 ? "disabled" : ""}>\u{1F331} ${crop.name} \xB7 ${crop.seedPrice}\u5E01 \xB7 ${count}\u9897</button>`;
      }));
    } else {
      if (plot.status === "\u5E72\u71E5") actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="water">\u{1F4A7} \u6D47\u6C34</button>`);
      if (plot.status === "\u751F\u866B") {
        actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="pesticide">\u{1F9EA} \u9664\u866B</button>`);
        actionButtons.push(`<button class="farm-action" data-farm-action="weed">\u{1F33F} \u9664\u8349</button>`);
      }
      if (plot.crop && plot.status !== "\u5DF2\u6210\u719F") {
        actionButtons.push(`<button class="farm-action" data-farm-action="fertilize" ${(farmSave.inventory.fertilizer ?? 0) < 1 ? "disabled" : ""}>\u26A1 \u5316\u80A5\uFF08${farmSave.inventory.fertilizer ?? 0}\uFF09</button>`);
      }
      if (plot.status === "\u5DF2\u6210\u719F") actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="harvest">\u{1F9FA} \u6536\u83B7</button>`);
    }
    return `
    <div class="farm-panel__title">\u571F\u5730 ${plot.id + 1} \xB7 ${plot.status}</div>
    <p class="farm-panel__muted">${plot.crop ? `${cropDefinitions[plot.crop].name} \xB7 ${plot.stage ?? "\u79CD\u5B50"}` : "\u8FD9\u5757\u571F\u5730\u8FD8\u6CA1\u6709\u4F5C\u7269\u3002"}</p>
    <div class="farm-action-list">${actionButtons.join("")}</div>
  `;
  }
  function renderFarmPanel() {
    if (!farmPanelContent) return;
    if (farmPanel === "tools") {
      farmPanelContent.innerHTML = renderFarmTools();
    } else if (farmPanel === "shop") {
      farmPanelContent.innerHTML = `
      <div class="farm-panel__title">\u6000\u65E7\u519C\u573A\u5546\u5E97</div>
      <div class="farm-shop-list">
        ${["wheat", "rose", "pumpkin"].map((kind) => {
        const crop = cropDefinitions[kind];
        return `<button class="farm-shop-item" data-farm-action="buy-seed" data-crop="${kind}"><span>\u{1F331} ${crop.name}\u79CD\u5B50</span><strong>${crop.seedPrice}\u5E01</strong></button>`;
      }).join("")}
        <button class="farm-shop-item" data-farm-action="buy-item" data-item="fertilizer"><span>\u26A1 \u5316\u80A5</span><strong>18\u5E01</strong></button>
        <button class="farm-shop-item" data-farm-action="buy-item" data-item="pesticide"><span>\u{1F9EA} \u519C\u836F</span><strong>22\u5E01</strong></button>
      </div>
    `;
    } else if (farmPanel === "storage") {
      const items = ["wheat", "rose", "pumpkin"].map((kind) => {
        const crop = cropDefinitions[kind];
        const amount = farmSave.inventory[kind] ?? 0;
        return `<div class="farm-storage-row"><span>${crop.name}\u679C\u5B9E \xD7 ${amount}</span><button class="farm-action" data-farm-action="sell" data-crop="${kind}" ${amount < 1 ? "disabled" : ""}>\u51FA\u552E +${crop.sellPrice}\u5E01</button></div>`;
      }).join("");
      farmPanelContent.innerHTML = `
      <div class="farm-panel__title">\u6211\u7684\u4ED3\u5E93</div>
      ${items}
      <div class="farm-inventory-note">\u79CD\u5B50\uFF1A\u5C0F\u9EA6 ${farmSave.inventory.wheatSeed ?? 0} \xB7 \u73AB\u7470 ${farmSave.inventory.roseSeed ?? 0} \xB7 \u5357\u74DC ${farmSave.inventory.pumpkinSeed ?? 0}</div>
      <div class="farm-inventory-note">\u9053\u5177\uFF1A\u5316\u80A5 ${farmSave.inventory.fertilizer ?? 0} \xB7 \u519C\u836F ${farmSave.inventory.pesticide ?? 0}</div>
    `;
    } else {
      farmPanelContent.innerHTML = `
      <div class="farm-panel__title">\u597D\u53CB\u519C\u573A</div>
      <div class="farm-friend-list">
        ${farmSave.friends.map((friend) => `
          <div class="farm-friend">
            <div><strong>${friend.name}</strong><span class="${friend.online ? "is-online" : "is-offline"}">${friend.online ? "\u5728\u7EBF" : "\u79BB\u7EBF"}</span><small>${friend.status}</small></div>
            <div class="farm-friend__actions">
              <button class="farm-action" data-farm-action="help" data-friend="${friend.id}" ${friend.needsHelp ? "" : "disabled"}>\u5E2E\u5E2E</button>
              <button class="farm-action" data-farm-action="steal" data-friend="${friend.id}" ${friend.mature && friend.stolenRatio < 0.4 ? "" : "disabled"}>\u5077\u83DC</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    }
  }
  function updateFarmUI() {
    farmSave.plots.forEach((plot) => syncFarmPlot(plot));
    renderFarmGrid();
    renderFarmHud();
    renderFarmPanel();
    saveFarm();
  }
  function farmMessage(message) {
    if (farmStatus) farmStatus.textContent = message;
    showToast(message);
  }
  function handleFarmAction(target) {
    const action = target.dataset.farmAction;
    const plot = farmSave.plots[farmSelectedPlot];
    const now = Date.now();
    if (!action) return;
    if (plot) syncFarmPlot(plot, now);
    if (action === "till" && plot?.unlocked && (plot.status === "\u8352\u5E9F" || plot.status === "\u67AF\u840E")) {
      plot.status = "\u5DF2\u7FFB\u571F";
      plot.crop = void 0;
      plot.stage = void 0;
      farmMessage("\u571F\u5730\u7FFB\u597D\u4E86\uFF0C\u9009\u62E9\u4E00\u79CD\u79CD\u5B50\u5427\u3002");
    } else if (action === "clear" && plot?.status === "\u67AF\u840E") {
      plot.status = "\u5DF2\u7FFB\u571F";
      plot.crop = void 0;
      plot.stage = void 0;
      farmMessage("\u67AF\u840E\u4F5C\u7269\u5DF2\u6E05\u7406\u3002");
    } else if (action === "plant" && plot?.status === "\u5DF2\u7FFB\u571F") {
      const kind = target.dataset.crop;
      const seedKey = `${kind}Seed`;
      if ((farmSave.inventory[seedKey] ?? 0) < 1) return farmMessage("\u4ED3\u5E93\u91CC\u6CA1\u6709\u8FD9\u79CD\u79CD\u5B50\u3002");
      farmSave.inventory[seedKey] -= 1;
      plot.crop = kind;
      plot.stage = "\u79CD\u5B50";
      plot.status = "\u5DF2\u64AD\u79CD";
      plot.plantedAt = now;
      plot.nextEventAt = now + 18e3;
      farmMessage(`\u5DF2\u64AD\u79CD${cropDefinitions[kind].name}\uFF0C\u8BB0\u5F97\u56DE\u6765\u7167\u6599\u3002`);
    } else if (action === "water" && plot?.status === "\u5E72\u71E5") {
      plot.status = "\u5DF2\u64AD\u79CD";
      plot.wateredAt = now;
      plot.nextEventAt = now + 22e3;
      gainFarmExperience(4);
      farmMessage("\u6D47\u6C34\u6210\u529F\uFF0C\u4F5C\u7269\u6062\u590D\u751F\u957F\u3002");
    } else if (action === "pesticide" && plot?.status === "\u751F\u866B") {
      if ((farmSave.inventory.pesticide ?? 0) < 1) return farmMessage("\u519C\u836F\u7528\u5B8C\u4E86\uFF0C\u8BF7\u53BB\u5546\u5E97\u8865\u5145\u3002");
      farmSave.inventory.pesticide -= 1;
      plot.status = "\u5DF2\u64AD\u79CD";
      plot.nextEventAt = now + 22e3;
      gainFarmExperience(6);
      farmMessage("\u5BB3\u866B\u5DF2\u6E05\u9664\uFF0C\u83B7\u5F97 6 \u70B9\u7ECF\u9A8C\u3002");
    } else if (action === "weed" && plot?.status === "\u751F\u866B") {
      plot.status = "\u5DF2\u64AD\u79CD";
      plot.nextEventAt = now + 18e3;
      gainFarmExperience(3);
      farmMessage("\u6742\u8349\u6E05\u7406\u5B8C\u6BD5\uFF0C\u83B7\u5F97 3 \u70B9\u7ECF\u9A8C\u3002");
    } else if (action === "fertilize" && plot?.crop && plot.status !== "\u5DF2\u6210\u719F") {
      if ((farmSave.inventory.fertilizer ?? 0) < 1) return farmMessage("\u5316\u80A5\u7528\u5B8C\u4E86\uFF0C\u8BF7\u53BB\u5546\u5E97\u8865\u5145\u3002");
      farmSave.inventory.fertilizer -= 1;
      plot.plantedAt = (plot.plantedAt ?? now) - 8e3;
      farmMessage("\u5316\u80A5\u751F\u6548\uFF0C\u6210\u957F\u65F6\u95F4\u7F29\u77ED\u3002");
    } else if (action === "harvest" && plot?.crop && plot.status === "\u5DF2\u6210\u719F") {
      const crop = cropDefinitions[plot.crop];
      const amount = Math.max(1, Math.floor(crop.yield * (1 - plot.stolenRatio)));
      farmSave.inventory[plot.crop] = (farmSave.inventory[plot.crop] ?? 0) + amount;
      gainFarmExperience(12);
      plot.status = "\u8352\u5E9F";
      plot.crop = void 0;
      plot.stage = void 0;
      plot.plantedAt = void 0;
      plot.nextEventAt = void 0;
      plot.stolenRatio = 0;
      farmMessage(`\u6536\u83B7 ${crop.name} \xD7 ${amount}\uFF0C\u83B7\u5F97 12 \u70B9\u7ECF\u9A8C\u3002`);
    } else if (action === "unlock" && plot && !plot.unlocked) {
      const cost = 60 + plot.id * 20;
      if (farmSave.coins < cost) return farmMessage("\u91D1\u5E01\u4E0D\u8DB3\uFF0C\u5148\u5356\u51FA\u4E00\u4E9B\u679C\u5B9E\u5427\u3002");
      farmSave.coins -= cost;
      plot.unlocked = true;
      farmMessage(`\u571F\u5730 ${plot.id + 1} \u5DF2\u89E3\u9501\u3002`);
    } else if (action === "buy-seed") {
      const kind = target.dataset.crop;
      const crop = cropDefinitions[kind];
      if (farmSave.coins < crop.seedPrice) return farmMessage("\u91D1\u5E01\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u8D2D\u4E70\u3002");
      farmSave.coins -= crop.seedPrice;
      farmSave.inventory[`${kind}Seed`] = (farmSave.inventory[`${kind}Seed`] ?? 0) + 1;
      farmMessage(`\u5DF2\u8D2D\u4E70 ${crop.name}\u79CD\u5B50\u3002`);
    } else if (action === "buy-item") {
      const item = target.dataset.item ?? "";
      const price = item === "fertilizer" ? 18 : 22;
      if (farmSave.coins < price) return farmMessage("\u91D1\u5E01\u4E0D\u8DB3\uFF0C\u65E0\u6CD5\u8D2D\u4E70\u3002");
      farmSave.coins -= price;
      farmSave.inventory[item] = (farmSave.inventory[item] ?? 0) + 1;
      farmMessage(`\u5DF2\u8D2D\u4E70 ${item === "fertilizer" ? "\u5316\u80A5" : "\u519C\u836F"}\u3002`);
    } else if (action === "sell") {
      const kind = target.dataset.crop;
      if ((farmSave.inventory[kind] ?? 0) < 1) return farmMessage("\u4ED3\u5E93\u91CC\u6CA1\u6709\u53EF\u51FA\u552E\u7684\u679C\u5B9E\u3002");
      farmSave.inventory[kind] -= 1;
      farmSave.coins += cropDefinitions[kind].sellPrice;
      farmMessage(`\u5DF2\u51FA\u552E 1 \u4E2A${cropDefinitions[kind].name}\u679C\u5B9E\u3002`);
    } else if (action === "help") {
      const friend = farmSave.friends.find((item) => item.id === target.dataset.friend);
      if (!friend || !friend.needsHelp) return farmMessage("\u8FD9\u4F4D\u597D\u53CB\u6682\u65F6\u4E0D\u9700\u8981\u5E2E\u52A9\u3002");
      friend.needsHelp = false;
      gainFarmExperience(10);
      farmMessage(`\u5E2E\u52A9 ${friend.name} \u5B8C\u6210\u519C\u573A\u7167\u6599\uFF0C\u83B7\u5F97 10 \u70B9\u7ECF\u9A8C\u3002`);
    } else if (action === "steal") {
      const friend = farmSave.friends.find((item) => item.id === target.dataset.friend);
      if (!friend || !friend.mature || friend.stolenRatio >= 0.4) return farmMessage("\u8FD9\u5757\u4F5C\u7269\u5DF2\u7ECF\u88AB\u5077\u5149\u4E86\u3002");
      friend.stolenRatio = Math.min(0.4, friend.stolenRatio + 0.1);
      const kind = friend.id === "tutu" ? "pumpkin" : "rose";
      farmSave.inventory[kind] = (farmSave.inventory[kind] ?? 0) + 1;
      farmMessage(`\u4ECE ${friend.name} \u7684\u519C\u573A\u5077\u5230 1 \u4E2A\u679C\u5B9E\u3002`);
    }
    updateFarmUI();
  }
  async function submitLogin() {
    if (state.unlocked) return;
    const account = accountInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    const remember = rememberInput?.checked ?? true;
    state.loginAccount = account;
    state.loginPassword = password;
    state.rememberAccount = remember;
    if (!account || !password) {
      if (loginStatus) loginStatus.textContent = "\u8D26\u53F7\u548C\u5BC6\u7801\u90FD\u8981\u586B\u4E0A\uFF0C\u624D\u80FD\u767B\u5165\u8BB0\u5FC6\u3002";
      showToast("\u8BF7\u5148\u8F93\u5165\u8D26\u53F7\u548C\u5BC6\u7801");
      return;
    }
    if (account.length < 4 || password.length < 4) {
      if (loginStatus) loginStatus.textContent = "\u8D26\u53F7\u6216\u5BC6\u7801\u592A\u77ED\u4E86\uFF0C\u518D\u8BA4\u771F\u4E00\u70B9\u3002";
      showToast("\u767B\u5F55\u4FE1\u606F\u4E0D\u5B8C\u6574");
      return;
    }
    if (remember) {
      localStorage.setItem("houhuiwuci:account", account);
    } else {
      localStorage.removeItem("houhuiwuci:account");
    }
    state.unlocked = true;
    sound.playOnlineCue();
    await sound.startMusic();
    introReveal?.classList.add("is-visible");
    introLoginButton?.classList.add("is-pressed");
    if (loginStatus) {
      loginStatus.textContent = `\u6B22\u8FCE\u56DE\u6765\uFF0C${account}\u3002\u6B63\u5728\u767B\u5165\u8BB0\u5FC6...`;
    }
    showToast("\u5600\u5600\u5600\u55D2\uFF0C\u8BB0\u5FC6\u5DF2\u4E0A\u7EBF");
    window.setTimeout(() => scrollToScene("farm"), 1300);
  }
  var showToastTimer = 0;
  function scrollToScene(id) {
    const target = sections.get(id);
    if (!target) return;
    if (storyElement) {
      storyElement.scrollTo({
        top: target.offsetTop,
        behavior: reduceMotion ? "auto" : "smooth"
      });
      return;
    }
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  function updateProgress() {
    document.querySelectorAll("[data-progress-dot]").forEach((dot) => {
      const id = dot.dataset.progressDot;
      dot.classList.toggle("is-active", id === state.activeScene);
      dot.classList.toggle("is-done", sceneIds.indexOf(id ?? "intro") < sceneIds.indexOf(state.activeScene));
    });
    document.querySelectorAll("[data-scene]").forEach((section) => {
      const id = section.dataset.scene;
      section.classList.toggle("is-active", id === state.activeScene);
    });
    document.querySelectorAll("[data-jump]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.jump === state.activeScene);
    });
  }
  function setActiveScene(id) {
    if (state.activeScene === id) return;
    const previousScene = state.activeScene;
    state.activeScene = id;
    if (id === "dance" && previousScene !== "dance") {
      resetDanceSession();
    }
    updateProgress();
  }
  var observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const id = visible.target.getAttribute("data-scene");
      if (id) setActiveScene(id);
    },
    {
      root: storyElement,
      threshold: [0.52, 0.66, 0.8]
    }
  );
  sections.forEach((el) => observer.observe(el));
  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.jump;
      scrollToScene(id);
    });
  });
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitLogin();
  });
  introLoginButton?.addEventListener("click", async () => {
    await submitLogin();
  });
  farmGrid?.addEventListener("click", (event) => {
    if (state.activeScene !== "farm") return;
    const target = event.target.closest("[data-farm-plot]");
    if (!target) return;
    farmSelectedPlot = Number(target.dataset.farmPlot ?? 0);
    farmPanel = "tools";
    document.querySelectorAll("[data-farm-panel]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.farmPanel === farmPanel);
    });
    updateFarmUI();
  });
  document.querySelectorAll("[data-farm-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      farmPanel = button.dataset.farmPanel;
      document.querySelectorAll("[data-farm-panel]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderFarmPanel();
    });
  });
  farmPanelContent?.addEventListener("click", (event) => {
    if (state.activeScene !== "farm") return;
    const target = event.target.closest("[data-farm-action]");
    if (target) handleFarmAction(target);
  });
  farmLeaveButton?.addEventListener("click", () => {
    scrollToScene("race");
  });
  window.addEventListener("keydown", (event) => {
    if (state.activeScene === "race" && (event.key === "ArrowUp" || event.key.toLowerCase() === "w")) {
      raceStarted = true;
      state.raceHolding = true;
      raceBoostUntil = performance.now() + 650;
      event.preventDefault();
    }
    if (state.activeScene === "dance") {
      handleDanceInput(event);
    }
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
      state.raceHolding = false;
    }
    if (state.activeScene === "dance") {
      releaseDanceHold(normalizeKey(event.key), performance.now());
    }
  });
  function handleDanceInput(event) {
    if (state.danceFinished) return;
    const key = normalizeKey(event.key);
    if (["\u2190", "\u2191", "\u2193", "\u2192", "Space"].includes(key)) {
      event.preventDefault();
    }
    resolveDanceInput(key);
  }
  function finishDanceSession(now) {
    if (state.danceFinished) return;
    state.danceFinished = true;
    const accuracy = state.danceHits / danceNotesState.length;
    state.danceRating = accuracy >= 1 ? "S" : accuracy >= 0.8 ? "A" : accuracy >= 0.6 ? "B" : accuracy >= 0.5 ? "C" : "D";
    danceStage?.classList.add(state.danceRating === "S" ? "is-perfect" : "is-cleared");
    danceScrollAdvanceAt = now + 2200;
    updateDancePrompt(`RATING ${state.danceRating}`);
    showToast(`\u6700\u7EC8\u8BC4\u7EA7 ${state.danceRating} \xB7 \u6B63\u786E\u7387 ${Math.round(accuracy * 100)}%`);
  }
  function resolveDanceInput(key) {
    if (state.activeScene !== "dance" || state.danceFinished) return;
    const note = danceNotesState[state.danceIndex];
    if (!note || note.hit || note.miss) return;
    const now = performance.now();
    const progress = getDanceNoteProgress(note, now);
    const judgement = getDanceJudgement(progress);
    if (key !== note.key || judgement === "Miss") {
      missDanceNote(now);
      return;
    }
    if (note.type === "hold") {
      note.holdStarted = true;
      danceHeldKey = key;
      state.danceLastJudgement = judgement;
      updateDancePrompt(judgement);
      return;
    }
    completeDanceNote(note, judgement, now);
  }
  function getDanceJudgement(progress) {
    const distance = Math.abs(progress - 0.82);
    if (distance <= 0.06) return "Perfect";
    if (distance <= 0.14) return "Great";
    if (distance <= 0.24) return "Good";
    if (distance <= 0.34) return "Bad";
    return "Miss";
  }
  function completeDanceNote(note, judgement, now) {
    if (note.hit || note.miss) return;
    note.hit = true;
    state.danceHits += 1;
    danceCombo += judgement === "Perfect" ? 1 : 0;
    if (judgement !== "Perfect") danceCombo = 0;
    const baseScore = judgement === "Perfect" ? 1e3 : judgement === "Great" ? 700 : judgement === "Good" ? 450 : 200;
    const multiplier = state.danceShowTime ? 2 : 1;
    const comboBonus = judgement === "Perfect" && danceCombo > 1 ? danceCombo * 100 : 0;
    state.danceScore += baseScore * multiplier + comboBonus;
    state.danceLastJudgement = judgement;
    state.danceIndex += 1;
    if (danceCombo >= 10 && !state.danceShowTime) {
      state.danceShowTime = true;
      danceStage?.classList.add("is-showtime");
      showToast("ShowTime \xB7 \u5F97\u5206\u7FFB\u500D");
    }
    danceStage?.classList.add(judgement === "Perfect" ? "is-perfect" : "is-hit");
    window.setTimeout(() => danceStage?.classList.remove("is-hit", "is-perfect"), 260);
    if (judgement === "Perfect") sound.playPerfectCue();
    else sound.playBoostCue();
    showDanceFeedback(judgement, comboBonus);
    updateDancePrompt(judgement);
    if (state.danceIndex >= danceNotesState.length) {
      finishDanceSession(now);
    }
  }
  function missDanceNote(now) {
    const note = danceNotesState[state.danceIndex];
    if (!note || note.hit || note.miss) return;
    note.miss = true;
    note.holdStarted = false;
    danceHeldKey = "";
    danceCombo = 0;
    state.danceLastJudgement = "Miss";
    sound.playFailCue();
    showDanceFeedback("Miss");
    danceStage?.classList.add("is-miss");
    window.setTimeout(() => danceStage?.classList.remove("is-miss"), 180);
    state.danceIndex += 1;
    updateDancePrompt("Miss");
    if (state.danceIndex >= danceNotesState.length) finishDanceSession(now);
  }
  function releaseDanceHold(key, now) {
    const note = danceNotesState[state.danceIndex];
    if (!note || note.type !== "hold" || !note.holdStarted || note.key !== key) return;
    const progress = getDanceNoteProgress(note, now);
    if (progress >= 1 + note.duration / 1500) {
      completeDanceNote(note, "Perfect", now);
    } else {
      missDanceNote(now);
    }
    danceHeldKey = "";
  }
  function showDanceFeedback(judgement, comboBonus = 0) {
    if (!danceFeedback) return;
    danceFeedback.className = `dance-feedback dance-feedback--${judgement.toLowerCase()}`;
    danceFeedback.innerHTML = `
    <strong>${judgement}</strong>
    ${comboBonus > 0 ? `<span>Combo +${comboBonus}</span>` : ""}
  `;
    danceFeedback.classList.remove("is-visible");
    requestAnimationFrame(() => danceFeedback.classList.add("is-visible"));
    window.setTimeout(() => danceFeedback.classList.remove("is-visible"), 760);
  }
  function normalizeKey(key) {
    if (key === " ") return "Space";
    if (key === "ArrowLeft") return "\u2190";
    if (key === "ArrowUp") return "\u2191";
    if (key === "ArrowDown") return "\u2193";
    if (key === "ArrowRight") return "\u2192";
    return key.toLowerCase();
  }
  function updateDancePrompt(feedback = "") {
    if (!dancePrompt) return;
    const accuracy = danceNotesState.length ? Math.round(state.danceHits / danceNotesState.length * 100) : 0;
    const chartNote = danceChart[state.danceIndex];
    const next = danceNotesState[state.danceIndex]?.key ?? "\u5B8C\u7F8E\uFF01";
    const stateLabel = feedback || (state.danceFinished ? "PERFECT" : "\u51C6\u5907");
    dancePrompt.innerHTML = `
    <div class="dance-current">${next}</div>
    <div class="dance-score">
      <span>${state.danceLastJudgement || "READY"} \xB7 Score ${state.danceScore} \xB7 ${state.danceShowTime ? "SHOWTIME x2" : "\u500D\u7387 x1"}</span>
      <strong>\u8BC4\u7EA7 ${state.danceRating || "--"} \xB7 \u6B63\u786E\u7387 ${accuracy}%</strong>
      <small>\u8282\u62CD ${Math.min(state.danceIndex + 1, danceChart.length)} / ${danceChart.length} \xB7 ${chartNote?.phase ?? "finale"} \xB7 \u7EA6 1 \u5206\u949F</small>
      <span>\u5224\u5B9A ${stateLabel}</span>
    <strong>\u8FDE\u51FB ${danceCombo}</strong>
  </div>
  `;
  }
  function resetDanceSession() {
    state.danceIndex = 0;
    state.danceFinished = false;
    state.danceHits = 0;
    state.danceRating = "";
    state.danceShowTime = false;
    state.danceScore = 0;
    state.danceLastJudgement = "";
    danceCombo = 0;
    danceScrollAdvanceAt = 0;
    danceHeldKey = "";
    danceGestureStart = null;
    danceSessionStart = performance.now() + 700;
    danceNotesState = danceChart.map((chartNote, index) => {
      const type = index % 11 === 3 ? "hold" : index % 13 === 7 ? "slide" : "tap";
      return {
        key: chartNote.key,
        lane: danceKeyToLane(chartNote.key),
        spawnAt: danceChart.slice(0, index).reduce((total, item) => total + item.interval, 0),
        type,
        duration: type === "hold" ? 900 : 0,
        holdStarted: false,
        hit: false,
        miss: false
      };
    });
    danceStage?.classList.remove("is-perfect", "is-cleared", "is-hit", "is-miss", "is-showtime");
    updateDancePrompt("READY");
  }
  function danceKeyToLane(key) {
    if (key === "\u2190") return 0;
    if (key === "\u2191") return 1;
    if (key === "\u2193") return 2;
    if (key === "\u2192") return 3;
    return 1.5;
  }
  function getDanceNoteProgress(note, now) {
    const travelMs = 1500;
    return (now - danceSessionStart - note.spawnAt) / travelMs;
  }
  function updateDanceBoard(now) {
    if (state.activeScene !== "dance" || !danceNotes || !danceBoard) return;
    const elapsed = now - danceSessionStart;
    if (elapsed < 0) {
      danceNotes.innerHTML = "";
      updateDancePrompt("READY");
      return;
    }
    const currentNote = danceNotesState[state.danceIndex];
    if (currentNote && !currentNote.hit && !currentNote.miss) {
      const progress = getDanceNoteProgress(currentNote, now);
      if (currentNote.type === "hold" && currentNote.holdStarted) {
        if (progress >= 1 + currentNote.duration / 1500 && danceHeldKey === currentNote.key) {
          completeDanceNote(currentNote, "Perfect", now);
        }
      } else if (progress > 1.14) {
        missDanceNote(now);
      }
    }
    danceNotes.innerHTML = danceNotesState.map((note, index) => {
      const progress = getDanceNoteProgress(note, now);
      const visible = progress > -0.2 && progress < 1.28;
      const top = 86 - Math.max(0, Math.min(1.2, progress)) * 48;
      const left = note.key === "Space" ? 50 : 12.5 + note.lane * 25;
      const current = index === state.danceIndex && !note.hit && !note.miss;
      const stateClass = note.hit ? "is-hit" : note.miss ? "is-miss" : current ? "is-active" : "";
      const spaceClass = note.key === "Space" ? "dance-note--space" : "";
      const typeClass = `dance-note--${note.type}`;
      const noteHeight = note.type === "hold" ? Math.max(9, note.duration / 1500 * 48) : 0;
      const label = note.type === "hold" ? `${note.key} \u2195` : note.type === "slide" ? `${note.key} \u21E2` : note.key;
      return `
        <button
          class="dance-note ${stateClass} ${spaceClass} ${typeClass}"
          type="button"
          data-dance-hit="${note.key}"
          data-dance-type="${note.type}"
          style="left:${left}%; top:${top}%; height:${noteHeight ? `${noteHeight}%` : "3.2rem"}; opacity:${visible ? 1 : 0}"
          aria-label="\u8282\u594F\u952E ${label}"
        >${label}</button>
      `;
    }).join("");
    if (state.danceFinished && danceScrollAdvanceAt > 0 && now > danceScrollAdvanceAt) {
      danceScrollAdvanceAt = 0;
      scrollToScene("memory");
    }
  }
  danceRail?.addEventListener("click", (event) => {
    if (state.activeScene !== "dance") return;
    const target = event.target.closest("[data-dance-hit]");
    if (!target) return;
    resolveDanceInput(target.dataset.danceHit ?? "");
  });
  danceBoard?.addEventListener("click", (event) => {
    if (state.activeScene !== "dance") return;
    const target = event.target.closest("[data-dance-hit]");
    if (!target) return;
    if (target.dataset.danceType === "hold" || target.dataset.danceType === "slide") return;
    resolveDanceInput(target.dataset.danceHit ?? "");
  });
  danceBoard?.addEventListener("pointerdown", (event) => {
    if (state.activeScene !== "dance") return;
    const target = event.target.closest("[data-dance-hit]");
    const key = target?.dataset.danceHit;
    if (!target || !key) return;
    danceGestureStart = { x: event.clientX, y: event.clientY, key };
    if (target.dataset.danceType === "hold") {
      resolveDanceInput(key);
    }
  });
  danceBoard?.addEventListener("pointerup", (event) => {
    if (state.activeScene !== "dance" || !danceGestureStart) return;
    const gesture = danceGestureStart;
    danceGestureStart = null;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    const current = danceNotesState[state.danceIndex];
    if (current?.type === "slide") {
      const direction = Math.abs(dx) >= Math.abs(dy) ? dx < 0 ? "\u2190" : "\u2192" : dy < 0 ? "\u2191" : "\u2193";
      if (direction !== current.key || Math.hypot(dx, dy) < 24) {
        missDanceNote(performance.now());
        return;
      }
      resolveDanceInput(direction);
    } else {
      releaseDanceHold(gesture.key, performance.now());
    }
  });
  danceRail?.addEventListener("pointerdown", (event) => {
    if (state.activeScene !== "dance") return;
    const target = event.target.closest("[data-dance-hit]");
    if (!target) return;
    const key = target.dataset.danceHit ?? "";
    danceHeldKey = key;
    resolveDanceInput(key);
  });
  danceRail?.addEventListener("pointerup", () => {
    if (state.activeScene !== "dance") return;
    releaseDanceHold(danceHeldKey, performance.now());
  });
  raceStage?.addEventListener("pointerdown", () => {
    if (state.activeScene !== "race") return;
    raceStarted = true;
    state.raceHolding = true;
    raceBoostUntil = performance.now() + 650;
  });
  raceAccelerator?.addEventListener("pointerdown", (event) => {
    if (state.activeScene !== "race") return;
    event.preventDefault();
    raceStarted = true;
    state.raceHolding = true;
    raceBoostUntil = performance.now() + 650;
  });
  raceAccelerator?.addEventListener("pointerup", () => {
    state.raceHolding = false;
  });
  raceAccelerator?.addEventListener("pointercancel", () => {
    state.raceHolding = false;
  });
  window.addEventListener("pointerup", () => {
    state.raceHolding = false;
  });
  window.addEventListener("pointercancel", () => {
    state.raceHolding = false;
  });
  function updateFarmRain() {
    if (!farmRain) return;
    if (state.activeScene !== "farm") {
      farmRain.innerHTML = "";
      return;
    }
    if (farmRain.children.length === 0) {
      const count = reduceMotion ? 14 : 34;
      for (let i = 0; i < count; i += 1) {
        const drop = document.createElement("i");
        drop.className = "rain-drop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.8 + Math.random() * 0.7}s`;
        drop.style.animationDelay = `${Math.random() * 1.5}s`;
        drop.style.height = `${18 + Math.random() * 26}px`;
        farmRain.append(drop);
      }
    }
  }
  function updateRace() {
    if (!raceCar || !raceTail || !raceMeter || !raceHint) return;
    if (state.activeScene !== "race") {
      state.raceHolding = false;
      state.raceSpeed = 0;
      if (!state.raceFinished) {
        state.raceDistance = 0;
        raceStarted = false;
        raceCar.style.setProperty("--race-x", "9%");
        raceTail.style.setProperty("--tail-x", "4%");
        raceMeter.style.transform = "scaleX(0.08)";
      }
      return;
    }
    if (!raceStarted) {
      state.raceSpeed = 0;
      raceHint.innerHTML = "\u6309\u4F4F <strong>\u2191 / W</strong>\uFF0C\u6216\u6309\u4F4F\u4E0B\u65B9\u52A0\u901F\u952E\uFF0C\u522B\u8BA9\u5C3E\u706F\u8DD1\u6389";
      raceCar.style.setProperty("--race-x", "9%");
      raceTail.style.setProperty("--tail-x", "4%");
      raceMeter.style.transform = "scaleX(0.08)";
      return;
    }
    const isBoosting = state.raceHolding || performance.now() < raceBoostUntil;
    const targetSpeed = isBoosting ? 1 : 0;
    state.raceSpeed += (targetSpeed - state.raceSpeed) * 0.08;
    state.raceDistance += state.raceSpeed * 3.1;
    const raceProgress = Math.min(1, state.raceDistance / 150);
    const carX = 9 + raceProgress * 82;
    const tailX = Math.max(4, carX - 8);
    raceCar.style.setProperty("--race-x", `${carX}%`);
    raceTail.style.setProperty("--tail-x", `${tailX}%`);
    raceMeter.style.transform = `scaleX(${Math.min(1, 0.08 + raceProgress * 0.92)})`;
    raceHint.innerHTML = state.raceDistance > 95 ? "\u5C3E\u706F\u59CB\u7EC8\u5728\u524D\u65B9\uFF0C\u50CF\u6709\u4E9B\u4EBA\u6C38\u8FDC\u8FFD\u4E0D\u4E0A" : "\u6309\u4F4F <strong>\u2191 / W</strong>\uFF0C\u6216\u6309\u4F4F\u4E0B\u65B9\u52A0\u901F\u952E";
    if (isBoosting && performance.now() > raceCueCooldown) {
      sound.playBoostCue();
      raceCueCooldown = performance.now() + 220;
    }
    if (state.raceDistance > 150 && !state.raceFinished) {
      state.raceFinished = true;
      raceNextAutoAdvance = performance.now() + 1200;
      showToast("\u653E\u4E0D\u4E0B\uFF0C\u7EC8\u70B9\u5C31\u5728\u773C\u524D\u53C8\u6162\u6162\u7184\u706B\u4E86");
    }
    if (state.raceFinished && performance.now() > raceNextAutoAdvance) {
      state.raceFinished = false;
      scrollToScene("dance");
    }
  }
  function initMemoryCanvas() {
    if (!memoryCanvas || !memoryScratch) return;
    const resize = () => {
      const rect = memoryCanvas.getBoundingClientRect();
      memoryCanvas.width = Math.round(rect.width * window.devicePixelRatio);
      memoryCanvas.height = Math.round(rect.height * window.devicePixelRatio);
      memoryScratch.width = memoryCanvas.width;
      memoryScratch.height = memoryCanvas.height;
    };
    const observer2 = new ResizeObserver(resize);
    observer2.observe(memoryCanvas);
    resize();
  }
  function drawMemoryCanvas() {
    if (!memoryCanvas || !memoryScratch) return;
    const ctx = memoryCanvas.getContext("2d");
    const veil = memoryScratch.getContext("2d");
    if (!ctx || !veil) return;
    const dpr = window.devicePixelRatio || 1;
    const tick = () => {
      if (state.activeScene === "memory") {
        const width = memoryCanvas.width;
        const height = memoryCanvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(9, 12, 20, 0.45)";
        ctx.fillRect(0, 0, width, height);
        veil.clearRect(0, 0, width, height);
        veil.fillStyle = "rgba(245, 247, 252, 0.84)";
        veil.fillRect(0, 0, width, height);
        veil.globalCompositeOperation = "destination-out";
        memoryBrushes.forEach((brush) => {
          veil.beginPath();
          veil.arc(brush.x * dpr, brush.y * dpr, brush.radius * dpr, 0, Math.PI * 2);
          veil.fill();
        });
        veil.globalCompositeOperation = "source-over";
        memoryBrushes.forEach((brush) => {
          brush.life -= 0.016;
        });
        while (memoryBrushes.length && memoryBrushes[0].life <= 0) {
          memoryBrushes.shift();
        }
      }
      animationFrame = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(tick);
  }
  function bindMemoryInteractions() {
    if (!memoryCanvas || !memoryScratch) return;
    const handlePointer = (event) => {
      if (state.activeScene !== "memory") return;
      const rect = memoryScratch.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      memoryBrushes.push({ x, y, radius: 72, life: 2.6 });
      state.memoryHits += 1;
      memoryHint?.classList.add("is-active");
      window.clearTimeout(instructionTimer);
      instructionTimer = window.setTimeout(() => memoryHint?.classList.remove("is-active"), 700);
      if (state.memoryHits >= 14 && !state.memoryFinished) {
        state.memoryFinished = true;
        window.clearTimeout(memoryAdvanceTimer);
        memoryAdvanceTimer = window.setTimeout(() => scrollToScene("finale"), 900);
      }
    };
    memoryScratch.addEventListener("pointermove", handlePointer);
    memoryScratch.addEventListener("pointerdown", handlePointer);
  }
  function bindFinale() {
    finaleHairpin?.addEventListener("click", () => {
      if (state.finaleOpen) return;
      state.finaleOpen = true;
      finaleHairpin.classList.add("is-picked");
      finaleGlowMessage?.classList.add("is-visible");
      sound.playOfflineCue();
      sound.stopMusic();
      finaleActions?.removeAttribute("hidden");
      finaleMessage?.classList.add("is-hidden");
      finaleMessage && (finaleMessage.textContent = "886\uFF0C\u6211\u4EEC\u6700\u7F8E\u7684\u9752\u6625\u3002");
      showToast("\u5594\u5537~");
    });
    replayButton?.addEventListener("click", () => window.location.reload());
    shareButton?.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "\u540E\u4F1A\u65E0\u671F \xB7 \u81F4\u656C\u9752\u6625",
        url: window.location.href
      };
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      showToast("\u94FE\u63A5\u5DF2\u590D\u5236");
    });
  }
  function loop() {
    updateFarmRain();
    if (state.activeScene === "farm") {
      renderFarmGrid();
      renderFarmHud();
    }
    updateRace();
    updateDanceBoard(performance.now());
    requestAnimationFrame(loop);
  }
  function updateMobileScrollAffordance() {
    document.body.classList.toggle("is-mobile", window.innerWidth < 860);
  }
  introReveal?.classList.remove("is-visible");
  if (accountInput) {
    accountInput.value = savedLoginAccount;
    state.loginAccount = savedLoginAccount;
  }
  if (rememberInput) {
    rememberInput.checked = true;
    state.rememberAccount = true;
  }
  updateDancePrompt();
  updateFarmUI();
  initMemoryCanvas();
  drawMemoryCanvas();
  bindMemoryInteractions();
  bindFinale();
  updateProgress();
  updateMobileScrollAffordance();
  window.addEventListener("resize", updateMobileScrollAffordance);
  loop();
})();
