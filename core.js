const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    pato: { 
        x: 2000, y: 2000, speed: 9, angle: 0, 
        inv: { wood: 0, stone: 0 },
        frame: 0, animTimer: 0 
    },
    joy: { active: false, x: 150, y: 0 },
    cam: { x: 0, y: 0 },
    world: { size: 4000, items: [] },
    assets: {},
    loaded: false,
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
    // Pequeno delay para a UI renderizar antes de travar no calculo
    setTimeout(boot, 100);
};

// Função auxiliar para esperar tempo (simular loading steps)
const wait = ms => new Promise(r => setTimeout(r, ms));

async function boot() {
    resize();
    window.addEventListener('resize', resize);
    
    // Resetar itens se for novo jogo
    G.world.items = []; 

    // ETAPA 1: Gerar Florestas (Biomas Verdes)
    updateLoad("Plantando Florestas...", 20);
    await wait(200);
    createBiome('tree', 18, 12, 350); // 18 núcleos, 12 arvores cada, raio 350

    // ETAPA 2: Gerar Pedreiras (Biomas Minerais)
    updateLoad("Esculpindo Montanhas...", 50);
    await wait(200);
    createBiome('stone', 12, 8, 250); // 12 núcleos, 8 pedras cada, raio 250

    // ETAPA 3: Decoração Espalhada
    updateLoad("Espalhando Detalhes...", 70);
    await wait(200);
    for(let i=0; i<30; i++) trySpawnItem(Math.random() > 0.5 ? 'tree' : 'stone');

    // ETAPA 4: Carregar Gráficos
    updateLoad("Carregando Texturas...", 90);
    let loadedCount = 0;
    const keys = Object.keys(sources);
    
    for (let key of keys) {
        G.assets[key] = new Image();
        G.assets[key].src = sources[key] + "?v=" + Date.now();
        G.assets[key].onload = () => {
            loadedCount++;
            if (loadedCount === keys.length) {
                finishLoading();
            }
        };
    }
}

// Lógica de Biomas
function createBiome(type, clusters, density, radius) {
    for (let c = 0; c < clusters; c++) {
        // Ponto central do bioma
        let cx = Math.random() * G.world.size;
        let cy = Math.random() * G.world.size;

        for (let i = 0; i < density; i++) {
            // Distribuição aleatória dentro do raio
            let angle = Math.random() * Math.PI * 2;
            let dist = Math.random() * radius;
            let x = cx + Math.cos(angle) * dist;
            let y = cy + Math.sin(angle) * dist;
            trySpawnItem(type, x, y);
        }
    }
}

// Tenta spawnar item garantindo que não colida e não esteja na zona segura
function trySpawnItem(type, x, y) {
    if (!x) x = Math.random() * G.world.size;
    if (!y) y = Math.random() * G.world.size;

    // 1. Manter dentro do mapa
    if (x < 100 || x > G.world.size - 100 || y < 100 || y > G.world.size - 100) return;

    // 2. Zona Segura (Spawn do Player)
    let distToPlayer = Math.hypot(x - 2000, y - 2000);
    if (distToPlayer < 300) return; // Nada spawna a 300px do centro

    // 3. Evitar sobreposição com outros itens
    for (let it of G.world.items) {
        if (Math.hypot(x - it.x, y - it.y) < 80) return; // Muito perto de outro
    }

    G.world.items.push({ type, x, y });
}

function updateLoad(msg, pct) {
    document.getElementById('load-status').innerText = msg;
    document.getElementById('progress-fill').style.width = pct + "%";
}

function finishLoading() {
    updateLoad("MUNDO PRONTO!", 100);
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        G.loaded = true;
        G.running = true;
        gameLoop();
    }, 500);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 130;
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
    } else {
        G.pato.frame = 0;
    }

    // Bordas do Mundo
    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    // Câmera
    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

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
    ctx.fillStyle = '#1e3d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Itens
    G.world.items.forEach(it => {
        let img = G.assets[it.type];
        if (img && img.complete) ctx.drawImage(img, it.x - 50, it.y - 50, 100, 100);
    });

    // Pato
    let pKey = 'pato_idle';
    if (G.pato.frame === 1) pKey = 'pato_walk1';
    if (G.pato.frame === 2) pKey = 'pato_walk2';
    
    let pImg = G.assets[pKey];
    if (pImg) {
        ctx.save();
        ctx.translate(G.pato.x, G.pato.y);
        if (Math.cos(G.pato.angle) < 0) ctx.scale(-1, 1);
        ctx.drawImage(pImg, -35, -35, 70, 70);
        ctx.restore();
    }

    ctx.restore();

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath(); ctx.roundRect(20, 20, 240, 50, 8); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.fillText(`MADEIRA: ${G.pato.inv.wood} | PEDRA: ${G.pato.inv.stone}`, 35, 50);

    // Joystick
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 55, 0, Math.PI * 2); ctx.stroke();
    if (G.joy.active) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); 
        ctx.arc(G.joy.x + Math.cos(G.pato.angle)*30, G.joy.y + Math.sin(G.pato.angle)*30, 22, 0, Math.PI*2); 
        ctx.fill();
    }
}

function gameLoop() {
    if (G.running) { update(); draw(); requestAnimationFrame(gameLoop); }
}

canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 100) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    let t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});
canvas.addEventListener('touchend', () => G.joy.active = false);







