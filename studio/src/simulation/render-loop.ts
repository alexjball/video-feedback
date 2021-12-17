import { isDefined } from "../utils"

export default class RenderLoop {
  animationRequest?: number
  startOnUnpause = false
  renderFrame: () => void

  constructor(renderFrame: () => void) {
    this.renderFrame = renderFrame
  }

  start() {
    this.stop()
    this.loop()
  }

  isAnimating() {
    return isDefined(this.animationRequest)
  }

  stop() {
    if (isDefined(this.animationRequest)) {
      cancelAnimationFrame(this.animationRequest)
    }
    this.animationRequest = undefined
    this.startOnUnpause = false
  }

  pause() {
    const startOnUnpause = this.isAnimating()
    this.stop()
    this.startOnUnpause = startOnUnpause
  }

  unpause() {
    if (this.startOnUnpause && !this.isAnimating()) this.start()
  }

  private loop() {
    this.animationRequest = requestAnimationFrame(() => {
      this.renderFrame()
      this.loop()
    })
  }
}
