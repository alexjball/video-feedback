import {
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget
} from "three"
import { containInside } from "../camera"
import type Feedback from "./feedback"
import { baseVertexShader, colorConversion, encodeDecodeDepth, minStrobeDepth } from "./shader"

export default class DepthView {
  private view
  private feedback
  private material
  private depth?: WebGLRenderTarget

  constructor(feedback: Feedback) {
    this.feedback = feedback
    this.material = new ShaderMaterial(depthShader)
    this.view = new Mesh(new PlaneGeometry(1, 1), this.material)
  }

  setDepthTarget(depth: WebGLRenderTarget) {
    this.depth = depth
  }

  /** Render depth in the bottom left corner, call at the end of a frame so it's
   * drawn on top */
  render(renderer: WebGLRenderer) {
    if (!this.depth) return

    const view = this.view,
      viewer = this.feedback.view.viewer,
      width = this.depth.width,
      height = this.depth.height,
      viewSize = containInside(width, height, 0.25),
      llCorner = viewer.localToWorld(new Vector3(-0.5, -0.5, 1))

    view.material.uniforms.destination.value = this.depth.texture
    view.material.uniformsNeedUpdate = true
    view.scale.set(viewSize.width, viewSize.height, 1)
    view.position.x = llCorner.x + viewSize.width / 2
    view.position.y = llCorner.y + viewSize.height / 2
    view.updateMatrixWorld()

    renderer.autoClear = false
    renderer.setRenderTarget(null)
    renderer.render(this.view, viewer)
    renderer.autoClear = true
  }
}

const depthShader = {
  uniforms: {
    destination: { value: null }
  },

  vertexShader: baseVertexShader,

  fragmentShader: /* glsl */ `
    uniform sampler2D destination;
    varying vec2 vUv;

    ${encodeDecodeDepth}
    ${colorConversion}

    float getLightness(float depth) {
      float inflection = ${minStrobeDepth}, limit = 250.;
      // Subtract off 1 from depth since most patterns start with depth 1.
      depth = max(0., depth - 1.);

      if (depth < inflection) {
        return  0.4 + 0.35 * depth / inflection;
      } else {
        return 0.75 + 0.25 * clamp(depth - inflection, 0., limit) / limit;
      }
    }

    void main() {  
      vec3 dec = decode(texture2D(destination, vUv));
      bool settled = dec.x > 0.;
      float depth = dec.y;
      int label = int(round(dec.z));

      float hue = settled || depth < ${minStrobeDepth} ? 0. : 0.5, 
          saturation = 0.6, 
          lightness = getLightness(depth);
      
      if (label == 1) {
        hue += 0.05;
      } else if (label == 2) {
        hue += 0.1;
      } else {
        hue += 0.15;
      }

      gl_FragColor = vec4(hsl2rgb(vec3(hue, saturation, lightness)), 1.);
    }`
}
