const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// ==================== GAME STATE ====================
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;
const TILE_SIZE = 32;

const gameState = {
  isRunning: false,
  duck: {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    speed: 2,
    direction: 'right',
    isMoving: false,
    isAttacking: false,
    isHarvesting: false,
    harvestProgress: 0,
    animationFrame: 0
  },
  stats: {
    health: 100,
    hunger: 100,
    energy: 100,
    fear: 0
  },
  time: {
    hour: 6,
    minute: 0,
    dayCount: 1,
    isNight: false
  },
  camera: { x: 0, y: 0 },
  inventory: [],
  maxInventorySlots: 20,
  resourceNodes: [],
  droppedItems: [],
  buildings: [],
  obstacles: [],
  enemies: [],
  canSleep: false,
  isInShelter: false,
  nightDanger: 0,
  buffs: [],
  dreamCount: 0
};

// ==================== CANVAS SETUP ====================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==================== WORLD GENERATION ====================
function generateWorld() {
  gameState.resourceNodes = [];
  gameState.obstacles = [];
  
  // Generate trees
  for (let i = 0; i < 50; i++) {
    gameState.resourceNodes.push({
      id: 'tree_' + i,
      type: 'tree',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      health: 5,
      maxHealth: 5,
      width: 48,
      height: 64
    });
  }
  
  // Generate rocks
  for (let i = 0; i < 30; i++) {
    gameState.resourceNodes.push({
      id: 'rock_' + i,
      type: 'rock',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      health: 8,
      maxHealth: 8,
      width: 32,
      height: 28
    });
  }
  
  // Generate bushes
  for (let i = 0; i < 40; i++) {
    gameState.resourceNodes.push({
      id: 'bush_' + i,
      type: 'bush',
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      health: 2,
      maxHealth: 2,
      width: 28,
      height: 24
    });
  }
  
  // Generate water areas
  for (let i = 0; i < 3; i++) {
    gameState.obstacles.push({
      type: 'water',
      x: Math.random() * (WORLD_WIDTH - 200),
      y: Math.random() * (WORLD_HEIGHT - 150),
      width: 150 + Math.random() * 100,
      height: 100 + Math.random() * 80
    });
  }
}

// ==================== COLLISION DETECTION ====================
function checkCollision(x, y, width, height, targetX, targetY, targetW, targetH) {
  return x < targetX + targetW &&
         x + width > targetX &&
         y < targetY + targetH &&
         y + height > targetY;
}

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ==================== JOYSTICK CONTROLS ====================
const joystickBase = document.getElementById('joystick-base');
const joystickHandle = document.getElementById('joystick-handle');
let joystickActive = false;
const joystickMaxDist = 30;

function handleJoystickStart(clientX, clientY) {
  joystickActive = true;
  handleJoystickMove(clientX, clientY);
}

function handleJoystickMove(clientX, clientY) {
  if (!joystickActive) return;
  
  const rect = joystickBase.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  let dx = clientX - centerX;
  let dy = clientY - centerY;
  
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > joystickMaxDist) {
    dx = (dx / dist) * joystickMaxDist;
    dy = (dy / dist) * joystickMaxDist;
  }
  
  joystickHandle.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  
  const normalX = dx / joystickMaxDist;
  const normalY = dy / joystickMaxDist;
  
  gameState.duck.vx = normalX * gameState.duck.speed;
  gameState.duck.vy = normalY * gameState.duck.speed;
  gameState.duck.isMoving = dist > 5;
  
  if (Math.abs(normalX) > Math.abs(normalY)) {
    gameState.duck.direction = normalX > 0 ? 'right' : 'left';
  } else if (Math.abs(normalY) > 0.1) {
    gameState.duck.direction = normalY > 0 ? 'down' : 'up';
  }
}

function handleJoystickEnd() {
  joystickActive = false;
  joystickHandle.style.transform = 'translate(-50%, -50%)';
  gameState.duck.vx = 0;
  gameState.duck.vy = 0;
  gameState.duck.isMoving = false;
}

// Touch events
joystickBase.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  handleJoystickStart(touch.clientX, touch.clientY);
});

joystickBase.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  handleJoystickMove(touch.clientX, touch.clientY);
});

joystickBase.addEventListener('touchend', handleJoystickEnd);

// Mouse events (for testing on desktop)
joystickBase.addEventListener('mousedown', (e) => {
  handleJoystickStart(e.clientX, e.clientY);
});

document.addEventListener('mousemove', (e) => {
  if (joystickActive) handleJoystickMove(e.clientX, e.clientY);
});

document.addEventListener('mouseup', handleJoystickEnd);

// ==================== ACTION BUTTONS ====================
const btnAttack = document.getElementById('btn-attack');
const btnHarvest = document.getElementById('btn-harvest');
const btnSleep = document.getElementById('btn-sleep');
const btnInventory = document.getElementById('btn-inventory');
const btnCraft = document.getElementById('btn-craft');

btnAttack.addEventListener('click', () => {
  if (!gameState.duck.isAttacking) {
    gameState.duck.isAttacking = true;
    performAttack();
    setTimeout(() => {
      gameState.duck.isAttacking = false;
    }, 300);
  }
});

btnHarvest.addEventListener('touchstart', (e) => {
  e.preventDefault();
  gameState.duck.isHarvesting = true;
});

btnHarvest.addEventListener('touchend', (e) => {
  e.preventDefault();
  gameState.duck.isHarvesting = false;
  gameState.duck.harvestProgress = 0;
});

btnHarvest.addEventListener('mousedown', () => {
  gameState.duck.isHarvesting = true;
});

btnHarvest.addEventListener('mouseup', () => {
  gameState.duck.isHarvesting = false;
  gameState.duck.harvestProgress = 0;
});

btnSleep.addEventListener('click', () => {
  if (gameState.canSleep && gameState.stats.energy >= 10) {
    startDream();
  }
});

btnInventory.addEventListener('click', toggleInventory);
btnCraft.addEventListener('click', toggleCrafting);

// ==================== ATTACK SYSTEM ====================
function performAttack() {
  const attackRange = 40;
  const duck = gameState.duck;
  
  // Check enemies
  gameState.enemies = gameState.enemies.filter(enemy => {
    const dist = getDistance(duck.x, duck.y, enemy.x, enemy.y);
    if (dist < attackRange) {
      enemy.health -= 25;
      return enemy.health > 0;
    }
    return true;
  });
}

// ==================== HARVEST SYSTEM ====================
function updateHarvesting() {
  if (!gameState.duck.isHarvesting) return;
  
  const harvestRange = 50;
  const duck = gameState.duck;
  
  for (let i = gameState.resourceNodes.length - 1; i >= 0; i--) {
    const node = gameState.resourceNodes[i];
    const dist = getDistance(duck.x, duck.y, node.x + node.width/2, node.y + node.height/2);
    
    if (dist < harvestRange) {
      gameState.duck.harvestProgress += 0.02;
      
      if (gameState.duck.harvestProgress >= 1) {
        node.health--;
        gameState.duck.harvestProgress = 0;
        
        // Drop resources
        const dropType = node.type === 'tree' ? 'wood' : 
                         node.type === 'rock' ? 'stone' : 'fiber';
        
        gameState.droppedItems.push({
          id: 'drop_' + Date.now(),
          type: dropType,
          x: node.x + node.width/2,
          y: node.y + node.height/2,
          count: 1
        });
        
        if (node.health <= 0) {
          gameState.resourceNodes.splice(i, 1);
        }
      }
      break;
    }
  }
}

// ==================== ITEM COLLECTION ====================
function collectItems() {
  const collectRange = 30;
  const duck = gameState.duck;
  
  gameState.droppedItems = gameState.droppedItems.filter(item => {
    const dist = getDistance(duck.x, duck.y, item.x, item.y);
    if (dist < collectRange) {
      addToInventory(item.type, item.count);
      return false;
    }
    return true;
  });
}

function addToInventory(type, count) {
  const existing = gameState.inventory.find(i => i.type === type);
  if (existing) {
    existing.count += count;
  } else if (gameState.inventory.length < gameState.maxInventorySlots) {
    gameState.inventory.push({ type, count });
  }
  updateInventoryBadge();
}

function removeFromInventory(type, count) {
  const idx = gameState.inventory.findIndex(i => i.type === type);
  if (idx !== -1) {
    gameState.inventory[idx].count -= count;
    if (gameState.inventory[idx].count <= 0) {
      gameState.inventory.splice(idx, 1);
    }
    updateInventoryBadge();
    return true;
  }
  return false;
}

function getInventoryCount(type) {
  const item = gameState.inventory.find(i => i.type === type);
  return item ? item.count : 0;
}

function updateInventoryBadge() {
  const total = gameState.inventory.reduce((sum, i) => sum + i.count, 0);
  const badge = document.getElementById('inventory-count');
  if (total > 0) {
    badge.textContent = total > 9 ? '9+' : total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ==================== INVENTORY UI ====================
const inventoryPanel = document.getElementById('inventory-panel');
const inventoryGrid = document.getElementById('inventory-grid');
const closeInventory = document.getElementById('close-inventory');

function toggleInventory() {
  inventoryPanel.classList.toggle('hidden');
  if (!inventoryPanel.classList.contains('hidden')) {
    renderInventory();
  }
}

closeInventory.addEventListener('click', () => {
  inventoryPanel.classList.add('hidden');
});

function renderInventory() {
  inventoryGrid.innerHTML = '';
  
  for (let i = 0; i < gameState.maxInventorySlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'inventory-slot';
    
    if (gameState.inventory[i]) {
      const item = gameState.inventory[i];
      slot.classList.add('has-item');
      slot.innerHTML = `
        <span class="item-icon">${getItemIcon(item.type)}</span>
        <span class="item-count">${item.count}</span>
      `;
      slot.onclick = () => useItem(item.type);
    }
    
    inventoryGrid.appendChild(slot);
  }
}

function getItemIcon(type) {
  const icons = {
    wood: '🪵',
    stone: '🪨',
    fiber: '🌿',
    berry: '🫐',
    mushroom: '🍄',
    coal: '�ite',
    cooked_berry: '🍇',
    mushroom_stew: '🍲',
    torch: '🔦',
    bandage: '🩹',
    shelter_kit: '🏕️',
    campfire_kit: '🔥',
    fence_kit: '🚧'
  };
  return icons[type] || '❓';
}

function useItem(type) {
  if (type === 'berry' || type === 'cooked_berry') {
    gameState.stats.hunger = Math.min(100, gameState.stats.hunger + (type === 'cooked_berry' ? 30 : 15));
    removeFromInventory(type, 1);
  } else if (type === 'mushroom_stew') {
    gameState.stats.hunger = Math.min(100, gameState.stats.hunger + 50);
    gameState.stats.energy = Math.min(100, gameState.stats.energy + 20);
    removeFromInventory(type, 1);
  } else if (type === 'bandage') {
    gameState.stats.health = Math.min(100, gameState.stats.health + 30);
    removeFromInventory(type, 1);
  } else if (type === 'torch') {
    gameState.buffs.push('vision');
    removeFromInventory(type, 1);
  }
  renderInventory();
  updateHUD();
}

// ==================== CRAFTING SYSTEM ====================
const craftingPanel = document.getElementById('crafting-panel');
const craftingList = document.getElementById('crafting-list');
const closeCrafting = document.getElementById('close-crafting');
const craftingTabs = document.querySelectorAll('.tab');

const recipes = [
  { id: 'cooked_berry', name: 'Fruta Assada', category: 'food', ingredients: [{ type: 'berry', count: 2 }], result: { type: 'cooked_berry', count: 1 } },
  { id: 'mushroom_stew', name: 'Ensopado', category: 'food', ingredients: [{ type: 'mushroom', count: 3 }, { type: 'fiber', count: 1 }], result: { type: 'mushroom_stew', count: 1 } },
  { id: 'torch', name: 'Tocha', category: 'tool', ingredients: [{ type: 'wood', count: 2 }, { type: 'fiber', count: 1 }], result: { type: 'torch', count: 1 } },
  { id: 'bandage', name: 'Bandagem', category: 'tool', ingredients: [{ type: 'fiber', count: 3 }], result: { type: 'bandage', count: 1 } },
  { id: 'campfire_kit', name: 'Fogueira', category: 'building', ingredients: [{ type: 'wood', count: 5 }, { type: 'stone', count: 3 }], result: { type: 'campfire_kit', count: 1 } },
  { id: 'shelter_kit', name: 'Abrigo', category: 'building', ingredients: [{ type: 'wood', count: 10 }, { type: 'fiber', count: 5 }], result: { type: 'shelter_kit', count: 1 } }
];

let currentCraftTab = 'food';

function toggleCrafting() {
  craftingPanel.classList.toggle('hidden');
  if (!craftingPanel.classList.contains('hidden')) {
    renderCrafting();
  }
}

closeCrafting.addEventListener('click', () => {
  craftingPanel.classList.add('hidden');
});

craftingTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    craftingTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentCraftTab = tab.dataset.tab;
    renderCrafting();
  });
});

function canCraft(recipe) {
  return recipe.ingredients.every(ing => getInventoryCount(ing.type) >= ing.count);
}

function renderCrafting() {
  const filtered = recipes.filter(r => r.category === currentCraftTab);
  
  craftingList.innerHTML = filtered.map(recipe => {
    const craftable = canCraft(recipe);
    const ingredientsText = recipe.ingredients.map(i => `${getItemIcon(i.type)}×${i.count}`).join(' ');
    
    return `
      <div class="craft-item ${craftable ? 'can-craft' : ''}">
        <span class="craft-icon">${getItemIcon(recipe.result.type)}</span>
        <div class="craft-info">
          <div class="craft-name">${recipe.name}</div>
          <div class="craft-ingredients">${ingredientsText}</div>
        </div>
        <button class="craft-btn ${craftable ? 'active' : ''}" 
                onclick="craftItem('${recipe.id}')" 
                ${craftable ? '' : 'disabled'}>
          Criar
        </button>
      </div>
    `;
  }).join('');
}

function craftItem(recipeId) {
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe || !canCraft(recipe)) return;
  
  // Remove ingredients
  recipe.ingredients.forEach(ing => {
    removeFromInventory(ing.type, ing.count);
  });
  
  // Add result
  addToInventory(recipe.result.type, recipe.result.count);
  
  renderCrafting();
}

// Make craftItem global
window.craftItem = craftItem;

// ==================== DREAM SYSTEM ====================
function startDream() {
  gameState.isRunning = false;
  document.getElementById('dream-overlay').classList.remove('hidden');
  
  const dreamTexts = [
    'O pato sonha com campos dourados...',
    'Memórias de um lago distante...',
    'Estrelas dançam na escuridão...',
    'Uma voz sussurra: "Continue..."'
  ];
  
  document.querySelector('.dream-text').textContent = dreamTexts[Math.floor(Math.random() * dreamTexts.length)];
  
  setTimeout(() => {
    endDream();
  }, 3000);
}

function endDream() {
  document.getElementById('dream-overlay').classList.add('hidden');
  
  // Restore stats
  gameState.stats.energy = 100;
  gameState.stats.fear = Math.max(0, gameState.stats.fear - 30);
  
  // Advance time
  gameState.time.hour = 6;
  gameState.time.isNight = false;
  gameState.time.dayCount++;
  gameState.dreamCount++;
  
  // Random buff
  const buffs = ['speed', 'vision', 'courage', 'strength'];
  const newBuff = buffs[Math.floor(Math.random() * buffs.length)];
  if (!gameState.buffs.includes(newBuff)) {
    gameState.buffs.push(newBuff);
  }
  
  gameState.isRunning = true;
  updateHUD();
}

// ==================== DRAWING ====================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update camera to follow duck
  gameState.camera.x = gameState.duck.x - canvas.width / 2;
  gameState.camera.y = gameState.duck.y - canvas.height / 2;
  
  // Clamp camera
  gameState.camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, gameState.camera.x));
  gameState.camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, gameState.camera.y));
  
  ctx.save();
  ctx.translate(-gameState.camera.x, -gameState.camera.y);
  
  // Draw ground
  drawGround();
  
  // Draw water
  drawWater();
  
  // Draw resources
  drawResources();
  
  // Draw dropped items
  drawDroppedItems();
  
  // Draw buildings
  drawBuildings();
  
  // Draw duck
  drawDuck();
  
  // Draw enemies
  drawEnemies();
  
  ctx.restore();
  
  // Draw night overlay
  if (gameState.time.isNight) {
    drawNightOverlay();
  }
}

function drawGround() {
  // Grass background
  ctx.fillStyle = '#3d6b3d';
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  
  // Tile pattern
  ctx.fillStyle = '#4a7f4a';
  for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
    for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {
      if ((x + y) / TILE_SIZE % 2 === 0) {
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

function drawWater() {
  const time = Date.now() / 1000;
  
  gameState.obstacles.filter(o => o.type === 'water').forEach(water => {
    // Water base
    ctx.fillStyle = '#4a90b0';
    ctx.fillRect(water.x, water.y, water.width, water.height);
    
    // Wave effect
    ctx.fillStyle = 'rgba(100, 180, 220, 0.5)';
    for (let wx = 0; wx < water.width; wx += 16) {
      const waveY = Math.sin(time * 2 + wx * 0.1) * 3;
      ctx.fillRect(water.x + wx, water.y + waveY + 10, 12, 4);
    }
  });
}

function drawResources() {
  gameState.resourceNodes.forEach(node => {
    if (node.type === 'tree') {
      // Trunk
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(node.x + 18, node.y + 40, 12, 24);
      
      // Leaves
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(node.x + 24, node.y + 24, 22, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#388e3c';
      ctx.beginPath();
      ctx.arc(node.x + 20, node.y + 20, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === 'rock') {
      ctx.fillStyle = '#757575';
      ctx.beginPath();
      ctx.moveTo(node.x + 16, node.y);
      ctx.lineTo(node.x + 32, node.y + 10);
      ctx.lineTo(node.x + 28, node.y + 28);
      ctx.lineTo(node.x + 4, node.y + 28);
      ctx.lineTo(node.x, node.y + 10);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#9e9e9e';
      ctx.beginPath();
      ctx.arc(node.x + 16, node.y + 12, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === 'bush') {
      ctx.fillStyle = '#558b2f';
      ctx.beginPath();
      ctx.arc(node.x + 14, node.y + 12, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Berries
      ctx.fillStyle = '#7b1fa2';
      ctx.beginPath();
      ctx.arc(node.x + 10, node.y + 14, 3, 0, Math.PI * 2);
      ctx.arc(node.x + 18, node.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawDroppedItems() {
  const time = Date.now() / 1000;
  
  gameState.droppedItems.forEach(item => {
    const bobY = Math.sin(time * 3 + item.x) * 3;
    
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(getItemIcon(item.type), item.x, item.y + bobY);
  });
}

function drawBuildings() {
  gameState.buildings.forEach(building => {
    if (building.type === 'campfire') {
      // Fire base
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(building.x, building.y + 20, 40, 12);
      
      // Flames
      const flicker = Math.random() * 4;
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.moveTo(building.x + 20, building.y - flicker);
      ctx.l
      // ==================== CONTINUAÇÃO DO DRAW E LOOP ====================

function drawDuck() {
  const duck = gameState.duck;
  const screenX = duck.x;
  const screenY = duck.y;

  ctx.save();
  // Inverte o pato se ele estiver indo para a esquerda
  if (duck.direction === 'left') {
    ctx.translate(screenX, screenY);
    ctx.scale(-1, 1);
    ctx.translate(-screenX, -screenY);
  }

  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(duck.x, duck.y + 12, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corpo do Pato (Círculo Amarelo - depois trocamos pela sua imagem!)
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(duck.x, duck.y, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Bico
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(duck.x + 8, duck.y - 2, 8, 6);
  
  ctx.restore();
}

function drawNightOverlay() {
  const opacity = Math.min(0.7, gameState.nightDanger / 100 + 0.4);
  ctx.fillStyle = `rgba(10, 10, 30, ${opacity})`;
  ctx.fillRect(gameState.camera.x, gameState.camera.y, canvas.width, canvas.height);
}

function updateHUD() {
  document.getElementById('health-bar').style.width = gameState.stats.health + '%';
  document.getElementById('health-text').textContent = Math.ceil(gameState.stats.health);
  
  document.getElementById('hunger-bar').style.width = gameState.stats.hunger + '%';
  document.getElementById('hunger-text').textContent = Math.ceil(gameState.stats.hunger);
  
  document.getElementById('energy-bar').style.width = gameState.stats.energy + '%';
  document.getElementById('energy-text').textContent = Math.ceil(gameState.stats.energy);
  
  document.getElementById('fear-bar').style.width = gameState.stats.fear + '%';
  document.getElementById('fear-text').textContent = Math.ceil(gameState.stats.fear);

  const hours = String(gameState.time.hour).padStart(2, '0');
  const minutes = String(Math.floor(gameState.time.minute)).padStart(2, '0');
  document.getElementById('time-text').textContent = `${hours}:${minutes}`;
  document.getElementById('day-text').textContent = `Dia ${gameState.time.dayCount}`;
}

// ==================== ENGINE START ====================

function gameLoop() {
  if (gameState.isRunning) {
    update(); // Vem do updates.js
    draw();   // Vem do script.js
  }
  requestAnimationFrame(gameLoop);
}

// Ligar o botão de Start
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('title-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  
  generateWorld();
  gameState.isRunning = true;
  gameLoop();
});

// Botão de Restart
document.getElementById('restart-btn').addEventListener('click', () => {
  location.reload();
});
