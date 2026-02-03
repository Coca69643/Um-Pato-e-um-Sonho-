/**
 * DUCK DREAM STUDIOS - PRO-SURVIVOR ENGINE (MOBILE OPTIMIZED)
 * Especialista: Gemini Sênior
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Alpha false otimiza o render

// Configurações de Mundo
const TILE_SIZE = 32;
const CHUNK_SIZE = 16; // Chunks de 16x16 tiles
const world = {
    seed: Math.random(),
    tiles: {}, // Cache de chunks gerados
    camera: { x: 0, y: 0 }
};

// Player State
const player = {
    x: 0,
    y: 0,
    speed: 4,
    size: 24,
    direction: 1
};

/**
 * GERAÇÃO PROCEDURAL SIMPLIFICADA (V1)
 * Usa uma função matemática para decidir o tile sem salvar tudo na RAM.
 */
function getTileAt(tx, ty) {
    // Exemplo: lógica de bioma simples baseada em ruído/math
    const noise = Math.abs(Math.sin(tx * 0.1) + Math.cos(ty * 0.1));
    if (noise > 1.2) return "#4d8b42"; // Grama escura
    if (noise < 0.2) return "#6db35f"; // Grama clara
    return "#5da051"; // Grama padrão
}

/**
 * RENDER LOOP - PERFORMANCE FOCO
 */
function render() {
    // 1. Limpar tela
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = canvas.width / 2 - player.x;
    const offsetY = canvas.height / 2 - player.y;

    // 2. TILE CULLING (Desenha apenas o que o jogador vê)
    const startX = Math.floor((player.x - canvas.width / 2) / TILE_SIZE);
    const endX = Math.ceil((player.x + canvas.width / 2) / TILE_SIZE);
    const startY = Math.floor((player.y - canvas.height / 2) / TILE_SIZE);
    const endY = Math.ceil((player.y + canvas.height / 2) / TILE_SIZE);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            ctx.fillStyle = getTileAt(x, y);
            ctx.fillRect(
                x * TILE_SIZE + offsetX, 
                y * TILE_SIZE + offsetY, 
                TILE_SIZE + 0.5, TILE_SIZE + 0.5 // +0.5 evita frestas entre tiles
            );
        }
    }

    // 3. DESENHAR PLAYER (Pixel Art Style)
    ctx.fillStyle = "white";
    ctx.fillRect(
        canvas.width / 2 - player.size / 2, 
        canvas.height / 2 - player.size / 2, 
        player.size, player.size
    );
    
    // Bico do pato
    ctx.fillStyle = "#fb923c";
    ctx.fillRect(
        canvas.width / 2 + (player.direction * 8), 
        canvas.height / 2 - 4, 
        12, 8
    );

    requestAnimationFrame(render);
}

// Ajuste de tela para Mobile
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false; // Essencial para Pixel Art não borrar
}

window.addEventListener('resize', resize);
resize();
render();
