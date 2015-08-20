/**
 * Color Shader
 *
 * mirrorDir: direction(s) in which to reflect texture. Bitwise or of
 * defines.MIR_X and defines.MIR_Y.
 * inversionDir: direction(s) in which to invert texture. Bitwise or of
 * defines.INV_X and defines.INV_Y.
 *
 * Note that inversion is redundant if mirroring is done in the same direction
 */

ColorShader = {

	uniforms: {

		"tDiffuse"     : { type: "t", value: null },
		"gain"    : { type: "f", value: 1 },
		"invertColor" : { type: "i", value: 0 },
        "colorStep" : {type: "f", value: 0.0}

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform sampler2D tDiffuse;",
		"uniform float gain;",
		"uniform int invertColor;",
        "uniform float colorStep;",
		
		"varying vec2 vUv;",

		"void main() {",

			"vec4 color = texture2D(tDiffuse, vUv);",
            
            "if (colorStep > 0.0) {",
                "float Q1 = sin(colorStep * 6.28) / 1.73;",
                "float Q2 = (1.0 - cos(colorStep * 6.28)) / 3.0;",
                "float r1 = Q2 * (color.y - color.x - color.x + color.z) - Q1 * (color.z - color.y) + color.x;",
                "float z  = Q2 * (color.z - color.y - color.x + color.z) + Q1 * (color.y - color.x);",
                "color.y += z + (color.x - r1);",
                "color.z -= z;",
                "color.x = r1;",
            "}",

			"color.xyz *= gain;",

			"if (invertColor > 0) color.xyz = vec3(1.0, 1.0, 1.0) - color.xyz;",

			"gl_FragColor = color;",

		"}"

	].join("\n")

};
