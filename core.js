const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: {
        x: 1000, y: 1000, w: 60, h: 60, speed: 5, 
        moving: false, angle: 0, facingLeft: false,
        inv: { wood: 0, stone: 0 }
    },
    camera: { x: 0, y: 0 },
    joy: { x: 120, y: 0, curX: 120, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 45 },
    resources: [],
    drops: [], // Itens que caem no chão estilo Hytale
    worldSize: 2500
};

function initSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100;
    G.btn.y = canvas.height - 100;
    
    if(G.resources.length === 0) {
        for(let i=0; i<60; i++) {
            G.resources.push({
                x: Math.random() * G.worldSize, 
                y: Math.random() * G.worldSize, 
                type: Math.random() > 0.4 ? 'tree' : 'stone',
                hp: 3, maxHp: 3
            });
        }
    }
}

const imgList = { 'idle': 'idle_001.png', 'w1': 'Walking 001.png', 'w2': 'Walking 002.png' };

let loadedCount = 0;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => { if (++loadedCount === 3) gameLoop(); };
}

canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
canvas.addEventListener('touchend', () => {
    G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false;
});

function handleTouch(e) {
    e.preventDefault();
    for (let t of e.touches) {
        const dxJ = t.clientX - G.joy.x, dyJ = t.clientY - G.joy.y;
        if (Math.hypot(dxJ, dyJ) < 100) {
            G.joy.active = true;
            G.pato.angle = Math.atan2(dyJ, dxJ);
            const dist = Math.min(Math.hypot(dxJ, dyJ), G.joy.rad);
            G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * dist;
            G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * dist;
            G.pato.moving = true;
            G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
        }
        if (Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y) < G.btn.rad) {
            interact();
        }
    }
}

function interact() {
    G.resources.forEach(res => {
        const dist = Math.hypot(res.x - G.pato.x, res.y - G.pato.y);
        if (dist < 100) {
            res.hp--;
            if (res.hp <= 0) {
                // Drop de item estilo Hytale
                G.drops.push({ x: res.x, y: res.y, type: res.type });
            }
        }
    });
    G.resources = G.resources.filter(r => r.hp > 0);
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    
    // Coletar Drops
    G.drops = G.drops.filter(d => {
        const dist = Math.hypot(d.x - G.pato.x, d.y - G.pato.y);
        if (dist < 50) {
            if (d.type === 'tree') G.pato.inv.wood++;
            else G.pato.inv.stone++;
            return false;
        }
        return true;
    });

    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    ctx.fillStyle = '#2d5a27'; // Chão base
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Recursos e Barras de Vida
    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#4a2d1d' : '#777';
        ctx.fillRect(res.x, res.y, 30, 30);
        // Barra de vida do objeto
        ctx.fillStyle = 'red';
        ctx.fillRect(res.x, res.y - 10, (res.hp/res.maxHp)*30, 4);
    });

    // Drops no chão
    G.drops.forEach(d => {
        ctx.fillStyle = d.type === 'tree' ? '#8b4513' : '#aaa';
        ctx.beginPath(); ctx.arc(d.x+15, d.y+15, 8, 0, Math.PI*2); ctx.fill();
    });

    // Pato
    const frame = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    if (frame) {
        ctx.save();
        ctx.translate(G.pato.x + 30, G.pato.y + 30);
        if (G.pato.facingLeft) ctx.scale(-1, 1);
        ctx.drawImage(frame, -30, -30, 60, 60);
        ctx.restore();
    }
    ctx.restore();

    // UI Estilo Survival
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(canvas.width/2 - 100, canvas.height - 60, 200, 50);
    ctx.fillStyle = "white"; ctx.font = "16px Arial";
    ctx.fillText(`🌲 ${G.pato.inv.wood}   🪨 ${G.pato.inv.stone}`, canvas.width/2 - 40, canvas.height - 30);

    // Controles
    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="white"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle = "yellow"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle = "red"; ctx.fill();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
initSize();



