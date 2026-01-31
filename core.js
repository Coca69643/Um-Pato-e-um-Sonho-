const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: {
        x: 500, y: 500, w: 70, h: 70, speed: 5, 
        moving: false, angle: 0, facingLeft: false,
        hp: 100, energy: 100, hunger: 100,
        isAtk: false, atkTimer: 0, dmgFlash: 0,
        inv: { wood: 0, stone: 0 }
    },
    camera: { x: 0, y: 0 },
    joy: { x: 120, y: 0, curX: 120, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 45 },
    enemies: [],
    resources: [], // Árvores e Pedras
};

function initSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100;
    G.btn.y = canvas.height - 100;
    
    // Gerar mapa inicial
    for(let i=0; i<20; i++) {
        G.resources.push({
            x: Math.random() * 2000, 
            y: Math.random() * 2000, 
            type: Math.random() > 0.5 ? 'tree' : 'stone',
            hp: 3
        });
    }
}

const imgList = {
    'idle': 'idle_001.png',
    'w1': 'Walking 001.png',
    'w2': 'Walking 002.png',
    'rabbit': 'rabbit_sheet.png'
};

let loadedCount = 0;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => { if (++loadedCount === 4) gameLoop(); };
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
        if (Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y) < G.btn.rad && G.pato.atkTimer <= 0) {
            G.pato.isAtk = true; G.pato.atkTimer = 15;
            interact();
        }
    }
}

function interact() {
    G.resources.forEach(res => {
        if (Math.hypot(res.x - G.pato.x, res.y - G.pato.y) < 100) {
            res.hp--;
            if (res.hp <= 0) {
                if (res.type === 'tree') G.pato.inv.wood += 5;
                else G.pato.inv.stone += 5;
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
    // Câmera segue o pato
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;

    if (G.pato.atkTimer > 0) G.pato.atkTimer--; else G.pato.isAtk = false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2d5a27'; // Chão
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Desenhar Recursos
    G.resources.forEach(res => {
        ctx.fillStyle = res.type === 'tree' ? '#3d251e' : '#777';
        ctx.fillRect(res.x, res.y, 40, 40);
        ctx.fillStyle = res.type === 'tree' ? '#228B22' : '#999';
        ctx.fillRect(res.x - 10, res.y - 30, 60, 40);
    });

    // Desenhar Coelho (Bug do Sprite Corrigido)
    G.enemies.forEach(en => {
        if (G.assets['rabbit']) {
            // Desenha apenas o primeiro frame (32x32) do sheet
            ctx.drawImage(G.assets['rabbit'], 0, 0, 32, 32, en.x, en.y, 50, 50);
        }
    });

    // Desenhar Pato
    const frame = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    if (frame) {
        ctx.save();
        ctx.translate(G.pato.x + 35, G.pato.y + 35);
        if (G.pato.facingLeft) ctx.scale(-1, 1);
        ctx.drawImage(frame, -35, -35, 70, 70);
        ctx.restore();
    }
    ctx.restore();

    // HUD Fixa
    ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
    ctx.fillText(`Madeira: ${G.pato.inv.wood} | Pedra: ${G.pato.inv.stone}`, 20, 150);

    // Joystick e Botão
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle = "yellow"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle = "red"; ctx.fill();
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
initSize();



