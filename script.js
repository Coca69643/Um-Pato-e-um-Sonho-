/**
 * PATO SURVIVAL - script.js v0.0.5
 * Sistema de Animação de Sprites (Idle & Walk)
 */

const Game = {
    canvas: null,
    ctx: null,
    isRunning: false,
    resources: [],
    particles: [],
    inventory: { wood: 0, stone: 0 },
    
    // BANCO DE IMAGENS
    assets: {
        idle: [],
        walk: []
    },
    
    player: {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        size: 55, // Aumentei um pouco para ver melhor a arte
        speed: 0.12,
        isMoving: false,
        facingRight: true, // Para saber para onde olhar
        
        // Configuração da Animação
        animFrame: 0,   // Qual imagem mostrar (0 ou 1)
        animTimer: 0,   // Cronômetro para mudar a imagem
        animSpeed: 10   // Velocidade da animação (quanto menor, mais rápido)
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 1. CARREGAR OS 4 SPRITES
        this.loadSprites();

        this.resize();
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.player.targetX = this.player.x;
        this.player.targetY = this.player.y;

        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        
        this.isRunning = true;
        this.spawnResources();
        this.bindEvents();
        this.loop();
    },

    loadSprites() {
        // Função ajudante para carregar imagem
        const load = (path) => {
            const img = new Image();
            img.src = path;
            return img;
        };

        // Carrega as animações nos arrays
        // Certifique-se que os arquivos estão na pasta img/ com esses nomes!
        this.assets.idle = [
            load('img/idle1.png'),
            load('img/idle2.png')
        ];
        
        this.assets.walk = [
            load('img/walk1.png'),
            load('img/walk2.png')
        ];
    },

    spawnResources() {
        const types = [
            { char: '🌳', type: 'wood' },
            { char: '🪨', type: 'stone' }
        ];
        this.resources = [];
        for(let i = 0; i < 15; i++) {
            const res = types[Math.floor(Math.random() * types.length)];
            this.resources.push({
                x: Math.random() * (this.canvas.width - 80) + 40,
                y: Math.random() * (this.canvas.height - 80) + 40,
                char: res.char,
                type: res.type,
                collected: false
            });
        }
    },

    createParticles(x, y, color) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0, color: color
            });
        }
    },

    bindEvents() {
        const handleMove = (e) => {
            if(!this.isRunning) return;
            const pos = e.touches ? e.touches[0] : e;
            this.player.targetX = pos.clientX;
            this.player.targetY = pos.clientY;
            
            // Define o lado que o pato olha
            if (this.player.targetX > this.player.x) this.player.facingRight = true;
            if (this.player.targetX < this.player.x) this.player.facingRight = false;
        };
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleMove(e); });
        this.canvas.addEventListener('mousedown', handleMove);
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); });
    },

    update() {
        if (!this.isRunning) return;

        // --- LÓGICA DE MOVIMENTO ---
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const dist = Math.hypot(dx, dy);
        
        // Se estiver perto do alvo, para de andar
        this.player.isMoving = dist > 5;

        if (this.player.isMoving) {
            this.player.x += dx * this.player.speed;
            this.player.y += dy * this.player.speed;
        }

        // --- LÓGICA DE ANIMAÇÃO ---
        this.player.animTimer++;
        
        // Alterna os frames a cada X ticks (animSpeed)
        if (this.player.animTimer > this.player.animSpeed) {
            this.player.animFrame++; 
            this.player.animTimer = 0;
        }

        // --- PARTÍCULAS ---
        this.particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        });

        // --- COLISÃO ---
        this.resources.forEach(res => {
            if(!res.collected) {
                const distRes = Math.hypot(this.player.x - res.x, (this.player.y + 15) - res.y);
                if(distRes < 45) {
                    res.collected = true;
                    this.inventory[res.type]++;
                    this.createParticles(res.x, res.y, res.type === 'wood' ? '#8B4513' : '#7f8c8d');
                    this.updateHUD();
                }
            }
        });

        if(this.resources.every(r => r.collected)) {
            this.resources = [];
            this.spawnResources();
        }
    },

    updateHUD() {
        document.getElementById('m-count').innerText = this.inventory.wood;
        document.getElementById('p-count').innerText = this.inventory.stone;
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const drawList = [...this.resources.filter(r => !r.collected), this.player];
        drawList.sort((a, b) => a.y - b.y);

        drawList.forEach(obj => {
            if (obj === this.player) {
                // --- DESENHO DO PATO ANIMADO ---
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y);
                
                // Espelhamento (Flip Horizontal)
                if (!this.player.facingRight) {
                    this.ctx.scale(-1, 1);
                }

                // Escolher qual conjunto de sprites usar
                let currentSprites = this.player.isMoving ? this.assets.walk : this.assets.idle;
                
                // Escolher qual frame usar (usando resto da divisão para ciclar 0, 1, 0, 1...)
                let frameIndex = this.player.animFrame % currentSprites.length;
                let img = currentSprites[frameIndex];

                // Desenhar
                const size = this.player.size;
                if (img && img.complete) {
                    this.ctx.drawImage(img, -size/2, -size/2, size, size);
                } else {
                    // Fallback se a imagem não carregou ainda
                    this.ctx.fillStyle = "yellow";
                    this.ctx.fillRect(-10, -10, 20, 20);
                }
                this.ctx.restore();

            } else {
                // Recursos
                this.ctx.font = "35px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(obj.char, obj.x, obj.y);
            }
        });

        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, 4, 4);
        });
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
        this.ctx.imageSmoothingEnabled = false; // Mantém o pixel art nítido
    }
};

window.addEventListener('resize', () => Game.resize());



