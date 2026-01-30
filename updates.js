G.rabbit = { x: 1300, y: 1200, speed: 3.8, frame: 0, timer: 0, state: 'idle', facing: 1 };

window.updateExtra = function() {
    if (G.state !== 'playing') return;
    let r = G.rabbit;
    let dist = Math.hypot(r.x - G.pato.x, r.y - G.pato.y);
    if (dist < 180) {
        r.state = 'run';
        let ang = Math.atan2(r.y - G.pato.y, r.x - G.pato.x);
        r.x += Math.cos(ang) * r.speed; r.y += Math.sin(ang) * r.speed;
        r.facing = (r.x - G.pato.x) > 0 ? 1 : -1;
    } else { r.state = 'idle'; }
    if(++r.timer > 10) { r.frame = (r.frame + 1) % 4; r.timer = 0; }
};

window.drawExtra = function() {
    let r = G.rabbit;
    ctx.save();
    ctx.translate(r.x, r.y);
    if (r.facing === -1) ctx.scale(-1, 1);
    let sy = (r.state === 'run') ? 32 : 0;
    ctx.drawImage(G.assets['rabbit'], r.frame * 32, sy, 32, 32, -20, -20, 40, 40);
    ctx.restore();
};
