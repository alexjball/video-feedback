nonUserInputKeyHandler = {};

nonUserInputKeyHandler.init = function() {
    // Keyboard handlers
    document.addEventListener("keydown", this.keyboardHandler, false);
}

nonUserInputKeyHandler.keyboardHandler = function(event) {    
    var charCode = event.keyCode || event.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case "U":
            app.resetPosition();
            break;
        case "Y":
            // Toggle 3D controls
            if (app.state3d.enabled) {
                if (app.state3d.controlsController.controls.isEnabled()) {
                    app.state3d.controlsController.onPointerLockLostCallback = null
                    app.state3d.controlsController.stop();
                    userInputOn = true;
                } else {
                    app.state3d.controlsController.onPointerLockLostCallback = function() { userInputOn = true }
                    app.state3d.controlsController.start();
                    userInputOn = false;
                }
            }
            break;
        case "V":
            saveStateToDropdown('State');
            break;
        case "T":
            // toggle visibility of stats.
            if (stats.dom.style.display == "") {
                stats.dom.style.display = "none";
            } else {
                stats.dom.style.display = "";
            }
            break;
        case " ":
            if (app.state3d.enabled) {
                app.state3d.colorController.addAnimation(
                    ColorPulse.createBasic(
                        new THREE.Color(Math.random(), Math.random(), Math.random()), 
                        1 / 20));
            }
            break;
        case "P":
            // Stop/resume toggle.
            if (vfr.state !== VFRenderer.states.play) {
                vfr.stop();
                vfr.play();
            } else {
                vfr.stop();
            }
            break;
    }
}
