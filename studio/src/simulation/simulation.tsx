import * as three from "../three"
import { useInteractions } from "./interactions"
import { useRenderer } from "./renderer"

export function Simulation(props: three.WrapperProps) {
  const renderer = useRenderer()
  const interactions = useInteractions()

  return <three.Three {...props} {...interactions} renderer={renderer} />
}
