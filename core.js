const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

window.G = {
    state: 'menu',
    width: window.innerWidth, height: window.innerHeight,
    camera: { x: 0, y: 0 },
    pato: { x: 1000, y: 1000, speed: 4.5, frame: 0, timer: 0, facing: 1, moving: false },
    joy: { angle: 0, force: 0, active: false },
    assets: {}, imagesLoaded: false
};

const imgList = {
    'p-idle': 'idle_001.png',
    'p-walk1': 'Walking 001.png',
    'p-walk2': 'Walking 002.png',
    'rabbit': 'rabbit_sheet.png'
};

let loaded = 0;
for (let key in imgList) {
    G.assets[key] = new Image();
    G.assets[key].src = imgList[key];
    G.assets[key].onload = () => { if(++loaded === Object.keys(imgList).length) G.imagesLoaded = true; };
}

function update() {
    if (G.state !== 'playing') return;
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.joy.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.joy.angle) * G.pato.speed;
        if(++G.pato.timer > 8) { G.pato.frame = G.pato.frame === 1 ? 2 : 1; G.pato.timer = 0; }
    } else { G.pato.frame = 0; }
    G.camera.x = G.pato.x - G.width / 2;
    G.camera.y = G.pato.y - G.height / 2;
}

function draw() {
    ctx.fillStyle = '#2d6e32'; ctx.fillRect(0, 0, G.width, G.height);
    if (!G.imagesLoaded) return;
    if (G.state === 'menu') {
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.font = '20px monospace';
        ctx.fillText("PATO SURVIVAL: CLIQUE PARA JOGAR", G.width/2, G.height/2);
        return;
    }
    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);
    const pKey = G.pato.frame === 0 ? 'p-idle' : (G.pato.frame === 1 ? 'p-walk1' : 'p-walk2');
    ctx.save();
    ctx.translate(G.pato.x, G.pato.y);
    if (G.pato.facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(G.assets[pKey], -25, -25, 50, 50);
    ctx.restore();
    if (window.drawExtra) window.drawExtra();
    ctx.restore();
}

// Loop e Input
function loop() { update(); if(window.updateExtra) window.updateExtra(); draw(); requestAnimationFrame(loop); }
window.addEventListener('touchstart', (e) => {
    if(G.state === 'menu') { G.state = 'playing'; document.getElementById('ui-layer').style.display='block'; }
    G.pato.moving = true;
});
window.addEventListener('touchend', () => { G.pato.moving = false; });
loop();
