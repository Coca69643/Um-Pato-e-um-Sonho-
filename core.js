const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loadingText = document.getElementById('loading');

const G = {
    pato: { x: 1500, y: 1500, speed: 8, angle: 0, inv: { wood: 0, stone: 0 } },
    joy: { active: false, x: 150, y: 0 },
    cam: { x: 0, y: 0 },
    world: { size: 3000, items: [] },
    assets: {},
    loaded: false
};

const sources = {
    'pato': 'idle_001.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

async function boot() {
    resize();
    window.addEventListener('resize', resize);

    // 1. Tenta usar o Python
    if (window.py_gen) {
        try {
            G.world.items = Array.from(window.py_gen(G.world.size, 100));
        } catch (e) { console.error("Erro no Python", e); }
    }

    // 2. REDE DE SEGURANÇA: Se tiver poucos itens, cria mais EM VOLTA DO PATO
    if (G.world.items.length < 10) {
        console.log("Gerando itens de emergência...");
        for (let i = 0; i < 50; i++) {
            // Gera num raio de 400px em volta do centro (1500, 1500)
            let ang = Math.random() * Math.PI * 2;
            let dist = Math.random() * 400; 
            G.world.items.push({
                type: Math.random() > 0.5 ? 'tree' : 'stone',
                x: 1500 + Math.cos(ang) * dist,
                y: 1500 + Math.sin(ang) * dist
            });
        }
    }

    // Carregamento de Imagens
    let loadedCount = 0;
    const total = Object.keys(sources).length;

    for (let key in sources) {
        G.assets[key] = new Image();
        // Adiciona timestamp para ignorar cache antigo
        G.assets[key].src = sources[key] + "?v=" + new Date().getTime();
        
        G.assets[key].onload = () => checkLoad(++loadedCount, total);
        G.assets[key].onerror = () => {
            console.warn("Imagem falhou: " + key);
            checkLoad(++loadedCount, total);
        };
    }
}

function checkLoad(current, total) {
    if (current >= total) {
        if(loadingText) loadingText.style.display = 'none';
        G.loaded = true;
        gameLoop();
    }
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
    }

    // Mantém o pato dentro do mundo
    G.pato.x = Math.max(0, Math.min(G.world.size, G.pato.x));
    G.pato.y = Math.max(0, Math.min(G.world.size, G.pato.y));

    G.cam.x = G.pato.x - canvas.width / 2;
    G.cam.y = G.pato.y - canvas.height / 2;

    // Coleta
    for (let i = G.world.items.length - 1; i >= 0; i--) {
        let item = G.world.items[i];
        let dist = Math.hypot(G.pato.x - item.x, G.pato.y - item.y);
        
        if (dist < 60) {
            if (item.type === 'tree') G.pato.inv.wood++;
            if (item.type === 'stone') G.pato.inv.stone++;
            G.world.items.splice(i, 1);
        }
    }
}

function draw() {
    // Fundo Verde Escuro
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.cam.x, -G.cam.y);

    // Borda do Mundo
    ctx.strokeStyle = "red";
    ctx.lineWidth = 10;
    ctx.strokeRect(0,0, G.world.size, G.world.size);

    // DEBUG: Desenha um "X" no centro do mapa (1500,1500) pra você se achar
    ctx.strokeStyle = "yellow";
    ctx.beginPath(); ctx.moveTo(1450,1450); ctx.lineTo(1550,1550); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1550,1450); ctx.lineTo(1450,1550); ctx.stroke();

    // Desenha Itens
    G.world.items.forEach(item => {
        let img = G.assets[item.type];
        
        // Prioridade: Imagem > Círculo Colorido
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, item.x - 40, item.y - 40, 80, 80);
        } else {
            // Se a imagem não carregar, desenha BOLINHA (Verde=Árvore, Cinza=Pedra)
            ctx.fillStyle = (item.type === 'tree') ? '#00ff00' : '#999999';
            ctx.beginPath();
            ctx.arc(item.x, item.y, 30, 0, Math.PI*2);
            ctx.fill();
            // Contorno preto pra destacar
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Desenha Pato
    let pImg = G.assets['pato'];
    if (pImg && pImg.complete && pImg.naturalWidth > 0) {
        ctx.drawImage(pImg, G.pato.x - 30, G.pato.y - 30, 60, 60);
    } else {
        ctx.fillStyle = 'white';
        ctx.fillRect(G.pato.x - 20, G.pato.y - 20, 40, 40);
    }

    ctx.restore();

    // UI
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, 10, 220, 50);
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText(`Madeira: ${G.pato.inv.wood}  Pedra: ${G.pato.inv.stone}`, 20, 42);

    // Joystick
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 60, 0, Math.PI * 2); ctx.stroke();
    
    if (G.joy.active) {
        let stickX = G.joy.x + Math.cos(G.pato.angle) * 40;
        let stickY = G.joy.y + Math.sin(G.pato.angle) * 40;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath(); ctx.arc(stickX, stickY, 25, 0, Math.PI*2); ctx.fill();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inputs
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 120) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    let t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});
canvas.addEventListener('touchend', () => G.joy.active = false);

boot();
