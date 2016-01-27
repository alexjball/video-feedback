
function drawTriangles(T, style) {
	ctx.beginPath();
	ctx.strokeStyle = style;

	var i, j, t;
	for (i = 0; i < T.length; i++) {
		t = T[i];
		ctx.moveTo(t[0][0], t[0][1]);

		for (j = 0; j < 3; j++) {
			ctx.lineTo(t[(j + 1) % 3][0], t[(j + 1) % 3][1]);
		}

		ctx.stroke();
	}
}

tSubj = [[[200, 50], [10, 200], [10, 10]]];
tClip = [[[100, 50], [50, 100], [5, 30]]];
tClip2 =  [[[200, 100], [30, 150], [30, 30]], 
		   [[30, 30], [100, 10], [200, 100]]];

// canvas = document.getElementById("canvas1");
// ctx = canvas.getContext("2d");

// drawTriangles(tSubj, 'green', ctx);
// drawTriangles(tClip, 'blue', ctx);

// clipped2 = VF.Util.triClip(tClip[0], tSubj[0]);
// drawTriangles(clipped2.subject, 'orange', ctx);
// drawTriangles(clipped2.both, 'red', ctx);

canvas = document.getElementById("canvas2");
ctx = canvas.getContext("2d");

clipped = VF.Util.triClip(tSubj[0], tClip[0]);

allc = Array.prototype.concat.call(clipped.subject, clipped.both);

function test(N, a, b) {
	now = performance.now();
	var out;
	for (i = 0; i < N; i++) {
		out = VF.Util.crossClip(a, b);
	}
	now2 = performance.now();

	console.log(now2 - now);
	console.log((now2 - now) / N);

	return out;
}

T3 = VF.Util.crossClip(tClip2, allc);
T4 = VF.Util.crossClip(allc, tClip2);

drawTriangles(T3, 'blue', ctx);
drawTriangles(tClip2, 'cyan', ctx);

// drawTriangles(clipped.subject, 'orange', ctx);
// drawTriangles(clipped.both, 'red', ctx);

function equiv(a, b) {
	return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 1e-9;
}

// Array.prototype.push.apply(T3, T3);

done = new Array(T3.length);
matched_groups = new Array(T3.length);
for (i = 0; i < T3.length; i++) {
	if (done[i]) continue;

	matched_groups[i] = [];

	for (j = i; j < T3.length; j++) {
		matched = [false, false, false];
		for (a = 0; a < 3; a++) {
			for (b = 0; b < 3; b++) {
				if (equiv(T3[i][a], T3[j][b]) && !matched[b]) {
					matched[b] = true;
				}
			}
		}
		if (matched.every(function(x) {return x})) {
			done[j] = true;
			matched_groups[i].push(j);
		}
	}
}