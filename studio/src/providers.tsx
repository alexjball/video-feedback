import { Provider } from "react-redux"
import { Provider as Cloud } from "./cloud"
import { Provider as Simulation } from "./simulation"
import { Provider as Stats } from "./stats"
import { Provider as Io } from "./io"
import { Provider as Studio } from "./studio/service"
import { store } from "./store"
import { ServiceProvider } from "./utils"

const services = [Io, Cloud, Studio, Stats, Simulation]

export const Providers: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <Provider store={store}>
    <ServiceProvider providers={services}>{children}</ServiceProvider>
  </Provider>
)
