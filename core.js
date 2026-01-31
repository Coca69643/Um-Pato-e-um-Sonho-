const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 6, moving: false, angle: 0, facingLeft: false, inv: { wood: 0, stone: 0 }, canAtk: true },
    camera: { x: 0, y: 0 },
    joy: { x: 100, y: 0, curX: 100, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 60 },
    resources: [], patches: [], worldSize: 3000, loaded: false,
    debugMsg: "Iniciando..."
};

function cleanTexture(img) {
    try {
        const tempCanvas = document.createElement('canvas');
        const tCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.width; tempCanvas.height = img.height;
        tCtx.drawImage(img, 0, 0);
        const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            // Remove pixels brancos/claros
            if (d[i] > 220 && d[i+1] > 220 && d[i+2] > 220) d[i+3] = 0;
        }
        tCtx.putImageData(imgData, 0, 0);
        const finalImg = new Image();
        finalImg.src = tempCanvas.toDataURL();
        return finalImg;
    } catch (e) {
        G.debugMsg = "Erro no CleanTexture: " + e.message;
        return img;
    }
}

async function carregarTudo() {
    const bar = document.getElementById('progress-bar');
    const status = document.getElementById('status-text');

    // 1. Força a geração de dados
    if (window.py_gen) {
        const raw = window.py_gen(G.worldSize, 80);
        G.resources = Array.from(raw);
        G.debugMsg = `Python gerou ${G.resources.length} itens`;
    }

    const imgs = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let loadedCount = 0;
    
    for (let key in imgs) {
        await new Promise(res => {
            let img = new Image();
            // O segredo do Cache Busting definitivo: Version + Timestamp
            img.src = imgs[key] + "?v=" + (window.AppControl?.version || "1") + "&t=" + Date.now();
            img.crossOrigin = "anonymous"; // Evita erro de segurança ao limpar textura
            
            img.onload = () => {
                if (key === 'tree' || key === 'stone') {
                    G.assets[key] = cleanTexture(img);
                } else {
                    G.assets[key] = img;
                }
                loadedCount++;
                bar.style.width = (40 + (loadedCount/3)*60) + "%";
                res();
            };
            img.onerror = () => {
                G.debugMsg = "FALHA: " + imgs[key];
                loadedCount++;
                res(); 
            };
        });
    }

    status.innerText = "Mundo Pronto!";
    document.getElementById('start-btn').style.display = "block";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100; G.btn.y = canvas.height - 100;
    G.loaded = true;
    gameLoop();
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save(); 
    ctx.translate(-G.camera.x, -G.camera.y);
    
    // Desenha os recursos com fallback (se a imagem não carregar, desenha um bloco)
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, res.x, res.y, 100, 100);
        } else {
            // Se a imagem sumir, desenha um quadrado para provar que o item está lá
            ctx.fillStyle = res.type === 'tree' ? '#3d2b1f' : '#555';
            ctx.fillRect(res.x, res.y, 40, 40);
        }
    });

    const pImg = G.assets['pato'];
    if (pImg) ctx.drawImage(pImg, G.pato.x, G.pato.y, 70, 70);
    
    ctx.restore();

    // Texto de Debug na tela do jogo
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(G.debugMsg, 20, canvas.height - 20);
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function gameLoop() { 
    if(G.loaded) { 
        update(); 
        draw(); 
        requestAnimationFrame(gameLoop); 
    } 
}

// Eventos de toque
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 80) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
    G.pato.moving = true;
});
canvas.addEventListener('touchend', () => { G.joy.active = false; G.pato.moving = false; });

setTimeout(carregarTudo, 1000);







