RayTracingRenderer = function(renderer) {
    
    var _renderScene;
    var _renderCamera;
    var _target;
    var _stereoEffect = new THREE.StereoEffect({
        setSize : function() {},
        setViewport : renderer.setViewport.bind(renderer),
        clear : function() {},
        render : function(scene, camera) {
            configureCamera(camera);
            renderer.render(_renderScene, _renderCamera, _target);
        }
    });
    _stereoEffect.focalLength = .5;
    _stereoEffect.separation = .02;

    var _dummyScene = new THREE.Scene();

    this.render3d = function(renderScene, renderCamera, target, viewCamera) {
        configureCamera(viewCamera, target);
        renderer.render(renderScene, renderCamera, target);
    }

    this.renderVr = function(renderScene, renderCamera, target, viewCamera) {
        configureCamera(viewCamera, target);
        _renderScene = renderScene;
        _renderCamera = renderCamera;
        _target = target;
        var size = target ? target : renderer.getSize();
        _stereoEffect.setSize(size.width, size.height);

        var autoClearCache = renderer.autoClear;
        renderer.autoClear = false;
        _stereoEffect.render(_dummyScene, viewCamera);
        renderer.setViewport(0, 0, size.width, size.height);
        renderer.autoClear = autoClearCache;
    }
    
    function configureCamera(viewCamera, target) {
        var size = target ? target : renderer.getSize();

        viewCamera.aspect = size.width / size.height;
        viewCamera.updateMatrixWorld(true);
        viewCamera.updateProjectionMatrix();

        RayTracingShader.uniforms.inverseViewMatrix.value
            .copy(viewCamera.matrixWorld);
        RayTracingShader.uniforms.inverseProjectionMatrix.value
            .getInverse(viewCamera.projectionMatrix);
    }
}