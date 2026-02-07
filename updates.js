// ==================== PATO SURVIVAL - RENDERING ENGINE ====================

// ==================== CONFIGURAÇÕES DE ESCALA ====================
const SCALES = {
    tree: 0.35,      // Árvores ~120-140px de altura
    rock: 0.45,      // Rochas ~50-60px
    pato: 1.0,       // Pato mantém tamanho original
    rabbit: 0.5,     // Coelhos proporcionais
    bench: 1.0       // Bancadas mantêm tamanho
};

// ==================== FUNÇÕES DE DESENHO COM ASSETS ====================

function drawTree(ctx, x, y, shake, hp) {
    const img = assets.images.arvore;
    if(!img || !img.complete) return;
    
    const alpha = hp < 0 ? 0 : (hp < 3 ? 0.6 : 1);
    ctx.globalAlpha = alpha;
    
    // Dimensões reais da árvore
    const width = img.width * SCALES.tree;
    const height = img.height * SCALES.tree;
    
    // Sombra na BASE (onde o tronco toca o chão)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + shake, y + 5, width * 0.25, width * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Desenha a árvore com origem na BASE
    ctx.drawImage(
        img,
        x + shake - width / 2,
        y - height,  // A imagem vai para CIMA a partir da posição Y
        width,
        height
    );
    
    ctx.globalAlpha = 1;
    
    // DEBUG: Desenha hitbox (comentar em produção)
    // ctx.strokeStyle = 'red';
    // ctx.strokeRect(x - 15, y - 30, 30, 35);
}

function drawRock(ctx, x, y, shake, hp) {
    const img = assets.images.rocha;
    if(!img || !img.complete) return;
    
    const alpha = hp < 0 ? 0 : (hp < 3 ? 0.6 : 1);
    ctx.globalAlpha = alpha;
    
    // Dimensões reais da rocha
    const width = img.width * SCALES.rock;
    const height = img.height * SCALES.rock;
    
    // Sombra na BASE
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + shake, y + 5, width * 0.35, width * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Desenha a rocha com origem na BASE
    ctx.drawImage(
        img,
        x + shake - width / 2,
        y - height * 0.75,  // Rochas ficam um pouco "enterradas"
        width,
        height
    );
    
    ctx.globalAlpha = 1;
    
    // DEBUG: Desenha hitbox (comentar em produção)
    // ctx.strokeStyle = 'blue';
    // ctx.strokeRect(x - 20, y - 20, 40, 25);
}

function drawPato(ctx, x, y, dir, walking) {
    game.player.frameCount++;
    
    // Determina qual frame usar baseado no estado
    let currentFrame;
    
    if(walking) {
        // Alterna entre Walking 001 e 002 a cada 10 frames
        const walkFrame = Math.floor(game.player.frameCount / 10) % 2;
        currentFrame = walkFrame === 0 ? assets.images.patoWalk1 : assets.images.patoWalk2;
    } else {
        // Alterna entre Idle 001 e 002 a cada 15 frames (mais lento)
        const idleFrame = Math.floor(game.player.frameCount / 15) % 2;
        currentFrame = idleFrame === 0 ? assets.images.patoIdle1 : assets.images.patoIdle2;
    }
    
    if(!currentFrame || !currentFrame.complete) return;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Espelha se estiver indo para esquerda
    if(dir < 0) {
        ctx.scale(-1, 1);
    }
    
    // Bobbing sutil ao andar
    const bob = walking ? Math.sin(game.player.frameCount * 0.15) * 1.5 : 0;
    
    // Sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Desenha o pato mantendo proporção original
    const scale = SCALES.pato;
    const width = currentFrame.width * scale;
    const height = currentFrame.height * scale;
    
    ctx.drawImage(
        currentFrame,
        -width / 2,
        -height + 18 + bob, // Ajusta a posição vertical para a BASE
        width,
        height
    );
    
    ctx.restore();
    
    // DEBUG: Desenha hitbox do pato (comentar em produção)
    // ctx.strokeStyle = 'green';
    // ctx.strokeRect(x - 12, y - 20, 24, 25);
}

function drawRabbit(ctx, rabbit) {
    const img = assets.images.rabbitSheet;
    if(!img || !img.complete) return;
    
    rabbit.frameCount++;
    
    ctx.save();
    ctx.translate(rabbit.x - game.cam.x, rabbit.y - game.cam.y);
    
    // Espelha baseado na direção do movimento
    if(rabbit.vx < 0) {
        ctx.scale(-1, 1);
    }
    
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Animação do spritesheet
    const frameWidth = img.width / 4; // 4 frames horizontais
    const frameHeight = img.height;
    const frameIndex = Math.floor(rabbit.frameCount / 8) % 4;
    
    // Bobbing quando está pulando
    const bob = rabbit.state === 'hop' ? Math.sin(rabbit.frameCount * 0.3) * 4 : 0;
    
    const scale = SCALES.rabbit;
    const width = frameWidth * scale;
    const height = frameHeight * scale;
    
    ctx.drawImage(
        img,
        frameIndex * frameWidth, // X source
        0, // Y source
        frameWidth, // Width source
        frameHeight, // Height source
        -width / 2, // X dest
        -height + 15 + bob, // Y dest (base na posição Y)
        width, // Width dest
        height // Height dest
    );
    
    ctx.restore();
}

function drawBench(ctx, x, y) {
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - 28, y + 8, 56, 6);
    
    // Base
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 28, y - 20, 56, 30);
    
    // Topo
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x - 28, y - 20, 56, 6);
    
    // Pernas
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x - 24, y, 6, 10);
    ctx.fillRect(x + 18, y, 6, 10);
    
    // Detalhes
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 2;
    for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 16 + i * 8);
        ctx.lineTo(x + 20, y - 16 + i * 8);
        ctx.stroke();
    }
}

// ==================== SISTEMA DE Z-INDEX (DEPTH SORTING) ====================
function sortByDepth(entities) {
    // Ordena entidades pela posição Y (quanto maior Y, mais na frente)
    return entities.sort((a, b) => a.y - b.y);
}

// ==================== LOOP PRINCIPAL ====================
function render() {
    if(!game.active) return;
    
    const cw = canvas.width = window.innerWidth;
    const ch = canvas.height = window.innerHeight;
    
    // Atualiza tempo
    game.time += 0.07;
    if(game.time >= 1440) {
        game.time = 0;
        game.day++;
        saveGame();
        createParticle(cw / 2, 100, '☀️', '#fbbf24');
    }
    
    // Movimento
    let mx = 0, my = 0;
    if(game.keys.r) mx = 1;
    if(game.keys.l) mx = -1;
    if(game.keys.d) my = 1;
    if(game.keys.u) my = -1;
    
    const isWalking = !!(mx || my);
    
    if(isWalking) {
        const mag = Math.sqrt(mx * mx + my * my);
        game.player.x += (mx / mag) * game.player.speed;
        game.player.y += (my / mag) * game.player.speed;
        game.player.frame += 0.25;
        if(mx) game.player.dir = mx;
    } else {
        game.player.frame = 0;
    }
    
    game.cam.x = game.player.x - cw / 2;
    game.cam.y = game.player.y - ch / 2;
    
    if(game.cam.shake > 0) {
        game.cam.shake *= 0.85;
        if(game.cam.shake < 0.5) game.cam.shake = 0;
    }
    
    // Atualiza inimigos
    updateEnemies();
    
    // Cores dinâmicas
    const hour = (game.time / 60) % 24;
    let skyColor = '#1a3317';
    let grassColor = '#2d5a2d';
    
    if(hour >= 5 && hour < 7) {
        const t = (hour - 5) / 2;
        skyColor = lerpColor('#1a1a2e', '#ff9a56', t);
        grassColor = lerpColor('#1a2d1a', '#4a6d3a', t);
    } else if(hour >= 7 && hour < 17) {
        skyColor = '#1a3317';
        grassColor = '#2d5a2d';
    } else if(hour >= 17 && hour < 19) {
        const t = (hour - 17) / 2;
        skyColor = lerpColor('#1a3317', '#4a1a1a', t);
        grassColor = lerpColor('#2d5a2d', '#3d2a2a', t);
    } else {
        skyColor = '#0a0f1a';
        grassColor = '#1a2d3d';
    }
    
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, cw, ch);
    
    ctx.fillStyle = grassColor;
    ctx.fillRect(0, 0, cw, ch);
    
    // Textura de grama
    ctx.save();
    ctx.globalAlpha = 0.1;
    for(let i = 0; i < 50; i++) {
        const gx = (i * 123.456) % cw;
        const gy = (i * 789.123) % ch;
        ctx.fillStyle = '#000';
        ctx.fillRect(gx, gy, 2, 4);
    }
    ctx.restore();
    
    const shakeX = game.cam.shake ? (Math.random() - 0.5) * game.cam.shake : 0;
    const shakeY = game.cam.shake ? (Math.random() - 0.5) * game.cam.shake : 0;
    
    ctx.save();
    ctx.translate(-game.cam.x + shakeX, -game.cam.y + shakeY);
    
    // ==================== COLETA DE ENTIDADES PARA Z-SORTING ====================
    const entities = [];
    
    // Bancadas
    game.isNearBench = false;
    game.built.forEach(b => {
        if(Math.hypot(game.player.x - b.x, game.player.y - b.y) < 80) {
            game.isNearBench = true;
        }
        entities.push({ type: 'bench', x: b.x, y: b.y });
    });
    
    // Recursos (árvores e rochas)
    const startX = Math.floor(game.cam.x / 60) - 2;
    const endX = startX + Math.ceil(cw / 60) + 4;
    const startY = Math.floor(game.cam.y / 60) - 2;
    const endY = startY + Math.ceil(ch / 60) + 4;
    
    for(let x = startX; x <= endX; x++) {
        for(let y = startY; y <= endY; y++) {
            const id = `${x},${y}`;
            const hp = game.mapHP.get(id) || 6;
            
            if(hp === -1) continue;
            
            const n = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123) % 1;
            const ox = x * 60 + 30;
            const oy = y * 60 + 30;
            const dist = Math.hypot(game.player.x - ox, game.player.y - oy);
            
            let shake = 0;
            if(dist < 50 && game.keys.action) {
                shake = Math.sin(Date.now() * 0.05) * 6;
            }
            
            if(n < 0.1) {
                entities.push({ type: 'tree', x: ox, y: oy, shake: shake, hp: hp });
            } else if(n >= 0.1 && n < 0.2) {
                entities.push({ type: 'rock', x: ox, y: oy, shake: shake, hp: hp });
            }
        }
    }
    
    // Inimigos (coelhos)
    game.enemies.forEach(rabbit => {
        entities.push({ type: 'rabbit', x: rabbit.x, y: rabbit.y, data: rabbit });
    });
    
    // Player
    entities.push({ type: 'player', x: game.player.x, y: game.player.y });
    
    // ==================== RENDERIZA COM Z-SORTING ====================
    const sorted = sortByDepth(entities);
    
    sorted.forEach(entity => {
        switch(entity.type) {
            case 'tree':
                drawTree(ctx, entity.x, entity.y, entity.shake, entity.hp);
                break;
            case 'rock':
                drawRock(ctx, entity.x, entity.y, entity.shake, entity.hp);
                break;
            case 'bench':
                drawBench(ctx, entity.x, entity.y);
                break;
            case 'rabbit':
                drawRabbit(ctx, entity.data);
                break;
            case 'player':
                drawPato(ctx, entity.x, entity.y, game.player.dir, isWalking);
                break;
        }
    });
    
    // Partículas sempre por cima
    drawParticles();
    updateParticles();
    
    ctx.restore();
    
    // Iluminação
    let darkness = 0;
    if(hour < 6 || hour >= 20) darkness = 0.75;
    else if(hour < 8 || hour >= 18) darkness = 0.4;
    
    if(darkness > 0) {
        ctx.fillStyle = `rgba(5, 10, 20, ${darkness})`;
        
        if(game.inv.torch && game.selectedSlot === 4) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            
            const grad = ctx.createRadialGradient(cw/2, ch/2, 30, cw/2, ch/2, 160);
            grad.addColorStop(0, 'rgba(0,0,0,1)');
            grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cw/2, ch/2, 160, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillRect(0, 0, cw, ch);
        }
        
        // Vinheta
        const vignette = ctx.createRadialGradient(cw/2, ch/2, cw * 0.3, cw/2, ch/2, cw * 0.7);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);
    }
    
    requestAnimationFrame(render);
}