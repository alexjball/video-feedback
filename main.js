oldFramesToRender = null;
framesToRender = Infinity;

function init() {
    
    app = new VFApp(document.body, window.innerWidth, window.innerHeight);
    stateManager = new VFStateManager(app, DefaultAppStates);
    sim = new VFSim(app, 10, 30);
    
    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    document.body.appendChild(stats.domElement);
    
}

function stop() {
    
    unpause();
    
    framesToRender = 0;
        
}

function pause() {
    
    oldFramesToRender = framesToRender;
    
    framesToRender = 0;
    
}

function unpause() {
    
    if (oldFramesToRender !== null) {
    
        framesToRender = oldFramesToRender;
         
        oldFramesToRender = null;

    }

}

function resume() {
    
    unpause();
    
    framesToRender = Infinity;
    
}

function render() {
    
    if (framesToRender > 0) {
        
        framesToRender--;   

        stats.begin();
            
        updateUI();
        
        sim.step();
        
        stats.end();

    }
    
    requestAnimationFrame(render);
    
}

function keyboardHandler(event) {
    
    var charCode = event.keyCode || event.which;
    var charStr = String.fromCharCode(charCode);

    switch (charStr) {
        case " ":
        
            stopRender = !stopRender;
            
            if (!stopRender) {
                console.log('Starting render loop...');
                render();
            }
            break;
            
        case "N":
            console.log('Single render...');
            stopRender = true;
            render();
            
            break;
            
        case "A":
        
            storage.push(app.createStorage());
            break;
    }
    
}

window.addEventListener("keydown", keyboardHandler, false);