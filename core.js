const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    pato: { 
        x: 1500, y: 1500, speed: 8, angle: 0, 
        inv: { wood: 0, stone: 0 },
        frame: 0, animTimer: 0 // Controle de animação
    },
    joy: { active: false, x: 150, y: 0 },
    cam: { x: 0, y: 0 },
    world: { size: 4000, items: [] }, // Mundo um pouco maior
    assets: {},
    loaded: false
};

// Adicionamos os frames de caminhada aqui
const sources = {
    'pato_idle': 'idle_001.png',
    'pato_walk1': 'Walking 001.png',
    'pato_walk2': 'Walking 002.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

async function boot() {
    resize();
    window.addEventListener('resize', resize);

    // Gera 150 itens bem espalhados
    for (let i = 0; i < 150; i++) {
        G.world.items.push({
            type: Math.random() > 0.4 ? 'tree' : 'stone',
            x: Math.random() * G.world.size,
            y: Math.random() * G.world.size
        });
    }

    let loadedCount = 0;
    const total = Object.keys(sources).length;

    for (let key in sources) {
        G.assets[key] = new Image();
        G.assets[key].src = sources[key] + "?v=" + Date.now();
        G.assets[key].onload = () => { if (++loadedCount === total) start(); };
    }
}

function start() {
    G.loaded = true;
    if(document.getElementById('loading')) document.getElementById('loading').style.display = 'none';
    gameLoop();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 150;
}

function update() {
    if (G.joy.active) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;

        // Lógica de Animação: Troca de frame a cada 10 updates
        G.pato.animTimer++;
        if (G.pato.animTimer > 10) {
            G.pato.frame = G.pato.frame === 1 ? 2 : 1;
            G.pato.animTimer = 0;
        }
    } else {
        G.pato.frame = 0; // Frame de parado (idle)
    }

    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let item = G.world.items[i];
        if (Math.hypot(G.pato.x - item.x, G.pato.y - item.y) < 60) {
            item.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            G.world.items.splice(i, 1);
        }
    }
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; // Grama um pouco mais escura
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Itens
    G.world.items.forEach(item => {
        let img = G.assets[item.type];
        if (img && img.complete) {
            ctx.drawImage(img, item.x - 45, item.y - 45, 90, 90);
        }
    });

    // Pato Animado
    let pKey = 'pato_idle';
    if (G.pato.frame === 1) pKey = 'pato_walk1';
    if (G.pato.frame === 2) pKey = 'pato_walk2';
    
    let pImg = G.assets[pKey];
    if (pImg) {
        // Inverte o pato dependendo da direção (olhando pra esquerda ou direita)
        ctx.save();
        ctx.translate(G.pato.x, G.pato.y);
        if (Math.cos(G.pato.angle) < 0) ctx.scale(-1, 1);
        ctx.drawImage(pImg, -35, -35, 70, 70);
        ctx.restore();
    }

    ctx.restore();

    // UI Estilizada
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath(); ctx.roundRect(20, 20, 220, 50, 8); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`MADEIRA: ${G.pato.inv.wood}  PEDRA: ${G.pato.inv.stone}`, 35, 50);

    // Joystick Discreto
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 50, 0, Math.PI * 2); ctx.stroke();
    if (G.joy.active) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath(); 
        ctx.arc(G.joy.x + Math.cos(G.pato.angle)*30, G.joy.y + Math.sin(G.pato.angle)*30, 20, 0, Math.PI*2); 
        ctx.fill();
    }
}

function gameLoop() {
    if (G.loaded) { update(); draw(); requestAnimationFrame(gameLoop); }
}

canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 80) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    let t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});
canvas.addEventListener('touchend', () => G.joy.active = false);

boot();

