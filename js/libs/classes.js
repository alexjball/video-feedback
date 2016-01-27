/*
 * Rotation in radians about z-axis (positive = ccw)
 * Homogeneous scaling (x' = kx, y' = ky)
 * Translation (x' = x + t_x, y' = y + t_y)
 */

VF.Node = function(object) {

	if (object instanceof THREE.Matrix4 === false && 
		object instanceof VF.SpaceMap   === false && 
		object instanceof THREE.Scene   === false &&
		object instanceof VF.TV 		=== false) {

		console.Error('VF.Node: object must be either a TV, matrix, space map, or scene.');

		return;
	}

	this.children = [];
	this.parent   = null;
	this.object   = object;

}

VF.Node.prototype = {
	constructor : VF.Node,

	add : function(node) {

		if (arguments.length > 1) {
			for (var i = 0; i < arguments.length; i++) {
				this.add(arguments[i]);
			}

			return this;
		}

		if (node === this) {
			console.Error('VF.node.add: Cannot add self as child.');
			return this;
		}

		if (node instanceof VF.Node === false) {
			console.Error('VF.Node.add: node is not an instance of VF.Node.');
			return this;
		}

		if (node.parent !== null) {
			console.Error('VF.node.add: node already has a parent.');
			return this;
		}

		var i = this.children.indexOf(node);

		if (i !== -1) {
			console.Error('VF.Node.add: node is already a child of this.');
			return this;
		} 

		// Now we can adopt the orphan node. 
		this.children.push(node);

		node.parent = this;

		return this;
	}

	remove : function(node) {
		if (arguments.length > 1) {
			for (var i = 0; i < arguments.length; i++) {
				this.remove(arguments[i]);
			}

			return this;
		}

		if (node instanceof VF.Node === false) {
			console.Error('VF.Node.remove: node is not an instance of VF.Node.');
			return this;
		}

		var i = this.children.indexOf(node);

		if (i !== -1) {
			node.parent = null;

			this.children.splice(i, 1);
		} else {
			console.Error('VF.Node.remove: node is not a child of this.');
		}

		return this;
	}
}

/*
 * Portals are basically shader Meshes that get their UV coorinates updated later.
 */

VF.Portal = function() {
	/*
	 * preimage is an array of meshes with vertex attributes specifying the UV coordinates
	 * of the corresponding texture source.
	 */
	this.preimage = [];

	/*
	 * textureSource[i] specifies the texture object that preimage[i]'s UV coords refer to.
	 */
	this.textureSource = [];

	
};

VF.Portal.prototype = {

	constructor : VF.Portal,

	prepareForRender : function () {
		return;
	},



};

/*
 * SpaceMap is a multivalued mapping of space onto itself. Different symmetries and
 * space effects are made by subclassing this and implementing invert. Invert
 * computes the pre-image of a mesh under the represented symmetry. 
 * Each SpaceMap has an affine transform attached that allows the symmetry to be 
 * rotated, scaled, and translated. 
 * Should inherit from Geometry.
 */

VF.SpcaeMap = function() {

};

VF.SpaceMap.prototype = {

	constructor : VF.SpaceMap,

	invert : function(geometry) {
		/*
		 * Given an input geometry (triangle mesh), output the mesh that specifies
		 * the pre-image of the geometry.
		 */
	}
};

VF.FeedbackGraph = function() {
	this.nodes = [];
}

VF.FeedbackGraph.prototype = {
	constructor : VF.FeedbackGraph,

	
}