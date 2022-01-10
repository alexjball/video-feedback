import { useEffect, useMemo } from "react"
import styled from "styled-components"
import { Providers } from "../providers"
import { SimulationPanel, useService as useSimService } from "../simulation"
import { StatsPanel } from "../stats"
import { ControlsPanel } from "../controls"
import { EditMenuPanel, ViewMenuPanel } from "../menu"
import { LegendPanel } from "../legend"
import { IoPanel, useService as useIoService } from "../io"
import { bootstrap } from "../ui"
import { useAppDispatch, useAppSelector } from "../hooks"
import { Mode, setMode } from "./model"

const Layout = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: 3rem 1fr 3rem;
  /* Panels can set to all */
  pointer-events: none;
`

const Io = styled(IoPanel)`
  grid-column: 2;
  grid-row: 1 / span 3;
  z-index: 10;
`

const [EditMenu, ViewMenu] = [EditMenuPanel, ViewMenuPanel].map(
  C => styled(C)`
    grid-column: 1 / span 3;
    grid-row: 1;
    z-index: 10;
  `
)

const Controls = styled(ControlsPanel)`
  grid-column: 3;
  grid-row: 2 / span 2;
  z-index: 10;
`

const InfoPanel = styled.div`
    grid-row: 2;
    grid-column: 1;
    z-index: 10;
  `,
  Info = () => (
    <InfoPanel>
      <StatsPanel />
      <LegendPanel />
    </InfoPanel>
  )

const Simulation = styled(SimulationPanel)`
  grid-column: 1 / span 3;
  grid-row: 1 / span 3;
  z-index: 0;
  pointer-events: all;
`

const LoadingPanel = styled.div`
    grid-column: 1 / span 3;
    grid-row: 1 / span 3;
    z-index: 100;
    pointer-events: all;

    display: flex;
    justify-content: center;
    align-items: center;
  `,
  Loading = () => {
    return (
      <LoadingPanel>
        <bootstrap.Spinner style={{ margin: "auto" }} animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </bootstrap.Spinner>
      </LoadingPanel>
    )
  }

const StudioContainer: React.FC<{ loaded: boolean }> = ({ loaded, children }) => (
  <Layout>{loaded ? children : <Loading />}</Layout>
)

export { Simulation, Info, Controls, EditMenu, ViewMenu, Io, Layout, Loading, StudioContainer }

export function useStudio(mode: Mode) {
  const dispatch = useAppDispatch(),
    io = useIoService(),
    simulation = useSimService(),
    currentMode = useAppSelector(s => s.studio.mode)

  useEffect(() => void dispatch(setMode(mode)), [dispatch, mode])
  return useMemo(
    () => ({ io, simulation, modeLoaded: currentMode === mode }),
    [currentMode, io, mode, simulation]
  )
}
