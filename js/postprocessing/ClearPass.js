/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.ClearPass = function (color, depth, stencil) {

	THREE.Pass.call( this );

	this.needsSwap = false;
	
	this.color   = color;
	this.depth   = depth;
	this.stencil = stencil;
};

THREE.ClearPass.prototype = Object.create( THREE.Pass.prototype );

THREE.ClearPass.prototype = {

	constructor: THREE.ClearPass,

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		renderer.setRenderTarget( readBuffer );
		renderer.clear(this.color, this.depth, this.stencil);

	}

};
