// Test script for video-feedback.js.

function init() {
    
    window.c_width = window.innerWidth;
    window.c_height = window.innerHeight;
    window.aspect = c_width / c_height;

    /////////////
    // Renderer setup
    /////////////

    renderer = new THREE.WebGLRenderer( {
        antialias : false,
        stencil   : false,
        depth     : true,
        precision : "highp",
        preserveDrawingBuffer : true,
        autoClear : false
    } );

    if (!renderer) {
        document.getElementByType("body").innerHTML += "oh no webgl";
    }

    renderer.setSize(c_width, c_height);
    renderer.sortObjects = true;

    document.body.appendChild( renderer.domElement );

    // bounds on scaling in feedback loop
    window.minimumScaleFactor = 0.1;
    window.maximumScaleFactor = 3.0;

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

    // Create the border, which consists of a solid colored border of some
    // thickness surrounded by a solid color background.
    // Set the background big enough so we never see the edges of it.
    bgGeometry = new THREE.PlaneBufferGeometry(aspect / minimumScaleFactor * 5,
        1.0 / minimumScaleFactor * 5);
    bgMaterial = new THREE.MeshBasicMaterial({color : 0x70b2c5});
    var background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.set(0, 0, -1);

    // Create the portal and spacemap.
    // var portalGeometry = new THREE.PlaneBufferGeometry(aspect, 1);
    portalGeometry = new THREE.CircleGeometry(Math.min(aspect, 1) / 2, 8);
    var storageManager = new VF.FeedbackStorageManager(c_width, c_height);
    spacemap = new VF.Spacemap();
    portal = new VF.Portal(portalGeometry, spacemap, storageManager, renderer);   
    portal.position.set(0, 0, .5);
        
    // Create the border, which consists of a solid colored border of some
    // thickness surrounded by a solid color background.
    // window.borderProp = .1
    // var borderGeometry = new THREE.PlaneBufferGeometry(aspect,// * (1.0 + 2 * borderProp),
    //     1.0);// * (1.0 + 2.0 * borderProp));
    var borderGeometry = portalGeometry.clone();
    borderMaterial = new THREE.MeshBasicMaterial({color : 0x0000ff});
    window.border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.setScale = function(borderWidth) {
        border.scale.set(1 + borderWidth, 1 + borderWidth, 1);// * aspect, 1);
    }
    border.setScale(.1);
    border.position.set(0, 0, -.5);
        
    // The renderer is set to render objects in the order in which they were
    // added to the scene, so the order we push matters.
    // feedbackScene.add(box);
    feedbackScene.add(portal);
    feedbackScene.add(border);
    feedbackScene.add(background);
    
    spacemap.scale.x = 1.3;
    spacemap.scale.y = 1.3;
    
    ////////////
    // View scene (to be rendered to screen) setup
    ////////////

    viewScene = feedbackScene;
    viewCamera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1);

    viewCamera.position.z = 5;
    viewCamera.lookAt(new THREE.Vector3(0, 0, 0));

    /////////////
    // Stats setup
    /////////////

    stats = new Stats();
    stats.showPanel(0);
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = '0px';
    document.body.appendChild(stats.domElement);

    ///////
    // Rendering Effects
    ///////
    
    colorPass = new THREE.ShaderPass(ColorShader);
    symPass   = new THREE.ShaderPass(SymmetryShader);
    
    // symPass.uniforms.diagNE.value = 1;
    
    portal.passes = [symPass, colorPass];
    
}

function render() {
    
    stats.begin();
            
    spacemap.position.x =.13 * Math.sin(performance.now() * 2 * Math.PI / 6000);
        
    updated = portal.computeIteration(feedbackScene, true);
            
    renderer.render(viewScene, viewCamera);
        
    requestAnimationFrame(render);

    stats.end();

}