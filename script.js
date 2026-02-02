/**
 * PATO SURVIVAL - script.js v0.0.6
 * Sistema de Câmera Virtual & Mapa Expandido
 */

const Game = {
    canvas: null,
    ctx: null,
    isRunning: false,
    
    // CONFIGURAÇÃO DO MUNDO
    worldSize: 2000, // O mapa agora é 4x maior que uma tela comum
    tileSize: 100,   // Tamanho do quadrado do chão (grid)
    
    // SISTEMA DE CÂMERA
    camera: {
        x: 0,
        y: 0
    },

    resources: [],
    particles: [],
    inventory: { wood: 0, stone: 0 },
    
    assets: { idle: [], walk: [] },
    
    player: {
        x: 1000, // Começa no meio do mundo (worldSize / 2)
        y: 1000,
        targetX: 1000,
        targetY: 1000,
        size: 64, // Tamanho do Pato
        speed: 0.12,
        isMoving: false,
        facingRight: true,
        animFrame: 0,
        animTimer: 0,
        animSpeed: 10
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.loadSprites();
        this.resize();
        
        // Esconde menu, mostra HUD
        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        
        this.isRunning = true;
        this.spawnResources();
        this.bindEvents();
        this.loop();
    },

    loadSprites() {
    const nocache = "?v=" + Date.now(); // Força o navegador a baixar de novo
    const load = (path) => {
        const img = new Image();
        img.src = path + nocache; 
        img.onload = () => console.log("Carregado: " + path);
        img.onerror = () => console.error("ERRO: Verifique se a imagem está em: " + path);
        return img;
    };
    this.assets.idle = [ load('img/idle1.png'), load('img/idle2.png') ];
    this.assets.walk = [ load('img/walk1.png'), load('img/walk2.png') ];
}

    spawnResources() {
        const types = [ { char: '🌳', type: 'wood' }, { char: '🪨', type: 'stone' } ];
        this.resources = [];
        
        // Espalha 50 recursos pelo mapa gigante (worldSize)
        for(let i = 0; i < 50; i++) {
            const res = types[Math.floor(Math.random() * types.length)];
            this.resources.push({
                x: Math.random() * this.worldSize,
                y: Math.random() * this.worldSize,
                char: res.char,
                type: res.type,
                collected: false
            });
        }
    },

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0, color: color
            });
        }
    },

    bindEvents() {
        const handleInput = (e) => {
            if(!this.isRunning) return;
            const pos = e.touches ? e.touches[0] : e;
            
            // CONVERSÃO DE COORDENADAS: Tela -> Mundo
            // Onde eu toquei na tela + Onde a câmera está = Ponto no Mundo
            const worldX = pos.clientX + this.camera.x;
            const worldY = pos.clientY + this.camera.y;

            this.player.targetX = worldX;
            this.player.targetY = worldY;

            if (worldX > this.player.x) this.player.facingRight = true;
            if (worldX < this.player.x) this.player.facingRight = false;
        };

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); });
        this.canvas.addEventListener('mousedown', handleInput);
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); });
    },

    update() {
        if (!this.isRunning) return;

        // 1. Mover Player (LERP)
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const dist = Math.hypot(dx, dy);
        
        this.player.isMoving = dist > 5;

        if (this.player.isMoving) {
            this.player.x += dx * this.player.speed;
            this.player.y += dy * this.player.speed;
        }
        
        // Limitar player às bordas do mundo
        this.player.x = Math.max(0, Math.min(this.player.x, this.worldSize));
        this.player.y = Math.max(0, Math.min(this.player.y, this.worldSize));

        // 2. ATUALIZAR CÂMERA
        // A câmera tenta centralizar o player
        // Câmera X = Player X - Metade da Tela
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // 3. Animação e Partículas
        this.player.animTimer++;
        if (this.player.animTimer > this.player.animSpeed) {
            this.player.animFrame++; 
            this.player.animTimer = 0;
        }

        this.particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        });

        // 4. Colisão
        this.resources.forEach(res => {
            if(!res.collected) {
                // Distância simples
                if(Math.hypot(this.player.x - res.x, (this.player.y + 20) - res.y) < 50) {
                    res.collected = true;
                    this.inventory[res.type]++;
                    this.createParticles(res.x, res.y, res.type === 'wood' ? '#8B4513' : '#7f8c8d');
                    this.updateHUD();
                }
            }
        });

        // Respawn infinito
        if(this.resources.every(r => r.collected)) this.spawnResources();
    },

    updateHUD() {
        document.getElementById('m-count').innerText = this.inventory.wood;
        document.getElementById('p-count').innerText = this.inventory.stone;
    },

    // DESENHAR GRADE DO CHÃO (Para ver que estamos andando)
    drawGrid() {
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        this.ctx.lineWidth = 2;
        
        // Calcular onde começar a desenhar a grade baseado na câmera
        const startX = Math.floor(this.camera.x / this.tileSize) * this.tileSize;
        const startY = Math.floor(this.camera.y / this.tileSize) * this.tileSize;

        for (let x = startX; x < this.camera.x + this.canvas.width + this.tileSize; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, this.camera.y + this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = startY; y < this.camera.y + this.canvas.height + this.tileSize; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(this.camera.x + this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Borda do mundo
        this.ctx.strokeStyle = "red";
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(0, 0, this.worldSize, this.worldSize);
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        // A MÁGICA DA CÂMERA: Movemos o contexto oposto à câmera
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 1. Desenhar Chão
        this.drawGrid();

        // 2. Ordenar Profundidade (Z-Sort)
        const drawList = [...this.resources.filter(r => !r.collected), this.player];
        drawList.sort((a, b) => a.y - b.y);

        // 3. Desenhar Objetos
        drawList.forEach(obj => {
            if (obj === this.player) {
                // Desenhar Sprite do Pato
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);
                if (!this.player.facingRight) this.ctx.scale(-1, 1);
                
                let currentSprites = this.player.isMoving ? this.assets.walk : this.assets.idle;
                let img = currentSprites[this.player.animFrame % currentSprites.length];

                if (img && img.complete) {
                    this.ctx.drawImage(img, -this.player.size/2, -this.player.size/2, this.player.size, this.player.size);
                } else {
                    this.ctx.font = "40px Arial";
                    this.ctx.fillText("🦆", 0, 0);
                }
                this.ctx.restore();
            } else {
                // Desenhar Árvores/Pedras
                this.ctx.font = "40px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(obj.char, obj.x, obj.y);
            }
        });

        // 4. Partículas
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, 5, 5);
        });
        
        this.ctx.restore(); // Restaura para coordenadas de tela (para HUD, se fosse desenhado no canvas)
        this.ctx.globalAlpha = 1.0;
    },

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    },
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }
};

window.addEventListener('resize', () => Game.resize());




