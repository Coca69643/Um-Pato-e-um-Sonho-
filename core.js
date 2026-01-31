const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 6, moving: false, angle: 0, facingLeft: false, inv: { wood: 0, stone: 0 } },
    camera: { x: 0, y: 0 },
    joy: { active: false, x: 100, y: 0 },
    resources: [], worldSize: 3000, loaded: false,
    debugMsg: ""
};

// Função para garantir que a imagem seja tratada corretamente
function processTexture(img, key) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;
    // Remove o fundo branco das imagens do Pinterest
    for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 225 && d[i+1] > 225 && d[i+2] > 225) d[i+3] = 0;
    }
    tCtx.putImageData(imgData, 0, 0);
    const finalImg = new Image();
    finalImg.src = tempCanvas.toDataURL();
    return finalImg;
}

async function carregarMundo() {
    const status = document.getElementById('status-text');
    const bar = document.getElementById('progress-bar');

    // 1. Pega dados do Python
    if (window.py_gen) {
        G.resources = Array.from(window.py_gen(G.worldSize, 80));
    }

    const manifest = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let carregadas = 0;

    for (let key in manifest) {
        await new Promise(resolve => {
            let img = new Image();
            // Anti-cache agressivo para GitHub Pages
            img.src = manifest[key] + "?t=" + Date.now();
            img.crossOrigin = "anonymous"; 
            
            img.onload = () => {
                G.assets[key] = (key === 'pato') ? img : processTexture(img, key);
                carregadas++;
                bar.style.width = (carregadas / 3 * 100) + "%";
                resolve();
            };
            img.onerror = () => {
                G.debugMsg += `Erro: ${key} | `;
                carregadas++;
                resolve();
            };
        });
    }
    document.getElementById('start-btn').style.display = "block";
    status.innerText = "Sincronização concluída!";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100;
    G.loaded = true;
    loop();
}

function draw() {
    ctx.fillStyle = '#1e3d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-G.camera.x, -G.camera.y);

    // Renderiza Recursos
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img && img.complete) {
            ctx.drawImage(img, res.x, res.y, 80, 80);
        } else {
            // FALLBACK: Se a imagem falhar, desenha um círculo colorido
            ctx.fillStyle = res.type === 'tree' ? '#2d5a27' : '#555';
            ctx.beginPath();
            ctx.arc(res.x + 40, res.y + 40, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Pato
    if (G.assets['pato']) {
        ctx.drawImage(G.assets['pato'], G.pato.x, G.pato.y, 60, 60);
    }

    ctx.restore();
    
    // HUD de Debug
    ctx.fillStyle = "white";
    ctx.fillText(G.debugMsg || "Sistema OK", 10, canvas.height - 10);
}

function loop() {
    if (!G.loaded) return;
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
    draw();
    requestAnimationFrame(loop);
}

// Inicialização
setTimeout(carregarMundo, 500);








