import styled from "styled-components"
import { Providers } from "./providers"
import { Simulation } from "./simulation"
import { StatsPanel } from "./stats"

const Layout = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 2fr 2fr;
  grid-template-rows: 3rem 1fr 3rem;
  /* Panels can set to all */
  pointer-events: none;
`

const Panel = styled.div`
  /* outline: 2px solid black;
  border-radius: 5px; */
  z-index: 10;
`

const Io = styled(Panel)`
  grid-column: 2;
  grid-row: 3;
`

const Nav = styled(Panel)`
  grid-column: 2;
  grid-row: 1;
`

const Controls = styled(Panel)`
  grid-column: 3;
  grid-row: 1 / span 3;
`

const Stats = styled(StatsPanel)`
  grid-column: 1;
  grid-row: 1 / span 3;
  z-index: 10;
`

const StyledSimulation = styled(Simulation)`
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
        <Nav />
        <Stats />
        <StyledSimulation />
      </Layout>
    </Providers>
  )
}
