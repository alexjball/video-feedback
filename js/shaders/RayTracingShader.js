/**
 * Ray tracing shader
 * 
 * This renders a texture representing iteration depth in 3d.
 */

RayTracingShader = (function() {

	var maxDepth = 30;
	var maxIterations = 30;
	var fogFactor = .1;

	return {

		defines: {
			MAX_DEPTH : maxDepth,
			MAX_ITERATIONS : maxIterations,
			FOG_FACTOR : fogFactor,
		},

		uniforms: {
			tDiffuse : { type: "t", value: null },
			inverseViewMatrix : { type: "m4", value: new THREE.Matrix4() },
			layerSpacing : { type: "1f", value: 0.5 },
			resolution : { type: "v2", value: new THREE.Vector2() },
			projection : { type: "v2", value: new THREE.Vector2() },
			portalWidthHeight : { type: "v2", value: new THREE.Vector2() },
			layerColors : { type: "t", value: null },
			layerColorsSize : { type: "1f", value: 1 },
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
uniform float layerColorsSize;

/** Convert a depth value to a color. depth is in the inverval [-1, inf) */
vec4 getColorFromDepth(int depth) {
	return texture2D(
		layerColors, 
		vec2(mod(float(depth + 1) + 0.5, layerColorsSize) / layerColorsSize, 0.0));
}

/** Get the depth of the feedback pattern according to the texture */
float getTextureDepth(vec2 st) {
	vec4 color = texture2D(tDiffuse, st);
	return color.r * 256.0;
}

/** Convert xy feedback space coords to st texture space coords. */
vec2 toTextureSpace(vec2 feedbackSpacePosition) {
	return feedbackSpacePosition / portalWidthHeight + 0.5;
}

/** 
 * Return the confidence in [0, 1] that the given xy position in feedback space
 * corresponds to the given depth. The confidence should be monotonically 
 * increasing with depth.
 */
float getDepthConfidence(vec2 position, int depth) {
	position = toTextureSpace(position);
	if (position.s < 0.0 
			|| position.s > 1.0 
			|| position.t < 0.0 
			|| position.t > 1.0) {
		return 1.0;
	} else {
		return 1.0 - clamp(getTextureDepth(position) - float(depth), 0.0, 1.0);
	}
}

/** Return the z-coord (in feedback-space) of the layer at the given depth. */
float getLayerZ(int depth) {
	return -layerSpacing * float(depth);
}

/** 
 * Return the depth of the closest layer with a larger z coordinate in 
 * feedback-space, or -1 if there is none.
 */
int getTopLayer(float z) {
	return int(max(floor(-z / layerSpacing), -1.0));
}

/**
 * Returns feedback-space intersection of a ray with the feedback pattern.
 * 
 * The algorithm loops through layers from start to end. When an intersection
 * between the ray and a layer is found, the intersection coordinates and 
 * layer depth are returned in layer and intersection. If the loop terminates
 * without finding an intersection, the last checked layer is treated as though
 * it intersected the ray. This occurs if the end layer is reached without 
 * finding an intersection or the loop exceeds MAX_ITERATIONS iterations 
 * without finding an intersection.
 * 
 * in eye point on ray in feedback-space
 * in dir normalized direction of ray in feedback-space
 * in start depth of the first layer to test for intersection
 * in end one after the last layer depth to test for intersection
 * out layer holds the depth of the layer the ray intersected with
 * out intersection holds the feedback-space location of the intersection of 
 * 	the ray with the feedback pattern. 
 */
void getLayerIntersection(
		vec3 eye, 
		vec3 dir, 
		int start, 
		int end, 
		out int layer, 
		out vec3 intersection) {
	intersection = vec3(0, 0, 0);
	layer = start;
	int increment = int(sign(float(end) - float(start)));
	vec2 dxydz = dir.xy / dir.z;
	for (int i = 0; i <= MAX_ITERATIONS + 1; i++) {
		intersection.z = getLayerZ(layer);
		intersection.xy = eye.xy + dxydz * (intersection.z - eye.z);
		
		if (layer == end 
				|| i == MAX_ITERATIONS 
				|| getDepthConfidence(intersection.xy, layer) > 0.5) {
			return;
		} else {
			layer += increment;
		}
	}
}

void intersectFeedback(
		vec3 eye,
		vec3 dir,
		out int layerDepth,
		out vec3 intersection) {
	int start;
	int end;
	float dirz = sign(dir.z);
	if (dirz == 1.0) {
		start = getTopLayer(eye.z);
		end = -1;
	} else if (dirz == -1.0) { 
		start = getTopLayer(eye.z) + 1;
		end = MAX_DEPTH + 1;
	} else { // dirz == 0.0 
		start = 0;
		end = 0;
	}
	getLayerIntersection(eye, dir, start, end, layerDepth, intersection);
}

vec4 applyFog(vec4 color, vec3 eye, vec3 target) {
	float fogAmount = 1.0 - exp(-distance(eye, target) * FOG_FACTOR);
    vec4 fogColor = vec4(0.5, 0.6, 0.7, 1.0);
    return mix(color, fogColor, fogAmount);
}

void main() {
	// Compute ray in view space
	vec4 eye = vec4(0, 0, 0, 1);
	vec4 dir = vec4(
		(-0.5 + (gl_FragCoord.xy / resolution)) * vec2(projection.x, 1), 
		-projection.y, 
		1);

	// Transform ray to xyz world space (== feedback space right now)
	eye = inverseViewMatrix * eye;
	dir = inverseViewMatrix * dir;

	dir.xyz = normalize(dir.xyz - eye.xyz);
	
	vec3 intersection;
	int layerDepth;

	intersectFeedback(eye.xyz, dir.xyz, layerDepth, intersection);

	gl_FragColor = applyFog(getColorFromDepth(layerDepth), eye.xyz, intersection.xyz);
} 

`};
})();