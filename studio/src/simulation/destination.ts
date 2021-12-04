import { ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

const shader = {
  uniforms: {
    tDiffuse: { value: null },
    mirrorX: { value: false },
    mirrorY: { value: false }
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
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      if (mirrorX && vUv.x > 0.5) {
        uv.x = 1.0 - vUv.x;
      }
      if (mirrorY && vUv.y > 0.5) {
        uv.y = 1.0 - vUv.y;
      }
      gl_FragColor = texture2D( tDiffuse, uv );
    }`
}

export default class Destination {
  private material
  private fsQuad

  constructor() {
    this.material = new ShaderMaterial(shader)
    this.fsQuad = new FullScreenQuad(this.material)
  }

  updateUniforms(uniforms: { mirrorX?: boolean; mirrorY?: boolean }) {
    Object.entries(uniforms).forEach(([k, v]) => (this.material.uniforms[k].value = v))
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
