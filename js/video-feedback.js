var VF = {};

VF.Portal = function(geometry, spacemap, storageManager, renderer) {
    
	THREE.Object3D.call( this );

	this.type = 'Portal';
    
    this.renderer = renderer;
    
    // Array of VF.Spacemap objects. 
    // They define a series of transforms from the portal to the camera.
    // spacemap[0] is a child of this, and spacemap[spacemap.length - 1]
    // is the parent of this._boundingBoxCamera.
    this.spacemap = spacemap instanceof VF.Spacemap ? [spacemap] : spacemap;
    
    // An object that handles creating render targets and caching existing 
    // targets.
    this.storageManager = storageManager;

    // WebGLRenderTarget or Texture that should be displayed by this portal.
    this._storage = null;
    
    // Either BufferGeometry or Geometry object.
    this._geometry = geometry;

    // Array of ShaderPass objects to apply to the portal texture.
    this.passes = [];

    // Camera set to match a bounding box around the portal geometry.
    // The projection matrix and local matrix should be used to achieve
    // this.
    this._boundingBoxCamera = new THREE.OrthographicCamera();
        
    // The map will be set to a texture when one is bound.
    this._material = new THREE.MeshBasicMaterial({map : null});
    
    // Since the owner of this object sets the texture and material
    // elsewhere, this shouldn't be public.
    this._mesh = new THREE.Mesh(this._geometry, this._material); 
    this.add(this._mesh);
        
    // The render target used to render the portal view is an aligned 
    // bounding rectangle of the portal geometry. Therefore if the portal 
    // geometry is not an aligned rectangle there will be regions of the
    // render target that need not be rendered to. We use a stencil buffer
    // to control these regions. We need to set this up carefully:
    // We need to set up a scene to render the portal geometry onto the
    // render target as it is mapped when displayed. This scene is used to
    // set up the stencil buffer. The mask pass should clear the stencil buffer
    // and only write to it. By setting colorWrite and depthWrite to false, 
    // we only write (and can clear) the stencil buffer. This is necessary
    // despite the fact that MaskPass sets the mask flags when it renders, 
    // since WebGLRenderer overwrites these masks using the material flags. 
    this._maskScene               = new THREE.Scene();
    this._maskCamera              = new THREE.OrthographicCamera();
    this._maskMaterial            = new THREE.MeshBasicMaterial();
    this._maskMaterial.colorWrite = false;
    this._maskMaterial.depthWrite = false;
    this._maskMesh                = new THREE.Mesh(this._geometry, this._maskMaterial);
    this._maskScene.add(this._maskMesh);    
 
    this.setGeometry(this._geometry);
                                
}

// Objects that can be shared between all portal objects.
VF.Portal._static = (function() {
    
    var s = {
        ec : new THREE.EffectComposer(null, new THREE.Object3D()),
        
        renderPass : new THREE.RenderPass(),
                
        maskPass : new THREE.MaskPass(),
        
        clearMaskPass : new THREE.ClearMaskPass()
    };
    
    // Don't clear the buffer between renders.
    s.renderPass.clear = false;
    
    return s;
    
})();

VF.Portal.prototype = Object.create( THREE.Object3D.prototype );
VF.Portal.prototype.constructor = VF.Portal;

VF.Portal.prototype.setStorage = function(newStorage) {
        
        if (newStorage === undefined) {
            console.error("newStorage must be null or a render target.");
            return;
        }
        
        this.storageManager.recycle(this._storage);

        // If the storage goes from null to nonnull or nonnull to null,
        // flag the material for update.
        if ((this._storage === null) !== (newStorage !== null)) {
            this._material.needsUpdate = true;
        }        
        
        this._storage = newStorage;
            
        this._material.map = this._storage;

}

VF.Portal.prototype.getStorage = function() { return this._storage; }

VF.Portal.prototype.setGeometry = function(geometry) {
    // This must be called whenever the geometry changes, not just reassigned.
    
    this._geometry = geometry;
    
    this._mesh.geometry = this._geometry;
    
    this._maskMesh.geometry = this._geometry;
    
    this._geometry.computeBoundingBox();
        
    // Set the clip planes of the camera to the bounding box of the 
    // portal's geometry.
    var c = this._boundingBoxCamera, bb = this._geometry.boundingBox;
    
    c.left = bb.min.x;
    c.right = bb.max.x;
    c.top = bb.max.y;
    c.bottom = bb.min.y;
    
    // TOOD: This should be externally controllable/should include all
    // elements of the scene to be rendered. For 2D rendering the z coordinate
    // is primarily used for depth testing.
    c.near = -100;
    c.far = 100;
        
    c.updateProjectionMatrix();
    
    // Update the mask camera to match the bounding box camera.
    this._maskCamera.copy(c);
        
}

VF.Portal.prototype.getGeometry = function() { return this._geometry; }

VF.Portal.prototype.computeIteration = function(sourceScene, replaceStorage) {
    // sourceScene is the scene used in rendering.
    // replaceStorage (bool) specifies whether the portal's current storage
    // should be replaced by the next iteration. The storage is recycled if
    // possible.

    var b1 = this.storageManager.getRenderTarget(),
        b2 = this.storageManager.getRenderTarget();
    
    this._setRenderingState(sourceScene, b1, b2);
    
    VF.Portal._static.ec.render();
        
    var nextIteration = this._unsetRenderingState();
    
    // // Render just nextIteration.
    // var scene = new THREE.Scene();
    // var camera = new THREE.OrthographicCamera(-1, 1, 1, -1);
    // camera.position.z = 5;
    // camera.lookAt(new THREE.Vector3(0, 0, 0));
    // var disp = new THREE.Mesh(
    //     new THREE.PlaneBufferGeometry(2, 2), 
    //     new THREE.MeshBasicMaterial({map : nextIteration}));
    // scene.add(disp);
    // renderer.render(scene, camera);
        
    if (replaceStorage || replaceStorage === undefined) {
        
        this.setStorage(nextIteration);
        
    }
    
    return nextIteration;
    
}

VF.Portal.prototype._setRenderingState = function(scene, initialWriteBuffer, initialReadBuffer) {
    
    var s = VF.Portal._static;
    
    // Set temporary render settings
    this._oldAutoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;
    
    // Set renderer
    s.ec.renderer = this.renderer;
    
    // Set the passes the effect composer will apply.
    s.ec.passes = [s.maskPass].concat(s.renderPass, this.passes, s.clearMaskPass);
    
    // Set render targets
    s.ec.renderTarget1 = initialWriteBuffer;
    s.ec.renderTarget2 = initialReadBuffer;
    
    // Set up the spacemap chain from the portal to the camera.
    this.add(this.spacemap[0]);
    for (var i = 1; i < this.spacemap.length; i++) {
        this.spacemap[i - 1].add(this.spacemap[i]);
    }
    this.spacemap[this.spacemap.length - 1].add(this._boundingBoxCamera);
        
    s.renderPass.camera = this._boundingBoxCamera;
    s.renderPass.scene  = scene;

    // Set up mask passes    
    s.maskPass.scene  = this._maskScene;
    s.maskPass.camera = this._maskCamera;
                
}

VF.Portal.prototype._unsetRenderingState = function() {
    
    var s = VF.Portal._static;
    
    // Uncouple the spacemap chain.
    this.remove(this.spacemap[0]);
    for (var i = 1; i < this.spacemap.length; i++) {
        this.spacemap[i - 1].remove(this.spacemap[i]);
    }
    this.spacemap[this.spacemap.length - 1].remove(this._boundingBoxCamera);
    
    // Reset the render pass.
    
    s.renderPass.scene  = null;
    s.renderPass.camera = null;
    
    // Reset the mask pass.
    
    s.maskPass.scene  = null;
    s.maskPass.camera = null;
    
    // Swap the updated feedback texture with the old one.
    var outputTarget;
    if (s.ec.readBuffer === s.ec.renderTarget1) {
        outputTarget = s.ec.renderTarget1;
        this.storageManager.recycle(s.ec.renderTarget2);
    } else {
        outputTarget = s.ec.renderTarget2;
        this.storageManager.recycle(s.ec.renderTarget1);
    }
    
    // Reset the EffectComposer object.

    s.ec.renderTarget1 = null;
    s.ec.renderTarget2 = null;
    s.ec.renderer      = null;
    s.ec.passes        = null;
    
    this.renderer.autoClear = this._oldAutoClear;
    
    return outputTarget;
    
}

VF.Portal.prototype.clone = function () {

	return new this.constructor( this._geometry, this.spacemap, this.storageManager ).copy( this );

};

VF.FeedbackStorageManager = function(width, height, options) {
        
    this.width = width;
    this.height = height;
    this.options = options !== undefined ? options : 
        VF.FeedbackStorageManager.defaultOptions;
    
    // Create _cache and _allocated;
    this._updateState();
        
}

VF.FeedbackStorageManager.prototype = {
    
    constructor : VF.FeedbackStorageManager,
    
    getRenderTarget : function () {
                
        var target;
        
        if (this._cache.length > 0) {
            target = this._cache.pop();
        } else {
            target = this._createRenderTarget();
        }
             
        // Record the uuid of the render target.
        this._allocated[target.uuid] = true;
            
        return target;
        
    },
    
    recycle : function(target) {
        // Add the target to the cache if there is room and it matches state.
        
        // Bail if the target isn't a render target.
        if (target instanceof THREE.WebGLRenderTarget === false) return;
        
        // Bail if the cache is full.
        if (this._cache.length > 2) return; 
        
        // If the target was given out by the current state of this storage
        // manager, add it to the cache and unset the reference in the list
        // of allocated render targets.
        if (this._allocated[target.uuid]) {
            this._cache.push(target);
            this._allocated[target.uuid] = undefined;
        }
        
    },
    
    setSize : function(width, height) {
                
        this.width  = width;
        this.height = height;
        
        // The cache state is no longer consistent.
        this._updateState();
        
    },
    
    setOptions : function(options) {
        
        this.options = options;
        
        // The cache state is no longer consistent.
        this._updateState();
        
    },
    
    _createRenderTarget : function() {
                
        var target =  new THREE.WebGLRenderTarget(
            this.width, this.height, this.options
        );
             
        // Even though the documentation states that generateMipMaps is an 
        // option for WebGLRenderTarget, it never gets passed to the texture,
        // so it must be set directly.
        if (this.options.generateMipmaps !== undefined) {
            target.texture.generateMipmaps = this.options.generateMipmaps;
        }
                
        return target;
        
    },
    
    _updateState : function() {
        
        this._allocated = [];
        
        this._cache = [];
        
    }
        
}

VF.FeedbackStorageManager.defaultOptions = {
    
    minFilter     : THREE.LinearFilter,
    magFilter     : THREE.LinearFilter,
    format        : THREE.RGBFormat,
    depthBuffer   : true,
    stencilBuffer : true,
    
    generateMipmaps : false
    
}

VF.Spacemap = function() {
    
    // Encapsulates an affine transformation of space
    
	THREE.Object3D.call( this );
    
}

VF.Spacemap.prototype = Object.create(THREE.Object3D.prototype);