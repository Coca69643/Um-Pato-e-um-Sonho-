const Game = {
    canvas: null,
    ctx: null,
    resources: [],
    inventory: { wood: 0, stone: 0 },
    isRunning: false,

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
        for(let i = 0; i < 20; i++) {
            this.resources.push({
                x: Math.random() * (this.canvas.width - 60) + 30,
                y: Math.random() * (this.canvas.height - 60) + 30,
                type: types[Math.floor(Math.random() * types.length)],
                size: 45
            });
        }
    },

    bindEvents() {
        const handleInput = (e) => {
            const pos = e.touches ? e.touches[0] : e;
            this.checkClick(pos.clientX, pos.clientY);
        };
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(e); });
        this.canvas.addEventListener('mousedown', handleInput);
    },

    checkClick(tx, ty) {
        this.resources = this.resources.filter(res => {
            const dist = Math.hypot(res.x - tx, res.y - ty);
            if(dist < res.size) {
                res.type === '🌳' ? this.inventory.wood++ : this.inventory.stone++;
                this.updateHUD();
                return false;
            }
            return true;
        });
        if(this.resources.length === 0) this.spawnResources();
    },

    updateHUD() {
        document.getElementById('m-count').innerText = this.inventory.wood;
        document.getElementById('p-count').innerText = this.inventory.stone;
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = "35px Arial";
        this.ctx.textAlign = "center";
        this.resources.forEach(res => {
            this.ctx.fillText(res.type, res.x, res.y + 15);
        });
    },

    loop() {
        if(!this.isRunning) return;
        this.render();
        requestAnimationFrame(() => this.loop());
    }
};

const UI = {
    toggleLog() {
        document.getElementById('modal-log').classList.toggle('active');
    },
    openSettings() {
        alert("Opções: Sistema de Brilho em breve!");
    }
};

window.addEventListener('resize', () => Game.resize());
