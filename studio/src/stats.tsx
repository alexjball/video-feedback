import { createSlice } from "@reduxjs/toolkit"
import { createContext, useContext, useLayoutEffect, useMemo, useRef } from "react"
import StatsJs from "stats.js"
import { useAppSelector } from "./hooks"

const ssr = typeof window === "undefined"
const StatsContext = createContext<StatsJs | null>(null)

/** Initialize the stats.js library, returning null if the library is
 * unavailable */
function useInitializeStatsLib() {
  const container = useRef<HTMLDivElement>(null)
  const stats = useRef<StatsJs | null>(null)
  if (!ssr) {
    if (!stats.current) stats.current = new StatsJs()
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useLayoutEffect(() => void container.current!.appendChild(stats.current!.dom), [])
  }
  return { container, stats: stats.current }
}

export function useStatsLib() {
  const stats = useContext(StatsContext)
  return useMemo(
    () => ({
      begin: () => stats?.begin(),
      end: () => stats?.end()
    }),
    [stats]
  )
}

export type StatsLib = ReturnType<typeof useStatsLib>

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

export const Stats: React.FC = ({ children }) => {
  const { container, stats } = useInitializeStatsLib()
  const show = useAppSelector(state => state.stats.show)
  return (
    <StatsContext.Provider value={stats}>
      <div ref={container} style={show ? undefined : { display: "none" }} />
      {children}
    </StatsContext.Provider>
  )
}
