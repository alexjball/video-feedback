var i_loop, feedbackTarget, TVMaterial, feedbackCamera, feedbackProcessor, 
    viewScene, viewCamera, symPass, colorPass, RGBShiftPass, renderer, inputSettings;

function init() {
    ////////////
    // Canvas initalization
    ////////////

    // Create screen instance
    window.inputs = new Input();
    window.toolbar = new Toolbar();
    window.userInputOn = true;

    window.c_width = window.innerWidth;
    window.c_height = window.innerHeight;
    window.aspect = c_width / c_height;
    
    initializeToolbar(window.toolbar);
    setInput(["mirrorX", true]);

    ////////////
    // Constants
    ////////////

    // bounds on scaling in feedback loop
    window.minimumScaleFactor = 0.1;
    window.maximumScaleFactor = 3.0;

    // Number of parallel feedback loops. This allows us to increase the time
    // between renders but retain smooth movement.
    window.n_loops = Math.ceil(getInput("delay"));

    window.near = .1;
    window.far = 100; // TODO: set this by calculating max distance given scale factor range.

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
    var feedbackScene = new THREE.Scene();

    // Initialize all render targets.
    feedbackTarget = new Array(12); // #hardcode

    for (var i = 0; i < feedbackTarget.length; i++) {
        feedbackTarget[i] = createRenderTarget();
    }

    // Create the border, which consists of a solid colored border of some
    // thickness surrounded by a solid color background.
    // Set the background big enough so we never see the edges of it.
    var bgGeometry = new THREE.PlaneBufferGeometry(aspect / minimumScaleFactor * 5,
        1.0 / minimumScaleFactor * 5);
    bgMaterial = new THREE.MeshBasicMaterial({color : 0x70b2c5});
    var background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.set(0, 0, -1);

    // Create the border, which consists of a solid colored border of some
    // thickness surrounded by a solid color background.
    // window.borderProp = .1
    var borderGeometry = new THREE.PlaneBufferGeometry(aspect,// * (1.0 + 2 * borderProp),
        1.0);// * (1.0 + 2.0 * borderProp));
    borderMaterial = new THREE.MeshBasicMaterial({color : 0x000000});
    window.border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.setScale = function(borderWidth) {
        border.scale.set(1 + borderWidth, 1 + getInput("borderWidth") * aspect, 1);
    }
    border.setScale(getInput("borderWidth"));
    border.position.set(0, 0, -.5);

    // Create the TV. The textured mapped by the material is changed each
    // render cycle. Also, THREE.PlaneBufferGeometry is apparently a thing.
    var TVGeometry = new THREE.PlaneBufferGeometry(aspect, 1);
    TVMaterial     = new THREE.MeshBasicMaterial({map : feedbackTarget[0]});
    TV         = new THREE.Mesh(TVGeometry, TVMaterial);
    TV.position.set(0, 0, 0);

    // The renderer is set to render objects in the order in which they were
    // added to the scene, so the order we push matters.
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


    /////////////
    // EffectComposer stack
    /////////////

    var renderPass = new THREE.RenderPass(feedbackScene, feedbackCamera);
    // renderPass.clearColor = new THREE.Color(0x70b2c5);

    symPass = new THREE.ShaderPass(SymmetryShader);
    colorPass = new THREE.ShaderPass(ColorShader);
    RGBShiftPass = new THREE.ShaderPass(THREE.RGBShiftShader);

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
        scale : -1,
        rotStep : 2 * Math.PI / 180.0,
        zStep : .025,
        xyStep : .025
    };
    
    initializeEventListeners();
    window.cycling = false;
    initializeCycler();
    
    // Get rid of FPS graph (for now)
    document.getElementById("fps").style.display = "none";
    
    n_f = 0;
    n_f_show = 120;
    render_time = 0;
    t_start = performance.now();
}


function updateCamera() {
    // FIX ME
    for (var param in inputs) {
        // update boolean options
        if (typeof getInput(param) == "boolean") {
            if (!symPass.uniforms[param]) {
                if (!colorPass.uniforms[param]) {
                    switch(param) {
                        case "farOut":
                            farOut(getInput(param));
                            break;
                    }
                }
                else {
                    colorPass.uniforms[param].value = getInput(param) ? 1 : 0;
                }
            }
            else {
                symPass.uniforms[param].value = getInput(param) ? 1 : 0;
            }
        }

        // update range options
        else if (typeof inputs[param] == "number") {
            if (!colorPass.uniforms[param]) {
                // handle on case basis
                switch(param) {
                    case "borderWidth":
                        border.setScale(getInput("borderWidth"));
                        break;
                }
            }

            else {
                colorPass.uniforms[param].value = getInput(param);
            }
        }

        // update color options
        else if (typeof inputs[param] == "string") {
            switch(param) {
                case "backgroundColor":
                    var colorValue = inputs[param].replace("#", "0x");
                    bgMaterial.color.setHex(colorValue);
                    break;
                case "borderColor":
                    var colorValue = inputs[param].replace("#", "0x");
                    borderMaterial.color.setHex(colorValue);
                    break;
            }
        }
    }

    // update camera from inputs: x, y, rot, scale
    feedbackCamera.position.x = getInput("x");
    feedbackCamera.position.y = getInput("y");
    feedbackCamera.rotateAbs(getInput("rot"));
    feedbackCamera.setScale(getInput("scale"));
}


function animate() {
    updateUI();
    updateCamera();

    //updateInput();
    t1 = performance.now();
    render();
    render_time += performance.now() - t1;
    n_f += 1;

    if (n_f % n_f_show == 0) {
        // console.log('avg render time per frame: ' + render_time / n_f_show);
        // console.log('avg time per animation frame: ' + ((performance.now() - t_start) / n_f_show));
        n_f = 0;
        render_time = 0;
        t_start = performance.now();
    }

    requestAnimationFrame(animate);

    stats.update();
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
    feedbackProcessor.render()

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

    i_loop = (i_loop + 1) % Math.round(getInput("delay")); // % feedbackTarget.length;
}


function createScalableOrthoCam(aspect, minScale, maxScale) {
    // The camera sees things as scale times larger than they actually are.

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


function farOut(shouldPass) {
    var passes = feedbackProcessor.passes;
    if (shouldPass && passes[passes.length - 1] !== RGBShiftPass) {
        passes.push(RGBShiftPass);
    } else if (!shouldPass && passes[passes.length - 1] === RGBShiftPass) {
        passes.pop();
    }
}