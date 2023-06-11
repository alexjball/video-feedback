import { Provider } from "react-redux"
import { Provider as Cloud } from "./cloud"
import { Provider as Io } from "./io"
import { Provider as Paint } from "./paint-2d"
import { Provider as Simulation } from "./simulation"
import { Provider as Stats } from "./stats"
import { store } from "./store"
import { Provider as Studio } from "./studio/service"
import { ServiceProvider } from "./utils"

const services = [Io, Cloud, Studio, Stats, Paint, Simulation]

export const Providers: React.FC<{ children: React.ReactElement }> = ({ children }) => (
  <Provider store={store}>
    <ServiceProvider providers={services}>{children}</ServiceProvider>
  </Provider>
)
