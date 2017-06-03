var Demo3dInputController = function() {
    this.helpButton = document.getElementById('help-button');
    this.resetButton = document.getElementById('reset-button');
    this.pauseButton = document.getElementById('pause-button');
    this.controlsButton = document.getElementById('controls-button');
    this.helpContainer = document.getElementById('help-container');
    this._fresh = true;

    document.addEventListener("keydown", this.keyDownHandler.bind(this), false);
    document.addEventListener("keyup", this.keyUpHandler.bind(this), false);

    document.getElementById('simulation')
        .addEventListener('mousedown', this.mouseDownHandler.bind(this), false);

    this.helpContainer.onclick = this.toggleHelp.bind(this);
    this.helpButton.onclick = this.toggleHelp.bind(this);
    this.resetButton.onclick = function() {
        app.state3d.controlsController.resetPosition();
    }
    this.pauseButton.onclick = this.toggleCycleState.bind(this);
    this.controlsButton.onclick = this.toggleControlsState.bind(this);
    
    this.layerSpacingAnimator = new LayerSpacingAnimator(1, 
        function(t) {
            var prevLayerSpacing = 
            app.state3d.layerController.layerSpacing = 
                0.102 + 0.098 * Math.cos(t * Math.PI);
        });
}

Demo3dInputController.prototype.mouseDownHandler = function(event) {
    if (app.state3d.viewMode != '2d'
            && !app.state3d.controlsController.isRunning()
            && vfr.isCycling()) {
        this.toggleCycleState();
    }
}

Demo3dInputController.prototype.keyDownHandler = function(event) {
    var charCode = event.keyCode || event.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case "U":
            app.state3d.controlsController.resetPosition();
            break;
        case "Z":
            // Toggle 3D controls
            this.toggleControlsState();
            break;
        case "X":
            // Toggle cycling
            this.toggleCycleState();
            break;
        case "C":
            if (app.state3d.viewMode != '2d') {
                app.state3d.colorController.addAnimation(
                    ColorPulse.createBasic(
                        new THREE.Color(1, .1, 0), 
                        1 / 20));
            }
            break;
        case " ":
            this.layerSpacingAnimator.setDirection(1);
            break;
        case "P":
            // toggle visibility of stats.
            if (stats.dom.style.display == "") {
                stats.dom.style.display = "none";
            } else {
                stats.dom.style.display = "";
            }
            break;
        case "H":
            this.toggleHelp();
            break;
    }
}

Demo3dInputController.prototype.keyUpHandler = function(event) {
    var charCode = event.keyCode || event.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case " ":
            this.layerSpacingAnimator.setDirection(-1);
            break;
    }
}

Demo3dInputController.prototype.toggleHelp = function() {
    if (this.helpContainer.style.display == 'none') {
        this.helpButton.textContent = "Hide Help (H)";
        this.helpContainer.style.display = 'block';
    } else {
        this.helpButton.textContent = "Show Help (H)";
        this.helpContainer.style.display = 'none';
    }
    if (this._fresh) {
        this.toggleControlsState();
    }
    this._fresh = false;
}

Demo3dInputController.prototype.toggleCycleState = function() {
    if (vfr.isCycling()) {
        this.pauseButton.textContent = "Start Animation (X)";
        vfr.stopCycle();
    } else {
        this.pauseButton.textContent = "Stop Animation (X)";
        vfr.startCycle();
    }
}

Demo3dInputController.prototype.toggleControlsState = function() {
    if (app.state3d.viewMode != '2d') {
        if (app.state3d.controlsController.isRunning()) {
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

var LayerSpacingAnimator = function(transitionDuration, transitionFunction) {
    this._t = 0;
    this._timerId = null;
    this._dir = -1;
    this._prevTime = null;
    this._transitionDuration = transitionDuration * 1e3;
    this._transitionFunction = transitionFunction;
}

LayerSpacingAnimator.prototype._updateInternal = function() {
    var time = performance.now();
    var dt = this._dir * (time - this._prevTime) / this._transitionDuration;
    this._t = Math.max(0, Math.min(1, this._t + dt));
    this._prevTime = time;
    this._transitionFunction(this._t);
    if ((this._t === 1 && this._dir === 1) || (this._t === 0 && this._dir === -1)) {
        this.cancel();
    } else if (this._timerId === null) {
        this._timerId = setInterval(this._updateInternal.bind(this), 1e3 / 60);
    }
}

LayerSpacingAnimator.prototype.setDirection = function(dir) {
    this._dir = dir >= 0 ? 1 : -1;
    if (this._timerId === null) {
        this._prevTime = performance.now();
        this._updateInternal();
    }
}

LayerSpacingAnimator.prototype.cancel = function() {
    if (this._timerId !== null) {
        clearInterval(this._timerId);
        this._timerId = null;
    }
}