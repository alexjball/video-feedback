ColorPaletteTexture = function(colors) {
	THREE.Texture.call(this);

	this.generateMipmaps = false;
    this.minFilter = THREE.NearestFilter;
    this.magFilter = THREE.NearestFilter;
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');
    this.colors = colors || [new THREE.Color()];

    this.uploadColors();
};

ColorPaletteTexture.prototype = Object.create( THREE.Texture.prototype );
ColorPaletteTexture.prototype.constructor = ColorPaletteTexture;

ColorPaletteTexture.prototype.uploadColors = function() {
    this._canvas.width = this.colors.length;
    this._canvas.height = 1;

    for (var i = 0; i < this.colors.length; i++) {
        this._context.fillStyle = this.colors[i].getStyle();
        this._context.fillRect(i, 0, 1, 1);
    }
    
    this.image = this._canvas;
    this.needsUpdate = true;
}