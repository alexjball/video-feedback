/**
 * Color Increment Shader
 * 
 * This increments the R component of each pixel by 2^-8.
 */

RayTracingShader = (function() {

	var maxDepth = 30;

	// var initialColors = [];
	// for (var i = 0; i < maxDepth; i++) {
	// 	initialColors[i] = new THREE.Vector3(Math.random(), Math.random(), Math.random());
	// }

	return {

		defines: {
			MAX_DEPTH : maxDepth,
			MAX_LAYERS : maxDepth + 1
		},

		uniforms: {
			tDiffuse : { type: "t", value: null },
			inverseViewMatrix : { type: "m4", value: new THREE.Matrix4() },
			layerSpacing : { type: "1f", value: 0.5 },
			resolution : { type: "v2", value: new THREE.Vector2() },
			projection : { type: "v2", value: new THREE.Vector2() },
			portalWidthHeight : { type: "v2", value: new THREE.Vector2() },
			// layerColors : { type: "v3v", value: initialColors }
		},

		vertexShader: [
			"void main() {",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"}"
		].join("\n"),

		fragmentShader: `

precision highp float;

uniform mat4 inverseViewMatrix;
uniform sampler2D tDiffuse;
uniform float layerSpacing;
uniform vec2 resolution;
// {aspect, distance from eye to sampling plane}
uniform vec2 projection;
uniform vec2 portalWidthHeight;
uniform sampler2D layerColors;

vec4 getColorFromDepth(int depth) {
	return vec4(vec3(1, 1, 1) * float(depth + 1) / float(MAX_LAYERS), 1);
}

int getDepth(vec2 st) {
	vec4 color = texture2D(tDiffuse, st);
	return int(floor(color.r * 256.0 + 0.5));
}

int getIntersectionDepth(vec4 eye, vec2 dstdz, float dir) {
	int topLayer = int(max(floor(-eye.z), -1.0));
	if (dir == 0.0 || (dir == 1.0 && topLayer == -1)) {
		return topLayer;
	}
	int increment = -int(dir);
	int i;
	int end;
	if (dir == 1.0) {
		i = topLayer;
		end = -1;
	} else {
		i = topLayer + 1;
		end = MAX_DEPTH + 1;
	}
	vec2 texCoord;
	for (int j = 0; j <= MAX_DEPTH; j++) {
		if (i == end) {
			return end;
		}
		texCoord = eye.st + dstdz * (-layerSpacing * float(i) - eye.z); 
		if (texCoord.s < 0.0 
				|| texCoord.s > 1.0 
				|| texCoord.t < 0.0 
				|| texCoord.t > 1.0
				|| getDepth(texCoord) <= i) {
			return i;
		}
		i += increment;
	}
	return end;
}

void main() {
	// Compute ray in view space
	vec4 eye = vec4(0, 0, 0, 1);
	vec4 dir = vec4(
		(-0.5 + (gl_FragCoord.xy / resolution)) * vec2(projection.x, 1), 
		-projection.y, 
		1);

	// Transform ray to xyz world space
	eye = inverseViewMatrix * eye;
	dir = inverseViewMatrix * dir;

	// Transform ray to stz world space
	eye.xy = eye.xy / portalWidthHeight + 0.5;
	dir.xy = dir.xy / portalWidthHeight + 0.5;

	dir.xyz = dir.xyz - eye.xyz;
	
	vec2 dstdz = vec2(dir.x / dir.z, dir.y / dir.z);

	gl_FragColor = getColorFromDepth(getIntersectionDepth(eye, dstdz, sign(dir.z)));
} 

`};
})();