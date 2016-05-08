stopRender = false;

function init() {
    
    app = new VFApp(document.body, window.innerWidth, window.innerHeight);
    
    storage = [app.createStorage()];
    
}

function render() {
        
    // app.setPortalStorage(storage[0]);
    // var nextIt = app.iteratePortal();
    // app.deleteStorage(storage[0]);
    // storage[0] = nextIt;
    
    var curr = storage.pop();
    app.setPortalStorage(curr);
    var nextIt = app.iteratePortal();
    app.deleteStorage(curr);
    storage.unshift(nextIt);

    app.renderView();
    
    if (!stopRender) {
        requestAnimationFrame(render);
    } else {
        console.log('Stopping render loop...');
    }
    
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