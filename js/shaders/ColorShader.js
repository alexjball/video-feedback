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
		"gain"    : { type: "f", value: 0.5 },
		"invertColor" : { type: "i", value: 0 },
        "colorCycle" : { type: "f", value: 0.5 }

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
        "uniform float colorCycle;",
		
		"varying vec2 vUv;",

		"void main() {",

        "vec4 color = texture2D(tDiffuse, vUv);",
               
        // LN: changed the way gain works. if you don't like it then we can change it back, but color saturation looks pretty cool
        "if (gain > 0.0) {",
            "float gainStep = gain * 0.25;",
            // coefficients here can be anything that sum to one; this is used for human eye reasons apparently
            // gain is attenuated by 0.25 because otherwise one color saturates and color cycling stops working
            "float med = color.x * 0.299 + color.y * 0.587 + color.z * 0.114;",
            "color.x = med + (color.x - med) * (1.0 + gainStep);",
            "color.y = med + (color.y - med) * (1.0 + gainStep);",
            "color.z = med + (color.z - med) * (1.0 + gainStep);",
                     
            "if (color.x < 0.0) {",
                "color.x = 0.0;",
            "}",
            "else if (color.x > 1.0) {",
                "color.x = 1.0;",
            "}",
                     
            "if (color.y < 0.0) {",
                "color.y = 0.0;",
            "}",
            "else if (color.y > 1.0) {",
                "color.y = 1.0;",
            "}",
                     
            "if (color.z < 0.0) {",
                "color.z = 0.0;",
            "}",
            "else if (color.z > 1.0) {",
                "color.z = 1.0;",
            "}",
        "}",
        
        // LN: added color cycle algo
        // right now colorCycle is attenuated by a factor of 4 (using 1.57 ~ pi/2 instead of 2pi) but it should probably depend on the number of visible "layers" instead. currently it cycles through three rainbows on refresh
        // colorCycle range: [0, 1]
            "if (colorCycle > 0.0) {",
                     "float Q1 = sin(colorCycle * 1.57) / 1.73;",
                     "float Q2 = (1.0 - cos(colorCycle * 1.57)) / 3.0;",
                     "float r1 = Q2 * (color.y - color.x - color.x + color.z) - Q1 * (color.z - color.y) + color.x;",
                     "float z  = Q2 * (color.z - color.y - color.x + color.z) + Q1 * (color.y - color.x);",
                     "color.y += z + (color.x - r1);",
                     "color.z -= z;",
                     "color.x = r1;",
            "}",

			// "color.xyz *= gain;",

			"if (invertColor > 0) color.xyz = vec3(1.0, 1.0, 1.0) - color.xyz;",

			"gl_FragColor = color;",

		"}"

	].join("\n")

};
