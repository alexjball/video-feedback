import { ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"
import {
  baseVertexShader,
  processColor,
  encodeDecodeDepth,
  applyMirroring,
  minStrobeDepth
} from "./shader"

export default class Destination {
  private targets = {
    color: new ShaderMaterial(colorShader),
    depth: new ShaderMaterial(depthShader)
  }
  private fsQuad = new FullScreenQuad(this.targets.color)

  updateUniforms = (uniforms: {
    mirrorX?: boolean
    mirrorY?: boolean
    invertColor?: boolean
    colorGain?: number
    colorCycle?: number
  }) =>
    [this.targets.color.uniforms, this.targets.depth.uniforms].forEach(shaderUniforms =>
      Object.entries(uniforms).forEach(([k, v]) => {
        if (v !== undefined && v !== null && shaderUniforms[k]) shaderUniforms[k].value = v
      })
    )

  render({
    renderer,
    source,
    depth,
    destination,
    prevDestination,
    type = "color"
  }: {
    renderer: WebGLRenderer
    destination: WebGLRenderTarget
    prevDestination?: WebGLRenderTarget
    source: WebGLRenderTarget
    depth?: WebGLRenderTarget
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

const colorShader = {
  uniforms: {
    source: { value: null },
    depth: { value: null },
    preventStrobing: { value: false },
    mirrorX: { value: false },
    mirrorY: { value: false },
    invertColor: { value: false },
    colorGain: { value: 0.0 },
    colorCycle: { value: 0.0 }
  },

  vertexShader: baseVertexShader,

  fragmentShader: /* glsl */ `
    uniform bool mirrorX;
    uniform bool mirrorY;
    uniform bool invertColor;
    uniform float colorGain;
    uniform float colorCycle;
    uniform bool preventStrobing;
    uniform sampler2D source;
    uniform sampler2D depth;
    varying vec2 vUv;

    ${processColor}
    ${encodeDecodeDepth}
    ${applyMirroring}

    void main() {
      vec2 uv = vUv;
      applyMirroring(uv, mirrorX, mirrorY);

      vec4 depthColor = texture2D(depth, uv);
      vec3 dec = decode(depthColor);

      vec4 color = texture2D(source, uv);
      if (!preventStrobing || dec.y < ${minStrobeDepth} || dec.x != 0.) {
        processColor(color, colorGain, colorCycle, invertColor);
      }

      gl_FragColor = color;
    }`
}

const depthShader = {
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
