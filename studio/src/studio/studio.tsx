import { RefObject, useEffect, useMemo } from "react"
import styled from "styled-components"
import { ControlsPanel } from "../controls"
import { useAppDispatch, useAppSelector } from "../hooks"
import { IoPanel, useService as useIoService } from "../io"
import { LegendPanel } from "../legend"
import { EditMenuPanel, ViewMenuPanel } from "../menu"
import { SimulationPanel, useService as useSimService } from "../simulation"
import { StatsPanel } from "../stats"
import { bootstrap } from "../ui"
import { Mode, setMode } from "./model"
import { useBinding } from "./service"

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

const StudioContainer = ({
  loaded,
  containerRef,
  children
}: {
  loaded?: boolean
  containerRef?: any
  children?: any
}) => <Layout ref={containerRef}>{loaded ? children : <Loading />}</Layout>

export { Simulation, Info, Controls, EditMenu, ViewMenu, Io, Layout, Loading, StudioContainer }

export function useStudio(mode: Mode, ref: RefObject<HTMLDivElement>) {
  const dispatch = useAppDispatch(),
    io = useIoService(),
    simulation = useSimService(),
    currentMode = useAppSelector(s => s.studio.mode)

  useBinding(useMemo(() => ({ requestFullscreen: () => ref.current?.requestFullscreen() }), [ref]))
  useEffect(() => void dispatch(setMode(mode)), [dispatch, mode])
  return useMemo(
    () => ({ io, simulation, modeLoaded: currentMode === mode }),
    [currentMode, io, mode, simulation]
  )
}
