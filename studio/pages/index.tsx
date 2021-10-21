import { Studio, Three } from "../components"
import styles from "./index.module.css"

export default function Page() {
  return (
    <div className={styles.layoutContainer}>
      <Studio className={styles.three} />
    </div>
  )
}
