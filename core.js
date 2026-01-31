const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: {
        x: 1250, y: 1250, speed: 5, moving: false, angle: 0, facingLeft: false,
        hp: 100, inv: { wood: 0, stone: 0 }, canAtk: true, atkCooldown: 400
    },
    camera: { x: 0, y: 0 },
    joy: { x: 80, y: 0, curX: 80, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 50 },
    resources: [], drops: [], patches: [],
    worldSize: 3000 // Mundo maior!
};

// Função chamada pelo Python após gerar os dados
window.initGame = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 80; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 80; G.btn.y = canvas.height - 80;

    // O Python entrega a lista de recursos processada
    G.resources = window.gerarMundoPython(G.worldSize, 80);

    // Gera o visual do bioma
    for(let i=0; i<100; i++) {
        G.patches.push({
            x: Math.random()*G.worldSize, y: Math.random()*G.worldSize,
            w: 200+Math.random()*400, h: 200+Math.random()*300,
            color: Math.random() > 0.5 ? '#2d5a27' : '#35632d'
        });
    }
    loadAssets();
};

function loadAssets() {
    const imgList = { 'idle': 'idle_001.png', 'w1': 'Walking 001.png', 'w2': 'Walking 002.png' };
    let loaded = 0;
    for (let k in imgList) {
        G.assets[k] = new Image();
        G.assets[k].src = imgList[k];
        G.assets[k].onload = () => { if(++loaded === 3) gameLoop(); };
    }
}

// Eventos de Toque (Joystick no canto esquerdo, ATK no direito)
canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
canvas.addEventListener('touchend', () => {
    G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false;
});

function handleTouch(e) {
    e.preventDefault();
    for (let t of e.touches) {
        const dJoy = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
        const dBtn = Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y);

        if (dJoy < 100) {
            G.joy.active = true;
            G.pato.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
            const dist = Math.min(dJoy, G.joy.rad);
            G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * dist;
            G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * dist;
            G.pato.moving = true; G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
        }
        if (dBtn < G.btn.rad) interact();
    }
}

function interact() {
    if (!G.pato.canAtk) return;
    let target = null;
    let minDist = 120;

    G.resources.forEach(res => {
        const d = Math.hypot(res.x - G.pato.x, res.y - G.pato.y);
        if (d < minDist) { minDist = d; target = res; }
    });

    if (target) {
        target.hp -= 1;
        G.pato.canAtk = false;
        setTimeout(() => G.pato.canAtk = true, G.pato.atkCooldown);
        if (target.hp <= 0) {
            G.drops.push({ x: target.x, y: target.y, type: target.type });
            G.resources = G.resources.filter(r => r !== target);
        }
    }
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    // Coleta
    G.drops = G.drops.filter(d => {
        if (Math.hypot(d.x - G.pato.x, d.y - G.pato.y) < 60) {
            d.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            return false;
        }
        return true;
    });

    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-G.camera.x, -G.camera.y);

    G.patches.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });

    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#3d251e' : '#555';
        ctx.fillRect(res.x, res.y, 45, 45);
        ctx.fillStyle = 'red'; ctx.fillRect(res.x, res.y-10, (res.hp/10)*45, 5);
    });

    G.drops.forEach(d => {
        ctx.fillStyle = d.type === 'tree' ? '#8b4513' : '#777';
        ctx.beginPath(); ctx.arc(d.x+20, d.y+20, 10, 0, Math.PI*2); ctx.fill();
    });

    const sprite = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    ctx.save(); ctx.translate(G.pato.x + 30, G.pato.y + 30);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -30, -30, 60, 60); ctx.restore();
    ctx.restore();

    // UI
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(canvas.width/2 - 70, canvas.height - 60, 140, 40);
    ctx.fillStyle = '#fff'; ctx.font = "bold 16px Arial";
    ctx.fillText(`🌲 ${G.pato.inv.wood}   🪨 ${G.pato.inv.stone}`, canvas.width/2 - 50, canvas.height - 34);

    // Controles
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="#fff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle="red"; ctx.fill();
    ctx.globalAlpha = 1.0;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }



