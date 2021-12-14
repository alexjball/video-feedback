import { BaseProps } from "../three"
import { useInteractions } from "./interactions"
import { Renderer } from "./simulation"

export { reducer } from "./model"
export * as model from "./model"
export { Provider, useService } from "./simulation"
export function SimulationPanel(props: BaseProps) {
  const interactions = useInteractions()
  return <Renderer {...props} {...interactions} />
}
