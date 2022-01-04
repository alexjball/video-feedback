import { Mesh, MeshBasicMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

export default class Resizer {
  canvas = new OffscreenCanvas(0, 0)
  context = this.canvas.getContext("2d")!
  transferBuffer = new ImageData(1024, 1024)
  resizeBuffer = new WebGLRenderTarget(0, 0)
  material = new MeshBasicMaterial()
  fsQuad

  constructor() {
    const quad = new FullScreenQuad(this.material),
      mesh: Mesh = (quad as any)._mesh

    // The 2d and webgl contexts use opposite conventions for the vertical axis.
    // Flip the texture so the image ends up upright in the 2d canvas.
    mesh.scale.y = -1.0
    mesh.updateMatrixWorld()

    this.fsQuad = quad
  }

  convert = (
    renderer: WebGLRenderer,
    fullSize: WebGLRenderTarget,
    resizeHeight?: number,
    resizeWidth?: number
  ) => {
    const aspect = fullSize.width / fullSize.height,
      height = resizeHeight ?? fullSize.height,
      width = resizeWidth ?? Math.round(height * aspect)

    this.canvas.width = width
    this.canvas.height = height

    this.resizeBuffer.texture.flipY = false
    this.resize(renderer, fullSize, width, height)
    this.copyToCanvas(renderer, this.resizeBuffer)
    this.resizeBuffer.setSize(0, 0)

    return this.canvas.convertToBlob()
  }

  resize(renderer: WebGLRenderer, source: WebGLRenderTarget, width: number, height: number) {
    this.resizeBuffer.setSize(width, height)
    this.material.map = source.texture
    renderer.setRenderTarget(this.resizeBuffer)
    this.fsQuad.render(renderer)
  }

  /** Assumes source is the same size as the canvas  */
  // TODO: un-flip
  copyToCanvas(renderer: WebGLRenderer, source: WebGLRenderTarget) {
    let x = 0,
      y = 0,
      bw = this.transferBuffer.width,
      bh = this.transferBuffer.height,
      tw = source.width,
      th = source.height
    while (y < th) {
      x = 0
      while (x < tw) {
        const width = Math.min(tw - x, bw),
          height = Math.min(th - y, bh),
          size = 4 * width * height,
          transfer = new Uint8ClampedArray(this.transferBuffer.data.buffer, 0, size),
          data = new ImageData(transfer, width, height)

        renderer.readRenderTargetPixels(source, x, y, width, height, transfer)
        this.context.putImageData(data, x, y, 0, 0, width, height)
        x += bw
      }
      y += bh
    }
  }
}
