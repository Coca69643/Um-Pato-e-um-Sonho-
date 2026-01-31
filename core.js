const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 7, moving: false, angle: 0, inv: { wood: 0, stone: 0 } },
    camera: { x: 0, y: 0 },
    joy: { active: false, x: 120, y: 0 },
    resources: [], worldSize: 3000, loaded: false
};

// Configuração dos arquivos (usando os nomes que estão no seu GitHub)
const manifest = {
    'pato': 'idle_001.png',
    'tree': 'arvore.png',
    'stone': 'rocha.png'
};

// Função para remover o fundo branco (essencial para imagens do Pinterest)
function limparFundo(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        // Se o pixel for muito claro (branco), fica transparente
        if (d[i] > 220 && d[i+1] > 220 && d[i+2] > 220) d[i+3] = 0;
    }
    tCtx.putImageData(imgData, 0, 0);
    const finalImg = new Image();
    finalImg.src = tempCanvas.toDataURL();
    return finalImg;
}

async function iniciarFluxo() {
    const bar = document.getElementById('progress-bar');
    const status = document.getElementById('status-text');

    // 1. Python gera o mapa (80 itens como planejado)
    if (window.py_gen) {
        G.resources = Array.from(window.py_gen(G.worldSize, 80));
    }

    // 2. Carrega as imagens do seu repositório
    let carregadas = 0;
    const chaves = Object.keys(manifest);

    for (let key of chaves) {
        await new Promise(res => {
            let img = new Image();
            // O "?v=" + Date.now() força o navegador a baixar a versão nova do GitHub
            img.src = manifest[key] + "?v=" + Date.now();
            img.onload = () => {
                G.assets[key] = (key === 'pato') ? img : limparFundo(img);
                carregadas++;
                bar.style.width = (carregadas / chaves.length * 100) + "%";
                res();
            };
            img.onerror = () => {
                console.warn("Erro ao carregar: " + manifest[key]);
                res(); 
            };
        });
    }

    status.innerText = "Mundo Gerado!";
    document.getElementById('start-btn').style.display = "block";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.loaded = true;
    loopPrincipal();
}

function update() {
    if (G.joy.active) {
        G.pato.x += Math.cos(G.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.angle) * G.pato.speed;
    }
    
    // Sistema de Coleta (o pato coleta ao encostar)
    G.resources.forEach((res, i) => {
        let dist = Math.hypot(G.pato.x - res.x, G.pato.y - res.y);
        if (dist < 40) {
            res.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            G.resources.splice(i, 1); // Remove do mapa
        }
    });

    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; // Grama
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Desenha Árvores e Pedras
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img) ctx.drawImage(img, res.x, res.y, 100, 100);
    });

    // Desenha o Pato
    const pImg = G.assets['pato'];
    if (pImg) ctx.drawImage(pImg, G.pato.x, G.pato.y, 65, 65);

    ctx.restore();

    // Interface (Inventário)
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 150, 40);
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`🌲 ${G.pato.inv.wood} | 🪨 ${G.pato.inv.stone}`, 20, 35);

    // Joystick Visual
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 50, 0, Math.PI*2); ctx.stroke();
}

function loopPrincipal() {
    if (G.loaded) { update(); draw(); requestAnimationFrame(loopPrincipal); }
}

// Controles de Toque
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

// Inicia o processo de carregamento
iniciarFluxo();
