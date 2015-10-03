var i_loop, feedbackTarget, TVMaterial, feedbackCamera, feedbackProcessor,
    viewScene, viewCamera, symPass, colorPass, renderer, inputSettings,
    holdTarget;

function init() {
    ////////////
    // Canvas initalization
    ////////////

    window.defaultListString = '[{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":1.0750000000000002,"y":0,"rot":0.03490658503988659,"scale":0.775},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.22969924812030057,"y":0.2178757118098539,"rot":0.5235987755982988,"scale":0.8750000000000001},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.2567492951127818,"y":0.11791284971527607,"rot":0.5235987755982988,"scale":0.9000000000000001},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.2850753185045946,"y":0.337439135099447,"rot":0.9773843811168251,"scale":0.9000000000000001},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.3543191852853677,"y":0.17695104841615378,"rot":1.2915436464758048,"scale":0.9000000000000001},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.6741116966631931,"y":0.049109365366777985,"rot":1.6406094968746712,"scale":0.7},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.5295287954446296,"y":0.1261266461132166,"rot":2.0943951023931975,"scale":0.725},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.8432387167997415,"y":0.19935519648274588,"rot":2.3736477827122906,"scale":0.75},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.43534397995763624,"y":0.4419895119073559,"rot":2.3736477827122906,"scale":0.75},{"invertX":false,"invertY":false,"mirrorX":true,"mirrorY":false,"diagNE":false,"diagNW":false,"invertColor":false,"farOut":false,"colorCycle":0.5,"gain":0.5,"borderWidth":0.05,"delay":2,"backgroundColor":"#70b2c5","borderColor":"#000000","x":0.4990160912704009,"y":0.10230147031290185,"rot":2.722713633111157,"scale":0.75}]';
    window.inputList = [].concat(JSON.parse(defaultListString));

    // Create toolbar & default input object
    window.inputs = new Input(); // default parameter values
    window.toolbar = new Toolbar();
    window.userInputOn = true;
    window.updateCameraOn = true;
    window.cycleInputsOn = false;


    // Set up window
    window.c_width = 2 * window.innerHeight; // window.innerWidth - toolbar.girth;
    window.c_height = window.innerHeight;
    window.aspect = c_width / c_height;

    // Set up toolbar
    toolbar.add("instructionToggle", "Instructions", "button",
        function() {
            document.getElementById("instructionOverlay").style.display = "block";
            document.getElementById("instructionPopup").style.display = "block";
            userInputOn = false;
        });

    toolbar.addInstruction("Pan: IJKL/drag");
    toolbar.addInstruction("Rotate: AD/right-drag");
    toolbar.addInstruction("Zoom: WS/scroll");

    toolbar.add("saveInputs", "Save Inputs", "button",
                function() {
                    var tempInput = new Input(inputs);
                    tempInput.saveToList(inputList);
                });
    toolbar.add("cycleInputs", "Cycle Inputs", "button",
                function() {
                    window.cycleInputsOn = !window.cycleInputsOn;
                });
    toolbar.add("cycleRandomInputs", "Generate Random", "button",
                function() {
                    var cycle = cycleInputsOn;
                    cycleInputsOn = false;
                    generateRandomOrientations();
                    cycleInputsOn = cycle;
                });
    toolbar.add("beatLength", "Beat length", "range", [500, 1, 4000]);
    toolbar.add("colorCycle", "Color Cycle", "range");
    toolbar.add("gain", "Gain", "range");
    toolbar.add("borderWidth", "Border Width", "range", [0, 0.001, 0.1]);
    toolbar.add("delay", "Delay", "range", [1, 1, 10]);
    toolbar.add("invertX", "Invert X", "checkbox");
    toolbar.add("invertY", "Invert Y", "checkbox");
    toolbar.add("mirrorX", "Mirror X", "checkbox");
    toolbar.add("mirrorY", "Mirror Y", "checkbox");
    toolbar.add("diagNE", "Mirror NE", "checkbox");
    toolbar.add("diagNW", "Mirror NW", "checkbox");
    toolbar.add("invertColor", "Invert Color", "checkbox");
    toolbar.add("farOut", "Far Out", "checkbox");
    toolbar.add("borderColor", "Border Color", "color");
    toolbar.add("backgroundColor", "BG Color", "color");
    toolbar.add("saveButton", "Open Image", "button",
                function() {
                window.open(document.getElementsByTagName("canvas")[0].toDataURL("image/png"));
                });

    toolbar.add("nightSetting", "Night", "button", function() {
                    inputs.setColors("night");
                });
    toolbar.add("defaultSetting", "Default Colors", "button", function() {
                    inputs.setColors("default");
                });

    window.dotOn = false;
    toolbar.add("dotSetting", "Dot", "button",
                function() {
                    if (dotOn) {
                        feedbackScene.remove(window.dot);
                    }
                    else {
                        inputs.setColors("dot");
                        feedbackScene.add(window.dot);
                    }
                    
                    dotOn = !dotOn;
                });

    ////////////
    // Constants
    ////////////

    // bounds on scaling in feedback loop #hardcode
    window.minimumScaleFactor = 0.1;
    window.maximumScaleFactor = 3.0;

    // All render targets should be the same.
    var createRenderTarget = function () {
        return new THREE.WebGLRenderTarget(c_width, c_width, 
            {   minFilter       : THREE.LinearFilter,
                magFilter       : THREE.LinearFilter,
                format          : THREE.RGBFormat,
                generateMipmaps : false,
                depthBuffer     : true,
                stencilBuffer   : false
                                           });
    }

    ////////////
    // Feedback scene setup
    ////////////

    /* 
     * The feedback scene consists of a TV, which is a quad that maps the 
     * previous render target, a border around the TV, and the viewCamera
     * overlay. The TV is centered on the origin and is aspect units in the
     * x direction and 1 unit in the y direction.
     */

    // The scene used in the feedback loop
    feedbackScene = new THREE.Scene();

    // Initialize all render targets.
    feedbackTarget = new Array(Number(document.getElementById("delay").max));

    for (var i = 0; i < feedbackTarget.length; i++) {
        feedbackTarget[i] = createRenderTarget();
    }

    // Create a solid color background. Set the background big enough so we
    // never see the edges of it.
    var bgGeometry = new THREE.PlaneBufferGeometry(aspect / minimumScaleFactor * 5, 1.0 / minimumScaleFactor * 5);
    bgMaterial = new THREE.MeshBasicMaterial({color : 0x70b2c5});
    var background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.set(0, 0, -1);

    // Create the border, which consists of a solid colored border of some
    // thickness surrounded by a solid color background.
    var borderGeometry = new THREE.PlaneBufferGeometry(aspect, 1);

    borderMaterial = new THREE.MeshBasicMaterial({color : 0x000000});
    window.border = new THREE.Mesh(borderGeometry, borderMaterial);

    border.setScale = function(borderWidth) {
        border.scale.set(1 + borderWidth, 1 + borderWidth * aspect, 1);
    }
    border.setScale(inputs.borderWidth);
    border.position.set(0, 0, -0.5);

    // Create a dot at the center of the screen.
    var dotGeometry = new THREE.CircleGeometry(0.02, 20);
    var dotMaterial = new THREE.MeshBasicMaterial({color : 0xDD0000});
    window.dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(0, 0, 0)

    // Create the TV. The textured mapped by the material is changed each
    // render cycle.
    var TVGeometry = new THREE.PlaneBufferGeometry(aspect, 1);
    TVMaterial = new THREE.MeshBasicMaterial({map : feedbackTarget[0]});
    TV = new THREE.Mesh(TVGeometry, TVMaterial);
    TV.position.set(0, 0, 0);

    // The renderer is set to render objects in the order in which they were
    // added to the scene, so the order we push matters. Add the dot later,
    // through the toolbar.
    feedbackScene.add(TV);
    feedbackScene.add(border);
    feedbackScene.add(background);

    feedbackCamera = createScalableOrthoCam(aspect, minimumScaleFactor, maximumScaleFactor);
    feedbackCamera.setScale(.8); // initial relative size of TV
    feedbackCamera.position.z = 5;
    feedbackScene.add(feedbackCamera);
    feedbackCamera.lookAt(new THREE.Vector3(0, 0, 0));

    ////////////
    // View scene (to be rendered to screen) setup
    ////////////

    viewScene = feedbackScene;
    viewCamera = createScalableOrthoCam(aspect, minimumScaleFactor, maximumScaleFactor);

    viewCamera.position.z = 5;
    viewScene.add(viewCamera);
    viewCamera.lookAt(new THREE.Vector3(0, 0, 0));

    /////////////
    // Renderer setup
    /////////////

    renderer = new THREE.WebGLRenderer( {
        antialias : true,
        stencil   : false,
        precision : "mediump",
        preserveDrawingBuffer : true,
        autoClear : false
    } );

    if (!renderer) {
        document.getElementByType("body").innerHTML += "oh no webgl";
    }

    renderer.setSize(c_width, c_height);
    renderer.sortObjects = false;
    renderer.autoClearColor = false;

    var container = document.getElementById('container');

    container.appendChild(renderer.domElement)

    /////////////
    // Stats setup
    /////////////

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);


    // If on a mobile device, don't display fps graph.
    if (touchOn == true) {
        document.getElementById("fps").style.display = "none";
    }


    /////////////
    // EffectComposer stack
    /////////////

    var renderPass = new THREE.RenderPass(feedbackScene, feedbackCamera);

    symPass = new THREE.ShaderPass(SymmetryShader);
    colorPass = new THREE.ShaderPass(ColorShader);

    RGBShiftPass = new THREE.ShaderPass( THREE.RGBShiftShader );

    // This will clone the render target, so it contains two buffers (for 
    // swap space).
    feedbackProcessor = new THREE.EffectComposer(renderer, createRenderTarget());

    feedbackProcessor.addPass(renderPass);
    feedbackProcessor.addPass(symPass);
    feedbackProcessor.addPass(colorPass);

    i_loop = 0;


    //////////////
    // Input setup
    //////////////

    inputSettings = {
        rotStep : 2 * Math.PI / 180.0,
        zStep : .025,
        xyStep : .025
    };

    // initialize cycle things
    window.then = performance.now();
    window.now = 0;
    window.step = 0;
    window.inputIndex = 0;
}


function animate(time) {
    window.now = time;
    var dt = now - window.then;
    window.then = window.now;

    // Cycle inputs if needed.
    if (window.cycleInputsOn) {
        updateInputsFromCycle(window.inputs, cycleInputs(dt));
    }

    // Update toolbar from current inputObj.
    updateToolbar(window.inputs);

    // Update current inputObj from mouse & touch events.
    if (window.userInputOn && userInput.mouseDown) {
        updateFromUserInputs(window.inputs, window.userInputObj);
    }

    // Update camera from current inputObj.
    if (updateCameraOn) {
        updateCamera(window.inputs);
    }

    // Finally, render to screen.
    render();

    requestAnimationFrame(animate);

    // Update FPS tracker.
    if (!touchOn) {
        stats.update();
    }
}


function render() {
    /*
     * Notes:
     * When the feedback camera is rotated, you can see inner frames rotate 
     * for a single frame before popping back into place. This is due to displaying
     * before updating the texture. This effect is less noticable the smaller the
     * change in camera position.
     */

    // We want to update the current feedback target.
    TVMaterial.map = feedbackTarget[i_loop];

    /*
     * This applies the rendering stack to produce the feedback texture.
     * First, the scene is rendered to an internal render target. The
     * target is autocleared by default. Then, the symmetry and color
     * shaders are applied in succession. After all the passes have been
     * applied, feedbackProcessor.readBuffer contains the updated feedback
     * texture.
     */
    feedbackProcessor.render();

    // Swap the updated feedback texture with the old one.
    var temp;
    if (feedbackProcessor.readBuffer === feedbackProcessor.renderTarget1) {
        temp = feedbackProcessor.renderTarget1;
        feedbackProcessor.renderTarget1 = feedbackTarget[i_loop];
    } else {
        temp = feedbackProcessor.renderTarget2;
        feedbackProcessor.renderTarget2 = feedbackTarget[i_loop];
    }

    feedbackTarget[i_loop] = temp;

    // We want to update the current feedback target.
    TVMaterial.map = feedbackTarget[i_loop];

    // Render the viewScene to the screen.
    renderer.render(viewScene, viewCamera);

    i_loop = (i_loop + 1) % Math.round(inputs.delay); // % feedbackTarget.length;
}


function createScalableOrthoCam(aspect, minScale, maxScale) {
    // The camera sees things as 'scale' times larger than they actually are.

    camera = new THREE.OrthographicCamera(-aspect / 2, aspect / 2, 0.5, -0.5, 0.1, 100);

    camera.minScale   = minScale;
    camera.maxScale   = maxScale;

    var internalScale = 1;

    camera.setScale = function (s) {

        if (s < this.minScale || s > this.maxScale) return;

        this.left = -aspect / 2 / s;
        this.right = aspect / 2 / s;
        this.top = 0.5 / s;
        this.bottom = -0.5 / s;

        internalScale = s;

        this.updateProjectionMatrix();

        // this.scale.x = s;
        // this.scale.y = s;
    };

    camera.getScale = function() {
        return internalScale;
    };

    // rotate clockwise such that TV seems to rotate (CCW) about its own axis
    camera.rotate = function(angle) {
        var x0 = this.position.x;
        var y0 = this.position.y;
        this.position.x = 0;
        this.position.y = 0;
        this.rotation.z += angle;
        this.position.x = Math.cos(angle) * x0 - Math.sin(angle) * y0;
        this.position.y = Math.sin(angle) * x0 + Math.cos(angle) * y0;
    };

    camera.rotateAbs = function(angle) {
        var x0 = this.position.x;
        var y0 = this.position.y;
        this.position.x = 0;
        this.position.y = 0;
        this.rotation.z = angle;
        this.position.x = Math.cos(angle) * x0 - Math.sin(angle) * y0;
        this.position.y = Math.sin(angle) * x0 + Math.cos(angle) * y0;
    };

    camera.translateScale = function(ds) {
        this.setScale(internalScale + ds);
    };

    return camera;
}


function farOut(shouldPass, feedbackProcessor, RGBShiftPass) {
    var passes = feedbackProcessor.passes;

    if (shouldPass && passes[passes.length - 1] !== RGBShiftPass) {
        passes.push(RGBShiftPass);
    }
    else if (!shouldPass && passes[passes.length - 1] === RGBShiftPass) {
        passes.pop();
    }
}