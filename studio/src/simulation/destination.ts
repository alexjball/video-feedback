import { ShaderMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

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
  }`,
  applyMirroring = /* glsl */ `
    void applyMirroring(inout vec2 uv, bool mirrorX, bool mirrorY) {
      if (mirrorX && vUv.x > 0.5) uv.x = 1.0 - vUv.x;
      if (mirrorY && vUv.y > 0.5) uv.y = 1.0 - vUv.y;
    }`,
  /**
   * Packs pixel depth, source label, and settled bit into one RGB pixel. The
   * settled bit is the MSB of r. label is the other 7 bits. Depth is g + b. a
   * is 1.
   */
  encodeDecodeDepth = /* glsl */ `
    vec4 encode(vec3 settledDepthLabel) {
      bool settled = settledDepthLabel.x != 0.;
      int depth = int(round(settledDepthLabel.y));
      int label = int(round(settledDepthLabel.z));

      return vec4(round((settled ? 128. : 0.) + float(label)), depth >> 8, depth & 255, 1.) / 255.;
    }  
    vec3 decode(vec4 color) {
      vec4 enc = color * 255.;
      int r = int(round(enc.r));
      bool settled = (r >> 7) == 1;
      int label = r & 127;
      int depth = int(round(256. * enc.g + enc.b));
      return vec3(settled ? 1. : 0., float(depth), float(label));
    }`,
  baseVertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`

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
      if (!preventStrobing || dec.y < 15. || dec.x != 0.) {
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
