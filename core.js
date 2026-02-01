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
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    const loader = document.getElementById('loading-txt');
    if (loader) loader.style.display = 'block';
    canvas.style.display = 'block';
    boot();
};

async function boot() {
    resize();
    window.addEventListener('resize', resize);

    // Distribuição de recursos pelo mapa 4k
    if (G.world.items.length === 0) {
        for (let i = 0; i < 180; i++) {
            G.world.items.push({
                type: Math.random() > 0.4 ? 'tree' : 'stone',
                x: Math.random() * G.world.size,
                y: Math.random() * G.world.size
            });
        }
    }

    let loadedCount = 0;
    const keys = Object.keys(sources);
    
    for (let key of keys) {
        G.assets[key] = new Image();
        G.assets[key].src = sources[key] + "?v=" + Date.now();
        G.assets[key].onload = () => {
            loadedCount++;
            if (loadedCount === keys.length) {
                const loader = document.getElementById('loading-txt');
                if (loader) loader.style.display = 'none';
                G.loaded = true;
                G.running = true;
                gameLoop();
            }
        };
    }
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

    // Colisão com bordas do mapa
    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    // Câmera dinâmica
    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

    // Detecção de coleta (aproximação)
    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let it = G.world.items[i];
        if (Math.hypot(G.pato.x - it.x, G.pato.y - it.y) < 60) {
            it.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            G.world.items.splice(i, 1);
        }
    }
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; // Fundo grama
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Desenhar Árvores e Pedras
    G.world.items.forEach(it => {
        let img = G.assets[it.type];
        if (img && img.complete) ctx.drawImage(img, it.x - 50, it.y - 50, 100, 100);
    });

    // Pato com animação e inversão horizontal
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

    // HUD do Inventário
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath(); ctx.roundRect(20, 20, 230, 45, 8); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.fillText(`MADEIRA: ${G.pato.inv.wood} | PEDRA: ${G.pato.inv.stone}`, 35, 48);

    // Desenho do Joystick
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

// Controles de Toque
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





