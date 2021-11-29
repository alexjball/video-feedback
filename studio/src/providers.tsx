import { Provider } from "react-redux"
import { Provider as Stats } from "./stats"
import { store } from "./store"

export const Providers: React.FC = ({ children }) => (
  <Provider store={store}>
    <Stats>{children}</Stats>
  </Provider>
)
