import styles from "./index.module.css"
import { Providers } from "./providers"
import { Simulation } from "./simulation"
import { StatsPanel } from "./stats"

export function Studio() {
  return (
    <Providers>
      <StatsPanel />
      <div className={styles.layoutContainer}>
        <Simulation className={styles.three} />
      </div>
    </Providers>
  )
}
