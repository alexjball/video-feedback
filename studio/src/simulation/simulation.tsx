import { nanoid } from "nanoid"
import React, { useEffect, useMemo } from "react"
import { BaseProps, Canvas } from "../canvas"
import { useAppStore } from "../hooks"
import { StatsJs, useStats } from "../stats"
import { settablePromise, SettablePromise, useSingleton } from "../utils"
import { deflate } from "./json"
import { setViewer, State } from "./model"
import { PlaybackAction, useBinding } from "./service"
import type { Request, Response } from "./simulation.worker"

export default function Renderer(props: BaseProps) {
  return <Canvas {...useInstance()} {...props} />
}

function useInstance() {
  const { stats } = useStats(),
    store = useAppStore(),
    instance = useSingleton(
      class {
        client = new Client(stats)

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
              this.client.setPlayback("play")
            } else {
              this.client.terminate()
            }
          },
          onResize(width: number, height: number) {
            store.dispatch(setViewer({ width, height }))
          }
        }

        service = {
          convert: this.client.convert,
          setState: this.client.setState,
          setPlayback: this.client.setPlayback
        }

        updateState = () => this.client.setState(store.getState().simulation)
      },
      [store, stats]
    )

  useEffect(() => store.subscribe(instance.updateState))
  useBinding(instance.service)
  return instance.props
}

/** Worker client */
class Client {
  work = new Map<string, SettablePromise<any>>()
  private _worker?: Worker
  stats?: StatsJs
  get worker(): Worker {
    if (!this._worker) {
      this._worker = this.createWorker()
    }
    return this._worker
  }

  private createWorker() {
    const worker = new Worker(new URL("./simulation.worker.ts", import.meta.url))
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
    this.promise<Blob>({
      type: "exportCurrentFrame",
      height,
      width
    })

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
}
