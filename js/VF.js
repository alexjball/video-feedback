VF = {};

VF.FeedbackGraph = function() {
	
	this.portals = [];

}

VF.FeedbackGraph.prototype = {
	constructor: VF.FeedbackGraph,


}

VF.Portal = function(x, y) {

	var i, j;

	this.border = {
		x : x,
		y : y
	};

	var poly = new Array(x.length * 2);
	for (i = 0; i < 2 * x.length; i += 2){
		poly[i] = x[i];
		poly[i + 1] = y[i];
	}

	var i_tri = earclip(poly);

	var tri = new Geometry();

	for(i = 0; i < Math.round(i_tri.length / 3); i++) {
		for (j = 0; j < 3; j++) {
			tri.vertices.push(
				new THREE.Vector3(poly[2 * i_tri[3 * i + j]], poly[2 * i_tri[3 * i + j] + 1], 0);
			);
		}
	}

	this.triangulation = tri;
	
	this.map = [];

	// Object that holds the texture meshes that render to the view of the portal.
	this.mesh = new THREE.Object3D();
}

VF.Portal.prototype = {
	constructor : VF.Portal,


}

// Allow the user to specify the z clipping planes for the scene.