import { MeshBasicMaterial, WebGLRenderer, WebGLRenderTarget } from "three"
import { SimulationView } from "./views"
import { WorkQueue } from "./work"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

// TODO: use a worker to copy and convert frames
// TODO: ensure that frames are not modieifed or disposed while copying
// TOOD: Implement resizing
export class Converter {
  canvas = new OffscreenCanvas(0, 0)
  context = this.canvas.getContext("2d")!
  transferBuffer = new ImageData(1024, 1024)
  resizeBuffer = new WebGLRenderTarget(0, 0)
  material = new MeshBasicMaterial()
  fsQuad = new FullScreenQuad(this.material)

  work: WorkQueue
  view: SimulationView

  constructor(work: WorkQueue, view: SimulationView) {
    this.work = work
    this.view = view
  }

  convert = (resizeHeight?: number, resizeWidth?: number) =>
    this.work.push(renderer => {
      const fullSize = this.view.feedback.currentFrame,
        aspect = fullSize.width / fullSize.height,
        height = resizeHeight ?? fullSize.height,
        width = resizeWidth ?? Math.round(height * aspect)

      this.canvas.width = width
      this.canvas.height = height

      let target: WebGLRenderTarget
      if (width === fullSize.width && height === fullSize.height) {
        target = fullSize
      } else {
        this.resize(renderer, fullSize, width, height)
        target = this.resizeBuffer
      }

      this.copyToCanvas(renderer, target)
      return this.canvas.convertToBlob()
    })

  resize(renderer: WebGLRenderer, source: WebGLRenderTarget, width: number, height: number) {
    this.resizeBuffer.setSize(width, height)
    this.material.map = source.texture
    renderer.setRenderTarget(this.resizeBuffer)
    this.fsQuad.render(renderer)
  }

  /** Assumes target is the same size as the canvas  */
  // TODO: un-flip
  copyToCanvas(renderer: WebGLRenderer, target: WebGLRenderTarget) {
    let x = 0,
      y = 0,
      bw = this.transferBuffer.width,
      bh = this.transferBuffer.height,
      tw = target.width,
      th = target.height
    while (y < th) {
      x = 0
      while (x < tw) {
        const width = Math.min(tw - x, bw),
          height = Math.min(th - y, bh),
          size = 4 * width * height,
          transfer = new Uint8ClampedArray(this.transferBuffer.data.buffer, 0, size),
          data = new ImageData(transfer, width, height)

        renderer.readRenderTargetPixels(target, x, y, width, height, transfer)
        this.context.putImageData(data, x, y, 0, 0, width, height)
        x += bw
      }
      y += bh
    }
  }
}
