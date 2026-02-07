// ==================== PATO SURVIVAL - CORE ENGINE ====================
// Configuração do Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// Estado Global do Jogo
let game = {
    active: false,
    player: { 
        x: 1000, 
        y: 1000, 
        dir: 1, 
        speed: 3.5, 
        frame: 0,
        tilt: 0
    },
    cam: { x: 0, y: 0, shake: 0 },
    keys: { u: 0, d: 0, l: 0, r: 0, action: false },
    res: { wood: 0, stone: 0 },
    inv: { bench: 0, axe: false, pick: false, torch: false },
    built: [],
    mapHP: new Map(),
    selectedSlot: 0,
    time: 480, // 8:00 AM
    day: 1,
    isNearBench: false,
    particles: []
};

// ==================== SISTEMA DE SAVE ====================
function checkSave() {
    const saveData = localStorage.getItem('PatoSave_Definitive');
    if(saveData) {
        try {
            const data = JSON.parse(saveData);
            document.getElementById('btn-continue').disabled = false;
            document.getElementById('btn-continue').innerHTML = `CONTINUAR<br><small style="font-size:10px">DIA ${data.day}</small>`;
        } catch(e) {
            console.error('Save corrompido:', e);
            localStorage.removeItem('PatoSave_Definitive');
        }
    }
}

function saveGame() {
    const saveData = {
        res: game.res,
        inv: game.inv,
        built: game.built,
        time: game.time,
        day: game.day,
        player: { x: game.player.x, y: game.player.y },
        mapHP: Array.from(game.mapHP.entries())
    };
    localStorage.setItem('PatoSave_Definitive', JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem('PatoSave_Definitive');
    if(!raw) return;
    
    try {
        const data = JSON.parse(raw);
        game.res = data.res || { wood: 0, stone: 0 };
        game.inv = data.inv || { bench: 0, axe: false, pick: false, torch: false };
        game.built = data.built || [];
        game.time = data.time || 480;
        game.day = data.day || 1;
        game.player.x = data.player?.x || 1000;
        game.player.y = data.player?.y || 1000;
        game.mapHP = new Map(data.mapHP || []);
        
        startGame();
    } catch(e) {
        console.error('Erro ao carregar save:', e);
        alert('❌ Erro ao carregar save. Iniciando novo jogo.');
        newGame();
    }
}

function newGame() {
    localStorage.removeItem('PatoSave_Definitive');
    game = {
        active: false,
        player: { x: 1000, y: 1000, dir: 1, speed: 3.5, frame: 0, tilt: 0 },
        cam: { x: 0, y: 0, shake: 0 },
        keys: { u: 0, d: 0, l: 0, r: 0, action: false },
        res: { wood: 0, stone: 0 },
        inv: { bench: 0, axe: false, pick: false, torch: false },
        built: [],
        mapHP: new Map(),
        selectedSlot: 0,
        time: 480,
        day: 1,
        isNearBench: false,
        particles: []
    };
    startGame();
}

function startGame() {
    game.active = true;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    updateHUD();
    updateInventoryUI();
    render();
    setInterval(saveGame, 15000);
}

// ==================== UI E CONFIGURAÇÕES ====================
function toggleConfig() {
    document.getElementById('config-modal').classList.toggle('hidden');
}

function resetSave() {
    if(confirm("⚠️ Apagar todo o progresso?\n\nEsta ação não pode ser desfeita.")) {
        localStorage.removeItem('PatoSave_Definitive');
        alert("✅ Progresso apagado com sucesso!");
        location.reload();
    }
}

function toggleCraft() {
    document.getElementById('craft-panel').classList.toggle('hidden');
    updateCraftAvailability();
}

function updateCraftAvailability() {
    const benchBtn = document.querySelector('[data-craft="bench"]');
    const torchBtn = document.querySelector('[data-craft="torch"]');
    const axeBtn = document.querySelector('[data-craft="axe"]');
    const pickBtn = document.querySelector('[data-craft="pick"]');
    
    if(game.res.wood >= 10) benchBtn.classList.remove('disabled');
    else benchBtn.classList.add('disabled');
    
    if(game.res.wood >= 5) torchBtn.classList.remove('disabled');
    else torchBtn.classList.add('disabled');
    
    if(game.isNearBench && game.res.wood >= 5 && game.res.stone >= 5) {
        axeBtn.classList.remove('disabled');
        pickBtn.classList.remove('disabled');
    } else {
        axeBtn.classList.add('disabled');
        pickBtn.classList.add('disabled');
    }
}

function doCraft(item) {
    let success = false;
    
    if(item === 'bench' && game.res.wood >= 10) {
        game.res.wood -= 10;
        game.inv.bench++;
        success = true;
    }
    
    if(item === 'torch' && game.res.wood >= 5) {
        game.res.wood -= 5;
        game.inv.torch = true;
        success = true;
    }
    
    if(game.isNearBench && game.res.wood >= 5 && game.res.stone >= 5) {
        if(item === 'axe' && !game.inv.axe) {
            game.res.wood -= 5;
            game.res.stone -= 5;
            game.inv.axe = true;
            success = true;
        }
        if(item === 'pick' && !game.inv.pick) {
            game.res.wood -= 5;
            game.res.stone -= 5;
            game.inv.pick = true;
            success = true;
        }
    }
    
    if(success) {
        updateHUD();
        updateInventoryUI();
        updateCraftAvailability();
        saveGame();
        createParticle(canvas.width - 100, 100, '✨', '#fbbf24');
    }
}

function updateInventoryUI() {
    document.getElementById('s1').innerHTML = game.inv.bench > 0 ? `🔨<br>x${game.inv.bench}` : '-';
    document.getElementById('s2').innerHTML = game.inv.axe ? '🪓<br>Machado' : '-';
    document.getElementById('s3').innerHTML = game.inv.pick ? '⛏️<br>Picareta' : '-';
    document.getElementById('s4').innerHTML = game.inv.torch ? '🔥<br>Tocha' : '-';
}

function updateHUD() {
    document.getElementById('w-val').innerText = game.res.wood;
    document.getElementById('s-val').innerText = game.res.stone;
    document.getElementById('day-val').innerText = game.day;
    
    const h = Math.floor(game.time / 60) % 24;
    const m = Math.floor(game.time % 60);
    document.getElementById('clock-val').innerText = 
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    
    updateCraftAvailability();
}

// ==================== SISTEMA DE AÇÃO ====================
function handleAction() {
    // Colocar bancada
    if(game.selectedSlot === 1 && game.inv.bench > 0) {
        game.built.push({ x: Math.round(game.player.x), y: Math.round(game.player.y) });
        game.inv.bench--;
        updateInventoryUI();
        game.cam.shake = 8;
        createParticle(game.player.x, game.player.y, '🔨', '#fbbf24');
        saveGame();
        return;
    }
    
    // Coletar recursos
    const px = Math.floor(game.player.x / 60);
    const py = Math.floor(game.player.y / 60);
    
    for(let x = px - 1; x <= px + 1; x++) {
        for(let y = py - 1; y <= py + 1; y++) {
            const id = `${x},${y}`;
            const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
            
            if(n > 0.2) continue;
            
            const rx = x * 60 + 30;
            const ry = y * 60 + 30;
            const dist = Math.hypot(game.player.x - rx, game.player.y - ry);
            
            if(dist < 65) {
                if(!game.mapHP.has(id)) {
                    game.mapHP.set(id, 6);
                }
                
                let damage = 1;
                const isTree = n < 0.1;
                const isRock = n >= 0.1 && n < 0.2;
                
                if(isTree && game.inv.axe && game.selectedSlot === 2) damage = 3;
                if(isRock && game.inv.pick && game.selectedSlot === 3) damage = 3;
                
                const currentHP = game.mapHP.get(id);
                game.mapHP.set(id, currentHP - damage);
                
                game.cam.shake = 6;
                
                if(game.mapHP.get(id) <= 0) {
                    if(isTree) {
                        game.res.wood += 3;
                        createParticle(rx, ry, '🪵', '#8b4513');
                    } else if(isRock) {
                        game.res.stone += 3;
                        createParticle(rx, ry, '🪨', '#64748b');
                    }
                    game.mapHP.set(id, -1);
                }
                
                updateHUD();
                return;
            }
        }
    }
}

// ==================== SISTEMA DE PARTÍCULAS ====================
function createParticle(x, y, emoji, color) {
    for(let i = 0; i < 5; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 4 - 2,
            life: 60,
            emoji: emoji,
            color: color
        });
    }
}

function updateParticles() {
    game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
    });
}

function drawParticles() {
    ctx.save();
    game.particles.forEach(p => {
        ctx.globalAlpha = p.life / 60;
        ctx.font = '16px Arial';
        ctx.fillText(p.emoji, p.x - game.cam.x, p.y - game.cam.y);
    });
    ctx.restore();
}

// ==================== UTILIDADES ====================
function lerpColor(color1, color2, t) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ==================== SISTEMA DE INPUT ====================
function bindButton(id, key) {
    const el = document.getElementById(id);
    
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.keys[key] = 1;
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.keys[key] = 0;
    }, { passive: false });
    
    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        game.keys[key] = 1;
    });
    
    el.addEventListener('mouseup', (e) => {
        e.preventDefault();
        game.keys[key] = 0;
    });
}

bindButton('b-u', 'u');
bindButton('b-d', 'd');
bindButton('b-l', 'l');
bindButton('b-r', 'r');

const actionBtn = document.getElementById('btn-action');
actionBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.keys.action = true;
    handleAction();
}, { passive: false });

actionBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    game.keys.action = false;
}, { passive: false });

actionBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    game.keys.action = true;
    handleAction();
});

actionBtn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    game.keys.action = false;
});

// Teclado para desktop
window.addEventListener('keydown', (e) => {
    if(e.key === 'w' || e.key === 'ArrowUp') game.keys.u = 1;
    if(e.key === 's' || e.key === 'ArrowDown') game.keys.d = 1;
    if(e.key === 'a' || e.key === 'ArrowLeft') game.keys.l = 1;
    if(e.key === 'd' || e.key === 'ArrowRight') game.keys.r = 1;
    if(e.key === ' ' || e.key === 'e') {
        game.keys.action = true;
        handleAction();
    }
});

window.addEventListener('keyup', (e) => {
    if(e.key === 'w' || e.key === 'ArrowUp') game.keys.u = 0;
    if(e.key === 's' || e.key === 'ArrowDown') game.keys.d = 0;
    if(e.key === 'a' || e.key === 'ArrowLeft') game.keys.l = 0;
    if(e.key === 'd' || e.key === 'ArrowRight') game.keys.r = 0;
    if(e.key === ' ' || e.key === 'e') game.keys.action = false;
});

// Hotbar
for(let i = 0; i <= 4; i++) {
    document.getElementById('s' + i).addEventListener('click', function() {
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        game.selectedSlot = i;
    });
}

// ==================== INICIALIZAÇÃO ====================
checkSave();