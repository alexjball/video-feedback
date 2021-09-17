import { Three } from "../components"
import styles from "./index.module.css"

export default function Home() {
  return (
    <div className={styles.layoutContainer}>
      Hello!
      <Three className={styles.three} />
    </div>
  )
}
