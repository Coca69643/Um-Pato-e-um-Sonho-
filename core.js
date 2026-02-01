const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    pato: { 
        x: 2500, y: 2500, speed: 6, runSpeed: 9, angle: 0, 
        inv: { wood: 0, stone: 0 },
        frame: 0, animTimer: 0,
        // Novos Status Survival
        hp: 100, maxHp: 100,
        hunger: 100, maxHunger: 100,
        energy: 100, maxEnergy: 100,
        miningTimer: 0 // Cooldown da picareta/bico
    },
    joy: { active: false, x: 0, y: 0, stickX: 0, stickY: 0 },
    cam: { x: 0, y: 0 },
    world: { 
        size: 5000, 
        items: [], 
        decor: [],
        particles: [] // Partículas de batida
    },
    assets: {},
    running: false,
    tick: 0
};

const sources = {
    'pato_idle': 'idle_001.png',
    'pato_walk1': 'Walking 001.png',
    'pato_walk2': 'Walking 002.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

window.iniciarJogo = function() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('loading-screen').style.display = 'flex';
    canvas.style.display = 'block';
    setTimeout(boot, 100);
};

const wait = ms => new Promise(r => setTimeout(r, ms));

async function boot() {
    resize();
    window.addEventListener('resize', resize);
    G.world.items = [];
    G.world.decor = [];

    // FASE 1: Chão (Otimizado)
    updateLoad("Semeando...", 20);
    await wait(50);
    for(let i=0; i<4500; i++) {
        G.world.decor.push({
            x: Math.random() * G.world.size,
            y: Math.random() * G.world.size,
            size: 2 + Math.random() * 3,
            color: Math.random() > 0.8 ? '#4caf50' : '#388e3c'
        });
    }

    // FASE 2: Florestas (Balanceado)
    updateLoad("Criando Florestas...", 45);
    await wait(100);
    // Menos densidade, mais espalhado
    createBiome('tree', 35, 10, 350, 3); // Vida da árvore = 3

    // FASE 3: Rochas (AUMENTADO)
    updateLoad("Formando Montanhas...", 70);
    await wait(100);
    // Muito mais clusters de pedra
    createBiome('stone', 40, 8, 250, 5); // Vida da rocha = 5

    // FASE 4: Assets
    updateLoad("Renderizando...", 90);
    let loadedCount = 0;
    const keys = Object.keys(sources);
    
    for (let key of keys) {
        G.assets[key] = new Image();
        G.assets[key].src = sources[key] + "?v=" + Date.now();
        G.assets[key].onload = () => {
            loadedCount++;
            if (loadedCount === keys.length) finishLoading();
        };
    }
}

function createBiome(type, clusters, density, radius, hpVal) {
    for (let c = 0; c < clusters; c++) {
        let cx = Math.random() * G.world.size;
        let cy = Math.random() * G.world.size;
        for (let i = 0; i < density; i++) {
            let angle = Math.random() * 6.28;
            let dist = Math.random() * radius;
            trySpawnItem(type, cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist, hpVal);
        }
    }
}

function trySpawnItem(type, x, y, hp) {
    if (x < 100 || x > G.world.size - 100 || y < 100 || y > G.world.size - 100) return;
    if (Math.hypot(x - 2500, y - 2500) < 300) return; // Spawn area livre
    
    for (let it of G.world.items) {
        if (Math.hypot(x - it.x, y - it.y) < 70) return; 
    }
    // Adiciona propriedade maxHp e currentHp
    G.world.items.push({ type, x, y, maxHp: hp, hp: hp, shake: 0 });
}

function updateLoad(msg, pct) {
    document.getElementById('load-status').innerText = msg;
    document.getElementById('progress-fill').style.width = pct + "%";
}

function finishLoading() {
    updateLoad("SOBREVIVÊNCIA INICIADA", 100);
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        G.running = true;
        gameLoop();
    }, 500);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Joystick bem no canto
    G.joy.y = canvas.height - 80;
    G.joy.x = 80;
}

function update() {
    if (!G.running) return;
    G.tick++;

    // 1. Movimento e Energia
    let currentSpeed = G.pato.speed;
    
    if (G.joy.active) {
        // Se tiver energia, corre um pouco mais rápido? (Opcional, mantive speed base pra n complicar)
        // Consumo de energia ao andar
        if (G.pato.energy > 0) G.pato.energy -= 0.05;
        
        G.pato.x += Math.cos(G.pato.angle) * currentSpeed;
        G.pato.y += Math.sin(G.pato.angle) * currentSpeed;
        G.pato.animTimer++;
        if (G.pato.animTimer > 8) {
            G.pato.frame = (G.pato.frame === 1) ? 2 : 1;
            G.pato.animTimer = 0;
        }
    } else { 
        G.pato.frame = 0;
        // Recupera energia parado
        if (G.pato.energy < G.pato.maxEnergy) G.pato.energy += 0.2;
    }

    // 2. Sistema de Fome e Vida
    if (G.tick % 120 === 0) { // A cada ~2 segundos
        if (G.pato.hunger > 0) {
            G.pato.hunger -= 0.5;
        } else {
            G.pato.hp -= 1; // Dano de fome
        }
        
        // Recupera vida se fome cheia
        if (G.pato.hunger > 80 && G.pato.hp < G.pato.maxHp) G.pato.hp += 0.5;
    }
    if (G.pato.hp <= 0) G.pato.hp = 0; // Game Over logic aqui futuramente

    // Limites do Mundo
    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    // Câmera
    G.cam.x += (G.pato.x - canvas.width / 2 - G.cam.x) * 0.1;
    G.cam.y += (G.pato.y - canvas.height / 2 - G.cam.y) * 0.1;

    // 3. Sistema de Coleta Realista (Bater no recurso)
    if (G.pato.miningTimer > 0) G.pato.miningTimer--;

    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let it = G.world.items[i];
        let dist = Math.hypot(G.pato.x - it.x, G.pato.y - it.y);
        
        if (it.shake > 0) it.shake--; // Reduz efeito de tremor

        if (dist < 70) { // Perto o suficiente para interagir
            // Auto-ataque a cada X frames se estiver parado ou andando perto
            if (G.pato.miningTimer === 0) {
                it.hp--;
                it.shake = 5; // Efeito visual
                G.pato.miningTimer = 30; // Cooldown entre batidas (0.5s)
                
                // Spawnar Partícula (Hit marker)
                G.world.particles.push({
                    x: it.x + (Math.random()*20-10),
                    y: it.y - 30,
                    dy: -1,
                    life: 20,
                    text: "*poc*"
                });

                if (it.hp <= 0) {
                    it.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
                    G.world.items.splice(i, 1);
                     // Spawnar Partícula de Item Coletado
                     G.world.particles.push({
                        x: it.x, y: it.y, dy: -2, life: 40, 
                        text: "+1", color: "#ffeb3b"
                    });
                }
            }
        }
    }

    // Atualizar partículas
    for (let i = G.world.particles.length - 1; i >= 0; i--) {
        let p = G.world.particles[i];
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) G.world.particles.splice(i, 1);
    }
}

function draw() {
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    const buffer = 100;
    const viewL = G.cam.x - buffer;
    const viewR = G.cam.x + canvas.width + buffer;
    const viewT = G.cam.y - buffer;
    const viewB = G.cam.y + canvas.height + buffer;

    // Decor
    G.world.decor.forEach(d => {
        if (d.x > viewL && d.x < viewR && d.y > viewT && d.y < viewB) {
            ctx.fillStyle = d.color;
            ctx.fillRect(d.x, d.y, d.size, d.size);
        }
    });

    // Itens com efeito de Dano (Shake)
    G.world.items.forEach(it => {
        if (it.x > viewL && it.x < viewR && it.y > viewT && it.y < viewB) {
            let img = G.assets[it.type];
            let shakeX = (it.shake > 0) ? (Math.random() * 4 - 2) : 0;
            
            if (img) {
                // Barra de vida do item se estiver sendo minado
                if (it.hp < it.maxHp) {
                    ctx.fillStyle = "#000";
                    ctx.fillRect(it.x - 20 + shakeX, it.y - 60, 40, 6);
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(it.x - 19 + shakeX, it.y - 59, 38 * (it.hp/it.maxHp), 4);
                }
                ctx.drawImage(img, it.x - 50 + shakeX, it.y - 50, 100, 100);
            }
        }
    });

    // Pato
    let pKey = (G.pato.frame === 0) ? 'pato_idle' : (G.pato.frame === 1 ? 'pato_walk1' : 'pato_walk2');
    let pImg = G.assets[pKey];
    if (pImg) {
        ctx.save();
        ctx.translate(G.pato.x, G.pato.y);
        if (Math.cos(G.pato.angle) < 0) ctx.scale(-1, 1);
        ctx.drawImage(pImg, -35, -35, 70, 70);
        ctx.restore();
    }

    // Partículas (Textos flutuantes)
    ctx.font = "10px 'Press Start 2P'";
    G.world.particles.forEach(p => {
        ctx.fillStyle = p.color || "#fff";
        ctx.fillText(p.text, p.x, p.y);
    });

    ctx.restore();

    drawHUD();
}

function drawHUD() {
    // 1. BARRAS DE STATUS (Topo Esquerdo)
    const barW = 120;
    const barH = 12;
    const pad = 10;
    const startY = 15;

    // Vida (Vermelho)
    drawBar(pad, startY, barW, barH, G.pato.hp, G.pato.maxHp, '#e53935', '❤️');
    // Fome (Laranja)
    drawBar(pad, startY + 20, barW, barH, G.pato.hunger, G.pato.maxHunger, '#fb8c00', '🍖');
    // Energia (Azul)
    drawBar(pad, startY + 40, barW, barH, G.pato.energy, G.pato.maxEnergy, '#039be5', '⚡');

    // 2. INVENTÁRIO (Topo Direito)
    // Movido para a direita para limpar a tela
    let invText = `🌲 ${G.pato.inv.wood} | 🪨 ${G.pato.inv.stone}`;
    ctx.font = "10px 'Press Start 2P'";
    let txtW = ctx.measureText(invText).width;
    
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.beginPath(); 
    ctx.roundRect(canvas.width - txtW - 30, 15, txtW + 20, 30, 6); 
    ctx.fill();
    
    ctx.fillStyle = "#fff";
    ctx.fillText(invText, canvas.width - txtW - 20, 35);

    // 3. JOYSTICK (Canto Inferior Esquerdo - Compacto)
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 40, 0, 6.28); ctx.stroke();
    
    // Stick (Botão do meio)
    let stickX = G.joy.x;
    let stickY = G.joy.y;
    if (G.joy.active) {
        stickX += Math.cos(G.pato.angle) * 25;
        stickY += Math.sin(G.pato.angle) * 25;
    }
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath(); ctx.arc(stickX, stickY, 18, 0, 6.28); ctx.fill();
}

function drawBar(x, y, w, h, val, max, color, icon) {
    // Fundo da barra
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 20, y, w, h);
    // Preenchimento
    let fillW = (val / max) * w;
    ctx.fillStyle = color;
    ctx.fillRect(x + 20, y, fillW, h);
    // Borda (opcional, para dar acabamento)
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 20, y, w, h);
    
    // Ícone
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.fillText(icon, x, y + 10);
}

function gameLoop() {
    if (G.running) { update(); draw(); requestAnimationFrame(gameLoop); }
}

// Controles
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    // Área de toque do joystick aumentada invisivelmente para facilitar
    if (t.clientX < canvas.width / 2 && t.clientY > canvas.height / 2) {
        G.joy.active = true;
        updateJoystick(t);
    }
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    e.preventDefault();
    updateJoystick(e.touches[0]);
}, {passive: false});

function updateJoystick(t) {
    let dx = t.clientX - G.joy.x;
    let dy = t.clientY - G.joy.y;
    G.pato.angle = Math.atan2(dy, dx);
}

canvas.addEventListener('touchend', () => G.joy.active = false);









