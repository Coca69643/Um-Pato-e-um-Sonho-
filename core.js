const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingText = document.getElementById('loading');

// Configuração do Jogo
const G = {
    pato: { x: 1500, y: 1500, speed: 8, angle: 0, inv: { wood: 0, stone: 0 } },
    joy: { active: false, x: 150, y: 0, dx: 0, dy: 0 }, // Joystick fixo na esquerda
    cam: { x: 0, y: 0 },
    world: { size: 3000, items: [] },
    assets: {},
    loaded: false
};

// 1. Definição das Imagens (Nomes EXATOS do seu GitHub)
const sources = {
    'pato': 'idle_001.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

// 2. Sistema de Carregamento Simples (Sem frescura de pixel)
async function boot() {
    // Configura tamanho da tela
    resize();
    window.addEventListener('resize', resize);

    // Gera o mundo (usa o Python ou o script de teste)
    if (window.py_gen) {
        G.world.items = Array.from(window.py_gen(G.world.size, 100)); // 100 itens
        console.log("Python gerou: " + G.world.items.length + " itens");
    }

    // Carrega imagens
    let loadedCount = 0;
    const total = Object.keys(sources).length;

    for (let key in sources) {
        G.assets[key] = new Image();
        // Truque para forçar atualização do GitHub (evita cache antigo)
        G.assets[key].src = sources[key] + "?t=" + new Date().getTime();
        
        G.assets[key].onload = () => {
            loadedCount++;
            checkLoad(loadedCount, total);
        };
        G.assets[key].onerror = () => {
            console.error("ERRO FATAL: Não achei a imagem " + sources[key]);
            loadedCount++; // Conta mesmo com erro pra não travar o jogo
            checkLoad(loadedCount, total);
        };
    }
}

function checkLoad(current, total) {
    if (current >= total) {
        loadingText.style.display = 'none';
        G.loaded = true;
        gameLoop();
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 150; // Posiciona joystick
}

// 3. Loop Principal
function update() {
    // Movimento do Pato
    if (G.joy.active) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }

    // Câmera segue o pato
    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

    // Coleta de Recursos
    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let item = G.world.items[i];
        let dist = Math.hypot(G.pato.x - item.x, G.pato.y - item.y);
        
        if (dist < 60) { // Distância de coleta
            if (item.type === 'tree') G.pato.inv.wood++;
            if (item.type === 'stone') G.pato.inv.stone++;
            G.world.items.splice(i, 1); // Remove item
        }
    }
}

function draw() {
    // Fundo Verde (Grama)
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Desenha Limites do Mundo
    ctx.strokeStyle = "red";
    ctx.lineWidth = 10;
    ctx.strokeRect(0,0, G.world.size, G.world.size);

    // Desenha Itens
    G.world.items.forEach(item => {
        let img = G.assets[item.type];
        
        // Verifica se a imagem carregou REALMENTE
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, item.x - 40, item.y - 40, 80, 80);
        } else {
            // FALLBACK VISUAL: Se a imagem falhar, desenha um círculo
            ctx.fillStyle = (item.type === 'tree') ? '#00ff00' : '#888888';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 30, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "white";
            ctx.fillText("ERRO", item.x-15, item.y);
        }
    });

    // Desenha Pato
    let pImg = G.assets['pato'];
    if (pImg && pImg.complete && pImg.naturalWidth !== 0) {
        ctx.drawImage(pImg, G.pato.x - 30, G.pato.y - 30, 60, 60);
    } else {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(G.pato.x - 20, G.pato.y - 20, 40, 40);
    }

    ctx.restore();

    // UI - Inventário
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 200, 50);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Madeira: ${G.pato.inv.wood} | Pedra: ${G.pato.inv.stone}`, 20, 40);

    // UI - Joystick
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(G.joy.x, G.joy.y, 60, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bolinha do Joystick
    if (G.joy.active) {
        let stickX = G.joy.x + Math.cos(G.pato.angle) * 40;
        let stickY = G.joy.y + Math.sin(G.pato.angle) * 40;
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(stickX, stickY, 20, 0, Math.PI*2); ctx.fill();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Controles (Touch)
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    let dist = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
    if (dist < 100) G.joy.active = true;
});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    let t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});

canvas.addEventListener('touchend', () => {
    G.joy.active = false;
});

// INICIAR
boot();
