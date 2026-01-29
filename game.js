const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const countEl = document.getElementById("count");

const settings = {
    tile: 64,
    worldCols: 50,
    worldRows: 50,
    playerSpeed: 0.6,
    friction: 0.82
};

let inventory = 0;
let worldTiles = [];
let gameRunning = false;
const input = { up: false, down: false, left: false, right: false };

const player = {
    x: 25 * 64, 
    y: 25 * 64,
    vx: 0, vy: 0,
    width: 32, height: 32
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener("resize", resize);
resize();

function generateWorld() {
    for (let y = 0; y < settings.worldRows; y++) {
        worldTiles[y] = [];
        for (let x = 0; x < settings.worldCols; x++) {
            worldTiles[y][x] = (Math.random() < 0.12 && Math.hypot(x-25, y-25) > 3) ? "tree" : "grass";
        }
    }
}

// Controles
["up","down","left","right"].forEach(dir => {
    const btn = document.getElementById(dir);
    const start = (e) => { e.preventDefault(); input[dir] = true; btn.style.background = "rgba(255,255,255,0.4)"; };
    const end = (e) => { e.preventDefault(); input[dir] = false; btn.style.background = "rgba(255,255,255,0.15)"; };
    btn.addEventListener("touchstart", start);
    btn.addEventListener("touchend", end);
});

function isSolid(px, py) {
    const tx = Math.floor((px + 16) / settings.tile);
    const ty = Math.floor((py + 28) / settings.tile);
    if (ty < 0 || ty >= settings.worldRows || tx < 0 || tx >= settings.worldCols) return true;
    return worldTiles[ty][tx] === "tree";
}

function update() {
    if(!gameRunning) return;
    let ax = 0, ay = 0;
    if (input.up) ay -= settings.playerSpeed;
    if (input.down) ay += settings.playerSpeed;
    if (input.left) ax -= settings.playerSpeed;
    if (input.right) ax += settings.playerSpeed;

    player.vx += ax; player.vy += ay;
    player.vx *= settings.friction; player.vy *= settings.friction;

    if (!isSolid(player.x + player.vx, player.y)) player.x += player.vx;
    if (!isSolid(player.x, player.y + player.vy)) player.y += player.vy;
}

function draw() {
    ctx.fillStyle = "#3a8f3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camX = Math.floor(player.x - canvas.width / 2);
    const camY = Math.floor(player.y - canvas.height / 2);

    ctx.save();
    ctx.translate(-camX, -camY);

    // Y-SORTING: Lista de renderização
    let renderList = [];

    // Adiciona Player
    renderList.push({
        y: player.y + 32,
        render: () => {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath(); ctx.ellipse(player.x+16, player.y+30, 12, 6, 0, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#FFD700"; ctx.fillRect(player.x, player.y, 32, 32); // Pato
            ctx.fillStyle = "#FF8C00"; ctx.fillRect(player.x+22, player.y+12, 10, 6); // Bico
        }
    });

    // Adiciona Árvores visíveis
    const sC = Math.max(0, Math.floor(camX / 64)), eC = Math.min(50, Math.ceil((camX + canvas.width) / 64));
    const sR = Math.max(0, Math.floor(camY / 64)), eR = Math.min(50, Math.ceil((camY + canvas.height) / 64));

    for (let y = sR; y < eR; y++) {
        for (let x = sC; x < eC; x++) {
            if (worldTiles[y][x] === "tree") {
                renderList.push({
                    y: (y * 64) + 60,
                    render: () => {
                        ctx.fillStyle = "rgba(0,0,0,0.15)";
                        ctx.beginPath(); ctx.ellipse(x*64+32, y*64+58, 25, 10, 0, 0, Math.PI*2); ctx.fill();
                        ctx.fillStyle = "#4d2926"; ctx.fillRect(x*64+26, y*64+35, 12, 25); // Tronco
                        ctx.fillStyle = "#1e3d1a"; ctx.beginPath(); ctx.arc(x*64+32, y*64+25, 30, 0, Math.PI*2); ctx.fill(); // Copa
                    }
                });
            }
        }
    }

    renderList.sort((a, b) => a.y - b.y).forEach(obj => obj.render());
    ctx.restore();
}

function loop() { update(); draw(); requestAnimationFrame(loop); }

document.getElementById("btnPlay").onclick = () => {
    document.getElementById("menu").style.display = "none";
    generateWorld();
    gameRunning = true;
    loop();
};

canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    const tx = Math.floor((t.clientX + (player.x - canvas.width/2)) / 64);
    const ty = Math.floor((t.clientY + (player.y - canvas.height/2)) / 64);
    if (Math.hypot(player.x/64 - tx, player.y/64 - ty) < 2 && worldTiles[ty]?.[tx] === "tree") {
        worldTiles[ty][tx] = "grass"; inventory++; countEl.innerText = inventory;
    }
});
