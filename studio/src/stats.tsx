import { createSlice } from "@reduxjs/toolkit"
import { createContext, HTMLProps, useCallback, useContext, useMemo, useState } from "react"
import Lib from "stats.js"
import { useAppSelector } from "./hooks"
import { createScope } from "./utils"

const ssr = typeof window === "undefined"

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

export const { Provider, useContext: useStats } = createScope<Stats>(() => {
  const [stats, setStats] = useState<StatsJs | undefined>(undefined)
  const init = useCallback((container: HTMLDivElement | null) => {
    if (ssr || container === null) return
    const stats = new StatsJs()
    container.appendChild(stats.dom)
    setStats(stats)
  }, [])
  return useMemo(() => ({ stats, init }), [init, stats])
})

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
