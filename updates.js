// ==================== GAME UPDATE LOOP ====================
function update() {
  updateDuckMovement();
  updateHarvesting();
  collectItems();
  updateTime();
  updateStats();
  updateEnemies();
  checkShelterProximity();
  checkGameOver();
  updateHUD();
}

// ==================== DUCK MOVEMENT ====================
function updateDuckMovement() {
  const duck = gameState.duck;
  
  // Apply velocity
  let newX = duck.x + duck.vx;
  let newY = duck.y + duck.vy;
  
  // World bounds
  newX = Math.max(20, Math.min(WORLD_WIDTH - 20, newX));
  newY = Math.max(20, Math.min(WORLD_HEIGHT - 20, newY));
  
  // Check collision with resources (trees, rocks)
  let canMove = true;
  gameState.resourceNodes.forEach(node => {
    if (node.type === 'tree' || node.type === 'rock') {
      if (checkCollision(newX - 12, newY - 12, 24, 24, node.x, node.y + node.height - 20, node.width, 20)) {
        canMove = false;
      }
    }
  });
  
  if (canMove) {
    duck.x = newX;
    duck.y = newY;
  }
  
  // Animation frame
  if (duck.isMoving) {
    duck.animationFrame = (duck.animationFrame + 0.15) % 4;
  }
}

// ==================== TIME SYSTEM ====================
const TIME_SPEED = 0.5; // Minutes per frame at 60fps

function updateTime() {
  gameState.time.minute += TIME_SPEED;
  
  if (gameState.time.minute >= 60) {
    gameState.time.minute = 0;
    gameState.time.hour++;
    
    if (gameState.time.hour >= 24) {
      gameState.time.hour = 0;
    }
    
    // Check for night
    gameState.time.isNight = gameState.time.hour >= 20 || gameState.time.hour < 6;
    
    // Spawn enemies at night
    if (gameState.time.hour === 20) {
      spawnNightEnemies();
    }
    
    // Despawn enemies at dawn
    if (gameState.time.hour === 6) {
      gameState.enemies = [];
    }
  }
}

// ==================== STATS DECAY ====================
function updateStats() {
  const stats = gameState.stats;
  
  // Hunger decreases over time
  stats.hunger -= 0.01;
  
  // Energy decreases faster when moving
  if (gameState.duck.isMoving) {
    stats.energy -= 0.008;
  } else {
    stats.energy -= 0.003;
  }
  
  // Fear increases at night if not in shelter
  if (gameState.time.isNight && !gameState.isInShelter) {
    stats.fear += 0.05;
    gameState.nightDanger += 0.02;
  } else {
    stats.fear = Math.max(0, stats.fear - 0.02);
    gameState.nightDanger = Math.max(0, gameState.nightDanger - 0.05);
  }
  
  // Health damage from hunger
  if (stats.hunger <= 0) {
    stats.health -= 0.05;
    stats.hunger = 0;
  }
  
  // Health damage from exhaustion
  if (stats.energy <= 0) {
    stats.health -= 0.03;
    stats.energy = 0;
  }
  
  // Health damage from fear/night danger
  if (gameState.nightDanger >= 100) {
    stats.health -= 0.1;
  }
  
  // Apply buffs
  if (gameState.buffs.includes('speed')) {
    gameState.duck.speed = 3;
  } else {
    gameState.duck.speed = 2;
  }
  
  // Clamp values
  stats.health = Math.max(0, Math.min(100, stats.health));
  stats.hunger = Math.max(0, Math.min(100, stats.hunger));
  stats.energy = Math.max(0, Math.min(100, stats.energy));
  stats.fear = Math.max(0, Math.min(100, stats.fear));
}

// ==================== ENEMY SYSTEM ====================
function spawnNightEnemies() {
  const numEnemies = 3 + gameState.dreamCount;
  
  for (let i = 0; i < numEnemies; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 300 + Math.random() * 200;
    
    gameState.enemies.push({
      id: 'enemy_' + Date.now() + '_' + i,
      type: Math.random() > 0.5 ? 'slime' : 'shadow',
      x: gameState.duck.x + Math.cos(angle) * distance,
      y: gameState.duck.y + Math.sin(angle) * distance,
      health: 50,
      speed: 0.5 + Math.random() * 0.5
    });
  }
}

function updateEnemies() {
  if (!gameState.time.isNight) return;
  
  const duck = gameState.duck;
  
  gameState.enemies.forEach(enemy => {
    // Move towards player
    const dx = duck.x - enemy.x;
    const dy = duck.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 30) {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    } else {
      // Attack player
      gameState.stats.health -= 0.1;
    }
  });
}

// ==================== SHELTER SYSTEM ====================
function checkShelterProximity() {
  const duck = gameState.duck;
  let nearShelter = false;
  
  gameState.buildings.forEach(building => {
    if (building.type === 'shelter') {
      const dist = getDistance(duck.x, duck.y, building.x + 40, building.y + 25);
      if (dist < 60) {
        nearShelter = true;
      }
    }
  });
  
  // Also check campfire (temporary safety)
  gameState.buildings.forEach(building => {
    if (building.type === 'campfire') {
      const dist = getDistance(duck.x, duck.y, building.x + 20, building.y + 15);
      if (dist < 80) {
        nearShelter = true;
      }
    }
  });
  
  gameState.isInShelter = nearShelter;
  gameState.canSleep = nearShelter && gameState.time.isNight;
}

// ==================== RESOURCE REGENERATION ====================
setInterval(() => {
  if (!gameState.isRunning) return;
  
  // Regenerate bushes
  if (gameState.resourceNodes.filter(n => n.type === 'bush').length < 30) {
    gameState.resourceNodes.push({
      id: 'bush_regen_' + Date.now(),
      type: 'bush',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      health: 2,
      maxHealth: 2,
      width: 28,
      height: 24
    });
  }
}, 30000); // Every 30 seconds

// ==================== GAME OVER CHECK ====================
function checkGameOver() {
  if (gameState.stats.health <= 0) {
    gameState.isRunning = false;
    
    let reason = 'O pato não resistiu...';
    if (gameState.stats.hunger <= 0) {
      reason = 'A fome venceu o pequeno pato...';
    } else if (gameState.stats.energy <= 0) {
      reason = 'O cansaço foi demais...';
    } else if (gameState.nightDanger >= 100) {
      reason = 'A escuridão consumiu tudo...';
    }
    
    document.getElementById('death-reason').textContent = reason;
    document.getElementById('survival-days').textContent = `Você sobreviveu ${gameState.time.dayCount} dia(s)`;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('game-over').classList.add('active');
  }
}

// ==================== BUILDING PLACEMENT ====================
// Add building when using kit from inventory
const originalUseItem = useItem;
window.useItem = function(type) {
  if (type.endsWith('_kit')) {
    const buildingType = type.replace('_kit', '');
    
    gameState.buildings.push({
      id: 'building_' + Date.now(),
      type: buildingType,
      x: gameState.duck.x - 40,
      y: gameState.duck.y + 20,
      width: 80,
      height: 50
    });
    
    removeFromInventory(type, 1);
    renderInventory();
    return;
  }
  
  originalUseItem(type);
};
