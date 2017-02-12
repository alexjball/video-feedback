/**
 * Texture that binds a numeric array of z coordinates to a float texture.
 * 
 * The x component of the read texture value corresponds to the z coordinate.
 */
LayerZTexture = function(coords) {
    THREE.DataTexture.call(this);

    this.generateMipmaps = false;
    this.minFilter = THREE.NearestFilter;
    this.magFilter = THREE.NearestFilter;
    this.format = THREE.LuminanceFormat;
    this.type = THREE.FloatType;

    this.upload(coords || [1, 0, -1]);
}

LayerZTexture.prototype = Object.create(THREE.DataTexture.prototype);
LayerZTexture.prototype.constructor = LayerZTexture;

LayerZTexture.prototype.upload = function(coords) {
    this.image.height = 1;
    this.image.width = coords.length;
    this.image.data = new Float32Array(this.image.width);
    this.image.data.set(coords);
    this.needsUpdate = true;
}

LayerZController = function(maxDepth, layerSpacing) {
    this.maxDepth = maxDepth;
    this.layerSpacing = layerSpacing;
    this.texture = new LayerZTexture();
    this.coords = [];
    this.eyePosition = new THREE.Vector3(1, 0, 0);
}

/** 
 * Returns the z coordinate to use when the ray doesn't intersect any layers.
 * Corresponds to layer -1.
 */
LayerZController.prototype.getSkyZ = function() {
    return this.getLayerZ(-1);
}

/**
 * Returns the z coordinate of the layer at the specified depth. Depth is between
 * 0 and maxDepth, inclusive.
 */
LayerZController.prototype.getLayerZ = function(depth) {
    return -this.layerSpacing * depth;
}

/**
 * Returns an array of z coordinates for layers -1 through maxDepth, inclusive.
 */
LayerZController.prototype.updateCoords = function() {
    this.coords = [this.getSkyZ()];
    for (var depth = 1; depth <= this.maxDepth; depth++) {
        this.coords[depth] = this.getLayerZ(depth);
    }
    return this.coords;
}

/** 
 * Computes the coordinates of each layer, uploads them to texture, and returns
 * the coordinates and top layer index in an object of the form 
 * { coords: Array[Number], layerTop: Integer in [-1, maxDepth] }
 */
LayerZController.prototype.update = function(eyePosition) {
    this.eyePosition.copy(eyePosition);
    this.updateCoords();
    this.texture.upload(this.coords);
}

/** Returns the size of the generated texture */
LayerZController.prototype.getTextureSize = function() {
    return this.maxDepth + 1;
}

/** 
 * Returns the depth index of the layer above the specified z coordinate.
 * Uses the current value of coords.
 * Returned value is an integer in the range [-1, maxDepth]. -1 is returned if 
 * eyeZ is greater than getLayerZ(0).
 */
LayerZController.prototype.getLayerTop = function() {
    for (var depth = -1; depth < this.coords.length - 2; depth++) {
        if (this.eyePosition.z >= this.coords[depth + 2]) {
            return depth;
        }
    }
    return this.maxDepth;
}

LayerZController.prototype.getCachedLayerZ = function(depth) {
    return this.coords[depth + 1];
}

DynamicLayers = function(maxDepth, layerSpacing, layerZ0) {
    LayerZController.call(this, maxDepth, layerSpacing);
    this.layerZ0 = layerZ0;
    this.eyeZ = 1;
}

DynamicLayers.prototype = Object.create(LayerZController.prototype);
DynamicLayers.prototype.constructor = DynamicLayers;

DynamicLayers.prototype.getSkyZ = function() {
    return this.layerZ0;
}

DynamicLayers.prototype.getLayerZ = function(depth) {
    var baseZ = -this.layerSpacing * depth;
    var p = Math.max(0, Math.min(1, 1 - this.eyePosition.z / this.layerZ0))
    return p * baseZ;
}

UnreachableLayers = function(maxDepth, layerSpacing, layerZ0) {
    LayerZController.call(this, maxDepth, layerSpacing);
    this.distanceToMaxDepth = maxDepth * layerSpacing;
    this.layerZ0 = layerZ0;
}

UnreachableLayers.prototype = Object.create(LayerZController.prototype);
UnreachableLayers.prototype.constructor = UnreachableLayers;

UnreachableLayers.prototype.getSkyZ = function() {
    return this.layerZ0;
}

UnreachableLayers.prototype.getLayerZ = function(depth) {
    var p = Math.max(0, Math.min(1, 1 - this.eyePosition.z / this.layerZ0));
    var maxDepthZ = p * Math.min(0, -this.layerSpacing * this.maxDepth + this.eyePosition.z);
    return maxDepthZ * depth / (this.maxDepth === 0 ? 1 : this.maxDepth);
}

/**
 * Returns a smoothed measure of the apparent movement speed between layers.
 * 
 * The returned value is in the range [0, 1] and specifies dz_l/dz_e, or the
 * change in distance to the nearest layer for each unit change in the z 
 * coordinate of the eye. Since layer spacing can depend on the eye position,
 * this is not invariant. This factor can be used to scale movement in the xy
 * directions to match the apparent slowing of movement in the z direction.
 */
UnreachableLayers.prototype.getVelocityScaleFactor = function() {
    var d0 = this.getLayerTop();
    if (d0 === -1) {
        return 1;
    }
    var d1 = Math.min(this.maxDepth, d0 + 1);
    var z1 = this.getCachedLayerZ(d1);
    var z0 = this.getCachedLayerZ(d0);
    var f =  (this.eyePosition.z - z0) / (z1 - z0);
    return 1 - ((1 - f) * d0 / this.maxDepth + f * d1 / this.maxDepth);
}