import React, { useMemo, useRef } from "react"
import { WebGLRenderer } from "three"
import { useAppStore } from "../hooks"
import { useStats } from "../stats"
import * as three from "../three"
import { createService } from "../utils"
import { Converter } from "./converter"
import { setViewer } from "./model"
import { SimulationView } from "./views"
import { WorkQueue } from "./work"

const ssr = typeof window === "undefined"

interface SimulationService {
  /** Generates a PNG blob of the current feedback frame. */
  convert(width?: number, height?: number): Promise<Blob>
}

const { Provider, useBinding, useService } = createService<SimulationService>()
export { Provider, useService }

export const Renderer: React.FC<three.BaseProps> = props => {
  const { renderer } = useInstance()
  return <three.Three {...renderer} {...props} />
}

function useInstance() {
  const { stats } = useStats(),
    store = useAppStore(),
    conversionRef = useRef<HTMLCanvasElement>(),
    instance: { renderer: three.Renderer; service: SimulationService } = useMemo(() => {
      const view = new SimulationView(),
        work = new WorkQueue()

      return {
        conversionRef,
        renderer: {
          onRender(renderer: WebGLRenderer) {
            stats?.begin()
            view.draw(store.getState().simulation, renderer)
            work.run(renderer)
            stats?.end()
          },
          onResize(width: number, height: number) {
            store.dispatch(setViewer({ width, height }))
          },
          onDispose() {
            work.dispose()
            view.dispose()
          }
        },
        service: {
          convert: ssr ? ((() => {}) as any) : new Converter(work, view).convert
        }
      }
    }, [stats, store])

  useBinding(instance.service)
  return instance
}
