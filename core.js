const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 6, moving: false, angle: 0, facingLeft: false, inv: { wood: 0, stone: 0 }, canAtk: true },
    camera: { x: 0, y: 0 },
    joy: { x: 100, y: 0, curX: 100, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 60 },
    resources: [], patches: [], worldSize: 3000, loaded: false
};

function cleanTexture(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 230 && d[i+1] > 230 && d[i+2] > 230) d[i+3] = 0;
    }
    tCtx.putImageData(imgData, 0, 0);
    const finalImg = new Image();
    finalImg.src = tempCanvas.toDataURL();
    return finalImg;
}

async function carregarTudo() {
    const bar = document.getElementById('progress-bar');
    const status = document.getElementById('status-text');

    // 1. Dados do Python
    const raw = window.py_gen(G.worldSize, 85);
    G.resources = Array.from(raw);
    bar.style.width = "40%";

    // 2. Imagens
    const imgs = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let loadedCount = 0;
    
    for (let key in imgs) {
        await new Promise(res => {
            let img = new Image();
            img.src = window.AppControl.fixPath(imgs[key]);
            img.onload = () => {
                G.assets[key] = (key === 'pato') ? img : cleanTexture(img);
                loadedCount++;
                bar.style.width = (40 + (loadedCount/3)*60) + "%";
                res();
            };
            img.onerror = () => { res(); };
        });
    }

    status.innerText = "Mundo Pronto para Exploração!";
    document.getElementById('start-btn').style.display = "block";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100; G.btn.y = canvas.height - 100;
    for(let i=0; i<40; i++) G.patches.push({x: Math.random()*G.worldSize, y: Math.random()*G.worldSize, w: 400, h: 250});
    G.loaded = true;
    gameLoop();
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-G.camera.x, -G.camera.y);
    
    // Desenha as árvores e rochas
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img) ctx.drawImage(img, res.x, res.y, 110, 110);
    });

    // Pato
    const pImg = G.assets['pato'];
    ctx.save(); ctx.translate(G.pato.x+35, G.pato.y+35);
    if(G.pato.facingLeft) ctx.scale(-1,1);
    if(pImg) ctx.drawImage(pImg, -35, -35, 70, 70);
    ctx.restore();

    ctx.restore();
    // HUD básica
    ctx.fillStyle = "white"; ctx.fillText(`Mundo Gerado: ${G.worldSize}px`, 20, 30);
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function gameLoop() { if(G.loaded) { update(); draw(); requestAnimationFrame(gameLoop); } }

// Eventos de toque simplificados para o teste
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 100) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
    G.pato.moving = true; G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
});
canvas.addEventListener('touchend', () => { G.joy.active = false; G.pato.moving = false; });

setTimeout(carregarTudo, 1500);






