import dynamic from "next/dynamic"
import { BaseProps } from "../canvas"
import { useInteractions } from "./interactions"

export { reducer } from "./model"
export * as model from "./model"
export { Provider, useService } from "./service"
export type { SimulationService } from "./service"
export function SimulationPanel(props: BaseProps) {
  const interactions = useInteractions()
  return <Renderer {...props} {...interactions} />
}
export * from "./json"

const Renderer = dynamic(() => import("./renderer"), {
  ssr: false
})
