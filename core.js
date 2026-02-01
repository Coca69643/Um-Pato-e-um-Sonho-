const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    pato: { 
        x: 2500, y: 2500, speed: 8, angle: 0, 
        inv: { wood: 0, stone: 0 },
        frame: 0, animTimer: 0 
    },
    joy: { active: false, x: 0, y: 0 },
    cam: { x: 0, y: 0 },
    world: { 
        size: 5000, // Mapa Aumentado para 5000px
        items: [], // Arvores e Pedras (têm colisão)
        decor: []  // Graminhas e flores (apenas visual)
    },
    assets: {},
    running: false
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

    // FASE 1: Detalhes do Chão (Visual)
    updateLoad("Sememeando Grama...", 20);
    await wait(100);
    // Gera 4000 tufos de grama decorativa (muito leve pois é só desenho)
    for(let i=0; i<4000; i++) {
        G.world.decor.push({
            x: Math.random() * G.world.size,
            y: Math.random() * G.world.size,
            size: 2 + Math.random() * 3, // Tamanho variado
            color: Math.random() > 0.8 ? '#4caf50' : '#388e3c' // Variação de verde
        });
    }

    // FASE 2: Florestas Densas
    updateLoad("Cultivando Florestas...", 45);
    await wait(200);
    createBiome('tree', 30, 15, 400); // Mais florestas, mais densas

    // FASE 3: Campos Rochosos
    updateLoad("Formando Pedreiras...", 70);
    await wait(200);
    createBiome('stone', 15, 10, 300);

    // FASE 4: Carregamento Final
    updateLoad("Renderizando Assets...", 90);
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

function createBiome(type, clusters, density, radius) {
    for (let c = 0; c < clusters; c++) {
        let cx = Math.random() * G.world.size;
        let cy = Math.random() * G.world.size;
        for (let i = 0; i < density; i++) {
            let angle = Math.random() * 6.28;
            let dist = Math.random() * radius;
            trySpawnItem(type, cx + Math.cos(angle)*dist, cy + Math.sin(angle)*dist);
        }
    }
}

function trySpawnItem(type, x, y) {
    if (x < 100 || x > G.world.size - 100 || y < 100 || y > G.world.size - 100) return;
    if (Math.hypot(x - 2500, y - 2500) < 400) return; // Zona Segura maior
    
    // Evita itens encavalados
    for (let it of G.world.items) {
        if (Math.hypot(x - it.x, y - it.y) < 70) return; 
    }
    G.world.items.push({ type, x, y });
}

function updateLoad(msg, pct) {
    document.getElementById('load-status').innerText = msg;
    document.getElementById('progress-fill').style.width = pct + "%";
}

function finishLoading() {
    updateLoad("PRONTO!", 100);
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        G.running = true;
        gameLoop();
    }, 500);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120; // Joystick mais baixo
    G.joy.x = 120;
}

function update() {
    if (!G.running) return;

    if (G.joy.active) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
        G.pato.animTimer++;
        if (G.pato.animTimer > 8) {
            G.pato.frame = (G.pato.frame === 1) ? 2 : 1;
            G.pato.animTimer = 0;
        }
    } else { G.pato.frame = 0; }

    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    // Câmera suave
    G.cam.x += (G.pato.x - canvas.width / 2 - G.cam.x) * 0.1;
    G.cam.y += (G.pato.y - canvas.height / 2 - G.cam.y) * 0.1;

    // Coleta
    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let it = G.world.items[i];
        if (Math.hypot(G.pato.x - it.x, G.pato.y - it.y) < 60) {
            it.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            G.world.items.splice(i, 1);
        }
    }
}

function draw() {
    // 1. Fundo Base
    ctx.fillStyle = '#2d5a27'; // Verde floresta profundo
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // 2. OTIMIZAÇÃO: Culling de Decoração (Só desenha o que está na tela)
    // Isso permite ter milhares de graminhas sem travar o celular
    const buffer = 100;
    const viewL = G.cam.x - buffer;
    const viewR = G.cam.x + canvas.width + buffer;
    const viewT = G.cam.y - buffer;
    const viewB = G.cam.y + canvas.height + buffer;

    // Desenha Grama Decorativa (Procedural)
    G.world.decor.forEach(d => {
        if (d.x > viewL && d.x < viewR && d.y > viewT && d.y < viewB) {
            ctx.fillStyle = d.color;
            ctx.fillRect(d.x, d.y, d.size, d.size);
        }
    });

    // 3. Desenha Itens (Arvores/Pedras)
    G.world.items.forEach(it => {
        if (it.x > viewL && it.x < viewR && it.y > viewT && it.y < viewB) {
            let img = G.assets[it.type];
            if (img) ctx.drawImage(img, it.x - 50, it.y - 50, 100, 100);
        }
    });

    // 4. Desenha Pato
    let pKey = (G.pato.frame === 0) ? 'pato_idle' : (G.pato.frame === 1 ? 'pato_walk1' : 'pato_walk2');
    let pImg = G.assets[pKey];
    if (pImg) {
        ctx.save();
        ctx.translate(G.pato.x, G.pato.y);
        if (Math.cos(G.pato.angle) < 0) ctx.scale(-1, 1);
        ctx.drawImage(pImg, -35, -35, 70, 70);
        ctx.restore();
    }

    ctx.restore();

    // 5. Interface (HUD)
    drawHUD();
}

function drawHUD() {
    // Painel Recursos
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath(); ctx.roundRect(15, 15, 180, 35, 6); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "10px 'Press Start 2P'";
    ctx.fillText(`🌲 ${G.pato.inv.wood}  🪨 ${G.pato.inv.stone}`, 25, 38);

    // Joystick
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 45, 0, 6.28); ctx.stroke();
    if (G.joy.active) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath(); 
        ctx.arc(G.joy.x + Math.cos(G.pato.angle)*25, G.joy.y + Math.sin(G.pato.angle)*25, 20, 0, 6.28); 
        ctx.fill();
    }
}

function gameLoop() {
    if (G.running) { update(); draw(); requestAnimationFrame(gameLoop); }
}

// Controles
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 80) G.joy.active = true;
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    e.preventDefault(); // Evita rolar a tela
    let t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
}, {passive: false});

canvas.addEventListener('touchend', () => G.joy.active = false);








