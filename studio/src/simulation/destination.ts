import { ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

const processColor = /* glsl */ `
  void processColor(inout vec4 color, float gain, float cycle, bool invert) {
    if (gain > 0.0) {
      float gainStep = gain * 0.25;
      float med = color.x * 0.299 + color.y * 0.587 + color.z * 0.114;
      color.x = med + (color.x - med) * (1.0 + gainStep);
      color.y = med + (color.y - med) * (1.0 + gainStep);
      color.z = med + (color.z - med) * (1.0 + gainStep);
      if (color.x < 0.0) {
        color.x = 0.0;
      } else if (color.x > 1.0) {
        color.x = 1.0;
      }
      if (color.y < 0.0) {
        color.y = 0.0;
      } else if (color.y > 1.0) {
        color.y = 1.0;
      }
      if (color.z < 0.0) {
        color.z = 0.0;
      } else if (color.z > 1.0) {
        color.z = 1.0;
      }
    }
    if (cycle > 0.0) {
      float Q1 = sin(cycle * 1.57) / 1.73;
      float Q2 = (1.0 - cos(cycle * 1.57)) / 3.0;
      float r1 = Q2 * (color.y - color.x - color.x + color.z) -
                Q1 * (color.z - color.y) + color.x;
      float z =
          Q2 * (color.z - color.y - color.x + color.z) + Q1 * (color.y - color.x);
      color.y += z + (color.x - r1);
      color.z -= z;
      color.x = r1;
    }
    if (invert) color.xyz = vec3(1.0, 1.0, 1.0) - color.xyz;
  }`

const shader = {
  uniforms: {
    tDiffuse: { value: null },
    mirrorX: { value: false },
    mirrorY: { value: false },
    invertColor: { value: false },
    colorGain: { value: 0.0 },
    colorCycle: { value: 0.0 }
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: /* glsl */ `
    uniform bool mirrorX;
    uniform bool mirrorY;
    uniform bool invertColor;
    uniform float colorGain;
    uniform float colorCycle;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    ${processColor}

    void main() {
      vec2 uv = vUv;
      if (mirrorX && vUv.x > 0.5) uv.x = 1.0 - vUv.x;
      if (mirrorY && vUv.y > 0.5) uv.y = 1.0 - vUv.y;

      vec4 color = texture2D( tDiffuse, uv );
      processColor(color, colorGain, colorCycle, invertColor);
      gl_FragColor = color;
    }`
}

export default class Destination {
  private material
  private fsQuad

  constructor() {
    this.material = new ShaderMaterial(shader)
    this.fsQuad = new FullScreenQuad(this.material)
  }

  updateUniforms(uniforms: {
    mirrorX?: boolean
    mirrorY?: boolean
    invertColor?: boolean
    colorGain?: number
    colorCycle?: number
  }) {
    Object.entries(uniforms).forEach(([k, v]) => {
      if (v !== undefined && v !== null) this.material.uniforms[k].value = v
    })
  }

  render(
    renderer: WebGLRenderer,
    destinationFrame: WebGLRenderTarget,
    sourceFrame: WebGLRenderTarget
  ) {
    this.material.uniforms.tDiffuse.value = sourceFrame.texture
    this.material.uniformsNeedUpdate = true

    renderer.setRenderTarget(destinationFrame)
    this.fsQuad.render(renderer)
  }
}
