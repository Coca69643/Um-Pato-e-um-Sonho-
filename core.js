const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 500, y: 500, speed: 5, moving: false, angle: 0 },
    camera: { x: 0, y: 0 },
    joy: { active: false, x: 120, y: 0 },
    resources: [], worldSize: 2000, loaded: false
};

// Carregamento direto sem frescura
async function carregarTudo() {
    // 1. Coordenadas do Python
    if (window.py_gen) {
        G.resources = Array.from(window.py_gen(G.worldSize, 60));
    }

    // 2. Tenta carregar imagens
    const manifest = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    for (let key in manifest) {
        let img = new Image();
        img.src = manifest[key] + "?v=" + Date.now();
        img.onload = () => { G.assets[key] = img; };
    }

    // Libera o jogo em 1 segundo, mesmo que as imagens falhem
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = "none";
        canvas.style.display = "block";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        G.joy.y = canvas.height - 120;
        G.loaded = true;
        gameLoop();
    }, 1000);
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; // Grama
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Desenha Recursos (Árvores e Pedras)
    G.resources.forEach(res => {
        if (G.assets[res.type] && G.assets[res.type].complete) {
            ctx.drawImage(G.assets[res.type], res.x, res.y, 80, 80);
        } else {
            // Se a imagem falhar, desenha um círculo colorido (verde pra árvore, cinza pra pedra)
            ctx.fillStyle = res.type === 'tree' ? '#2d5a27' : '#555';
            ctx.beginPath();
            ctx.arc(res.x + 40, res.y + 40, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Desenha o Pato
    if (G.assets['pato'] && G.assets['pato'].complete) {
        ctx.drawImage(G.assets['pato'], G.pato.x, G.pato.y, 60, 60);
    } else {
        // Pato de emergência (quadrado branco)
        ctx.fillStyle = "white";
        ctx.fillRect(G.pato.x, G.pato.y, 40, 40);
    }

    ctx.restore();

    // Guia do Joystick (círculo na tela)
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 50, 0, Math.PI*2); ctx.stroke();
}

function update() {
    if (G.joy.active) {
        G.pato.x += Math.cos(G.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function gameLoop() {
    if (G.loaded) { update(); draw(); requestAnimationFrame(gameLoop); }
}

// Controles corrigidos para Mobile
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 100) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    G.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});
canvas.addEventListener('touchend', () => { G.joy.active = false; });

carregarTudo();










