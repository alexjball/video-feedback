import { useEffect } from "react"
import { useSelector } from "react-redux"
import * as three from "../three"
import { useInteractions } from "./interactions"
import { State } from "./model"
import { useRenderer } from "./renderer"

export function Studio(props: three.WrapperProps) {
  const renderer = useRenderer()
  const interactions = useInteractions()

  useEffect(() => console.log("render changed"), [renderer])
  const quaternion = useSelector((state: State) => state.spacemap.quaternion)
  // console.log(quaternion)
  return <three.Three {...props} {...interactions} renderer={renderer} />
}
