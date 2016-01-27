(function() {

var node = function(obj) {
	this.object = obj;

	this.out = [];

	this.in = [];
};

node.prototype = {
	constructor : node,

	contains : function(obj) {
		return obj === this.object;
	}
};

VF.FeedbackGraph = function() {
	// Artificial node to track all path beginnings.
	this.source = new node({});

	// Artificial node to track all path endings.
	this.sink   = new node({});

	// List of all objects.
	this.objects = [];

	this.portals = [];
};

VF.FeedbackGraph.prototype = {
	constructor : VF.FeedbackGraph,

	addFeedbackPath : function(path) {
		if (path[path.length - 1] instanceof VF.Portal   === false || 
			path[0] 			  instanceof THREE.Scene === false) {
			console.Error('VF.FeedbackGraph.addPortal: path must begin with a scene and end with a portal.');
			return;
		}

		var idx = this.portals.indexOf(path[path.length - 1]);

		if (idx !== -1) {
			console.Error('VF.FeedbackGraph.addPortal: portal is already in the feedback graph.');
			return;
		}

		this.portals.push(path[path.length - 1]);

		var prev, curr, i, j;

		curr = this.source;
		i = 0;
		do {
			prev = curr;

			for (j = 0; ; j++) {
				if ((curr = this.nodes[j]).object === path[i]) break;

				if (j === this.nodes.length - 1) {
					curr = null;
					break;
				}
			}

			if (curr === null) {
				this.nodes.push(new node(path[i]));
			} else {
				curr.
			}

		} while (i < path.length);

		for (i = 0; i < path.length; i++) {

			for (j = 0; j < this.objects.length; j++) {
				if (this.objects[j] === path[i])
			}

		}
	}

	removePortal : function(portal) {
		var idx = this.portals.indexOf(portal);

		if (idx !== -1) this.portals.splice(idx, 1);
	}
	
};

})();