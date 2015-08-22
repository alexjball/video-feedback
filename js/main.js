var i_loop, feedbackTarget, TVMaterial, feedbackCamera, feedbackProcessor, 
    viewScene, viewCamera, symPass, colorPass, renderer, inputSettings;

function init() {

    ////////////
    // Canvas initalization
    ////////////

    // window.canvas   = document.getElementById("canvas");
    window.c_width  = window.innerWidth;
    window.c_height = window.innerHeight;
    window.aspect = c_width / c_height;

    ////////////
    // Constants
    ////////////

    // bounds on scaling in feedback loop
    window.minimumScaleFactor = 0.1;
    window.maximumScaleFactor = 3.0;

    // Number of parallel feedback loops. This allows us to increase the time
    // between renders but retain smooth movement.
    window.n_loops = 1;

    window.view_angle = 45;

    window.near = .1;
    window.far = 100; // TODO: set this by calculating max distance given scale factor range.

    // All render targets should be the same.
    var createRenderTarget = function () {
        return new THREE.WebGLRenderTarget(c_width, c_width, 
            {   minFilter       : THREE.LinearFilter, 
                magFilter       : THREE.LinearFilter, 
                format          : THREE.RGBFormat,
                generateMipmaps : true, /**/
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
    feedbackTarget = new Array(n_loops);
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
    var border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.scale.set(1.05, 1 + 0.05 * aspect, 1);

    border.position.set(0, 0, -.5);

    // Create the TV. The textured mapped by the material is changed each
    // render cycle. Also, THREE.PlaneBufferGeometry is apparently a thing.
    var TVGeometry = new THREE.PlaneBufferGeometry(aspect, 1);
    TVMaterial     = new THREE.MeshBasicMaterial({map : feedbackTarget[0]});
    var TV         = new THREE.Mesh(TVGeometry, TVMaterial);
    TV.position.set(0, 0, 0);

    // The renderer is set to render objects in the order in which they were
    // added to the scene, so the order we push matters.
    feedbackScene.add(TV);
    feedbackScene.add(border);
    feedbackScene.add(background);

    feedbackCamera = createScalableOrthoCam(aspect, minimumScaleFactor, maximumScaleFactor);
    feedbackCamera.setScale(.8); // initial relative size of TV
    feedbackCamera.position.z = 5; //.5 / Math.tan((view_angle / 2.0) * Math.PI / 180.0);
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

    // if ( Detector.webgl )
    //  renderer = new THREE.WebGLRenderer( {antialias:true} , window.canvas);
    // else
    //  throw new Error("This piece of shit doesn't support WebGL");

    renderer = new THREE.WebGLRenderer( {
        antialias : false, 
        stencil   : false,
        precision : "mediump",
        preserveDrawingBuffer:true} );
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

    var RGBShiftPass = new THREE.ShaderPass( THREE.RGBShiftShader );

    // This will clone the render target, so it contains two buffers (for 
    // swap space).
    feedbackProcessor = new THREE.EffectComposer(renderer, createRenderTarget());

    feedbackProcessor.addPass(renderPass);
    feedbackProcessor.addPass(symPass);
    feedbackProcessor.addPass(colorPass);

    i_loop = 0;

    //////////////
    // variable control setup
    //////////////

    var getColorSetter = function(color) {
        return function(value) {
                  color.setHex(value.replace( '#','0x' ));
        }
    }

    var getUnifSetter = function(obj) {
        return function(value) {
            if (value)
                obj['value'] = 1;
            else
                obj['value'] = 0;
        }
    };

    var gui = new dat.GUI();

    gui.add({a : false}, 'a').name('Invert X').onChange(getUnifSetter(symPass.uniforms.invertX));
    gui.add({a : false}, 'a').name('Invert Y').onChange(getUnifSetter(symPass.uniforms.invertY));
    gui.add({a : false}, 'a').name('Mirror X').onChange(getUnifSetter(symPass.uniforms.mirrorX));
    gui.add({a : false}, 'a').name('Mirror Y').onChange(getUnifSetter(symPass.uniforms.mirrorY));
    gui.add({a : false}, 'a').name('NE-Diag').onChange(getUnifSetter(symPass.uniforms.diagNE));
    gui.add({a : false}, 'a').name('NW-Diag').onChange(getUnifSetter(symPass.uniforms.diagNW));
    gui.add({a : false}, 'a').name('Invert Color').onChange(getUnifSetter(colorPass.uniforms.invertColor));
    gui.add(colorPass.uniforms.colorStep, 'value', 0.0, 1.0).name('Color Cycle');
    gui.add(colorPass.uniforms.gain, 'value', 0.0, 1.0).name('Gain');
    gui.add({'Border Width' : .1}, 'Border Width', 0, .5).onChange(
        function(p) { border.scale.set(1 + p, 1 + p * aspect, 1); });
    gui.addColor({'Border Color' : '#' + borderMaterial.color.getHexString()}, 
        'Border Color').onChange(getColorSetter(borderMaterial.color));
    gui.addColor({'Background Color' : '#' + bgMaterial.color.getHexString()}, 
        'Background Color').onChange(getColorSetter(bgMaterial.color));//renderPass.clearColor));
    gui.add({'Far Out, Duude' : false}, 'Far Out, Duude').onChange(
        function(shouldPass) {
            var passes = feedbackProcessor.passes;
            if (shouldPass && passes[passes.length - 1] !== RGBShiftPass) {
                passes.push(RGBShiftPass);
            } else if (!shouldPass && passes[passes.length - 1] === RGBShiftPass) {
                passes.pop();
            }
        });

    //////////////
    // Input setup
    //////////////

    inputSettings = {
        scale : -1,
        rotStep : 2 * Math.PI / 180.0,
        zStep : .025,
        xyStep : .025
    }

    document.addEventListener('keydown', keyboardHandler, false);
    
    // Mouse input & handlers. Updated in animate().
    window.mouseDown = false;
    window.rightClick = false;
    window.mouseX = 0, window.mouseY = 0;
    window.mouseX0 = 0, window.mouseY0 = 0;
    window.cameraX0 = 0, window.cameraY0 = 0;
    window.cameraR0 = 0;
    
    // logic is kind of dumb
    document.addEventListener('mousemove', function(event) {
        mouseX = event.clientX;
        mouseY = c_height - event.clientY; // window y-coordinate flipped
    }, false);
    document.addEventListener("mousedown", function(event) {
        mouseDown = true;
        mouseX0 = event.clientX;
        cameraX0 = feedbackCamera.position.x;
        
        if (event.button == 2) { // probably not very compatible
            rightClick = true;
            cameraR0 = feedbackCamera.rotation.z;
        }
        else {
            mouseY0 = c_height - event.clientY; // window y-coordinate flipped
            cameraY0 = feedbackCamera.position.y;
        }
    }, false);
    document.addEventListener("mouseup", function(event) {
        mouseDown = false;
        rightClick = false;
    }, false);
    
    // Scroll-wheel zoom input
    document.addEventListener('mousewheel', scrollHandler, false);
    document.addEventListener('DOMMouseScroll', scrollHandler, false); // firefox
    
    // Disable context menu
    document.addEventListener("contextmenu", function(e) { e.preventDefault() }, false);
    
    // OrbitControls does sort of what we'd want, but it's written at the same
    //   level as the above and makes my computer more sad. Would also need to
    //   include the script in the index.html; try if you dare
    // controls = new THREE.OrbitControls( feedbackCamera );
    
    n_f = 0;
    n_f_show = 120;
    render_time = 0;
    t_start = performance.now();
}


function animate() {
    // I like how this currently responds, although I don't know where the factor
    //   of 40 comes from that could be a property of the camera.
    // Dividing by feedbackCamera.getScale:
    // - keeps the response the same regardless of camera's zoom for panning
    // - changes the rotation rate based on scaling, which i think is more intuitive
    if (mouseDown) {
        if (rightClick == true) {
            feedbackCamera.rotation.z = cameraR0 - inputSettings.scale *
                2 * Math.PI * (mouseX - mouseX0) / c_width / feedbackCamera.getScale();
        }
        else {
            feedbackCamera.position.x = cameraX0 - inputSettings.xyStep
                * (mouseX - mouseX0) * 40 / c_width / feedbackCamera.getScale();
            feedbackCamera.position.y = cameraY0 - inputSettings.xyStep 
                * (mouseY - mouseY0) * 40 / c_height / feedbackCamera.getScale();
        }
    }

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


function updateInput() {
    //TODO: Parse user input
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

    i_loop = (i_loop + 1) % feedbackTarget.length;
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

    camera.translateScale = function(ds) {
        this.setScale(internalScale + ds);
    };

    return camera;
}

function keyboardHandler(evt) {
    //evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);

    switch(charStr) {
        case "A":
            feedbackCamera.rotateOnAxis(new THREE.Vector3(0, 0, -1),
                - inputSettings.scale * inputSettings.rotStep);
            break;
        case "D":
            feedbackCamera.rotateOnAxis(new THREE.Vector3(0, 0, -1),
                inputSettings.scale * inputSettings.rotStep);
            break;
        case "W":
            feedbackCamera.translateScale(inputSettings.zStep);
            // feedbackCamera.translateZ(-inputSettings.zStep);
            break;
        case "S":
            feedbackCamera.translateScale(-inputSettings.zStep);
            // feedbackCamera.translateZ(inputSettings.zStep);
            break;
        case "J":
            feedbackCamera.translateX(- inputSettings.scale * 
                inputSettings.xyStep);
            break;
        case "L":
            feedbackCamera.translateX(inputSettings.scale * 
                inputSettings.xyStep);
            break;
        case "I":
            feedbackCamera.translateY(inputSettings.scale * 
                inputSettings.xyStep);
            break;
        case "K":
            feedbackCamera.translateY(- inputSettings.scale * 
                inputSettings.xyStep);
            break;
    }
}

function scrollHandler(evt) {
    var d = ((typeof evt.wheelDelta != "undefined") ? (-evt.wheelDelta) : 
        evt.detail);
    d = ((d > 0) ? 1 : -1);
    
    // Factor of 5 smooths out zoom
    feedbackCamera.translateScale(d * inputSettings.zStep / 5);
}
