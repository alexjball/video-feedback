import styled from "styled-components"
import { Providers } from "./providers"
import { SimulationPanel } from "./simulation"
import { StatsPanel } from "./stats"
import { ControlsPanel } from "./controls"
import { MenuPanel } from "./menu"
import { LegendPanel } from "./legend"
import { IoPanel } from "./io"

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

const Menu = styled(MenuPanel)`
  grid-column: 1 / span 3;
  grid-row: 1;
  z-index: 10;
`

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

export function Studio() {
  return (
    <Providers>
      <Layout>
        <Controls />
        <Io />
        <Menu />
        <Info />
        <Simulation />
      </Layout>
    </Providers>
  )
}
