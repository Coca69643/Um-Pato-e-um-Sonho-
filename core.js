const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const G = {
    assets: {},
    pato: { x: 1500, y: 1500, speed: 6, moving: false, angle: 0, facingLeft: false, inv: { wood: 0, stone: 0 }, canAtk: true },
    camera: { x: 0, y: 0 },
    joy: { x: 100, y: 0, curX: 100, curY: 0, active: false, rad: 50 },
    btn: { x: 0, y: 0, rad: 60 },
    resources: [], patches: [], worldSize: 3000, loaded: false
};

// Função para remover o fundo branco (Chroma Key)
function cleanTexture(img) {
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width; tempCanvas.height = img.height;
    tCtx.drawImage(img, 0, 0);
    const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 235 && d[i+1] > 235 && d[i+2] > 235) d[i+3] = 0; // Transparência
    }
    tCtx.putImageData(imgData, 0, 0);
    const finalImg = new Image();
    finalImg.src = tempCanvas.toDataURL();
    return finalImg;
}

// Lógica de Carregamento Estilo Terraria
async function startWorldGen() {
    const status = document.getElementById('status-text');
    const bar = document.getElementById('progress-bar');
    
    // 1. Gerar Recursos via Python
    status.innerText = "Calculando biomas...";
    bar.style.width = "30%";
    const data = window.py_gen(G.worldSize, 80);
    G.resources = Array.from(data);
    
    // 2. Carregar Imagens
    status.innerText = "Assentando blocos e texturas...";
    const manifest = { 'pato': 'idle_001.png', 'tree': 'arvore.png', 'stone': 'rocha.png' };
    let count = 0;
    const total = Object.keys(manifest).length;

    for (let key in manifest) {
        await new Promise(resolve => {
            let img = new Image();
            img.src = manifest[key] + "?v=" + Date.now(); // Anti-cache
            img.onload = () => {
                if (key !== 'pato') G.assets[key] = cleanTexture(img);
                else G.assets[key] = img;
                count++;
                bar.style.width = (30 + (count / total) * 70) + "%";
                resolve();
            };
            img.onerror = () => {
                console.warn("Erro no arquivo: " + manifest[key]);
                resolve(); 
            };
        });
    }

    status.innerText = "Mundo pronto!";
    document.getElementById('start-btn').style.display = "block";
}

function entrarNoJogo() {
    document.getElementById('loading-screen').style.display = "none";
    canvas.style.display = "block";
    setupCanvas();
    G.loaded = true;
    gameLoop();
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    G.joy.y = canvas.height - 100; G.joy.curY = G.joy.y;
    G.btn.x = canvas.width - 100; G.btn.y = canvas.height - 100;
    for(let i=0; i<50; i++) G.patches.push({x: Math.random()*G.worldSize, y: Math.random()*G.worldSize, w: 300, h: 200});
}

function draw() {
    ctx.fillStyle = '#1e3d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); ctx.translate(-G.camera.x, -G.camera.y);

    // Recursos (Árvores e Pedras)
    G.resources.forEach(res => {
        const img = G.assets[res.type];
        if (img) ctx.drawImage(img, res.x, res.y, 100, 100);
        ctx.fillStyle = "red"; ctx.fillRect(res.x, res.y - 10, res.hp * 10, 5);
    });

    // Pato
    const pImg = G.assets['pato'];
    ctx.save(); ctx.translate(G.pato.x + 35, G.pato.y + 35);
    if (G.pato.facingLeft) ctx.scale(-1, 1);
    if (pImg) ctx.drawImage(pImg, -35, -35, 70, 70);
    ctx.restore();

    ctx.restore();
    // HUD
    ctx.fillStyle = "white"; ctx.font = "20px Arial";
    ctx.fillText(`🌲: ${G.pato.inv.wood}  🪨: ${G.pato.inv.stone}`, 20, 40);
}

// ... (Mantenha suas funções de update, gameLoop e touch dos arquivos anteriores)
function update() {
    if (G.pato.moving) {
        G.pato.x += Math.cos(G.pato.angle) * G.pato.speed;
        G.pato.y += Math.sin(G.pato.angle) * G.pato.speed;
    }
    G.camera.x = G.pato.x - canvas.width / 2;
    G.camera.y = G.pato.y - canvas.height / 2;
}

function gameLoop() { if(G.loaded) { update(); draw(); requestAnimationFrame(gameLoop); } }

// Chamar o carregador ao iniciar
setTimeout(startWorldGen, 1000);






