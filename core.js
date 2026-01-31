const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajuste de tela para o seu Realme C53
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Reposiciona o joystick sempre que a tela girar
    G.joy.y = canvas.height - 120;
}
window.addEventListener('resize', resize);

const G = {
    state: 'playing',
    assets: {},
    pato: {
        x: 200,
        y: 200,
        w: 80, // Aumentei um pouco para aparecer melhor
        h: 80,
        speed: 5,
        moving: false,
        angle: 0,
        facingLeft: false
    },
    joy: { 
        x: 120, 
        y: 0, 
        active: false, 
        curX: 120, 
        curY: 0, 
        rad: 50 
    }
};

// Inicializa posição do joystick
G.joy.y = window.innerHeight - 120;
G.joy.curY = G.joy.y;

const imgList = {
    'p-idle': 'idle_001.png',
    'p-walk1': 'Walking 001.png',
    'p-walk2': 'Walking 002.png'
};

// Carregador de Imagens
let loaded = 0;
const total = Object.keys(imgList).length;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => {
        G.assets[key] = img;
        if (++loaded === total) gameLoop();
    };
}

// CONTROLES TOUCH (CORRIGIDOS PARA 360 GRAUS)
canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const dist = Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y);
    if (dist < G.joy.rad * 2) {
        G.joy.active = true;
    }
});

canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    e.preventDefault(); 
    const t = e.touches[0];
    
    const dx = t.clientX - G.joy.x;
    const dy = t.clientY - G.joy.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.hypot(dx, dy);
    const limit = Math.min(dist, G.joy.rad);
    
    G.joy.curX = G.joy.x + Math.cos(angle) * limit;
    G.joy.curY = G.joy.y + Math.sin(angle) * limit;
    
    G.pato.angle = angle;
    G.pato.moving = true;
    
    // Faz o pato olhar para o lado certo
    if (Math.cos(angle) < 0) G.pato.facingLeft = true;
    else G.pato.facingLeft = false;

}, { passive: false });

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
    
    // Impede o pato de sair da tela
    if (G.pato.x < 0) G.pato.x = 0;
    if (G.pato.y < 0) G.pato.y = 0;
    if (G.pato.x > canvas.width - G.pato.w) G.pato.x = canvas.width - G.pato.w;
    if (G.pato.y > canvas.height - G.pato.h) G.pato.y = canvas.height - G.pato.h;
}

function draw() {
    // Grama
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Seleção de Frame para Animação
    let frame = G.assets['p-idle'];
    if (G.pato.moving) {
        frame = (Math.floor(Date.now() / 150) % 2 === 0) ? G.assets['p-walk1'] : G.assets['p-walk2'];
    }

    // Desenha o Pato (com sistema de espelhamento)
    if (frame) {
        ctx.save();
        if (G.pato.facingLeft) {
            ctx.scale(-1, 1);
            ctx.drawImage(frame, -G.pato.x - G.pato.w, G.pato.y, G.pato.w, G.pato.h);
        } else {
            ctx.drawImage(frame, G.pato.x, G.pato.y, G.pato.w, G.pato.h);
        }
        ctx.restore();
    }

    // Desenha Joystick
    // Base
    ctx.beginPath();
    ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Botão Amarelo
    ctx.beginPath();
    ctx.arc(G.joy.curX, G.joy.curY, 25, 0, Math.PI * 2);
    ctx.fillStyle = G.joy.active ? '#ffff00' : 'rgba(255, 255, 0, 0.5)';
    ctx.fill();
}

resize();


