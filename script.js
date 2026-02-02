const Game = {
    canvas: null, ctx: null,
    isRunning: false,
    resources: [],
    inventory: { wood: 0, stone: 0 },
    
    // ATRIBUTOS DO PATO
    player: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        size: 40,
        speed: 0.1, // Velocidade de interpolação (suavidade)
        emoji: "🦆"
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
        const types = ['🌳', '🪨'];
        this.resources = [];
        for(let i = 0; i < 15; i++) {
            this.resources.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: Math.random() * (this.canvas.height - 60) + 30,
                type: types[Math.floor(Math.random() * types.length)],
                size: 30,
                collected: false
            });
        }
    },

    bindEvents() {
        const handleMove = (e) => {
            if(!this.isRunning) return;
            const pos = e.touches ? e.touches[0] : e;
            // Define o destino do Pato
            this.player.targetX = pos.clientX;
            this.player.targetY = pos.clientY;
        };

        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleMove(e); });
        this.canvas.addEventListener('mousedown', handleMove);
        // O Pato segue o dedo se arrastar (Mobile-style)
        this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); });
    },

    update() {
        // MOVIMENTAÇÃO SUAVE (LERP)
        this.player.x += (this.player.targetX - this.player.x) * this.player.speed;
        this.player.y += (this.player.targetY - this.player.y) * this.player.speed;

        // COLISÃO E COLETA
        this.resources.forEach(res => {
            if(!res.collected) {
                const dist = Math.hypot(this.player.x - res.x, this.player.y - res.y);
                if(dist < this.player.size / 1.5) {
                    res.collected = true;
                    res.type === '🌳' ? this.inventory.wood++ : this.inventory.stone++;
                    this.updateHUD();
                }
            }
        });

        // Respawn se limpar tudo
        if(this.resources.every(r => r.collected)) this.spawnResources();
    },

    updateHUD() {
        document.getElementById('m-count').innerText = this.inventory.wood;
        document.getElementById('p-count').innerText = this.inventory.stone;
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // DESENHAR RECURSOS
        this.ctx.font = "30px Arial";
        this.ctx.textAlign = "center";
        this.resources.forEach(res => {
            if(!res.collected) {
                this.ctx.fillText(res.type, res.x, res.y + 10);
            }
        });

        // DESENHAR O PATO (PERSONAGEM)
        this.ctx.font = "45px Arial";
        // Inverter o pato dependendo da direção
        const flip = this.player.targetX < this.player.x ? -1 : 1;
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.scale(flip, 1);
        this.ctx.fillText(this.player.emoji, 0, 15);
        this.ctx.restore();
    },

    loop() {
        if(!this.isRunning) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }
};

const UI = {
    toggleLog() { document.getElementById('modal-log').classList.toggle('active'); },
    openSettings() { alert("Configurações v0.0.1: Som em desenvolvimento."); }
};

window.addEventListener('resize', () => Game.resize());

