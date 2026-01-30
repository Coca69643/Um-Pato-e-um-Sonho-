// Configurações Globais
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar o tamanho do canvas para a tela do seu Realme
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const G = {
    state: 'playing', // Começa direto no jogo agora
    assets: {},
    pato: {
        x: 100, // Posição inicial visível
        y: 100,
        w: 64,
        h: 64,
        speed: 4,
        frame: 'p-idle'
    }
};

// Lista de Imagens (Caminhos corrigidos para a raiz do seu GitHub)
const imgList = {
    'p-idle': 'idle_001.png',
    'p-walk1': 'Walking 001.png',
    'p-walk2': 'Walking 002.png',
    'rabbit': 'rabbit_sheet.png'
};

// Carregamento de Imagens
let loadedCount = 0;
const totalImgs = Object.keys(imgList).length;

for (let key in imgList) {
    const img = new Image();
    img.src = imgList[key];
    img.onload = () => {
        G.assets[key] = img;
        loadedCount++;
        if (loadedCount === totalImgs) {
            console.log("Todas as imagens carregaram!");
            gameLoop();
        }
    };
    img.onerror = () => console.error("Erro ao carregar: " + img.src);
}

// Loop Principal
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (G.state !== 'playing') return;
    // Aqui virá a lógica do joystick que já tínhamos
}

function draw() {
    // Fundo Verde (Grama)
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (G.state === 'playing') {
        // Desenhar o Pato
        if (G.assets['p-idle']) {
            ctx.drawImage(
                G.assets['p-idle'], 
                G.pato.x, 
                G.pato.y, 
                G.pato.h, 
                G.pato.w
            );
        }
    }
}
