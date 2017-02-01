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
			MAX_DEPTH : maxDepth
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
// uniform vec3 layerColors[MAX_DEPTH];

vec4 getColorFromDepth(int depth) {
	// return vec4(layerColors[depth], 1);
	return vec4(vec3(1, 1, 1) * float(depth) / float(MAX_DEPTH), 1);
}

int getDepth(vec2 st) {
	vec4 color = texture2D(tDiffuse, st);
	return int(floor(color.r * 256.0 + 0.5));
}

int getIntersectionDepth(vec4 eye, vec2 dstdz) {
	vec2 texCoord;
	for (int i = 0; i <= MAX_DEPTH; i++) {
		texCoord = eye.st + dstdz * (-layerSpacing * float(i) - eye.z); 
		if (texCoord.s < 0.0 
				|| texCoord.s > 1.0 
				|| texCoord.t < 0.0 
				|| texCoord.t > 1.0
				|| getDepth(texCoord) <= i) {
			return i;
		}
	}
	return MAX_DEPTH + 1;
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

	gl_FragColor = getColorFromDepth(getIntersectionDepth(eye, dstdz));
} 

`};
})();