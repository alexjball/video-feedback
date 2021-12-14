import { Provider } from "react-redux"
import { Provider as Stats } from "./stats"
import { store } from "./store"
import { Provider as SimulationProvider } from "./simulation"
import React from "react"

export const Providers: React.FC = ({ children }) => (
  <Provider store={store}>
    <Stats>
      <SimulationProvider>{children}</SimulationProvider>
    </Stats>
  </Provider>
)
