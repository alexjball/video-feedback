import dynamic from "next/dynamic"
import { BaseProps } from "../three"
import { useInteractions } from "./interactions"

export { reducer } from "./model"
export { Provider, useService } from "./service"
export function SimulationPanel(props: BaseProps) {
  const interactions = useInteractions()
  return <Renderer {...props} {...interactions} />
}

const Renderer = dynamic(() => import("./simulation"), {
  ssr: false
})
