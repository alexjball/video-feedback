var Demo3dInputController = function() {
    this.helpButton = document.getElementById('help-button');
    this.resetButton = document.getElementById('reset-button');
    this.pauseButton = document.getElementById('pause-button');
    this.controlsButton = document.getElementById('controls-button');
    var helpContainer = document.getElementById('help-container');

    document.addEventListener("keydown", this.keyDownHandler.bind(this), false);
    
    document.getElementById('simulation')
        .addEventListener('mousedown', this.mouseDownHandler.bind(this), false);

    helpContainer.onclick = function() { helpContainer.style.display = 'none'; }
    this.helpButton.onclick = function() { helpContainer.style.display = 'block'; }
    this.resetButton.onclick = function() {
        app.state3d.controlsController.controls.resetPosition();
    }
    this.pauseButton.onclick = this.toggleCycleState.bind(this);
    this.controlsButton.onclick = this.toggleControlsState.bind(this);
}

Demo3dInputController.prototype.mouseDownHandler = function(event) {
    if (app.state3d.enabled
            && !app.state3d.controlsController.controls.isEnabled()
            && vfr.isCycling()) {
        this.toggleCycleState();
    }
}

Demo3dInputController.prototype.keyDownHandler = function(event) {
    var charCode = event.keyCode || event.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case "U":
            app.state3d.controlsController.controls.resetPosition();
            break;
        case "Z":
            // Toggle 3D controls
            this.toggleControlsState();
            break;
        case "X":
            // Toggle cycling
            this.toggleCycleState();
            break;
        case " ":
            if (app.state3d.enabled) {
                app.state3d.colorController.addAnimation(
                    ColorPulse.createBasic(
                        new THREE.Color(1, .1, 0), 
                        1 / 20));
            }
            break;
    }
}

Demo3dInputController.prototype.toggleCycleState = function() {
    if (vfr.isCycling()) {
        this.pauseButton.textContent = "Resume Animation (X)";
        vfr.stopCycle();
    } else {
        this.pauseButton.textContent = "Pause Animation (X)";
        vfr.startCycle();
    }
}

Demo3dInputController.prototype.toggleControlsState = function() {
    if (app.state3d.enabled) {
        if (app.state3d.controlsController.controls.isEnabled()) {
            this.setControlsState("2d");
        } else {
            this.setControlsState("3d");
        }
    }
}

Demo3dInputController.prototype.setControlsState = function(state) {
    if (state === "3d") {
        var scope = this;
        app.state3d.controlsController.onPointerLockLostCallback = function() { 
            scope.setControlsState("2d");
        }
        app.state3d.controlsController.start();
        userInputOn = false;
        this.controlsButton.textContent = "Control Animation (ESC/Z)";
    } else if (state === "2d") {
        app.state3d.controlsController.onPointerLockLostCallback = null;
        app.state3d.controlsController.stop();        
        userInputOn = true;
        this.controlsButton.textContent = "Control View (Z)";
    }
}