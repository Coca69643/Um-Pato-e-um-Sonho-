const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const G = {
    state: 'playing',
    assets: {},
    pato: {
        x: 100,
        y: 100,
        w: 64,
        h: 64,
        speed: 4,
        moving: false,
        angle: 0
    },
    joy: { x: 150, y: 0, active: false, curX: 150, curY: 0, rad: 50 }
};
G.joy.y = canvas.height - 150;

const imgList = {
    'p-idle': 'idle_001.png',
    'p-walk1': 'Walking 001.png',
    'p-walk2': 'Walking 002.png'
};

let loaded = 0;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => {
        G.assets[key] = img;
        if (++loaded === Object.keys(imgList).length) gameLoop();
    };
}

// Controles Touch para o Joystick no Realme C53
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const dist = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
    if (dist < G.joy.rad * 2) G.joy.active = true;
});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    const dx = t.clientX - G.joy.x;
    const dy = t.clientY - G.joy.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(Math.hypot(dx, dy), G.joy.rad);
    
    G.joy.curX = G.joy.x + Math.cos(angle) * dist;
    G.joy.curY = G.joy.y + Math.sin(angle) * dist;
    G.pato.angle = angle;
    G.pato.moving = true;
});

canvas.addEventListener('touchend', () => {
    G.joy.active = false;
    G.joy.curX = G.joy.x;
    G.joy.curY = G.joy.y;
    G.pato.moving = false;
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
}

function draw() {
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenhar Pato
    const frame = G.pato.moving ? (Math.floor(Date.now()/200)%2==0 ? G.assets['p-walk1'] : G.assets['p-walk2']) : G.assets['p-idle'];
    if (frame) ctx.drawImage(frame, G.pato.x, G.pato.y, G.pato.w, G.pato.h);

    // Desenhar Joystick
    ctx.beginPath();
    ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(G.joy.curX, G.joy.curY, 25, 0, Math.PI*2);
    ctx.fillStyle = G.joy.active ? 'yellow' : 'rgba(255,255,0,0.5)';
    ctx.fill();
}

