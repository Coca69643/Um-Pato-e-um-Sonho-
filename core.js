const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 0, y: 0, speed: 5, moving: false, angle: 0, facingLeft: false, hp: 100, inv: { wood: 0, stone: 0 }, canAtk: true, atkCooldown: 400 },
    camera: { x: 0, y: 0 },
    joy: { x: 90, y: 0, curX: 90, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 55 },
    resources: [], patches: [], drops: [],
    worldSize: 3000, gameStarted: false
};

function abrirCustom() {
    document.getElementById('main-options').style.display = "none";
    document.getElementById('custom-panel').style.display = "block";
}

function iniciarFluxo(modo) {
    // Verificar se o Python já carregou
    if (typeof py_gen !== "function") {
        alert("O motor Python ainda está aquecendo! Espere o texto ficar verde.");
        return;
    }

    document.getElementById('main-options').style.display = "none";
    document.getElementById('custom-panel').style.display = "none";
    document.getElementById('loader-container').style.display = "block";
    
    let prog = 0;
    const interval = setInterval(() => {
        prog += 5;
        document.getElementById('progress-bar').style.width = prog + "%";
        if (prog >= 100) {
            clearInterval(interval);
            gerarMundo(modo);
        }
    }, 50);
}

function gerarMundo(modo) {
    let size = G.worldSize;
    let trees = 80;

    if (modo === 'custom') {
        size = parseInt(document.getElementById('in-size').value);
        trees = parseInt(document.getElementById('in-trees').value);
    }

    G.worldSize = size;
    G.pato.x = size / 2;
    G.pato.y = size / 2;

    // CHAMADA CRÍTICA: Recebendo dados do Python
    try {
        const rawData = window.py_gen(size, trees);
        // Brython retorna uma lista especial, vamos garantir que seja um array JS limpo
        G.resources = Array.from(rawData); 
        
        // Gerar o visual do chão
        G.patches = [];
        for(let i=0; i < (size/60); i++) {
            G.patches.push({
                x: Math.random()*size, y: Math.random()*size,
                w: 200+Math.random()*400, h: 200+Math.random()*300,
                color: Math.random() > 0.5 ? '#2d5a27' : '#35632d'
            });
        }
        iniciarJogo();
    } catch (e) {
        console.error("Erro na geração Python:", e);
        alert("Erro ao gerar mundo. Tente novamente.");
    }
}

function iniciarJogo() {
    document.getElementById('ui-layer').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 90; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 90; G.btn.y = canvas.height - 90;

    // Carregar Sprites (Substitua pelos nomes reais dos seus arquivos)
    const imgList = { 'idle': 'idle_001.png', 'w1': 'Walking 001.png', 'w2': 'Walking 002.png' };
    let loaded = 0;
    for (let k in imgList) {
        G.assets[k] = new Image();
        G.assets[k].src = imgList[k];
        G.assets[k].onload = () => { if(++loaded === 3) { G.gameStarted = true; gameLoop(); } };
        G.assets[k].onerror = () => { if(++loaded === 3) { G.gameStarted = true; gameLoop(); } }; // Evita travar se não achar a imagem
    }
}

// O restante do código de update/draw/atacar permanece o mesmo do passo anterior...
// (Para economizar espaço, mantenha a lógica de movimentação e desenho que já tínhamos)
function handleTouch(e) {
    e.preventDefault();
    for (let t of e.touches) {
        const dJ = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
        const dB = Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y);
        if (dJ < 110) {
            G.joy.active = true;
            G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
            const dist = Math.min(dJ, G.joy.rad);
            G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * dist;
            G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * dist;
            G.pato.moving = true; G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
        }
        if (dB < G.btn.rad) atacar();
    }
}

function atacar() {
    if (!G.pato.canAtk) return;
    let alvo = null;
    let dMin = 130;
    G.resources.forEach(res => {
        const d = Math.hypot(res.x - G.pato.x, res.y - G.pato.y);
        if (d < dMin) { dMin = d; alvo = res; }
    });
    if (alvo) {
        alvo.hp -= 1;
        G.pato.canAtk = false;
        setTimeout(() => G.pato.canAtk = true, G.pato.atkCooldown);
        if (alvo.hp <= 0) {
            G.drops.push({ x: alvo.x, y: alvo.y, type: alvo.type });
            G.resources = G.resources.filter(r => r !== alvo);
        }
    }
}

function update() {
    if (!G.gameStarted) return;
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.drops = G.drops.filter(d => {
        if (Math.hypot(d.x - G.pato.x, d.y - G.pato.y) < 70) {
            d.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            return false;
        }
        return true;
    });
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    if (!G.gameStarted) return;
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-G.camera.x, -G.camera.y);
    G.patches.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });
    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#3d251e' : '#555';
        ctx.fillRect(res.x, res.y, 50, 50);
        ctx.fillStyle = 'red'; ctx.fillRect(res.x, res.y-12, (res.hp/10)*50, 6);
    });
    G.drops.forEach(d => {
        ctx.fillStyle = d.type === 'tree' ? '#8b4513' : '#777';
        ctx.beginPath(); ctx.arc(d.x+25, d.y+25, 12, 0, Math.PI*2); ctx.fill();
    });
    
    // Desenho do Pato
    const sprite = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    ctx.save(); ctx.translate(G.pato.x + 30, G.pato.y + 30);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    if (sprite && sprite.complete) ctx.drawImage(sprite, -30, -30, 65, 65);
    else { ctx.fillStyle = "yellow"; ctx.fillRect(-25,-25,50,50); } // Fallback se imagem sumir
    ctx.restore();
    ctx.restore();

    // HUD e Controles
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(20, 20, 200, 50);
    ctx.fillStyle = '#fff'; ctx.font = "bold 18px Arial";
    ctx.fillText(`🌲: ${G.pato.inv.wood}  🪨: ${G.pato.inv.stone}`, 40, 52);

    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="#fff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle="red"; ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.fillText("ATK", G.btn.x-18, G.btn.y+8);
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }

canvas.addEventListener('touchstart', e => handleTouch(e), {passive: false});
canvas.addEventListener('touchmove', e => handleTouch(e), {passive: false});
canvas.addEventListener('touchend', () => { G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false; });




