const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    state: 'playing',
    assets: {},
    pato: {
        x: 0, y: 0, w: 70, h: 70, speed: 5, 
        moving: false, angle: 0, facingLeft: false,
        hp: 100, energy: 100, hunger: 100,
        isAtk: false, atkTimer: 0,
        lvl: 1, xp: 0, nextLvl: 50, dmgFlash: 0
    },
    joy: { x: 120, y: 0, curX: 120, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 45 },
    enemies: [],
    foods: [],
    score: 0
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
    'w2': 'Walking 002.png',
    'rabbit': 'rabbit_sheet.png'
};

let loadedCount = 0;
for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => {
        G.assets[key] = img;
        if (++loadedCount === Object.keys(imgList).length) gameLoop();
    };
}

canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
canvas.addEventListener('touchend', () => {
    G.joy.active = false;
    G.joy.curX = G.joy.x; G.joy.curY = G.joy.y;
    G.pato.moving = false;
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
        if (Math.hypot(t.clientX - G.btn.x, t.clientY - G.btn.y) < G.btn.rad && G.pato.atkTimer <= 0) {
            G.pato.isAtk = true;
            G.pato.atkTimer = 15;
            checkAttack();
        }
    }
}

function spawnEnemy() {
    if (G.enemies.length < 5 + G.pato.lvl) {
        G.enemies.push({
            x: Math.random() > 0.5 ? -50 : canvas.width + 50,
            y: Math.random() * canvas.height,
            w: 50, h: 50, speed: 1.5 + (G.pato.lvl * 0.2)
        });
    }
}
setInterval(spawnEnemy, 2500);

function checkAttack() {
    G.enemies = G.enemies.filter(en => {
        const dist = Math.hypot(en.x - G.pato.x, en.y - G.pato.y);
        if (dist < 110) {
            G.foods.push({x: en.x, y: en.y, w: 20, h: 20});
            G.pato.xp += 15;
            G.score += 10;
            if (G.pato.xp >= G.pato.nextLvl) {
                G.pato.lvl++;
                G.pato.xp = 0;
                G.pato.nextLvl += 50;
                G.pato.hp = 100; // Cura ao subir de nível
            }
            return false;
        }
        return true;
    });
}

function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
        G.pato.energy = Math.max(0, G.pato.energy - 0.12);
    } else {
        G.pato.energy = Math.min(100, G.pato.energy + 0.15);
    }

    G.pato.hunger = Math.max(0, G.pato.hunger - 0.03);
    if (G.pato.hunger <= 0) { G.pato.hp -= 0.08; G.pato.dmgFlash = 5; }

    G.enemies.forEach(en => {
        const angle = Math.atan2(G.pato.y - en.y, G.pato.x - en.x);
        en.x += Math.cos(angle) * en.speed;
        en.y += Math.sin(angle) * en.speed;
        if (Math.hypot(en.x - G.pato.x, en.y - G.pato.y) < 35) {
            G.pato.hp -= 0.2;
            G.pato.dmgFlash = 5;
        }
    });

    G.foods = G.foods.filter(f => {
        if (Math.hypot(f.x - G.pato.x, f.y - G.pato.y) < 50) {
            G.pato.hunger = Math.min(100, G.pato.hunger + 25);
            return false;
        }
        return true;
    });

    if (G.pato.atkTimer > 0) G.pato.atkTimer--;
    else G.pato.isAtk = false;
    if (G.pato.dmgFlash > 0) G.pato.dmgFlash--;

    G.pato.x = Math.max(0, Math.min(canvas.width - G.pato.w, G.pato.x));
    G.pato.y = Math.max(0, Math.min(canvas.height - G.pato.h, G.pato.y));
}

function draw() {
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    G.foods.forEach(f => { ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(f.x+10, f.y+10, 8, 0, Math.PI*2); ctx.fill(); });
    
    G.enemies.forEach(en => {
        if (G.assets['rabbit']) {
            ctx.drawImage(G.assets['rabbit'], 0, 0, 32, 32, en.x, en.y, en.w, en.h);
        } else {
            ctx.fillStyle = 'white'; ctx.fillRect(en.x, en.y, en.w, en.h);
        }
    });

    const frame = G.pato.moving ? (Math.floor(Date.now()/150)%2==0 ? G.assets['w1'] : G.assets['w2']) : G.assets['idle'];
    if (frame) {
        ctx.save();
        ctx.translate(G.pato.x + G.pato.w/2, G.pato.y + G.pato.h/2);
        if (G.pato.facingLeft) ctx.scale(-1, 1);
        if (G.pato.dmgFlash > 0) ctx.filter = "sepia(1) saturate(10) hue-rotate(-50deg)";
        else if (G.pato.isAtk) ctx.filter = "brightness(1.5) contrast(1.2)";
        ctx.drawImage(frame, -G.pato.w/2, -G.pato.h/2, G.pato.w, G.pato.h);
        ctx.restore();
    }

    const drawBar = (y, val, color, txt) => {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(20, y, 150, 12);
        ctx.fillStyle = color; ctx.fillRect(20, y, (val/100)*150, 12);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(20, y, 150, 12);
        ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial"; ctx.fillText(txt, 20, y-4);
    };
    drawBar(30, G.pato.hp, "#ff4444", "VIDA");
    drawBar(60, G.pato.energy, "#ffff00", "ENERGIA");
    drawBar(90, G.pato.hunger, "#ffaa00", "FOME");
    
    // XP Bar
    ctx.fillStyle = "#00ffff";
    ctx.fillRect(0, 0, (G.pato.xp / G.pato.nextLvl) * canvas.width, 5);

    ctx.globalAlpha = 0.4;
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, G.joy.rad, 0, Math.PI*2); ctx.strokeStyle="white"; ctx.stroke();
    ctx.beginPath(); ctx.arc(G.joy.curX, G.joy.curY, 20, 0, Math.PI*2); ctx.fillStyle = "yellow"; ctx.fill();
    ctx.beginPath(); ctx.arc(G.btn.x, G.btn.y, G.btn.rad, 0, Math.PI*2); ctx.fillStyle = "red"; ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.fillText("ATK", G.btn.x-16, G.btn.y+6);
    ctx.fillText("LVL " + G.pato.lvl, 20, 120);
}

function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
initSize();



