const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    pato: { 
        x: 1500, y: 1500, speed: 10, angle: 0, 
        inv: { wood: 0, stone: 0 },
        frame: 0, animTimer: 0 // Controle da animação
    },
    joy: { active: false, x: 150, y: 0 },
    cam: { x: 0, y: 0 },
    world: { size: 4000, items: [] },
    assets: {},
    loaded: false,
    gameRunning: false
};

// Mapeamento dos arquivos que estão no seu GitHub
const sources = {
    'pato_idle': 'idle_001.png',
    'pato_walk1': 'Walking 001.png',
    'pato_walk2': 'Walking 002.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

// Esta função é chamada pelo botão "COMEÇAR JORNADA" no HTML
window.iniciarJogo = function() {
    const menu = document.getElementById('main-menu');
    if (menu) menu.style.display = 'none';
    canvas.style.display = 'block';
    
    G.gameRunning = true;
    boot();
};

async function boot() {
    resize();
    window.addEventListener('resize', resize);

    // Gera 150 itens espalhados pelo mapa de 4000px
    if (G.world.items.length === 0) {
        for (let i = 0; i < 150; i++) {
            G.world.items.push({
                type: Math.random() > 0.4 ? 'tree' : 'stone',
                x: Math.random() * G.world.size,
                y: Math.random() * G.world.size
            });
        }
    }

    // Carregamento de Imagens
    let loadedCount = 0;
    const total = Object.keys(sources).length;

    for (let key in sources) {
        G.assets[key] = new Image();
        G.assets[key].src = sources[key] + "?v=" + Date.now();
        G.assets[key].onload = () => {
            loadedCount++;
            if (loadedCount === total) {
                G.loaded = true;
                gameLoop();
            }
        };
        G.assets[key].onerror = () => {
            console.error("Falha ao carregar asset: " + key);
            loadedCount++;
            if (loadedCount === total) {
                G.loaded = true;
                gameLoop();
            }
        };
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 150;
}

function update() {
    if (!G.gameRunning) return;

    if (G.joy.active) {
        // Movimento
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;

        // Animação de caminhada (troca de frame)
        G.pato.animTimer++;
        if (G.pato.animTimer > 8) { // Velocidade da batida de pata
            G.pato.frame = (G.pato.frame === 1) ? 2 : 1;
            G.pato.animTimer = 0;
        }
    } else {
        G.pato.frame = 0; // Parado
    }

    // Limites do Mundo
    G.pato.x = Math.max(50, Math.min(G.world.size - 50, G.pato.x));
    G.pato.y = Math.max(50, Math.min(G.world.size - 50, G.pato.y));

    // Câmera seguindo o pato
    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

    // Sistema de Coleta
    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let item = G.world.items[i];
        let dist = Math.hypot(G.pato.x - item.x, G.pato.y - item.y);
        if (dist < 60) {
            item.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            G.world.items.splice(i, 1);
        }
    }
}

function draw() {
    // Cor da Grama
    ctx.fillStyle = '#1e3d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Desenha Recursos (Árvores e Pedras)
    G.world.items.forEach(item => {
        let img = G.assets[item.type];
        if (img && img.complete) {
            ctx.drawImage(img, item.x - 50, item.y - 50, 100, 100);
        }
    });

    // Desenha Pato com Espelhamento (olhar para esquerda/direita)
    let currentKey = 'pato_idle';
    if (G.pato.frame === 1) currentKey = 'pato_walk1';
    if (G.pato.frame === 2) currentKey = 'pato_walk2';
    
    let pImg = G.assets[currentKey];
    if (pImg) {
        ctx.save();
        ctx.translate(G.pato.x, G.pato.y);
        // Se o ângulo do joystick aponta para a esquerda, inverte a imagem
        if (Math.cos(G.pato.angle) < 0) ctx.scale(-1, 1);
        ctx.drawImage(pImg, -35, -35, 70, 70);
        ctx.restore();
    }

    ctx.restore();

    // Interface (HUD) - Inventário
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath();
    ctx.roundRect(20, 20, 240, 55, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial"; // Fonte simples caso a Google Font não carregue
    ctx.fillText(`MADEIRA: ${G.pato.inv.wood}`, 40, 52);
    ctx.fillText(`PEDRA: ${G.pato.inv.stone}`, 150, 52);

    // Joystick Visual
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 60, 0, Math.PI * 2); ctx.stroke();
    
    if (G.joy.active) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath(); 
        ctx.arc(G.joy.x + Math.cos(G.pato.angle)*35, G.joy.y + Math.sin(G.pato.angle)*35, 25, 0, Math.PI*2); 
        ctx.fill();
    }
}

function gameLoop() {
    if (G.loaded && G.gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Eventos de Toque
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


