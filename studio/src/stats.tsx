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
    </div>
  ) : null
}
