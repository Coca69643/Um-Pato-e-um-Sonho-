const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 7, moving: false, angle: 0 },
    camera: { x: 0, y: 0 },
    joy: { active: false, x: 100, y: 0, curX: 100, curY: 0 },
    resources: [], worldSize: 3000, loaded: false
};

// Se a imagem falhar, essa função desenha uma árvore ou pedra usando código puro
function drawFallback(type, x, y) {
    if (type === 'tree') {
        // Tronco
        ctx.fillStyle = '#4d3319';
        ctx.fillRect(x + 35, y + 60, 20, 30);
        // Folhas (Círculos verdes)
        ctx.fillStyle = '#2d5a27';
        ctx.beginPath(); ctx.arc(x + 45, y + 40, 35, 0, Math.PI * 2); ctx.fill();
    } else {
        // Pedra (Polígono cinza)
        ctx.fillStyle = '#777';
        ctx.beginPath();
        ctx.moveTo(x+20, y+80); ctx.lineTo(x+80, y+80);
        ctx.lineTo(x+70, y+30); ctx.lineTo(x+30, y+40);
        ctx.closePath(); ctx.fill();
    }
}

async function carregarMundo() {
    const bar = document.getElementById('progress-bar');
    
    // 1. Python gera as coordenadas
    if (window.py_gen) {
        G.resources = Array.from(window.py_gen(G.worldSize, 80));
    }

    // 2. Tenta carregar as imagens do GitHub
    const imgs = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    
    for (let key in imgs) {
        await new Promise(res => {
            let img = new Image();
            img.crossOrigin = "anonymous";
            img.src = imgs[key] + "?v=" + Date.now();
            img.onload = () => { 
                G.assets[key] = img; 
                res(); 
            };
            img.onerror = () => { 
                console.log("Falha na imagem, usando fallback visual.");
                res(); 
            };
        });
        bar.style.width = "100%";
    }
    
    document.getElementById('start-btn').style.display = "block";
    document.getElementById('status-text').innerText = "Mundo Gerado com Sucesso!";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100; G.joy.curY = G.joy.y;
    G.loaded = true;
    loop();
}

function draw() {
    // Fundo Verde Escuro
    ctx.fillStyle = '#1a3317';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Desenha Recursos
    G.resources.forEach(res => {
        if (G.assets[res.type] && G.assets[res.type].complete) {
            ctx.drawImage(G.assets[res.type], res.x, res.y, 90, 90);
        } else {
            drawFallback(res.type, res.x, res.y);
        }
    });

    // Pato
    if (G.assets['pato']) {
        ctx.drawImage(G.assets['pato'], G.pato.x, G.pato.y, 60, 60);
    } else {
        ctx.fillStyle = "yellow";
        ctx.fillRect(G.pato.x, G.pato.y, 40, 40);
    }

    ctx.restore();

    // Joystick Visual (Pra você saber onde tocar)
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
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

function loop() {
    if (G.loaded) { update(); draw(); requestAnimationFrame(loop); }
}

// Controles de toque
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

setTimeout(carregarMundo, 500);









