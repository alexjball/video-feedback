stopRender = false;

function init() {
    
    app = new VFApp(document.body, window.innerWidth, window.innerHeight);
    
    storage = [app.createStorage()];

    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    document.body.appendChild(stats.domElement);
    
}

function render() {

    stats.begin();
        
    updateUI();
    
    var curr = storage.pop();
    app.setPortalStorage(curr);                
    var nextIt = app.iteratePortal();
    app.deleteStorage(curr);
    storage.unshift(nextIt);
    app.setPortalStorage(nextIt);

    app.renderView();
    
    if (!stopRender) {
        requestAnimationFrame(render);
    } else {
        console.log('Stopping render loop...');
    }

    stats.end();
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