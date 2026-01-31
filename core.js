const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    state: 'loading',
    assets: {},
    pato: {
        x: 0, y: 0, w: 70, h: 70,
        speed: 5, moving: false, angle: 0, facingLeft: false,
        hp: 100, energy: 100, hunger: 100,
        isAtk: false, atkTimer: 0
    },
    joy: { x: 120, y: 0, curX: 120, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 45 }
};

function initSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.pato.x = canvas.width / 2;
    G.pato.y = canvas.height / 2;
    G.joy.y = canvas.height - 120;
    G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100;
    G.btn.y = canvas.height - 100;
}

const imgList = {
    'idle': 'idle_001.png',
    'w1': 'Walking 001.png',
    'w2': 'Walking 002.png'
};

let loadedCount = 0;
const totalImgs = Object.keys(imgList).length;

for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => {
        G.assets[key] = img;
        if (++loadedCount === totalImgs) {
            G.state = 'playing';
            gameLoop();
        }
    };
    img.onerror = () => console.error("Falha na imagem: " + key);
}

// Sistema de Toque Multitouch (Mover e Atacar ao mesmo tempo)
canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
canvas.addEventListener('touchend', e => {
    if (e.touches.length === 0) {
        G.joy.active = false;
        G.joy.curX = G.joy.x;
        G.joy.curY = G.joy.y;
        G.pato.moving = false;
    }
});

function handleTouch(e) {
    e.preventDefault();
    for (let t of e.touches) {
        const dxJ = t.clientX - G.joy.x;
        const dyJ = t.clientY - G.joy.y;
        if (Math.hypot(dxJ, dyJ) < 100) {
            G.joy.active = true;
            const angle = Math.atan2(dyJ, dxJ);
            const dist = Math.min(Math.hypot(dxJ, dyJ), G.joy.rad);
            G.joy.curX = G.joy.x + Math.cos(angle) * dist;
            G.joy.curY = G.joy.y + Math.sin(angle) * dist;
            G.pato.angle = angle;
            G.pato.moving = true;
            G.pato.facingLeft = Math.cos(angle) < 0;
        }
        
        const dxB = t.clientX - G.btn.x;
        const dyB = t.clientY - G.btn.y;
        if (Math.hypot(dxB, dyB) < G.btn.rad && G.pato.atkTimer <= 0) {
            G.pato.isAtk = true;
            G.pato.atkTimer = 15;
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (G.state !== 'playing') return;

    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
        G.pato.energy = Math.max(0, G.pato.energy - 0.1);
    } else {
        G.pato.energy = Math.min(100, G.pato.energy + 0.05);
    }

    G.pato.hunger = Math.max(0, G.pato.hunger - 0.01);
    if (G.pato.hunger <= 0) G.pato.hp -= 0.02;
    if (G.pato.atkTimer > 0) G.pato.atkTimer--;
    else G.pato.isAtk = false;

    G.pato.x = Math.max(0, Math.min(canvas.width - G.pato.w, G.pato.x));
    G.pato.y = Math.max(0, Math.min(canvas.height - G.pato.h, G.pato.y));
}

function draw() {
    ctx.fillStyle = '#2d5a27'; // Grama
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (G.state === 'playing') {
        // Desenha Pato
        const frame = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
        if (frame) {
            ctx.save();
            ctx.translate(G.pato.x + G.pato.w/2, G.pato.y + G.pato.h/2);
            if (G.pato.facingLeft) ctx.scale(-1, 1);
            if (G.pato.isAtk) ctx.filter = "brightness(2) sepia(1)";
            ctx.drawImage(frame, -G.pato.w/2, -G.pato.h/2, G.pato.w, G.pato.h);
            ctx.restore();
        }

        // HUD (Barras)
        const drawBar = (y, val, color, txt) => {
            ctx.fillStyle = "#000"; ctx.fillRect(20, y, 150, 15);
            ctx.fillStyle = color; ctx.fillRect(20, y, (val/100)*150, 15);
            ctx.strokeStyle = "#fff"; ctx.strokeRect(20, y, 150, 15);
            ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.fillText(txt, 20, y-5);
        };
        drawBar(30, G.pato.hp, "#f44", "VIDA");
        drawBar(65, G.pato.energy, "#ff0", "ENERGIA");
        drawBar(100, G.pato.hunger, "#f80", "FOME");

        // Joystick e Botão
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle = "yellow"; ctx.fill();
        ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle = "red"; ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#fff"; ctx.fillText("ATK", G.btn.x-12, G.btn.y+5);
    }
}

initSize();



