import { SoundDirector } from "./audio";
import { danceChart, memoryNotes, scenes, type SceneId } from "./scenes";
import { cropDefinitions, farmFriends, type CropKind } from "./farm-data";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

const sound = new SoundDirector();
const sceneIds = scenes.map((scene) => scene.id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const savedLoginAccount = localStorage.getItem("houhuiwuci:account") ?? "";

type FarmLandStatus = "荒废" | "已翻土" | "已播种" | "干燥" | "生虫" | "已成熟" | "枯萎";
type CropStage = "种子" | "发芽" | "生长" | "开花" | "成熟";

interface FarmPlot {
  id: number;
  unlocked: boolean;
  status: FarmLandStatus;
  crop?: CropKind;
  stage?: CropStage;
  plantedAt?: number;
  wateredAt?: number;
  nextEventAt?: number;
  stolenRatio: number;
}

interface FarmFriend {
  id: string;
  name: string;
  online: boolean;
  status: string;
  mature: boolean;
  needsHelp: boolean;
  stolenRatio: number;
}

interface FarmSaveData {
  coins: number;
  experience: number;
  level: number;
  plots: FarmPlot[];
  inventory: Record<string, number>;
  friends: FarmFriend[];
  updatedAt: number;
}

const farmStorageKey = "houhuiwuci:farm:v1";
const farmStageNames: CropStage[] = ["种子", "发芽", "生长", "开花", "成熟"];

function createDefaultFarmSave(): FarmSaveData {
  return {
    coins: 100,
    experience: 0,
    level: 1,
    plots: Array.from({ length: 12 }, (_, id) => ({
      id,
      unlocked: id < 4,
      status: "荒废" as FarmLandStatus,
      stolenRatio: 0,
    })),
    inventory: {
      wheatSeed: 3,
      roseSeed: 1,
      pumpkinSeed: 0,
      wheat: 0,
      rose: 0,
      pumpkin: 0,
      fertilizer: 2,
      pesticide: 2,
    },
    friends: farmFriends.map((friend, index) => ({
      ...friend,
      mature: index === 2,
      needsHelp: index === 0,
      stolenRatio: index === 2 ? 0.2 : 0,
    })),
    updatedAt: Date.now(),
  };
}

function loadFarmSave(): FarmSaveData {
  try {
    const saved = JSON.parse(localStorage.getItem(farmStorageKey) ?? "null") as FarmSaveData | null;
    if (saved?.plots?.length && saved.inventory && saved.friends) {
      return saved;
    }
  } catch {
    // Fall through to a clean local demo save.
  }
  return createDefaultFarmSave();
}

let farmSave = loadFarmSave();
let farmSelectedPlot = 0;
let farmPanel = "tools" as "tools" | "shop" | "storage" | "friends";

const state = {
  activeScene: "intro" as SceneId,
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
  finaleOpen: false,
};

app.innerHTML = `
  <div class="site-shell">
    <header class="hud">
      <div class="hud__brand">
        <span class="hud__badge">后会无期</span>
        <div>
          <p class="hud__eyebrow">青春致敬音乐站</p>
          <h1>重返那年，后会无期</h1>
        </div>
      </div>
      <nav class="hud__nav" aria-label="章节导航">
        ${scenes
          .map(
            (scene) => `
              <button class="hud__nav-item" type="button" data-jump="${scene.id}">
                <span>${scene.index}</span>
                <small>${scene.kicker}</small>
              </button>
            `,
          )
          .join("")}
      </nav>
    </header>
    <div class="progress" aria-hidden="true">
      ${sceneIds
        .map(
          (id) => `
            <span class="progress__dot" data-progress-dot="${id}"></span>
          `,
        )
        .join("")}
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

const toast = document.querySelector<HTMLDivElement>("#toast");
const storyElement = document.querySelector<HTMLElement>("#story");
const sections = new Map<SceneId, HTMLElement>();

scenes.forEach((scene) => {
  const el = document.querySelector<HTMLElement>(`[data-scene="${scene.id}"]`);
  if (el) sections.set(scene.id, el);
});

const loginForm = document.querySelector<HTMLFormElement>("[data-login-form]");
const introLoginButton = document.querySelector<HTMLButtonElement>("[data-action='login']");
const accountInput = document.querySelector<HTMLInputElement>("[name='account']");
const passwordInput = document.querySelector<HTMLInputElement>("[name='password']");
const rememberInput = document.querySelector<HTMLInputElement>("[name='remember']");
const loginStatus = document.querySelector<HTMLElement>("[data-login-status]");
const introReveal = document.querySelector<HTMLElement>("[data-intro-reveal]");
const farmGrid = document.querySelector<HTMLElement>("[data-farm-grid]");
const farmHud = document.querySelector<HTMLElement>("[data-farm-hud]");
const farmPanelContent = document.querySelector<HTMLElement>("[data-farm-panel-content]");
const farmStatus = document.querySelector<HTMLElement>("[data-farm-status]");
const farmLeaveButton = document.querySelector<HTMLButtonElement>("[data-farm-leave]");
const farmRain = document.querySelector<HTMLDivElement>("[data-rain]");
const raceCar = document.querySelector<HTMLDivElement>("[data-race-car]");
const raceTail = document.querySelector<HTMLDivElement>("[data-race-tail]");
const raceStage = document.querySelector<HTMLElement>("[data-race-track]");
const raceMeter = document.querySelector<HTMLElement>("[data-race-meter]");
const raceHint = document.querySelector<HTMLElement>("[data-race-hint]");
const raceAccelerator = document.querySelector<HTMLButtonElement>("[data-race-accelerator]");
const danceBoard = document.querySelector<HTMLElement>("[data-dance-board]");
const danceNotes = document.querySelector<HTMLElement>("[data-dance-notes]");
const dancePrompt = document.querySelector<HTMLElement>("[data-dance-prompt]");
const danceRail = document.querySelector<HTMLElement>("[data-dance-rail]");
const danceStage = document.querySelector<HTMLElement>("[data-dance-stage]");
const danceFeedback = document.querySelector<HTMLElement>("[data-dance-feedback]");
const memoryCanvas = document.querySelector<HTMLCanvasElement>("[data-memory-canvas]");
const memoryScratch = document.querySelector<HTMLCanvasElement>("[data-memory-scratch]");
const memoryHint = document.querySelector<HTMLElement>("[data-memory-hint]");
const finaleHairpin = document.querySelector<HTMLButtonElement>("[data-finale-hairpin]");
const finaleGlowMessage = document.querySelector<HTMLElement>("[data-finale-glow-message]");
const finaleActions = document.querySelector<HTMLElement>("[data-finale-actions]");
const finaleMessage = document.querySelector<HTMLElement>("[data-finale-message]");
const shareButton = document.querySelector<HTMLButtonElement>("[data-share]");
const replayButton = document.querySelector<HTMLButtonElement>("[data-replay]");

const memoryBrushes: Array<{ x: number; y: number; radius: number; life: number }> = [];
let animationFrame = 0;
let raceNextAutoAdvance = 0;
let raceCueCooldown = 0;
let raceBoostUntil = 0;
let raceStarted = false;
let danceSessionStart = 0;
let danceCombo = 0;
let danceNotesState: Array<{
  key: string;
  lane: number;
  spawnAt: number;
  type: "tap" | "hold" | "slide";
  duration: number;
  holdStarted: boolean;
  hit: boolean;
  miss: boolean;
}> = [];
let danceScrollAdvanceAt = 0;
let danceHeldKey = "";
let danceGestureStart: { x: number; y: number; key: string } | null = null;
let memoryAdvanceTimer = 0;
let instructionTimer = 0;

function renderIntro() {
  return `
    <section class="scene scene--intro" data-scene="intro">
      <div class="scene__backdrop scene__backdrop--farm"></div>
      <div class="scene__overlay scene__overlay--scanlines"></div>
      <div class="scene__content scene__content--intro">
        <div class="login-window">
          <div class="window__topbar">
            <span>QQ 登录</span>
            <div class="window__traffic">
              <i></i><i></i><i></i>
            </div>
          </div>
          <form class="window__body" data-login-form>
            <div class="avatar-stack">
              <div class="avatar-ring"></div>
              <div class="avatar-core"></div>
              <div class="intro-reveal" data-intro-reveal>
                <span>欢迎回来</span>
              </div>
            </div>
            <div class="login-copy">
              <p class="scene__kicker">${scenes[0].kicker}</p>
            </div>
            <label class="field">
              <span>QQ 号码 / 邮箱 / 手机号</span>
              <input name="account" type="text" autocomplete="username" placeholder="请输入账号" value="${state.loginAccount}" />
            </label>
            <label class="field">
              <span>密码</span>
              <input name="password" type="password" autocomplete="current-password" placeholder="请输入密码" />
            </label>
            <label class="login-options">
              <input name="remember" type="checkbox" checked />
              <span>记住账号</span>
            </label>
            <button class="action-button action-button--primary" data-action="login" type="submit">
              安全登录 / 登入记忆
            </button>
            <p class="login-status" data-login-status>请输入账号和密码后登录</p>
            <p class="scene__hint">${scenes[0].hint}</p>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderFarmLegacy() {
  const tiles = [
    { name: "初级玫瑰", status: "已枯萎" },
    { name: "发光牧草", status: "已被偷光" },
    { name: "初级玫瑰", status: "已枯萎" },
    { name: "发光牧草", status: "已被偷光" },
    { name: "小麦", status: "未成熟" },
    { name: "向日葵", status: "已枯萎" },
    { name: "南瓜", status: "被风吹散" },
    { name: "玫瑰", status: "已被翻地" },
    { name: "牧草", status: "已离线" },
    { name: "树苗", status: "未浇水" },
    { name: "玫瑰", status: "已枯萎" },
    { name: "牧草", status: "被偷光" },
  ];

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
        <div class="farm-grid">
          ${tiles
            .map(
              (tile, index) => `
                <button class="farm-tile" type="button" data-farm-tile="${index}">
                  <span class="farm-tile__soil"></span>
                  <span class="farm-tile__plant farm-tile__plant--${index % 3}"></span>
                  <span class="farm-tile__name">${tile.name}</span>
                  <span class="farm-tile__status">${tile.status}</span>
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="scene-foot">
          <div class="status-chip">操作失败：你来晚了，对方已于 2012 年退线，此农场已无人打理。</div>
          <p class="scene__hint">${scenes[1].hint}</p>
        </div>
      </div>
    </section>
  `;
}

void renderFarmLegacy;

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
            <div class="farm-tabs" role="tablist" aria-label="农场管理">
              <button class="farm-tab is-active" type="button" data-farm-panel="tools">工具</button>
              <button class="farm-tab" type="button" data-farm-panel="shop">商店</button>
              <button class="farm-tab" type="button" data-farm-panel="storage">仓库</button>
              <button class="farm-tab" type="button" data-farm-panel="friends">好友</button>
            </div>
            <div class="farm-panel" data-farm-panel-content></div>
          </aside>
        </div>
        <div class="scene-foot scene-foot--farm">
          <div class="status-chip" data-farm-status>选择一块土地开始经营。</div>
          <button class="action-button action-button--primary" type="button" data-farm-leave>离开农场 →</button>
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
          <div class="billboard billboard--left">等不到你的雪月风花</div>
          <div class="billboard billboard--right">我们的爱也有时差</div>
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
            <div class="meter__label">时差加速</div>
            <div class="meter__bar"><i data-race-meter></i></div>
          </div>
          <button class="race-accelerator" type="button" data-race-accelerator>
            按住加速
          </button>
          <div class="finale-glow-message" aria-live="polite">886，我们最美的青春。</div>
          <div class="scene-foot scene-foot--race">
            <div class="status-chip" data-race-hint>电脑长按 <strong>↑ / W</strong>，手机长按“按住加速”或赛道即可加速</div>
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
          <div class="dance-guide" aria-label="音符操作提示">
            <span><b class="dance-guide__icon dance-guide__icon--tap">点</b>单点：手机点音符或方向键，电脑按方向键</span>
            <span><b class="dance-guide__icon dance-guide__icon--hold">长</b>长按：手机按住音符/按钮到尾端，电脑按住方向键</span>
            <span><b class="dance-guide__icon dance-guide__icon--slide">滑</b>滑动：手机顺箭头划，电脑点下落音符或按方向键</span>
          </div>
          <div class="dance-prompt" data-dance-prompt></div>
          <div class="dance-rail" data-dance-rail>
            <button class="dance-pad dance-pad--left" type="button" data-dance-hit="←">←</button>
            <button class="dance-pad dance-pad--up" type="button" data-dance-hit="↑">↑</button>
            <button class="dance-pad dance-pad--down" type="button" data-dance-hit="↓">↓</button>
            <button class="dance-pad dance-pad--right" type="button" data-dance-hit="→">→</button>
            <button class="dance-pad dance-pad--space" type="button" data-dance-hit="Space">Space</button>
          </div>
          <div class="scene-foot scene-foot--dance">
            <div class="status-chip">跟着视频里的判定条按方向键，最后再按 <strong>Space</strong></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderMemory() {
  const cards = memoryNotes
    .map(
      (note, index) => `
        <article class="memory-card memory-card--${index % 3}" style="--x:${14 + index * 11}%; --y:${10 + (index % 3) * 24}%; --rot:${-8 + index * 3}deg">
          <div class="memory-card__paper"></div>
          <div class="memory-card__content">
            <p class="memory-card__title">QQ 空间留言 ${index + 1}</p>
            <p class="memory-card__note">${note}</p>
          </div>
        </article>
      `,
    )
    .join("");

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
          <div class="status-chip" data-memory-hint>移动鼠标，抹去落雪，翻找记忆</div>
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
          <button class="butterfly" type="button" data-finale-hairpin aria-label="收起蝴蝶发卡">
            <img src="media/hairpin.png" alt="" />
          </button>
          <div class="finale-glow-message" data-finale-glow-message aria-live="polite">886，我们最美的青春。</div>
        </div>
        <div class="finale-copy">
          <p class="scene__kicker">${scenes[5].kicker}</p>
          <h2>${scenes[5].title}</h2>
          <p class="scene__lyric">${scenes[5].lyric}</p>
          <p class="finale-message" data-finale-message>最后一次，收起发卡</p>
          <div class="finale-actions" data-finale-actions hidden>
            <button class="action-button action-button--primary" type="button" data-replay>重新回味</button>
            <button class="action-button" type="button" data-share>打包回忆</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function showToast(message: string) {
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

function gainFarmExperience(amount: number) {
  farmSave.experience += amount;
  farmSave.level = Math.max(1, Math.floor(farmSave.experience / 50) + 1);
}

function syncFarmPlot(plot: FarmPlot, now = Date.now()) {
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
  if (plot.stage === "成熟") {
    plot.status = "已成熟";
    return;
  }
  if (plot.status === "枯萎") return;
  if (plot.nextEventAt && now >= plot.nextEventAt && plot.status === "已播种") {
    plot.status = Math.random() > 0.5 ? "干燥" : "生虫";
    plot.nextEventAt = now + 24000;
  }
  if (plot.status !== "干燥" && plot.status !== "生虫") {
    plot.status = "已播种";
  }
}

function farmPlotActionLabel(plot: FarmPlot) {
  if (!plot.unlocked) return "解锁土地";
  if (plot.status === "荒废" || plot.status === "枯萎") return plot.status === "枯萎" ? "清理枯萎" : "翻土";
  if (plot.status === "已翻土") return "等待播种";
  if (plot.status === "干燥") return "需要浇水";
  if (plot.status === "生虫") return "需要除虫";
  if (plot.status === "已成熟") return "可以收获";
  return `${plot.stage ?? "种子"} 生长中`;
}

function renderFarmGrid() {
  if (!farmGrid) return;
  farmSave.plots.forEach((plot) => syncFarmPlot(plot));
  farmGrid.innerHTML = farmSave.plots
    .map((plot) => {
      const crop = plot.crop ? cropDefinitions[plot.crop] : undefined;
      const selected = plot.id === farmSelectedPlot ? "is-selected" : "";
      const locked = plot.unlocked ? "" : "is-locked";
      const statusClass = plot.status.replace(/[^\u4e00-\u9fa5a-z]/g, "");
      const plantClass = crop ? `farm-plant--${plot.crop}` : "";
      return `
        <button class="farm-plot ${selected} ${locked} farm-plot--${statusClass}" type="button" data-farm-plot="${plot.id}">
          <span class="farm-plot__soil"></span>
          ${plot.unlocked ? `<span class="farm-plant ${plantClass}" style="--crop-color:${crop?.color ?? "transparent"}"></span>` : `<span class="farm-plot__lock">🔒</span>`}
          <span class="farm-plot__crop">${crop?.name ?? (plot.unlocked ? "空土地" : "待解锁")}</span>
          <span class="farm-plot__stage">${farmPlotActionLabel(plot)}</span>
          ${plot.status === "生虫" ? `<span class="farm-plot__alert">虫</span>` : ""}
          ${plot.status === "干燥" ? `<span class="farm-plot__alert">旱</span>` : ""}
        </button>
      `;
    })
    .join("");
}

function renderFarmHud() {
  if (!farmHud) return;
  const seedCount = (farmSave.inventory.wheatSeed ?? 0) + (farmSave.inventory.roseSeed ?? 0) + (farmSave.inventory.pumpkinSeed ?? 0);
  farmHud.innerHTML = `
    <div class="farm-stat"><span>金币</span><strong>🪙 ${farmSave.coins}</strong></div>
    <div class="farm-stat"><span>经验</span><strong>Lv.${farmSave.level} · ${farmSave.experience} XP</strong></div>
    <div class="farm-stat"><span>种子</span><strong>${seedCount}</strong></div>
    <div class="farm-stat"><span>土地</span><strong>${farmSave.plots.filter((plot) => plot.unlocked).length}/${farmSave.plots.length}</strong></div>
  `;
}

function renderFarmTools() {
  const plot = farmSave.plots[farmSelectedPlot];
  if (!plot) return "";
  const actionButtons = [];
  if (!plot.unlocked) {
    actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="unlock">🪙 解锁土地（${60 + plot.id * 20}）</button>`);
  } else if (plot.status === "荒废" || plot.status === "枯萎") {
    actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="${plot.status === "枯萎" ? "clear" : "till"}">${plot.status === "枯萎" ? "🧹 清理枯萎" : "⛏ 翻土"}</button>`);
  } else if (plot.status === "已翻土") {
    actionButtons.push(...(["wheat", "rose", "pumpkin"] as CropKind[]).map((kind) => {
      const crop = cropDefinitions[kind];
      const count = farmSave.inventory[`${kind}Seed`] ?? 0;
      return `<button class="farm-action" data-farm-action="plant" data-crop="${kind}" ${count < 1 ? "disabled" : ""}>🌱 ${crop.name} · ${crop.seedPrice}币 · ${count}颗</button>`;
    }));
  } else {
    if (plot.status === "干燥") actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="water">💧 浇水</button>`);
    if (plot.status === "生虫") {
      actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="pesticide">🧪 除虫</button>`);
      actionButtons.push(`<button class="farm-action" data-farm-action="weed">🌿 除草</button>`);
    }
    if (plot.crop && plot.status !== "已成熟") {
      actionButtons.push(`<button class="farm-action" data-farm-action="fertilize" ${(farmSave.inventory.fertilizer ?? 0) < 1 ? "disabled" : ""}>⚡ 化肥（${farmSave.inventory.fertilizer ?? 0}）</button>`);
    }
    if (plot.status === "已成熟") actionButtons.push(`<button class="farm-action farm-action--primary" data-farm-action="harvest">🧺 收获</button>`);
  }
  return `
    <div class="farm-panel__title">土地 ${plot.id + 1} · ${plot.status}</div>
    <p class="farm-panel__muted">${plot.crop ? `${cropDefinitions[plot.crop].name} · ${plot.stage ?? "种子"}` : "这块土地还没有作物。"}</p>
    <div class="farm-action-list">${actionButtons.join("")}</div>
  `;
}

function renderFarmPanel() {
  if (!farmPanelContent) return;
  if (farmPanel === "tools") {
    farmPanelContent.innerHTML = renderFarmTools();
  } else if (farmPanel === "shop") {
    farmPanelContent.innerHTML = `
      <div class="farm-panel__title">怀旧农场商店</div>
      <div class="farm-shop-list">
        ${(["wheat", "rose", "pumpkin"] as CropKind[]).map((kind) => {
          const crop = cropDefinitions[kind];
          return `<button class="farm-shop-item" data-farm-action="buy-seed" data-crop="${kind}"><span>🌱 ${crop.name}种子</span><strong>${crop.seedPrice}币</strong></button>`;
        }).join("")}
        <button class="farm-shop-item" data-farm-action="buy-item" data-item="fertilizer"><span>⚡ 化肥</span><strong>18币</strong></button>
        <button class="farm-shop-item" data-farm-action="buy-item" data-item="pesticide"><span>🧪 农药</span><strong>22币</strong></button>
      </div>
    `;
  } else if (farmPanel === "storage") {
    const items = (["wheat", "rose", "pumpkin"] as CropKind[]).map((kind) => {
      const crop = cropDefinitions[kind];
      const amount = farmSave.inventory[kind] ?? 0;
      return `<div class="farm-storage-row"><span>${crop.name}果实 × ${amount}</span><button class="farm-action" data-farm-action="sell" data-crop="${kind}" ${amount < 1 ? "disabled" : ""}>出售 +${crop.sellPrice}币</button></div>`;
    }).join("");
    farmPanelContent.innerHTML = `
      <div class="farm-panel__title">我的仓库</div>
      ${items}
      <div class="farm-inventory-note">种子：小麦 ${farmSave.inventory.wheatSeed ?? 0} · 玫瑰 ${farmSave.inventory.roseSeed ?? 0} · 南瓜 ${farmSave.inventory.pumpkinSeed ?? 0}</div>
      <div class="farm-inventory-note">道具：化肥 ${farmSave.inventory.fertilizer ?? 0} · 农药 ${farmSave.inventory.pesticide ?? 0}</div>
    `;
  } else {
    farmPanelContent.innerHTML = `
      <div class="farm-panel__title">好友农场</div>
      <div class="farm-friend-list">
        ${farmSave.friends.map((friend) => `
          <div class="farm-friend">
            <div><strong>${friend.name}</strong><span class="${friend.online ? "is-online" : "is-offline"}">${friend.online ? "在线" : "离线"}</span><small>${friend.status}</small></div>
            <div class="farm-friend__actions">
              <button class="farm-action" data-farm-action="help" data-friend="${friend.id}" ${friend.needsHelp ? "" : "disabled"}>帮帮</button>
              <button class="farm-action" data-farm-action="steal" data-friend="${friend.id}" ${friend.mature && friend.stolenRatio < 0.4 ? "" : "disabled"}>偷菜</button>
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

function farmMessage(message: string) {
  if (farmStatus) farmStatus.textContent = message;
  showToast(message);
}

function handleFarmAction(target: HTMLElement) {
  const action = target.dataset.farmAction;
  const plot = farmSave.plots[farmSelectedPlot];
  const now = Date.now();
  if (!action) return;
  if (plot) syncFarmPlot(plot, now);

  if (action === "till" && plot?.unlocked && (plot.status === "荒废" || plot.status === "枯萎")) {
    plot.status = "已翻土";
    plot.crop = undefined;
    plot.stage = undefined;
    farmMessage("土地翻好了，选择一种种子吧。");
  } else if (action === "clear" && plot?.status === "枯萎") {
    plot.status = "已翻土";
    plot.crop = undefined;
    plot.stage = undefined;
    farmMessage("枯萎作物已清理。");
  } else if (action === "plant" && plot?.status === "已翻土") {
    const kind = target.dataset.crop as CropKind;
    const seedKey = `${kind}Seed`;
    if ((farmSave.inventory[seedKey] ?? 0) < 1) return farmMessage("仓库里没有这种种子。");
    farmSave.inventory[seedKey] -= 1;
    plot.crop = kind;
    plot.stage = "种子";
    plot.status = "已播种";
    plot.plantedAt = now;
    plot.nextEventAt = now + 18000;
    farmMessage(`已播种${cropDefinitions[kind].name}，记得回来照料。`);
  } else if (action === "water" && plot?.status === "干燥") {
    plot.status = "已播种";
    plot.wateredAt = now;
    plot.nextEventAt = now + 22000;
    gainFarmExperience(4);
    farmMessage("浇水成功，作物恢复生长。");
  } else if (action === "pesticide" && plot?.status === "生虫") {
    if ((farmSave.inventory.pesticide ?? 0) < 1) return farmMessage("农药用完了，请去商店补充。");
    farmSave.inventory.pesticide -= 1;
    plot.status = "已播种";
    plot.nextEventAt = now + 22000;
    gainFarmExperience(6);
    farmMessage("害虫已清除，获得 6 点经验。");
  } else if (action === "weed" && plot?.status === "生虫") {
    plot.status = "已播种";
    plot.nextEventAt = now + 18000;
    gainFarmExperience(3);
    farmMessage("杂草清理完毕，获得 3 点经验。");
  } else if (action === "fertilize" && plot?.crop && plot.status !== "已成熟") {
    if ((farmSave.inventory.fertilizer ?? 0) < 1) return farmMessage("化肥用完了，请去商店补充。");
    farmSave.inventory.fertilizer -= 1;
    plot.plantedAt = (plot.plantedAt ?? now) - 8000;
    farmMessage("化肥生效，成长时间缩短。");
  } else if (action === "harvest" && plot?.crop && plot.status === "已成熟") {
    const crop = cropDefinitions[plot.crop];
    const amount = Math.max(1, Math.floor(crop.yield * (1 - plot.stolenRatio)));
    farmSave.inventory[plot.crop] = (farmSave.inventory[plot.crop] ?? 0) + amount;
    gainFarmExperience(12);
    plot.status = "荒废";
    plot.crop = undefined;
    plot.stage = undefined;
    plot.plantedAt = undefined;
    plot.nextEventAt = undefined;
    plot.stolenRatio = 0;
    farmMessage(`收获 ${crop.name} × ${amount}，获得 12 点经验。`);
  } else if (action === "unlock" && plot && !plot.unlocked) {
    const cost = 60 + plot.id * 20;
    if (farmSave.coins < cost) return farmMessage("金币不足，先卖出一些果实吧。");
    farmSave.coins -= cost;
    plot.unlocked = true;
    farmMessage(`土地 ${plot.id + 1} 已解锁。`);
  } else if (action === "buy-seed") {
    const kind = target.dataset.crop as CropKind;
    const crop = cropDefinitions[kind];
    if (farmSave.coins < crop.seedPrice) return farmMessage("金币不足，无法购买。");
    farmSave.coins -= crop.seedPrice;
    farmSave.inventory[`${kind}Seed`] = (farmSave.inventory[`${kind}Seed`] ?? 0) + 1;
    farmMessage(`已购买 ${crop.name}种子。`);
  } else if (action === "buy-item") {
    const item = target.dataset.item ?? "";
    const price = item === "fertilizer" ? 18 : 22;
    if (farmSave.coins < price) return farmMessage("金币不足，无法购买。");
    farmSave.coins -= price;
    farmSave.inventory[item] = (farmSave.inventory[item] ?? 0) + 1;
    farmMessage(`已购买 ${item === "fertilizer" ? "化肥" : "农药"}。`);
  } else if (action === "sell") {
    const kind = target.dataset.crop as CropKind;
    if ((farmSave.inventory[kind] ?? 0) < 1) return farmMessage("仓库里没有可出售的果实。");
    farmSave.inventory[kind] -= 1;
    farmSave.coins += cropDefinitions[kind].sellPrice;
    farmMessage(`已出售 1 个${cropDefinitions[kind].name}果实。`);
  } else if (action === "help") {
    const friend = farmSave.friends.find((item) => item.id === target.dataset.friend);
    if (!friend || !friend.needsHelp) return farmMessage("这位好友暂时不需要帮助。");
    friend.needsHelp = false;
    gainFarmExperience(10);
    farmMessage(`帮助 ${friend.name} 完成农场照料，获得 10 点经验。`);
  } else if (action === "steal") {
    const friend = farmSave.friends.find((item) => item.id === target.dataset.friend);
    if (!friend || !friend.mature || friend.stolenRatio >= 0.4) return farmMessage("这块作物已经被偷光了。");
    friend.stolenRatio = Math.min(0.4, friend.stolenRatio + 0.1);
    const kind: CropKind = friend.id === "tutu" ? "pumpkin" : "rose";
    farmSave.inventory[kind] = (farmSave.inventory[kind] ?? 0) + 1;
    farmMessage(`从 ${friend.name} 的农场偷到 1 个果实。`);
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
    if (loginStatus) loginStatus.textContent = "账号和密码都要填上，才能登入记忆。";
    showToast("请先输入账号和密码");
    return;
  }

  if (account.length < 4 || password.length < 4) {
    if (loginStatus) loginStatus.textContent = "账号或密码太短了，再认真一点。";
    showToast("登录信息不完整");
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
    loginStatus.textContent = `欢迎回来，${account}。正在登入记忆...`;
  }
  showToast("嘀嘀嘀嗒，记忆已上线");
  window.setTimeout(() => scrollToScene("farm"), 1300);
}

let showToastTimer = 0;

function scrollToScene(id: SceneId) {
  const target = sections.get(id);
  if (!target) return;
  if (storyElement) {
    storyElement.scrollTo({
      top: target.offsetTop,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    return;
  }
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

function updateProgress() {
  document.querySelectorAll<HTMLElement>("[data-progress-dot]").forEach((dot) => {
    const id = dot.dataset.progressDot as SceneId | undefined;
    dot.classList.toggle("is-active", id === state.activeScene);
    dot.classList.toggle("is-done", sceneIds.indexOf(id ?? "intro") < sceneIds.indexOf(state.activeScene));
  });

  document.querySelectorAll<HTMLElement>("[data-scene]").forEach((section) => {
    const id = section.dataset.scene as SceneId;
    section.classList.toggle("is-active", id === state.activeScene);
  });

  document.querySelectorAll<HTMLElement>("[data-jump]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.jump === state.activeScene);
  });
}

function setActiveScene(id: SceneId) {
  if (state.activeScene === id) return;
  const previousScene = state.activeScene;
  state.activeScene = id;
  if (id === "dance" && previousScene !== "dance") {
    resetDanceSession();
  }
  updateProgress();
}

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.getAttribute("data-scene") as SceneId | null;
    if (id) setActiveScene(id);
  },
  {
    root: storyElement,
    threshold: [0.52, 0.66, 0.8],
  },
);

sections.forEach((el) => observer.observe(el));

document.querySelectorAll<HTMLButtonElement>("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.dataset.jump as SceneId;
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

/*
farmTiles.forEach((tile) => {
  tile.addEventListener("click", () => {
    if (state.activeScene !== "farm") return;
    state.farmClicks += 1;
    tile.classList.add("is-picked");
    sound.playFailCue();
    showToast("操作失败：你来晚了，对方已于 2012 年退线。");
    if (state.farmClicks >= 3) {
      window.setTimeout(() => scrollToScene("race"), 900);
    }
  });
});
*/

farmGrid?.addEventListener("click", (event) => {
  if (state.activeScene !== "farm") return;
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-farm-plot]");
  if (!target) return;
  farmSelectedPlot = Number(target.dataset.farmPlot ?? 0);
  farmPanel = "tools";
  document.querySelectorAll<HTMLElement>("[data-farm-panel]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.farmPanel === farmPanel);
  });
  updateFarmUI();
});

document.querySelectorAll<HTMLButtonElement>("[data-farm-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    farmPanel = button.dataset.farmPanel as typeof farmPanel;
    document.querySelectorAll<HTMLElement>("[data-farm-panel]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderFarmPanel();
  });
});

farmPanelContent?.addEventListener("click", (event) => {
  if (state.activeScene !== "farm") return;
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-farm-action]");
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

function handleDanceInput(event: KeyboardEvent) {
  if (state.danceFinished) return;

  const key = normalizeKey(event.key);
  if (["←", "↑", "↓", "→", "Space"].includes(key)) {
    event.preventDefault();
  }
  resolveDanceInput(key);
}

function resolveDanceLegacy(key: string) {
  if (state.activeScene !== "dance" || state.danceFinished) return;

  const note = danceNotesState[state.danceIndex];
  if (!note) return;

  const progress = getDanceNoteProgress(note, performance.now());
  const inJudgeWindow = progress >= 0.56 && progress <= 1.08;

  if (key !== note.key || !inJudgeWindow) {
    sound.playFailCue();
    danceCombo = 0;
    danceStage?.classList.add("is-miss");
    window.setTimeout(() => danceStage?.classList.remove("is-miss"), 180);
    updateDancePrompt("MISS");
    return;
  }

  note.hit = true;
  state.danceHits += 1;
  danceCombo += 1;
  state.danceIndex += 1;
  danceStage?.classList.add("is-hit");
  window.setTimeout(() => danceStage?.classList.remove("is-hit"), 200);

  if (Math.abs(progress - 0.82) < 0.1) {
    sound.playPerfectCue();
    updateDancePrompt("PERFECT");
  } else {
    sound.playBoostCue();
    updateDancePrompt("GOOD");
  }

  if (state.danceIndex >= danceNotesState.length) {
    finishDanceSession(performance.now());
  }
}

function finishDanceSession(now: number) {
  if (state.danceFinished) return;
  state.danceFinished = true;
  const accuracy = state.danceHits / danceNotesState.length;
  state.danceRating =
    accuracy >= 1
      ? "S"
      : accuracy >= 0.8
        ? "A"
        : accuracy >= 0.6
          ? "B"
          : accuracy >= 0.5
            ? "C"
            : "D";
  danceStage?.classList.add(state.danceRating === "S" ? "is-perfect" : "is-cleared");
  danceScrollAdvanceAt = now + 2200;
  updateDancePrompt(`RATING ${state.danceRating}`);
  showToast(`最终评级 ${state.danceRating} · 正确率 ${Math.round(accuracy * 100)}%`);
}

void resolveDanceLegacy;

function resolveDanceInput(key: string) {
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

function getDanceJudgement(progress: number) {
  const distance = Math.abs(progress - 0.82);
  if (distance <= 0.06) return "Perfect";
  if (distance <= 0.14) return "Great";
  if (distance <= 0.24) return "Good";
  if (distance <= 0.34) return "Bad";
  return "Miss";
}

function completeDanceNote(
  note: (typeof danceNotesState)[number],
  judgement: "Perfect" | "Great" | "Good" | "Bad",
  now: number,
) {
  if (note.hit || note.miss) return;
  note.hit = true;
  state.danceHits += 1;
  danceCombo += judgement === "Perfect" ? 1 : 0;
  if (judgement !== "Perfect") danceCombo = 0;
  const baseScore = judgement === "Perfect" ? 1000 : judgement === "Great" ? 700 : judgement === "Good" ? 450 : 200;
  const multiplier = state.danceShowTime ? 2 : 1;
  const comboBonus = judgement === "Perfect" && danceCombo > 1 ? danceCombo * 100 : 0;
  state.danceScore += baseScore * multiplier + comboBonus;
  state.danceLastJudgement = judgement;
  state.danceIndex += 1;

  if (danceCombo >= 10 && !state.danceShowTime) {
    state.danceShowTime = true;
    danceStage?.classList.add("is-showtime");
    showToast("ShowTime · 得分翻倍");
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

function missDanceNote(now: number) {
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

function releaseDanceHold(key: string, now: number) {
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

function showDanceFeedback(judgement: string, comboBonus = 0) {
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

function normalizeKey(key: string) {
  if (key === " ") return "Space";
  if (key === "ArrowLeft") return "←";
  if (key === "ArrowUp") return "↑";
  if (key === "ArrowDown") return "↓";
  if (key === "ArrowRight") return "→";
  return key.toLowerCase();
}

function updateDancePrompt(feedback = "") {
  if (!dancePrompt) return;
  const accuracy = danceNotesState.length
    ? Math.round((state.danceHits / danceNotesState.length) * 100)
    : 0;
  const chartNote = danceChart[state.danceIndex];
  const next = danceNotesState[state.danceIndex]?.key ?? "完美！";
  const stateLabel = feedback || (state.danceFinished ? "PERFECT" : "准备");
  dancePrompt.innerHTML = `
    <div class="dance-current">${next}</div>
    <div class="dance-score">
      <span>${state.danceLastJudgement || "READY"} · Score ${state.danceScore} · ${state.danceShowTime ? "SHOWTIME x2" : "倍率 x1"}</span>
      <strong>评级 ${state.danceRating || "--"} · 正确率 ${accuracy}%</strong>
      <small>节拍 ${Math.min(state.danceIndex + 1, danceChart.length)} / ${danceChart.length} · ${chartNote?.phase ?? "finale"} · 约 1 分钟</small>
      <span>判定 ${stateLabel}</span>
    <strong>连击 ${danceCombo}</strong>
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
      miss: false,
    };
  });
  danceStage?.classList.remove("is-perfect", "is-cleared", "is-hit", "is-miss", "is-showtime");
  updateDancePrompt("READY");
}

function danceKeyToLane(key: string) {
  if (key === "←") return 0;
  if (key === "↑") return 1;
  if (key === "↓") return 2;
  if (key === "→") return 3;
  return 1.5;
}

function getDanceNoteProgress(
  note: { spawnAt: number },
  now: number,
) {
  const travelMs = 1500;
  return (now - danceSessionStart - note.spawnAt) / travelMs;
}

function updateDanceBoard(now: number) {
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

  danceNotes.innerHTML = danceNotesState
    .map((note, index) => {
      const progress = getDanceNoteProgress(note, now);
      const visible = progress > -0.2 && progress < 1.28;
      const top = 86 - Math.max(0, Math.min(1.2, progress)) * 48;
      const left = note.key === "Space" ? 50 : 12.5 + note.lane * 25;
      const current = index === state.danceIndex && !note.hit && !note.miss;
      const stateClass = note.hit ? "is-hit" : note.miss ? "is-miss" : current ? "is-active" : "";
      const spaceClass = note.key === "Space" ? "dance-note--space" : "";
      const typeClass = `dance-note--${note.type}`;
      const noteHeight = note.type === "hold" ? Math.max(9, (note.duration / 1500) * 48) : 0;
      const label = note.type === "hold" ? `${note.key} ↕` : note.type === "slide" ? `${note.key} ⇢` : note.key;
      return `
        <button
          class="dance-note ${stateClass} ${spaceClass} ${typeClass}"
          type="button"
          data-dance-hit="${note.key}"
          data-dance-type="${note.type}"
          style="left:${left}%; top:${top}%; height:${noteHeight ? `${noteHeight}%` : "3.2rem"}; opacity:${visible ? 1 : 0}"
          aria-label="节奏键 ${label}"
        >${label}</button>
      `;
    })
    .join("");

  if (state.danceFinished && danceScrollAdvanceAt > 0 && now > danceScrollAdvanceAt) {
    danceScrollAdvanceAt = 0;
    scrollToScene("memory");
  }
}

danceRail?.addEventListener("click", (event) => {
  if (state.activeScene !== "dance") return;
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-dance-hit]");
  if (!target) return;
  resolveDanceInput(target.dataset.danceHit ?? "");
});

danceBoard?.addEventListener("click", (event) => {
  if (state.activeScene !== "dance") return;
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-dance-hit]");
  if (!target) return;
  if (target.dataset.danceType === "hold" || target.dataset.danceType === "slide") return;
  resolveDanceInput(target.dataset.danceHit ?? "");
});

danceBoard?.addEventListener("pointerdown", (event) => {
  if (state.activeScene !== "dance") return;
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-dance-hit]");
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
    const direction = Math.abs(dx) >= Math.abs(dy)
      ? dx < 0 ? "←" : "→"
      : dy < 0 ? "↑" : "↓";
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
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-dance-hit]");
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
    raceHint.innerHTML =
      "按住 <strong>↑ / W</strong>，或按住下方加速键，别让尾灯跑掉";
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
  raceHint.innerHTML = state.raceDistance > 95
    ? "尾灯始终在前方，像有些人永远追不上"
    : "按住 <strong>↑ / W</strong>，或按住下方加速键";

  if (isBoosting && performance.now() > raceCueCooldown) {
    sound.playBoostCue();
    raceCueCooldown = performance.now() + 220;
  }

  if (state.raceDistance > 150 && !state.raceFinished) {
    state.raceFinished = true;
    raceNextAutoAdvance = performance.now() + 1200;
    showToast("放不下，终点就在眼前又慢慢熄火了");
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

  const observer = new ResizeObserver(resize);
  observer.observe(memoryCanvas);
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

  const handlePointer = (event: PointerEvent) => {
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
    finaleMessage && (finaleMessage.textContent = "886，我们最美的青春。");
    showToast("喔唷~");
  });

  replayButton?.addEventListener("click", () => window.location.reload());

  shareButton?.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: "后会无期 · 致敬青春",
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    showToast("链接已复制");
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
