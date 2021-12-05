import { createSlice } from "@reduxjs/toolkit"
import { createContext, HTMLProps, useCallback, useContext, useMemo, useState } from "react"
import Lib from "stats.js"
import {
  Box3,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  GridHelper,
  Group,
  Line,
  LineBasicMaterial,
  LineBasicMaterialParameters,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  SpriteMaterial,
  TextureLoader,
  Vector3
} from "three"
import Binder from "./binder"
import { contain, unitOrthoCamera } from "./camera"
import { useAppSelector } from "./hooks"
import { copyCoords, State as SimState } from "./simulation/model"
import type { AppStore } from "./store"
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

export const StatsPanel: React.FC<HTMLProps<HTMLDivElement>> = props => {
  const { init } = useStats()
  const show = useAppSelector(state => state.stats.show)
  return show ? (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "500px" }} {...props}>
      <div ref={init} />
      <DebugView style={{ flex: "auto", opacity: 0.8 }} />
    </div>
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
    .add(
      s => s.spacemap.mirrorX,
      mirrorX => {
        this.scene.feedbackDestination.updateMirroring({ mirrorX })
        this.scene.feedbackSource.updateMirroring({ mirrorX })
      }
    )
    .add(
      s => s.spacemap.mirrorY,
      mirrorY => {
        this.scene.feedbackDestination.updateMirroring({ mirrorY })
        this.scene.feedbackSource.updateMirroring({ mirrorY })
      }
    )

  override setSize(width: number, height: number) {
    super.setSize(width, height)
  }

  private fitScene() {
    this.scene.scene.updateMatrixWorld()
    const bb = new Box3()
    bb.expandByObject(this.scene.feedbackDestination)
    bb.expandByObject(this.scene.feedbackSource)
    const { width, height } = this.size
    contain({ camera: this.scene.camera, aspect: width / height, bb, maxPadding: 1 })
  }

  private createScene() {
    const camera = unitOrthoCamera()
    const scene = new Scene()

    scene.background = new RGBA(0, 0, 0, 0)
    const feedbackDestination = new Destination("#ff0000")
    const feedbackSource = new Source("#00ff00")
    const spacemap = new Object3D()

    scene.add(this.createGrid())
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

  private createGrid() {
    const size = 20
    const divisions = 50

    const gridHelper = new GridHelper(size, divisions)
    gridHelper.rotateX((90 * Math.PI) / 180)
    return gridHelper
  }

  override renderFrame = () => {
    if (!this.binder.apply(this.state.simulation)) return
    this.fitScene()
    const { scene, camera } = this.scene
    this.renderScene(scene, camera)
  }
}

export const DebugView = three.asComponent(Renderer)

class Region extends Object3D {
  mirrorX = false
  mirrorY = false

  constructor(color: string) {
    super()

    const border = new Line(
      new BufferGeometry().setAttribute(
        "position",
        // Matches PlaneGeometry(1, 1)
        new Float32BufferAttribute(
          [-0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0],
          3
        )
      ),
      new LineBasicMaterial({ linewidth: 5, color })
    )
    this.add(border)
  }

  updateMirroring({ mirrorX, mirrorY }: { mirrorX?: boolean; mirrorY?: boolean }) {
    if (mirrorX !== undefined) this.mirrorX = mirrorX
    if (mirrorY !== undefined) this.mirrorY = mirrorY
  }
}

type Quadrant = "nw" | "ne" | "se" | "sw"

class Source extends Region {
  quadrants

  constructor(color: string) {
    super(color)

    this.quadrants = (["ne", "se", "nw", "sw"] as const).map(q => this.createQuadrant(q, color))
  }

  private createQuadrant(q: Quadrant, color: string) {
    // const textureLoader = new TextureLoader()
    // const map = textureLoader.load("sprite1.png")

    const fill = new Mesh(
      new PlaneGeometry(0.5, 0.5),
      new MeshBasicMaterial({ opacity: 0.4, color })
      // new SpriteMaterial({
      //   map,
      //   opacity: 0.4,
      //   color
      // })
    )
    fill.position.x = q === "ne" || q === "se" ? 0.25 : -0.25
    fill.position.y = q === "ne" || q === "nw" ? 0.25 : -0.25

    return {
      name: q,
      fill,
      sourceIfMirrorX: q === "nw" || q === "sw",
      sourceIfMirrorY: q === "se" || q === "sw"
    }
  }

  override updateMirroring(mirroring: any) {
    super.updateMirroring(mirroring)

    this.quadrants.forEach(q => {
      const includeY = !this.mirrorY || q.sourceIfMirrorY
      const includeX = !this.mirrorX || q.sourceIfMirrorX
      if (includeX && includeY) {
        this.add(q.fill)
      } else {
        this.remove(q.fill)
      }
    })
  }
}

class Destination extends Region {
  private xSymmetry
  private ySymmetry

  constructor(color: string) {
    super(color)

    this.xSymmetry = new Line(
      new BufferGeometry().setFromPoints([new Vector3(0, -0.5, 0), new Vector3(0, 0.5, 0)]),
      new LineBasicMaterial({ linewidth: 5, color: "#0000ff" })
    )
    this.ySymmetry = new Line(
      new BufferGeometry().setFromPoints([new Vector3(-0.5, 0, 0), new Vector3(0.5, 0, 0)]),
      new LineBasicMaterial({ linewidth: 5, color: "#0000ff" })
    )
  }

  override updateMirroring(mirroring: any) {
    super.updateMirroring(mirroring)

    if (this.mirrorX) {
      this.add(this.xSymmetry)
    } else {
      this.remove(this.xSymmetry)
    }

    if (this.mirrorY) {
      this.add(this.ySymmetry)
    } else {
      this.remove(this.ySymmetry)
    }
  }
}
