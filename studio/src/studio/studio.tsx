import { useEffect, useMemo, useState } from "react"
import styled from "styled-components"
import { ControlsPanel } from "../controls"
import { useAppDispatch, useAppSelector } from "../hooks"
import { IoPanel, useService as useIoService } from "../io"
import { LegendPanel } from "../legend"
import { EditMenuPanel, ViewMenuPanel } from "../menu"
import { PaintPanel } from "../paint"
import { useService as useSimService } from "../simulation"
import { PaintRenderer } from "../simulation/paint-renderer"
import { StatsPanel } from "../stats"
import { bootstrap, common } from "../ui"
import * as model from "./model"

const { Modal } = bootstrap
const { Button } = common
const storage = typeof localStorage !== "undefined" ? localStorage : undefined

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
      <PaintPanel className="m-4" />
    </InfoPanel>
  )

const Simulation = styled(PaintRenderer)`
  width: 100vw;
  height: 100vh;
  position: absolute;
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

const offscreenCanvasUrl =
    "https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#browser_compatibility",
  Disclaimer: React.FC<{ studio: StudioHook }> = ({
    studio: { supportedBrowser, acknowledgeEpilepsyWarning, acknowledgedEpilepsyWarning }
  }) => {
    return supportedBrowser === false ? (
      <StudioModal show title="Unsupported Browser">
        This page relies on the <a href={offscreenCanvasUrl}>OffscreenCanvas</a> web API. Please use
        a Chromium-based browser like Chrome or Edge to view this page.
      </StudioModal>
    ) : acknowledgedEpilepsyWarning === false ? (
      <StudioModal
        title="Warning: Epilepsy Trigger"
        show={!acknowledgedEpilepsyWarning}
        acknowledge={acknowledgeEpilepsyWarning}>
        This page can produce bright strobing colors.
      </StudioModal>
    ) : null
  },
  StudioModal: React.FC<{ title: string; show: boolean; acknowledge?: any }> = ({
    show,
    title,
    acknowledge,
    children
  }) => {
    return (
      <Modal show={show} centered backdrop="static" backdropClassName="opacity-0" keyboard={false}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        {acknowledge && (
          <Modal.Footer>
            <Button onClick={acknowledge}>Okay, continue</Button>
          </Modal.Footer>
        )}
      </Modal>
    )
  }
const Studio: React.FC<{ studio: StudioHook }> = ({ studio, children }) => {
  return (
    <Layout>
      {studio.initialized && studio.loaded ? children : <Loading />}
      <Disclaimer studio={studio} />
    </Layout>
  )
}

export { Simulation, Info, Controls, EditMenu, ViewMenu, Io, Layout, Loading, Studio, Disclaimer }

type StudioHook = ReturnType<typeof useStudio>

export function useStudio(mode: model.Mode) {
  const dispatch = useAppDispatch(),
    io = useIoService(),
    simulation = useSimService(),
    state = useAppSelector(s => s.studio),
    [loaded, setLoaded] = useState(false)

  useEffect(() => void dispatch(model.setMode(mode)), [dispatch, mode])
  useEffect(() => {
    dispatch(model.setAcknowledgedEpilepsyWarning(storage?.getItem("simulationConsent") === "true"))
    dispatch(model.setSupportedBrowser(typeof OffscreenCanvas !== "undefined"))
  }, [dispatch])

  return useMemo(
    () => ({
      io,
      simulation,
      initialized:
        state.mode === mode && state.supportedBrowser && state.acknowledgedEpilepsyWarning,
      supportedBrowser: state.supportedBrowser,
      acknowledgedEpilepsyWarning: state.acknowledgedEpilepsyWarning,
      acknowledgeEpilepsyWarning: () => {
        storage?.setItem("simulationConsent", "true")
        dispatch(model.setAcknowledgedEpilepsyWarning(true))
      },
      loaded,
      setLoaded
    }),
    [dispatch, io, loaded, mode, simulation, state]
  )
}
