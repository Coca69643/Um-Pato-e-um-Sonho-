const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 6, moving: false, angle: 0, facingLeft: false, inv: { wood: 0, stone: 0 }, canAtk: true },
    camera: { x: 0, y: 0 },
    joy: { x: 90, y: 0, curX: 90, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 55 },
    resources: [], patches: [], gameStarted: false, worldSize: 3000
};

// Remove fundo branco das imagens do Pinterest
function cleanImage(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 230 && data[i+1] > 230 && data[i+2] > 230) data[i+3] = 0;
    }
    tCtx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    return newImg;
}

function iniciarFluxo() {
    document.getElementById('start-btn').style.display = "none";
    document.getElementById('loader-container').style.display = "block";
    const bar = document.getElementById('progress-bar');
    
    // Passo 1: Gerar dados no Python
    const rawData = window.py_gen(G.worldSize, 60);
    G.resources = Array.from(rawData);
    bar.style.width = "40%";

    // Passo 2: Carregar e Limpar Imagens
    const imgList = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let loaded = 0;
    const total = Object.keys(imgList).length;

    for (let k in imgList) {
        let temp = new Image();
        temp.src = imgList[k] + "?v=" + Date.now(); // Força atualização do cache
        temp.onload = () => {
            if (k === 'tree' || k === 'stone') G.assets[k] = cleanImage(temp);
            else G.assets[k] = temp;
            loaded++;
            bar.style.width = (40 + (loaded/total)*60) + "%";
            if (loaded === total) setTimeout(finalizarSetup, 500);
        };
        temp.onerror = () => {
            console.error("Falha ao carregar: " + imgList[k]);
            loaded++; 
            if (loaded === total) finalizarSetup();
        };
    }
}

function finalizarSetup() {
    document.getElementById('ui-layer').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100; G.btn.y = canvas.height - 100;
    
    // Grama decorativa
    for(let i=0; i<40; i++) G.patches.push({x: Math.random()*G.worldSize, y: Math.random()*G.worldSize, w: 400, h: 250});
    
    G.gameStarted = true;
    gameLoop();
}

function atacar() {
    if (!G.pato.canAtk) return;
    G.resources.forEach(res => {
        if (Math.hypot(res.x - G.pato.x, res.y - G.pato.y) < 100) {
            res.hp -= 2;
            if (res.hp <= 0) {
                res.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
                G.resources = G.resources.filter(r => r !== res);
            }
        }
    });
    G.pato.canAtk = false;
    setTimeout(() => G.pato.canAtk = true, 400);
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Chão
    ctx.fillStyle = "#2d5a27";
    G.patches.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // RECURSOS (Árvores e Rochas)
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img && img.complete) {
            ctx.drawImage(img, res.x, res.y, 110, 110);
        } else {
            // Reserva caso a imagem suma
            ctx.fillStyle = res.type === 'tree' ? 'brown' : 'gray';
            ctx.fillRect(res.x, res.y, 40, 40);
        }
    });

    // PATO
    const pImg = G.assets['pato'];
    ctx.save();
    ctx.translate(G.pato.x + 35, G.pato.y + 35);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    if (pImg) ctx.drawImage(pImg, -35, -35, 70, 70);
    ctx.restore();

    ctx.restore();

    // Interface
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(20, 20, 120, 40);
    ctx.fillStyle = "white";
    ctx.fillText(`🌲 ${G.pato.inv.wood} | 🪨 ${G.pato.inv.stone}`, 35, 45);

    // Joystick e Botão
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle="red"; ctx.fill();
    ctx.globalAlpha = 1;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

// Eventos de Toque
canvas.addEventListener('touchstart', e => {
    for (let t of e.touches) {
        if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 100) G.joy.active = true;
        if (Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y) < G.btn.rad) atacar();
    }
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
    G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * 40;
    G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * 40;
    G.pato.moving = true; G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
});
canvas.addEventListener('touchend', () => { G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false; });






