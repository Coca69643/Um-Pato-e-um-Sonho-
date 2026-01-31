const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 7, moving: false, angle: 0 },
    camera: { x: 0, y: 0 },
    joy: { active: false, x: 120, y: 0 },
    resources: [], worldSize: 3000, loaded: false
};

// Seus links diretos do Imgur
const manifest = {
    'pato': 'https://i.imgur.com/r8kX998.png', // Substitua pelo seu pato se tiver o link
    'tree': 'https://i.imgur.com/0XNH1Nd.jpeg',
    'stone': 'https://i.imgur.com/vDYoKAg.jpeg'
};

// Função para remover o fundo branco das imagens do Imgur
function removerFundo(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        // Se for muito perto do branco, torna transparente
        if (d[i] > 220 && d[i+1] > 220 && d[i+2] > 220) d[i+3] = 0;
    }
    tCtx.putImageData(imgData, 0, 0);
    const finalImg = new Image();
    finalImg.src = tempCanvas.toDataURL();
    return finalImg;
}

async function iniciarMundo() {
    const bar = document.getElementById('progress-bar');
    const status = document.getElementById('status-text');

    if (window.py_gen) {
        G.resources = Array.from(window.py_gen(G.worldSize, 75));
    }

    let carregadas = 0;
    const keys = Object.keys(manifest);

    for (let key of keys) {
        await new Promise(res => {
            let img = new Image();
            img.crossOrigin = "anonymous"; // Permite editar a imagem do Imgur
            img.src = manifest[key];
            
            img.onload = () => {
                // Remove o fundo da árvore e da rocha
                if (key === 'tree' || key === 'stone') {
                    G.assets[key] = removerFundo(img);
                } else {
                    G.assets[key] = img;
                }
                carregadas++;
                bar.style.width = (carregadas / keys.length * 100) + "%";
                res();
            };
            img.onerror = () => { res(); };
        });
    }

    document.getElementById('start-btn').style.display = "block";
    status.innerText = "Mundo Gerado com Sucesso!";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 120;
    G.loaded = true;
    gameLoop();
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img) {
            ctx.drawImage(img, res.x, res.y, 100, 100);
        }
    });

    if (G.assets['pato']) {
        ctx.drawImage(G.assets['pato'], G.pato.x, G.pato.y, 65, 65);
    }

    ctx.restore();
    
    // Joystick Visual
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.beginPath(); ctx.arc(G.joy.x, G.joy.y, 50, 0, Math.PI*2); ctx.stroke();
}

function update() {
    if (G.joy.active) {
        G.pato.x += Math.cos(G.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function gameLoop() {
    if (G.loaded) { update(); draw(); requestAnimationFrame(gameLoop); }
}

canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    if (Math.hypot(t.clientX - G.joy.x, t.clientY - G.joy.y) < 100) G.joy.active = true;
});
canvas.addEventListener('touchmove', e => {
    if (!G.joy.active) return;
    const t = e.touches[0];
    G.angle = Math.atan2(t.clientY - G.joy.y, t.clientX - G.joy.x);
});
canvas.addEventListener('touchend', () => { G.joy.active = false; });

iniciarMundo();
