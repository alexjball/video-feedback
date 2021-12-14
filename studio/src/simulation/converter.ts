import { WebGLRenderer, WebGLRenderTarget } from "three"
import { SimulationView } from "./views"
import { WorkQueue } from "./work"

// TODO: use a worker to copy and convert frames
// TODO: ensure that frames are not modieifed or disposed while copying
// TOOD: Implement resizing
export class Converter {
  canvas: OffscreenCanvas
  context: OffscreenCanvasRenderingContext2D
  work: WorkQueue
  buffer = new ImageData(1024, 1024)
  view: SimulationView

  constructor(work: WorkQueue, view: SimulationView) {
    this.canvas = new OffscreenCanvas(0, 0)
    this.context = this.canvas.getContext("2d")!
    this.work = work
    this.view = view
  }

  convert = (width?: number, height?: number) =>
    this.work.push(renderer => {
      const target = this.view.feedback.currentFrame
      this.canvas.width = width ?? target.width
      this.canvas.height = height ?? target.height
      this.copyTargetToCanvas(renderer, target)
      return this.canvas.convertToBlob()
    })

  /** Assumes target is the same size as the canvas  */
  copyTargetToCanvas(renderer: WebGLRenderer, target: WebGLRenderTarget) {
    let x = 0,
      y = 0,
      bw = this.buffer.width,
      bh = this.buffer.height,
      tw = target.width,
      th = target.height
    while (y < th) {
      x = 0
      while (x < tw) {
        const width = Math.min(tw - x, bw),
          height = Math.min(th - y, bh),
          size = 4 * width * height,
          transfer = new Uint8ClampedArray(this.buffer.data.buffer, 0, size),
          data = new ImageData(transfer, width, height)

        renderer.readRenderTargetPixels(target, x, y, width, height, transfer)
        this.context.putImageData(data, x, y, 0, 0, width, height)
        x += bw
      }
      y += bh
    }
  }
}
