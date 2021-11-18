import { Provider } from "react-redux"
import { Studio } from "../src"
import { Stats } from "../src/stats"
import { store } from "../src/store"
import styles from "./index.module.css"

export default function Page() {
  return (
    <Provider store={store}>
      <Stats>
        <div className={styles.layoutContainer}>
          <Studio className={styles.three} />
        </div>
      </Stats>
    </Provider>
  )
}
