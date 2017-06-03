var demoVr = {};

demoVr.init = function() {

    // Enable 3d view mode
    app.setViewMode3d('vr');
    
    // Enable wrapped/tiled portal
    RayTracingShader.defines.WRAP_PORTAL = 1;

    // Configure layer gradient
    app.state3d.topColor = new THREE.Color(.04313, .01569, .0353);
    app.state3d.bottomColor = new THREE.Color(1, 1, 1);

    // Don't limit camera position
    app.state3d.clampPosition = false;

    // Enable XY symmetry (X is already enabled)
    app.effects.symmetry.mirrorY.set(true);

    app.state3d.controlsController.setMode(false, false);
    userInputOn = false;

    // Override states with our custom ones. 
    // They should not be added to localStorage.
    stateManager.states = getDemo3DStates();

    // Enable cycling
    vfr.cycleSpeed = .007;

    // Initialize to a good looking state.
    stateManager.loadState("3d-22");
    app.border.scale.set(new THREE.Vector3(.01, .01, .01));

    // Set number of delay frames
    sim.setDelay(10);

    // Set the portal geometry to a square
    geo.set(geo.rectangle, 1);
}

demoVr.startControls = function() {
    app.state3d.controlsController.start();
}