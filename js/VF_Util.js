VF = {};
VF.Util = {};

(function() {

	'use strict';

	var tol = 1e-9;

	// return the bounding box of a triangle as [minx, miny, maxx, maxy]
	var getBB = function(t) {
		var bb = [];

		bb[0] = Math.min.apply(Math, t.map(function(x) {return x[0];}));
		bb[1] = Math.min.apply(Math, t.map(function(x) {return x[1];}));
		bb[2] = Math.max.apply(Math, t.map(function(x) {return x[0];}));
		bb[3] = Math.max.apply(Math, t.map(function(x) {return x[1];}));

		return bb;
	}

	var bbsOverlap = function(t1, t2) {
		var bb1, bb2;

		bb1 = getBB(t1);
		bb2 = getBB(t2);

		if (bb1[2] <= bb2[0] || bb1[3] <= bb2[1]) {
			return false;
		} else {
			return true;
		}

	}

	var sub = function(p2, p) {
		return [p2[0] - p[0], p2[1] - p[1]];
	}

	var cross = function(a, b) {
		return a[0] * b[1] - a[1] * b[0];
	}

	var equiv = function(a, b) {
		var d = sub(a, b);

		return Math.abs(d[0]) + Math.abs(d[1]) <= tol;
	}

	var wind = function(t, direction) {
		var c = cross(sub(t[1], t[0]), sub(t[2], t[1]));

		if (c * direction > 0) {
			return t.slice().reverse();
		} else {
			return t.slice();
		}
	}

	var copyTriangle = function(t) {
		return t.map(function(x) {return x.slice()});
	}

	var inTriangle = function(tSubj, tClip) {
		// Return an array of booleans indicating if vertices of tClip are
		// inside tSubj.

		var iSubj, cSubj, sSubj; iClip, s1, c1, inside, insides;

		// Get segments
		for (iSubj = 0; iSubj < 3; iSubj++) {
			sSubj[iSubj] = sub(tSubj[(iSubj + 1) % 3], tSubj[iSubj]);
		}

		// Get cross products
		for (iSubj = 0; iSubj < 3; iSubj++) {
			cSubj[iSubj] = cross(sSubj[iSubj], sSubj[(iSubj + 1) % 3]);
		}

		insides = [false, false, false];

		for (iClip = 0; iClip < 3; iClip++) {
			inside = false;

			for (iSubj = 0; iSubj < 3; iSubj++) {
				s1 = sub(tClip[iClip], tSubj[(iSubj + 1) % 3]);
				
				c1 = cross(sSubj[iSubj], s1);

				if (c1 * cSubj[iSubj] <= 0) {
					break;
				} else if (iSubj == 2) {
					inside = true;
				}
			}

			insides[iClip] = inside;
		}

		return insides;
	};

	VF.Util.segIntersect = function(p, p2, q, q2) {
		/* Calculate the point of intersection between a line segment (p, p2) and
		 * A line segment or extended line (q, q2).
		 * The first 4 arguments are [x, y] pairs.
		 */

		var r, s, u, t, c, d, cr, cs, cEq0, crEq0;

	 	r = sub(p2, p);
	 	s = sub(q2, q);

	 	c = cross(r, s);
	 	d = sub(q, p);

	 	cr = cross(d, r);
	 	cs = cross(d, s);

	 	cEq0  = Math.abs(c)  <= tol;
	 	crEq0 = Math.abs(cr) <= tol;

	 	if (cEq0) {
	 		if (crEq0) {
	 			// Collinear. We don't want to track these for our purposes.
	 			return false
	 		} else {
	 			return false;
	 		}
	 	} else {
	 		t = cs / c;
	 		u = cr / c;

	 		if (t >= -tol && t <= 1 + tol) {
	 			return {
	 				xy: [p[0] + t * r[0], p[1] + t * r[1]],
	 				u: u
	 			};
	 		} else {
	 			return false;
	 		}
	 	}

	};

	VF.Util.triSegClip = function(ts, tClip, i_c) {
		var segment, toReturn, ints, ints2, i, segInt, 
			start, end, intLoc, vertLoc, u1, u2, tri;

		toReturn = {inside: [], outside: []};

		segment = [tClip[i_c], tClip[(i_c + 1) % 3]];

		ints = [];

		for (i = 0; i < 3; i++) {
			// Push the start of the ts segment.
			ints.push({xy: ts[i]});

			// Check for intersection between the clip and ts segments.
			segInt = VF.Util.segIntersect(
				ts[i], ts[(i + 1) % 3], 
				segment[0], segment[1]);

			// If there was an intersection, push the info.
			if (segInt) ints.push(segInt);

		}

		// Both ts and tClip are wound ccw.
		// ints now contains a superset of the vertices that will appear in the output.
		// ints is a superset because if tClip crosses a vertex.
		// Loop through the current vertices and filter down to 1 vertex per 
		// group, using an intersection vertex if possible.
		start = 0;
		ints2 = [ints[0]];
		for (i = 0; i < ints.length; i++) {
			if (equiv(ints[start].xy, ints[i].xy)) {
				if (ints[i].u !== undefined) {
					ints2[ints2.length - 1] = ints[i];
				}
			} else {
				start = i;
				ints2.push(ints[i]);
			}
		}

		// Since the ordering of points is cyclic, we need to check that a 
		// grouping doesn't wrap around the array.
		if (equiv(ints2[ints2.length - 1].xy, ints2[0].xy)) {

			if (ints2[ints2.length - 1].u !== undefined) {
				ints2[0] = ints2[ints2.length - 1];
			}

			ints2.splice(-1, 1);
		}

		// ints2 now contains the exact set of vertices used to create output
		// triangles. There are 3 cases:
		// - 0 intersection vertices. Here we need only identify the inside/
		// 	 outside-ness of ts relative to tClip.
		// - 1 intersection vertex. Same as above.
		// - 2 intersection vertices. We need to traverse ints2 and generate
		// 	 output triangles. We also need to test for the case where the 
		// 	 segment doesn't actually lie on ts and only its extended line does.

		intLoc  = [];
		vertLoc = [];
		for (i = 0; i < ints2.length; i++) {
			if (ints2[i].u !== undefined) {
				intLoc.push(i);
			} else {
				vertLoc.push(i);
			}
		}

		if (intLoc.length < 2) {
			if (cross(sub(segment[1], segment[0]), 
				sub(ints2[vertLoc[0]].xy, segment[1])) > 0) {
				toReturn.inside = [ts];
			} else {
				toReturn.outside = [ts];
			}

			return toReturn;
		} else if (intLoc.length == 2) {

			u1 = ints2[intLoc[0]].u;
			u2 = ints2[intLoc[1]].u;

			if ((u1 < tol && u2 < tol) || (u1 > 1 + tol && u2 > 1 + tol)) {
				toReturn.inside = [ts];

				return toReturn;
			}

			// Determine the start and end coords of the intersection segment.
			if (u1 < u2) {
				start = intLoc[0];
				end = intLoc[1];
			} else {
				start = intLoc[1];
				end = intLoc[0];
			}

			// Traverse the outside region.
			// Check that the outside region is not degenerate (not consecutive)
			if (end != (start + 1) % ints2.length) {

				i = start;
				tri = [];
				while (true) {
					tri.push(ints2[i].xy);

					if (tri.length == 3) {
						toReturn.outside.push(tri);
						tri = [ints2[start].xy, ints2[i].xy];
					}

					if (i == end) break;

					i = (i + 1) % ints2.length;
				}

			}

			// Traverse the inside region.
			i = end;
			tri = [];
			while (true) {
				tri.push(ints2[i].xy);

				if (tri.length == 3) {
					toReturn.inside.push(tri);
					tri = [ints2[end].xy, ints2[i].xy];
				}

				if (i == start) break;

				i = (i + 1) % ints2.length;
			}

			return toReturn;

		} else if (intLoc.length > 2) {
			throw "More than two intersection generated.";
		}

	};

	VF.Util.triClip = function(tSubj, tClip) {
		// tSubj, tClip must be ccw wrapped triangles.

		var s, toReturn, subjectClip, subjects, nextSubjects, i_c, segment, clipped;

		// tSubj = copyTriangle(tSubj);
		// tClip = copyTriangle(tClip);

		// Set the return value for the case with no intersections.
		// subject is a set of triangles, the union of which equals tSubj - tClip.
		// both is a set of triangles, the union of which equals tSubj intersect tClip.
		toReturn = {
			subject: [tSubj], 
			both: []
		};

		if (!bbsOverlap(tSubj, tClip)) {
			return toReturn;
		}

		subjectClip = [];
		subjects = [tSubj];
		for (i_c = 0; i_c < 3; i_c++) {

			// The segment we'll be using to clip.
			segment = [tClip[i_c], tClip[(i_c + 1) % 3]];

			nextSubjects = [];

			// For each triangle the segment could possibly intersect with,
			for (s = 0; s < subjects.length; s++) {
				// Compute the triangles resulting from clipping the subject
				// with the clip segment.
				clipped = VF.Util.triSegClip(subjects[s], tClip, i_c);

				// The clipped triangles that fall outside the clip triangle
				// need not be processed further. Simply save them. 
				Array.prototype.push.apply(subjectClip, clipped.outside);
				
				// Add them to the list of triangles to intersect next.
				Array.prototype.push.apply(nextSubjects, clipped.inside);
			}

			// Set the triangles to clip with the next segment to the 
			// interior ones we've accumulated.
			subjects = nextSubjects;
		}

		// Set return values.
		toReturn.subject = subjectClip;
		toReturn.both 	 = subjects;

		return toReturn;
	};

	var oneManyClip = function(TSubj, tClip) {
		// TSubj is an array of triangles, tClip is single triangle.

		var toReturn, i_s, clipped;

		toReturn = {
			subject : [],
			both : []
		};

		for (i_s = 0; i_s < TSubj.length; i_s++) {
			clipped = VF.Util.triClip(TSubj[i_s], tClip);

			Array.prototype.push.apply(toReturn.subject, clipped.subject);
			Array.prototype.push.apply(toReturn.both, clipped.both);
		}

		return toReturn;
	}

	VF.Util.crossClip = function(TSubj, TClip) {
		// Given two flat triangulations, compute overlap triangulation.

		var i_c, i_s, clipped, newT, subject, Tout, newSubject, omClip;

		// Make a soft copy of TSubj
		subject = TSubj.slice();
		Tout = [];

		newT = [];

		for (i_c = 0; i_c < TClip.length; i_c++) {
			newSubject = [];
			omClip = oneManyClip(subject, TClip[i_c]);

			Array.prototype.push.apply(Tout, omClip.both);

			subject = omClip.subject;

		}

		Array.prototype.push.apply(Tout, subject);

		return Tout;

	}

	VF.Util.flattenTriangulation = function(T) {
		// Given a triangulation with possibly-overlapping triangles,
		// produce a flat indexed triangulation that preserves all triangles.


	}

})();