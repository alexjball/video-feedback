import { createModel, Studio } from "../src"
import styles from "./index.module.css"
import { Provider } from "react-redux"

export default function Page() {
  return (
    <Provider store={createModel()}>
      <div className={styles.layoutContainer}>
        <Studio className={styles.three} />
      </div>
    </Provider>
  )
}
