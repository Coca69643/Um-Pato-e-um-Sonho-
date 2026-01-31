const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 5, moving: false, angle: 0, facingLeft: false, hp: 100, inv: { wood: 0, stone: 0 }, canAtk: true, atkCooldown: 400 },
    camera: { x: 0, y: 0 },
    joy: { x: 90, y: 0, curX: 90, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 55 },
    resources: [], patches: [], gameStarted: false, worldSize: 3000
};

// FUNÇÃO MÁGICA: Remove o fundo branco da imagem
function removeWhiteBackground(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    
    const imageData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Se o pixel for quase branco (R, G e B acima de 240)
        if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
            data[i+3] = 0; // Torna transparente
        }
    }
    tCtx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    return newImg;
}

function iniciarFluxo() {
    if (typeof py_gen !== "function") return;
    document.getElementById('loader-container').style.display = "block";
    let prog = 0;
    const interval = setInterval(() => {
        prog += 10;
        document.getElementById('progress-bar').style.width = prog + "%";
        if (prog >= 100) {
            clearInterval(interval);
            const data = window.py_gen(G.worldSize, 80);
            G.resources = Array.from(data);
            carregarImagens();
        }
    }, 50);
}

function carregarImagens() {
    const imgList = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let carregadas = 0;
    const total = Object.keys(imgList).length;

    for (let k in imgList) {
        let tempImg = new Image();
        tempImg.src = imgList[k];
        tempImg.onload = () => {
            // Aplica a remoção de fundo nas árvores e rochas
            if (k === 'tree' || k === 'stone') {
                G.assets[k] = removeWhiteBackground(tempImg);
            } else {
                G.assets[k] = tempImg;
            }
            carregadas++;
            if (carregadas === total) finalizarSetup();
        };
        tempImg.onerror = () => { carregadas++; if (carregadas === total) finalizarSetup(); };
    }
}

function finalizarSetup() {
    document.getElementById('ui-layer').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 90; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 90; G.btn.y = canvas.height - 90;
    
    for(let i=0; i<60; i++) {
        G.patches.push({ x: Math.random()*G.worldSize, y: Math.random()*G.worldSize, w: 300, h: 200, color: '#2d5a27' });
    }
    G.gameStarted = true;
    gameLoop();
}

function atacar() {
    if (!G.pato.canAtk) return;
    let alvo = null;
    G.resources.forEach(res => {
        const d = Math.hypot(res.x - G.pato.x, res.y - G.pato.y);
        if (d < 120) alvo = res;
    });
    if (alvo) {
        alvo.hp -= 1;
        G.pato.canAtk = false;
        setTimeout(() => G.pato.canAtk = true, G.pato.atkCooldown);
        if (alvo.hp <= 0) G.resources = G.resources.filter(r => r !== alvo);
        // Ganhar recurso
        if (alvo.hp <= 0) {
            alvo.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
        }
    }
}

function update() {
    if (!G.gameStarted) return;
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    if (!G.gameStarted) return;
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-G.camera.x, -G.camera.y);

    G.patches.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });

    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img) ctx.drawImage(img, res.x, res.y, 100, 100);
        ctx.fillStyle = 'red'; ctx.fillRect(res.x+10, res.y-10, res.hp*8, 6);
    });

    const pImg = G.assets['pato'];
    ctx.save(); ctx.translate(G.pato.x+35, G.pato.y+35);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    if (pImg) ctx.drawImage(pImg, -35, -35, 70, 70);
    ctx.restore();
    ctx.restore();

    // Controles
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="#fff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle="red"; ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "white"; ctx.fillText(`🌲 ${G.pato.inv.wood} | 🪨 ${G.pato.inv.stone}`, 20, 30);
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

canvas.addEventListener('touchstart', e => handleTouch(e), {passive: false});
canvas.addEventListener('touchmove', e => handleTouch(e), {passive: false});
canvas.addEventListener('touchend', () => { G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false; });

function handleTouch(e) {
    e.preventDefault();
    for (let t of e.touches) {
        const dJ = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
        const dB = Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y);
        if (dJ < 110) {
            G.joy.active = true;
            G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
            G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * Math.min(dJ, G.joy.rad);
            G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * Math.min(dJ, G.joy.rad);
            G.pato.moving = true; G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
        }
        if (dB < G.btn.rad) atacar();
    }
}





