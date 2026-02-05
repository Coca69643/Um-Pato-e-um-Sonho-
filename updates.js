// ==================== GAME UPDATE LOOP ====================
function update() {
  updateDuckMovement();
  updateTime();
  updateStats();
  updateEnemies();
  checkShelterProximity();
  checkGameOver();
}

// ==================== DUCK MOVEMENT ====================
function updateDuckMovement() {
  const duck = gameState.duck;

  duck.x += duck.vx;
  duck.y += duck.vy;

  duck.isMoving = duck.vx !== 0 || duck.vy !== 0;

  if (duck.isMoving) {
    duck.animationFrame = (duck.animationFrame + 0.15) % 4;
  }
}

// ==================== TIME SYSTEM ====================
const TIME_SPEED = 0.5;

function updateTime() {
  gameState.time.minute += TIME_SPEED;

  if (gameState.time.minute >= 60) {
    gameState.time.minute = 0;
    gameState.time.hour++;

    if (gameState.time.hour >= 24) {
      gameState.time.hour = 0;
      gameState.time.dayCount++;
    }

    gameState.time.isNight =
      gameState.time.hour >= 20 || gameState.time.hour < 6;

    if (gameState.time.hour === 20) spawnNightEnemies();
    if (gameState.time.hour === 6) gameState.enemies = [];
  }
}

// ==================== STATS ====================
function updateStats() {
  const stats = gameState.stats;

  stats.hunger -= 0.01;
  stats.energy -= gameState.duck.isMoving ? 0.008 : 0.003;

  if (gameState.time.isNight && !gameState.isInShelter) {
    stats.fear += 0.05;
    gameState.nightDanger += 0.02;
  } else {
    stats.fear = Math.max(0, stats.fear - 0.02);
    gameState.nightDanger = Math.max(0, gameState.nightDanger - 0.05);
  }

  if (stats.hunger <= 0) stats.health -= 0.05;
  if (stats.energy <= 0) stats.health -= 0.03;
  if (gameState.nightDanger >= 100) stats.health -= 0.1;

  stats.health = Math.max(0, Math.min(100, stats.health));
  stats.hunger = Math.max(0, Math.min(100, stats.hunger));
  stats.energy = Math.max(0, Math.min(100, stats.energy));
  stats.fear = Math.max(0, Math.min(100, stats.fear));
}

// ==================== ENEMIES ====================
function spawnNightEnemies() {
  const num = 3 + gameState.dreamCount;
  for (let i = 0; i < num; i++) {
    gameState.enemies.push({
      x: gameState.duck.x + Math.random() * 400 - 200,
      y: gameState.duck.y + Math.random() * 400 - 200,
      health: 50,
      speed: 0.5
    });
  }
}

function updateEnemies() {
  if (!gameState.time.isNight) return;

  gameState.enemies.forEach(enemy => {
    const dx = gameState.duck.x - enemy.x;
    const dy = gameState.duck.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 30) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    } else {
      gameState.stats.health -= 0.1;
    }
  });
}

// ==================== SHELTER ====================
function checkShelterProximity() {
  gameState.isInShelter = false;
}

// ==================== GAME OVER ====================
function checkGameOver() {
  if (gameState.stats.health <= 0) {
    gameState.isRunning = false;
    gameState.mode = GameMode.PAUSED;
  }
}