import { WebGLRenderer, WebGLRenderTarget } from "three"

/** Computes whether all pixels in a feedback frame are settled */
export default class Settler {
  compute(renderer: WebGLRenderer, depthFrame: WebGLRenderTarget) {
    return false
  }
}
