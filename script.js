/**
 * DUCK DREAM STUDIOS
 * PRO-SURVIVOR ENGINE — UNIFIED CORE
 */

// ==================== CANVAS ====================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false });

// ==================== CONSTANTS ====================
const TILE_SIZE = 32;

// ==================== GAME MODES ====================
const GameMode = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused"
};

// ==================== GAME STATE ====================
const gameState = {
  mode: GameMode.MENU,
  isRunning: false,

  duck: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 2,
    size: 24,
    direction: 1,
    isMoving: false,
    animationFrame: 0
  },

  stats: { health: 100, hunger: 100, energy: 100, fear: 0 },
  time: { hour: 6, minute: 0, isNight: false, dayCount: 1 },

  enemies: [],
  buildings: [],
  resourceNodes: [],
  buffs: [],
  dreamCount: 0,
  nightDanger: 0,

  isInShelter: false,
  canSleep: false
};

// ==================== WORLD ====================
function getTileAt(tx, ty) {
  const noise = Math.abs(Math.sin(tx * 0.1) + Math.cos(ty * 0.1));
  if (noise > 1.2) return "#4d8b42";
  if (noise < 0.2) return "#6db35f";
  return "#5da051";
}

// ==================== RENDER ====================
function render() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (gameState.mode !== GameMode.PLAYING) return;

  const duck = gameState.duck;

  const offsetX = canvas.width / 2 - duck.x;
  const offsetY = canvas.height / 2 - duck.y;

  const startX = Math.floor((duck.x - canvas.width / 2) / TILE_SIZE);
  const endX = Math.ceil((duck.x + canvas.width / 2) / TILE_SIZE);
  const startY = Math.floor((duck.y - canvas.height / 2) / TILE_SIZE);
  const endY = Math.ceil((duck.y + canvas.height / 2) / TILE_SIZE);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      ctx.fillStyle = getTileAt(x, y);
      ctx.fillRect(
        x * TILE_SIZE + offsetX,
        y * TILE_SIZE + offsetY,
        TILE_SIZE + 0.5,
        TILE_SIZE + 0.5
      );
    }
  }

  // Duck body
  ctx.fillStyle = "#fff";
  ctx.fillRect(
    canvas.width / 2 - duck.size / 2,
    canvas.height / 2 - duck.size / 2,
    duck.size,
    duck.size
  );

  // Duck beak
  ctx.fillStyle = "#fb923c";
  ctx.fillRect(
    canvas.width / 2 + duck.direction * 8,
    canvas.height / 2 - 4,
    12,
    8
  );
}

// ==================== LOOP ====================
let lastTime = 0;

function gameLoop(timestamp) {
  lastTime = timestamp;

  if (gameState.mode === GameMode.PLAYING && gameState.isRunning) {
    update();
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ==================== RESIZE (MOBILE SAFE) ====================
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}

let resizeTimeout;
window.addEventListener("orientationchange", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resize, 300);
});

resize();
requestAnimationFrame(gameLoop);

// ==================== START GAME (MENU HOOK) ====================
window.startGame = function () {
  gameState.mode = GameMode.PLAYING;
  gameState.isRunning = true;
};