const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: {
        x: 1250, y: 1250, w: 60, h: 60, speed: 5, 
        moving: false, angle: 0, facingLeft: false,
        hp: 100, inv: { wood: 0, stone: 0 }
    },
    camera: { x: 0, y: 0 },
    joy: { x: 120, y: 0, curX: 120, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 45 },
    resources: [],
    drops: [],
    structures: [],
    patches: [], // Grama variada para o Bioma
    worldSize: 2500
};

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100;
    G.btn.y = canvas.height - 100;
    
    // Geração Procedural do Terreno (Estilo Hytale)
    for(let i=0; i<100; i++) {
        G.patches.push({
            x: Math.random()*G.worldSize, y: Math.random()*G.worldSize,
            w: 100+Math.random()*200, h: 80+Math.random()*150,
            color: Math.random() > 0.5 ? '#244d1f' : '#35632d'
        });
    }

    // Spawner de Recursos (Árvores e Pedras)
    for(let i=0; i<60; i++) {
        G.resources.push({
            x: Math.random() * G.worldSize, y: Math.random() * G.worldSize, 
            type: Math.random() > 0.4 ? 'tree' : 'stone', hp: 3, maxHp: 3
        });
    }
}

const imgList = { 'idle': 'idle_001.png', 'w1': 'Walking 001.png', 'w2': 'Walking 002.png' };
let loaded = 0;
for (let k in imgList) {
    G.assets[k] = new Image();
    G.assets[k].src = imgList[k];
    G.assets[k].onload = () => { if(++loaded === 3) gameLoop(); };
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
        // Botão de Interação (Ataque/Coleta)
        if (Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y) < G.btn.rad) {
            interact();
        }
        // Botão de Craft (Fogueira)
        if (G.pato.inv.wood >= 5 && t.clientX < 200 && t.clientY < 150) {
            craftFire();
        }
    }
}

// CORREÇÃO: Dano em Alvo Único (O Pato foca no mais próximo)
function interact() {
    let target = null;
    let minDist = 100; // Alcance do bico

    G.resources.forEach(res => {
        const d = Math.hypot(res.x - G.pato.x, res.y - G.pato.y);
        if (d < minDist) {
            minDist = d;
            target = res;
        }
    });

    if (target) {
        target.hp--;
        if (target.hp <= 0) G.drops.push({ x: target.x, y: target.y, type: target.type });
        G.resources = G.resources.filter(r => r.hp > 0);
    }
}

function craftFire() {
    G.pato.inv.wood -= 5;
    G.structures.push({ x: G.pato.x, y: G.pato.y, timer: 1200 });
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    
    // Pegar itens do chão
    G.drops = G.drops.filter(d => {
        if (Math.hypot(d.x - G.pato.x, d.y - G.pato.y) < 60) {
            d.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            return false;
        }
        return true;
    });

    // Fogueira cura o pato
    G.structures.forEach(s => {
        if (Math.hypot(s.x - G.pato.x, s.y - G.pato.y) < 100) G.pato.hp = Math.min(100, G.pato.hp + 0.08);
        s.timer--;
    });
    G.structures = G.structures.filter(s => s.timer > 0);

    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Bioma
    G.patches.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });

    // Fogueiras (Efeito visual)
    G.structures.forEach(s => {
        ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(s.x+30, s.y+30, 15 + Math.random()*5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#8b4513'; ctx.fillRect(s.x+10, s.y+45, 40, 10);
    });

    // Recursos e Barras
    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#3d251e' : '#555';
        ctx.fillRect(res.x, res.y, 35, 35);
        ctx.fillStyle = 'red'; ctx.fillRect(res.x, res.y-10, (res.hp/res.maxHp)*35, 4);
    });

    // Itens no chão
    G.drops.forEach(d => {
        ctx.fillStyle = d.type === 'tree' ? '#8b4513' : '#aaa';
        ctx.beginPath(); ctx.arc(d.x+15, d.y+15, 8, 0, Math.PI*2); ctx.fill();
    });

    // O Pato
    const sprite = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    ctx.save();
    ctx.translate(G.pato.x + 30, G.pato.y + 30);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -30, -30, 60, 60);
    ctx.restore();

    ctx.restore();

    // Interface (UI)
    ctx.fillStyle = '#333'; ctx.fillRect(20, 20, 200, 15);
    ctx.fillStyle = '#f00'; ctx.fillRect(20, 20, G.pato.hp * 2, 15);
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(canvas.width/2-80, canvas.height-60, 160, 45);
    ctx.fillStyle = '#fff'; ctx.font = "bold 14px Arial";
    ctx.fillText(`🌲 ${G.pato.inv.wood}   🪨 ${G.pato.inv.stone}`, canvas.width/2-55, canvas.height-32);

    if(G.pato.inv.wood >= 5) {
        ctx.fillStyle = 'orange'; ctx.fillRect(20, 50, 130, 35);
        ctx.fillStyle = '#000'; ctx.fillText("CRAFT FIRE (5🌲)", 28, 73);
    }

    // Controles
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="#fff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle="red"; ctx.fill();
    ctx.globalAlpha = 1.0;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
init();



