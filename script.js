const Game = {
    // ... (mantenha a estrutura anterior, mas verifique os nomes abaixo)
    loadAll() {
        const v = "?v=0.0.8"; 
        const l = (p) => { const i = new Image(); i.src = "img/" + p + v; return i; };
        
        this.assets.idle = [ l('idle1.png'), l('idle2.png') ];
        this.assets.walk = [ l('walk1.png'), l('walk2.png') ];
        this.assets.arvore = l('arvore.png');
        this.assets.rocha = l('rocha.png');
    },
    // ... restante do código do loop e render
};


