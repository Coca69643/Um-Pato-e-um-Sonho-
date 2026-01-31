const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações Globais (O "Mundo")
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
    patches: [], // Grama variada (Bioma)
    worldSize: 2500
};

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100; G.btn.y = canvas.height - 100;
    
    // Geração Procedural: Cria manchas de grama (Estilo Hytale)
    for(let i=0; i<80; i++) {
        G.patches.push({
            x: Math.random()*G.worldSize, y: Math.random()*G.worldSize,
            w: 150+Math.random()*200, h: 100+Math.random()*150,
            color: Math.random() > 0.5 ? '#2d5a27' : '#3a6b32'
        });
    }

    // Spawner de Recursos
    for(let i=0; i<60; i++) {
        G.resources.push({
            x: Math.random() * G.worldSize, y: Math.random() * G.worldSize, 
            type: Math.random() > 0.4 ? 'tree' : 'stone', hp: 3, maxHp: 3
        });
    }
}

// Carregamento de Sprites (Ajuste os nomes se necessário)
const imgList = { 'idle': 'idle_001.png', 'w1': 'Walking 001.png', 'w2': 'Walking 002.png' };
let loaded = 0;
for (let k in imgList) {
    G.assets[k] = new Image();
    G.assets[k].src = imgList[k];
    G.assets[k].onload = () => { if(++loaded === 3) gameLoop(); };
}

// Controles Touch
canvas.addEventListener('touchstart', (e) => handleTouch(e), {passive: false});
canvas.addEventListener('touchmove', (e) => handleTouch(e), {passive: false});
canvas.addEventListener('touchend', () => {
    G.joy.active = false; G.joy.curX = G.joy.x; G.joy.curY = G.joy.y; G.pato.moving = false;
});

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - G.joy.x;
    const dy = touch.clientY - G.joy.y;

    if (Math.hypot(dx, dy) < 120) {
        G.joy.active = true;
        G.pato.angle = Math.atan2(dy, dx);
        const dist = Math.min(Math.hypot(dx, dy), G.joy.rad);
        G.joy.curX = G.joy.x + Math.cos(G.pato.angle) * dist;
        G.joy.curY = G.joy.y + Math.sin(G.pato.angle) * dist;
        G.pato.moving = true;
        G.pato.facingLeft = Math.cos(G.pato.angle) < 0;
    }

    // Botão de Interação
    if (Math.hypot(touch.clientX - G.btn.x, touch.clientY - G.btn.y) < G.btn.rad) {
        interact();
    }

    // Botão de Craft (se tiver madeira)
    if (G.pato.inv.wood >= 5 && touch.clientX < 200 && touch.clientY < 100) {
        craftFire();
    }
}

function interact() {
    G.resources.forEach(res => {
        if (Math.hypot(res.x - G.pato.x, res.y - G.pato.y) < 100) {
            res.hp--;
            if (res.hp <= 0) G.drops.push({ x: res.x, y: res.y, type: res.type });
        }
    });
    G.resources = G.resources.filter(r => r.hp > 0);
}

function craftFire() {
    G.pato.inv.wood -= 5;
    G.structures.push({ x: G.pato.x, y: G.pato.y, timer: 1000 });
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }

    // Coleta de itens (estilo Hytale)
    G.drops = G.drops.filter(d => {
        if (Math.hypot(d.x - G.pato.x, d.y - G.pato.y) < 60) {
            d.type === 'tree' ? G.pato.inv.wood++ : G.pato.inv.stone++;
            return false;
        }
        return true;
    });

    // Cura na Fogueira
    G.structures.forEach(s => {
        if (Math.hypot(s.x - G.pato.x, s.y - G.pato.y) < 100) G.pato.hp = Math.min(100, G.pato.hp + 0.05);
        s.timer--;
    });
    G.structures = G.structures.filter(s => s.timer > 0);

    G.camera.x = G.pato.x - canvas.width/2;
    G.camera.y = G.pato.y - canvas.height/2;
}

function draw() {
    ctx.fillStyle = '#244d1f'; // Fundo do Bioma
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Desenha Manchas de Grama
    G.patches.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.w, p.h); });

    // Fogueiras
    G.structures.forEach(s => {
        ctx.fillStyle = '#ff6600'; ctx.beginPath(); 
        ctx.arc(s.x+30, s.y+30, 15 + Math.random()*5, 0, Math.PI*2); ctx.fill();
    });

    // Recursos
    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#4a2d1d' : '#666';
        ctx.fillRect(res.x, res.y, 40, 40);
        // Barra de HP do objeto
        ctx.fillStyle = 'red'; ctx.fillRect(res.x, res.y-10, (res.hp/res.maxHp)*40, 5);
    });

    // Itens no chão
    G.drops.forEach(d => {
        ctx.fillStyle = d.type === 'tree' ? '#8b4513' : '#aaa';
        ctx.beginPath(); ctx.arc(d.x+20, d.y+20, 10, 0, Math.PI*2); ctx.fill();
    });

    // O Pato
    const sprite = G.pato.moving ? (Math.floor(Date.now()/150)%2 === 0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    ctx.save();
    ctx.translate(G.pato.x + 30, G.pato.y + 30);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(sprite, -30, -30, 60, 60);
    ctx.restore();

    ctx.restore();

    // INTERFACE (UI)
    // Barra de Vida do Pato
    ctx.fillStyle = '#333'; ctx.fillRect(20, 20, 200, 20);
    ctx.fillStyle = '#f00'; ctx.fillRect(20, 20, G.pato.hp * 2, 20);
    
    // Inventário
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(canvas.width/2 - 80, canvas.height - 60, 160, 40);
    ctx.fillStyle = '#fff'; ctx.fillText(`Madeira: ${G.pato.inv.wood} | Pedra: ${G.pato.inv.stone}`, canvas.width/2 - 70, canvas.height - 35);

    if(G.pato.inv.wood >= 5) {
        ctx.fillStyle = 'orange'; ctx.fillRect(20, 60, 120, 30);
        ctx.fillStyle = '#000'; ctx.fillText("CRAFT FIRE (5W)", 30, 80);
    }

    // Joystick Virtual
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle = "#fff"; ctx.fill();
    
    // Botão de Ação
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle = "red"; ctx.fill();
    ctx.globalAlpha = 1.0;
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
init();



