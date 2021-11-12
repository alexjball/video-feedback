import styles from "./index.module.css"
import { Demo } from "../src"

export default function Home() {
  return (
    <div className={styles.layoutContainer}>
      Hello!
      <Demo className={styles.three} />
    </div>
  )
}
