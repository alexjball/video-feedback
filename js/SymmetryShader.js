/**
 * Symmetry Shader
 *
 * mirrorDir: direction(s) in which to reflect texture. Bitwise or of
 * defines.MIR_X and defines.MIR_Y.
 * inversionDir: direction(s) in which to invert texture. Bitwise or of
 * defines.INV_X and defines.INV_Y.
 *
 * Note that inversion is redundant if mirroring is done in the same direction
 */

SymmetryShader = {

	uniforms: {

		"tDiffuse"   : { type: "t", value: null },
		"mirrorX"    : { type: "i", value: 0 },
		"mirrorY"    : { type: "i", value: 0 },
		"invertX" 	 : { type: "i", value: 0 },
		"invertY"	 : { type: "i", value: 0 },
		"diagNW" 	 : { type: "i", value: 0 },
		"diagNE" 	 : { type: "i", value: 0 }

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
		"uniform int mirrorX;",
		"uniform int mirrorY;",
		"uniform int invertX;",
		"uniform int invertY;",
		"uniform int diagNW;",
		"uniform int diagNE;",

		
		"varying vec2 vUv;",

		"void main() {",

			"vec2 p = vUv;",

			"float xDiv = 1.1;",
			"float yDiv = 1.1;",

			"if (invertX > 0) xDiv = -0.1;",
			"if (invertY > 0) yDiv = -0.1;",

			"if (mirrorX > 0) xDiv = 0.5;",
			"if (mirrorY > 0) yDiv = 0.5;",

			"if (p.x >= xDiv) p.x = 1.0 - p.x;",
			"if (p.y >= yDiv) p.y = 1.0 - p.y;",

			"if (diagNW > 0 && p.y > 1.0 - p.x) {",
			"	yDiv = p.y + p.x - 1.0;",
			"	p.y -= yDiv;",
			"	p.x -= yDiv;",
			"}",

			"if (diagNE > 0 && p.y < p.x) {",
			"	yDiv = p.x - p.y;",
			"	p.y += yDiv;",
			"	p.x -= yDiv;",
			"}",

			"vec4 color = texture2D(tDiffuse, p);",
			"gl_FragColor = color;",

		"}"

	].join("\n")

};
