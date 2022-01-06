import { WebGLRenderer } from "three"
import { Binder, isDefined, singleton } from "../utils"
import { inflate, deflate } from "./json"
import { State, JsonState } from "./model"
import RenderLoop from "./render-loop"
import Resizer from "./resizer"
import { PlaybackAction, PlaybackState } from "./service"
import Settler from "./settler"
import Simulation from "./simulation"

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
  | {
      type: "clearFrames"
      color?: boolean
      depth?: boolean
    }

/** Message type for requests to this worker */
export type Message = Request & Id

/** Message type for responses from this worker */
export type Response =
  | ({ type: "ack"; result?: any } & Id)
  | { type: "renderStart"; frame: number; now: number }
  | { type: "renderEnd"; frame: number; settled: boolean; now: number }
  | { type: "playbackState"; state: PlaybackState }

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
      simulation
        .convert(message.width, message.height)
        .then(blob => ack(message, { state: deflate(simulation.currentState!), blob }))
      break
    case "setPlayback":
      simulation.setPlayback(message.action)
      ack(message)
      break
    case "clearFrames":
      simulation.simulation.feedback.markDirty({
        color: message.color ?? false,
        depth: message.depth ?? false
      })
      ack(message)
  }
}

const renderStart = (frame: number) =>
    postMessage({ type: "renderStart", frame, now: performance.now() }),
  renderEnd = (frame: number, settled: boolean) =>
    postMessage({ type: "renderEnd", frame, settled, now: performance.now() }),
  playbackState = (state: PlaybackState) => postMessage({ type: "playbackState", state: state }),
  ack = ({ id }: Message, result?: any) =>
    postMessage({
      type: "ack",
      id,
      result
    })

/** Controller logic to bind the graphics simulation to the rest of the application */
const simulation = singleton(
  class {
    frameIndex = 0
    simulation = new Simulation()
    resizer = new Resizer()
    settler = new Settler()
    renderLoop: RenderLoop
    renderer?: WebGLRenderer
    currentState?: State

    constructor() {
      this.renderLoop = new RenderLoop(this.renderFrame)
    }

    binder = new Binder<State>().add(
      s => s.viewport,
      v => this.renderer?.setSize(v.width, v.height, false)
    )

    initialize(canvas: OffscreenCanvas) {
      this.renderer = new WebGLRenderer({ antialias: false, canvas })
    }

    setState(state: JsonState) {
      this.currentState = inflate(state)
    }

    setPlayback(action: PlaybackAction) {
      const loop = this.renderLoop
      switch (action) {
        case "stop":
          if (loop.isAnimating()) {
            loop.stop()
            playbackState("stopped")
          }
          return
        case "start":
          if (!loop.isAnimating()) {
            loop.start()
            playbackState("playing")
          }
          return
        case "step":
          if (loop.isAnimating()) {
            loop.stop()
            playbackState("stopped")
          }
          this.renderFrame()
          return
      }
    }

    convert(width?: number, height?: number): Promise<Blob> {
      if (!isDefined(this.renderer)) {
        throw Error("Not initialized")
      }
      this.renderLoop.pause()
      const result = this.resizer.convert(
        this.renderer,
        this.simulation.feedback.currentFrames.color,
        height,
        width
      )
      result.finally(() => this.renderLoop.unpause())
      return result
    }

    dispose() {
      this.simulation.dispose()
      this.renderer?.dispose()
    }

    private renderFrame = () => {
      if (isDefined(this.currentState) && isDefined(this.renderer)) {
        this.frameIndex++
        let settled = false
        renderStart(this.frameIndex)
        {
          // Bind state
          this.binder.apply(this.currentState)
          this.simulation.render(this.currentState, this.renderer)
          // Compute settled status from depth frame
          settled = this.settler.compute(
            this.renderer,
            this.simulation.feedback.currentFrames.depth
          )
        }
        renderEnd(this.frameIndex, settled)
      }
    }
  }
)
