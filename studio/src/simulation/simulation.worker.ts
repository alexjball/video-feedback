import { WebGLRenderer } from "three"
import { Binder, isDefined, singleton } from "../utils"
import { Converter } from "./converter"
import { inflate, JsonState } from "./json"
import { State } from "./model"
import { PlaybackAction } from "./service"
import { Simulation } from "./views"

interface Id {
  id: string
}

/** Request bodies for this worker */
export type Request =
  | {
      type: "initialize"
      canvas: OffscreenCanvas
      state: JsonState
    }
  | {
      type: "setState"
      state: JsonState
    }
  | {
      type: "setPlayback"
      action: PlaybackAction
    }
  | {
      type: "exportCurrentFrame"
      width?: number
      height?: number
    }

/** Message type for requests to this worker */
export type Message = Request & Id

/** Message type for responses from this worker */
export type Response =
  | ({ type: "ack"; result?: any } & Id)
  | { type: "renderStart"; now: number }
  | { type: "renderEnd"; now: number }

/** Message handler for this worker */
onmessage = ({ data: message }: MessageEvent<Message>) => {
  switch (message.type) {
    case "initialize":
      simulation.initialize(message.canvas)
      simulation.setState(message.state)
      ack(message)
      break
    case "setState":
      simulation.setState(message.state)
      ack(message)
      break
    case "exportCurrentFrame":
      simulation.convert(message.width, message.height).then(blob => ack(message, blob))
      break
    case "setPlayback":
      simulation.setPlayback(message.action)
      ack(message)
      break
  }
}

const renderStart = () => postMessage({ type: "renderStart", now: performance.now() }),
  renderEnd = () => postMessage({ type: "renderEnd", now: performance.now() }),
  ack = ({ id }: Message, result?: any) =>
    postMessage({
      type: "ack",
      id,
      result
    })

const simulation = singleton(
  class {
    view = new Simulation()
    renderer?: WebGLRenderer
    currentState?: State
    animationRequest?: number
    converter = new Converter(this.view)

    binder = new Binder<State>().add(
      s => s.viewport,
      v => this.renderer?.setSize(v.width, v.height, false)
    )

    renderFrame() {
      if (isDefined(this.currentState) && isDefined(this.renderer)) {
        renderStart()
        this.binder.apply(this.currentState)
        this.view.draw(this.currentState, this.renderer)
        renderEnd()
      }
    }

    initialize(canvas: OffscreenCanvas) {
      this.renderer = new WebGLRenderer({ antialias: false, canvas })
    }

    setState(state: JsonState) {
      this.currentState = inflate(state)
    }

    setPlayback(action: PlaybackAction) {
      switch (action) {
        case "pause":
          this.stopAnimating()
          return
        case "play":
          this.startAnimating()
          return
        case "step":
          this.stopAnimating()
          this.renderFrame()
          return
      }
    }

    convert(width?: number, height?: number) {
      if (!isDefined(this.renderer)) {
        throw Error("Not initialized")
      }
      const shouldPause = this.isAnimating()
      if (shouldPause) this.stopAnimating()
      const result = this.converter.convert(this.renderer, height, width)
      result.finally(() => shouldPause && this.startAnimating())
      return result
    }

    dispose() {
      this.view.dispose()
      this.renderer?.dispose()
    }

    private startAnimating() {
      this.stopAnimating()
      this.loop()
    }

    private loop() {
      this.animationRequest = requestAnimationFrame(() => {
        this.renderFrame()
        this.loop()
      })
    }

    private isAnimating() {
      return isDefined(this.animationRequest)
    }

    private stopAnimating() {
      if (isDefined(this.animationRequest)) {
        cancelAnimationFrame(this.animationRequest)
        this.animationRequest = undefined
      }
    }
  }
)
