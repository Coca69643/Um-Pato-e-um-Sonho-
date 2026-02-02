/**
 * PATO SURVIVAL - script.js v0.0.3
 * Engenharia de Movimento e Efeitos Visuais
 */

const Game = {
    canvas: null,
    ctx: null,
    isRunning: false,
    resources: [],
    particles: [], // Novo sistema de partículas
    inventory: { wood: 0, stone: 0 },
    
    player: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        size: 45,
        speed: 0.12, // Um pouco mais rápido para mobile
        emoji: "🦆",
        rotation: 0,
        bounce: 0 // Efeito de respiração
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        
        this.isRunning = true;
        this.spawnResources();
        this.bindEvents();
        this.loop();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    },

    spawnResources() {
        const types = [
            { char: '🌳', type: 'wood' },
            { char: '🪨', type: 'stone' }
        ];
        for(let i = 0; i < 12; i++) {
            const res = types[Math.floor(Math.random() * types.length)];
            this.resources.push({
                x: Math.random() * (this.canvas.width - 80) + 40,
                y: Math.random() * (this.canvas.height - 80) + 40,
                char: res.char,
                type: res.type,
                size: 35,
                collected: false
            });
        }
    },

    createParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0,
                color: color
            });
        }
    },

    bindEvents() {
        const handleMove = (e) => {
            if(!this.isRunning) return;
            const pos = e.touches ? e.touches[0] : e;
            this.player.targetX = pos.clientX;
            this.player.targetY = pos.clientY;
        };

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleMove(e); });
        this.canvas.addEventListener('mousedown', handleMove);
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); });
    },

    update() {
        if (!this.isRunning) return;

        // 1. Movimentação Suave (Lerp)
        this.player.x += (this.player.targetX - this.player.x) * this.player.speed;
        this.player.y += (this.player.targetY - this.player.y) * this.player.speed;

        // 2. Animação de Bounce (Seno do tempo)
        this.player.bounce = Math.sin(Date.now() / 150) * 5;

        // 3. Atualizar Partículas
        this.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) this.particles.splice(i, 1);
        });

        // 4. Colisão e Coleta com Profundidade
        this.resources.forEach(res => {
            if(!res.collected) {
                const dist = Math.hypot(this.player.x - res.x, this.player.y - (res.y - 10));
                if(dist < this.player.size * 0.7) {
                    res.collected = true;
                    this.inventory[res.type]++;
                    this.createParticles(res.x, res.y, res.type === 'wood' ? '#8B4513' : '#888');
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
        
        // Ordenar por posição Y para profundidade (Z-sorting)
        const drawList = [...this.resources.filter(r => !r.collected), this.player];
        drawList.sort((a, b) => (a.y || a.playerY) - (b.y || b.playerY));

        drawList.forEach(obj => {
            if (obj === this.player) {
                // Desenhar Pato
                const flip = this.player.targetX < this.player.x ? -1 : 1;
                this.ctx.save();
                this.ctx.translate(this.player.x, this.player.y + this.player.bounce);
                this.ctx.scale(flip, 1);
                this.ctx.font = "45px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(this.player.emoji, 0, 15);
                this.ctx.restore();
            } else {
                // Desenhar Recursos
                this.ctx.font = "35px Arial";
                this.ctx.textAlign = "center";
                this.ctx.fillText(obj.char, obj.x, obj.y);
            }
        });

        // Desenhar Partículas
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
    }
};

const UI = {
    toggleLog() { document.getElementById('modal-log').classList.toggle('active'); },
    openSettings() { alert("Ajustes: Sensibilidade de movimento otimizada!"); }
};

window.addEventListener('resize', () => Game.resize());


