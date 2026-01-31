const AppControl = {
    version: "1.0.8", // Aumente esse número se as imagens não aparecerem
    
    // Gera um link único para burlar o cache do navegador
    fixPath: function(path) {
        return path + "?v=" + this.version;
    },
    
    log: function(msg) {
        console.log(`[PatoEngine] ${msg}`);
    }
};

window.AppControl = AppControl;

