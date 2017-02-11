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
        this.coords[depth - 1] = this.getLayerZ(depth);
    }
    return this.coords;
}

/** 
 * Computes the coordinates of each layer, uploads them to texture, and returns
 * the coordinates and top layer index in an object of the form 
 * { coords: Array[Number], layerTop: Integer in [-1, maxDepth] }
 */
LayerZController.prototype.update = function() {
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
LayerZController.prototype.getLayerTop = function(eyeZ) {
    for (var depth = -1; depth < this.coords.length - 2; depth++) {
        if (eyeZ >= this.coords[depth + 2]) {
            return depth;
        }
    }
    return this.maxDepth;
}

// if (depth == -1) {
// 	return 5.0;
// }
// return layerScaleFactor 
// 		* clamp(1.0 - z / layerZ0, 0.0, 1.0) 
// 		* (-layerSpacing * float(depth) 
// 				+ min(0.0, z * (1.0 - pow(1.0 - layerExpansionFactor, float(depth)))));