const SCALES = {
    tree: 0.35,
    rock: 0.45,
    pato: 1.0,
    rabbit: 0.5,
    bench: 1.0,
    tile: 1.0
};

const RABBIT_SPRITE = {
    frameWidth: 32,
    frameHeight: 32,
    totalFrames: 4
};

function drawTile(ctx, tile) {
    const tileSize = 60;
    
    switch(tile.type) {
        case 'grass':
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
            ctx.fillStyle = '#45a049';
            for(let i = 0; i < 3; i++) {
                const gx = tile.x + Math.random() * tileSize;
                const gy = tile.y + Math.random() * tileSize;
                ctx.fillRect(gx, gy, 2, 4);
            }
            break;
        case 'dirt':
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(tile.x, tile.y, tileSize, 2);
            break;
        case 'stone':
            ctx.fillStyle = '#607d8b';
            ctx.fillRect(tile.x, tile.y, tileSize, tileSize);
            ctx.fillStyle = '#546e7a';
            ctx.fillRect(tile.x, tile.y, tileSize, 2);
            ctx.fillRect(tile.x, tile.y, 2, tileSize);
            break;
    }
}

function drawTree(ctx, x, y, shake, destroyed) {
    if(destroyed) return;
    const img = assets.images.arvore;
    if(!img || !img.complete) return;
    const width = img.width * SCALES.tree;
    const height = img.height * SCALES.tree;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + shake, y + 5, width * 0.25, width * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, x + shake - width / 2, y - height, width, height);
}

function drawRock(ctx, x, y, shake, destroyed) {
    if(destroyed) return;
    const img = assets.images.rocha;
    if(!img || !img.complete) return;
    const width = img.width * SCALES.rock;
    const height = img.height * SCALES.rock;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + shake, y + 5, width * 0.35, width * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, x + shake - width / 2, y - height * 0.75, width, height);
}

function drawPato(ctx, x, y, dir, walking) {
    game.player.frameCount++;
    let currentFrame;
    if(walking) {
        const walkFrame = Math.floor(game.player.frameCount / 10) % 2;
        currentFrame = walkFrame === 0 ? assets.images.patoWalk1 : assets.images.patoWalk2;
    } else {
        const idleFrame = Math.floor(game.player.frameCount / 15) % 2;
        currentFrame = idleFrame === 0 ? assets.images.patoIdle1 : assets.images.patoIdle2;
    }
    if(!currentFrame || !currentFrame.complete) return;
    ctx.save();
    ctx.translate(x, y);
    if(dir < 0) ctx.scale(-1, 1);
    const bob = walking ? Math.sin(game.player.frameCount * 0.15) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const scale = SCALES.pato;
    const width = currentFrame.width * scale;
    const height = currentFrame.height * scale;
    ctx.drawImage(currentFrame, -width / 2, -height + 18 + bob, width, height);
    ctx.restore();
}

function drawRabbit(ctx, rabbit) {
    const img = assets.images.rabbitSheet;
    if(!img || !img.complete) return;
    rabbit.frameCount++;
    ctx.save();
    ctx.translate(rabbit.x, rabbit.y);
    if(rabbit.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 15, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const frameIndex = Math.floor(rabbit.frameCount / 8) % RABBIT_SPRITE.totalFrames;
    const sourceX = frameIndex * RABBIT_SPRITE.frameWidth;
    const sourceY = 0;
    const bob = rabbit.state === 'hop' ? Math.sin(rabbit.frameCount * 0.3) * 4 : 0;
    const scale = SCALES.rabbit;
    const width = RABBIT_SPRITE.frameWidth * scale;
    const height = RABBIT_SPRITE.frameHeight * scale;
    ctx.drawImage(img, sourceX, sourceY, RABBIT_SPRITE.frameWidth, RABBIT_SPRITE.frameHeight, -width / 2, -height + 15 + bob, width, height);
    ctx.restore();
}

function drawBench(ctx, x, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - 28, y + 8, 56, 6);
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(x - 28, y - 20, 56, 30);
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x - 28, y - 20, 56, 6);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x - 24, y, 6, 10);
    ctx.fillRect(x + 18, y, 6, 10);
    ctx.strokeStyle = '#6d4c41';
    ctx.lineWidth = 2;
    for(let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 16 + i * 8);
        ctx.lineTo(x + 20, y - 16 + i * 8);
        ctx.stroke();
    }
}

function sortByDepth(entities) {
    return entities.sort((a, b) => a.y - b.y);
}

function render() {
    if(!game.active) return;
    const cw = canvas.width = window.innerWidth;
    const ch = canvas.height = window.innerHeight;
    game.time += 0.07;
    if(game.time >= 1440) {
        game.time = 0;
        game.day++;
        saveGame();
        createParticle(cw / 2, 100, '☀️', '#fbbf24');
    }
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
    updateEnemies();
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
    const shakeX = game.cam.shake ? (Math.random() - 0.5) * game.cam.shake : 0;
    const shakeY = game.cam.shake ? (Math.random() - 0.5) * game.cam.shake : 0;
    ctx.save();
    ctx.translate(-game.cam.x + shakeX, -game.cam.y + shakeY);
    
    const CHUNK_SIZE = 16;
    const tileSize = 60;
    const startChunkX = Math.floor((game.cam.x - 100) / (CHUNK_SIZE * tileSize));
    const endChunkX = Math.ceil((game.cam.x + cw + 100) / (CHUNK_SIZE * tileSize));
    const startChunkY = Math.floor((game.cam.y - 100) / (CHUNK_SIZE * tileSize));
    const endChunkY = Math.ceil((game.cam.y + ch + 100) / (CHUNK_SIZE * tileSize));
    
    for(let cx = startChunkX; cx <= endChunkX; cx++) {
        for(let cy = startChunkY; cy <= endChunkY; cy++) {
            const chunkKey = `${cx},${cy}`;
            const chunk = game.world[chunkKey];
            if(!chunk) continue;
            
            chunk.forEach(tile => {
                if(tile.x >= game.cam.x - 100 && tile.x <= game.cam.x + cw + 100 &&
                   tile.y >= game.cam.y - 100 && tile.y <= game.cam.y + ch + 100) {
                    drawTile(ctx, tile);
                }
            });
        }
    }
    
    const entities = [];
    game.isNearBench = false;
    game.built.forEach(b => {
        if(Math.hypot(game.player.x - b.x, game.player.y - b.y) < 80) {
            game.isNearBench = true;
        }
        entities.push({ type: 'bench', x: b.x, y: b.y });
    });
    
    for(let cx = startChunkX; cx <= endChunkX; cx++) {
        for(let cy = startChunkY; cy <= endChunkY; cy++) {
            const chunkKey = `${cx},${cy}`;
            const chunk = game.world[chunkKey];
            if(!chunk) continue;
            
            chunk.forEach(tile => {
                if(tile.type === 'tree' || tile.type === 'rock') {
                    if(tile.x >= game.cam.x - 100 && tile.x <= game.cam.x + cw + 100 &&
                       tile.y >= game.cam.y - 100 && tile.y <= game.cam.y + ch + 100) {
                        const dist = Math.hypot(game.player.x - tile.x, game.player.y - tile.y);
                        let shake = 0;
                        if(dist < 50 && game.keys.action && !tile.destroyed) {
                            shake = Math.sin(Date.now() * 0.05) * 6;
                        }
                        entities.push({ 
                            type: tile.type, 
                            x: tile.x, 
                            y: tile.y, 
                            shake: shake,
                            destroyed: tile.destroyed 
                        });
                    }
                }
            });
        }
    }
    
    game.enemies.forEach(rabbit => {
        entities.push({ type: 'rabbit', x: rabbit.x, y: rabbit.y, data: rabbit });
    });
    entities.push({ type: 'player', x: game.player.x, y: game.player.y });
    const sorted = sortByDepth(entities);
    sorted.forEach(entity => {
        switch(entity.type) {
            case 'tree':
                drawTree(ctx, entity.x, entity.y, entity.shake, entity.destroyed);
                break;
            case 'rock':
                drawRock(ctx, entity.x, entity.y, entity.shake, entity.destroyed);
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
    drawParticles();
    updateParticles();
    ctx.restore();
    let darkness = 0;
    if(hour < 6 || hour >= 20) darkness = 0.75;
    else if(hour < 8 || hour >= 18) darkness = 0.4;
    if(darkness > 0) {
        ctx.fillStyle = `rgba(5, 10, 20, ${darkness})`;
        ctx.fillRect(0, 0, cw, ch);
        if(game.inv.torch && game.selectedSlot === 4) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            const grad = ctx.createRadialGradient(cw/2, ch/2, 20, cw/2, ch/2, 150);
            grad.addColorStop(0, 'rgba(5, 10, 20, 1)');
            grad.addColorStop(0.5, 'rgba(5, 10, 20, 0.6)');
            grad.addColorStop(1, 'rgba(5, 10, 20, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cw/2, ch/2, 150, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        const vignette = ctx.createRadialGradient(cw/2, ch/2, cw * 0.3, cw/2, ch/2, cw * 0.7);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);
    }
    requestAnimationFrame(render);
}