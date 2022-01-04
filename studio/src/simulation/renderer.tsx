import { nanoid } from "nanoid"
import React, { useEffect } from "react"
import { BaseProps, Canvas } from "../canvas"
import { useAppStore } from "../hooks"
import { StatsJs, useStats } from "../stats"
import { settablePromise, SettablePromise, useSingleton } from "../utils"
import { deflate, inflate } from "./json"
import { setViewer, State, updatePortal } from "./model"
import { PlaybackAction, PlaybackState, SimulationService, useBinding } from "./service"
import type { Request, Response } from "./renderer.worker"

export default function Renderer(props: BaseProps) {
  return <Canvas {...useInstance()} {...props} />
}

function useInstance() {
  const stats = useStats(),
    store = useAppStore(),
    instance = useSingleton(
      class {
        client = new Client(stats?.stats)
        started = false

        props = {
          // Force the canvas to remount whenever instance changes, so the
          // client is only initialized once.
          key: nanoid(),
          ref: (canvas: HTMLCanvasElement | null) => {
            if (canvas) {
              this.client.initialize(
                canvas.transferControlToOffscreen(),
                store.getState().simulation
              )
            } else {
              this.client.terminate()
            }
          },
          onResize: (width: number, height: number) => {
            if (!this.started) {
              store.dispatch(
                updatePortal({
                  width: window.screen.width,
                  height: window.screen.height
                })
              )
              this.client.setPlayback("start")
              this.started = true
            }
            store.dispatch(setViewer({ width, height }))
          }
        }

        service: SimulationService = {
          convert: this.client.convert,
          setState: this.client.setState,
          setPlayback: this.client.setPlayback,
          getPlayback: () => this.client.playback,
          clearFrames: this.client.clearFrames
        }

        updateState = () => this.client.setState(store.getState().simulation)
      },
      [store, stats]
    )

  useEffect(() => store.subscribe(instance.updateState), [instance, store])
  usePauseOnBlur(instance.service)
  useBinding(instance.service)
  return instance.props
}

function usePauseOnBlur(service: SimulationService) {
  useEffect(() => {
    let playOnFocus = false
    const onBlur = () => {
        if (service.getPlayback() === "playing") {
          playOnFocus = true
          service.setPlayback("stop")
        }
      },
      onFocus = () => {
        if (playOnFocus) {
          service.setPlayback("start")
          playOnFocus = false
        }
      }
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
    }
  }, [service])
}

/** Worker client */
class Client {
  work = new Map<string, SettablePromise<any>>()
  playback: PlaybackState = "stopped"
  private _worker?: Worker
  stats?: StatsJs
  get worker(): Worker {
    if (!this._worker) {
      this._worker = this.createWorker()
    }
    return this._worker
  }

  private createWorker() {
    const worker = new Worker(new URL("./renderer.worker.ts", import.meta.url))
    worker.onmessage = this.onmessage
    return worker
  }

  constructor(stats?: StatsJs) {
    this.stats = stats
  }

  onmessage = ({ data: message }: MessageEvent<Response>) => {
    switch (message.type) {
      case "ack":
        const existing = this.work.get(message.id)
        if (existing) {
          existing.resolve(message.result)
        }
        this.work.delete(message.id)
        break
      case "renderStart":
        this.stats?.begin()
        break
      case "renderEnd":
        this.stats?.end()
        break
      case "playbackState":
        this.playback = message.state
    }
  }

  promise<T>(payload: Request, transfer?: any): Promise<T> {
    const id = nanoid(),
      promise = settablePromise<T>()
    this.work.set(id, promise)
    this.post(payload, transfer, id)
    return promise
  }

  post(payload: Request, transfer?: any, id: string = nanoid()) {
    this.worker.postMessage({ id, ...payload }, transfer)
  }

  terminate() {
    this.work.forEach(v => v.reject(Error("Worker  terminated")))
    this.work.clear()
    this.worker.terminate()
  }

  convert = (height?: number, width?: number) =>
    this.promise<{ state: State; blob: Blob }>({
      type: "exportCurrentFrame",
      height,
      width
    }).then(({ state, blob }) => ({ state: inflate(state), blob }))

  initialize = (canvas: OffscreenCanvas, initialState: State) =>
    this.post(
      {
        type: "initialize",
        canvas,
        state: deflate(initialState)
      },
      [canvas]
    )

  setState = (state: State) =>
    this.post({
      type: "setState",
      state: deflate(state)
    })

  setPlayback = (action: PlaybackAction) =>
    this.post({
      type: "setPlayback",
      action
    })

  clearFrames = (color: boolean, depth: boolean) =>
    this.post({
      type: "clearFrames",
      color,
      depth
    })
}
