THREE.SymmetryElement = function(position, uv) {

	this.pTri = THREE.Triangle.apply(this, 
		position.map(function(x) {return new THREE.Vector3.apply(this, x)} ));

	this.uvTri = THREE.Triangle.apply(this, 
		uv.map(function(x) {return new THREE.Vector3.apply(this, x)} ));
	
}

THREE.SymmetryElement.intersection = (function() {

	// Probably way too large, but it shouldn't matter.
	var epsilon = 1e-5;
	var angleEpsilon = 1e-5;

	var HPT = (function() {
		// Half-Plane test.
		// Given a triangle and a test point, output an array arr where arr[i]
		// is true iff the test point lies on the same side of the half plane
		// as [tri.a, tri.b, tri.c][i], where the half plane is defined by the
		// line segment between the other two vertices in the triangle.

		var v0 = new THREE.Vector3();
		var v1 = new THREE.Vector3();
		var v2 = new THREE.Vector3();

		var p1, p2, pComp, pts;

		return function(tri, pTest) {

			var sameSide = new Array(3);

			pts = [tri.a, tri.b, tri.c];

			for (var i = 0; i < 3; i++) {
				p1 = pts[(i + 1) % 3];
				p2 = pts[(i + 2) % 3];
				pComp = pts[i];

				v0.subVectors(p2, p1);
				v1.subVectors(pTest, p1);
				v2.subVectors(pComp, p1);

				v0.normalize();
				
				v1.cross(v0);
				v2.cross(v0);

				sameSide[i] = v1.length() <= epsilon ||
					v2.length() * v1.length() >= 0;
			}

			return sameSide;
		}

	})();

	var lineSegmentIntersection = (function() {

		var v1  = new THREE.Vector3();
		var v2  = new THREE.Vector3();
		var dtf = new THREE.Vector3();

		var maxCos = Math.cos(Math.PI / 180.0 * angleEpsilon);

		return function(p11, p12, p21, p22) {
			v1.subVectors(p12, p11);
			v2.subVectors(p22, p21);

			// If the line segments are very nearly parallel, don't compute an
			// intersection.
			if (Math.abs(v1.dot(v2) / v1.length() / v2.length()) > maxCos) {
				return [];
			}

			// If a segment's endpoint is within epsilon of a line segment, 
			// don't compute an intersction.
			var check = [[p21, p11, v1], 
			 			 [p22, p11, v1], 
						 [p12, p21, v2], 
						 [p22, p21, v2]];

			for (var i = 0; i < check.length; i++) {

				dtf.subVectors(check[i][0], check[i][1]);

				if (Math.abs(dtf.cross(check[i][2]) / check[i][2].length()) 
					< epsilon) return [];
			}

			var m1 = v1.y / v1.x; 
			var m2 = v2.y / v2.x;

			// The math doesn't work if the slopes are vertical, so handle them
			// as special cases. 
			if (m1 == Infinity || m2 == -Infinity) {
				dtf.x = p11.x;
				dtf.y = p21.y + m2 * (p11.x - p21.x);
			} else if (m2 == Infinity || m2 == -Infinity) {
				dtf.x = p21.x;
				dtf.y = p11.y + m1 * (p21.x - p11.x);
			} else {
				// We won't be dividing by 0 because we already checked for
				// parallel segments.
				dtf.x = (p11.y - p21.y - m1 * p11.x + m2 * p21.x) / (m2 - m1);
				dtf.y = p11.y + m1 * (dtf.x - p11.x);
			}

			// If the point of intersection lies outside either segment,
			// return no intersection.
			if (dtf.x < Math.min(p11.x, p21.x) || 
				dtf.x > Math.max(p11.x, p21.x) ||
				dtf.x < Math.min(p21.x, p22.x) ||
				dtf.x > Math.max(p21.x, p22.x)) {

				return [];
			
			}

			return new THREE.Vector3(dtf.x, dtf.y, 0);

		}

	})();

	var computeCircuit = function(t1, t2) {
		// Compute the intersection circuit of t1 in t2.
		// That is, traverse t1, recording the interior points and the points
		// of intersection with t2.

		var t1Pts = [t1.a, t1.b, t1.c];
		var t2Pts = [t2.a, t2.b, t2.c];

		// HPT12[i][j] is true iff t1Pts[i] is in the same half plane as
		// t2Pts[j], and similarly for HPT21.
		var HPT12 = t1Pts.map(function(x) { HPT(t2, x) });

		// t1InT2[i] is true iff t1Pts[i] is in/on t2, and similarly for t2InT1.
		var t1InT2 = HPT12.map(function(arr) { arr.every(function(x) {return x}) });

		// If there are no points in t1 in t2, then a circuit of t2 in t1 will 
		// suffice and avoid generating overlapping polygons.
		if (!t1InT2[0] && !t1InT2[1] && !t1InT2[2]) return [];

		// We can compute the intersection region of the two triangles as the union
		// of the intersection circuits around each triangle.

		var curr = 0;
		var next = 1;
		var intPath = [];

		while (curr < 3) {
			if (t1InT2[curr]) {
				intPath.push(t1Pts[curr]);
			}

			var edgeInt = [];

			// Figure out which edges of t2 we cross while moving to the next
			// vertex.
			for (int j = 0; j < 3; j++) {
				// We cross sides iff the half plane test succeeds on 1 end 
				// of the edge.
				if ((HPT12[curr][j] || HPT12[next][j]) && 
					!(HPT12[curr][j] && HPT12[next][j])) {

					edgeInt.push(lineSegmentIntersection(
						t1Pts[curr], t1Pts[next], 
						t2Pts[(j + 1) % 3], t2Pts[(j + 2) % 3]));
				}
			}

			// We go from closer to further vertices.
			if (edgeInt.length == 2 && 
				t1Pts[curr].distanceTo(edgeInt[0]) >
				t1Pts[curr].distanceTo(edgeInt[1])) {

				edgeInt.reverse();
			}

			// Add the intersection points to our circuit.
			intPath = intPath.concat(edgeInt);

			curr++;
			next = (next + 1) % 3;
		}
	};

	var triangulate = function(convexPolygon) {
		// Generate triangles from the convex polygon that lie in the z=0 plane
		// and wrap ccw.

		var mesh = [];

		var v0.
		var anchor = convexPolygon[0];
		var leading, trailing, next = 2;

		for (next = 0; next < convexPolygon.length; next++) {
			leading = convexPolygon[next];
			trailing = convexPolygon[next - 1];

			v0.subVectors(leading, anchor);
			v1.subVectors(trailing, anchor);

			if (v0.cross(v1).z > 0) {
				mesh.push(new THREE.Triangle(anchor, leading, trailing);
			} else {
				mesh.push(new THREE.Triangle(anchor, trailing, leading));
			}
		}

		return mesh;
	}	

	return function(t1, t2) {

		var circT1T2 = computeCircuit(t1, t2);
		var circT2T1 = computeCircuit(t2, t1);

		var mesh = new Array();

		if (circT1T2.length > 2) mesh = mesh.concat(triangulate(circT1T2));
		if (circT2T1.length > 2) mesh = mesh.concat(triangulate(circT1T2));

		return mesh;
	}

})();


THREE.SymmetryElement.prototype = {
	applyElem : function(elem) {
		/*
		 * Apply the symmetry of SymmetryELement elem to this SymmetryElement.
		 */

		elem.

	},

	intersect : function(elem) {
		var t1 = this.pTri;
		var t2 = elem.uvTri;

		var p1 = [t1.a, t1.b, t1.c];
		var p2 = [t2.a, t2.b, t2.c];

		var p1In = p1.map(t2.containsPoint);
		var p2In = p2.map(t1.containsPoint);

		var nIn1 = p1In.reduce(function(a, b) {return a + b});
		var nIn2 = p1In.reduce(function(a, b) {return a + b});

		if (!nIn1 && !nIn2) { return []; }

		if (!nIn1) { return elem.intersect(this); }

		var intPoly = new Array();

		for (var i = 0; i < 3; i++) {
			if (p1In[i]) {intPoly.push(p1[i]);}



		}
	}
}

THREE.SymmetryMap = function() {


}

THREE.SymmetryMap.prototype = {


}

THREE.SymmetryMap.intersectTriangles = function(t1, t2) {

}	
