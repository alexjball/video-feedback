import { createSlice } from "@reduxjs/toolkit"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import Lib from "stats.js"
import styled from "styled-components"
import {
  ArrowHelper,
  Box3,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineBasicMaterialParameters,
  LineLoop,
  Object3D,
  PlaneGeometry,
  Scene,
  Vector3
} from "three"
import Binder from "./binder"
import { contain, unitOrthoCamera } from "./camera"
import { useAppSelector } from "./hooks"
import { copyCoords, State as SimState } from "./simulation/model"
import { AppStore } from "./store"
import * as three from "./three"

const ssr = typeof window === "undefined"

class RGBA extends Color {
  private a
  constructor(r: number, g: number, b: number, a: number) {
    super(r, g, b)
    this.a = a
  }

  override getStyle() {
    return (
      "rgb(" +
      ((this.r * 255) | 0) +
      "," +
      ((this.g * 255) | 0) +
      "," +
      ((this.b * 255) | 0) +
      "," +
      this.a +
      ")"
    )
  }
}

export class StatsJs extends Lib {
  constructor() {
    super()
    this.dom.style.cssText = ""
    this.dom.style.cursor = "pointer"
    this.dom.style.pointerEvents = "all"
    this.dom.style.opacity = "0.9"
    this.dom.style.width = "fit-content"
  }
}

export interface Stats {
  stats?: StatsJs
  init: (container: HTMLDivElement) => void
}

const Context = createContext<Stats>(undefined!)
function useInstance(): Stats {
  const [stats, setStats] = useState<StatsJs | undefined>(undefined)
  const init = useCallback((container: HTMLDivElement | null) => {
    if (ssr || container === null) return
    const stats = new StatsJs()
    container.appendChild(stats.dom)
    setStats(stats)
  }, [])
  return useMemo(() => ({ stats, init }), [init, stats])
}

export const useStats = () => useContext(Context)
export const Provider: React.FC = ({ children }) => (
  <Context.Provider value={useInstance()}>{children}</Context.Provider>
)

interface State {
  show: boolean
}

const initialState: State = { show: true }

const slice = createSlice({
  name: "stats",
  initialState,
  reducers: {
    toggleShow(state) {
      state.show = !state.show
    }
  }
})

export const {
  reducer,
  actions: { toggleShow }
} = slice

const Panel = styled.div`
  position: fixed;
  z-index: 1000;
  pointer-events: none;
`

export const StatsPanel: React.FC = () => {
  const { init } = useStats()
  const show = useAppSelector(state => state.stats.show)
  return show ? (
    <>
      <Panel>
        <div ref={init} />
      </Panel>
      <Panel>
        <DebugView style={{ width: "100vw", height: "100vh" }} />
      </Panel>
    </>
  ) : null
}

// TODO: Render the fixed point.
// TODO: Allow navigating the debug view and controlling the simulation by manipulating the debug view
// TODO: Move to navigator.tsx
class Renderer extends three.SvgRenderer {
  private scene

  constructor(store: AppStore) {
    super(store)
    this.scene = this.createScene()
    this.renderer.setClearColor(new Color("white"), 1)
  }

  private binder = new Binder<SimState>()
    .add(
      s => s.spacemap.coords,
      v => copyCoords(v, this.scene.spacemap)
    )
    .add(
      s => s.portal.coords,
      v => {
        copyCoords(v, this.scene.feedbackDestination)
        copyCoords(v, this.scene.feedbackSource)
      }
    )

  override setSize(width: number, height: number) {
    super.setSize(width, height)
  }

  private fitScene() {
    const bb = new Box3()
    bb.setFromObject(this.scene.scene)
    const { width, height } = this.size
    contain({ camera: this.scene.camera, aspect: width / height, bb, maxPadding: 1 })
  }

  private createScene() {
    const camera = unitOrthoCamera()
    const scene = new Scene()

    scene.background = new RGBA(0, 0, 0, 0)
    const feedbackDestination = this.createBorder({ color: "#ff0000" })
    const feedbackSource = this.createBorder({ color: "#00ff00" })
    const spacemap = new Object3D()

    spacemap.add(feedbackSource)
    scene.add(feedbackDestination, spacemap)

    return {
      scene,
      camera,
      feedbackDestination,
      spacemap,
      feedbackSource
    }
  }

  private createBorder(parameters?: Partial<LineBasicMaterialParameters>) {
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      "position",
      // Matches PlaneGeometry(1, 1)
      new Float32BufferAttribute(
        [-0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0],
        3
      )
    )
    return new Line(geometry, new LineBasicMaterial({ linewidth: 5, ...parameters }))
  }

  override renderFrame = () => {
    if (!this.binder.apply(this.state.simulation)) return
    this.fitScene()
    const { scene, camera } = this.scene
    this.renderScene(scene, camera)
  }
}

export const DebugView = three.asComponent(Renderer)
