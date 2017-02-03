ColorPaletteTexture = function(colors) {
	THREE.Texture.call(this);

	this.generateMipmaps = false;
    this.minFilter = THREE.NearestFilter;
    this.magFilter = THREE.NearestFilter;
    this.colors = [];

    if (colors) {
        for (var i = 0; i < colors.length; i++) {
            this.colors[i] = new THREE.Color(colors[i]);
        }
        this.uploadColors();
    }
};

ColorPaletteTexture.prototype = Object.create( THREE.Texture.prototype );
ColorPaletteTexture.prototype.constructor = ColorPaletteTexture;

ColorPaletteTexture.prototype.uploadColors = function() {
    var canvas  = document.createElement( 'canvas' );
    canvas.width = this.colors.length;
    canvas.height = 1;
    var context = canvas.getContext( '2d' );

    for (var i = 0; i < this.colors.length; i++) {
        context.fillStyle = this.colors[i].getStyle();
        context.fillRect(i, 0, 1, 1);
    }
    
    this.image = canvas;
    this.needsUpdate = true;
}

ColorPaletteTexture.createGrayscalePalette = function(numColors) {
    var dColor = 1 / Math.max(1, numColors - 1);
    var color = 0;
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        colors[i] = new THREE.Color(color, color, color);
        color += dColor;
    }
    return new ColorPaletteTexture(colors);
}

ColorPaletteTexture.createRandomPalette = function(numColors) {
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        colors[i] = new THREE.Color(Math.random(), Math.random(), Math.random());
    }
    return new ColorPaletteTexture(colors);
}