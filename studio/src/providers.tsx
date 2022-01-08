import { Provider } from "react-redux"
import { Provider as Cloud } from "./cloud"
import { Provider as Simulation } from "./simulation"
import { Provider as Stats } from "./stats"
import { store } from "./store"
import { ServiceProvider } from "./utils"

const services = [Cloud, Stats, Simulation]

export const Providers: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <Provider store={store}>
    <ServiceProvider providers={services}>{children}</ServiceProvider>
  </Provider>
)
