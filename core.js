const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.btnAtk.x = canvas.width - 100;
    G.btnAtk.y = canvas.height - 100;
}
window.addEventListener('resize', resize);

const G = {
    state: 'playing',
    assets: {},
    pato: {
        x: 200, y: 200, w: 80, h: 80,
        speed: 5,
        moving: false,
        angle: 0,
        facingLeft: false,
        // STATUS DE SOBREVIVÊNCIA
        hp: 100, maxHp: 100,
        energy: 100, maxEnergy: 100,
        hunger: 100, maxHunger: 100,
        isAttacking: false,
        atkTimer: 0
    },
    joy: { x: 120, y: 0, active: false, curX: 120, curY: 0, rad: 50 },
    btnAtk: { x: 0, y: 0, rad: 40, active: false }
};

const imgList = {
    'p-idle': 'idle_001.png',
    'p-walk1': 'Walking 001.png',
    'p-walk2': 'Walking 002.png'
};

let loaded = 0;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => { if (++loaded === Object.keys(imgList).length) gameLoop(); };
}

// CONTROLES TOUCH ADAPTADOS
canvas.addEventListener('touchstart', e => {
    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        // Joystick
        const distJoy = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
        if (distJoy < G.joy.rad * 2) G.joy.active = true;
        
        // Botão de Ataque
        const distAtk = Math.hypot(t.clientX - G.btnAtk.x, t.clientY - G.btnAtk.y);
        if (distAtk < G.btnAtk.rad) {
            G.pato.isAttacking = true;
            G.pato.atkTimer = 10;
        }
    }
});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - G.joy.x;
    const dy = t.clientY - G.joy.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy), G.joy.rad);
    
    G.joy.curX = G.joy.x + Math.cos(angle) * dist;
    G.joy.curY = G.joy.y + Math.sin(angle) * dist;
    G.pato.angle = angle;
    G.pato.moving = true;
    G.pato.facingLeft = Math.cos(angle) < 0;
}, { passive: false });

canvas.addEventListener('touchend', () => {
    G.joy.active = false;
    G.joy.curX = G.joy.x; G.joy.curY = G.joy.y;
    G.pato.moving = false;
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Lógica de Movimento e Energia
    if (G.pato.moving && G.pato.energy > 0) {
        let currentSpeed = G.pato.speed;
        if (G.pato.energy < 20) currentSpeed *= 0.5; // Cansaço
        
        G.pato.x += Math.cos(G.pato.angle) * currentSpeed;
        G.pato.y += Math.sin(G.pato.angle) * currentSpeed;
        G.pato.energy -= 0.1; // Gasta energia ao andar
    } else {
        if (G.pato.energy < G.pato.maxEnergy) G.pato.energy += 0.05; // Recupera parado
    }

    // Lógica de Fome
    G.pato.hunger -= 0.02; 
    if (G.pato.hunger <= 0) {
        G.pato.hunger = 0;
        G.pato.hp -= 0.05; // Começa a morrer de fome
    }

    // Lógica de Ataque
    if (G.pato.atkTimer > 0) G.pato.atkTimer--;
    else G.pato.isAttacking = false;

    // Limites da Tela
    G.pato.x = Math.max(0, Math.min(canvas.width - G.pato.w, G.pato.x));
    G.pato.y = Math.max(0, Math.min(canvas.height - G.pato.h, G.pato.y));
}

function drawBar(x, y, val, max, color, label) {
    const w = 150;
    const h = 15;
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, w, h); // Fundo preto
    ctx.fillStyle = color;
    ctx.fillRect(x, y, (val / max) * w, h); // Barra colorida
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(x, y, w, h); // Borda branca
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.fillText(label, x, y - 5);
}

function draw() {
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha o Pato
    let frame = G.pato.moving ? (Math.floor(Date.now() / 150) % 2 === 0 ? G.assets['p-walk1'] : G.assets['p-walk2']) : G.assets['p-idle'];
    if (frame) {
        ctx.save();
        if (G.pato.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(frame, -G.pato.x - G.pato.w, G.pato.y, G.pato.w, G.pato.h);
        } else {
            ctx.drawImage(frame, G.pato.x, G.pato.y, G.pato.w, G.pato.h);
        }
        // Efeito visual de ataque
        if (G.pato.isAttacking) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;
            ctx.strokeRect(G.pato.facingLeft ? -G.pato.x - G.pato.w : G.pato.x, G.pato.y, G.pato.w, G.pato.h);
        }
        ctx.restore();
    }

    // Desenha Status (Barras)
    drawBar(20, 30, G.pato.hp, G.pato.maxHp, "#ff4444", "VIDA");
    drawBar(20, 65, G.pato.energy, G.pato.maxEnergy, "#ffdd00", "ENERGIA");
    drawBar(20, 100, G.pato.hunger, G.pato.maxHunger, "#ff8800", "FOME");

    // Interface (Joystick e Botão Atk)
    ctx.beginPath(); // Base Joy
    ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
    ctx.beginPath(); // Centro Joy
    ctx.arc(G.joy.curX, G.joy.curY, 25, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,0,0.5)';
    ctx.fill();

    // Botão de Ataque
    ctx.beginPath();
    ctx.arc(G.btnAtk.x, G.btnAtk.y, G.btnAtk.rad, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,0,0,0.6)';
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText("ATK", G.btnAtk.x - 12, G.btnAtk.y + 5);
}

resize();



