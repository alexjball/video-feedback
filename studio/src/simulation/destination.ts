import {
  Color,
  ShaderMaterial,
  ShaderMaterialParameters,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"
import {
  applyMirroring,
  baseVertexShader,
  colorConversion,
  constants,
  encodeDecodeDepth,
  minStrobeDepth,
  noise,
  processColor
} from "./shader"

export default class Destination {
  private targets = {
    color: new ShaderMaterial(colorShader),
    depth: new ShaderMaterial(depthShader)
  }
  private fsQuad = new FullScreenQuad(this.targets.color)

  updateUniforms = (uniforms: any) =>
    [this.targets.color.uniforms, this.targets.depth.uniforms].forEach(shaderUniforms =>
      Object.entries(uniforms).forEach(([k, v]) => {
        const curr = shaderUniforms[k]
        if (v !== undefined && v !== null && curr) {
          if (curr.value instanceof Color && typeof v === "string") {
            v = new Color(v)
          }
          shaderUniforms[k].value = v
        }
      })
    )

  render({
    renderer,
    source,
    depth,
    destination,
    prevDestination,
    seed,
    type = "color"
  }: {
    renderer: WebGLRenderer
    destination: WebGLRenderTarget
    prevDestination?: WebGLRenderTarget
    source: WebGLRenderTarget
    depth?: WebGLRenderTarget
    seed?: WebGLRenderTarget
    type?: keyof InstanceType<typeof Destination>["targets"]
  }) {
    const material = this.targets[type]
    material.uniforms.source.value = source.texture
    if (prevDestination) {
      material.uniforms.prevDestination.value = prevDestination.texture
    }
    if (depth) {
      material.uniforms.depth.value = depth.texture
    }
    if (seed) {
      material.uniforms.seed.value = seed.texture
    }
    material.uniformsNeedUpdate = true
    this.fsQuad.material = material

    renderer.setRenderTarget(destination)
    this.fsQuad.render(renderer)
  }

  dispose() {
    this.fsQuad.dispose()
    Object.values(this.targets).forEach(t => t.dispose())
  }
}

const colorShader: ShaderMaterialParameters = {
  uniforms: {
    source: { value: null },
    depth: { value: null },
    preventStrobing: { value: false },
    mirrorX: { value: false },
    mirrorY: { value: false },
    invertColor: { value: false },
    colorGain: { value: 0.0 },
    colorCycle: { value: 0.0 },
    fsPeriod: { value: 0.1 },
    fsAmplitude: { value: 0.1 },
    fsPhase: { value: 0 },
    fsPop: { value: 0 },
    fsColor1: { value: new Color(0, 0, 0) },
    fsColor2: { value: new Color(1, 1, 1) },
    seed: { value: null },
    seedOpacity: { value: 0.0 }
  },

  vertexShader: baseVertexShader,

  fragmentShader: /* glsl */ `
    uniform float fsPeriod;
    uniform float fsAmplitude;
    uniform float fsPhase;
    uniform float fsPop;
    uniform float seedOpacity;
    uniform vec3 fsColor1;
    uniform vec3 fsColor2;

    uniform bool mirrorX;
    uniform bool mirrorY;
    uniform bool invertColor;
    uniform float colorGain;
    uniform float colorCycle;
    uniform bool preventStrobing;
    uniform sampler2D source;
    uniform sampler2D seed;
    uniform sampler2D depth;
    varying vec2 vUv;

    ${processColor}
    ${colorConversion}
    ${encodeDecodeDepth}
    ${applyMirroring}
    ${noise}
    ${constants}

    void main() {
      vec2 uv = vUv;
      applyMirroring(uv, mirrorX, mirrorY);

      vec4 depthColor = texture2D(depth, uv);
      vec3 dec = decode(depthColor);
      bool settled = dec.x > 0.;
      float depth = dec.y;

      vec4 color = texture2D(source, uv);
      if (!preventStrobing || depth < ${minStrobeDepth} || settled) {
        processColor(color, colorGain, colorCycle, invertColor);
      } else {
        vec3 dc = normalize(fsColor2 - fsColor1), 
            c = color.xyz,
            pop = hsv2rgb(vec3(mod(distance(vUv, vec2(0.4, 0.6)) * 2. / (fsPeriod * 10.), 1.), 1., 1.)),
            shift = sin(vUv.xxx * PI2 / fsPeriod + PI2 * fsPhase);
        vec4 seedColor = texture2D(seed, vUv);
        
        // TODO: apply opacity to seed, default to transparent
        c += fsAmplitude * (shift * dc + fsPop * pop + seedOpacity * seedColor.a * seedColor.rgb);

        color.xyz = clamp(c, min(fsColor1, fsColor2), max(fsColor1, fsColor2));
      }

      gl_FragColor = color;
    }`
}

const depthShader: ShaderMaterialParameters = {
  uniforms: {
    source: { value: null },
    prevDestination: { value: null },
    mirrorX: { value: false },
    mirrorY: { value: false }
  },

  vertexShader: baseVertexShader,

  fragmentShader: /* glsl */ `
    uniform bool mirrorX;
    uniform bool mirrorY;
    uniform sampler2D source;
    uniform sampler2D prevDestination;
    varying vec2 vUv;

    ${encodeDecodeDepth}
    ${applyMirroring}

    void main() {
      vec2 uv = vUv;
      applyMirroring(uv, mirrorX, mirrorY);
      
      vec4 color = texture2D(source, uv);
      vec3 curr = decode(color);

      vec4 prevColor = texture2D(prevDestination, vUv);
      vec3 prev = decode(prevColor);

      float depth = round(curr.y + 1.);
      float label = round(curr.z);
      bool settled = depth == round(prev.y) && label == round(prev.z);

      gl_FragColor = encode(vec3(settled, depth, label));
    }`
}
