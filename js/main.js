var i_loop, feedbackTarget, TVMaterial, feedbackCamera, feedbackProcessor, 
    viewScene, viewCamera, symPass, colorPass, renderer, inputSettings;

function init() {
    // detect mobile interface
    window.touchOn = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))touchOn = true})(navigator.userAgent||navigator.vendor||window.opera);

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
    window.c_width = window.innerWidth - toolbar.girth;
    window.c_height = window.innerHeight;
    window.aspect = c_width / c_height;


    toolbar.add("instructionToggle", "Instructions", "button",
        function() {
            document.getElementById("instructionOverlay").style.display = "block";
            document.getElementById("instructionPopup").style.display = "block";
            userInputOn = false;
        });

    // toolbar.addInstruction("text");
    toolbar.addInstruction("Pan: IJKL/drag");
    toolbar.addInstruction("Rotate: AD/right-drag");
    toolbar.addInstruction("Zoom: WS/scroll");

    // toolbar.add("id", "name/label", "type", options);
    // options:
    // - button: callback function
    // - range: [minimum, step, maximum]. defaults to [0, 0.001, 1]
    toolbar.add("saveInputs", "Save Inputs", "button",
                function(){
                    inputs.saveToList(inputList);
                });
    toolbar.add("cycleInputs", "Cycle Inputs", "button",
                function() {
                    window.cycleInputsOn = !window.cycleInputsOn;
                });
    toolbar.add("beatLength", "Beat length", "range", [500, 10, 4000]);
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
                    inputs.backgroundColor = "#000000";
                    inputs.borderColor = "#DDDDDF";
                    inputs.borderWidth = 0.03;
                    inputs.colorCycle = 0;
                    inputs.gain = 0.05;
                });

    ////////////
    // Constants
    ////////////

    // bounds on scaling in feedback loop
    window.minimumScaleFactor = 0.1;
    window.maximumScaleFactor = 3.0;

    // Number of parallel feedback loops. This allows us to increase the time
    // between renders but retain smooth movement.
    window.n_loops = inputs.delay;

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
        border.scale.set(1 + borderWidth, 1 + inputs.borderWidth * aspect, 1);
    }
    border.setScale(inputs.borderWidth);
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

    // If on a mobile device, hide the GUI & get rid of fps graph.
    if (touchOn == true) {
        document.getElementById("fps").style.display = "none";
    }


    /////////////
    // EffectComposer stack
    /////////////

    var renderPass = new THREE.RenderPass(feedbackScene, feedbackCamera);
    // renderPass.clearColor = new THREE.Color(0x70b2c5);

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
        scale : -1,
        rotStep : 2 * Math.PI / 180.0,
        zStep : .025,
        xyStep : .025
    };
    
    n_f = 0;
    n_f_show = 120;
    render_time = 0;
    t_start = performance.now();

    // initialize cycle things
    window.then = performance.now();
    window.now = window.dt = 0;
    window.step = 0;
    window.inputIndex = 0;
}


function animate(time) {
    window.now = time;
    window.dt = window.now - window.then;
    window.then = window.now;

    // Cycle inputs if needed.
    if (window.cycleInputsOn) {
        var newState = cycleInputs(dt);
        inputs.x = newState[0];
        inputs.y = newState[1];
        inputs.rot = newState[2];
        inputs.scale = newState[3];
    }

    // Update toolbar from current inputObj.
    updateToolbar(window.inputs);

    // Update current inputObj from mouse & touch events.
    if (window.userInputOn && window.mouseDown) {
        updateFromUserInputs(window.inputs);
    }

    // Update camera from current inputObj.
    if (updateCameraOn) {
        updateCamera(window.inputs);
    }

    t1 = performance.now();
    render();
    render_time += performance.now() - t1;
    n_f += 1;

    /* if (n_f % n_f_show == 0) {
        console.log('avg render time per frame: ' + render_time / n_f_show);
        console.log('avg time per animation frame: ' + ((performance.now() - t_start) / n_f_show));
        n_f = 0;
        render_time = 0;
        t_start = performance.now();
    } */

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

    i_loop = (i_loop + 1) % Math.round(inputs.delay); // % feedbackTarget.length;
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


function farOut(shouldPass, feedbackProcessor, RGBShiftPass) {
    var passes = feedbackProcessor.passes;

    if (shouldPass && passes[passes.length - 1] !== RGBShiftPass) {
        passes.push(RGBShiftPass);
    }
    else if (!shouldPass && passes[passes.length - 1] === RGBShiftPass) {
        passes.pop();
    }
}