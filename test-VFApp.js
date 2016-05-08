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
    
    /*
    
    a = getRenderTarget();
    setStorage(a);
    b = iterate();
    delete a;
    a = b;
    
    */
    
    updateUI();
    
    // I believe the bottom two blocks should be equivalent but the
    // second causes warnings about unbound textures.
    
    var nextIt = app.iteratePortal();
    app.deleteStorage(storage[0]);
    storage[0] = nextIt;
    app.setPortalStorage(storage[0]);
    
    // var curr = storage.pop();
    // var nextIt = app.iteratePortal();
    // app.deleteStorage(curr);
    // storage.unshift(nextIt);
    // app.setPortalStorage(curr);    


    app.renderView();
    
    if (!stopRender) {
        requestAnimationFrame(render);
    } else {
        console.log('Stopping render loop...');
    }

    // stopRender = true;    
    // console.log('Stopping render loop...');

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
            
        case "A":
        
            storage.push(app.createStorage());
            break;
    }
    
}

window.addEventListener("keydown", keyboardHandler, false);