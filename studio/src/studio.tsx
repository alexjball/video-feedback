import styled from "styled-components"
import { Providers } from "./providers"
import { SimulationPanel } from "./simulation"
import { StatsPanel } from "./stats"
import { ControlsPanel } from "./controls"
import { NavigationPanel } from "./navigation"
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
  z-index: 5;
`

const Navigation = styled(NavigationPanel)`
  grid-column: 2;
  grid-row: 1;
  z-index: 5;
`

const Controls = styled(ControlsPanel)`
  grid-column: 3;
  grid-row: 1 / span 3;
  z-index: 10;
`

const Stats = styled(StatsPanel)`
  grid-column: 1;
  grid-row: 1;
  z-index: 20;
`

const Legend = styled(LegendPanel)`
  grid-row: 2;
  grid-column: 1;
  z-index: 10;
`

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
        <Navigation />
        <Stats />
        <Legend />
        <Simulation /> {/* stats={stats}  */}
      </Layout>
    </Providers>
  )
}
