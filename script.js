const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const assets = {
    images: {},
    loaded: 0,
    total: 0,
    isReady: false
};

const assetList = {
    patoWalk1: 'Walking 001.png',
    patoWalk2: 'Walking 002.png',
    patoIdle1: 'idle_001.png',
    patoIdle2: 'idle_002.png',
    arvore: 'arvore.png',
    rocha: 'rocha.png',
    rabbitSheet: 'rabbit_sheet.png'
};

let game = {
    active: false,
    player: { x: 1000, y: 1000, dir: 1, speed: 3.5, frame: 0, frameCount: 0, tilt: 0 },
    cam: { x: 0, y: 0, shake: 0 },
    keys: { u: 0, d: 0, l: 0, r: 0, action: false },
    res: { wood: 0, stone: 0 },
    inv: { bench: 0, axe: false, pick: false, torch: false },
    built: [],
    enemies: [],
    mapHP: new Map(),
    selectedSlot: 0,
    time: 480,
    day: 1,
    isNearBench: false,
    particles: []
};

function loadAssets(callback) {
    assets.total = Object.keys(assetList).length;
    Object.keys(assetList).forEach(key => {
        const img = new Image();
        img.src = assetList[key];
        img.onload = () => {
            assets.loaded++;
            updateLoadingScreen();
            if(assets.loaded === assets.total) {
                assets.isReady = true;
                if(callback) callback();
            }
        };
        img.onerror = () => {
            assets.loaded++;
            if(assets.loaded === assets.total) {
                assets.isReady = true;
                if(callback) callback();
            }
        };
        assets.images[key] = img;
    });
}

function updateLoadingScreen() {
    const percentage = Math.floor((assets.loaded / assets.total) * 100);
    const loadingText = document.getElementById('version-log');
    if(loadingText && !assets.isReady) {
        loadingText.innerHTML = `⏳ CARREGANDO... ${percentage}%`;
    } else if(loadingText && assets.isReady) {
        loadingText.innerHTML = `BUILD: 2.1.1 - HOTFIX`;
    }
}

function spawnRabbit() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 300 + Math.random() * 200;
    game.enemies.push({
        x: game.player.x + Math.cos(angle) * distance,
        y: game.player.y + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        frame: 0,
        frameCount: 0,
        state: 'idle',
        hopCooldown: 60
    });
}

function updateEnemies() {
    game.enemies.forEach(rabbit => {
        rabbit.frameCount++;
        if(rabbit.state === 'idle') {
            rabbit.hopCooldown--;
            if(rabbit.hopCooldown <= 0) {
                rabbit.state = 'hop';
                const angle = Math.random() * Math.PI * 2;
                rabbit.vx = Math.cos(angle) * 2;
                rabbit.vy = Math.sin(angle) * 2;
                rabbit.hopCooldown = 60 + Math.random() * 60;
            }
        } else if(rabbit.state === 'hop') {
            rabbit.x += rabbit.vx;
            rabbit.y += rabbit.vy;
            rabbit.vx *= 0.95;
            rabbit.vy *= 0.95;
            if(Math.abs(rabbit.vx) < 0.1 && Math.abs(rabbit.vy) < 0.1) {
                rabbit.state = 'idle';
                rabbit.vx = 0;
                rabbit.vy = 0;
            }
        }
    });
    game.enemies = game.enemies.filter(rabbit => {
        const dist = Math.hypot(rabbit.x - game.player.x, rabbit.y - game.player.y);
        return dist < 1000;
    });
    if(game.enemies.length < 3 && Math.random() < 0.02) {
        spawnRabbit();
    }
}

function checkSave() {
    const saveData = localStorage.getItem('PatoDreamSave');
    if(saveData) {
        try {
            const data = JSON.parse(saveData);
            const btnContinue = document.getElementById('btn-continue');
            if(btnContinue) {
                btnContinue.disabled = false;
                btnContinue.innerHTML = `CONTINUAR<br><small style="font-size:10px">DIA ${data.day}</small>`;
            }
        } catch(e) {
            localStorage.removeItem('PatoDreamSave');
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
    localStorage.setItem('PatoDreamSave', JSON.stringify(saveData));
}

function loadGame() {
    const raw = localStorage.getItem('PatoDreamSave');
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
        alert('❌ Erro ao carregar save. Iniciando novo jogo.');
        newGame();
    }
}

function newGame() {
    localStorage.removeItem('PatoDreamSave');
    game = {
        active: false,
        player: { x: 1000, y: 1000, dir: 1, speed: 3.5, frame: 0, frameCount: 0, tilt: 0 },
        cam: { x: 0, y: 0, shake: 0 },
        keys: { u: 0, d: 0, l: 0, r: 0, action: false },
        res: { wood: 0, stone: 0 },
        inv: { bench: 0, axe: false, pick: false, torch: false },
        built: [],
        enemies: [],
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
    if(!assets.isReady) {
        alert('⚠️ Assets ainda não carregados. Aguarde...');
        return;
    }
    game.active = true;
    const menuScreen = document.getElementById('menu-screen');
    const gameUI = document.getElementById('game-ui');
    if(menuScreen) menuScreen.classList.add('hidden');
    if(gameUI) gameUI.classList.remove('hidden');
    updateHUD();
    updateInventoryUI();
    for(let i = 0; i < 3; i++) {
        spawnRabbit();
    }
    render();
    setInterval(saveGame, 15000);
}

function toggleConfig() {
    const modal = document.getElementById('config-modal');
    if(modal) {
        modal.classList.toggle('hidden');
    }
}

function resetSave() {
    if(confirm("⚠️ Apagar todo o progresso?\n\nEsta ação não pode ser desfeita.")) {
        localStorage.removeItem('PatoDreamSave');
        alert("✅ Progresso apagado com sucesso!");
        location.reload();
    }
}

function openPatchNotes() {
    const modal = document.getElementById('patch-modal');
    if(modal) {
        modal.classList.remove('hidden');
    }
}

function closePatchNotes() {
    const modal = document.getElementById('patch-modal');
    if(modal) {
        modal.classList.add('hidden');
    }
}

function toggleCraft() {
    const panel = document.getElementById('craft-panel');
    if(panel) {
        panel.classList.toggle('hidden');
        updateCraftAvailability();
    }
}

function updateCraftAvailability() {
    const benchBtn = document.querySelector('[data-craft="bench"]');
    const torchBtn = document.querySelector('[data-craft="torch"]');
    const axeBtn = document.querySelector('[data-craft="axe"]');
    const pickBtn = document.querySelector('[data-craft="pick"]');
    if(benchBtn) {
        if(game.res.wood >= 10) benchBtn.classList.remove('disabled');
        else benchBtn.classList.add('disabled');
    }
    if(torchBtn) {
        if(game.res.wood >= 5) torchBtn.classList.remove('disabled');
        else torchBtn.classList.add('disabled');
    }
    if(axeBtn && pickBtn) {
        if(game.isNearBench && game.res.wood >= 5 && game.res.stone >= 5) {
            axeBtn.classList.remove('disabled');
            pickBtn.classList.remove('disabled');
        } else {
            axeBtn.classList.add('disabled');
            pickBtn.classList.add('disabled');
        }
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
    const slots = {
        s1: game.inv.bench > 0 ? `🔨<br>x${game.inv.bench}` : '-',
        s2: game.inv.axe ? '🪓<br>Machado' : '-',
        s3: game.inv.pick ? '⛏️<br>Picareta' : '-',
        s4: game.inv.torch ? '🔥<br>Tocha' : '-'
    };
    Object.keys(slots).forEach(id => {
        const slot = document.getElementById(id);
        if(slot) slot.innerHTML = slots[id];
    });
}

function updateHUD() {
    const elements = {
        'w-val': game.res.wood,
        's-val': game.res.stone,
        'day-val': game.day
    };
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = elements[id];
    });
    const h = Math.floor(game.time / 60) % 24;
    const m = Math.floor(game.time % 60);
    const clockEl = document.getElementById('clock-val');
    if(clockEl) {
        clockEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    updateCraftAvailability();
}

function handleAction() {
    if(game.selectedSlot === 1 && game.inv.bench > 0) {
        game.built.push({ x: Math.round(game.player.x), y: Math.round(game.player.y) });
        game.inv.bench--;
        updateInventoryUI();
        game.cam.shake = 8;
        createParticle(game.player.x, game.player.y, '🔨', '#fbbf24');
        saveGame();
        return;
    }
    const px = Math.floor(game.player.x / 60);
    const py = Math.floor(game.player.y / 60);
    for(let x = px - 1; x <= px + 1; x++) {
        for(let y = py - 1; y <= py + 1; y++) {
            const id = `${x},${y}`;
            const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
            if(n > 0.2) continue;
            const rx = x * 60 + 30;
            const ry = y * 60 + 30;
            const isTree = n < 0.1;
            const isRock = n >= 0.1 && n < 0.2;
            let hitboxWidth, hitboxHeight, hitboxOffsetY;
            if(isTree) {
                hitboxWidth = 30;
                hitboxHeight = 35;
                hitboxOffsetY = -15;
            } else if(isRock) {
                hitboxWidth = 40;
                hitboxHeight = 25;
                hitboxOffsetY = -10;
            }
            const distX = Math.abs(game.player.x - rx);
            const distY = Math.abs(game.player.y - (ry + hitboxOffsetY + hitboxHeight / 2));
            if(distX < (hitboxWidth / 2 + 15) && distY < (hitboxHeight / 2 + 15)) {
                if(!game.mapHP.has(id)) {
                    game.mapHP.set(id, 6);
                }
                let damage = 1;
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

function bindButton(id, key) {
    const el = document.getElementById(id);
    if(!el) return;
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

window.addEventListener('load', function() {
    const btnNewGame = document.getElementById('btn-new-game');
    const btnContinue = document.getElementById('btn-continue');
    const btnConfig = document.getElementById('btn-config');
    const btnPatchNotes = document.getElementById('btn-patch-notes');
    if(btnNewGame) btnNewGame.addEventListener('click', newGame);
    if(btnContinue) btnContinue.addEventListener('click', loadGame);
    if(btnConfig) btnConfig.addEventListener('click', toggleConfig);
    if(btnPatchNotes) btnPatchNotes.addEventListener('click', openPatchNotes);
    const btnResetSave = document.getElementById('btn-reset-save');
    const btnCloseConfig = document.getElementById('btn-close-config');
    if(btnResetSave) btnResetSave.addEventListener('click', resetSave);
    if(btnCloseConfig) btnCloseConfig.addEventListener('click', toggleConfig);
    const btnClosePatch = document.getElementById('btn-close-patch');
    const patchModal = document.getElementById('patch-modal');
    if(btnClosePatch) btnClosePatch.addEventListener('click', closePatchNotes);
    if(patchModal) {
        patchModal.addEventListener('click', function(e) {
            if(e.target === patchModal) closePatchNotes();
        });
    }
    const btnInv = document.getElementById('btn-inv');
    if(btnInv) btnInv.addEventListener('click', toggleCraft);
    document.querySelectorAll('.craft-item').forEach(item => {
        item.addEventListener('click', function() {
            const craftType = this.getAttribute('data-craft');
            if(craftType) doCraft(craftType);
        });
    });
    bindButton('b-u', 'u');
    bindButton('b-d', 'd');
    bindButton('b-l', 'l');
    bindButton('b-r', 'r');
    const actionBtn = document.getElementById('btn-action');
    if(actionBtn) {
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
    }
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
    for(let i = 0; i <= 4; i++) {
        const slot = document.getElementById('s' + i);
        if(slot) {
            slot.addEventListener('click', function() {
                document.querySelectorAll('.slot').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                game.selectedSlot = i;
            });
        }
    }
    checkSave();
    loadAssets(() => {
        console.log('✅ Sistema pronto!');
    });
});