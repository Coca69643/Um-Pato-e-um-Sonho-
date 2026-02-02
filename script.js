const Game = {
    canvas: null, ctx: null, isRunning: false,
    worldSize: 2000,
    camera: { x: 0, y: 0 },
    resources: [],
    inventory: { wood: 0, stone: 0 },
    assets: { idle: [], walk: [], arvore: new Image(), rocha: new Image() },
    
    player: {
        x: 1000, y: 1000, targetX: 1000, targetY: 1000,
        size: 64, speed: 0.08, isMoving: false, facingRight: true,
        animFrame: 0, animTimer: 0
    },

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.loadAll();
        this.spawnResources();
        
        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('game-hud').classList.remove('hidden');
        
        this.isRunning = true;
        this.bind();
        this.loop();
    },

    loadAll() {
        const v = "?v=" + Date.now(); // Mata o cache
        const l = (p) => { const i = new Image(); i.src = "img/" + p + v; return i; };
        
        this.assets.idle = [ l('idle1.png'), l('idle2.png') ];
        this.assets.walk = [ l('walk1.png'), l('walk2.png') ];
        this.assets.arvore.src = "img/arvore.png" + v;
        this.assets.rocha.src = "img/rocha.png" + v;
    },

    spawnResources() {
        this.resources = [];
        for(let i=0; i<100; i++) {
            this.resources.push({
                x: Math.random() * this.worldSize,
                y: Math.random() * this.worldSize,
                type: Math.random() > 0.5 ? 'wood' : 'stone',
                collected: false
            });
        }
    },

    bind() {
        const move = (e) => {
            const pos = e.touches ? e.touches[0] : e;
            const rect = this.canvas.getBoundingClientRect();
            this.player.targetX = (pos.clientX - rect.left) + this.camera.x;
            this.player.targetY = (pos.clientY - rect.top) + this.camera.y;
            this.player.facingRight = this.player.targetX > this.player.x;
        };
        this.canvas.addEventListener('mousedown', move);
        this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); move(e); });
    },

    update() {
        const p = this.player;
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.isMoving = Math.hypot(dx, dy) > 5;
        
        if(p.isMoving) { p.x += dx * p.speed; p.y += dy * p.speed; }

        this.camera.x = p.x - this.canvas.width / 2;
        this.camera.y = p.y - this.canvas.height / 2;

        p.animTimer++;
        if(p.animTimer > 10) { p.animFrame++; p.animTimer = 0; }

        this.resources.forEach(r => {
            if(!r.collected && Math.hypot(p.x - r.x, p.y - r.y) < 40) {
                r.collected = true;
                this.inventory[r.type]++;
                document.getElementById('m-count').innerText = this.inventory.wood;
                document.getElementById('p-count').innerText = this.inventory.stone;
            }
        });
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Chão
        this.ctx.fillStyle = "#2d5a27";
        this.ctx.fillRect(0, 0, this.worldSize, this.worldSize);

        // Grid
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        for(let i=0; i<=this.worldSize; i+=80) {
            this.ctx.beginPath(); this.ctx.moveTo(i,0); this.ctx.lineTo(i,this.worldSize); this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.moveTo(0,i); this.ctx.lineTo(this.worldSize,i); this.ctx.stroke();
        }

        // Desenhar Itens e Pato (Ordenado por Y)
        const objs = [...this.resources.filter(r=>!r.collected), this.player];
        objs.sort((a,b) => (a.y || a.y) - (b.y || b.y));

        objs.forEach(o => {
            if(o === this.player) {
                this.ctx.save();
                this.ctx.translate(o.x, o.y);
                if(!o.facingRight) this.ctx.scale(-1, 1);
                const img = (o.isMoving ? this.assets.walk : this.assets.idle)[o.animFrame % 2];
                if(img.complete) this.ctx.drawImage(img, -32, -32, 64, 64);
                this.ctx.restore();
            } else {
                const img = o.type === 'wood' ? this.assets.arvore : this.assets.rocha;
                if(img.complete) this.ctx.drawImage(img, o.x-30, o.y-30, 60, 60);
            }
        });

        this.ctx.restore();
    },

    loop() {
        if(!this.isRunning) return;
        this.update(); this.render();
        requestAnimationFrame(() => this.loop());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
};

const UI = {
    toggleLog() { document.getElementById('modal-log').classList.toggle('active'); },
    msg() { alert("Alpha v0.0.8 pronta!"); }
};

