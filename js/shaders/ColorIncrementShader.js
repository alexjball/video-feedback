/**
 * Color Increment Shader
 * 
 * This increments the R component of each pixel by 2^-8.
 */

ColorIncrementShader = {

	uniforms: {
        "tDiffuse"     : { type: "t", value: null },
    },

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"
	].join("\n"),

	fragmentShader: [
        "precision highp float;",
		"uniform sampler2D tDiffuse;",
		"varying vec2 vUv;",
		"void main() {",
            "vec4 color = texture2D(tDiffuse, vUv);",
            "color.r = color.r + 1.0 / 256.0;",
            "gl_FragColor = color;",
		"}"
	].join("\n")

};
